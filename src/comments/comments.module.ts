import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';

/**
 * 评论模块
 * 提供评论系统的完整功能（CRUD、审核、点赞等）
 */
@Module({
  providers: [CommentsService, CommentsResolver],
  exports: [CommentsService],
})
export class CommentsModule {}
