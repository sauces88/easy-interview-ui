import http from '@/api'
import {ADMIN_MODULE} from '@/api/helper/prefix'

/**
 * 获取支付页
 * @param params
 * @returns {*}
 */
export const getPayPage = (params: { commodityId?: number, payChannel?: string }) => {
    return http.get<string>(ADMIN_MODULE + `/pay/render`, params)
}
