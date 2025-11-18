import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

/**
 * 分类 ID 参数
 * 用于需要单个分类 ID 的查询和变更
 */
@ArgsType()
export class CategoryIdArgs {
  /**
   * 分类 ID
   */
  @Field(() => String, { description: '分类 ID' })
  @IsNotEmpty({ message: '分类 ID 不能为空' })
  id: string;
}
