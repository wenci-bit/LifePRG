/**
 * LifeRPG 核心类型定义
 * 定义游戏系统的所有数据结构
 */

// 任务类型枚举
export enum QuestType {
  MAIN = 'main',        // 主线任务
  SIDE = 'side',        // 支线任务
  DAILY = 'daily',      // 日常任务
}

// 任务状态
export enum QuestStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// 属性类型
export type AttributeType = 'int' | 'vit' | 'mng' | 'cre';

// 属性记录（用于追踪可衰减的属性获取）
export interface AttributeRecord {
  id: string;
  attribute: AttributeType;
  amount: number; // 获得的属性点数
  gainedAt: number; // 获得时间戳
  reason: string; // 获得原因（如"完成任务：跑步"）
  relatedId?: string; // 关联ID（如任务ID）
  decayRate: number; // 衰减速率（每天衰减的百分比，如 0.1 = 10%/天）
  halfLifeDays: number; // 半衰期（天数，如7天衰减到50%）
  currentValue: number; // 当前值（会随时间衰减）
  decayedAt?: number; // 最后一次衰减计算的时间戳
}

// 属性衰减配置
export interface AttributeDecayConfig {
  attribute: AttributeType;
  enabled: boolean; // 是否启用衰减
  halfLifeDays: number; // 半衰期（天数）
  minValue: number; // 最小保留值（不会衰减到此值以下）
  decayRate: number; // 每日衰减率
}

// 成就等级类型（从achievements.ts导入）
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// 粒子交互模式类型
export type ParticleMode = 'repulsion' | 'attraction' | 'wave';

// 粒子颜色主题类型
export type ParticleColorTheme = 'cyber' | 'rainbow' | 'monochrome' | 'grayscale';

// 粒子维度类型
export type ParticleDimension = '2d' | '3d';

// 粒子分布模式类型
export type ParticleDistribution = 'circular' | 'rectangular';

// 核心属性接口
export interface Attributes {
  int: number;  // 智力/科研
  vit: number;  // 活力/健康
  mng: number;  // 管理/规划
  cre: number;  // 创造/灵感
}

// 任务接口
export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  attributes: AttributeType[]; // 改为数组，支持多属性
  expReward: number;
  coinReward: number;
  status: QuestStatus;
  createdAt: number;
  completedAt?: number;
  deadline?: number;

  // 新增属性
  startDate?: number;           // 开始时间戳
  endDate?: number;             // 结束时间戳
  color?: string;               // 任务颜色（十六进制）
  icon?: string;                // 任务图标（emoji）
  tags?: string[];              // 任务标签
  progress?: number;            // 任务进度 (0-100)
  priority?: 'low' | 'medium' | 'high' | 'urgent';  // 优先级
  subtasks?: SubTask[];         // 子任务列表（保留兼容性，但建议使用 parentId）
  parentId?: string;            // 父任务ID（用于建立父子关系）
  recurrence?: RecurrencePattern;  // 重复模式
  estimatedDuration?: number;   // 预估时长（分钟）
  actualDuration?: number;      // 实际时长（分钟）
  milestones?: ('year' | 'month' | 'week')[];  // 重点任务标记（支持多选）
  notes?: string;               // 任务笔记
}

// 子任务接口
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

// 重复模式接口
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;            // 间隔（如每2天、每3周）
  daysOfWeek?: number[];        // 星期几（0-6，0=周日）
  endDate?: number;             // 重复结束日期
  count?: number;               // 重复次数
}

// 成就接口
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

