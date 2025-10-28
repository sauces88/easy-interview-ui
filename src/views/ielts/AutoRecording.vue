<template>
  <div class="auto-recording">
    <div class="audio-container">
      <audio
        ref="audioPlayer"
        @ended="onAudioEnded"
        controls
        style="width: 100%; margin-bottom: 20px;"
      >
        <source
          :src="audioUrl"
          type="audio/mpeg"
        >
        您的浏览器不支持音频播放
      </audio>
    </div>

    <div class="recording-container">
      <div
        class="recording-status"
        :style="{ color: recordingStatus === '录制中' ? '#e74c3c' : '#2c3e50', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }"
      >
        {{ recordingStatus }}
      </div>

      <div
        v-if="countdown > 0"
        class="countdown"
        style="color: #e74c3c; fontSize: '16px'; marginBottom: '10px'"
      >
        剩余时间: {{ countdown }}秒
      </div>

      <div class="controls">
        <el-button
          type="primary"
          @click="startRecording"
          :disabled="isRecording || isProcessing"
          v-if="!autoMode"
        >
          开始录制
        </el-button>

        <el-button
          type="danger"
          @click="stopRecording"
          :disabled="!isRecording"
          v-if="!autoMode"
        >
          停止录制
        </el-button>
      </div>

      <div
        v-if="isProcessing"
        class="processing"
        style="marginTop: 20px;"
      >
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        正在处理音频...
      </div>

      <div
        v-if="recognitionResult"
        class="result"
        style="marginTop: 20px; padding: 15px; backgroundColor: '#f8f9fa'; border: '1px solid #dee2e6'; borderRadius: '5px'"
      >
        <h4>识别结果：</h4>
        <p>{{ recognitionResult }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount} from 'vue'
import {ElMessage} from 'element-plus'
import {Loading} from '@element-plus/icons-vue'
import {flashAsrApi} from '@/api/modules/tool/asr'

const audioUrl = 'https://mapi.gealam.com/test/en_male_glen_emo_v2_mars_bigtts-sample.mp3'
const audioPlayer = ref<HTMLAudioElement>()
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])
const isRecording = ref(false)
const isProcessing = ref(false)
const recordingStatus = ref('等待播放音频')
const recognitionResult = ref('')
const countdown = ref(0)
const countdownInterval = ref<NodeJS.Timeout | null>(null)
const autoMode = ref(true)

const initMediaRecorder = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true
    }
  })
  mediaRecorder.value = new MediaRecorder(stream)

  mediaRecorder.value.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.value.push(event.data)
    }
  }

  mediaRecorder.value.onstop = async () => {
    const blob = new Blob(recordedChunks.value, {type: 'audio/wav'})
    const file = new File([blob], 'recording.wav', {type: 'audio/wav'})
    await submitRecording(file)
    recordedChunks.value = []
  }
}

const onAudioEnded = () => {
  recordingStatus.value = '音频播放完成，即将开始录制'
  setTimeout(() => {
    startRecording()
  }, 1000)
}

const startRecording = async () => {
  if (!mediaRecorder.value) {
    await initMediaRecorder()
  }

  if (mediaRecorder.value && mediaRecorder.value.state === 'inactive') {
    isRecording.value = true
    recordingStatus.value = '录制中'
    countdown.value = 5

    mediaRecorder.value.start()

    countdownInterval.value = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        stopRecording()
      }
    }, 1000)
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
    recordingStatus.value = '录制完成，正在处理'

    if (countdownInterval.value) {
      clearInterval(countdownInterval.value)
      countdownInterval.value = null
    }
    countdown.value = 0
  }
}

const submitRecording = async (file: File) => {
  isProcessing.value = true
  recordingStatus.value = '正在识别语音'

  const response = await flashAsrApi(file)
  if (response.code === '0000' && response.data) {
    recognitionResult.value = response.data
    recordingStatus.value = '识别完成'
    ElMessage.success('语音识别成功')
  } else {
    ElMessage.error('语音识别失败')
    recordingStatus.value = '识别失败'
  }

  isProcessing.value = false
}

const playAudio = () => {
  if (audioPlayer.value) {
    recordingStatus.value = '正在播放音频'
    audioPlayer.value.play()
  }
}

onMounted(async () => {
  await initMediaRecorder()
  setTimeout(() => {
    playAudio()
  }, 1000)
})

onBeforeUnmount(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
  if (mediaRecorder.value && mediaRecorder.value.stream) {
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
  }
})
</script>

<style scoped>
.auto-recording {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.audio-container {
  margin-bottom: 30px;
}

.recording-container {
  text-align: center;
}

.countdown {
  font-size: 24px;
  font-weight: bold;
}

.controls {
  margin: 20px 0;
}

.processing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.result {
  text-align: left;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  padding: 15px;
}
</style>
