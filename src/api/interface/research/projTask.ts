import type { IPageQuery } from '@/api/interface'

export namespace IProjTask {

  // 查询条件
  export interface Query extends IPageQuery {
    name?: string //学员名称
    status?: number //(0=未完结,1=已完结,2=强制完结,3=异常)
    researchProjId?: number //项目id
  }

  // 编辑form表单
  export interface Form {
    id?: number
    projAssignId?: number
    status?: number
    extraQuestionIds?: string
    score?: string
    comment?: string
 }

  // list或detail返回结构
  export interface Row {
    id?: number
    projAssignId?: number
    status?: number
    extraQuestionIds?: string
    score?: string
    comment?: string
    createTime?: string
    updateTime?: string
    researchProj: {
      id?: number
      name?: string
      intro?: string
      academy?: string
      direction?: string
      skill?: string
      configStatus?: number
      count?:number
    }
    researchUser: {
      id?: number
      userId?: number
      name?: string
      age?: number
      gender?: boolean
      education?: string
      work?: string
      goal?: string
      userName?:string
    }
  }

}
