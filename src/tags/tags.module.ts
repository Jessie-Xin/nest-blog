import { Module } from '@nestjs/common';
import { TagsResolver } from './tags.resolver';
import { TagsService } from './tags.service';

/**
 * 标签模块
 * 提供标签管理功能
 */
@Module({
  providers: [TagsResolver, TagsService],
  exports: [TagsService],
})
export class TagsModule {}
