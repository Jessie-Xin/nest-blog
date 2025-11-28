import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { UpdateCommentStatusInput } from './dto/update-comment-status.input';
import { CommentStatus } from './models/comment-status.enum';

/**
 * 评论服务
 * 处理评论的 CRUD、审核、点赞等业务逻辑
 */
@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建评论
   */
  async create(data: CreateCommentInput, authorId: string) {
    // 验证文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${data.postId} 不存在`);
    }

    // 如果是回复评论，验证父评论是否存在
    if (data.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(`父评论 ${data.parentId} 不存在`);
      }

      // 验证父评论是否属于同一篇文章
      if (parentComment.postId !== data.postId) {
        throw new BadRequestException('父评论不属于该文章');
      }
    }

    // 创建评论
    return this.prisma.comment.create({
      data: {
        content: data.content,
        post: {
          connect: { id: data.postId },
        },
        author: {
          connect: { id: authorId },
        },
        parent: data.parentId
          ? {
              connect: { id: data.parentId },
            }
          : undefined,
      },
      include: {
        author: true,
        post: true,
        parent: true,
      },
    });
  }

  /**
   * 查询所有评论
   * @param postId 筛选指定文章的评论
   * @param authorId 筛选指定用户的评论
   * @param status 筛选指定状态的评论
   */
  async findAll(postId?: string, authorId?: string, status?: CommentStatus) {
    return this.prisma.comment.findMany({
      where: {
        postId,
        authorId,
        status,
      },
      include: {
        author: true,
        post: true,
        parent: true,
        replies: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 查询某篇文章的评论（树形结构）
   * 只返回顶级评论，子评论通过 replies 字段获取
   */
  async findByPost(postId: string, status?: CommentStatus) {
    // 验证文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${postId} 不存在`);
    }

    // 查询顶级评论（parentId 为 null）
    return this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // 只查询顶级评论
        status: status || CommentStatus.APPROVED, // 默认只显示已批准的评论
      },
      include: {
        author: true,
        replies: {
          where: {
            status: status || CommentStatus.APPROVED,
          },
          include: {
            author: true,
            replies: {
              where: {
                status: status || CommentStatus.APPROVED,
              },
              include: {
                author: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 查询单个评论
   */
  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        post: true,
        parent: true,
        replies: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`评论 ${id} 不存在`);
    }

    return comment;
  }

  /**
   * 更新评论内容
   * 只有评论作者可以更新
   */
  async update(id: string, data: UpdateCommentInput, userId: string) {
    const comment = await this.findOne(id);

    // 验证权限：只能更新自己的评论
    if (comment.authorId !== userId) {
      throw new ForbiddenException('您没有权限更新此评论');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: data.content,
      },
      include: {
        author: true,
        post: true,
      },
    });
  }

  /**
   * 更新评论状态（管理员专用）
   */
  async updateStatus(id: string, data: UpdateCommentStatusInput) {
    // 验证评论是否存在
    await this.findOne(id);

    return this.prisma.comment.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        author: true,
        post: true,
      },
    });
  }

  /**
   * 删除评论
   * 评论作者或管理员可以删除
   */
  async remove(id: string, userId: string) {
    const comment = await this.findOne(id);

    // 查询用户信息，包括角色
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

    // 检查是否是管理员
    const isAdmin =
      user?.roles?.some(
        (userRole: any) =>
          userRole.role?.code === 'admin' && userRole.role?.isActive === true,
      ) || false;

    // 验证权限：只有作者或管理员可以删除
    if (comment.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('您没有权限删除此评论');
    }

    // 删除评论（级联删除子评论）
    return this.prisma.comment.delete({
      where: { id },
    });
  }

  /**
   * 点赞评论
   */
  async like(id: string) {
    // 验证评论是否存在
    await this.findOne(id);

    return this.prisma.comment.update({
      where: { id },
      data: {
        likes: {
          increment: 1,
        },
      },
      include: {
        author: true,
        post: true,
      },
    });
  }

  /**
   * 取消点赞评论
   */
  async unlike(id: string) {
    const comment = await this.findOne(id);

    // 确保 likes 不会小于 0
    if (comment.likes <= 0) {
      throw new BadRequestException('该评论点赞数已为 0');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        likes: {
          decrement: 1,
        },
      },
      include: {
        author: true,
        post: true,
      },
    });
  }

  /**
   * 获取评论统计
   */
  async getStats(postId?: string) {
    const [totalCount, statusBreakdown] = await Promise.all([
      this.prisma.comment.count({
        where: { postId },
      }),
      this.prisma.comment.groupBy({
        by: ['status'],
        where: { postId },
        _count: { status: true },
      }),
    ]);

    return {
      totalCount,
      statusBreakdown: statusBreakdown.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
    };
  }
}
