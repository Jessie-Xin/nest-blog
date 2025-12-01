import { registerEnumType } from '@nestjs/graphql';

/**
 * 任務狀態枚舉
 */
export enum TaskStatus {
  /** 待執行 */
  PENDING = 'PENDING',
  /** 執行中 */
  RUNNING = 'RUNNING',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 失敗 */
  FAILED = 'FAILED',
}

registerEnumType(TaskStatus, {
  name: 'TaskStatus',
  description: '任務狀態',
  valuesMap: {
    PENDING: {
      description: '待執行',
    },
    RUNNING: {
      description: '執行中',
    },
    COMPLETED: {
      description: '已完成',
    },
    FAILED: {
      description: '失敗',
    },
  },
});
