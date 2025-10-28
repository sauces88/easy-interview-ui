import type { IPageQuery } from '@/api/interface'

export namespace IResume {

  // 查询条件
  export interface Query extends IPageQuery {
    url?: string
    text?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    url?: string
    text?: string
    userId?: number | string
  }

  // list或detail返回结构
  export interface Row {
    id?: number
    url?: string
    text?: string
  }

}