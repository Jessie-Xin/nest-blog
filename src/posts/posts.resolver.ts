import { PrismaService } from 'nestjs-prisma';
import {
  Resolver,
  Query,
  Parent,
  Args,
  ResolveField,
  Subscription,
  Mutation,
} from '@nestjs/graphql';
import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { PubSub } from 'graphql-subscriptions';
import { UseGuards } from '@nestjs/common';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PostIdArgs } from './args/post-id.args';
import { UserIdArgs } from './args/user-id.args';
import { Post } from './models/post.model';
import { PostConnection } from './models/post-connection.model';
import { PostOrder } from './dto/post-order.input';
import { CreatePostInput } from './dto/createPost.input';
import { UpdatePostInput } from './dto/updatePost.input';
import { PostStatus } from './models/post-status.enum';
import { PostMeta } from './models/post-meta.model';
import { Category } from '../categories/models/category.model';
import { Tag } from '../tags/models/tag.model';
import { PostsService } from './posts.service';

// GraphQL 订阅发布器，用于发布文章创建事件
const pubSub = new PubSub();

/**
 * 文章解析器
 * 处理文章相关的 GraphQL 请求和订阅
 */
@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
  ) {}

  /**
   * 文章创建订阅
   * 当有新文章创建时触发
   * @returns 异步可迭代的发布流
   */
  @Subscription(() => Post)
  postCreated() {
    return pubSub.asyncIterableIterator('postCreated');
  }

  /**
   * 创建文章
   * 需要用户认证，创建后发布新文章事件
   * @param user 当前认证用户
   * @param data 创建文章的输入数据
   * @returns 创建的文章对象
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Post)
  async createPost(
    @UserEntity() user: User,
    @Args('data') data: CreatePostInput,
  ) {
    const newPost = await this.postsService.createPost(data, user.id);

    // 发布文章创建事件
    pubSub.publish('postCreated', { postCreated: newPost });

    return newPost;
  }

  /**
   * 更新文章
   * 需要用户认证
   * @param id 文章ID
   * @param data 更新文章的输入数据
   * @returns 更新后的文章对象
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Post)
  async updatePost(
    @Args() id: PostIdArgs,
    @Args('data') data: UpdatePostInput,
  ) {
    return this.postsService.updatePost(id.postId, data);
  }

  /**
   * 删除文章
   * 需要用户认证
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Post)
  async deletePost(@Args() id: PostIdArgs) {
    return this.postsService.deletePost(id.postId);
  }

  /**
   * 查询已发布文章
   * 支持分页、搜索和排序功能
   * @param after 分页参数 - 在指定游标之后的记录
   * @param before 分页参数 - 在指定游标之前的记录
   * @param first 分页参数 - 获取的记录数量（向前）
   * @param last 分页参数 - 获取的记录数量（向后）
   * @param query 搜索关键词（可选）
   * @param orderBy 排序选项（可选）
   * @returns 分页后的文章连接
   */
  @Query(() => PostConnection)
  async publishedPosts(
    @Args() { after, before, first, last }: PaginationArgs,
    @Args({ name: 'query', type: () => String, nullable: true })
    query: string,
    @Args({
      name: 'orderBy',
      type: () => PostOrder,
      nullable: true,
    })
    orderBy: PostOrder,
  ) {
    const a = await findManyCursorConnection(
      (args) =>
        this.prisma.post.findMany({
          include: { author: true }, // 包含作者信息
          where: {
            published: true, // 只查询已发布文章
            title: { contains: query || '' }, // 根据标题搜索
          },
          orderBy: orderBy ? { [orderBy.field]: orderBy.direction } : undefined, // 应用排序
          ...args,
        }),
      () =>
        this.prisma.post.count({
          where: {
            published: true, // 只计算已发布文章数量
            title: { contains: query || '' }, // 根据标题搜索
          },
        }),
      { first, last, before, after }, // 分页参数
    );
    return a;
  }

  /**
   * 查询用户文章
   * 获取指定用户发布的所有文章
   * @param id 用户ID参数
   * @returns 用户发布的文章列表
   */
  @Query(() => [Post])
  userPosts(@Args() id: UserIdArgs) {
    return this.postsService.findUserPosts(id.userId);
  }

  /**
   * 查询单篇文章
   * 根据ID获取指定文章
   * @param id 文章ID参数
   * @returns 指定ID的文章对象
   */
  @Query(() => Post)
  async post(@Args() id: PostIdArgs) {
    return this.postsService.findOne(id.postId);
  }

  /**
   * 根据 slug 查询文章
   */
  @Query(() => Post, { nullable: true })
  async postBySlug(@Args('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  /**
   * 查询所有文章（包括草稿）
   * 需要认证，管理员使用
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => PostConnection)
  async allPosts(
    @Args() { after, before, first, last }: PaginationArgs,
    @Args({ name: 'query', type: () => String, nullable: true })
    query: string,
    @Args({ name: 'status', type: () => PostStatus, nullable: true })
    status: PostStatus,
    @Args({
      name: 'orderBy',
      type: () => PostOrder,
      nullable: true,
    })
    orderBy: PostOrder,
  ) {
    return findManyCursorConnection(
      (args) =>
        this.prisma.post.findMany({
          include: { author: true },
          where: {
            status: status || undefined,
            title: { contains: query || '' },
          },
          orderBy: orderBy ? { [orderBy.field]: orderBy.direction } : undefined,
          ...args,
        }),
      () =>
        this.prisma.post.count({
          where: {
            status: status || undefined,
            title: { contains: query || '' },
          },
        }),
      { first, last, before, after },
    );
  }

  /**
   * 解析文章的作者字段
   * 从文章对象中获取作者信息
   * @param post 文章对象
   * @returns 文章的作者对象
   */
  @ResolveField('author', () => User)
  async author(@Parent() post: Post) {
    return this.prisma.post.findUnique({ where: { id: post.id } }).author();
  }

  /**
   * 解析文章的分类字段
   */
  @ResolveField('category', () => Category, { nullable: true })
  async category(@Parent() post: Post) {
    if (!post.categoryId) return null;
    return this.prisma.category.findUnique({
      where: { id: post.categoryId },
    });
  }

  /**
   * 解析文章的标签字段
   */
  @ResolveField('tags', () => [Tag])
  async tags(@Parent() post: Post) {
    const postTags = await this.prisma.postTag.findMany({
      where: { postId: post.id },
      include: { tag: true },
    });
    return postTags.map((pt) => pt.tag);
  }

  /**
   * 解析文章的 SEO 元数据字段
   */
  @ResolveField('meta', () => PostMeta, { nullable: true })
  async meta(@Parent() post: Post) {
    return this.prisma.postMeta.findUnique({
      where: { postId: post.id },
    });
  }
}
