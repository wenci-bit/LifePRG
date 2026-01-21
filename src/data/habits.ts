/**
 * 习惯图标和预设模板
 */

import { HabitType, type Habit, HabitStatus } from '@/types/game';

// 习惯图标库（按分类）
export const HABIT_ICONS = {
  health: ['💪', '🏃', '🧘', '🏋️', '🚴', '🏊', '🥗', '💤', '🧴', '🩺'],
  drink: ['💧', '☕', '🍵', '🥤', '🧃', '🧋', '🍹', '🥛'],
  learn: ['📚', '✍️', '🎓', '🧠', '💡', '📖', '🎨', '🎵', '💻', '🔬'],
  work: ['💼', '📊', '⏰', '✅', '📝', '💻', '📈', '🎯'],
  life: ['🧹', '🛏️', '🪴', '📱', '🎮', '📺', '🎬', '🎧'],
  social: ['👥', '💬', '📞', '👨‍👩‍👧‍👦', '❤️', '🎁', '🌹'],
  mindfulness: ['🧘', '🕉️', '☮️', '✨', '🌅', '🌙', '🙏'],
};

// 习惯颜色预设
export const HABIT_COLORS = [
  { hex: '#00f3ff', name: '青色' },
  { hex: '#9333ea', name: '紫色' },
  { hex: '#10b981', name: '绿色' },
  { hex: '#f59e0b', name: '橙色' },
  { hex: '#ef4444', name: '红色' },
  { hex: '#3b82f6', name: '蓝色' },
  { hex: '#ec4899', name: '粉色' },
  { hex: '#8b5cf6', name: '紫罗兰' },
];

// 常用单位
export const COMMON_UNITS = {
  numeric: [
    { value: 'ml', label: '毫升 (ml)' },
    { value: 'L', label: '升 (L)' },
    { value: '杯', label: '杯' },
    { value: '步', label: '步' },
    { value: 'km', label: '公里 (km)' },
    { value: 'g', label: '克 (g)' },
    { value: 'cal', label: '卡路里 (cal)' },
    { value: '页', label: '页' },
    { value: '次', label: '次' },
    { value: '组', label: '组' },
    { value: '个', label: '个' },
  ],
  duration: [
    { value: '分钟', label: '分钟' },
    { value: '小时', label: '小时' },
  ],
};

// 习惯预设模板
export interface HabitTemplate {
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  targetValue?: number;
  unit?: string;
  description: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // 健康类
  {
    name: '早起',
    icon: '🌅',
    color: '#f59e0b',
    type: HabitType.BOOLEAN,
    description: '培养早起习惯，开启美好一天',
  },
  {
    name: '喝水',
    icon: '💧',
    color: '#3b82f6',
    type: HabitType.NUMERIC,
    targetValue: 2000,
    unit: 'ml',
    description: '每天喝足够的水，保持健康',
  },
  {
    name: '运动',
    icon: '🏃',
    color: '#10b981',
    type: HabitType.DURATION,
    targetValue: 30,
    unit: '分钟',
    description: '每天至少运动30分钟',
  },
  {
    name: '冥想',
    icon: '🧘',
    color: '#8b5cf6',
    type: HabitType.DURATION,
    targetValue: 10,
    unit: '分钟',
    description: '每日冥想，保持内心平静',
  },
  {
    name: '早睡',
    icon: '💤',
    color: '#6366f1',
    type: HabitType.BOOLEAN,
    description: '23点前入睡，保证睡眠质量',
  },
  {
    name: '护肤',
    icon: '🧴',
    color: '#ec4899',
    type: HabitType.BOOLEAN,
    description: '早晚护肤，保持良好肌肤状态',
  },

  // 学习类
  {
    name: '阅读',
    icon: '📚',
    color: '#00f3ff',
    type: HabitType.DURATION,
    targetValue: 30,
    unit: '分钟',
    description: '每天阅读30分钟，拓展知识面',
  },
  {
    name: '背单词',
    icon: '✍️',
    color: '#9333ea',
    type: HabitType.NUMERIC,
    targetValue: 20,
    unit: '个',
    description: '每天记忆20个新单词',
  },
  {
    name: '练字',
    icon: '🖊️',
    color: '#1f2937',
    type: HabitType.DURATION,
    targetValue: 15,
    unit: '分钟',
    description: '练习书法，提升书写水平',
  },
  {
    name: '学习编程',
    icon: '💻',
    color: '#10b981',
    type: HabitType.DURATION,
    targetValue: 60,
    unit: '分钟',
    description: '每天编程1小时，提升技能',
  },

  // 工作类
  {
    name: '早会总结',
    icon: '📝',
    color: '#f59e0b',
    type: HabitType.BOOLEAN,
    description: '每日早会总结，规划一天工作',
  },
  {
    name: '回顾日记',
    icon: '📔',
    color: '#8b5cf6',
    type: HabitType.BOOLEAN,
    description: '记录每日工作，总结经验教训',
  },
  {
    name: '整理桌面',
    icon: '🧹',
    color: '#10b981',
    type: HabitType.BOOLEAN,
    description: '保持工作环境整洁有序',
  },

  // 生活类
  {
    name: '整理床铺',
    icon: '🛏️',
    color: '#3b82f6',
    type: HabitType.BOOLEAN,
    description: '起床后整理床铺',
  },
  {
    name: '浇花',
    icon: '🪴',
    color: '#10b981',
    type: HabitType.BOOLEAN,
    description: '照顾植物，增添生活情趣',
  },
  {
    name: '限制手机',
    icon: '📱',
    color: '#ef4444',
    type: HabitType.DURATION,
    targetValue: 120,
    unit: '分钟',
    description: '控制手机使用时间（上限）',
  },

  // 社交类
  {
    name: '联系家人',
    icon: '👨‍👩‍👧‍👦',
    color: '#ec4899',
    type: HabitType.BOOLEAN,
    description: '每天与家人保持联系',
  },
  {
    name: '感恩记录',
    icon: '❤️',
    color: '#ef4444',
    type: HabitType.BOOLEAN,
    description: '每天记录三件感恩的事',
  },

  // 其他
  {
    name: '步数目标',
    icon: '👟',
    color: '#f59e0b',
    type: HabitType.NUMERIC,
    targetValue: 10000,
    unit: '步',
    description: '每天走10000步',
  },
];

// 获取默认习惯配置
export function getDefaultHabit(): Partial<Habit> {
  return {
    icon: '🎯',
    color: '#00f3ff',
    type: HabitType.BOOLEAN,
    status: HabitStatus.ACTIVE,
    isLongTerm: true,
    repeatPattern: {
      type: 'daily',
    },
    stats: {
      totalCompletions: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
    },
  };
}
