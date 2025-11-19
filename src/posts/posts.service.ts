import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePostInput } from './dto/createPost.input';
import { UpdatePostInput } from './dto/updatePost.input';
import { PostStatus } from './models/post-status.enum';

/**
 * 文章服务
 * 处理文章相关的业务逻辑
 */
@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建文章
   * @param data 创建文章的输入数据
   * @param userId 当前用户 ID
   * @returns 创建的文章对象
   */
  async createPost(data: CreatePostInput, userId: string) {
    // 准备文章数据
    const postData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      status: data.status || PostStatus.DRAFT,
      published: data.status === PostStatus.PUBLISHED || false,
      publishedAt: data.publishedAt,
      authorId: userId,
      categoryId: data.categoryId,
    };

    // 创建文章（包括标签关联和 SEO 元数据）
    const newPost = await this.prisma.post.create({
      data: {
        ...postData,
        // 关联标签（多对多）
        tags: data.tagIds
          ? {
              create: data.tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
        // 创建 SEO 元数据（一对一）
        meta: data.meta
          ? {
              create: {
                metaTitle: data.meta.metaTitle,
                metaDescription: data.meta.metaDescription,
                metaKeywords: data.meta.metaKeywords,
                canonicalUrl: data.meta.canonicalUrl,
                ogTitle: data.meta.ogTitle,
                ogDescription: data.meta.ogDescription,
                ogImage: data.meta.ogImage,
                twitterCard: data.meta.twitterCard,
                twitterTitle: data.meta.twitterTitle,
                twitterDescription: data.meta.twitterDescription,
                twitterImage: data.meta.twitterImage,
              },
            }
          : undefined,
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        meta: true,
      },
    });

    // 更新分类的文章计数
    if (data.categoryId) {
      await this.updateCategoryPostCount(data.categoryId);
    }

    // 更新标签的文章计数
    if (data.tagIds) {
      for (const tagId of data.tagIds) {
        await this.updateTagPostCount(tagId);
      }
    }

    return newPost;
  }

  /**
   * 更新文章
   * @param postId 文章 ID
   * @param data 更新文章的输入数据
   * @returns 更新后的文章对象
   */
  async updatePost(postId: string, data: UpdatePostInput) {
    // 获取旧的文章信息（用于更新计数）
    const oldPost = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    });

    if (!oldPost) {
      throw new Error('文章不存在');
    }

    // 准备更新数据
    const updateData: any = {};

    // 基本字段
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.published !== undefined) updateData.published = data.published;

    // 状态管理
    if (data.status !== undefined) {
      updateData.status = data.status;
      // 如果状态改为 PUBLISHED，自动设置 published 为 true
      if (data.status === PostStatus.PUBLISHED) {
        updateData.published = true;
        if (!data.publishedAt && !oldPost.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt;
    }

    // 分类关系
    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId;
    }

    // 标签关系（替换所有标签）
    if (data.tagIds !== undefined) {
      updateData.tags = {
        deleteMany: {}, // 删除所有现有关联
        create: data.tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      };
    }

    // SEO 元数据
    if (data.meta !== undefined) {
      // 检查是否已有 meta
      const existingMeta = await this.prisma.postMeta.findUnique({
        where: { postId },
      });

      if (existingMeta) {
        // 更新现有 meta
        updateData.meta = { update: data.meta };
      } else {
        // 创建新 meta
        updateData.meta = { create: data.meta };
      }
    }

    // 执行更新
    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        meta: true,
      },
    });

    // 更新分类计数（如果分类改变了）
    if (
      data.categoryId !== undefined &&
      data.categoryId !== oldPost.categoryId
    ) {
      // 减少旧分类的计数
      if (oldPost.categoryId) {
        await this.updateCategoryPostCount(oldPost.categoryId);
      }
      // 增加新分类的计数
      if (data.categoryId) {
        await this.updateCategoryPostCount(data.categoryId);
      }
    }

    // 更新标签计数（如果标签改变了）
    if (data.tagIds !== undefined) {
      // 更新旧标签的计数
      for (const postTag of oldPost.tags) {
        await this.updateTagPostCount(postTag.tagId);
      }
      // 更新新标签的计数
      for (const tagId of data.tagIds) {
        await this.updateTagPostCount(tagId);
      }
    }

    return updatedPost;
  }

  /**
   * 根据 ID 查询文章
   */
  async findOne(postId: string) {
    return this.prisma.post.findUnique({ where: { id: postId } });
  }

  /**
   * 根据 slug 查询文章
   */
  async findBySlug(slug: string) {
    return this.prisma.post.findUnique({ where: { slug } });
  }

  /**
   * 查询用户的文章
   */
  async findUserPosts(userId: string) {
    return this.prisma.user
      .findUnique({ where: { id: userId } })
      .posts({ where: { published: true } });
  }

  /**
   * 增加文章浏览次数
   */
  async incrementViewCount(postId: string) {
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * 删除文章
   */
  async deletePost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { categoryId: true, tags: true },
    });

    if (!post) {
      throw new Error('文章不存在');
    }

    // 删除文章（会级联删除 PostTag 和 PostMeta）
    const deletedPost = await this.prisma.post.delete({
      where: { id: postId },
    });

    // 更新分类计数
    if (post.categoryId) {
      await this.updateCategoryPostCount(post.categoryId);
    }

    // 更新标签计数
    for (const postTag of post.tags) {
      await this.updateTagPostCount(postTag.tagId);
    }

    return deletedPost;
  }

  /**
   * 辅助方法：更新分类的文章计数
   */
  private async updateCategoryPostCount(categoryId: string) {
    const count = await this.prisma.post.count({
      where: { categoryId },
    });
    await this.prisma.category.update({
      where: { id: categoryId },
      data: { postCount: count },
    });
  }

  /**
   * 辅助方法：更新标签的文章计数
   */
  private async updateTagPostCount(tagId: string) {
    const count = await this.prisma.postTag.count({
      where: { tagId },
    });
    await this.prisma.tag.update({
      where: { id: tagId },
      data: { postCount: count },
    });
  }
}
