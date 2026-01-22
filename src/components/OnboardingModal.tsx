/**
 * 用户引导设置组件
 * 注册后引导用户设定身份、成长需求和任务强度
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import type { UserRole, GrowthGoal, TaskIntensity } from '@/types/game';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

// 预设身份选项
const ROLE_OPTIONS: Array<{ value: UserRole; label: string; icon: string; description: string }> = [
  { value: 'student', label: '学生', icon: '🎓', description: '在校学习，追求学业进步' },
  { value: 'worker', label: '职场人', icon: '💼', description: '职场打拼，提升职业技能' },
  { value: 'freelancer', label: '自由职业', icon: '🎨', description: '自由工作，灵活安排时间' },
  { value: 'entrepreneur', label: '创业者', icon: '🚀', description: '创业路上，追求事业突破' },
  { value: 'researcher', label: '研究者', icon: '🔬', description: '科研工作，探索未知领域' },
  { value: 'other', label: '其他', icon: '✨', description: '自定义你的身份' },
];

// 预设成长需求选项
const GROWTH_GOAL_OPTIONS: Array<{ value: GrowthGoal; label: string; icon: string; color: string }> = [
  { value: 'academic', label: '学术提升', icon: '📚', color: 'from-blue-500 to-cyan-500' },
  { value: 'career', label: '职业发展', icon: '💼', color: 'from-purple-500 to-pink-500' },
  { value: 'health', label: '健康管理', icon: '💪', color: 'from-green-500 to-emerald-500' },
  { value: 'skill', label: '技能学习', icon: '🎯', color: 'from-orange-500 to-red-500' },
  { value: 'creativity', label: '创意表达', icon: '🎨', color: 'from-pink-500 to-rose-500' },
  { value: 'social', label: '社交拓展', icon: '👥', color: 'from-indigo-500 to-blue-500' },
  { value: 'finance', label: '财务规划', icon: '💰', color: 'from-yellow-500 to-amber-500' },
  { value: 'hobby', label: '兴趣爱好', icon: '🎮', color: 'from-violet-500 to-purple-500' },
];

// 任务强度选项
const INTENSITY_OPTIONS: Array<{ value: TaskIntensity; label: string; icon: string; description: string; color: string }> = [
  { value: 'light', label: '轻松模式', icon: '🌱', description: '每天2-3个任务，适合新手或时间有限', color: 'from-green-400 to-emerald-500' },
  { value: 'moderate', label: '平衡模式', icon: '⚖️', description: '每天4-6个任务，工作生活平衡', color: 'from-blue-400 to-cyan-500' },
  { value: 'intense', label: '挑战模式', icon: '🔥', description: '每天7+个任务，追求高效产出', color: 'from-orange-400 to-red-500' },
];

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const updateProfile = useUserStore((state) => state.updateProfile);

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [customRole, setCustomRole] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<GrowthGoal[]>([]);
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [selectedIntensity, setSelectedIntensity] = useState<TaskIntensity>('moderate');

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // 保存用户引导配置
    updateProfile({
      onboarding: {
        completed: true,
        role: selectedRole || 'other',
        customRole: selectedRole === 'other' ? customRole : undefined,
        growthGoals: selectedGoals,
        customGoals,
        taskIntensity: selectedIntensity,
        preferences: {
          dailyTaskCount: selectedIntensity === 'light' ? 3 : selectedIntensity === 'moderate' ? 5 : 8,
          focusAreas: [...selectedGoals, ...customGoals],
        },
      },
    });
    onComplete();
  };

  const toggleGoal = (goal: GrowthGoal) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const addCustomGoal = () => {
    const trimmed = customGoalInput.trim();
    if (trimmed && !customGoals.includes(trimmed)) {
      setCustomGoals([...customGoals, trimmed]);
      setCustomGoalInput('');
    }
  };

  const removeCustomGoal = (goal: string) => {
    setCustomGoals(customGoals.filter(g => g !== goal));
  };

  const canProceed = () => {
    if (step === 1) return selectedRole !== null && (selectedRole !== 'other' || customRole.trim().length > 0);
    if (step === 2) return selectedGoals.length > 0 || customGoals.length > 0;
    if (step === 3) return true;
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* 标题 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-8 h-8 text-cyber-cyan" />
            <h2 className="text-3xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-purple">
              欢迎来到 LifeRPG
            </h2>
            <Sparkles className="w-8 h-8 text-cyber-purple" />
          </motion.div>
          <p className="text-white/60 text-sm">
            让我们花一分钟了解你，为你定制专属的成长计划
          </p>
        </div>

        {/* 进度指示器 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? 'w-12 bg-gradient-to-r from-cyber-cyan to-cyber-purple' :
                s < step ? 'w-8 bg-cyber-cyan/50' : 'w-8 bg-white/20'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* 步骤1: 选择身份 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">你的身份是？</h3>
                <p className="text-white/60 text-sm">选择最符合你当前状态的身份</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedRole(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedRole === option.value
                        ? 'border-cyber-cyan bg-cyber-cyan/20 shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-white mb-1">{option.label}</div>
                        <div className="text-xs text-white/60">{option.description}</div>
                      </div>
                      {selectedRole === option.value && (
                        <Check className="w-5 h-5 text-cyber-cyan flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* 自定义身份输入 */}
              {selectedRole === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="请输入你的身份..."
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-cyber-cyan"
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 步骤2: 选择成长需求 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">你的成长目标？</h3>
                <p className="text-white/60 text-sm">可以选择多个，我们会为你推荐相关任务</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GROWTH_GOAL_OPTIONS.map((option) => {
                  const isSelected = selectedGoals.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleGoal(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-cyber-cyan bg-cyber-cyan/20 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                          {option.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-cyber-cyan ml-auto" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 自定义目标 */}
              <div className="space-y-3">
                <label className="block text-sm text-white/80">自定义成长目标（可选）</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
                    placeholder="例如：学习编程、提升英语..."
                    className="flex-1 px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-cyber-cyan"
                  />
                  <button
                    onClick={addCustomGoal}
                    className="px-4 py-2 bg-cyber-cyan/20 hover:bg-cyber-cyan/30 text-cyber-cyan rounded-lg transition-all"
                  >
                    添加
                  </button>
                </div>

                {customGoals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customGoals.map((goal) => (
                      <div
                        key={goal}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20"
                      >
                        <span className="text-sm text-white">{goal}</span>
                        <button
                          onClick={() => removeCustomGoal(goal)}
                          className="text-white/60 hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 步骤3: 选择任务强度 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">选择任务强度</h3>
                <p className="text-white/60 text-sm">根据你的时间和精力选择合适的强度</p>
              </div>

              <div className="space-y-4">
                {INTENSITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedIntensity(option.value)}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                      selectedIntensity === option.value
                        ? 'border-cyber-cyan bg-cyber-cyan/20 shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg mb-1">{option.label}</div>
                        <div className="text-sm text-white/60">{option.description}</div>
                      </div>
                      {selectedIntensity === option.value && (
                        <Check className="w-6 h-6 text-cyber-cyan flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg">
                <p className="text-xs text-white/70 leading-relaxed">
                  💡 提示：你可以随时在设置中调整这些偏好。AI会根据你的选择为你推荐合适的任务。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 按钮 */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              上一步
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              canProceed()
                ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white hover:shadow-[0_0_20px_rgba(0,243,255,0.5)]'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {step === totalSteps ? '完成设置' : '下一步'}
            {step < totalSteps && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
