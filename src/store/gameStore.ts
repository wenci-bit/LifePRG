/**
 * LifeRPG Zustand 状态管理
 * 使用 Zustand 管理全局游戏状态
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QuestStatus, QuestType, HabitStatus, HabitType } from '@/types/game';
import type {
  GameStore,
  Quest,
  AttributeType,
  InventoryItem,
  ItemNote,
  ItemUsageRecord,
  Habit,
  HabitCheckIn,
} from '@/types/game';
import { ACHIEVEMENTS } from '@/data/achievements';
import { LEVEL_TITLES, getExpBonus, getStreakBonus } from '@/data/levels';
import { calculateCheckInReward } from '@/data/checkIn';
import { getDefaultHabit } from '@/data/habits';

// 初始状态
const initialState = {
  level: 1,
  currentExp: 0,
  maxExp: 150, // 修复：1级升2级需要150经验（1 * 100 * 1.5）
  coins: 0,
  categorizedCoins: {
    int: 0,
    vit: 0,
    mng: 0,
    cre: 0,
    universal: 0,
  },
  achievementPoints: 0,
  attributes: {
    int: 60,
    vit: 60,
    mng: 60,
    cre: 60,
  },
  // 属性平衡系统
  attributeRecords: [],
  attributeDecayConfig: {
    int: {
      attribute: 'int' as const,
      enabled: true,
      halfLifeDays: 14, // 智力：14天半衰期（学习需要持续巩固）
      minValue: 0,
      decayRate: 0.05, // 每天衰减5%
    },
    vit: {
      attribute: 'vit' as const,
      enabled: true,
      halfLifeDays: 7, // 活力：7天半衰期（运动效果衰减快）
      minValue: 0,
      decayRate: 0.10, // 每天衰减10%
    },
    mng: {
      attribute: 'mng' as const,
      enabled: true,
      halfLifeDays: 10, // 管理：10天半衰期
      minValue: 0,
      decayRate: 0.07, // 每天衰减7%
    },
    cre: {
      attribute: 'cre' as const,
      enabled: true,
      halfLifeDays: 12, // 创造：12天半衰期
      minValue: 0,
      decayRate: 0.06, // 每天衰减6%
    },
  },
  lastDecayCalculation: undefined,
  quests: [],
  achievements: [],
  unlockedAchievements: [],
  purchasedRewards: [],
  inventory: [],
  focusModeActive: false,
  focusTimeRemaining: 0,
  focusSessions: [],
  currentFocusSession: undefined,
  stats: {
    totalQuestsCompleted: 0,
    totalFocusTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: '',
    totalLoginDays: 0,
  },
  checkIn: {
    hasCheckedInToday: false,
    lastCheckInDate: '',
    checkInHistory: [],
    currentMonthCheckIns: 0,
    totalCheckIns: 0,
    checkInStreak: 0,
  },
  habits: [],
  habitCheckIns: [],
  transactions: {
    coins: [],
    exp: [],
    attributes: [],
  },
  notifications: {
    levelUp: null,
    achievement: null,
    checkIn: null,
  },
  settings: {
    particleMode: 'repulsion' as const, // 默认使用排斥模式
    particleColorTheme: 'cyber' as const, // 默认使用赛博朋克配色
    particleDimension: '3d' as const, // 默认使用3D粒子
    particleDistribution: 'circular' as const, // 默认使用圆形分布
  },
};

/**
 * 计算升级所需经验值
 * 公式: Level * 100 * 1.5
 */
const calculateMaxExp = (level: number): number => {
  return Math.floor(level * 100 * 1.5);
};

/**
 * 创建初始属性记录
 * 为初始的60点属性创建记录，使其也能参与衰减
 */
const createInitialAttributeRecords = () => {
  const now = Date.now();
  const attributes: AttributeType[] = ['int', 'vit', 'mng', 'cre'];

  return attributes.map(attr => ({
    id: `initial-${attr}-${now}`,
    attribute: attr,
    amount: 60,
    gainedAt: now,
    reason: '初始属性',
    relatedId: 'initial',
    decayRate: initialState.attributeDecayConfig[attr].decayRate,
    halfLifeDays: initialState.attributeDecayConfig[attr].halfLifeDays,
    currentValue: 60,
    decayedAt: now,
  }));
};

/**
 * 获取当前日期字符串 (YYYY-MM-DD) - 使用本地时间
 */
const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 计算两个日期之间的天数差
 */
const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 获取当前用户ID（用于多用户数据隔离）
 */
const getCurrentUserId = (): string | null => {
  try {
    const userStorage = localStorage.getItem('liferpg-user-storage');
    if (!userStorage) return null;
    const userData = JSON.parse(userStorage);
    return userData?.state?.currentUser?.id || null;
  } catch {
    return null;
  }
};

/**
 * 创建用户专属的 Storage 适配器
 * 每个用户的游戏数据独立存储
 */
