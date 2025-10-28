import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IMockExam } from '@/api/interface/ielts/mockExam'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
 * 重新生成评语
 * @param params
 * @returns {*}
 */
export const retryGenerateEvaluation = (params: { id: number }) => {
  const { id } = params
  return http.put<IMockExam.Row>(ADMIN_MODULE + `/mock-exam/${id}`)
}

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getMockExamListApi = (params: IMockExam.Query) => {
  return http.get<IPage<IMockExam.Row>>(ADMIN_MODULE + `/mock-exam`, params)
}

/**
* 添加
* @returns {*}
*/
export const createMockExamApi = () => {
  return http.post(ADMIN_MODULE + `/mock-exam`)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeMockExamApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/mock-exam`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getMockExamDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IMockExam.Row>(ADMIN_MODULE + `/mock-exam/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importMockExamExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/mock-exam/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportMockExamExcelApi  = (params: IMockExam.Query) => {
  return http.download(ADMIN_MODULE + `/mock-exam/export`, params)
}
