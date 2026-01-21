/**
 * DashboardPage - 效率优先的仪表盘页面
 *
 * 重点展示本日任务、本周/本月重点任务
 */

'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useThemeStore } from '@/store/themeStore';
import {
  TrendingUp,
  Coins,
  Flame,
  Zap,
  Target,
  Calendar,
  Star,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Timer,
  Check,
} from 'lucide-react';
import { QuestStatus, HabitStatus, type Quest, type Habit } from '@/types/game';
import TaskActionMenu from './TaskActionMenu';
import TaskDetailModal from './TaskDetailModal';
import QuestFormModal from './QuestFormModal';
import PomodoroTimer from './PomodoroTimer';
import FocusHistoryPanel from './FocusHistoryPanel';
import AISummaryPanel from './AISummaryPanel';
import { formatLocalDate, isSameDay, isToday } from '@/utils/dateUtils';

export default function DashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  // 创建任务模态框状态
  const [showCreateQuest, setShowCreateQuest] = useState(false);
  // 编辑任务模态框状态
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  // 番茄钟列表（支持多个计时器）
  const [pomodoroTimers, setPomodoroTimers] = useState<string[]>([]);
  // 专注历史面板状态
  const [showFocusHistory, setShowFocusHistory] = useState(false);
  // 获取当前主题
  const theme = useThemeStore((state) => state.theme);

  // 创建新的番茄钟
  const createNewPomodoro = () => {
    const newId = Date.now().toString();
    setPomodoroTimers(prev => [...prev, newId]);
  };

  // 关闭指定的番茄钟
  const closePomodoro = (id: string) => {
    setPomodoroTimers(prev => prev.filter(timerId => timerId !== id));
  };

  const {
    level,
    currentExp,
    maxExp,
    coins,
    stats,
    quests,
    attributes,
    completeQuest,
    habits,
    habitCheckIns,
    getTodayHabitSummary,
  } = useGameStore((state) => ({
    level: state.level,
    currentExp: state.currentExp,
    maxExp: state.maxExp,
    coins: state.coins,
    stats: state.stats,
    quests: state.quests,
    attributes: state.attributes,
    completeQuest: state.completeQuest,
    habits: state.habits,
    habitCheckIns: state.habitCheckIns,
    getTodayHabitSummary: state.getTodayHabitSummary,
  }));

  // 获取今日任务
  const todayQuests = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 重置为当天0点，方便比较

    const allTodayQuests = quests.filter((q) => {
      // 检查任务日期范围是否包含今天
      const checkDateRange = () => {
        const startDate = q.startDate ? new Date(q.startDate) : null;
        const endDate = q.endDate || q.deadline ? new Date(q.endDate || q.deadline!) : null;

        // 重置时间为0点，只比较日期
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(0, 0, 0, 0);

        // 如果都没有日期，算作今日任务
        if (!startDate && !endDate) return true;

        // 如果只有开始日期，检查今天是否大于等于开始日期
        if (startDate && !endDate) {
          return today >= startDate;
        }

        // 如果只有结束日期，检查今天是否小于等于结束日期
        if (!startDate && endDate) {
          return today <= endDate;
        }

        // 如果两个日期都有，检查今天是否在范围内
        if (startDate && endDate) {
          return today >= startDate && today <= endDate;
        }

        return false;
      };

      // 如果任务已完成，检查是否在日期范围内（完成的任务也要显示，只是变灰）
      if (q.status === QuestStatus.COMPLETED) {
        return checkDateRange();
      }

      // 如果任务是活动状态，检查是否在日期范围内
      if (q.status === QuestStatus.ACTIVE) {
        return checkDateRange();
      }

      return false;
    });

    // 只返回父任务（没有 parentId 的任务）
    return allTodayQuests.filter(q => !q.parentId);
  }, [quests]);

  // 获取本周重点任务（包括已完成的）
  const weekMilestones = useMemo(() => {
    return quests.filter((q) => {
      return q.milestones?.includes('week') && q.status !== QuestStatus.FAILED;
    });
  }, [quests]);

  // 获取本月重点任务（包括已完成的）
  const monthMilestones = useMemo(() => {
    return quests.filter((q) => {
      return q.milestones?.includes('month') && q.status !== QuestStatus.FAILED;
    });
  }, [quests]);

  // 计算总属性值
  const totalAttributes = attributes.int + attributes.vit + attributes.mng + attributes.cre;

  // 获取今日习惯概览
  const todayHabitSummary = getTodayHabitSummary();

  // 获取今日的习惯（用于显示具体习惯）
  const today = new Date().toISOString().split('T')[0];
  const todayActiveHabits = useMemo(() => {
    return habits.filter((habit) => {
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
  }, [habits]);

  return (
    <div className="space-y-6">
      {/* 顶部：关键数据快速预览 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* 等级 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-purple to-pink-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 font-inter">等级</p>
              <p className="text-2xl font-black font-mono text-white">Lv.{level}</p>
            </div>
          </div>
        </motion.div>

        {/* 经验值 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => onNavigate?.('exp')}
          className="glass-card p-4 cursor-pointer hover:scale-105 hover:border-cyber-cyan/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-cyan to-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 font-inter">经验</p>
              <p className="text-lg font-bold font-mono text-white">
                {currentExp}/{maxExp}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 金币 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigate?.('coins')}
          className="glass-card p-4 cursor-pointer hover:scale-105 hover:border-cyber-cyan/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 font-inter">金币</p>
              <p className="text-2xl font-black font-mono text-white">{coins}</p>
            </div>
          </div>
        </motion.div>

        {/* 连续打卡 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => onNavigate?.('checkin')}
          className="glass-card p-4 cursor-pointer hover:scale-105 hover:border-cyber-cyan/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 font-inter">连击</p>
              <p className="text-2xl font-black font-mono text-white">{stats.currentStreak}</p>
            </div>
          </div>
        </motion.div>

        {/* 总属性 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onNavigate?.('attributes')}
          className="glass-card p-4 cursor-pointer hover:scale-105 hover:border-cyber-cyan/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 font-inter">属性</p>
              <p className="text-2xl font-black font-mono text-white">{totalAttributes}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 主区域：今日任务 + 重点任务 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：今日任务（2列宽） */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2"
        >
          <div className="glass-card p-6">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-cyan to-blue-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-orbitron text-white">
                    今日任务
                  </h2>
                  <p className="text-sm text-white/60 font-inter">
                    {todayQuests.filter((q) => q.status === QuestStatus.COMPLETED).length} / {todayQuests.length} 已完成
                  </p>
                </div>
              </div>

              {/* 操作按钮组 */}
              <div className="flex items-center gap-3">
                {/* 番茄钟按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createNewPomodoro}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/50 shadow-purple-500/50'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border border-purple-600/30 shadow-purple-400/30'
                  }`}
                  title="快速专注"
                >
                  <Timer className="w-4 h-4" />
                  <span>快速专注</span>
                </motion.button>

                {/* 专注历史按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFocusHistory(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border border-indigo-400/50 shadow-indigo-500/50'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border border-indigo-600/30 shadow-indigo-400/30'
                  }`}
                  title="专注历史"
                >
                  <Clock className="w-4 h-4" />
                  <span>专注历史</span>
                </motion.button>

                {/* 创建任务按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateQuest(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/50 shadow-cyan-500/50'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border border-cyan-600/30 shadow-cyan-400/30'
                  }`}
                  title="创建任务"
                >
                  <Plus className="w-4 h-4" />
                  <span>创建任务</span>
                </motion.button>
              </div>
            </div>

            {/* 进度条 */}
            {todayQuests.length > 0 && (
              <div className="mb-6">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/50"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(todayQuests.filter((q) => q.status === QuestStatus.COMPLETED).length / todayQuests.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* 今日任务列表 */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {todayQuests.length > 0 ? (
                todayQuests.map((quest) => (
                  <TodayTaskCard key={quest.id} quest={quest} onEdit={(q) => setEditingQuest(q)} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-orbitron">
                    今天还没有任务
                  </h3>
                  <p className="text-white/60 font-inter mb-6">
                    点击上方"创建任务"按钮添加你的第一个任务
                  </p>
                  <button
                    onClick={() => setShowCreateQuest(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/50"
                  >
                    <Plus className="w-5 h-5" />
                    立即创建
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 右侧：本周/本月重点（1列宽） */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* 本周重点 */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold font-orbitron text-white">本周重点</h3>
            </div>
            <div className="space-y-3">
              {weekMilestones.length > 0 ? (
                weekMilestones.slice(0, 3).map((quest) => (
                  <MilestoneCard key={quest.id} quest={quest} color="green" onEdit={(q) => setEditingQuest(q)} />
                ))
              ) : (
                <p className="text-white/40 text-sm text-center py-4">暂无周重点任务</p>
              )}
            </div>
          </div>

          {/* 本月重点 */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold font-orbitron text-white">本月重点</h3>
            </div>
            <div className="space-y-3">
              {monthMilestones.length > 0 ? (
                monthMilestones.slice(0, 3).map((quest) => (
                  <MilestoneCard key={quest.id} quest={quest} color="purple" onEdit={(q) => setEditingQuest(q)} />
                ))
              ) : (
                <p className="text-white/40 text-sm text-center py-4">暂无月重点任务</p>
              )}
            </div>
          </div>

          {/* 今日习惯完成情况概览 - 简洁版 */}
          <div
            onClick={() => onNavigate?.('habits')}
            className="glass-card p-4 cursor-pointer hover:scale-[1.01] hover:border-cyber-cyan/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-orbitron text-gray-900 dark:text-white">今日习惯</h3>
                  <p className="text-xs text-gray-600 dark:text-white/60 font-inter">
                    {todayActiveHabits.length > 0 ? (
                      <>
                        {todayHabitSummary.completedHabits} / {todayHabitSummary.totalHabits} 已完成
                        {todayHabitSummary.allCompleted && (
                          <span className="ml-1 text-yellow-500 dark:text-yellow-400">✨</span>
                        )}
                      </>
                    ) : (
                      <span>点击创建第一个习惯</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 完成率小标签 */}
              {todayActiveHabits.length > 0 && (
                <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold font-mono">
                  {Math.round(todayHabitSummary.completionRate)}%
                </div>
              )}
            </div>

            {/* 习惯列表预览或空状态 */}
            {todayActiveHabits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {todayActiveHabits.slice(0, 6).map((habit) => {
                  const checkIn = habitCheckIns.find(
                    (c) => c.habitId === habit.id && c.date === today
                  );
                  const isCompleted = checkIn?.completed || false;

                  return (
                    <div
                      key={habit.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                        isCompleted
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.('habits');
                      }}
                    >
                      <span className={`text-base ${isCompleted ? 'opacity-100' : 'opacity-60'}`}>
                        {habit.icon}
                      </span>
                      <span className={`text-xs font-medium ${
                        isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-700 dark:text-white/80'
                      }`}>
                        {habit.name}
                      </span>
                      {isCompleted && (
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  );
                })}
                {todayActiveHabits.length > 6 && (
                  <div className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10">
                    <p className="text-xs text-gray-600 dark:text-white/60 font-inter font-medium">
                      +{todayActiveHabits.length - 6}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/60">
                    点击创建你的第一个习惯
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 快速统计 */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold font-orbitron text-white mb-4">快速统计</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60 font-inter">已完成任务</span>
                <span className="text-xl font-bold font-mono text-white">
                  {stats.totalQuestsCompleted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60 font-inter">专注时长</span>
                <span className="text-xl font-bold font-mono text-white">
                  {Math.floor(stats.totalFocusTime)}m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60 font-inter">最长连击</span>
                <span className="text-xl font-bold font-mono text-white">
                  {stats.longestStreak}
                </span>
              </div>
            </div>
          </div>

          {/* AI 智能建议 */}
          <AISummaryPanel />
        </motion.div>
      </div>

      {/* 创建任务模态框 */}
      <QuestFormModal
        isOpen={showCreateQuest}
        onClose={() => setShowCreateQuest(false)}
      />

      {/* 编辑任务模态框 */}
      {editingQuest && (
        <QuestFormModal
          isOpen={true}
          onClose={() => setEditingQuest(null)}
          editQuest={editingQuest}
        />
      )}

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
 * 今日任务卡片
 */
function TodayTaskCard({ quest, onEdit }: { quest: Quest; onEdit: (quest: Quest) => void }) {
  const completeQuest = useGameStore((state) => state.completeQuest);
  const uncompleteQuest = useGameStore((state) => state.uncompleteQuest);
  const getChildQuests = useGameStore((state) => state.getChildQuests);
  const isCompleted = quest.status === QuestStatus.COMPLETED;
  const isFailed = quest.status === QuestStatus.FAILED;

  // 任务详情模态框状态
  const [showDetail, setShowDetail] = useState(false);
  // 展开/折叠状态
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取所有子任务
  const allChildQuests = getChildQuests(quest.id);

  // 过滤出今天的子任务
  const todayChildQuests = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 重置为当天0点，方便比较

    return allChildQuests.filter((childQuest) => {
      // 检查任务日期范围是否包含今天
      const checkDateRange = () => {
        const startDate = childQuest.startDate ? new Date(childQuest.startDate) : null;
        const endDate = childQuest.endDate || childQuest.deadline ? new Date(childQuest.endDate || childQuest.deadline!) : null;

        // 重置时间为0点，只比较日期
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(0, 0, 0, 0);

        // 如果都没有日期，算作今日任务
        if (!startDate && !endDate) return true;

        // 如果只有开始日期，检查今天是否大于等于开始日期
        if (startDate && !endDate) {
          return today >= startDate;
        }

        // 如果只有结束日期，检查今天是否小于等于结束日期
        if (!startDate && endDate) {
          return today <= endDate;
        }

        // 如果两个日期都有，检查今天是否在范围内
        if (startDate && endDate) {
          return today >= startDate && today <= endDate;
        }

        return false;
      };

      // 如果子任务已完成，检查是否在日期范围内（完成的任务也要显示，只是变灰）
      if (childQuest.status === QuestStatus.COMPLETED) {
        return checkDateRange();
      }

      // 如果子任务是活动状态，检查是否在日期范围内
      if (childQuest.status === QuestStatus.ACTIVE) {
        return checkDateRange();
      }

      return false;
    });
  }, [allChildQuests]);

  const hasChildren = todayChildQuests.length > 0;

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

            {/* 任务图标 - 始终显示 */}
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
                        title={`${todayChildQuests.filter(c => c.status === QuestStatus.COMPLETED).length}/${todayChildQuests.length} 今日子任务已完成`}>
                    {todayChildQuests.filter(c => c.status === QuestStatus.COMPLETED).length}/{todayChildQuests.length}
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
              {todayChildQuests.map((childQuest) => (
                <TodayTaskCard key={childQuest.id} quest={childQuest} onEdit={onEdit} />
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

/**
 * 重点任务卡片
 */
function MilestoneCard({ quest, color, onEdit }: { quest: Quest; color: 'green' | 'purple'; onEdit: (quest: Quest) => void }) {
  const isCompleted = quest.status === QuestStatus.COMPLETED;

  // 任务详情模态框状态
  const [showDetail, setShowDetail] = useState(false);

  const handleEdit = () => {
    setShowDetail(false);
    onEdit(quest);
  };

  const colorClasses = {
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  };

  const progressColorClasses = {
    green: 'from-green-400 to-emerald-500',
    purple: 'from-purple-400 to-pink-500',
  };

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className={`p-3 rounded-lg bg-gradient-to-r border cursor-pointer hover:brightness-110 transition-all ${colorClasses[color]} ${
          isCompleted ? 'opacity-60' : ''
        }`}
      >
      {/* 标题和图标 */}
      <div className="flex items-center gap-2 mb-2">
        {/* 任务图标 */}
        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-xl leading-none">
          {quest.icon || '🎯'}
        </div>
        {/* 任务标题 */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold text-white line-clamp-2 ${isCompleted ? 'line-through' : ''}`}>
            {quest.title}
          </p>
        </div>
        {/* 完成标记 */}
        {isCompleted && (
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
        )}
      </div>

      {quest.progress !== undefined && (
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>进度</span>
            <span>{quest.progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${progressColorClasses[color]}`}
              style={{ width: `${quest.progress}%` }}
            />
          </div>
        </div>
      )}
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
