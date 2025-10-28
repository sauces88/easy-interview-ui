<template>
  <el-dialog
    v-model="visible"
    :destroy-on-close="true"
    width="1300px"
    :show-header="false"
  >
    <el-row :gutter="20">
      <!-- 左侧：项目编辑 -->
      <el-col :span="11">
        <div class="section-box">
          <div class="section-title">
            项目信息
          </div>
          <el-form
            ref="ruleFormRef"
            label-width="90px"
            :rules="rules"
            :model="paramsProps.row"
            @submit.enter.prevent="handleSubmit"
          >
            <el-form-item
              label="项目名称"
              prop="name"
            >
              <el-input
                v-model="paramsProps.row.name"
                placeholder="请输入项目名称"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="所属院校"
              prop="academy"
            >
              <el-input
                v-model="paramsProps.row.academy"
                placeholder="请输入所属院校"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="项目简介"
              prop="intro"
            >
              <el-input
                v-model="paramsProps.row.intro"
                type="textarea"
                :rows="6"
                placeholder="请输入项目简介"
              />
            </el-form-item>

            <el-form-item
              label="学习方向"
              prop="direction"
            >
              <el-input
                v-model="paramsProps.row.direction"
                type="textarea"
                :rows="6"
                placeholder="请输入学习方向"
              />
            </el-form-item>

            <el-form-item
              label="掌握技能"
              prop="skill"
            >
              <el-input
                v-model="paramsProps.row.skill"
                type="textarea"
                :rows="6"
                placeholder="请输入掌握技能"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 右侧：题目抽取规则配置 -->
      <el-col :span="13">
        <div class="section-box">
          <div class="section-title">
            <span>题型抽取规则配置</span>
            <el-button
              type="primary"
              size="small"
              :icon="Plus"
              @click="addConfig"
            >
              添加抽取规则
            </el-button>
          </div>

          <div class="config-area">
            <el-empty
              v-if="questionConfigs.length === 0"
              description="暂无配置"
              :image-size="100"
            />

            <div
              v-else
              class="config-list"
            >
              <div
                v-for="(config, index) in questionConfigs"
                :key="index"
                class="config-item"
              >
                <div class="item-form">
                  <el-form label-width="80px">
                    <el-form-item label="题型类型">
                      <el-select
                        v-model="config.type"
                        placeholder="请选择"
                        @change="handleTypeChange(config, index)"
                      >
                        <el-option
                          v-for="item in questionTypeOptions"
                          :key="item.value"
                          :label="`${item.label} (${item.count}题)`"
                          :value="item.value"
                          :disabled="isTypeDisabled(item.value, index)"
                        />
                      </el-select>
                    </el-form-item>

                    <el-row :gutter="12">
                      <el-col :span="12">
                        <el-form-item label="抽取数量">
                          <el-input-number
                            v-model="config.extractNum"
                            :min="1"
                            :max="getMaxExtractNum(config.type as any)"
                            controls-position="right"
                          />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="抽取规则">
                          <el-select
                            v-model="config.extractRule"
                            placeholder="请选择"
                            disabled
                          >
                            <el-option
                              v-for="item in extractRuleOptions"
                              :key="item.value"
                              :label="item.label"
                              :value="item.value"
                            />
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>
                </div>
                <el-icon
                  class="item-delete"
                  @click="removeConfig(index)"
                >
                  <Close />
                </el-icon>
              </div>
            </div>
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
import {
  Plus,
  Close
} from '@element-plus/icons-vue'
import type { IProjQuestionConfig } from '@/api/interface/research/projQuestionConfig'
import {
  getProjQuestionConfigListApi,
  createProjQuestionConfigApi,
  updateProjQuestionConfigApi,
  removeProjQuestionConfigApi
} from '@/api/modules/research/projQuestionConfig'
import { getResearchQuestionListApi } from '@/api/modules/research/researchQuestion'

defineOptions({
    name: 'ResearchProjForm'
})

