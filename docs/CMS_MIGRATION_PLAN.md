# CMS 数据库迁移计划

## 分阶段实施策略

为了让你学习和实践，我们将分 10 个阶段逐步实现完整的 CMS 系统。

### 第三步：实现分类系统 ✅ 推荐从这里开始
**学习目标：**
- 理解树形结构设计
- 学习递归查询
- 掌握 GraphQL Resolver 编写

**涉及模型：**
- `Category`

**新建文件：**
```
src/categories/
├── categories.module.ts
├── categories.resolver.ts
├── categories.service.ts
├── models/
│   ├── category.model.ts
│   └── category-connection.model.ts
└── dto/
    ├── create-category.input.ts
    ├── update-category.input.ts
    └── category-order.input.ts
```

**数据库迁移：**
```prisma
model Category {
  id          String     @id @default(cuid())
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  name        String     @db.VarChar(100)
  slug        String     @unique
  description String?    @db.Text
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  posts       Post[]
  postCount   Int        @default(0)
}
```

**功能实现：**
- ✅ CRUD 操作
- ✅ 树形层级查询
- ✅ 获取子分类
- ✅ 获取分类路径（面包屑）
- ✅ 文章数量统计

---

### 第四步：实现标签系统
**学习目标：**
- 理解多对多关系
- 学习中间表操作
- 掌握批量关联

**涉及模型：**
- `Tag`
- `PostTag`

**扩展 Post 模型：**
```prisma
model Post {
  // ... 现有字段
  tags PostTag[]  // 新增
}
```

---

### 第五步：扩展 Post 模型（SEO、状态、多语言）
**学习目标：**
- 一对一关系（PostMeta）
- 枚举类型（PostStatus）
- 多语言架构

**涉及模型：**
- 扩展 `Post`
- `PostMeta`
- `PostStatus` 枚举
- `Language`
- `PostTranslation`

---

### 第六步：实现媒体库
**学习目标：**
- 文件上传处理
- 图片处理（缩略图）
- 云存储集成

**涉及模型：**
- `Media`
- `MediaType` 枚举

**技术栈：**
- `@nestjs/platform-express`（文件上传）
- `multer`（中间件）
- `sharp`（图片处理）

---

### 第七步：实现评论系统
**学习目标：**
- 嵌套评论（树形结构）
- 游客评论处理
- 垃圾评论过滤

**涉及模型：**
- `Comment`
- `CommentStatus` 枚举

---

### 第八步：实现版本历史
**学习目标：**
- 数据快照
- 版本对比
- 回滚机制

**涉及模型：**
- `PostRevision`

---

### 第九步：实现工作流审批
**学习目标：**
- 状态机设计
- 权限控制
- 通知系统

**涉及模型：**
- `ApprovalRequest`
- `ApprovalAction`
- `ApprovalStatus` 枚举

---

### 第十步：访问统计和优化
**学习目标：**
- 统计数据设计
- 查询性能优化
- 缓存策略

**涉及模型：**
- `PostView`

**优化内容：**
- 添加数据库索引
- 实现 Redis 缓存
- GraphQL DataLoader（N+1 问题）

---

## 推荐学习顺序

1. **第三步（Category）** ← **从这里开始！**
   - 最基础，最容易理解
   - 涵盖核心概念
   - 代码量适中

2. **第四步（Tag）**
   - 巩固理解
   - 学习多对多关系

3. **第五步（扩展 Post）**
   - 整合前面的知识
   - 实现核心功能

4. **第六步（Media）**
   - 引入文件处理
   - REST API + GraphQL 混合

5. **第七步到第十步**
   - 逐步添加高级功能

---

## 每一步的标准流程

对于每个功能，你都会学习：

### 1. Prisma Schema 设计
```prisma
model Category { ... }
```

### 2. 数据库迁移
```bash
npm run migrate:dev:create -- --name add_categories
npm run migrate:dev
```

### 3. GraphQL Model 定义
```typescript
@ObjectType()
export class Category extends BaseModel {
  @Field() name: string;
}
```

### 4. DTO 定义
```typescript
@InputType()
export class CreateCategoryInput {
  @Field() @IsNotEmpty() name: string;
}
```

### 5. Service 实现
```typescript
@Injectable()
export class CategoriesService {
  async create(data: CreateCategoryInput) { ... }
}
```

### 6. Resolver 实现
```typescript
@Resolver(() => Category)
export class CategoriesResolver {
  @Mutation(() => Category)
  async createCategory(@Args('data') data: CreateCategoryInput) { ... }
}
```

### 7. Module 注册
```typescript
@Module({
  providers: [CategoriesResolver, CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
```

### 8. 测试
- 单元测试
- E2E 测试
- GraphQL Playground 测试

---

## 下一步行动

**准备好了吗？让我们开始第三步：实现分类系统！**

我会一步步教你：
1. 创建数据库模型
2. 编写迁移脚本
3. 创建 GraphQL 类型
4. 实现业务逻辑
5. 编写 Resolver
6. 测试功能

输入 "开始第三步" 来继续！
