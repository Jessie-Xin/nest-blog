import { Module } from '@nestjs/common';
import { CategoriesResolver } from './categories.resolver';
import { CategoriesService } from './categories.service';

/**
 * 分类模块
 * 提供分类管理功能
 */
@Module({
  providers: [
    CategoriesResolver, // GraphQL Resolver
    CategoriesService, // 业务逻辑服务
  ],
  exports: [
    CategoriesService, // 导出 Service，供其他模块使用
  ],
})
export class CategoriesModule {}
