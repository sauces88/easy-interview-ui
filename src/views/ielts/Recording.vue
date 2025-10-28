<template>
  <section style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h3>口语评测测试</h3>

    <!-- 参考文本输入 -->
    <div style="margin-bottom: 20px;">
      <label>参考文本:</label>
      <textarea
        v-model="refText"
        rows="3"
        cols="60"
        placeholder="输入参考文本用于评测"
        style="display: block; margin-top: 5px;"
      />
    </div>

    <!-- 录音控制 -->
    <div style="margin-bottom: 20px;">
      <button
        @click="toggleRecording"
        :disabled="isUploading"
        :style="isRecording ? 'background-color: red; color: white;' : isCountingDown ? 'background-color: orange; color: white;' : ''"
      >
        {{ isRecording ? '停止录音' : isCountingDown ? '取消录音' : '开始录音' }}
      </button>

      <button
        @click="clearRecording"
        :disabled="isRecording || isUploading || isCountingDown"
        style="margin-left: 10px;"
      >
        清除录音
      </button>
    </div>

    <!-- 倒计时显示 -->
    <div v-if="isCountingDown" style="color: orange; margin-bottom: 10px; font-size: 18px; font-weight: bold;">
      准备录音... {{ countdown }}秒
    </div>

    <!-- 录音状态显示 -->
    <div v-else-if="isRecording" style="color: red; margin-bottom: 10px;">
      正在录音... {{ recordingTime }}秒
    </div>

    <!-- 录音播放 -->
    <div v-if="recordedAudioUrl" style="margin-bottom: 20px;">
      <p>录音结果:</p>
      <audio :src="recordedAudioUrl" controls />
    </div>

    <!-- 评测按钮 -->
    <button
      @click="submitEvaluation"
      :disabled="!recordedBlob || isUploading || isCountingDown || isRecording"
      style="background-color: #409eff; color: white; padding: 8px 16px; border: none; border-radius: 4px;"
    >
      {{ isUploading ? '评测中...' : '提交评测' }}
    </button>

    <!-- 错误提示 -->
    <p v-if="error" style="color: red; margin-top: 10px;">
      {{ error }}
    </p>

    <!-- 请求耗时 -->
    <p v-if="requestTime > 0" style="color: blue; margin-top: 10px;">
      请求耗时: {{ requestTime }}ms
    </p>

  </section>
</template>

<script setup>
import { ref } from 'vue'
import http from '@/api'
import { ADMIN_MODULE } from '@/api/helper/prefix'

// 状态变量
const refText = ref('Hello, my name is John. Nice to meet you.')
const isRecording = ref(false)
const recordingTime = ref(0)
const isUploading = ref(false)
const error = ref('')
const requestTime = ref(0)
const countdown = ref(0)
const isCountingDown = ref(false)

// 录音相关
const mediaRecorder = ref(null)
const recordedAudioUrl = ref('')
const recordedBlob = ref(null)
const stream = ref(null)
const recordingTimer = ref(null)
const countdownTimer = ref(null)

// 评测结果
const evaluationResult = ref(null)

// 开始/停止录音
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else if (isCountingDown.value) {
    cancelCountdown()
  } else {
    await startCountdown()
  }
}

// 开始倒计时
const startCountdown = async () => {
  try {
    // 先获取麦克风权限
    stream.value = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    error.value = ''
    isCountingDown.value = true
    countdown.value = 2

    countdownTimer.value = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer.value)
        countdownTimer.value = null
        isCountingDown.value = false
        actualStartRecording()
      }
    }, 1000)

  } catch (err) {
    error.value = '无法获取麦克风权限: ' + err.message
    isCountingDown.value = false
  }
}

// 取消倒计时
const cancelCountdown = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  isCountingDown.value = false
  countdown.value = 0

  // 停止音轨
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
}

