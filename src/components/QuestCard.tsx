/**
 * QuestCard - 任务卡片组件
 *
 * 显示单个任务的信息，支持完成和删除操作
 * 特性:
 * - 全息投影板样式
 * - 完成时的粒子爆炸动画
 * - 根据任务类型显示不同样式
 * - 集成任务操作菜单
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Target, Star, Calendar, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import type { Quest, QuestType } from '@/types/game';
import { QuestStatus } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import TaskActionMenu from './TaskActionMenu';
import TaskDetailModal from './TaskDetailModal';

interface QuestCardProps {
  quest: Quest;
  onEdit?: () => void;
}

// 任务类型配置
const QUEST_STYLES = {
  main: {
    icon: Target,
    color: 'from-cyber-purple to-purple-600',
    borderColor: 'border-cyber-purple',
    bgColor: 'bg-purple-500/10',
  },
  side: {
    icon: Star,
    color: 'from-cyber-cyan to-blue-600',
    borderColor: 'border-cyber-cyan',
    bgColor: 'bg-cyan-500/10',
  },
  daily: {
    icon: Calendar,
    color: 'from-cyber-green to-green-600',
    borderColor: 'border-cyber-green',
    bgColor: 'bg-green-500/10',
  },
};

// 属性对应颜色
const ATTRIBUTE_COLORS = {
  int: 'text-cyber-cyan',
  vit: 'text-cyber-green',
  mng: 'text-cyber-purple',
  cre: 'text-cyber-red',
};

const ATTRIBUTE_NAMES = {
  int: 'INT (智力)',
  vit: 'VIT (活力)',
  mng: 'MNG (管理)',
  cre: 'CRE (创造)',
};

export default function QuestCard({ quest, onEdit }: QuestCardProps) {
  const style = QUEST_STYLES[quest.type as keyof typeof QUEST_STYLES];
  const Icon = style.icon;
  const getChildQuests = useGameStore((state) => state.getChildQuests);
  const completeQuest = useGameStore((state) => state.completeQuest);
  const uncompleteQuest = useGameStore((state) => state.uncompleteQuest);

  const isCompleted = quest.status === QuestStatus.COMPLETED;
  const isFailed = quest.status === QuestStatus.FAILED;
  const isChildQuest = !!quest.parentId;
  const childQuests = getChildQuests(quest.id);
  const hasChildren = childQuests.length > 0;

  // 任务详情模态框状态
  const [showDetail, setShowDetail] = useState(false);

  // 切换完成状态
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡，避免打开详情
    if (isCompleted) {
      uncompleteQuest(quest.id);
    } else if (!isFailed) {
      completeQuest(quest.id);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.02, y: -2 }}
        onClick={() => setShowDetail(true)}
        className={`relative p-4 rounded-xl border-2 ${style.borderColor} ${style.bgColor} backdrop-blur-sm transition-all group cursor-pointer ${
          isCompleted ? 'opacity-60' : isFailed ? 'opacity-40' : ''
        }`}
      >
      {/* 发光效果 */}
      <div className={`absolute inset-0 bg-gradient-to-r ${style.color} opacity-0 group-hover:opacity-20 rounded-xl transition-opacity`} />

      <div className="relative space-y-3">
        {/* 顶部信息栏 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* 完成标记圈圈 - 只在非失败状态下显示 */}
            {!isFailed && (
              <button
                onClick={handleToggleComplete}
                className={`flex-shrink-0 transition-all ${
                  isCompleted
                    ? 'text-green-400 scale-110'
                    : 'text-white/40 hover:text-white/60 hover:scale-110'
                }`}
                title={isCompleted ? '点击取消完成' : '点击完成任务'}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
            )}

            {/* 任务图标/类型图标 */}
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center text-xl leading-none`}>
              {quest.icon ? (
                <span>{quest.icon}</span>
              ) : (
                <Icon className="w-5 h-5 text-white" />
              )}
            </div>

            {/* 任务标题 */}
            <div>
              <div className="flex items-center gap-2">
                {/* 子任务标识 */}
                {isChildQuest && (
                  <span className="text-xs text-gray-500 dark:text-white/50" title="子任务">
                    ├─
                  </span>
                )}

                <h4 className={`font-bold font-inter ${
                  isCompleted ? 'text-gray-400 dark:text-white/40 line-through' : isFailed ? 'text-gray-500 dark:text-white/30 line-through' : 'text-gray-900 dark:text-white'
                }`}>
                  {quest.title}
                </h4>

                {/* 子任务数量徽章 */}
                {hasChildren && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono" title={`${childQuests.filter(c => c.status === QuestStatus.COMPLETED).length}/${childQuests.length} 子任务已完成`}>
                    {childQuests.filter(c => c.status === QuestStatus.COMPLETED).length}/{childQuests.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 dark:text-white/70 font-mono uppercase">
                  {quest.type === 'main' ? 'Main Quest' : quest.type === 'side' ? 'Side Quest' : 'Daily'}
                </p>
                {isCompleted && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                    ✓ 已完成
                  </span>
                )}
                {isFailed && (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                    ✗ 已放弃
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 操作菜单 */}
          <div onClick={(e) => e.stopPropagation()}>
            <TaskActionMenu quest={quest} onEdit={onEdit} />
          </div>
        </div>

        {/* 任务描述 */}
        {quest.description && (
          <p className="text-sm text-gray-700 dark:text-white/70 font-inter leading-relaxed">
            {quest.description}
          </p>
        )}

        {/* 奖励信息 */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/10">
          {/* 经验值 */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-mono font-bold text-yellow-400">
              +{quest.expReward} EXP
            </span>
          </div>

          {/* 金币 */}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-yellow-400" />
            <span className="text-sm font-mono font-bold text-yellow-400">
              +{quest.coinReward}
            </span>
          </div>

          {/* 属性 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(quest.attributes || []).map((attr) => (
              <div key={attr} className={`text-sm font-bold font-mono ${ATTRIBUTE_COLORS[attr]}`}>
                {ATTRIBUTE_NAMES[attr]}
              </div>
            ))}
          </div>

          {/* 子任务进度 */}
          {quest.subtasks && quest.subtasks.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-mono font-bold text-green-400">
                {quest.subtasks.filter(st => st.completed).length}/{quest.subtasks.length}
              </span>
            </div>
          )}
        </div>

        {/* 进度条 */}
        {quest.progress !== undefined && !isCompleted && !isFailed && (
          <div>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/60 mb-1">
              <span>进度</span>
              <span>{quest.progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                style={{ width: `${quest.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>

    {/* 任务详情模态框 */}
    <TaskDetailModal
      quest={quest}
      isOpen={showDetail}
      onClose={() => setShowDetail(false)}
      onEdit={() => {
        setShowDetail(false);
        onEdit?.();
      }}
    />
    </>
  );
}
