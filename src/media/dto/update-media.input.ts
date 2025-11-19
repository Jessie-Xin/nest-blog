import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, MaxLength } from 'class-validator';

/**
 * 更新媒体信息输入
 */
@InputType()
export class UpdateMediaInput {
  /**
   * 媒体标题
   */
  @Field(() => String, { nullable: true, description: '媒体标题' })
  @IsOptional()
  @MaxLength(255)
  title?: string;

  /**
   * 媒体描述
   */
  @Field(() => String, { nullable: true, description: '媒体描述' })
  @IsOptional()
  description?: string;

  /**
   * 图片 alt 文本
   */
  @Field(() => String, { nullable: true, description: '图片 alt 文本（SEO）' })
  @IsOptional()
  @MaxLength(255)
  altText?: string;
}
