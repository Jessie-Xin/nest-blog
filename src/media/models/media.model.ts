import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { MediaType } from './media-type.enum';
import { User } from '../../users/models/user.model';
import { GraphQLJSON } from 'graphql-scalars';
import { Prisma } from '@prisma/client';

/**
 * 媒体文件 GraphQL 模型
 */
@ObjectType()
export class Media extends BaseModel {
  // ===== 基本信息 =====

  /**
   * 原始文件名
   */
  @Field(() => String, { description: '原始文件名' })
  filename: string;

  /**
   * 媒体标题（用户可自定义）
   */
  @Field(() => String, { nullable: true, description: '媒体标题' })
  title?: string | null;

  /**
   * 媒体描述
   */
  @Field(() => String, { nullable: true, description: '媒体描述' })
  description?: string | null;

  /**
   * 图片 alt 文本（用于 SEO）
   */
  @Field(() => String, { nullable: true, description: '图片 alt 文本（SEO）' })
  altText?: string | null;

  // ===== 文件信息 =====

  /**
   * 媒体类型
   */
  @Field(() => MediaType, { description: '媒体类型' })
  type: MediaType;

  /**
   * MIME 类型
   */
  @Field(() => String, { description: 'MIME 类型（如：image/jpeg）' })
  mimeType: string;

  /**
   * 文件大小（字节）
   */
  @Field(() => Int, { description: '文件大小（字节）' })
  size: number;

  /**
   * 文件存储路径
   */
  @Field(() => String, { description: '文件存储路径' })
  path: string;

  /**
   * 访问 URL
   */
  @Field(() => String, { description: '访问 URL' })
  url: string;

  // ===== 图片特定信息 =====

  /**
   * 图片宽度（仅图片类型）
   */
  @Field(() => Int, { nullable: true, description: '图片宽度' })
  width?: number | null;

  /**
   * 图片高度（仅图片类型）
   */
  @Field(() => Int, { nullable: true, description: '图片高度' })
  height?: number | null;

  /**
   * 缩略图 URL（仅图片类型）
   */
  @Field(() => String, { nullable: true, description: '缩略图 URL' })
  thumbnailUrl?: string | null;

  // ===== 关系字段 =====

  /**
   * 上传者 ID（内部字段）
   */
  uploaderId: string;

  /**
   * 上传者
   */
  @Field(() => User, { description: '上传者' })
  uploader?: User;

  /**
   * 元数据（可扩展）
   */
  @Field(() => GraphQLJSON, {
    nullable: true,
    description: '额外的元数据（如：EXIF、视频时长等）',
  })
  metadata?: Prisma.JsonValue | null;
}
