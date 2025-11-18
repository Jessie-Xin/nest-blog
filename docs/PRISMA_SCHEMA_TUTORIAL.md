# Prisma Schema 详解教程

## 第一部分：基础概念

### 1.1 什么是模型（Model）？

模型 = 数据库中的一张表

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String
}
```

**对应的数据库表：**
```sql
CREATE TABLE "Category" (
  "id"   TEXT PRIMARY KEY,
  "name" TEXT NOT NULL
);
```

### 1.2 字段类型

```prisma
model Example {
  // 文本类型
  id        String    // 字符串（无限长）
  email     String    @db.VarChar(255)  // 字符串（限制255字符）
  content   String    @db.Text          // 长文本

  // 数字类型
  age       Int       // 整数
  price     Float     // 浮点数

  // 布尔类型
  isActive  Boolean   // true/false

  // 日期类型
  createdAt DateTime  // 日期时间

  // 可选字段（nullable）
  nickname  String?   // 问号表示可以为 null
}
```

### 1.3 装饰器（@）的含义

```prisma
model User {
  id        String   @id @default(cuid())
  //                 ↑   ↑
  //                 |   └── 默认值：自动生成 ID
  //                 └────── 主键标识

  email     String   @unique
  //                 ↑ 唯一约束：不能重复

  createdAt DateTime @default(now())
  //                 ↑ 默认值：当前时间

  updatedAt DateTime @updatedAt
  //                 ↑ 自动更新时间
}
```

---

## 第二部分：关系设计

### 2.1 一对多关系（One-to-Many）

**例子：一个用户可以写多篇文章**

```prisma
model User {
  id    String @id @default(cuid())
  name  String
  posts Post[]  // ← 一个用户有多篇文章（数组）
}

model Post {
  id       String @id @default(cuid())
  title    String
  authorId String  // ← 外键：指向 User 的 id
  author   User    @relation(fields: [authorId], references: [id])
  //       ↑                ↑                     ↑
  //       类型              本表字段              关联表字段
}
```

**数据示例：**
```
User 表：
| id   | name  |
|------|-------|
| u1   | 张三  |
| u2   | 李四  |

Post 表：
| id   | title      | authorId |
|------|------------|----------|
| p1   | 文章1      | u1       |  ← 张三的文章
| p2   | 文章2      | u1       |  ← 张三的文章
| p3   | 文章3      | u2       |  ← 李四的文章
```

### 2.2 多对多关系（Many-to-Many）

**例子：一篇文章可以有多个标签，一个标签可以属于多篇文章**

```prisma
model Post {
  id   String    @id @default(cuid())
  tags PostTag[] // ← 通过中间表关联
}

model Tag {
  id    String    @id @default(cuid())
  name  String
  posts PostTag[] // ← 通过中间表关联
}

// 中间表（关联表）
model PostTag {
  id     String @id @default(cuid())
  postId String
  tagId  String

  post Post @relation(fields: [postId], references: [id])
  tag  Tag  @relation(fields: [tagId], references: [id])

  @@unique([postId, tagId])  // ← 确保不重复
}
```

**数据示例：**
```
Post 表：
| id   | title    |
|------|----------|
| p1   | 文章1    |
| p2   | 文章2    |

Tag 表：
| id   | name     |
|------|----------|
| t1   | JavaScript |
| t2   | React    |

PostTag 表（中间表）：
| id   | postId | tagId |
|------|--------|-------|
| pt1  | p1     | t1    |  ← 文章1 有标签 JavaScript
| pt2  | p1     | t2    |  ← 文章1 有标签 React
| pt3  | p2     | t1    |  ← 文章2 有标签 JavaScript
```

### 2.3 树形结构（自引用）

**例子：分类有子分类**

```prisma
model Category {
  id       String     @id @default(cuid())
  name     String

  // 父分类
  parentId String?    // ← 可以为 null（顶级分类）
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])

  // 子分类
  children Category[] @relation("CategoryTree")
}
```

**数据示例：**
```
| id   | name     | parentId |
|------|----------|----------|
| c1   | 技术     | null     |  ← 顶级分类
| c2   | 前端     | c1       |  ← 技术的子分类
| c3   | 后端     | c1       |  ← 技术的子分类
| c4   | React    | c2       |  ← 前端的子分类
| c5   | Vue      | c2       |  ← 前端的子分类
```

**树形结构：**
```
技术 (c1)
├── 前端 (c2)
│   ├── React (c4)
│   └── Vue (c5)
└── 后端 (c3)
```

---

## 第三部分：高级特性

### 3.1 枚举（Enum）

**例子：文章状态**

```prisma
enum PostStatus {
  DRAFT      // 草稿
  PUBLISHED  // 已发布
  ARCHIVED   // 已归档
}

