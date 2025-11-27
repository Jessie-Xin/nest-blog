import { Field, InputType } from '@nestjs/graphql';

/**
 * 创建审批请求输入
 */
@InputType()
export class CreateApprovalRequestInput {
  @Field(() => String, { description: '需要审批的文章 ID' })
  postId: string;

  @Field(() => String, { nullable: true, description: '请求说明' })
  requestMessage?: string;
}
