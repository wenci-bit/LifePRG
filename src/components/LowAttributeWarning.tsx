/**
 * 低属性警告组件
 * 当属性低于阈值时显示警告弹窗
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, TrendingDown } from 'lucide-react';
import { AttributeType } from '@/types/game';

interface LowAttributeWarningProps {
  warnings: Array<{
    attribute: AttributeType;
    value: number;
    level: 'critical' | 'warning' | 'low';
    message: string;
  }>;
  onClose: () => void;
  onNavigateToQuests?: () => void;
}

export default function LowAttributeWarning({
  warnings,
  onClose,
  onNavigateToQuests,
}: LowAttributeWarningProps) {
  if (warnings.length === 0) return null;

  // 只显示最严重的警告（critical > warning > low）
  const criticalWarnings = warnings.filter((w) => w.level === 'critical');
  const warningWarnings = warnings.filter((w) => w.level === 'warning');
  const displayWarnings = criticalWarnings.length > 0
    ? criticalWarnings
    : warningWarnings.length > 0
    ? warningWarnings
    : warnings;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'from-red-500 to-orange-500';
      case 'warning':
        return 'from-orange-500 to-yellow-500';
      case 'low':
        return 'from-yellow-500 to-amber-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-400" />;
      case 'low':
        return <TrendingDown className="w-6 h-6 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getLevelTitle = (level: string) => {
    switch (level) {
      case 'critical':
        return '⚠️ 属性危机';
      case 'warning':
        return '⚡ 属性警告';
      case 'low':
        return '📊 属性提醒';
      default:
        return '提醒';
    }
  };

  const attributeColors: Record<AttributeType, string> = {
    int: 'text-cyan-400',
    vit: 'text-green-400',
    mng: 'text-purple-400',
    cre: 'text-pink-400',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 背景光晕 */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${getLevelColor(
              displayWarnings[0].level
            )} opacity-20 blur-3xl rounded-3xl`}
          />

          {/* 主卡片 */}
          <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* 顶部装饰条 */}
            <div
              className={`h-1 bg-gradient-to-r ${getLevelColor(
                displayWarnings[0].level
              )}`}
            />

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <X className="w-5 h-5 text-white/60 group-hover:text-white" />
            </button>

            {/* 内容 */}
            <div className="p-6">
              {/* 标题 */}
              <div className="flex items-center gap-3 mb-6">
                {getLevelIcon(displayWarnings[0].level)}
                <h2 className="text-2xl font-bold text-white">
                  {getLevelTitle(displayWarnings[0].level)}
                </h2>
              </div>

              {/* 警告列表 */}
              <div className="space-y-4 mb-6">
                {displayWarnings.map((warning, index) => (
                  <motion.div
                    key={warning.attribute}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`text-2xl font-bold ${
                          attributeColors[warning.attribute]
                        }`}
                      >
                        {warning.value}
                      </div>
                      <div className="flex-1">
                        <p className="text-white/90 text-sm leading-relaxed">
                          {warning.message}
                        </p>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(warning.value / 100) * 100}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${getLevelColor(
                          warning.level
                        )}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 建议 */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
                <p className="text-blue-300 text-sm">
                  💡 <strong>建议：</strong>
                  完成相关任务可以提升对应属性。属性平衡发展能让你更全面地成长！
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium transition-all"
                >
                  我知道了
                </button>
                {onNavigateToQuests && (
                  <button
                    onClick={() => {
                      onNavigateToQuests();
                      onClose();
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl bg-gradient-to-r ${getLevelColor(
                      displayWarnings[0].level
                    )} text-white font-medium hover:shadow-lg hover:scale-105 transition-all`}
                  >
                    去完成任务
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