// 物品笔记接口
export interface ItemNote {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// 物品使用记录接口
export interface ItemUsageRecord {
  id: string;
  usedAt: number;
  note?: string;
}

// 专注记录接口
export interface FocusSession {
  id: string;
  mode: 'work' | 'shortBreak' | 'longBreak';
  startTime: number;
  endTime?: number;
  plannedDuration: number; // 计划时长（秒）
  actualDuration?: number; // 实际时长（秒）
  completed: boolean; // 是否完成
  interrupted: boolean; // 是否被中断
  note?: string; // 备注
}

// 物品类型
export type ItemType = 'consumable' | 'permanent' | 'time_limited';

// 物品稀有度
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

// 交易类型
export type TransactionType = 'earn' | 'spend';

// 金币交易记录
export interface CoinTransaction {
  id: string;
  type: TransactionType;
  coinType: AttributeType | 'universal' | 'all'; // 'all' 表示旧版通用金币
  amount: number;
  reason: string; // 原因：完成任务、购买物品等
  timestamp: number;
  relatedId?: string; // 关联的任务ID或物品ID

  // 撤销标记
  revoked?: boolean; // 是否已撤销
  revokedAt?: number; // 撤销时间
  revokeReason?: string; // 撤销原因
}

// 经验交易记录
export interface ExpTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  reason: string;
  timestamp: number;
  relatedId?: string;

  // 撤销标记
  revoked?: boolean; // 是否已撤销
  revokedAt?: number; // 撤销时间
  revokeReason?: string; // 撤销原因
}

// 属性变化记录
export interface AttributeChange {
  id: string;
  attribute: AttributeType;
  oldValue: number;
  newValue: number;
  change: number;
  reason: string;
  timestamp: number;
  relatedId?: string;

  // 撤销标记
  revoked?: boolean; // 是否已撤销
  revokedAt?: number; // 撤销时间
  revokeReason?: string; // 撤销原因
}

// 背包物品接口（全新设计）
export interface InventoryItem {
  id: string; // 背包物品唯一ID
  rewardId: string; // 对应商店奖励ID
  name: string;
  description: string;
  icon: string;
  type: ItemType; // 物品类型
  rarity: ItemRarity; // 稀有度

  // 数量相关
  quantity: number; // 当前数量（支持叠加）
  maxStack?: number; // 最大堆叠数（可选）

  // 时间相关
  acquiredAt: number; // 获得时间
  expiresAt?: number; // 过期时间（限时物品）
  lastUsedAt?: number; // 最后使用时间

  // 使用相关
  isUsed: boolean; // 是否已使用
  usedCount: number; // 已使用次数
  usageRecords: ItemUsageRecord[]; // 使用记录

  // 笔记
  notes: ItemNote[]; // 笔记列表

  // 额外属性
  metadata?: {
    duration?: number; // 持续时间（分钟）
    effect?: string; // 效果描述
    [key: string]: any;
  };
}

// 旧版物品接口（保留兼容性，标记为废弃）
/** @deprecated 使用新的 InventoryItem 接口 */
export interface LegacyInventoryItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  redeemed: boolean;
}

// 用户游戏状态接口
export interface GameState {
  // 基础信息
  level: number;
  currentExp: number;
  maxExp: number;
  coins: number; // 通用金币（保留兼容）
  categorizedCoins: {
    int: number;   // 智慧币
    vit: number;   // 活力币
    mng: number;   // 管理币
    cre: number;   // 创意币
    universal: number; // 通用币
  };
  achievementPoints: number; // 成就点数

  // 四维属性
  attributes: Attributes;

  // 属性平衡系统
  attributeRecords: AttributeRecord[]; // 可衰减的属性记录
  attributeDecayConfig: Record<AttributeType, AttributeDecayConfig>; // 衰减配置
  lastDecayCalculation?: number; // 最后一次计算衰减的时间戳

  // 任务系统
  quests: Quest[];

  // 成就系统
  achievements: Achievement[];
  unlockedAchievements: string[]; // 已解锁的成就ID列表

  // 仓库/奖励
  inventory: InventoryItem[];
  purchasedRewards: string[]; // 已购买的奖励ID列表

  // 专注模式
  focusModeActive: boolean;
  focusTimeRemaining: number;
  focusSessions: FocusSession[]; // 专注记录历史
  currentFocusSession?: FocusSession; // 当前专注会话

