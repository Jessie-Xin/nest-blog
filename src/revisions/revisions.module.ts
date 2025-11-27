import { Module } from '@nestjs/common';
import { RevisionsService } from './revisions.service';
import { RevisionsResolver } from './revisions.resolver';

/**
 * 版本历史模块
 * 提供文章版本快照、对比和回滚功能
 */
@Module({
  providers: [RevisionsService, RevisionsResolver],
  exports: [RevisionsService],
})
export class RevisionsModule {}
