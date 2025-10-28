import type { IPageQuery } from '@/api/interface'

export namespace ISpeaker {

  // 查询条件
  export interface Query extends IPageQuery {
    name?: string
    voiceType?: string
    description?: string
  }

  // 编辑form表单
  export interface Form {
    id?: number
    name?: string
    voiceType?: string
    pitchRate?: number
    speechRate?: number
    audio?: string
    image?:string
    description?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    name?: string
    voiceType?: string
    pitchRate?: number
    speechRate?: number
    audio?: string
    image?:string
    description?: string
  }

}