  // 统计数据
  stats: {
    totalQuestsCompleted: number;
    totalFocusTime: number;
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: string; // YYYY-MM-DD
    totalLoginDays: number;
  };

  // 签到系统
  checkIn: {
    hasCheckedInToday: boolean; // 今天是否已签到
    lastCheckInDate: string; // 上次签到日期 YYYY-MM-DD
    checkInHistory: string[]; // 签到历史记录 ['2024-01-01', '2024-01-02']
    currentMonthCheckIns: number; // 本月签到天数
    totalCheckIns: number; // 累计签到天数
    checkInStreak: number; // 连续签到天数（独立于登录连击）
  };

  // 习惯打卡系统
  habits: Habit[]; // 习惯列表
  habitCheckIns: HabitCheckIn[]; // 习惯打卡记录

  // 交易记录系统
  transactions: {
    coins: CoinTransaction[]; // 金币交易记录
    exp: ExpTransaction[]; // 经验交易记录
    attributes: AttributeChange[]; // 属性变化记录
  };

  // 通知状态
  notifications: {
    levelUp: {
      show: boolean;
      level: number;
      rewards: {
        coins: number;
        unlocks?: string[];
      };
      levelsGained?: number; // 一次升了多少级
      allLevels?: Array<{    // 所有升级信息
        level: number;
        rewards: {
          coins: number;
          unlocks?: string[];
        };
      }>;
    } | null;
    achievement: {
      id: string;
      title: string;
      description: string;
      tier: AchievementTier;
      reward: {
        exp: number;
        coins: number;
        title?: string;
        points?: number;
      };
    } | null;
    checkIn: {
      day: number; // 连续签到天数
      rewards: {
        exp: number;
        coins: number;
        categorizedCoins?: {
          int?: number;
          vit?: number;
          mng?: number;
          cre?: number;
        };
        bonusMessage?: string; // 特殊奖励消息（第7天、第30天等）
      };
    } | null;
  };

  // 用户设置
  settings: {
    particleMode: ParticleMode; // 粒子交互模式
    particleColorTheme: ParticleColorTheme; // 粒子颜色主题
    particleDimension: ParticleDimension; // 粒子维度
    particleDistribution: ParticleDistribution; // 粒子分布模式
  };
}

// Zustand Store Actions
export interface GameActions {
  // 经验值相关
  addExp: (amount: number, reason: string, relatedId?: string) => void;
  subtractExp: (amount: number, reason: string, relatedId?: string) => void; // 扣除经验（支持降级）
  levelUp: () => void;

  // 属性相关
  increaseAttribute: (attr: AttributeType, amount: number) => void;

  // 属性平衡系统
  addDynamicAttribute: (attr: AttributeType, amount: number, reason: string, relatedId?: string, halfLifeDays?: number) => void;
  removeDynamicAttribute: (attr: AttributeType, relatedId: string) => void; // 移除特定任务的属性记录
  calculateAttributeDecay: () => void; // 计算所有属性衰减
  getAttributeHealth: (attr: AttributeType) => number; // 获取属性健康度 (0-100)
  getDecayingAttributes: () => AttributeRecord[]; // 获取所有正在衰减的属性记录
  updateDecayConfig: (attr: AttributeType, config: Partial<AttributeDecayConfig>) => void; // 更新衰减配置

  // 任务相关
  addQuest: (quest: Omit<Quest, 'id' | 'status' | 'createdAt'>) => void;
  completeQuest: (questId: string) => void;
  uncompleteQuest: (questId: string) => void;
  deleteQuest: (questId: string) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  toggleSubtask: (questId: string, subtaskId: string) => void;
  addSubtask: (questId: string, subtaskTitle: string) => void;
  addChildQuest: (parentId: string, childQuestData: Omit<Quest, 'id' | 'status' | 'createdAt' | 'parentId'>) => void;
  getChildQuests: (parentId: string) => Quest[];
  convertSubtasksToChildQuests: (questId: string) => void;
  updateParentQuestProgress: (parentId: string) => void;

