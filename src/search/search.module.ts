import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchResolver } from './search.resolver';

/**
 * 搜索模块
 * 提供全文搜索、搜索建议、搜索历史等功能
 */
@Module({
  providers: [SearchService, SearchResolver],
  exports: [SearchService],
})
export class SearchModule {}
