/**
 * 用户头像数据
 * 提供预设的用户头像选项
 */

export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  category: 'person' | 'animal' | 'fantasy' | 'object';
  gradient?: {
    from: string;
    to: string;
  };
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // 人物类
  {
    id: 'avatar-person-1',
    name: '学者',
    emoji: '🧑‍🎓',
    category: 'person',
    gradient: { from: '#00f3ff', to: '#bc13fe' },
  },
  {
    id: 'avatar-person-2',
    name: '科学家',
    emoji: '🧑‍🔬',
    category: 'person',
    gradient: { from: '#10b981', to: '#3b82f6' },
  },
  {
    id: 'avatar-person-3',
    name: '艺术家',
    emoji: '🧑‍🎨',
    category: 'person',
    gradient: { from: '#f59e0b', to: '#ef4444' },
  },
  {
    id: 'avatar-person-4',
    name: '程序员',
    emoji: '👨‍💻',
    category: 'person',
    gradient: { from: '#6366f1', to: '#8b5cf6' },
  },
  {
    id: 'avatar-person-5',
    name: '运动员',
    emoji: '🏃',
    category: 'person',
    gradient: { from: '#ec4899', to: '#f43f5e' },
  },
  {
    id: 'avatar-person-6',
    name: '音乐家',
    emoji: '🎸',
    category: 'person',
    gradient: { from: '#14b8a6', to: '#06b6d4' },
  },
  {
    id: 'avatar-person-7',
    name: '医生',
    emoji: '👨‍⚕️',
    category: 'person',
    gradient: { from: '#ef4444', to: '#dc2626' },
  },
  {
    id: 'avatar-person-8',
    name: '教师',
    emoji: '👨‍🏫',
    category: 'person',
    gradient: { from: '#f59e0b', to: '#d97706' },
  },
  {
    id: 'avatar-person-9',
    name: '厨师',
    emoji: '👨‍🍳',
    category: 'person',
    gradient: { from: '#84cc16', to: '#65a30d' },
  },
  {
    id: 'avatar-person-10',
    name: '警察',
    emoji: '👮',
    category: 'person',
    gradient: { from: '#3b82f6', to: '#2563eb' },
  },
  {
    id: 'avatar-person-11',
    name: '消防员',
    emoji: '👨‍🚒',
    category: 'person',
    gradient: { from: '#dc2626', to: '#991b1b' },
  },
  {
    id: 'avatar-person-12',
    name: '建筑工人',
    emoji: '👷',
    category: 'person',
    gradient: { from: '#fb923c', to: '#f97316' },
  },
  {
    id: 'avatar-person-13',
    name: '农民',
    emoji: '👨‍🌾',
    category: 'person',
    gradient: { from: '#22c55e', to: '#16a34a' },
  },
  {
    id: 'avatar-person-14',
    name: '律师',
    emoji: '👨‍⚖️',
    category: 'person',
    gradient: { from: '#64748b', to: '#475569' },
  },
  {
    id: 'avatar-person-15',
    name: '飞行员',
    emoji: '👨‍✈️',
    category: 'person',
    gradient: { from: '#0ea5e9', to: '#0284c7' },
  },
  {
    id: 'avatar-person-16',
    name: '宇航员',
    emoji: '👨‍🚀',
    category: 'person',
    gradient: { from: '#1e293b', to: '#0f172a' },
  },
  {
    id: 'avatar-person-17',
    name: '商人',
    emoji: '🧑‍💼',
    category: 'person',
    gradient: { from: '#374151', to: '#1f2937' },
  },
  {
    id: 'avatar-person-18',
    name: '工程师',
    emoji: '👨‍🔧',
    category: 'person',
    gradient: { from: '#78716c', to: '#57534e' },
  },

  // 动物类
  {
    id: 'avatar-animal-1',
    name: '猫咪',
    emoji: '🐱',
    category: 'animal',
    gradient: { from: '#f97316', to: '#ea580c' },
  },
  {
    id: 'avatar-animal-2',
    name: '小狗',
    emoji: '🐶',
    category: 'animal',
    gradient: { from: '#84cc16', to: '#65a30d' },
  },
  {
    id: 'avatar-animal-3',
    name: '熊猫',
    emoji: '🐼',
    category: 'animal',
    gradient: { from: '#71717a', to: '#3f3f46' },
  },
  {
    id: 'avatar-animal-4',
    name: '狐狸',
    emoji: '🦊',
    category: 'animal',
    gradient: { from: '#f59e0b', to: '#d97706' },
  },
  {
    id: 'avatar-animal-5',
    name: '企鹅',
    emoji: '🐧',
    category: 'animal',
    gradient: { from: '#0ea5e9', to: '#0284c7' },
  },
  {
    id: 'avatar-animal-6',
    name: '独角兽',
    emoji: '🦄',
    category: 'animal',
    gradient: { from: '#ec4899', to: '#a855f7' },
  },

  // 奇幻类
  {
    id: 'avatar-fantasy-1',
    name: '外星人',
    emoji: '👽',
    category: 'fantasy',
    gradient: { from: '#22c55e', to: '#16a34a' },
  },
  {
    id: 'avatar-fantasy-2',
    name: '机器人',
    emoji: '🤖',
    category: 'fantasy',
    gradient: { from: '#94a3b8', to: '#64748b' },
  },
  {
    id: 'avatar-fantasy-3',
    name: '幽灵',
    emoji: '👻',
    category: 'fantasy',
    gradient: { from: '#e2e8f0', to: '#cbd5e1' },
  },
  {
    id: 'avatar-fantasy-4',
    name: '巫师',
    emoji: '🧙',
    category: 'fantasy',
    gradient: { from: '#7c3aed', to: '#6d28d9' },
  },
  {
    id: 'avatar-fantasy-5',
    name: '龙',
    emoji: '🐉',
    category: 'fantasy',
    gradient: { from: '#dc2626', to: '#991b1b' },
  },
  {
    id: 'avatar-fantasy-6',
    name: '精灵',
    emoji: '🧚',
    category: 'fantasy',
    gradient: { from: '#d946ef', to: '#c026d3' },
  },

  // 物品类
  {
    id: 'avatar-object-1',
    name: '火箭',
    emoji: '🚀',
    category: 'object',
    gradient: { from: '#3b82f6', to: '#2563eb' },
  },
  {
    id: 'avatar-object-2',
    name: '星星',
    emoji: '⭐',
    category: 'object',
    gradient: { from: '#fbbf24', to: '#f59e0b' },
  },
  {
    id: 'avatar-object-3',
    name: '钻石',
    emoji: '💎',
    category: 'object',
    gradient: { from: '#06b6d4', to: '#0891b2' },
  },
  {
    id: 'avatar-object-4',
    name: '皇冠',
    emoji: '👑',
    category: 'object',
    gradient: { from: '#fbbf24', to: '#f59e0b' },
  },
  {
    id: 'avatar-object-5',
    name: '火焰',
    emoji: '🔥',
    category: 'object',
    gradient: { from: '#ef4444', to: '#dc2626' },
  },
  {
    id: 'avatar-object-6',
    name: '闪电',
    emoji: '⚡',
    category: 'object',
    gradient: { from: '#eab308', to: '#ca8a04' },
  },
];

// 按类别分组
export const AVATAR_CATEGORIES = [
  { id: 'person', name: '人物', icon: '👤' },
  { id: 'animal', name: '动物', icon: '🐾' },
  { id: 'fantasy', name: '奇幻', icon: '✨' },
  { id: 'object', name: '物品', icon: '🎁' },
] as const;

// 获取指定类别的头像
export function getAvatarsByCategory(category: string) {
  return AVATAR_OPTIONS.filter((avatar) => avatar.category === category);
}

// 根据ID获取头像
export function getAvatarById(id: string) {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === id);
}

// 获取默认头像
export function getDefaultAvatar() {
  return AVATAR_OPTIONS[0];
}
