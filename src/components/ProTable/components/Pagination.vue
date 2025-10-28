<template>
  <!-- 分页组件 -->
  <div class="pagination">
    <el-pagination
      :background="true"
      :current-page="pageable.pageNum"
      :page-size="pageable.pageSize"
      :page-sizes="[10, 25, 50, 100]"
      :total="pageable.total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <template #total>
        {{ t('pagination.total') }} {{ pageable.total }} {{ t('pagination.items') }}
      </template>
      <template #sizes="{ size }">
        <span>{{ size }}</span>{{ t('pagination.perPage') }}
      </template>
      <template #jumper>
        <span>{{ t('pagination.goTo') }}</span>
        <el-input
          class="pagination-jump-input"
          type="number"
          v-model.number="jumpPageNumber"
          :min="1"
          :max="Math.ceil(pageable.total / pageable.pageSize) || 1"
          @keyup.enter="handleJumpPage"
        />
        <span>{{ t('pagination.page') }}</span>
      </template>
    </el-pagination>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Pageable {
  pageNum: number;
  pageSize: number;
  total: number;
}

interface PaginationProps {
  pageable: Pageable;
  handleSizeChange: (size: number) => void;
  handleCurrentChange: (currentPage: number) => void;
}

const props = defineProps<PaginationProps>();

// 跳转页码输入
const jumpPageNumber = ref<number | null>(null);

// 计算总页数
const pageCount = computed(() => {
  return Math.ceil(props.pageable.total / props.pageable.pageSize) || 1;
});

// 跳转到指定页
const handleJumpPage = () => {
  if (jumpPageNumber.value === null) return;
  
  let pageNum = jumpPageNumber.value;
  
  // 确保页码在有效范围内
  if (pageNum < 1) {
    pageNum = 1;
  } else if (pageNum > pageCount.value) {
    pageNum = pageCount.value;
  }
  
  props.handleCurrentChange(pageNum);
  jumpPageNumber.value = null; // 清空输入
};
</script>

<style scoped>
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.pagination-jump-input {
  width: 50px;
  margin: 0 6px;
}
</style>
