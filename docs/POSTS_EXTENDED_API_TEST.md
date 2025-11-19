# 扩展文章系统 API 测试指南

## 🎉 第五步完成！

恭喜你完成了文章系统的完整扩展！现在文章支持以下功能：

- ✅ URL 友好的 slug
- ✅ 文章摘要（excerpt）
- ✅ 状态管理（草稿、已发布、定时发布等）
- ✅ 分类关联（一对多）
- ✅ 标签关联（多对多）
- ✅ 完整的 SEO 元数据

访问：http://localhost:3002/graphql

---

## 📝 测试准备

### 1. 先登录获取 token

```graphql
mutation {
  login(email: "admin@example.com", password: "password") {
    accessToken
    refreshToken
  }
}
```

在 HTTP HEADERS 中添加（所有 mutation 都需要）：

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

### 2. 准备测试数据

先创建一些分类和标签：

```graphql
# 创建分类
mutation {
  createCategory(data: {
    name: "技术博客"
    slug: "tech-blog"
    description: "技术相关文章"
    color: "#3B82F6"
  }) {
    id
    name
  }
}

# 创建标签
mutation {
  t1: createTag(data: { name: "JavaScript", slug: "javascript", color: "#F7DF1E" }) { id name }
  t2: createTag(data: { name: "NestJS", slug: "nestjs", color: "#E0234E" }) { id name }
  t3: createTag(data: { name: "GraphQL", slug: "graphql", color: "#E10098" }) { id name }
}
```

**记录返回的 ID，后面会用到！**

---

## 🚀 核心功能测试

### 1. 创建完整的文章（包含所有字段）

```graphql
mutation {
  createPost(data: {
    title: "NestJS + GraphQL + Prisma 完整教程"
    slug: "nestjs-graphql-prisma-tutorial"
    excerpt: "这是一篇关于如何使用 NestJS、GraphQL 和 Prisma 构建现代 Web API 的完整指南。"
    content: "# 第一章：入门\n\n本教程将带你从零开始构建一个完整的 GraphQL API...\n\n## 环境准备\n\n首先安装 NestJS CLI..."
    status: DRAFT
    categoryId: "分类ID"
    tagIds: ["标签1的ID", "标签2的ID", "标签3的ID"]
    meta: {
      metaTitle: "NestJS + GraphQL + Prisma 完整教程 - 从零到生产"
      metaDescription: "学习如何使用 NestJS、GraphQL 和 Prisma 构建可扩展的现代 Web API，包含完整示例代码和最佳实践。"
      metaKeywords: "NestJS, GraphQL, Prisma, TypeScript, API"
      ogTitle: "NestJS + GraphQL + Prisma 完整教程"
      ogDescription: "从零开始构建现代 Web API"
      ogImage: "https://example.com/images/tutorial-cover.jpg"
      twitterCard: "summary_large_image"
      twitterTitle: "NestJS + GraphQL + Prisma 完整教程"
      twitterDescription: "从零开始构建现代 Web API"
      twitterImage: "https://example.com/images/tutorial-cover.jpg"
    }
  }) {
    id
    title
    slug
    excerpt
    status
    publishedAt
    author { id firstname }
    category { id name }
    tags { id name color }
    meta {
      metaTitle
      metaDescription
      ogImage
    }
    createdAt
  }
}
```

**结果：** 返回创建的文章，包含所有关联数据。

---

### 2. 查询文章（包含所有关系）

```graphql
query {
  post(postId: "文章ID") {
    id
    title
    slug
    excerpt
    content
    status
    published
    publishedAt
    viewCount

    # 关系字段（延迟加载）
    author {
      id
      firstname
      lastname
      email
    }

    category {
      id
      name
      slug
      color
    }

    tags {
      id
      name
      slug
      color
    }

    meta {
      metaTitle
      metaDescription
      metaKeywords
      canonicalUrl
      ogTitle
      ogDescription
      ogImage
      twitterCard
      twitterTitle
      twitterDescription
      twitterImage
    }

    createdAt
    updatedAt
  }
}
```

---

### 3. 根据 slug 查询文章

```graphql
query {
  postBySlug(slug: "nestjs-graphql-prisma-tutorial") {
    id
    title
    status
    category { name }
    tags { name }
  }
}
```

**用途：** 前端通过 URL 友好的 slug 获取文章内容。

---

### 4. 更新文章（部分更新）

```graphql
mutation {
  updatePost(
    postId: "文章ID"
    data: {
      title: "NestJS + GraphQL + Prisma 完整教程（2025 版）"
      excerpt: "更新后的摘要内容"
      status: PUBLISHED
      tagIds: ["新标签1", "新标签2"]  # 会替换所有现有标签
      meta: {
        metaTitle: "更新后的 SEO 标题"
      }
    }
  ) {
    id
    title
    status
    publishedAt  # 状态改为 PUBLISHED 时自动设置
    tags { name }
    meta { metaTitle }
  }
}
```

**注意：**
- `tagIds` 会替换所有现有标签，不是追加
- 状态改为 `PUBLISHED` 时，`published` 字段自动设为 `true`
- 首次发布时，`publishedAt` 会自动设置为当前时间

---

### 5. 查询所有文章（管理员用）

