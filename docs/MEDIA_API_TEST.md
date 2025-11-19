# 媒体库系统 API 测试指南

## 🎉 第六步完成！

恭喜你完成了媒体库系统的实现！现在可以上传图片、视频、音频、文档等文件。

---

## 📊 功能清单

### ✅ 已实现的功能

**文件上传：**
- ✅ 支持图片（JPEG、PNG、GIF、WebP）
- ✅ 支持视频（MP4、MPEG）
- ✅ 支持音频（MP3、MPEG）
- ✅ 支持文档（PDF、Word）
- ✅ 文件大小限制：10MB

**图片处理：**
- ✅ 自动生成缩略图（300x300）
- ✅ 自动提取图片尺寸
- ✅ 图片元数据保存

**媒体管理：**
- ✅ 查询所有媒体
- ✅ 按类型过滤
- ✅ 按上传者过滤
- ✅ 更新媒体信息
- ✅ 删除媒体文件
- ✅ 媒体统计信息

---

## 🚀 快速开始

### 1. 启动服务器

```bash
npm run start:dev
```

服务器地址：
- GraphQL API: http://localhost:3002/graphql
- REST API: http://localhost:3002/media/upload
- 文件访问: http://localhost:3002/uploads/

---

## 📤 文件上传（REST API）

### 使用 cURL 上传

```bash
# 1. 先登录获取 token
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(data: {email: \"admin@example.com\", password: \"password\"}) { accessToken } }"}'

# 2. 上传文件（替换 YOUR_TOKEN 为上一步获取的 token）
curl -X POST http://localhost:3002/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/image.jpg" \
  -F "title=我的第一张图片" \
  -F "description=这是一张测试图片" \
  -F "altText=测试图片"
```

### 使用 Postman 上传

1. **创建新请求**
   - Method: POST
   - URL: http://localhost:3002/media/upload

2. **设置 Headers**
   ```
   Authorization: Bearer YOUR_ACCESS_TOKEN
   ```

3. **设置 Body**
   - 选择 form-data
   - 添加以下字段：
     - `file`: 选择文件（必填）
     - `title`: 文件标题（可选）
     - `description`: 文件描述（可选）
     - `altText`: 图片 alt 文本（可选）

4. **发送请求**

**响应示例：**
```json
{
  "id": "clxxx",
  "filename": "image.jpg",
  "title": "我的第一张图片",
  "description": "这是一张测试图片",
  "altText": "测试图片",
  "type": "IMAGE",
  "mimeType": "image/jpeg",
  "size": 245678,
  "path": "uploads/1234567890-123456789.jpg",
  "url": "/uploads/1234567890-123456789.jpg",
  "width": 1920,
  "height": 1080,
  "thumbnailUrl": "/uploads/thumbnails/thumb_1234567890-123456789.jpg",
  "uploaderId": "user_id",
  "uploader": {
    "id": "user_id",
    "email": "admin@example.com",
    "firstname": "Admin"
  },
  "createdAt": "2025-11-19T...",
  "updatedAt": "2025-11-19T..."
}
```

---

## 🔍 查询媒体（GraphQL API）

访问：http://localhost:3002/graphql

### 1. 查询所有媒体文件

```graphql
query {
  mediaFiles {
    id
    filename
    title
    type
    url
    thumbnailUrl
    size
    width
    height
    uploader {
      firstname
      email
    }
    createdAt
  }
}
```

### 2. 只查询我上传的图片

```graphql
query {
  mediaFiles(type: IMAGE, onlyMine: true) {
    id
    filename
    title
    url
    thumbnailUrl
    width
    height
  }
}
```

### 3. 查询单个媒体文件

```graphql
query {
  media(mediaId: "clxxx") {
    id
    filename
    title
    description
    altText
    type
    mimeType
    size
    url
    thumbnailUrl
    width
    height
    uploader {
      firstname
      email
    }
    metadata
    createdAt
    updatedAt
  }
}
```

### 4. 查询媒体统计

```graphql
query {
  myMediaStats {
    totalCount
    totalSize
    typeBreakdown {
      type
      count
    }
  }
}
```

**响应示例：**
```json
{
  "data": {
    "myMediaStats": {
      "totalCount": 15,
      "totalSize": 12345678,
      "typeBreakdown": [
        { "type": "IMAGE", "count": 10 },
        { "type": "VIDEO", "count": 3 },
        { "type": "DOCUMENT", "count": 2 }
      ]
    }
  }
}
```

---

## ✏️ 更新媒体信息

```graphql
mutation {
  updateMedia(
    mediaId: "clxxx"
    data: {
      title: "更新后的标题"
      description: "更新后的描述"
      altText: "更新后的 alt 文本"
    }
  ) {
    id
    title
    description
    altText
  }
}
```

---

## 🗑️ 删除媒体文件

```graphql
mutation {
  deleteMedia(mediaId: "clxxx") {
    id
    filename
  }
}
```

