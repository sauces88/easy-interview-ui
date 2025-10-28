import type { ICoze } from '@/api/interface/interview/coze'
import { ADMIN_MODULE } from '@/api/helper/prefix'
import { useUserStore } from '@/stores/modules/user';
import http from '@/api'
import { EventSourcePolyfill } from 'event-source-polyfill'

/**
 * 获取最后一次会话
 */
export const getLastConversation = (botId: string) => {
  return http.get<ICoze.ConversationVO[]>(ADMIN_MODULE + `/coze/conversation/last/${botId}`)
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
  return http.post<ICoze.ConversationVO[]>(ADMIN_MODULE + `/coze/conversation/create/${botId}`)
}

/**
 * 获取会话的所有消息（新API）
 */
export const getAllMessages = (conversationId: string) => {
  return http.get<ICoze.MessageResponse[]>(ADMIN_MODULE + `/coze/message/${conversationId}`)
}

/**
 * 发送消息并获取 SSE 连接
 */
export const sendStreamMessage = (data: ICoze.ChatRequest, callbacks: {
  onMessage?: (eventData: any) => void
  onError?: (error: MessageEvent) => void
  onComplete?: () => void
}) => {
  const params = new URLSearchParams({
    conversationId: data.conversationId,
    content: data.content,
    audioFlag: data.audioFlag.toString()
  }).toString()

  const BASE_URL = import.meta.env.VITE_API_URL
  const userStore = useUserStore()

  // 创建 EventSource 实例,添加 token
  const source = new EventSourcePolyfill(`${BASE_URL}${ADMIN_MODULE}/coze/stream-chat?${params}`, {
    headers: {
      'Authorization': 'Bearer ' + userStore.token
    }
  })

  // 监听文本事件
  source.addEventListener('text.delta', (event) => {
    try {
      callbacks.onMessage?.({ type: 'text.delta', content: (event as MessageEvent).data })
    } catch (e) {
      console.error('处理文本事件失败：', e)
    }
  })

  // 监听文本完成事件
  source.addEventListener('text.completed', () => {
    try {
      callbacks.onMessage?.({ type: 'text.completed' })
      // 如果不需要音频，则在文本完成时关闭连接
      if (!data.audioFlag) {
        source.close()
        callbacks.onComplete?.()
      }
    } catch (e) {
      console.error('处理文本完成事件失败：', e)
    }
  })

  // 监听音频事件
  source.addEventListener('audio.delta', (event) => {
    try {
      callbacks.onMessage?.({ type: 'audio.delta', content: (event as MessageEvent).data })
    } catch (e) {
      console.error('处理音频事件失败：', e)
    }
  })

  // 监听音频完成事件
  source.addEventListener('audio.completed', () => {
    try {
      callbacks.onMessage?.({ type: 'audio.completed' })
      // 音频完成时一定关闭连接
      source.close()
      callbacks.onComplete?.()
    } catch (e) {
      console.error('处理音频完成事件失败：', e)
    }
  })

  source.addEventListener('error', (event) => {
    console.error('SSE 连接错误:', event)
    source.close()
    // @ts-expect-error: 这里的类型不匹配，待修复
    callbacks.onError?.(event)
  })

  // 返回清理函数
  return () => {
    source.close()
  }
}