  // 金币相关
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  spendCategorizedCoins: (coinType: AttributeType, amount: number) => boolean;
  spendUniversalCoins: (amount: number) => boolean;
  spendAchievementPoints: (amount: number) => boolean;
  purchaseReward: (rewardId: string, coinType: AttributeType | 'universal' | 'any', coinAmount: number, pointsAmount?: number, rewardName?: string) => boolean;

  // 专注模式
  toggleFocusMode: () => void;
  updateFocusTime: (time: number) => void;
  startFocusSession: (mode: 'work' | 'shortBreak' | 'longBreak', duration: number) => void;
  endFocusSession: (completed: boolean, interrupted: boolean) => void;
  addFocusSessionNote: (sessionId: string, note: string) => void;

  // 成就
  unlockAchievement: (achievementId: string) => void;
  checkAchievements: () => void; // 检查是否解锁新成就
  recheckAchievements: () => void; // 重新检查已解锁的成就是否仍满足条件
  revokeAchievement: (achievementId: string) => void; // 撤销成就（追回奖励）

  // 通知
  dismissLevelUpNotification: () => void;
  dismissAchievementNotification: () => void;
  dismissCheckInNotification: () => void;

  // 每日登录和签到
  checkDailyLogin: () => void;
  dailyCheckIn: () => void;

  // 背包管理
  addToInventory: (item: Omit<InventoryItem, 'id' | 'acquiredAt' | 'isUsed' | 'usedCount' | 'usageRecords' | 'notes'>) => void;
  useInventoryItem: (itemId: string, note?: string) => boolean;
  addItemNote: (itemId: string, content: string) => void;
  updateItemNote: (itemId: string, noteId: string, content: string) => void;
  deleteItemNote: (itemId: string, noteId: string) => void;
  removeFromInventory: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;

  // 交易记录
  addCoinTransaction: (type: TransactionType, coinType: AttributeType | 'universal' | 'all', amount: number, reason: string, relatedId?: string) => void;
  addExpTransaction: (type: TransactionType, amount: number, reason: string, relatedId?: string) => void;
  addAttributeChange: (attribute: AttributeType, oldValue: number, newValue: number, reason: string, relatedId?: string) => void;
  revokeCoinTransactions: (relatedId: string, revokeReason: string) => { coinType: string, amount: number }[];
  revokeExpTransactions: (relatedId: string, revokeReason: string) => number;
  revokeAttributeChanges: (relatedId: string, revokeReason: string) => void;

  // 习惯管理
  addHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;
  archiveHabit: (habitId: string) => void;
  toggleHabitPause: (habitId: string) => void;
  checkInHabit: (habitId: string, value?: number, note?: string) => boolean;
  uncheckInHabit: (habitId: string, date?: string) => void;
  updateHabitStats: (habitId: string) => void;
  checkDailyHabitsCompletion: () => void;
  recheckTodayCheckInStatus: () => void;
  getTodayHabitSummary: () => DailyHabitSummary;

  // 属性警告
  getLowAttributeWarnings: () => Array<{
    attribute: AttributeType;
    value: number;
    level: 'critical' | 'warning' | 'low';
    message: string;
  }>;

  // 设置
  updateSettings: (settings: Partial<GameState['settings']>) => void;

  // 重置
  resetGame: () => void;
}

// 完整的 Store 类型
export type GameStore = GameState & GameActions;

// ==================== 用户系统类型定义 ====================

// 用户头像类型
export type UserAvatar =
  | { type: 'emoji'; data: string } // Emoji头像（存储头像ID）
  | { type: 'url'; data: string }   // 自定义URL头像
  | { type: 'upload'; data: string }; // 上传的头像（Base64或URL）

