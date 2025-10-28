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
import { computed, onMounted, ref } from 'vue';
import ThemeDrawer from '@/layouts/components/ThemeDrawer/index.vue';
import LayoutVertical from '@/layouts/LayoutVertical/index.vue';
import LayoutClassic from '@/layouts/LayoutClassic/index.vue';
import LayoutTransverse from '@/layouts/LayoutTransverse/index.vue';
import LayoutColumns from '@/layouts/LayoutColumns/index.vue';
import ResearchUserInfoDialog from '@/views/research/researchUser/components/ResearchUserInfoDialog.vue';
import { useAppStore } from '@/stores/modules/app';
import { useSocketStore } from '@/stores/modules/socket';
import { getCurrentResearchUserDetailApi } from '@/api/modules/research/researchUser';

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

// 检查是否需要完善个人信息并修改菜单标题
const checkResearchUserInfo = async () => {
  const { data } = await getCurrentResearchUserDetailApi();
  console.log(Object.keys(data).length === 0)
  if (Object.keys(data).length === 0) {
    // 没有用户数据，重置首页菜单标题为默认值
    appStore.changeHomeTitle('首页', 'Home');
    return;
  }

  // 如果有用户数据，修改首页菜单标题为"课程练习"
  appStore.changeHomeTitle('课程练习', 'Course Practice');

  // 检查个人信息是否完善
  if (!data.name) researchUserInfoDialogRef.value?.open();
};

// 个人信息提交成功后的处理
const handleResearchUserInfoSuccess = () => {
  // 信息提交成功，不需要额外处理，对话框会自动关闭
};

onMounted(() => {
  // 页面加载时检查个人信息
  checkResearchUserInfo();
});
</script>

<style scoped lang="scss">
.layout {
  min-width: 600px;
}
</style>
