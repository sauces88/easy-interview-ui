import type { IPageQuery } from '@/api/interface'

export namespace IConversationMsg {

  // 查询条件
  export interface Query extends IPageQuery {
    conversationId?: string
  }

  // 消息类型定义
  export interface Message {
    id: string;
    conversation_id: string;
    bot_id?: string;
    chat_id?: string;
    meta_data?: Record<string, any>;
    role: 'user' | 'assistant';
    type: string;
    content: string;
    content_type: string;
    created_at: number;
    updated_at: number;
  }

  // 列表返回结构
  export interface ListRow {
    id?: number;
    conversationId?: string;
    count?: number;
    createId: number;
    createTime: string;
  }

  // 详情返回结构
  export interface DetailRow extends ListRow {
    messages: Message[]; // 详情时返回消息列表
  }

}
