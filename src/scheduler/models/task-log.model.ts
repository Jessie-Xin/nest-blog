import { Field, ObjectType, Int, GraphQLISODateTime } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';
import { TaskStatus } from './task-status.enum';
import { GraphQLJSON } from 'graphql-scalars';
import { Prisma } from '@prisma/client';

/**
 * 任務執行日誌模型
 */
@ObjectType({ description: '任務執行日誌' })
export class TaskLog extends BaseModel {
  @Field(() => String, { description: '任務名稱' })
  taskName: string;

  @Field(() => String, { description: '任務類型（cron、manual、system）' })
  taskType: string;

  @Field(() => TaskStatus, { description: '任務狀態' })
  status: TaskStatus;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: '任務開始時間',
  })
  startedAt?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: '任務完成時間',
  })
  completedAt?: Date;

  @Field(() => Int, { nullable: true, description: '執行時長（毫秒）' })
  duration?: number;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: '執行結果（成功處理的數量等）',
  })
  result?: Prisma.JsonValue;

  @Field(() => String, { nullable: true, description: '錯誤信息' })
  error?: string;

  @Field(() => String, {
    nullable: true,
    description: '觸發方式（cron、manual、system）',
  })
  triggeredBy?: string;

  @Field(() => String, {
    nullable: true,
    description: '手動觸發的用戶 ID',
  })
  userId?: string;
}
