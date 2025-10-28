import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { ISpeaker } from '@/api/interface/ielts/speaker'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getSpeakerListApi = (params: ISpeaker.Query) => {
  return http.get<IPage<ISpeaker.Row>>(ADMIN_MODULE + `/speaker`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createSpeakerApi = (params: ISpeaker.Form) => {
  return http.post(ADMIN_MODULE + `/speaker`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateSpeakerApi = (params: ISpeaker.Form) => {
  return http.put(ADMIN_MODULE + `/speaker`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeSpeakerApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/speaker`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getSpeakerDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<ISpeaker.Row>(ADMIN_MODULE + `/speaker/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importSpeakerExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/speaker/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportSpeakerExcelApi  = (params: ISpeaker.Query) => {
  return http.download(ADMIN_MODULE + `/speaker/export`, params)
}