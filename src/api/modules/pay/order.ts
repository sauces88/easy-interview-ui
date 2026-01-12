import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import type { IPage } from '@/api/interface'
import type { IOrder } from '@/api/interface/pay/order'
import type { UploadRawFile } from "element-plus/es/components/upload/src/upload";
import type { AxiosRequestConfig } from 'axios';

/**
 * 查询列表
 * @returns {*}
 */
export const getCurrentUserOrderListApi = () => {
  return http.get<IPage<IOrder.Row>>(ADMIN_MODULE + `/order/current`)
}

/**
* 查询列表
* @param params
* @returns {*}
*/
export const getOrderListApi = (params: IOrder.Query) => {
  return http.get<IPage<IOrder.Row>>(ADMIN_MODULE + `/order`, params)
}

/**
* 添加
* @param params
* @returns {*}
*/
export const createOrderApi = (params: IOrder.Form) => {
  return http.post(ADMIN_MODULE + `/order`, params)
}

/**
* 修改
* @param params
* @returns {*}
*/
export const updateOrderApi = (params: IOrder.Form) => {
  return http.put(ADMIN_MODULE + `/order`, params)
}

/**
* 删除
* @param params
* @returns {*}
*/
export const removeOrderApi = (params: { ids: (string | number)[] }) => {
 return http.delete(ADMIN_MODULE + `/order`, params)
}

/**
* 获取详情
* @param params
* @returns {*}
*/
export const getOrderDetailApi = (params: { id: number }) => {
  const { id } = params
  return http.get<IOrder.Row>(ADMIN_MODULE + `/order/${id}`)
}

/**
* 导入excel
* @param params
*/
export const importOrderExcelApi = (params : UploadRawFile, config?: AxiosRequestConfig<{}> | undefined) => {
  return http.upload(ADMIN_MODULE + `/order/import`, params, config)
}

/**
* 导出excel
* @param params
* @returns {*}
*/
export const exportOrderExcelApi  = (params: IOrder.Query) => {
  return http.download(ADMIN_MODULE + `/order/export`, params)
}
