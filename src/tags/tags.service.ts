import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';

/**
 * 标签服务
 * 负责处理标签相关的业务逻辑
 */
@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建标签
   */
  async create(data: CreateTagInput) {
    // 检查名称是否已存在
    const existingTag = await this.prisma.tag.findUnique({
      where: { name: data.name },
    });

    if (existingTag) {
      throw new BadRequestException(`标签名称 "${data.name}" 已被使用`);
    }

    // 检查 slug 是否已存在
    const existingSlug = await this.prisma.tag.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw new BadRequestException(`Slug "${data.slug}" 已被使用`);
    }

    return this.prisma.tag.create({
      data,
    });
  }

  /**
   * 查询所有标签
   */
  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: {
        postCount: 'desc', // 按文章数量降序
      },
    });
  }

  /**
   * 根据 ID 查询单个标签
   */
  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`标签 ID "${id}" 不存在`);
    }

    return tag;
  }

  /**
   * 根据 slug 查询单个标签
   */
  async findBySlug(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
    });

    if (!tag) {
      throw new NotFoundException(`Slug "${slug}" 对应的标签不存在`);
    }

    return tag;
  }

  /**
   * 更新标签
   */
  async update(id: string, data: UpdateTagInput) {
    await this.findOne(id);

    // 如果更新名称，检查是否重复
    if (data.name) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { name: data.name },
      });

      if (existingTag && existingTag.id !== id) {
        throw new BadRequestException(
          `标签名称 "${data.name}" 已被其他��签使用`,
        );
      }
    }

    // 如果更新 slug，检查是否重复
    if (data.slug) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { slug: data.slug },
      });

      if (existingTag && existingTag.id !== id) {
        throw new BadRequestException(`Slug "${data.slug}" 已被其他标签使用`);
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除标签
   */
  async remove(id: string) {
    await this.findOne(id);

    // 检查是否有关联的文章
    const postCount = await this.prisma.postTag.count({
      where: { tagId: id },
    });

    if (postCount > 0) {
      throw new BadRequestException(
        `无法删除该标签，因为它有 ${postCount} 篇关联文章。请先移除文章关联。`,
      );
    }

    return this.prisma.tag.delete({
      where: { id },
    });
  }

  /**
   * 为文章添加标签
   * @param postId 文章 ID
   * @param tagIds 标签 ID 数组
   */
  async addTagsToPost(postId: string, tagIds: string[]) {
    // 检查文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`文章 ID "${postId}" 不存在`);
    }

    // 检查所有标签是否存在
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('部分标签 ID 不存在');
    }

    // 批量创建关联（使用 createMany 忽略已存在的关联）
    await this.prisma.postTag.createMany({
      data: tagIds.map((tagId) => ({
        postId,
        tagId,
      })),
      skipDuplicates: true, // 跳过已存在的关联
    });

    // 更新标签的文章数量
    for (const tagId of tagIds) {
      await this.updatePostCount(tagId);
    }

    return this.getPostTags(postId);
  }

  /**
   * 移除文章的标签
   * @param postId 文章 ID
   * @param tagIds 标签 ID 数组
   */
  async removeTagsFromPost(postId: string, tagIds: string[]) {
    await this.prisma.postTag.deleteMany({
      where: {
        postId,
        tagId: { in: tagIds },
      },
    });

    // 更新标签的文章数量
    for (const tagId of tagIds) {
      await this.updatePostCount(tagId);
    }

    return this.getPostTags(postId);
  }

  /**
   * 设置文章的标签（替换所有标签）
   * @param postId 文章 ID
   * @param tagIds 标签 ID 数组
   */
  async setPostTags(postId: string, tagIds: string[]) {
    // 1. 删除所有现有关联
    await this.prisma.postTag.deleteMany({
      where: { postId },
    });

    // 2. 如果提供了新标签，添加它们
    if (tagIds.length > 0) {
      return this.addTagsToPost(postId, tagIds);
    }

    return [];
  }

  /**
   * 获取文章的所有标签
   */
  async getPostTags(postId: string) {
    const postTags = await this.prisma.postTag.findMany({
      where: { postId },
      include: { tag: true },
    });

    return postTags.map((pt) => pt.tag);
  }

  /**
   * 更新标签的文章数量
   */
  async updatePostCount(id: string) {
    const count = await this.prisma.postTag.count({
      where: { tagId: id },
    });

    await this.prisma.tag.update({
      where: { id },
      data: { postCount: count },
    });
  }
}
