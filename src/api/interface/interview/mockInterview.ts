import type {IPageQuery} from '@/api/interface'
import type { IMockInterviewQa } from './mockInterviewQa'

//(0=未结束,1=执行反馈中,2=强制结束,3=正常结束,4=异常)
type status = "0" | "1" | "2" | "3" | "4"

export namespace IMockInterview {

    // 查询条件
    export interface Query extends IPageQuery {
        sessionId?: string
        companyId?: number
        roleId?: number
        feedback?: string
        shareFlag?: number
        completed?: status
    }

    // 编辑form表单
    export interface Form {
        id?: number
        sessionId?: string
        companyId?: number
        roleId?: number
        feedback?: string
        shareFlag?: number
        botId?: string
    }

    // list或detail返回结构
    export interface Row {
        id?: number
        sessionId?: string
        companyId?: number
        roleId?: number
        feedback?: string
        shareFlag?: number
        completed?: status
        botId?: string
        mockInterviewQaList?: IMockInterviewQa.Row[]
    }

}
