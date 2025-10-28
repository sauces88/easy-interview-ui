<template>
  <div class="question-item">
    <div class="interview-prep-header">
      <div class="question-indicator">
        <el-icon class="question-icon"><Clock /></el-icon>
        <span class="progress-text">{{ t('interview.question.questionProgress', { current: totalAnswered, total: totalQuestions }) }}</span>
      </div>
    </div>

    <div class="question-content-container">
      <!-- 公司和职位标签 -->
      <div class="tags-container">
        <div class="tag company-tag" v-if="question.questionCompanyName || question.questionCompanyNameUs">
          <el-icon><OfficeBuilding /></el-icon>
          {{ getLocalizedCompanyName(question) }}
        </div>
        <div class="tag role-tag" v-if="question.questionRoleName || question.questionRoleNameUs">
          {{ getLocalizedRoleName(question) }}
        </div>
        <div class="tag topic-tag" v-for="tag in getLocalizedTags(question.tags, question.tagsUs)" :key="tag">
          {{ tag }}
        </div>
        <!-- 如果没有任何标签，显示默认标签 -->
        <div class="tag default-tag" v-if="!question.questionCompanyName && !question.questionCompanyNameUs && !question.questionRoleName && !question.questionRoleNameUs && !question.tags && !question.tagsUs">
          {{ t('interview.question.title') }}
        </div>
      </div>

      <!-- 问题内容 -->
      <div class="question-content">
        <h3>{{ getLocalizedQuestionContent(question) }}</h3>
      </div>

      <!-- 录音按钮 -->
      <div class="recording-section" v-if="!isFinished">
        <div class="recording-instruction">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #title>
              {{ t('interview.question.recordingInstruction') }}
            </template>
          </el-alert>
        </div>

        <!-- 未录音状态显示开始录音按钮 -->
        <el-button
          v-if="!hasRecorded && !isAnswering"
          type="primary"
          class="recording-button"
          @click="startRecording()"
        >
          <el-icon><Microphone /></el-icon>
          {{ t('interview.question.startRecording') }}
          <span class="time-limit">{{ t('interview.question.timeLimit') }}</span>
        </el-button>

        <!-- 录音中显示停止录音按钮 -->
        <el-button
          v-if="isAnswering"
          type="danger"
          class="recording-button"
          @click="stopRecording()"
        >
          <el-icon><Mute /></el-icon>
          {{ t('interview.question.stopRecording') }}
          <span class="time-limit">{{ t('interview.question.timeLimit') }}</span>
        </el-button>

        <!-- 录音完成提示 -->
        <div v-if="hasRecorded && !isAnswering" class="recording-complete">
          <div class="recording-duration">
            {{ t('interview.question.recordingComplete', { duration: formatTime(timer) }) }}
          </div>
        </div>

        <!-- 录音完成后显示重新录制和提交按钮 -->
        <div v-if="hasRecorded && !isAnswering" class="action-buttons">
          <el-button
            class="retry-button"
            @click="retryRecording()"
          >
            {{ t('interview.question.retryRecording') }}
          </el-button>
          <el-button
            type="primary"
            class="submit-button"
            @click="submitAnswer()"
          >
            <el-icon><Position /></el-icon>
            {{ t('interview.question.submitAnswer') }}
          </el-button>
        </div>

        <div v-if="isAnswering" class="timer-display">
          {{ formatTime(timer) }}
        </div>

        <div v-if="!isAnswering && !hasRecorded" class="skip-question">
          <el-tooltip :content="t('interview.question.skipTooltip')" placement="top">
            <a href="javascript:void(0)" @click="confirmSkip">{{ t('interview.question.skipQuestion') }} <el-icon><CaretRight /></el-icon></a>
          </el-tooltip>
        </div>

      </div>

      <!-- 回答内容（已完成状态） -->
      <div class="answer-section" v-if="isFinished">
        <div class="user-answer">
          <h4>{{ t('interview.question.yourAnswer') }}</h4>
          <p>{{ answer.content }}</p>
          <div class="answer-info">
            <span>{{ t('interview.question.answerDuration', { duration: formatTime(answer.duration || 0) }) }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Clock, Microphone, OfficeBuilding, ArrowRight, Mute, CaretRight, Position } from '@element-plus/icons-vue';
import type { IMockInterviewQa } from '@/api/interface/interview/mockInterviewQa';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/modules/app';

// TypeScript声明
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface Props {
  question: IMockInterviewQa.Row;
  index: number;
  totalQuestions: number;
  isFinished: boolean;
  totalAnswered: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'answer-submitted', data: IMockInterviewQa.Form): void;
  (e: 'skip-question'): void;
}>();

const answerContent = ref('');
const isAnswering = ref(false);
const isSubmitting = ref(false);
const hasRecorded = ref(false);
const recordedFile = ref<File | null>(null);
const timer = ref(0);
let timerInterval: NodeJS.Timeout | null = null;
const MAX_RECORDING_TIME = 120; // 2分钟的最大录音时间（秒）

// 录音相关变量
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioStream: MediaStream | null = null;
const audioContext = ref<AudioContext | null>(null);

