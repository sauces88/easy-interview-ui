<template>
  <!-- 查询表单 card -->
  <SearchForm
    v-show="isShowSearch"
    :search="_search"
    :reset="_reset"
    :columns="searchColumnsData"
    :search-param="searchParam"
    :search-col="searchCol"
  />

  <!-- 表格内容 card -->
  <div class="card table-main">
    <!-- 表格头部 操作按钮 -->
    <div class="table-header">
      <div class="header-button-lf">
        <slot
          name="tableHeader"
          :selected-list-ids="selectedListIds"
          :selected-list="selectedList"
          :is-selected="isSelected"
        />
      </div>
      <div
        v-if="toolButton"
        class="header-button-ri"
      >
        <slot name="toolButton">
          <el-button
            v-if="showToolButton('refresh')"
            :icon="Refresh"
            circle
            @click="getTableList"
          />
          <el-button
            v-if="showToolButton('setting') && columns.length"
            :icon="Operation"
            circle
            @click="openColSetting"
          />
          <el-button
            v-if="showToolButton('search') && searchColumnsData.length"
            :icon="Search"
            circle
            @click="isShowSearch = !isShowSearch"
          />
        </slot>
      </div>
    </div>

    <!-- 表格主体 -->
    <el-table
      v-if="reload"
      :class="randomTableClass"
      ref="tableRef"
      v-bind="$attrs"
      :data="processTableData"
      :border="border"
      :row-key="rowKey"
      @selection-change="selectionChange"
      v-loading="loading"
    >
      <!-- 默认插槽 -->
      <slot />
      <template
        v-for="item in tableColumns"
        :key="item"
      >
        <!-- selection || radio || index || expand || sort -->
        <el-table-column
          v-if="item.type && columnTypes.includes(item.type)"
          v-bind="item"
          :align="item.align ?? 'center'"
          :reserve-selection="item.type === 'selection'"
        >
          <template #default="scope">
            <!-- expand -->
            <template v-if="item.type == 'expand'">
              <component
                :is="item.render"
                v-bind="scope"
                v-if="item.render"
              />
              <slot
                v-else
                :name="item.type"
                v-bind="scope"
              />
            </template>
            <!-- radio -->
            <el-radio
              v-if="item.type == 'radio'"
              v-model="radio"
              :value="scope.row[rowKey]"
            >
              <i />
            </el-radio>
            <!-- sort -->
            <el-tag
              v-if="item.type == 'sort'"
              type="primary"
              class="move"
            >
              <el-icon>
                <DCaret />
              </el-icon>
            </el-tag>
          </template>
        </el-table-column>
        <!-- other -->
        <TableColumn
          v-if="!item.type && item.prop && item.isShow"
          :column="item"
        >
          <template
            v-for="slot in Object.keys($slots)"
            #[slot]="scope"
          >
            <slot
              :name="slot"
              v-bind="scope"
            />
          </template>
        </TableColumn>
      </template>
      <!-- 插入表格最后一行之后的插槽 -->
      <template #append>
        <slot name="append" />
      </template>
      <!-- 无数据 -->
      <template #empty>
        <div class="table-empty">
          <slot name="empty">
            <img
              src="@/assets/images/notData.png"
              alt="notData"
            >
            <div>暂无数据</div>
          </slot>
        </div>
      </template>
    </el-table>

    <!-- 替换原有分页组件为自定义分页组件 -->
    <CustomPagination
      v-if="pagination"
      v-model:current-page="pageable.pageNum"
      v-model:page-size="pageable.pageSize"
      :total="pageable.total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>

  <!-- 列设置 -->
  <ColSetting
    v-if="toolButton"
    ref="colRef"
    v-model:col-setting="colSetting"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, provide, onMounted, reactive, unref, nextTick } from 'vue';
import { useTable } from '@/hooks/useTable';
import { useSelection } from '@/hooks/useSelection';
import { Refresh, Operation, Search, DCaret } from '@element-plus/icons-vue';
import { generateUUID, handleProp } from '@/utils';
import SearchForm from '@/components/SearchForm/index.vue';
import CustomPagination from "@/components/CustomPagination.vue";
import ColSetting from './components/ColSetting.vue';
import TableColumn from './components/TableColumn.vue';
import type { ColumnProps, ProTableProps, TypeProps } from '@/components/ProTable/interface';
import Sortable from 'sortablejs';
import { useI18n } from 'vue-i18n';
import { getMenuTitle } from '@/utils/i18n';

