/**
 * 头像框数据
 * 提供多种风格的头像框供用户选择
 */

export interface AvatarFrame {
  id: string;
  name: string;
  description: string;
  type: 'basic' | 'gradient' | 'animated' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  // 样式配置
  style: {
    borderWidth?: number;
    borderStyle?: string;
    borderColor?: string;
    borderImage?: string;
    gradient?: {
      type: 'linear' | 'radial' | 'conic';
      colors: string[];
      angle?: number;
    };
    shadow?: string;
    animation?: string;
  };

  // 解锁条件（可选）
  unlockCondition?: {
    type: 'level' | 'achievement' | 'coins' | 'default';
    value?: number;
  };
}

export const AVATAR_FRAMES: AvatarFrame[] = [
  // ==================== 基础框（默认免费） ====================
  {
    id: 'frame-none',
    name: '无边框',
    description: '简洁清爽，不使用任何边框',
    type: 'basic',
    rarity: 'common',
    style: {},
    unlockCondition: { type: 'default' },
  },
  {
    id: 'frame-basic-white',
    name: '纯白边框',
    description: '简单的白色边框',
    type: 'basic',
    rarity: 'common',
    style: {
      borderWidth: 3,
      borderStyle: 'solid',
      borderColor: '#ffffff',
    },
    unlockCondition: { type: 'default' },
  },
  {
    id: 'frame-basic-black',
    name: '经典黑框',
    description: '低调奢华的黑色边框',
    type: 'basic',
    rarity: 'common',
    style: {
      borderWidth: 3,
      borderStyle: 'solid',
      borderColor: '#000000',
    },
    unlockCondition: { type: 'default' },
  },

  // ==================== 渐变框（需等级解锁） ====================
  {
    id: 'frame-gradient-cyber',
    name: '赛博朋克',
    description: '青紫渐变，充满科技感',
    type: 'gradient',
    rarity: 'rare',
    style: {
      borderWidth: 4,
      gradient: {
        type: 'linear',
        colors: ['#00f3ff', '#bc13fe'],
        angle: 135,
      },
      shadow: '0 0 20px rgba(0, 243, 255, 0.5)',
    },
    unlockCondition: { type: 'level', value: 5 },
  },
  {
    id: 'frame-gradient-fire',
    name: '烈焰之心',
    description: '热情如火的红橙渐变',
    type: 'gradient',
    rarity: 'rare',
    style: {
      borderWidth: 4,
      gradient: {
        type: 'linear',
        colors: ['#f59e0b', '#ef4444', '#dc2626'],
        angle: 45,
      },
      shadow: '0 0 20px rgba(239, 68, 68, 0.6)',
    },
    unlockCondition: { type: 'level', value: 10 },
  },
  {
    id: 'frame-gradient-ocean',
    name: '深海之蓝',
    description: '宁静深邃的蓝色渐变',
    type: 'gradient',
    rarity: 'rare',
    style: {
      borderWidth: 4,
      gradient: {
        type: 'linear',
        colors: ['#06b6d4', '#3b82f6', '#6366f1'],
        angle: 180,
      },
      shadow: '0 0 20px rgba(59, 130, 246, 0.5)',
    },
    unlockCondition: { type: 'level', value: 15 },
  },
  {
    id: 'frame-gradient-nature',
    name: '自然之绿',
    description: '生机勃勃的绿色渐变',
    type: 'gradient',
    rarity: 'rare',
    style: {
      borderWidth: 4,
      gradient: {
        type: 'linear',
        colors: ['#84cc16', '#22c55e', '#10b981'],
        angle: 90,
      },
      shadow: '0 0 20px rgba(34, 197, 94, 0.5)',
    },
    unlockCondition: { type: 'level', value: 20 },
  },
  {
    id: 'frame-gradient-sunset',
    name: '落日余晖',
    description: '温暖的日落色调',
    type: 'gradient',
    rarity: 'rare',
    style: {
      borderWidth: 4,
      gradient: {
        type: 'linear',
        colors: ['#f97316', '#ec4899', '#a855f7'],
        angle: 135,
      },
      shadow: '0 0 20px rgba(249, 115, 22, 0.5)',
    },
    unlockCondition: { type: 'level', value: 25 },
  },

  // ==================== 动画框（高等级解锁） ====================
  {
    id: 'frame-animated-rainbow',
    name: '彩虹旋转',
    description: '流光溢彩的彩虹渐变',
    type: 'animated',
    rarity: 'epic',
    style: {
      borderWidth: 5,
      gradient: {
        type: 'conic',
        colors: ['#ef4444', '#f59e0b', '#84cc16', '#06b6d4', '#6366f1', '#a855f7', '#ec4899'],
      },
      animation: 'spin',
      shadow: '0 0 30px rgba(168, 85, 247, 0.8)',
    },
    unlockCondition: { type: 'level', value: 30 },
  },
  {
    id: 'frame-animated-pulse-cyan',
    name: '青色脉冲',
    description: '呼吸般闪烁的青色光环',
    type: 'animated',
    rarity: 'epic',
    style: {
      borderWidth: 5,
      borderColor: '#00f3ff',
      animation: 'pulse',
      shadow: '0 0 25px rgba(0, 243, 255, 0.8)',
    },
    unlockCondition: { type: 'level', value: 35 },
  },
  {
    id: 'frame-animated-pulse-gold',
    name: '黄金脉冲',
    description: '高贵的金色闪耀',
    type: 'animated',
    rarity: 'epic',
    style: {
      borderWidth: 5,
      gradient: {
        type: 'linear',
        colors: ['#fbbf24', '#f59e0b', '#d97706'],
        angle: 45,
      },
      animation: 'pulse',
      shadow: '0 0 25px rgba(251, 191, 36, 0.8)',
    },
    unlockCondition: { type: 'level', value: 40 },
  },

  // ==================== 特殊框（成就解锁） ====================
  {
    id: 'frame-special-diamond',
    name: '钻石光辉',
    description: '闪耀的钻石级边框',
    type: 'special',
    rarity: 'legendary',
    style: {
      borderWidth: 6,
      gradient: {
        type: 'conic',
        colors: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9'],
      },
      animation: 'spin',
      shadow: '0 0 40px rgba(14, 165, 233, 1), 0 0 60px rgba(56, 189, 248, 0.6)',
    },
    unlockCondition: { type: 'level', value: 50 },
  },
  {
    id: 'frame-special-master',
    name: '大师之证',
    description: '完成1000个任务解锁',
    type: 'special',
    rarity: 'legendary',
    style: {
      borderWidth: 6,
      gradient: {
        type: 'linear',
        colors: ['#fef3c7', '#fde047', '#facc15', '#eab308'],
        angle: 135,
      },
      shadow: '0 0 40px rgba(250, 204, 21, 1), 0 0 60px rgba(234, 179, 8, 0.6)',
    },
    unlockCondition: { type: 'achievement', value: 1000 }, // 完成1000个任务
  },
  {
    id: 'frame-special-dragon',
    name: '龙之守护',
    description: '传说中的龙族边框',
    type: 'special',
    rarity: 'legendary',
    style: {
      borderWidth: 6,
      gradient: {
        type: 'conic',
        colors: ['#dc2626', '#f59e0b', '#fbbf24', '#f59e0b', '#dc2626'],
      },
      animation: 'spin',
      shadow: '0 0 40px rgba(220, 38, 38, 1), 0 0 60px rgba(245, 158, 11, 0.6)',
    },
    unlockCondition: { type: 'coins', value: 10000 }, // 花费10000金币解锁
  },
];

