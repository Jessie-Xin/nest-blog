import { Field, ObjectType } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { Post } from '../../posts/models/post.model';
import { User } from '../../users/models/user.model';

/**
 * 文章浏览记录 GraphQL 模型
 * 用于统计和分析
 */
@ObjectType()
export class PostView extends BaseModel {
  @Field(() => String, { description: '关联的文章 ID' })
  postId: string;

  @Field(() => Post, { description: '关联的文章' })
  post?: Post;

  @Field(() => String, {
    nullable: true,
    description: '浏览者 ID（未登录为 null）',
  })
  userId?: string | null;

  @Field(() => User, { nullable: true, description: '浏览者（未登录为 null）' })
  user?: User | null;

  @Field(() => String, { nullable: true, description: 'IP 地址' })
  ipAddress?: string | null;

  @Field(() => String, { nullable: true, description: '浏览器信息' })
  userAgent?: string | null;
}
