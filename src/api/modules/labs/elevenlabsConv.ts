import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type {IPage} from '@/api/interface'
import type { IElevenlabsConv } from '@/api/interface/labs/elevenlabsConv'

/**
 * 初始化会话
 * @param params
 * @returns {*}
 */
export const initElevenlabsConv = (params: { conversationId: string }) => {
    const { conversationId } = params
    return http.post<void>(ADMIN_MODULE + `/elevenlabs-conv/${conversationId}`)
}

/**
 * 评估
 * @param params
 * @returns {*}
 */
export const evaluating = (params: { conversationId: string }) => {
    const { conversationId } = params
    return http.put<void>(ADMIN_MODULE + `/elevenlabs-conv/${conversationId}`)
}

/**
 * 查询会话列表
 * @param params
 * @returns {*}
 */
export const getElevenlabsConvListApi = (params: IElevenlabsConv.Query) => {
    return http.get<IPage<IElevenlabsConv.Row>>(ADMIN_MODULE + `/elevenlabs-conv`, params)
}

/**
 * 获取详情
 * @param params
 * @returns {*}
 */
export const getElevenlabsConvDetailApi = (params: { conversationId: string  }) => {
    const { conversationId } = params
    return http.get<IElevenlabsConv.Row>(ADMIN_MODULE + `/elevenlabs-conv/${conversationId}`)
}

/**
 * 结束对话
 * @param params
 * @returns {*}
 */
export const closeElevenlabsConvApi = (params: { conversationId: string  }) => {
    const { conversationId } = params
    return http.delete(ADMIN_MODULE + `/elevenlabs-conv/${conversationId}`)
}
