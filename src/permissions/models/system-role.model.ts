import { ObjectType, Field, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { Permission } from './permission.model';

@ObjectType()
export class SystemRole extends BaseModel {
  @Field(() => String, { description: '角色名称' })
  name: string;

  @Field(() => String, { description: '角色代码（唯一标识符）' })
  code: string;

  @Field(() => String, { nullable: true, description: '角色描述' })
  description?: string;

  @Field(() => Boolean, { description: '是否为系统角色（不可删除）' })
  isSystem: boolean;

  @Field(() => Boolean, { description: '是否启用' })
  isActive: boolean;

  @Field(() => Int, { description: '优先级（数字越大优先级越高）' })
  priority: number;

  @Field(() => [Permission], {
    nullable: true,
    description: '角色拥有的权限列表',
  })
  permissions?: Permission[];
}
