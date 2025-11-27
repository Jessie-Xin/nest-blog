import { ArgsType, Field } from '@nestjs/graphql';

/**
 * 审批请求 ID 参数
 */
@ArgsType()
export class ApprovalRequestIdArgs {
  @Field(() => String, { description: '审批请求 ID' })
  requestId: string;
}

/**
 * 文章 ID 参数（用于查询文章的审批请求）
 */
@ArgsType()
export class PostIdArgs {
  @Field(() => String, { description: '文章 ID' })
  postId: string;
}
