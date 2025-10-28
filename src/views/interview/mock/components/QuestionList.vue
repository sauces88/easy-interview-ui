<template>
  <div class="question-list-container">
    <div class="interview-prep-header">
      <h1 class="interview-title">{{ t('interview.mock.title') }}</h1>
    </div>

    <div class="questions-content">
      <QuestionItem
        v-for="(question, index) in questions"
        :key="question.id"
        :question="question"
        :index="index"
        :totalQuestions="totalQuestionCount"
        :isFinished="answeredQuestions.includes(question.id!)"
        :totalAnswered="answeredQuestions.length"
        @answer-submitted="handleAnswerSubmitted"
        @skip-question="handleSkipQuestion(index)"
        v-show="currentQuestionIndex === index"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import QuestionItem from './QuestionItem.vue';
import { updateMockInterviewQaWithFileApi, removeMockInterviewQaApi } from '@/api/modules/interview/mockInterviewQa';
import { getQuestionCompanyDetailApi } from '@/api/modules/interview/questionCompany';
import { getQuestionRoleDetailApi } from '@/api/modules/interview/questionRole';
import type { IMockInterviewQa } from '@/api/interface/interview/mockInterviewQa';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  mockInterviewId: number;
  questions: IMockInterviewQa.Row[];
  companyId?: number;
  roleId?: number;
}>();

const emit = defineEmits<{
  (e: 'interview-completed'): void;
}>();

const { t } = useI18n();

const currentQuestionIndex = ref(0);
const answeredQuestions = ref<number[]>([]);
const skippedQuestions = ref<number[]>([]);
const company = ref('');
const role = ref('');
const totalQuestionCount = ref(0);

// 处理问题回答提交
const handleAnswerSubmitted = async (answer: IMockInterviewQa.Form & { file?: File }) => {
  try {
    // 检查是否有音频文件
    if (answer.file) {
      await updateMockInterviewQaWithFileApi({
        id: answer.id,
        mockInterviewId: answer.mockInterviewId,
        questionId: answer.questionId,
        file: answer.file
      });

      // 更新已回答问题列表
      if (answer.id && !answeredQuestions.value.includes(answer.id)) {
        answeredQuestions.value.push(answer.id);
      }

      // 自动进入下一题
      if (currentQuestionIndex.value < props.questions.length - 1) {
        currentQuestionIndex.value++;
      } else {
        // 如果是最后一题，发送完成信号
        if (answeredQuestions.value.length > 0) {
          ElMessage.success(t('interview.mock.allQuestionsAnswered'));
          emit('interview-completed');
        }
      }
    } else {
      // 如果没有音频文件，显示错误信息
      ElMessage.error(t('interview.mock.pleaseRecordAudio'));
    }
  } catch (error) {
    console.error('提交回答失败:', error);
    ElMessage.error(t('interview.mock.answerSubmitFailed'));
  }
};

// 处理跳过问题
const handleSkipQuestion = async (index: number) => {
  // 如果只有一个问题，不允许跳过
  if (props.questions.length === 1) {
    ElMessage.warning(t('interview.mock.cannotSkipSingleQuestion'));
    return;
  }

  const questionId = props.questions[index].id;
  if (questionId && !skippedQuestions.value.includes(questionId)) {
    skippedQuestions.value.push(questionId);

    // 减少问题总数计数
    totalQuestionCount.value--;

    // 调用接口删除该题目记录
    try {
      await removeMockInterviewQaApi({ ids: [questionId] });
    } catch (error) {
      console.error('删除问题记录失败:', error);
      ElMessage.error(t('interview.mock.deleteRecordFailed'));
    }
  }

  // 自动进入下一题
  if (currentQuestionIndex.value < props.questions.length - 1) {
    currentQuestionIndex.value++;
  } else {
    // 如果是最后一题，发送完成信号
    if (answeredQuestions.value.length > 0) {
      ElMessage.success(t('interview.mock.interviewCompleted'));
      emit('interview-completed');
    } else {
      ElMessage.warning(t('interview.mock.pleaseAnswerOneQuestion'));
    }
  }
};

// 初始化
onMounted(async () => {
  // 获取公司和职位信息
  try {
    // 设置初始问题总数
    totalQuestionCount.value = props.questions.length;

    if (props.companyId) {
      const companyRes = await getQuestionCompanyDetailApi({ id: props.companyId });
      company.value = companyRes.data.name || '';
    }

    if (props.roleId) {
      const roleRes = await getQuestionRoleDetailApi({ id: props.roleId });
      role.value = roleRes.data.name || '';
    }

    // 检查哪些问题已经回答过
    props.questions.forEach(question => {
      if (question.id && question.content) {
        answeredQuestions.value.push(question.id);
      }
    });

    // 自动跳过已经回答过的问题
    let foundUnanswered = false;
    for (let i = 0; i < props.questions.length; i++) {
      const questionId = props.questions[i].id;
      if (questionId && !answeredQuestions.value.includes(questionId)) {
        currentQuestionIndex.value = i;
        foundUnanswered = true;
        break;
      }
    }

    // 如果所有问题都已回答，则保持在最后一题
    if (!foundUnanswered && props.questions.length > 0) {
      currentQuestionIndex.value = props.questions.length - 1;
    }
  } catch (error) {
    console.error('获取信息失败:', error);
  }
});
</script>

<style scoped>
.question-list-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.interview-prep-header {
  text-align: center;
  margin-bottom: 30px;
}

.interview-title {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 15px;
  font-weight: 600;
}

.questions-content {
  margin-bottom: 30px;
}
</style>
 