import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { ISentence } from '@/api/interface/ielts/sentence'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
 * 获取随机句子
 * @returns {*}
 */
export const getRandomSentenceApi = (params: { speakerId: number }) => {
  return http.get<ISentence.Row>(ADMIN_MODULE + `/sentence/random?speakerId=${params.speakerId}`)
}

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getSentenceListApi = (params: ISentence.Query) => {
  return http.get<IPage<ISentence.Row>>(ADMIN_MODULE + `/sentence`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createSentenceApi = (params: ISentence.Form) => {
  return http.post(ADMIN_MODULE + `/sentence`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateSentenceApi = (params: ISentence.Form) => {
  return http.put(ADMIN_MODULE + `/sentence`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeSentenceApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/sentence`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getSentenceDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<ISentence.Row>(ADMIN_MODULE + `/sentence/${id}`)
}

/**
 * 根据speakerId和主键id获取句子详情
 * @param params
 * @returns {*}
 */
export const getSentenceDetailV2Api = (params: { speakerId: number, id : number }) => {
  const { speakerId, id } = params
  return http.get<ISentence.Row>(ADMIN_MODULE + `/sentence/detail?speakerId=${speakerId}&id=${id}`)
}

/**
* 导入excel
* @param params
*/
export const importSentenceExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/sentence/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportSentenceExcelApi  = (params: ISentence.Query) => {
  return http.download(ADMIN_MODULE + `/sentence/export`, params)
}
