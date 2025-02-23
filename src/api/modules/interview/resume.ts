import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IResume } from '@/api/interface/interview/resume'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getResumeListApi = (params: IResume.Query) => {
  return http.get<IPage<IResume.Row>>(ADMIN_MODULE + `/resume`, params)
}

/**
* 上传
* @returns {*}
*/
export const createResumeApi = (file: UploadRawFile) => {
  const formData = new FormData()
  formData.append('file', file)
  return http.upload(ADMIN_MODULE + `/resume`, formData, {})
};

/**
* 修改
* @param params
* @returns {*}
*/
export const updateResumeApi = (params: IResume.Form) => {
  return http.put(ADMIN_MODULE + `/resume`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeResumeApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/resume`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getResumeDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IResume.Row>(ADMIN_MODULE + `/resume/${id}`)
}

/**
 * 获取详情（当前用户）
 * @returns {*}
 */
export const getCurrentUserResumeDetailApi = () => {
  return http.get<IResume.Row>(ADMIN_MODULE + `/resume/currentUser`)
}

/**
* 导入excel
* @param params
*/
export const importResumeExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/resume/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportResumeExcelApi  = (params: IResume.Query) => {
  return http.download(ADMIN_MODULE + `/resume/export`, params)
}
