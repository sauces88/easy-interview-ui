import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { ISentencePractice } from '@/api/interface/ielts/sentencePractice'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getSentencePracticeListApi = (params: ISentencePractice.Query) => {
  return http.get<IPage<ISentencePractice.Row>>(ADMIN_MODULE + `/sentence-practice`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createSentencePracticeApi = (params: ISentencePractice.Form) => {
  return http.post<ISentencePractice.Row>(ADMIN_MODULE + `/sentence-practice`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateSentencePracticeApi = (params: ISentencePractice.Form) => {
  return http.put(ADMIN_MODULE + `/sentence-practice`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeSentencePracticeApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/sentence-practice`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getSentencePracticeDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<ISentencePractice.Row>(ADMIN_MODULE + `/sentence-practice/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importSentencePracticeExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/sentence-practice/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportSentencePracticeExcelApi  = (params: ISentencePractice.Query) => {
  return http.download(ADMIN_MODULE + `/sentence-practice/export`, params)
}
