import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import {
  PermissionsResolver,
  SystemRoleResolver,
} from './permissions.resolver';

/**
 * 权限模块
 * 提供 RBAC（基于角色的访问控制）功能
 */
@Module({
  providers: [PermissionsService, PermissionsResolver, SystemRoleResolver],
  exports: [PermissionsService],
})
export class PermissionsModule {}
