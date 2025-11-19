import { Module } from '@nestjs/common';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';

/**
 * 文章模块
 * 定义文章功能的相关组件和依赖
 */
@Module({
  // 模块导入（当前为空）
  imports: [],
  // 模块提供的服务
  providers: [PostsResolver, PostsService],
  // 导出服务供其他模块使用
  exports: [PostsService],
})
export class PostsModule {}