model Post {
  id     String     @id @default(cuid())
  status PostStatus @default(DRAFT)
  //                ↑ 只能是 DRAFT/PUBLISHED/ARCHIVED
}
```

### 3.2 级联删除（onDelete）

```prisma
model Post {
  id   String    @id @default(cuid())
  meta PostMeta?
}

model PostMeta {
  id     String @id @default(cuid())
  postId String @unique
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  //                                                           ↑
  //                                                           删除文章时，自动删除 SEO 数据
}
```

**级联策略：**
- `Cascade` - 级联删除（父删除，子也删除）
- `SetNull` - 设为 null
- `Restrict` - 阻止删除（有子数据时不能删父数据）
- `NoAction` - 不做处理

### 3.3 索引（@@index）

**提高查询性能：**

```prisma
model Post {
  id     String @id
  slug   String @unique  // ← 单字段索引
  status PostStatus

  @@index([status])      // ← 为 status 字段创建索引
  @@index([createdAt])   // ← 为 createdAt 字段创建索引
}
```

**为什么需要索引？**
```sql
-- 没有索引（慢）
SELECT * FROM Post WHERE status = 'PUBLISHED';  -- 扫描全表

-- 有索引（快）
SELECT * FROM Post WHERE status = 'PUBLISHED';  -- 直接查找索引
```

---

## 第四部分：实际应用示例

### 示例 1：完整的文章模型

```prisma
model Post {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 基本内容
  title     String   @db.VarChar(255)
  slug      String   @unique
  content   String?  @db.Text

  // 状态
  status    PostStatus @default(DRAFT)
  published Boolean    @default(false)

  // 作者（一对多）
  authorId  String?
  author    User?    @relation(fields: [authorId], references: [id])

  // 分类（一对多）
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])

  // 标签（多对多）
  tags      PostTag[]

  // SEO（一对一）
  meta      PostMeta?

  // 评论（一对多）
  comments  Comment[]

  @@index([slug])
  @@index([status])
  @@index([authorId])
}
```

### 示例 2：评论的嵌套结构

```prisma
model Comment {
  id      String @id @default(cuid())
  content String

  // 所属文章
  postId  String
  post    Post   @relation(fields: [postId], references: [id])

  // 父评论（实现回复功能）
  parentId String?
  parent   Comment?  @relation("CommentTree", fields: [parentId], references: [id])
  replies  Comment[] @relation("CommentTree")
}
```

**数据示例：**
```
| id   | content        | postId | parentId |
|------|----------------|--------|----------|
| c1   | 很好的文章     | p1     | null     |  ← 顶级评论
| c2   | 同意！         | p1     | c1       |  ← 回复 c1
| c3   | +1             | p1     | c1       |  ← 回复 c1
| c4   | 有道理         | p1     | c2       |  ← 回复 c2（嵌套回复）
```

**嵌套结构：**
```
c1: 很好的文章
├── c2: 同意！
│   └── c4: 有道理
└── c3: +1
```

---

## 常见问题

### Q1: `String?` 中的问号是什么意思？

**A:** 表示字段可以为 `null`（可选字段）

```prisma
model User {
  name     String   // 必填
  nickname String?  // 可选（可以为 null）
}
```

### Q2: `@relation` 是做什么的？

**A:** 定义表之间的关系

```prisma
model Post {
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
  //              ↑ 定义关系：本表的 authorId 字段 → 关联 User 表的 id 字段
}
```

### Q3: `@@unique([a, b])` 和 `@unique` 有什么区别？

**A:**
- `@unique` - 单字段唯一
- `@@unique([a, b])` - 组合唯一

```prisma
model PostTag {
  postId String
  tagId  String

  @@unique([postId, tagId])  // ← (postId, tagId) 组合不能重复
}

// 允许：
// (p1, t1) ✓
// (p1, t2) ✓
// (p2, t1) ✓

// 不允许：
// (p1, t1) 已存在
// (p1, t1) ✗ 重复
```

### Q4: 为什么需要中间表？

**A:** 实现多对多关系，并且可以添加额外信息

```prisma
model PostTag {
  postId    String
  tagId     String
  createdAt DateTime @default(now())  // ← 额外信息：何时添加的标签
  order     Int      @default(0)      // ← 额外信息：标签顺序

  post Post @relation(...)
  tag  Tag  @relation(...)
}
```

---

## 练习题

试着回答以下问题（我可以帮你解答）：

1. 如何设计一个"用户可以关注其他用户"的功能？
2. 如何实现文章的"草稿箱"功能？
3. 如何统计每个分类下有多少篇文章？

---

这样理解了吗？有任何不清楚的地方，随时问我！