// 按稀有度分类
export const FRAME_CATEGORIES = [
  { id: 'all', name: '全部', icon: '🎨' },
  { id: 'common', name: '普通', icon: '⚪', rarity: 'common' },
  { id: 'rare', name: '稀有', icon: '🔵', rarity: 'rare' },
  { id: 'epic', name: '史诗', icon: '🟣', rarity: 'epic' },
  { id: 'legendary', name: '传说', icon: '🟡', rarity: 'legendary' },
] as const;

// 获取指定稀有度的头像框
export function getFramesByRarity(rarity: string) {
  if (rarity === 'all') return AVATAR_FRAMES;
  return AVATAR_FRAMES.filter((frame) => frame.rarity === rarity);
}

// 根据ID获取头像框
export function getFrameById(id: string | null | undefined) {
  if (!id) return AVATAR_FRAMES[0]; // 返回无边框
  return AVATAR_FRAMES.find((frame) => frame.id === id) || AVATAR_FRAMES[0];
}

// 检查头像框是否已解锁
export function isFrameUnlocked(frame: AvatarFrame, userLevel: number, totalQuests: number, totalCoins: number): boolean {
  if (!frame.unlockCondition) return true;

  switch (frame.unlockCondition.type) {
    case 'default':
      return true;
    case 'level':
      return userLevel >= (frame.unlockCondition.value || 0);
    case 'achievement':
      return totalQuests >= (frame.unlockCondition.value || 0);
    case 'coins':
      return totalCoins >= (frame.unlockCondition.value || 0);
    default:
      return false;
  }
}

// 获取解锁描述
export function getUnlockDescription(frame: AvatarFrame): string {
  if (!frame.unlockCondition || frame.unlockCondition.type === 'default') {
    return '默认解锁';
  }

  switch (frame.unlockCondition.type) {
    case 'level':
      return `等级 ${frame.unlockCondition.value} 解锁`;
    case 'achievement':
      return `完成 ${frame.unlockCondition.value} 个任务解锁`;
    case 'coins':
      return `花费 ${frame.unlockCondition.value} 金币解锁`;
    default:
      return '未知解锁条件';
  }
}
