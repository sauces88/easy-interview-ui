import type { IPageQuery } from '@/api/interface'

export namespace IOrder {

  // 查询条件
  export interface Query extends IPageQuery {
    commodityId?: number
    payChannel?: string
    currencyType?: string
    payPrice?: number
    payTimeStart?: string
    payTimeEnd?: string
    purchaser?: number
    error?: string
    status?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    commodityId?: number
    payChannel?: string
    currencyType?: string
    payPrice?: number
    payTime?: string
    purchaser?: number
    error?: string
    status?: string
    remark?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    commodityId?: number
    payChannel?: string
    currencyType?: string
    payPrice?: number
    payTime?: string
    purchaser?: number
    error?: string
    status?: string
    remark?: string
    commodityName?: string
  }

}
