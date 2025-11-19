import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { Post } from '../../posts/models/post.model';

/**
 * 标签 GraphQL 模型
 * 用于定义 GraphQL API 返回的标签数据结构
 */
@ObjectType()
export class Tag extends BaseModel {
  /**
   * 标签名称（唯一）
   * 例如："JavaScript"、"React"、"NestJS"
   */
  @Field(() => String, { description: '标签名称' })
  name: string;

  /**
   * URL 友好的标识符
   * 例如："javascript"、"react"、"nestjs"
   */
  @Field(() => String, { description: 'URL 友好的唯一标识符' })
  slug: string;

  /**
   * 标签描述（可选）
   */
  @Field(() => String, {
    nullable: true,
    description: '标签描述',
  })
  description?: string | null;

  /**
   * 标签颜色（可选）
   * 十六进制颜色代码，用于 UI 展示
   */
  @Field(() => String, {
    nullable: true,
    description: '标签颜色（十六进制）',
  })
  color?: string | null;

  /**
   * 该标签下的文章列表（延迟加载）
   * 使用 ResolveField 实现
   */
  @Field(() => [Post], {
    nullable: 'itemsAndList',
    description: '标签下的文章列表',
  })
  posts?: Post[] | null;

  /**
   * 文章数量统计
   */
  @Field(() => Int, {
    defaultValue: 0,
    description: '该标签下的文章数量',
  })
  postCount: number;
}
