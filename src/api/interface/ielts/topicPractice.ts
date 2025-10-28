import type { IPageQuery } from '@/api/interface'

export namespace ITopicPractice {

  // 查询条件
  export interface Query extends IPageQuery {
    status?: number
    evaluation?: string
    comment?: string
    result?: string
  }

  // 查询条件
  export interface HistoryQuery extends IPageQuery {
    status?: number
    topic?: string
  }

  export interface Add{
    topic?:string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    topic?: string
    status?: number
  }

  // list或detail返回结构
  export interface Row {
    id?: number
    status?: number
    evaluation?: string
    comment?: string
    result?: string
    topicPracticeQuizList?: Array<{
      id?: number
      topicPracticeId?: number
      quizId?: number
      audio?: string
      evaluation?: string
      result?: string
      createTime?: string
      updateTime?: string
    }>
  }

}
