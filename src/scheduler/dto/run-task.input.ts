import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

/**
 * 手動觸發任務的輸入
 */
@InputType({ description: '手動觸發任務的輸入' })
export class RunTaskInput {
  @Field(() => String, { description: '任務名稱' })
  @IsString()
  taskName: string;

  @Field(() => String, {
    nullable: true,
    description: '任務參數（JSON 字符串）',
  })
  @IsOptional()
  @IsString()
  parameters?: string;
}
