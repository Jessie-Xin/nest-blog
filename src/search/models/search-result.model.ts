import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Post } from '../../posts/models/post.model';

/**
 * 搜索结果模型
 * 封装搜索返回的文章列表和统计信息
 */
@ObjectType()
export class SearchResult {
  /**
   * 搜索到的文章列表
   */
  @Field(() => [Post], { description: '搜索结果列表' })
  posts: Post[];

  /**
   * 总结果数
   */
  @Field(() => Int, { description: '总结果数' })
  totalCount: number;

  /**
   * 搜索关键词
   */
  @Field(() => String, { description: '搜索关键词' })
  query: string;

  /**
   * 搜索耗时（毫秒）
   */
  @Field(() => Int, { nullable: true, description: '搜索耗时（毫秒）' })
  took?: number;
}
