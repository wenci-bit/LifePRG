/**
 * AttributesDetailPage - 属性详情页面
 *
 * 功能：
 * - 显示四维属性的详细数据
 * - 属性雷达图
 * - 属性历史变化记录
 * - 属性来源统计
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Heart, BarChart, Lightbulb, TrendingUp, History,
  ArrowUp, ArrowDown, Calendar, ArrowLeft
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { AttributeType } from '@/types/game';

const ATTRIBUTE_CONFIG = {
  int: { name: '智力 (INT)', icon: Brain, color: '#3b82f6', desc: '科研、学习能力' },
  vit: { name: '活力 (VIT)', icon: Heart, color: '#ef4444', desc: '健康、运动能力' },
  mng: { name: '管理 (MNG)', icon: BarChart, color: '#8b5cf6', desc: '规划、管理能力' },
  cre: { name: '创意 (CRE)', icon: Lightbulb, color: '#f59e0b', desc: '创作、创新能力' },
};

export default function AttributesDetailPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { attributes, transactions } = useGameStore();
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeType | 'all'>('all');

  // 计算属性统计
  const stats = useMemo(() => {
    const total = attributes.int + attributes.vit + attributes.mng + attributes.cre;
    const avg = total / 4;
    const max = Math.max(attributes.int, attributes.vit, attributes.mng, attributes.cre);
    const min = Math.min(attributes.int, attributes.vit, attributes.mng, attributes.cre);

    return { total, avg, max, min };
  }, [attributes]);

  // 获取筛选后的属性变化记录
  const filteredChanges = useMemo(() => {
    if (selectedAttribute === 'all') {
      return transactions.attributes;
    }
    return transactions.attributes.filter(change => change.attribute === selectedAttribute);
  }, [transactions.attributes, selectedAttribute]);

  // 计算各属性的增长趋势
  const growthStats = useMemo(() => {
    const result: Record<AttributeType, { total: number; changes: number }> = {
      int: { total: 0, changes: 0 },
      vit: { total: 0, changes: 0 },
      mng: { total: 0, changes: 0 },
      cre: { total: 0, changes: 0 },
    };

    transactions.attributes.forEach(change => {
      result[change.attribute].total += change.change;
      result[change.attribute].changes += 1;
    });

    return result;
  }, [transactions.attributes]);

  return (
    <div className="space-y-6">
      {/* 返回按钮和属性平衡导航 */}
      {onNavigate && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-inter">返回主页</span>
          </button>
          <button
            onClick={() => onNavigate('balance')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white hover:opacity-80 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-inter">查看属性平衡</span>
          </button>
        </div>
      )}

      {/* 总览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">总属性值</p>
          <p className="text-3xl font-black font-mono text-cyber-cyan">{stats.total}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">平均值</p>
          <p className="text-3xl font-black font-mono text-cyber-purple">{stats.avg.toFixed(1)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">最高值</p>
          <p className="text-3xl font-black font-mono text-green-400">{stats.max}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">最低值</p>
          <p className="text-3xl font-black font-mono text-orange-400">{stats.min}</p>
        </motion.div>
      </div>

      {/* 属性详细卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(ATTRIBUTE_CONFIG).map(([key, config], index) => {
          const attrKey = key as AttributeType;
          const Icon = config.icon;
          const value = attributes[attrKey];
          const growth = growthStats[attrKey];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 cursor-pointer hover:scale-105 transition-all"
              style={{ borderLeft: `4px solid ${config.color}` }}
              onClick={() => setSelectedAttribute(attrKey)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: config.color }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-orbitron">{config.name}</h3>
                    <p className="text-sm text-gray-400 font-inter">{config.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black font-mono" style={{ color: config.color }}>
                    {value}
                  </p>
                </div>
              </div>

              {/* 增长统计 */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/40 mb-1">累计增长</p>
                  <div className="flex items-center gap-1">
                    {growth.total > 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`font-mono font-bold ${growth.total > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {growth.total > 0 ? '+' : ''}{growth.total}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/40 mb-1">变化次数</p>
                  <p className="font-mono font-bold text-cyan-400">{growth.changes}次</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 变化记录 */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white font-orbitron">变化记录</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedAttribute('all')}
              className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                selectedAttribute === 'all'
                  ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                  : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
              }`}
            >
              全部 ({transactions.attributes.length})
            </button>
            {Object.entries(ATTRIBUTE_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedAttribute(key as AttributeType)}
                className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                  selectedAttribute === key
                    ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                    : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                }`}
                style={selectedAttribute === key ? {} : { color: config.color }}
              >
                {config.name.split('(')[1].replace(')', '')}
              </button>
            ))}
          </div>
        </div>

        {filteredChanges.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 font-inter">暂无变化记录</p>
            <p className="text-sm text-gray-500 font-inter mt-2">
              完成任务和兑换物品后会记录属性变化
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredChanges.map((change, index) => {
              const config = ATTRIBUTE_CONFIG[change.attribute];
              const Icon = config.icon;
              const isRevoked = change.revoked || false;

              return (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card p-4 hover:bg-white/5 transition-all ${
                    isRevoked ? 'opacity-60 border-l-4 border-gray-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: isRevoked ? '#71717a20' : `${config.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: isRevoked ? '#71717a' : config.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className={`font-bold font-inter ${
                            isRevoked ? 'text-gray-400' : 'text-white'
                          }`}>
                            {change.reason}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              isRevoked
                                ? 'bg-gray-500/20 text-gray-400'
                                : change.change > 0
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {change.change > 0 ? '+' : ''}{change.change}
                          </span>
                          {isRevoked && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-500/30 text-gray-300">
                              已撤销
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(change.timestamp).toLocaleString('zh-CN')}</span>
                          </div>
                          <span className={`font-mono ${isRevoked ? 'text-gray-500' : ''}`}>
                            {change.oldValue} → {change.newValue}
                          </span>
                        </div>
                        {isRevoked && change.revokeReason && (
                          <div className="mt-2 text-xs text-gray-500 border-t border-gray-500/20 pt-2">
                            <p>撤销原因：{change.revokeReason}</p>
                            {change.revokedAt && (
                              <p className="mt-1">
                                撤销时间：{new Date(change.revokedAt).toLocaleString('zh-CN')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
