import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { MediaType } from './models/media-type.enum';
import { UpdateMediaInput } from './dto/update-media.input';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

/**
 * 媒体服务
 * 处理文件上传、图片处理、媒体管理等
 */
@Injectable()
export class MediaService {
  // 上传目录配置
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly thumbnailDir = path.join(this.uploadDir, 'thumbnails');

  constructor(private prisma: PrismaService) {
    // 确保上传目录存在
    this.ensureUploadDirs();
  }

  /**
   * 确保上传目录存在
   */
  private async ensureUploadDirs() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      console.error('创建上传目录失败:', error);
    }
  }

  /**
   * 根据 MIME 类型判断媒体类型
   */
  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('application')
    ) {
      return MediaType.DOCUMENT;
    }
    return MediaType.OTHER;
  }

  /**
   * 创建图片缩略图
   */
  private async createThumbnail(
    filePath: string,
    filename: string,
  ): Promise<string | null> {
    try {
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

      await sharp(filePath)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(thumbnailPath);

      return `/uploads/thumbnails/${thumbnailFilename}`;
    } catch (error) {
      console.error('创建缩略图失败:', error);
      return null;
    }
  }

  /**
   * 获取图片尺寸
   */
  private async getImageDimensions(
    filePath: string,
  ): Promise<{ width: number; height: number } | null> {
    try {
      const metadata = await sharp(filePath).metadata();
      if (!metadata.width || !metadata.height) {
        return null;
      }
      return {
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      console.error('获取图片尺寸失败:', error);
      return null;
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    title?: string,
    description?: string,
    altText?: string,
  ) {
    const mediaType = this.getMediaType(file.mimetype);
    const fileUrl = `/uploads/${file.filename}`;

    // 准备媒体数据
    const mediaData: Prisma.MediaCreateInput = {
      filename: file.originalname,
      title: title || file.originalname,
      description,
      altText,
      type: mediaType,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      url: fileUrl,
      uploader: {
        connect: { id: userId },
      },
    };

    // 如果是图片，处理图片特定信息
    if (mediaType === MediaType.IMAGE) {
      const dimensions = await this.getImageDimensions(file.path);
      if (dimensions) {
        mediaData.width = dimensions.width;
        mediaData.height = dimensions.height;
      }

      // 创建缩略图
      const thumbnailUrl = await this.createThumbnail(file.path, file.filename);
      if (thumbnailUrl) {
        mediaData.thumbnailUrl = thumbnailUrl;
      }
    }

    // 保存到数据库
    return this.prisma.media.create({
      data: mediaData,
      include: {
        uploader: true,
      },
    });
  }

  /**
   * 查询所有媒体
   */
  async findAll(userId?: string, type?: MediaType) {
    return this.prisma.media.findMany({
      where: {
        uploaderId: userId,
        type,
      },
      include: {
        uploader: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**∏
   * 根据 ID 查询媒体
   */
  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        uploader: true,
      },
    });

    if (!media) {
      throw new NotFoundException(`媒体文件 ${id} 不存在`);
    }

    return media;
  }

  /**
   * 更新媒体信息
   */
  async update(id: string, data: UpdateMediaInput) {
    // 验证媒体是否存在
    await this.findOne(id);

    return this.prisma.media.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        altText: data.altText,
      },
      include: {
        uploader: true,
      },
    });
  }

  /**
   * 删除媒体
   */
  async remove(id: string) {
    const media = await this.findOne(id);

    // 删除文件
    try {
      await fs.unlink(media.path);

      // 如果有缩略图，也删除
      if (media.thumbnailUrl) {
        const thumbnailPath = path.join(
          process.cwd(),
          media.thumbnailUrl.replace(/^\//, ''),
        );
        await fs.unlink(thumbnailPath).catch(() => {});
      }
    } catch (error) {
      console.error('删除文件失败:', error);
    }

    // 从数据库删除
    return this.prisma.media.delete({
      where: { id },
    });
  }

  /**
   * 获取用户的媒体统计
   */
  async getUserMediaStats(userId: string) {
    const [totalCount, totalSize, typeBreakdown] = await Promise.all([
      this.prisma.media.count({ where: { uploaderId: userId } }),
      this.prisma.media.aggregate({
        where: { uploaderId: userId },
        _sum: { size: true },
      }),
      this.prisma.media.groupBy({
        by: ['type'],
        where: { uploaderId: userId },
        _count: { type: true },
      }),
    ]);

    return {
      totalCount,
      totalSize: totalSize._sum.size || 0,
      typeBreakdown: typeBreakdown.map((item) => ({
        type: item.type,
        count: item._count.type,
      })),
    };
  }
}
