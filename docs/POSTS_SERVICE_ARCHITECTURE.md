# PostsService 架构重构说明

## 📊 为什么需要 PostsService？

### 问题：原始架构

```
PostsResolver (GraphQL 层 + 业务逻辑 混在一起)
      ↓
PrismaService (数据库操作)
```

**存在的问题：**
- ❌ Resolver 有 270+ 行代码，职责不单一
- ❌ 业务逻辑和 GraphQL 层混在一起
- ❌ 难以进行单元测试
- ❌ 代码复用性差
- ❌ 违反 NestJS 最佳实践

---

### 解决方案：引入 Service 层

```
PostsResolver (GraphQL 层 - 50 行)
      ↓
PostsService (业务逻辑 - 270 行)
      ↓
PrismaService (数据库操作)
```

**好处：**
- ✅ 职责分离（Separation of Concerns）
- ✅ Resolver 变得简洁易读
- ✅ Service 可独立测试
- ✅ 业务逻辑可在其他地方复用
- ✅ 符合 NestJS 最佳实践

---

## 🎯 架构对比

### Before：PostsResolver（混乱）

```typescript
@Resolver(() => Post)
export class PostsResolver {
  constructor(private prisma: PrismaService) {}

  @Mutation(() => Post)
  async createPost(@UserEntity() user: User, @Args('data') data: CreatePostInput) {
    // 70 行业务逻辑代码...
    const postData = { ... };
    const newPost = await this.prisma.post.create({ ... });

    // 更新计数
    if (data.categoryId) {
      await this.updateCategoryPostCount(data.categoryId);
    }
    // 更多业务逻辑...

    return newPost;
  }

  // 更多辅助方法...
  private async updateCategoryPostCount(categoryId: string) { ... }
  private async updateTagPostCount(tagId: string) { ... }
}
```

**问题：**
- Resolver 包含大量业务逻辑
- 测试时需要 mock GraphQL 上下文
- 业务逻辑无法在 REST API 中复用

---

### After：清晰的分层架构

**PostsResolver（简洁）：**

```typescript
@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private prisma: PrismaService,      // 用于 ResolveField
    private postsService: PostsService,  // 用于业务逻辑
  ) {}

  @Mutation(() => Post)
  async createPost(@UserEntity() user: User, @Args('data') data: CreatePostInput) {
    const newPost = await this.postsService.createPost(data, user.id);
    pubSub.publish('postCreated', { postCreated: newPost });
    return newPost;
  }

  @ResolveField('tags', () => [Tag])
  async tags(@Parent() post: Post) {
    // ResolveField 延迟加载仍在 Resolver 中
    const postTags = await this.prisma.postTag.findMany({
      where: { postId: post.id },
      include: { tag: true },
    });
    return postTags.map(pt => pt.tag);
  }
}
```

**PostsService（专注业务逻辑）：**

```typescript
@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(data: CreatePostInput, userId: string) {
    // 所有业务逻辑都在这里
    const postData = { ... };
    const newPost = await this.prisma.post.create({ ... });

    // 自动更新计数
    if (data.categoryId) {
      await this.updateCategoryPostCount(data.categoryId);
    }

    return newPost;
  }

  private async updateCategoryPostCount(categoryId: string) { ... }
}
```

---

## 📁 文件职责划分

### PostsResolver 职责
- ✅ GraphQL 查询和变更的入口
- ✅ 获取当前用户（`@UserEntity()`）
- ✅ 调用 Service 层方法
- ✅ 处理 GraphQL 订阅
- ✅ **ResolveField 延迟加载**（这个保留在 Resolver）

### PostsService 职责
- ✅ 文章 CRUD 业务逻辑
- ✅ 自动计数更新
- ✅ 状态管理
- ✅ 关系管理（分类、标签、SEO）
- ✅ 数据验证
- ✅ 可被多个地方调用（GraphQL、REST、Cron 任务等）

### PrismaService 职责
- ✅ 数据库连接
- ✅ 执行 SQL 查询
- ✅ 事务管理

---

## 🎓 为什么 ResolveField 保留在 Resolver？

```typescript
// ✅ 正确：ResolveField 在 Resolver 中
@Resolver(() => Post)
export class PostsResolver {
  @ResolveField('tags', () => [Tag])
  async tags(@Parent() post: Post) {
    // 延迟加载逻辑
    return this.prisma.postTag.findMany({ ... });
  }
}
```

**原因：**
1. **GraphQL 特性** - `@ResolveField` 是 GraphQL 专属的延迟加载机制
2. **性能优化** - 只有在 GraphQL 查询中请求时才执行
3. **分层合理** - 这是表示层（GraphQL）的职责，不是业务逻辑

---

## 🧪 测试优势

### Before：测试困难

