import { Field, InputType } from '@nestjs/graphql';

/**
 * 审批操作输入（批准或拒绝）
 */
@InputType()
export class ProcessApprovalInput {
  @Field(() => String, { description: '审批请求 ID' })
  requestId: string;

  @Field(() => String, { nullable: true, description: '审批意见/评论' })
  comment?: string;
}
