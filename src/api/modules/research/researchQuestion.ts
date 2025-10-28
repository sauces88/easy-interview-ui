import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IResearchQuestion } from '@/api/interface/research/researchQuestion'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getResearchQuestionListApi = (params: IResearchQuestion.Query) => {
  return http.get<IPage<IResearchQuestion.Row>>(ADMIN_MODULE + `/research-question`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createResearchQuestionApi = (params: IResearchQuestion.Form) => {
  return http.post(ADMIN_MODULE + `/research-question`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateResearchQuestionApi = (params: IResearchQuestion.Form) => {
  return http.put(ADMIN_MODULE + `/research-question`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeResearchQuestionApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/research-question`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getResearchQuestionDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IResearchQuestion.Row>(ADMIN_MODULE + `/research-question/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importResearchQuestionExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/research-question/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportResearchQuestionExcelApi  = (params: IResearchQuestion.Query) => {
  return http.download(ADMIN_MODULE + `/research-question/export`, params)
}