```typescript
// 需要 mock GraphQL 上下文、装饰器等
describe('PostsResolver', () => {
  it('should create post', async () => {
    const mockUser = { id: '1' };
    const mockData = { ... };

    // 需要 mock @UserEntity 装饰器
    // 需要 mock GraphQL 上下文
    // 测试代码复杂...
  });
});
```

---

### After：测试简单

```typescript
// PostsService 可以轻松单元测试
describe('PostsService', () => {
  it('should create post', async () => {
    const userId = '1';
    const data = { title: 'Test', content: 'Content' };

    const result = await service.createPost(data, userId);

    expect(result.title).toBe('Test');
    expect(result.authorId).toBe(userId);
  });

  it('should update category count automatically', async () => {
    // 纯业务逻辑测试，不涉及 GraphQL
  });
});

// PostsResolver 测试专注于 GraphQL 层
describe('PostsResolver', () => {
  it('should call service.createPost', async () => {
    const spy = jest.spyOn(service, 'createPost');
    await resolver.createPost(mockUser, mockData);
    expect(spy).toHaveBeenCalledWith(mockData, mockUser.id);
  });
});
```

---

## 📈 代码复用示例

现在 `PostsService` 可以在多个地方使用：

### 1. GraphQL API（已实现）

```typescript
@Resolver(() => Post)
export class PostsResolver {
  constructor(private postsService: PostsService) {}

  @Mutation(() => Post)
  async createPost(@UserEntity() user: User, @Args('data') data: CreatePostInput) {
    return this.postsService.createPost(data, user.id);
  }
}
```

### 2. REST API（如果需要）

```typescript
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  async create(@Body() data: CreatePostDto, @CurrentUser() user: User) {
    // 复用相同的业务逻辑！
    return this.postsService.createPost(data, user.id);
  }
}
```

### 3. 定时任务（自动发布）

```typescript
@Injectable()
export class ScheduledPublishService {
  constructor(private postsService: PostsService) {}

  @Cron('0 * * * *')  // 每小时执行
  async publishScheduledPosts() {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        publishedAt: { lte: new Date() },
      },
    });

    for (const post of posts) {
      // 复用 updatePost 业务逻辑！
      await this.postsService.updatePost(post.id, {
        status: PostStatus.PUBLISHED,
      });
    }
  }
}
```

### 4. 命令行工具

```typescript
@Command({ name: 'import-posts' })
export class ImportPostsCommand {
  constructor(private postsService: PostsService) {}

  async run() {
    const posts = await this.readCSV();
    for (const postData of posts) {
      // 复用 createPost 业务逻辑！
      await this.postsService.createPost(postData, adminUserId);
    }
  }
}
```

---

## 🎯 重构总结

### 文件变化

**新增：**
- ✅ `src/posts/posts.service.ts` - 业务逻辑层

**修改：**
- ✅ `src/posts/posts.module.ts` - 注册 PostsService
- ✅ `src/posts/posts.resolver.ts` - 简化为 GraphQL 层

**减少的代码：**
- Resolver: 270 行 → 90 行（减少 66%）
- Service: 0 行 → 270 行（新增）

**总行数变化：** 270 行 → 360 行（增加了 90 行）

**为什么增加了代码？**
- 更好的分层架构
- 更容易测试
- 更好的代码复用
- 更符合最佳实践

---

## 🚀 下一步优化建议

### 1. 添加单元测试

```typescript
// src/posts/posts.service.spec.ts
describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PostsService, PrismaService],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create post with tags and category', async () => {
    // 测试代码...
  });
});
```

### 2. 添加错误处理

```typescript
async createPost(data: CreatePostInput, userId: string) {
  try {
    // 验证分类是否存在
    if (data.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`分类 ${data.categoryId} 不存在`);
      }
    }

    // 创建文章...
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug 已存在');
      }
    }
    throw error;
  }
}
```

### 3. 添加事务支持

```typescript
async createPost(data: CreatePostInput, userId: string) {
  return this.prisma.$transaction(async (tx) => {
    const post = await tx.post.create({ ... });
    await this.updateCategoryPostCount(data.categoryId, tx);
    return post;
  });
}
```

---

## 💡 最佳实践总结

1. **分层架构**
   - Controller/Resolver → Service → Repository/ORM

2. **单一职责**
   - Resolver 只处理 GraphQL 层
   - Service 只处理业务逻辑

3. **依赖注入**
   - 通过构造函数注入依赖
   - 方便测试和复用

4. **可测试性**
   - Service 易于单元测试
   - Resolver 测试专注于 GraphQL 层

5. **代码复用**
   - Service 可在多处使用
   - 避免重复代码

---

## 🎉 恭喜！

你现在拥有了一个**符合 NestJS 最佳实践**的架构：

- ✅ 清晰的分层架构
- ✅ 易于测试
- ✅ 易于维护
- ✅ 易于扩展
- ✅ 代码复用

这就是为什么需要 `posts.service.ts`！
