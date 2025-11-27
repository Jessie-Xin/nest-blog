import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { CommentStatus } from '../models/comment-status.enum';

/**
 * 更新评论状态输入
 * 仅管理员可用
 */
@InputType()
export class UpdateCommentStatusInput {
  /**
   * 评论状态
   */
  @Field(() => CommentStatus, { description: '评论状态' })
  @IsNotEmpty({ message: '评论状态不能为空' })
  status: CommentStatus;
}
