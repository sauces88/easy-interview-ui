import type { IPageQuery } from '@/api/interface'

export namespace IWorkspace {

  // 查询条件
  export interface Query extends IPageQuery {
    workspaceId?: string
    identifier?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    workspaceId?: string
    identifier?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    workspaceId?: string
    identifier?: string
  }

}