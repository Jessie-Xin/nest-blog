# 标签系统 API 测试指南

## 🎯 第四步完成！

恭喜你完成了标签系统的实现！现在可以测试多对多关系的功能了。

访问：http://localhost:3002/graphql

---

## 📝 测试步骤

### 1. 创建标签

```graphql
mutation {
  createTag(data: {
    name: "JavaScript"
    slug: "javascript"
    description: "JavaScript 编程语言"
    color: "#F7DF1E"
  }) {
    id
    name
    slug
    description
    color
    postCount
    createdAt
  }
}
```

再创建几个标签：

```graphql
mutation {
  t1: createTag(data: {
    name: "React"
    slug: "react"
    color: "#61DAFB"
  }) { id name }

  t2: createTag(data: {
    name: "NestJS"
    slug: "nestjs"
    color: "#E0234E"
  }) { id name }

  t3: createTag(data: {
    name: "TypeScript"
    slug: "typescript"
    color: "#3178C6"
  }) { id name }
}
```

### 2. 查询所有标签

```graphql
query {
  tags {
    id
    name
    slug
    color
    postCount
  }
}
```

### 3. 为文章添加标签（多对多关系）

假设你已经有一篇文章（postId），给它添加多个标签：

```graphql
mutation {
  addTagsToPost(
    postId: "文章ID"
    tagIds: ["标签1的ID", "标签2的ID", "标签3的ID"]
  ) {
    id
    name
    slug
  }
}
```

**示例：**
```graphql
mutation {
  addTagsToPost(
    postId: "clxxx"
    tagIds: ["t1_id", "t2_id", "t3_id"]
  ) {
    id
    name
  }
}
```

### 4. 查询标签下的所有文章

```graphql
query {
  tag(id: "标签ID") {
    name
    postCount
    posts {
      id
      title
      published
    }
  }
}
```

### 5. 查询文章的所有标签

先更新 Post Resolver 添加 tags 字段解析（下一步会做），然后：

```graphql
query {
  post(id: "文章ID") {
    title
    tags {
      id
      name
      color
    }
  }
}
```

### 6. 替换文章的所有标签

```graphql
mutation {
  setPostTags(
    postId: "文章ID"
    tagIds: ["新标签1", "新标签2"]
  ) {
    id
    name
  }
}
```

### 7. 移除文章的某些标签

```graphql
mutation {
  removeTagsFromPost(
    postId: "文章ID"
    tagIds: ["要移除的标签ID"]
  ) {
    id
    name
  }
}
```

### 8. 更新标签

```graphql
mutation {
  updateTag(
    id: "标签ID"
    data: {
      name: "JavaScript/ES6+"
      color: "#FFD700"
    }
  ) {
    id
    name
    color
    updatedAt
  }
}
```

### 9. 删除标签

```graphql
mutation {
  deleteTag(id: "标签ID") {
    id
    name
  }
}
```

**注意：** 删除标签前需要移除所有文章关联。

---

## 🔍 多对多关系理解

### 数据流程示例

**场景：** 给文章添加 3 个标签

```
1. 用户操作：
   addTagsToPost(postId: "p1", tagIds: ["t1", "t2", "t3"])

2. 数据库操作：
   INSERT INTO PostTag (postId, tagId) VALUES
     ('p1', 't1'),
     ('p1', 't2'),
     ('p1', 't3');

3. 结果：
   PostTag 表：
   | id  | postId | tagId |
   |-----|--------|-------|
   | pt1 | p1     | t1    |
   | pt2 | p1     | t2    |
   | pt3 | p1     | t3    |
```

### 查询示例

**查询文章的标签：**
```sql
SELECT Tag.*
FROM Tag
JOIN PostTag ON Tag.id = PostTag.tagId
WHERE PostTag.postId = 'p1';
```

**查询标签的文章：**
```sql
SELECT Post.*
FROM Post
JOIN PostTag ON Post.id = PostTag.postId
WHERE PostTag.tagId = 't1';
```

---

## 🎓 核心功能讲解

### 1. 批量添加（skipDuplicates）

```typescript
await this.prisma.postTag.createMany({
  data: tagIds.map(tagId => ({ postId, tagId })),
  skipDuplicates: true,  // ← 跳过重复，不会报错
});
```

**作用：** 如果文章已经有某个标签，不会重复添加

### 2. 级联删除（onDelete: Cascade）

```prisma
post Post @relation(..., onDelete: Cascade)
```

**效果：**
- 删除文章 → 自动删除 PostTag 中的关联记录
- 删除标签 → 自动删除 PostTag 中的关联记录

### 3. 组合唯一约束

```prisma
@@unique([postId, tagId])
```

**效果：** 数据库层面防止重复关联

### 4. 双向查询

**从文章查标签：**
```typescript
const postTags = await prisma.postTag.findMany({
  where: { postId },
  include: { tag: true }
});
```

**从标签查文章：**
```typescript
const postTags = await prisma.postTag.findMany({
  where: { tagId },
  include: { post: true }
});
```

---

## ⚠️ 常见错误

### 错误 1：重复添加标签
**提示：** Unique constraint failed on PostTag
**原因：** 试图给同一篇文章添加同一个标签两次
**解决：** 使用 `skipDuplicates: true`

### 错误 2：无法删除标签
**提示：** 无法删除该标签，因为它有 X 篇关联文章
**原因：** 标签还被文章使用
**解决：** 先移除所有文章关联，或强制删除（会级联删除关联）

### 错误 3：标签 ID 不存在
**提示：** 部分标签 ID 不存在
**原因：** tagIds 中包含无效 ID
**解决：** 检查 tagIds 是否正确

---

## 🎯 下一步：更新 Post Resolver

为了完整支持标签功能，还需要更新 PostsResolver，添加：

1. 创建文章时指定标签
2. 更新文章时修改标签
3. 查询文章时包含标签

这将在第五步（扩展 Post 模型）中完成。

---

现在去试试吧！创建几个标签，然后给文章添加标签关联。

**提示：** 记得先登录获取 token，然后在 HTTP HEADERS 中添加：
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```
