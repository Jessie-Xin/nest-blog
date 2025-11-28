import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { PostStatus, ApprovalStatus } from '@prisma/client';
import {
  DashboardStats,
  OverallStats,
  ContentStats,
  PopularPostItem,
  RecentActiveUser,
  ApprovalStats,
} from './models/dashboard-stats.model';

/**
 * 仪表板统计服务
 * 提供系统整体数据统计和分析
 */
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取完整的仪表板统计数据
   * @returns 综合统计信息
   */
  async getDashboardStats(): Promise<DashboardStats> {
    // 并行查询所有统计数据以提高性能
    const [overall, content, popularPosts, recentActiveUsers, approvals] =
      await Promise.all([
        this.getOverallStats(),
        this.getContentStats(),
        this.getPopularPosts(10),
        this.getRecentActiveUsers(10),
        this.getApprovalStats(),
      ]);

    return {
      overall,
      content,
      popularPosts,
      recentActiveUsers,
      approvals,
    };
  }

  /**
   * 获取总体统计
   */
  async getOverallStats(): Promise<OverallStats> {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalUsers,
      totalCategories,
      totalTags,
      totalComments,
      pendingApprovals,
    ] = await Promise.all([
      // 文章总数
      this.prisma.post.count(),

      // 已发布文章数
      this.prisma.post.count({
        where: { status: PostStatus.PUBLISHED },
      }),

      // 草稿数
      this.prisma.post.count({
        where: { status: PostStatus.DRAFT },
      }),

      // 用户总数
      this.prisma.user.count(),

      // 分类总数
      this.prisma.category.count(),

      // 标签总数
      this.prisma.tag.count(),

      // 评论总数
      this.prisma.comment.count(),

      // 待审批数
      this.prisma.approvalRequest.count({
        where: { status: ApprovalStatus.PENDING },
      }),
    ]);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalUsers,
      totalCategories,
      totalTags,
      totalComments,
      pendingApprovals,
    };
  }

  /**
   * 获取内容统计（按状态分组）
   */
  async getContentStats(): Promise<ContentStats> {
    const [drafts, published, archived, trash, scheduled] = await Promise.all([
      this.prisma.post.count({ where: { status: PostStatus.DRAFT } }),
      this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      this.prisma.post.count({ where: { status: PostStatus.ARCHIVED } }),
      this.prisma.post.count({ where: { status: PostStatus.TRASH } }),
      this.prisma.post.count({ where: { status: PostStatus.SCHEDULED } }),
    ]);

    return {
      drafts,
      published,
      archived,
      trash,
      scheduled,
    };
  }

  /**
   * 获取热门文章（按浏览量排序）
   * @param limit 返回数���限制
   */
  async getPopularPosts(limit: number = 10): Promise<PopularPostItem[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        publishedAt: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      viewCount: post.viewCount,
      commentCount: post._count.comments,
      publishedAt: post.publishedAt,
    }));
  }

  /**
   * 获取最近活跃用户（按最后更新时间排序）
   * @param limit 返回数量限制
   */
  async getRecentActiveUsers(
    limit: number = 10,
  ): Promise<RecentActiveUser[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });

    return users.map((user) => {
      const name =
        user.firstname || user.lastname
          ? `${user.firstname || ''} ${user.lastname || ''}`.trim()
          : undefined;

      return {
        id: user.id,
        email: user.email,
        name,
        postCount: user._count.posts,
        lastActiveAt: user.updatedAt,
      };
    });
  }

  /**
   * 获取审批统计
   */
  async getApprovalStats(): Promise<ApprovalStats> {
    const [pending, approved, rejected, total] = await Promise.all([
      this.prisma.approvalRequest.count({
        where: { status: ApprovalStatus.PENDING },
      }),
      this.prisma.approvalRequest.count({
        where: { status: ApprovalStatus.APPROVED },
      }),
      this.prisma.approvalRequest.count({
        where: { status: ApprovalStatus.REJECTED },
      }),
      this.prisma.approvalRequest.count(),
    ]);

    // 计算通过率（已批准 / (已批准 + 已拒绝) * 100）
    const processedCount = approved + rejected;
    const approvalRate =
      processedCount > 0 ? (approved / processedCount) * 100 : 0;

    return {
      pending,
      approved,
      rejected,
      total,
      approvalRate: Math.round(approvalRate * 100) / 100, // 保留两位小数
    };
  }

  /**
   * 获取时间范围内的文章发布趋势
   * @param days 天数（默认最近30天）
   */
  async getPublishTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await this.prisma.post.groupBy({
      by: ['publishedAt'],
      where: {
        publishedAt: {
          gte: startDate,
        },
        status: PostStatus.PUBLISHED,
      },
      _count: {
        id: true,
      },
    });

    return posts.map((item) => ({
      date: item.publishedAt,
      count: item._count.id,
    }));
  }
}
