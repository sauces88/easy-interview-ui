import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IResearchSubscribe } from '@/api/interface/research/researchSubscribe'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
 * 获取当前用户订阅详情
 * @returns {*}
 */
export const getCurrentResearchSubscribeDetailApi = () => {
  return http.get<IResearchSubscribe.Row>(ADMIN_MODULE + `/research-subscribe/current`)
}

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getResearchSubscribeListApi = (params: IResearchSubscribe.Query) => {
  return http.get<IPage<IResearchSubscribe.Row>>(ADMIN_MODULE + `/research-subscribe`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createResearchSubscribeApi = (params: IResearchSubscribe.Form) => {
  return http.post(ADMIN_MODULE + `/research-subscribe`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateResearchSubscribeApi = (params: IResearchSubscribe.Form) => {
  return http.put(ADMIN_MODULE + `/research-subscribe`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeResearchSubscribeApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/research-subscribe`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getResearchSubscribeDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IResearchSubscribe.Row>(ADMIN_MODULE + `/research-subscribe/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importResearchSubscribeExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/research-subscribe/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportResearchSubscribeExcelApi  = (params: IResearchSubscribe.Query) => {
  return http.download(ADMIN_MODULE + `/research-subscribe/export`, params)
}
