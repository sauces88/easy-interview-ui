import type { ICoze } from '@/api/interface/interview/coze'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import { useUserStore } from '@/stores/modules/user';
import http from '@/api'
import { EventSourcePolyfill } from 'event-source-polyfill'

/**
 * 获取最后一次会话
 */
export const getLastConversation = (botId: string) => {
  return http.get<ICoze.ConversationVO>(ADMIN_MODULE + `/coze/conversation/last/${botId}`)
}

/**
 * 完结会话
 */
export const completeConversation = (id: number) => {
  return http.post<void>(ADMIN_MODULE + `/coze/conversation/completed/${id}`)
}

/**
 * 创建会话
 */
export const createConversation = (botId: string) => {
  return http.post<ICoze.ConversationVO>(ADMIN_MODULE + `/coze/conversation/create/${botId}`)
}

/**
 * 获取消息列表
 */
export const getMessageList = (params: ICoze.MessageQuery) => {
  return http.get<ICoze.PageResult<ICoze.MessageResponse>>(ADMIN_MODULE + '/coze/message', params)
}

/**
 * 发送消息并获取 SSE 连接
 */
export const sendStreamMessage = (data: ICoze.ChatRequest, callbacks: {
  onMessage?: (eventData: any) => void
  onError?: (error: Event) => void
  onComplete?: () => void
}) => {
  const params = new URLSearchParams({
    conversationId: data.conversationId,
    content: data.content
  }).toString()

  const BASE_URL = import.meta.env.VITE_API_URL
  const userStore = useUserStore()
  
  // 创建 EventSource 实例,添加 token
  const source = new EventSourcePolyfill(`${BASE_URL}${ADMIN_MODULE}/coze/stream-chat?${params}`, {
    headers: {
      'Authorization': 'Bearer ' + userStore.token
    }
  })

  // 监听所有类型的事件
  source.onmessage = (event) => {
    console.log('默认事件:', event)
  }

  // 监听文本事件
  source.addEventListener('text', (event) => {
    try {
      callbacks.onMessage?.({ type: 'text', content: event.data })
    } catch (e) {
      console.error('处理文本事件失败：', e)
    }
  })

  // 监听文本完成事件
  source.addEventListener('text.done', (event) => {
    try {
      callbacks.onMessage?.({ type: 'text.done' })
    } catch (e) {
      console.error('处理文本完成事件失败：', e)
    }
  })

  // 监听音频事件
  source.addEventListener('audio', (event) => {
    try {
      callbacks.onMessage?.({ type: 'audio', content: event.data })
    } catch (e) {
      console.error('处理音频事件失败：', e)
    }
  })

  // 监听音频完成事件
  source.addEventListener('audio.done', (event) => {
    try {
      callbacks.onMessage?.({ type: 'audio.done' })
      source.close()
      callbacks.onComplete?.()
    } catch (e) {
      console.error('处理音频完成事件失败：', e)
    }
  })

  source.addEventListener('error', (error: Event) => {
    console.error('SSE 连接错误：', error)
    source.close()
    callbacks.onError?.(error)
  })

  // 返回清理函数
  return () => {
    source.close()
  }
}
