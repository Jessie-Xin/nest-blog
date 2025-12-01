import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'nestjs-prisma';
import { SchedulerService } from '../scheduler.service';

/**
 * 清理舊數據任務
 * 每天凌晨 2 點執行，清理過期的數據
 */
@Injectable()
export class CleanupOldDataTask {
  private readonly logger = new Logger(CleanupOldDataTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerService: SchedulerService,
  ) {}

  /**
   * 每天凌晨 2 點執行
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    await this.schedulerService.executeTask(
      'cleanupOldData',
      () => this.cleanupOldData(),
      'cron',
    );
  }

  /**
   * 手動執行清理
   */
  async manualRun(userId?: string) {
    return this.schedulerService.executeTask(
      'cleanupOldData',
      () => this.cleanupOldData(),
      'manual',
      userId,
    );
  }

  /**
   * 清理舊數據的核心邏輯
   */
  private async cleanupOldData() {
    const results = {
      searchHistoryDeleted: 0,
      expiredRolesDeleted: 0,
      taskLogsDeleted: 0,
    };

    // 1. 清理 30 天前的搜索歷史
    const searchHistoryCutoff = new Date();
    searchHistoryCutoff.setDate(searchHistoryCutoff.getDate() - 30);

    const deletedSearchHistory = await this.prisma.searchHistory.deleteMany({
      where: {
        createdAt: {
          lt: searchHistoryCutoff,
        },
      },
    });
    results.searchHistoryDeleted = deletedSearchHistory.count;
    this.logger.log(`刪除了 ${deletedSearchHistory.count} 條舊搜索歷史`);

    // 2. 清理已過期的用戶角色
    const now = new Date();
    const deletedExpiredRoles = await this.prisma.userRole.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    results.expiredRolesDeleted = deletedExpiredRoles.count;
    this.logger.log(`刪除了 ${deletedExpiredRoles.count} 個過期角色`);

    // 3. 清理 90 天前的任務日誌
    const taskLogCount = await this.schedulerService.cleanupOldLogs(90);
    results.taskLogsDeleted = taskLogCount;

    this.logger.log('舊數據清理完成', results);

    return results;
  }
}