// 用户接口
export interface User {
  id: string; // 用户唯一标识
  username: string; // 用户名
  email?: string; // 邮箱（可选）
  avatar?: UserAvatar; // 头像（可选）
  avatarFrame?: string; // 头像框ID（可选）
  nickname?: string; // 昵称（可选）
  bio?: string; // 个人简介（可选）
  theme?: 'dark' | 'light'; // 主题偏好（可选）
  createdAt: number; // 创建时间
  lastLoginAt: number; // 最后登录时间
}

// 用户状态接口
export interface UserState {
  currentUser: User | null; // 当前登录用户
  isLoggedIn: boolean; // 是否已登录
  users: User[]; // 所有用户列表（本地存储）
}

// 用户操作接口
export interface UserActions {
  login: (username: string, password: string) => boolean; // 登录
  register: (username: string, password: string, email?: string) => boolean; // 注册
  logout: () => void; // 登出
  updateProfile: (updates: Partial<Omit<User, 'id' | 'createdAt'>>) => void; // 更新用户资料
  deleteAccount: (userId: string) => boolean; // 删除账户
  switchUser: (userId: string) => boolean; // 切换用户
}

// 完整的用户 Store 类型
export type UserStore = UserState & UserActions;

// ==================== 习惯打卡系统类型定义 ====================

// 习惯类型枚举
export enum HabitType {
  BOOLEAN = 'boolean',       // 单次型：完成/未完成
  NUMERIC = 'numeric',       // 数量型：如喝水量、步数、次数等
  DURATION = 'duration',     // 时长型：如学习30分钟
}

// 习惯状态
export enum HabitStatus {
  ACTIVE = 'active',         // 激活中
  PAUSED = 'paused',         // 已暂停
  COMPLETED = 'completed',   // 已完成（达到期限）
  ARCHIVED = 'archived',     // 已归档
}

// 重复模式
export interface HabitRepeatPattern {
  type: 'daily' | 'weekly' | 'custom';  // 重复类型
  daysOfWeek?: number[];     // 一周中的哪几天（0=周日, 1=周一...6=周六）
}

// 习惯接口
export interface Habit {
  id: string;
  name: string;              // 习惯名称
  icon: string;              // 习惯图标（emoji）
  color: string;             // 习惯颜色
  type: HabitType;           // 习惯类型
  status: HabitStatus;       // 习惯状态

  // 目标设置（对于非布尔类型）
  targetValue?: number;      // 目标值
  unit?: string;             // 单位（如：ml、步、分钟、次）

  // 重复模式
  repeatPattern: HabitRepeatPattern;

  // 期限设置
  isLongTerm: boolean;       // 是否长期习惯
  startDate: number;         // 开始日期时间戳
  endDate?: number;          // 结束日期时间戳（长期习惯为undefined）

  // 关联任务
  linkedQuestId?: string;    // 关联的Quest ID

  // 提醒设置
  reminder?: {
    enabled: boolean;
    time: string;            // HH:MM 格式
  };

  // 统计数据
  stats: {
    totalCompletions: number;     // 总完成次数
    currentStreak: number;        // 当前连续天数
    longestStreak: number;        // 最长连续天数
    completionRate: number;       // 完成率（百分比）
  };

  createdAt: number;
  updatedAt: number;
}

// 习惯打卡记录
export interface HabitCheckIn {
  id: string;
  habitId: string;
  date: string;              // YYYY-MM-DD 格式
  completed: boolean;
  value?: number;            // 实际值（对于数量型、时长型）
  targetValueAtCheckIn?: number; // 打卡时的目标值（用于判断历史记录是否完成）
  completedAt?: number;      // 完成时间戳
  note?: string;             // 笔记
}

// 每日习惯概览
export interface DailyHabitSummary {
  date: string;              // YYYY-MM-DD 格式
  totalHabits: number;       // 当天应完成的习惯总数
  completedHabits: number;   // 已完成的习惯数
  completionRate: number;    // 完成率
  allCompleted: boolean;     // 是否全部完成（用于触发签到）
}
