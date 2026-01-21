/**
 * ExpDetailPage - 经验详情页面
 *
 * 功能：
 * - 显示经验值信息
 * - 经验获取统计
 * - 经验交易记录
 * - 升级历史追踪
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  History,
  Calendar,
  ArrowUpCircle,
  Star,
  Trophy,
  Award,
  ArrowLeft,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { LEVEL_TITLES } from '@/data/levels';

export default function ExpDetailPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { level, currentExp, maxExp, transactions } = useGameStore();

  // 计算总体统计
  const stats = useMemo(() => {
    // 只统计未撤销的经验记录
    const totalEarned = transactions.exp
      .filter(t => t.type === 'earn' && !t.revoked)
      .reduce((sum, t) => sum + t.amount, 0);

    // 计算当前等级所需总经验
    let totalExpForCurrentLevel = 0;
    for (let i = 1; i <= level; i++) {
      totalExpForCurrentLevel += Math.floor(i * 100 * 1.5);
    }

    // 获取下一个里程碑等级
    const nextMilestone = LEVEL_TITLES.find(l => l.level > level);

    return {
      current: currentExp,
      max: maxExp,
      progress: (currentExp / maxExp) * 100,
      totalEarned,
      totalExpUsed: totalExpForCurrentLevel - maxExp + currentExp,
      nextMilestone,
    };
  }, [level, currentExp, maxExp, transactions.exp]);

  // 按来源分组统计（只统计未撤销的记录）
  const sourceStats = useMemo(() => {
    const sources: Record<string, number> = {};

    transactions.exp.forEach(t => {
      if (t.type === 'earn' && !t.revoked) { // 只统计未撤销的获得记录
        // 将"未知来源"重命名为"历史数据"以更好地说明
        const sourceName = t.reason === '未知来源' ? '历史数据（修复前）' : t.reason;
        if (!sources[sourceName]) {
          sources[sourceName] = 0;
        }
        sources[sourceName] += t.amount;
      }
    });

    return Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // 只显示前5个来源
  }, [transactions.exp]);

  // 获取最近的升级记录（从金币交易记录中提取）
  const recentLevelUps = useMemo(() => {
    // 从金币交易记录中提取升级奖励记录（包括撤销状态）
    const levelUpRecords = transactions.coins
      .filter(t => t.type === 'earn' && t.reason.startsWith('升级到等级'))
      .map(t => {
        // 从reason中提取等级号："升级到等级 5" -> 5
        const match = t.reason.match(/升级到等级\s+(\d+)/);
        const level = match ? parseInt(match[1], 10) : 0;

        return {
          level,
          timestamp: t.timestamp,
          coins: t.amount,
          revoked: t.revoked || false, // 包含撤销状态
          revokeReason: t.revokeReason,
          revokedAt: t.revokedAt,
        };
      })
      .filter(record => record.level > 0) // 过滤无效记录
      .sort((a, b) => b.timestamp - a.timestamp); // 按时间倒序，不限制数量

    // 返回所有升级记录，不再限制为10条
    return levelUpRecords;
  }, [transactions.coins]);

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

      {/* 当前经验状态 */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white font-orbitron mb-1">等级 {level}</h2>
            <p className="text-sm text-gray-400 font-inter">
              {LEVEL_TITLES.find(l => l.level === level)?.title || '冒险者'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">经验进度</p>
            <p className="text-2xl font-bold text-cyber-cyan font-mono">
              {currentExp} / {maxExp}
            </p>
          </div>
        </div>

        {/* 经验进度条 */}
        <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden mb-4">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyber-cyan to-cyber-purple"
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white font-mono drop-shadow-lg">
              {stats.progress.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 下一个里程碑 */}
        {stats.nextMilestone && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-cyber-purple/30">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-400">下一个里程碑</p>
              <p className="text-white font-bold">
                等级 {stats.nextMilestone.level} - {stats.nextMilestone.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">奖励</p>
              <p className="text-sm text-yellow-400 font-bold">
                {stats.nextMilestone.rewards.coins} 金币
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-600 dark:text-white/60 font-inter">累计获得</p>
          </div>
          <p className="text-3xl font-black font-mono text-green-400">+{stats.totalEarned}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-purple-400" />
            <p className="text-sm text-gray-600 dark:text-white/60 font-inter">已用于升级</p>
          </div>
          <p className="text-3xl font-black font-mono text-purple-400">{stats.totalExpUsed}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <p className="text-sm text-gray-600 dark:text-white/60 font-inter">获取次数</p>
          </div>
          <p className="text-3xl font-black font-mono text-cyan-400">
            {transactions.exp.filter(t => t.type === 'earn').length}
          </p>
        </motion.div>
      </div>

      {/* 经验来源统计 */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white font-orbitron">经验来源 TOP 5</h3>
        </div>

        {sourceStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 font-inter">暂无经验获取记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sourceStats.map(([source, amount], index) => {
              const percentage = (amount / stats.totalEarned) * 100;
              return (
                <div key={source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-cyber-cyan font-mono">
                        #{index + 1}
                      </span>
                      <span className="text-white font-inter">{source}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-cyber-purple font-bold font-mono mr-2">
                        +{amount}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-purple"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 升级历史 */}
      {recentLevelUps.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-white font-orbitron">
                升级历史 ({recentLevelUps.length} 次)
              </h3>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {recentLevelUps.map((levelUp, index) => {
              const levelData = LEVEL_TITLES.find(l => l.level === levelUp.level);
              const isRevoked = levelUp.revoked;

              return (
                <motion.div
                  key={`${levelUp.level}-${levelUp.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card p-4 hover:bg-white/5 transition-all ${
                    isRevoked ? 'opacity-60 border-l-4 border-gray-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isRevoked
                          ? 'bg-gray-500/20'
                          : 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                      }`}>
                        <Trophy className={`w-6 h-6 ${
                          isRevoked ? 'text-gray-400' : 'text-yellow-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold font-orbitron ${
                            isRevoked ? 'text-gray-400' : 'text-white'
                          }`}>
                            等级 {levelUp.level}
                          </h4>
                          {isRevoked && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-500/30 text-gray-300">
                              已撤销
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          isRevoked ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {levelData?.title || '冒险者'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${
                        isRevoked ? 'text-gray-600' : 'text-gray-500'
                      }`}>
                        {new Date(levelUp.timestamp).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                      <p className={`text-sm font-mono ${
                        isRevoked ? 'text-gray-500' : 'text-yellow-400'
                      }`}>
                        +{levelUp.coins} 金币
                      </p>
                    </div>
                  </div>
                  {isRevoked && levelUp.revokeReason && (
                    <div className="mt-2 text-xs text-gray-500 border-t border-gray-500/20 pt-2">
                      <p>撤销原因：{levelUp.revokeReason}</p>
                      {levelUp.revokedAt && (
                        <p className="mt-1">
                          撤销时间：{new Date(levelUp.revokedAt).toLocaleString('zh-CN')}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 经验交易记录 */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white font-orbitron">
            经验记录 ({transactions.exp.length})
          </h3>
        </div>

        {transactions.exp.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 font-inter">暂无经验记录</p>
            <p className="text-sm text-gray-500 font-inter mt-2">
              完成任务和签到后会记录经验获取
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {transactions.exp.map((transaction, index) => {
              const isEarn = transaction.type === 'earn';
              const isRevoked = transaction.revoked || false;
              // 将"未知来源"改为"历史数据（修复前）"
              const displayReason = transaction.reason === '未知来源' ? '历史数据（修复前）' : transaction.reason;

              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card p-4 hover:bg-white/5 transition-all ${
                    isRevoked ? 'opacity-60 border-l-4 border-gray-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        isRevoked ? 'bg-gray-500/20' : isEarn ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        <Zap className={`w-5 h-5 ${
                          isRevoked ? 'text-gray-400' : isEarn ? 'text-green-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className={`font-bold font-inter ${
                            isRevoked ? 'text-gray-400' : 'text-white'
                          }`}>
                            {displayReason}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              isRevoked
                                ? 'bg-gray-500/20 text-gray-400'
                                : isEarn
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {isEarn ? '+' : '-'}{transaction.amount} EXP
                          </span>
                          {isRevoked && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-500/30 text-gray-300">
                              已撤销
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(transaction.timestamp).toLocaleString('zh-CN')}</span>
                        </div>
                        {isRevoked && transaction.revokeReason && (
                          <div className="mt-2 text-xs text-gray-500 border-t border-gray-500/20 pt-2">
                            <p>撤销原因：{transaction.revokeReason}</p>
                            {transaction.revokedAt && (
                              <p className="mt-1">
                                撤销时间：{new Date(transaction.revokedAt).toLocaleString('zh-CN')}
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
