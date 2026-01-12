import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { ITopicPractice} from '@/api/interface/ielts/topicPractice'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
 * 每日随机练习
 * */
export const random = () => {
  return http.get<Map<string,any>>(ADMIN_MODULE + `/topic-practice/random`)
}

/**
 * 根据topic获取未完结的练习记录
 * @param params
 * @returns {*}
 */
export const getUnfinishedTopicPracticeDetailApi = (params: { topic: string }) => {
  const { topic } = params
  return http.get<ITopicPractice.Row>(ADMIN_MODULE + `/topic-practice/topic/${topic}`)
}

/**
 * 根据topic强制完结练习
 * @param params
 * @returns {*}
 */
export const finishTopicPracticeApi = (params: ITopicPractice.Form) => {
  return http.put(ADMIN_MODULE + `/topic-practice/finish`, params)
}

/**
* 开始练习
* @param params
* @returns {*}
*/
export const createTopicPracticeApi = (params: ITopicPractice.Add) => {
  return http.post<ITopicPractice.Row>(ADMIN_MODULE + `/topic-practice`, params)
}

/**
 * 重新评估
 * @param params
 * @returns {*}
 */
export const reappraiseTopicPracticeApi = (params: { id: number }) => {
  const { id } = params
  return http.put(ADMIN_MODULE + `/topic-practice/reappraise/${id}`)
}

/**
 * 根据topic查看练习记录
 * @param params
 * @returns {*}
 */
export const getTopicPracticeHistoryListApi = (params: ITopicPractice.HistoryQuery) => {
  return http.get<IPage<ITopicPractice.Row>>(ADMIN_MODULE + `/topic-practice/page/history`, params)
}

/**
 * 查询列表
 * @param params
 * @returns {*}
 */
export const getTopicPracticeListApi = (params: ITopicPractice.Query) => {
  return http.get<IPage<ITopicPractice.Row>>(ADMIN_MODULE + `/topic-practice`, params)
}

/**
 * 获取详情
 * @param params
 * @returns {*}
 */
export const getTopicPracticeDetailApi = (params: { id: any }) => {
  const { id } = params
  return http.get<ITopicPractice.Row>(ADMIN_MODULE + `/topic-practice/${id}`)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeTopicPracticeApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/topic-practice`, params)
}

/**
* 导入excel
* @param params
*/
export const importTopicPracticeExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/topic-practice/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportTopicPracticeExcelApi  = (params: ITopicPractice.Query) => {
  return http.download(ADMIN_MODULE + `/topic-practice/export`, params)
}
