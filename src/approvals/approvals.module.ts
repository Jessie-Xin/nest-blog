import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalsResolver } from './approvals.resolver';

/**
 * 审批工作流模块
 * 提供文章审批、状态流转和权限控制功能
 */
@Module({
  providers: [ApprovalsService, ApprovalsResolver],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
