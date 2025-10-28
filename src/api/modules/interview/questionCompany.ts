import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IQuestionCompany } from '@/api/interface/interview/questionCompany'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getQuestionCompanyListApi = (params: IQuestionCompany.Query) => {
  return http.get<IPage<IQuestionCompany.Row>>(ADMIN_MODULE + `/question-company`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createQuestionCompanyApi = (params: IQuestionCompany.Form) => {
  return http.post(ADMIN_MODULE + `/question-company`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateQuestionCompanyApi = (params: IQuestionCompany.Form) => {
  return http.put(ADMIN_MODULE + `/question-company`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeQuestionCompanyApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/question-company`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getQuestionCompanyDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IQuestionCompany.Row>(ADMIN_MODULE + `/question-company/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importQuestionCompanyExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/question-company/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportQuestionCompanyExcelApi  = (params: IQuestionCompany.Query) => {
  return http.download(ADMIN_MODULE + `/question-company/export`, params)
}