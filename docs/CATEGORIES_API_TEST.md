# Categories API 测试指南

现在你可以在 GraphQL Playground 中测试分类功能了！

访问：http://localhost:3002/graphql

## 📝 测试步骤

### 1. 创建顶级分类

```graphql
mutation {
  createCategory(data: {
    name: "技术"
    slug: "tech"
    description: "技术相关文章"
    color: "#3B82F6"
    icon: "fa-code"
    order: 0
  }) {
    id
    name
    slug
    description
    color
    icon
    order
    createdAt
    updatedAt
  }
}
```

**注意：** 创建分类需要登录！你需要先执行登录 mutation 获取 token，然后在 HTTP HEADERS 中添加：

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

### 2. 获取登录 Token

首先登录获取访问令牌：

```graphql
mutation {
  login(email: "你的邮箱", password: "你的密码") {
    accessToken
    refreshToken
  }
}
```

### 3. 创建子分类

```graphql
mutation {
  createCategory(data: {
    name: "前端开发"
    slug: "frontend"
    description: "前端技术文章"
    color: "#10B981"
    icon: "fa-desktop"
    parentId: "技术分类的ID"  # 使用步骤1返回的 id
  }) {
    id
    name
    slug
    parent {
      id
      name
    }
  }
}
```

### 4. 查询所有分类

```graphql
query {
  categories {
    id
    name
    slug
    description
    color
    icon
    order
    postCount
  }
}
```

### 5. 查询顶级分类（树形结构）

```graphql
query {
  topLevelCategories {
    id
    name
    slug
    children {
      id
      name
      slug
      children {
        id
        name
        slug
      }
    }
  }
}
```

### 6. 根据 slug 查询单个分类

```graphql
query {
  categoryBySlug(slug: "frontend") {
    id
    name
    description
    parent {
      id
      name
    }
    children {
      id
      name
    }
    posts {
      id
      title
    }
    postCount
  }
}
```

### 7. 获取面包屑导航

```graphql
query {
  categoryAncestors(id: "分类ID") {
    id
    name
    slug
  }
}
```

### 8. 更新分类

```graphql
mutation {
  updateCategory(
    id: "分类ID"
    data: {
      name: "前端技术"
      color: "#8B5CF6"
    }
  ) {
    id
    name
    color
    updatedAt
  }
}
```

### 9. 删除分类

```graphql
mutation {
  deleteCategory(id: "分类ID") {
    id
    name
  }
}
```

**注意：** 删除前需要确保：
- 没有子分类
- 没有关联的文章

---

## 🎯 GraphQL 特性展示

### 按需加载（只请求需要的字段）

```graphql
query {
  categories {
    name
    slug
  }
}
```

### 深度嵌套查询

```graphql
query {
  category(id: "分类ID") {
    name
    parent {
      name
      parent {
        name
      }
    }
    children {
      name
      children {
        name
      }
    }
    posts {
      title
      author {
        firstname
        lastname
      }
    }
  }
}
```

### 多个查询并行

```graphql
query {
  allCategories: categories {
    id
    name
  }

  topLevel: topLevelCategories {
    id
    name
    children {
      name
    }
  }

  techCategory: categoryBySlug(slug: "tech") {
    name
    postCount
  }
}
```

---

## 🔧 故障排查

### 错误 1：Unauthorized
**原因：** 未登录或 token 过期
**解决：** 重新登录获取 token，添加到 HTTP HEADERS

### 错误 2：Slug 已被使用
**原因：** slug 必须唯一
**解决：** 使用不同的 slug

### 错误 3：父分类不存在
**原因：** parentId 指向的分类不存在
**解决：** 检查 parentId 是否正确

### 错误 4：无法删除分类
**原因：** 有子分类或关联文章
**解决：** 先删除子分类或移除文章关联

---

## 🎓 学习要点

### 1. 树形结构的查询
注意 `parent` 和 `children` 字段是**延迟加载**的，只有在查询中明确请求时才会加载。

### 2. 验证机制
创建和更新时会自动验证：
- slug 唯一性
- 父分类存在性
- 循环引用检测

### 3. 级联策略
删除分类时，Post 的 categoryId 会自动设为 null（不会删除文章）

---

现在去 http://localhost:3002/graphql 试试吧！
