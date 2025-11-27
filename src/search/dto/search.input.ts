import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

/**
 * 搜索输入
 */
@InputType()
export class SearchInput {
  /**
   * 搜索关键词
   */
  @Field(() => String, { description: '搜索关键词' })
  @IsNotEmpty({ message: '搜索关键词不能为空' })
  @MinLength(1, { message: '搜索关键词至少需要 1 个字符' })
  @MaxLength(200, { message: '搜索关键词不能超过 200 个字符' })
  query: string;

  /**
   * 限制返回结果数量
   */
  @Field(() => Int, {
    nullable: true,
    defaultValue: 10,
    description: '限制返回结果数量',
  })
  @IsOptional()
  @Min(1, { message: '至少返回 1 条结果' })
  @Max(100, { message: '最多返回 100 条结果' })
  limit?: number;

  /**
   * 跳过的结果数量（用于分页）
   */
  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: '跳过的结果数量',
  })
  @IsOptional()
  @Min(0, { message: 'skip 不能小于 0' })
  skip?: number;

  /**
   * 搜索来源
   */
  @Field(() => String, { nullable: true, description: '搜索来源' })
  @IsOptional()
  @MaxLength(50, { message: '搜索来源不能超过 50 个字符' })
  source?: string;
}
