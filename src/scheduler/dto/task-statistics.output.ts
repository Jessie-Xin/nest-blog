import { Field, ObjectType, Int } from '@nestjs/graphql';

/**
 * 任務統計信息
 */
@ObjectType({ description: '任務統計信息' })
export class TaskStatistics {
  @Field(() => Int, { description: '總任務數' })
  total: number;

  @Field(() => Int, { description: '待執行任務數' })
  pending: number;

  @Field(() => Int, { description: '執行中任務數' })
  running: number;

  @Field(() => Int, { description: '已完成任務數' })
  completed: number;

  @Field(() => Int, { description: '失敗任務數' })
  failed: number;

  @Field(() => Int, { description: '成功率（百分比）' })
  successRate: number;

  @Field(() => Int, {
    nullable: true,
    description: '平均執行時長（毫秒）',
  })
  averageDuration?: number;
}
