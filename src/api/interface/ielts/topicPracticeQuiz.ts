import type { IPageQuery } from '@/api/interface'

export namespace ITopicPracticeQuiz {

  // 查询条件
  export interface Query extends IPageQuery {
    topicPracticeId?: number
    quizId?: number
    audio?: string
    evaluation?: string
    result?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    topicPracticeId?: number
    quizId?: number
    audio?: string
    evaluation?: string
    result?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    topicPracticeId?: number
    quizId?: number
    audio?: string
    evaluation?: string
    result?: string
  }

}