const rules = reactive({
  name: [{ required: true, message: '请输入项目名称' }],
  academy: [{ required: true, message: '请输入所属院校' }],
  direction: [{ required: true, message: '请输入学习方向' }],
  skill: [{ required: true, message: '请输入掌握技能' }],
})

const visible = ref(false)
const paramsProps = ref<View.DefaultParams>({
  title: '',
  row: {},
  api: undefined,
  getTableList: undefined
})

// 题型选项（从后端动态加载）
const questionTypeOptions = ref<Array<{ label: string; value: string; count: number }>>([])

// 题型对应的题目数量映射
const typeCountMap = ref<Record<string, number>>({})

// 抽取规则选项（暂只支持随机抽取）
const extractRuleOptions = [
  { label: '随机抽取', value: '0' }
]

// 题目配置列表
const questionConfigs = ref<IProjQuestionConfig.Form[]>([])

// 原始配置列表（用于对比删除）
const originalConfigs = ref<IProjQuestionConfig.Form[]>([])

// 添加配置
const addConfig = () => {
  questionConfigs.value.push({
    projectId: paramsProps.value.row.id,
    type: '',
    extractNum: 1,
    extractRule: '0'
  })
}

// 删除配置（仅从列表中移除，不立即调用接口）
const removeConfig = (index: number) => {
  questionConfigs.value.splice(index, 1)
}

// 加载题目配置
const loadQuestionConfigs = async (projectId: number) => {
  const res = await getProjQuestionConfigListApi({ projectId, page: 1, limit: 100 })
  if (res.data && res.data.rows) {
    const configs = res.data.rows.map(item => ({
      id: item.id,
      projectId: item.projectId,
      type: item.type,
      extractNum: item.extractNum,
      extractRule: item.extractRule
    }))
    questionConfigs.value = JSON.parse(JSON.stringify(configs))
    originalConfigs.value = JSON.parse(JSON.stringify(configs))
  }
}

// 获取指定题型的最大抽取数量
const getMaxExtractNum = (type: string) => {
  return typeCountMap.value[type] || 999
}

// 判断题型是否已被使用（禁用状态）
const isTypeDisabled = (type: string, currentIndex: number) => {
  // 检查是否有其他配置项使用了该题型
  return questionConfigs.value.some((config, index) => {
    return index !== currentIndex && config.type === type
  })
}

// 题型变化时的处理
const handleTypeChange = (config: IProjQuestionConfig.Form, currentIndex: number) => {
  const selectedType = config.type || ''

  // 检查是否重复
  const isDuplicate = questionConfigs.value.some((item, index) => {
    return index !== currentIndex && item.type === selectedType
  })

  if (isDuplicate) {
    ElMessage.warning('该题型已存在，请选择其他题型')
    config.type = '' // 清空选择
    return
  }

  const maxNum = getMaxExtractNum(selectedType)
  // 如果当前抽取数量超过最大值，自动调整为最大值
  if (config.extractNum && config.extractNum > maxNum) {
    config.extractNum = maxNum
  }
}

