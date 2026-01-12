import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { ICommodity } from '@/api/interface/pay/commodity'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getCommodityListApi = (params: ICommodity.Query) => {
  return http.get<IPage<ICommodity.Row>>(ADMIN_MODULE + `/commodity`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createCommodityApi = (params: ICommodity.Form) => {
  return http.post(ADMIN_MODULE + `/commodity`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateCommodityApi = (params: ICommodity.Form) => {
  return http.put(ADMIN_MODULE + `/commodity`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeCommodityApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/commodity`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getCommodityDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<ICommodity.Row>(ADMIN_MODULE + `/commodity/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importCommodityExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/commodity/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportCommodityExcelApi  = (params: ICommodity.Query) => {
  return http.download(ADMIN_MODULE + `/commodity/export`, params)
}