// 实际开始录音（倒计时完成后调用）
const actualStartRecording = () => {
  if (!stream.value) {
    error.value = '音频流不可用'
    return
  }

  // 使用 Web Audio API 处理音频
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const source = audioContext.createMediaStreamSource(stream.value)

  // 创建音频处理器
  const processor = audioContext.createScriptProcessor(4096, 1, 1)
  const audioChunks = []

  processor.onaudioprocess = (event) => {
    const inputBuffer = event.inputBuffer.getChannelData(0)
    const inputSampleRate = audioContext.sampleRate
    const outputSampleRate = 16000

    // 重采样到 16kHz
    const resampledData = resample(inputBuffer, inputSampleRate, outputSampleRate)

    // 将 Float32Array 转换为 Int16Array (16-bit PCM)
    const int16Array = new Int16Array(resampledData.length)
    for (let i = 0; i < resampledData.length; i++) {
      const sample = Math.max(-1, Math.min(1, resampledData[i]))
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
    }
    audioChunks.push(int16Array)
  }

  source.connect(processor)
  processor.connect(audioContext.destination)

  // 保存处理器引用用于停止
  window.audioProcessor = { audioContext, processor, source, audioChunks }

  isRecording.value = true
  recordingTime.value = 0

  // 开始计时
  recordingTimer.value = setInterval(() => {
    recordingTime.value++
  }, 1000)
}

// 停止录音
const stopRecording = () => {
  if (isRecording.value && window.audioProcessor) {
    const { audioContext, processor, source, audioChunks } = window.audioProcessor

    // 断开音频连接
    source.disconnect()
    processor.disconnect()
    audioContext.close()

    // 合并所有音频块
    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Int16Array(totalLength)
    let offset = 0
    for (const chunk of audioChunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    // 创建 WAV 文件
    const wavBlob = createWavFile(result, 16000) // 使用16kHz采样率
    recordedBlob.value = wavBlob
    recordedAudioUrl.value = URL.createObjectURL(wavBlob)

    // 清理
    window.audioProcessor = null
    isRecording.value = false

    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }

    // 停止所有音轨
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }
  }
}

// 创建 WAV 文件
const createWavFile = (samples, sampleRate) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // WAV 文件头
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  // 写入音频数据
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i], true)
    offset += 2
  }

  return new Blob([view], { type: 'audio/wav' })
}

// 重采样函数 - 线性插值法
const resample = (inputBuffer, inputSampleRate, outputSampleRate) => {
  if (inputSampleRate === outputSampleRate) {
    return inputBuffer
  }

  const ratio = inputSampleRate / outputSampleRate
  const outputLength = Math.floor(inputBuffer.length / ratio)
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const position = i * ratio
    const index = Math.floor(position)
    const fraction = position - index

    if (index + 1 < inputBuffer.length) {
      // 线性插值
      output[i] = inputBuffer[index] * (1 - fraction) + inputBuffer[index + 1] * fraction
    } else {
      output[i] = inputBuffer[index]
    }
  }

  return output
}

// 清除录音
const clearRecording = () => {
  if (recordedAudioUrl.value) {
    URL.revokeObjectURL(recordedAudioUrl.value)
  }
  recordedAudioUrl.value = ''
  recordedBlob.value = null
  error.value = ''
  requestTime.value = 0
}

// 提交评测
const submitEvaluation = async () => {
  if (!recordedBlob.value) {
    error.value = '请先录音'
    return
  }

  error.value = ''
  isUploading.value = true

  const startTime = Date.now()

  const formData = new FormData()
  const file = new File([recordedBlob.value], `recording-${Date.now()}.wav`, {
    type: recordedBlob.value.type
  })
  formData.append('file', file)

  // 只有当输入了参考文本时才添加
  if (refText.value.trim()) {
    formData.append('refText', refText.value.trim())
  }

  try {
    const response = await http.post(ADMIN_MODULE + '/tool/soe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    const endTime = Date.now()
    requestTime.value = endTime - startTime
    console.log('评测成功:', response.data)

  } catch (err) {
    error.value = err.response?.data?.message || err.message || '评测失败'
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
button {
  margin-top: 8px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

audio {
  display: block;
  margin-top: 8px;
}
</style>