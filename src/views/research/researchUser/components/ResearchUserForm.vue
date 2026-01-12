<template>
  <el-dialog
    v-model="visible"
    :title="`${paramsProps.title}`"
    :destroy-on-close="true"
    width="1500px"
    draggable
    :show-header="false"
  >
    <el-row :gutter="20">
      <!-- 左侧：学员信息 -->
      <el-col :span="10">
        <div class="section-box">
          <div class="section-title">
            学员信息
          </div>
          <el-form
            ref="ruleFormRef"
            label-width="90px"
            :rules="rules"
            :model="paramsProps.row"
            @submit.enter.prevent="handleSubmit"
          >
            <el-form-item
              label="姓名"
              prop="name"
            >
              <el-input
                v-model="paramsProps.row.name"
                placeholder="请填写姓名"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="邮箱"
              prop="email"
            >
              <el-input
                v-model="paramsProps.row.email"
                placeholder="请填写邮箱"
                clearable
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item
                  label="年龄"
                  prop="age"
                >
                  <el-input-number
                    v-model="paramsProps.row.age"
                    :precision="0"
                    :min="18"
                    :max="150"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item
                  label="性别"
                  prop="gender"
                >
                  <el-radio-group v-model="paramsProps.row.gender">
                    <el-radio :label="true">
                      男
                    </el-radio>
                    <el-radio :label="false">
                      女
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item
              label="教育经历"
              prop="education"
            >
              <el-input
                v-model="paramsProps.row.education"
                type="textarea"
                :rows="5"
                placeholder="请填写教育经历"
              />
            </el-form-item>
            <el-form-item
              label="工作履历"
              prop="work"
            >
              <el-input
                v-model="paramsProps.row.work"
                type="textarea"
                :rows="5"
                placeholder="请填写工作履历"
              />
            </el-form-item>
            <el-form-item
              label="学习目标"
              prop="goal"
            >
              <el-input
                v-model="paramsProps.row.goal"
                type="textarea"
                :rows="5"
                placeholder="请填写学习目标"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 右侧：项目分配 -->
      <el-col :span="14">
        <div class="section-box">
          <div class="section-title">
            项目分配
          </div>
          <div class="transfer-container">
            <el-transfer
              style="text-align: left"
              v-model="selectProjectIds"
              filterable
              :filter-method="filterMethod"
              :titles="['未分配', '已分配']"
              filter-placeholder="筛选项目"
              :props="transferProps"
              :data="projectList"
            >
              <template #default="{ option }">
                <span :title="option.name">{{ option.name }}</span>
              </template>
            </el-transfer>
          </div>
        </div>
      </el-col>
    </el-row>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { type ElForm, ElMessage } from 'element-plus'
import { getResearchProjListApi } from '@/api/modules/research/researchProj'
import { getProjAssignListApi, createProjAssignApi, removeProjAssignApi } from '@/api/modules/research/projAssign'
import type { IResearchProj } from '@/api/interface/research/researchProj'
import type { IProjAssign } from '@/api/interface/research/projAssign'

defineOptions({
    name: 'ResearchUserForm'
})

const rules = reactive({
  // name: [{ required: true, message: '请填写姓名' }],
  // age: [{ required: true, message: '请填写年龄' }],
  // gender: [{ required: true, message: '请填写性别' }],
  // goal: [{ required: true, message: '请填写学习目标' }],
  email: [{ type: 'email' as const, message: '请输入正确的邮箱格式', trigger: 'blur' }],
})

const visible = ref(false)
const paramsProps = ref<View.DefaultParams>({
  title: '',
  row: {},
  api: undefined,
  getTableList: undefined
})

// 项目列表和选中的项目ID
const projectList = ref<any[]>([])
const selectProjectIds = ref<number[]>([])
const originalProjectIds = ref<number[]>([])

// transfer 组件配置
const transferProps = {
  key: 'id',
  label: 'name'
}

// 过滤项目
const filterMethod = (query: string, item: Record<string, any>) => {
  return item.name.toLowerCase().includes(query.toLowerCase())
}

