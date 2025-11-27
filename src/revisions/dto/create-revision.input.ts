import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

/**
 * 创建版本快照输入
 */
@InputType()
export class CreateRevisionInput {
  /**
   * 文章 ID
   */
  @Field(() => String, { description: '文章 ID' })
  @IsNotEmpty({ message: '文章 ID 不能为空' })
  postId: string;

  /**
   * 变更说明
   */
  @Field(() => String, { nullable: true, description: '变更说明' })
  @IsOptional()
  @MaxLength(500, { message: '变更说明不能超过 500 个字符' })
  changeMessage?: string;
}
