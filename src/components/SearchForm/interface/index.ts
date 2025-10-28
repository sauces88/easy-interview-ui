import type { FormItemRule } from 'element-plus';
import type { SearchType } from './types';
import type { Responsive } from '@/components/Grid/interface';

export interface SearchColumn extends Partial<FormItemRule> {
  el?: SearchType; // 当前项搜索框的类型
  props?: any; // 搜索项参数
  key?: string; // 当前项搜索框的字段名
  label?: string; // 当前项搜索框的label
  tooltip?: string; // 当前项搜索框的tooltip
  order?: number; // 搜索项排序
  span?: number; // 搜索项所占用的列数
  offset?: number; // 搜索字段左侧偏移列数
  defaultValue?: any; // 搜索项默认值
  i18n?: boolean; // 是否需要国际化
  xs?: Responsive;
  sm?: Responsive;
  md?: Responsive;
  lg?: Responsive;
  xl?: Responsive;
} 