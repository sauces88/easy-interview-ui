import type { IPageQuery } from '@/api/interface'

export namespace IBotAssistant {

  // 查询条件
  export interface Query extends IPageQuery {
    assistantBotId?: string
    mainBotId?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    assistantBotId?: string
    mainBotId?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    assistantBotId?: string
    mainBotId?: string
  }

}