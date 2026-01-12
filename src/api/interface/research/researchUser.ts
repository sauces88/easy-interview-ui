import type { IPageQuery } from '@/api/interface'

export namespace IResearchUser {

  // 查询条件
  export interface Query extends IPageQuery {
    userId?: number
    name?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    userId?: number
    name?: string
    age?: number
    gender?: boolean
    education?: string
    work?: string
    goal?: string
    email?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    userId?: number
    name?: string
    age?: number
    gender?: boolean
    education?: string
    work?: string
    goal?: string
    email?: string
    userName?:string
  }

}