// 加载题型选项（从后端提取）
const loadQuestionTypes = async (projectId: number) => {
  const res = await getResearchQuestionListApi({ projectId, page: 1, limit: 1000 })

  if (res?.data?.rows && Array.isArray(res.data.rows)) {
    const types = res.data.rows
      .map((item: any) => item.type)
      .filter((type: string) => type && type.trim())

    // 统计每个题型的数量
    const typeCounts: Record<string, number> = {}
    types.forEach((type: string) => {
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    typeCountMap.value = typeCounts

    const uniqueTypes = [...new Set(types)]
    questionTypeOptions.value = uniqueTypes.map(type => ({
      label: type,
      value: type,
      count: typeCounts[type] || 0
    }))
  } else {
    questionTypeOptions.value = []
    typeCountMap.value = {}
  }
}

// 接收父组件传过来的参数
const acceptParams = async (params: View.DefaultParams) => {
  paramsProps.value = params
  visible.value = true

  // 如果是编辑模式且有项目ID，加载题目配置和题型选项
  if (params.row.id) {
    await loadQuestionTypes(params.row.id) // 先加载题型选项
    await loadQuestionConfigs(params.row.id) // 再加载配置
  } else {
    // 新增模式，清空配置列表和题型选项
    questionConfigs.value = []
    originalConfigs.value = []
    questionTypeOptions.value = []
    typeCountMap.value = {}
  }
}

// 验证题目配置
const validateConfigs = () => {
  // 检查是否有重复的题型
  const typeSet = new Set<string>()

  for (let i = 0; i < questionConfigs.value.length; i++) {
    const config = questionConfigs.value[i]
    if (!config.type) {
      ElMessage.warning(`第${i + 1}行：请选择题型类型`)
      return false
    }

    // 检查题型是否重复
    if (typeSet.has(config.type)) {
      ElMessage.warning(`第${i + 1}行：题型"${config.type}"重复，每个题型只能配置一次`)
      return false
    }
    typeSet.add(config.type)

    if (!config.extractNum || config.extractNum < 1) {
      ElMessage.warning(`第${i + 1}行：请输入抽取数量（≥1）`)
      return false
    }

    // 验证抽取数量不能超过该题型的题目总数
    const maxNum = getMaxExtractNum(config.type)
    if (config.extractNum > maxNum) {
      ElMessage.warning(`第${i + 1}行：该题型只有${maxNum}道题目，抽取数量不能超过${maxNum}`)
      return false
    }

    if (!config.extractRule) {
      ElMessage.warning(`第${i + 1}行：请选择抽取规则`)
      return false
    }
  }
  return true
}

// 保存题目配置
const saveQuestionConfigs = async (projectId: number) => {
  // 1. 找出需要删除的配置ID（原始有但当前没有的）
  const deletedIds = originalConfigs.value
    .filter(original => {
      return original.id && !questionConfigs.value.some(current => current.id === original.id)
    })
    .map(config => config.id!)
    .filter(id => id !== undefined)

  // 批量删除配置
  if (deletedIds.length > 0) {
    await removeProjQuestionConfigApi({ ids: deletedIds })
  }

  // 2. 新增或更新配置
  for (const config of questionConfigs.value) {
    config.projectId = projectId
    if (config.id) {
      // 更新
      await updateProjQuestionConfigApi(config)
    } else {
      // 新增
      await createProjQuestionConfigApi(config)
    }
  }
}

// 提交数据（新增/编辑）
const ruleFormRef = ref<InstanceType<typeof ElForm>>()
const handleSubmit = () => {
  ruleFormRef.value!.validate(async (valid) => {
    if (!valid) return

    // 验证题目配置
    if (!validateConfigs()) return

    // 保存项目信息
    const res = await paramsProps.value.api!(paramsProps.value.row)

    // 获取项目ID（新增时从返回结果获取，编辑时从原数据获取）
    const projectId = res.data?.id || paramsProps.value.row.id

    // 保存题目配置（包括新增、更新、删除）
    // 只要有原始配置或当前配置，就需要调用保存
    if (originalConfigs.value.length > 0 || questionConfigs.value.length > 0) {
      await saveQuestionConfigs(projectId)
    }

    ElMessage.success({ message: `${paramsProps.value.title}成功！` })
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
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .el-form {
    padding: 20px;
    max-height: 600px;
    overflow-y: auto;
  }
}

.config-area {
  padding: 16px;
  min-height: 550px;
  max-height: 600px;
  overflow-y: auto;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px 16px 12px 12px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: #fafafa;
  position: relative;

  .item-form {
    flex: 1;

    .el-select,
    .el-input-number {
      width: 100%;
    }

    :deep(.el-form-item) {
      margin-bottom: 10px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .item-delete {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 16px;
    color: #909399;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #f56c6c;
    }
  }
}
</style>
