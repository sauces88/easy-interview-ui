import type { IPageQuery } from '@/api/interface'

export namespace IConversation {

  // 查询条件
  export interface Query extends IPageQuery {
    botId?: string
    conversationId?: string
    completed?: number
  }

  // 编辑form表单
  export interface Form {
    id?: number
    botId?: string
    conversationId?: string
    completed?: number
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    botId?: string
    conversationId?: string
    completed?: number
    createId: number;
    createTime: string;
    updateId: number;
    updateTime: string;
  }

}
