/**
 * TaskDetailModal - 任务详情模态框
 *
 * 点击任务后显示任务的完整详细信息
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  Flag,
  Tag,
  Zap,
  Coins,
  Target,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  BarChart3,
  Star,
  AlertCircle,
  Plus,
  Check,
  Repeat,
  Timer,
  FileText,
  Save,
} from 'lucide-react';
import { QuestType, QuestStatus, type Quest } from '@/types/game';
import { formatDateTime, formatLocalDate } from '@/utils/dateUtils';
import { getPriorityConfig, getTagConfig } from '@/data/questConfig';
import { useGameStore } from '@/store/gameStore';
import { useState, useEffect } from 'react';

interface TaskDetailModalProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function TaskDetailModal({
  quest,
  isOpen,
  onClose,
  onEdit,
}: TaskDetailModalProps) {
  const completeQuest = useGameStore((state) => state.completeQuest);
  const deleteQuest = useGameStore((state) => state.deleteQuest);
  const uncompleteQuest = useGameStore((state) => state.uncompleteQuest);
  const toggleSubtask = useGameStore((state) => state.toggleSubtask);
  const addSubtask = useGameStore((state) => state.addSubtask);
  const addChildQuest = useGameStore((state) => state.addChildQuest);
  const getChildQuests = useGameStore((state) => state.getChildQuests);
  const updateQuest = useGameStore((state) => state.updateQuest);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // 初始化笔记内容
  useEffect(() => {
    if (quest?.notes) {
      setNotes(quest.notes);
    } else {
      setNotes('');
    }
    setIsEditingNotes(false);
  }, [quest?.id, isOpen]);

  if (!quest) return null;

  const handleComplete = () => {
    if (quest.status === QuestStatus.ACTIVE) {
      completeQuest(quest.id);
    }
  };

  const handleDelete = () => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteQuest(quest.id);
      onClose();
    }
  };

  const handleEdit = () => {
    onEdit?.();
    onClose();
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      // 创建子任务作为独立的 Quest
      addChildQuest(quest.id, {
        type: quest.type,
        title: newSubtaskTitle.trim(),
        description: '',
        attributes: quest.attributes || ['int'],
        expReward: Math.floor(quest.expReward / 5), // 子任务的奖励较少
        coinReward: Math.floor(quest.coinReward / 5),
        startDate: quest.startDate,
        endDate: quest.endDate,
      });
      setNewSubtaskTitle('');
      setShowSubtaskInput(false);
    }
  };

  const handleToggleSubtask = (childQuestId: string, currentStatus: QuestStatus) => {
    if (currentStatus === QuestStatus.ACTIVE) {
      completeQuest(childQuestId);
    } else if (currentStatus === QuestStatus.COMPLETED) {
      uncompleteQuest(childQuestId);
    }
  };

  const handleSaveNotes = () => {
    updateQuest(quest.id, { notes });
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotes(quest.notes || '');
    setIsEditingNotes(false);
  };

  // 格式化重复模式
  const formatRecurrence = (recurrence: Quest['recurrence']) => {
    if (!recurrence) return null;

    const typeLabels = {
      daily: '每天',
      weekly: '每周',
      monthly: '每月',
      yearly: '每年',
      custom: '自定义',
    };

    let text = typeLabels[recurrence.type];

    if (recurrence.interval && recurrence.interval > 1) {
      text = `每${recurrence.interval}${recurrence.type === 'daily' ? '天' : recurrence.type === 'weekly' ? '周' : recurrence.type === 'monthly' ? '月' : '年'}`;
    }

    if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const days = recurrence.daysOfWeek.map(d => dayNames[d]).join(', ');
      text += ` (${days})`;
    }

    return text;
  };

  // 计算已用时长
  const getElapsedTime = () => {
    if (quest.startDate && quest.completedAt) {
      const elapsed = Math.floor((quest.completedAt - quest.startDate) / 60000); // 分钟
      return elapsed;
    }
    return quest.actualDuration;
  };

  // 获取任务类型配置
  const getTypeConfig = (type: QuestType) => {
    switch (type) {
      case QuestType.MAIN:
        return { label: '主线任务', color: 'from-purple-500 to-pink-600', icon: '⭐⭐⭐' };
      case QuestType.SIDE:
        return { label: '支线任务', color: 'from-blue-500 to-cyan-600', icon: '⭐⭐' };
      case QuestType.DAILY:
        return { label: '日常任务', color: 'from-green-500 to-emerald-600', icon: '⭐' };
    }
  };

  // 获取状态配置
  const getStatusConfig = (status: QuestStatus) => {
    switch (status) {
      case QuestStatus.ACTIVE:
        return { label: '进行中', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: AlertCircle };
      case QuestStatus.COMPLETED:
        return { label: '已完成', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle2 };
      case QuestStatus.FAILED:
        return { label: '已放弃', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle };
    }
  };

  const typeConfig = getTypeConfig(quest.type);
  const statusConfig = getStatusConfig(quest.status);
  const priorityConfig = quest.priority ? getPriorityConfig(quest.priority) : null;
  const StatusIcon = statusConfig.icon;

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
          {/* 头部 */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {/* 任务类型标签 */}
                <div
                  className={`px-3 py-1 rounded-lg bg-gradient-to-r ${typeConfig.color} text-white text-sm font-bold flex items-center gap-2`}
                >
                  <span>{typeConfig.icon}</span>
                  <span>{typeConfig.label}</span>
                </div>

                {/* 状态标签 */}
                <div className={`px-3 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.color} text-sm font-bold flex items-center gap-2`}>
                  <StatusIcon className="w-4 h-4" />
                  <span>{statusConfig.label}</span>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-orbitron mb-2">
                {quest.title}
              </h2>

              {quest.description && (
                <p className="text-gray-700 dark:text-white/70 font-inter text-base leading-relaxed">
                  {quest.description}
                </p>
              )}
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

              {/* 详细信息网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* 优先级 */}
                {priorityConfig && (
                  <DetailItem
                    icon={Flag}
                    label="优先级"
                    value={priorityConfig.label}
                    color={priorityConfig.color}
                  />
                )}

                {/* 关联属性 */}
                {quest.attributes && quest.attributes.length > 0 && (
                  <div className="col-span-2">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4" style={{ color: '#00f3ff' }} />
                        <span className="text-xs text-gray-600 dark:text-white/60 font-inter">关联属性</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quest.attributes.map((attr) => {
                          const colors = {
                            int: '#00f3ff',
                            vit: '#4ade80',
                            mng: '#a855f7',
                            cre: '#ef4444',
                          };
                          return (
                            <span
                              key={attr}
                              className="px-3 py-1.5 rounded-lg text-sm font-bold font-inter"
                              style={{
                                backgroundColor: `${colors[attr]}20`,
                                color: colors[attr],
                                border: `1px solid ${colors[attr]}40`,
                              }}
                            >
                              {attr.toUpperCase()}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 经验奖励 */}
                {quest.expReward !== undefined && (
                  <DetailItem
                    icon={Zap}
                    label="经验奖励"
                    value={`${quest.expReward} EXP`}
                    color="#fbbf24"
                  />
                )}

                {/* 金币奖励 */}
                {quest.coinReward !== undefined && (
                  <DetailItem
                    icon={Coins}
                    label="金币奖励"
                    value={`${quest.coinReward} Gold`}
                    color="#f59e0b"
                  />
                )}

                {/* 开始时间 */}
                {quest.startDate && (
                  <DetailItem
                    icon={Calendar}
                    label="开始时间"
                    value={formatDateTime(quest.startDate)}
                    color="#22d3ee"
                  />
                )}

                {/* 结束时间 */}
                {quest.endDate && (
                  <DetailItem
                    icon={Calendar}
                    label="结束时间"
                    value={formatDateTime(quest.endDate)}
                    color="#22d3ee"
                  />
                )}

                {/* 截止日期 */}
                {quest.deadline && (
                  <DetailItem
                    icon={AlertCircle}
                    label="截止日期"
                    value={formatLocalDate(new Date(quest.deadline))}
                    color="#ef4444"
                  />
                )}

                {/* 进度 */}
                {quest.progress !== undefined && (
                  <div className="col-span-2">
                    <DetailItem
                      icon={BarChart3}
                      label="完成进度"
                      value={`${quest.progress}%`}
                      color="#10b981"
                    />
                    <div className="mt-2 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                        style={{ width: `${quest.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 重复模式 */}
                {quest.recurrence && (
                  <DetailItem
                    icon={Repeat}
                    label="重复模式"
                    value={formatRecurrence(quest.recurrence) || '未设置'}
                    color="#a855f7"
                  />
                )}

                {/* 预估时长 */}
                {quest.estimatedDuration && (
                  <DetailItem
                    icon={Timer}
                    label="预估时长"
                    value={`${quest.estimatedDuration} 分钟`}
                    color="#3b82f6"
                  />
                )}

                {/* 实际时长 */}
                {getElapsedTime() && (
                  <DetailItem
                    icon={Clock}
                    label="实际时长"
                    value={`${getElapsedTime()} 分钟`}
                    color={
                      quest.estimatedDuration && getElapsedTime()! > quest.estimatedDuration
                        ? '#ef4444'
                        : '#10b981'
                    }
                  />
                )}
              </div>

              {/* 子任务列表 */}
              {(() => {
                const childQuests = getChildQuests(quest.id);
                const hasOldSubtasks = quest.subtasks && quest.subtasks.length > 0;

                // 优先显示新的子任务系统，如果有旧的 subtasks 也一起显示
                if (childQuests.length > 0 || hasOldSubtasks) {
                  return (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-gray-600 dark:text-white/60" />
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white/80 font-inter">
                            子任务 ({childQuests.filter(c => c.status === QuestStatus.COMPLETED).length}/{childQuests.length})
                          </h3>
                        </div>
                        {quest.status === QuestStatus.ACTIVE && (
                          <button
                            onClick={() => setShowSubtaskInput(!showSubtaskInput)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {/* 显示新的子任务（独立 Quest） */}
                        {childQuests.map((childQuest) => (
                          <div
                            key={childQuest.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                          >
                            <button
                              onClick={() => handleToggleSubtask(childQuest.id, childQuest.status)}
                              disabled={quest.status !== QuestStatus.ACTIVE}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                childQuest.status === QuestStatus.COMPLETED
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-white/30 hover:border-white/50'
                              } ${quest.status !== QuestStatus.ACTIVE ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {childQuest.status === QuestStatus.COMPLETED && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span
                              className={`flex-1 text-sm font-inter ${
                                childQuest.status === QuestStatus.COMPLETED ? 'line-through text-gray-500 dark:text-white/50' : 'text-gray-900 dark:text-white/90'
                              }`}
                            >
                              {childQuest.title}
                            </span>
                            {childQuest.completedAt && (
                              <span className="text-xs text-gray-400 dark:text-white/40 font-mono">
                                {formatDateTime(childQuest.completedAt)}
                              </span>
                            )}
                          </div>
                        ))}

                        {/* 如果还有旧的 subtasks，也显示出来（向后兼容） */}
                        {hasOldSubtasks && quest.subtasks!.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                          >
                            <button
                              onClick={() => toggleSubtask(quest.id, subtask.id)}
                              disabled={quest.status !== QuestStatus.ACTIVE}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                subtask.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-white/30 hover:border-white/50'
                              } ${quest.status !== QuestStatus.ACTIVE ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {subtask.completed && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span
                              className={`flex-1 text-sm font-inter ${
                                subtask.completed ? 'line-through text-gray-500 dark:text-white/50' : 'text-gray-900 dark:text-white/90'
                              }`}
                            >
                              {subtask.title}
                              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(旧格式)</span>
                            </span>
                            {subtask.completedAt && (
                              <span className="text-xs text-gray-400 dark:text-white/40 font-mono">
                                {formatDateTime(subtask.completedAt)}
                              </span>
                            )}
                          </div>
                        ))}

                        {showSubtaskInput && (
                          <div className="flex gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                            <input
                              type="text"
                              value={newSubtaskTitle}
                              onChange={(e) => setNewSubtaskTitle(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                              placeholder="输入子任务标题..."
                              autoFocus
                              className="flex-1 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter text-sm focus:outline-none focus:border-cyan-400 placeholder:text-gray-500 dark:placeholder:text-white/40"
                            />
                            <button
                              onClick={handleAddSubtask}
                              className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-inter transition-colors"
                            >
                              添加
                            </button>
                            <button
                              onClick={() => {
                                setShowSubtaskInput(false);
                                setNewSubtaskTitle('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-900 dark:text-white text-sm font-inter transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 添加子任务按钮（当没有子任务时） */}
              {(() => {
                const childQuests = getChildQuests(quest.id);
                const hasNoSubtasks = (!quest.subtasks || quest.subtasks.length === 0) && childQuests.length === 0;

                if (quest.status === QuestStatus.ACTIVE && hasNoSubtasks) {
                  return (
                    <div className="mb-6">
                      <button
                        onClick={() => setShowSubtaskInput(true)}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-dashed border-white/20 hover:bg-white/10 hover:border-white/30 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80 font-inter flex items-center justify-center gap-2 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        添加子任务
                      </button>
                      {showSubtaskInput && (
                        <div className="flex gap-2 p-3 rounded-lg bg-white/5 border border-white/10 mt-2">
                          <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                            placeholder="输入子任务标题..."
                            autoFocus
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter text-sm focus:outline-none focus:border-cyan-400 placeholder:text-gray-500 dark:placeholder:text-white/40"
                          />
                          <button
                            onClick={handleAddSubtask}
                            className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-inter transition-colors"
                          >
                            添加
                          </button>
                          <button
                            onClick={() => {
                              setShowSubtaskInput(false);
                              setNewSubtaskTitle('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-900 dark:text-white text-sm font-inter transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* 标签 */}
              {quest.tags && quest.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-gray-600 dark:text-white/60" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white/80 font-inter">标签</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quest.tags.map((tag) => {
                      const tagConfig = getTagConfig(tag);
                      return (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-lg text-sm font-inter"
                          style={{
                            backgroundColor: `${tagConfig.color}20`,
                            color: tagConfig.color,
                            border: `1px solid ${tagConfig.color}40`,
                          }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 重点标记 */}
              {quest.milestones && quest.milestones.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white/80 font-inter">重点标记</h3>
                  </div>
                  <div className="flex gap-2">
                    {quest.milestones.includes('week') && (
                      <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm font-inter">
                        周重点
                      </span>
                    )}
                    {quest.milestones.includes('month') && (
                      <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-inter">
                        月重点
                      </span>
                    )}
                    {quest.milestones.includes('year') && (
                      <span className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm font-inter">
                        年重点
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 颜色标记 */}
              {quest.color && (
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white/80 font-inter">颜色标记</h3>
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-white/20"
                      style={{ backgroundColor: quest.color }}
                    />
                  </div>
                </div>
              )}

              {/* 笔记 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-white/60" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white/80 font-inter">笔记</h3>
                  </div>
                  {!isEditingNotes && quest.status === QuestStatus.ACTIVE && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="添加任务笔记..."
                      className="w-full px-4 py-3 rounded-lg bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-inter text-sm focus:outline-none focus:border-cyan-400 placeholder:text-gray-500 dark:placeholder:text-white/40 resize-none min-h-[120px]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNotes}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-inter transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        保存
                      </button>
                      <button
                        onClick={handleCancelNotes}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-900 dark:text-white text-sm font-inter transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-3 rounded-lg bg-white/5 border border-white/10 ${
                      !notes ? 'text-gray-400 dark:text-white/40 italic' : 'text-gray-900 dark:text-white/90'
                    }`}
                  >
                    {notes || '暂无笔记'}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                {quest.status === QuestStatus.ACTIVE && (
                  <button
                    onClick={handleComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    标记为完成
                  </button>
                )}

                <button
                  onClick={handleEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  <Edit className="w-5 h-5" />
                  编辑任务
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

/**
 * 详细信息项组件
 */
function DetailItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-600 dark:text-white/60 font-inter">{label}</span>
      </div>
      <p className="text-base font-bold text-gray-900 dark:text-white font-inter">{value}</p>
    </div>
  );
}
