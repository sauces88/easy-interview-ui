import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IProjAssign } from '@/api/interface/research/projAssign'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getProjAssignListApi = (params: IProjAssign.Query) => {
  return http.get<IPage<IProjAssign.Row>>(ADMIN_MODULE + `/proj-assign`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createProjAssignApi = (params: IProjAssign.Form) => {
  return http.post(ADMIN_MODULE + `/proj-assign`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateProjAssignApi = (params: IProjAssign.Form) => {
  return http.put(ADMIN_MODULE + `/proj-assign`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeProjAssignApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/proj-assign`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getProjAssignDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IProjAssign.Row>(ADMIN_MODULE + `/proj-assign/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importProjAssignExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/proj-assign/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportProjAssignExcelApi  = (params: IProjAssign.Query) => {
  return http.download(ADMIN_MODULE + `/proj-assign/export`, params)
}