import {
  IsOptional,
  MaxLength,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { PostStatus } from '../models/post-status.enum';
import { PostMetaInput } from './post-meta.input';

/**
 * 更新文章输入数据
 * 所有字段都是可选的，允许部分更新
 */
@InputType()
export class UpdatePostInput {
  // ===== 基本内容字段 =====

  /**
   * 文章标题
   */
  @Field(() => String, { nullable: true, description: '文章标题' })
  @IsOptional()
  @MaxLength(255)
  title?: string;

  /**
   * URL 友好标识符
   */
  @Field(() => String, {
    nullable: true,
    description: 'URL 友好标识符（slug）',
  })
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  /**
   * 文章摘要
   */
  @Field(() => String, {
    nullable: true,
    description: '文章摘要（建议 150-200 字符）',
  })
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  /**
   * 文章内容
   */
  @Field(() => String, { nullable: true, description: '文章正文内容' })
  @IsOptional()
  content?: string;

  // ===== 发布状态字段 =====

  /**
   * 发布状态（兼容旧字段）
   */
  @Field(() => Boolean, {
    nullable: true,
    description: '是否发布（兼容旧字段）',
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  /**
   * 文章状态
   */
  @Field(() => PostStatus, {
    nullable: true,
    description: '文章状态',
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  /**
   * 发布时间
   */
  @Field(() => Date, {
    nullable: true,
    description: '发布时间（用于定时发布）',
  })
  @IsOptional()
  publishedAt?: Date;

  // ===== 关系字段 =====

  /**
   * 分类 ID
   */
  @Field(() => String, {
    nullable: true,
    description: '分类 ID',
  })
  @IsOptional()
  categoryId?: string;

  /**
   * 标签 ID 列表
   * 注意：这会替换所有现有标签
   */
  @Field(() => [String], {
    nullable: true,
    description: '标签 ID 列表（会替换所有现有标签）',
  })
  @IsOptional()
  @IsArray()
  tagIds?: string[];

  /**
   * SEO 元数据
   */
  @Field(() => PostMetaInput, {
    nullable: true,
    description: 'SEO 元数据',
  })
  @IsOptional()
  meta?: PostMetaInput;
}
