/**
 * InventoryPage - 背包页面
 *
 * 功能：
 * - 展示已兑换的物品
 * - 按类型分类显示
 * - 点击物品查看详情
 * - 支持使用物品
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Sparkles, Clock, Trash2, Calendar, Filter, Search
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { InventoryItem, ItemType } from '@/types/game';
import ItemDetailModal from './ItemDetailModal';
import { getIconComponent } from '@/utils/iconMap';

// 物品类型配置
const ITEM_TYPE_CONFIG: Record<ItemType, { label: string; color: string; icon: JSX.Element }> = {
  consumable: {
    label: '消耗品',
    color: '#10b981',
    icon: <Sparkles className="w-4 h-4" />,
  },
  permanent: {
    label: '永久物品',
    color: '#8b5cf6',
    icon: <Package className="w-4 h-4" />,
  },
  time_limited: {
    label: '限时物品',
    color: '#f59e0b',
    icon: <Clock className="w-4 h-4" />,
  },
};

// 稀有度配置
const RARITY_CONFIG = {
  common: { label: '普通', color: '#9ca3af', glow: 'rgba(156, 163, 175, 0.2)' },
  rare: { label: '稀有', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
  epic: { label: '史诗', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  legendary: { label: '传说', color: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' },
};

export default function InventoryPage() {
  const inventory = useGameStore((state) => state.inventory);
  const removeFromInventory = useGameStore((state) => state.removeFromInventory);

  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showEmptyItems, setShowEmptyItems] = useState(true); // 显示已用完的物品

  // 过滤物品
  const filteredItems = useMemo(() => {
    let filtered = inventory;

    // 按"显示已用完"筛选
    if (!showEmptyItems) {
      filtered = filtered.filter(item => item.quantity > 0);
    }

    // 按类型过滤
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // 按搜索关键词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    // 按获得时间倒序排序
    return filtered.sort((a, b) => b.acquiredAt - a.acquiredAt);
  }, [inventory, selectedType, searchQuery, showEmptyItems]);

  // 统计数据
  const stats = useMemo(() => {
    return {
      total: inventory.length,
      consumable: inventory.filter(i => i.type === 'consumable').length,
      permanent: inventory.filter(i => i.type === 'permanent').length,
      time_limited: inventory.filter(i => i.type === 'time_limited').length,
      totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
      emptyItems: inventory.filter(i => i.quantity === 0).length, // 已用完的物品数
    };
  }, [inventory]);

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('确定要删除这个物品吗？')) {
      removeFromInventory(itemId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">物品总数</p>
          <p className="text-3xl font-black font-mono text-cyber-cyan">{stats.total}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">总数量</p>
          <p className="text-3xl font-black font-mono text-cyber-purple">{stats.totalQuantity}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">消耗品</p>
          <p className="text-3xl font-black font-mono text-green-400">{stats.consumable}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter mb-1">永久物品</p>
          <p className="text-3xl font-black font-mono text-purple-400">{stats.permanent}</p>
        </motion.div>
      </div>

      {/* 筛选和搜索 */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 类型筛选 */}
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-5 h-5 text-gray-600 dark:text-white/60" />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                  selectedType === 'all'
                    ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                    : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                }`}
              >
                全部 ({stats.total})
              </button>
              {Object.entries(ITEM_TYPE_CONFIG).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type as ItemType)}
                  className={`px-4 py-2 rounded-lg font-inter text-sm transition-all flex items-center gap-2 ${
                    selectedType === type
                      ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                      : 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                  }`}
                  style={selectedType === type ? {} : { color: config.color }}
                >
                  {config.icon}
                  {config.label} ({stats[type as keyof typeof stats]})
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：显示已用完切换和搜索 */}
          <div className="flex items-center gap-2">
            {/* 显示已用完切换 */}
            {stats.emptyItems > 0 && (
              <button
                onClick={() => setShowEmptyItems(!showEmptyItems)}
                className={`px-4 py-2 rounded-lg font-inter text-sm transition-all whitespace-nowrap ${
                  showEmptyItems
                    ? 'bg-white/5 text-gray-600 dark:text-white/60 hover:bg-white/10'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                }`}
              >
                {showEmptyItems ? `隐藏已用完 (${stats.emptyItems})` : `显示已用完 (${stats.emptyItems})`}
              </button>
            )}

            {/* 搜索框 */}
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2 min-w-[200px]">
              <Search className="w-5 h-5 text-gray-600 dark:text-white/60" />
              <input
                type="text"
                placeholder="搜索物品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-gray-900 dark:text-white font-inter text-sm flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 物品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full glass-card p-12 text-center"
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-white/40" />
              <p className="text-lg text-gray-600 dark:text-white/60 font-inter mb-2">
                {searchQuery ? '没有找到匹配的物品' : '背包空空如也'}
              </p>
              <p className="text-sm text-gray-500 dark:text-white/40 font-inter">
                {searchQuery ? '试试其他搜索关键词' : '去商店兑换一些奖励吧！'}
              </p>
            </motion.div>
          ) : (
            filteredItems.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                index={index}
                onClick={() => setSelectedItem(item)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 物品详情弹窗 */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

// 物品卡片组件
function ItemCard({
  item,
  index,
  onClick,
  onDelete,
}: {
  item: InventoryItem;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}) {
  const typeConfig = ITEM_TYPE_CONFIG[item.type];
  const rarityConfig = RARITY_CONFIG[item.rarity];

  // 获取图标组件
  const IconComponent = getIconComponent(item.icon);

  // 检查是否过期
  const isExpired = item.expiresAt && item.expiresAt < Date.now();

  // 检查是否已用完
  const isEmpty = item.quantity === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      layout
      className={`glass-card p-4 cursor-pointer hover:scale-105 transition-all relative overflow-hidden group ${
        isEmpty ? 'opacity-60' : ''
      }`}
      onClick={onClick}
      style={{
        boxShadow: `0 0 20px ${rarityConfig.glow}`,
        border: `1px solid ${rarityConfig.color}30`,
        filter: isEmpty ? 'grayscale(50%)' : 'none',
      }}
    >
      {/* 稀有度光晕 */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${rarityConfig.color}, transparent)` }}
      />

      {/* 数量标记 */}
      {item.quantity > 1 && (
        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-lg">
          <span className="text-white font-mono text-sm font-bold">×{item.quantity}</span>
        </div>
      )}

      {/* 已用完标记 */}
      {isEmpty && (
        <div className="absolute top-2 right-2 bg-orange-500 px-2 py-1 rounded-lg">
          <span className="text-white font-inter text-xs font-bold">已用完</span>
        </div>
      )}

      {/* 过期标记 */}
      {isExpired && !isEmpty && (
        <div className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-lg">
          <span className="text-white font-inter text-xs font-bold">已过期</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div
          className="p-3 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${rarityConfig.color}20` }}
        >
          <IconComponent className="w-10 h-10" style={{ color: rarityConfig.color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* 名称和稀有度 */}
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-bold font-orbitron text-lg truncate"
              style={{ color: rarityConfig.color }}
            >
              {item.name}
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${rarityConfig.color}20`,
                color: rarityConfig.color,
              }}
            >
              {rarityConfig.label}
            </span>
          </div>

          {/* 类型 */}
          <div className="flex items-center gap-1 mb-2">
            {typeConfig.icon}
            <span className="text-xs font-inter" style={{ color: typeConfig.color }}>
              {typeConfig.label}
            </span>
          </div>

          {/* 描述 */}
          <p className="text-sm text-gray-600 dark:text-white/60 font-inter line-clamp-2 mb-3">
            {item.description}
          </p>

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/40">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(item.acquiredAt).toLocaleDateString('zh-CN')}</span>
            </div>
            {item.usedCount > 0 && (
              <span className="text-cyan-400">已使用 {item.usedCount} 次</span>
            )}
          </div>
        </div>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute bottom-2 right-2 p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
