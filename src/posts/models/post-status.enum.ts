import { registerEnumType } from '@nestjs/graphql';

/**
 * 文章状态枚举
 */
export enum PostStatus {
  DRAFT = 'DRAFT', // 草稿
  PUBLISHED = 'PUBLISHED', // 已发布
  SCHEDULED = 'SCHEDULED', // 定时发布
  ARCHIVED = 'ARCHIVED', // 已归档
  TRASH = 'TRASH', // 回收站
}

// 注册 GraphQL 枚举
registerEnumType(PostStatus, {
  name: 'PostStatus',
  description: '文章状态',
  valuesMap: {
    DRAFT: {
      description: '草稿',
    },
    PUBLISHED: {
      description: '已发布',
    },
    SCHEDULED: {
      description: '定时发布',
    },
    ARCHIVED: {
      description: '已归档',
    },
    TRASH: {
      description: '回收站',
    },
  },
});
