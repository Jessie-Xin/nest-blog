import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * 管理员权限守卫
 * 验证当前用户是否拥有管理员角色
 *
 * 使用方式：
 * @UseGuards(GqlAuthGuard, AdminGuard)
 *
 * 注意：必须与 GqlAuthGuard 一起使用，确保用户已登录
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;

    // 如果没有用户（不应该发生，因为应该先过 GqlAuthGuard）
    if (!user) {
      return false;
    }

    // 检查用户是否有角色信息
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    // 检查用户是否拥有 "admin" 角色
    return user.roles.some(
      (userRole: any) => userRole.role?.code === 'admin' && userRole.role?.isActive === true,
    );
  }
}
