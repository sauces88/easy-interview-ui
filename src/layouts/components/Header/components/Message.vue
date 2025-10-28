<template>
  <div class="message">
    <el-popover
      placement="bottom"
      :width="310"
      trigger="click"
    >
      <template #reference>
        <el-badge
          :value="unreadCount > 0 ? unreadCount : ''"
          class="item"
        >
          <i
            :class="'iconfont icon-xiaoxi'"
            class="toolBar-icon"
          />
        </el-badge>
      </template>
      <el-tabs v-model="activeName">
        <el-tab-pane
          :label="t('message.notification') + '(0)'"
          name="first"
        >
          <div class="message-list">
            <div class="message-empty">
              <img
                src="@/assets/images/notData.png"
                alt="notData"
              >
              <div>{{ t('message.emptyNotification') }}</div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane
          :label="t('message.messages') + '(' + messageStore.messageList.length + ')'"
          name="second"
        >
          <div
            v-if="messageStore.messageList.length === 0"
            class="message-empty"
          >
            <img
              src="@/assets/images/notData.png"
              alt="notData"
            >
            <div>{{ t('message.empty') }}</div>
          </div>
          <div
            v-else
            class="message-list"
          >
            <div
              v-for="item in messageStore.messageList"
              :key="item.id"
              class="message-item"
              :class="{
                'message-success': item.code === '0000',
                'message-warning': item.code === 'C1033',
                'message-error': item.code === 'C1036',
                'message-read': item.read
              }"
              @click="messageStore.handleMessageClick(item)"
            >
              <el-avatar
                class="message-icon"
                :size="40"
                :src="'https://minioapi.szadmin.cn/test/user/20241216/微信图片_20240420160033.jpg'"
              >
                <!-- 雅思练习消息图标 -->
                <template v-if="item.topicPracticeQuizId || item.topicPracticeId">
                  <template v-if="item.code === '0000'">
                    <el-icon><CircleCheckFilled /></el-icon>
                  </template>
                  <template v-else>
                    <el-icon><WarningFilled /></el-icon>
                  </template>
                </template>
                <!-- 模拟面试消息图标 -->
                <template v-else>
                  <template v-if="item.code === '0000'">
                    <el-icon><CircleCheckFilled /></el-icon>
                  </template>
                  <template v-else-if="item.code === 'C1033'">
                    <el-icon><Microphone /></el-icon>
                  </template>
                  <template v-else-if="item.code === 'C1036'">
                    <el-icon><WarningFilled /></el-icon>
                  </template>
                  <template v-else>
                    <el-icon><InfoFilled /></el-icon>
                  </template>
                </template>
              </el-avatar>
              <div class="message-content">
                <div class="message-title">
                  {{ getMessageTitle(item) }}
                </div>
                <div class="message-text">
                  {{ item.message }}
                </div>
                <div class="message-date">
                  {{ formatTime(item.time) }}
                </div>
              </div>
              <div class="message-actions">
                <el-button
                  type="danger"
                  link
                  @click.stop="messageStore.deleteMessage(item.id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          <div
            v-if="messageStore.messageList.length > 0"
            class="message-actions"
          >
            <el-button
              type="primary"
              link
              @click="messageStore.clearMessages"
            >
              {{ t('message.clearAll') }}
            </el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane
          :label="t('message.todo') + '(0)'"
          name="third"
        >
          <div class="message-empty">
            <img
              src="@/assets/images/notData.png"
              alt="notData"
            >
            <div>{{ t('message.emptyTodo') }}</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MOCK_INTERVIEW_CHANNEL, QUIZ_PRACTICE_CHANNEL } from '@/config/consts';
import mittBus from '@/utils/mittBus';
import { useMessageStore, type MessageItem } from '@/stores/modules/message';
import { CircleCheckFilled, WarningFilled, InfoFilled, Microphone, Delete } from '@element-plus/icons-vue';

const { t } = useI18n();
const activeName = ref('second'); // 默认显示消息标签页
const messageStore = useMessageStore();

// 处理收到的消息
const handleMessage = (data: any) => {

    let parsedData

    // 首次解析
    const firstParse = JSON.parse(data)

    // 检查是否需要二次解析（处理双重编码的情况）
    if (typeof firstParse === 'string' && firstParse.trim().startsWith('{')) {
      parsedData = JSON.parse(firstParse)
    } else {
      parsedData = firstParse
    }

    let code = parsedData.code
    let mockInterviewId = parsedData.mockInterviewId || '';
    let topicPracticeQuizId = parsedData.topicPracticeQuizId || ''
    let topicPracticeId = parsedData.topicPracticeId || ''
    let message = parsedData.message

    // 添加到消息列表
    messageStore.addMessage({
      code: code,
      mockInterviewId: mockInterviewId,
      topicPracticeQuizId: topicPracticeQuizId,
      topicPracticeId: topicPracticeId,
      message: message,
      time: new Date()
    });
};

