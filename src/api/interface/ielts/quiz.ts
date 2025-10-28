import type { IPageQuery } from '@/api/interface'

export namespace IQuiz {

  // 查询条件
  export interface Query extends IPageQuery {
    topic?:string
    tags?: string
    source?: string
    part?: string
    type?: string
    category?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    topic?:string
    text?: string
    audio?: string
    tips?: string
    tags?: string
    source?: string
    part?: string
    type?: string
    category?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    topic?:string
    text?: string
    audio?: string
    tips?: string
    tags?: string
    source?: string
    part?: string
    type?: string
    category?: string
  }

}
