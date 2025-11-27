import { InputType, Field } from '@nestjs/graphql';
import { MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * 更新评论输入
 * 普通用户只能更新自己评论的内容
 */
@InputType()
export class UpdateCommentInput {
  /**
   * 评论内容
   */
  @Field(() => String, { description: '评论内容' })
  @MinLength(1, { message: '评论内容至少需要 1 个字符' })
  @MaxLength(2000, { message: '评论内容不能超过 2000 个字符' })
  @IsOptional()
  content?: string;
}
