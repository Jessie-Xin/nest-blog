import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { Order } from '../../common/order/order';

/**
 * 分类排序字段枚举
 * 定义分类可以按哪些字段进行排序
 */
export enum CategoryOrderField {
  /** 分类ID */
  id = 'id',
  /** 创建时间 */
  createdAt = 'createdAt',
  /** 更新时间 */
  updatedAt = 'updatedAt',
  /** 分类名称 */
  name = 'name',
  /** URL 标识符 */
  slug = 'slug',
  /** 排序权重 */
  order = 'order',
  /** 文章数量 */
  postCount = 'postCount',
}

// 注册 GraphQL 枚举类型
registerEnumType(CategoryOrderField, {
  name: 'CategoryOrderField',
  description: '分类排序字段',
});

/**
 * 分类排序输入
 * 继承自基础排序类，指定分类排序的字段和方向
 */
@InputType()
export class CategoryOrder extends Order {
  /**
   * 排序字段
   * 指定按哪个字段进行排序
   */
  @Field(() => CategoryOrderField)
  field: CategoryOrderField;
}
