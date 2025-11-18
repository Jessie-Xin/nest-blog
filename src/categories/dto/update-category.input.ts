import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateCategoryInput } from './create-category.input';
import { IsOptional, MaxLength, IsInt, Min, IsHexColor } from 'class-validator';

/**
 * 更新分类的输入数据
 * 继承自 CreateCategoryInput，但所有字段都是可选的
 *
 * PartialType 会自动将所有字段变为可选
 */
@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  /**
   * 注意：继承的所有字段都变成了可选的
   * 这样在更新时，只需要传入需要修改的字段
   *
   * 例如：只更新名称
   * { name: "新名称" }
   *
   * 或只更新颜色
   * { color: "#FF0000" }
   */
}
