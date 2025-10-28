<template>
  <div
    class="audio-section"
    v-if="audioUrl"
  >
    <div class="audio-waveform">
      <div class="waveform-container">
        <canvas
          ref="waveformCanvas"
          class="waveform-canvas"
          :class="{ 'clickable': clickable }"
          @click="handleCanvasClick"
        />
      </div>
      <audio
        ref="audioRef"
        :src="audioUrl"
        preload="metadata"
        :autoplay="autoplay"
        @play="handleAudioPlay"
        @ended="handleAudioEnd"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        style="display: none;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

interface Props {
  audioUrl: string
  autoplay?: boolean
  clickable?: boolean
}

interface Emits {
  (e: 'ended'): void
  (e: 'manual-click'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 音频相关状态
const audioRef = ref<HTMLAudioElement | null>(null)
const isAudioPlaying = ref(false)
const currentTime = ref(0)
const audioDuration = ref(0)
const waveformCanvas = ref<HTMLCanvasElement | null>(null)
const waveformData = ref<number[]>([])

// 生成波形数据
const generateWaveformData = async () => {
  if (!audioRef.value || !waveformCanvas.value || !props.audioUrl) return

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const response = await fetch(props.audioUrl)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const channelData = audioBuffer.getChannelData(0)
    const samples = 200 // 波形条数
    const blockSize = Math.floor(channelData.length / samples)
    const waveData: number[] = []

    for (let i = 0; i < samples; i++) {
      let sum = 0
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j])
      }
      waveData.push(sum / blockSize)
    }

    // 归一化数据
    const max = Math.max(...waveData)
    waveformData.value = waveData.map(val => val / max)

    drawWaveform()
  } catch (error) {
    console.error('生成波形数据失败:', error)
    // 如果失败，生成模拟数据
    waveformData.value = Array.from({ length: 200 }, () => Math.random())
    drawWaveform()
  }
}

// 绘制波形图
const drawWaveform = () => {
  if (!waveformCanvas.value || waveformData.value.length === 0) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置canvas尺寸
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const width = rect.width
  const height = rect.height
  const barWidth = width / waveformData.value.length
  const progress = audioDuration.value > 0 ? currentTime.value / audioDuration.value : 0

  // 清除画布
  ctx.clearRect(0, 0, width, height)

  // 绘制波形
  waveformData.value.forEach((amplitude, index) => {
    const barHeight = amplitude * height * 0.8
    const x = index * barWidth
    const y = (height - barHeight) / 2

    // 判断是否在播放进度内
    const isPlayed = index < waveformData.value.length * progress

    ctx.fillStyle = isPlayed ? '#409eff' : '#e0e0e0'
    ctx.fillRect(x, y, barWidth - 1, barHeight)
  })
}

// 音频事件处理
const handleAudioPlay = () => {
  isAudioPlaying.value = true
}

const handleTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
    drawWaveform()
  }
}

const handleLoadedMetadata = () => {
  if (audioRef.value) {
    audioDuration.value = audioRef.value.duration
    // 在 watchEffect 中已经处理了新音频检测，这里只需要确保绘制
    drawWaveform()
  }
}

const handleAudioEnd = () => {
  isAudioPlaying.value = false
  // 不重置 currentTime，保持在结束位置
  // currentTime.value = 0
  drawWaveform()
  emit('ended')
}

// 记录上一个音频内容的哈希值，用于判断是否是真正的新音频
const previousAudioHash = ref('')

// 计算音频内容的哈希值
const calculateAudioHash = async (audioUrl: string): Promise<string> => {
  try {
    const response = await fetch(audioUrl)
    const arrayBuffer = await response.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    console.error('计算音频哈希失败:', error)
    return Math.random().toString() // 失败时返回随机值，确保重新生成
  }
}

// 监听音频URL变化，重新生成波形
watchEffect(() => {
  if (props.audioUrl) {
    // 计算音频内容哈希，判断是否是真正的新音频
    calculateAudioHash(props.audioUrl).then(currentHash => {
      if (currentHash !== previousAudioHash.value) {
        // 真正的新音频，重置播放状态和时间
        isAudioPlaying.value = false
        currentTime.value = 0
        previousAudioHash.value = currentHash

        // 延迟一下让audio元素完全加载
        setTimeout(() => {
          generateWaveformData()
        }, 100)
      } else {
        // 相同音频内容，只需要重新绘制（不重置播放状态）
        setTimeout(() => {
          drawWaveform()
        }, 100)
      }
    })
  }
})

// 处理画布点击事件
const handleCanvasClick = (event: MouseEvent) => {
  if (!props.clickable || !waveformCanvas.value || !audioRef.value || audioDuration.value === 0) return

  const rect = waveformCanvas.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const progress = clickX / rect.width

  // 发送手动点击事件
  emit('manual-click')

  // 设置播放位置
  audioRef.value.currentTime = progress * audioDuration.value

  // 如果当前没有播放，开始播放
  if (!isAudioPlaying.value) {
    audioRef.value.play()
  }
}

// 播放控制
const play = () => {
  audioRef.value?.play()
}

const pause = () => {
  audioRef.value?.pause()
}

const stop = () => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
}

// 重置状态
const resetState = () => {
  isAudioPlaying.value = false
  currentTime.value = 0
  audioDuration.value = 0
  waveformData.value = []
  previousAudioHash.value = ''
}

defineExpose({
  play,
  pause,
  stop,
  resetState
})
</script>

<style lang="scss" scoped>
.audio-section {
  //padding: 4px;
  text-align: center;

  .audio-waveform {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e6e8eb;

    .waveform-container {
      .waveform-canvas {
        width: 100%;
        height: 80px;
        border-radius: 8px;
        background: transparent;

        &.clickable {
          cursor: pointer;

          &:hover {
            opacity: 0.8;
          }
        }

        &:not(.clickable) {
          cursor: default;
        }
      }
    }
  }
}
</style>
