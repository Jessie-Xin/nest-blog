import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * 创建评论输入
 */
@InputType()
export class CreateCommentInput {
  /**
   * 评论内容
   */
  @Field(() => String, { description: '评论内容' })
  @IsNotEmpty({ message: '评论内容不能为空' })
  @MinLength(1, { message: '评论内容至少需要 1 个字符' })
  @MaxLength(2000, { message: '评论内容不能超过 2000 个字符' })
  content: string;

  /**
   * 所属文章 ID
   */
  @Field(() => String, { description: '所属文章 ID' })
  @IsNotEmpty({ message: '文章 ID 不能为空' })
  postId: string;

  /**
   * 父评论 ID（嵌套回复时）
   */
  @Field(() => String, {
    nullable: true,
    description: '父评论 ID（回复评论时使用）',
  })
  parentId?: string;
}
