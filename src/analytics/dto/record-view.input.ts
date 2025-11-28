import { Field, InputType } from '@nestjs/graphql';

/**
 * 记录浏览输入
 */
@InputType()
export class RecordViewInput {
  @Field(() => String, { description: '文章 ID' })
  postId: string;

  @Field(() => String, { nullable: true, description: 'IP 地址（可选）' })
  ipAddress?: string;

  @Field(() => String, { nullable: true, description: '浏览器信息（可选）' })
  userAgent?: string;
}
