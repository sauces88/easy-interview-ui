import type { IPageQuery } from '@/api/interface'

export namespace IResearchProj {

  // 查询条件
  export interface Query extends IPageQuery {
    name?: string
    academy?: string
    configStatus?: number
  }

  // 编辑form表单
  export interface Form {
    id?: number
    name?: string
    intro?: string
    academy?: string
    direction?: string
    skill?: string
    configStatus?: number
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    name?: string
    intro?: string
    academy?: string
    direction?: string
    skill?: string
    configStatus?: number
    count?:number
  }

}
