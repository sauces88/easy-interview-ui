export namespace ICoze {
  // 消息查询参数
  export interface MessageQuery {
    conversationId: string
    order?: 'desc' | 'asc'
    chat_id?: string
    before_id?: string
    after_id?: string
    limit?: number
  }

  // 消息响应结构
  export interface MessageResponse {
    id: string
    role: string
    content: string
    created_at: string
  }

  // 分页响应结构
  export interface PageResult<T> {
    firstId: string
    lastId: string
    hasMore: boolean
    rows: T[]
  }

  // 会话信息
  export interface ConversationVO {
    id: number
    botId: string
    conversationId: string
    completed: boolean
    createTime: string
    assistantId?: number
  }

  // 聊天请求参数
  export interface ChatRequest {
    conversationId: string
    content: string
    audioFlag: boolean
  }
} 