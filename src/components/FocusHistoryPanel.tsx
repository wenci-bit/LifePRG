/**
 * FocusHistoryPanel - 专注历史记录面板
 *
 * 显示所有专注会话的历史记录，支持添加笔记和筛选
 */

'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Coffee,
  Zap,
  Edit3,
  Save,
  Filter,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useThemeStore } from '@/store/themeStore';
import type { FocusSession } from '@/types/game';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FocusHistoryPanel({ isOpen, onClose }: Props) {
  const focusSessions = useGameStore((state) => state.focusSessions);
  const addFocusSessionNote = useGameStore((state) => state.addFocusSessionNote);
  const theme = useThemeStore((state) => state.theme);

  const [filterMode, setFilterMode] = useState<'all' | 'work' | 'break'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'interrupted'>('all');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // 筛选会话
  const filteredSessions = useMemo(() => {
    let sessions = [...focusSessions].reverse(); // 最新的在前

    // 按模式筛选
    if (filterMode === 'work') {
      sessions = sessions.filter(s => s.mode === 'work');
    } else if (filterMode === 'break') {
      sessions = sessions.filter(s => s.mode === 'shortBreak' || s.mode === 'longBreak');
    }

    // 按状态筛选
    if (filterStatus === 'completed') {
      sessions = sessions.filter(s => s.completed);
    } else if (filterStatus === 'interrupted') {
      sessions = sessions.filter(s => s.interrupted);
    }

    return sessions;
  }, [focusSessions, filterMode, filterStatus]);

  // 统计数据
  const stats = useMemo(() => {
    const total = focusSessions.length;
    const completed = focusSessions.filter(s => s.completed).length;
    const interrupted = focusSessions.filter(s => s.interrupted).length;
    const workSessions = focusSessions.filter(s => s.mode === 'work');
    const totalFocusMinutes = workSessions
      .filter(s => s.completed && s.actualDuration)
      .reduce((sum, s) => sum + (s.actualDuration || 0), 0) / 60;

    return {
      total,
      completed,
      interrupted,
      completionRate: total > 0 ? (completed / total * 100) : 0,
      totalFocusMinutes: Math.floor(totalFocusMinutes),
    };
  }, [focusSessions]);

  // 格式化时间
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === today.toDateString()) {
      return `今天 ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${timeStr}`;
    } else {
      return `${dateStr} ${timeStr}`;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // 获取模式配置
  const getModeConfig = (mode: FocusSession['mode']) => {
    if (mode === 'work') {
      return {
        label: '专注工作',
        icon: Zap,
        color: '#8b5cf6',
        bgColor: 'from-purple-500/20 to-pink-500/20',
        borderColor: 'border-purple-500/30',
      };
    } else if (mode === 'shortBreak') {
      return {
        label: '短休息',
        icon: Coffee,
        color: '#10b981',
        bgColor: 'from-emerald-500/20 to-teal-500/20',
        borderColor: 'border-emerald-500/30',
      };
    } else {
      return {
        label: '长休息',
        icon: Coffee,
        color: '#3b82f6',
        bgColor: 'from-blue-500/20 to-indigo-500/20',
        borderColor: 'border-blue-500/30',
      };
    }
  };

  // 保存笔记
  const handleSaveNote = (sessionId: string) => {
    if (noteText.trim()) {
      addFocusSessionNote(sessionId, noteText.trim());
    }
    setEditingSessionId(null);
    setNoteText('');
  };

  // 开始编辑笔记
  const handleEditNote = (session: FocusSession) => {
    setEditingSessionId(session.id);
    setNoteText(session.note || '');
  };

  if (!isOpen) return null;

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
        className={`relative max-w-5xl w-full max-h-[85vh] overflow-hidden rounded-2xl ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}
        style={{
          backdropFilter: 'blur(20px)',
          border: `2px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* 头部 */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-3xl font-bold font-orbitron mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                专注历史
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                记录你的每一次专注时光
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all group`}
            >
              <X className={`w-6 h-6 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'} group-hover:text-gray-900 dark:group-hover:text-white transition-colors`} />
            </button>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>总会话</p>
              <p className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'}`}>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>已完成</p>
              <p className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{stats.completed}</p>
            </div>
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'}`}>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>已中断</p>
              <p className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{stats.interrupted}</p>
            </div>
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>完成率</p>
              <p className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{stats.completionRate.toFixed(0)}%</p>
            </div>
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>累计专注</p>
              <p className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>{stats.totalFocusMinutes}m</p>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`} />
              <span className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>模式:</span>
              {(['all', 'work', 'break'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    filterMode === mode
                      ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                      : theme === 'dark'
                      ? 'bg-white/5 text-white/60 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'all' ? '全部' : mode === 'work' ? '工作' : '休息'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>状态:</span>
              {(['all', 'completed', 'interrupted'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                      : theme === 'dark'
                      ? 'bg-white/5 text-white/60 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '全部' : status === 'completed' ? '已完成' : '已中断'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 会话列表 */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-320px)] custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center`}>
                <Clock className={`w-10 h-10 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />
              </div>
              <p className={`${theme === 'dark' ? 'text-white/60' : 'text-gray-600'} font-inter`}>暂无专注记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session, index) => {
                const config = getModeConfig(session.mode);
                const ModeIcon = config.icon;
                const isEditing = editingSessionId === session.id;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-5 rounded-xl border-2 bg-gradient-to-r ${config.bgColor} ${config.borderColor}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <ModeIcon className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        <div>
                          <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {config.label}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                            {formatDate(session.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.completed ? (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            已完成
                          </div>
                        ) : session.interrupted ? (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium">
                            <XCircle className="w-4 h-4" />
                            已中断
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-white/50'}`}>
                        <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>计划时长</p>
                        <p className={`text-sm font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {formatDuration(session.plannedDuration)}
                        </p>
                      </div>
                      {session.actualDuration && (
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-white/50'}`}>
                          <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>实际时长</p>
                          <p className={`text-sm font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatDuration(session.actualDuration)}
                          </p>
                        </div>
                      )}
                      {session.actualDuration && (
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-white/50'}`}>
                          <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>完成度</p>
                          <p className={`text-sm font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {((session.actualDuration / session.plannedDuration) * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 笔记区域 */}
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-white/50'}`}>
                      {isEditing ? (
                        <div>
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="添加笔记..."
                            className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:border-cyber-cyan ${
                              theme === 'dark'
                                ? 'bg-white/10 border-white/20 text-white placeholder-white/40'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSaveNote(session.id)}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
                            >
                              <Save className="w-4 h-4" />
                              保存
                            </button>
                            <button
                              onClick={() => {
                                setEditingSessionId(null);
                                setNoteText('');
                              }}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                theme === 'dark'
                                  ? 'bg-white/10 text-white/60 hover:bg-white/20'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>笔记</p>
                            {session.note ? (
                              <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap`}>
                                {session.note}
                              </p>
                            ) : (
                              <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'} italic`}>
                                暂无笔记
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleEditNote(session)}
                            className={`p-2 rounded-lg transition-all ${
                              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                            }`}
                            title="编辑笔记"
                          >
                            <Edit3 className={`w-4 h-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
