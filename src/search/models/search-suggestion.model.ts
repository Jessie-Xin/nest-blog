import { Field, ObjectType, Int } from '@nestjs/graphql';

/**
 * 搜索建议项
 */
@ObjectType()
export class SearchSuggestion {
  /**
   * 建议的搜索词
   */
  @Field(() => String, { description: '建议的搜索词' })
  query: string;

  /**
   * 搜索次数（热度）
   */
  @Field(() => Int, { description: '搜索次数' })
  count: number;
}

/**
 * 热门搜索统计
 */
@ObjectType()
export class PopularSearch {
  /**
   * 搜索关键词
   */
  @Field(() => String, { description: '搜索关键词' })
  query: string;

  /**
   * 搜索次数
   */
  @Field(() => Int, { description: '搜索次数' })
  count: number;

  /**
   * 最近搜索时间
   */
  @Field(() => Date, { description: '最近搜索时间' })
  lastSearchedAt: Date;
}