const answer = computed(() => {
  return {
    mockInterviewId: props.question.mockInterviewId,
    questionId: props.question.questionId,
    duration: timer.value,
    content: answerContent.value || '用户通过录音回答了此问题'
  };
});

const { t } = useI18n();
const appStore = useAppStore();

// 初始化音频上下文
onMounted(() => {
  if (window.AudioContext || window.webkitAudioContext) {
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
  } else {
    ElMessage.warning(t('interview.question.browserNotSupported'));
  }
});

// 开始录音和计时
const startRecording = async () => {
  try {
    // 请求麦克风权限
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1, // 单声道
        sampleRate: 16000 // 16000 Hz采样率
      }
    });

    // 创建MediaRecorder实例
    mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: 'audio/webm' // 先用webm格式录制，后面会转换为wav
    });

    // 收集音频数据
    audioChunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // 开始录音
    mediaRecorder.start();
    isAnswering.value = true;
    timer.value = 0;

    // 启动计时器
    timerInterval = setInterval(() => {
      timer.value += 1;

      // 如果达到最大时间限制，自动停止录音
      if (timer.value >= MAX_RECORDING_TIME) {
        stopRecording();
      }
    }, 1000);

    ElMessage.success(t('interview.question.recordingStarted'));
  } catch (error) {
    console.error('无法访问麦克风:', error);
    ElMessage.error(t('interview.question.microphoneError'));
  }
};

// 确认跳过问题
const confirmSkip = () => {
  ElMessageBox.confirm(
    t('interview.question.skipConfirmContent'),
    t('interview.question.skipConfirmTitle'),
    {
      confirmButtonText: t('interview.question.skipConfirmButton'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  )
    .then(() => {
      skipQuestion();
    })
    .catch(() => {
      // 用户取消操作，不做任何处理
    });
};

// 将音频数据转换为WAV格式 (16000 Hz, 单声道, 16位)
const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 将录制的音频转换为ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // 解码音频数据
      const audioBuffer = await audioContext.value!.decodeAudioData(arrayBuffer);

      // 创建离线上下文进行重采样
      const offlineCtx = new OfflineAudioContext(
        1, // 单声道
        audioBuffer.duration * 16000, // 总采样数 = 时长 * 采样率
        16000 // 目标采样率
      );

      // 创建音频源
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      // 渲染音频
      const renderedBuffer = await offlineCtx.startRendering();

      // 将AudioBuffer转换为WAV格式
      const wavBuffer = audioBufferToWav(renderedBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      resolve(wavBlob);
    } catch (error) {
      console.error('音频转换失败:', error);
      reject(error);
    }
  });
};

// AudioBuffer转WAV格式 (16位)
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const numChannels = 1; // 单声道
  const sampleRate = 16000;
  const format = 1; // PCM格式
  const bitDepth = 16; // 16位
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  // 创建WAV文件的ArrayBuffer
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // WAV文件头
  writeString(view, 0, 'RIFF'); // ChunkID
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(view, 8, 'WAVE'); // Format
  writeString(view, 12, 'fmt '); // Subchunk1ID
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample
  writeString(view, 36, 'data'); // Subchunk2ID
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // 写入音频数据
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // 将float32转换为int16
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, value, true);
    offset += 2;
  }

  return arrayBuffer;
};

// 辅助函数：将字符串写入DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// 停止录音但不提交
const stopRecording = async () => {
  try {
    isSubmitting.value = true;

    // 停止计时器
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // 停止录音
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();

      // 等待录音数据处理完成
      await new Promise<void>((resolve) => {
        mediaRecorder!.onstop = async () => {
          try {
            // 合并音频块
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

            // 转换为WAV格式 (16000 Hz, 单声道, 16位)
            const wavBlob = await convertToWav(audioBlob);

            // 创建文件对象
            const file = new File([wavBlob], `answer_${props.question.id}.wav`, {
              type: 'audio/wav',
              lastModified: Date.now()
            });

            // 保存文件但不提交
            recordedFile.value = file;
            hasRecorded.value = true;
            ElMessage.success(t('interview.question.recordingCompleted'));
            resolve();
          } catch (error) {
            console.error('音频处理失败:', error);
            ElMessage.error(t('interview.question.audioProcessError'));
            resolve();
          }
        };
      });
    }

    // 关闭麦克风
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }

    isAnswering.value = false;
    isSubmitting.value = false;

  } catch (error) {
    console.error('录音处理失败:', error);
    ElMessage.error(t('interview.question.recordingProcessError'));
    isSubmitting.value = false;

    // 关闭麦克风
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }
  }
};

// 重新录制
const retryRecording = () => {
  hasRecorded.value = false;
  recordedFile.value = null;
  timer.value = 0;
};

// 提交回答
const submitAnswer = () => {
  if (recordedFile.value) {
    // 提交回答给父组件处理，符合后台要求的参数格式
    emit('answer-submitted', {
      id: props.question.id,
      mockInterviewId: props.question.mockInterviewId,
      questionId: props.question.questionId,
      file: recordedFile.value
    });

    ElMessage.success(t('interview.question.answerSubmitted'));
  } else {
    ElMessage.warning(t('interview.question.pleaseRecordFirst'));
  }
};

