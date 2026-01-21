/**
 * HabitsCheckInPage - 习惯打卡+签到合并页面
 *
 * 合并习惯管理和每日签到功能，提供统一的打卡体验
 */

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, X, Play, Pause, Archive, Trash2, Edit,
  TrendingUp, Flame, Target, Calendar, Clock, Star,
  CheckCircle2, Circle, MoreVertical, Gift, Lock, CalendarDays,
  Smile, Frown, Meh, Angry, Heart, Zap, RotateCcw
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { HabitType, HabitStatus, type Habit } from '@/types/game';
import HabitFormModal from './HabitFormModal';
import { calculateCheckInReward, getNextMilestone, getRandomEncouragement } from '@/data/checkIn';

// 情绪类型定义（包括内置和自定义）
export type MoodType = 'happy' | 'neutral' | 'sad' | 'angry' | 'love' | 'energetic' | string;

// 自定义心情接口
export interface CustomMood {
  id: string;
  icon: string;
  label: string;
  color: string;
  darkColor: string;
}

// 默认情绪配置
const DEFAULT_MOODS = {
  happy: { icon: Smile, label: '开心', color: '#10b981', darkColor: '#065f46' },
  neutral: { icon: Meh, label: '平静', color: '#6366f1', darkColor: '#3730a3' },
  sad: { icon: Frown, label: '难过', color: '#8b5cf6', darkColor: '#5b21b6' },
  angry: { icon: Angry, label: '愤怒', color: '#ef4444', darkColor: '#991b1b' },
  love: { icon: Heart, label: '有爱', color: '#ec4899', darkColor: '#9f1239' },
  energetic: { icon: Zap, label: '充满活力', color: '#f59e0b', darkColor: '#b45309' },
};

// 预设颜色选项
const PRESET_COLORS = [
  '#10b981', // 绿色
  '#6366f1', // 靛蓝
  '#8b5cf6', // 紫色
  '#ef4444', // 红色
  '#ec4899', // 粉色
  '#f59e0b', // 橙色
  '#3b82f6', // 蓝色
  '#14b8a6', // 青色
  '#f97316', // 橙红
  '#a855f7', // 紫红
  '#06b6d4', // 天蓝
  '#84cc16', // 黄绿
];