const createUserStorage = () => {
  return {
    getItem: (name: string) => {
      const userId = getCurrentUserId();
      const key = userId ? `${name}-${userId}` : name;
      const value = localStorage.getItem(key);
      return value;
    },
    setItem: (name: string, value: string) => {
      const userId = getCurrentUserId();
      const key = userId ? `${name}-${userId}` : name;
      localStorage.setItem(key, value);
    },
    removeItem: (name: string) => {
      const userId = getCurrentUserId();
      const key = userId ? `${name}-${userId}` : name;
      localStorage.removeItem(key);
    },
  };
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * 增加经验值
       * 自动处理升级逻辑和通知（支持连续多级升级）
       */
      addExp: (amount: number, reason: string, relatedId?: string) => {
        set((state) => {
          // 应用经验加成
          const expBonus = getExpBonus(state.level);
          const streakBonus = getStreakBonus(state.stats.currentStreak);
          const finalAmount = Math.floor(amount * expBonus * streakBonus);

          let currentExp = state.currentExp + finalAmount;
          let currentLevel = state.level;
          let currentMaxExp = state.maxExp;

          // 记录经验获取
          get().addExpTransaction('earn', finalAmount, reason, relatedId);

          // 累积升级数据
          let totalCoinsRewarded = 0;
          const levelsGained: Array<{
            level: number;
            rewards: { coins: number; unlocks?: string[] };
          }> = [];

          // 循环检查升级（允许连续升多级）
          while (currentExp >= currentMaxExp) {
            // 升级
            currentLevel += 1;
            currentExp -= currentMaxExp; // 扣除本级所需经验
            currentMaxExp = calculateMaxExp(currentLevel); // 计算新等级的经验需求

            // 找到升级奖励
            const levelData = LEVEL_TITLES.find(l => l.level === currentLevel);
            const coinReward = levelData ? levelData.rewards.coins : 10;
            totalCoinsRewarded += coinReward;

            levelsGained.push({
              level: currentLevel,
              rewards: levelData ? {
                coins: coinReward,
                unlocks: levelData.unlocks,
              } : { coins: 10 },
            });
          }

          // 如果有升级
          if (levelsGained.length > 0) {
            // 记录所有升级奖励金币
            levelsGained.forEach(levelInfo => {
              get().addCoinTransaction(
                'earn',
                'universal',
                levelInfo.rewards.coins,
                `升级到等级 ${levelInfo.level}`,
                `level-${levelInfo.level}`
              );
            });

            // 显示升级通知（显示最终等级）
            const finalLevel = levelsGained[levelsGained.length - 1];

            return {
              level: currentLevel,
              currentExp: currentExp,
              maxExp: currentMaxExp,
              coins: state.coins + totalCoinsRewarded,
              categorizedCoins: {
                ...state.categorizedCoins,
                universal: state.categorizedCoins.universal + totalCoinsRewarded,
              },
              notifications: {
                ...state.notifications,
                levelUp: {
                  show: true,
                  level: finalLevel.level,
                  rewards: finalLevel.rewards,
                  levelsGained: levelsGained.length, // 升了多少级
                  allLevels: levelsGained, // 所有升级信息
                },
              },
            };
          }

          return { currentExp: currentExp };
        });
      },

      /**
       * 手动升级
       */
      levelUp: () => {
        set((state) => ({
          level: state.level + 1,
          currentExp: 0,
          maxExp: calculateMaxExp(state.level + 1),
        }));
      },

      /**
       * 扣除经验值
       * 自动处理降级逻辑（支持连续多级降级）
       * 注意：不再创建新的 spend 交易记录，因为调用方已通过 revokeExpTransaction 标记原记录
       */
      subtractExp: (amount: number, reason: string, relatedId?: string) => {
        set((state) => {
          let currentExp = state.currentExp - amount;
          let currentLevel = state.level;
          let currentMaxExp = state.maxExp;

          // 不再记录经验扣除，因为调用方（uncompleteQuest/revokeAchievement）已经通过 revokeExpTransaction 标记原记录
          // get().addExpTransaction('spend', amount, reason, relatedId); // 已移除

          // 累积降级数据
          let totalCoinsDeducted = 0;
          const levelsLost: Array<{
            level: number;
            coinsLost: number;
          }> = [];

          // 循环检查降级（允许连续降多级）
          while (currentExp < 0 && currentLevel > 1) {
            // 需要降级
            currentLevel -= 1;
            const prevMaxExp = calculateMaxExp(currentLevel);
            currentExp += prevMaxExp; // 加上上一级的经验上限

            // 找到降级损失的金币
            const levelData = LEVEL_TITLES.find(l => l.level === currentLevel + 1);
            const coinLost = levelData ? levelData.rewards.coins : 10;
            totalCoinsDeducted += coinLost;

            levelsLost.push({
              level: currentLevel + 1,
              coinsLost: coinLost,
            });

            currentMaxExp = prevMaxExp;
          }

          // 确保经验不会变成负数（如果降到1级还是负数，则归零）
          if (currentExp < 0 && currentLevel === 1) {
            currentExp = 0;
          }

          // 如果有降级
          if (levelsLost.length > 0) {
            // 标记并撤销原升级交易记录（而非创建新的 spend 记录）
            levelsLost.forEach(levelInfo => {
              // 撤销原升级时的金币奖励记录
              const revokedCoins = get().revokeCoinTransactions(
                `level-${levelInfo.level}`,
                `降级失去等级 ${levelInfo.level}`
              );

              // 从总金币中扣除
              if (revokedCoins.length > 0) {
                const coinsToDeduct = revokedCoins.reduce((sum, { amount }) => sum + amount, 0);
                // totalCoinsDeducted 已经累加了 coinLost，这里不需要重复累加
              }
            });

            return {
              level: currentLevel,
              currentExp: Math.max(0, currentExp),
              maxExp: currentMaxExp,
              coins: Math.max(0, state.coins - totalCoinsDeducted),
            };
          }

          return {
            currentExp: Math.max(0, currentExp)
          };
        });

        // 注意：降级后调用方（uncompleteQuest/revokeAchievement）会负责调用 recheckAchievements()
      },

      /**
       * 增加属性值
       */
      increaseAttribute: (attr: AttributeType, amount: number) => {
        set((state) => ({
          attributes: {
            ...state.attributes,
            [attr]: state.attributes[attr] + amount,
          },
        }));
        // 检查属性成就
        get().checkAchievements();
      },

      /**
       * 添加可衰减的动态属性
       */
      addDynamicAttribute: (attr: AttributeType, amount: number, reason: string, relatedId?: string, halfLifeDays?: number) => {
        const state = get();
        const config = state.attributeDecayConfig[attr];

        // 创建属性记录
        const record: import('@/types/game').AttributeRecord = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          attribute: attr,
          amount,
          gainedAt: Date.now(),
          reason,
          relatedId,
          decayRate: config.decayRate,
          halfLifeDays: halfLifeDays || config.halfLifeDays,
          currentValue: amount,
          decayedAt: Date.now(),
        };

        // 添加到记录列表
        set((state) => ({
          attributeRecords: [...state.attributeRecords, record],
          attributes: {
            ...state.attributes,
            [attr]: state.attributes[attr] + amount,
          },
        }));

        // 记录属性变化
        get().addAttributeChange(attr, state.attributes[attr], state.attributes[attr] + amount, reason, relatedId);

        // 检查属性成就
        get().checkAchievements();
      },

      /**
       * 移除特定任务的动态属性记录
       * 用于取消完成任务时追回属性
       * 修复：扣除当前值（衰减后）而不是初始值
       */
      removeDynamicAttribute: (attr: AttributeType, relatedId: string) => {
        const state = get();

        // 找到该任务的属性记录
        const recordsToRemove = state.attributeRecords.filter(
          r => r.attribute === attr && r.relatedId === relatedId
        );

        if (recordsToRemove.length === 0) return;

        // 计算需要扣除的总属性值（使用 currentValue 衰减后的值，而不是 amount 初始值）
        // 这样更公平：用户获得10点，衰减到8点后取消任务，只扣除8点
        const totalValueToRemove = recordsToRemove.reduce((sum, r) => sum + r.currentValue, 0);

        // 移除记录并更新总属性值
        set((state) => {
          const newRecords = state.attributeRecords.filter(
            r => !(r.attribute === attr && r.relatedId === relatedId)
          );

          const oldValue = state.attributes[attr];
          const newValue = Math.max(0, oldValue - totalValueToRemove);

          return {
            attributeRecords: newRecords,
            attributes: {
              ...state.attributes,
              [attr]: newValue,
            },
          };
        });

        // 记录属性扣除（不再使用 addAttributeChange，而是标记原记录）
        // 实际的标记会在 uncompleteQuest 中调用 revokeAttributeChanges 完成
      },

      /**
       * 计算所有属性衰减
       */
      calculateAttributeDecay: () => {
        const state = get();
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        let updatedRecords = [...state.attributeRecords];
        const attributeChanges: Record<string, number> = {
          int: 0,
          vit: 0,
          mng: 0,
          cre: 0,
        };

        // 计算每条记录的衰减
        updatedRecords = updatedRecords.map(record => {
          const config = state.attributeDecayConfig[record.attribute];
          if (!config.enabled) return record;

          const lastDecay = record.decayedAt || record.gainedAt;
          const daysPassed = (now - lastDecay) / oneDayMs;

          if (daysPassed < 1) return record; // 不到一天，不衰减

          // 使用指数衰减公式：newValue = amount * (1 - decayRate)^daysPassed
          // 注意：这里使用 amount（初始值）而不是 currentValue
          // 因为我们要基于获得时的原始值计算总衰减，而不是累积衰减
          // 例如：第1天获得10点，衰减率5%
          //   第1天结束：10 * 0.95^1 = 9.5
          //   第2天结束：10 * 0.95^2 = 9.025（而不是 9.5 * 0.95 = 9.025）
          // 两种计算方式结果相同，但使用 amount 可以避免累积误差
          const decayMultiplier = Math.pow(1 - config.decayRate, Math.floor(daysPassed));
          const newValue = Math.max(record.amount * decayMultiplier, config.minValue);
          const decayAmount = record.currentValue - newValue;

          if (decayAmount > 0.01) { // 只有衰减量大于0.01才记录
            attributeChanges[record.attribute] += -decayAmount;
          }

          return {
            ...record,
            currentValue: Math.round(newValue * 100) / 100, // 保留两位小数，避免精度问题
            decayedAt: now,
          };
        }).filter(record => {
          // 移除已衰减到0的记录，以及超过90天的低价值记录
          const isExpired = record.currentValue < 0.01;
          const isOld = (now - record.gainedAt) > (90 * 24 * 60 * 60 * 1000);
          const isLowValue = record.currentValue < 1;
          return !isExpired && !(isOld && isLowValue);
        });

        // 计算新的总属性值
        const newAttributes = { ...state.attributes };
        Object.keys(attributeChanges).forEach(attr => {
          const change = attributeChanges[attr as AttributeType];
          if (change !== 0) {
            const oldValue = newAttributes[attr as AttributeType];
            newAttributes[attr as AttributeType] = Math.max(0, oldValue + change);

            // 记录属性变化
            if (Math.abs(change) > 0.01) {
              get().addAttributeChange(
                attr as AttributeType,
                oldValue,
                newAttributes[attr as AttributeType],
                '属性自然衰减',
                'decay'
              );
            }
          }
        });

        set({
          attributeRecords: updatedRecords,
          attributes: newAttributes,
          lastDecayCalculation: now,
        });
      },

      /**
       * 获取属性健康度 (0-100)
       * 基于最近30天的属性获取情况
       */
      getAttributeHealth: (attr: AttributeType) => {
        const state = get();
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        // 获取该属性最近30天的记录
        const recentRecords = state.attributeRecords.filter(
          r => r.attribute === attr && r.gainedAt >= thirtyDaysAgo
        );

        if (recentRecords.length === 0) return 0;

        // 计算平均剩余值百分比
        const avgRemainingPercent = recentRecords.reduce((sum, r) =>
          sum + (r.currentValue / r.amount) * 100, 0
        ) / recentRecords.length;

        return Math.round(avgRemainingPercent);
      },

      /**
       * 获取所有正在衰减的属性记录
       */
      getDecayingAttributes: () => {
        const state = get();
        return state.attributeRecords.filter(r => r.currentValue > 0);
      },

      /**
       * 更新衰减配置
       */
      updateDecayConfig: (attr: AttributeType, config: Partial<import('@/types/game').AttributeDecayConfig>) => {
        set((state) => ({
          attributeDecayConfig: {
            ...state.attributeDecayConfig,
            [attr]: {
              ...state.attributeDecayConfig[attr],
              ...config,
            },
          },
        }));
      },

      /**
       * 添加新任务
       */
      addQuest: (questData) => {
        const newQuest: Quest = {
          ...questData,
          id: Date.now().toString(),
          status: QuestStatus.ACTIVE,
          createdAt: Date.now(),
        };

        set((state) => ({
          quests: [newQuest, ...state.quests],
        }));
      },

      /**
       * 完成任务
       * 自动分配经验值、金币（分类）和属性提升
       */
      completeQuest: (questId: string) => {
        const state = get();
        const quest = state.quests.find((q) => q.id === questId);

        if (!quest || quest.status !== QuestStatus.ACTIVE) return;

        // 更新任务状态
        set((state) => ({
          quests: state.quests.map((q) =>
            q.id === questId
              ? { ...q, status: QuestStatus.COMPLETED, completedAt: Date.now() }
              : q
          ),
          stats: {
            ...state.stats,
            totalQuestsCompleted: state.stats.totalQuestsCompleted + 1,
          },
        }));

        // 分配经验奖励并记录
        get().addExp(quest.expReward, `完成任务: ${quest.title}`, questId);

        // 分配分类金币（根据任务属性）
        const coinAmount = quest.coinReward;
        const attributes = quest.attributes || []; // 支持多属性

        if (attributes.length > 0) {
          // 金币分配策略：70%分配到属性，30%作为通用币
          const attributeCoinAmount = Math.floor(coinAmount * 0.7); // 70%分配到属性
          const universalAmount = coinAmount - attributeCoinAmount; // 剩余30%作为通用币

          // 将属性金币平均分配到各个属性
          const coinPerAttribute = Math.floor(attributeCoinAmount / attributes.length);
          const actualDistributed = coinPerAttribute * attributes.length; // 实际分配的总额（考虑取整损失）
          const remainder = attributeCoinAmount - actualDistributed; // 取整损失的余数

          const newCategorizedCoins = { ...state.categorizedCoins };
          attributes.forEach(attr => {
            newCategorizedCoins[attr] = newCategorizedCoins[attr] + coinPerAttribute;
            // 记录分类金币获取
            get().addCoinTransaction('earn', attr, coinPerAttribute, `完成任务: ${quest.title}`, questId);
          });

          // 通用币 = 30%基础 + 取整损失的余数
          const finalUniversalAmount = universalAmount + remainder;
          newCategorizedCoins.universal = newCategorizedCoins.universal + finalUniversalAmount;

          // 记录通用金币获取
          get().addCoinTransaction('earn', 'universal', finalUniversalAmount, `完成任务: ${quest.title}（通用）`, questId);

          set((state) => ({
            categorizedCoins: newCategorizedCoins,
            coins: state.coins + coinAmount, // 总金币 = 任务奖励（100%）
          }));

          // 增加对应属性，每个属性增加 10（使用动态属性，支持衰减）
          attributes.forEach(attr => {
            get().addDynamicAttribute(attr, 10, `完成任务: ${quest.title}`, questId);
          });
        } else {
          // 如果没有指定属性，只发放通用币
          set((state) => ({
            categorizedCoins: {
              ...state.categorizedCoins,
              universal: state.categorizedCoins.universal + coinAmount,
            },
            coins: state.coins + coinAmount,
          }));

          // 记录通用金币获取
          get().addCoinTransaction('earn', 'universal', coinAmount, `完成任务: ${quest.title}`, questId);
        }

        // 如果是子任务，更新父任务进度
        if (quest.parentId) {
          get().updateParentQuestProgress(quest.parentId);
        }

        // 检查成就解锁
        get().checkAchievements();
      },

      /**
       * 取消完成任务
       * 追回所有奖励：经验、金币、属性、成就（完整追回机制 + 标记模式）
       */
      uncompleteQuest: (questId: string) => {
        const state = get();
        const quest = state.quests.find(q => q.id === questId);

        // 只能取消已完成的任务
        if (!quest || quest.status !== QuestStatus.COMPLETED) return;

        const revokeReason = `取消完成任务: ${quest.title}`;

        // 1. 更新任务状态和统计
        set((state) => ({
          quests: state.quests.map((q) =>
            q.id === questId
              ? { ...q, status: QuestStatus.ACTIVE, completedAt: undefined }
              : q
          ),
          stats: {
            ...state.stats,
            totalQuestsCompleted: Math.max(0, state.stats.totalQuestsCompleted - 1),
          },
        }));

        // 2. 标记并扣除经验（使用交易记录中的实际值，包含加成）
        const actualExpGained = get().revokeExpTransactions(questId, revokeReason);
        if (actualExpGained > 0) {
          get().subtractExp(actualExpGained, revokeReason, questId);
        }

        // 3. 标记并追回金币（使用交易记录中的实际值）
        const revokedCoins = get().revokeCoinTransactions(questId, revokeReason);
        if (revokedCoins.length > 0) {
          const newCategorizedCoins = { ...state.categorizedCoins };
          let totalCoinsToDeduct = 0;

          revokedCoins.forEach(({ coinType, amount }) => {
            if (coinType === 'all' || coinType === 'universal') {
              newCategorizedCoins.universal = Math.max(0, newCategorizedCoins.universal - amount);
            } else {
              newCategorizedCoins[coinType as AttributeType] = Math.max(
                0,
                newCategorizedCoins[coinType as AttributeType] - amount
              );
            }
            totalCoinsToDeduct += amount;
          });

          set((state) => ({
            categorizedCoins: newCategorizedCoins,
            coins: Math.max(0, state.coins - totalCoinsToDeduct),
          }));
        }

        // 4. 标记并追回属性（扣除初始获得的完整值）
        const attributes = quest.attributes || [];
        attributes.forEach(attr => {
          get().removeDynamicAttribute(attr, questId);
        });

        // 标记属性变化记录为已撤销
        get().revokeAttributeChanges(questId, revokeReason);

        // 5. 如果是子任务，更新父任务进度
        if (quest.parentId) {
          get().updateParentQuestProgress(quest.parentId);
        }

        // 6. 重新检查所有成就，撤销不再满足条件的成就
        get().recheckAchievements();
      },

      /**
       * 删除任务
       */
      deleteQuest: (questId: string) => {
        // 获取要删除的任务
        const quest = get().quests.find(q => q.id === questId);

        // 如果是父任务，也删除所有子任务
        const childQuests = get().quests.filter(q => q.parentId === questId);
        const questIdsToDelete = [questId, ...childQuests.map(q => q.id)];

        set((state) => ({
          quests: state.quests.filter((q) => !questIdsToDelete.includes(q.id)),
        }));

        // 如果删除的是子任务，更新父任务进度
        if (quest?.parentId) {
          get().updateParentQuestProgress(quest.parentId);
        }
      },

      /**
       * 更新任务
       */
      updateQuest: (questId: string, updates: Partial<Quest>) => {
        set((state) => ({
          quests: state.quests.map((q) =>
            q.id === questId ? { ...q, ...updates } : q
          ),
        }));
      },

      /**
       * 更新任务进度
       */
      updateQuestProgress: (questId: string, progress: number) => {
        set((state) => ({
          quests: state.quests.map((q) =>
            q.id === questId ? { ...q, progress: Math.min(100, Math.max(0, progress)) } : q
          ),
        }));

        // 如果进度达到100%，自动完成任务
        const quest = get().quests.find(q => q.id === questId);
        if (quest && progress >= 100 && quest.status !== QuestStatus.COMPLETED) {
          get().completeQuest(questId);
        }
      },

      /**
       * 切换子任务完成状态
       */
      toggleSubtask: (questId: string, subtaskId: string) => {
        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.id !== questId) return q;

            const updatedSubtasks = q.subtasks?.map((st) =>
              st.id === subtaskId
                ? { ...st, completed: !st.completed, completedAt: !st.completed ? Date.now() : undefined }
                : st
            );

            // 计算整体进度（基于子任务完成情况）
            if (updatedSubtasks && updatedSubtasks.length > 0) {
              const completedCount = updatedSubtasks.filter(st => st.completed).length;
              const progress = Math.floor((completedCount / updatedSubtasks.length) * 100);
              return { ...q, subtasks: updatedSubtasks, progress };
            }

            return { ...q, subtasks: updatedSubtasks };
          }),
        }));
      },

      /**
       * 添加子任务
       */
      addSubtask: (questId: string, subtaskTitle: string) => {
        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.id !== questId) return q;

            const newSubtask = {
              id: Date.now().toString(),
              title: subtaskTitle,
              completed: false,
              createdAt: Date.now(),
            };

            const updatedSubtasks = [...(q.subtasks || []), newSubtask];

            // 重新计算进度
            const completedCount = updatedSubtasks.filter(st => st.completed).length;
            const progress = Math.floor((completedCount / updatedSubtasks.length) * 100);

            return { ...q, subtasks: updatedSubtasks, progress };
          }),
        }));
      },

      /**
       * 添加子任务（作为独立Quest）
       */
      addChildQuest: (parentId: string, childQuestData) => {
        const parentQuest = get().quests.find(q => q.id === parentId);
        if (!parentQuest) return;

        const newChildQuest: Quest = {
          ...childQuestData,
          id: Date.now().toString(),
          status: QuestStatus.ACTIVE,
          createdAt: Date.now(),
          parentId,
        };

        set((state) => ({
          quests: [...state.quests, newChildQuest],
        }));

        // 更新父任务进度
        get().updateParentQuestProgress(parentId);
      },

      /**
       * 获取子任务列表
       */
      getChildQuests: (parentId: string) => {
        return get().quests.filter(q => q.parentId === parentId);
      },

      /**
       * 将旧的subtasks转换为独立的子Quest
       */
      convertSubtasksToChildQuests: (questId: string) => {
        const state = get();
        const quest = state.quests.find(q => q.id === questId);
        if (!quest || !quest.subtasks || quest.subtasks.length === 0) return;

        // 为每个subtask创建独立的Quest
        quest.subtasks.forEach((subtask) => {
          const childQuest: Quest = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: quest.type,
            title: subtask.title,
            description: '',
            attributes: quest.attributes || ['int'],
            expReward: Math.floor(quest.expReward / (quest.subtasks?.length || 1)),
            coinReward: Math.floor(quest.coinReward / (quest.subtasks?.length || 1)),
            status: subtask.completed ? QuestStatus.COMPLETED : QuestStatus.ACTIVE,
            createdAt: subtask.createdAt,
            completedAt: subtask.completedAt,
            parentId: questId,
            startDate: quest.startDate,
            endDate: quest.endDate,
          };

          set((state) => ({
            quests: [...state.quests, childQuest],
          }));
        });

        // 清空原quest的subtasks数组
        set((state) => ({
          quests: state.quests.map(q =>
            q.id === questId ? { ...q, subtasks: [] } : q
          ),
        }));
      },

      /**
       * 更新父任务进度（基于子任务完成情况）
       */
      updateParentQuestProgress: (parentId: string) => {
        const childQuests = get().quests.filter(q => q.parentId === parentId);
        if (childQuests.length === 0) return;

        const completedCount = childQuests.filter(q => q.status === QuestStatus.COMPLETED).length;
        const progress = Math.floor((completedCount / childQuests.length) * 100);

        set((state) => ({
          quests: state.quests.map(q =>
            q.id === parentId ? { ...q, progress } : q
          ),
        }));

        // 如果所有子任务都完成，自动完成父任务
        if (progress === 100) {
          const parent = get().quests.find(q => q.id === parentId);
          if (parent && parent.status === QuestStatus.ACTIVE) {
            get().completeQuest(parentId);
          }
        }
      },

      /**
       * 增加金币
       */
      addCoins: (amount: number) => {
        set((state) => ({
          coins: state.coins + amount,
        }));
        // 检查金币成就
        get().checkAchievements();
      },

      /**
       * 消费金币
       * 返回是否成功
       */
      spendCoins: (amount: number) => {
        const state = get();
        if (state.coins < amount) return false;

        set({ coins: state.coins - amount });
        return true;
      },

      /**
       * 消费分类金币
       * 返回是否成功
       */
      spendCategorizedCoins: (coinType: AttributeType, amount: number) => {
        const state = get();
        if (state.categorizedCoins[coinType] < amount) return false;

        set((state) => ({
          categorizedCoins: {
            ...state.categorizedCoins,
            [coinType]: state.categorizedCoins[coinType] - amount,
          },
          coins: state.coins - amount, // 同时扣除总金币
        }));
        return true;
      },

      /**
       * 消费通用金币
       */
      spendUniversalCoins: (amount: number) => {
        const state = get();
        if (state.categorizedCoins.universal < amount) return false;

        set((state) => ({
          categorizedCoins: {
            ...state.categorizedCoins,
            universal: state.categorizedCoins.universal - amount,
          },
          coins: state.coins - amount,
        }));
        return true;
      },

      /**
       * 消费成就点数
       */
      spendAchievementPoints: (amount: number) => {
        const state = get();
        if (state.achievementPoints < amount) return false;

        set({ achievementPoints: state.achievementPoints - amount });
        return true;
      },

      /**
       * 购买奖励物品
       */
      purchaseReward: (rewardId: string, coinType: AttributeType | 'universal' | 'any', coinAmount: number, pointsAmount?: number, rewardName?: string) => {
        const state = get();

        // 注意：限购检查应该在前端的 canPurchase 中完成
        // 这里不再检查 purchasedRewards.includes(rewardId)，因为有些物品可以多次购买

        const reason = rewardName ? `购买: ${rewardName}` : `购买商品`;

        // ===== 第一步：验证所有资源是否足够 =====

        // 验证金币
        let hasEnoughCoins = false;
        if (coinType === 'any') {
          hasEnoughCoins = state.categorizedCoins.universal >= coinAmount || state.coins >= coinAmount;
        } else if (coinType === 'universal') {
          hasEnoughCoins = state.categorizedCoins.universal >= coinAmount;
        } else {
          hasEnoughCoins = state.categorizedCoins[coinType] >= coinAmount;
        }

        if (!hasEnoughCoins) {
          return false; // 金币不足
        }

        // 验证成就点数
        if (pointsAmount && pointsAmount > 0) {
          if (state.achievementPoints < pointsAmount) {
            return false; // 成就点数不足
          }
        }

        // ===== 第二步：扣除资源 =====

        // 扣除金币
        if (coinType === 'any') {
          // 可以使用任何金币，优先使用通用币
          if (state.categorizedCoins.universal >= coinAmount) {
            get().spendUniversalCoins(coinAmount);
            // 记录通用金币支出
            get().addCoinTransaction('spend', 'all', coinAmount, reason, rewardId);
          } else {
            get().spendCoins(coinAmount);
            // 记录总金币支出
            get().addCoinTransaction('spend', 'all', coinAmount, reason, rewardId);
          }
        } else if (coinType === 'universal') {
          get().spendUniversalCoins(coinAmount);
          // 记录通用金币支出
          get().addCoinTransaction('spend', 'all', coinAmount, reason, rewardId);
        } else {
          // 特定类型金币
          get().spendCategorizedCoins(coinType, coinAmount);
          // 记录分类金币支出
          get().addCoinTransaction('spend', coinType, coinAmount, reason, rewardId);
        }

        // 扣除成就点数
        if (pointsAmount && pointsAmount > 0) {
          get().spendAchievementPoints(pointsAmount);
        }

        // 添加到已购买列表（用于限购次数统计）
        set((state) => ({
          purchasedRewards: [...state.purchasedRewards, rewardId],
        }));

        return true;
      },

      /**
       * 切换专注模式
       */
      toggleFocusMode: () => {
        set((state) => ({
          focusModeActive: !state.focusModeActive,
          focusTimeRemaining: !state.focusModeActive ? 25 * 60 : 0, // 25分钟
        }));
      },

      /**
       * 更新专注时间
       */
      updateFocusTime: (time: number) => {
        set({ focusTimeRemaining: time });

        // 如果时间结束，自动退出专注模式
        if (time <= 0) {
          set((state) => ({
            focusModeActive: false,
            stats: {
              ...state.stats,
              totalFocusTime: state.stats.totalFocusTime + 25,
            },
          }));
        }
      },

      /**
       * 开始专注会话
       */
      startFocusSession: (mode: 'work' | 'shortBreak' | 'longBreak', duration: number) => {
        const newSession: import('@/types/game').FocusSession = {
          id: Date.now().toString(),
          mode,
          startTime: Date.now(),
          plannedDuration: duration,
          completed: false,
          interrupted: false,
        };

        set({
          currentFocusSession: newSession,
          focusModeActive: true,
        });
      },

      /**
       * 结束专注会话
       */
      endFocusSession: (completed: boolean, interrupted: boolean) => {
        const state = get();
        if (!state.currentFocusSession) return;

        const endTime = Date.now();
        const actualDuration = Math.floor((endTime - state.currentFocusSession.startTime) / 1000);

        const finishedSession: import('@/types/game').FocusSession = {
          ...state.currentFocusSession,
          endTime,
          actualDuration,
          completed,
          interrupted,
        };

        // 只有工作模式才增加专注时长
        const focusTimeToAdd = finishedSession.mode === 'work' && completed
          ? Math.floor(actualDuration / 60)
          : 0;

        set((state) => ({
          focusSessions: [...state.focusSessions, finishedSession],
          currentFocusSession: undefined,
          focusModeActive: false,
          stats: {
            ...state.stats,
            totalFocusTime: state.stats.totalFocusTime + focusTimeToAdd,
          },
        }));
      },

      /**
       * 添加专注会话笔记
       */
      addFocusSessionNote: (sessionId: string, note: string) => {
        set((state) => ({
          focusSessions: state.focusSessions.map(session =>
            session.id === sessionId
              ? { ...session, note }
              : session
          ),
        }));
      },

      /**
       * 解锁成就
       */
      unlockAchievement: (achievementId: string) => {
        const state = get();

        // 如果已经解锁，不重复解锁
        if (state.unlockedAchievements.includes(achievementId)) return;

        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        // 添加到已解锁列表
        set((state) => ({
          unlockedAchievements: [...state.unlockedAchievements, achievementId],
          achievementPoints: state.achievementPoints + (achievement.reward.points || 0),
          notifications: {
            ...state.notifications,
            achievement: {
              id: achievement.id,
              title: achievement.title,
              description: achievement.description,
              tier: achievement.tier,
              reward: achievement.reward,
            },
          },
        }));

        // 发放成就奖励经验（带来源说明）
        if (achievement.reward.exp > 0) {
          get().addExp(achievement.reward.exp, `解锁成就: ${achievement.title}`, achievementId);
        }

        // 发放成就奖励金币（带来源说明）
        if (achievement.reward.coins > 0) {
          set((state) => ({
            coins: state.coins + achievement.reward.coins,
            categorizedCoins: {
              ...state.categorizedCoins,
              universal: state.categorizedCoins.universal + achievement.reward.coins,
            },
          }));
          get().addCoinTransaction('earn', 'universal', achievement.reward.coins, `解锁成就: ${achievement.title}`, achievementId);
        }
      },

      /**
       * 检查是否解锁新成就
       */
      checkAchievements: () => {
        const state = get();

        ACHIEVEMENTS.forEach(achievement => {
          // 跳过已解锁的成就
          if (state.unlockedAchievements.includes(achievement.id)) return;

          // 检查前置成就
          if (achievement.prerequisites && achievement.prerequisites.length > 0) {
            const hasAllPrerequisites = achievement.prerequisites.every(prereqId =>
              state.unlockedAchievements.includes(prereqId)
            );
            if (!hasAllPrerequisites) return; // 前置成就未满足，跳过
          }

          let shouldUnlock = false;
          let current = 0;

          // 检查组合要求
          if (achievement.comboRequirement) {
            // 检查成就组合
            if (achievement.comboRequirement.achievements) {
              const hasAllAchievements = achievement.comboRequirement.achievements.every(achId =>
                state.unlockedAchievements.includes(achId)
              );
              if (!hasAllAchievements) return; // 组合成就未满足
            }

            // 检查属性组合
            if (achievement.comboRequirement.attributes) {
              const meetsAttributeRequirements = Object.entries(
                achievement.comboRequirement.attributes
              ).every(([attr, value]) => state.attributes[attr as keyof typeof state.attributes] >= value);

              shouldUnlock = meetsAttributeRequirements;
            } else {
              shouldUnlock = true; // 只有成就组合要求，已通过检查
            }
          } else {
            // 检查不同类型的成就
            switch (achievement.category) {
              case 'milestone':
                // 等级里程碑
                if (achievement.id.startsWith('explorer_')) {
                  current = state.level;
                  shouldUnlock = current >= achievement.requirement;
                }
                // 第一个任务
                if (achievement.id === 'first_step') {
                  current = state.stats.totalQuestsCompleted;
                  shouldUnlock = current >= 1;
                }
                break;

              case 'quest':
                // 任务完成数量 (包括学者系列)
                current = state.stats.totalQuestsCompleted;
                shouldUnlock = current >= achievement.requirement;
                break;

              case 'streak':
                // 连击天数 (包括战士系列)
                current = state.stats.currentStreak;
                shouldUnlock = current >= achievement.requirement;
                break;

              case 'attribute':
                // 守护者学徒 - 所有属性达到15（已通过comboRequirement处理）
                // 大师系列已删除，此分支保留用于未来扩展
                break;

              case 'special':
                // 传奇富豪 - 累计获得金币
                if (achievement.id.startsWith('legendary_wealthy')) {
                  // 统计所有earn类型的金币交易总和
                  const totalEarnedCoins = state.transactions.coins
                    .filter(t => t.type === 'earn' && !t.revoked)
                    .reduce((sum, t) => sum + t.amount, 0);
                  current = totalEarnedCoins;
                  shouldUnlock = current >= achievement.requirement;
                }
                // 平衡守护者 - 所有属性达到要求
                else if (achievement.id === 'guardian_balanced') {
                  const allAttributesAbove = Object.values(state.attributes).every(
                    v => v >= achievement.requirement
                  );
                  shouldUnlock = allAttributesAbove;
                }
                // 和谐守护者 - 所有属性差距小于20
                else if (achievement.id === 'guardian_harmony') {
                  const attrValues = Object.values(state.attributes);
                  const max = Math.max(...attrValues);
                  const min = Math.min(...attrValues);
                  shouldUnlock = (max - min) <= 20;
                }
                // 完美守护者 - 所有属性达到100
                else if (achievement.id === 'guardian_perfect') {
                  shouldUnlock = Object.values(state.attributes).every(v => v >= 100);
                }
                // 至高守护者 - 所有属性达到120且差值不超过15
                else if (achievement.id === 'guardian_ultimate') {
                  const attrValues = Object.values(state.attributes);
                  const allAbove120 = attrValues.every(v => v >= 120);
                  const max = Math.max(...attrValues);
                  const min = Math.min(...attrValues);
                  shouldUnlock = allAbove120 && (max - min) <= 15;
                }
                // 智慧引领 - INT比其他属性高15-25点，且其他属性不低于70
                else if (achievement.id === 'guardian_focused_int') {
                  const { int, vit, mng, cre } = state.attributes;
                  const otherAttrs = [vit, mng, cre];
                  const allAbove70 = otherAttrs.every(attr => attr >= 70);
                  const differences = otherAttrs.map(attr => int - attr);
                  const inRange = differences.every(diff => diff >= 15 && diff <= 25);
                  shouldUnlock = allAbove70 && inRange;
                }
                // 活力引领 - VIT比其他属性高15-25点，且其他属性不低于70
                else if (achievement.id === 'guardian_focused_vit') {
                  const { int, vit, mng, cre } = state.attributes;
                  const otherAttrs = [int, mng, cre];
                  const allAbove70 = otherAttrs.every(attr => attr >= 70);
                  const differences = otherAttrs.map(attr => vit - attr);
                  const inRange = differences.every(diff => diff >= 15 && diff <= 25);
                  shouldUnlock = allAbove70 && inRange;
                }
                // 管理引领 - MNG比其他属性高15-25点，且其他属性不低于70
                else if (achievement.id === 'guardian_focused_mng') {
                  const { int, vit, mng, cre } = state.attributes;
                  const otherAttrs = [int, vit, cre];
                  const allAbove70 = otherAttrs.every(attr => attr >= 70);
                  const differences = otherAttrs.map(attr => mng - attr);
                  const inRange = differences.every(diff => diff >= 15 && diff <= 25);
                  shouldUnlock = allAbove70 && inRange;
                }
                // 创造引领 - CRE比其他属性高15-25点，且其他属性不低于70
                else if (achievement.id === 'guardian_focused_cre') {
                  const { int, vit, mng, cre } = state.attributes;
                  const otherAttrs = [int, vit, mng];
                  const allAbove70 = otherAttrs.every(attr => attr >= 70);
                  const differences = otherAttrs.map(attr => cre - attr);
                  const inRange = differences.every(diff => diff >= 15 && diff <= 25);
                  shouldUnlock = allAbove70 && inRange;
                }
                // 黄金比例 - 所有属性差值不超过20且最低属性≥60
                else if (achievement.id === 'guardian_attribute_balance') {
                  const attrValues = Object.values(state.attributes);
                  const max = Math.max(...attrValues);
                  const min = Math.min(...attrValues);
                  shouldUnlock = (max - min) <= 20 && min >= 60;
                }
                // 极限平衡 - 所有属性≥150且差值≤10
                else if (achievement.id === 'extreme_all_balanced') {
                  const attrValues = Object.values(state.attributes);
                  const allAbove150 = attrValues.every(v => v >= 150);
                  const max = Math.max(...attrValues);
                  const min = Math.min(...attrValues);
                  shouldUnlock = allAbove150 && (max - min) <= 10;
                }
                // 和谐共生 - 所有属性≥100且差值≤10
                else if (achievement.id === 'perfect_all_attributes_max') {
                  const attrValues = Object.values(state.attributes);
                  const allAbove100 = attrValues.every(v => v >= 100);
                  const max = Math.max(...attrValues);
                  const min = Math.min(...attrValues);
                  shouldUnlock = allAbove100 && (max - min) <= 10;
                }
                // 终极传奇 - 等级50+所有属性100且差值≤10+任务500
                else if (achievement.id === 'legendary_ultimate') {
                  const attrValues = Object.values(state.attributes);
                  const allAbove100 = attrValues.every(v => v >= 100);
                  const max = Math.max(...attrValues);
                  const min = Math.min(...attrValues);
                  shouldUnlock = state.level >= 50 &&
                                 state.stats.totalQuestsCompleted >= 500 &&
                                 allAbove100 &&
                                 (max - min) <= 10;
                }
                break;

              case 'hidden':
                // 隐藏成就特殊检查
                const hour = new Date().getHours();

                // 夜猫子
                if (achievement.id === 'night_owl' && state.stats.totalQuestsCompleted > 0) {
                  shouldUnlock = hour >= 0 && hour < 5;
                }
                // 早起的鸟儿
                else if (achievement.id === 'early_bird' && state.stats.totalQuestsCompleted > 0) {
                  shouldUnlock = hour >= 5 && hour < 7;
                }
                // 收藏家 - 解锁 20 个成就
                else if (achievement.id === 'collector') {
                  current = state.unlockedAchievements.length;
                  shouldUnlock = current >= achievement.requirement;
                }
                // 速度恶魔和完美主义者需要特殊追踪（暂时跳过）
                break;
            }
          }

          if (shouldUnlock) {
            get().unlockAchievement(achievement.id);
          }
        });
      },

      /**
       * 重新检查已解锁的成就是否仍然满足条件
       * 用于取消完成任务后，撤销不再满足条件的成就
       * 支持递归检查：撤销成就可能导致降级，降级后需要再次检查其他成就
       */
      recheckAchievements: () => {
        const state = get();
        const achievementsToRevoke: string[] = [];

        // 遍历所有已解锁的成就
        state.unlockedAchievements.forEach(achievementId => {
          const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
          if (!achievement) return;

          let stillMeetsRequirement = true;

          // 检查组合要求
          if (achievement.comboRequirement) {
            // 检查成就组合
            if (achievement.comboRequirement.achievements) {
              const hasAllAchievements = achievement.comboRequirement.achievements.every(achId =>
                state.unlockedAchievements.includes(achId)
              );
              if (!hasAllAchievements) {
                stillMeetsRequirement = false;
              }
            }

            // 检查属性组合
            if (stillMeetsRequirement && achievement.comboRequirement.attributes) {
              const meetsAttributeRequirements = Object.entries(
                achievement.comboRequirement.attributes
              ).every(([attr, value]) => state.attributes[attr as keyof typeof state.attributes] >= value);

              if (!meetsAttributeRequirements) {
                stillMeetsRequirement = false;
              }
            }
          } else {
            // 检查不同类型的成就
            switch (achievement.category) {
              case 'milestone':
                if (achievement.id.startsWith('explorer_')) {
                  stillMeetsRequirement = state.level >= achievement.requirement;
                }
                if (achievement.id === 'first_step') {
                  stillMeetsRequirement = state.stats.totalQuestsCompleted >= 1;
                }
                break;

              case 'quest':
                stillMeetsRequirement = state.stats.totalQuestsCompleted >= achievement.requirement;
                break;

              case 'streak':
                stillMeetsRequirement = state.stats.currentStreak >= achievement.requirement;
                break;

              case 'attribute':
                // 守护者学徒 - 已通过comboRequirement处理
                // 大师系列已删除，此分支保留用于未来扩展
                break;

              case 'special':
                if (achievement.id.startsWith('legendary_wealthy')) {
                  stillMeetsRequirement = state.coins >= achievement.requirement;
                }
                break;

              case 'hidden':
                // 隐藏成就通常不撤销（如夜猫子、早起鸟等）
                // 但收藏家成就需要检查
                if (achievement.id === 'collector') {
                  // 需要排除当前成就本身，避免循环依赖
                  const achievementCountExcludingSelf = state.unlockedAchievements.filter(
                    id => id !== 'collector'
                  ).length;
                  stillMeetsRequirement = achievementCountExcludingSelf >= achievement.requirement;
                }
                break;
            }
          }

          // 如果不再满足条件，标记为需要撤销
          if (!stillMeetsRequirement) {
            achievementsToRevoke.push(achievementId);
          }
        });

        // 撤销所有不再满足条件的成就
        achievementsToRevoke.forEach(achievementId => {
          get().revokeAchievement(achievementId);
        });

        // 如果有成就被撤销，再次检查（因为撤销成就可能导致降级，进而影响其他成就）
        if (achievementsToRevoke.length > 0) {
          // 使用 setTimeout 确保所有状态更新完成后再递归检查
          setTimeout(() => {
            // 再次获取最新状态，检查是否还有需要撤销的成就
            const currentState = get();
            const stillHasInvalidAchievements = currentState.unlockedAchievements.some(achId => {
              const ach = ACHIEVEMENTS.find(a => a.id === achId);
              if (!ach) return false;

              // 快速检查等级成就（最常见的情况）
              if (ach.category === 'milestone' && achId.startsWith('explorer_')) {
                return currentState.level < ach.requirement;
              }

              return false;
            });

            if (stillHasInvalidAchievements) {
              get().recheckAchievements(); // 递归检查
            }
          }, 0);
        }
      },

      /**
       * 撤销成就
       * 追回成就奖励（经验、金币、成就点数）- 使用标记模式
       */
      revokeAchievement: (achievementId: string) => {
        const state = get();

        // 检查是否已解锁
        if (!state.unlockedAchievements.includes(achievementId)) return;

        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        const revokeReason = `撤销成就: ${achievement.title}`;

        // 从已解锁列表中移除
        set((state) => ({
          unlockedAchievements: state.unlockedAchievements.filter(id => id !== achievementId),
          achievementPoints: Math.max(0, state.achievementPoints - (achievement.reward.points || 0)),
        }));

        // 标记并扣除成就奖励的经验（使用交易记录中的实际值，包含加成）
        if (achievement.reward.exp > 0) {
          const actualExpGained = get().revokeExpTransactions(achievementId, revokeReason);
          if (actualExpGained > 0) {
            get().subtractExp(actualExpGained, revokeReason, achievementId);
          }
        }

        // 标记并扣除成就奖励的金币（使用交易记录中的实际值）
        if (achievement.reward.coins > 0) {
          const revokedCoins = get().revokeCoinTransactions(achievementId, revokeReason);
          if (revokedCoins.length > 0) {
            const newCategorizedCoins = { ...state.categorizedCoins };
            let totalCoinsToDeduct = 0;

            revokedCoins.forEach(({ coinType, amount }) => {
              if (coinType === 'all' || coinType === 'universal') {
                newCategorizedCoins.universal = Math.max(0, newCategorizedCoins.universal - amount);
              } else {
                newCategorizedCoins[coinType as AttributeType] = Math.max(
                  0,
                  newCategorizedCoins[coinType as AttributeType] - amount
                );
              }
              totalCoinsToDeduct += amount;
            });

            set((state) => ({
              categorizedCoins: newCategorizedCoins,
              coins: Math.max(0, state.coins - totalCoinsToDeduct),
            }));
          }
        }
      },

      /**
       * 关闭升级通知
       */
      dismissLevelUpNotification: () => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            levelUp: null,
          },
        }));
      },

      /**
       * 关闭成就通知
       */
      dismissAchievementNotification: () => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            achievement: null,
          },
        }));
      },

      /**
       * 检查每日登录
       * 更新连击和奖励
       */
      checkDailyLogin: () => {
        const state = get();
        const today = getTodayString();
        const lastLogin = state.stats.lastLoginDate;

        // 如果今天已经登录过，跳过
        if (lastLogin === today) return;

        // 计算属性衰减（每日登录时检查）
        get().calculateAttributeDecay();

        // 如果是首次登录（新用户），只更新登录日期，不给奖励
        if (!lastLogin) {
          set((state) => ({
            stats: {
              ...state.stats,
              lastLoginDate: today,
              currentStreak: 1,
              longestStreak: 1,
              totalLoginDays: 1,
            },
          }));
          return;
        }

        let newStreak = 1;
        let dailyReward = 10; // 基础每日奖励

        const daysDiff = getDaysDifference(lastLogin, today);

        if (daysDiff === 1) {
          // 连续登录
          newStreak = state.stats.currentStreak + 1;
          // 连击奖励递增
          dailyReward += Math.min(newStreak * 5, 50);
        } else if (daysDiff > 1) {
          // 连击中断
          newStreak = 1;
        }

        // 更新状态
        set((state) => ({
          stats: {
            ...state.stats,
            lastLoginDate: today,
            currentStreak: newStreak,
            longestStreak: Math.max(state.stats.longestStreak, newStreak),
            totalLoginDays: state.stats.totalLoginDays + 1,
          },
          coins: state.coins + dailyReward,
          categorizedCoins: {
            ...state.categorizedCoins,
            universal: state.categorizedCoins.universal + dailyReward,
          },
        }));

        // 记录金币获取
        get().addCoinTransaction('earn', 'universal', dailyReward, `每日登录（第${newStreak}天连击）`, `login-${today}`);

        // 添加经验奖励
        get().addExp(dailyReward * 2, `每日登录（第${newStreak}天连击）`, `login-${today}`);

        // 检查连击成就
        get().checkAchievements();
      },

      /**
       * 每日签到
       * 独立于登录的签到系统，有额外奖励
       */
      dailyCheckIn: () => {
        const state = get();
        const today = getTodayString();

        console.log('[dailyCheckIn] 调用签到，今日日期:', today);
        console.log('[dailyCheckIn] 当前状态:', {
          hasCheckedInToday: state.checkIn.hasCheckedInToday,
          lastCheckInDate: state.checkIn.lastCheckInDate,
        });

        // 检查今天是否已经签到
        if (state.checkIn.hasCheckedInToday && state.checkIn.lastCheckInDate === today) {
          console.log('[dailyCheckIn] 今天已签到，直接返回');
          return; // 今天已签到，直接返回
        }

        // 检查是否是连续签到
        const lastCheckIn = state.checkIn.lastCheckInDate;
        let consecutiveDays = 1;

        if (lastCheckIn) {
          const daysDiff = getDaysDifference(lastCheckIn, today);

          if (daysDiff === 1) {
            // 连续签到，基于签到历史计算连续天数
            // 从后往前遍历签到历史，计算连续天数
            let streak = 0; // 从0开始，只计算历史记录中的连续天数
            const history = [...state.checkIn.checkInHistory];

            for (let i = history.length - 1; i > 0; i--) {
              const currentDate = history[i];
              const prevDate = history[i - 1];
              const diff = getDaysDifference(prevDate, currentDate);

              if (diff === 1) {
                streak++;
              } else {
                break;
              }
            }

            // streak 是历史中的连续天数，加1包括最后一次签到，再加1包括今天
            consecutiveDays = streak + 2;
          } else if (daysDiff > 1) {
            // 签到中断，重新开始
            consecutiveDays = 1;
          } else if (daysDiff === 0) {
            // 同一天，不应该发生（已在上面检查）
            return;
          }
        }

        // 计算签到奖励
        const reward = calculateCheckInReward(consecutiveDays);

        // 更新签到历史
        const newHistory = [...state.checkIn.checkInHistory, today];

        // 计算本月签到天数
        const currentMonth = today.substring(0, 7); // YYYY-MM
        const currentMonthCheckIns = newHistory.filter(
          date => date.startsWith(currentMonth)
        ).length;

        // 更新状态
        set((state) => ({
          checkIn: {
            ...state.checkIn, // 保留原有字段
            hasCheckedInToday: true,
            lastCheckInDate: today,
            checkInHistory: newHistory,
            currentMonthCheckIns,
            totalCheckIns: state.checkIn.totalCheckIns + 1,
            checkInStreak: consecutiveDays, // 更新签到连击天数
          },
          notifications: {
            ...state.notifications,
            checkIn: {
              day: consecutiveDays,
              rewards: {
                exp: reward.exp,
                coins: reward.coins,
                categorizedCoins: reward.categorizedCoins,
                bonusMessage: reward.bonusMessage,
              },
            },
          },
        }));

        console.log('[dailyCheckIn] 签到成功！连续', consecutiveDays, '天');

        // 发放奖励
        get().addExp(reward.exp, `每日签到（第${consecutiveDays}天）`, `checkin-${today}`);

        // 添加通用金币并记录
        set((state) => ({
          categorizedCoins: {
            ...state.categorizedCoins,
            universal: state.categorizedCoins.universal + reward.coins,
          },
          coins: state.coins + reward.coins,
        }));

        // 记录通用金币获取
        get().addCoinTransaction('earn', 'universal', reward.coins, `每日签到（第${consecutiveDays}天）`, `checkin-${today}`);

        // 如果有分类金币奖励，也发放并记录
        if (reward.categorizedCoins) {
          set((state) => ({
            categorizedCoins: {
              ...state.categorizedCoins,
              int: state.categorizedCoins.int + (reward.categorizedCoins?.int || 0),
              vit: state.categorizedCoins.vit + (reward.categorizedCoins?.vit || 0),
              mng: state.categorizedCoins.mng + (reward.categorizedCoins?.mng || 0),
              cre: state.categorizedCoins.cre + (reward.categorizedCoins?.cre || 0),
            },
            coins: state.coins +
              (reward.categorizedCoins?.int || 0) +
              (reward.categorizedCoins?.vit || 0) +
              (reward.categorizedCoins?.mng || 0) +
              (reward.categorizedCoins?.cre || 0),
          }));

          // 记录各类分类金币获取
          if (reward.categorizedCoins.int) {
            get().addCoinTransaction('earn', 'int', reward.categorizedCoins.int, `每日签到奖励（智慧币）`, `checkin-${today}`);
          }
          if (reward.categorizedCoins.vit) {
            get().addCoinTransaction('earn', 'vit', reward.categorizedCoins.vit, `每日签到奖励（活力币）`, `checkin-${today}`);
          }
          if (reward.categorizedCoins.mng) {
            get().addCoinTransaction('earn', 'mng', reward.categorizedCoins.mng, `每日签到奖励（管理币）`, `checkin-${today}`);
          }
          if (reward.categorizedCoins.cre) {
            get().addCoinTransaction('earn', 'cre', reward.categorizedCoins.cre, `每日签到奖励（创意币）`, `checkin-${today}`);
          }
        }

        // 检查成就
        get().checkAchievements();
      },

      /**
       * 关闭签到通知
       */
      dismissCheckInNotification: () => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            checkIn: null,
          },
        }));
      },

      /**
       * 添加金币交易记录
       */
      addCoinTransaction: (type, coinType, amount, reason, relatedId) => {
        const transaction: import('@/types/game').CoinTransaction = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type,
          coinType,
          amount,
          reason,
          timestamp: Date.now(),
          relatedId,
        };

        set((state) => ({
          transactions: {
            ...state.transactions,
            coins: [transaction, ...state.transactions.coins].slice(0, 500), // 保留最近500条
          },
        }));
      },

      /**
       * 添加经验交易记录
       */
      addExpTransaction: (type, amount, reason, relatedId) => {
        const transaction: import('@/types/game').ExpTransaction = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type,
          amount,
          reason,
          timestamp: Date.now(),
          relatedId,
        };

        set((state) => ({
          transactions: {
            ...state.transactions,
            exp: [transaction, ...state.transactions.exp].slice(0, 500), // 保留最近500条
          },
        }));
      },

      /**
       * 添加属性变化记录
       */
      addAttributeChange: (attribute, oldValue, newValue, reason, relatedId) => {
        const change: import('@/types/game').AttributeChange = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          attribute,
          oldValue,
          newValue,
          change: newValue - oldValue,
          reason,
          timestamp: Date.now(),
          relatedId,
        };

        set((state) => ({
          transactions: {
            ...state.transactions,
            attributes: [change, ...state.transactions.attributes].slice(0, 500), // 保留最近500条
          },
        }));
      },

      /**
       * 标记经验交易记录为已撤销
       * 返回被撤销的经验值（用于准确扣除）
       */
      revokeExpTransaction: (relatedId: string, revokeReason: string): number => {
        const state = get();
        let revokedAmount = 0;

        // 查找该任务的经验交易记录（type = 'earn' 且未被撤销）
        const targetTransaction = state.transactions.exp.find(
          t => t.relatedId === relatedId && t.type === 'earn' && !t.revoked
        );

        if (targetTransaction) {
          revokedAmount = targetTransaction.amount;

          // 标记为已撤销
          set((state) => ({
            transactions: {
              ...state.transactions,
              exp: state.transactions.exp.map(t =>
                t.id === targetTransaction.id
                  ? {
                      ...t,
                      revoked: true,
                      revokedAt: Date.now(),
                      revokeReason,
                    }
                  : t
              ),
            },
          }));
        }

        return revokedAmount;
      },

      /**
       * 标记金币交易记录为已撤销
       * 返回被撤销的金币信息
       */
      revokeCoinTransactions: (relatedId: string, revokeReason: string): { coinType: string, amount: number }[] => {
        const state = get();
        const revokedCoins: { coinType: string, amount: number }[] = [];

        // 查找该任务的所有金币交易记录（type = 'earn' 且未被撤销）
        const targetTransactions = state.transactions.coins.filter(
          t => t.relatedId === relatedId && t.type === 'earn' && !t.revoked
        );

        if (targetTransactions.length > 0) {
          // 标记所有相关交易为已撤销
          set((state) => ({
            transactions: {
              ...state.transactions,
              coins: state.transactions.coins.map(t => {
                const shouldRevoke = targetTransactions.some(target => target.id === t.id);
                if (shouldRevoke) {
                  revokedCoins.push({ coinType: t.coinType, amount: t.amount });
                  return {
                    ...t,
                    revoked: true,
                    revokedAt: Date.now(),
                    revokeReason,
                  };
                }
                return t;
              }),
            },
          }));
        }

        return revokedCoins;
      },

      /**
       * 标记属性变化记录为已撤销
       * 返回被撤销的属性信息
       */
      revokeAttributeChanges: (relatedId: string, revokeReason: string): { attribute: AttributeType, change: number }[] => {
        const state = get();
        const revokedAttributes: { attribute: AttributeType, change: number }[] = [];

        // 查找该任务的所有属性变化记录（change > 0 且未被撤销）
        const targetChanges = state.transactions.attributes.filter(
          t => t.relatedId === relatedId && t.change > 0 && !t.revoked
        );

        if (targetChanges.length > 0) {
          // 标记所有相关变化为已撤销
          set((state) => ({
            transactions: {
              ...state.transactions,
              attributes: state.transactions.attributes.map(t => {
                const shouldRevoke = targetChanges.some(target => target.id === t.id);
                if (shouldRevoke) {
                  revokedAttributes.push({ attribute: t.attribute, change: t.change });
                  return {
                    ...t,
                    revoked: true,
                    revokedAt: Date.now(),
                    revokeReason,
                  };
                }
                return t;
              }),
            },
          }));
        }

        return revokedAttributes;
      },

      /**
       * 撤销经验交易记录
       * 返回被撤销的经验总数
       */
      revokeExpTransactions: (relatedId: string, revokeReason: string): number => {
        const state = get();
        let totalRevokedExp = 0;

        // 查找该任务的所有经验交易记录（type = 'earn' 且未被撤销）
        const targetTransactions = state.transactions.exp.filter(
          t => t.relatedId === relatedId && t.type === 'earn' && !t.revoked
        );

        if (targetTransactions.length > 0) {
          // 标记所有相关交易为已撤销
          set((state) => ({
            transactions: {
              ...state.transactions,
              exp: state.transactions.exp.map(t => {
                const shouldRevoke = targetTransactions.some(target => target.id === t.id);
                if (shouldRevoke) {
                  totalRevokedExp += t.amount;
                  return {
                    ...t,
                    revoked: true,
                    revokedAt: Date.now(),
                    revokeReason,
                  };
                }
                return t;
              }),
            },
          }));
        }

        return totalRevokedExp;
      },

      /**
       * 更新设置
       */
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }));
      },

      /**
       * 添加物品到背包
       * 支持叠加相同物品
       */
      addToInventory: (itemData) => {
        const state = get();

        // 检查是否已存在相同的物品（根据 rewardId）
        const existingItem = state.inventory.find(
          item => item.rewardId === itemData.rewardId && item.quantity < (item.maxStack || 99)
        );

        if (existingItem) {
          // 如果存在且未达到最大堆叠，增加数量
          set((state) => ({
            inventory: state.inventory.map(item =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + itemData.quantity }
                : item
            ),
          }));
        } else {
          // 创建新物品
          const newItem: InventoryItem = {
            ...itemData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            acquiredAt: Date.now(),
            isUsed: false,
            usedCount: 0,
            usageRecords: [],
            notes: [],
          };

          set((state) => ({
            inventory: [...state.inventory, newItem],
          }));
        }
      },

      /**
       * 使用背包物品
       */
      useInventoryItem: (itemId: string, note?: string) => {
        const state = get();
        const item = state.inventory.find(i => i.id === itemId);

        if (!item || item.quantity <= 0) return false;

        // 创建使用记录
        const usageRecord: ItemUsageRecord = {
          id: Date.now().toString(),
          usedAt: Date.now(),
          note,
        };

        // 更新物品状态（保留数量为0的物品，不删除）
        set((state) => ({
          inventory: state.inventory.map(i => {
            if (i.id !== itemId) return i;

            const newQuantity = i.quantity - 1;
            const newUsedCount = i.usedCount + 1;

            return {
              ...i,
              quantity: newQuantity,
              usedCount: newUsedCount,
              isUsed: true,
              lastUsedAt: Date.now(),
              usageRecords: [...i.usageRecords, usageRecord],
            };
          }),
        }));

        return true;
      },

      /**
       * 添加物品笔记
       */
      addItemNote: (itemId: string, content: string) => {
        const newNote: ItemNote = {
          id: Date.now().toString(),
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          inventory: state.inventory.map(item =>
            item.id === itemId
              ? { ...item, notes: [...item.notes, newNote] }
              : item
          ),
        }));
      },

      /**
       * 更新物品笔记
       */
      updateItemNote: (itemId: string, noteId: string, content: string) => {
        set((state) => ({
          inventory: state.inventory.map(item => {
            if (item.id !== itemId) return item;

            return {
              ...item,
              notes: item.notes.map(note =>
                note.id === noteId
                  ? { ...note, content, updatedAt: Date.now() }
                  : note
              ),
            };
          }),
        }));
      },

      /**
       * 删除物品笔记
       */
      deleteItemNote: (itemId: string, noteId: string) => {
        set((state) => ({
          inventory: state.inventory.map(item => {
            if (item.id !== itemId) return item;

            return {
              ...item,
              notes: item.notes.filter(note => note.id !== noteId),
            };
          }),
        }));
      },

      /**
       * 从背包移除物品
       */
      removeFromInventory: (itemId: string) => {
        set((state) => ({
          inventory: state.inventory.filter(item => item.id !== itemId),
        }));
      },

      /**
       * 更新物品数量
       */
      updateItemQuantity: (itemId: string, quantity: number) => {
        set((state) => ({
          inventory: state.inventory.map(item =>
            item.id === itemId
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          ).filter(item => item.quantity > 0),
        }));
      },

      // ==================== 习惯管理 ====================

      /**
       * 添加新习惯
       */
      addHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newHabit: Habit = {
          ...getDefaultHabit(),
          ...habitData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          habits: [...state.habits, newHabit],
        }));

        // 检查新习惯是否是今日需要完成的，如果是且未完成，需要取消今日签到
        const today = new Date();
        const dayOfWeek = today.getDay();
        const isActiveToday =
          newHabit.status === HabitStatus.ACTIVE &&
          (!newHabit.startDate || newHabit.startDate <= Date.now()) &&
          (!newHabit.endDate || newHabit.endDate >= Date.now()) &&
          (newHabit.repeatPattern.type === 'daily' ||
           (newHabit.repeatPattern.daysOfWeek?.includes(dayOfWeek) || false));

        if (isActiveToday) {
          // 新习惯今天需要完成，使用 setTimeout 确保状态更新完成后再检查签到状态
          setTimeout(() => {
            get().recheckTodayCheckInStatus();
          }, 0);
        }
      },

      /**
       * 更新习惯
       */
      updateHabit: (habitId: string, updates: Partial<Habit>) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, ...updates, updatedAt: Date.now() } : h
          ),
        }));

        // 如果更新了目标值或单位，需要重新检查今天的打卡完成状态
        if (updates.targetValue !== undefined || updates.unit !== undefined) {
          const state = get();
          const habit = state.habits.find(h => h.id === habitId);
          if (!habit) return;

          const today = getTodayString();
          const todayCheckIn = state.habitCheckIns.find(
            c => c.habitId === habitId && c.date === today
          );

          // 如果今天有打卡记录且不是布尔型，更新打卡完成状态
          if (todayCheckIn && habit.type !== HabitType.BOOLEAN) {
            // 重新计算是否完成（habit.targetValue 已经是更新后的值）
            const isCompleted = habit.targetValue ? (todayCheckIn.value || 0) >= habit.targetValue : true;

            // 更新打卡记录的完成状态和目标值
            set((state) => ({
              habitCheckIns: state.habitCheckIns.map((c) =>
                c.id === todayCheckIn.id
                  ? {
                      ...c,
                      completed: isCompleted,
                      targetValueAtCheckIn: habit.targetValue,
                    }
                  : c
              ),
            }));

            // 更新统计数据
            get().updateHabitStats(habitId);
          }

          // 使用 setTimeout 确保所有状态更新完成后再检查签到状态
          setTimeout(() => {
            get().recheckTodayCheckInStatus();
          }, 0);
        }
      },

      /**
       * 删除习惯
       */
      deleteHabit: (habitId: string) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
          // 同时删除相关的打卡记录
          habitCheckIns: state.habitCheckIns.filter((c) => c.habitId !== habitId),
        }));
      },

      /**
       * 归档习惯
       */
      archiveHabit: (habitId: string) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? { ...h, status: HabitStatus.ARCHIVED, updatedAt: Date.now() }
              : h
          ),
        }));
      },

      /**
       * 暂停/恢复习惯
       */
      toggleHabitPause: (habitId: string) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== habitId) return h;
            const newStatus =
              h.status === HabitStatus.PAUSED
                ? HabitStatus.ACTIVE
                : HabitStatus.PAUSED;
            return { ...h, status: newStatus, updatedAt: Date.now() };
          }),
        }));
      },

      /**
       * 习惯打卡
       */
      checkInHabit: (habitId: string, value?: number, note?: string) => {
        console.log('[checkInHabit] 开始打卡', { habitId, value, note });

        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) {
          console.log('[checkInHabit] 习惯不存在:', habitId);
          return false;
        }

        console.log('[checkInHabit] 找到习惯:', habit.name);

        const today = getTodayString();

        // 检查今天是否已经打卡
        const existingCheckIn = state.habitCheckIns.find(
          (c) => c.habitId === habitId && c.date === today
        );

        console.log('[checkInHabit] 已有打卡记录:', existingCheckIn ? '是' : '否');

        // 判断是否完成：对于数量型和时长型，需要达到目标值
        let isCompleted = true;
        if (habit.type !== HabitType.BOOLEAN && habit.targetValue) {
          isCompleted = (value || 0) >= habit.targetValue;
        }

        console.log('[checkInHabit] 是否完成:', isCompleted);

        if (existingCheckIn) {
          // 更新现有打卡记录
          set((state) => ({
            habitCheckIns: state.habitCheckIns.map((c) =>
              c.id === existingCheckIn.id
                ? {
                    ...c,
                    completed: isCompleted,
                    value,
                    targetValueAtCheckIn: habit.targetValue, // 记录当前目标值
                    completedAt: Date.now(),
                    note,
                  }
                : c
            ),
          }));
          console.log('[checkInHabit] 更新打卡记录');
        } else {
          // 创建新打卡记录
          const newCheckIn: HabitCheckIn = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            habitId,
            date: today,
            completed: isCompleted,
            value,
            targetValueAtCheckIn: habit.targetValue, // 记录打卡时的目标值
            completedAt: Date.now(),
            note,
          };

          set((state) => ({
            habitCheckIns: [...state.habitCheckIns, newCheckIn],
          }));
          console.log('[checkInHabit] 创建新打卡记录');
        }

        // 更新习惯统计
        get().updateHabitStats(habitId);

        // 检查是否所有今日习惯都已完成，自动签到
        console.log('[checkInHabit] 检查自动签到');
        get().checkDailyHabitsCompletion();

        return true;
      },

      /**
       * 取消习惯打卡
       */
      uncheckInHabit: (habitId: string, date?: string) => {
        const targetDate = date || getTodayString();

        console.log('[uncheckInHabit] 取消打卡', { habitId, targetDate });

        set((state) => ({
          habitCheckIns: state.habitCheckIns.map((c) =>
            c.habitId === habitId && c.date === targetDate
              ? { ...c, completed: false, completedAt: undefined }
              : c
          ),
        }));

        console.log('[uncheckInHabit] 打卡记录已更新为未完成');

        // 更新习惯统计
        get().updateHabitStats(habitId);

        // 检查签到状态（取消打卡可能需要取消签到）
        console.log('[uncheckInHabit] 重新检查签到状态');
        setTimeout(() => {
          get().recheckTodayCheckInStatus();
        }, 0);
      },

      /**
       * 更新习惯统计数据
       */
      updateHabitStats: (habitId: string) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return;

        // 获取该习惯的所有打卡记录（按日期排序）
        const checkIns = state.habitCheckIns
          .filter((c) => c.habitId === habitId && c.completed)
          .sort((a, b) => a.date.localeCompare(b.date));

        // 计算总完成次数
        const totalCompletions = checkIns.length;

        // 计算当前连续天数
        let currentStreak = 0;
        const today = getTodayString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // 从今天往回找
        let checkDate = today;
        let dateToCheck = new Date();

        while (true) {
          const hasCheckIn = checkIns.some((c) => c.date === checkDate);
          if (!hasCheckIn) {
            // 如果是第一天（今天）没打卡，从昨天开始算
            if (checkDate === today) {
              checkDate = yesterdayStr;
              dateToCheck.setDate(dateToCheck.getDate() - 1);
              continue;
            }
            break;
          }
          currentStreak++;
          dateToCheck.setDate(dateToCheck.getDate() - 1);
          checkDate = dateToCheck.toISOString().split('T')[0];
        }

        // 计算最长连续天数
        let longestStreak = 0;
        let tempStreak = 0;
        let prevDate: Date | null = null;

        checkIns.forEach((checkIn) => {
          const currentDate = new Date(checkIn.date);

          if (prevDate) {
            const diffTime = currentDate.getTime() - prevDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              tempStreak++;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          } else {
            tempStreak = 1;
          }

          prevDate = currentDate;
        });
        longestStreak = Math.max(longestStreak, tempStreak);

        // 计算完成率（基于习惯创建以来的天数）
        const createdDate = new Date(habit.createdAt);
        const todayDate = new Date();
        const totalDays = Math.floor(
          (todayDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        const completionRate = totalDays > 0
          ? Math.floor((totalCompletions / totalDays) * 100)
          : 0;

        // 更新习惯统计
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  stats: {
                    totalCompletions,
                    currentStreak,
                    longestStreak,
                    completionRate,
                  },
                  updatedAt: Date.now(),
                }
              : h
          ),
        }));
      },

      /**
       * 检查今日习惯是否全部完成，自动签到
       */
      checkDailyHabitsCompletion: () => {
        const state = get();
        const today = getTodayString();

        console.log('[checkDailyHabitsCompletion] 检查今日习惯完成情况');

        // 获取今日应该完成的激活状态习惯
        const todayHabits = state.habits.filter((habit) => {
          if (habit.status !== HabitStatus.ACTIVE) return false;

          // 检查是否在日期范围内
          if (habit.startDate && habit.startDate > Date.now()) return false;
          if (habit.endDate && habit.endDate < Date.now()) return false;

          // 检查重复模式
          const todayDate = new Date();
          const dayOfWeek = todayDate.getDay();

          if (habit.repeatPattern.type === 'daily') {
            return true;
          } else if (habit.repeatPattern.type === 'weekly') {
            return habit.repeatPattern.daysOfWeek?.includes(dayOfWeek) || false;
          } else if (habit.repeatPattern.type === 'custom') {
            return habit.repeatPattern.daysOfWeek?.includes(dayOfWeek) || false;
          }

          return false;
        });

        console.log('[checkDailyHabitsCompletion] 今日应完成习惯数:', todayHabits.length);

        if (todayHabits.length === 0) {
          // 没有今日习惯，不触发自动签到
          console.log('[checkDailyHabitsCompletion] 没有今日习惯，不触发自动签到');
          return;
        }

        // 检查所有今日习惯是否都已完成
        const allCompleted = todayHabits.every((habit) => {
          const checkIn = state.habitCheckIns.find(
            (c) => c.habitId === habit.id && c.date === today && c.completed
          );
          return !!checkIn;
        });

        console.log('[checkDailyHabitsCompletion] 所有习惯已完成:', allCompleted);
        console.log('[checkDailyHabitsCompletion] 签到状态:', {
          hasCheckedInToday: state.checkIn.hasCheckedInToday,
          lastCheckInDate: state.checkIn.lastCheckInDate,
        });

        // 如果全部完成且今天还未签到，自动签到
        if (allCompleted && (!state.checkIn.hasCheckedInToday || state.checkIn.lastCheckInDate !== today)) {
          console.log('[checkDailyHabitsCompletion] 触发自动签到');
          get().dailyCheckIn();
        } else {
          console.log('[checkDailyHabitsCompletion] 不满足自动签到条件');
        }
      },

      /**
       * 重新检查今日签到状态
       * 当习惯变化导致今日未全部完成时，取消今日签到；如果全部完成，自动签到
       */
      recheckTodayCheckInStatus: () => {
        const state = get();
        const today = getTodayString();

        // 获取今日应该完成的激活状态习惯
        const todayHabits = state.habits.filter((habit) => {
          if (habit.status !== HabitStatus.ACTIVE) return false;
          if (habit.startDate && habit.startDate > Date.now()) return false;
          if (habit.endDate && habit.endDate < Date.now()) return false;

          const todayDate = new Date();
          const dayOfWeek = todayDate.getDay();

          if (habit.repeatPattern.type === 'daily') {
            return true;
          } else if (habit.repeatPattern.type === 'weekly' || habit.repeatPattern.type === 'custom') {
            return habit.repeatPattern.daysOfWeek?.includes(dayOfWeek) || false;
          }

          return false;
        });

        // 如果没有今日习惯，不需要签到
        if (todayHabits.length === 0) {
          return;
        }

        // 检查所有今日习惯是否都已完成
        const allCompleted = todayHabits.every((habit) => {
          const checkIn = state.habitCheckIns.find(
            (c) => c.habitId === habit.id && c.date === today && c.completed
          );
          return !!checkIn;
        });

        // 根据完成情况更新签到状态
        if (allCompleted) {
          // 如果全部完成且今天还未签到，自动签到
          if (!state.checkIn.hasCheckedInToday || state.checkIn.lastCheckInDate !== today) {
            get().dailyCheckIn();
          }
        } else {
          // 如果不是全部完成且今天已签到，取消今日签到
          if (state.checkIn.hasCheckedInToday && state.checkIn.lastCheckInDate === today) {
            // 从签到历史中移除今天的记录
            const newHistory = state.checkIn.checkInHistory.filter(date => date !== today);

            // 重新计算本月签到天数
            const currentMonth = today.substring(0, 7);
            const currentMonthCheckIns = newHistory.filter(
              date => date.startsWith(currentMonth)
            ).length;

            // 重新计算签到连击天数（基于移除今天后的历史）
            let newCheckInStreak = 0;
            if (newHistory.length > 0) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              const lastCheckIn = newHistory[newHistory.length - 1];

              // 如果最后一次签到是昨天或今天，计算连击
              if (lastCheckIn === yesterdayStr || lastCheckIn === today) {
                let streak = 0;
                for (let i = newHistory.length - 1; i > 0; i--) {
                  const currentDate = newHistory[i];
                  const prevDate = newHistory[i - 1];
                  const diff = getDaysDifference(prevDate, currentDate);

                  if (diff === 1) {
                    streak++;
                  } else {
                    break;
                  }
                }
                newCheckInStreak = streak + 1; // +1 包括最后一次签到
              }
            }

            // 获取新的最后签到日期（如果有历史记录的话）
            const newLastCheckInDate = newHistory.length > 0
              ? newHistory[newHistory.length - 1]
              : '';

            set((state) => ({
              checkIn: {
                ...state.checkIn,
                hasCheckedInToday: false,
                lastCheckInDate: newLastCheckInDate, // 更新为历史记录中的最后一次签到日期
                checkInHistory: newHistory,
                currentMonthCheckIns,
                totalCheckIns: state.checkIn.totalCheckIns - 1,
                checkInStreak: newCheckInStreak,
              },
            }));
          }
        }
      },

      /**
       * 获取今日习惯概览
       */
      getTodayHabitSummary: () => {
        const state = get();
        const today = getTodayString();

        // 获取今日应该完成的习惯
        const todayHabits = state.habits.filter((habit) => {
          if (habit.status !== HabitStatus.ACTIVE) return false;

          if (habit.startDate && habit.startDate > Date.now()) return false;
          if (habit.endDate && habit.endDate < Date.now()) return false;

          const todayDate = new Date();
          const dayOfWeek = todayDate.getDay();

          if (habit.repeatPattern.type === 'daily') {
            return true;
          } else if (habit.repeatPattern.type === 'weekly' || habit.repeatPattern.type === 'custom') {
            return habit.repeatPattern.daysOfWeek?.includes(dayOfWeek) || false;
          }

          return false;
        });

        // 计算已完成的习惯数
        const completedHabits = todayHabits.filter((habit) => {
          const checkIn = state.habitCheckIns.find(
            (c) => c.habitId === habit.id && c.date === today && c.completed
          );
          return !!checkIn;
        }).length;

        const totalHabits = todayHabits.length;
        const completionRate = totalHabits > 0
          ? Math.floor((completedHabits / totalHabits) * 100)
          : 0;
        const allCompleted = totalHabits > 0 && completedHabits === totalHabits;

        return {
          date: today,
          totalHabits,
          completedHabits,
          completionRate,
          allCompleted,
        };
      },

      /**
       * 获取低属性警告
       * 返回低于阈值的属性列表
       */
      getLowAttributeWarnings: () => {
        const state = get();
        const warnings: Array<{
          attribute: AttributeType;
          value: number;
          level: 'critical' | 'warning' | 'low';
          message: string;
        }> = [];

        const attributeNames = {
          int: '智力/科研',
          vit: '活力/健康',
          mng: '管理/规划',
          cre: '创造/灵感',
        };

        // 定义属性区间
        const thresholds = {
          critical: 30,  // 危险区间：< 30
          warning: 45,   // 警告区间：30-45
          low: 60,       // 偏低区间：45-60
        };

        Object.entries(state.attributes).forEach(([attr, value]) => {
          const attribute = attr as AttributeType;

          if (value < thresholds.critical) {
            warnings.push({
              attribute,
              value,
              level: 'critical',
              message: `${attributeNames[attribute]}严重不足！当前值：${value}，建议立即完成相关任务提升。`,
            });
          } else if (value < thresholds.warning) {
            warnings.push({
              attribute,
              value,
              level: 'warning',
              message: `${attributeNames[attribute]}偏低。当前值：${value}，建议尽快完成相关任务。`,
            });
          } else if (value < thresholds.low) {
            warnings.push({
              attribute,
              value,
              level: 'low',
              message: `${attributeNames[attribute]}略低。当前值：${value}，可以考虑提升。`,
            });
          }
        });

        return warnings;
      },

      /**
       * 重置游戏（保留设置）
       */
      resetGame: () => {
        const currentSettings = get().settings;
        const now = Date.now();

        // 创建初始属性记录
        const initialAttributeRecords = (['int', 'vit', 'mng', 'cre'] as AttributeType[]).map(attr => ({
          id: `initial-${attr}-${now}`,
          attribute: attr,
          amount: 60,
          gainedAt: now,
          reason: '初始属性',
          relatedId: 'initial',
          decayRate: initialState.attributeDecayConfig[attr].decayRate,
          halfLifeDays: initialState.attributeDecayConfig[attr].halfLifeDays,
          currentValue: 60,
          decayedAt: now,
        }));

        set({
          ...initialState,
          attributeRecords: initialAttributeRecords, // 添加初始属性记录
          settings: currentSettings, // 保留用户设置
        });
      },
    }),
    {
      name: 'liferpg-storage', // LocalStorage key
      storage: createJSONStorage(() => createUserStorage()), // 使用用户专属存储
      // 数据迁移：将旧的 attribute 字段转换为 attributes 数组
      onRehydrateStorage: () => (state) => {
        if (state && state.quests) {
          state.quests = state.quests.map((quest: any) => {
            // 如果有旧的 attribute 字段但没有 attributes 数组，进行迁移
            if (quest.attribute && !quest.attributes) {
              return {
                ...quest,
                attributes: [quest.attribute],
              };
            }
            // 如果没有 attributes 字段，设置默认值
            if (!quest.attributes) {
              return {
                ...quest,
                attributes: ['int'],
              };
            }
            return quest;
          });
        }

        // 迁移初始属性记录（修复初始60点不衰减的问题）
        if (state && state.attributeRecords) {
          // 检查是否已有初始属性记录
          const hasInitialRecords = state.attributeRecords.some(
            (r: any) => r.relatedId === 'initial'
          );

          // 如果没有初始记录，且属性值为60（说明是旧数据），则创建初始记录
          if (!hasInitialRecords) {
            const attributes: AttributeType[] = ['int', 'vit', 'mng', 'cre'];
            const now = Date.now();

            attributes.forEach(attr => {
              // 只为值为60的属性创建初始记录（避免影响已经变化的属性）
              if (state.attributes[attr] === 60) {
                const record = {
                  id: `initial-${attr}-${now}`,
                  attribute: attr,
                  amount: 60,
                  gainedAt: now,
                  reason: '初始属性',
                  relatedId: 'initial',
                  decayRate: state.attributeDecayConfig[attr].decayRate,
                  halfLifeDays: state.attributeDecayConfig[attr].halfLifeDays,
                  currentValue: 60,
                  decayedAt: now,
                };
                state.attributeRecords.push(record);
              }
            });
          }
        }

        // 修复旧用户的 maxExp 值（1级应该是150，不是100）
        if (state && state.level === 1 && state.maxExp === 100) {
          state.maxExp = 150;
        }

        // 迁移签到连击数据
        if (state && state.checkIn && state.checkIn.checkInStreak === undefined) {
          // 如果没有 checkInStreak 字段，根据签到历史计算
          const history = state.checkIn.checkInHistory || [];

          if (history.length === 0) {
            state.checkIn.checkInStreak = 0;
          } else {
            // 计算当前连续签到天数
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const lastCheckIn = history[history.length - 1];

            // 如果最后签到不是今天或昨天，连击中断
            if (lastCheckIn !== todayStr && lastCheckIn !== yesterdayStr) {
              state.checkIn.checkInStreak = 0;
            } else {
              // 从后往前遍历，计算连续天数
              let streak = 0;
              for (let i = history.length - 1; i > 0; i--) {
                const currentDate = history[i];
                const prevDate = history[i - 1];
                const current = new Date(currentDate);
                const prev = new Date(prevDate);
                const diffTime = Math.abs(current.getTime() - prev.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                  streak++;
                } else {
                  break;
                }
              }
              state.checkIn.checkInStreak = streak + 1; // +1 包括最后一次签到
            }
          }
        }
      },
    }
  )
);

