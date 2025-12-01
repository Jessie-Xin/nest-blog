import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'nestjs-prisma';
import { SchedulerService } from './scheduler.service';
import { SchedulerResolver } from './scheduler.resolver';
import { PublishScheduledPostsTask } from './tasks/publish-scheduled-posts.task';
import { CleanupOldDataTask } from './tasks/cleanup-old-data.task';
import { GenerateStatisticsTask } from './tasks/generate-statistics.task';

/**
 * 定時任務模塊
 * 提供定時任務調度、執行和管理功能
 */
@Module({
  imports: [
    // 導入 NestJS 調度模塊
    ScheduleModule.forRoot(),
    // 明確導入 PrismaModule（即使是全局的，定時任務也需要明確導入）
    PrismaModule,
  ],
  providers: [
    // 核心服務
    SchedulerService,

    // GraphQL Resolver
    SchedulerResolver,

    // 定時任務
    PublishScheduledPostsTask,
    CleanupOldDataTask,
    GenerateStatisticsTask,
  ],
  exports: [
    // 導出服務供其他模塊使用
    SchedulerService,
  ],
})
export class SchedulerModule {}
