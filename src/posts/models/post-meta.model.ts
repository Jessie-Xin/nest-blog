import { Field, ObjectType } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';

/**
 * 文章 SEO 元数据 GraphQL 模型
 * 一对一关系：每篇文章最多有一条 SEO 元数据
 */
@ObjectType()
export class PostMeta extends BaseModel {
  /**
   * 关联的文章 ID
   */
  @Field(() => String, { description: '文章 ID' })
  postId: string;

  // ===== SEO 基础字段 =====

  /**
   * SEO 标题（建议 60-70 字符）
   */
  @Field(() => String, {
    nullable: true,
    description: 'SEO 标题（建议 60-70 字符）',
  })
  metaTitle?: string | null;

  /**
   * SEO 描述（建议 150-160 字符）
   */
  @Field(() => String, {
    nullable: true,
    description: 'SEO 描述（建议 150-160 字符）',
  })
  metaDescription?: string | null;

  /**
   * SEO 关键词
   */
  @Field(() => String, {
    nullable: true,
    description: 'SEO 关键词（逗号分隔）',
  })
  metaKeywords?: string | null;

  /**
   * 规范 URL
   */
  @Field(() => String, {
    nullable: true,
    description: '规范 URL',
  })
  canonicalUrl?: string | null;

  // ===== Open Graph（社交媒体分享）=====

  /**
   * Open Graph 标题
   */
  @Field(() => String, {
    nullable: true,
    description: 'Open Graph 标题',
  })
  ogTitle?: string | null;

  /**
   * Open Graph 描述
   */
  @Field(() => String, {
    nullable: true,
    description: 'Open Graph 描述',
  })
  ogDescription?: string | null;

  /**
   * Open Graph 图片 URL
   */
  @Field(() => String, {
    nullable: true,
    description: 'Open Graph 图片 URL',
  })
  ogImage?: string | null;

  // ===== Twitter Card =====

  /**
   * Twitter 卡片类型
   */
  @Field(() => String, {
    nullable: true,
    description: 'Twitter 卡片类型',
  })
  twitterCard?: string | null;

  /**
   * Twitter 标题
   */
  @Field(() => String, {
    nullable: true,
    description: 'Twitter 标题',
  })
  twitterTitle?: string | null;

  /**
   * Twitter 描述
   */
  @Field(() => String, {
    nullable: true,
    description: 'Twitter 描述',
  })
  twitterDescription?: string | null;

  /**
   * Twitter 图片 URL
   */
  @Field(() => String, {
    nullable: true,
    description: 'Twitter 图片 URL',
  })
  twitterImage?: string | null;
}
