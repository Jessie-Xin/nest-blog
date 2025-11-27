import {
  Resolver,
  Query,
  Mutation,
  Args,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Comment } from './models/comment.model';
import { CommentsService } from './comments.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';
import { Post } from '../posts/models/post.model';
import { CommentIdArgs } from './args/comment-id.args';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { UpdateCommentStatusInput } from './dto/update-comment-status.input';
import { CommentStatus } from './models/comment-status.enum';
import { PrismaService } from 'nestjs-prisma';
import { Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

/**
 * 评论解析器
 * 处理评论相关的 GraphQL 查询和变更
 */
@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private commentsService: CommentsService,
    private prisma: PrismaService,
  ) {}

  // ===== 查询 =====

  /**
   * 查询所有评论（可筛选）
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => [Comment], { description: '查询所有评论' })
  async comments(
    @Args('postId', { type: () => String, nullable: true })
    postId?: string,
    @Args('authorId', { type: () => String, nullable: true })
    authorId?: string,
    @Args('status', { type: () => CommentStatus, nullable: true })
    status?: CommentStatus,
  ) {
    return this.commentsService.findAll(postId, authorId, status);
  }

  /**
   * 查询某篇文章的评论（树形结构）
   */
  @Query(() => [Comment], { description: '查询某篇文章的评论（树形结构）' })
  async postComments(
    @Args('postId', { type: () => String }) postId: string,
    @Args('status', { type: () => CommentStatus, nullable: true })
    status?: CommentStatus,
  ) {
    return this.commentsService.findByPost(postId, status);
  }

  /**
   * 查询单个评论
   */
  @Query(() => Comment, { description: '查询单个评论' })
  async comment(@Args() args: CommentIdArgs) {
    return this.commentsService.findOne(args.commentId);
  }

  // ===== 变更 =====

  /**
   * 创建评论
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment, { description: '创建评论' })
  async createComment(
    @Args('data') data: CreateCommentInput,
    @UserEntity() user: User,
  ) {
    return this.commentsService.create(data, user.id);
  }

  /**
   * 更新评论内容
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment, { description: '更新评论内容' })
  async updateComment(
    @Args() args: CommentIdArgs,
    @Args('data') data: UpdateCommentInput,
    @UserEntity() user: User,
  ) {
    return this.commentsService.update(args.commentId, data, user.id);
  }

  /**
   * 更新评论状态（管理员专用）
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment, { description: '更新评论状态（管理员专用）' })
  async updateCommentStatus(
    @Args() args: CommentIdArgs,
    @Args('data') data: UpdateCommentStatusInput,
    @UserEntity() user: User,
  ) {
    // 验证管理员权限
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('只有管理员可以更新评论状态');
    }

    return this.commentsService.updateStatus(args.commentId, data);
  }

  /**
   * 删除评论
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment, { description: '删除评论' })
  async deleteComment(@Args() args: CommentIdArgs, @UserEntity() user: User) {
    const isAdmin = user.role === Role.ADMIN;
    return this.commentsService.remove(args.commentId, user.id, isAdmin);
  }

  /**
   * 点赞评论
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment, { description: '点赞评论' })
  async likeComment(@Args() args: CommentIdArgs) {
    return this.commentsService.like(args.commentId);
  }

  /**
   * 取消点赞评论
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment, { description: '取消点赞评论' })
  async unlikeComment(@Args() args: CommentIdArgs) {
    return this.commentsService.unlike(args.commentId);
  }

  // ===== 字段解析 =====

  /**
   * 解析评论作者
   */
  @ResolveField('author', () => User)
  async author(@Parent() comment: Comment) {
    return this.prisma.comment
      .findUnique({ where: { id: comment.id } })
      .author();
  }

  /**
   * 解析所属文章
   */
  @ResolveField('post', () => Post)
  async post(@Parent() comment: Comment) {
    return this.prisma.comment.findUnique({ where: { id: comment.id } }).post();
  }

  /**
   * 解析父评论
   */
  @ResolveField('parent', () => Comment, { nullable: true })
  async parent(@Parent() comment: Comment) {
    if (!comment.parentId) {
      return null;
    }
    return this.prisma.comment
      .findUnique({ where: { id: comment.id } })
      .parent();
  }

  /**
   * 解析子评论列表
   */
  @ResolveField('replies', () => [Comment])
  async replies(@Parent() comment: Comment) {
    return this.prisma.comment
      .findUnique({ where: { id: comment.id } })
      .replies();
  }
}
