import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IProjTaskDetail } from '@/api/interface/research/projTaskDetail'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getProjTaskDetailListApi = (params: IProjTaskDetail.Query) => {
  return http.get<IPage<IProjTaskDetail.Row>>(ADMIN_MODULE + `/proj-task-detail`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createProjTaskDetailApi = (params: IProjTaskDetail.Form) => {
  return http.post(ADMIN_MODULE + `/proj-task-detail`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateProjTaskDetailApi = (params: IProjTaskDetail.Form) => {
  return http.put(ADMIN_MODULE + `/proj-task-detail`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeProjTaskDetailApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/proj-task-detail`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getProjTaskDetailDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IProjTaskDetail.Row>(ADMIN_MODULE + `/proj-task-detail/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importProjTaskDetailExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/proj-task-detail/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportProjTaskDetailExcelApi  = (params: IProjTaskDetail.Query) => {
  return http.download(ADMIN_MODULE + `/proj-task-detail/export`, params)
}