<template>
  <component
    :is="column.render ?? `el-${column.el}`"
    style="width: 220px"
    v-bind="{ ...handleSearchProps, ...placeholder, clearable }"
    v-model.trim="_searchParam[column.key ?? handleProp(column.prop!)]"
    :data="column.el === 'tree-select' ? columnEnum : []"
    :options="['cascader', 'select-v2'].includes(column.el!) ? columnEnum : []"
  >
    <template v-if="column.el === 'cascader'" #default="{ data }">
      <span>{{ data[fieldNames.label] }}</span>
    </template>
    <template v-if="column.el === 'select'">
      <component
        :is="`el-option`"
        v-for="(col, index) in columnEnum"
        :key="index"
        :label="col[fieldNames.label]"
        :value="col[fieldNames.value]"
      />
    </template>
    <slot v-else />
  </component>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { handleProp } from '@/utils';
import type { SearchProps } from '@/components/ProTable/interface';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineOptions({
  name: 'SearchFormItem'
});

interface SearchFormItem {
  column: SearchProps;
  searchParam: { [key: string]: any };
}

const props = defineProps<SearchFormItem>();

// Re receive SearchParam
const _searchParam = computed(() => props.searchParam);

// 判断 fieldNames 设置 label && value && children 的 key 值
const fieldNames = computed(() => {
  return {
    label: props.column.fieldNames?.label ?? 'label',
    value: props.column.fieldNames?.value ?? 'value',
    children: props.column.fieldNames?.children ?? 'children'
  };
});

// 接收 enumMap (el 为 select-v2 需单独处理 enumData)
const enumMap = inject('enumMap', new Map()) as Map<string, any[]>;
const columnEnum = computed(() => {
  let enumData = enumMap.get(props.column.prop!) || props.column.enum;
  if (!enumData) return [];

  // 确保 enumData 是数组
  const enumArray = Array.isArray(enumData) ? enumData : [];

  // console.log('columnEnum debug:', {
  //   column: props.column,
  //   prop: props.column.prop,
  //   fieldNames: fieldNames.value,
  //   enumArray: enumArray,
  //   firstItem: enumArray[0]
  // });

  if (props.column.el === 'select-v2' && props.column.fieldNames) {
    return enumArray.map((item: { [key: string]: any }) => {
      return {
        ...item,
        label: item[fieldNames.value.label] || item.label,
        value: item[fieldNames.value.value] || item.value
      };
    });
  }
  return enumArray;
});

// 处理透传的 searchProps (el 为 tree-select、cascader 的时候需要给下默认 label && value && children)
const handleSearchProps = computed(() => {
  const label = fieldNames.value.label;
  const value = fieldNames.value.value;
  const children = fieldNames.value.children;
  const searchEl = props.column.el;
  let searchProps = props.column.props ?? {};
  if (searchEl === 'tree-select') {
    searchProps = {
      ...searchProps,
      props: { ...searchProps.props, label, children },
      nodeKey: value
    };
  }
  if (searchEl === 'cascader') {
    searchProps = { ...searchProps, props: { ...searchProps.props, label, value, children } };
  }
  return searchProps;
});

// 是否有清除按钮 (当搜索项有默认值时，清除按钮不显示)
const clearable = computed(() => {
  const search = props.column;
  return search?.props?.clearable ?? (search?.defaultValue === null || search?.defaultValue === undefined);
});

// placeholder 设置
const placeholder = computed(() => {
  const search = props.column;

  return {
    placeholder: search?.props?.placeholder || t('common.inputPlaceholder'),
    startPlaceholder: search?.props?.startPlaceholder || t('common.startTime'),
    endPlaceholder: search?.props?.endPlaceholder || t('common.endTime'),
    rangeSeparator: t('table.to')
  };
});
</script>
