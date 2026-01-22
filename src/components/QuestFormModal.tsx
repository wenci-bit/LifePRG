/**
 * QuestFormModal - 任务创建/编辑表单
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, Sparkles, Loader2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { Quest, AttributeType, QuestType, SubTask } from '@/types/game';
import { QUEST_COLORS, COMMON_TAGS, PRIORITY_CONFIG, getDefaultQuestColor, getTagConfig } from '@/data/questConfig';
import { QUEST_ICONS, QUEST_ICON_CATEGORIES, DEFAULT_QUEST_ICON, type QuestIconOption } from '@/data/questIcons';
import { formatLocalDate, formatTime } from '@/utils/dateUtils';
import { generateTaskReward } from '@/services/aiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editQuest?: Quest | null;
  initialParentId?: string;
  initialStartDate?: string;
  initialStartTime?: string;
}

export default function QuestFormModal({ isOpen, onClose, editQuest, initialParentId, initialStartDate, initialStartTime }: Props) {
  const addQuest = useGameStore((state) => state.addQuest);
  const updateQuest = useGameStore((state) => state.updateQuest);
  const quests = useGameStore((state) => state.quests);

  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<QuestType>('main' as QuestType);
  const [attributes, setAttributes] = useState<AttributeType[]>(['int']); // 改为数组，支持多选
  const [expReward, setExpReward] = useState(50);
  const [coinReward, setCoinReward] = useState(30);
  const [color, setColor] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<('year' | 'month' | 'week')[]>([]);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [deadline, setDeadline] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [timeMode, setTimeMode] = useState<'range' | 'date' | 'point'>('range');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [progress, setProgress] = useState(0);
  const [enableProgress, setEnableProgress] = useState(false);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [icon, setIcon] = useState(DEFAULT_QUEST_ICON);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconCategory, setIconCategory] = useState<string>('work');
  const [parentId, setParentId] = useState<string>('');
  const [aiRewardLoading, setAiRewardLoading] = useState(false);

  // 获取所有可以作为父任务的任务（没有 parentId 的任务，且不是当前编辑的任务）
  const availableParentQuests = quests.filter(q => !q.parentId && q.id !== editQuest?.id);

  // AI自动设定奖励
  const handleAIReward = async () => {
    if (!title.trim()) {
      alert('请先输入任务标题');
      return;
    }

    setAiRewardLoading(true);
    try {
      const reward = await generateTaskReward(
        title,
        description,
        type,
        attributes
      );

      setExpReward(reward.expReward);
      setCoinReward(reward.coinReward);

      // 显示AI的推理过程
      if (reward.reasoning) {
        alert(`AI 奖励设定完成！\n\n${reward.reasoning}`);
      }
    } catch (error) {
      console.error('AI奖励设定失败:', error);
      alert('AI奖励设定失败，请手动设置或重试');
    } finally {
      setAiRewardLoading(false);
    }
  };

  // 重置表单函数
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('main' as QuestType);
    setAttributes(['int']); // 默认一个属性
    setExpReward(50);
    setCoinReward(30);
    setColor('');
    setPriority('medium');
    setTags([]);
    setMilestones([]);
    setStartDate('');
    setStartTime('09:00');
    setEndDate('');
    setEndTime('10:00');
    setDeadline('');
    setEstimatedDuration(60);
    setTimeMode('range');
    setSubtasks([]);
    setProgress(0);
    setEnableProgress(false);
    setRecurrenceEnabled(false);
    setRecurrenceType('daily');
    setRecurrenceInterval(1);
    setRecurrenceDays([]);
    setNewSubtaskTitle('');
    setCustomTagInput('');
    setIcon(DEFAULT_QUEST_ICON);
    setShowIconPicker(false);
    setIconCategory('work');
    setParentId('');
  };

  // 编辑模式初始化
  useEffect(() => {
    if (editQuest) {
      setTitle(editQuest.title);
      setDescription(editQuest.description);
      setType(editQuest.type);
      setAttributes(editQuest.attributes || ['int']); // 支持多属性
      setExpReward(editQuest.expReward);
      setCoinReward(editQuest.coinReward);
      setColor(editQuest.color || '');
      setPriority(editQuest.priority || 'medium');
      setTags(editQuest.tags || []);
      setMilestones(editQuest.milestones || []);
      setEstimatedDuration(editQuest.estimatedDuration || 60);
      setSubtasks(editQuest.subtasks || []);
      setProgress(editQuest.progress || 0);
      setEnableProgress(editQuest.progress !== undefined && (!editQuest.subtasks || editQuest.subtasks.length === 0));
      setIcon(editQuest.icon || DEFAULT_QUEST_ICON);

      // 重复模式
      if (editQuest.recurrence) {
        setRecurrenceEnabled(true);
        setRecurrenceType(editQuest.recurrence.type);
        setRecurrenceInterval(editQuest.recurrence.interval || 1);
        setRecurrenceDays(editQuest.recurrence.daysOfWeek || []);
      } else {
        setRecurrenceEnabled(false);
      }

      // 判断时间模式
      if (editQuest.startDate && editQuest.endDate) {
        // 检查是否有时间部分（不是00:00）
        const start = new Date(editQuest.startDate);
        const end = new Date(editQuest.endDate);
        const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0 || end.getHours() !== 0 || end.getMinutes() !== 0;

        if (hasTime && editQuest.startDate === editQuest.endDate) {
          setTimeMode('point');
        } else if (hasTime) {
          setTimeMode('range');
        } else {
          setTimeMode('date');
        }
      } else if (editQuest.startDate) {
        setTimeMode('point');
      } else {
        setTimeMode('date');
      }

      if (editQuest.startDate) {
        const start = new Date(editQuest.startDate);
        setStartDate(formatLocalDate(start));
        setStartTime(formatTime(editQuest.startDate));
      }
      if (editQuest.endDate) {
        const end = new Date(editQuest.endDate);
        setEndDate(formatLocalDate(end));
        setEndTime(formatTime(editQuest.endDate));
      }
      if (editQuest.deadline) {
        setDeadline(formatLocalDate(new Date(editQuest.deadline)));
      }
      // 设置父任务ID（如果有）
      setParentId(editQuest.parentId || '');
    } else {
      resetForm();
      // 设置初始值（如果有）
      if (initialParentId) {
        setParentId(initialParentId);
      }
      if (initialStartDate) {
        setStartDate(initialStartDate);
      }
      if (initialStartTime) {
        setStartTime(initialStartTime);
        setTimeMode('point'); // 从时间轴点击创建时使用时间点模式
      }
    }
  }, [editQuest, isOpen, initialParentId, initialStartDate, initialStartTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;
    if (attributes.length === 0) {
      alert('请至少选择一个属性');
      return;
    }

    const questData: any = {
      title: title.trim(),
      description: description.trim(),
      type,
      attributes, // 多属性支持
      expReward,
      coinReward,
      color: color || getDefaultQuestColor(type),
      icon,
      priority,
      tags,
      milestones,
      estimatedDuration,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      progress: subtasks.length > 0 ? Math.floor((subtasks.filter(st => st.completed).length / subtasks.length) * 100) : (enableProgress ? progress : undefined),
    };

    // 重复模式
    if (recurrenceEnabled) {
      questData.recurrence = {
        type: recurrenceType,
        interval: recurrenceInterval,
        daysOfWeek: recurrenceDays.length > 0 ? recurrenceDays : undefined,
      };
    }

    // 处理日期时间 - 根据时间模式
    if (timeMode === 'range' && startDate && startTime && endDate && endTime) {
      // 时间段模式：有开始和结束的日期+时间
      const [startHours, startMinutes] = startTime.split(':');
      const start = new Date(startDate);
      start.setHours(parseInt(startHours), parseInt(startMinutes));
      questData.startDate = start.getTime();

      const [endHours, endMinutes] = endTime.split(':');
      const end = new Date(endDate);
      end.setHours(parseInt(endHours), parseInt(endMinutes));
      questData.endDate = end.getTime();
    } else if (timeMode === 'date' && startDate) {
      // 日期模式：只有日期，开始时间设为00:00，结束时间设为23:59
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      questData.startDate = start.getTime();

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        questData.endDate = end.getTime();
      } else {
        // 如果没有结束日期，设为同一天的结束时间
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        questData.endDate = end.getTime();
      }
    } else if (timeMode === 'point' && startDate && startTime) {
      // 时间点模式：单个时间点，使用估算时长计算结束时间
      const [hours, minutes] = startTime.split(':');
      const start = new Date(startDate);
      start.setHours(parseInt(hours), parseInt(minutes));
      questData.startDate = start.getTime();

      // 根据估算时长计算结束时间（默认1小时）
      const duration = estimatedDuration || 60;
      const end = new Date(start.getTime() + duration * 60 * 1000);
      questData.endDate = end.getTime();
    }

    if (deadline) {
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(23, 59, 59);
      questData.deadline = deadlineDate.getTime();
    }

    // 添加父任务ID（如果选择了父任务）
    if (parentId) {
      questData.parentId = parentId;
    }

    if (editQuest) {
      updateQuest(editQuest.id, questData);
    } else {
      addQuest(questData);
    }

    onClose();
    resetForm();
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmedTag = customTagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setCustomTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addSubtaskToForm = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: SubTask = {
        id: Date.now().toString(),
        title: newSubtaskTitle.trim(),
        completed: false,
        createdAt: Date.now(),
      };
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskTitle('');
    }
  };

  const removeSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId));
  };

  const toggleSubtaskInForm = (subtaskId: string) => {
    setSubtasks(subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ));
  };

  const toggleRecurrenceDay = (day: number) => {
    if (recurrenceDays.includes(day)) {
      setRecurrenceDays(recurrenceDays.filter(d => d !== day));
    } else {
      setRecurrenceDays([...recurrenceDays, day].sort());
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron">
              {editQuest ? '编辑任务' : '创建任务'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div>
              <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">任务标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan placeholder:text-gray-400 dark:placeholder:text-white/40"
                placeholder="输入任务标题..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">任务描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan resize-none placeholder:text-gray-400 dark:placeholder:text-white/40"
                placeholder="输入任务描述..."
                rows={3}
              />
            </div>

            {/* 类型和属性 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">任务类型</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as QuestType)}
                  className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                >
                  <option value="main">主线任务</option>
                  <option value="side">支线任务</option>
                  <option value="daily">日常任务</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">关联属性（可多选）</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['int', 'vit', 'mng', 'cre'] as AttributeType[]).map((attr) => {
                    const isSelected = attributes.includes(attr);
                    const labels = {
                      int: '智力 (INT)',
                      vit: '活力 (VIT)',
                      mng: '管理 (MNG)',
                      cre: '创造 (CRE)',
                    };
                    const colors = {
                      int: 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/20',
                      vit: 'border-cyber-green text-cyber-green bg-cyber-green/20',
                      mng: 'border-cyber-purple text-cyber-purple bg-cyber-purple/20',
                      cre: 'border-cyber-red text-cyber-red bg-cyber-red/20',
                    };

                    return (
                      <button
                        key={attr}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // 至少保留一个属性
                            if (attributes.length > 1) {
                              setAttributes(attributes.filter(a => a !== attr));
                            }
                          } else {
                            setAttributes([...attributes, attr]);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg border-2 transition-all font-inter text-sm font-medium ${
                          isSelected
                            ? colors[attr]
                            : 'border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/60 hover:border-gray-400 dark:hover:border-white/40'
                        }`}
                      >
                        {labels[attr]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 父任务选择 */}
            {availableParentQuests.length > 0 && (
              <div>
                <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">关联父任务（可选）</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                >
                  <option value="">无父任务（作为独立任务）</option>
                  {availableParentQuests.map(quest => (
                    <option key={quest.id} value={quest.id}>
                      {quest.icon || '📋'} {quest.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
                  选择父任务后，此任务将成为子任务，方便后期归纳整理
                </p>
              </div>
            )}

            {/* 奖励 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-inter text-gray-700 dark:text-white/80">任务奖励</label>
                <button
                  type="button"
                  onClick={handleAIReward}
                  disabled={aiRewardLoading || !title.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    aiRewardLoading || !title.trim()
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 text-cyber-cyan hover:from-cyber-cyan/30 hover:to-cyber-purple/30 border border-cyber-cyan/30'
                  }`}
                >
                  {aiRewardLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI 计算中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI 智能设定
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-2">经验奖励</label>
                  <input
                    type="number"
                    value={expReward}
                    onChange={(e) => setExpReward(parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-2">金币奖励</label>
                  <input
                    type="number"
                    value={coinReward}
                    onChange={(e) => setCoinReward(parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                    min="0"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-white/60">
                💡 提示：点击"AI 智能设定"按钮，让 AI 根据任务类型和难度自动设定合理的奖励
              </p>
            </div>

            {/* 优先级和标记 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">优先级</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">重点标记（可多选）</label>
                <div className="space-y-2">
                  {[
                    { value: 'week', label: '周重点 ⭐', color: 'from-green-500 to-emerald-600' },
                    { value: 'month', label: '月重点 ⭐⭐', color: 'from-purple-500 to-pink-600' },
                    { value: 'year', label: '年重点 ⭐⭐⭐', color: 'from-yellow-500 to-orange-600' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-gray-300 dark:border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={milestones.includes(option.value as 'year' | 'month' | 'week')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMilestones([...milestones, option.value as 'year' | 'month' | 'week']);
                          } else {
                            setMilestones(milestones.filter(m => m !== option.value));
                          }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyber-cyan focus:ring-2 focus:ring-cyber-cyan"
                      />
                      <span className={`text-sm font-medium bg-gradient-to-r ${option.color} bg-clip-text text-transparent`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">任务颜色</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(QUEST_COLORS).map(([key, colorData]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(colorData.hex)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      color === colorData.hex ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: colorData.hex }}
                    title={colorData.name}
                  />
                ))}
              </div>
            </div>

            {/* 图标选择 */}
            <div>
              <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">任务图标</label>

              {/* 当前选中的图标 */}
              <div className="mb-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-16 h-16 rounded-xl bg-white/10 dark:bg-white/5 border-2 border-white/20 dark:border-white/10 flex items-center justify-center text-3xl hover:scale-105 transition-all"
                >
                  {icon}
                </button>
                <p className="text-sm text-gray-600 dark:text-white/60">
                  点击选择图标
                </p>
              </div>

              {/* 图标选择器 */}
              <AnimatePresence>
                {showIconPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10">
                      {/* 分类标签 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {QUEST_ICON_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setIconCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              iconCategory === cat.id
                                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                : 'bg-white/10 dark:bg-white/5 text-gray-700 dark:text-white/60 hover:bg-white/20 dark:hover:bg-white/10'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* 图标网格 */}
                      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {QUEST_ICONS
                          .filter((iconOption) => iconOption.category === iconCategory)
                          .map((iconOption, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setIcon(iconOption.emoji);
                                setShowIconPicker(false);
                              }}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                                icon === iconOption.emoji
                                  ? 'bg-cyber-cyan/30 ring-2 ring-cyber-cyan scale-110'
                                  : 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 hover:scale-110'
                              }`}
                              title={iconOption.label}
                            >
                              {iconOption.emoji}
                            </button>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 标签选择 */}
            <div>
              <label className="block text-sm font-inter text-gray-700 dark:text-white/80 mb-2">标签</label>

              {/* 已选择的标签 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  {tags.map(tag => {
                    const tagConfig = getTagConfig(tag);
                    return (
                      <div
                        key={tag}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 text-sm"
                      >
                        <span>{tagConfig.icon}</span>
                        <span className="text-gray-900 dark:text-white font-medium">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-gray-500 dark:text-white/60 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 预定义标签选择 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_TAGS.map(tag => (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => toggleTag(tag.name)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-inter transition-all ${
                      tags.includes(tag.name)
                        ? 'bg-white/20 text-gray-900 dark:text-white border-2 border-gray-400 dark:border-white/40'
                        : 'bg-white/5 text-gray-600 dark:text-white/60 border border-gray-300 dark:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {tag.icon} {tag.name}
                  </button>
                ))}
              </div>

              {/* 自定义标签输入 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="添加自定义标签..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:border-cyber-cyan"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="px-4 py-2 bg-cyber-cyan/20 hover:bg-cyber-cyan/30 text-cyber-cyan rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>

            {/* 时间设置 */}
            <div className="space-y-4">
              <label className="block text-sm font-inter text-gray-700 dark:text-white/80">时间设置</label>

              {/* 时间模式选择 */}
              <div>
                <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-2">时间模式</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeMode('range')}
                    className={`px-3 py-2 rounded-lg text-sm font-inter transition-all ${
                      timeMode === 'range'
                        ? 'bg-cyber-cyan text-white'
                        : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                    }`}
                  >
                    时间段
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMode('date')}
                    className={`px-3 py-2 rounded-lg text-sm font-inter transition-all ${
                      timeMode === 'date'
                        ? 'bg-cyber-cyan text-white'
                        : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                    }`}
                  >
                    仅日期
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMode('point')}
                    className={`px-3 py-2 rounded-lg text-sm font-inter transition-all ${
                      timeMode === 'point'
                        ? 'bg-cyber-cyan text-white'
                        : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                    }`}
                  >
                    时间点
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-white/70 mt-2">
                  {timeMode === 'range' && '选择开始和结束的日期和时间'}
                  {timeMode === 'date' && '只选择日期，不指定具体时间（显示在计划视图顶部）'}
                  {timeMode === 'point' && '选择单个时间点，将以默认高度显示'}
                </p>
              </div>

              {/* 时间段模式 */}
              {timeMode === 'range' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">开始时间</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">结束时间</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 仅日期模式 */}
              {timeMode === 'date' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">开始日期</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">结束日期（可选）</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                    />
                  </div>
                </div>
              )}

              {/* 时间点模式 */}
              {timeMode === 'point' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">日期</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">时间</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">预估时长（分钟）</label>
                    <input
                      type="number"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      min="0"
                    />
                    <p className="text-xs text-gray-600 dark:text-white/70 mt-1">将用于计算任务结束时间和显示高度</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">截止日期（可选）</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                />
              </div>
            </div>

            {/* 子任务管理 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-inter text-gray-700 dark:text-white/80">子任务</label>
                <span className="text-xs text-gray-600 dark:text-white/60">
                  {subtasks.length > 0 && `(${subtasks.filter(st => st.completed).length}/${subtasks.length})`}
                </span>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtaskInForm(subtask.id)}
                        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          subtask.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-white/30 hover:border-white/50'
                        }`}
                      >
                        {subtask.completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span
                        className={`flex-1 text-sm font-inter ${
                          subtask.completed ? 'line-through text-gray-500 dark:text-white/50' : 'text-gray-900 dark:text-white/90'
                        }`}
                      >
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(subtask.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtaskToForm())}
                  placeholder="添加子任务..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={addSubtaskToForm}
                  className="px-4 py-2 rounded-lg bg-cyber-cyan hover:bg-cyan-600 text-white font-inter flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
              {subtasks.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-white/60">
                  子任务进度将自动计算任务完成度
                </p>
              )}
            </div>

            {/* 进度条设置（仅在没有子任务时启用） */}
            {subtasks.length === 0 && (
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enableProgress}
                    onChange={(e) => setEnableProgress(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyber-cyan focus:ring-2 focus:ring-cyber-cyan"
                  />
                  <span className="text-sm font-inter text-gray-700 dark:text-white/80">启用进度跟踪</span>
                </label>

                {enableProgress && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-inter text-gray-600 dark:text-white/60">初始进度</label>
                      <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{progress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progress}
                      onChange={(e) => setProgress(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
                      你可以在任务详情中手动更新进度
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 重复模式设置 */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={recurrenceEnabled}
                  onChange={(e) => setRecurrenceEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyber-cyan focus:ring-2 focus:ring-cyber-cyan"
                />
                <span className="text-sm font-inter text-gray-700 dark:text-white/80">重复任务</span>
              </label>

              {recurrenceEnabled && (
                <div className="space-y-3 pl-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">重复类型</label>
                      <select
                        value={recurrenceType}
                        onChange={(e) => setRecurrenceType(e.target.value as any)}
                        className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      >
                        <option value="daily">每天</option>
                        <option value="weekly">每周</option>
                        <option value="monthly">每月</option>
                        <option value="yearly">每年</option>
                        <option value="custom">自定义</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-1">间隔</label>
                      <input
                        type="number"
                        min="1"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                  </div>

                  {recurrenceType === 'weekly' && (
                    <div>
                      <label className="block text-xs font-inter text-gray-600 dark:text-white/60 mb-2">重复日期</label>
                      <div className="flex flex-wrap gap-2">
                        {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleRecurrenceDay(index)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-inter transition-all ${
                              recurrenceDays.includes(index)
                                ? 'bg-cyber-cyan text-white'
                                : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg bg-white/10 text-gray-900 dark:text-white font-inter hover:bg-white/20 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-inter hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                {editQuest ? '保存' : '创建'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
