import {
  Resolver,
  Query,
  Mutation,
  Args,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ApprovalRequest } from './models/approval-request.model';
import { ApprovalAction } from './models/approval-action.model';
import { ApprovalsService } from './approvals.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UserEntity } from '../common/decorators/user.decorator';
import { User } from '../users/models/user.model';
import { Post } from '../posts/models/post.model';
import {
  ApprovalRequestIdArgs,
  PostIdArgs,
} from './args/approval-request.args';
import { CreateApprovalRequestInput } from './dto/create-approval-request.input';
import { ProcessApprovalInput } from './dto/process-approval.input';
import { PrismaService } from 'nestjs-prisma';

/**
 * 审批工作流解析器
 * 处理文章审批相关的 GraphQL 查询和变更
 */
@UseGuards(GqlAuthGuard)
@Resolver(() => ApprovalRequest)
export class ApprovalsResolver {
  constructor(
    private approvalsService: ApprovalsService,
    private prisma: PrismaService,
  ) {}

  // ===== 查询 =====

  /**
   * 查询单个审批请求
   */
  @Query(() => ApprovalRequest, { description: '查询单个审批请求' })
  async approvalRequest(@Args() args: ApprovalRequestIdArgs) {
    return this.approvalsService.getApprovalRequest(args.requestId);
  }

  /**
   * 通过文章 ID 查询审批请求
   */
  @Query(() => ApprovalRequest, {
    nullable: true,
    description: '通过文章 ID 查询审批请求',
  })
  async approvalRequestByPost(@Args() args: PostIdArgs) {
    return this.approvalsService.getApprovalRequestByPostId(args.postId);
  }

  /**
   * 查询所有待审批的请求（管理员）
   */
  @UseGuards(AdminGuard)
  @Query(() => [ApprovalRequest], {
    description: '查询所有待审批的请求（管理员）',
  })
  async pendingApprovalRequests() {
    return this.approvalsService.getPendingRequests();
  }

  /**
   * 查询当前用户的所有审批请求
   */
  @Query(() => [ApprovalRequest], {
    description: '查询当前用户的所有审批请求',
  })
  async myApprovalRequests(@UserEntity() user: User) {
    return this.approvalsService.getUserRequests(user.id);
  }

  // ===== 变更 =====

  /**
   * 创建审批请求
   * 作者提交文章等待审批
   */
  @Mutation(() => ApprovalRequest, { description: '创建审批请求' })
  async createApprovalRequest(
    @Args('data') data: CreateApprovalRequestInput,
    @UserEntity() user: User,
  ) {
    return this.approvalsService.createApprovalRequest(data, user.id);
  }

  /**
   * 批准审批请求（管理员）
   * 批准后文章自动发布
   */
  @UseGuards(AdminGuard)
  @Mutation(() => ApprovalRequest, {
    description: '批准审批请求（管理员）',
  })
  async approveRequest(
    @Args('data') data: ProcessApprovalInput,
    @UserEntity() user: User,
  ) {
    return this.approvalsService.approveRequest(data, user.id);
  }

  /**
   * 拒绝审批请求（管理员）
   */
  @UseGuards(AdminGuard)
  @Mutation(() => ApprovalRequest, {
    description: '拒绝审批请求（管理员）',
  })
  async rejectRequest(
    @Args('data') data: ProcessApprovalInput,
    @UserEntity() user: User,
  ) {
    return this.approvalsService.rejectRequest(data, user.id);
  }

  /**
   * 取消审批请求
   * 作者取消自己的审批请求
   */
  @Mutation(() => ApprovalRequest, { description: '取消审批请求' })
  async cancelApprovalRequest(
    @Args() args: ApprovalRequestIdArgs,
    @UserEntity() user: User,
  ) {
    return this.approvalsService.cancelRequest(args.requestId, user.id);
  }

  /**
   * 添加审批评论（管理员）
   * 不改变审批状态，仅添加反馈评论
   */
  @UseGuards(AdminGuard)
  @Mutation(() => ApprovalAction, {
    description: '添加审批评论（管理员）',
  })
  async addApprovalComment(
    @Args('data') data: ProcessApprovalInput,
    @UserEntity() user: User,
  ) {
    return this.approvalsService.addComment(data, user.id);
  }

  // ===== 字段解析 =====

  /**
   * 解析关联的文章
   */
  @ResolveField('post', () => Post)
  async post(@Parent() request: ApprovalRequest) {
    return this.prisma.approvalRequest
      .findUnique({ where: { id: request.id } })
      .post();
  }

  /**
   * 解析请求人
   */
  @ResolveField('requester', () => User)
  async requester(@Parent() request: ApprovalRequest) {
    return this.prisma.approvalRequest
      .findUnique({ where: { id: request.id } })
      .requester();
  }

  /**
   * 解析审批操作记录
   */
  @ResolveField('actions', () => [ApprovalAction])
  async actions(@Parent() request: ApprovalRequest) {
    return this.prisma.approvalRequest
      .findUnique({ where: { id: request.id } })
      .actions({
        include: {
          approver: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
  }
}
