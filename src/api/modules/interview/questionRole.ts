import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IQuestionRole } from '@/api/interface/interview/questionRole'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getQuestionRoleListApi = (params: IQuestionRole.Query) => {
  return http.get<IPage<IQuestionRole.Row>>(ADMIN_MODULE + `/question-role`, params)
}

/**
 * 列表查询（根据公司id）
 * @param companyId
 * @returns {*}
 */
export const getQuestionRoleListByCompanyIdApi = (companyId?: Number) => {
  // 如果有公司ID，则作为查询参数传入，否则不带参数
  const url = companyId 
    ? ADMIN_MODULE + `/question-role/list?companyId=${companyId}` 
    : ADMIN_MODULE + `/question-role/list`;
  return http.get<IQuestionRole.Row[]>(url)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createQuestionRoleApi = (params: IQuestionRole.Form) => {
  return http.post(ADMIN_MODULE + `/question-role`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateQuestionRoleApi = (params: IQuestionRole.Form) => {
  return http.put(ADMIN_MODULE + `/question-role`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeQuestionRoleApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/question-role`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getQuestionRoleDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IQuestionRole.Row>(ADMIN_MODULE + `/question-role/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importQuestionRoleExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/question-role/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportQuestionRoleExcelApi  = (params: IQuestionRole.Query) => {
  return http.download(ADMIN_MODULE + `/question-role/export`, params)
}
