/**
 * 每日AI任务建议组件
 * 根据用户配置生成个性化任务建议
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, RefreshCw, X, Loader2, AlertCircle } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useGameStore } from '@/store/gameStore';
import { generateDailyTaskSuggestions, type AITaskSuggestion } from '@/services/aiService';

interface DailyTaskSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyTaskSuggestions({ isOpen, onClose }: DailyTaskSuggestionsProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  const gameState = useGameStore((state) => state);
  const addQuest = useGameStore((state) => state.addQuest);

  const [suggestions, setSuggestions] = useState<AITaskSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  // 加载任务建议
  const loadSuggestions = async () => {
    if (!currentUser?.onboarding?.completed) {
      setError('请先完成用户引导设置');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userStats = {
        level: gameState.level,
        totalQuestsCompleted: gameState.stats.totalQuestsCompleted,
        attributes: gameState.attributes,
      };

      const tasks = await generateDailyTaskSuggestions(currentUser.onboarding, userStats);
      setSuggestions(tasks);

      // 默认全选
      setSelectedTasks(new Set(tasks.map((_, index) => index)));
    } catch (err) {
      console.error('加载任务建议失败:', err);
      setError(err instanceof Error ? err.message : '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 打开时自动加载
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      loadSuggestions();
    }
  }, [isOpen]);

  // 切换任务选择
  const toggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  // 添加选中的任务
  const handleAddTasks = () => {
    let addedCount = 0;

    selectedTasks.forEach((index) => {
      const task = suggestions[index];
      if (task) {
        // 计算奖励（根据类型）
        const expReward = task.type === 'main' ? 70 : task.type === 'side' ? 35 : 15;
        const coinReward = task.type === 'main' ? 40 : task.type === 'side' ? 20 : 10;

        addQuest({
          title: task.title,
          description: task.description,
          type: task.type as any,
          attributes: task.attributes as any[],
          expReward,
          coinReward,
          estimatedDuration: task.estimatedDuration,
          priority: task.priority,
          tags: task.tags,
        });
        addedCount++;
      }
    });

    alert(`成功添加 ${addedCount} 个任务到任务列表！`);
    onClose();
  };

  // 获取任务类型标签样式
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'main':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'side':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'daily':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default:
        return 'bg-white/20 text-white';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'main': return '主线';
      case 'side': return '支线';
      case 'daily': return '日常';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-white/60';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-cyber-cyan" />
            <div>
              <h2 className="text-2xl font-bold text-white font-orbitron">AI 每日任务建议</h2>
              <p className="text-sm text-white/60 mt-1">根据你的目标和偏好，为你推荐今日任务</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSuggestions}
              disabled={loading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
              title="重新生成"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-cyber-cyan animate-spin mb-4" />
            <p className="text-white/60">AI 正在为你生成任务建议...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadSuggestions}
              className="px-6 py-2 bg-cyber-cyan/20 hover:bg-cyber-cyan/30 text-cyber-cyan rounded-lg transition-all"
            >
              重试
            </button>
          </div>
        )}

        {/* 任务列表 */}
        {!loading && !error && suggestions.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {suggestions.map((task, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => toggleTask(index)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTasks.has(index)
                      ? 'border-cyber-cyan bg-cyber-cyan/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 选择框 */}
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-1 transition-all ${
                      selectedTasks.has(index)
                        ? 'bg-cyber-cyan border-cyber-cyan'
                        : 'border-white/40'
                    }`}>
                      {selectedTasks.has(index) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Plus className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>

                    {/* 任务内容 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getTypeStyle(task.type)}`}>
                            {getTypeLabel(task.type)}
                          </span>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-white/70 mb-3">{task.description}</p>
                      )}

                      {/* 元信息 */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {/* 属性 */}
                        <div className="flex items-center gap-1">
                          {task.attributes.map((attr) => {
                            const attrLabels: Record<string, string> = {
                              int: '智力',
                              vit: '活力',
                              mng: '管理',
                              cre: '创造',
                            };
                            const attrColors: Record<string, string> = {
                              int: 'text-cyber-cyan',
                              vit: 'text-green-400',
                              mng: 'text-purple-400',
                              cre: 'text-pink-400',
                            };
                            return (
                              <span key={attr} className={`px-2 py-0.5 rounded ${attrColors[attr]} bg-white/10`}>
                                {attrLabels[attr]}
                              </span>
                            );
                          })}
                        </div>

                        {/* 预估时长 */}
                        <span className="text-white/60">⏱️ {task.estimatedDuration}分钟</span>

                        {/* 优先级 */}
                        <span className={getPriorityColor(task.priority)}>
                          {task.priority === 'urgent' && '🔥 紧急'}
                          {task.priority === 'high' && '⚡ 高优先级'}
                          {task.priority === 'medium' && '📌 中优先级'}
                          {task.priority === 'low' && '💤 低优先级'}
                        </span>

                        {/* 标签 */}
                        {task.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-white/10 text-white/60">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* 推荐理由 */}
                      {task.reason && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-xs text-white/70">
                            <span className="text-cyber-cyan font-medium">💡 推荐理由：</span>
                            {task.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-sm text-white/60">
                已选择 <span className="text-cyber-cyan font-bold">{selectedTasks.size}</span> / {suggestions.length} 个任务
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAddTasks}
                  disabled={selectedTasks.size === 0}
                  className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                    selectedTasks.size > 0
                      ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white hover:shadow-[0_0_20px_rgba(0,243,255,0.5)]'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  添加到任务列表
                </button>
              </div>
            </div>
          </>
        )}

        {/* 空状态 */}
        {!loading && !error && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-12 h-12 text-white/40 mb-4" />
            <p className="text-white/60 mb-4">暂无任务建议</p>
            <button
              onClick={loadSuggestions}
              className="px-6 py-2 bg-cyber-cyan/20 hover:bg-cyber-cyan/30 text-cyber-cyan rounded-lg transition-all"
            >
              生成建议
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
