<template>
  <div class="labs-container">
    <!-- 顶部装饰 -->
    <div class="top-decoration">
      <div class="gradient-blob blob-1" />
      <div class="gradient-blob blob-2" />
    </div>

    <!-- 主内容区 -->
    <div class="labs-content">
      <!-- 头部标题区 -->
      <div class="hero-section">
        <div class="badge animate-fade-in" style="--delay: 0s">
          <span class="badge-dot" />
          <span>{{ t('ielts.labs.services') }}</span>
        </div>

        <h1 class="main-title animate-slide-up" style="--delay: 0.1s">
          {{ t('ielts.labs.mainTitle') }}
        </h1>

        <p class="subtitle animate-slide-up" style="--delay: 0.2s">
          {{ t('ielts.labs.subtitle') }}
        </p>

        <div class="mic-hint animate-fade-in" style="--delay: 0.3s">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <span>Microphone access required for speaking test</span>
          <MicrophonePermission />
        </div>
      </div>

      <!-- 卡片区域 -->
      <div class="cards-grid">
        <!-- Part 1 卡片 -->
        <div
          class="practice-card animate-scale-in"
          style="--delay: 0.4s"
          @click="handleStartPractice('part1')"
        >
          <div class="card-header">
            <div class="card-icon icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <div class="card-badge">Part 1</div>
          </div>

          <h3 class="card-title">{{ t('ielts.labs.part1Title') }}</h3>
          <p class="card-desc">{{ t('ielts.labs.part1Description') }}</p>

          <div class="card-footer">
            <span class="start-text">Start Practice</span>
            <div class="arrow-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Part 2&3 卡片 -->
        <div
          class="practice-card animate-scale-in"
          style="--delay: 0.5s"
          @click="handleStartPractice('part2-3')"
        >
          <div class="card-header">
            <div class="card-icon icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 9h8" />
                <path d="M8 13h6" />
              </svg>
            </div>
            <div class="card-badge">Part 2 & 3</div>
          </div>

          <h3 class="card-title">{{ t('ielts.labs.part23Title') }}</h3>
          <p class="card-desc">{{ t('ielts.labs.part23Description') }}</p>

          <div class="card-footer">
            <span class="start-text">Start Practice</span>
            <div class="arrow-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="bottom-hint animate-fade-in" style="--delay: 0.6s">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>No pressure. Practice at your own pace with AI-powered feedback.</span>
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
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import MicrophonePermission from '@/views/ielts/mockExam/components/MicrophonePermission.vue'
import ConversationDialog from './components/ConversationDialog.vue'

defineOptions({
  name: 'IeltsPractice'
})

const { t } = useI18n()

const AGENT_IDS = {
  'part1': 'agent_4401k96cre39fw4agj3f1na89c2p',
  'part2-3': 'agent_6101k96ddqseesyavhyz62741db7'
}

const conversationVisible = ref(false)
const currentAgentId = ref('')

const handleStartPractice = (type: string) => {
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
}
</script>

<style lang="scss" scoped>
$primary-purple: #7c3aed;
$primary-blue: #3b82f6;
$text-primary: #1a1a2e;
$text-secondary: #64748b;
$bg-light: #f8fafc;
$border-color: #e2e8f0;

.labs-container {
  position: relative;
  min-height: 100vh;
  background: #ffffff;
  overflow: hidden;
}

// 顶部装饰性渐变
.top-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 600px;
  overflow: hidden;
  pointer-events: none;

  .gradient-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;

    &.blob-1 {
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, rgba($primary-purple, 0.15), rgba($primary-blue, 0.1));
      top: -200px;
      right: -100px;
      animation: blobFloat 8s ease-in-out infinite;
    }

    &.blob-2 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, rgba($primary-blue, 0.1), rgba($primary-purple, 0.08));
      top: 100px;
      left: -150px;
      animation: blobFloat 10s ease-in-out infinite reverse;
    }
  }
}

// 主内容区
.labs-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 24px;
}

// 头部区域
.hero-section {
  text-align: center;
  margin-bottom: 64px;

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: $bg-light;
    border: 1px solid $border-color;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 500;
    color: $text-secondary;
    margin-bottom: 24px;

    .badge-dot {
      width: 6px;
      height: 6px;
      background: $primary-purple;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
  }

  .main-title {
    font-size: 48px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
    margin: 0 0 16px;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 18px;
    color: $text-secondary;
    margin: 0 0 24px;
    line-height: 1.6;
  }

  .mic-hint {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: $text-secondary;

    svg {
      color: $primary-purple;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

@keyframes blobFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 20px) scale(1.05); }
}

// 入场动画
.animate-fade-in {
  opacity: 0;
  animation: fadeIn 0.6s ease-out forwards;
  animation-delay: var(--delay, 0s);
}

.animate-slide-up {
  opacity: 0;
  transform: translateY(20px);
  animation: slideUp 0.6s ease-out forwards;
  animation-delay: var(--delay, 0s);
}

.animate-scale-in {
  opacity: 0;
  transform: scale(0.95);
  animation: scaleIn 0.5s ease-out forwards;
  animation-delay: var(--delay, 0s);
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 卡片网格
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

// 练习卡片
.practice-card {
  background: #ffffff;
  border: 1px solid $border-color;
  border-radius: 20px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: transparent;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba($primary-purple, 0.1);
    transform: translateY(-4px);

    .card-footer {
      .arrow-icon {
        transform: translateX(4px);
        background: $primary-purple;
        color: #fff;
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
      transition: transform 0.3s ease;
    }

    &.icon-blue {
      background: rgba($primary-blue, 0.1);
      color: $primary-blue;
    }

    &.icon-purple {
      background: rgba($primary-purple, 0.1);
      color: $primary-purple;
    }
  }

  &:hover .card-icon svg {
    transform: scale(1.1);
  }

  .card-badge {
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
    padding: 6px 12px;
    background: $bg-light;
    border-radius: 100px;
    letter-spacing: 0.02em;
  }

  .card-title {
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 8px;
    line-height: 1.3;
  }

  .card-desc {
    font-size: 14px;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0 0 20px;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .start-text {
      font-size: 14px;
      font-weight: 600;
      color: $primary-purple;
    }

    .arrow-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: $bg-light;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
}

// 底部提示
.bottom-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  color: $text-secondary;

  svg {
    color: $primary-blue;
    flex-shrink: 0;
  }
}

// 响应式
@media (max-width: 768px) {
  .labs-content {
    padding: 48px 20px;
  }

  .hero-section {
    margin-bottom: 40px;

    .main-title {
      font-size: 32px;
    }

    .subtitle {
      font-size: 16px;
    }
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .practice-card {
    padding: 24px;
  }

  .bottom-hint {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>
