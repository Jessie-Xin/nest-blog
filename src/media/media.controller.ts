import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';

/**
 * 媒体上传 REST Controller
 * 使用 REST API 处理文件上传（GraphQL 上传文件比较复杂）
 */
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  /**
   * 上传文件
   * POST /media/upload
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 限制
      },
      fileFilter: (_req, file, cb) => {
        // 允许的文件类型
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/mpeg',
          'audio/mpeg',
          'audio/mp3',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `不支持的文件类型: ${file.mimetype}. 支持的类型: 图片、视频、音频、PDF、Word`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @UserEntity() user: User,
    @Body('title') title?: string,
    @Body('description') description?: string,
    @Body('altText') altText?: string,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.mediaService.uploadFile(
      file,
      user.id,
      title,
      description,
      altText,
    );
  }
}
