import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IConversation } from '@/api/interface/interview/conversation'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getConversationListApi = (params: IConversation.Query) => {
  return http.get<IPage<IConversation.Row>>(ADMIN_MODULE + `/conversation`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createConversationApi = (params: IConversation.Form) => {
  return http.post(ADMIN_MODULE + `/conversation`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateConversationApi = (params: IConversation.Form) => {
  return http.put(ADMIN_MODULE + `/conversation`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeConversationApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/conversation`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getConversationDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IConversation.Row>(ADMIN_MODULE + `/conversation/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importConversationExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/conversation/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportConversationExcelApi  = (params: IConversation.Query) => {
  return http.download(ADMIN_MODULE + `/conversation/export`, params)
}
