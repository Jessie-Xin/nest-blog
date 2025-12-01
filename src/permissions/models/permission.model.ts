import { ObjectType, Field } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';

@ObjectType()
export class Permission extends BaseModel {
  @Field(() => String, { description: '权限名称' })
  name: string;

  @Field(() => String, { description: '权限代码（唯一标识符）' })
  code: string;

  @Field(() => String, { nullable: true, description: '权限描述' })
  description?: string;

  @Field(() => String, { description: '资源类型（如：post、user、category）' })
  resource: string;

  @Field(() => String, {
    description: '操作类型（如：create、read、update、delete）',
  })
  action: string;

  @Field(() => Boolean, { description: '是否为系统权限（不可删除）' })
  isSystem: boolean;
}
