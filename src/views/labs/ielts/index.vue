<template>
  <div class="ielts-practice-container">
    <!-- 左侧内容区 -->
    <div class="left-section">
      <div style="display: inline-block; padding: 8px 20px; background: #f5f7fa; border-radius: 20px; font-size: 13px; color: #666; margin-bottom: 24px;">
        {{ t('ielts.labs.services') }}
      </div>
      <h1 class="main-title">
        {{ t('ielts.labs.mainTitle') }}
      </h1>
    </div>

    <!-- 右侧卡片区 -->
    <div class="right-section">
      <div class="header-text">
        <h2 class="subtitle">
          {{ t('ielts.labs.subtitle') }}
        </h2>
        <p style="color: #666; font-size: 14px; margin-top: 8px;">
          No pressure.
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span style="color: #999; font-size: 13px;">Microphone access required for speaking test.</span>
          <MicrophonePermission />
        </div>
      </div>

      <div class="cards-container">
        <!-- Part 1 卡片 -->
        <div
          class="practice-card"
          @click="handleStartPractice('part1')"
        >
          <div class="card-icon">
            <el-icon
              :size="48"
              color="#409eff"
            >
              <Notebook />
            </el-icon>
          </div>
          <h3 class="card-title">
            {{ t('ielts.labs.part1Title') }}
          </h3>
          <p class="card-description">
            {{ t('ielts.labs.part1Description') }}
          </p>
        </div>

        <!-- Part 2&3 卡片 -->
        <div
          class="practice-card"
          @click="handleStartPractice('part2-3')"
        >
          <div class="card-icon">
            <el-icon
              :size="48"
              color="#67c23a"
            >
              <Document />
            </el-icon>
          </div>
          <h3 class="card-title">
            {{ t('ielts.labs.part23Title') }}
          </h3>
          <p class="card-description">
            {{ t('ielts.labs.part23Description') }}
          </p>
        </div>
      </div>
    </div>

    <!-- 对话框 -->
    <ConversationDialog
      v-model:visible="conversationVisible"
      :agent-id="currentAgentId"
      @conversation-ended="handleConversationEnded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Notebook, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import MicrophonePermission from '@/views/ielts/mockExam/components/MicrophonePermission.vue'
import ConversationDialog from './components/ConversationDialog.vue'

defineOptions({
  name: 'IeltsPractice'
})

const { t } = useI18n()

// Agent IDs
const AGENT_IDS = {
  'part1': 'agent_4401k96cre39fw4agj3f1na89c2p',
  'part2-3': 'agent_6101k96ddqseesyavhyz62741db7'
}

// 对话状态
const conversationVisible = ref(false)
const currentAgentId = ref('')

const handleStartPractice = (type: string) => {
  // 检查麦克风权限
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => {
      currentAgentId.value = AGENT_IDS[type as keyof typeof AGENT_IDS]
      conversationVisible.value = true
    })
    .catch((error) => {
      console.error('Microphone permission denied:', error)
      ElMessage.error(t('ielts.conversation.microphoneError'))
    })
}

const handleConversationEnded = (conversationId: string) => {
  console.log('Conversation ended, ID:', conversationId)
  // TODO: 保存 conversation_id 用于后续评估
}
</script>

<style lang="scss" scoped>
.ielts-practice-container {
  min-height: 80vh;
  padding: 60px 80px;
  display: flex;
  gap: 80px;
  align-items: center;

  .left-section {
    flex: 1;
    max-width: 500px;

    .main-title {
      font-size: 52px;
      font-weight: 700;
      color: #2c3e50;
      line-height: 1.2;
      margin: 0;
    }
  }

  .right-section {
    flex: 1;
    max-width: 700px;

    .header-text {
      margin-bottom: 32px;

      .subtitle {
        font-size: 28px;
        font-weight: 600;
        color: #2c3e50;
        margin: 0 0 16px 0;
        line-height: 1.4;
      }
    }

    .cards-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;

      .practice-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 32px 24px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid #ebeef5;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

        &:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .card-icon {
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 12px 0;
          line-height: 1.3;
        }

        .card-description {
          font-size: 14px;
          line-height: 1.6;
          color: #606266;
          margin: 0;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .ielts-practice-container {
    flex-direction: column;
    padding: 40px;
    gap: 40px;

    .left-section {
      max-width: 100%;

      .main-title {
        font-size: 48px;
      }
    }

    .right-section {
      max-width: 100%;

      .cards-container {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
