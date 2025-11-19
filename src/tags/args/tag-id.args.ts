import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

/**
 * 标签 ID 参数
 */
@ArgsType()
export class TagIdArgs {
  @Field(() => String, { description: '标签 ID' })
  @IsNotEmpty({ message: '标签 ID 不能为空' })
  id: string;
}
