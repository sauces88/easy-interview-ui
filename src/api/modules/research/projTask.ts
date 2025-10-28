import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IProjTask } from '@/api/interface/research/projTask'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
 * 获取未完结的projTask, 可能会返回空
 * */
export const getUnfinishedProjTaskApi = (params: { researchProjId: number }) => {
  const { researchProjId } = params
  return  http.get<IProjTask.Row>(ADMIN_MODULE + `/proj-task/unfinished/${researchProjId}`)
}

/**
 * 重新生成评估
 * */
export const reappraiseApi = (params: { id: number }) => {
  const { id } = params
  return  http.put<IProjTask.Row>(ADMIN_MODULE + `/proj-task/${id}`)
}

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getProjTaskListApi = (params: IProjTask.Query) => {
  return http.get<IPage<IProjTask.Row>>(ADMIN_MODULE + `/proj-task`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createProjTaskApi = (params: IProjTask.Form) => {
  return http.post(ADMIN_MODULE + `/proj-task`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateProjTaskApi = (params: IProjTask.Form) => {
  return http.put(ADMIN_MODULE + `/proj-task`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeProjTaskApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/proj-task`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getProjTaskDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IProjTask.Row>(ADMIN_MODULE + `/proj-task/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importProjTaskExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/proj-task/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportProjTaskExcelApi  = (params: IProjTask.Query) => {
  return http.download(ADMIN_MODULE + `/proj-task/export`, params)
}
