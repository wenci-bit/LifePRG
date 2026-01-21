/**
 * AISummaryModal - AI 总结详情模态框（结构化UI版本）
 * 解析 JSON 格式的 AI 输出并呈现专业的结构化界面
 */

'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, TrendingUp, AlertTriangle, CheckCircle2, Target, Lightbulb, Heart } from 'lucide-react';
import { parseAIResponse, type AIResponse } from '@/services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AISummaryModal({
  isOpen,
  onClose,
  summary,
  isLoading,
  onRefresh,
}: AISummaryModalProps) {
  // 使用 useMemo 缓存解析结果，避免重复解析
  const aiData: AIResponse | null = useMemo(() => {
    return summary ? parseAIResponse(summary) : null;
  }, [summary]);

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 根据优先级获取颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'from-red-500 to-orange-500';
      case 'medium':
        return 'from-yellow-500 to-amber-500';
      case 'low':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      case 'low':
        return '低优先级';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 模态框 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-5xl max-h-[90vh] glass-card pointer-events-auto overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-orbitron text-gray-900 dark:text-white">
                      AI 智能分析报告
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-white/60 font-inter">
                      基于专业理论的个性化建议
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 刷新按钮 */}
                  <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    title="重新生成"
                  >
                    <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-white/60 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>

                  {/* 关闭按钮 */}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-white/60" />
                  </button>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 animate-pulse">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-600 dark:text-white/60 font-inter">
                      AI 正在分析您的数据...
                    </p>
                  </div>
                ) : aiData ? (
                  <div className="space-y-6">
                    {/* 今日表现评分 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                    >
                      <div className="flex items-start gap-6">
                        {/* 分数圆环 */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-white/10"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="url(#scoreGradient)"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 56}`}
                              strokeDashoffset={`${2 * Math.PI * 56 * (1 - aiData.performance.score / 100)}`}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            />
                            <defs>
                              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#ec4899" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black font-mono text-gray-900 dark:text-white">
                              {aiData.performance.score}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-white/60 font-inter">分</span>
                          </div>
                        </div>

                        {/* 表现总结 */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold font-orbitron text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                            今日表现评价
                          </h3>
                          <p className="text-gray-700 dark:text-white/80 leading-relaxed mb-4 font-inter">
                            {aiData.performance.summary}
                          </p>

                          {/* 亮点和关注点 */}
                          <div className="grid grid-cols-2 gap-4">
                            {aiData.performance.highlights.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 mb-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400 font-inter">亮点</span>
                                </div>
                                <ul className="space-y-1">
                                  {aiData.performance.highlights.map((item, index) => (
                                    <li key={index} className="text-sm text-gray-700 dark:text-white/70 font-inter flex items-start gap-1">
                                      <span className="text-green-500">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {aiData.performance.concerns.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-inter">关注点</span>
                                </div>
                                <ul className="space-y-1">
                                  {aiData.performance.concerns.map((item, index) => (
                                    <li key={index} className="text-sm text-gray-700 dark:text-white/70 font-inter flex items-start gap-1">
                                      <span className="text-amber-500">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 专业建议 */}
                    {aiData.suggestions.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold font-orbitron text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-500" />
                          专业建议
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiData.suggestions.map((suggestion, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="glass-card p-5 hover:scale-[1.02] transition-transform"
                            >
                              {/* 头部：图标、标题、优先级 */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="text-3xl">{suggestion.icon}</div>
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white font-inter">
                                      {suggestion.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-white/60 font-inter">
                                      {suggestion.category}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getPriorityColor(suggestion.priority)}`}
                                >
                                  {getPriorityText(suggestion.priority)}
                                </span>
                              </div>

                              {/* 内容 */}
                              <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed mb-3 font-inter">
                                {suggestion.content}
                              </p>

                              {/* 理论标签 */}
                              <div className="flex items-center gap-1 pt-3 border-t border-white/10">
                                <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                                  📚 {suggestion.theory}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 行动要点 */}
                    {aiData.actionItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                      >
                        <h3 className="text-xl font-bold font-orbitron text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-green-500" />
                          今日行动要点
                        </h3>
                        <div className="space-y-3">
                          {aiData.actionItems.map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-white">{index + 1}</span>
                              </div>
                              <p className="text-gray-700 dark:text-white/80 font-inter flex-1">
                                {item}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 温馨鼓励 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-center"
                    >
                      <Heart className="w-8 h-8 text-pink-500 mx-auto mb-3" />
                      <p className="text-lg text-gray-900 dark:text-white font-inter italic">
                        {aiData.encouragement}
                      </p>
                    </motion.div>
                  </div>
                ) : summary ? (
                  /* 降级到 Markdown 显示（增强版） */
                  <div>
                    {/* 如果包含JSON结构但解析失败，显示提示 */}
                    {summary.includes('{') && summary.includes('}') && (
                      <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                              AI 返回了数据但格式需要调整
                            </p>
                            <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">
                              建议点击刷新按钮重新生成。如果问题持续，可以查看下方的原始内容。
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Markdown渲染 */}
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => (
                            <h1 className="text-3xl font-bold font-orbitron text-gray-900 dark:text-white mb-4 mt-6 first:mt-0" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-2xl font-bold font-orbitron text-gray-900 dark:text-white mb-3 mt-6 first:mt-0 pb-2 border-b border-gray-200 dark:border-white/10" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-xl font-bold font-inter text-gray-900 dark:text-white mb-2 mt-4" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="text-gray-700 dark:text-white/80 leading-relaxed mb-4 font-inter" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-white/80 font-inter" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700 dark:text-white/80 font-inter" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="ml-4" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="font-bold text-gray-900 dark:text-white" {...props} />
                          ),
                          em: ({ node, ...props }) => (
                            <em className="italic text-purple-600 dark:text-purple-400" {...props} />
                          ),
                          code: ({ node, inline, ...props }: any) =>
                            inline ? (
                              <code className="px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-purple-600 dark:text-purple-400 font-mono text-sm" {...props} />
                            ) : (
                              <code className="block p-4 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-mono text-sm overflow-x-auto mb-4" {...props} />
                            ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-purple-500 pl-4 py-2 mb-4 bg-purple-500/10 rounded-r text-gray-700 dark:text-white/80 italic" {...props} />
                          ),
                          hr: ({ node, ...props }) => (
                            <hr className="my-6 border-t-2 border-gray-200 dark:border-white/10" {...props} />
                          ),
                          a: ({ node, ...props }) => (
                            <a className="text-purple-600 dark:text-purple-400 hover:underline" {...props} />
                          ),
                        }}
                      >
                        {summary}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-white/60 font-inter">
                      暂无分析结果
                    </p>
                  </div>
                )}
              </div>

              {/* 底部 */}
              <div className="flex items-center justify-between p-4 border-t border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <p className="text-xs text-gray-600 dark:text-white/60 font-inter">
                  💡 建议基于心理学、营养学等专业理论，仅供参考
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium transition-all"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
