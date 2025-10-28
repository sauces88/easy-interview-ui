import type { IPageQuery } from '@/api/interface'

export namespace IMockInterviewQa {

  // 查询条件
  export interface Query extends IPageQuery {
    mockInterviewId?: number
    questionId?: number
    url?: string
    duration?: number
    content?: string
    questionContent?: string
    questionContentUs?: string
    tags?: string
    tagsUs?: string
    questionCompanyName?: string
    questionCompanyNameUs?: string
    questionRoleName?: string
    questionRoleNameUs?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    mockInterviewId?: number
    questionId?: number
    url?: string
    duration?: number
    content?: string
    file: File;
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    mockInterviewId?: number
    questionId?: number
    url?: string
    duration?: number
    content?: string
    questionContent?: string
    questionContentUs?: string
    tags?: string
    tagsUs?: string
    questionCompanyName?: string
    questionCompanyNameUs?: string
    questionRoleName?: string
    questionRoleNameUs?: string
  }

}
