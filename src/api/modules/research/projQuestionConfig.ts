import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IProjQuestionConfig } from '@/api/interface/research/projQuestionConfig'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getProjQuestionConfigListApi = (params: IProjQuestionConfig.Query) => {
  return http.get<IPage<IProjQuestionConfig.Row>>(ADMIN_MODULE + `/proj-question-config`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createProjQuestionConfigApi = (params: IProjQuestionConfig.Form) => {
  return http.post(ADMIN_MODULE + `/proj-question-config`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateProjQuestionConfigApi = (params: IProjQuestionConfig.Form) => {
  return http.put(ADMIN_MODULE + `/proj-question-config`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeProjQuestionConfigApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/proj-question-config`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getProjQuestionConfigDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IProjQuestionConfig.Row>(ADMIN_MODULE + `/proj-question-config/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importProjQuestionConfigExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/proj-question-config/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportProjQuestionConfigExcelApi  = (params: IProjQuestionConfig.Query) => {
  return http.download(ADMIN_MODULE + `/proj-question-config/export`, params)
}