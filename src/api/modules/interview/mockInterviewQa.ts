import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IMockInterviewQa } from '@/api/interface/interview/mockInterviewQa'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getMockInterviewQaListApi = (params: IMockInterviewQa.Query) => {
  return http.get<IPage<IMockInterviewQa.Row>>(ADMIN_MODULE + `/mock-interview-qa`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createMockInterviewQaApi = (params: IMockInterviewQa.Form) => {
  return http.post(ADMIN_MODULE + `/mock-interview-qa`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateMockInterviewQaApi = (params: IMockInterviewQa.Form) => {
  return http.put(ADMIN_MODULE + `/mock-interview-qa`, params)
}

/**
 * 修改（带音频文件）
 * @param params 包含id、mockInterviewId、questionId和file字段
 * @returns {*}
 */
export const updateMockInterviewQaWithFileApi = (params: IMockInterviewQa.Form) => {
  const formData = new FormData();
  if (params.id) formData.append('id', String(params.id));
  if (params.mockInterviewId) formData.append('mockInterviewId', String(params.mockInterviewId));
  if (params.questionId) formData.append('questionId', String(params.questionId));
  formData.append('file', params.file);

  return http.put(ADMIN_MODULE + `/mock-interview-qa`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeMockInterviewQaApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/mock-interview-qa`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getMockInterviewQaDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IMockInterviewQa.Row>(ADMIN_MODULE + `/mock-interview-qa/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importMockInterviewQaExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/mock-interview-qa/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportMockInterviewQaExcelApi  = (params: IMockInterviewQa.Query) => {
  return http.download(ADMIN_MODULE + `/mock-interview-qa/export`, params)
}
