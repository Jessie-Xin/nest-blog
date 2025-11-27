import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { SearchInput } from './dto/search.input';
import { PostStatus } from '@prisma/client';

/**
 * 搜索服务
 * 提供全文搜索、搜索建议、搜索历史等功能
 */
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * 搜索文章
   * 使用 PostgreSQL 的 ILIKE 进行全文搜索
   */
  async searchPosts(data: SearchInput, userId?: string) {
    const startTime = Date.now();
    const { query, limit = 10, skip = 0, source } = data;

    // 构建搜索条件
    const searchCondition = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { content: { contains: query, mode: 'insensitive' as const } },
        { excerpt: { contains: query, mode: 'insensitive' as const } },
      ],
      status: PostStatus.PUBLISHED, // 只搜索已发布的文章
    };

    // 并行执行搜索和计数
    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        where: searchCondition,
        take: limit,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          author: true,
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: searchCondition,
      }),
    ]);

    // 记录搜索历史
    await this.recordSearchHistory(query, totalCount, userId, source);

    const took = Date.now() - startTime;

    return {
      posts,
      totalCount,
      query,
      took,
    };
  }

  /**
   * 获取搜索建议
   * 基于用户历史搜索和热门搜索
   */
  async getSearchSuggestions(prefix: string, limit: number = 10) {
    // 使用原始 SQL 进行高效的分组和聚合
    const suggestions = await this.prisma.$queryRaw<
      Array<{ query: string; count: bigint }>
    >`
      SELECT query, COUNT(*) as count
      FROM "SearchHistory"
      WHERE query ILIKE ${`${prefix}%`}
      GROUP BY query
      ORDER BY count DESC, MAX("createdAt") DESC
      LIMIT ${limit}
    `;

    return suggestions.map((s) => ({
      query: s.query,
      count: Number(s.count),
    }));
  }

  /**
   * 获取热门搜索
   * 返回最近一段时间内搜索次数最多的关键词
   */
  async getPopularSearches(limit: number = 10, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const popularSearches = await this.prisma.$queryRaw<
      Array<{ query: string; count: bigint; lastSearchedAt: Date }>
    >`
      SELECT
        query,
        COUNT(*) as count,
        MAX("createdAt") as "lastSearchedAt"
      FROM "SearchHistory"
      WHERE "createdAt" >= ${since}
      GROUP BY query
      ORDER BY count DESC, "lastSearchedAt" DESC
      LIMIT ${limit}
    `;

    return popularSearches.map((s) => ({
      query: s.query,
      count: Number(s.count),
      lastSearchedAt: s.lastSearchedAt,
    }));
  }

  /**
   * 获取用户搜索历史
   */
  async getUserSearchHistory(userId: string, limit: number = 20) {
    return this.prisma.searchHistory.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      distinct: ['query'], // 去重
    });
  }

  /**
   * 清空用户搜索历史
   */
  async clearUserSearchHistory(userId: string) {
    return this.prisma.searchHistory.deleteMany({
      where: {
        userId,
      },
    });
  }

  /**
   * 记录搜索历史
   * 私有方法，用于内部记录
   */
  private async recordSearchHistory(
    query: string,
    resultsCount: number,
    userId?: string,
    source?: string,
  ) {
    try {
      await this.prisma.searchHistory.create({
        data: {
          query,
          resultsCount,
          userId,
          source,
        },
      });
    } catch (error) {
      // 搜索历史记录失败不应影响搜索功能
      console.error('Failed to record search history:', error);
    }
  }
}
