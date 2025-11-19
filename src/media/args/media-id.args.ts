import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

/**
 * 媒体 ID 参数
 */
@ArgsType()
export class MediaIdArgs {
  @Field(() => String, { description: '媒体 ID' })
  @IsNotEmpty()
  mediaId: string;
}
