import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Tag } from './models/tag.model';
import { TagsService } from './tags.service';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';
import { TagIdArgs } from './args/tag-id.args';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Post } from '../posts/models/post.model';

/**
 * 标签解析器
 * 处理与标签相关的 GraphQL 查询和变更
 */
@UseGuards(GqlAuthGuard)
@Resolver(() => Tag)
export class TagsResolver {
  constructor(
    private tagsService: TagsService,
    private prisma: PrismaService,
  ) {}

  // ============================================
  // 查询（Queries）
  // ============================================

  /**
   * 查询所有标签
   */
  @Query(() => [Tag], {
    description: '获取所有标签列表',
  })
  async tags() {
    return this.tagsService.findAll();
  }

  /**
   * 根据 ID 查询单个标签
   */
  @Query(() => Tag, {
    description: '根据 ID 获取单个标签',
  })
  async tag(@Args() args: TagIdArgs) {
    return this.tagsService.findOne(args.id);
  }

  /**
   * 根据 slug 查询单个标签
   */
  @Query(() => Tag, {
    description: '根据 slug 获取单个标签',
  })
  async tagBySlug(@Args('slug') slug: string) {
    return this.tagsService.findBySlug(slug);
  }

  // ============================================
  // 变更（Mutations） - 需要认证
  // ============================================

  /**
   * 创建标签（需要管理员权限）
   */
  @UseGuards(AdminGuard)
  @Mutation(() => Tag, {
    description: '创建新标签（需要管理员权限）',
  })
  async createTag(@Args('data') data: CreateTagInput) {
    return this.tagsService.create(data);
  }

  /**
   * 更新标签（需要管理员权限）
   */
  @UseGuards(AdminGuard)
  @Mutation(() => Tag, {
    description: '更新标签（需要管理员权限）',
  })
  async updateTag(@Args() args: TagIdArgs, @Args('data') data: UpdateTagInput) {
    return this.tagsService.update(args.id, data);
  }

  /**
   * 删除标签（需要管理员权限）
   */
  @UseGuards(AdminGuard)
  @Mutation(() => Tag, {
    description: '删除标签（需要管理员权限）',
  })
  async deleteTag(@Args() args: TagIdArgs) {
    return this.tagsService.remove(args.id);
  }

  /**
   * 为文章添加标签
   */
  @Mutation(() => [Tag], {
    description: '为文章添加标签',
  })
  async addTagsToPost(
    @Args('postId') postId: string,
    @Args('tagIds', { type: () => [String] }) tagIds: string[],
  ) {
    return this.tagsService.addTagsToPost(postId, tagIds);
  }

  /**
   * 移除文章的标签
   */
  @Mutation(() => [Tag], {
    description: '移除文章的标签',
  })
  async removeTagsFromPost(
    @Args('postId') postId: string,
    @Args('tagIds', { type: () => [String] }) tagIds: string[],
  ) {
    return this.tagsService.removeTagsFromPost(postId, tagIds);
  }

  /**
   * 设置文章的标签（替换所有）
   */
  @Mutation(() => [Tag], {
    description: '设置文章的标签（替换所有现有标签）',
  })
  async setPostTags(
    @Args('postId') postId: string,
    @Args('tagIds', { type: () => [String] }) tagIds: string[],
  ) {
    return this.tagsService.setPostTags(postId, tagIds);
  }

  // ============================================
  // 字段解析器（Field Resolvers）
  // ============================================

  /**
   * 解析标签下的文章列表
   */
  @ResolveField('posts', () => [Post])
  async posts(@Parent() tag: Tag) {
    // 通过 PostTag 中间表查询
    const postTags = await this.prisma.postTag.findMany({
      where: { tagId: tag.id },
      include: { post: true },
    });

    return postTags.map((pt) => pt.post);
  }

  /**
   * 解析文章数量
   */
  @ResolveField('postCount', () => Number)
  async postCount(@Parent() tag: Tag) {
    return this.prisma.postTag.count({
      where: { tagId: tag.id },
    });
  }
}
