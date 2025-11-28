import { PrismaService } from 'nestjs-prisma';
import {
  Resolver,
  Query,
  Parent,
  Args,
  ResolveField,
  Mutation,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Category } from './models/category.model';
import { CategoriesService } from './categories.service';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { CategoryIdArgs } from './args/category-id.args';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Post } from '../posts/models/post.model';

/**
 * 分类解析器
 * 处理与分类相关的 GraphQL 查询和变更
 * 所有接口都需要用户认证（后台管理系统）
 */
@UseGuards(GqlAuthGuard)
@Resolver(() => Category)
export class CategoriesResolver {
  constructor(
    private categoriesService: CategoriesService,
    private prisma: PrismaService,
  ) {}

  // ============================================
  // 查询（Queries）
  // ============================================

  /**
   * 查询所有分类
   */
  @Query(() => [Category], {
    description: '获取所有分类列表',
  })
  async categories() {
    return this.categoriesService.findAll();
  }

  /**
   * 查询顶级分类（无父分类）
   */
  @Query(() => [Category], {
    description: '获取顶级分类列表',
  })
  async topLevelCategories() {
    return this.categoriesService.findTopLevel();
  }

  /**
   * 根据 ID 查询单个分类
   */
  @Query(() => Category, {
    description: '根据 ID 获取单个分类',
  })
  async category(@Args() args: CategoryIdArgs) {
    return this.categoriesService.findOne(args.id);
  }

  /**
   * 根据 slug 查询单个分类
   */
  @Query(() => Category, {
    description: '根据 slug 获取单个分类',
  })
  async categoryBySlug(@Args('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  /**
   * 获取分类的祖先路径（面包屑）
   */
  @Query(() => [Category], {
    description: '获取分类的祖先路径（面包屑导航）',
  })
  async categoryAncestors(@Args() args: CategoryIdArgs) {
    return this.categoriesService.getAncestors(args.id);
  }

  /**
   * 获取分类的所有后代
   */
  @Query(() => [Category], {
    description: '获取分类的所有后代分类',
  })
  async categoryDescendants(@Args() args: CategoryIdArgs) {
    return this.categoriesService.getDescendants(args.id);
  }

  // ============================================
  // 变更（Mutations） - 需要认��
  // ============================================

  /**
   * 创建分类（需要管理员权限）
   */
  @UseGuards(AdminGuard)
  @Mutation(() => Category, {
    description: '创建新分类（需要管理员权限）',
  })
  async createCategory(@Args('data') data: CreateCategoryInput) {
    return this.categoriesService.create(data);
  }

  /**
   * 更新分类（需要管理员权限）
   */
  @UseGuards(AdminGuard)
  @Mutation(() => Category, {
    description: '更新分类（需要管理员权限）',
  })
  async updateCategory(
    @Args() args: CategoryIdArgs,
    @Args('data') data: UpdateCategoryInput,
  ) {
    return this.categoriesService.update(args.id, data);
  }

  /**
   * 删除分类（需要管理员权限）
   */
  @UseGuards(AdminGuard)
  @Mutation(() => Category, {
    description: '删除分类（需要管理员权限）',
  })
  async deleteCategory(@Args() args: CategoryIdArgs) {
    return this.categoriesService.remove(args.id);
  }

  // ============================================
  // 字段解析器（Field Resolvers）- 延迟加载
  // ============================================

  /**
   * 解析父分类字段
   * 只有在 GraphQL 查询中明确请求 parent 字段时才会执行
   */
  @ResolveField('parent', () => Category, { nullable: true })
  async parent(@Parent() category: Category) {
    if (!category.parentId) {
      return null;
    }

    return this.prisma.category.findUnique({
      where: { id: category.parentId },
    });
  }

  /**
   * 解析子分类列表字段
   * 只有在 GraphQL 查询中明确请求 children 字段时才会执行
   */
  @ResolveField('children', () => [Category])
  async children(@Parent() category: Category) {
    return this.prisma.category.findMany({
      where: { parentId: category.id },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * 解析分类下的文章列表
   * 只有在 GraphQL 查询中明确请求 posts 字段时才会执行
   */
  @ResolveField('posts', () => [Post])
  async posts(@Parent() category: Category) {
    return this.prisma.post.findMany({
      where: { categoryId: category.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 解析文章数量字段
   * 实时计算该分类下的文章数量
   */
  @ResolveField('postCount', () => Number)
  async postCount(@Parent() category: Category) {
    return this.prisma.post.count({
      where: { categoryId: category.id },
    });
  }
}
