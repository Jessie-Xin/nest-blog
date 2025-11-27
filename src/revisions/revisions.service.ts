import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateRevisionInput } from './dto/create-revision.input';

/**
 * 版本历史服务
 * 处理文章版本的创建、查询、对比和回滚
 */
@Injectable()
export class RevisionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建版本快照
   * 保存当前文章状态的完整快照
   */
  async createRevision(data: CreateRevisionInput, userId: string) {
    // 查询文章（包含所有关联数据）
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        meta: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${data.postId} 不存在`);
    }

    // 获取当前最大版本号
    const latestRevision = await this.prisma.postRevision.findFirst({
      where: { postId: data.postId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = latestRevision ? latestRevision.version + 1 : 1;

    // 提取标签 ID
    const tagIds = post.tags.map((pt) => pt.tagId);

    // 创建版本快照
    return this.prisma.postRevision.create({
      data: {
        post: {
          connect: { id: data.postId },
        },
        version: nextVersion,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: post.status,
        published: post.published,
        publishedAt: post.publishedAt,
        categoryId: post.categoryId,
        tagIds,
        metaData: post.meta ? (post.meta as unknown) : null,
        createdBy: {
          connect: { id: userId },
        },
        changeMessage: data.changeMessage,
      },
      include: {
        createdBy: true,
        post: true,
      },
    });
  }

  /**
   * 获取文章的所有版本历史
   */
  async getPostRevisions(postId: string) {
    // 验证文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`文章 ${postId} 不存在`);
    }

    return this.prisma.postRevision.findMany({
      where: { postId },
      orderBy: { version: 'desc' },
      include: {
        createdBy: true,
      },
    });
  }

  /**
   * 获取单个版本
   */
  async getRevision(revisionId: string) {
    const revision = await this.prisma.postRevision.findUnique({
      where: { id: revisionId },
      include: {
        createdBy: true,
        post: true,
      },
    });

    if (!revision) {
      throw new NotFoundException(`版本 ${revisionId} 不存在`);
    }

    return revision;
  }

  /**
   * 按文章 ID 和版本号获取版本
   */
  async getRevisionByVersion(postId: string, version: number) {
    const revision = await this.prisma.postRevision.findUnique({
      where: {
        postId_version: {
          postId,
          version,
        },
      },
      include: {
        createdBy: true,
        post: true,
      },
    });

    if (!revision) {
      throw new NotFoundException(`文章 ${postId} 的版本 ${version} 不存在`);
    }

    return revision;
  }

  /**
   * 对比两个版本
   * 返回版本差异信息
   */
  async compareRevisions(
    postId: string,
    oldVersion: number,
    newVersion: number,
  ) {
    if (oldVersion === newVersion) {
      throw new BadRequestException('不能对比相同的版本');
    }

    const [oldRev, newRev] = await Promise.all([
      this.getRevisionByVersion(postId, oldVersion),
      this.getRevisionByVersion(postId, newVersion),
    ]);

    const changes: string[] = [];

    // 检查各字段的变更
    const titleChanged = oldRev.title !== newRev.title;
    if (titleChanged) {
      changes.push(`标题: "${oldRev.title}" → "${newRev.title}"`);
    }

    const contentChanged = oldRev.content !== newRev.content;
    if (contentChanged) {
      changes.push('内容已修改');
    }

    const statusChanged = oldRev.status !== newRev.status;
    if (statusChanged) {
      changes.push(`状态: ${oldRev.status} → ${newRev.status}`);
    }

    const categoryChanged = oldRev.categoryId !== newRev.categoryId;
    if (categoryChanged) {
      changes.push('分类已更改');
    }

    const tagsChanged =
      JSON.stringify(oldRev.tagIds) !== JSON.stringify(newRev.tagIds);
    if (tagsChanged) {
      changes.push('标签已更改');
    }

    if (changes.length === 0) {
      changes.push('无变更');
    }

    return {
      oldRevision: oldRev,
      newRevision: newRev,
      titleChanged,
      contentChanged,
      statusChanged,
      categoryChanged,
      tagsChanged,
      changes,
    };
  }

  /**
   * 恢复到指定版本
   * 将文章内容回滚到历史版本
   */
  async restoreRevision(postId: string, version: number, userId: string) {
    // 获取要恢复的版本
    const revision = await this.getRevisionByVersion(postId, version);

    // 获取当前文章的标签
    const currentPost = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        tags: true,
      },
    });

    if (!currentPost) {
      throw new NotFoundException(`文章 ${postId} 不存在`);
    }

    // 开始事务
    return this.prisma.$transaction(async (tx) => {
      // 1. 删除当前所有标签关联
      await tx.postTag.deleteMany({
        where: { postId },
      });

      // 2. 更新文章内容
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          title: revision.title,
          slug: revision.slug,
          excerpt: revision.excerpt,
          content: revision.content,
          status: revision.status,
          published: revision.published,
          publishedAt: revision.publishedAt,
          categoryId: revision.categoryId,
          // 重新关联标签
          tags: {
            create: revision.tagIds.map((tagId) => ({
              tag: {
                connect: { id: tagId },
              },
            })),
          },
        },
        include: {
          author: true,
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // 3. 创建新版本快照（记录回滚操作）
      await tx.postRevision.create({
        data: {
          post: {
            connect: { id: postId },
          },
          version: revision.version + 1000, // 使用大版本号表示回滚
          title: updatedPost.title,
          slug: updatedPost.slug,
          excerpt: updatedPost.excerpt,
          content: updatedPost.content,
          status: updatedPost.status,
          published: updatedPost.published,
          publishedAt: updatedPost.publishedAt,
          categoryId: updatedPost.categoryId,
          tagIds: revision.tagIds,
          metaData: revision.metaData,
          createdBy: {
            connect: { id: userId },
          },
          changeMessage: `回滚到版本 ${version}`,
        },
      });

      return updatedPost;
    });
  }

  /**
   * 删除指定版本
   * 仅管理员可用
   */
  async deleteRevision(revisionId: string) {
    const revision = await this.getRevision(revisionId);

    return this.prisma.postRevision.delete({
      where: { id: revisionId },
    });
  }

  /**
   * 获取文章的最新版本号
   */
  async getLatestVersion(postId: string): Promise<number> {
    const latestRevision = await this.prisma.postRevision.findFirst({
      where: { postId },
      orderBy: { version: 'desc' },
    });

    return latestRevision ? latestRevision.version : 0;
  }
}