defineOptions({
  name: 'ProTable',
  inheritAttrs: false
});

const { t, locale } = useI18n();

// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<ProTableProps>(), {
  columns: () => [],
  searchColumns: () => [],
  requestAuto: true,
  pagination: true,
  initParam: {},
  border: true,
  toolButton: true,
  rowKey: 'id',
  searchCol: () => ({ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 })
});

// 创建响应式的表格列配置
const tableColumns = reactive<ColumnProps[]>([]);

// 初始化和更新表格列
const initTableColumns = () => {
  // 保存当前的列配置
  const currentColumns = [...tableColumns];
  // 清空数组
  tableColumns.length = 0;
  // 重新填充数组，保持原有的引用
  props.columns.forEach(col => {
    const newCol = { ...col };
    if (newCol.i18n && newCol.label) {
      newCol.label = getMenuTitle({ meta: { title: newCol.label } });
    }
    // 处理 tag 属性，确保类型正确
    if (newCol.tag && typeof newCol.tag === 'object' && 'value' in newCol.tag) {
      newCol.tag = newCol.tag.value;
    }
    tableColumns.push(newCol as any);
  });
};

// 监听 columns 变化
watch(
  () => props.columns,
  () => {
    initTableColumns();
  },
  { immediate: true, deep: true }
);

// 监听语言变化，更新表格列标题
watch(
  locale,
  () => {
    tableColumns.forEach(col => {
      if (col.i18n && col.label) {
        col.label = getMenuTitle({ meta: { title: col.label } });
      }
    });
  }
);

// 创建响应式的搜索列配置
const searchColumns = computed(() => {
  return props.searchColumns.map(col => ({
    ...col,
    label: col.i18n && col.label ? getMenuTitle({ meta: { title: col.label } }) : col.label || '',
    tooltip: col.i18n && col.tooltip ? t(col.tooltip) : col.tooltip || ''
  }));
});

const randomTableClass = 'random-' + generateUUID();

// 是否显示搜索模块
const isShowSearch = ref(true);

// 表格 DOM 元素
const tableRef = ref();

// column 列类型
const columnTypes: TypeProps[] = ['selection', 'radio', 'index', 'expand', 'sort'];

// 控制 ToolButton 显示
const showToolButton = (key: 'refresh' | 'setting' | 'search') => {
  return Array.isArray(props.toolButton) ? props.toolButton.includes(key) : props.toolButton;
};

// 单选值
const radio = ref('');

// 表格多选 Hooks
const { selectionChange, selectedList, selectedListIds, isSelected } = useSelection(props.rowKey);

const reload = ref(true);
const refresh = () => {
  reload.value = false;
  nextTick(() => (reload.value = true));
};

// 表格操作 Hooks
const {
  tableData,
  pageable,
  searchParam,
  searchInitParam,
  getTableList,
  search,
  reset,
  handleSizeChange,
  handleCurrentChange,
  loading
} = useTable(props.requestApi, props.initParam, props.pagination, props.dataCallback, props.requestError, props.loadingTime);

// 处理表格数据
const processTableData = computed(() => {
  if (!props.data) return tableData.value;
  if (!props.pagination) return props.data;
  const start = (pageable.value.pageNum - 1) * pageable.value.pageSize;
  const end = start + pageable.value.pageSize;
  return props.data.slice(start, end);
});

// 清空选中数据列表
const clearSelection = () => tableRef.value?.clearSelection();

// 定义 enumMap 存储 enum 值
const enumMap = reactive(new Map<string, any[]>());

// 初始化和更新 enumMap
const initEnumMap = async () => {
  if (!props.columns) return;

  for (const col of props.columns) {
    if (!col.enum || !col.prop) continue;

    // 如果当前 enumMap 已存在相同的值，跳过
    if (enumMap.has(col.prop) && !col.forceUpdate && (typeof col.enum === 'function' ? false : enumMap.get(col.prop) === col.enum)) {
      continue;
    }

    try {
      if (typeof col.enum === 'function') {
        // 预先存储空数组，防止重复请求
        enumMap.set(col.prop, []);
        const result = await col.enum();
        const data = result?.data || result || [];
        enumMap.set(col.prop, Array.isArray(data) ? data : []);
      } else {
        enumMap.set(col.prop, Array.isArray(col.enum) ? col.enum : []);
      }
    } catch (error) {
      console.error(`Failed to load enum data for column ${col.prop}:`, error);
      enumMap.set(col.prop, []);
    }
  }
};

