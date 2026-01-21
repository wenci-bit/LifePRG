/**
 * HUD - 仪表盘组件
 *
 * 显示玩家的核心信息：等级、经验值、金币
 * 类似游戏中的 HUD (Heads-Up Display)
 */

'use client';

import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Sparkles, Coins, Zap } from 'lucide-react';

export default function HUD() {
  const { level, currentExp, maxExp, coins } = useGameStore((state) => ({
    level: state.level,
    currentExp: state.currentExp,
    maxExp: state.maxExp,
    coins: state.coins,
  }));

  const expPercentage = (currentExp / maxExp) * 100;

  return (
    <div className="glass-card p-6 space-y-6">
      {/* 等级显示 */}
      <div className="text-center">
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-purple border-4 border-white/20 shadow-2xl"
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <div>
            <p className="text-xs text-white/60 font-inter">LEVEL</p>
            <p className="text-4xl font-black font-orbitron text-white">
              {level}
            </p>
          </div>
        </motion.div>
      </div>

      {/* 经验值进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/70 font-inter flex items-center gap-1">
            <Zap className="w-4 h-4 text-cyber-cyan" />
            EXP
          </span>
          <span className="text-white font-mono font-bold">
            {currentExp} / {maxExp}
          </span>
        </div>

        {/* 进度条容器 */}
        <div className="relative h-6 bg-white/10 rounded-full overflow-hidden border border-white/20">
          {/* 进度条填充 */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyber-cyan to-cyber-purple"
            initial={{ width: 0 }}
            animate={{ width: `${expPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* 流光效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>

          {/* 百分比文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Math.floor(expPercentage)}%
            </span>
          </div>
        </div>
      </div>

      {/* 金币显示 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-white/60 font-inter">GOLD</p>
            <p className="text-2xl font-black font-mono text-yellow-400">
              {coins}
            </p>
          </div>
        </div>
        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <StatItem label="完成任务" value={useGameStore.getState().stats.totalQuestsCompleted} />
        <StatItem label="专注时长" value={`${useGameStore.getState().stats.totalFocusTime}min`} />
      </div>
    </div>
  );
}

/**
 * 统计项组件
 */
function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center p-3 bg-white/5 rounded-lg">
      <p className="text-xs text-white/50 font-inter mb-1">{label}</p>
      <p className="text-lg font-bold font-mono text-cyber-cyan">{value}</p>
    </div>
  );
}
