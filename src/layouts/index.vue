<!-- 💥 这里是一次性加载 LayoutComponents -->
<template>
  <component :is="LayoutComponents[layout]" />
  <ThemeDrawer />
  <ResearchUserInfoDialog
    ref="researchUserInfoDialogRef"
    @success="handleResearchUserInfoSuccess"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, provide } from 'vue';
import ThemeDrawer from '@/layouts/components/ThemeDrawer/index.vue';
import LayoutVertical from '@/layouts/LayoutVertical/index.vue';
import LayoutClassic from '@/layouts/LayoutClassic/index.vue';
import LayoutTransverse from '@/layouts/LayoutTransverse/index.vue';
import LayoutColumns from '@/layouts/LayoutColumns/index.vue';
import ResearchUserInfoDialog from '@/views/research/researchUser/components/ResearchUserInfoDialog.vue';
import { useAppStore } from '@/stores/modules/app';
import { useSocketStore } from '@/stores/modules/socket';
import { getCurrentResearchUserDetailApi } from '@/api/modules/research/researchUser';
import { getCurrentResearchSubscribeDetailApi } from '@/api/modules/research/researchSubscribe';
import type { IResearchUser } from '@/api/interface/research/researchUser';

defineOptions({
  name: 'Layout'
});

const LayoutComponents = {
  vertical: LayoutVertical,
  classic: LayoutClassic,
  transverse: LayoutTransverse,
  columns: LayoutColumns
};

const appStore = useAppStore();
const layout = computed(() => appStore.layout);

// 开启socket
const socketStore = useSocketStore();
socketStore.open();

// 个人信息完善对话框
const researchUserInfoDialogRef = ref<InstanceType<typeof ResearchUserInfoDialog>>();

// 用户数据和订阅数据
const researchUserData = ref<IResearchUser.Row | null>(null);
const researchSubscriptionData = ref<any>(null);

// 提供给子组件使用
provide('researchUserData', researchUserData);
provide('researchSubscriptionData', researchSubscriptionData);
provide('reloadResearchData', loadResearchData);

// 加载研究用户和订阅数据
async function loadResearchData() {
  try {
    const { data: userData } = await getCurrentResearchUserDetailApi();
    researchUserData.value = userData;

    if (Object.keys(userData).length === 0) {
      appStore.changeHomeTitle('首页', 'Home');
      researchSubscriptionData.value = null;
      return;
    }

    appStore.changeHomeTitle('课程练习', 'Course Practice');

    // 检查个人信息是否完善
    if (!userData.name) {
      researchUserInfoDialogRef.value?.open();
    }

    // 获取订阅数据
    try {
      const { data: subscribeData } = await getCurrentResearchSubscribeDetailApi();
      researchSubscriptionData.value = subscribeData;
    } catch (error) {
      researchSubscriptionData.value = null;
    }
  } catch (error) {
    console.error('加载用户数据失败', error);
    researchUserData.value = null;
    researchSubscriptionData.value = null;
    appStore.changeHomeTitle('首页', 'Home');
  }
}

// 个人信息提交成功后的处理
const handleResearchUserInfoSuccess = () => {
  // 重新加载数据
  loadResearchData();
};

onMounted(() => {
  // 页面加载时检查个人信息
  loadResearchData();
});
</script>

<style scoped lang="scss">
.layout {
  min-width: 600px;
}
</style>
