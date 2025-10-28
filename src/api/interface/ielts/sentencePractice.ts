import type { IPageQuery } from '@/api/interface'

export namespace ISentencePractice {

  // 查询条件
  export interface Query extends IPageQuery {
    sentenceId?: number
    userId?: number
  }

  // 编辑form表单
  export interface Form {
    sentenceId?: number
    audio?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    sentenceId?: number
    audio?: string
    evaluation?: string
    result?: string
    createTime?: string
    createId?: number
  }

}
