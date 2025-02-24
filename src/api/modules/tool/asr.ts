import { ADMIN_MODULE } from '@/api/helper/prefix'
import http from '@/api'

/**
 * 语音识别接口
 * @param file 音频文件
 * @returns 识别后的文本内容
 */
export const asrApi = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return http.post<string>(
    ADMIN_MODULE + '/tool/asr',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
}
