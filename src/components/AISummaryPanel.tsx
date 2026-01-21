/**
 * AISummaryPanel - AI 智能总结面板
 * 使用 DeepSeek API 分析用户数据并提供个性化建议
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2, AlertCircle, Maximize2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { generateAISummary, parseAIResponse, type UserDataSummary } from '@/services/aiService';
import { QuestStatus } from '@/types/game';
import AISummaryModal from './AISummaryModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AISummaryPanel() {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  const {
    quests,
    habits,
    habitCheckIns,
    attributes,
    stats,
    level,
    getTodayHabitSummary,
  } = useGameStore((state) => ({
    quests: state.quests,
    habits: state.habits,
    habitCheckIns: state.habitCheckIns,
    attributes: state.attributes,
    stats: state.stats,
    level: state.level,
    getTodayHabitSummary: state.getTodayHabitSummary,
  }));

  // 从缓存加载AI总结
  useEffect(() => {
    loadFromCache();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 从localStorage加载缓存
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem('ai-summary-cache');
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();

        // 检查缓存是否过期（4小时有效期）
        const cacheExpiry = 4 * 60 * 60 * 1000; // 4小时

        if (now - data.timestamp < cacheExpiry) {
          console.log('[AI缓存] 从缓存加载，距上次更新:', Math.floor((now - data.timestamp) / 1000 / 60), '分钟');
          setSummary(data.summary);
          setLastUpdateTime(data.timestamp);
        } else {
          console.log('[AI缓存] 缓存已过期，已清除');
          localStorage.removeItem('ai-summary-cache');
        }
      }
    } catch (error) {
      console.error('[AI缓存] 加载失败:', error);
    }
  };

  // 保存到缓存
  const saveToCache = (summaryText: string) => {
    try {
      const data = {
        summary: summaryText,
        timestamp: Date.now(),
      };
      localStorage.setItem('ai-summary-cache', JSON.stringify(data));
      setLastUpdateTime(data.timestamp);
      console.log('[AI缓存] 已保存到缓存');
    } catch (error) {
      console.error('[AI缓存] 保存失败:', error);
    }
  };

  // 格式化更新时间
  const formatUpdateTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 准备用户数据
  const prepareUserData = (): UserDataSummary => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 计算今日任务
    const todayQuests = quests.filter((q) => {
      const checkDateRange = () => {
        const startDate = q.startDate ? new Date(q.startDate) : null;
        const endDate = q.endDate || q.deadline ? new Date(q.endDate || q.deadline!) : null;

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(0, 0, 0, 0);

        if (!startDate && !endDate) return true;
        if (startDate && !endDate) return today >= startDate;
        if (!startDate && endDate) return today <= endDate;
        if (startDate && endDate) return today >= startDate && today <= endDate;
        return false;
      };

      if (q.status === QuestStatus.COMPLETED || q.status === QuestStatus.ACTIVE) {
        return checkDateRange();
      }
      return false;
    }).filter(q => !q.parentId);

    const completedTodayQuests = todayQuests.filter(q => q.status === QuestStatus.COMPLETED).length;

    // 获取习惯数据
    const habitSummary = getTodayHabitSummary();

    // 计算总属性
    const totalAttributes = attributes.int + attributes.vit + attributes.mng + attributes.cre;

    // 收集最近7天的情绪数据
    const recentMoods = getRecentMoods(7);

    return {
      todayTasks: {
        total: todayQuests.length,
        completed: completedTodayQuests,
        completionRate: todayQuests.length > 0 ? (completedTodayQuests / todayQuests.length) * 100 : 0,
      },
      habits: {
        total: habitSummary.totalHabits,
        completedToday: habitSummary.completedHabits,
        currentStreak: habits.reduce((max, h) => Math.max(max, h.stats.currentStreak), 0),
        completionRate: habitSummary.completionRate,
      },
      recentMoods, // 添加情绪数据
      attributes: {
        int: attributes.int,
        vit: attributes.vit,
        mng: attributes.mng,
        cre: attributes.cre,
        total: totalAttributes,
      },
      stats: {
        level,
        currentStreak: stats.currentStreak,
        totalQuestsCompleted: stats.totalQuestsCompleted,
        totalFocusTime: stats.totalFocusTime,
      },
    };
  };

  // 获取最近N天的情绪数据
  const getRecentMoods = (days: number) => {
    try {
      // 从localStorage获取情绪数据（与HabitsCheckInPage保持一致）
      const storedData = localStorage.getItem('life-rpg-storage');
      if (!storedData) return undefined;

      const data = JSON.parse(storedData);
      const dailyMoods = data?.state?.dailyMoods || {};

      if (Object.keys(dailyMoods).length === 0) {
        return undefined;
      }

      const dates: string[] = [];
      const moods: string[] = [];
      const today = new Date();

      // 收集最近N天的情绪数据
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        if (dailyMoods[dateStr]) {
          dates.push(dateStr);
          moods.push(dailyMoods[dateStr]);
        }
      }

      // 如果没有情绪记录，返回undefined
      if (moods.length === 0) {
        return undefined;
      }

      return { dates, moods };
    } catch (error) {
      console.error('获取情绪数据失败:', error);
      return undefined;
    }
  };

  // 生成AI总结
  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError('');

    try {
      const userData = prepareUserData();
      const result = await generateAISummary(userData);
      setSummary(result);
      saveToCache(result); // 保存到缓存
    } catch (err) {
      console.error('生成AI总结失败:', err);
      setError('生成总结失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 使用 useMemo 缓存解析结果，避免重复解析导致闪烁
  const aiData = useMemo(() => {
    if (!summary) return null;
    return parseAIResponse(summary);
  }, [summary]);

  // 解析并渲染预览内容（增强版 - 更好的降级处理）
  const renderPreview = () => {
    if (!summary) return null;

    if (aiData) {
      // JSON 格式：显示结构化预览
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">今日得分</span>
            <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {aiData.performance.score}分
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed line-clamp-2">
            {aiData.performance.summary}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-green-500/20 text-green-600 dark:text-green-400 font-medium">
              {aiData.suggestions.length} 条建议
            </span>
            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
              {aiData.actionItems.length} 个行动
            </span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
          >
            查看完整分析报告 →
          </button>
        </div>
      );
    } else {
      // Markdown 格式或纯文本：智能降级显示
      return (
        <div className="space-y-3">
          {/* 尝试提取关键信息 */}
          {(() => {
            // 检查是否包含明显的JSON结构（但解析失败）
            const hasJsonStructure = summary.includes('{') && summary.includes('}');

            if (hasJsonStructure) {
              // 尝试提取一些有用的文本信息
              const lines = summary.split('\n').filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 0 &&
                       !trimmed.startsWith('{') &&
                       !trimmed.startsWith('}') &&
                       !trimmed.startsWith('[') &&
                       !trimmed.startsWith(']') &&
                       !trimmed.includes('```');
              });

              if (lines.length > 0) {
                return (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed mb-2">
                      {lines.slice(0, 3).join(' ')}
                    </p>
                  </div>
                );
              }

              // 如果没有可用文本，显示友好提示
              return (
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      AI 返回了数据但格式需要调整
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-white/60 mb-2">
                    点击下方查看详细内容或重新生成
                  </p>
                </div>
              );
            }

            // 正常的Markdown或文本内容
            const lines = summary.split('\n').filter(line => line.trim());
            let previewText = '';

            // 找到第一个非标题的有意义段落
            for (let line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('#') && trimmed.length > 15 && !trimmed.startsWith('```')) {
                previewText = trimmed;
                break;
              }
            }

            // 如果没找到，使用第一行非空内容
            if (!previewText && lines.length > 0) {
              previewText = lines.find(l => l.trim().length > 10) || lines[0];
            }

            if (previewText) {
              return (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: () => null,
                      h2: () => null,
                      h3: () => null,
                      p: ({ node, ...props }) => (
                        <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed mb-2 line-clamp-3" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-white/80 line-clamp-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="text-sm" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-gray-900 dark:text-white" {...props} />
                      ),
                    }}
                  >
                    {previewText}
                  </ReactMarkdown>
                </div>
              );
            }

            // 完全无法提取信息
            return (
              <div className="text-center py-2">
                <p className="text-xs text-gray-600 dark:text-white/60">
                  AI 已生成建议
                </p>
              </div>
            );
          })()}

          {/* 查看详情按钮 */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium text-center"
          >
            查看完整分析报告 →
          </button>
        </div>
      );
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-4"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-orbitron text-gray-900 dark:text-white">AI 智能建议</h3>
              <p className="text-xs text-gray-600 dark:text-white/60 font-inter">
                {isLoading
                  ? '正在分析...'
                  : summary
                    ? (lastUpdateTime > 0
                        ? `更新于 ${formatUpdateTime(lastUpdateTime)}`
                        : '基于专业理论的个性化建议')
                    : '手动点击刷新生成建议'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 查看详情按钮 */}
            {summary && !error && !isLoading && (
              <button
                onClick={() => setShowModal(true)}
                className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
                title="查看完整报告"
              >
                <Maximize2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </button>
            )}

            {/* 刷新按钮 */}
            <button
              onClick={handleGenerateSummary}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              title={summary ? "重新生成建议" : "生成AI建议"}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-white/60" />
              )}
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        {error ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
              <button
                onClick={handleGenerateSummary}
                className="text-xs text-red-600 dark:text-red-400 underline mt-1 hover:text-red-700 dark:hover:text-red-300"
              >
                重试
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : summary ? (
          renderPreview()
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 mb-2">
              暂无 AI 建议
            </p>
            <p className="text-xs text-gray-500 dark:text-white/40 mb-3">
              点击右上角刷新按钮生成个性化建议
            </p>
            <button
              onClick={handleGenerateSummary}
              className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium transition-all"
            >
              立即生成
            </button>
          </div>
        )}
      </motion.div>

      {/* AI 总结详情模态框 */}
      <AISummaryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        summary={summary}
        isLoading={isLoading}
        onRefresh={handleGenerateSummary}
      />
    </>
  );
}
