import type { IPageQuery } from '@/api/interface'

export namespace IBotWorkflow {

  // 查询条件
  export interface Query extends IPageQuery {
    botId?: string
    workflowId?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    botId?: string
    workflowId?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    botId?: string
    workflowId?: string
  }

}