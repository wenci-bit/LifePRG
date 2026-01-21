/**
 * ItemDetailModal - 物品详情弹窗
 *
 * 功能：
 * - 显示物品详细信息
 * - 使用物品功能
 * - 查看使用历史
 * - 添加/编辑/删除笔记
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Package, Calendar, Clock, TrendingUp, BookOpen,
  Plus, Edit2, Trash2, Save, Check, AlertCircle
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { InventoryItem } from '@/types/game';
import { getIconComponent } from '@/utils/iconMap';

export default function ItemDetailModal({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  const useInventoryItem = useGameStore((state) => state.useInventoryItem);
  const addItemNote = useGameStore((state) => state.addItemNote);
  const updateItemNote = useGameStore((state) => state.updateItemNote);
  const deleteItemNote = useGameStore((state) => state.deleteItemNote);

  const [activeTab, setActiveTab] = useState<'info' | 'usage' | 'notes'>('info');
  const [isUsing, setIsUsing] = useState(false);
  const [useNote, setUseNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // 获取图标组件
  const IconComponent = getIconComponent(item.icon);

  // 使用物品
  const handleUse = () => {
    if (isUsing) {
      const success = useInventoryItem(item.id, useNote.trim() || undefined);
      if (success) {
        setUseNote('');
        setIsUsing(false);
        // 不再自动关闭弹窗，让用户可以查看使用记录
      }
    } else {
      setIsUsing(true);
    }
  };

  // 添加笔记
  const handleAddNote = () => {
    if (noteContent.trim()) {
      addItemNote(item.id, noteContent.trim());
      setNoteContent('');
    }
  };

  // 开始编辑笔记
  const handleStartEdit = (noteId: string, content: string) => {
    setEditingNote(noteId);
    setNoteContent(content);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingNote && noteContent.trim()) {
      updateItemNote(item.id, editingNote, noteContent.trim());
      setEditingNote(null);
      setNoteContent('');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingNote(null);
    setNoteContent('');
  };

  // 删除笔记
  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('确定要删除这条笔记吗？')) {
      deleteItemNote(item.id, noteId);
    }
  };

  // 检查是否过期
  const isExpired = item.expiresAt && item.expiresAt < Date.now();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
              <IconComponent className="w-12 h-12 text-cyber-cyan" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-orbitron text-white mb-1">
                {item.name}
              </h2>
              <p className="text-sm text-gray-400 dark:text-white/60 font-inter">
                {item.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-1 rounded bg-white/10 text-xs text-white/80">
                  数量: {item.quantity}
                </span>
                <span className="px-2 py-1 rounded bg-white/10 text-xs text-white/80">
                  已使用: {item.usedCount} 次
                </span>
                {isExpired && (
                  <span className="px-2 py-1 rounded bg-red-500/20 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    已过期
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {[
            { key: 'info', label: '基本信息', icon: <Package className="w-4 h-4" /> },
            { key: 'usage', label: '使用记录', icon: <TrendingUp className="w-4 h-4" /> },
            { key: 'notes', label: '笔记', icon: <BookOpen className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 font-inter text-sm flex items-center gap-2 transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'text-cyber-cyan border-cyber-cyan'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'notes' && item.notes.length > 0 && (
                <span className="bg-cyber-cyan/20 text-cyber-cyan px-2 py-0.5 rounded-full text-xs">
                  {item.notes.length}
                </span>
              )}
              {tab.key === 'usage' && item.usageRecords.length > 0 && (
                <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">
                  {item.usageRecords.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="space-y-4">
          {activeTab === 'info' && (
            <InfoTab item={item} />
          )}

          {activeTab === 'usage' && (
            <UsageTab item={item} />
          )}

          {activeTab === 'notes' && (
            <NotesTab
              item={item}
              noteContent={noteContent}
              setNoteContent={setNoteContent}
              editingNote={editingNote}
              onAddNote={handleAddNote}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDeleteNote={handleDeleteNote}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
          {!isExpired && item.type === 'consumable' && (
            <div className="flex-1">
              {isUsing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="添加使用备注（可选）"
                    value={useNote}
                    onChange={(e) => setUseNote(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyber-cyan"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUse}
                      className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      确认使用
                    </button>
                    <button
                      onClick={() => {
                        setIsUsing(false);
                        setUseNote('');
                      }}
                      className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUse}
                  disabled={item.quantity <= 0}
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  使用物品
                </button>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// 基本信息标签
function InfoTab({ item }: { item: InventoryItem }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-inter">获得时间</span>
          </div>
          <p className="text-white font-mono">
            {new Date(item.acquiredAt).toLocaleString('zh-CN')}
          </p>
        </div>

        {item.lastUsedAt && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-inter">最后使用</span>
            </div>
            <p className="text-white font-mono">
              {new Date(item.lastUsedAt).toLocaleString('zh-CN')}
            </p>
          </div>
        )}

        {item.expiresAt && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-inter">过期时间</span>
            </div>
            <p className={`font-mono ${item.expiresAt < Date.now() ? 'text-red-400' : 'text-yellow-400'}`}>
              {new Date(item.expiresAt).toLocaleString('zh-CN')}
            </p>
          </div>
        )}
      </div>

      {item.metadata && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-bold text-gray-400 mb-3 font-inter">额外属性</h4>
          <div className="space-y-2">
            {Object.entries(item.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-400 capitalize">{key}:</span>
                <span className="text-white font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 使用记录标签
function UsageTab({ item }: { item: InventoryItem }) {
  if (item.usageRecords.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400 font-inter">暂无使用记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {item.usageRecords.slice().reverse().map((record, index) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white font-mono">
                  {new Date(record.usedAt).toLocaleString('zh-CN')}
                </span>
              </div>
              {record.note && (
                <p className="text-sm text-gray-300 font-inter bg-white/5 p-3 rounded-lg">
                  {record.note}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-500 ml-4">
              #{item.usageRecords.length - index}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// 笔记标签
function NotesTab({
  item,
  noteContent,
  setNoteContent,
  editingNote,
  onAddNote,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteNote,
}: {
  item: InventoryItem;
  noteContent: string;
  setNoteContent: (content: string) => void;
  editingNote: string | null;
  onAddNote: () => void;
  onStartEdit: (noteId: string, content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteNote: (noteId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* 添加/编辑笔记区域 */}
      <div className="glass-card p-4">
        <textarea
          placeholder={editingNote ? "编辑笔记..." : "添加新笔记..."}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="w-full h-24 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyber-cyan resize-none font-inter"
        />
        <div className="flex gap-2 mt-3">
          {editingNote ? (
            <>
              <button
                onClick={onSaveEdit}
                disabled={!noteContent.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-inter hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
              <button
                onClick={onCancelEdit}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all font-inter"
              >
                取消
              </button>
            </>
          ) : (
            <button
              onClick={onAddNote}
              disabled={!noteContent.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white font-inter hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加笔记
            </button>
          )}
        </div>
      </div>

      {/* 笔记列表 */}
      {item.notes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400 font-inter">暂无笔记</p>
          <p className="text-sm text-gray-500 font-inter mt-2">
            添加笔记来记录你对这个物品的想法
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {item.notes.slice().reverse().map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm font-inter">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(note.createdAt).toLocaleString('zh-CN')}</span>
                  {note.updatedAt !== note.createdAt && (
                    <span className="text-gray-500">(已编辑)</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onStartEdit(note.id, note.content)}
                    disabled={editingNote !== null}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <Edit2 className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <p className="text-white font-inter whitespace-pre-wrap">{note.content}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