// 加载项目列表
const loadProjects = async () => {
  const res = await getResearchProjListApi({ page: 1, limit: 1000 })
  if (res.data && res.data.rows) {
    projectList.value = res.data.rows.map((item: IResearchProj.Row) => ({
      id: item.id,
      name: item.name,
      academy: item.academy
    }))
  }
}

// 加载已分配的项目
const loadAssignedProjects = async (researchUserId: number) => {
  const res = await getProjAssignListApi({ researchUserId, page: 1, limit: 1000 })
  if (res.data && res.data.rows) {
    const ids = res.data.rows
      .map((item: IProjAssign.Row) => item.projectId)
      .filter((id): id is number => id !== undefined)
    selectProjectIds.value = ids
    originalProjectIds.value = JSON.parse(JSON.stringify(ids))
  }
}

// 接收父组件传过来的参数
const acceptParams = async (params: View.DefaultParams) => {
  paramsProps.value = params
  visible.value = true

  // 如果是新增模式，设置默认值
  if (!params.row.id) {
    if (params.row.gender === undefined) {
      params.row.gender = true
    }
    if (params.row.age === undefined) {
      params.row.age = 18
    }
  }

  // 加载项目列表
  await loadProjects()

  // 如果是编辑模式，加载已分配的项目
  if (params.row.id) {
    await loadAssignedProjects(params.row.id)
  } else {
    selectProjectIds.value = []
    originalProjectIds.value = []
  }
}

// 保存项目分配
const saveProjectAssign = async (researchUserId: number) => {
  // 找出需要删除的项目（原来有但现在没有的）
  const toDelete = originalProjectIds.value.filter(id => !selectProjectIds.value.includes(id))

  // 找出需要新增的项目（现在有但原来没有的）
  const toAdd = selectProjectIds.value.filter(id => !originalProjectIds.value.includes(id))

  // 删除不再分配的项目
  if (toDelete.length > 0) {
    const deleteRes = await getProjAssignListApi({ researchUserId, page: 1, limit: 1000 })
    if (deleteRes.data && deleteRes.data.rows) {
      const deleteIds = deleteRes.data.rows
        .filter(item => item.projectId && toDelete.includes(item.projectId))
        .map(item => item.id)
        .filter((id): id is number => id !== undefined)

      if (deleteIds.length > 0) {
        await removeProjAssignApi({ ids: deleteIds })
      }
    }
  }

  // 新增分配的项目
  for (const projectId of toAdd) {
    await createProjAssignApi({
      projectId,
      researchUserId
    })
  }
}

// 提交数据（新增/编辑）
const ruleFormRef = ref<InstanceType<typeof ElForm>>()
const handleSubmit = () => {
  ruleFormRef.value!.validate(async (valid) => {
    if (!valid) return

    // 1. 保存学员信息
    const res = await paramsProps.value.api!(paramsProps.value.row)

    // 获取学员ID（新增时从返回结果获取，编辑时从原数据获取）
    const researchUserId = res.data?.id || paramsProps.value.row.id

    // 2. 保存项目分配
    await saveProjectAssign(researchUserId)

    ElMessage.success({ message: `操作成功！` })
    paramsProps.value.getTableList!()
    visible.value = false
  })
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="scss">
.section-box {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0;
  background: #fff;
  height: 100%;

  .section-title {
    padding: 12px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #dcdfe6;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .el-form {
    padding: 20px;
    max-height: 700px;
    overflow-y: auto;
  }
}

.transfer-container {
  padding: 20px;
  min-height: 600px;
  display: flex;
  align-items: stretch;

  :deep(.el-transfer) {
    flex: 1;
    display: flex;
    align-items: stretch;
  }

  :deep(.el-transfer__buttons) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 15px;

    .el-button {
      margin: 0 0 10px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  :deep(.el-transfer-panel) {
    flex: 1;
    width: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-transfer-panel__body) {
    flex: 1;
    height: auto;
  }

  :deep(.el-transfer-panel__list) {
    height: 100%;
  }

  :deep(.el-transfer-panel__item) {
    width: 100%;
    padding-right: 15px;
  }

  :deep(.el-checkbox) {
    width: 100%;

    .el-checkbox__input {
      flex-shrink: 0;
    }
  }

  :deep(.el-checkbox__label) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
  }
}
</style>
