import { PrismaService } from 'nestjs-prisma';
import { Prisma, User } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { SignupInput } from './dto/signup.input';
import { Token } from './models/token.model';
import { SecurityConfig } from '../common/configs/config.interface';

/**
 * 认证服务
 * 处理用户注册、登录、令牌生成等认证相关功能
 */
@Injectable()
export class AuthService {
  constructor(
    // JWT 服务，用于生成和验证令牌
    private readonly jwtService: JwtService,
    // Prisma 服务，用于数据库操作
    private readonly prisma: PrismaService,
    // 密码服务，用于密码哈希和验证
    private readonly passwordService: PasswordService,
    // 配置服务，用于获取配置信息
    private readonly configService: ConfigService,
  ) {}

  /**
   * 创建用户
   * @param payload 注册输入数据
   * @returns 访问令牌和刷新令牌
   */
  async createUser(payload: SignupInput): Promise<Token> {
    // 对密码进行哈希处理
    const hashedPassword = await this.passwordService.hashPassword(
      payload.password,
    );

    try {
      // 在数据库中创建新用户（默认分配 "user" 角色）
      const user = await this.prisma.user.create({
        data: {
          ...payload,
          password: hashedPassword,
        },
      });

      // 查找 "user" 角色
      const userRole = await this.prisma.systemRole.findUnique({
        where: { code: 'user' },
      });

      if (userRole) {
        // 为新用户分配默认角色
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: userRole.id,
          },
        });
      }

      // 生成访问令牌和刷新令牌
      return this.generateTokens({
        userId: user.id,
      });
    } catch (e) {
      // 检查是否为邮箱已存在错误
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Email ${payload.email} already used.`);
      }
      throw new Error(e);
    }
  }

  /**
   * 用户登录
   * @param email 邮箱
   * @param password 密码
   * @returns 访问令牌和刷新令牌
   */
  async login(email: string, password: string): Promise<Token> {
    // 根据邮箱查找用户
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException(`No user found for email: ${email}`);
    }

    // 验证密码是否正确
    const passwordValid = await this.passwordService.validatePassword(
      password,
      user.password,
    );

    if (!passwordValid) {
      throw new BadRequestException('Invalid password');
    }

    // 生成访问令牌和刷新令牌
    return this.generateTokens({
      userId: user.id,
    });
  }

  /**
   * 根据用户ID验证用户
   * @param userId 用户ID
   * @returns 用户对象（包含角色信息）
   */
  validateUser(userId: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * 根据令牌获取用户
   * @param token JWT 令牌
   * @returns 用户对象
   */
  getUserFromToken(token: string): Promise<User> {
    // 解码令牌并获取用户ID
    const id = this.jwtService.decode(token)['userId'];
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * 生成访问令牌和刷新令牌
   * @param payload 令牌载荷
   * @returns 包含访问令牌和刷新令牌的对象
   */
  generateTokens(payload: { userId: string }): Token {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * 生成访问令牌
   * @param payload 令牌载荷
   * @returns 访问令牌
   */
  private generateAccessToken(payload: { userId: string }): string {
    return this.jwtService.sign(payload);
  }

  /**
   * 生成刷新令牌
   * @param payload 令牌载荷
   * @returns 刷新令牌
   */
  private generateRefreshToken(payload: { userId: string }): string {
    const securityConfig = this.configService.get<SecurityConfig>('security');
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: securityConfig.refreshIn,
    });
  }

  /**
   * 刷新令牌
   * @param token 刷新令牌
   * @returns 新的访问令牌和刷新令牌
   */
  refreshToken(token: string) {
    try {
      // 验证刷新令牌并获取用户ID
      const { userId } = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // 生成新的访问令牌和刷新令牌
      return this.generateTokens({
        userId,
      });
    } catch (e) {
      // 刷新令牌无效时抛出未授权异常
      throw new UnauthorizedException();
    }
  }
}
