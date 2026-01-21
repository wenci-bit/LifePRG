/**
 * AvatarFrameSelector - 头像框选择器组件
 * 让用户选择不同风格的头像框
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check, Sparkles } from 'lucide-react';
import {
  AVATAR_FRAMES,
  FRAME_CATEGORIES,
  getFramesByRarity,
  isFrameUnlocked,
  getUnlockDescription,
} from '@/data/avatarFrames';
import { useGameStore } from '@/store/gameStore';
import AvatarDisplay from './AvatarDisplay';
import type { UserAvatar } from '@/types/game';

interface AvatarFrameSelectorProps {
  currentFrame?: string;
  currentAvatar?: UserAvatar;
  onSelect: (frameId: string) => void;
  onClose: () => void;
}

export default function AvatarFrameSelector({
  currentFrame,
  currentAvatar,
  onSelect,
  onClose,
}: AvatarFrameSelectorProps) {
  const [selectedRarity, setSelectedRarity] = useState('all');

  // 获取用户数据用于检查解锁条件
  const level = useGameStore((state) => state.level);
  const totalQuests = useGameStore((state) => state.stats.totalQuestsCompleted);
  const totalCoins = useGameStore((state) => state.coins);

  // 处理头像框选择
  const handleFrameSelect = (frameId: string) => {
    onSelect(frameId);
    onClose();
  };

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-500 to-gray-600';
      case 'rare':
        return 'from-blue-500 to-cyan-500';
      case 'epic':
        return 'from-purple-500 to-pink-500';
      case 'legendary':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-cyber-cyan" />
            <h2 className="text-2xl font-bold text-white">选择头像框</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 当前预览 */}
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/70 text-sm mb-3 text-center">当前效果预览</p>
          <div className="flex justify-center">
            <AvatarDisplay
              avatar={currentAvatar}
              frameId={currentFrame}
              size="xl"
              showBorder={true}
            />
          </div>
        </div>

        {/* 稀有度筛选 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {FRAME_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedRarity(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedRarity === category.id
                  ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <span>{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>

        {/* 头像框网格 */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {getFramesByRarity(selectedRarity).map((frame) => {
              const unlocked = isFrameUnlocked(frame, level, totalQuests, totalCoins);
              const isSelected = currentFrame === frame.id;

              return (
                <motion.div
                  key={frame.id}
                  whileHover={{ scale: unlocked ? 1.05 : 1 }}
                  whileTap={{ scale: unlocked ? 0.95 : 1 }}
                  onClick={() => unlocked && handleFrameSelect(frame.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-cyber-cyan bg-cyber-cyan/10'
                      : unlocked
                      ? 'border-white/20 hover:border-white/40 bg-white/5 cursor-pointer'
                      : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* 头像预览 */}
                  <div className="flex justify-center mb-3">
                    <AvatarDisplay
                      avatar={currentAvatar}
                      frameId={frame.id}
                      size="lg"
                      showBorder={true}
                    />
                  </div>

                  {/* 框名称 */}
                  <div className="text-center">
                    <p className="text-white font-medium text-sm mb-1 line-clamp-1">
                      {frame.name}
                    </p>
                    <p className="text-white/50 text-xs line-clamp-2 mb-2">
                      {frame.description}
                    </p>

                    {/* 稀有度徽章 */}
                    <div className="flex justify-center mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r ${getRarityColor(
                          frame.rarity
                        )} text-white`}
                      >
                        {frame.rarity === 'common' && '普通'}
                        {frame.rarity === 'rare' && '稀有'}
                        {frame.rarity === 'epic' && '史诗'}
                        {frame.rarity === 'legendary' && '传说'}
                      </span>
                    </div>

                    {/* 解锁状态 */}
                    {!unlocked ? (
                      <div className="flex items-center justify-center gap-1 text-red-400 text-xs">
                        <Lock className="w-3 h-3" />
                        <span>{getUnlockDescription(frame)}</span>
                      </div>
                    ) : (
                      <div className="text-green-400 text-xs">
                        {getUnlockDescription(frame)}
                      </div>
                    )}
                  </div>

                  {/* 选中标记 */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-cyber-cyan rounded-full flex items-center justify-center shadow-lg shadow-cyber-cyan/50"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}

                  {/* 锁定遮罩 */}
                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white/50" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <p className="text-cyan-300 text-sm">
            💡 提示：通过提升等级、完成任务和积累金币来解锁更多头像框
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
