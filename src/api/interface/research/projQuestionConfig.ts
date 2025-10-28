import type { IPageQuery } from '@/api/interface'

export namespace IProjQuestionConfig {

  // 查询条件
  export interface Query extends IPageQuery {
    projectId?: number
    type?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    projectId?: number
    type?: string
    extractNum?: number
    extractRule?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    projectId?: number
    type?: string
    extractNum?: number
    extractRule?: string
  }

}