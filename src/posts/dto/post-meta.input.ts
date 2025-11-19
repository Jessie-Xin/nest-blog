import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, MaxLength } from 'class-validator';

/**
 * 文章 SEO 元数据输入
 * 用于创建或更新文章的 SEO 相关信息
 */
@InputType()
export class PostMetaInput {
  // ===== SEO 基础字段 =====

  /**
   * SEO 标题（建议 60-70 字符）
   */
  @Field(() => String, {
    nullable: true,
    description: 'SEO 标题（建议 60-70 字符）',
  })
  @IsOptional()
  @MaxLength(70)
  metaTitle?: string;

  /**
   * SEO 描述（建议 150-160 字符）
   */
  @Field(() => String, {
    nullable: true,
    description: 'SEO 描述（建议 150-160 字符）',
  })
  @IsOptional()
  @MaxLength(160)
  metaDescription?: string;

  /**
   * SEO 关键词（逗号分隔）
   */
  @Field(() => String, {
    nullable: true,
    description: 'SEO 关键词（逗号分隔）',
  })
  @IsOptional()
  @MaxLength(255)
  metaKeywords?: string;

  /**
   * 规范 URL
   */
  @Field(() => String, {
    nullable: true,
    description: '规范 URL',
  })
  @IsOptional()
  canonicalUrl?: string;

  // ===== Open Graph（社交媒体分享）=====

  /**
   * Open Graph 标题
   */
  @Field(() => String, {
    nullable: true,
    description: 'Open Graph 标题',
  })
  @IsOptional()
  @MaxLength(95)
  ogTitle?: string;

  /**
   * Open Graph 描述
   */
  @Field(() => String, {
    nullable: true,
    description: 'Open Graph 描述',
  })
  @IsOptional()
  @MaxLength(200)
  ogDescription?: string;

  /**
   * Open Graph 图片 URL
   */
  @Field(() => String, {
    nullable: true,
    description: 'Open Graph 图片 URL',
  })
  @IsOptional()
  ogImage?: string;

  // ===== Twitter Card =====

  /**
   * Twitter 卡片类型
   */
  @Field(() => String, {
    nullable: true,
    description: 'Twitter 卡片类型（summary、summary_large_image 等）',
  })
  @IsOptional()
  twitterCard?: string;

  /**
   * Twitter 标题
   */
  @Field(() => String, {
    nullable: true,
    description: 'Twitter 标题',
  })
  @IsOptional()
  @MaxLength(70)
  twitterTitle?: string;

  /**
   * Twitter 描述
   */
  @Field(() => String, {
    nullable: true,
    description: 'Twitter 描述',
  })
  @IsOptional()
  @MaxLength(200)
  twitterDescription?: string;

  /**
   * Twitter 图片 URL
   */
  @Field(() => String, {
    nullable: true,
    description: 'Twitter 图片 URL',
  })
  @IsOptional()
  twitterImage?: string;
}
