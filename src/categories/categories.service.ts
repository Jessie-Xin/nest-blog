import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryInput) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existingCategory) {
      throw new BadRequestException(`Slug "${data.slug}" 已被使用`);
    }

    if (data.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(`父分类 ID "${data.parentId}" 不存在`);
      }
    }

    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        order: data.order ?? 0,
        parentId: data.parentId,
      },
    });
  }

  async findAll(includeChildren = false) {
    return this.prisma.category.findMany({
      include: {
        children: includeChildren,
        parent: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findTopLevel() {
    return this.prisma.category.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`分类 ID "${id}" 不存在`);
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Slug "${slug}" 对应的分类不存在`);
    }

    return category;
  }

  async getAncestors(id: string) {
    const ancestors = [];
    let currentCategory = await this.findOne(id);

    while (currentCategory) {
      ancestors.unshift(currentCategory);
      if (currentCategory.parentId) {
        currentCategory = await this.findOne(currentCategory.parentId);
      } else {
        break;
      }
    }

    return ancestors;
  }

  async getDescendants(id: string) {
    const descendants = [];

    const getChildren = async (categoryId: string) => {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: true },
      });

      if (category?.children) {
        for (const child of category.children) {
          descendants.push(child);
          await getChildren(child.id);
        }
      }
    };

    await getChildren(id);
    return descendants;
  }

  async update(id: string, data: UpdateCategoryInput) {
    await this.findOne(id);

    if (data.slug) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new BadRequestException(`Slug "${data.slug}" 已被其他分类使用`);
      }
    }

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestException('不能将分类设置为自己的父分类');
      }

      if (data.parentId) {
        const descendants = await this.getDescendants(id);
        const descendantIds = descendants.map((d) => d.id);

        if (descendantIds.includes(data.parentId)) {
          throw new BadRequestException(
            '不能将分类设置为自己后代的父分类（会形成循环）',
          );
        }

        const parentCategory = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parentCategory) {
          throw new NotFoundException(`父分类 ID "${data.parentId}" 不存在`);
        }
      }
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const children = await this.prisma.category.findMany({
      where: { parentId: id },
    });

    if (children.length > 0) {
      throw new BadRequestException(
        `无法删除该分类，因为它有 ${children.length} 个子分类。请先删除或移动子分类。`,
      );
    }

    const postsCount = await this.prisma.post.count({
      where: { categoryId: id },
    });

    if (postsCount > 0) {
      throw new BadRequestException(
        `无法删除该分类，因���它有 ${postsCount} 篇关联文章。请先移除文章关联。`,
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async updatePostCount(id: string) {
    const count = await this.prisma.post.count({
      where: { categoryId: id },
    });

    await this.prisma.category.update({
      where: { id },
      data: { postCount: count },
    });
  }
}
