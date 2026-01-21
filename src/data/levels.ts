/**
 * Level System Data - 等级系统数据
 *
 * 包含等级称号、奖励和解锁内容
 */

export interface LevelData {
  level: number;
  title: string;
  expRequired: number;
  rewards: {
    coins: number;
    description: string;
  };
  unlocks?: string[];
}

export const LEVEL_TITLES: LevelData[] = [
  {
    level: 1,
    title: '初级使用者',
    expRequired: 0,
    rewards: { coins: 0, description: '欢迎来到工作空间！' }
  },
  {
    level: 5,
    title: '学徒',
    expRequired: 500,
    rewards: { coins: 50, description: '解锁成就系统' },
    unlocks: ['成就系统']
  },
  {
    level: 10,
    title: '专家',
    expRequired: 1500,
    rewards: { coins: 100, description: '经验值获取 +10%' },
    unlocks: ['经验加成 10%']
  },
  {
    level: 15,
    title: '精英',
    expRequired: 3000,
    rewards: { coins: 150, description: '解锁专注模式' },
    unlocks: ['专注模式（计划中）']
  },
  {
    level: 20,
    title: '大师',
    expRequired: 5000,
    rewards: { coins: 250, description: '经验值获取 +20%' },
    unlocks: ['经验加成 20%']
  },
  {
    level: 30,
    title: '宗师',
    expRequired: 10000,
    rewards: { coins: 500, description: '解锁数据分析面板' },
    unlocks: ['数据分析（计划中）']
  },
  {
    level: 40,
    title: '传说',
    expRequired: 18000,
    rewards: { coins: 750, description: '经验值获取 +30%' },
    unlocks: ['经验加成 30%']
  },
  {
    level: 50,
    title: '史诗',
    expRequired: 30000,
    rewards: { coins: 1000, description: '解锁全部功能' },
    unlocks: ['全功能解锁']
  },
];

/**
 * 根据等级获取称号
 */
export function getLevelTitle(level: number): string {
  // 找到最接近但不超过当前等级的称号
  const levelData = [...LEVEL_TITLES]
    .reverse()
    .find(data => level >= data.level);

  return levelData?.title || '新手冒险者';
}

/**
 * 根据当前等级计算下一级所需经验
 */
export function getExpForNextLevel(level: number): number {
  return Math.floor(level * 100 * 1.5);
}

/**
 * 获取经验加成百分比
 */
export function getExpBonus(level: number): number {
  if (level >= 40) return 1.3;
  if (level >= 20) return 1.2;
  if (level >= 10) return 1.1;
  return 1.0;
}

/**
 * 获取连击加成
 */
export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.3;
  if (streak >= 7) return 1.2;
  if (streak >= 3) return 1.1;
  return 1.0;
}
