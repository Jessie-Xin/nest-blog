import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaResolver } from './media.resolver';
import { MediaController } from './media.controller';

/**
 * 媒体模块
 * 处理文件上传、图片处理、媒体管理等功能
 */
@Module({
  controllers: [MediaController], // REST API 上传
  providers: [MediaService, MediaResolver], // Service 和 GraphQL Resolver
  exports: [MediaService], // 导出供其他模块使用
})
export class MediaModule {}
