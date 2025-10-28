import type { IPageQuery } from '@/api/interface'

export namespace IQuestion {

  // 查询条件
  export interface Query extends IPageQuery {
    content?: string
    contentUs?: string
    tags?: string
    tagsUs?: string
    level?: string
    companyId?: number
    roleId?: number
  }

  // 编辑form表单
  export interface Form {
    id?: number
    content?: string
    contentUs?: string
    tags?: string
    tagsUs?: string
    level?: string
    companyId?: number
    roleId?: number
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    content?: string
    contentUs?: string
    tags?: string
    tagsUs?: string
    level?: string
    companyId?: number
    roleId?: number
    logo?: string
    questionCompanyName?: string
    questionCompanyNameUs?: string
    questionRoleName?: string
    questionRoleNameUs?: string
  }

}
