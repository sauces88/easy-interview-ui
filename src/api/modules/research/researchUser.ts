import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IResearchUser } from '@/api/interface/research/researchUser'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
 * 获取当前用户详情
 * @returns {*}
 */
export const getCurrentResearchUserDetailApi = () => {
  return http.get<IResearchUser.Row>(ADMIN_MODULE + `/research-user/current`)
}

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getResearchUserListApi = (params: IResearchUser.Query) => {
  return http.get<IPage<IResearchUser.Row>>(ADMIN_MODULE + `/research-user`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createResearchUserApi = (params: IResearchUser.Form) => {
  return http.post(ADMIN_MODULE + `/research-user`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateResearchUserApi = (params: IResearchUser.Form) => {
  return http.put(ADMIN_MODULE + `/research-user`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeResearchUserApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/research-user`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getResearchUserDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IResearchUser.Row>(ADMIN_MODULE + `/research-user/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importResearchUserExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/research-user/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportResearchUserExcelApi  = (params: IResearchUser.Query) => {
  return http.download(ADMIN_MODULE + `/research-user/export`, params)
}
