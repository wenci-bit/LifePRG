/**
 * AchievementsPage - 复杂成就系统页面
 *
 * 支持成就链、系列、稀有度、前置要求等
 */

'use client';

import { motion } from 'framer-motion';
import { Trophy, Lock, Check, Zap, Star, Shield, Link, Gem } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { ACHIEVEMENTS, TIER_COLORS, SERIES_INFO, RARITY_COLORS } from '@/data/achievements';
import type { AchievementTier, AchievementSeries } from '@/data/achievements';

export default function AchievementsPage() {
  const { level, coins, stats, attributes, unlockedAchievements, achievementPoints } = useGameStore((state) => ({
    level: state.level,
    coins: state.coins,
    stats: state.stats,
    attributes: state.attributes,
    unlockedAchievements: state.unlockedAchievements,
    achievementPoints: state.achievementPoints,
  }));

  // 计算成就进度
  const achievementsWithProgress = ACHIEVEMENTS.map((achievement) => {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    let current = 0;
    let canUnlock = true; // 是否可以解锁（前置成就已满足）

    // 检查前置成就
    if (achievement.prerequisites && achievement.prerequisites.length > 0) {
      canUnlock = achievement.prerequisites.every(prereqId =>
        unlockedAchievements.includes(prereqId)
      );
    }

    // 计算当前进度
    switch (achievement.category) {
      case 'milestone':
        if (achievement.id.startsWith('explorer_')) {
          current = level;
        } else if (achievement.id === 'first_step') {
          current = stats.totalQuestsCompleted;
        }
        break;
      case 'quest':
        current = stats.totalQuestsCompleted;
        break;
      case 'streak':
        current = stats.currentStreak;
        break;
      case 'attribute':
        if (achievement.id.startsWith('int_master') || achievement.id === 'int_master_i') {
          current = attributes.int;
        } else if (achievement.id.startsWith('vit_master') || achievement.id === 'vit_master_i') {
          current = attributes.vit;
        } else if (achievement.id.startsWith('mng_master') || achievement.id === 'mng_master_i') {
          current = attributes.mng;
        } else if (achievement.id.startsWith('cre_master') || achievement.id === 'cre_master_i') {
          current = attributes.cre;
        } else if (achievement.id === 'guardian_initiate') {
          current = Math.max(...Object.values(attributes));
        }
        break;
      case 'special':
        if (achievement.id.startsWith('legendary_wealthy')) {
          current = coins;
        } else if (achievement.comboRequirement?.attributes) {
          current = Math.min(...Object.values(attributes));
        }
        break;
      case 'hidden':
        if (achievement.id === 'collector') {
          current = unlockedAchievements.length;
        } else {
          current = isUnlocked ? achievement.requirement : 0;
        }
        break;
    }

    const progress = Math.min((current / achievement.requirement) * 100, 100);

    return {
      ...achievement,
      current,
      isUnlocked,
      canUnlock,
      progress,
    };
  });

  // 按系列分组
  const achievementsBySeries: Record<AchievementSeries, typeof achievementsWithProgress> = {
    scholar: [],
    warrior: [],
    explorer: [],
    legendary: [],
    merchant: [],
    timemaster: [],
    collector: [],
    perfectionist: [],
    digitartist: [],
    extreme: [],
    habit: [],
    event: [],
    speed: [],
    none: [],
  };

  achievementsWithProgress.forEach(achievement => {
    const series = achievement.series || 'none';
    achievementsBySeries[series].push(achievement);
  });

  const unlockedCount = achievementsWithProgress.filter((a) => a.isUnlocked).length;
  const totalCount = achievementsWithProgress.filter(a => !a.hidden).length;

  return (
    <div className="space-y-8">
      {/* 头部统计 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-purple mb-2">
              成就系统
            </h1>
            <p className="text-white/60 font-inter">
              完成成就链，解锁强大奖励
            </p>
          </div>

          <div className="flex items-center gap-8">
            {/* 成就点数 */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gem className="w-6 h-6 text-purple-400" />
                <div className="text-4xl font-black font-orbitron text-purple-400">
                  {achievementPoints}
                </div>
              </div>
              <p className="text-sm text-white/60 font-inter">
                成就点数
              </p>
            </div>

            {/* 解锁数量 */}
            <div className="text-center">
              <div className="text-4xl font-black font-orbitron text-white mb-2">
                {unlockedCount}/{totalCount}
              </div>
              <p className="text-sm text-white/60 font-inter">
                已解锁成就
              </p>
            </div>
          </div>
        </div>

        {/* 总进度条 */}
        <div>
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>总体进度</span>
            <span>{Math.floor((unlockedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-green"
            />
          </div>
        </div>

        {/* 系列统计 */}
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4 mt-6">
          {(['scholar', 'warrior', 'explorer', 'legendary', 'merchant', 'timemaster', 'collector', 'perfectionist', 'digitartist', 'extreme', 'habit', 'event', 'speed'] as AchievementSeries[]).map((series) => {
            const seriesAchievements = achievementsBySeries[series];
            const seriesUnlocked = seriesAchievements.filter(a => a.isUnlocked).length;
            const seriesInfo = SERIES_INFO[series];

            return (
              <div key={series} className="text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${seriesInfo.color.from}, ${seriesInfo.color.to})`,
                  }}
                >
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-bold mb-1" style={{ color: seriesInfo.color.from }}>
                  {seriesInfo.name}
                </p>
                <p className="text-sm text-white/70 font-mono">
                  {seriesUnlocked}/{seriesAchievements.length}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 按系列显示成就 */}
      {(['scholar', 'warrior', 'guardian', 'explorer', 'master', 'legendary', 'merchant', 'timemaster', 'collector', 'perfectionist', 'digitartist', 'extreme', 'habit', 'event', 'speed'] as AchievementSeries[]).map((series) => {
        const achievements = achievementsBySeries[series];
        if (achievements.length === 0) return null;

        const seriesInfo = SERIES_INFO[series];

        return (
          <div key={series} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${seriesInfo.color.from}, ${seriesInfo.color.to})`,
                }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-orbitron text-white">
                  {seriesInfo.name}
                </h2>
                <p className="text-sm text-white/60 font-inter">
                  {seriesInfo.description} ({achievements.filter(a => a.isUnlocked).length}/{achievements.length})
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  delay={index * 0.05}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* 独立成就（包括隐藏） */}
      {achievementsBySeries.none.length > 0 && (
        <div className="space-y-4">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold font-orbitron text-white flex items-center gap-3"
          >
            <Star className="w-6 h-6 text-yellow-400" />
            隐藏成就
            <span className="text-sm text-white/40 font-inter">
              ({achievementsBySeries.none.filter(a => a.isUnlocked).length}/{achievementsBySeries.none.length})
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievementsBySeries.none.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                delay={index * 0.05}
              />
            ))}
          </div>
        </div>
      )}

      {/* 提示文字 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-8"
      >
        <p className="text-white/40 text-sm font-inter">
          完成成就链，获得丰厚的成就点数奖励！
        </p>
        <p className="text-white/30 text-xs font-inter mt-2">
          灰色边框表示前置成就未完成，暂时无法解锁
        </p>
      </motion.div>
    </div>
  );
}

/**
 * 成就卡片组件
 */
function AchievementCard({ achievement, delay }: { achievement: any; delay: number }) {
  const tierColors = TIER_COLORS[achievement.tier as AchievementTier];
  const rarityColors = achievement.rarity ? RARITY_COLORS[achievement.rarity as 'common' | 'rare' | 'epic' | 'legendary'] : null;
  const isHidden = achievement.hidden && !achievement.isUnlocked;
  const isLocked = !achievement.canUnlock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className={`glass-card p-6 relative overflow-hidden border-2 ${
        achievement.isUnlocked ? '' : isLocked ? 'opacity-50' : 'opacity-70'
      }`}
      style={{
        borderColor: achievement.isUnlocked
          ? tierColors.from
          : isLocked
          ? 'rgba(100, 116, 139, 0.3)'
          : 'rgba(255,255,255,0.1)',
        boxShadow: achievement.isUnlocked ? `0 0 20px ${tierColors.glow}` : 'none',
      }}
    >
      {/* 顶部徽章 */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
        {/* 稀有度标记 */}
        {rarityColors && (
          <div
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
            style={{
              background: `linear-gradient(135deg, ${rarityColors.from}, ${rarityColors.to})`,
              color: 'white'
            }}
          >
            <Gem className="w-3 h-3" />
            {rarityColors.name}
          </div>
        )}

        {/* 等级 + 状态 */}
        <div className="flex items-center gap-2">
          <div
            className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${tierColors.from}, ${tierColors.to})`,
              color: 'white'
            }}
          >
            {achievement.tier}
          </div>
          {achievement.isUnlocked ? (
            <div className="w-6 h-6 rounded-full bg-cyber-green/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-cyber-green" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <Lock className="w-3 h-3 text-white/40" />
            </div>
          )}
        </div>
      </div>

      {/* 进阶等级标记 */}
      {achievement.isProgression && achievement.progressionLevel && (
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-lg">
            <Link className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-bold text-purple-400">
              Lv.{achievement.progressionLevel}
            </span>
          </div>
        </div>
      )}

      {/* 标题和描述 */}
      <div className={`mb-4 ${achievement.isProgression ? 'mt-6' : ''}`}>
        <h3 className="text-lg font-bold font-orbitron text-white mb-1">
          {isHidden ? '???' : achievement.title}
        </h3>
        <p className="text-sm text-white/60 font-inter">
          {isHidden ? '完成特定条件解锁' : achievement.description}
        </p>

        {/* 前置成就提示 */}
        {achievement.prerequisites && achievement.prerequisites.length > 0 && !achievement.isUnlocked && (
          <div className="mt-2 p-2 bg-orange-500/10 rounded-lg flex items-start gap-2">
            <Lock className="w-4 h-4 text-orange-400 mt-0.5" />
            <div className="text-xs text-orange-400">
              需要先完成前置成就
            </div>
          </div>
        )}
      </div>

      {/* 奖励信息 */}
      {!isHidden && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-white/5 rounded-lg">
          <div className="flex items-center gap-1 text-xs">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 font-bold">+{achievement.reward.exp}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-yellow-400 font-bold">+{achievement.reward.coins}</span>
          </div>
          {achievement.reward.points && (
            <div className="flex items-center gap-1 text-xs">
              <Gem className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400 font-bold">+{achievement.reward.points}</span>
            </div>
          )}
          {achievement.reward.title && (
            <div className="text-xs text-cyan-400 font-bold">
              "{achievement.reward.title}"
            </div>
          )}
        </div>
      )}

      {/* 进度条 */}
      {!isHidden && achievement.canUnlock && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/50 font-mono">
            <span>进度</span>
            <span>
              {achievement.current} / {achievement.requirement}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${achievement.progress}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2 }}
              className="h-full"
              style={{
                background: `linear-gradient(90deg, ${tierColors.from}, ${tierColors.to})`
              }}
            />
          </div>
        </div>
      )}

      {/* 锁定遮罩 */}
      {!achievement.isUnlocked && isLocked && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none" />
      )}

      {/* 未解锁遮罩 */}
      {!achievement.isUnlocked && !isLocked && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px] pointer-events-none" />
      )}
    </motion.div>
  );
}
