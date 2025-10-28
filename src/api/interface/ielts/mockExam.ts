import type { IPageQuery } from '@/api/interface'

export namespace IMockExam {

  // 查询条件
  export interface Query extends IPageQuery {
    status?: number
    userId?: number
  }

  // 编辑form表单
  export interface Form {
    id?: number
    status?: number
    evaluation?: string
    comment?: string
    chats?: string
    result?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    status?: string  //状态(INITIALIZED=初始化,UNFINISHED=未完结,FINISHED=已完结,ABNORMAL=异常)
    evaluation?: string //评测结果 示例：{"suggestedScore":"93.42676544189453", "variation":85.25,"grammar":91.7,"accuracy":95.32825469970703,"fluency":0.9772716164588928}
    comment?: string // 评语
    chats?: string
    result?: string
    createTime?: string // 创建时间
    createId?: number
    mockExamDetailList?: Array<{
      id?: number
      mockExamId?: number
      quizId?: number
      extra?: string
      audio?: string
      audioText?: string
      result?: string
    }>
  }
}
