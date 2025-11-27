import { registerEnumType } from '@nestjs/graphql';

/**
 * 审批状态枚举
 * 对应 Prisma schema 中的 ApprovalStatus
 */
export enum ApprovalStatus {
  PENDING = 'PENDING', // 待审批
  APPROVED = 'APPROVED', // 已批准
  REJECTED = 'REJECTED', // 已拒绝
  CANCELLED = 'CANCELLED', // 已取消
}

registerEnumType(ApprovalStatus, {
  name: 'ApprovalStatus',
  description: '审批状态',
});
