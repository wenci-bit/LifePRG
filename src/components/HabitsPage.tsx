/**
 * HabitsPage - 习惯打卡管理页面
 *
 * 显示所有习惯、今日打卡进度、统计数据
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, X, Play, Pause, Archive, Trash2, Edit,
  TrendingUp, Flame, Target, Calendar, Clock, Star,
  CheckCircle2, Circle, MoreVertical
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { HabitType, HabitStatus, type Habit } from '@/types/game';
import HabitFormModal from './HabitFormModal';

export default function HabitsPage() {
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'paused' | 'archived'>('active');

  const {
    habits,
    habitCheckIns,
    checkInHabit,
    uncheckInHabit,
    toggleHabitPause,
    archiveHabit,
    deleteHabit,
    getTodayHabitSummary,
  } = useGameStore((state) => ({
    habits: state.habits,
    habitCheckIns: state.habitCheckIns,
    checkInHabit: state.checkInHabit,
    uncheckInHabit: state.uncheckInHabit,
    toggleHabitPause: state.toggleHabitPause,
    archiveHabit: state.archiveHabit,
    deleteHabit: state.deleteHabit,
    getTodayHabitSummary: state.getTodayHabitSummary,
  }));

  // 获取今日习惯概览
  const todaySummary = getTodayHabitSummary();

  // 按状态筛选习惯
  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      if (selectedTab === 'active') return h.status === HabitStatus.ACTIVE;
      if (selectedTab === 'paused') return h.status === HabitStatus.PAUSED;
      if (selectedTab === 'archived') return h.status === HabitStatus.ARCHIVED;
      return false;
    });
  }, [habits, selectedTab]);

  // 获取今日的习惯
  const today = new Date().toISOString().split('T')[0];
  const todayHabits = useMemo(() => {
    return filteredHabits.filter((habit) => {
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
  }, [filteredHabits]);

  // 判断习惯是否是今日需要完成的
  const isHabitForToday = (habit: Habit) => {
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
  };

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 今日进度 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/60 font-inter">今日进度</p>
              <p className="text-xl font-black font-mono text-white">
                {todaySummary.completedHabits}/{todaySummary.totalHabits}
              </p>
            </div>
          </div>
          {todaySummary.totalHabits > 0 && (
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${todaySummary.completionRate}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </motion.div>

        {/* 总习惯数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/60 font-inter">总习惯</p>
              <p className="text-2xl font-black font-mono text-white">
                {habits.filter(h => h.status === HabitStatus.ACTIVE).length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 最长连击 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/60 font-inter">最长连击</p>
              <p className="text-2xl font-black font-mono text-white">
                {Math.max(...habits.map(h => h.stats.longestStreak), 0)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 完成率 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/60 font-inter">平均完成率</p>
              <p className="text-2xl font-black font-mono text-white">
                {habits.length > 0
                  ? Math.round(habits.reduce((sum, h) => sum + h.stats.completionRate, 0) / habits.length)
                  : 0}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 标签页和创建按钮 */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { key: 'active', label: '活动中', count: habits.filter(h => h.status === HabitStatus.ACTIVE).length },
              { key: 'paused', label: '已暂停', count: habits.filter(h => h.status === HabitStatus.PAUSED).length },
              { key: 'archived', label: '已归档', count: habits.filter(h => h.status === HabitStatus.ARCHIVED).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg font-inter transition-all ${
                  selectedTab === tab.key
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHabitForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium transition-all"
          >
            <Plus className="w-5 h-5" />
            创建习惯
          </button>
        </div>
      </div>

      {/* 习惯列表 */}
      <div className="glass-card p-6">
        {selectedTab === 'active' && todaySummary.allCompleted && todayHabits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50"
          >
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
              <div>
                <p className="font-bold text-white">太棒了！今日所有习惯已完成！</p>
                <p className="text-sm text-white/70">坚持下去，你会更加优秀！</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {filteredHabits.length > 0 ? (
            filteredHabits.map((habit, index) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                index={index}
                isToday={selectedTab === 'active'}
                isTodayHabit={isHabitForToday(habit)}
                todayCheckIn={habitCheckIns.find(c => c.habitId === habit.id && c.date === today)}
                onCheckIn={checkInHabit}
                onUncheckIn={uncheckInHabit}
                onEdit={() => {
                  setEditingHabit(habit);
                  setShowHabitForm(true);
                }}
                onTogglePause={() => toggleHabitPause(habit.id)}
                onArchive={() => archiveHabit(habit.id)}
                onDelete={() => {
                  if (confirm(`确定要删除习惯"${habit.name}"吗？`)) {
                    deleteHabit(habit.id);
                  }
                }}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                <Target className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-orbitron">
                {selectedTab === 'active' && '还没有活动习惯'}
                {selectedTab === 'paused' && '没有暂停的习惯'}
                {selectedTab === 'archived' && '没有归档的习惯'}
              </h3>
              <p className="text-white/60 font-inter mb-6">
                点击上方"创建习惯"按钮开始培养新习惯
              </p>
              {selectedTab === 'active' && (
                <button
                  onClick={() => setShowHabitForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  创建第一个习惯
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* 习惯表单模态框 */}
      <HabitFormModal
        isOpen={showHabitForm}
        onClose={() => {
          setShowHabitForm(false);
          setEditingHabit(null);
        }}
        editHabit={editingHabit}
      />
    </div>
  );
}

/**
 * 习惯卡片组件
 */
interface HabitCardProps {
  habit: Habit;
  index: number;
  isToday: boolean;
  isTodayHabit: boolean;
  todayCheckIn?: any;
  onCheckIn: (habitId: string, value?: number, note?: string) => boolean;
  onUncheckIn: (habitId: string) => void;
  onEdit: () => void;
  onTogglePause: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function HabitCard({
  habit,
  index,
  isToday,
  isTodayHabit,
  todayCheckIn,
  onCheckIn,
  onUncheckIn,
  onEdit,
  onTogglePause,
  onArchive,
  onDelete,
}: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showValueInput, setShowValueInput] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const isCheckedIn = todayCheckIn?.completed || false;

  // 计算菜单位置
  useEffect(() => {
    if (showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 192, // 192px = w-48
      });
    }
  }, [showMenu]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleCheckIn = () => {
    if (habit.type === HabitType.BOOLEAN) {
      if (isCheckedIn) {
        onUncheckIn(habit.id);
      } else {
        onCheckIn(habit.id);
      }
    } else {
      setShowValueInput(true);
    }
  };

  const handleValueSubmit = () => {
    const value = Number(inputValue);
    if (value > 0) {
      onCheckIn(habit.id, value);
      setInputValue('');
      setShowValueInput(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative p-4 rounded-xl border-2 transition-all ${
        isCheckedIn
          ? 'border-green-500 bg-green-500/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
      style={{ borderLeftColor: habit.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-start gap-4">
        {/* 打卡按钮（仅活动习惯且为今日） */}
        {isTodayHabit && habit.status === HabitStatus.ACTIVE && (
          <button
            onClick={handleCheckIn}
            className={`mt-1 flex-shrink-0 transition-all ${
              isCheckedIn
                ? 'text-green-400 scale-110'
                : 'text-white/40 hover:text-white/60 hover:scale-110'
            }`}
          >
            {isCheckedIn ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </button>
        )}

        {/* 习惯图标 */}
        <div
          className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl leading-none"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          {habit.icon}
        </div>

        {/* 习惯信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold font-inter ${isCheckedIn ? 'text-green-400' : 'text-white'}`}>
              {habit.name}
            </h4>
            {habit.status === HabitStatus.PAUSED && (
              <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400">暂停中</span>
            )}
            {habit.status === HabitStatus.ARCHIVED && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-500/20 text-gray-400">已归档</span>
            )}
            {habit.status === HabitStatus.ACTIVE && !isTodayHabit && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">非今日</span>
            )}
          </div>

          {/* 目标值（非布尔型） */}
          {habit.type !== HabitType.BOOLEAN && habit.targetValue && (
            <p className="text-sm text-white/60 mb-2">
              目标：{habit.targetValue} {habit.unit}
              {todayCheckIn?.value && (
                <span className="ml-2 text-green-400">
                  (已完成: {todayCheckIn.value} {habit.unit})
                </span>
              )}
            </p>
          )}

          {/* 统计信息 */}
          <div className="flex items-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {habit.stats.currentStreak} 天连击
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              完成率 {habit.stats.completionRate}%
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              总计 {habit.stats.totalCompletions} 次
            </div>
          </div>
        </div>

        {/* 操作菜单 */}
        <div>
          <button
            ref={menuButtonRef}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-white/60" />
          </button>

          {/* 使用Portal渲染菜单到body */}
          {typeof window !== 'undefined' && showMenu && createPortal(
            <AnimatePresence>
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="fixed w-48 glass-card p-2 z-[9999] border border-white/20 shadow-2xl"
                style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
              >
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-2 text-left rounded-lg hover:bg-white/10 transition-colors text-white"
                >
                  <Edit className="w-4 h-4" />
                  编辑
                </button>
                {habit.status === HabitStatus.ACTIVE && (
                  <button
                    onClick={() => {
                      onTogglePause();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-2 text-left rounded-lg hover:bg-white/10 transition-colors text-white"
                  >
                    <Pause className="w-4 h-4" />
                    暂停
                  </button>
                )}
                {habit.status === HabitStatus.PAUSED && (
                  <button
                    onClick={() => {
                      onTogglePause();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-2 text-left rounded-lg hover:bg-white/10 transition-colors text-white"
                  >
                    <Play className="w-4 h-4" />
                    恢复
                  </button>
                )}
                {habit.status !== HabitStatus.ARCHIVED && (
                  <button
                    onClick={() => {
                      onArchive();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-2 text-left rounded-lg hover:bg-white/10 transition-colors text-white"
                  >
                    <Archive className="w-4 h-4" />
                    归档
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-2 text-left rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </motion.div>
            </AnimatePresence>,
            document.body
          )}
        </div>
      </div>

      {/* 值输入框（非布尔型） */}
      <AnimatePresence>
        {showValueInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`输入${habit.unit || '数值'}`}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-green-500"
                autoFocus
              />
              <button
                onClick={handleValueSubmit}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowValueInput(false);
                  setInputValue('');
                }}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
