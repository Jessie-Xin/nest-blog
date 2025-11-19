import { registerEnumType } from '@nestjs/graphql';

/**
 * 媒体类型枚举
 */
export enum MediaType {
  IMAGE = 'IMAGE', // 图片
  VIDEO = 'VIDEO', // 视频
  AUDIO = 'AUDIO', // 音频
  DOCUMENT = 'DOCUMENT', // 文档
  OTHER = 'OTHER', // 其他
}

// 注册 GraphQL 枚举
registerEnumType(MediaType, {
  name: 'MediaType',
  description: '媒体文件类型',
  valuesMap: {
    IMAGE: {
      description: '图片文件',
    },
    VIDEO: {
      description: '视频文件',
    },
    AUDIO: {
      description: '音频文件',
    },
    DOCUMENT: {
      description: '文档文件',
    },
    OTHER: {
      description: '其他文件',
    },
  },
});
