import type { IPageQuery } from '@/api/interface'

export namespace ICommodity {

  // 查询条件
  export interface Query extends IPageQuery {
    name?: string
    code?: string
    type?: string
    stock?: number
    originalPrice?: number
    discountPrice?: number
    status?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    name?: string
    code?: string
    type?: string
    stock?: number
    originalPrice?: number
    discountPrice?: number
    status?: string
    remark?: string
    days?:number
    credits:number
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    name?: string
    code?: string
    type?: string
    stock?: number
    originalPrice?: number
    discountPrice?: number
    status?: string
    remark?: string
    days?:number
    credits:number
  }

}
