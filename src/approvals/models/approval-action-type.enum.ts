import { registerEnumType } from '@nestjs/graphql';

/**
 * 审批操作类型枚举
 * 对应 Prisma schema 中的 ApprovalActionType
 */
export enum ApprovalActionType {
  APPROVE = 'APPROVE', // 批准
  REJECT = 'REJECT', // 拒绝
  COMMENT = 'COMMENT', // 评论（不改变状态）
}

registerEnumType(ApprovalActionType, {
  name: 'ApprovalActionType',
  description: '审批操作类型',
});
