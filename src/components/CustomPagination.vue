<template>
  <div class="custom-pagination">
    <div class="pagination-info">
      {{ t('pagination.total') }} {{ total }} {{ t('pagination.items') }}
    </div>
    <div class="pagination-size">
      <el-select
        v-model="currentPageSize"
        @change="handleSizeChange"
        style="width: 120px"
      >
        <el-option
          v-for="size in pageSizes"
          :key="size"
          :value="size"
          :label="`${size}${t('pagination.perPage')}`"
        />
      </el-select>
    </div>
    <el-pagination
      :current-page="currentPage"
      :page-size="currentPageSize"
      :total="total"
      :pager-count="5"
      layout="prev, pager, next"
      @current-change="handleCurrentChange"
      hide-on-single-page
    />
    <div class="pagination-jumper">
      <span>{{ t('pagination.goTo') }}</span>
      <el-input
        v-model.number="jumpNumber"
        type="number"
        :min="1"
        :max="pageCount"
        @keyup.enter="handleJump"
      />
      <span>{{ t('pagination.page') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PropType } from 'vue';

const { t } = useI18n();

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array as PropType<number[]>, default: () => [10, 20, 50, 100] }
});

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'size-change', 'current-change']);

// 内部状态
const currentPageSize = ref(props.pageSize);
const jumpNumber = ref(null);

// 计算总页数
const pageCount = computed(() => {
  return Math.ceil(props.total / currentPageSize.value) || 1;
});

// 监听 props 变化
watch(() => props.pageSize, (newVal) => {
  currentPageSize.value = newVal;
});

// 处理页面大小变化
const handleSizeChange = (size: number) => {
  currentPageSize.value = size;
  emit('update:pageSize', size);
  emit('size-change', size);
};

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  emit('update:currentPage', page);
  emit('current-change', page);
};

// 处理页码跳转
const handleJump = () => {
  if (!jumpNumber.value) return;

  let page: number = jumpNumber.value;

  // 确保页码在有效范围内
  if (page < 1) {
    page = 1;
  } else if (page > pageCount.value) {
    page = pageCount.value;
  }

  handleCurrentChange(page);
  jumpNumber.value = null;
};
</script>

<style scoped>
.custom-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 16px;
}

.pagination-jumper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-jumper .el-input {
  width: 50px;
}
</style>
