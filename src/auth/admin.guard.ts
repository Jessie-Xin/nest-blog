import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '@prisma/client';

/**
 * 管理员权限守卫
 * 验证当前用户是否为管理员角色
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

    // 验证用户角色是否为管理员
    return user.role === Role.ADMIN;
  }
}
