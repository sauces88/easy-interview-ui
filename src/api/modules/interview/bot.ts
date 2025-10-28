import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IBot } from '@/api/interface/interview/bot';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getBotListApi = (params?: IBot.Query) => {
  return http.get<IPage<IBot.Row>>(ADMIN_MODULE + `/coze/bot/list`, params)
}

/**
* 获取Bot详情
* @param botId
* @returns {*}
*/
export const getBotDetailApi = (botId: string) => {
  return http.get<IBot.Detail>(ADMIN_MODULE + `/coze/bot/detail/${botId}`)
}
