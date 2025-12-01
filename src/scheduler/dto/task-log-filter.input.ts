import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { TaskStatus } from '../models/task-status.enum';

/**
 * 任務日誌篩選輸入
 */
@InputType({ description: '任務日誌篩選條件' })
export class TaskLogFilterInput {
  @Field(() => String, { nullable: true, description: '任務名稱' })
  @IsOptional()
  @IsString()
  taskName?: string;

  @Field(() => TaskStatus, { nullable: true, description: '任務狀態' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Field(() => String, { nullable: true, description: '觸發方式' })
  @IsOptional()
  @IsString()
  triggeredBy?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 50,
    description: '返回記錄數量（默認 50）',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: '跳過的記錄數量（默認 0）',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
