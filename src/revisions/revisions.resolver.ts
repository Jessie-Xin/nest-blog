import {
  Resolver,
  Query,
  Mutation,
  Args,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostRevision } from './models/post-revision.model';
import { RevisionDiff } from './models/revision-diff.model';
import { RevisionsService } from './revisions.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';
import { Post } from '../posts/models/post.model';
import {
  RevisionIdArgs,
  CompareRevisionsArgs,
  RestoreRevisionArgs,
} from './args/revision.args';
import { CreateRevisionInput } from './dto/create-revision.input';
import { PrismaService } from 'nestjs-prisma';
import { Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

/**
 * 版本���史解析器
 * 处理文章版本历史相关的 GraphQL 查询和变更
 */
@UseGuards(GqlAuthGuard)
@Resolver(() => PostRevision)
export class RevisionsResolver {
  constructor(
    private revisionsService: RevisionsService,
    private prisma: PrismaService,
  ) {}

  // ===== 查询 =====

  /**
   * 查询文章的所有版本历史
   */
  @Query(() => [PostRevision], { description: '查询文章的所有版本历史' })
  async postRevisions(@Args('postId', { type: () => String }) postId: string) {
    return this.revisionsService.getPostRevisions(postId);
  }

  /**
   * 查询单个版本
   */
  @Query(() => PostRevision, { description: '查询单个版本' })
  async revision(@Args() args: RevisionIdArgs) {
    return this.revisionsService.getRevision(args.revisionId);
  }

  /**
   * 对比两个版本
   */
  @Query(() => RevisionDiff, { description: '对比两个版本' })
  async compareRevisions(@Args() args: CompareRevisionsArgs) {
    return this.revisionsService.compareRevisions(
      args.postId,
      args.oldVersion,
      args.newVersion,
    );
  }

  // ===== 变更 =====

  /**
   * 创建版本快照
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostRevision, { description: '创建版本快照' })
  async createRevision(
    @Args('data') data: CreateRevisionInput,
    @UserEntity() user: User,
  ) {
    return this.revisionsService.createRevision(data, user.id);
  }

  /**
   * 恢复到指定版本
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Post, { description: '恢复到指定版本' })
  async restoreRevision(
    @Args() args: RestoreRevisionArgs,
    @UserEntity() user: User,
  ) {
    return this.revisionsService.restoreRevision(
      args.postId,
      args.version,
      user.id,
    );
  }

  /**
   * 删除指定版本（仅管理员）
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostRevision, { description: '删除指定版本（仅管理员）' })
  async deleteRevision(@Args() args: RevisionIdArgs, @UserEntity() user: User) {
    // 验���管理员权限
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('只有管理员可以删除版本');
    }

    return this.revisionsService.deleteRevision(args.revisionId);
  }

  // ===== 字段解析 =====

  /**
   * 解析版本创建者
   */
  @ResolveField('createdBy', () => User)
  async createdBy(@Parent() revision: PostRevision) {
    return this.prisma.postRevision
      .findUnique({ where: { id: revision.id } })
      .createdBy();
  }

  /**
   * 解析所属文章
   */
  @ResolveField('post', () => Post)
  async post(@Parent() revision: PostRevision) {
    return this.prisma.postRevision
      .findUnique({ where: { id: revision.id } })
      .post();
  }
}
