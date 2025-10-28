import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IResearchProj } from '@/api/interface/research/researchProj'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getResearchProjListApi = (params: IResearchProj.Query) => {
  return http.get<IPage<IResearchProj.Row>>(ADMIN_MODULE + `/research-proj`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createResearchProjApi = (params: IResearchProj.Form) => {
  return http.post(ADMIN_MODULE + `/research-proj`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateResearchProjApi = (params: IResearchProj.Form) => {
  return http.put(ADMIN_MODULE + `/research-proj`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeResearchProjApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/research-proj`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getResearchProjDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IResearchProj.Row>(ADMIN_MODULE + `/research-proj/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importResearchProjExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/research-proj/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportResearchProjExcelApi  = (params: IResearchProj.Query) => {
  return http.download(ADMIN_MODULE + `/research-proj/export`, params)
}