```graphql
query {
  allPosts(
    first: 10
    status: DRAFT  # 可选：只查询草稿
  ) {
    edges {
      node {
        id
        title
        slug
        status
        publishedAt
        author { firstname }
        category { name }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**支持的参数：**
- `first` / `last` - 分页数量
- `after` / `before` - 游标分页
- `query` - 标题搜索
- `status` - 按状态过滤（DRAFT, PUBLISHED, SCHEDULED, ARCHIVED, TRASH）
- `orderBy` - 排序

---

### 6. 查询已发布文章（公开访问）

```graphql
query {
  publishedPosts(first: 10) {
    edges {
      node {
        id
        title
        slug
        excerpt
        publishedAt
        author { firstname }
        category { name }
        tags { name color }
      }
    }
    totalCount
  }
}
```

**注意：** 这个查询不需要认证，用于前端展示。

---

## 🔍 完整工作流示例

### 场景：发布一篇博客文章

**步骤 1：创建草稿**

```graphql
mutation {
  createPost(data: {
    title: "我的第一篇博客"
    content: "这是正文内容..."
    status: DRAFT
    categoryId: "分类ID"
  }) {
    id
    status
  }
}
```

**步骤 2：添加 SEO 信息**

```graphql
mutation {
  updatePost(
    postId: "文章ID"
    data: {
      slug: "my-first-blog-post"
      excerpt: "这是我的第一篇博客，讲述了..."
      meta: {
        metaTitle: "我的第一篇博客 - 个人网站"
        metaDescription: "这是一篇关于...的文章"
      }
    }
  ) {
    id
    slug
    meta { metaTitle }
  }
}
```

**步骤 3：添加标签**

```graphql
mutation {
  updatePost(
    postId: "文章ID"
    data: {
      tagIds: ["标签1", "标签2"]
    }
  ) {
    id
    tags { name }
  }
}
```

**步骤 4：发布文章**

```graphql
mutation {
  updatePost(
    postId: "文章ID"
    data: {
      status: PUBLISHED
    }
  ) {
    id
    status
    published
    publishedAt  # 自动设置
  }
}
```

**步骤 5：在前端显示**

```graphql
query {
  postBySlug(slug: "my-first-blog-post") {
    title
    excerpt
    content
    publishedAt
    author { firstname }
    category { name color }
    tags { name color }
    meta {
      metaTitle
      metaDescription
      ogImage
    }
  }
}
```

---

## 📊 字段解析（ResolveField）说明

以下字段是**延迟加载**的，只有在 GraphQL 查询中显式请求时才会执行数据库查询：

- `author` - 文章作者
- `category` - 所属分类
- `tags` - 关联的标签（通过 PostTag 中间表）
- `meta` - SEO 元数据

**好处：** 避免 N+1 查询问题，提高性能。

---

## 🎯 核心功能讲解

### 1. 文章状态管理

```typescript
enum PostStatus {
  DRAFT       // 草稿 - 仅作者可见
  PUBLISHED   // 已发布 - 公开可见
  SCHEDULED   // 定时发布 - 等待发布时间
  ARCHIVED    // 已归档 - 不再显示
  TRASH       // 回收站 - 准备删除
}
```

### 2. 自动计数更新

当文章的分类或标签改变时，系统会自动更新：
- `Category.postCount` - 该分类下的文章数
- `Tag.postCount` - 该标签下的文章数

### 3. SEO 最佳实践

- `metaTitle`: 60-70 字符
- `metaDescription`: 150-160 字符
- `ogTitle`: 95 字符以内
- `ogDescription`: 200 字符以内

### 4. Slug 自动生成

如果创建文章时不提供 `slug`，Prisma 会自动生成一个 cuid。建议手动提供 SEO 友好的 slug。

---

## ⚠️ 常见错误

### 错误 1：分类 ID 不存在

**提示：** Foreign key constraint failed

**原因：** 提供的 `categoryId` 在数据库中不存在

**解决：** 先创建分类，或使用正确的 ID

### 错误 2：标签 ID 不存在

**提示：** Foreign key constraint failed on the field: `tag`

**原因：** `tagIds` 中包含无效的标签 ID

**解决：** 确保所有标签 ID 都存在

### 错误 3：slug 重复

**提示：** Unique constraint failed on the fields: (`slug`)

**原因：** 已有文章使用了相同的 slug

**解决：** 使用不同的 slug

---

## 🎓 数据库关系说明

### Post ↔ Category（多对一）

```
多篇文章 → 一个分类
Post.categoryId → Category.id
```

### Post ↔ Tag（多对多）

```
Post ← PostTag → Tag
通过中间表 PostTag 实现多对多关系
```

### Post ↔ PostMeta（一对一）

```
一篇文章 → 一条 SEO 元数据
Post.id ← PostMeta.postId（unique）
```

---

## 🎯 下一步：第六步

现在你已经完成了完整的内容管理功能！

**已完成的功能：**
- ✅ 用户认证和授权
- ✅ 文章 CRUD 操作
- ✅ 分类系统（树形结构）
- ✅ 标签系统（多对多）
- ✅ SEO 元数据
- ✅ 文章状态管理

**下一步计划：**
- 📁 媒体库（文件上传）
- 💬 评论系统
- 📝 版本历史
- 🔄 工作流审批

---

现在去试试吧！创建一篇完整的博客文章，包含分类、标签和 SEO 信息。

**提示：** 使用 Apollo Sandbox 的智能补全功能可以更方便地编写查询！
