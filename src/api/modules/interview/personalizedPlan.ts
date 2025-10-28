import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IConversation } from '@/api/interface/interview/conversation'

/**
 * 根据唯一标识获取智能体id
 * @param identifier 标识符
 * @returns {*}
 */
export const getAgentIdByIdentifier = (identifier: string) => {
  return http.get<string>(ADMIN_MODULE + `/personalized-plan/${identifier}`)
}

/**
 * 根据agentId获取会话
 * @param agentId 智能体ID
 * @returns {*}
 */
export const getConversationByAgentId = (agentId: string) => {
  return http.post<IConversation.Row>(ADMIN_MODULE + `/personalized-plan/${agentId}`)
}

/**
 * 重新分析（只删除分析记录，具体分析逻辑由前端控制）
 * @returns {*}
 */
export const resetPersonalizedPlan = () => {
  return http.delete<void>(ADMIN_MODULE + `/personalized-plan`)
} 