import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { RecordViewInput } from './dto/record-view.input';
import { PostViewStats } from './models/post-view-stats.model';

/**
 * 访问统计服务
 * 负责记录浏览行为和生成统计数据
 */
@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 记录文章浏览
   * @param data 浏览数据
   * @param userId 用户 ID（必需，后台系统需要登录）
   * @returns 创建的浏览记录
   */
  async recordView(data: RecordViewInput, userId: string) {
    // 验证文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${data.postId} 不存在`);
    }

    // 使用事务：创建浏览记录 + 更新文章浏览计数
    return this.prisma.$transaction(async (tx) => {
      // 1. 创建浏览记录
      const view = await tx.postView.create({
        data: {
          post: { connect: { id: data.postId } },
          user: { connect: { id: userId } },
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
        include: {
          post: true,
          user: true,
        },
      });

      // 2. 增加文章的浏览计数
      await tx.post.update({
        where: { id: data.postId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return view;
    });
  }

  /**
   * 获取文章的浏览统计
   * @param postId 文章 ID
   * @returns 统计信息
   */
  async getPostViewStats(postId: string): Promise<PostViewStats> {
    // 验证文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${postId} 不存在`);
    }

    // 计算时间范围
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 本周日
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 并行查询所有统计数据
    const [totalViews, todayViews, weekViews, monthViews, uniqueVisitors] =
      await Promise.all([
        // 总浏览次数
        this.prisma.postView.count({
          where: { postId },
        }),

        // 今日浏览次数
        this.prisma.postView.count({
          where: {
            postId,
            createdAt: { gte: startOfToday },
          },
        }),

        // 本周浏览次数
        this.prisma.postView.count({
          where: {
            postId,
            createdAt: { gte: startOfWeek },
          },
        }),

        // 本月浏览次数
        this.prisma.postView.count({
          where: {
            postId,
            createdAt: { gte: startOfMonth },
          },
        }),

        // 唯一访客数（根据 userId 和 ipAddress 去重）
        this.getUniqueVisitorsCount(postId),
      ]);

    return {
      postId,
      totalViews,
      todayViews,
      weekViews,
      monthViews,
      uniqueVisitors,
    };
  }

  /**
   * 获取文章的唯一访客数
   * 基于 userId（已登录）或 ipAddress（未登录）去重
   */
  private async getUniqueVisitorsCount(postId: string): Promise<number> {
    // 查询所有浏览记录
    const views = await this.prisma.postView.findMany({
      where: { postId },
      select: {
        userId: true,
        ipAddress: true,
      },
    });

    // 使用 Set 去重
    const uniqueIdentifiers = new Set<string>();

    views.forEach((view) => {
      // 优先使用 userId，如果没有则使用 ipAddress
      const identifier = view.userId || view.ipAddress || 'anonymous';
      uniqueIdentifiers.add(identifier);
    });

    return uniqueIdentifiers.size;
  }

  /**
   * 获取文章的浏览记录列表
   * @param postId 文章 ID
   * @param limit 返回数量限制
   * @returns 浏览记录数组
   */
  async getPostViews(postId: string, limit: number = 50) {
    // 验证文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${postId} 不存在`);
    }

    return this.prisma.postView.findMany({
      where: { postId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * 获取用户的浏览历史
   * @param userId 用户 ID
   * @param limit 返回数量限制
   * @returns 浏览记录数组
   */
  async getUserViewHistory(userId: string, limit: number = 50) {
    return this.prisma.postView.findMany({
      where: { userId },
      include: {
        post: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
