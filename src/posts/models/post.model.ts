import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';
import { BaseModel } from '../../common/models/base.model';
import { PostStatus } from './post-status.enum';
import { PostMeta } from './post-meta.model';
import { Category } from '../../categories/models/category.model';
import { Tag } from '../../tags/models/tag.model';

/**
 * 文章模型
 * 继承自基础模型，包含文章的属性和关联信息
 */
@ObjectType()
export class Post extends BaseModel {
  // ===== 基本内容字段 =====

  /**
   * 文章标题
   */
  @Field(() => String, { description: '文章标题' })
  title: string;

  /**
   * URL 友好标识符
   * 用于生成 SEO 友好的 URL，如：/posts/my-first-post
   */
  @Field(() => String, { description: 'URL 友好标识符（slug）' })
  slug: string;

  /**
   * 文章摘要
   * 显示在列表页的简短描述（建议 150-200 字符）
   */
  @Field(() => String, {
    nullable: true,
    description: '文章摘要（建议 150-200 字符）',
  })
  excerpt?: string | null;

  /**
   * 文章内容
   * 文章的详细内容，可为空
   */
  @Field(() => String, { nullable: true, description: '文章正文内容' })
  content?: string | null;

  // ===== 发布状态字段 =====

  /**
   * 发布状态（兼容旧字段）
   * 为了向后兼容保留，建议使用 status 字段
   */
  @Field(() => Boolean, { description: '是否发布（兼容旧字段）' })
  published: boolean;

  /**
   * 文章状态
   * 使用枚举管理文章的工作流状态
   */
  @Field(() => PostStatus, { description: '文章状态' })
  status: PostStatus;

  /**
   * 发布时间
   * 文章实际发布的时间，可用于定时发布
   */
  @Field(() => Date, {
    nullable: true,
    description: '发布时间（用于定时发布）',
  })
  publishedAt?: Date | null;

  // ===== 统计字段 =====

  /**
   * 浏览次数
   */
  @Field(() => Number, { description: '浏览次数', defaultValue: 0 })
  viewCount: number;

  // ===== 关系字段（延迟加载）=====

  /**
   * 分类 ID（内部字段，用于关系）
   * 不直接暴露给 GraphQL，但需要用于 ResolveField
   */
  categoryId?: string | null;

  /**
   * 文章作者
   * 关联的文章作者信息，可为空
   */
  @Field(() => User, { nullable: true, description: '文章作者' })
  author?: User | null;

  /**
   * 所属分类
   * 一篇文章只能属于一个分类
   */
  @Field(() => Category, { nullable: true, description: '所属分类' })
  category?: Category | null;

  /**
   * 关联的标签
   * 一篇文章可以有多个标签（多对多关系）
   */
  @Field(() => [Tag], { description: '关联的标签列表' })
  tags: Tag[];

  /**
   * SEO 元数据
   * 一对一关系，包含 SEO、Open Graph、Twitter Card 等信息
   */
  @Field(() => PostMeta, { nullable: true, description: 'SEO 元数据' })
  meta?: PostMeta | null;
}
