import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IQuiz } from '@/api/interface/ielts/quiz'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getQuizListApi = (params: IQuiz.Query) => {
  return http.get<IPage<IQuiz.Row>>(ADMIN_MODULE + `/quiz`, params)
}

/**
 * 查询列表v2
 * @param params
 * @returns {*}
 */
export const getQuizListV2Api = (params: IQuiz.Query) => {
  return http.get<IPage>(ADMIN_MODULE + `/quiz/page`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createQuizApi = (params: IQuiz.Form) => {
  return http.post(ADMIN_MODULE + `/quiz`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateQuizApi = (params: IQuiz.Form) => {
  return http.put(ADMIN_MODULE + `/quiz`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeQuizApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/quiz`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getQuizDetailApi = (params: { id: any }) => {
  const { id } = params
  return http.get<IQuiz.Row>(ADMIN_MODULE + `/quiz/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importQuizExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/quiz/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportQuizExcelApi  = (params: IQuiz.Query) => {
  return http.download(ADMIN_MODULE + `/quiz/export`, params)
}