export default function HabitsCheckInPage() {
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'paused' | 'archived'>('active');

  // 情绪选择状态
  const [dailyMoods, setDailyMoods] = useState<Record<string, MoodType>>({});
  const [showMoodPicker, setShowMoodPicker] = useState<string | null>(null);

  // 自定义心情列表
  const [customMoods, setCustomMoods] = useState<CustomMood[]>([]);
  const [showCustomMoodForm, setShowCustomMoodForm] = useState(false);

  // 获取所有情绪配置（默认 + 自定义）
  const getMoodConfig = (moodId: MoodType) => {
    // 先检查是否是默认情绪
    if (moodId in DEFAULT_MOODS) {
      return DEFAULT_MOODS[moodId as keyof typeof DEFAULT_MOODS];
    }

    // 查找自定义情绪
    const customMood = customMoods.find(m => m.id === moodId);
    if (customMood) {
      return {
        icon: () => <span className="text-xl">{customMood.icon}</span>,
        label: customMood.label,
        color: customMood.color,
        darkColor: customMood.darkColor,
      };
    }

    // 默认返回
    return DEFAULT_MOODS.happy;
  };

  // 添加自定义心情
  const addCustomMood = (mood: Omit<CustomMood, 'id'>) => {
    const newMood: CustomMood = {
      ...mood,
      id: `custom_${Date.now()}`,
    };
    setCustomMoods([...customMoods, newMood]);
  };

  // 删除自定义心情
  const deleteCustomMood = (id: string) => {
    setCustomMoods(customMoods.filter(m => m.id !== id));
    // 同时清理使用了这个心情的日期
    setDailyMoods(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(date => {
        if (updated[date] === id) {
          delete updated[date];
        }
      });
      return updated;
    });
  };

  const {
    habits,
    habitCheckIns,
    checkIn,
    checkInHabit,
    uncheckInHabit,
    toggleHabitPause,
    archiveHabit,
    deleteHabit,
    getTodayHabitSummary,
    dailyCheckIn,
  } = useGameStore((state) => ({
    habits: state.habits,
    habitCheckIns: state.habitCheckIns,
    checkIn: state.checkIn,
    checkInHabit: state.checkInHabit,
    uncheckInHabit: state.uncheckInHabit,
    toggleHabitPause: state.toggleHabitPause,
    archiveHabit: state.archiveHabit,
    deleteHabit: state.deleteHabit,
    getTodayHabitSummary: state.getTodayHabitSummary,
    dailyCheckIn: state.dailyCheckIn,
  }));

  // 签到日历相关状态
  const [currentMonth, setCurrentMonth] = useState('');
  const [monthDays, setMonthDays] = useState<Date[]>([]);
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month'); // 新增：视图切换状态

  // 初始化当前月份的日期列表
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    setCurrentMonth(`${year}年${month + 1}月`);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i, 12, 0, 0));
    }
    setMonthDays(days);
  }, []);

  // 格式化日期
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isCheckedInDate = (date: Date): boolean => {
    return checkIn.checkInHistory.includes(formatLocalDate(date));
  };

  const isTodayDate = (date: Date): boolean => {
    return formatLocalDate(date) === formatLocalDate(new Date());
  };

  // 生成年视图的月份数据
  const getYearMonths = () => {
    const now = new Date();
    const year = now.getFullYear();
    const months: { name: string; days: Date[] }[] = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: Date[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day, 12, 0, 0));
      }
      months.push({
        name: `${month + 1}月`,
        days,
      });
    }
    return months;
  };

  // 计算情绪统计数据
  const getMoodStatistics = (view: 'month' | 'year') => {
    const moodCounts: Record<string, number> = {};
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    Object.entries(dailyMoods).forEach(([dateStr, moodId]) => {
      const date = new Date(dateStr);
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth();

      // 根据视图筛选数据
      if (view === 'month') {
        // 只统计当前月份
        if (dateYear === year && dateMonth === month) {
          moodCounts[moodId] = (moodCounts[moodId] || 0) + 1;
        }
      } else {
        // 统计整年
        if (dateYear === year) {
          moodCounts[moodId] = (moodCounts[moodId] || 0) + 1;
        }
      }
    });

    // 转换为数组并排序
    return Object.entries(moodCounts)
      .map(([moodId, count]) => ({
        moodId,
        count,
        config: getMoodConfig(moodId as MoodType),
      }))
      .sort((a, b) => b.count - a.count);
  };

  // 获取今日习惯概览
  const todaySummary = getTodayHabitSummary();

  // 获取今日的习惯
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 添加调试日志 - 页面加载时
  useEffect(() => {
    console.log('=== 习惯打卡页面调试信息 ===');
    console.log('[HabitsCheckInPage] 总习惯数:', habits.length);
    console.log('[HabitsCheckInPage] 今日应完成习惯数:', todaySummary.totalHabits);
    console.log('[HabitsCheckInPage] 今日已完成习惯数:', todaySummary.completedHabits);
    console.log('[HabitsCheckInPage] 今日打卡记录数:', habitCheckIns.filter(c => c.date === today).length);
    console.log('[HabitsCheckInPage] 今日日期:', today);
    console.log('[HabitsCheckInPage] 签到状态:', {
      hasCheckedInToday: checkIn.hasCheckedInToday,
      lastCheckInDate: checkIn.lastCheckInDate,
    });
  }, [habits.length, habitCheckIns.length, checkIn.hasCheckedInToday, today, todaySummary]);

  // 按状态筛选习惯
  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      if (selectedTab === 'active') return h.status === HabitStatus.ACTIVE;
      if (selectedTab === 'paused') return h.status === HabitStatus.PAUSED;
      if (selectedTab === 'archived') return h.status === HabitStatus.ARCHIVED;
      return false;
    });
  }, [habits, selectedTab]);

  // 计算今日习惯
  const todayHabits = useMemo(() => {
    return filteredHabits.filter((habit) => {
      if (habit.status !== HabitStatus.ACTIVE) return false;
      if (habit.startDate && habit.startDate > Date.now()) return false;
      if (habit.endDate && habit.endDate < Date.now()) return false;

      const todayDate = new Date();
      const dayOfWeek = todayDate.getDay();

      if (habit.repeatPattern.type === 'daily') return true;
      if (habit.repeatPattern.type === 'weekly' || habit.repeatPattern.type === 'custom') {
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

    if (habit.repeatPattern.type === 'daily') return true;
    if (habit.repeatPattern.type === 'weekly' || habit.repeatPattern.type === 'custom') {
      return habit.repeatPattern.daysOfWeek?.includes(dayOfWeek) || false;
    }
    return false;
  };

  // 签到相关
  const currentStreak = checkIn.checkInStreak ?? 0;
  const nextReward = calculateCheckInReward(currentStreak + 1);
  const nextMilestone = getNextMilestone(currentStreak);
  const todayString = formatLocalDate(new Date());
  // 使用两个条件检查：lastCheckInDate 和 hasCheckedInToday
  const hasCheckedInToday = checkIn.hasCheckedInToday && checkIn.lastCheckInDate === todayString;

  const handleCheckIn = () => {
    console.log('[handleCheckIn] 用户点击签到按钮');
    console.log('[handleCheckIn] 当前签到状态:', {
      hasCheckedInToday: checkIn.hasCheckedInToday,
      lastCheckInDate: checkIn.lastCheckInDate,
      todayString,
    });
    console.log('[handleCheckIn] 今日习惯概览:', todaySummary);

    // 检查是否所有习惯已完成
    if (!todaySummary.allCompleted) {
      // 弹出提示：今日习惯未完成
      alert(`今日习惯未完成！\n\n已完成：${todaySummary.completedHabits}/${todaySummary.totalHabits}\n请先完成所有习惯后再签到。`);
      return;
    }

    // 所有习惯已完成，执行签到
    dailyCheckIn();
  };

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 - 6个卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 今日习惯进度 */}
        <StatCard
          icon={CheckCircle2}
          label="今日进度"
          value={`${todaySummary.completedHabits}/${todaySummary.totalHabits}`}
          gradient="from-green-500 to-emerald-600"
          delay={0.1}
          progress={todaySummary.completionRate}
        />

        {/* 总习惯数 */}
        <StatCard
          icon={Target}
          label="总习惯"
          value={habits.filter(h => h.status === HabitStatus.ACTIVE).length}
          gradient="from-purple-500 to-pink-600"
          delay={0.15}
        />

        {/* 习惯最长连击 */}
        <StatCard
          icon={Flame}
          label="习惯连击"
          value={Math.max(...habits.map(h => h.stats.longestStreak), 0)}
          gradient="from-orange-500 to-red-600"
          delay={0.2}
        />

        {/* 平均完成率 */}
        <StatCard
          icon={TrendingUp}
          label="平均完成率"
          value={`${habits.length > 0
            ? Math.round(habits.reduce((sum, h) => sum + h.stats.completionRate, 0) / habits.length)
            : 0}%`}
          gradient="from-blue-500 to-cyan-600"
          delay={0.25}
        />

        {/* 连续签到 */}
        <StatCard
          icon={CalendarDays}
          label="连续签到"
          value={`${currentStreak}天`}
          gradient="from-amber-500 to-yellow-600"
          delay={0.3}
        />

        {/* 本月签到 */}
        <StatCard
          icon={Calendar}
          label="本月签到"
          value={checkIn.currentMonthCheckIns ?? 0}
          gradient="from-indigo-500 to-purple-600"
          delay={0.35}
        />
      </div>

      {/* 中部主要区域 - 左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：习惯列表（2/3宽度） */}
        <div className="lg:col-span-2 space-y-6">
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
                    <p className="font-bold text-gray-900 dark:text-white">太棒了！今日所有习惯已完成！</p>
                    <p className="text-sm text-gray-700 dark:text-white/70">
                      {hasCheckedInToday ? '今日已签到，继续保持！' : '别忘了点击右侧签到按钮领取奖励哦！'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
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
                <EmptyState selectedTab={selectedTab} onCreateHabit={() => setShowHabitForm(true)} />
              )}
            </div>
          </div>
        </div>

        {/* 右侧：签到面板（1/3宽度） */}
        <div className="lg:col-span-1 space-y-6">
          {/* 签到按钮和状态 */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold font-orbitron text-gray-900 dark:text-white mb-4 text-center">
              每日签到
            </h3>

            {/* 签到按钮 */}
            <motion.button
              onClick={handleCheckIn}
              disabled={hasCheckedInToday}
              whileHover={!hasCheckedInToday ? { scale: 1.05 } : {}}
              whileTap={!hasCheckedInToday ? { scale: 0.95 } : {}}
              className={`
                w-full py-4 px-6 rounded-xl font-bold font-inter text-lg
                transition-all duration-300 shadow-xl mb-4
                ${hasCheckedInToday
                  ? 'bg-white/10 text-gray-400 dark:text-white/40 cursor-not-allowed'
                  : todaySummary.allCompleted
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 cursor-pointer'
                }
              `}
            >
              {hasCheckedInToday ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  今日已签到
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {todaySummary.allCompleted ? '立即签到' : '立即签到（习惯未完成）'}
                </span>
              )}
            </motion.button>

            {/* 鼓励语 */}
            {!hasCheckedInToday && (
              <p className="text-gray-500 dark:text-white/60 text-sm text-center mb-4 font-inter">
                {getRandomEncouragement()}
              </p>
            )}

            {/* 统计 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <p className="text-xs text-gray-500 dark:text-white/60 mb-1">累计签到</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                  {checkIn.totalCheckIns ?? 0}
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <p className="text-xs text-gray-500 dark:text-white/60 mb-1">本月签到</p>
                <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                  {checkIn.currentMonthCheckIns ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* 明日奖励 */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              明日奖励
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-white/80">经验值</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">+{nextReward.exp}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-white/80">金币</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400 font-mono">+{nextReward.coins}</span>
              </div>

              {nextReward.categorizedCoins && (
                <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-300 mb-1">分类金币</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {nextReward.categorizedCoins.int && (
                      <div className="text-blue-600 dark:text-blue-300">智慧 +{nextReward.categorizedCoins.int}</div>
                    )}
                    {nextReward.categorizedCoins.vit && (
                      <div className="text-green-600 dark:text-green-300">活力 +{nextReward.categorizedCoins.vit}</div>
                    )}
                    {nextReward.categorizedCoins.mng && (
                      <div className="text-purple-600 dark:text-purple-300">管理 +{nextReward.categorizedCoins.mng}</div>
                    )}
                    {nextReward.categorizedCoins.cre && (
                      <div className="text-orange-600 dark:text-orange-300">创意 +{nextReward.categorizedCoins.cre}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 里程碑 */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span className="font-bold text-amber-600 dark:text-amber-300 font-inter">下一个里程碑</span>
            </div>
            <p className="text-gray-700 dark:text-white/80 font-inter mb-3">
              连续签到 <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{nextMilestone}</span> 天
            </p>
            <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                style={{ width: `${(currentStreak / nextMilestone) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-white/60 font-inter">
              还需 {nextMilestone - currentStreak} 天
            </p>
          </div>
        </div>
      </div>

      {/* 底部：签到日历 */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-orbitron text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyber-cyan" />
            {calendarView === 'month' ? `${currentMonth} 签到日历` : `${new Date().getFullYear()}年 签到日历`}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                calendarView === 'month'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
              }`}
            >
              月视图
            </button>
            <button
              onClick={() => setCalendarView('year')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                calendarView === 'year'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
              }`}
            >
              年视图
            </button>
          </div>
        </div>

        {/* 主体区域：左右分栏 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 左侧：情绪统计 */}
          <div className="lg:col-span-1">
            <MoodStatistics
              statistics={getMoodStatistics(calendarView)}
              view={calendarView}
            />
          </div>

          {/* 右侧：日历视图 */}
          <div className="lg:col-span-3">
            {/* 月视图 */}
            {calendarView === 'month' && (
              <MonthCalendarView
                monthDays={monthDays}
                dailyMoods={dailyMoods}
                checkIn={checkIn}
                formatLocalDate={formatLocalDate}
                isCheckedInDate={isCheckedInDate}
                isTodayDate={isTodayDate}
                getMoodConfig={getMoodConfig}
                setShowMoodPicker={setShowMoodPicker}
                showMoodPicker={showMoodPicker}
                customMoods={customMoods}
                setDailyMoods={setDailyMoods}
                setShowCustomMoodForm={setShowCustomMoodForm}
                deleteCustomMood={deleteCustomMood}
              />
            )}

            {/* 年视图 */}
            {calendarView === 'year' && (
              <YearCalendarView
                getYearMonths={getYearMonths}
                dailyMoods={dailyMoods}
                checkIn={checkIn}
                formatLocalDate={formatLocalDate}
                isCheckedInDate={isCheckedInDate}
                isTodayDate={isTodayDate}
                getMoodConfig={getMoodConfig}
              />
            )}
          </div>
        </div>

        {/* 图例 */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-inter">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-green-500" />
            <span className="text-gray-600 dark:text-white/60">已签到</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded ring-2 ring-cyan-500" />
            <span className="text-gray-600 dark:text-white/60">今天</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-white/5 border border-gray-300 dark:border-white/20" />
            <span className="text-gray-600 dark:text-white/60">未签到</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-purple-800 border border-purple-500" />
            <span className="text-gray-600 dark:text-white/60">有情绪未签到</span>
          </div>
          <div className="flex items-center gap-1">
            <Smile className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-white/60">点击日期选择情绪</span>
          </div>
        </div>
      </div>


      {/* 自定义心情表单 */}
      {showCustomMoodForm && (
        <CustomMoodForm
          onSubmit={(mood) => {
            addCustomMood(mood);
            setShowCustomMoodForm(false);
          }}
          onClose={() => setShowCustomMoodForm(false)}
        />
      )}

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
 * 统计卡片组件
 */
interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  gradient: string;
  delay: number;
  progress?: number;
}

function StatCard({ icon: Icon, label, value, gradient, delay, progress }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 dark:text-white/60 font-inter">{label}</p>
          <p className="text-xl font-black font-mono text-gray-900 dark:text-white truncate">{value}</p>
        </div>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${gradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, delay }}
          />
        </div>
      )}
    </motion.div>
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

  // 调试日志 - 初次渲染时
  useEffect(() => {
    console.log('[HabitCard] 渲染习惯卡片', {
      habitName: habit.name,
      isToday,
      todayCheckIn: todayCheckIn ? {
        id: todayCheckIn.id,
        completed: todayCheckIn.completed,
        value: todayCheckIn.value,
      } : null,
      isCheckedIn,
    });
  }, [habit.name, isToday, todayCheckIn?.completed, isCheckedIn]);

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
    console.log('[HabitCard.handleCheckIn] 点击打卡按钮', {
      habitName: habit.name,
      habitType: habit.type,
      isCheckedIn,
    });

    if (habit.type === HabitType.BOOLEAN) {
      // 布尔型：直接切换完成/未完成状态
      if (isCheckedIn) {
        console.log('[HabitCard.handleCheckIn] 取消布尔型打卡');
        onUncheckIn(habit.id);
      } else {
        console.log('[HabitCard.handleCheckIn] 完成布尔型打卡');
        onCheckIn(habit.id);
      }
    } else {
      // 数量型/时长型：显示输入框
      // 如果已完成，预填充当前值；如果未完成，留空
      if (isCheckedIn && todayCheckIn?.value) {
        setInputValue(String(todayCheckIn.value));
      }
      console.log('[HabitCard.handleCheckIn] 显示数量输入框');
      setShowValueInput(true);
    }
  };

  const handleValueSubmit = () => {
    const value = Number(inputValue);
    console.log('[HabitCard.handleValueSubmit] 提交数值', {
      habitName: habit.name,
      value,
      targetValue: habit.targetValue,
    });

    if (value >= 0) {
      if (value === 0) {
        // 输入0表示清除打卡
        onUncheckIn(habit.id);
      } else {
        // 正常打卡
        onCheckIn(habit.id, value);
      }
      setInputValue('');
      setShowValueInput(false);
    } else {
      console.log('[HabitCard.handleValueSubmit] 数值无效，未提交');
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
        {isTodayHabit && habit.status === HabitStatus.ACTIVE && (
          <button
            onClick={handleCheckIn}
            className={`mt-1 flex-shrink-0 transition-all ${
              isCheckedIn
                ? 'text-green-400 scale-110'
                : 'text-white/40 hover:text-white/60 hover:scale-110'
            }`}
            title={
              habit.type === HabitType.BOOLEAN
                ? (isCheckedIn ? '点击取消打卡' : '点击打卡')
                : (isCheckedIn ? '点击修改打卡值' : '点击输入打卡值')
            }
          >
            {isCheckedIn ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </button>
        )}

        <div
          className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl leading-none"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          {habit.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold font-inter ${isCheckedIn ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>
              {habit.name}
            </h4>
            {habit.status === HabitStatus.PAUSED && (
              <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">暂停中</span>
            )}
            {habit.status === HabitStatus.ARCHIVED && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">已归档</span>
            )}
            {habit.status === HabitStatus.ACTIVE && !isTodayHabit && (
              <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                非今日
              </span>
            )}
          </div>

          {habit.type !== HabitType.BOOLEAN && habit.targetValue && (
            <p className="text-sm text-gray-600 dark:text-white/60 mb-2">
              目标：{habit.targetValue} {habit.unit}
              {todayCheckIn?.value && todayCheckIn?.completed && (
                <span className="ml-2 text-gray-700 dark:text-white/80">
                  (已完成:{' '}
                  <span
                    className="text-green-400 font-bold cursor-pointer hover:text-green-300 transition-colors underline decoration-dotted"
                    onClick={handleCheckIn}
                    title="点击修改或输入0清除"
                  >
                    {todayCheckIn.value}
                  </span>
                  {' '}{habit.unit})
                </span>
              )}
            </p>
          )}

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

      <AnimatePresence>
        {showValueInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900 dark:text-white/80 font-medium whitespace-nowrap">
                完成数量为：
              </span>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`输入${habit.unit || '数值'}`}
                className="flex-1 px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none focus:border-green-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleValueSubmit();
                  }
                }}
              />
              <button
                onClick={handleValueSubmit}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                title="确认提交"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowValueInput(false);
                  setInputValue('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                title="取消"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  onUncheckIn(habit.id);
                  setShowValueInput(false);
                  setInputValue('');
                }}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="清除当天打卡记录"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * 情绪选择器组件
 */
interface MoodPickerProps {
  currentMood?: MoodType;
  customMoods: CustomMood[];
  onSelect: (mood: MoodType) => void;
  onClose: () => void;
  onAddCustom: () => void;
  onDeleteCustom: (id: string) => void;
}

function MoodPicker({ currentMood, customMoods, onSelect, onClose, onAddCustom, onDeleteCustom }: MoodPickerProps) {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mood-picker')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="mood-picker fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 rounded-2xl border border-white/20 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-orbitron">选择今日情绪</h3>

        {/* 默认情绪 */}
        <p className="text-sm text-gray-600 dark:text-white/60 mb-2 font-inter">预设情绪</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(Object.keys(DEFAULT_MOODS) as (keyof typeof DEFAULT_MOODS)[]).map((mood) => {
            const config = DEFAULT_MOODS[mood];
            const MoodIcon = config.icon;
            const isSelected = currentMood === mood;

            return (
              <button
                key={mood}
                onClick={() => onSelect(mood)}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'ring-2 ring-white scale-105'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: config.color,
                }}
              >
                <MoodIcon className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-white font-bold font-inter text-sm">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* 自定义情绪 */}
        {customMoods.length > 0 && (
          <>
            <p className="text-sm text-gray-600 dark:text-white/60 mb-2 font-inter">自定义情绪</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {customMoods.map((mood) => {
                const isSelected = currentMood === mood.id;

                return (
                  <div key={mood.id} className="relative group">
                    <button
                      onClick={() => onSelect(mood.id)}
                      className={`w-full p-3 rounded-xl transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'ring-2 ring-white scale-105'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: mood.color,
                      }}
                    >
                      <span className="text-xl flex-shrink-0">{mood.icon}</span>
                      <span className="text-white font-bold font-inter text-sm truncate">{mood.label}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除"${mood.label}"吗？`)) {
                          onDeleteCustom(mood.id);
                        }
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 添加自定义情绪按钮 */}
        <button
          onClick={onAddCustom}
          className="w-full mb-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          添加自定义情绪
        </button>

        {/* 取消按钮 */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-700 dark:text-white font-medium transition-colors"
        >
          取消
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/**
 * 自定义心情表单组件
 */
interface CustomMoodFormProps {
  onSubmit: (mood: Omit<CustomMood, 'id'>) => void;
  onClose: () => void;
}

function CustomMoodForm({ onSubmit, onClose }: CustomMoodFormProps) {
  const [icon, setIcon] = useState('😊');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState('');
  const [useCustomColor, setUseCustomColor] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !icon.trim()) return;

    const finalColor = useCustomColor && customColor ? customColor : color;
    // 计算暗色版本（降低亮度）
    const darkColor = adjustColorBrightness(finalColor, -0.5);

    onSubmit({
      icon,
      label: label.trim(),
      color: finalColor,
      darkColor,
    });
  };

  // 调整颜色亮度
  const adjustColorBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 rounded-2xl border border-white/20 shadow-2xl max-w-md w-full"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-orbitron">添加自定义情绪</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 图标输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              图标（emoji）
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="😊"
              maxLength={2}
              className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white text-2xl text-center focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
              输入一个emoji表情符号
            </p>
          </div>

          {/* 名称输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              情绪名称
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如：兴奋、平和、疲惫..."
              required
              className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              颜色
            </label>

            {/* 预设颜色 */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => {
                    setColor(presetColor);
                    setUseCustomColor(false);
                  }}
                  className={`w-full aspect-square rounded-lg border-2 transition-all ${
                    color === presetColor && !useCustomColor
                      ? 'border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>

            {/* 自定义颜色 */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor || color}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setUseCustomColor(true);
                }}
                className="w-12 h-12 rounded-lg border border-gray-300 dark:border-white/20 cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-white/60">
                或选择自定义颜色
              </span>
            </div>
          </div>

          {/* 预览 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              预览
            </label>
            <div
              className="p-4 rounded-xl flex items-center justify-center gap-3"
              style={{ backgroundColor: useCustomColor && customColor ? customColor : color }}
            >
              <span className="text-2xl">{icon || '😊'}</span>
              <span className="text-white font-bold font-inter">
                {label || '情绪名称'}
              </span>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-700 dark:text-white font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium transition-all"
            >
              添加
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

/**
 * 空状态组件
 */
function EmptyState({ selectedTab, onCreateHabit }: { selectedTab: string; onCreateHabit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
        <Target className="w-10 h-10 text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-orbitron">
        {selectedTab === 'active' && '还没有活动习惯'}
        {selectedTab === 'paused' && '没有暂停的习惯'}
        {selectedTab === 'archived' && '没有归档的习惯'}
      </h3>
      <p className="text-gray-600 dark:text-white/60 font-inter mb-6">
        点击上方"创建习惯"按钮开始培养新习惯
      </p>
      {selectedTab === 'active' && (
        <button
          onClick={onCreateHabit}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          创建第一个习惯
        </button>
      )}
    </motion.div>
  );
}

/**
 * 情绪统计组件
 */
interface MoodStatisticsProps {
  statistics: Array<{
    moodId: string;
    count: number;
    config: {
      icon: any;
      label: string;
      color: string;
      darkColor: string;
    };
  }>;
  view: 'month' | 'year';
}

function MoodStatistics({ statistics, view }: MoodStatisticsProps) {
  const totalDays = statistics.reduce((sum, item) => sum + item.count, 0);

  if (statistics.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl p-4 h-full flex flex-col items-center justify-center">
        <Smile className="w-12 h-12 text-gray-400 dark:text-white/30 mb-2" />
        <p className="text-sm text-gray-500 dark:text-white/50 text-center">
          {view === 'month' ? '本月暂无情绪记录' : '今年暂无情绪记录'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-900 dark:text-white font-inter">
        情绪统计 ({view === 'month' ? '本月' : '今年'})
      </h4>

      {statistics.map((item) => {
        const MoodIcon = item.config.icon;
        const percentage = totalDays > 0 ? Math.round((item.count / totalDays) * 100) : 0;

        return (
          <div key={item.moodId} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {typeof MoodIcon === 'function' ? (
                  <MoodIcon />
                ) : (
                  <MoodIcon className="w-4 h-4" style={{ color: item.config.color }} />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                  {item.config.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-white/60 font-mono">
                  {item.count}天
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                  {percentage}%
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: item.config.color }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        );
      })}

      <div className="pt-2 mt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-white/60">总计记录</span>
          <span className="font-bold text-gray-900 dark:text-white font-mono">{totalDays} 天</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 月视图日历组件
 */
interface MonthCalendarViewProps {
  monthDays: Date[];
  dailyMoods: Record<string, MoodType>;
  checkIn: any;
  formatLocalDate: (date: Date) => string;
  isCheckedInDate: (date: Date) => boolean;
  isTodayDate: (date: Date) => boolean;
  getMoodConfig: (moodId: MoodType) => any;
  setShowMoodPicker: (date: string | null) => void;
  showMoodPicker: string | null;
  customMoods: CustomMood[];
  setDailyMoods: React.Dispatch<React.SetStateAction<Record<string, MoodType>>>;
  setShowCustomMoodForm: (show: boolean) => void;
  deleteCustomMood: (id: string) => void;
}

function MonthCalendarView({
  monthDays,
  dailyMoods,
  formatLocalDate,
  isCheckedInDate,
  isTodayDate,
  getMoodConfig,
  setShowMoodPicker,
  showMoodPicker,
  customMoods,
  setDailyMoods,
  setShowCustomMoodForm,
  deleteCustomMood,
}: MonthCalendarViewProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* 星期标题 */}
      {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
        <div key={day} className="text-center p-1 text-gray-500 dark:text-white/40 font-inter text-xs">
          {day}
        </div>
      ))}

      {/* 空白占位 */}
      {monthDays.length > 0 &&
        Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="p-1" />
        ))}

      {/* 日期 */}
      {monthDays.map((date) => {
        const dateStr = formatLocalDate(date);
        const checked = isCheckedInDate(date);
        const today = isTodayDate(date);
        const isFuture = date > new Date();
        const mood = dailyMoods[dateStr];
        const hasMood = !!mood;

        let bgColor = '';
        let MoodIcon: any = null;

        if (hasMood) {
          const moodConfig = getMoodConfig(mood);
          const moodColor = moodConfig.color;
          const moodDarkColor = moodConfig.darkColor;
          if (checked) {
            bgColor = moodColor;
          } else {
            bgColor = moodDarkColor;
          }
          MoodIcon = typeof moodConfig.icon === 'function' ? moodConfig.icon : moodConfig.icon;
        } else if (checked) {
          bgColor = '#10b981';
        }

        return (
          <motion.div
            key={date.toISOString()}
            whileHover={!isFuture ? { scale: 1.1 } : {}}
            onClick={() => {
              if (!isFuture) {
                setShowMoodPicker(showMoodPicker === dateStr ? null : dateStr);
              }
            }}
            className={`
              relative aspect-square rounded-lg flex items-center justify-center text-xs font-mono
              transition-all duration-200 cursor-pointer
              ${isFuture
                ? 'bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                : hasMood || checked
                ? `text-white font-bold shadow-md ${!checked ? 'opacity-60' : ''}`
                : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
              }
              ${today ? 'ring-2 ring-cyan-500 dark:ring-cyan-400 ring-offset-1 ring-offset-gray-100 dark:ring-offset-gray-900' : ''}
            `}
            style={bgColor ? { backgroundColor: bgColor } : {}}
          >
            {checked && (
              <Check className="absolute top-0.5 right-0.5 w-2 h-2 text-white" />
            )}
            {hasMood && !checked && (
              <div className="absolute inset-0 bg-black/30 rounded-lg" />
            )}
            {hasMood && MoodIcon && (
              <div className="absolute top-0.5 left-0.5">
                {typeof MoodIcon === 'function' ? (
                  <MoodIcon />
                ) : (
                  <MoodIcon className="w-2 h-2 text-white" />
                )}
              </div>
            )}
            {isFuture && (
              <Lock className="absolute top-0.5 right-0.5 w-2 h-2 text-gray-400 dark:text-white/30" />
            )}
            <span className="relative z-10">{date.getDate()}</span>

            {showMoodPicker === dateStr && !isFuture && (
              <MoodPicker
                currentMood={mood}
                customMoods={customMoods}
                onSelect={(selectedMood) => {
                  setDailyMoods((prev) => ({
                    ...prev,
                    [dateStr]: selectedMood,
                  }));
                  setShowMoodPicker(null);
                }}
                onClose={() => setShowMoodPicker(null)}
                onAddCustom={() => {
                  setShowMoodPicker(null);
                  setShowCustomMoodForm(true);
                }}
                onDeleteCustom={deleteCustomMood}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * 年视图日历组件
 */
interface YearCalendarViewProps {
  getYearMonths: () => Array<{ name: string; days: Date[] }>;
  dailyMoods: Record<string, MoodType>;
  checkIn: any;
  formatLocalDate: (date: Date) => string;
  isCheckedInDate: (date: Date) => boolean;
  isTodayDate: (date: Date) => boolean;
  getMoodConfig: (moodId: MoodType) => any;
}

function YearCalendarView({
  getYearMonths,
  dailyMoods,
  formatLocalDate,
  isCheckedInDate,
  isTodayDate,
  getMoodConfig,
}: YearCalendarViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {getYearMonths().map((monthData) => (
        <div key={monthData.name} className="bg-white/5 rounded-lg p-2">
          <p className="text-xs font-bold text-gray-900 dark:text-white mb-1 text-center">
            {monthData.name}
          </p>
          <div className="grid grid-cols-7 gap-0.5">
            {/* 空白占位 */}
            {monthData.days.length > 0 &&
              Array.from({ length: monthData.days[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
            {/* 日期 */}
            {monthData.days.map((date) => {
              const dateStr = formatLocalDate(date);
              const checked = isCheckedInDate(date);
              const today = isTodayDate(date);
              const isFuture = date > new Date();
              const mood = dailyMoods[dateStr];
              const hasMood = !!mood;

              let bgColor = '';
              if (hasMood) {
                const moodConfig = getMoodConfig(mood);
                bgColor = checked ? moodConfig.color : moodConfig.darkColor;
              } else if (checked) {
                bgColor = '#10b981';
              }

              return (
                <div
                  key={date.toISOString()}
                  className={`
                    aspect-square rounded flex items-center justify-center text-[0.5rem] font-mono
                    ${isFuture
                      ? 'bg-white/5 text-gray-400 dark:text-white/30'
                      : hasMood || checked
                      ? `text-white ${!checked ? 'opacity-60' : ''}`
                      : 'bg-white/5 text-gray-600 dark:text-white/60'
                    }
                    ${today ? 'ring-1 ring-cyan-500' : ''}
                  `}
                  style={bgColor ? { backgroundColor: bgColor } : {}}
                  title={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
