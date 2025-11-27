import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

/**
 * 评论 ID 参数
 */
@ArgsType()
export class CommentIdArgs {
  @Field(() => String, { description: '评论 ID' })
  @IsNotEmpty({ message: '评论 ID 不能为空' })
  commentId: string;
}
