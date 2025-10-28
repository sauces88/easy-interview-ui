import type { IPageQuery } from '@/api/interface'

export namespace IResearchQuestion {

  // 查询条件
  export interface Query extends IPageQuery {
    projectId?: number
    type?: string
    content?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    projectId?: number
    type?: string
    content?: string
    tips?: string
    target?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    projectId?: number
    type?: string
    content?: string
    tips?: string
    target?: string
  }

}