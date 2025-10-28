<template>
  <el-dialog
    v-model="visible"
    title="练习记录"
    width="1200px"
    destroy-on-close
    class="practice-records-dialog"
  >
    <!-- 搜索栏 -->
    <el-form
      :inline="true"
      class="search-form"
    >
      <el-form-item label="学员名称">
        <el-input
          v-model="searchParams.name"
          placeholder="请输入学员名称"
          clearable
          @keyup.enter="handleSearch"
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="searchParams.status"
          placeholder="请选择状态"
          clearable
          style="width: 150px"
        >
          <el-option
            label="未完结"
            :value="0"
          />
          <el-option
            label="已完结"
            :value="1"
          />
          <el-option
            label="强制完结"
            :value="2"
          />
          <el-option
            label="异常"
            :value="3"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          @click="handleSearch"
          :icon="Search"
          plain
        >
          搜索
        </el-button>
        <el-button
          @click="handleReset"
          :icon="Refresh"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      border
      stripe
      style="width: 100%"
      header-align="center"
    >
      <el-table-column
        type="index"
        label="序号"
        width="60"
        align="center"
      />
      <el-table-column
        prop="researchProj.name"
        label="项目名称"
        min-width="180"
        align="center"
      />
      <el-table-column
        prop="researchUser.name"
        label="学员名称"
        min-width="120"
        align="center"
      />
      <el-table-column
        label="状态"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="createTime"
        label="创建时间"
        width="180"
      />
      <el-table-column
        label="操作"
        width="120"
        align="center"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="handleViewDetail(row)"
            :icon="View"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="searchParams.page"
        v-model:page-size="searchParams.limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- 详情对话框 -->
    <PracticeDetail ref="practiceDetailRef" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import { getProjTaskListApi } from '@/api/modules/research/projTask'
import type { IProjTask } from '@/api/interface/research/projTask'
import type { IResearchProj } from '@/api/interface/research/researchProj'
import PracticeDetail from './PracticeDetail.vue'

const visible = ref(false)
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const selectedProject = ref<IResearchProj.Row>()

const searchParams = reactive<IProjTask.Query>({
  page: 1,
  limit: 10,
  name: '',
  status: undefined,
  researchProjId: undefined
})

// 详情组件引用
const practiceDetailRef = ref<InstanceType<typeof PracticeDetail>>()

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const { data } = await getProjTaskListApi(searchParams)
    if (data) {
      tableData.value = data.rows || []
      total.value = data.total || 0
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  searchParams.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchParams.name = ''
  searchParams.status = undefined
  searchParams.page = 1
  loadData()
}

// 获取状态类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<number, 'success' | 'warning' | 'info' | 'danger'> = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    0: '未完结',
    1: '已完结',
    2: '强制完结',
    3: '异常'
  }
  return textMap[status] || '未知'
}

// 查看详情
const handleViewDetail = (row: any) => {
  practiceDetailRef.value?.open(row.id)
}

// 打开对话框
const open = (project: IResearchProj.Row) => {
  selectedProject.value = project
  searchParams.researchProjId = project.id
  searchParams.page = 1
  searchParams.name = ''
  searchParams.status = undefined
  visible.value = true
  loadData()
}

defineExpose({
  open
})
</script>

<style scoped lang="scss">
.practice-records-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
