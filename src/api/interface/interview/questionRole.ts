import type { IPageQuery } from '@/api/interface'

export namespace IQuestionRole {

  // 查询条件
  export interface Query extends IPageQuery {
    name?: string
    nameUs?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    name?: string
    nameUs?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    name?: string
    nameUs?: string
  }

}