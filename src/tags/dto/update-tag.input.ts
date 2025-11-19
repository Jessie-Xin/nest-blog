import { InputType, PartialType } from '@nestjs/graphql';
import { CreateTagInput } from './create-tag.input';

/**
 * 更新标签的输入数据
 * 继承自 CreateTagInput，所有字段都是可选的
 */
@InputType()
export class UpdateTagInput extends PartialType(CreateTagInput) {}
