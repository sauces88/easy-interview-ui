import type { IPageQuery } from '@/api/interface'

export namespace ISentence {

  // 查询条件
  export interface Query extends IPageQuery {
    text?: string
    tags?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    text?: string
    audio?: string
    tags?: string
    remark?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    text?: string
    audio?: string
    tags?: string
    remark?: string
  }

}
