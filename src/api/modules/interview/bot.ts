import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'

/**
* 查询列表
* @returns {*}
*/
export const getBotListApi = () => {
  return http.get(ADMIN_MODULE + `/coze/bot/list`)
}
