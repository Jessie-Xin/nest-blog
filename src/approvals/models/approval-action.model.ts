import { Field, ObjectType } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { User } from '../../users/models/user.model';
import { ApprovalActionType } from './approval-action-type.enum';

/**
 * 审批操作记录 GraphQL 模型
 * 记录每次审批操作（批准、拒绝、评论）
 * 注意：request 字段通过 @ResolveField 在 resolver 中手动解析
 */
@ObjectType()
export class ApprovalAction extends BaseModel {
  @Field(() => String, { description: '关联的审批请求 ID' })
  requestId: string;

  // request 字段通过 @ResolveField 解析，避免循环依赖

  @Field(() => String, { description: '审批人 ID' })
  approverId: string;

  @Field(() => User, { description: '审批人（通常是管理员或编辑）' })
  approver?: User;

  @Field(() => ApprovalActionType, { description: '操作类型' })
  actionType: ApprovalActionType;

  @Field(() => String, { nullable: true, description: '审批意见/评论' })
  comment?: string | null;
}
