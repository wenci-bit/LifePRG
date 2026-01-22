/**
 * 用户资料设置组件
 * 显示和编辑用户个人信息
 * 支持头像选择、昵称、邮箱、个人简介等
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Edit2, Save, X, LogOut, Trash2, Users, Camera, Sparkles,
  TrendingUp, Zap, Coins, Target, Flame, Trophy, Star, Calendar,
  CheckCircle2, Clock, Award, AlertTriangle, Check
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useGameStore } from '@/store/gameStore';
import AvatarSelector from './AvatarSelector';
import AvatarFrameSelector from './AvatarFrameSelector';
import AvatarDisplay from './AvatarDisplay';
import type { UserAvatar, UserRole, GrowthGoal, TaskIntensity } from '@/types/game';
import { QuestStatus } from '@/types/game';

// 预设身份选项
const ROLE_OPTIONS: Array<{ value: UserRole; label: string; icon: string }> = [
  { value: 'student', label: '学生', icon: '🎓' },
  { value: 'worker', label: '职场人', icon: '💼' },
  { value: 'freelancer', label: '自由职业', icon: '🎨' },
  { value: 'entrepreneur', label: '创业者', icon: '🚀' },
  { value: 'researcher', label: '研究者', icon: '🔬' },
  { value: 'other', label: '其他', icon: '✨' },
];

// 预设成长需求选项
const GROWTH_GOAL_OPTIONS: Array<{ value: GrowthGoal; label: string; icon: string }> = [
  { value: 'academic', label: '学术提升', icon: '📚' },
  { value: 'career', label: '职业发展', icon: '💼' },
  { value: 'health', label: '健康管理', icon: '💪' },
  { value: 'skill', label: '技能学习', icon: '🎯' },
  { value: 'creativity', label: '创意表达', icon: '🎨' },
  { value: 'social', label: '社交拓展', icon: '👥' },
  { value: 'finance', label: '财务规划', icon: '💰' },
  { value: 'hobby', label: '兴趣爱好', icon: '🎮' },
];

// 任务强度选项
const INTENSITY_OPTIONS: Array<{ value: TaskIntensity; label: string; icon: string; description: string }> = [
  { value: 'light', label: '轻松模式', icon: '🌱', description: '每天2-3个任务' },
  { value: 'moderate', label: '平衡模式', icon: '⚖️', description: '每天4-6个任务' },
  { value: 'intense', label: '挑战模式', icon: '🔥', description: '每天7+个任务' },
];

export default function UserProfilePage() {
  const { currentUser, updateProfile, logout, deleteAccount, users, switchUser } = useUserStore();
  const {
    level, currentExp, maxExp, coins, stats, attributes, quests
  } = useGameStore((state) => ({
    level: state.level,
    currentExp: state.currentExp,
    maxExp: state.maxExp,
    coins: state.coins,
    stats: state.stats,
    attributes: state.attributes,
    quests: state.quests,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [bio, setBio] = useState(currentUser?.bio || '');

  // 身份目标编辑状态
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>(currentUser?.onboarding?.role || 'other');
  const [editCustomRole, setEditCustomRole] = useState(currentUser?.onboarding?.customRole || '');
  const [editGoals, setEditGoals] = useState<GrowthGoal[]>(currentUser?.onboarding?.growthGoals || []);
  const [editCustomGoals, setEditCustomGoals] = useState<string[]>(currentUser?.onboarding?.customGoals || []);
  const [editCustomGoalInput, setEditCustomGoalInput] = useState('');
  const [editIntensity, setEditIntensity] = useState<TaskIntensity>(currentUser?.onboarding?.taskIntensity || 'moderate');

  if (!currentUser) return null;

  // 计算总属性值
  const totalAttributes = attributes.int + attributes.vit + attributes.mng + attributes.cre;

  // 计算任务统计
  const questStats = useMemo(() => {
    const completed = quests.filter(q => q.status === QuestStatus.COMPLETED).length;
    const active = quests.filter(q => q.status === QuestStatus.ACTIVE).length;
    const total = quests.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, active, total, completionRate };
  }, [quests]);

  // 处理头像选择
  const handleAvatarSelect = (avatar: UserAvatar) => {
    updateProfile({ avatar });
  };

  // 处理头像框选择
  const handleFrameSelect = (frameId: string) => {
    updateProfile({ avatarFrame: frameId });
  };

  // 保存更改
  const handleSave = () => {
    updateProfile({
      nickname,
      email: email || undefined,
      bio: bio || undefined,
    });
    setIsEditing(false);
    alert('资料更新成功！');
  };

  // 取消编辑
  const handleCancel = () => {
    setNickname(currentUser.nickname || '');
    setEmail(currentUser.email || '');
    setBio(currentUser.bio || '');
    setIsEditing(false);
  };

  // 开始编辑身份目标
  const handleStartEditGoals = () => {
    setEditRole(currentUser?.onboarding?.role || 'other');
    setEditCustomRole(currentUser?.onboarding?.customRole || '');
    setEditGoals(currentUser?.onboarding?.growthGoals || []);
    setEditCustomGoals(currentUser?.onboarding?.customGoals || []);
    setEditIntensity(currentUser?.onboarding?.taskIntensity || 'moderate');
    setIsEditingGoals(true);
  };

  // 保存身份目标
  const handleSaveGoals = () => {
    updateProfile({
      onboarding: {
        completed: true,
        role: editRole,
        customRole: editRole === 'other' ? editCustomRole : undefined,
        growthGoals: editGoals,
        customGoals: editCustomGoals,
        taskIntensity: editIntensity,
        preferences: {
          dailyTaskCount: editIntensity === 'light' ? 3 : editIntensity === 'moderate' ? 5 : 8,
          focusAreas: [...editGoals, ...editCustomGoals],
        },
      },
    });
    setIsEditingGoals(false);
    alert('身份目标已更新！');
  };

  // 取消编辑身份目标
  const handleCancelEditGoals = () => {
    setIsEditingGoals(false);
  };

  // 切换成长目标
  const toggleEditGoal = (goal: GrowthGoal) => {
    if (editGoals.includes(goal)) {
      setEditGoals(editGoals.filter(g => g !== goal));
    } else {
      setEditGoals([...editGoals, goal]);
    }
  };

  // 添加自定义目标
  const addEditCustomGoal = () => {
    const trimmed = editCustomGoalInput.trim();
    if (trimmed && !editCustomGoals.includes(trimmed)) {
      setEditCustomGoals([...editCustomGoals, trimmed]);
      setEditCustomGoalInput('');
    }
  };

  // 删除自定义目标
  const removeEditCustomGoal = (goal: string) => {
    setEditCustomGoals(editCustomGoals.filter(g => g !== goal));
  };

  // 删除账户
  const handleDeleteAccount = () => {
    const confirmed = confirm(
      `确定要删除账户 "${currentUser.username}" 吗？\n\n此操作将永久删除所有游戏数据，且无法恢复！`
    );

    if (confirmed) {
      const doubleConfirm = prompt('请输入 "DELETE" 确认删除：');
      if (doubleConfirm === 'DELETE') {
        deleteAccount(currentUser.id);
        alert('账户已删除');
      }
    }
  };

  // 切换账户
  const handleSwitchUser = (userId: string) => {
    if (userId === currentUser.id) return;

    const success = switchUser(userId);
    if (success) {
      window.location.reload(); // 刷新页面加载新用户数据
    }
  };

  // 格式化时间
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 头像选择器模态框 */}
      <AnimatePresence>
        {showAvatarSelector && (
          <AvatarSelector
            currentAvatar={currentUser.avatar}
            onSelect={handleAvatarSelect}
            onClose={() => setShowAvatarSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* 头像框选择器模态框 */}
      <AnimatePresence>
        {showFrameSelector && (
          <AvatarFrameSelector
            currentFrame={currentUser.avatarFrame}
            currentAvatar={currentUser.avatar}
            onSelect={handleFrameSelect}
            onClose={() => setShowFrameSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* 顶部个人信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：头像和基本信息 */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative group">
              <AvatarDisplay
                avatar={currentUser.avatar}
                frameId={currentUser.avatarFrame}
                size="xl"
                className="transition-transform group-hover:scale-105"
              />
              <button
                onClick={() => setShowAvatarSelector(true)}
                className="absolute bottom-0 right-0 p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full
                  hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-cyan-500/50
                  group-hover:scale-110"
                title="更换头像"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setShowFrameSelector(true)}
                className="absolute bottom-0 left-0 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full
                  hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/50
                  group-hover:scale-110"
                title="更换头像框"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </button>
            </div>
            <h3 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white font-orbitron">
              {currentUser.nickname || currentUser.username}
            </h3>
            <p className="text-gray-600 dark:text-white/60 text-sm mt-1">@{currentUser.username}</p>

            {/* 等级徽章 */}
            <div className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center gap-2">
              <Trophy className="w-5 h-5 text-white" />
              <span className="text-white font-bold">LV.{level}</span>
            </div>
          </div>

          {/* 中间：游戏统计 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">游戏统计</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-600 dark:text-cyan-400 rounded-lg transition-all border border-cyan-500/30"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑资料
                </button>
              )}
            </div>

            {/* 统计卡片网格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 经验值 */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-500/10 dark:to-blue-500/10 border-2 border-cyan-200 dark:border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs text-gray-600 dark:text-white/60 font-medium">经验值</span>
                </div>
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">{currentExp}</p>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-1">/ {maxExp}</p>
              </div>

              {/* 金币 */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10 border-2 border-yellow-200 dark:border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs text-gray-600 dark:text-white/60 font-medium">金币</span>
                </div>
                <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400 font-mono">{coins}</p>
              </div>

              {/* 连续打卡 */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border-2 border-orange-200 dark:border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs text-gray-600 dark:text-white/60 font-medium">连击</span>
                </div>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono">{stats.currentStreak}</p>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-1">最高 {stats.longestStreak}</p>
              </div>

              {/* 总属性 */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border-2 border-green-200 dark:border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-600 dark:text-white/60 font-medium">总属性</span>
                </div>
                <p className="text-2xl font-black text-green-600 dark:text-green-400 font-mono">{totalAttributes}</p>
              </div>
            </div>

            {/* 经验进度条 */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-white/60">升级进度</span>
                <span className="text-gray-900 dark:text-white font-medium">{Math.round((currentExp / maxExp) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentExp / maxExp) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 属性面板 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">角色属性</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* INT - 智力 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-white/60">INT 智力</span>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">{attributes.int}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                style={{ width: `${Math.min((attributes.int / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* VIT - 活力 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-white/60">VIT 活力</span>
              <span className="text-2xl font-black text-green-600 dark:text-green-400 font-mono">{attributes.vit}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600"
                style={{ width: `${Math.min((attributes.vit / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* MNG - 管理 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-white/60">MNG 管理</span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">{attributes.mng}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                style={{ width: `${Math.min((attributes.mng / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* CRE - 创造 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-white/60">CRE 创造</span>
              <span className="text-2xl font-black text-pink-600 dark:text-pink-400 font-mono">{attributes.cre}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-pink-600"
                style={{ width: `${Math.min((attributes.cre / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 任务成就统计 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-8 rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">任务成就</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 已完成任务 */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border-2 border-green-200 dark:border-green-500/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-600 dark:text-white/60 font-medium">已完成</span>
            </div>
            <p className="text-4xl font-black text-green-600 dark:text-green-400 font-mono">{questStats.completed}</p>
          </div>

          {/* 进行中任务 */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 border-2 border-blue-200 dark:border-blue-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-white/60 font-medium">进行中</span>
            </div>
            <p className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">{questStats.active}</p>
          </div>

          {/* 总任务数 */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border-2 border-purple-200 dark:border-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-gray-600 dark:text-white/60 font-medium">总任务</span>
            </div>
            <p className="text-4xl font-black text-purple-600 dark:text-purple-400 font-mono">{questStats.total}</p>
          </div>

          {/* 完成率 */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10 border-2 border-yellow-200 dark:border-yellow-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-white/60 font-medium">完成率</span>
            </div>
            <p className="text-4xl font-black text-yellow-600 dark:text-yellow-400 font-mono">{questStats.completionRate}%</p>
          </div>
        </div>

        {/* 活动统计 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-white/60">累计完成</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">{stats.totalQuestsCompleted}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-white/60">专注时长</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">{Math.floor(stats.totalFocusTime)}m</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-white/60">注册天数</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                {Math.floor((Date.now() - currentUser.createdAt) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 个人信息编辑 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">个人信息</h3>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all font-medium"
              >
                <Save className="w-4 h-4" />
                保存
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-lg transition-all font-medium"
              >
                <X className="w-4 h-4" />
                取消
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-600 dark:text-cyan-400 rounded-lg transition-all border border-cyan-500/30 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              编辑资料
            </motion.button>
          )}
        </div>

        <div className="space-y-6">
          {/* 用户名（不可编辑） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">用户名</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-white/10 rounded-lg border border-gray-300 dark:border-white/20">
              <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-gray-900 dark:text-white font-mono">{currentUser.username}</span>
            </div>
          </div>

          {/* 昵称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">昵称</label>
            {isEditing ? (
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                className="w-full px-4 py-3 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-100 dark:bg-white/10 rounded-lg border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white">
                {currentUser.nickname || '未设置'}
              </div>
            )}
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">邮箱</label>
            {isEditing ? (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            ) : (
              <div className="px-4 py-3 bg-gray-100 dark:bg-white/10 rounded-lg border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white">
                {currentUser.email || '未设置'}
              </div>
            )}
          </div>

          {/* 个人简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">个人简介</label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="写一些关于你自己的介绍..."
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none transition-all"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-100 dark:bg-white/10 rounded-lg border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white min-h-[100px]">
                {currentUser.bio || '这个人很懒，什么都没写...'}
              </div>
            )}
          </div>

          {/* 引导配置 */}
          {currentUser.onboarding?.completed && (
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-3">成长配置</label>
              <div className="space-y-3">
                {/* 身份 */}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                  <span className="text-xs text-gray-600 dark:text-white/60">身份：</span>
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser.onboarding.role === 'student' && '学生'}
                    {currentUser.onboarding.role === 'worker' && '职场人'}
                    {currentUser.onboarding.role === 'freelancer' && '自由职业者'}
                    {currentUser.onboarding.role === 'entrepreneur' && '创业者'}
                    {currentUser.onboarding.role === 'researcher' && '研究者'}
                    {currentUser.onboarding.role === 'other' && (currentUser.onboarding.customRole || '其他')}
                  </span>
                </div>

                {/* 成长目标 */}
                {(currentUser.onboarding.growthGoals.length > 0 || currentUser.onboarding.customGoals.length > 0) && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                    <span className="text-xs text-gray-600 dark:text-white/60 block mb-2">成长目标：</span>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.onboarding.growthGoals.map((goal) => {
                        const goalLabels: Record<string, string> = {
                          academic: '学术提升',
                          career: '职业发展',
                          health: '健康管理',
                          skill: '技能学习',
                          creativity: '创意表达',
                          social: '社交拓展',
                          finance: '财务规划',
                          hobby: '兴趣爱好',
                        };
                        return (
                          <span key={goal} className="px-2 py-1 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                            {goalLabels[goal] || goal}
                          </span>
                        );
                      })}
                      {currentUser.onboarding.customGoals.map((goal) => (
                        <span key={goal} className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded text-xs">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 任务强度 */}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                  <span className="text-xs text-gray-600 dark:text-white/60">任务强度：</span>
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser.onboarding.taskIntensity === 'light' && '轻松模式'}
                    {currentUser.onboarding.taskIntensity === 'moderate' && '平衡模式'}
                    {currentUser.onboarding.taskIntensity === 'intense' && '挑战模式'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 账户信息 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60 mb-1">
                <Calendar className="w-3 h-3" />
                注册时间
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(currentUser.createdAt)}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60 mb-1">
                <Clock className="w-3 h-3" />
                最后登录
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(currentUser.lastLoginAt)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 身份与成长目标 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="glass-card p-8 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">身份与成长目标</h3>
          </div>
          {!isEditingGoals && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartEditGoals}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-600 dark:text-purple-400 rounded-lg transition-all border border-purple-500/30 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              编辑
            </motion.button>
          )}
        </div>

        {/* 警告提示 */}
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">不建议频繁调整</p>
              <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1">
                身份和成长目标会影响 AI 为你推荐的任务类型。频繁修改可能导致任务建议不够精准，建议在确定方向后再进行调整。
              </p>
            </div>
          </div>
        </div>

        {!isEditingGoals ? (
          /* 显示模式 */
          <div className="space-y-4">
            {/* 当前身份 */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600 dark:text-white/60 font-medium">当前身份</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {ROLE_OPTIONS.find(r => r.value === currentUser?.onboarding?.role)?.icon || '✨'}
                </span>
                <span className="text-lg text-gray-900 dark:text-white font-medium">
                  {currentUser?.onboarding?.role === 'other'
                    ? currentUser?.onboarding?.customRole || '未设置'
                    : ROLE_OPTIONS.find(r => r.value === currentUser?.onboarding?.role)?.label || '未设置'}
                </span>
              </div>
            </div>

            {/* 成长目标 */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-600 dark:text-white/60 font-medium">成长目标</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(currentUser?.onboarding?.growthGoals || []).map((goal) => {
                  const option = GROWTH_GOAL_OPTIONS.find(g => g.value === goal);
                  return (
                    <span key={goal} className="px-3 py-1.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 rounded-lg text-sm font-medium flex items-center gap-1.5">
                      <span>{option?.icon}</span>
                      {option?.label}
                    </span>
                  );
                })}
                {(currentUser?.onboarding?.customGoals || []).map((goal) => (
                  <span key={goal} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium">
                    {goal}
                  </span>
                ))}
                {(!currentUser?.onboarding?.growthGoals?.length && !currentUser?.onboarding?.customGoals?.length) && (
                  <span className="text-gray-500 dark:text-white/50">未设置成长目标</span>
                )}
              </div>
            </div>

            {/* 任务强度 */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600 dark:text-white/60 font-medium">任务强度</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {INTENSITY_OPTIONS.find(i => i.value === currentUser?.onboarding?.taskIntensity)?.icon || '⚖️'}
                </span>
                <div>
                  <span className="text-lg text-gray-900 dark:text-white font-medium">
                    {INTENSITY_OPTIONS.find(i => i.value === currentUser?.onboarding?.taskIntensity)?.label || '平衡模式'}
                  </span>
                  <span className="text-gray-500 dark:text-white/50 text-sm ml-2">
                    ({INTENSITY_OPTIONS.find(i => i.value === currentUser?.onboarding?.taskIntensity)?.description || '每天4-6个任务'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 编辑模式 */
          <div className="space-y-6">
            {/* 编辑身份 */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-white/80 mb-3">选择身份</h4>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEditRole(option.value)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      editRole === option.value
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/40'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-2xl block mb-1">{option.icon}</span>
                      <span className="text-xs text-gray-900 dark:text-white font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              {editRole === 'other' && (
                <input
                  type="text"
                  value={editCustomRole}
                  onChange={(e) => setEditCustomRole(e.target.value)}
                  placeholder="请输入你的身份..."
                  className="w-full mt-3 px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              )}
            </div>

            {/* 编辑成长目标 */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-white/80 mb-3">成长目标（可多选）</h4>
              <div className="grid grid-cols-4 gap-2">
                {GROWTH_GOAL_OPTIONS.map((option) => {
                  const isSelected = editGoals.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleEditGoal(option.value)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/20'
                          : 'border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/40'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-xl block mb-1">{option.icon}</span>
                        <span className="text-xs text-gray-900 dark:text-white font-medium">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 自定义目标 */}
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editCustomGoalInput}
                    onChange={(e) => setEditCustomGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEditCustomGoal()}
                    placeholder="添加自定义目标..."
                    className="flex-1 px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                  <button
                    onClick={addEditCustomGoal}
                    className="px-4 py-2 bg-cyan-100 dark:bg-cyan-500/20 hover:bg-cyan-200 dark:hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-400 rounded-lg transition-all text-sm font-medium"
                  >
                    添加
                  </button>
                </div>
                {editCustomGoals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editCustomGoals.map((goal) => (
                      <div
                        key={goal}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-500/20 rounded-lg border border-purple-200 dark:border-purple-500/30"
                      >
                        <span className="text-sm text-purple-700 dark:text-purple-300">{goal}</span>
                        <button
                          onClick={() => removeEditCustomGoal(goal)}
                          className="text-purple-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 编辑任务强度 */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-white/80 mb-3">任务强度</h4>
              <div className="grid grid-cols-3 gap-3">
                {INTENSITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEditIntensity(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      editIntensity === option.value
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/40'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-3xl block mb-2">{option.icon}</span>
                      <span className="text-sm text-gray-900 dark:text-white font-bold block">{option.label}</span>
                      <span className="text-xs text-gray-500 dark:text-white/60">{option.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveGoals}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                保存设置
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelEditGoals}
                className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-medium flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                取消
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* 账户管理 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-8 rounded-2xl"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">账户管理</h2>

        <div className="space-y-3">
          {/* 登出 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                logout();
                window.location.reload();
              }
            }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-white/10 dark:to-white/15 dark:hover:from-white/15 dark:hover:to-white/20 text-gray-900 dark:text-white rounded-xl transition-all border border-gray-300 dark:border-white/20 font-medium"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </motion.button>

          {/* 删除账户 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 dark:from-red-500/20 dark:to-rose-500/20 dark:hover:from-red-500/30 dark:hover:to-rose-500/30 text-red-600 dark:text-red-400 rounded-xl transition-all border-2 border-red-200 dark:border-red-500/30 font-medium"
          >
            <Trash2 className="w-5 h-5" />
            删除账户
          </motion.button>
        </div>
      </motion.div>

      {/* 切换账户 */}
      {users.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">切换账户</h2>
          </div>

          <div className="space-y-3">
            {users.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ scale: user.id === currentUser.id ? 1 : 1.02 }}
                whileTap={{ scale: user.id === currentUser.id ? 1 : 0.98 }}
                onClick={() => handleSwitchUser(user.id)}
                disabled={user.id === currentUser.id}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all ${
                  user.id === currentUser.id
                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-500/20 dark:to-blue-500/20 border-2 border-cyan-300 dark:border-cyan-500/50 cursor-default'
                    : 'bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border-2 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <AvatarDisplay
                    avatar={user.avatar}
                    size="sm"
                    showBorder={false}
                  />
                  <div className="text-left">
                    <p className="text-gray-900 dark:text-white font-medium">{user.nickname || user.username}</p>
                    <p className="text-gray-600 dark:text-white/60 text-xs">@{user.username}</p>
                  </div>
                </div>
                {user.id === currentUser.id && (
                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    当前账户
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
