import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IAgent } from '@/api/interface/interview/agent'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getAgentListApi = (params: IAgent.Query) => {
  return http.get<IPage<IAgent.Row>>(ADMIN_MODULE + `/agent`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createAgentApi = (params: IAgent.Form) => {
  return http.post(ADMIN_MODULE + `/agent`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateAgentApi = (params: IAgent.Form) => {
  return http.put(ADMIN_MODULE + `/agent`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeAgentApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/agent`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getAgentDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IAgent.Row>(ADMIN_MODULE + `/agent/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importAgentExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/agent/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportAgentExcelApi  = (params: IAgent.Query) => {
  return http.download(ADMIN_MODULE + `/agent/export`, params)
}
