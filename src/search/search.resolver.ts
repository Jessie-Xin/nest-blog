import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchResult } from './models/search-result.model';
import {
  SearchSuggestion,
  PopularSearch,
} from './models/search-suggestion.model';
import { SearchInput } from './dto/search.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';

/**
 * 搜索解析器
 * 提供全文搜索和搜索建议相关的 GraphQL 接口
 */
@Resolver()
export class SearchResolver {
  constructor(private searchService: SearchService) {}

  // ===== 查询 =====

  /**
   * 搜索文章
   * 支持未登录用户搜索，登录用户会记录搜索历史
   */
  @Query(() => SearchResult, { description: '搜索文章' })
  async search(@Args('data') data: SearchInput, @UserEntity() user?: User) {
    return this.searchService.searchPosts(data, user?.id);
  }

  /**
   * 获取搜索建议
   * 基于历史搜索提供自动完成建议
   */
  @Query(() => [SearchSuggestion], { description: '获取搜索建议' })
  async searchSuggestions(
    @Args('prefix', { type: () => String }) prefix: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
  ) {
    return this.searchService.getSearchSuggestions(prefix, limit);
  }

  /**
   * 获取热门搜索
   * 返回最近一段时间的热门搜索关键词
   */
  @Query(() => [PopularSearch], { description: '获取热门搜索' })
  async popularSearches(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
    @Args('days', { type: () => Int, nullable: true, defaultValue: 7 })
    days?: number,
  ) {
    return this.searchService.getPopularSearches(limit, days);
  }

  /**
   * 获取用户搜索历史
   * 需要登录
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => [SearchResult], {
    description: '获取用户搜索历史',
    deprecationReason: '返回类型待优化',
  })
  async mySearchHistory(
    @UserEntity() user: User,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ) {
    const history = await this.searchService.getUserSearchHistory(
      user.id,
      limit,
    );

    // 将搜索历史转换为 SearchResult 格式
    return history.map((h) => ({
      posts: [],
      totalCount: h.resultsCount,
      query: h.query,
      took: 0,
    }));
  }

  // ===== 变更 =====

  /**
   * 清空用户搜索历史
   * 需要登录
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { description: '清空用户搜索历史' })
  async clearMySearchHistory(@UserEntity() user: User) {
    await this.searchService.clearUserSearchHistory(user.id);
    return true;
  }
}
