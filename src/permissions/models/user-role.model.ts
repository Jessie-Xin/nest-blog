import { ObjectType, Field } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { User } from '../../users/models/user.model';
import { SystemRole } from './system-role.model';

@ObjectType()
export class UserRole extends BaseModel {
  @Field(() => String, { description: '用户 ID' })
  userId: string;

  @Field(() => String, { description: '角色 ID' })
  roleId: string;

  @Field(() => User, { description: '用户信息' })
  user: User;

  @Field(() => SystemRole, { description: '角色信息' })
  role: SystemRole;

  @Field(() => Date, {
    nullable: true,
    description: '角色过期时间（可选，用于临时授权）',
  })
  expiresAt?: Date;

  @Field(() => String, { nullable: true, description: '分配者 ID' })
  assignedBy?: string;

  @Field(() => User, { nullable: true, description: '分配者信息' })
  assigner?: User;
}
