import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PostView } from './models/post-view.model';
import { PostViewStats } from './models/post-view-stats.model';
import { RecordViewInput } from './dto/record-view.input';
import { PostIdArgs } from './args/post-id.args';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';

/**
 * 访问统计 Resolver
 * 提供浏览记录和统计查询接口
 */
@UseGuards(GqlAuthGuard)
@Resolver(() => PostView)
export class AnalyticsResolver {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * 记录文章浏览（需要登录）
   * 自动关联当前登录用户
   */
  @Mutation(() => PostView, { description: '记录文章浏览' })
  async recordView(
    @Args('data') data: RecordViewInput,
    @UserEntity() user: User,
  ) {
    return this.analyticsService.recordView(data, user.id);
  }

  /**
   * 获取文章的浏览统计
   */
  @Query(() => PostViewStats, { description: '获取文章的浏览统计' })
  async postViewStats(@Args() args: PostIdArgs) {
    return this.analyticsService.getPostViewStats(args.postId);
  }

  /**
   * 获取文章的浏览记录列表（管理员权限）
   */
  @UseGuards(AdminGuard)
  @Query(() => [PostView], {
    description: '获取文章的浏览记录列表（需要管理员权限）',
  })
  async postViews(
    @Args() args: PostIdArgs,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
  ) {
    return this.analyticsService.getPostViews(args.postId, limit);
  }

  /**
   * 获取当前用户的浏览历史
   */
  @Query(() => [PostView], { description: '获取当前用户的浏览历史' })
  async myViewHistory(
    @UserEntity() user: User,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
  ) {
    return this.analyticsService.getUserViewHistory(user.id, limit);
  }
}
