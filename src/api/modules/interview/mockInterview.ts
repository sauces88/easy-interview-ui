import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IMockInterview } from '@/api/interface/interview/mockInterview'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getMockInterviewListApi = (params: IMockInterview.Query) => {
  return http.get<IPage<IMockInterview.Row>>(ADMIN_MODULE + `/mock-interview`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createMockInterviewApi = (params: IMockInterview.Form) => {
  return http.post(ADMIN_MODULE + `/mock-interview`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateMockInterviewApi = (params: IMockInterview.Form) => {
  return http.put(ADMIN_MODULE + `/mock-interview`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeMockInterviewApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/mock-interview`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getMockInterviewDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IMockInterview.Row>(ADMIN_MODULE + `/mock-interview/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importMockInterviewExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/mock-interview/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportMockInterviewExcelApi  = (params: IMockInterview.Query) => {
  return http.download(ADMIN_MODULE + `/mock-interview/export`, params)
}

/**
 * 获取最后一次模拟面试记录
 */
export const getLastMockInterviewVO = () => {
  return http.get<IMockInterview.Row>(ADMIN_MODULE + `/mock-interview/lastInterview`)
}

/**
 * 执行模式面试分析
 * @param params
 * @returns {*}
 */
export const analyseApi = (params: { id: number }) => {
  const { id } = params
  return http.put<IMockInterview.Row>(ADMIN_MODULE + `/mock-interview/analyse/${id}`)
}


