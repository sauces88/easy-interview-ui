import type {IPageQuery} from '@/api/interface'

export namespace IElevenlabsConv {

    // 查询条件
    export interface Query extends IPageQuery {
        agentId?: string
        status?: number
    }

    // list或detail返回结构
    export interface Row {
        id?: number
        agentId?: string
        conversationId?: string
        status?: number //状态(0=初始化,1=对话关闭,2=测评异常,3=评测成功)
        audio?: string //音频url
        message?: string //消息列表
        score?: string  //评分
        comment?: string //评语
    }

}
