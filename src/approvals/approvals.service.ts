import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateApprovalRequestInput } from './dto/create-approval-request.input';
import { ProcessApprovalInput } from './dto/process-approval.input';
import { ApprovalStatus } from '@prisma/client';
import { ApprovalActionType } from '@prisma/client';
import { PostStatus } from '@prisma/client';

/**
 * 审批服务
 * 实现审批工作流和状态机逻辑
 */
@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建审批请求
   * 作者提交文章等待审批
   */
  async createApprovalRequest(
    data: CreateApprovalRequestInput,
    userId: string,
  ) {
    // 验证文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
      include: { approvalRequest: true },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${data.postId} 不存在`);
    }

    // 验证用户是否是文章作者
    if (post.authorId !== userId) {
      throw new ForbiddenException('只有文章作者可以提交审批请求');
    }

    // 检查是否已存在审批请求
    if (post.approvalRequest) {
      throw new BadRequestException(
        `文章已有审批请求（状态：${post.approvalRequest.status}）`,
      );
    }

    // 创建审批请求
    return this.prisma.approvalRequest.create({
      data: {
        post: {
          connect: { id: data.postId },
        },
        requester: {
          connect: { id: userId },
        },
        requestMessage: data.requestMessage,
        status: ApprovalStatus.PENDING,
      },
      include: {
        post: true,
        requester: true,
        actions: {
          include: {
            approver: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * 批准审批请求
   * 管理员批准文章发布
   */
  async approveRequest(data: ProcessApprovalInput, approverId: string) {
    // 获取审批请求
    const request = await this.getApprovalRequest(data.requestId);

    // 验证审批状态
    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `审批请求状态为 ${request.status}，无法批准`,
      );
    }

    // 使用事务处理
    return this.prisma.$transaction(async (tx) => {
      // 1. 更新审批请求状态
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: data.requestId },
        data: {
          status: ApprovalStatus.APPROVED,
        },
        include: {
          post: true,
          requester: true,
          actions: {
            include: {
              approver: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      // 2. 记录审批操作
      await tx.approvalAction.create({
        data: {
          request: {
            connect: { id: data.requestId },
          },
          approver: {
            connect: { id: approverId },
          },
          actionType: ApprovalActionType.APPROVE,
          comment: data.comment,
        },
      });

      // 3. 更新文章状态为已发布
      await tx.post.update({
        where: { id: request.postId },
        data: {
          status: PostStatus.PUBLISHED,
          published: true,
          publishedAt: new Date(),
        },
      });

      return updatedRequest;
    });
  }

  /**
   * 拒绝审批请求
   * 管理员拒绝文章发布
   */
  async rejectRequest(data: ProcessApprovalInput, approverId: string) {
    // 获取审批请求
    const request = await this.getApprovalRequest(data.requestId);

    // 验证审批状态
    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `审批请求状态为 ${request.status}，无法拒绝`,
      );
    }

    // 使用事务处理
    return this.prisma.$transaction(async (tx) => {
      // 1. 更新审批请求状态
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: data.requestId },
        data: {
          status: ApprovalStatus.REJECTED,
        },
        include: {
          post: true,
          requester: true,
          actions: {
            include: {
              approver: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      // 2. 记录审批操作
      await tx.approvalAction.create({
        data: {
          request: {
            connect: { id: data.requestId },
          },
          approver: {
            connect: { id: approverId },
          },
          actionType: ApprovalActionType.REJECT,
          comment: data.comment,
        },
      });

      return updatedRequest;
    });
  }

  /**
   * 取消审批请求
   * 作者取消自己的审批请求
   */
  async cancelRequest(requestId: string, userId: string) {
    // 获取审批请求
    const request = await this.getApprovalRequest(requestId);

    // 验证用户是否是请求人
    if (request.requesterId !== userId) {
      throw new ForbiddenException('只有请求人可以取消审批请求');
    }

    // 验证审批状态
    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `审批请求状态为 ${request.status}，无法取消`,
      );
    }

    // 更新状态为已取消
    return this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.CANCELLED,
      },
      include: {
        post: true,
        requester: true,
        actions: {
          include: {
            approver: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * 添加评论（不改变审批状态）
   * 审批人添加评论反馈
   */
  async addComment(data: ProcessApprovalInput, approverId: string) {
    // 获取审批请求（验证存在性）
    await this.getApprovalRequest(data.requestId);

    // 创建评论操作
    return this.prisma.approvalAction.create({
      data: {
        request: {
          connect: { id: data.requestId },
        },
        approver: {
          connect: { id: approverId },
        },
        actionType: ApprovalActionType.COMMENT,
        comment: data.comment || '（无评论内容）',
      },
      include: {
        approver: true,
        request: {
          include: {
            post: true,
            requester: true,
          },
        },
      },
    });
  }

  /**
   * 查询单个审批请求
   */
  async getApprovalRequest(requestId: string) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        post: true,
        requester: true,
        actions: {
          include: {
            approver: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`审批请求 ${requestId} 不存在`);
    }

    return request;
  }

  /**
   * 通过文章 ID 查询审批请求
   */
  async getApprovalRequestByPostId(postId: string) {
    // 验证文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${postId} 不存在`);
    }

    const request = await this.prisma.approvalRequest.findUnique({
      where: { postId },
      include: {
        post: true,
        requester: true,
        actions: {
          include: {
            approver: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return request; // 可能为 null
  }

  /**
   * 查询所有待审批的请求（管理员使用）
   */
  async getPendingRequests() {
    return this.prisma.approvalRequest.findMany({
      where: {
        status: ApprovalStatus.PENDING,
      },
      include: {
        post: true,
        requester: true,
        actions: {
          include: {
            approver: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // 先提交的先审批
      },
    });
  }

  /**
   * 查询用户的所有审批请求
   */
  async getUserRequests(userId: string) {
    return this.prisma.approvalRequest.findMany({
      where: {
        requesterId: userId,
      },
      include: {
        post: true,
        requester: true,
        actions: {
          include: {
            approver: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 验证用户是否有审批权限（已废弃，现在使用 AdminGuard）
   * @deprecated 使用 AdminGuard 替代
   */
  async validateApproverPermission(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`用户 ${userId} 不存在`);
    }

    // 檢查用戶是否有管理員角色
    const isAdmin = user.roles?.some(
      (userRole: any) =>
        userRole.role?.code === 'admin' && userRole.role?.isActive === true,
    );

    if (!isAdmin) {
      throw new ForbiddenException('只有管理员可以执行审批操作');
    }

    return user;
  }
}
