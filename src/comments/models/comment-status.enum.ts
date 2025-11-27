import { registerEnumType } from '@nestjs/graphql';

/**
 * 评论状态枚举
 * 用于评论审核和管理
 */
export enum CommentStatus {
  /** 待审核 - 默认状态 */
  PENDING = 'PENDING',

  /** 已批准 - 通过审核，公开显示 */
  APPROVED = 'APPROVED',

  /** 已拒绝 - 未通过审核 */
  REJECTED = 'REJECTED',

  /** 垃圾评论 - 标记为垃圾 */
  SPAM = 'SPAM',
}

// 注册 GraphQL 枚举类型
registerEnumType(CommentStatus, {
  name: 'CommentStatus',
  description: '评论状态',
  valuesMap: {
    PENDING: {
      description: '待审核',
    },
    APPROVED: {
      description: '已批准',
    },
    REJECTED: {
      description: '已拒绝',
    },
    SPAM: {
      description: '垃圾评论',
    },
  },
});
