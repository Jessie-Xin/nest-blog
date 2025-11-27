import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { PostStatus } from '../../posts/models/post-status.enum';
import { User } from '../../users/models/user.model';
import { Post } from '../../posts/models/post.model';
import { GraphQLJSON } from 'graphql-scalars';
import { Prisma } from '@prisma/client';

/**
 * 文章版本历史 GraphQL 模型
 * 记录文章的历史快照
 */
@ObjectType()
export class PostRevision extends BaseModel {
  // ===== 版本信息 =====

  /**
   * 版本号
   */
  @Field(() => Int, { description: '版本号' })
  version: number;

  /**
   * 变更说明
   */
  @Field(() => String, { nullable: true, description: '变更说明' })
  changeMessage?: string | null;

  // ===== 快照内容 =====

  /**
   * 标题快照
   */
  @Field(() => String, { description: '标题快照' })
  title: string;

  /**
   * Slug 快照
   */
  @Field(() => String, { description: 'Slug 快照' })
  slug: string;

  /**
   * 摘要快照
   */
  @Field(() => String, { nullable: true, description: '摘要快照' })
  excerpt?: string | null;

  /**
   * 内容快照
   */
  @Field(() => String, { nullable: true, description: '内容快照' })
  content?: string | null;

  /**
   * 状态快照
   */
  @Field(() => PostStatus, { description: '状态快照' })
  status: PostStatus;

  /**
   * 发布状态快照
   */
  @Field(() => Boolean, { description: '发布状态快照' })
  published: boolean;

  /**
   * 发布时间快照
   */
  @Field(() => Date, { nullable: true, description: '发布时间快照' })
  publishedAt?: Date | null;

  /**
   * 分类 ID 快照
   */
  @Field(() => String, { nullable: true, description: '分类 ID 快照' })
  categoryId?: string | null;

  /**
   * 标签 ID 数组快照
   */
  @Field(() => [String], { description: '标签 ID 数组快照' })
  tagIds: string[];

  /**
   * SEO 元数据快照
   */
  @Field(() => GraphQLJSON, { nullable: true, description: 'SEO 元数据快照' })
  metaData?: Prisma.JsonValue | null;

  // ===== 关系字段 ID =====

  /**
   * 所属文章 ID（内部字段）
   */
  postId: string;

  /**
   * 创建者 ID（内部字段）
   */
  createdById: string;

  // ===== 关系字段 =====

  /**
   * 所属文章
   */
  @Field(() => Post, { description: '所属文章' })
  post?: Post;

  /**
   * 版本创建者
   */
  @Field(() => User, { description: '版本创建者' })
  createdBy?: User;
}
