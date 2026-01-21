/**
 * ShopPage - 奖励商店页面
 * 使用分类金币购买各种奖励物品
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  REWARD_SHOP,
  REWARD_CATEGORY_NAMES,
  REWARD_CATEGORY_DESC,
  COIN_TYPE_INFO,
  type RewardCategory,
  type CoinType,
} from '@/data/rewards';
import {
  Brain,
  Heart,
  BarChart,
  Lightbulb,
  Coins,
  UtensilsCrossed,
  Gamepad2,
  Bed,
  Palette,
  Film,
  Zap,
  Frame,
  Award,
  Sparkles,
  RefreshCw,
  BookTemplate,
  Dumbbell,
  Bell,
  Download,
  Gift,
  Clover,
  Ticket,
  Star,
  Lock,
  Check,
  AlertCircle,
} from 'lucide-react';

// 图标映射
const ICON_MAP: Record<string, React.ElementType> = {
  Brain,
  Heart,
  BarChart,
  Lightbulb,
  Coins,
  UtensilsCrossed,
  Gamepad2,
  Bed,
  Palette,
  Film,
  Zap,
  Frame,
  Award,
  Sparkles,
  RefreshCw,
  BookTemplate,
  Dumbbell,
  Bell,
  Download,
  Gift,
  Clover,
  Ticket,
};

// 稀有度颜色映射
const RARITY_COLORS = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-orange-500 to-orange-600',
};

const RARITY_TEXT_COLORS = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-orange-400',
};

const RARITY_NAMES = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory | 'all'>('all');
  const {
    categorizedCoins,
    coins,
    achievementPoints,
    level,
    unlockedAchievements,
    purchasedRewards,
    purchaseReward,
    addToInventory,
  } = useGameStore();

  // 筛选物品
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return REWARD_SHOP;
    return REWARD_SHOP.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  // 检查是否可以购买
  const canPurchase = (item: (typeof REWARD_SHOP)[0]): { can: boolean; reason?: string } => {
    // 检查购买次数限制
    if (item.limit) {
      const purchaseCount = purchasedRewards.filter((id) => id === item.id).length;
      if (purchaseCount >= item.limit) {
        return { can: false, reason: `已达购买上限 (${item.limit}次)` };
      }
    }

    // 检查等级要求
    if (item.requireLevel && level < item.requireLevel) {
      return { can: false, reason: `需要等级 ${item.requireLevel}` };
    }

    // 检查成就要求
    if (item.requireAchievements && item.requireAchievements.length > 0) {
      const missingAchievements = item.requireAchievements.filter(
        (achId) => !unlockedAchievements.includes(achId)
      );
      if (missingAchievements.length > 0) {
        return { can: false, reason: '缺少必需成就' };
      }
    }

    // 检查金币
    const { coinType, amount, achievementPoints: requiredPoints } = item.price;

    if (coinType === 'any') {
      // 可以使用任何类型的金币，检查总金币是否足够
      if (coins < amount) {
        return { can: false, reason: `金币不足 (需要 ${amount})` };
      }
    } else {
      // 需要特定类型的金币
      if (categorizedCoins[coinType as CoinType] < amount) {
        const coinInfo = COIN_TYPE_INFO[coinType as CoinType];
        return { can: false, reason: `${coinInfo.name}不足 (需要 ${amount})` };
      }
    }

    // 检查成就点数
    if (requiredPoints && achievementPoints < requiredPoints) {
      return { can: false, reason: `成就点数不足 (需要 ${requiredPoints})` };
    }

    return { can: true };
  };

  // 购买物品
  const handlePurchase = (item: (typeof REWARD_SHOP)[0]) => {
    const check = canPurchase(item);
    if (!check.can) {
      alert(check.reason);
      return;
    }

    const { coinType, amount, achievementPoints: requiredPoints } = item.price;

    // 调用 store 的购买方法
    const success = purchaseReward(
      item.id,
      coinType as any,
      amount,
      requiredPoints
    );

    if (success) {
      // 购买成功，添加物品到背包
      addToInventory({
        rewardId: item.id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        type: item.effect?.permanent ? 'permanent' : (item.isLimitedTime ? 'time_limited' : 'consumable'),
        rarity: item.rarity,
        quantity: 1,
        maxStack: item.limit || 99,
        metadata: {
          effect: item.effect?.type,
          duration: item.effect?.duration,
          category: item.category,
        },
      });

      alert(`✅ 成功购买: ${item.name}！已添加到背包`);
    } else {
      alert('❌ 购买失败，请检查余额！');
    }
  };

  // 获取金币图标组件
  const getCoinIcon = (coinType: CoinType | 'any') => {
    if (coinType === 'any') return Coins;
    const iconName = COIN_TYPE_INFO[coinType as CoinType]?.icon;
    return ICON_MAP[iconName] || Coins;
  };

  return (
    <div className="space-y-6">
      {/* 头部：金币余额 */}
      <div className="glass-card p-6">
        <h1 className="text-3xl font-bold text-white mb-2">奖励商店</h1>
        <p className="text-white/60 mb-6">用努力换取的金币兑换奖励</p>

        {/* 金币余额展示 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 智慧币 */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <Brain className="w-6 h-6" style={{ color: COIN_TYPE_INFO.int.color }} />
            <div>
              <div className="text-xs text-white/60">{COIN_TYPE_INFO.int.name}</div>
              <div className="text-lg font-bold text-white">{categorizedCoins.int}</div>
            </div>
          </div>

          {/* 活力币 */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <Heart className="w-6 h-6" style={{ color: COIN_TYPE_INFO.vit.color }} />
            <div>
              <div className="text-xs text-white/60">{COIN_TYPE_INFO.vit.name}</div>
              <div className="text-lg font-bold text-white">{categorizedCoins.vit}</div>
            </div>
          </div>

          {/* 管理币 */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <BarChart className="w-6 h-6" style={{ color: COIN_TYPE_INFO.mng.color }} />
            <div>
              <div className="text-xs text-white/60">{COIN_TYPE_INFO.mng.name}</div>
              <div className="text-lg font-bold text-white">{categorizedCoins.mng}</div>
            </div>
          </div>

          {/* 创意币 */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <Lightbulb className="w-6 h-6" style={{ color: COIN_TYPE_INFO.cre.color }} />
            <div>
              <div className="text-xs text-white/60">{COIN_TYPE_INFO.cre.name}</div>
              <div className="text-lg font-bold text-white">{categorizedCoins.cre}</div>
            </div>
          </div>

          {/* 通用币 */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <Coins className="w-6 h-6" style={{ color: COIN_TYPE_INFO.universal.color }} />
            <div>
              <div className="text-xs text-white/60">{COIN_TYPE_INFO.universal.name}</div>
              <div className="text-lg font-bold text-white">{categorizedCoins.universal}</div>
            </div>
          </div>

          {/* 成就点数 */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <Star className="w-6 h-6 text-purple-400" fill="currentColor" />
            <div>
              <div className="text-xs text-white/60">成就点数</div>
              <div className="text-lg font-bold text-white">{achievementPoints}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 类别筛选 */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-cyber-purple text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            全部
          </button>
          {Object.entries(REWARD_CATEGORY_NAMES).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as RewardCategory)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === key
                  ? 'bg-cyber-purple text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 物品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || Gift;
          const CoinIcon = getCoinIcon(item.price.coinType);
          const check = canPurchase(item);
          const purchaseCount = purchasedRewards.filter((id) => id === item.id).length;
          const hasLimit = item.limit !== undefined;

          return (
            <div
              key={item.id}
              className={`glass-card p-4 relative overflow-hidden transition-all ${
                !check.can ? 'opacity-60' : 'hover:border-cyber-purple/50'
              }`}
            >
              {/* 稀有度标记 */}
              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${
                  RARITY_COLORS[item.rarity]
                }`}
              >
                {RARITY_NAMES[item.rarity]}
              </div>

              {/* 已购买次数 / 限购次数 */}
              {hasLimit && purchaseCount > 0 && (
                <div className="absolute top-10 right-2 px-2 py-1 rounded text-xs font-bold bg-blue-500/80 text-white">
                  {purchaseCount}/{item.limit}
                </div>
              )}

              {/* 限时/精选标记 */}
              {item.isLimitedTime && (
                <div className={`absolute ${hasLimit && purchaseCount > 0 ? 'top-[4.5rem]' : 'top-10'} right-2 px-2 py-1 rounded text-xs font-bold bg-red-500 text-white`}>
                  限时
                </div>
              )}
              {item.isFeatured && !item.isLimitedTime && (
                <div className={`absolute ${hasLimit && purchaseCount > 0 ? 'top-[4.5rem]' : 'top-10'} right-2 px-2 py-1 rounded text-xs font-bold bg-yellow-500 text-white`}>
                  精选
                </div>
              )}

              {/* 图标 */}
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${RARITY_COLORS[item.rarity]} flex items-center justify-center mb-3`}>
                <Icon className="w-8 h-8 text-white" />
              </div>

              {/* 标题和描述 */}
              <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
              <p className="text-sm text-white/60 mb-4">{item.description}</p>

              {/* 价格 */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <CoinIcon
                    className="w-5 h-5"
                    style={{
                      color:
                        item.price.coinType === 'any'
                          ? '#10b981'
                          : COIN_TYPE_INFO[item.price.coinType as CoinType]?.color,
                    }}
                  />
                  <span className="font-bold text-white">{item.price.amount}</span>
                  <span className="text-xs text-white/60">
                    {item.price.coinType === 'any'
                      ? '任意币'
                      : COIN_TYPE_INFO[item.price.coinType as CoinType]?.name}
                  </span>
                </div>

                {item.price.achievementPoints && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-purple-400" fill="currentColor" />
                    <span className="font-bold text-white">{item.price.achievementPoints}</span>
                    <span className="text-xs text-white/60">点数</span>
                  </div>
                )}
              </div>

              {/* 购买限制提示 */}
              {!check.can && (
                <div className="flex items-center gap-2 p-2 bg-red-500/20 border border-red-500/30 rounded mb-3">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400">{check.reason}</span>
                </div>
              )}

              {/* 购买次数限制 */}
              {item.limit && (
                <div className="text-xs text-white/40 mb-3">
                  限购 {item.limit} 次 (已购买{' '}
                  {purchasedRewards.filter((id) => id === item.id).length} 次)
                </div>
              )}

              {/* 购买按钮 */}
              <button
                onClick={() => handlePurchase(item)}
                disabled={!check.can}
                className={`w-full py-2 rounded-lg font-bold transition-all ${
                  check.can
                    ? 'bg-cyber-purple hover:bg-cyber-purple/80 text-white'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {check.can ? (
                  '购买'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    无法购买
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredItems.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Gift className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">该类别暂无物品</p>
        </div>
      )}
    </div>
  );
}