**注意：** 删除媒体会同时删除：
1. 数据库记录
2. 原始文件
3. 缩略图（如果有）

---

## 🖼️ 在前端中使用图片

### 1. 获取图片列表

```graphql
query {
  mediaFiles(type: IMAGE) {
    id
    url
    thumbnailUrl
    title
    altText
  }
}
```

### 2. 在 HTML 中显示

```html
<!-- 原图 -->
<img src="http://localhost:3002{{url}}" alt="{{altText}}" />

<!-- 缩略图 -->
<img src="http://localhost:3002{{thumbnailUrl}}" alt="{{altText}}" />
```

### 3. 在文章中使用

```graphql
mutation {
  createPost(data: {
    title: "带图片的文章"
    content: "![图片描述](http://localhost:3002/uploads/xxx.jpg)"
    # ... 其他字段
  }) {
    id
    title
  }
}
```

---

## 📋 支持的文件类型

| 类型 | MIME 类型 | 扩展名 | 最大大小 |
|-----|----------|--------|---------|
| 图片 | image/jpeg, image/png, image/gif, image/webp | .jpg, .png, .gif, .webp | 10MB |
| 视频 | video/mp4, video/mpeg | .mp4, .mpeg | 10MB |
| 音频 | audio/mpeg, audio/mp3 | .mp3, .mpeg | 10MB |
| 文档 | application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document | .pdf, .doc, .docx | 10MB |

---

## 🎯 实际应用场景

### 场景 1：博客文章配图

```graphql
# 1. 上传图片（REST API）
POST /media/upload
# 返回图片 URL

# 2. 创建文章时使用图片
mutation {
  createPost(data: {
    title: "我的博客文章"
    content: "文章内容...\n\n![配图](/uploads/xxx.jpg)"
    # ... 其他字段
  }) {
    id
  }
}
```

### 场景 2：用户头像上传

```graphql
# 1. 上传头像（REST API）
POST /media/upload
# 返回头像 URL

# 2. 更新用户信息
mutation {
  updateUser(data: {
    avatarUrl: "/uploads/xxx.jpg"
  }) {
    id
    avatarUrl
  }
}
```

### 场景 3：媒体库管理

```graphql
# 查询所有图片，按时间倒序
query {
  mediaFiles(type: IMAGE) {
    id
    filename
    thumbnailUrl
    size
    createdAt
  }
}

# 在后台管理界面显示缩略图网格
# 点击可查看详情、更新信息、删除
```

---

## ⚠️ 注意事项

### 1. 文件大小限制

默认限制为 10MB，可以在 `media.controller.ts` 中修改：

```typescript
limits: {
  fileSize: 20 * 1024 * 1024, // 改为 20MB
}
```

### 2. 支持的文件类型

如需添加更多文件类型，修改 `allowedMimes` 数组：

```typescript
const allowedMimes = [
  'image/jpeg',
  'image/png',
  // 添加更多 MIME 类型...
];
```

### 3. 上传目录权限

确保 `uploads/` 目录有写权限：

```bash
chmod 755 uploads
chmod 755 uploads/thumbnails
```

### 4. 生产环境建议

在生产环境中，建议：
- 使用 CDN 加速文件访问
- 使用云存储（AWS S3、阿里云 OSS 等）
- 添加图片压缩
- 添加水印功能
- 实现文件去重

---

## 🎓 数据库结构

### Media 表

```prisma
model Media {
  id           String    @id @default(cuid())
  filename     String    // 原始文件名
  title        String?   // 媒体标题
  description  String?   // 媒体描述
  altText      String?   // 图片 alt 文本
  type         MediaType // 媒体类型枚举
  mimeType     String    // MIME 类型
  size         Int       // 文件大小（字节）
  path         String    // 文件存储路径
  url          String    // 访问 URL
  width        Int?      // 图片宽度
  height       Int?      // 图片高度
  thumbnailUrl String?   // 缩略图 URL
  uploaderId   String    // 上传者 ID
  uploader     User      // 上传者关系
  metadata     Json?     // 额外元数据
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

---

## 🚀 下一步扩展

可以继续添加的功能：
1. **云存储** - AWS S3 / 阿里云 OSS 集成
2. **图片编辑** - 裁剪、旋转、滤镜
3. **视频处理** - 转码、截图、水印
4. **文件夹管理** - 组织媒体文件
5. **批量上传** - 一次上传多个文件
6. **文件去重** - 检测重复文件
7. **CDN 集成** - 加速文件访问
8. **权限控制** - 私有文件访问控制

---

## 🎉 恭喜！

你现在拥有了完整的媒体库系统：
- ✅ 文件上传
- ✅ 图片自动处理
- ✅ 缩略图生成
- ✅ 媒体管理
- ✅ GraphQL 查询
- ✅ REST API 上传

开始上传你的第一个文件吧！🚀
