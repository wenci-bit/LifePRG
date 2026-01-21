/**
 * AvatarSelector - 头像选择器组件
 * 支持预设Emoji头像和自定义URL头像
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Upload, Check } from 'lucide-react';
import { AVATAR_OPTIONS, AVATAR_CATEGORIES, getAvatarsByCategory } from '@/data/avatars';
import type { UserAvatar } from '@/types/game';

interface AvatarSelectorProps {
  currentAvatar?: UserAvatar;
  onSelect: (avatar: UserAvatar) => void;
  onClose: () => void;
}

export default function AvatarSelector({ currentAvatar, onSelect, onClose }: AvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('person');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTab, setCustomTab] = useState<'url' | 'upload'>('url');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // 获取当前选中的头像ID（如果是emoji类型）
  const currentAvatarId = currentAvatar?.type === 'emoji' ? currentAvatar.data : null;

  // 处理预设头像选择
  const handleEmojiSelect = (avatarId: string) => {
    onSelect({ type: 'emoji', data: avatarId });
    onClose();
  };

  // 处理自定义URL
  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      onSelect({ type: 'url', data: customUrl.trim() });
      onClose();
    }
  };

  // 处理图片上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小（限制2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }

    // 读取文件并转换为base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setUploadedImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  // 确认使用上传的图片
  const handleConfirmUpload = () => {
    if (uploadedImage) {
      onSelect({ type: 'upload', data: uploadedImage });
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">选择头像</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 类别选择 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {AVATAR_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setShowCustomInput(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <span>{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
          <button
            onClick={() => setShowCustomInput(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              showCustomInput
                ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span className="font-medium">自定义</span>
          </button>
        </div>

        {/* 头像网格或自定义输入 */}
        <div className="flex-1 overflow-y-auto">
          {!showCustomInput ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {getAvatarsByCategory(selectedCategory).map((avatar) => (
                <motion.button
                  key={avatar.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEmojiSelect(avatar.id)}
                  className={`relative aspect-square rounded-xl flex items-center justify-center text-4xl
                    transition-all ${
                      currentAvatarId === avatar.id
                        ? 'ring-2 ring-cyber-cyan'
                        : 'hover:bg-white/10'
                    }`}
                  style={{
                    background: avatar.gradient
                      ? `linear-gradient(135deg, ${avatar.gradient.from}, ${avatar.gradient.to})`
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                  title={avatar.name}
                >
                  <span>{avatar.emoji}</span>
                  {currentAvatarId === avatar.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-cyber-cyan rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab切换 */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setCustomTab('url')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    customTab === 'url'
                      ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="font-medium">URL链接</span>
                </button>
                <button
                  onClick={() => setCustomTab('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    customTab === 'upload'
                      ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="font-medium">上传图片</span>
                </button>
              </div>

              {/* URL输入 */}
              {customTab === 'url' && (
                <>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">
                      输入头像URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-cyan/50" />
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white
                          placeholder:text-white/30 focus:outline-none focus:border-cyber-cyan/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCustomUrl();
                        }}
                      />
                    </div>
                  </div>

                  {customUrl && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/70 text-sm mb-3">预览：</p>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                          <img
                            src={customUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff" font-size="40"%3E❌%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            {customUrl.length > 50 ? customUrl.slice(0, 50) + '...' : customUrl}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCustomUrl}
                    disabled={!customUrl.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple
                      text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                      hover:shadow-lg hover:shadow-cyber-cyan/50 transition-all"
                  >
                    确认使用
                  </button>

                  <div className="p-4 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg">
                    <p className="text-cyber-cyan text-sm">
                      💡 提示：建议使用正方形图片，支持 PNG、JPG、GIF 等格式
                    </p>
                  </div>
                </>
              )}

              {/* 图片上传 */}
              {customTab === 'upload' && (
                <>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">
                      上传自定义头像
                    </label>
                    <div
                      className="relative border-2 border-dashed border-white/20 rounded-lg p-8
                        hover:border-cyber-cyan/50 transition-all cursor-pointer bg-white/5"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-purple
                          flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium mb-1">
                            点击上传图片
                          </p>
                          <p className="text-white/50 text-sm">
                            支持 PNG、JPG、GIF 格式，最大 2MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {uploadedImage && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/70 text-sm mb-3">预览：</p>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border-2 border-cyber-cyan">
                          <img
                            src={uploadedImage}
                            alt="Uploaded Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm mb-2">
                            ✅ 图片已上传
                          </p>
                          <button
                            onClick={() => setUploadedImage(null)}
                            className="text-red-400 text-xs hover:text-red-300 transition-colors"
                          >
                            重新选择
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmUpload}
                    disabled={!uploadedImage}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple
                      text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                      hover:shadow-lg hover:shadow-cyber-cyan/50 transition-all"
                  >
                    确认使用
                  </button>

                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-purple-300 text-sm">
                      💡 提示：建议使用正方形图片以获得最佳显示效果
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
