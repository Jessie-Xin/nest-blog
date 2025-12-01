import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';
import { Permission } from './models/permission.model';
import { SystemRole } from './models/system-role.model';
import { PermissionsService } from './permissions.service';

/**
 * 权限解析器
 * 处理权限和角色相关的 GraphQL 查询和变更
 */
@Resolver(() => Permission)
@UseGuards(GqlAuthGuard)
export class PermissionsResolver {
  constructor(
    private permissionsService: PermissionsService,
    private prisma: PrismaService,
  ) {}

  /**
   * 获取所有权限列表（需要管理员权限）
   */
  @Query(() => [Permission], {
    description: '获取所有权限列表（需要管理员权限）',
  })
  @UseGuards(AdminGuard)
  async permissions(): Promise<Permission[]> {
    return this.permissionsService.getAllPermissions();
  }

  /**
   * 获取所有角色列表
   */
  @Query(() => [SystemRole], { description: '获取所有角色列表' })
  async roles(): Promise<SystemRole[]> {
    return this.permissionsService.getAllRoles();
  }

  /**
   * 根据 ID 获取单个角色
   */
  @Query(() => SystemRole, {
    nullable: true,
    description: '根据 ID 获取单个角色',
  })
  async role(@Args('id') id: string): Promise<SystemRole | null> {
    return this.permissionsService.getRoleById(id);
  }

  /**
   * 为用户分配角色（需要管理员权限）
   */
  @Mutation(() => Boolean, { description: '为用户分配角色（需要管理员权限）' })
  @UseGuards(AdminGuard)
  async assignRole(
    @UserEntity() currentUser: User,
    @Args('userId') userId: string,
    @Args('roleId') roleId: string,
    @Args('expiresAt', { nullable: true }) expiresAt?: Date,
  ): Promise<boolean> {
    await this.permissionsService.assignRoleToUser(
      userId,
      roleId,
      currentUser.id,
      expiresAt,
    );
    return true;
  }

  /**
   * 移除用户的角色（需要管理员权限）
   */
  @Mutation(() => Boolean, { description: '移除用户的角色（需要管理员权限）' })
  @UseGuards(AdminGuard)
  async removeRole(
    @Args('userId') userId: string,
    @Args('roleId') roleId: string,
  ): Promise<boolean> {
    await this.permissionsService.removeRoleFromUser(userId, roleId);
    return true;
  }

  /**
   * 检查用户是否拥有特定权限
   */
  @Query(() => Boolean, { description: '检查用户是否拥有特定权限' })
  async checkPermission(
    @Args('userId') userId: string,
    @Args('permissionCode') permissionCode: string,
  ): Promise<boolean> {
    return this.permissionsService.userHasPermission(userId, permissionCode);
  }

  /**
   * 检查用户是否拥有特定角色
   */
  @Query(() => Boolean, { description: '检查用户是否拥有特定角色' })
  async checkRole(
    @Args('userId') userId: string,
    @Args('roleCode') roleCode: string,
  ): Promise<boolean> {
    return this.permissionsService.userHasRole(userId, roleCode);
  }
}

/**
 * 系统角色解析器
 * 处理 SystemRole 对象的字段解析
 */
@Resolver(() => SystemRole)
export class SystemRoleResolver {
  constructor(
    private permissionsService: PermissionsService,
    private prisma: PrismaService,
  ) {}

  /**
   * 解析角色的权限列表字段
   */
  @ResolveField('permissions', () => [Permission])
  async permissions(@Parent() role: SystemRole): Promise<Permission[]> {
    return this.permissionsService.getRolePermissions(role.id);
  }
}
