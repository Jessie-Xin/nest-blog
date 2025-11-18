import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { Post } from '../../posts/models/post.model';

/**
 * 分类 GraphQL 模型
 * 用于定义 GraphQL API 返回的分类数据结构
 *
 * 注意：这个模型与 Prisma Schema 中的 Category 对应，
 * 但不是完全相同 - 我们可以选择性地暴露字段
 */
@ObjectType()
export class Category extends BaseModel {
  /**
   * 分类名称
   * 例如："前端开发"、"后端技术"
   */
  @Field(() => String, { description: '分类名称' })
  name: string;

  /**
   * URL 友好的标识符
   * 例如："frontend"、"backend"
   * 用于生成 SEO 友好的 URL：/category/frontend
   */
  @Field(() => String, { description: 'URL 友好的唯一标识符' })
  slug: string;

  /**
   * 分类描述（可选）
   * 用于 SEO 和分类页面展示
   */
  @Field(() => String, {
    nullable: true, // GraphQL 中可以为 null
    description: '分类描述',
  })
  description?: string | null;

  /**
   * 图标（可选）
   * 可以是图标类名（如 FontAwesome）或图片 URL
   * 例如："fa-code"、"https://example.com/icon.png"
   */
  @Field(() => String, {
    nullable: true,
    description: '分类图标',
  })
  icon?: string | null;

  /**
   * 颜色标识（可选）
   * 十六进制颜色代码，用于 UI 展示
   * 例如："#3B82F6"（蓝色）
   */
  @Field(() => String, {
    nullable: true,
    description: '分类颜色（十六进制）',
  })
  color?: string | null;

  /**
   * 排序权重
   * 数字越小越靠前，用于自定义分类显示顺序
   */
  @Field(() => Int, {
    defaultValue: 0,
    description: '排序权重（数字越小越靠前）',
  })
  order: number;

  /**
   * 父分类 ID（树形结构）
   * null 表示这是顶级分类
   */
  @Field(() => String, {
    nullable: true,
    description: '父分类 ID（顶级分类为 null）',
  })
  parentId?: string | null;

  /**
   * 父分类对象（延迟加载）
   * 使用 ResolveField 在 Resolver 中实现
   */
  @Field(() => Category, {
    nullable: true,
    description: '父分类对象',
  })
  parent?: Category | null;

  /**
   * 子分类列表（延迟加载）
   * 使用 ResolveField 在 Resolver 中实现
   */
  @Field(() => [Category], {
    nullable: 'itemsAndList', // 列表本身可以为 null，列表项也可以为 null
    description: '子分类列表',
  })
  children?: Category[] | null;

  /**
   * 该分类下的文章列表（延迟加载）
   * 使用 ResolveField 在 Resolver 中实现
   */
  @Field(() => [Post], {
    nullable: 'itemsAndList',
    description: '分类下的文章列表',
  })
  posts?: Post[] | null;

  /**
   * 文章数量统计
   * 可以直接从数据库读取，也可以通过计算得出
   */
  @Field(() => Int, {
    defaultValue: 0,
    description: '该分类下的文章数量',
  })
  postCount: number;
}
