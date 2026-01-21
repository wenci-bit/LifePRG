/**
 * AchievementNotification - 成就解锁通知
 *
 * 显示成就解锁的炫酷动画
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles } from 'lucide-react';
import { TIER_COLORS } from '@/data/achievements';
import type { AchievementTier } from '@/data/achievements';

interface Achievement {
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
}

interface Props {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementNotification({ achievement, onClose }: Props) {
  if (!achievement) return null;

  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: -100 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="fixed top-24 right-6 z-[100] w-96"
      >
        <div className="relative overflow-hidden rounded-2xl p-6 glass-card border-2"
          style={{
            borderColor: tierColor.from,
            boxShadow: `0 0 30px ${tierColor.glow}, 0 0 60px ${tierColor.glow}`
          }}
        >
          {/* 背景光效 */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${tierColor.from}, ${tierColor.to})`
            }}
          />

          {/* 粒子特效 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 0
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.5,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>

          {/* 内容 */}
          <div className="relative z-10">
            {/* 头部 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 1, repeat: Infinity }
                  }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${tierColor.from}, ${tierColor.to})`
                  }}
                >
                  <Star className="w-6 h-6 text-white" fill="white" />
                </motion.div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                    成就解锁
                  </p>
                  <h3 className="text-xl font-black font-orbitron"
                    style={{ color: tierColor.from }}
                  >
                    {achievement.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 描述 */}
            <p className="text-sm text-white/70 mb-4 font-inter">
              {achievement.description}
            </p>

            {/* 奖励 */}
            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">
                  +{achievement.reward.exp} EXP
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">
                  +{achievement.reward.coins} 金币
                </span>
              </div>

              {achievement.reward.points && achievement.reward.points > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" fill="currentColor" />
                  <span className="text-sm font-bold text-purple-400">
                    +{achievement.reward.points} 点数
                  </span>
                </div>
              )}

              {achievement.reward.title && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-cyan-400">
                    称号：{achievement.reward.title}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
