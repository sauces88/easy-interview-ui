import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IBotWorkflow } from '@/api/interface/interview/botWorkflow'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getBotWorkflowListApi = (params: IBotWorkflow.Query) => {
  return http.get<IPage<IBotWorkflow.Row>>(ADMIN_MODULE + `/bot-workflow`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createBotWorkflowApi = (params: IBotWorkflow.Form) => {
  return http.post(ADMIN_MODULE + `/bot-workflow`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateBotWorkflowApi = (params: IBotWorkflow.Form) => {
  return http.put(ADMIN_MODULE + `/bot-workflow`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeBotWorkflowApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/bot-workflow`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getBotWorkflowDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IBotWorkflow.Row>(ADMIN_MODULE + `/bot-workflow/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importBotWorkflowExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/bot-workflow/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportBotWorkflowExcelApi  = (params: IBotWorkflow.Query) => {
  return http.download(ADMIN_MODULE + `/bot-workflow/export`, params)
}
