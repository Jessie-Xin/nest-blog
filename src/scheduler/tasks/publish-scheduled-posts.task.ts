import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'nestjs-prisma';
import { SchedulerService } from '../scheduler.service';
import { PostStatus } from '@prisma/client';

/**
 * 發布定時文章任務
 * 每分鐘檢查一次，將到期的定時文章自動發布
 */
@Injectable()
export class PublishScheduledPostsTask {
  private readonly logger = new Logger(PublishScheduledPostsTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerService: SchedulerService,
  ) {}

  /**
   * 每分鐘執行一次，發布所有到期的定時文章
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.schedulerService.executeTask(
      'publishScheduledPosts',
      () => this.publishScheduledPosts(),
      'cron',
    );
  }

  /**
   * 手動執行發布定時文章
   */
  async manualRun(userId?: string) {
    return this.schedulerService.executeTask(
      'publishScheduledPosts',
      () => this.publishScheduledPosts(),
      'manual',
      userId,
    );
  }

  /**
   * 發布定時文章的核心邏輯
   */
  private async publishScheduledPosts() {
    const now = new Date();

    // 查找所有狀態為 SCHEDULED 且發布時間已到的文章
    const scheduledPosts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        publishedAt: {
          lte: now,
        },
      },
    });

    if (scheduledPosts.length === 0) {
      this.logger.log('沒有需要發布的定時文章');
      return {
        publishedCount: 0,
        posts: [],
      };
    }

    // 批量更新文章狀態為已發布
    const updatePromises = scheduledPosts.map((post) =>
      this.prisma.post.update({
        where: { id: post.id },
        data: {
          status: PostStatus.PUBLISHED,
          published: true,
        },
      }),
    );

    await Promise.all(updatePromises);

    this.logger.log(`成功發布了 ${scheduledPosts.length} 篇定時文章`);

    return {
      publishedCount: scheduledPosts.length,
      posts: scheduledPosts.map((p) => ({
        id: p.id,
        title: p.title,
        publishedAt: p.publishedAt,
      })),
    };
  }
}
