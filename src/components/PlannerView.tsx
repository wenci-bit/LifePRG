/**
 * PlannerView - 计划视图组件
 *
 * 支持日/周/月/年四种视图模式
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Filter,
  Clock, Tag, Flag, CheckCircle2, Circle, MoreVertical,
  Brain, Heart, BarChart, Lightbulb, X
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { Quest } from '@/types/game';
import { QuestStatus } from '@/types/game';
import {
  formatLocalDate, formatTime, formatDateTime, getWeekDays, getMonthDays,
  isToday, isSameDay, getWeekDayName, getMonthName, getDayRange,
  getWeekRange, getMonthRange, isDateInRange, getConsecutiveDays
} from '@/utils/dateUtils';
import { getPriorityConfig, getTagConfig } from '@/data/questConfig';
import QuestFormModal from './QuestFormModal';
import TaskActionMenu from './TaskActionMenu';
import TaskDetailModal from './TaskDetailModal';

type ViewMode = 'category' | 'day' | 'week' | 'month' | 'year';

export default function PlannerView() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false);
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  // 创建任务的初始值
  const [initialStartDate, setInitialStartDate] = useState<string>('');
  const [initialStartTime, setInitialStartTime] = useState<string>('');

  // 周视图天数设置（提升到主组件以便在标题中使用）
  const [weekViewDays, setWeekViewDays] = useState(7);

  const quests = useGameStore((state) => state.quests);
  const updateQuestProgress = useGameStore((state) => state.updateQuestProgress);
  const completeQuest = useGameStore((state) => state.completeQuest);
  const updateQuest = useGameStore((state) => state.updateQuest);

  // 过滤任务
  const filteredQuests = useMemo(() => {
    // 默认显示已完成的任务（灰色），但不显示已放弃的任务
    let filtered = quests.filter(q =>
      showCompleted ? true : q.status !== QuestStatus.FAILED
    );

    // category 模式下不按日期过滤，直接返回
    if (viewMode === 'category') {
      return filtered;
    }

    // 根据视图模式过滤任务
    const today = new Date();
    let range: { start: Date; end: Date };

    switch (viewMode) {
      case 'day':
        range = getDayRange(currentDate);
        break;
      case 'week':
        // 使用自定义天数的范围
        const weekDays = getConsecutiveDays(currentDate, weekViewDays);
        if (weekDays.length > 0) {
          range = {
            start: new Date(weekDays[0]),
            end: new Date(weekDays[weekDays.length - 1])
          };
          range.start.setHours(0, 0, 0, 0);
          range.end.setHours(23, 59, 59, 999);
        } else {
          range = getWeekRange(currentDate);
        }
        break;
      case 'month':
        range = getMonthRange(currentDate);
        break;
      case 'year':
        range = {
          start: new Date(currentDate.getFullYear(), 0, 1),
          end: new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59)
        };
        break;
      default:
        // 默认使用当天范围
        range = getDayRange(currentDate);
        break;
    }

    filtered = filtered.filter(q => {
      if (q.startDate && q.endDate) {
        const qStart = new Date(q.startDate);
        const qEnd = new Date(q.endDate);
        return isDateInRange(qStart, range.start, range.end) ||
               isDateInRange(qEnd, range.start, range.end) ||
               (qStart <= range.start && qEnd >= range.end);
      }
      if (q.startDate) {
        return isDateInRange(new Date(q.startDate), range.start, range.end);
      }
      if (q.deadline) {
        return isDateInRange(new Date(q.deadline), range.start, range.end);
      }
      return true; // 没有日期的任务总是显示
    });

    return filtered;
  }, [quests, viewMode, currentDate, showCompleted, weekViewDays]);

  // 导航函数
  const navigatePrev = () => {
    // category 模式下不需要导航
    if (viewMode === 'category') return;

    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 1); // 改为切换一天
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    // category 模式下不需要导航
    if (viewMode === 'category') return;

    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 1); // 改为切换一天
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // 处理点击时间轴创建任务
  const handleTimelineClick = (date: Date, hour: number, minute: number = 0) => {
    const clickDate = new Date(date);
    clickDate.setHours(0, 0, 0, 0);

    // 设置日期和时间
    setInitialStartDate(formatLocalDate(clickDate));
    setInitialStartTime(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);

    // 打开任务创建表单
    setShowQuestForm(true);
  };

  // 获取当前视图标题
  const getViewTitle = () => {
    switch (viewMode) {
      case 'category':
        return '分类视图';
      case 'day':
        return formatLocalDate(currentDate);
      case 'week':
        // 使用当前日期作为起点，显示实际的日期范围
        const weekDays = getConsecutiveDays(currentDate, weekViewDays);
        if (weekDays.length > 0) {
          const start = weekDays[0];
          const end = weekDays[weekDays.length - 1];
          return `${formatLocalDate(start)} - ${formatLocalDate(end)}`;
        }
        return formatLocalDate(currentDate);
      case 'month':
        return `${currentDate.getFullYear()}年 ${getMonthName(currentDate.getMonth())}`;
      case 'year':
        return `${currentDate.getFullYear()}年`;
      default:
        return '计划视图';
    }
  };

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* 左侧：视图切换 */}
          <div className="flex items-center gap-2">
            {(['category', 'day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-inter transition-all ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                    : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                }`}
              >
                {mode === 'category' && '分类'}
                {mode === 'day' && '日'}
                {mode === 'week' && '周'}
                {mode === 'month' && '月'}
                {mode === 'year' && '年'}
              </button>
            ))}
          </div>

          {/* 中间：日期导航 */}
          <div className="flex items-center gap-3">
            <button
              onClick={navigatePrev}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>

            <div className="px-4 py-2 min-w-[200px] text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white font-orbitron">
                {getViewTitle()}
              </p>
            </div>

            <button
              onClick={navigateNext}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>

            <button
              onClick={navigateToday}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-900 dark:text-white font-inter transition-colors"
            >
              今天
            </button>
          </div>

          {/* 右侧：筛选和创建 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`p-2 rounded-lg transition-colors ${
                showCompleted ? 'bg-cyber-cyan text-white' : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
              }`}
              title={showCompleted ? '隐藏已完成' : '显示已完成'}
            >
              <Filter className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowQuestForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-inter hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              新建任务
            </button>
          </div>
        </div>
      </div>

      {/* 任务创建/编辑表单 */}
      <QuestFormModal
        isOpen={showQuestForm || editingQuest !== null}
        onClose={() => {
          setShowQuestForm(false);
          setEditingQuest(null);
          setInitialStartDate('');
          setInitialStartTime('');
        }}
        editQuest={editingQuest}
        initialStartDate={initialStartDate}
        initialStartTime={initialStartTime}
      />

      {/* 视图内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'category' && <CategoryView quests={quests} onEditQuest={setEditingQuest} />}
          {viewMode === 'day' && <DayView date={currentDate} quests={filteredQuests} onEditQuest={setEditingQuest} updateQuest={updateQuest} onTimelineClick={handleTimelineClick} />}
          {viewMode === 'week' && <WeekView date={currentDate} quests={filteredQuests} onEditQuest={setEditingQuest} updateQuest={updateQuest} numDays={weekViewDays} setNumDays={setWeekViewDays} onTimelineClick={handleTimelineClick} />}
          {viewMode === 'month' && <MonthView date={currentDate} quests={filteredQuests} onEditQuest={setEditingQuest} />}
          {viewMode === 'year' && <YearView date={currentDate} quests={filteredQuests} onEditQuest={setEditingQuest} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// 日视图
function DayView({ date, quests, onEditQuest, updateQuest, onTimelineClick }: {
  date: Date;
  quests: Quest[];
  onEditQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  onTimelineClick: (date: Date, hour: number, minute: number) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 80; // 每小时的像素高度

  // 获取所有任务（不过滤）用于显示重点任务
  const allQuests = useGameStore((state) => state.quests);

  // 显示/隐藏重点任务的状态
  const [showWeekMilestones, setShowWeekMilestones] = useState(true);
  const [showMonthMilestones, setShowMonthMilestones] = useState(true);

  // 任务详情模态框状态
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 拖拽状态
  const [draggingQuest, setDraggingQuest] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-top' | 'resize-bottom' | null>(null);
  const [dragStartY, setDragStartY] = useState(0);

  // 辅助函数：判断任务是否为"仅日期"任务（时间为00:00-23:59）
  const isDateOnlyQuest = (quest: Quest): boolean => {
    if (!quest.startDate || !quest.endDate) return false;
    const start = new Date(quest.startDate);
    const end = new Date(quest.endDate);

    // 检查是否为00:00开始，23:59结束（允许跨天）
    return start.getHours() === 0 && start.getMinutes() === 0 &&
           end.getHours() === 23 && end.getMinutes() === 59;
  };

  // 获取当天所属周的周重点任务
  const weekMilestones = useMemo(() => {
    // 计算当天所属的周（周一到周日）
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // 筛选周重点任务
    return allQuests.filter(q => {
      if (!q.milestones?.includes('week') || q.status === QuestStatus.FAILED) return false;
      if (!q.startDate) return false;

      const taskDate = new Date(q.startDate);
      const taskEnd = q.endDate ? new Date(q.endDate) : taskDate;

      // 检查任务是否在当前周内
      return (taskDate <= weekEnd && taskEnd >= weekStart);
    });
  }, [allQuests, date]);

  // 获取当月的月重点任务
  const monthMilestones = useMemo(() => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    // 筛选月重点任务
    return allQuests.filter(q => {
      if (!q.milestones?.includes('month') || q.status === QuestStatus.FAILED) return false;
      if (!q.startDate) return false;

      const taskDate = new Date(q.startDate);
      const taskEnd = q.endDate ? new Date(q.endDate) : taskDate;

      // 检查任务是否在当前月内
      return (taskDate <= monthEnd && taskEnd >= monthStart);
    });
  }, [allQuests, date]);

  // 筛选当天的任务
  const dayQuests = useMemo(() => {
    return quests.filter(quest => {
      if (!quest.startDate) return false;
      return isSameDay(new Date(quest.startDate), date);
    });
  }, [quests, date]);

  // 分离仅日期任务和时间轴任务
  const { dateOnlyQuests, timelineQuests } = useMemo(() => {
    const dateOnly: Quest[] = [];
    const timeline: Quest[] = [];

    dayQuests.forEach(quest => {
      if (isDateOnlyQuest(quest)) {
        dateOnly.push(quest);
      } else {
        timeline.push(quest);
      }
    });

    return { dateOnlyQuests: dateOnly, timelineQuests: timeline };
  }, [dayQuests]);

  // 计算任务的时间线位置（只处理时间轴任务）
  const questPositions = useMemo(() => {
    return timelineQuests.map(quest => {
      const questStart = new Date(quest.startDate!);
      const questEnd = quest.endDate ? new Date(quest.endDate) : new Date(questStart.getTime() + 60 * 60 * 1000);

      // 获取当天的起始和结束时间
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // 裁剪任务时间到当天范围内
      const displayStart = new Date(Math.max(questStart.getTime(), dayStart.getTime()));
      const displayEnd = new Date(Math.min(questEnd.getTime(), dayEnd.getTime()));

      // 计算开始时间（小时 + 分钟比例）
      const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
      const endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;

      // 计算持续时间（小时），确保在0.5-24小时之间
      const durationHours = Math.max(0.5, Math.min(24, endHour - startHour));

      // 计算top和height，确保不超出24小时范围
      const top = Math.max(0, Math.min(startHour * HOUR_HEIGHT, 23 * HOUR_HEIGHT));
      const height = Math.min(durationHours * HOUR_HEIGHT, (24 - startHour) * HOUR_HEIGHT);

      return {
        quest,
        top,
        height,
        startHour,
        durationHours,
      };
    });
  }, [timelineQuests, date]);

  // 处理重叠任务的布局（简化版：按开始时间排序，重叠的并排显示）
  const layoutTasks = useMemo(() => {
    const sorted = [...questPositions].sort((a, b) => a.startHour - b.startHour);
    const columns: typeof questPositions[] = [];

    sorted.forEach(task => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const lastInColumn = column[column.length - 1];

        // 检查是否与此列的最后一个任务重叠
        const lastEnd = lastInColumn.startHour + lastInColumn.durationHours;
        if (task.startHour >= lastEnd - 0.1) { // 允许少量重叠
          column.push(task);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([task]);
      }
    });

    // 分配宽度和左侧偏移
    const result = questPositions.map(task => {
      let columnIndex = -1;
      let totalColumns = 0;

      for (let i = 0; i < columns.length; i++) {
        if (columns[i].includes(task)) {
          columnIndex = i;

          // 找出与此任务重叠的所有列数
          const taskEnd = task.startHour + task.durationHours;
          let maxCols = 0;
          columns.forEach(col => {
            const hasOverlap = col.some(t => {
              const tEnd = t.startHour + t.durationHours;
              return !(tEnd <= task.startHour || t.startHour >= taskEnd);
            });
            if (hasOverlap) maxCols++;
          });
          totalColumns = maxCols;
          break;
        }
      }

      const widthPercent = 100 / Math.max(1, totalColumns);
      const leftPercent = widthPercent * columnIndex;

      return {
        ...task,
        width: `${widthPercent}%`,
        left: `${leftPercent}%`,
      };
    });

    return result;
  }, [questPositions]);

  // 拖拽事件处理
  const handleTaskMouseDown = (
    e: React.MouseEvent,
    quest: Quest,
    mode: 'move' | 'resize-top' | 'resize-bottom'
  ) => {
    e.stopPropagation();
    setDraggingQuest(quest.id);
    setDragMode(mode);
    setDragStartY(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingQuest || !dragMode) return;

    const quest = quests.find(q => q.id === draggingQuest);
    if (!quest || !quest.startDate || !quest.endDate) return;

    const deltaY = e.clientY - dragStartY;
    const deltaHours = deltaY / HOUR_HEIGHT;

    const startDate = new Date(quest.startDate);
    const endDate = new Date(quest.endDate);
    const duration = endDate.getTime() - startDate.getTime();

    if (dragMode === 'move') {
      // 移动整个任务
      const newStartDate = new Date(startDate.getTime() + deltaHours * 60 * 60 * 1000);
      const newEndDate = new Date(newStartDate.getTime() + duration);

      updateQuest(quest.id, {
        startDate: newStartDate.getTime(),
        endDate: newEndDate.getTime(),
      });
      setDragStartY(e.clientY);
    } else if (dragMode === 'resize-top') {
      // 调整开始时间
      const newStartDate = new Date(startDate.getTime() + deltaHours * 60 * 60 * 1000);
      if (newStartDate < endDate) {
        updateQuest(quest.id, {
          startDate: newStartDate.getTime(),
        });
        setDragStartY(e.clientY);
      }
    } else if (dragMode === 'resize-bottom') {
      // 调整结束时间
      const newEndDate = new Date(endDate.getTime() + deltaHours * 60 * 60 * 1000);
      if (newEndDate > startDate) {
        updateQuest(quest.id, {
          endDate: newEndDate.getTime(),
        });
        setDragStartY(e.clientY);
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingQuest(null);
    setDragMode(null);
    setDragStartY(0);
  };

  // 监听全局鼠标事件
  useEffect(() => {
    if (draggingQuest) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingQuest, dragMode, dragStartY]);

  // 没有指定时间的任务
  const unscheduledQuests = quests.filter(q => !q.startDate || !isSameDay(new Date(q.startDate), date));

  return (
    <div className="space-y-6">
      {/* 月重点任务 - 顶部 */}
      {showMonthMilestones && monthMilestones.length > 0 && (
        <div className="glass-card p-6 overflow-visible">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>⭐⭐</span> 本月重点任务
            </h3>
            <button
              onClick={() => setShowMonthMilestones(false)}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 text-xs font-inter transition-colors"
            >
              隐藏
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthMilestones.map(quest => (
              <div
                key={quest.id}
                onClick={() => {
                  setSelectedQuest(quest);
                  setShowDetailModal(true);
                }}
                className="p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
              >
                {/* 图标和标题 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-xl leading-none">
                    {quest.icon || '🎯'}
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white break-words flex-1">{quest.title}</p>
                </div>
                {quest.description && (
                  <p className="text-sm text-gray-600 dark:text-white/60 mb-3 break-words">{quest.description}</p>
                )}
                {quest.progress !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/60 mb-1">
                      <span>进度</span>
                      <span>{quest.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-500"
                        style={{ width: `${quest.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 如果月重点被隐藏，显示按钮来重新显示 */}
      {!showMonthMilestones && monthMilestones.length > 0 && (
        <button
          onClick={() => setShowMonthMilestones(true)}
          className="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 text-sm font-inter transition-colors"
        >
          显示本月重点任务 ({monthMilestones.length})
        </button>
      )}

      {/* 主内容区域 */}
      <div className="glass-card p-6 overflow-visible">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* 左侧：周重点任务 */}
        <div className="lg:col-span-1">
          {showWeekMilestones && weekMilestones.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-orbitron flex items-center gap-1">
                  <span>⭐</span> 周重点
                </h3>
                <button
                  onClick={() => setShowWeekMilestones(false)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 text-xs font-inter transition-colors"
                >
                  隐藏
                </button>
              </div>
              <div className="space-y-3">
                {weekMilestones.map(quest => (
                  <div
                    key={quest.id}
                    onClick={() => {
                      setSelectedQuest(quest);
                      setShowDetailModal(true);
                    }}
                    className="p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                  >
                    {/* 图标和标题 */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-lg leading-none">
                        {quest.icon || '🎯'}
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white break-words flex-1">{quest.title}</p>
                    </div>
                    {quest.description && (
                      <p className="text-xs text-gray-600 dark:text-white/60 mb-2 line-clamp-2 break-words">{quest.description}</p>
                    )}
                    {quest.progress !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/60 mb-1">
                          <span>进度</span>
                          <span>{quest.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                            style={{ width: `${quest.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showWeekMilestones && weekMilestones.length > 0 && (
            <button
              onClick={() => setShowWeekMilestones(true)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 text-sm font-inter transition-colors"
            >
              显示周重点 ({weekMilestones.length})
            </button>
          )}
        </div>

        {/* 中间：时间轴 */}
        <div className="lg:col-span-4 space-y-4">
          {/* 仅日期任务区域 */}
          {dateOnlyQuests.length > 0 && (
            <div className="pb-4 border-b border-white/10">
              <h4 className="text-sm font-bold text-gray-700 dark:text-white/80 mb-3 font-inter">全天事项</h4>
              <div className="space-y-2">
                {dateOnlyQuests.map(quest => {
                  const isCompleted = quest.status === QuestStatus.COMPLETED;
                  const isFailed = quest.status === QuestStatus.FAILED;

                  return (
                    <div
                      key={quest.id}
                      className={`p-3 rounded-lg border-l-4 bg-white/5 hover:bg-white/10 transition-all overflow-hidden ${
                        isCompleted ? 'opacity-60' : isFailed ? 'opacity-40' : ''
                      }`}
                      style={{
                        borderLeftColor: quest.color || '#3b82f6',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-sm font-bold break-words ${
                            isCompleted ? 'text-gray-500 dark:text-white/50 line-through' :
                            isFailed ? 'text-gray-600 dark:text-white/40 line-through' :
                            'text-gray-900 dark:text-white'
                          }`}>{quest.title}</p>
                          {quest.description && (
                            <p className="text-xs text-gray-600 dark:text-white/60 mt-1 line-clamp-1 break-words">{quest.description}</p>
                          )}
                        </div>
                        <TaskActionMenu quest={quest} onEdit={() => onEditQuest(quest)} compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 时间轴 */}
          <div className="relative">
            {/* 小时刻度 */}
            <div className="flex">
              <div className="w-16 flex-shrink-0" />
              <div className="flex-1 relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-b border-white/10 cursor-pointer hover:bg-cyber-cyan/5 transition-colors"
                    style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                    onClick={(e) => {
                      // 计算点击位置对应的分钟数
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickY = e.clientY - rect.top;
                      const minute = Math.floor((clickY / HOUR_HEIGHT) * 60);
                      onTimelineClick(date, hour, minute);
                    }}
                    title="点击创建任务"
                  >
                    <div className="absolute -left-16 -top-3 w-16 text-right pr-2 text-sm text-gray-500 dark:text-white/40 font-mono pointer-events-none">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  </div>
                ))}

                {/* 任务条 */}
                {layoutTasks.map(({ quest, top, height, width, left }) => {
                  const isCompleted = quest.status === QuestStatus.COMPLETED;
                  const isFailed = quest.status === QuestStatus.FAILED;

                  return (
                    <div
                      key={quest.id}
                      className="absolute overflow-visible"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        width,
                        left,
                        minHeight: '30px',
                        opacity: isCompleted ? 0.6 : isFailed ? 0.4 : 1,
                      }}
                    >
                      {/* 拖拽调整区域 - 上边界 */}
                      <div
                        className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize z-10 hover:bg-white/20 transition-colors rounded-t-lg"
                        onMouseDown={(e) => handleTaskMouseDown(e, quest, 'resize-top')}
                      />

                      {/* 拖拽调整区域 - 下边界 */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize z-10 hover:bg-white/20 transition-colors rounded-b-lg"
                        onMouseDown={(e) => handleTaskMouseDown(e, quest, 'resize-bottom')}
                      />

                      {/* 任务主体 - 可拖拽移动 */}
                      <div
                        className="h-full p-2 border-l-4 hover:brightness-110 transition-all cursor-move rounded-lg overflow-visible"
                        style={{
                          backgroundColor: `${quest.color || '#3b82f6'}20`,
                          borderLeftColor: quest.color || '#3b82f6',
                          opacity: draggingQuest === quest.id ? 0.5 : 1,
                        }}
                        onMouseDown={(e) => handleTaskMouseDown(e, quest, 'move')}
                      >
                        <div className="flex items-start justify-between gap-1 h-full">
                          <div className="flex-1 overflow-hidden">
                            <p className={`text-xs font-bold truncate ${
                              isCompleted ? 'text-gray-500 dark:text-white/50 line-through' :
                              isFailed ? 'text-gray-600 dark:text-white/40 line-through' :
                              'text-gray-900 dark:text-white'
                            }`}>{quest.title}</p>
                            {quest.startDate && quest.endDate && (
                              <p className="text-xs text-gray-600 dark:text-white/60 truncate">
                                {formatTime(quest.startDate)} - {formatTime(quest.endDate)}
                              </p>
                            )}
                          </div>
                          <TaskActionMenu quest={quest} onEdit={() => onEditQuest(quest)} compact />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：未安排时间的任务 */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-orbitron">未安排</h3>
          <div className="space-y-2">
            {unscheduledQuests.map(quest => (
              <TaskCard key={quest.id} quest={quest} compact onEdit={() => onEditQuest(quest)} />
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* 任务详情模态框 */}
      <TaskDetailModal
        quest={selectedQuest}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedQuest(null);
        }}
        onEdit={() => {
          setShowDetailModal(false);
          if (selectedQuest) {
            onEditQuest(selectedQuest);
          }
        }}
      />
    </div>
  );
}

// 周视图 - 简化时间轴样式
function WeekView({ date, quests, onEditQuest, updateQuest, numDays, setNumDays, onTimelineClick }: {
  date: Date;
  quests: Quest[];
  onEditQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  numDays: number;
  setNumDays: (days: number) => void;
  onTimelineClick: (date: Date, hour: number, minute: number) => void;
}) {
  const HOUR_HEIGHT = 30; // 每小时的像素高度（进一步缩小）

  // 获取所有任务（不过滤）用于显示周重点
  const allQuests = useGameStore((state) => state.quests);

  // 显示/隐藏周重点任务的状态
  const [showWeekMilestones, setShowWeekMilestones] = useState(true);

  // 任务详情模态框状态
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 天数自定义输入
  const [customDays, setCustomDays] = useState('');
  const [showDaysSettings, setShowDaysSettings] = useState(false);

  // 生成日期列表
  const weekDays = useMemo(() => {
    return getConsecutiveDays(date, numDays);
  }, [date, numDays]);

  // 时间隐藏设置 - 默认隐藏凌晨0-6点
  const [hideStartHour, setHideStartHour] = useState(0);
  const [hideEndHour, setHideEndHour] = useState(6);
  const [showTimeSettings, setShowTimeSettings] = useState(false);

  // 拖拽状态
  const [draggingQuest, setDraggingQuest] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-top' | 'resize-bottom' | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [currentDay, setCurrentDay] = useState<Date | null>(null);

  // 辅助函数：判断任务是否为"仅日期"任务（时间为00:00-23:59）
  const isDateOnlyQuest = (quest: Quest): boolean => {
    if (!quest.startDate || !quest.endDate) return false;
    const start = new Date(quest.startDate);
    const end = new Date(quest.endDate);

    // 检查是否为00:00开始，23:59结束（允许跨天）
    return start.getHours() === 0 && start.getMinutes() === 0 &&
           end.getHours() === 23 && end.getMinutes() === 59;
  };

  // 计算可见的小时范围
  const visibleHours = useMemo(() => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      if (i < hideStartHour || i >= hideEndHour) {
        hours.push(i);
      }
    }
    return hours;
  }, [hideStartHour, hideEndHour]);

  // 拖拽事件处理
  const handleTaskMouseDown = (
    e: React.MouseEvent,
    quest: Quest,
    mode: 'move' | 'resize-top' | 'resize-bottom',
    day: Date
  ) => {
    e.stopPropagation();
    setDraggingQuest(quest.id);
    setDragMode(mode);
    setDragStartY(e.clientY);
    setCurrentDay(day);
    if (mode === 'move') {
      setDragStartDate(quest.startDate ? new Date(quest.startDate) : null);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingQuest || !dragMode || !currentDay) return;

    const quest = quests.find(q => q.id === draggingQuest);
    if (!quest || !quest.startDate || !quest.endDate) return;

    const deltaY = e.clientY - dragStartY;
    const deltaHours = deltaY / HOUR_HEIGHT;

    const startDate = new Date(quest.startDate);
    const endDate = new Date(quest.endDate);
    const duration = endDate.getTime() - startDate.getTime();

    if (dragMode === 'move') {
      // 移动整个任务
      const newStartDate = new Date(startDate.getTime() + deltaHours * 60 * 60 * 1000);
      const newEndDate = new Date(newStartDate.getTime() + duration);

      updateQuest(quest.id, {
        startDate: newStartDate.getTime(),
        endDate: newEndDate.getTime(),
      });
      setDragStartY(e.clientY);
    } else if (dragMode === 'resize-top') {
      // 调整开始时间
      const newStartDate = new Date(startDate.getTime() + deltaHours * 60 * 60 * 1000);
      if (newStartDate < endDate) {
        updateQuest(quest.id, {
          startDate: newStartDate.getTime(),
        });
        setDragStartY(e.clientY);
      }
    } else if (dragMode === 'resize-bottom') {
      // 调整结束时间
      const newEndDate = new Date(endDate.getTime() + deltaHours * 60 * 60 * 1000);
      if (newEndDate > startDate) {
        updateQuest(quest.id, {
          endDate: newEndDate.getTime(),
        });
        setDragStartY(e.clientY);
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingQuest(null);
    setDragMode(null);
    setDragStartY(0);
    setCurrentDay(null);
  };

  // 监听全局鼠标事件
  useEffect(() => {
    if (draggingQuest) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingQuest, dragMode, dragStartY, currentDay]);

  // 按日期分组任务并计算位置（包含重叠处理）
  const questsByDay = useMemo(() => {
    const timelineResult: { [dateStr: string]: any[] } = {};
    const dateOnlyResult: { [dateStr: string]: Quest[] } = {};

    weekDays.forEach(day => {
      const dateStr = formatLocalDate(day);
      const dayQuests = quests.filter(quest => {
        if (!quest.startDate) return false;

        const startDate = new Date(quest.startDate);
        const endDate = quest.endDate ? new Date(quest.endDate) : startDate;

        // 检查任务是否在这一天（包括跨天任务）
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        // 任务的时间段与当天有交集
        return startDate <= dayEnd && endDate >= dayStart;
      });

      // 分离仅日期任务和时间轴任务
      const dateOnlyQuests: Quest[] = [];
      const timelineQuests: Quest[] = [];

      dayQuests.forEach(quest => {
        if (isDateOnlyQuest(quest)) {
          dateOnlyQuests.push(quest);
        } else {
          timelineQuests.push(quest);
        }
      });

      // 保存仅日期任务
      dateOnlyResult[dateStr] = dateOnlyQuests;

      // 计算每个时间轴任务的位置和时间
      const questPositions = timelineQuests.map(quest => {
        const questStart = new Date(quest.startDate!);
        const questEnd = quest.endDate ? new Date(quest.endDate) : new Date(questStart.getTime() + 60 * 60 * 1000);

        // 计算在当前这一天显示的起始和结束时间
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        // 当天显示的实际起始时间（取任务开始时间和当天0点的较晚者）
        const displayStart = new Date(Math.max(questStart.getTime(), dayStart.getTime()));
        // 当天显示的实际结束时间（取任务结束时间和当天23:59的较早者）
        const displayEnd = new Date(Math.min(questEnd.getTime(), dayEnd.getTime()));

        const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
        const endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;
        const durationHours = Math.max(0.5, endHour - startHour);

        // 计算调整后的top位置（考虑隐藏的时间）
        let adjustedStartHour = startHour;
        if (startHour >= hideEndHour) {
          adjustedStartHour = startHour - (hideEndHour - hideStartHour);
        } else if (startHour < hideStartHour) {
          adjustedStartHour = startHour;
        }

        return {
          quest,
          top: adjustedStartHour * HOUR_HEIGHT,
          height: durationHours * HOUR_HEIGHT,
          startHour,
          endHour: startHour + durationHours,
        };
      });

      // 处理重叠布局
      const sorted = [...questPositions].sort((a, b) => a.startHour - b.startHour);
      const columns: typeof questPositions[] = [];

      sorted.forEach(task => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          const lastInColumn = column[column.length - 1];

          if (task.startHour >= lastInColumn.endHour - 0.1) {
            column.push(task);
            placed = true;
            break;
          }
        }

        if (!placed) {
          columns.push([task]);
        }
      });

      // 分配宽度和左侧偏移
      timelineResult[dateStr] = questPositions.map(task => {
        let columnIndex = -1;
        let totalColumns = 0;

        for (let i = 0; i < columns.length; i++) {
          if (columns[i].includes(task)) {
            columnIndex = i;

            let maxCols = 0;
            columns.forEach(col => {
              const hasOverlap = col.some(t => {
                return !(t.endHour <= task.startHour || t.startHour >= task.endHour);
              });
              if (hasOverlap) maxCols++;
            });
            totalColumns = maxCols;
            break;
          }
        }

        const widthPercent = 100 / Math.max(1, totalColumns);
        const leftPercent = widthPercent * columnIndex;

        return {
          ...task,
          width: `${widthPercent}%`,
          left: `${leftPercent}%`,
        };
      });
    });

    return { timelineQuests: timelineResult, dateOnlyQuests: dateOnlyResult };
  }, [quests, weekDays, hideStartHour, hideEndHour]);

  // 获取当前视图范围内的周重点任务
  const weekMilestonesGrouped = useMemo(() => {
    if (weekDays.length === 0) return {};

    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];

    // 获取所有包含 'week' 标签的任务（使用未过滤的所有任务）
    const weekTasks = allQuests.filter(q =>
      q.milestones?.includes('week') && q.status !== QuestStatus.FAILED
    );

    // 按周分组
    const grouped: { [weekKey: string]: { label: string; tasks: Quest[] } } = {};

    weekTasks.forEach(quest => {
      if (!quest.startDate) return;

      const taskDate = new Date(quest.startDate);
      const taskEnd = quest.endDate ? new Date(quest.endDate) : taskDate;

      // 检查任务是否在当前视图范围内
      const viewStart = new Date(firstDay);
      viewStart.setHours(0, 0, 0, 0);
      const viewEnd = new Date(lastDay);
      viewEnd.setHours(23, 59, 59, 999);

      if (taskEnd < viewStart || taskDate > viewEnd) return; // 任务不在视图范围内

      // 计算任务所属的周（以周一为起始）
      const weekStart = new Date(taskDate);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekKey = formatLocalDate(weekStart);

      if (!grouped[weekKey]) {
        // 生成周标签
        const weekEndFormatted = formatLocalDate(weekEnd);
        grouped[weekKey] = {
          label: `${formatLocalDate(weekStart)} - ${weekEndFormatted}`,
          tasks: []
        };
      }

      grouped[weekKey].tasks.push(quest);
    });

    return grouped;
  }, [allQuests, weekDays]);

  return (
    <div className="space-y-6">
      {/* 周重点任务 */}
      {showWeekMilestones && Object.keys(weekMilestonesGrouped).length > 0 && (
        <div className="glass-card p-6 overflow-visible space-y-6">
          {Object.entries(weekMilestonesGrouped).map(([weekKey, { label, tasks }]) => (
            <div key={weekKey}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>⭐</span> {label} 重点任务
                </h3>
                <button
                  onClick={() => setShowWeekMilestones(false)}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 text-xs font-inter transition-colors"
                >
                  隐藏
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map(quest => {
                  const isCompleted = quest.status === QuestStatus.COMPLETED;
                  return (
                    <div
                      key={quest.id}
                      onClick={() => {
                        setSelectedQuest(quest);
                        setShowDetailModal(true);
                      }}
                      className={`p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 overflow-hidden cursor-pointer hover:brightness-110 transition-all ${
                        isCompleted ? 'opacity-60' : ''
                      }`}
                    >
                      {/* 图标和标题 */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-xl leading-none">
                          {quest.icon || '🎯'}
                        </div>
                        <p className={`text-base font-bold text-gray-900 dark:text-white break-words flex-1 ${
                          isCompleted ? 'line-through' : ''
                        }`}>{quest.title}</p>
                        {/* 完成标记 */}
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                      {quest.description && (
                        <p className="text-sm text-gray-600 dark:text-white/60 mb-3 break-words">{quest.description}</p>
                      )}
                      {quest.progress !== undefined && (
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/60 mb-1">
                            <span>进度</span>
                            <span>{quest.progress}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                              style={{ width: `${quest.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 如果周重点被隐藏，显示按钮来重新显示 */}
      {!showWeekMilestones && Object.keys(weekMilestonesGrouped).length > 0 && (
        <button
          onClick={() => setShowWeekMilestones(true)}
          className="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 text-sm font-inter transition-colors"
        >
          显示周重点任务 ({Object.values(weekMilestonesGrouped).reduce((sum, group) => sum + group.tasks.length, 0)})
        </button>
      )}

      {/* 周时间轴 */}
      <div className="glass-card p-6 overflow-visible">
        {/* 天数设置 */}
        <div className="mb-4">
          <button
            onClick={() => setShowDaysSettings(!showDaysSettings)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-700 dark:text-white/80 font-inter text-sm transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {showDaysSettings ? '隐藏天数设置' : `显示天数设置 (当前: ${numDays}天)`}
          </button>

          {showDaysSettings && (
            <div className="mt-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-700 dark:text-white/80 mb-3 font-inter">选择显示天数</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {[3, 5, 7, 14].map((days) => (
                  <button
                    key={days}
                    onClick={() => setNumDays(days)}
                    className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                      numDays === days
                        ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                        : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {days}天
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="自定义天数"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyber-cyan"
                />
                <button
                  onClick={() => {
                    const days = parseInt(customDays);
                    if (days > 0 && days <= 30) {
                      setNumDays(days);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-cyber-cyan text-white font-inter text-sm hover:bg-cyber-cyan/80 transition-colors"
                >
                  应用
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/60 mt-2">
                可输入1-30之间的任意天数
              </p>
            </div>
          )}
        </div>

        {/* 时间隐藏设置 */}
        <div className="mb-4">
          <button
            onClick={() => setShowTimeSettings(!showTimeSettings)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-700 dark:text-white/80 font-inter text-sm transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {showTimeSettings ? '隐藏时间设置' : '显示时间设置'}
          </button>

          {showTimeSettings && (
            <div className="mt-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-700 dark:text-white/80 mb-3 font-inter">隐藏时间段（例如：深夜到凌晨）</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-white/60 mb-1">从</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hideStartHour}
                    onChange={(e) => setHideStartHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyber-cyan"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/40 mt-1">{hideStartHour}:00</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-white/60 mb-1">到</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hideEndHour}
                    onChange={(e) => setHideEndHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyber-cyan"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/40 mt-1">{hideEndHour}:00</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/60 mt-2">
                {hideEndHour > hideStartHour ? `将隐藏 ${hideStartHour}:00 - ${hideEndHour}:00 的时间段` : '无效的时间范围'}
              </p>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div>
            {/* 星期标题行 */}
            <div className="flex gap-2 mb-4">
              {/* 左侧空白占位，对齐时间刻度 */}
              <div className="w-16 flex-shrink-0" />

              {/* 日期标题 */}
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                {weekDays.map(day => {
                  const dateStr = formatLocalDate(day);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={dateStr}
                      className={`text-center p-3 rounded-lg ${
                        isCurrentDay ? 'bg-cyber-cyan/20 border border-cyber-cyan/50' : 'bg-white/5'
                      }`}
                    >
                      <p className="text-xs text-gray-600 dark:text-white/60 font-inter">{getWeekDayName(day.getDay())}</p>
                      <p className={`text-2xl font-bold font-mono ${
                        isCurrentDay ? 'text-cyber-cyan' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 全天事项区域 */}
            <div className="flex gap-2 mb-4">
              {/* 左侧标签 */}
              <div className="w-16 flex-shrink-0 flex items-start pt-1">
                <p className="text-xs text-gray-600 dark:text-white/60 font-inter transform -rotate-0 text-right">全天</p>
              </div>

              {/* 7天的全天事项 */}
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                {weekDays.map(day => {
                  const dateStr = formatLocalDate(day);
                  const dateOnlyTasks = questsByDay.dateOnlyQuests[dateStr] || [];
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={`date-only-${dateStr}`}
                      className={`min-h-[40px] p-2 rounded-lg border ${
                        isCurrentDay ? 'bg-cyber-cyan/5 border-cyber-cyan/30' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        {dateOnlyTasks.map(quest => {
                          const isCompleted = quest.status === QuestStatus.COMPLETED;
                          const isFailed = quest.status === QuestStatus.FAILED;

                          return (
                            <div
                              key={quest.id}
                              className={`px-2 py-1 rounded border-l-4 bg-white/5 hover:bg-white/10 transition-all text-xs overflow-hidden ${
                                isCompleted ? 'opacity-60' : isFailed ? 'opacity-40' : ''
                              }`}
                              style={{ borderLeftColor: quest.color || '#3b82f6' }}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <p className={`truncate flex-1 font-medium ${
                                  isCompleted ? 'text-gray-500 dark:text-white/50 line-through' :
                                  isFailed ? 'text-gray-600 dark:text-white/40 line-through' :
                                  'text-gray-900 dark:text-white'
                                }`}>
                                  {quest.title}
                                </p>
                                <TaskActionMenu quest={quest} onEdit={() => onEditQuest(quest)} compact />
                              </div>
                            </div>
                          );
                        })}
                        {dateOnlyTasks.length === 0 && (
                          <p className="text-center text-gray-400 dark:text-white/40 text-xs py-1">-</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 时间轴任务列 */}
            <div className="flex gap-2">
              {/* 左侧时间刻度 */}
              <div className="w-16 flex-shrink-0" style={{ height: `${visibleHours.length * HOUR_HEIGHT}px` }}>
                {visibleHours.map((hour, index) => (
                  <div
                    key={hour}
                    className="relative"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="absolute right-2 top-0 text-xs text-gray-500 dark:text-white/40 font-mono">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 border-b border-white/10" />
                  </div>
                ))}
              </div>

              {/* 7天的时间轴任务列 */}
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))`, minHeight: `${visibleHours.length * HOUR_HEIGHT}px` }}>
                {weekDays.map(day => {
                  const dateStr = formatLocalDate(day);
                  const dayTasks = questsByDay.timelineQuests[dateStr] || [];
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={dateStr}
                      className={`relative border-l border-white/10 ${
                        isCurrentDay ? 'bg-cyber-cyan/5' : ''
                      }`}
                      style={{ height: `${visibleHours.length * HOUR_HEIGHT}px` }}
                    >
                      {/* 小时刻度线 */}
                      {visibleHours.map((hour, index) => (
                        <div
                          key={hour}
                          className="absolute w-full border-b border-white/5 cursor-pointer hover:bg-cyber-cyan/5 transition-colors"
                          style={{ top: `${index * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                          onClick={(e) => {
                            // 计算点击位置对应的分钟数
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickY = e.clientY - rect.top;
                            const minute = Math.floor((clickY / HOUR_HEIGHT) * 60);
                            onTimelineClick(day, hour, minute);
                          }}
                          title="点击创建任务"
                        />
                      ))}

                      {/* 任务条 */}
                      {dayTasks.map(({ quest, top, height, width, left }) => {
                        // 检查任务是否跨天
                        const isMultiDay = quest.startDate && quest.endDate &&
                          !isSameDay(new Date(quest.startDate), new Date(quest.endDate));
                        const isCompleted = quest.status === QuestStatus.COMPLETED;
                        const isFailed = quest.status === QuestStatus.FAILED;

                        return (
                          <div
                            key={quest.id}
                            className="absolute"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              width,
                              left,
                              minHeight: '30px',
                              opacity: isCompleted ? 0.6 : isFailed ? 0.4 : 1,
                            }}
                          >
                            {/* 拖拽调整区域 - 上边界 */}
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-10 hover:bg-white/20 transition-colors rounded-t"
                              onMouseDown={(e) => handleTaskMouseDown(e, quest, 'resize-top', day)}
                            />

                            {/* 拖拽调整区域 - 下边界 */}
                            <div
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10 hover:bg-white/20 transition-colors rounded-b"
                              onMouseDown={(e) => handleTaskMouseDown(e, quest, 'resize-bottom', day)}
                            />

                            {/* 任务主体 - 可拖拽移动 */}
                            <div
                              className="h-full rounded border-l-4 p-1.5 hover:brightness-110 transition-all cursor-move mx-0.5 overflow-visible"
                              style={{
                                backgroundColor: `${quest.color || '#3b82f6'}30`,
                                borderLeftColor: quest.color || '#3b82f6',
                                opacity: draggingQuest === quest.id ? 0.5 : 1,
                              }}
                              onMouseDown={(e) => handleTaskMouseDown(e, quest, 'move', day)}
                            >
                              <div className="flex items-start justify-between gap-1 h-full">
                                <div className="flex-1 overflow-hidden">
                                  <p className={`text-xs font-bold truncate ${
                                    isCompleted ? 'text-gray-500 dark:text-white/50 line-through' :
                                    isFailed ? 'text-gray-600 dark:text-white/40 line-through' :
                                    'text-gray-900 dark:text-white'
                                  }`}>{quest.title}</p>
                                  {quest.startDate && quest.endDate && (
                                    <p className="text-xs text-gray-600 dark:text-white/60 truncate">
                                      {isMultiDay
                                        ? `至 ${formatDateTime(new Date(quest.endDate).getTime())}`
                                        : `${formatTime(new Date(quest.startDate).getTime())}-${formatTime(new Date(quest.endDate).getTime())}`
                                      }
                                    </p>
                                  )}
                                </div>
                                <TaskActionMenu quest={quest} onEdit={() => onEditQuest(quest)} compact />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 任务详情模态框 */}
      <TaskDetailModal
        quest={selectedQuest}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedQuest(null);
        }}
        onEdit={() => {
          setShowDetailModal(false);
          if (selectedQuest) {
            onEditQuest(selectedQuest);
          }
        }}
      />
    </div>
  );
}

// 月视图
function MonthView({ date, quests, onEditQuest }: { date: Date; quests: Quest[]; onEditQuest: (quest: Quest) => void }) {
  const monthDays = getMonthDays(date);
  const firstDay = monthDays[0].getDay();

  // 显示/隐藏月重点任务的状态
  const [showMonthMilestones, setShowMonthMilestones] = useState(true);

  // 任务详情模态框状态
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 按日期分组任务
  const questsByDay = useMemo(() => {
    const grouped: { [dateStr: string]: Quest[] } = {};
    monthDays.forEach(day => {
      const dateStr = formatLocalDate(day);
      grouped[dateStr] = quests.filter(quest => {
        if (quest.startDate && quest.endDate) {
          const start = new Date(quest.startDate);
          const end = new Date(quest.endDate);
          return day >= start && day <= end;
        }
        if (quest.startDate) {
          return isSameDay(new Date(quest.startDate), day);
        }
        if (quest.deadline) {
          return isSameDay(new Date(quest.deadline), day);
        }
        return false;
      });
    });
    return grouped;
  }, [quests, monthDays]);

  // 获取月度重点任务
  const monthMilestones = quests.filter(q => q.milestones?.includes('month'));

  // 生成颜色图例
  const colorLegend = useMemo(() => {
    const colorMap: { [color: string]: { count: number; tasks: Quest[] } } = {};
    quests.forEach(quest => {
      const color = quest.color || '#3b82f6';
      if (!colorMap[color]) {
        colorMap[color] = { count: 0, tasks: [] };
      }
      colorMap[color].count++;
      if (colorMap[color].tasks.length < 3) {
        colorMap[color].tasks.push(quest);
      }
    });
    return Object.entries(colorMap).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  }, [quests]);

  return (
    <div className="space-y-6">
      {/* 月度重点任务 */}
      {showMonthMilestones && monthMilestones.length > 0 && (
        <div className="glass-card p-6 overflow-visible">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>⭐⭐</span> 本月重点任务
            </h3>
            <button
              onClick={() => setShowMonthMilestones(false)}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 text-xs font-inter transition-colors"
            >
              隐藏
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthMilestones.map(quest => (
              <div
                key={quest.id}
                onClick={() => {
                  setSelectedQuest(quest);
                  setShowDetailModal(true);
                }}
                className="p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
              >
                {/* 图标和标题 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-xl leading-none">
                    {quest.icon || '🎯'}
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white break-words flex-1">{quest.title}</p>
                </div>
                {quest.description && (
                  <p className="text-sm text-gray-600 dark:text-white/60 mb-3 break-words">{quest.description}</p>
                )}
                {quest.progress !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/60 mb-1">
                      <span>进度</span>
                      <span>{quest.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-500"
                        style={{ width: `${quest.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 如果月重点被隐藏，显示按钮来重新显示 */}
      {!showMonthMilestones && monthMilestones.length > 0 && (
        <button
          onClick={() => setShowMonthMilestones(true)}
          className="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 text-sm font-inter transition-colors"
        >
          显示本月重点任务 ({monthMilestones.length})
        </button>
      )}

      {/* 月历 */}
      <div className="glass-card p-6 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 颜色图例 */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-orbitron">颜色图例</h3>
            <div className="space-y-3">
              {colorLegend.map(([color, data]) => (
                <div key={color} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg border-2 border-white/20"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {data.count} 个任务
                      </p>
                    </div>
                  </div>
                  <div className="pl-9 space-y-1">
                    {data.tasks.map(task => (
                      <p
                        key={task.id}
                        className="text-xs text-gray-600 dark:text-white/60 truncate cursor-pointer hover:text-gray-700 dark:hover:text-white/80 transition-colors"
                        title={task.title}
                        onClick={() => onEditQuest(task)}
                      >
                        • {task.title}
                      </p>
                    ))}
                    {data.count > 3 && (
                      <p className="text-xs text-gray-500 dark:text-white/40">+{data.count - 3} 更多</p>
                    )}
                  </div>
                </div>
              ))}
              {colorLegend.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-white/60 font-inter">暂无任务</p>
              )}
            </div>
          </div>

          {/* 日历 */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-7 gap-2">
              {/* 星期标题 */}
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="text-center p-2 text-gray-600 dark:text-white/60 font-inter text-sm">
                  {day}
                </div>
              ))}

              {/* 空白占位 */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* 日期 */}
              {monthDays.map(day => {
                const dateStr = formatLocalDate(day);
                const dayQuests = questsByDay[dateStr] || [];
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square p-2 rounded-lg border ${
                      isCurrentDay
                        ? 'bg-cyber-cyan/10 border-cyber-cyan/50'
                        : 'bg-white/5 border-white/10'
                    } hover:bg-white/10 transition-colors`}
                  >
                    <p className={`text-sm font-mono mb-1 ${
                      isCurrentDay ? 'text-cyber-cyan font-bold' : 'text-gray-700 dark:text-white/80'
                    }`}>
                      {day.getDate()}
                    </p>
                    <div className="space-y-1">
                      {dayQuests.slice(0, 3).map(quest => (
                        <div
                          key={quest.id}
                          className="h-1 rounded-full"
                          style={{ backgroundColor: quest.color || '#3b82f6' }}
                          title={quest.title}
                        />
                      ))}
                      {dayQuests.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-white/40">+{dayQuests.length - 3}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 任务详情模态框 */}
      <TaskDetailModal
        quest={selectedQuest}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedQuest(null);
        }}
        onEdit={() => {
          setShowDetailModal(false);
          if (selectedQuest) {
            onEditQuest(selectedQuest);
          }
        }}
      />
    </div>
  );
}

// 年视图
function YearView({ date, quests, onEditQuest }: { date: Date; quests: Quest[]; onEditQuest: (quest: Quest) => void }) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  // 任务详情模态框状态
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 按月份分组任务
  const questsByMonth = useMemo(() => {
    const grouped: { [month: number]: Quest[] } = {};
    months.forEach(month => {
      grouped[month] = quests.filter(quest => {
        if (quest.startDate) {
          const startDate = new Date(quest.startDate);
          return startDate.getMonth() === month && startDate.getFullYear() === date.getFullYear();
        }
        return false;
      });
    });
    return grouped;
  }, [quests, months, date]);

  return (
    <div className="glass-card p-6 overflow-visible">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map(month => {
          const monthQuests = questsByMonth[month] || [];
          const yearMilestones = monthQuests.filter(q => q.milestones?.includes('year'));
          const totalCount = monthQuests.length;

          return (
            <div
              key={month}
              className="p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all border-2 border-white/10 hover:border-cyber-cyan/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter">
                  {getMonthName(month)}
                </h3>
                <span className="text-3xl font-black font-mono text-cyber-cyan">{totalCount}</span>
              </div>

              {/* 年度重点任务 */}
              {yearMilestones.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-yellow-400 font-inter flex items-center gap-1">
                    <span>⭐⭐⭐</span> 年度重点
                  </p>
                  {yearMilestones.map(quest => (
                    <div
                      key={quest.id}
                      onClick={() => {
                        setSelectedQuest(quest);
                        setShowDetailModal(true);
                      }}
                      className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 cursor-pointer hover:brightness-110 transition-all"
                    >
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{quest.title}</p>
                      {quest.progress !== undefined && (
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                            style={{ width: `${quest.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-600 dark:text-white/60">共 {totalCount} 个任务</p>
            </div>
          );
        })}
      </div>

      {/* 任务详情模态框 */}
      <TaskDetailModal
        quest={selectedQuest}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedQuest(null);
        }}
        onEdit={() => {
          setShowDetailModal(false);
          if (selectedQuest) {
            onEditQuest(selectedQuest);
          }
        }}
      />
    </div>
  );
}

// 分类视图 - 按标签分类显示任务
function CategoryView({ quests, onEditQuest }: {
  quests: Quest[];
  onEditQuest: (quest: Quest) => void;
}) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 按标签分组任务
  const questsByTag = useMemo(() => {
    const tagGroups: { [key: string]: Quest[] } = {};
    const untaggedQuests: Quest[] = [];

    quests.forEach((quest) => {
      if (!quest.tags || quest.tags.length === 0) {
        untaggedQuests.push(quest);
      } else {
        quest.tags.forEach((tag) => {
          if (!tagGroups[tag]) {
            tagGroups[tag] = [];
          }
          tagGroups[tag].push(quest);
        });
      }
    });

    return { tagGroups, untaggedQuests };
  }, [quests]);

  // 获取所有标签并排序（按任务数量）
  const sortedTags = useMemo(() => {
    return Object.keys(questsByTag.tagGroups).sort((a, b) => {
      return questsByTag.tagGroups[b].length - questsByTag.tagGroups[a].length;
    });
  }, [questsByTag]);

  // 计算各标签统计
  const tagStats = useMemo(() => {
    return sortedTags.map(tag => {
      const tagQuests = questsByTag.tagGroups[tag] || [];
      const tagConfig = getTagConfig(tag);
      const completed = tagQuests.filter(q => q.status === QuestStatus.COMPLETED).length;
      const active = tagQuests.filter(q => q.status === QuestStatus.ACTIVE).length;
      const total = tagQuests.length;

      return {
        tag,
        config: tagConfig,
        quests: tagQuests,
        completed,
        active,
        total,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    });
  }, [questsByTag, sortedTags]);

  return (
    <div className="space-y-6">
      {/* 标签统计卡片 */}
      {tagStats.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tagStats.map((tagStat, index) => (
            <motion.div
              key={tagStat.tag}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-4 hover:scale-105 transition-all cursor-pointer hover:shadow-lg hover:shadow-cyan-500/30"
              onClick={() => setSelectedTag(tagStat.tag)}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{tagStat.config.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white font-inter truncate">{tagStat.tag}</h3>
                  <p className="text-xs text-gray-400">{tagStat.total} 个任务</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-white/40">进行中</p>
                  <p className="text-lg font-bold text-cyan-400 font-mono">{tagStat.active}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-white/40">已完成</p>
                  <p className="text-lg font-bold text-green-400 font-mono">{tagStat.completed}</p>
                </div>
              </div>

              {/* 完成率进度条 */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/40 mb-1">
                  <span>完成率</span>
                  <span>{tagStat.completionRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${tagStat.completionRate}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}

          {/* 未分类任务卡片 */}
          {questsByTag.untaggedQuests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tagStats.length * 0.05 }}
              className="glass-card p-4 hover:scale-105 transition-all cursor-pointer hover:shadow-lg hover:shadow-gray-500/30"
              onClick={() => setSelectedTag('untagged')}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏷️</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white font-inter truncate">未分类</h3>
                  <p className="text-xs text-gray-400">{questsByTag.untaggedQuests.length} 个任务</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-white/40">进行中</p>
                  <p className="text-lg font-bold text-cyan-400 font-mono">
                    {questsByTag.untaggedQuests.filter(q => q.status === QuestStatus.ACTIVE).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-white/40">已完成</p>
                  <p className="text-lg font-bold text-green-400 font-mono">
                    {questsByTag.untaggedQuests.filter(q => q.status === QuestStatus.COMPLETED).length}
                  </p>
                </div>
              </div>

              {/* 完成率进度条 */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/40 mb-1">
                  <span>完成率</span>
                  <span>
                    {questsByTag.untaggedQuests.length > 0
                      ? ((questsByTag.untaggedQuests.filter(q => q.status === QuestStatus.COMPLETED).length / questsByTag.untaggedQuests.length) * 100).toFixed(0)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gray-400 to-gray-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${questsByTag.untaggedQuests.length > 0
                        ? (questsByTag.untaggedQuests.filter(q => q.status === QuestStatus.COMPLETED).length / questsByTag.untaggedQuests.length) * 100
                        : 0}%`
                    }}
                    transition={{ duration: 0.5, delay: tagStats.length * 0.05 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        /* 空状态 */
        <div className="glass-card p-12 text-center">
          <Tag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-white mb-2">暂无任务</h3>
          <p className="text-gray-400">创建任务并添加标签来组织你的工作</p>
        </div>
      )}

      {/* 标签任务详情模态框 */}
      <AnimatePresence>
        {selectedTag && (
          <TagTasksModal
            tag={selectedTag}
            tagConfig={selectedTag === 'untagged' ? { name: '未分类', icon: '🏷️', color: '#6b7280' } : getTagConfig(selectedTag)}
            quests={selectedTag === 'untagged' ? questsByTag.untaggedQuests : questsByTag.tagGroups[selectedTag] || []}
            onClose={() => setSelectedTag(null)}
            onEditQuest={onEditQuest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 标签任务详情模态框
function TagTasksModal({
  tag,
  tagConfig,
  quests,
  onClose,
  onEditQuest,
}: {
  tag: string;
  tagConfig: { name: string; icon: string; color: string };
  quests: Quest[];
  onClose: () => void;
  onEditQuest: (quest: Quest) => void;
}) {
  const completed = quests.filter(q => q.status === QuestStatus.COMPLETED).length;
  const active = quests.filter(q => q.status === QuestStatus.ACTIVE).length;
  const failed = quests.filter(q => q.status === QuestStatus.FAILED).length;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full max-h-[85vh] overflow-hidden rounded-2xl bg-white"
        style={{
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 60px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 顶部渐变装饰 */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background: `linear-gradient(90deg, ${tagConfig.color}00 0%, ${tagConfig.color} 50%, ${tagConfig.color}00 100%)`,
          }}
        />

        {/* 背景装饰光晕 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none"
          style={{ background: tagConfig.color }}
        />

        <div className="relative p-6 flex flex-col max-h-[85vh]">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${tagConfig.color}20, ${tagConfig.color}08)`,
                  border: `2px solid ${tagConfig.color}50`,
                  boxShadow: `0 4px 12px ${tagConfig.color}30`,
                }}
              >
                {tagConfig.icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 font-orbitron mb-1">
                  {tag === 'untagged' ? '未分类' : tag}
                </h2>
                <p className="text-sm text-gray-600 font-inter">共 {quests.length} 个任务</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all group"
            >
              <X className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" />
            </button>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative p-5 rounded-xl text-center overflow-hidden group cursor-default bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-cyan-700 mb-2 font-inter uppercase tracking-wider font-semibold">进行中</p>
              <p className="text-4xl font-black text-cyan-600 font-mono relative z-10">{active}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative p-5 rounded-xl text-center overflow-hidden group cursor-default bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-green-700 mb-2 font-inter uppercase tracking-wider font-semibold">已完成</p>
              <p className="text-4xl font-black text-green-600 font-mono relative z-10">{completed}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative p-5 rounded-xl text-center overflow-hidden group cursor-default bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs text-red-700 mb-2 font-inter uppercase tracking-wider font-semibold">已放弃</p>
              <p className="text-4xl font-black text-red-600 font-mono relative z-10">{failed}</p>
            </motion.div>
          </div>

          {/* 任务列表 */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {quests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Tag className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-inter">暂无任务</p>
              </div>
            ) : (
              quests.map((quest, index) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <TaskCard
                    quest={quest}
                    onEdit={() => {
                      onClose();
                      onEditQuest(quest);
                    }}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// 任务卡片组件
function TaskCard({ quest, compact = false, onEdit }: { quest: Quest; compact?: boolean; onEdit?: () => void }) {
  const priorityConfig = getPriorityConfig(quest.priority);
  const isCompleted = quest.status === QuestStatus.COMPLETED;
  const isFailed = quest.status === QuestStatus.FAILED;

  return (
    <div
      className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-white/5 border-l-4 hover:bg-white/10 transition-all ${
        isCompleted ? 'opacity-60' : ''
      } ${isFailed ? 'opacity-40 border-red-500/50' : ''}`}
      style={{ borderLeftColor: quest.color || '#3b82f6' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {quest.priority && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: `${priorityConfig.color}20`, color: priorityConfig.color }}
              >
                {priorityConfig.label}
              </span>
            )}
            {quest.tags?.map(tag => {
              const tagConfig = getTagConfig(tag);
              return (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${tagConfig.color}20`, color: tagConfig.color }}
                >
                  {tag}
                </span>
              );
            })}
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
          <p className={`text-sm font-inter ${isCompleted ? 'text-gray-400 dark:text-white/40 line-through' : isFailed ? 'text-gray-500 dark:text-white/30 line-through' : 'text-gray-900 dark:text-white'}`}>
            {quest.title}
          </p>
          {quest.startDate && quest.endDate && (
            <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
              {formatTime(quest.startDate)} - {formatTime(quest.endDate)}
            </p>
          )}
          {quest.progress !== undefined && !isCompleted && !isFailed && (
            <div className="mt-2">
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
        <TaskActionMenu quest={quest} onEdit={onEdit} compact={compact} />
      </div>
    </div>
  );
}
