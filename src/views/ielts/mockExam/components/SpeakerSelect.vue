<template>
  <div class="mock-interview-section">
    <div class="section-header">
      <div class="header-left">
        <el-icon class="section-icon">
          <InfoFilled />
        </el-icon>
        <slot name="headerText">
          <span>{{ t('ielts.mockExam.selectSpeakerTip') }}</span>
        </slot>
      </div>
      <div class="header-right">
        <MicrophonePermission @permission-changed="handleMicrophoneChange" />
      </div>
    </div>

    <!-- 考官选择网格 -->
    <div class="speakers-grid">
      <div
        v-for="speaker in speakers"
        :key="speaker.id"
        class="speaker-card"
        :class="{ 'selected': selectedSpeaker?.id === speaker.id }"
        @click="handleSpeakerSelect(speaker)"
      >
        <div
          class="speaker-avatar"
          @click.stop="toggleAudio(speaker)"
        >
          <img
            v-if="speaker.image"
            :src="speaker.image"
            :alt="speaker.name"
          >
          <div
            v-else
            class="default-avatar"
          >
            {{ speaker.name?.charAt(0) || 'S' }}
          </div>
          <div
            v-if="speaker.audio"
            class="audio-overlay"
            :class="{ 'is-playing': playingSpeakerId === speaker.id }"
          >
            <el-icon class="play-icon">
              <VideoPlay v-if="playingSpeakerId !== speaker.id" />
              <VideoPause v-else />
            </el-icon>
          </div>
        </div>
        <div class="speaker-name">
          {{ speaker.name || t('ielts.mockExam.standardInterviewer') }}
        </div>
      </div>
    </div>

    <!-- 开始测试按钮区域 - 插槽 -->
    <div class="start-test-section">
      <slot
        name="actionButton"
        :selected-speaker="selectedSpeaker"
        :microphone-granted="microphoneGranted"
      >
        <el-button
          :disabled="!selectedSpeaker || !microphoneGranted"
          @click="$emit('startTest')"
          class="start-test-btn"
        >
          <el-icon style="margin-right: 8px; font-size: 20px">
            <VideoPlay />
          </el-icon>
          {{ t('ielts.mockExam.startIELTSTest') }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import type { ISpeaker } from '@/api/interface/ielts/speaker'
import MicrophonePermission from './MicrophonePermission.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props
interface Props {
  speakers: ISpeaker.Row[]
  selectedSpeaker?: ISpeaker.Row
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  speakerSelect: [speaker: ISpeaker.Row]
  microphoneChange: [granted: boolean]
  startTest: []
}>()

// 麦克风权限
const microphoneGranted = ref(false)

// 音频播放相关
const playingSpeakerId = ref<number>()
const currentAudio = ref<HTMLAudioElement>()

// 处理考官选择
const handleSpeakerSelect = (speaker: ISpeaker.Row) => {
  emit('speakerSelect', speaker)
}

// 处理麦克风权限变化
const handleMicrophoneChange = (granted: boolean) => {
  microphoneGranted.value = granted
  emit('microphoneChange', granted)
}

// 停止当前播放的音频
const stopCurrentAudio = () => {
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
    currentAudio.value = undefined
    playingSpeakerId.value = undefined
  }
}

// 切换音频播放/暂停
const toggleAudio = (speaker: ISpeaker.Row) => {
  if (playingSpeakerId.value === speaker.id) {
    // 如果正在播放当前音频，则暂停
    stopCurrentAudio()
  } else {
    // 停止当前播放的音频（如果有）
    stopCurrentAudio()

    // 播放新音频
    if (speaker.audio) {
      const audio = new Audio(speaker.audio)
      currentAudio.value = audio
      playingSpeakerId.value = speaker.id

      // 音频播放结束时重置状态
      audio.addEventListener('ended', () => {
        playingSpeakerId.value = undefined
        currentAudio.value = undefined
      })

      // 音频播放错误时重置状态
      audio.addEventListener('error', () => {
        console.error('音频播放失败')
        ElMessage.error(t('ielts.mockExam.audioPlayFailed'))
        playingSpeakerId.value = undefined
        currentAudio.value = undefined
      })

      audio.play().catch(error => {
        console.error('音频播放失败：', error)
        ElMessage.error(t('ielts.mockExam.audioPlayFailed'))
        playingSpeakerId.value = undefined
        currentAudio.value = undefined
      })
    }
  }
}
</script>

<style scoped lang="scss">
.mock-interview-section {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 40px;
  border: 1px solid #ebeef5;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .section-icon {
        color: #409eff;
        font-size: 16px;
      }

      span {
        color: #606266;
        font-size: 14px;
      }
    }

    .header-right {
      flex-shrink: 0;
    }
  }

  .speakers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .speaker-card {
      position: relative;
      text-align: center;
      padding: 20px;
      border: 2px solid #ebeef5;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      background: #fff;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      }

      &.selected {
        border-color: #409eff;
        background: #f0f9ff;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }

      .speaker-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        margin: 0 auto 12px;
        overflow: hidden;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .default-avatar {
          font-size: 32px;
          font-weight: 600;
          color: #909399;
        }

        .audio-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;

          .play-icon {
            font-size: 28px;
            color: white;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }

          &.is-playing {
            opacity: 1;
            background: rgba(46, 139, 250, 0.8);
          }
        }

        &:hover .audio-overlay {
          opacity: 1;
        }
      }

      .speaker-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;
      }

      .locked-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #f5f7fa;
        color: #909399;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
  }

  .select-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #909399;
    font-size: 14px;
    margin-bottom: 24px;
  }
}

.start-test-section {
  margin-top: 24px;
  text-align: center;

  .start-test-btn {
    background: #2E8BFA;
    border: none;
    border-radius: 8px;
    height: 48px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(46, 139, 250, 0.2);

    &:hover:not(:disabled) {
      background: #1E7AE0;
      box-shadow: 0 4px 12px rgba(46, 139, 250, 0.3);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: scale(0.98) translateY(0);
    }

    &:disabled {
      background: #c0c4cc;
      box-shadow: none;
      cursor: not-allowed;
    }
  }
}

@media screen and (max-width: 768px) {
  .mock-interview-section {
    padding: 20px;

    .speakers-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;

      .speaker-card {
        padding: 16px;

        .speaker-avatar {
          width: 60px;
          height: 60px;

          .default-avatar {
            font-size: 24px;
          }
        }
      }
    }
  }
}
</style>
