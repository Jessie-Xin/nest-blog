import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { CommentStatus } from './comment-status.enum';
import { User } from '../../users/models/user.model';
import { Post } from '../../posts/models/post.model';

/**
 * 评论 GraphQL 模型
 * 支持嵌套回复和审核功能
 */
@ObjectType()
export class Comment extends BaseModel {
  // ===== 评论内容 =====

  /**
   * 评论正文
   */
  @Field(() => String, { description: '评论内容' })
  content: string;

  // ===== 审核状态 =====

  /**
   * 评论状态
   */
  @Field(() => CommentStatus, { description: '评论状态' })
  status: CommentStatus;

  // ===== 互动统计 =====

  /**
   * 点赞数
   */
  @Field(() => Int, { description: '点赞数' })
  likes: number;

  // ===== 关系字段 ID =====

  /**
   * 所属文章 ID（内部字段）
   */
  postId: string;

  /**
   * 评论作者 ID（内部字段）
   */
  authorId: string;

  /**
   * 父评论 ID（内部字段，用于嵌套回复）
   */
  parentId?: string | null;

  // ===== 关系字段 =====

  /**
   * 所属文章
   */
  @Field(() => Post, { description: '所属文章' })
  post?: Post;

  /**
   * 评论作者
   */
  @Field(() => User, { description: '评论作者' })
  author?: User;

  /**
   * 父评论（用于嵌套回复）
   */
  @Field(() => Comment, { nullable: true, description: '父评论（嵌套回复时）' })
  parent?: Comment | null;

  /**
   * 子评论列表（嵌套回复）
   */
  @Field(() => [Comment], { description: '子评论列表' })
  replies?: Comment[];
}
