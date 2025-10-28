<template>
  <section>
    <h2>Vue3 TTS 测试</h2>

    <!-- 输入框 -->
    <textarea
      v-model="text"
      rows="4"
      cols="60"
      placeholder="输入要合成的文本"
    />

    <!-- 输入框 -->
    <textarea
      v-model="speaker"
      rows="4"
      cols="60"
      placeholder="输入发音人"
    />

    <!-- 按钮 -->
    <button
      @click="handleFetch"
      :disabled="loading"
    >
      {{ loading ? '合成中...' : '立即合成' }}
    </button>

    <button
      @click="sendMessage"
    >
      发送消息
    </button>

    <button
      @click="toggleRecording"
      :disabled="loading"
      :style="isRecording ? 'background-color: red; color: white;' : ''"
    >
      {{ isRecording ? '停止录音' : '开始录音' }}
    </button>

    <!-- 报错提示 -->
    <p
      v-if="error"
      style="color: red"
    >
      {{ error }}
    </p>

    <!-- 请求耗时 -->
    <p
      v-if="requestTime > 0"
      style="color: blue; margin-top: 10px;"
    >
      请求耗时: {{ requestTime }}ms
    </p>

    <!-- 音频播放器 -->
    <audio
      v-if="audioUrl"
      :src="audioUrl"
      controls
      autoplay
    />

    <!-- 录音播放器 -->
    <div v-if="recordedAudioUrl">
      <p>录音结果:</p>
      <audio
        :src="recordedAudioUrl"
        controls
      />
      <p
        v-if="uploadedAudioUrl"
        style="color: green;"
      >
        上传成功: {{ uploadedAudioUrl }}
      </p>
    </div>

    <hr>

    <!-- WebSocket返回的音频播放器 -->
    <div v-if="receivedAudioUrl">
      <p>接收到的音频:</p>
      <audio
        :src="receivedAudioUrl"
        controls
        autoplay
      />
    </div>

    <hr>

    <!--    <AutoRecording style="margin-left: 100px" />-->

    <!-- 口语评测组件 -->
    <Recording />

    <hr>
  </section>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import http from '@/api'
import {ADMIN_MODULE} from '@/api/helper/prefix'
import {useSocketStore} from '@/stores/modules/socket'
import {uploadFile} from '@/api/modules/system/upload'
import AutoRecording from "@/views/ielts/AutoRecording.vue";
import Recording from "@/views/ielts/Recording.vue";

/* 状态 */
const text = ref('My name is Amanda. Nice to meet you')
const speaker = ref("en_male_glen_emo_v2_mars_bigtts")
const loading = ref(false)
const error = ref('')
const audioUrl = ref('')
const requestTime = ref(0)

// 录音相关状态
const isRecording = ref(false)
const mediaRecorder = ref(null)
const recordedAudioUrl = ref('')
const recordedBlob = ref(null)
const uploadedAudioUrl = ref('')
const receivedAudioUrl = ref('')

/* 方法 */
async function handleFetch() {
  error.value = ''
  URL.revokeObjectURL(audioUrl.value) // 释放旧地址
  audioUrl.value = ''
  loading.value = true

  // try {
  //   const res = await http.post(ADMIN_MODULE + `/tool/tts?text=${text.value}&speaker=${speaker.value}`, {},
  //        {responseType: 'blob'}
  //    )
  //   // 生成 blob URL
  //   const blob = new Blob([res.data], { type: 'audio/wav' })
  //   audioUrl.value = URL.createObjectURL(blob)
  // } catch (e) {
  //   error.value = e.response?.data || e.message || '未知错误'
  // } finally {
  //   loading.value = false
  // }

  const startTime = Date.now()
  try {
    const res = await http.post(ADMIN_MODULE + `/tool/extra/tts?text=${text.value}&speaker=${speaker.value}`, {})
    const endTime = Date.now()
    requestTime.value = endTime - startTime
    const {topicPractice, audioBase64} = res.data
    const byte = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
    //const blob = new Blob([byte], {type:'audio/wav'})
    const blob = new Blob([byte], {type:'audio/mpeg'})
    audioUrl.value = URL.createObjectURL(blob)
    console.log(topicPractice)
  }catch (e) {
    error.value = e.response?.data || e.message || '未知错误'
  }finally{
    loading.value = false
  }
}

