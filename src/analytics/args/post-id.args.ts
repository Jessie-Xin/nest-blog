import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

/**
 * 文章 ID 参数
 */
@ArgsType()
export class PostIdArgs {
  @Field(() => String, { description: '文章 ID' })
  @IsNotEmpty()
  postId: string;
}
