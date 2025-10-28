import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IBotAssistant } from '@/api/interface/interview/botAssistant'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getBotAssistantListApi = (params: IBotAssistant.Query) => {
  return http.get<IPage<IBotAssistant.Row>>(ADMIN_MODULE + `/bot-assistant`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createBotAssistantApi = (params: IBotAssistant.Form) => {
  return http.post(ADMIN_MODULE + `/bot-assistant`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateBotAssistantApi = (params: IBotAssistant.Form) => {
  return http.put(ADMIN_MODULE + `/bot-assistant`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeBotAssistantApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/bot-assistant`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getBotAssistantDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IBotAssistant.Row>(ADMIN_MODULE + `/bot-assistant/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importBotAssistantExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/bot-assistant/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportBotAssistantExcelApi  = (params: IBotAssistant.Query) => {
  return http.download(ADMIN_MODULE + `/bot-assistant/export`, params)
}
