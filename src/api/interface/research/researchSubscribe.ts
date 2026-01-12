import type { IPageQuery } from '@/api/interface'

export namespace IResearchSubscribe {

  // 查询条件
  export interface Query extends IPageQuery {
    researchUserId?: number
    lastOrderId?: number
    credit?: number
    timeoutStart?: string
    timeoutEnd?: string
    extra?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    researchUserId?: number
    lastOrderId?: number
    credit?: number
    timeout?: string
    extra?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    researchUserId?: number
    lastOrderId?: number
    credit?: number
    timeout?: string
    extra?: string
  }

}