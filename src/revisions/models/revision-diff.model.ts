import { Field, ObjectType } from '@nestjs/graphql';
import { PostRevision } from './post-revision.model';

/**
 * 版本对比结果
 * 展示两个版本之间的差异
 */
@ObjectType()
export class RevisionDiff {
  /**
   * 旧版本
   */
  @Field(() => PostRevision, { description: '旧版本' })
  oldRevision: PostRevision;

  /**
   * 新版本
   */
  @Field(() => PostRevision, { description: '新版本' })
  newRevision: PostRevision;

  /**
   * 标题是否变更
   */
  @Field(() => Boolean, { description: '标题是否变更' })
  titleChanged: boolean;

  /**
   * 内容是否变更
   */
  @Field(() => Boolean, { description: '内容是否变更' })
  contentChanged: boolean;

  /**
   * 状态是否变更
   */
  @Field(() => Boolean, { description: '状态是否变更' })
  statusChanged: boolean;

  /**
   * 分类是否变更
   */
  @Field(() => Boolean, { description: '分类是否变更' })
  categoryChanged: boolean;

  /**
   * 标签是否变更
   */
  @Field(() => Boolean, { description: '标签是否变更' })
  tagsChanged: boolean;

  /**
   * 变更摘要
   */
  @Field(() => [String], { description: '变更摘要列表' })
  changes: string[];
}
