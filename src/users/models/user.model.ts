import 'reflect-metadata';
import { ObjectType, HideField, Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import { Post } from '../../posts/models/post.model';
import { BaseModel } from '../../common/models/base.model';
import { SystemRole } from '../../permissions/models/system-role.model';
import { Permission } from '../../permissions/models/permission.model';

/**
 * 用户模型
 * 继承自基础模型，包含用户的基本信息和关联的文章
 */
@ObjectType()
export class User extends BaseModel {
  /**
   * 用户邮箱
   * 需要是一个有效的邮箱地址
   */
  @Field()
  @IsEmail()
  email: string;

  /**
   * 用户名
   * 可选字段，包含用户名字
   */
  @Field(() => String, { nullable: true })
  firstname?: string;

  /**
   * 用户姓
   * 可选字段，包含用户姓氏
   */
  @Field(() => String, { nullable: true })
  lastname?: string;

  /**
   * 用户文章
   * 与该用户关联的文章列表，可能为空
   */
  @Field(() => [Post], { nullable: true })
  posts?: [Post] | null;

  /**
   * 用户角色列表
   * 用户被分配的所有角色
   */
  @Field(() => [SystemRole], { nullable: true, description: '用户的角色列表' })
  roles?: SystemRole[];

  /**
   * 用户权限列表
   * 从用户所有角色聚合而来的权限列表
   */
  @Field(() => [Permission], {
    nullable: true,
    description: '用户的所有权限（从角色聚合）',
  })
  permissions?: Permission[];

  /**
   * 用户密码
   * 在 GraphQL 响应中隐藏该字段
   */
  @HideField()
  password: string;
}
