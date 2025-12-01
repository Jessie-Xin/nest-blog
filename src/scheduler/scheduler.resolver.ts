import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { UserEntity } from 'src/common/decorators/user.decorator';
import { User } from 'src/users/models/user.model';
import { SchedulerService } from './scheduler.service';
import { TaskLog } from './models/task-log.model';
import { TaskLogFilterInput } from './dto/task-log-filter.input';
import { TaskStatistics } from './dto/task-statistics.output';
import { RunTaskInput } from './dto/run-task.input';
import { PublishScheduledPostsTask } from './tasks/publish-scheduled-posts.task';
import { CleanupOldDataTask } from './tasks/cleanup-old-data.task';
import { GenerateStatisticsTask } from './tasks/generate-statistics.task';

/**
 * 定時任務 GraphQL Resolver
 */
@Resolver(() => TaskLog)
export class SchedulerResolver {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly publishScheduledPostsTask: PublishScheduledPostsTask,
    private readonly cleanupOldDataTask: CleanupOldDataTask,
    private readonly generateStatisticsTask: GenerateStatisticsTask,
  ) {}

  // ===== 查詢 =====

  /**
   * 查詢任務日誌列表（需要管理員權限）
   */
  @Query(() => [TaskLog], { description: '查詢任務日誌列表（需要管理員權限）' })
  @UseGuards(GqlAuthGuard)
  async taskLogs(
    @Args('filter', { type: () => TaskLogFilterInput, nullable: true })
    filter?: TaskLogFilterInput,
  ): Promise<TaskLog[]> {
    return this.schedulerService.getTaskLogs(filter);
  }

  /**
   * 根據 ID 查詢單個任務日誌（需要管理員權限）
   */
  @Query(() => TaskLog, {
    nullable: true,
    description: '根據 ID 查詢單個任務日誌（需要管理員權限）',
  })
  @UseGuards(GqlAuthGuard)
  async taskLog(
    @Args('id', { type: () => String, description: '任務日誌 ID' })
    id: string,
  ): Promise<TaskLog | null> {
    return this.schedulerService.getTaskLog(id);
  }

  /**
   * 獲取任務統計信息（需要管理員權限）
   */
  @Query(() => TaskStatistics, {
    description: '獲取任務統計信息（需要管理員權限）',
  })
  @UseGuards(GqlAuthGuard)
  async taskStatistics(): Promise<TaskStatistics> {
    return this.schedulerService.getTaskStatistics();
  }

  // ===== 變更 =====

  /**
   * 手動觸發任務（需要管理員權限）
   */
  @Mutation(() => String, { description: '手動觸發任務（需要管理員權限）' })
  @UseGuards(GqlAuthGuard)
  async runTask(
    @Args('data') data: RunTaskInput,
    @UserEntity() user: User,
  ): Promise<string> {
    const { taskName } = data;

    // 根據任務名稱執行相應的任務
    switch (taskName) {
      case 'publishScheduledPosts':
        return this.publishScheduledPostsTask.manualRun(user.id);

      case 'cleanupOldData':
        return this.cleanupOldDataTask.manualRun(user.id);

      case 'generateStatistics':
        return this.generateStatisticsTask.manualRun(user.id);

      default:
        throw new Error(`未知的任務名稱: ${taskName}`);
    }
  }
}
