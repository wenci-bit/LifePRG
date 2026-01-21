/**
 * 任务系统配置数据
 *
 * 包含任务颜色、优先级、标签等预设
 */

// 任务颜色预设
export const QUEST_COLORS = {
  blue: { name: '蓝色', hex: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
  green: { name: '绿色', hex: '#10b981', light: '#34d399', dark: '#059669' },
  yellow: { name: '黄色', hex: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
  red: { name: '红色', hex: '#ef4444', light: '#f87171', dark: '#dc2626' },
  purple: { name: '紫色', hex: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
  pink: { name: '粉色', hex: '#ec4899', light: '#f472b6', dark: '#db2777' },
  cyan: { name: '青色', hex: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
  orange: { name: '橙色', hex: '#f97316', light: '#fb923c', dark: '#ea580c' },
  teal: { name: '青绿', hex: '#14b8a6', light: '#2dd4bf', dark: '#0d9488' },
  indigo: { name: '靛蓝', hex: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
};

// 优先级配置
export const PRIORITY_CONFIG = {
  low: {
    label: '低',
    color: '#6b7280',
    icon: '●',
    order: 1,
  },
  medium: {
    label: '中',
    color: '#3b82f6',
    icon: '●●',
    order: 2,
  },
  high: {
    label: '高',
    color: '#f59e0b',
    icon: '●●●',
    order: 3,
  },
  urgent: {
    label: '紧急',
    color: '#ef4444',
    icon: '🔥',
    order: 4,
  },
};

// 常用标签预设
export const COMMON_TAGS = [
  { name: '工作', color: '#3b82f6', icon: '💼' },
  { name: '学习', color: '#8b5cf6', icon: '📚' },
  { name: '健身', color: '#10b981', icon: '🏃' },
  { name: '娱乐', color: '#ec4899', icon: '🎮' },
  { name: '家务', color: '#6b7280', icon: '🏠' },
  { name: '社交', color: '#f59e0b', icon: '👥' },
  { name: '购物', color: '#14b8a6', icon: '🛒' },
  { name: '旅行', color: '#06b6d4', icon: '✈️' },
  { name: '阅读', color: '#6366f1', icon: '📖' },
  { name: '写作', color: '#f97316', icon: '✍️' },
  { name: '编程', color: '#8b5cf6', icon: '💻' },
  { name: '运动', color: '#10b981', icon: '⚽' },
  { name: '饮食', color: '#f59e0b', icon: '🍔' },
  { name: '睡眠', color: '#6b7280', icon: '😴' },
  { name: '冥想', color: '#8b5cf6', icon: '🧘' },
];

// 任务类型与属性的映射关系
export const QUEST_TYPE_ATTRIBUTE_MAP = {
  main: {
    defaultAttribute: 'int' as const,
    suggestedColors: ['blue', 'purple', 'indigo'],
  },
  side: {
    defaultAttribute: 'mng' as const,
    suggestedColors: ['cyan', 'teal', 'green'],
  },
  daily: {
    defaultAttribute: 'vit' as const,
    suggestedColors: ['yellow', 'orange', 'pink'],
  },
};

// 根据任务类型获取默认颜色
export function getDefaultQuestColor(type: string): string {
  const mapping = QUEST_TYPE_ATTRIBUTE_MAP[type as keyof typeof QUEST_TYPE_ATTRIBUTE_MAP];
  if (!mapping) return QUEST_COLORS.blue.hex;

  const suggestedColors = mapping.suggestedColors;
  const randomColor = suggestedColors[Math.floor(Math.random() * suggestedColors.length)];
  return QUEST_COLORS[randomColor as keyof typeof QUEST_COLORS].hex;
}

// 获取优先级配置
export function getPriorityConfig(priority?: string) {
  if (!priority) return PRIORITY_CONFIG.medium;
  return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
}

// 根据标签名称获取标签配置
export function getTagConfig(tagName: string) {
  const tag = COMMON_TAGS.find(t => t.name === tagName);
  if (tag) return tag;

  // 如果找不到预设标签，返回默认配置
  return {
    name: tagName,
    color: '#6b7280',
    icon: '🏷️',
  };
}

// 时间跨度类型
export const TIME_SPAN_TYPES = {
  short: { label: '短期', duration: 1, unit: 'day' },      // 1天内
  medium: { label: '中期', duration: 7, unit: 'days' },    // 1周内
  long: { label: '长期', duration: 30, unit: 'days' },     // 1月内
  project: { label: '项目', duration: 90, unit: 'days' },  // 3月内
};

// 重复模式配置
export const RECURRENCE_CONFIG = {
  daily: { label: '每日', icon: '📅' },
  weekly: { label: '每周', icon: '📆' },
  monthly: { label: '每月', icon: '🗓️' },
  yearly: { label: '每年', icon: '📋' },
  custom: { label: '自定义', icon: '⚙️' },
};

// 星期映射
export const WEEK_DAYS = [
  { value: 0, label: '周日', short: '日' },
  { value: 1, label: '周一', short: '一' },
  { value: 2, label: '周二', short: '二' },
  { value: 3, label: '周三', short: '三' },
  { value: 4, label: '周四', short: '四' },
  { value: 5, label: '周五', short: '五' },
  { value: 6, label: '周六', short: '六' },
];
