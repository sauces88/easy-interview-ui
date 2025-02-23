import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IConversationMsg } from '@/api/interface/interview/conversationMsg'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getConversationMsgListApi = (params: IConversationMsg.Query) => {
  return http.get<IPage<IConversationMsg.ListRow>>(ADMIN_MODULE + `/conversation-msg`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeConversationMsgApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/conversation-msg`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getConversationMsgDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IConversationMsg.DetailRow>(ADMIN_MODULE + `/conversation-msg/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importConversationMsgExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/conversation-msg/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportConversationMsgExcelApi  = (params: IConversationMsg.Query) => {
  return http.download(ADMIN_MODULE + `/conversation-msg/export`, params)
}
