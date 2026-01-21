/**
 * LevelUpNotification - 升级通知特效
 *
 * 全屏升级动画
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Award, ArrowUp, Sparkles } from 'lucide-react';
import { getLevelTitle } from '@/data/levels';

interface Props {
  show: boolean;
  level: number;
  rewards: {
    coins: number;
    unlocks?: string[];
  };
  onClose: () => void;
}

export default function LevelUpNotification({ show, level, rewards, onClose }: Props) {
  const title = getLevelTitle(level);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* 背景粒子 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 0
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  repeat: Infinity,
                }}
              >
                <Sparkles
                  className="w-6 h-6"
                  style={{
                    color: ['#00f3ff', '#bc13fe', '#ffd700', '#00ff00'][Math.floor(Math.random() * 4)]
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* 主内容 */}
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, rotate: 10 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="relative z-10 text-center px-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 图标 */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                scale: { duration: 1, repeat: Infinity }
              }}
              className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-cyber-cyan via-cyber-purple to-cyber-green flex items-center justify-center"
              style={{
                boxShadow: '0 0 60px rgba(0, 243, 255, 0.8), 0 0 120px rgba(188, 19, 254, 0.6)'
              }}
            >
              <Zap className="w-16 h-16 text-white" fill="white" />
            </motion.div>

            {/* 文字 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-2xl font-bold text-cyan-400 mb-4 tracking-widest">
                LEVEL UP!
              </p>

              <h1 className="text-8xl font-black font-orbitron mb-6"
                style={{
                  background: 'linear-gradient(90deg, #00f3ff, #bc13fe, #ffd700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 30px rgba(0, 243, 255, 0.8))'
                }}
              >
                {level}
              </h1>

              <div className="flex items-center justify-center gap-3 mb-8">
                <Star className="w-6 h-6 text-yellow-400" fill="yellow" />
                <p className="text-3xl font-bold text-white">
                  {title}
                </p>
                <Star className="w-6 h-6 text-yellow-400" fill="yellow" />
              </div>
            </motion.div>

            {/* 奖励 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 max-w-md mx-auto"
            >
              <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center justify-center gap-2">
                <Award className="w-6 h-6" />
                升级奖励
              </h3>

              <div className="space-y-3">
                {/* 金币奖励 */}
                {rewards.coins > 0 && (
                  <div className="flex items-center justify-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-yellow-400" />
                    <span className="text-lg font-bold text-yellow-400">
                      +{rewards.coins} 金币
                    </span>
                  </div>
                )}

                {/* 解锁内容 */}
                {rewards.unlocks && rewards.unlocks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-purple-400 flex items-center justify-center gap-2">
                      <ArrowUp className="w-4 h-4" />
                      解锁新功能
                    </p>
                    {rewards.unlocks.map((unlock, i) => (
                      <div key={i} className="p-2 bg-purple-500/10 rounded text-sm text-white/80">
                        {unlock}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* 提示 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-white/40 text-sm"
            >
              点击任意位置继续
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
