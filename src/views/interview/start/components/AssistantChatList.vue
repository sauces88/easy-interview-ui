<template>
  <div class="assistant-chat-list">
    <div class="message-list" ref="messageListRef">
      <el-scrollbar class="custom-scrollbar">
        <el-empty v-if="!hasMessage" description="暂无消息"/>

        <div v-else class="message-wrapper">
          <div
            v-for="(msg, index) in userMessages"
            :key="msg.id"
            class="qa-item"
            :class="{ 'blur-content': isBlurred }"
          >
            <div class="question">
              <div class="question-content">
                <div class="message-content">
                  <p>{{ msg.content }}</p>
                </div>
              </div>
            </div>
            <template v-if="assistantMessages[index]">
              <div class="answer">
                <div class="time-wrapper">
                  <span class="time">{{ formatTime(msg.created_at) }}</span>
                </div>
                <div class="answer-content">
                  <div v-if="!assistantMessages[index].content" class="loading-wrapper">
                    <el-icon class="is-loading"><loading /></el-icon>
                    <span>AI 正在思考中...</span>
                  </div>
                  <template v-else>
                    <v-md-preview :text="assistantMessages[index].content" />
                    <span class="answer-time">
                      {{ formatTime(assistantMessages[index].created_at) }}
                    </span>
                  </template>
                </div>
              </div>
              <div v-if="index < userMessages.length - 1" class="divider"></div>
            </template>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import type { ICoze } from '@/api/interface/interview/coze'
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github'
import '@kangc/v-md-editor/lib/theme/style/github.css'
import { Loading } from '@element-plus/icons-vue'

// VMdPreview 已在 main.ts 中全局配置，这里不需要重复配置

const props = defineProps<{
  messages: ICoze.MessageResponse[]
  isBlurred?: boolean
}>()

const messageListRef = ref<HTMLElement>()

// 格式化时间
const formatTime = (time: string) => {
  // 将字符串时间戳转为数字并乘以1000转换为毫秒
  const timestamp = parseInt(time) * 1000
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 分离用户消息和AI消息
const userMessages = computed(() => {
  return props.messages.filter(msg => msg.role === 'user')
})

const assistantMessages = computed(() => {
  return props.messages.filter(msg => msg.role === 'assistant')
})

// 判断是否有消息
const hasMessage = computed(() => {
  return props.messages && props.messages.length > 0
})

// 滚动到底部
const scrollToBottom = () => {
  if (messageListRef.value) {
    const scrollbar = messageListRef.value.querySelector('.el-scrollbar__wrap')
    if (scrollbar) {
      setTimeout(() => {
        scrollbar.scrollTop = scrollbar.scrollHeight
      }, 100)
    }
  }
}

// 监听消息变化，自动滚动
watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped lang="scss">
.assistant-chat-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  position: relative;

  .message-list {
    flex: 1;
    overflow: hidden;
    padding: 20px;

    // 隐藏滚动条
    :deep(.custom-scrollbar) {
      // 隐藏 webkit 浏览器的滚动条
      .el-scrollbar__wrap {
        &::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      }

      // 隐藏 element-plus 的滚动条
      .el-scrollbar__bar {
        display: none !important;
      }
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .qa-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;

      .question {
        .question-content {
          color: #333;
          line-height: 1.5;
          margin-top: 4px;

          .message-content {
            p {
              margin: 0;
              white-space: pre-line;
              line-height: 1.5;
            }
          }
        }
      }

      .answer {
        .time-wrapper {
          display: flex;
          justify-content: flex-end;
          padding: 4px 0;

          .time {
            font-size: 12px;
            color: #999;
          }
        }

        .answer-content {
          position: relative;
          padding-bottom: 20px;

          .answer-time {
            position: absolute;
            right: 0;
            bottom: 0;
            font-size: 12px;
            color: #999;
            padding: 4px;
          }

          :deep(.v-md-editor) {
            background: transparent;
            border: none;

            // 调整 markdown 内容的样式
            .v-md-preview {
              padding: 0;

              p {
                margin: 0;
                line-height: 1.5;
              }

              // 调整代码块样式
              pre {
                margin: 8px 0;
                border-radius: 4px;
              }

              // 调整列表样式
              ul, ol {
                margin: 4px 0;
                padding-left: 20px;
              }
            }
          }
        }
      }

      .divider {
        height: 1px;
        background-color: #e0e0e0;
        margin: 16px 0;
        width: 100%;
      }
    }
  }

  .message-content {
    padding: 8px 12px;

    p {
      margin: 0;
      white-space: pre-line;
      line-height: 1.5;
    }
  }

  .loading-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #909399;
    padding: 12px;

    .el-icon {
      font-size: 16px;
    }
  }

  .blur-content {
    filter: blur(6px);
    user-select: none;
    pointer-events: none;

    // 添加蒙版效果
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(6px);
      border-radius: 4px;
    }
  }
}
</style>
