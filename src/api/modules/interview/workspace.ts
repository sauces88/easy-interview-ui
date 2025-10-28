import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IWorkspace } from '@/api/interface/interview/workspace'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getWorkspaceListApi = (params: IWorkspace.Query) => {
  return http.get<IPage<IWorkspace.Row>>(ADMIN_MODULE + `/workspace`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createWorkspaceApi = (params: IWorkspace.Form) => {
  return http.post(ADMIN_MODULE + `/workspace`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateWorkspaceApi = (params: IWorkspace.Form) => {
  return http.put(ADMIN_MODULE + `/workspace`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeWorkspaceApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/workspace`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getWorkspaceDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IWorkspace.Row>(ADMIN_MODULE + `/workspace/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importWorkspaceExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/workspace/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportWorkspaceExcelApi  = (params: IWorkspace.Query) => {
  return http.download(ADMIN_MODULE + `/workspace/export`, params)
}
