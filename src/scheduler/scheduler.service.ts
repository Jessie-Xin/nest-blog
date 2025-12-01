import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { TaskStatus } from './models/task-status.enum';
import { TaskLogFilterInput } from './dto/task-log-filter.input';
import { TaskStatistics } from './dto/task-statistics.output.js';

/**
 * 定時任務服務
 * 提供任務執行、日誌記錄和統計功能
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 執行任務並記錄日誌
   * @param taskName 任務名稱
   * @param taskFunction 任務執行函數
   * @param triggeredBy 觸發方式（cron、manual、system）
   * @param userId 用戶 ID（手動觸發時）
   * @returns 任務日誌 ID
   */
  async executeTask<T>(
    taskName: string,
    taskFunction: () => Promise<T>,
    triggeredBy: string = 'cron',
    userId?: string,
  ): Promise<string> {
    // 創建任務日誌
    const taskLog = await this.prisma.taskLog.create({
      data: {
        taskName,
        taskType: triggeredBy,
        status: TaskStatus.RUNNING,
        startedAt: new Date(),
        triggeredBy,
        userId,
      },
    });

    const startTime = Date.now();

    try {
      this.logger.log(`開始執行任務: ${taskName} (ID: ${taskLog.id})`);

      // 執行任務
      const result = await taskFunction();

      const duration = Date.now() - startTime;

      // 更新任務狀態為完成
      await this.prisma.taskLog.update({
        where: { id: taskLog.id },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          result: result as Record<string, unknown>,
        },
      });

      this.logger.log(
        `任務完成: ${taskName} (ID: ${taskLog.id}, 耗時: ${duration}ms)`,
      );

      return taskLog.id;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 更新任務狀態為失敗
      await this.prisma.taskLog.update({
        where: { id: taskLog.id },
        data: {
          status: TaskStatus.FAILED,
          completedAt: new Date(),
          duration,
          error: errorMessage,
        },
      });

      this.logger.error(
        `任務失敗: ${taskName} (ID: ${taskLog.id})`,
        errorMessage,
      );

      throw error;
    }
  }

  /**
   * 查詢任務日誌
   * @param filter 篩選條件
   * @returns 任務日誌列表
   */
  async getTaskLogs(filter: TaskLogFilterInput = {}) {
    const { taskName, status, triggeredBy, limit = 50, skip = 0 } = filter;

    return this.prisma.taskLog.findMany({
      where: {
        ...(taskName && { taskName }),
        ...(status && { status }),
        ...(triggeredBy && { triggeredBy }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  /**
   * 根據 ID 查詢單個任務日誌
   * @param id 任務日誌 ID
   * @returns 任務日誌
   */
  async getTaskLog(id: string) {
    return this.prisma.taskLog.findUnique({
      where: { id },
    });
  }

  /**
   * 獲取任務統計信息
   * @returns 任務統計
   */
  async getTaskStatistics(): Promise<TaskStatistics> {
    // 獲取總任務數和各狀態任務數
    const [total, pending, running, completed, failed] = await Promise.all([
      this.prisma.taskLog.count(),
      this.prisma.taskLog.count({ where: { status: TaskStatus.PENDING } }),
      this.prisma.taskLog.count({ where: { status: TaskStatus.RUNNING } }),
      this.prisma.taskLog.count({ where: { status: TaskStatus.COMPLETED } }),
      this.prisma.taskLog.count({ where: { status: TaskStatus.FAILED } }),
    ]);

    // 計算成功率
    const successRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    // 計算平均執行時長（僅計算已完成的任務）
    const completedTasks = await this.prisma.taskLog.findMany({
      where: {
        status: TaskStatus.COMPLETED,
        duration: { not: null },
      },
      select: { duration: true },
    });

    const averageDuration =
      completedTasks.length > 0
        ? Math.round(
            completedTasks.reduce(
              (sum: number, task) => sum + (task.duration || 0),
              0,
            ) / completedTasks.length,
          )
        : undefined;

    return {
      total,
      pending,
      running,
      completed,
      failed,
      successRate,
      averageDuration,
    };
  }

  /**
   * 清理舊的任務日誌
   * @param daysToKeep 保留天數
   * @returns 刪除的記錄數
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.taskLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: {
          in: [TaskStatus.COMPLETED, TaskStatus.FAILED],
        },
      },
    });

    this.logger.log(`清理了 ${result.count} 條舊任務日誌`);
    return result.count;
  }
}
