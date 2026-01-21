/**
 * HabitFormModal - 习惯创建/编辑模态框
 *
 * 支持创建和编辑习惯，包含完整的习惯配置选项
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Tag, Repeat, Target, Clock, Link as LinkIcon } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { HabitType, HabitStatus, type Habit, type Quest } from '@/types/game';
import { HABIT_ICONS, HABIT_COLORS, COMMON_UNITS, HABIT_TEMPLATES, type HabitTemplate } from '@/data/habits';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editHabit?: Habit | null;
}

export default function HabitFormModal({ isOpen, onClose, editHabit }: HabitFormModalProps) {
  // 基础信息
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#00f3ff');
  const [type, setType] = useState<HabitType>(HabitType.BOOLEAN);

  // 目标设置
  const [targetValue, setTargetValue] = useState<number | undefined>();
  const [unit, setUnit] = useState('');

  // 重复模式
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // 期限设置
  const [isLongTerm, setIsLongTerm] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // 关联任务
  const [linkedQuestId, setLinkedQuestId] = useState<string | undefined>();

  // 提醒设置
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');

  // UI 状态
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | null>(null);

  const addHabit = useGameStore((state) => state.addHabit);
  const updateHabit = useGameStore((state) => state.updateHabit);
  const quests = useGameStore((state) => state.quests);

  // 可用的关联任务列表（未完成的任务）
  const availableQuests = quests.filter(q => q.status === 'active');

  // 初始化表单（编辑模式）
  useEffect(() => {
    if (editHabit) {
      setName(editHabit.name);
      setIcon(editHabit.icon);
      setColor(editHabit.color);
      setType(editHabit.type);
      setTargetValue(editHabit.targetValue);
      setUnit(editHabit.unit || '');
      setRepeatType(editHabit.repeatPattern.type);
      setSelectedDays(editHabit.repeatPattern.daysOfWeek || []);
      setIsLongTerm(editHabit.isLongTerm);
      setStartDate(new Date(editHabit.startDate).toISOString().split('T')[0]);
      setEndDate(editHabit.endDate ? new Date(editHabit.endDate).toISOString().split('T')[0] : '');
      setLinkedQuestId(editHabit.linkedQuestId);
      setReminderEnabled(editHabit.reminder?.enabled || false);
      setReminderTime(editHabit.reminder?.time || '09:00');
    } else {
      resetForm();
    }
  }, [editHabit, isOpen]);

  const resetForm = () => {
    setName('');
    setIcon('🎯');
    setColor('#00f3ff');
    setType(HabitType.BOOLEAN);
    setTargetValue(undefined);
    setUnit('');
    setRepeatType('daily');
    setSelectedDays([]);
    setIsLongTerm(true);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setLinkedQuestId(undefined);
    setReminderEnabled(false);
    setReminderTime('09:00');
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  // 应用模板
  const applyTemplate = (template: HabitTemplate) => {
    setName(template.name);
    setIcon(template.icon);
    setColor(template.color);
    setType(template.type);
    setTargetValue(template.targetValue);
    setUnit(template.unit || '');
    setSelectedTemplate(template);
    setShowTemplates(false);
  };

  // 切换选中的星期
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const habitData: any = {
      name: name.trim(),
      icon,
      color,
      type,
      status: HabitStatus.ACTIVE,
      repeatPattern: {
        type: repeatType,
        daysOfWeek: repeatType === 'daily' ? undefined : selectedDays,
      },
      isLongTerm,
      startDate: new Date(startDate).getTime(),
      endDate: isLongTerm ? undefined : new Date(endDate).getTime(),
      linkedQuestId,
      reminder: reminderEnabled ? {
        enabled: true,
        time: reminderTime,
      } : undefined,
    };

    // 只有非布尔型才需要目标值和单位
    if (type !== HabitType.BOOLEAN) {
      habitData.targetValue = targetValue;
      habitData.unit = unit;
    }

    if (editHabit) {
      updateHabit(editHabit.id, habitData);
    } else {
      addHabit(habitData);
    }

    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative max-w-2xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-white/20"
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl leading-none">
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron">
                {editHabit ? '编辑习惯' : '创建习惯'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/60 font-inter">
                {editHabit ? '修改习惯配置' : '设置新的习惯目标'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-white/60" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6 custom-scrollbar">
          {/* 模板选择 */}
          {!editHabit && (
            <div>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-gray-900 dark:text-white font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
              >
                {showTemplates ? '隐藏模板' : '从模板创建'}
              </button>

              <AnimatePresence>
                {showTemplates && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 grid grid-cols-2 gap-3 overflow-hidden"
                  >
                    {HABIT_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedTemplate?.name === template.name
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl leading-none">{template.icon}</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{template.name}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-white/60 line-clamp-2">
                          {template.description}
                        </p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 基础信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-400" />
              基础信息
            </h3>

            {/* 习惯名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                习惯名称 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：早起、喝水、运动..."
                required
                className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* 图标和颜色 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 图标选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  图标
                </label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full h-16 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 flex items-center justify-center text-4xl leading-none hover:border-green-500 transition-colors"
                >
                  {icon}
                </button>

                <AnimatePresence>
                  {showIconPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-white/20 shadow-lg max-h-64 overflow-y-auto"
                    >
                      {Object.entries(HABIT_ICONS).map(([category, icons]) => (
                        <div key={category} className="mb-4">
                          <p className="text-xs text-gray-500 dark:text-white/60 mb-2 font-inter uppercase">
                            {category}
                          </p>
                          <div className="grid grid-cols-6 gap-2">
                            {icons.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setIcon(emoji);
                                  setShowIconPicker(false);
                                }}
                                className="w-10 h-10 rounded-lg hover:bg-green-500/20 flex items-center justify-center text-2xl leading-none transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 颜色选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  颜色
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {HABIT_COLORS.map((colorOption) => (
                    <button
                      key={colorOption.hex}
                      type="button"
                      onClick={() => setColor(colorOption.hex)}
                      className={`w-full h-12 rounded-xl border-4 transition-all ${
                        color === colorOption.hex
                          ? 'border-white scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: colorOption.hex }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 习惯类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                习惯类型 *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: HabitType.BOOLEAN, label: '单次型', desc: '完成/未完成' },
                  { value: HabitType.NUMERIC, label: '数量型', desc: '如喝水量、次数等' },
                  { value: HabitType.DURATION, label: '时长型', desc: '如运动30分钟' },
                ].map((typeOption) => (
                  <button
                    key={typeOption.value}
                    type="button"
                    onClick={() => setType(typeOption.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      type === typeOption.value
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{typeOption.label}</p>
                    <p className="text-xs text-gray-600 dark:text-white/60 mt-1">{typeOption.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 目标值和单位（仅非布尔型） */}
            {type !== HabitType.BOOLEAN && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                    目标值
                  </label>
                  <input
                    type="number"
                    value={targetValue || ''}
                    onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="例如：2000"
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                    单位
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="">选择单位</option>
                    {type === HabitType.NUMERIC && COMMON_UNITS.numeric.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                    {type === HabitType.DURATION && COMMON_UNITS.duration.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 重复模式 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter flex items-center gap-2">
              <Repeat className="w-5 h-5 text-green-400" />
              重复模式
            </h3>

            <div className="flex gap-3">
              {[
                { value: 'daily', label: '每天' },
                { value: 'weekly', label: '每周' },
                { value: 'custom', label: '自定义' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRepeatType(option.value as any)}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                    repeatType === option.value
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* 星期选择 */}
            {(repeatType === 'weekly' || repeatType === 'custom') && (
              <div>
                <p className="text-sm text-gray-700 dark:text-white/80 mb-2">选择星期</p>
                <div className="grid grid-cols-7 gap-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`p-3 rounded-lg font-bold transition-all ${
                        selectedDays.includes(index)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
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

          {/* 期限设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              期限设置
            </h3>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsLongTerm(true)}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  isLongTerm
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                }`}
              >
                长期习惯
              </button>
              <button
                type="button"
                onClick={() => setIsLongTerm(false)}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  !isLongTerm
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                }`}
              >
                临时习惯
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  开始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                />
              </div>
              {!isLongTerm && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 关联任务（可选） */}
          {availableQuests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-green-400" />
                关联任务（可选）
              </h3>

              <select
                value={linkedQuestId || ''}
                onChange={(e) => setLinkedQuestId(e.target.value || undefined)}
                className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
              >
                <option value="">不关联任务</option>
                {availableQuests.map((quest) => (
                  <option key={quest.id} value={quest.id}>
                    {quest.icon || '🎯'} {quest.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-white/50">
                关联任务后，完成此习惯也会标记关联任务为完成
              </p>
            </div>
          )}

          {/* 提醒设置（可选） */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
              提醒设置（可选）
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="reminderEnabled"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700 dark:text-white/80">
                启用每日提醒
              </label>
            </div>

            {reminderEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  提醒时间
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                />
              </div>
            )}
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-white/10 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {editHabit ? '保存修改' : '创建习惯'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
