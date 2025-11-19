import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, MaxLength, IsHexColor } from 'class-validator';

/**
 * 创建标签的输入数据
 */
@InputType()
export class CreateTagInput {
  /**
   * 标签名称（必填，唯一）
   */
  @Field(() => String, { description: '标签名称' })
  @IsNotEmpty({ message: '标签名称不能为空' })
  @MaxLength(50, { message: '标签名称最多 50 个字符' })
  name: string;

  /**
   * URL 友好的标识符（必填，唯一）
   */
  @Field(() => String, { description: 'URL 友好的唯一标识符' })
  @IsNotEmpty({ message: 'Slug 不能为空' })
  @MaxLength(50, { message: 'Slug 最多 50 个字符' })
  slug: string;

  /**
   * 标签描述（可选）
   */
  @Field(() => String, {
    nullable: true,
    description: '标签描述',
  })
  @IsOptional()
  @MaxLength(255, { message: '描述最多 255 个字符' })
  description?: string;

  /**
   * 标签颜色（可选）
   */
  @Field(() => String, {
    nullable: true,
    description: '标签颜色（十六进制）',
  })
  @IsOptional()
  @IsHexColor({ message: '颜色必须是有效的十六进制颜色代码（如 #10B981）' })
  color?: string;
}
