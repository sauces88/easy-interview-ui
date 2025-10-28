import type { IPageQuery } from '@/api/interface'

export namespace IProjAssign {

  // 查询条件
  export interface Query extends IPageQuery {
    projectId?: number
    researchUserId?: number
    assignUserId?: number
  }

  // 编辑form表单
  export interface Form {
    id?: number
    projectId?: number
    researchUserId?: number
    assignUserId?: number
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    projectId?: number
    researchUserId?: number
    assignUserId?: number
  }

}