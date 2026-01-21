/**
 * CheckInNotification - 签到成功通知
 *
 * 全屏签到奖励动画
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Gift, Coins, Zap, Sparkles, Award } from 'lucide-react';

interface Props {
  show: boolean;
  day: number;
  rewards: {
    exp: number;
    coins: number;
    categorizedCoins?: {
      int?: number;
      vit?: number;
      mng?: number;
      cre?: number;
    };
    bonusMessage?: string;
  };
  onClose: () => void;
}

export default function CheckInNotification({ show, day, rewards, onClose }: Props) {
  const isSpecialDay = rewards.bonusMessage !== undefined;

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
          {/* 背景粒子效果 */}
          {isSpecialDay && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
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
                      color: ['#ffd700', '#ff6b6b', '#4ecdc4', '#a78bfa'][Math.floor(Math.random() * 4)]
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* 主内容 */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: -50 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="relative z-10 text-center px-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 主卡片 */}
            <div className="glass-card p-10 max-w-md">
              {/* 图标 */}
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl"
              >
                <Calendar className="w-12 h-12 text-white" />
              </motion.div>

              {/* 标题 */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-black font-orbitron text-white mb-2"
              >
                签到成功！
              </motion.h2>

              {/* 连续天数 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <p className="text-white/70 font-inter mb-2">连续签到</p>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <span className="text-5xl font-black font-mono text-white">{day}</span>
                  <span className="text-2xl font-bold text-white ml-2">天</span>
                </div>
              </motion.div>

              {/* 特殊奖励消息 */}
              {isSpecialDay && rewards.bonusMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-xl"
                >
                  <Award className="w-6 h-6 text-yellow-400 inline-block mr-2" />
                  <span className="text-lg font-bold text-yellow-300 font-inter">
                    {rewards.bonusMessage}
                  </span>
                </motion.div>
              )}

              {/* 奖励详情 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 mb-6"
              >
                <h3 className="text-lg font-bold text-white/80 font-inter mb-4">
                  获得奖励
                </h3>

                {/* 经验值 */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyber-cyan" />
                    <span className="text-white font-inter">经验值</span>
                  </div>
                  <span className="text-xl font-bold text-cyber-cyan font-mono">
                    +{rewards.exp}
                  </span>
                </div>

                {/* 金币 */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-inter">通用金币</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-400 font-mono">
                    +{rewards.coins}
                  </span>
                </div>

                {/* 分类金币奖励 */}
                {rewards.categorizedCoins && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {rewards.categorizedCoins.int && rewards.categorizedCoins.int > 0 && (
                      <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                        <span className="text-sm text-blue-300 font-inter">智慧币</span>
                        <span className="text-sm font-bold text-blue-400 font-mono">
                          +{rewards.categorizedCoins.int}
                        </span>
                      </div>
                    )}
                    {rewards.categorizedCoins.vit && rewards.categorizedCoins.vit > 0 && (
                      <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                        <span className="text-sm text-green-300 font-inter">活力币</span>
                        <span className="text-sm font-bold text-green-400 font-mono">
                          +{rewards.categorizedCoins.vit}
                        </span>
                      </div>
                    )}
                    {rewards.categorizedCoins.mng && rewards.categorizedCoins.mng > 0 && (
                      <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
                        <span className="text-sm text-purple-300 font-inter">管理币</span>
                        <span className="text-sm font-bold text-purple-400 font-mono">
                          +{rewards.categorizedCoins.mng}
                        </span>
                      </div>
                    )}
                    {rewards.categorizedCoins.cre && rewards.categorizedCoins.cre > 0 && (
                      <div className="flex items-center justify-between p-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                        <span className="text-sm text-orange-300 font-inter">创意币</span>
                        <span className="text-sm font-bold text-orange-400 font-mono">
                          +{rewards.categorizedCoins.cre}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* 关闭按钮 */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold font-inter hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                继续加油！
              </motion.button>

              {/* 提示文本 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/40 text-sm mt-4 font-inter"
              >
                点击任意位置关闭
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