// 跳过当前问题
const skipQuestion = () => {
  emit('skip-question');
};

// 格式化时间，将秒数转换为分:秒的格式
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 获取本地化的公司名称
const getLocalizedCompanyName = (question: IMockInterviewQa.Row): string => {
  return appStore.language === 'zh-CN' ? 
    (question.questionCompanyName || '') : 
    (question.questionCompanyNameUs || question.questionCompanyName || '');
};

// 获取本地化的职位名称
const getLocalizedRoleName = (question: IMockInterviewQa.Row): string => {
  return appStore.language === 'zh-CN' ? 
    (question.questionRoleName || '') : 
    (question.questionRoleNameUs || question.questionRoleName || '');
};

// 获取本地化的标签
const getLocalizedTags = (tags: string | undefined, tagsUs: string | undefined): string[] => {
  if (!tags && !tagsUs) return [];
  const tagsString = appStore.language === 'zh-CN' ? tags : (tagsUs || tags);
  if (!tagsString) return [];
  // 先按逗号分割，然后对每个标签再按&分割
  return tagsString.split(',').flatMap(tag => tag.split('&').map(t => t.trim())).filter(Boolean);
};

// 获取本地化的问题内容
const getLocalizedQuestionContent = (question: IMockInterviewQa.Row): string => {
  return appStore.language === 'zh-CN' ? 
    (question.questionContent || question.content || '') : 
    (question.questionContentUs || question.questionContent || question.content || '');
};

// 组件销毁时清除计时器和关闭麦克风
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
  }
});
</script>

<style scoped>
.question-item {
  background-color: #f8f9fd;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.interview-prep-header {
  margin-bottom: 20px;
}

.question-indicator {
  display: flex;
  align-items: center;
  background-color: #f0f7ff;
  border: 1px solid #c2e0ff;
  border-radius: 20px;
  padding: 8px 16px;
  color: #5a6bff;
  font-weight: 500;
  display: inline-flex;
}

.question-icon {
  margin-right: 8px;
  font-size: 16px;
}

.question-count {
  margin-right: 15px;
}

.progress-text {
  color: #5a6bff;
  font-weight: 500;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tag {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.tag .el-icon {
  margin-right: 6px;
  font-size: 14px;
}

.company-tag {
  background-color: #feefef;
  color: #e74c3c;
}

.role-tag {
  background-color: #e7f5f9;
  color: #29b6f6;
}

.topic-tag {
  background-color: #343a6e;
  color: white;
}

.default-tag {
  background-color: #f0f2f5;
  color: #606266;
}

.question-content-container {
  background: white;
  border-radius: 12px;
  padding: 28px;
}

.question-content h3 {
  font-size: 18px;
  line-height: 1.6;
  color: #333;
  margin-top: 0;
  margin-bottom: 30px;
}

.recording-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30px;
  padding: 30px 0;
}

.recording-instruction {
  margin-bottom: 20px;
  width: 100%;
  max-width: 600px;
}

.recording-instruction :deep(.el-alert__title) {
  font-size: 16px;
  font-weight: 500;
}

.recording-instruction :deep(.el-alert__content) {
  padding: 8px 0;
}

.recording-instruction p {
  margin: 5px 0 0;
  font-size: 14px;
  color: #606266;
}

.recording-button {
  background-color: #e11d48;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 20px 30px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80%;
  max-width: 400px;
  position: relative;
  transition: all 0.3s ease;
}

.recording-button.el-button--primary {
  background-color: #e74c3c;
}

.recording-button.el-button--danger {
  background-color: #e74c3c;
}

.recording-button:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.recording-button:focus, .recording-button:active {
  outline: none;
  background-color: #c0392b;
}

.recording-button .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.time-limit {
  font-size: 14px;
  margin-left: 5px;
  opacity: 0.8;
}

.timer-display {
  font-size: 24px;
  font-weight: bold;
  color: #e74c3c;
  margin-top: 15px;
}

.skip-question {
  margin-top: 16px;
}

.skip-question a {
  color: #5a6bff;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.skip-question .el-icon {
  margin-left: 5px;
  font-size: 12px;
}

.answer-section {
  margin-top: 24px;
  border-top: 1px solid #eaeaea;
  padding-top: 20px;
}

.user-answer h4 {
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 12px;
  color: #444;
}

.user-answer p {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.answer-info {
  color: #909399;
  font-size: 14px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
  gap: 16px;
}

.retry-button {
  flex: 1;
  background-color: #ffffff;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  height: 50px;
}

.submit-button {
  flex: 1;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
}

.retry-button:hover {
  background-color: #f2f6fc;
  border-color: #c6e2ff;
}

.submit-button:hover {
  background-color: #c0392b;
}

.retry-button:focus, .submit-button:focus {
  outline: none;
}

.submit-button .el-icon {
  margin-right: 6px;
  font-size: 16px;
}

.recording-complete {
  margin-top: 20px;
  text-align: center;
  width: 100%;
  max-width: 600px;
}

.recording-duration {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 20px;
}
</style>
 