// 处理雅思练习消息
const handleQuizPracticeMessage = (data: any) => {
  console.log('handleQuizPracticeMessage 收到数据:', data)
  console.log('数据类型:', typeof data)

  try {
    let parsedData

    // 首次解析
    const firstParse = JSON.parse(data)
    console.log('首次解析结果:', firstParse)

    // 检查是否需要二次解析（处理双重编码的情况）
    if (typeof firstParse === 'string' && firstParse.trim().startsWith('{')) {
      console.log('检测到双重编码，进行二次解析')
      parsedData = JSON.parse(firstParse)
    } else {
      parsedData = firstParse
    }

    console.log('最终解析结果:', parsedData)

    let code = parsedData.code
    let topicPracticeQuizId = parsedData.topicPracticeQuizId || ''
    let topicPracticeId = parsedData.topicPracticeId || ''
    let message = parsedData.message

    console.log('提取的字段:', { code, topicPracticeQuizId, topicPracticeId, message })

    // 添加到消息列表
    messageStore.addMessage({
      code: code,
      topicPracticeQuizId: topicPracticeQuizId,
      topicPracticeId: topicPracticeId,
      message: message,
      time: new Date()
    });
  } catch (error) {
    console.error('处理雅思练习消息时出错:', error)
    console.error('原始数据:', data)
  }
};

// 获取消息标题
const getMessageTitle = (item: MessageItem): string => {
  // 如果是雅思练习消息
  if (item.topicPracticeQuizId || item.topicPracticeId) {
    switch (item.code) {
      case '0000':
        return item.topicPracticeQuizId ? t('message.ieltsQuizAnalysisComplete') : t('message.ieltsOverallEvaluationComplete');
      default:
        return item.topicPracticeQuizId ? t('message.ieltsQuizAnalysisFailed') : t('message.ieltsOverallEvaluationFailed');
    }
  }

  // 模拟面试消息
  switch (item.code) {
    case '0000':
      return t('message.mockInterviewSuccess');
    case 'C1033':
      return t('message.voiceRecognitionError');
    case 'C1036':
      return t('message.networkError');
    default:
      return t('message.systemMessage');
  }
};

// 计算未读消息数量
const unreadCount = computed(() => {
  return messageStore.messageList.filter(msg => !msg.read).length;
});

// 格式化时间
const formatTime = (time: Date | string) => {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 组件挂载时注册消息监听
onMounted(() => {
  mittBus.on(`socket.${MOCK_INTERVIEW_CHANNEL}`, handleMessage);
  mittBus.on(`socket.${QUIZ_PRACTICE_CHANNEL}`, handleQuizPracticeMessage);
});

// 组件卸载时移除消息监听
onUnmounted(() => {
  mittBus.off(`socket.${MOCK_INTERVIEW_CHANNEL}`, handleMessage);
  mittBus.off(`socket.${QUIZ_PRACTICE_CHANNEL}`, handleQuizPracticeMessage);
});
</script>

<style scoped lang="scss">
.message-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 260px;
  line-height: 45px;
}

.message-list {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;

  .message-item {
    display: flex;
    align-items: flex-start;
    padding: 15px 0;
    border-bottom: 1px solid var(--el-border-color-light);
    cursor: pointer;
    position: relative;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &:last-child {
      border: none;
    }

    &.message-success .message-icon {
      background-color: #67c23a;
      color: white;
    }

    &.message-warning .message-icon {
      background-color: #e6a23c;
      color: white;
    }

    &.message-error .message-icon {
      background-color: #f56c6c;
      color: white;
    }

    &.message-read {
      .message-text, .message-title {
        color: var(--el-text-color-secondary);
      }
    }

    .message-icon {
      min-width: 40px;
      height: 40px;
      margin: 0 15px 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      width: calc(100% - 80px);
      overflow: hidden;

      .message-title {
        margin-bottom: 5px;
        font-weight: bold;
      }

      .message-text {
        margin-bottom: 5px;
        word-break: break-all;
      }

      .message-date {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .message-actions {
      position: absolute;
      right: 10px;
      top: 15px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .message-actions {
      opacity: 1;
    }
  }
}

.message-actions {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
