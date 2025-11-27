import { Field, ObjectType } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { Post } from '../../posts/models/post.model';
import { User } from '../../users/models/user.model';
import { ApprovalStatus } from './approval-status.enum';

/**
 * 审批请求 GraphQL 模型
 * 用于管理文章的审批流程
 * 注意：actions 字段通过 @ResolveField 在 resolver 中手动解析
 */
@ObjectType()
export class ApprovalRequest extends BaseModel {
  @Field(() => String, { description: '关联的文章 ID' })
  postId: string;

  @Field(() => Post, { description: '关联的文章' })
  post?: Post;

  @Field(() => String, { description: '请求人 ID' })
  requesterId: string;

  @Field(() => User, { description: '请求人（通常是文章作者）' })
  requester?: User;

  @Field(() => ApprovalStatus, { description: '审批状态' })
  status: ApprovalStatus;

  @Field(() => String, { nullable: true, description: '请求说明' })
  requestMessage?: string | null;

  // actions 字段通过 @ResolveField 解析，避免循环依赖
}