const socketStore = useSocketStore()
// function sendMessage() {
//   // 发送TTS请求
//   socketStore.send({
//     text: text.value,
//     speaker: speaker.value
//   }, "IELTS_MOCK_CHANNEL")
// }
// 录音功能
async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true
    }
  })

  // 使用 Web Audio API 处理音频
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const source = audioContext.createMediaStreamSource(stream)

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
  window.ttsAudioProcessor = { audioContext, processor, source, audioChunks, stream }

  isRecording.value = true
}

function stopRecording() {
  if (isRecording.value && window.ttsAudioProcessor) {
    const { audioContext, processor, source, audioChunks, stream } = window.ttsAudioProcessor

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

    // 上传录音文件
    uploadRecordedAudio(wavBlob, 'audio/wav')

    // 清理
    window.ttsAudioProcessor = null
    isRecording.value = false

    // 停止所有音轨
    stream.getTracks().forEach(track => track.stop())
  }
}

// 上传录音文件
async function uploadRecordedAudio(blob, mimeType) {
  loading.value = true
  // 强制使用wav扩展名（即使实际是其他格式）
  const extension = 'wav'
  const file = new File([blob], `recording-${Date.now()}.${extension}`, { type: mimeType })

  // 创建FormData对象
  const formData = new FormData()
  formData.append('file', file)
  formData.append('dirTag', 'audio')

  await uploadFile(formData).then(res => {
    uploadedAudioUrl.value = res.data.url
  }).catch(err => {
    console.error('录音上传失败:', err)
    error.value = '录音上传失败'
  }).finally(() => {
    loading.value = false
  })
}

function sendMessage() {
  const message = {
    mockExamDetailId: null,
    speakerId: 7,
    audioUrl: uploadedAudioUrl.value || ""
  }
  socketStore.send(message, "IELTS_MOCK_CHANNEL")
}

///=============

import mittBus from '@/utils/mittBus';
import {IELTS_MOCK_CHANNEL} from "@/config/consts";
onMounted(() => {
  mittBus.on(`socket.${IELTS_MOCK_CHANNEL}`, data=>{
    // mockExamDetailId 如果正常回答了问题，则mockExamDetailId为下一个问题的id，否则依旧为当前问题的id
    // finishFlag 如果part2无法作答，或回答过于简单，该字段为true
    // audioBase64 音频base64，接收后需立刻播放
    // extraAudioBase64 扩展base64，作用于Part2等待用户思考1分钟后播放，需要处理 思考时间倒计时
    // error 错误消息
    // extraData 扩展数据，参考下方：
    // 消息类型1：MockExamVO  点击开始模拟考试后会返回的数据格式
    // 消息类型2：List<MockExamDetailVO>   这里为Par3的题
    // 消息类型3：ApiResult 最后一题回答完成后的成功消息响应
    // 消息类型4：null
    // public class MockExamVO {
    //   @Schema(description =  "主键")
    //   private Long id;
    //   @Schema(description =  "状态(0=初始化,1=未完结,2=已完结,3=异常)")
    //   private Integer status;
    //   @Schema(description =  "评测结果")
    //   private String evaluation;
    //   @Schema(description =  "评语")
    //   private String comment;
    //   @Schema(description =  "对话记录")
    //   private String chats;
    //   @Schema(description =  "处理结果")
    //   private String result;
    //   private List<MockExamDetailVO> mockExamDetailList;
    // }
    // public class MockExamDetailVO {
    //   @Schema(description =  "主键")
    //   private Long id;
    //   @Schema(description =  "雅思模拟考试主键")
    //   private Long mockExamId;
    //   @Schema(description =  "问题主键")
    //   private Long quizId;
    //   @Schema(description ="扩展数据")
    //   private String extra;
    //   @Schema(description =  "本题答题音频")
    //   private String audio;
    //   @Schema(description =  "本题答题音频文本")
    //   private String audioText;
    //   @Schema(description =  "处理结果")
    //   private String result;
    // }
    // const {mockExamDetailId, finishFlag,  audioBase64, extraAudioBase64, extraData, error} = JSON.parse(data)
    const {audioBase64} = JSON.parse(data)

    if (audioBase64) {
      // 释放之前的音频URL
      if (receivedAudioUrl.value) {
        URL.revokeObjectURL(receivedAudioUrl.value)
      }

      // 将base64转换为Blob并创建URL
      const byteCharacters = atob(audioBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], {type: 'audio/mpeg'})
      receivedAudioUrl.value = URL.createObjectURL(blob)
    }
  });
});

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

</script>

<style scoped>
button {
  margin-top: 8px;
}
audio {
  display: block;
  margin-top: 12px;
}
</style>
