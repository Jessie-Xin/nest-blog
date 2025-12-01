import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

/**
 * 权限服务
 * 处理权限和角色相关的业务逻辑
 */
@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有权限列表
   */
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * 获取所有角色列表
   */
  async getAllRoles() {
    return this.prisma.systemRole.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * 根据 ID 获取单个角色
   */
  async getRoleById(id: string) {
    return this.prisma.systemRole.findUnique({
      where: { id },
    });
  }

  /**
   * 根据 code 获取单个角色
   */
  async getRoleByCode(code: string) {
    return this.prisma.systemRole.findUnique({
      where: { code },
    });
  }

  /**
   * 获取角色的所有权限
   */
  async getRolePermissions(roleId: string) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * 为用户分配角色
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: Date,
  ) {
    // 检查是否已存在
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId },
    });

    if (existing) {
      // 更新过期时间
      return this.prisma.userRole.update({
        where: { id: existing.id },
        data: { expiresAt, assignedById: assignedBy },
      });
    }

    // 创建新的角色分配
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedById: assignedBy,
        expiresAt,
      },
    });
  }

  /**
   * 移除用户的角色
   */
  async removeRoleFromUser(userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: { userId, roleId },
    });

    if (!userRole) {
      throw new Error('用户未被分配此角色');
    }

    return this.prisma.userRole.delete({
      where: { id: userRole.id },
    });
  }

  /**
   * 检查用户是否拥有特定权限
   */
  async userHasPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        role: { isActive: true },
      },
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
    });

    return userRoles.some((ur) =>
      ur.role?.permissions.some((rp) => rp.permission?.code === permissionCode),
    );
  }

  /**
   * 检查用户是否拥有特定角色
   */
  async userHasRole(userId: string, roleCode: string): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        role: {
          code: roleCode,
          isActive: true,
        },
      },
    });

    return count > 0;
  }
}
