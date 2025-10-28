import {defineStore} from 'pinia';
import {ref} from 'vue';
import router from '@/router';
import mittBus from '@/utils/mittBus';
import {getTopicPracticeQuizDetailApi} from '@/api/modules/ielts/topicPracticeQuiz';
import {getQuizDetailApi} from "@/api/modules/ielts/quiz"
import {getTopicPracticeDetailApi} from "@/api/modules/ielts/topicPractice"

export interface MessageItem {
  id: string;
  code: string;
  mockInterviewId?: string;
  topicPracticeQuizId?: string;
  topicPracticeId?: string;
  message: string;
  time: Date;
  read: boolean;
}

export const useMessageStore = defineStore('message', () => {
  const messageList = ref<MessageItem[]>([]);

  // 从localStorage加载消息
  const loadMessages = () => {
    try {
      const savedMessages = localStorage.getItem('messages');

      if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        // 过滤并迁移旧的消息格式
        messageList.value = messages.filter((msg: any) => {
          // 过滤掉任何包含 quizPracticeId 字段的旧消息
          if (msg.hasOwnProperty('quizPracticeId')) {
            return false; // 过滤掉所有包含旧字段的消息
          }
          // 保留有效消息（有 mockInterviewId 或新的 topic 字段）
          return msg.mockInterviewId || msg.topicPracticeQuizId || msg.topicPracticeId;
        });
      }
    } catch (error) {
      console.error('Failed to load messages from localStorage:', error);
    }
  };

  // 保存消息到localStorage
  const saveMessages = () => {
    localStorage.setItem('messages', JSON.stringify(messageList.value));
  };

  // 添加新消息
  const addMessage = (message: Partial<MessageItem>) => {
    // 直接从消息参数中获取字段
    let mockInterviewId = message.mockInterviewId || '';
    let topicPracticeQuizId = message.topicPracticeQuizId || '';
    let topicPracticeId = message.topicPracticeId || '';
    let code = message.code || '';
    let messageContent = message.message || '';

    // 如果消息内容是字符串且看起来像JSON，尝试解析（处理嵌套JSON的情况）
    if (messageContent && messageContent.trim().startsWith('{')) {
      try {
        const contentObj = JSON.parse(messageContent);
        if (contentObj && typeof contentObj === 'object') {
          // 检查嵌套JSON是否包含旧的quizPracticeId字段，如果包含则忽略
          if (contentObj.hasOwnProperty('quizPracticeId')) {
            // 不从contentObj中提取任何字段，直接使用原始messageContent
          } else {
            // 只有当直接字段为空时，才从嵌套JSON中提取
            if (!mockInterviewId && contentObj.mockInterviewId) {
              mockInterviewId = contentObj.mockInterviewId;
            }
            if (!topicPracticeQuizId && contentObj.topicPracticeQuizId) {
              topicPracticeQuizId = contentObj.topicPracticeQuizId;
            }
            if (!topicPracticeId && contentObj.topicPracticeId) {
              topicPracticeId = contentObj.topicPracticeId;
            }
            if (!code && contentObj.code) {
              code = contentObj.code;
            }
            if (contentObj.message) {
              messageContent = contentObj.message;
            }
          }
        }
      } catch (error) {
        console.error('解析嵌套JSON失败:', error);
      }
    }

    // 验证消息是否有效（至少要有一个有效的标识符）
    // 同时检查是否包含旧的 quizPracticeId 字段（需要过滤掉）
    const hasOldFieldInMessage = message.hasOwnProperty('quizPracticeId');
    const hasValidId = mockInterviewId || topicPracticeQuizId || topicPracticeId;

    if (!hasValidId || hasOldFieldInMessage) {
      return;
    }

    const newMessage: MessageItem = {
      id: Date.now().toString(), // 生成唯一ID
      code: code,
      mockInterviewId: mockInterviewId,
      topicPracticeQuizId: topicPracticeQuizId,
      topicPracticeId: topicPracticeId,
      message: messageContent,
      time: message.time || new Date(),
      read: false
    };

    messageList.value.unshift(newMessage);
    saveMessages();

    // 自动发送相关事件，更新UI状态
    if (newMessage.code === '0000') {
      if (newMessage.topicPracticeQuizId) {
        // 小题练习记录消息 - 通知QuizDetail组件移除"语音分析进行中..."状态
        mittBus.emit('quiz.evaluationComplete', { topicPracticeQuizId: newMessage.topicPracticeQuizId });
      }

      if (newMessage.topicPracticeId) {
        // 整体topic练习记录消息 - 通知OverallEvaluation组件移除"总体评估进行中..."状态
        mittBus.emit('overall.evaluationComplete', { topicPracticeId: newMessage.topicPracticeId });
      }
    }
  };

  // 标记消息为已读
  const markAsRead = (id: string) => {
    const message = messageList.value.find(msg => msg.id === id);
    if (message) {
      message.read = true;
      saveMessages();
    }
  };

  // 删除指定消息
  const deleteMessage = (id: string) => {
    messageList.value = messageList.value.filter(msg => msg.id !== id);
    saveMessages();
  };

  // 清空所有消息
  const clearMessages = () => {
    messageList.value = [];
    localStorage.removeItem('messages');
  };

  // 强制重置消息存储（调试用）
  const forceResetMessages = () => {
    // 清空所有可能的缓存
    localStorage.removeItem('messages');
    sessionStorage.removeItem('messages'); // 也清理sessionStorage

    // 检查并清理其他可能的消息相关缓存键
    const allLocalStorageKeys = Object.keys(localStorage);
    const messageRelatedKeys = allLocalStorageKeys.filter(key =>
      key.toLowerCase().includes('message') ||
      key.toLowerCase().includes('quiz') ||
      key.toLowerCase().includes('practice')
    );

    messageRelatedKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    messageList.value = [];
  };

  // 清理无效的历史消息
  const cleanupInvalidMessages = () => {
    const originalLength = messageList.value.length;
    const validMessages = messageList.value.filter(msg => {
      // 过滤掉包含旧字段的消息
      if (msg.hasOwnProperty('quizPracticeId')) {
        return false;
      }
      // 只保留有有效标识符的消息
      return msg.mockInterviewId || msg.topicPracticeQuizId || msg.topicPracticeId;
    });

    if (validMessages.length !== originalLength) {
      messageList.value = validMessages;
      saveMessages();
    }
  };

  // 处理消息点击
  const handleMessageClick = async (message: MessageItem) => {
    markAsRead(message.id);

    // 根据消息类型导航到不同页面
    if (message.mockInterviewId) {
      // 模拟面试消息处理
      if (router.currentRoute.value.path === '/interview/mock') {
        // 使用 replace 而不是 push 来避免在历史记录中创建多余的条目
        router.replace('/temp-route').then(() => {
          router.replace({
            path: '/interview/mock',
            query: { mockInterviewId: message.mockInterviewId }
          });
        });
      } else {
        // 如果不在模拟面试页面，直接导航
        router.push({
          path: '/interview/mock',
          query: { mockInterviewId: message.mockInterviewId }
        });
      }
    } else if (message.topicPracticeQuizId) {
      // 单题练习消息处理：获取详情并打开模态框
      try {
        // 1. 通过topicPracticeQuizId获取练习明细详情
        const quizDetailResponse = await getTopicPracticeQuizDetailApi({ id: message.topicPracticeQuizId });
        const quizPracticeDetail = quizDetailResponse.data;

        // 2. 通过topicPracticeId获取主题练习记录详情
        const topicDetailResponse = await getTopicPracticeDetailApi({ id: quizPracticeDetail.topicPracticeId });
        const topicPracticeDetail = topicDetailResponse.data;

        // 3. 通过quizId获取问题详情
        const quizResponse = await getQuizDetailApi({ id: quizPracticeDetail.quizId });
        const quizDetail = quizResponse.data;

        // 4. 导航到雅思练习页面
        if (router.currentRoute.value.path !== '/ielts/quiz/card') {
          await router.push('/ielts/quiz/card');
        }

        // 5. 判断状态并打开模态框
        let mode: 'view' | 'continue' = 'view'; // 默认为查看模式

        // 判断主题练习的状态
        if (topicPracticeDetail.result) {
          const result = JSON.parse(topicPracticeDetail.result);
          if (result.code === '0000') {
            mode = 'view'; // 总体评估完成，查看模式
          } else {
            mode = 'continue'; // 总体评估异常，继续模式
          }
        } else {
          mode = 'continue'; // 没有总体结果，继续模式
        }

        // 6. 通过mittBus通知打开模态框
        mittBus.emit('openQuizDetailFromMessage', {
          topic: quizDetail.topic,
          topicPracticeData: topicPracticeDetail,
          mode: mode,
          targetQuizId: quizPracticeDetail.quizId,
          autoPlay: false // 从消息打开时不自动播放音频
        });

      } catch (error) {
        console.error('处理单题练习消息点击时出错:', error);
      }
    } else if (message.topicPracticeId) {
      // 总体练习消息处理：获取详情并打开模态框
      try {
        // 1. 通过topicPracticeId获取主题练习记录详情
        const topicDetailResponse = await getTopicPracticeDetailApi({ id: message.topicPracticeId });
        const topicPracticeDetail = topicDetailResponse.data;

        // 2. 导航到雅思练习页面
        if (router.currentRoute.value.path !== '/ielts/quiz/card') {
          await router.push('/ielts/quiz/card');
        }

        // 3. 获取第一个问题的详情来获取topic
        let topic: any = '';
        if (topicPracticeDetail.topicPracticeQuizList && topicPracticeDetail.topicPracticeQuizList.length > 0) {
          const firstPracticeQuiz = topicPracticeDetail.topicPracticeQuizList[0];
          if (firstPracticeQuiz && firstPracticeQuiz.quizId) {
            const firstQuizResponse = await getQuizDetailApi({ id: firstPracticeQuiz.quizId });
            topic = firstQuizResponse.data.topic;
          }
        }

        // 4. 以查看模式打开模态框（总体练习消息通常是查看总体评估结果）
        mittBus.emit('openQuizDetailFromMessage', {
          topic: topic,
          topicPracticeData: topicPracticeDetail,
          mode: 'view',
          targetQuizId: null, // 不指定特定题目
          autoPlay: false // 从消息打开时不自动播放音频
        });

      } catch (error) {
        console.error('处理总体练习消息点击时出错:', error);
      }
    }
  };

  // 初始化加载消息
  loadMessages();
  // 清理无效消息
  cleanupInvalidMessages();

  return {
    messageList,
    addMessage,
    markAsRead,
    deleteMessage,
    clearMessages,
    forceResetMessages,
    handleMessageClick
  };
});
