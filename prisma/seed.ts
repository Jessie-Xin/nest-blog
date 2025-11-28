import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清理现有数据
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.post.deleteMany();
  await prisma.systemRole.deleteMany();
  await prisma.permission.deleteMany();

  console.log('开始种子数据填充...');

  // ============================================
  // 1. 创建权限（Permission）
  // ============================================
  console.log('创建权限...');

  // 文章相关权限
  const postCreate = await prisma.permission.create({
    data: {
      name: '创建文章',
      code: 'post:create',
      resource: 'post',
      action: 'create',
      description: '创建新文章的权限',
      isSystem: true,
    },
  });

  const postRead = await prisma.permission.create({
    data: {
      name: '查看文章',
      code: 'post:read',
      resource: 'post',
      action: 'read',
      description: '查看文章的权限',
      isSystem: true,
    },
  });

  const postUpdate = await prisma.permission.create({
    data: {
      name: '更新文章',
      code: 'post:update',
      resource: 'post',
      action: 'update',
      description: '更新文章的权限',
      isSystem: true,
    },
  });

  const postDelete = await prisma.permission.create({
    data: {
      name: '删除文章',
      code: 'post:delete',
      resource: 'post',
      action: 'delete',
      description: '删除文章的权限',
      isSystem: true,
    },
  });

  const postPublish = await prisma.permission.create({
    data: {
      name: '发布文章',
      code: 'post:publish',
      resource: 'post',
      action: 'publish',
      description: '发布文章的权限',
      isSystem: true,
    },
  });

  // 用户管理权限
  const userCreate = await prisma.permission.create({
    data: {
      name: '创建用户',
      code: 'user:create',
      resource: 'user',
      action: 'create',
      description: '创建新用户的权限',
      isSystem: true,
    },
  });

  const userRead = await prisma.permission.create({
    data: {
      name: '查看用户',
      code: 'user:read',
      resource: 'user',
      action: 'read',
      description: '查看用户信息的权限',
      isSystem: true,
    },
  });

  const userUpdate = await prisma.permission.create({
    data: {
      name: '更新用户',
      code: 'user:update',
      resource: 'user',
      action: 'update',
      description: '更新用户信息的权限',
      isSystem: true,
    },
  });

  const userDelete = await prisma.permission.create({
    data: {
      name: '删除用户',
      code: 'user:delete',
      resource: 'user',
      action: 'delete',
      description: '删除用户的权限',
      isSystem: true,
    },
  });

  // 分类管理权限
  const categoryManage = await prisma.permission.create({
    data: {
      name: '管理分类',
      code: 'category:manage',
      resource: 'category',
      action: 'manage',
      description: '管理分类的完整权限',
      isSystem: true,
    },
  });

  // 标签管理权限
  const tagManage = await prisma.permission.create({
    data: {
      name: '管理标签',
      code: 'tag:manage',
      resource: 'tag',
      action: 'manage',
      description: '管理标签的完整权限',
      isSystem: true,
    },
  });

  // 评论管理权限
  const commentModerate = await prisma.permission.create({
    data: {
      name: '审核评论',
      code: 'comment:moderate',
      resource: 'comment',
      action: 'moderate',
      description: '审核和管理评论的权限',
      isSystem: true,
    },
  });

  // 审批权限
  const approvalReview = await prisma.permission.create({
    data: {
      name: '审批文章',
      code: 'approval:review',
      resource: 'approval',
      action: 'review',
      description: '审批文章发布请求的权限',
      isSystem: true,
    },
  });

  // 系统管理权限
  const systemManage = await prisma.permission.create({
    data: {
      name: '系统管理',
      code: 'system:manage',
      resource: 'system',
      action: 'manage',
      description: '系统管理的完整权限',
      isSystem: true,
    },
  });

  const roleManage = await prisma.permission.create({
    data: {
      name: '角色管理',
      code: 'role:manage',
      resource: 'role',
      action: 'manage',
      description: '管理角色和权限的权限',
      isSystem: true,
    },
  });

  console.log(`✅ 创建了 ${await prisma.permission.count()} 个权限`);

  // ============================================
  // 2. 创建角色（SystemRole）
  // ============================================
  console.log('创建角色...');

  // 超级管理员角色
  const adminRole = await prisma.systemRole.create({
    data: {
      name: '超级管理员',
      code: 'admin',
      description: '拥有系统所有权限的超级管理员',
      isSystem: true,
      isActive: true,
      priority: 100,
    },
  });

  // 编辑角色
  const editorRole = await prisma.systemRole.create({
    data: {
      name: '编辑',
      code: 'editor',
      description: '可以管理内容但无系统管理权限的编辑',
      isSystem: true,
      isActive: true,
      priority: 50,
    },
  });

  // 作者角色
  const authorRole = await prisma.systemRole.create({
    data: {
      name: '作者',
      code: 'author',
      description: '可以创建和管理自己文章的作者',
      isSystem: true,
      isActive: true,
      priority: 30,
    },
  });

  // 普通用户角色
  const userRole = await prisma.systemRole.create({
    data: {
      name: '普通用户',
      code: 'user',
      description: '基本的用户权限',
      isSystem: true,
      isActive: true,
      priority: 10,
    },
  });

  console.log(`✅ 创建了 ${await prisma.systemRole.count()} 个角色`);

  // ============================================
  // 3. 为角色分配权限（RolePermission）
  // ============================================
  console.log('为角色分配权限...');

  // 超级管理员 - 拥有所有权限
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // 编辑 - 内容管理权限
  await prisma.rolePermission.createMany({
    data: [
      { roleId: editorRole.id, permissionId: postCreate.id },
      { roleId: editorRole.id, permissionId: postRead.id },
      { roleId: editorRole.id, permissionId: postUpdate.id },
      { roleId: editorRole.id, permissionId: postDelete.id },
      { roleId: editorRole.id, permissionId: postPublish.id },
      { roleId: editorRole.id, permissionId: categoryManage.id },
      { roleId: editorRole.id, permissionId: tagManage.id },
      { roleId: editorRole.id, permissionId: commentModerate.id },
      { roleId: editorRole.id, permissionId: approvalReview.id },
    ],
  });

  // 作者 - 文章创建和编辑权限
  await prisma.rolePermission.createMany({
    data: [
      { roleId: authorRole.id, permissionId: postCreate.id },
      { roleId: authorRole.id, permissionId: postRead.id },
      { roleId: authorRole.id, permissionId: postUpdate.id },
    ],
  });

  // 普通用户 - 基本阅读权限
  await prisma.rolePermission.createMany({
    data: [{ roleId: userRole.id, permissionId: postRead.id }],
  });

  console.log(`✅ 分配了 ${await prisma.rolePermission.count()} 个角色-权限关系`);

  // ============================================
  // 4. 创建用户（User）
  // ============================================
  console.log('创建用户...');

  const user1 = await prisma.user.create({
    data: {
      email: 'lisa@simpson.com',
      firstname: 'Lisa',
      lastname: 'Simpson',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // secret42
      posts: {
        create: {
          title: 'Join us for Prisma Day 2019 in Berlin',
          content: 'https://www.prisma.io/day/',
          published: true,
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bart@simpson.com',
      firstname: 'Bart',
      lastname: 'Simpson',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // secret42
      posts: {
        create: [
          {
            title: 'Subscribe to GraphQL Weekly for community news',
            content: 'https://graphqlweekly.com/',
            published: true,
          },
          {
            title: 'Follow Prisma on Twitter',
            content: 'https://twitter.com/prisma',
            published: false,
          },
        ],
      },
    },
  });

  console.log(`✅ 创建了 ${await prisma.user.count()} 个用户`);

  // ============================================
  // 5. 为用户分配角色（UserRole）
  // ============================================
  console.log('为用户分配角色...');

  // Bart - 超级管理员
  await prisma.userRole.create({
    data: {
      userId: user2.id,
      roleId: adminRole.id,
    },
  });

  // Lisa - 普通用户 + 作者
  await prisma.userRole.createMany({
    data: [
      {
        userId: user1.id,
        roleId: userRole.id,
      },
      {
        userId: user1.id,
        roleId: authorRole.id,
      },
    ],
  });

  console.log(`✅ 分配了 ${await prisma.userRole.count()} 个用户-角色关系`);

  // ============================================
  // 总结
  // ============================================
  console.log('\n========================================');
  console.log('✅ 种子数据填充完成！');
  console.log('========================================');
  console.log(`权限数量: ${await prisma.permission.count()}`);
  console.log(`角色数量: ${await prisma.systemRole.count()}`);
  console.log(`用户数量: ${await prisma.user.count()}`);
  console.log(`文章数量: ${await prisma.post.count()}`);
  console.log('========================================');
  console.log('\n用户账号:');
  console.log('  Bart Simpson (bart@simpson.com) - 超级管理员');
  console.log('  Lisa Simpson (lisa@simpson.com) - 普通用户 + 作者');
  console.log('  密码: secret42');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
