import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, Min } from 'class-validator';

/**
 * 版本 ID 参数
 */
@ArgsType()
export class RevisionIdArgs {
  @Field(() => String, { description: '版本 ID' })
  @IsNotEmpty({ message: '版本 ID 不能为空' })
  revisionId: string;
}

/**
 * 版本对比参数
 */
@ArgsType()
export class CompareRevisionsArgs {
  @Field(() => String, { description: '文章 ID' })
  @IsNotEmpty({ message: '文章 ID 不能为空' })
  postId: string;

  @Field(() => Int, { description: '旧版本号' })
  @Min(1, { message: '版本号至少为 1' })
  oldVersion: number;

  @Field(() => Int, { description: '新版本号' })
  @Min(1, { message: '版本号至少为 1' })
  newVersion: number;
}

/**
 * 版本回滚参数
 */
@ArgsType()
export class RestoreRevisionArgs {
  @Field(() => String, { description: '文章 ID' })
  @IsNotEmpty({ message: '文章 ID 不能���空' })
  postId: string;

  @Field(() => Int, { description: '要恢复的版本号' })
  @Min(1, { message: '版本号至少为 1' })
  version: number;
}