// 提供 enumMap 给子组件
provide('enumMap', enumMap);

// 监听 columns 变化，更新 enumMap
watch(() => props.columns, () => {
  initEnumMap();
}, { deep: true });

// 扁平化 columns
const flatColumnsFunc = (columns: ColumnProps[], flatArr: ColumnProps[] = []) => {
  columns.forEach(async col => {
    if (col._children?.length) flatArr.push(...flatColumnsFunc(col._children));
    flatArr.push(col);

    // 给每一项 column 添加 isShow && isFilterEnum 默认属性
    col.isShow = col.isShow ?? true;
    col.isFilterEnum = col.isFilterEnum ?? true;
  });
  return flatArr.filter(item => !item._children?.length);
};

// 拖拽排序
const dragSort = () => {
  nextTick(async () => {
    const selector = `.${randomTableClass} .el-table__body-wrapper tbody`;
    const tbody = document.querySelector(selector);

    // 确保元素存在且是 HTMLElement
    if (!tbody || !(tbody instanceof HTMLElement)) {
      console.warn('Table body element not found or invalid');
      return;
    }

    try {
      // 确保之前的 Sortable 实例被销毁
      const oldInstance = Sortable.get(tbody);
      if (oldInstance) {
        oldInstance.destroy();
      }

      const currentData = unref(processTableData);
      if (!currentData) return;

      Sortable.create(tbody, {
        handle: '.move',
        animation: 300,
        onEnd({ newIndex, oldIndex }) {
          if (typeof newIndex === 'number' && typeof oldIndex === 'number') {
            const [removedItem] = currentData.splice(oldIndex, 1);
            currentData.splice(newIndex, 0, removedItem);
            emit('dargSort', { newIndex, oldIndex });
          }
        }
      });
    } catch (error) {
      console.warn('Failed to initialize drag sort:', error);
    }
  });
};

// 初始化表格数据 && 拖拽排序
onMounted(() => {
  if (props.requestAuto && props.requestApi) {
    getTableList();
  }
  if (props.data) {
    pageable.value.total = props.data.length;
  }
  nextTick(() => {
    dragSort();
  });
  flatColumnsFunc(tableColumns);
  initEnumMap();
});

// 监听表格数据变化，重新初始化拖拽
watch(() => unref(processTableData), () => {
  nextTick(() => {
    if (reload.value) {
      dragSort();
    }
  });
}, { deep: true });

// 监听页面 initParam 改化，重新获取表格数据
watch(() => props.initParam, getTableList, { deep: true });

// 监听 columns 变化时更新 enumMap
watch(() => props.columns, () => {
  const flatColumns = flatColumnsFunc(tableColumns);
  nextTick(() => {
    initEnumMap();
  });
}, { deep: true });

// 设置搜索表单排序默认值 && 设置搜索表单项的默认值
watch(() => unref(searchColumns), (columns) => {
  columns.forEach((column, index) => {
    column.order = column.order ?? index + 2;
    const key = column.key ?? handleProp(column.prop!);
    const defaultValue = column.defaultValue;
    if (defaultValue !== undefined && defaultValue !== null) {
      searchInitParam.value[key] = defaultValue;
      searchParam.value[key] = defaultValue;
    }
  });
}, { immediate: true });

// 暴露搜索列数据给模板
const searchColumnsData = computed(() => unref(searchColumns));

// 列设置 ==> 过滤掉不需要设置的列
const colRef = ref();
const colSetting = computed(() =>
  tableColumns.filter(item => !columnTypes.includes(item.type!) && item.prop !== 'operation' && item.isShow)
);
const openColSetting = () => colRef.value.openColSetting();

// 定义 emit 事件
const emit = defineEmits<{
  search: [];
  reset: [];
  dargSort: [{ newIndex?: number; oldIndex?: number }];
}>();

const _search = () => {
  search();
  emit('search');
};

const _reset = () => {
  reset();
  emit('reset');
};

// 暴露给父组件的参数和方法(外部需要什么，都可以从这里暴露出去)
defineExpose({
  element: tableRef,
  tableData: processTableData,
  radio,
  pageable,
  searchParam,
  searchInitParam,
  getTableList,
  search,
  reset,
  handleSizeChange,
  handleCurrentChange,
  clearSelection,
  enumMap,
  isSelected,
  selectedList,
  selectedListIds,
  refresh
});
</script>
