import { ObjectType, Field, Int } from '@nestjs/graphql';
import { MediaType } from './media-type.enum';

/**
 * 按类型统计
 */
@ObjectType()
export class TypeBreakdown {
  @Field(() => MediaType, { description: '媒体类型' })
  type: MediaType;

  @Field(() => Int, { description: '该类型的文件数' })
  count: number;
}

/**
 * 媒体统计信息
 */
@ObjectType()
export class MediaStats {
  @Field(() => Int, { description: '总文件数' })
  totalCount: number;

  @Field(() => Int, { description: '总文件大小（字节）' })
  totalSize: number;

  @Field(() => [TypeBreakdown], { description: '按类型统计' })
  typeBreakdown: TypeBreakdown[];
}
