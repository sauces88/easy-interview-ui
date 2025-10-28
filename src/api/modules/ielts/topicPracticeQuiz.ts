import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { ITopicPracticeQuiz } from '@/api/interface/ielts/topicPracticeQuiz'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 修改（提交录制的音频）
* @param file 音频文件（单声道，16k采样率，wav格式）
* @param id 问题-练习明细ID
* @returns {*}
*/
export const updateTopicPracticeQuizApi = (file: File, id: number) => {
  const formData = new FormData()
  formData.append('file', file)
  return http.put(ADMIN_MODULE + `/topic-practice-quiz/${id}`, formData, {})
}

/**
 * 重新评估
 * @param params
 * @returns {*}
 */
export const reappraiseTopicPracticeQuizApi = (params: { id: number }) => {
  const { id } = params
  return http.put(ADMIN_MODULE + `/topic-practice-quiz/reappraise/${id}`)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeTopicPracticeQuizApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/topic-practice-quiz`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getTopicPracticeQuizDetailApi = (params: { id: any }) => {
  const { id } = params
  return http.get<ITopicPracticeQuiz.Row>(ADMIN_MODULE + `/topic-practice-quiz/${id}`)
}

/**
 * 查询列表
 * @param params
 * @returns {*}
 */
export const getTopicPracticeQuizListApi = (params: ITopicPracticeQuiz.Query) => {
  return http.get<IPage<ITopicPracticeQuiz.Row>>(ADMIN_MODULE + `/topic-practice-quiz`, params)
}

/**
 * 添加
 * @param params
 * @returns {*}
 */
export const createTopicPracticeQuizApi = (params: ITopicPracticeQuiz.Form) => {
  return http.post(ADMIN_MODULE + `/topic-practice-quiz`, params)
}

/**
* 导入excel
* @param params
*/
export const importTopicPracticeQuizExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/topic-practice-quiz/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportTopicPracticeQuizExcelApi  = (params: ITopicPracticeQuiz.Query) => {
  return http.download(ADMIN_MODULE + `/topic-practice-quiz/export`, params)
}
