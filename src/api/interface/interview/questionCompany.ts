import type { IPageQuery } from '@/api/interface'

export namespace IQuestionCompany {

  // 查询条件
  export interface Query extends IPageQuery {
    name?: string
    nameUs?: string
    logo?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    name?: string
    nameUs?: string
    logo?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    name?: string
    nameUs?: string
    logo?: string
  }

}