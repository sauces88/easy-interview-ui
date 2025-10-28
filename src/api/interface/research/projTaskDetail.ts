import type { IPageQuery } from '@/api/interface'

export namespace IProjTaskDetail {

  // 查询条件
  export interface Query extends IPageQuery {
    projTaskId?: number
    questionId?: number
    status?: number
  }

  // 编辑form表单
  export interface Form {
    id?: number
    projTaskId?: number
    questionId?: number
    audio?: string
    audioText?: string
    status?: number
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    projTaskId?: number
    questionId?: number
    audio?: string
    audioText?: string
    status?: number
  }

}