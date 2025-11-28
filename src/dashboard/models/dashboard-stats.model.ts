import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * 总体统计数据
 */
@ObjectType()
export class OverallStats {
  @Field(() => Int, { description: '文章总数' })
  totalPosts: number;

  @Field(() => Int, { description: '已发布文章数' })
  publishedPosts: number;

  @Field(() => Int, { description: '草稿数' })
  draftPosts: number;

  @Field(() => Int, { description: '用户总数' })
  totalUsers: number;

  @Field(() => Int, { description: '分类总数' })
  totalCategories: number;

  @Field(() => Int, { description: '标签总数' })
  totalTags: number;

  @Field(() => Int, { description: '评论总数' })
  totalComments: number;

  @Field(() => Int, { description: '待审批文章数' })
  pendingApprovals: number;
}

/**
 * 内容统计 - 按状态分组
 */
@ObjectType()
export class ContentStats {
  @Field(() => Int, { description: '草稿数量' })
  drafts: number;

  @Field(() => Int, { description: '已发布数量' })
  published: number;

  @Field(() => Int, { description: '已归档数量' })
  archived: number;

  @Field(() => Int, { description: '回收站数量' })
  trash: number;

  @Field(() => Int, { description: '定时发布数量' })
  scheduled: number;
}

/**
 * 热门文章项
 */
@ObjectType()
export class PopularPostItem {
  @Field(() => String, { description: '文章 ID' })
  id: string;

  @Field(() => String, { description: '文章标题' })
  title: string;

  @Field(() => Int, { description: '浏览次数' })
  viewCount: number;

  @Field(() => Int, { description: '评论数' })
  commentCount: number;

  @Field(() => Date, { description: '发布时间', nullable: true })
  publishedAt?: Date;
}

/**
 * 最近活跃用户项
 */
@ObjectType()
export class RecentActiveUser {
  @Field(() => String, { description: '用户 ID' })
  id: string;

  @Field(() => String, { description: '用户邮箱' })
  email: string;

  @Field(() => String, { description: '用户名', nullable: true })
  name?: string;

  @Field(() => Int, { description: '文章数' })
  postCount: number;

  @Field(() => Date, { description: '最后活动时间' })
  lastActiveAt: Date;
}

/**
 * 审批统计
 */
@ObjectType()
export class ApprovalStats {
  @Field(() => Int, { description: '待审批数量' })
  pending: number;

  @Field(() => Int, { description: '已批准数量' })
  approved: number;

  @Field(() => Int, { description: '已拒绝数量' })
  rejected: number;

  @Field(() => Int, { description: '总审批请求' })
  total: number;

  @Field(() => Number, { description: '通过率（0-100）' })
  approvalRate: number;
}

/**
 * 仪表板综合统计数据
 */
@ObjectType()
export class DashboardStats {
  @Field(() => OverallStats, { description: '总体统计' })
  overall: OverallStats;

  @Field(() => ContentStats, { description: '内容统计' })
  content: ContentStats;

  @Field(() => [PopularPostItem], { description: '热门文章（Top 10）' })
  popularPosts: PopularPostItem[];

  @Field(() => [RecentActiveUser], { description: '最近活跃用户（Top 10）' })
  recentActiveUsers: RecentActiveUser[];

  @Field(() => ApprovalStats, { description: '审批统计' })
  approvals: ApprovalStats;
}
