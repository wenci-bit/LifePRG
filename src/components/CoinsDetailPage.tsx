/**
 * CoinsDetailPage - 金币详情页面
 *
 * 功能：
 * - 显示各类金币余额
 * - 金币收支统计
 * - 金币交易记录
 * - 收支趋势分析
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Heart,
  BarChart,
  Lightbulb,
  Coins,
  TrendingUp,
  TrendingDown,
  History,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { AttributeType, TransactionType } from '@/types/game';

const COIN_TYPE_CONFIG = {
  int: { name: '智慧币', icon: Brain, color: '#3b82f6', desc: '学习、科研任务' },
  vit: { name: '活力币', icon: Heart, color: '#ef4444', desc: '健康、运动任务' },
  mng: { name: '管理币', icon: BarChart, color: '#8b5cf6', desc: '规划、管理任务' },
  cre: { name: '创意币', icon: Lightbulb, color: '#f59e0b', desc: '创作、创新任务' },
  universal: { name: '通用币', icon: Coins, color: '#10b981', desc: '签到和奖励' },
};

type CoinFilterType = AttributeType | 'universal' | 'all';
type TransactionFilterType = 'all' | 'earn' | 'spend';

export default function CoinsDetailPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { categorizedCoins, coins, transactions } = useGameStore();
  const [selectedCoinType, setSelectedCoinType] = useState<CoinFilterType>('all');
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionFilterType>('all');

  // 计算总体统计
  const stats = useMemo(() => {
    const totalCoins = coins;
    const totalEarned = transactions.coins
      .filter(t => t.type === 'earn')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = transactions.coins
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      total: totalCoins,
      earned: totalEarned,
      spent: totalSpent,
      balance: totalEarned - totalSpent,
    };
  }, [coins, transactions.coins]);

  // 获取筛选后的交易记录
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.coins;

    // 按币种筛选
    if (selectedCoinType !== 'all') {
      filtered = filtered.filter(t => t.coinType === selectedCoinType || (selectedCoinType === 'universal' && t.coinType === 'all'));
    }

    // 按交易类型筛选
    if (selectedTransactionType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedTransactionType);
    }

    return filtered;
  }, [transactions.coins, selectedCoinType, selectedTransactionType]);

  // 计算各币种收支统计
  const coinTypeStats = useMemo(() => {
    const result: Record<string, { earned: number; spent: number }> = {
      int: { earned: 0, spent: 0 },
      vit: { earned: 0, spent: 0 },
      mng: { earned: 0, spent: 0 },
      cre: { earned: 0, spent: 0 },
      universal: { earned: 0, spent: 0 },
    };

    transactions.coins.forEach(t => {
      const key = t.coinType === 'all' ? 'universal' : t.coinType;
      if (t.type === 'earn') {
        result[key].earned += t.amount;
      } else {
        result[key].spent += t.amount;
      }
    });

    return result;
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

      {/* 总览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">总金币</p>
          <p className="text-3xl font-black font-mono text-cyber-cyan">{stats.total}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-600 dark:text-white/60 font-inter">累计收入</p>
          </div>
          <p className="text-3xl font-black font-mono text-green-400">+{stats.earned}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-gray-600 dark:text-white/60 font-inter">累计支出</p>
          </div>
          <p className="text-3xl font-black font-mono text-red-400">-{stats.spent}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <p className="text-sm text-gray-600 dark:text-white/60 font-inter">净收益</p>
          </div>
          <p className={`text-3xl font-black font-mono ${stats.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.balance >= 0 ? '+' : ''}{stats.balance}
          </p>
        </motion.div>
      </div>

      {/* 各币种余额卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(COIN_TYPE_CONFIG).map(([key, config], index) => {
          const coinKey = key as keyof typeof categorizedCoins;
          const Icon = config.icon;
          const balance = categorizedCoins[coinKey];
          const coinStats = coinTypeStats[key];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 cursor-pointer hover:scale-105 transition-all"
              style={{ borderLeft: `4px solid ${config.color}` }}
              onClick={() => setSelectedCoinType(key as CoinFilterType)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-orbitron">{config.name}</h3>
                  <p className="text-xs text-gray-400 font-inter">{config.desc}</p>
                </div>
              </div>

              {/* 余额 */}
              <div className="text-center mb-3">
                <p className="text-2xl font-black font-mono" style={{ color: config.color }}>
                  {balance}
                </p>
              </div>

              {/* 收支统计 */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/40 mb-1">收入</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-sm font-mono font-bold text-green-400">
                      +{coinStats.earned}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/40 mb-1">支出</p>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    <span className="text-sm font-mono font-bold text-red-400">
                      -{coinStats.spent}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 交易记录 */}
      <div className="glass-card p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white font-orbitron">交易记录</h3>
          </div>

          {/* 币种筛选 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCoinType('all')}
              className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                selectedCoinType === 'all'
                  ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                  : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
              }`}
            >
              全部币种 ({transactions.coins.length})
            </button>
            {Object.entries(COIN_TYPE_CONFIG).map(([key, config]) => {
              const count = transactions.coins.filter(
                t => t.coinType === key || (key === 'universal' && t.coinType === 'all')
              ).length;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedCoinType(key as CoinFilterType)}
                  className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                    selectedCoinType === key
                      ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                      : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                  }`}
                  style={selectedCoinType === key ? {} : { color: config.color }}
                >
                  {config.name.split('币')[0]} ({count})
                </button>
              );
            })}
          </div>

          {/* 交易类型筛选 */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTransactionType('all')}
                className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                  selectedTransactionType === 'all'
                    ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                    : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                }`}
              >
                全部 ({transactions.coins.length})
              </button>
              <button
                onClick={() => setSelectedTransactionType('earn')}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                  selectedTransactionType === 'earn'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-white/5 text-green-400 hover:bg-green-500/10'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                收入 ({transactions.coins.filter(t => t.type === 'earn').length})
              </button>
              <button
                onClick={() => setSelectedTransactionType('spend')}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                  selectedTransactionType === 'spend'
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                    : 'bg-white/5 text-red-400 hover:bg-red-500/10'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                支出 ({transactions.coins.filter(t => t.type === 'spend').length})
              </button>
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 font-inter">暂无交易记录</p>
            <p className="text-sm text-gray-500 font-inter mt-2">
              完成任务和购买物品后会记录交易
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredTransactions.map((transaction, index) => {
              const coinKey = transaction.coinType === 'all' ? 'universal' : transaction.coinType;
              const config = COIN_TYPE_CONFIG[coinKey as keyof typeof COIN_TYPE_CONFIG];
              const Icon = config?.icon || Coins;
              const isEarn = transaction.type === 'earn';
              const isRevoked = transaction.revoked || false;

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
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: isRevoked ? '#71717a20' : `${config?.color || '#10b981'}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: isRevoked ? '#71717a' : config?.color || '#10b981' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className={`font-bold font-inter ${
                            isRevoked ? 'text-gray-400' : 'text-white'
                          }`}>
                            {transaction.reason}
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
                            {isEarn ? '+' : '-'}{transaction.amount}
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
                            <span>{new Date(transaction.timestamp).toLocaleString('zh-CN')}</span>
                          </div>
                          <span className={`text-xs ${isRevoked ? 'text-gray-500' : ''}`} style={{ color: isRevoked ? undefined : config?.color || '#10b981' }}>
                            {config?.name || '通用币'}
                          </span>
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
