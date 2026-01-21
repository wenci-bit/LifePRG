/**
 * TaskActionMenu - 任务操作菜单组件
 *
 * 提供任务的所有操作功能：完成、编辑、删除、放弃、推迟等
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Edit3, Trash2, XCircle, Calendar,
  Copy, AlertCircle, MoreVertical, Clock, BarChart3
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { Quest } from '@/types/game';
import { QuestStatus } from '@/types/game';

interface Props {
  quest: Quest;
  onEdit?: () => void;
  compact?: boolean;
}

export default function TaskActionMenu({ quest, onEdit, compact = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const completeQuest = useGameStore((state) => state.completeQuest);
  const uncompleteQuest = useGameStore((state) => state.uncompleteQuest);
  const deleteQuest = useGameStore((state) => state.deleteQuest);
  const updateQuest = useGameStore((state) => state.updateQuest);
  const addQuest = useGameStore((state) => state.addQuest);

  // 计算菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 224, // 224px = w-56
      });
    }
  }, [isOpen]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 操作处理函数
  const handleComplete = () => {
    completeQuest(quest.id);
    setIsOpen(false);
  };

  const handleUncomplete = () => {
    uncompleteQuest(quest.id);
    setIsOpen(false);
  };

  const handleEdit = () => {
    onEdit?.();
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`确定要删除任务"${quest.title}"吗？此操作无法撤销。`)) {
      deleteQuest(quest.id);
      setIsOpen(false);
    }
  };

  const handleFail = () => {
    if (confirm(`确定要放弃任务"${quest.title}"吗？`)) {
      updateQuest(quest.id, { status: QuestStatus.FAILED });
      setIsOpen(false);
    }
  };

  const handlePostpone = (days: number) => {
    const newStartDate = quest.startDate
      ? new Date(quest.startDate).getTime() + days * 24 * 60 * 60 * 1000
      : Date.now() + days * 24 * 60 * 60 * 1000;

    const newEndDate = quest.endDate
      ? new Date(quest.endDate).getTime() + days * 24 * 60 * 60 * 1000
      : undefined;

    const newDeadline = quest.deadline
      ? new Date(quest.deadline).getTime() + days * 24 * 60 * 60 * 1000
      : undefined;

    updateQuest(quest.id, {
      startDate: newStartDate,
      endDate: newEndDate,
      deadline: newDeadline,
    });
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    const { id, status, createdAt, completedAt, progress, ...questData } = quest;
    addQuest({
      ...questData,
      title: `${quest.title} (副本)`,
      progress: 0,
    });
    setIsOpen(false);
  };

  const handleSetProgress = () => {
    const input = prompt(`设置任务进度（0-100）：`, String(quest.progress || 0));
    if (input !== null) {
      const progress = Math.min(100, Math.max(0, parseInt(input) || 0));
      updateQuest(quest.id, { progress });
      setIsOpen(false);
    }
  };

  const isCompleted = quest.status === QuestStatus.COMPLETED;
  const isFailed = quest.status === QuestStatus.FAILED;

  const menuContent = isOpen && (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="fixed w-56 glass-card p-2 z-[9999] border border-white/20 shadow-2xl"
        style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
      >
        {/* 如果已完成，显示取消完成按钮 */}
        {isCompleted && (
          <MenuItem
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="取消完成"
            onClick={handleUncomplete}
            color="text-blue-400"
          />
        )}

        {/* 如果未完成，显示完成按钮 */}
        {!isCompleted && !isFailed && (
          <MenuItem
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="完成任务"
            onClick={handleComplete}
            color="text-green-400"
          />
        )}

        {/* 编辑按钮 */}
        {!isCompleted && !isFailed && (
          <MenuItem
            icon={<Edit3 className="w-4 h-4" />}
            label="编辑任务"
            onClick={handleEdit}
          />
        )}

        {/* 进度设置 */}
        {!isCompleted && !isFailed && quest.progress !== undefined && (
          <MenuItem
            icon={<BarChart3 className="w-4 h-4" />}
            label="设置进度"
            onClick={handleSetProgress}
          />
        )}

        {/* 推迟选项 */}
        {!isCompleted && !isFailed && (
          <>
            <div className="h-px bg-white/10 my-2" />
            <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-white/60 font-inter">推迟到</div>
            <MenuItem
              icon={<Clock className="w-4 h-4" />}
              label="明天"
              onClick={() => handlePostpone(1)}
              small
            />
            <MenuItem
              icon={<Clock className="w-4 h-4" />}
              label="下周"
              onClick={() => handlePostpone(7)}
              small
            />
            <MenuItem
              icon={<Calendar className="w-4 h-4" />}
              label="下个月"
              onClick={() => handlePostpone(30)}
              small
            />
          </>
        )}

        <div className="h-px bg-white/10 my-2" />

        {/* 复制任务 */}
        <MenuItem
          icon={<Copy className="w-4 h-4" />}
          label="创建副本"
          onClick={handleDuplicate}
        />

        {/* 放弃任务 */}
        {!isCompleted && !isFailed && (
          <MenuItem
            icon={<XCircle className="w-4 h-4" />}
            label="放弃任务"
            onClick={handleFail}
            color="text-yellow-400"
          />
        )}

        {/* 删除按钮 */}
        <MenuItem
          icon={<Trash2 className="w-4 h-4" />}
          label="删除任务"
          onClick={handleDelete}
          color="text-red-400"
        />
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      {/* 菜单按钮 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          compact ? 'p-1' : 'p-2'
        } rounded-lg hover:bg-white/10 transition-colors`}
        title="任务操作"
      >
        <MoreVertical className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600 dark:text-white/60`} />
      </button>

      {/* 使用Portal渲染菜单到body */}
      {typeof window !== 'undefined' && menuContent && createPortal(menuContent, document.body)}
    </>
  );
}

// 菜单项组件
function MenuItem({
  icon,
  label,
  onClick,
  color = 'text-gray-900 dark:text-white',
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 ${
        small ? 'px-3 py-1.5 pl-6' : 'px-3 py-2'
      } rounded-lg hover:bg-white/10 transition-colors ${color}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className={`font-inter ${small ? 'text-sm' : 'text-sm font-medium'}`}>
        {label}
      </span>
    </button>
  );
}
