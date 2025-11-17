import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'

/**
* 获取签名url
* @param params
* @returns {*}
*/
export const getSignedUrlApi = (params: { agentId: string }) => {
  const { agentId } = params
  return http.get<string>(ADMIN_MODULE + `/elevenlabs/getSignedUrl/${agentId}`)
}
