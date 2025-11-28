import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * 文章浏览统计信息
 */
@ObjectType()
export class PostViewStats {
  @Field(() => String, { description: '文章 ID' })
  postId: string;

  @Field(() => Int, { description: '总浏览次数' })
  totalViews: number;

  @Field(() => Int, { description: '今日浏览次数' })
  todayViews: number;

  @Field(() => Int, { description: '本周浏览次数' })
  weekViews: number;

  @Field(() => Int, { description: '本月浏览次数' })
  monthViews: number;

  @Field(() => Int, { description: '唯一访客数' })
  uniqueVisitors: number;
}
