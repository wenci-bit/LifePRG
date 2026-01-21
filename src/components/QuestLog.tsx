/**
 * QuestLog - 任务日志组件
 *
 * 显示所有任务列表，并提供添加新任务的表单
 * 特性:
 * - 任务分类显示（Main/Side/Daily）
 * - 标签页切换（活动/已完成/已放弃）
 * - 任务操作菜单
 * - 动画列表
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Scroll, CheckCircle2, XCircle, Tag, Timer, Clock, TrendingUp, Zap, Coffee, Circle, Coins } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import QuestFormModal from './QuestFormModal';
import TaskActionMenu from './TaskActionMenu';
import TaskDetailModal from './TaskDetailModal';
import { QuestType, QuestStatus, type Quest } from '@/types/game';
import PomodoroTimer from './PomodoroTimer';
import FocusHistoryPanel from './FocusHistoryPanel';
import { useThemeStore } from '@/store/themeStore';

type TabType = 'active' | 'completed' | 'failed';

export default function QuestLog() {
  const allQuests = useGameStore((state) => state.quests);
  const stats = useGameStore((state) => state.stats);
  const focusSessions = useGameStore((state) => state.focusSessions);
  const theme = useThemeStore((state) => state.theme);
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  // 番茄钟状态
  const [pomodoroTimers, setPomodoroTimers] = useState<string[]>([]);
  const [showFocusHistory, setShowFocusHistory] = useState(false);

  // 创建新的番茄钟
  const createNewPomodoro = () => {
    const newId = Date.now().toString();
    setPomodoroTimers(prev => [...prev, newId]);
  };

  // 关闭指定的番茄钟
  const closePomodoro = (id: string) => {
    setPomodoroTimers(prev => prev.filter(timerId => timerId !== id));
  };

  // 按状态筛选任务（只显示父任务）
  const quests = useMemo(() => {
    const filtered = allQuests.filter((q) => {
      if (activeTab === 'active') return q.status === QuestStatus.ACTIVE;
      if (activeTab === 'completed') return q.status === QuestStatus.COMPLETED;
      if (activeTab === 'failed') return q.status === QuestStatus.FAILED;
      return false;
    });

    // 只返回父任务（没有 parentId 的任务）
    return filtered.filter(q => !q.parentId);
  }, [allQuests, activeTab]);

  return (
    <div className="space-y-6">
      {/* 任务日志卡片 */}
      <div className="glass-card p-6 space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scroll className="w-6 h-6 text-cyber-cyan" />
          <h2 className="text-2xl font-bold font-orbitron text-gray-900 dark:text-white">
            QUEST LOG
          </h2>
        </div>

        {/* 添加按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQuestForm(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white font-bold font-inter flex items-center gap-2 hover:shadow-lg hover:shadow-cyber-cyan/50 transition-shadow"
        >
          <Plus className="w-5 h-5" />
          新建任务
        </motion.button>
      </div>

      {/* 任务创建/编辑表单模态框 */}
      <QuestFormModal
        isOpen={showQuestForm || editingQuest !== null}
        onClose={() => {
          setShowQuestForm(false);
          setEditingQuest(null);
        }}
        editQuest={editingQuest}
      />

      {/* 标签页 */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <TabButton
          active={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
          icon={<Scroll className="w-4 h-4" />}
          label="活动任务"
          count={allQuests.filter(q => q.status === QuestStatus.ACTIVE).length}
        />
        <TabButton
          active={activeTab === 'completed'}
          onClick={() => setActiveTab('completed')}
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="已完成"
          count={allQuests.filter(q => q.status === QuestStatus.COMPLETED).length}
          color="text-green-400"
        />
        <TabButton
          active={activeTab === 'failed'}
          onClick={() => setActiveTab('failed')}
          icon={<XCircle className="w-4 h-4" />}
          label="已放弃"
          count={allQuests.filter(q => q.status === QuestStatus.FAILED).length}
          color="text-red-400"
        />
      </div>

      {/* 任务列表 */}
      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 pb-4 custom-scrollbar -m-2 p-2">
        {quests.length > 0 ? (
          quests.map((quest) => (
            <QuestLogTaskCard key={quest.id} quest={quest} onEdit={setEditingQuest} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              {activeTab === 'active' && <Scroll className="w-8 h-8 text-gray-300 dark:text-white/30" />}
              {activeTab === 'completed' && <CheckCircle2 className="w-8 h-8 text-green-400/30" />}
              {activeTab === 'failed' && <XCircle className="w-8 h-8 text-red-400/30" />}
            </div>
            <p className="text-gray-500 dark:text-white/60 font-inter">
              {activeTab === 'active' && '暂无活动任务，点击"新建任务"开始你的征程'}
              {activeTab === 'completed' && '还没有完成的任务'}
              {activeTab === 'failed' && '没有放弃的任务'}
            </p>
          </div>
        )}
      </div>
      </div>

      {/* 番茄钟专区 */}
      <div className="glass-card p-6 space-y-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-orbitron text-gray-900 dark:text-white">
                专注时光
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/60 font-inter">
                番茄工作法 · 保持专注提升效率
              </p>
            </div>
          </div>

          {/* 查看历史按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFocusHistory(true)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-black/5 hover:bg-black/10 text-gray-900 border border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            专注历史
          </motion.button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 今日专注 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-xl transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                : 'bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-purple-500/30' : 'bg-purple-300/50'
              }`}>
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className={`font-bold font-inter ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                今日专注
              </h3>
            </div>
            <p className={`text-4xl font-black font-mono ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {Math.floor(stats.totalFocusTime)}
              <span className="text-lg ml-1">分钟</span>
            </p>
          </motion.div>

          {/* 完成会话 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-5 rounded-xl transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'
                : 'bg-gradient-to-br from-green-100 to-emerald-100 border border-green-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-green-500/30' : 'bg-green-300/50'
              }`}>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <h3 className={`font-bold font-inter ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                完成会话
              </h3>
            </div>
            <p className={`text-4xl font-black font-mono ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {focusSessions.length}
              <span className="text-lg ml-1">次</span>
            </p>
          </motion.div>

          {/* 平均时长 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-5 rounded-xl transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
                : 'bg-gradient-to-br from-cyan-100 to-blue-100 border border-cyan-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-cyan-500/30' : 'bg-cyan-300/50'
              }`}>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className={`font-bold font-inter ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                平均时长
              </h3>
            </div>
            <p className={`text-4xl font-black font-mono ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {focusSessions.length > 0 ? Math.floor(stats.totalFocusTime / focusSessions.length) : 0}
              <span className="text-lg ml-1">分钟</span>
            </p>
          </motion.div>
        </div>

        {/* 快速专注按钮 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewPomodoro}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg shadow-lg shadow-purple-500/50 transition-all"
          >
            <Timer className="w-6 h-6" />
            开始专注
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewPomodoro}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 text-white border-2 border-white/20'
                : 'bg-black/5 hover:bg-black/10 text-gray-900 border-2 border-gray-300'
            }`}
          >
            <Coffee className="w-6 h-6" />
            休息一下
          </motion.button>
        </div>

        {/* 使用提示 */}
        <div className={`p-4 rounded-lg ${
          theme === 'dark'
            ? 'bg-cyan-500/10 border border-cyan-500/30'
            : 'bg-cyan-50 border border-cyan-300'
        }`}>
          <p className={`text-sm font-inter ${
            theme === 'dark' ? 'text-cyan-300' : 'text-cyan-700'
          }`}>
            <strong>💡 使用技巧：</strong>
            番茄工作法建议每次专注 25 分钟，然后休息 5 分钟。完成 4 个番茄钟后，进行 15-30 分钟的长休息。
          </p>
        </div>
      </div>

      {/* 番茄钟列表 */}
      {pomodoroTimers.map((timerId, index) => (
        <PomodoroTimer
          key={timerId}
          timerIndex={index}
          onClose={() => closePomodoro(timerId)}
        />
      ))}

      {/* 专注历史面板 */}
      <FocusHistoryPanel
        isOpen={showFocusHistory}
        onClose={() => setShowFocusHistory(false)}
      />
    </div>
  );
}

/**
 * 标签按钮组件
 */
function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  color = 'text-gray-900 dark:text-white',
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-inter transition-all ${
        active
          ? 'bg-white/10 text-gray-900 dark:text-white'
          : `bg-transparent ${color} hover:bg-white/5`
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{count}</span>
    </button>
  );
}

/**
 * 任务日志任务卡片（类似主视图的今日任务卡片）
 */
function QuestLogTaskCard({ quest, onEdit }: { quest: Quest; onEdit: (quest: Quest) => void }) {
  const completeQuest = useGameStore((state) => state.completeQuest);
  const uncompleteQuest = useGameStore((state) => state.uncompleteQuest);
  const getChildQuests = useGameStore((state) => state.getChildQuests);
  const isCompleted = quest.status === QuestStatus.COMPLETED;
  const isFailed = quest.status === QuestStatus.FAILED;

  // 任务详情模态框状态
  const [showDetail, setShowDetail] = useState(false);
  // 展开/折叠状态
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取子任务
  const childQuests = getChildQuests(quest.id);
  const hasChildren = childQuests.length > 0;

  // 切换完成状态
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡，避免打开详情
    if (isCompleted) {
      uncompleteQuest(quest.id);
    } else if (!isFailed) {
      completeQuest(quest.id);
    }
  };

  const handleEdit = () => {
    setShowDetail(false);
    onEdit(quest);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div>
        {/* 父任务卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => setShowDetail(true)}
          className={`group relative p-4 rounded-xl border-l-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all cursor-pointer overflow-hidden ${
            isCompleted ? 'opacity-60' : ''
          }`}
          style={{ borderLeftColor: quest.color || '#00f3ff' }}
        >
          {/* 悬停光效 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-start gap-3">
            {/* 展开/折叠按钮 - 始终占位 */}
            <div className="mt-0.5 flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {hasChildren ? (
                <button
                  onClick={toggleExpand}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </button>
              ) : (
                <div className="w-4 h-4" />
              )}
            </div>

            {/* 完成按钮 - 只在非失败状态下显示 */}
            {!isFailed && (
              <button
                onClick={handleToggleComplete}
                className={`mt-0.5 flex-shrink-0 transition-all ${
                  isCompleted
                    ? 'text-green-400 scale-110'
                    : 'text-white/40 hover:text-white/60 hover:scale-110'
                }`}
                title={isCompleted ? '点击取消完成' : '点击完成任务'}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
            )}

            {/* 任务图标 */}
            <div className="mt-0.5 w-10 h-10 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-2xl leading-none">
              {quest.icon || '🎯'}
            </div>

            {/* 任务信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p
                  className={`font-inter font-medium transition-all ${
                    isCompleted ? 'text-white/50 line-through' : 'text-white group-hover:text-cyan-300'
                  }`}
                >
                  {quest.title}
                </p>
                {/* 子任务数量徽章 */}
                {hasChildren && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono"
                        title={`${childQuests.filter(c => c.status === QuestStatus.COMPLETED).length}/${childQuests.length} 子任务已完成`}>
                    {childQuests.filter(c => c.status === QuestStatus.COMPLETED).length}/{childQuests.length}
                  </span>
                )}
              </div>
              {quest.description && (
                <p className="text-sm text-white/60 mb-2 line-clamp-1">{quest.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-white/40">
                {quest.expReward && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-md">
                    <Zap className="w-3 h-3 text-purple-400" />
                    {quest.expReward}
                  </span>
                )}
                {quest.coinReward && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-md">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    {quest.coinReward}
                  </span>
                )}
                {quest.startDate && quest.endDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(quest.startDate).getHours()}:
                    {String(new Date(quest.startDate).getMinutes()).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {/* 操作菜单 */}
            <div onClick={(e) => e.stopPropagation()}>
              <TaskActionMenu quest={quest} compact onEdit={handleEdit} />
            </div>
          </div>
        </motion.div>

        {/* 子任务列表 */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-8 mt-2 space-y-2 pl-4 border-l-2 border-white/20"
            >
              {childQuests.map((childQuest) => (
                <QuestLogTaskCard key={childQuest.id} quest={childQuest} onEdit={onEdit} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 任务详情模态框 */}
      <TaskDetailModal
        quest={quest}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onEdit={handleEdit}
      />
    </>
  );
}
