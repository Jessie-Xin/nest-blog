import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'nestjs-prisma';
import { SchedulerService } from '../scheduler.service';
import { PostStatus } from '@prisma/client';

/**
 * 生成統計報告任務
 * 每天凌晨 1 點執行，生成每日統計報告
 */
@Injectable()
export class GenerateStatisticsTask {
  private readonly logger = new Logger(GenerateStatisticsTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerService: SchedulerService,
  ) {}

  /**
   * 每天凌晨 1 點執行
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    await this.schedulerService.executeTask(
      'generateStatistics',
      () => this.generateStatistics(),
      'cron',
    );
  }

  /**
   * 手動執行統計生成
   */
  async manualRun(userId?: string) {
    return this.schedulerService.executeTask(
      'generateStatistics',
      () => this.generateStatistics(),
      'manual',
      userId,
    );
  }

  /**
   * 生成統計報告的核心邏輯
   */
  private async generateStatistics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 統計昨日數據
    const [
      newPosts,
      newComments,
      newUsers,
      totalViews,
      publishedPosts,
    ] = await Promise.all([
      // 昨日新增文章數
      this.prisma.post.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),

      // 昨日新增評論數
      this.prisma.comment.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),

      // 昨日新增用戶數
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),

      // 昨日文章瀏覽數
      this.prisma.postView.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),

      // 昨日發布的文章數
      this.prisma.post.count({
        where: {
          status: PostStatus.PUBLISHED,
          publishedAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
    ]);

    const statistics = {
      date: yesterday.toISOString().split('T')[0],
      newPosts,
      newComments,
      newUsers,
      totalViews,
      publishedPosts,
    };

    this.logger.log('生成每日統計報告', statistics);

    // 這裡可以將統計結果保存到數據庫或發送通知
    // 目前先返回統計結果

    return statistics;
  }
}
