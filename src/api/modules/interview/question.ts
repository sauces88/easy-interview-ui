import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IQuestion } from '@/api/interface/interview/question'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表-admin
* @param params
* @returns {*}
*/
export const getQuestionListAdminApi = (params: IQuestion.Query) => {
  return http.get<IPage<IQuestion.Row>>(ADMIN_MODULE + `/question`, params)
}

/**
 * 查询列表
 * @param params
 * @returns {*}
 */
export const getQuestionListApi = (params: IQuestion.Query) => {
  return http.get<IPage<IQuestion.Row>>(ADMIN_MODULE + `/question/list/card`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createQuestionApi = (params: IQuestion.Form) => {
  return http.post(ADMIN_MODULE + `/question`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateQuestionApi = (params: IQuestion.Form) => {
  return http.put(ADMIN_MODULE + `/question`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeQuestionApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/question`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getQuestionDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IQuestion.Row>(ADMIN_MODULE + `/question/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importQuestionExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/question/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportQuestionExcelApi  = (params: IQuestion.Query) => {
  return http.download(ADMIN_MODULE + `/question/export`, params)
}
