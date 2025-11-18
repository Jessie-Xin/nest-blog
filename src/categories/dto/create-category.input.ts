import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  IsHexColor,
} from 'class-validator';

/**
 * 创建分类的输入数据
 * 用于 createCategory mutation
 */
@InputType()
export class CreateCategoryInput {
  /**
   * 分类名称（必填）
   * 最多 100 个字符
   */
  @Field(() => String, { description: '分类名称' })
  @IsNotEmpty({ message: '分类名称不能为空' })
  @MaxLength(100, { message: '分类名称最多 100 个字符' })
  name: string;

  /**
   * URL 友好的标识符（必填）
   * 例如："frontend"、"backend"
   * 必须唯一
   */
  @Field(() => String, { description: 'URL 友好的唯一标识符' })
  @IsNotEmpty({ message: 'Slug 不能为空' })
  @MaxLength(100, { message: 'Slug 最多 100 个字符' })
  slug: string;

  /**
   * 分类描述（可选）
   */
  @Field(() => String, {
    nullable: true,
    description: '分类描述',
  })
  @IsOptional()
  description?: string;

  /**
   * 图标（可选）
   * 可以是图标类名或图片 URL
   */
  @Field(() => String, {
    nullable: true,
    description: '分类图标',
  })
  @IsOptional()
  icon?: string;

  /**
   * 颜色（可选）
   * 必须是有效的十六进制颜色代码
   */
  @Field(() => String, {
    nullable: true,
    description: '分类颜色（十六进制）',
  })
  @IsOptional()
  @IsHexColor({ message: '颜色必须是有效的十六进制颜色代码（如 #3B82F6）' })
  color?: string;

  /**
   * 排序权重（可选）
   * 默认为 0
   */
  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: '排序权重',
  })
  @IsOptional()
  @IsInt({ message: '排序权重必须是整数' })
  @Min(0, { message: '排序权重不能小于 0' })
  order?: number;

  /**
   * 父分类 ID（可选）
   * null 表示创建顶级分类
   */
  @Field(() => String, {
    nullable: true,
    description: '父分类 ID',
  })
  @IsOptional()
  parentId?: string;
}
