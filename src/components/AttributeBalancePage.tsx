/**
 * AttributeBalancePage - 属性平衡详情页面
 *
 * 功能：
 * - 显示各属性的当前值和健康度
 * - 展示属性衰减记录和时间线
 * - 提供属性平衡建议
 * - 显示衰减配置
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Heart,
  BarChart,
  Lightbulb,
  TrendingDown,
  AlertTriangle,
  Clock,
  Activity,
  Calendar,
  Settings,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { AttributeType, AttributeRecord } from '@/types/game';

const ATTRIBUTE_CONFIG = {
  int: { name: '智力', icon: Brain, color: '#3b82f6', desc: '学习与科研能力' },
  vit: { name: '活力', icon: Heart, color: '#ef4444', desc: '健康与体能状态' },
  mng: { name: '管理', icon: BarChart, color: '#8b5cf6', desc: '规划与执行能力' },
  cre: { name: '创造', icon: Lightbulb, color: '#f59e0b', desc: '创新与想象力' },
};

export default function AttributeBalancePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const {
    attributes,
    attributeRecords,
    attributeDecayConfig,
    getAttributeHealth,
    getDecayingAttributes,
  } = useGameStore();

  const [selectedAttribute, setSelectedAttribute] = useState<AttributeType | null>(null);

  // 计算各属性的健康度
  const attributeHealthScores = useMemo(() => {
    return {
      int: getAttributeHealth('int'),
      vit: getAttributeHealth('vit'),
      mng: getAttributeHealth('mng'),
      cre: getAttributeHealth('cre'),
    };
  }, [attributeRecords, getAttributeHealth]);

  // 获取所有正在衰减的属性记录
  const decayingRecords = useMemo(() => {
    return getDecayingAttributes();
  }, [attributeRecords, getDecayingAttributes]);

  // 按属性分组衰减记录
  const recordsByAttribute = useMemo(() => {
    const grouped: Record<AttributeType, AttributeRecord[]> = {
      int: [],
      vit: [],
      mng: [],
      cre: [],
    };

    decayingRecords.forEach(record => {
      grouped[record.attribute].push(record);
    });

    // 每个属性的记录按时间倒序排列
    Object.keys(grouped).forEach(attr => {
      grouped[attr as AttributeType].sort((a, b) => b.gainedAt - a.gainedAt);
    });

    return grouped;
  }, [decayingRecords]);

  // 获取健康度颜色
  const getHealthColor = (health: number) => {
    if (health >= 70) return 'text-green-400';
    if (health >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // 获取健康度背景色
  const getHealthBgColor = (health: number) => {
    if (health >= 70) return 'from-green-500/20 to-emerald-500/20';
    if (health >= 40) return 'from-yellow-500/20 to-orange-500/20';
    return 'from-red-500/20 to-rose-500/20';
  };

  // 计算衰减进度
  const getDecayProgress = (record: AttributeRecord) => {
    return (record.currentValue / record.amount) * 100;
  };

  // 计算剩余天数
  const getRemainingDays = (record: AttributeRecord) => {
    const now = Date.now();
    const daysPassed = (now - record.gainedAt) / (1000 * 60 * 60 * 24);
    const remainingDays = record.halfLifeDays - daysPassed;
    return Math.max(0, Math.floor(remainingDays));
  };

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-inter">返回主页</span>
        </button>
      )}

      {/* 页面标题 */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white font-orbitron">属性平衡系统</h1>
            <p className="text-sm text-gray-400 font-inter mt-1">
              属性会随时间自然衰减，需要持续完成任务来保持平衡
            </p>
          </div>
        </div>

        {/* 系统说明 */}
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300 font-inter">
              <p className="mb-2">
                <strong className="text-blue-400">属性衰减机制：</strong>
                每个属性都有自己的半衰期，会随时间自然衰减。
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
                <li><strong className="text-red-400">活力（VIT）</strong>：7天半衰期 - 运动效果衰减最快</li>
                <li><strong className="text-purple-400">管理（MNG）</strong>：10天半衰期 - 规划能力需持续锻炼</li>
                <li><strong className="text-yellow-400">创造（CRE）</strong>：12天半衰期 - 创意灵感需要保持</li>
                <li><strong className="text-blue-400">智力（INT）</strong>：14天半衰期 - 知识保留时间最长</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 属性健康度卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(ATTRIBUTE_CONFIG).map(([key, config], index) => {
          const attrKey = key as AttributeType;
          const Icon = config.icon;
          const health = attributeHealthScores[attrKey];
          const value = attributes[attrKey];
          const activeRecords = recordsByAttribute[attrKey].length;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-5 cursor-pointer hover:scale-105 transition-all"
              style={{ borderLeft: `4px solid ${config.color}` }}
              onClick={() => setSelectedAttribute(attrKey)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <Icon className="w-8 h-8" style={{ color: config.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-orbitron">{config.name}</h3>
                  <p className="text-xs text-gray-400 font-inter">{config.desc}</p>
                </div>
              </div>

              {/* 当前值 */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">当前值</p>
                <p className="text-4xl font-black font-mono" style={{ color: config.color }}>
                  {value}
                </p>
              </div>

              {/* 健康度 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">健康度</span>
                  <span className={`text-sm font-bold ${getHealthColor(health)}`}>
                    {health}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${getHealthBgColor(health)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${health}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
              </div>

              {/* 活跃记录数 */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-gray-400">活跃记录</span>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {activeRecords} 条
                </span>
              </div>

              {/* 健康警告 */}
              {health < 40 && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-inter">需要关注</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 衰减记录详情 */}
      {selectedAttribute ? (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-white font-orbitron">
                {ATTRIBUTE_CONFIG[selectedAttribute].name}衰减记录
              </h3>
            </div>
            <button
              onClick={() => setSelectedAttribute(null)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm"
            >
              关闭
            </button>
          </div>

          {recordsByAttribute[selectedAttribute].length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 font-inter">暂无衰减记录</p>
              <p className="text-sm text-gray-500 font-inter mt-2">
                完成任务后会自动记录属性获取
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {recordsByAttribute[selectedAttribute].map((record, index) => {
                const progress = getDecayProgress(record);
                const remainingDays = getRemainingDays(record);
                const config = ATTRIBUTE_CONFIG[selectedAttribute];

                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-4 hover:bg-white/5 transition-all"
                  >
                    <div className="space-y-3">
                      {/* 记录标题 */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-white font-inter mb-1">
                            {record.reason}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(record.gainedAt).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>剩余 {remainingDays} 天</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">获得/当前</p>
                          <p className="font-mono font-bold" style={{ color: config.color }}>
                            {record.amount.toFixed(1)} / {record.currentValue.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      {/* 衰减进度条 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">保留进度</span>
                          <span className={`text-xs font-bold ${
                            progress >= 70 ? 'text-green-400' :
                            progress >= 40 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              progress >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              progress >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-rose-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      {/* 衰减配置 */}
                      <div className="flex items-center gap-4 pt-2 border-t border-white/10 text-xs text-gray-400">
                        <span>半衰期: {record.halfLifeDays} 天</span>
                        <span>衰减率: {(record.decayRate * 100).toFixed(0)}%/天</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 全部衰减记录概览 */
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white font-orbitron">
              所有衰减记录 ({decayingRecords.length})
            </h3>
          </div>

          {decayingRecords.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 font-inter">暂无衰减记录</p>
              <p className="text-sm text-gray-500 font-inter mt-2">
                完成任务后会自动记录属性获取并追踪衰减
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(recordsByAttribute).map(([attr, records]) => {
                const attrKey = attr as AttributeType;
                const config = ATTRIBUTE_CONFIG[attrKey];
                const Icon = config.icon;
                const totalCurrent = records.reduce((sum, r) => sum + r.currentValue, 0);
                const totalOriginal = records.reduce((sum, r) => sum + r.amount, 0);

                if (records.length === 0) return null;

                return (
                  <motion.div
                    key={attr}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => setSelectedAttribute(attrKey)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{config.name}</h4>
                        <p className="text-xs text-gray-400">{records.length} 条记录</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">原始总值</span>
                        <span className="font-mono font-bold text-white">
                          {totalOriginal.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">当前总值</span>
                        <span className="font-mono font-bold" style={{ color: config.color }}>
                          {totalCurrent.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">保留率</span>
                        <span className={`font-mono font-bold ${
                          (totalCurrent / totalOriginal * 100) >= 70 ? 'text-green-400' :
                          (totalCurrent / totalOriginal * 100) >= 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {((totalCurrent / totalOriginal) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 衰减配置 */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white font-orbitron">衰减配置</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(ATTRIBUTE_CONFIG).map(([key, config]) => {
            const attrKey = key as AttributeType;
            const decayConfig = attributeDecayConfig[attrKey];
            const Icon = config.icon;

            return (
              <div
                key={key}
                className="glass-card p-4"
                style={{ borderLeft: `4px solid ${config.color}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                  <h4 className="font-bold text-white">{config.name}</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">半衰期</span>
                    <span className="font-mono text-white">
                      {decayConfig.halfLifeDays} 天
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">每日衰减</span>
                    <span className="font-mono text-red-400">
                      {(decayConfig.decayRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">最小值</span>
                    <span className="font-mono text-white">
                      {decayConfig.minValue}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">状态</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      decayConfig.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {decayConfig.enabled ? '启用' : '禁用'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
