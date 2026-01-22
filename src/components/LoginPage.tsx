/**
 * 登录/注册页面组件
 * 赛博朋克风格的认证界面
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, LogIn, UserPlus, X } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import OnboardingModal from './OnboardingModal';

interface LoginPageProps {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { login, register } = useUserStore();

  // 处理登录
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      alert('请填写用户名和密码！');
      return;
    }

    const success = login(username, password);
    if (success) {
      onSuccess();
    }
  };

  // 处理注册
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      alert('请填写用户名和密码！');
      return;
    }

    if (password !== confirmPassword) {
      alert('两次输入的密码不一致！');
      return;
    }

    if (password.length < 4) {
      alert('密码至少需要4个字符！');
      return;
    }

    const success = register(username, password, email);
    if (success) {
      // 注册成功后显示引导设置
      setShowOnboarding(true);
    }
  };

  // 完成引导设置
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    alert('设置完成！欢迎加入 LifeRPG！');
    onSuccess();
  };

  // 切换模式
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
  };

  return (
    <>
      {/* 引导设置模态框 */}
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />

      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
        {/* 卡片容器 */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10">
          {/* Logo 和标题 */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-cyan mb-2">
              LIFE RPG
            </h1>
            <p className="text-white/60 text-sm tracking-wider">
              {mode === 'login' ? '登录你的人生游戏' : '开始你的人生冒险'}
            </p>
          </motion.div>

          {/* 表单 */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              onSubmit={mode === 'login' ? handleLogin : handleRegister}
              className="space-y-4"
            >
              {/* 用户名输入 */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-cyan/50" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyber-cyan/50 transition-all"
                    required
                  />
                </div>
              </div>

              {/* 邮箱输入（仅注册时） */}
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-white/80 text-sm mb-2 font-medium">
                    邮箱（可选）
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-cyan/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyber-cyan/50 transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {/* 密码输入 */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-cyan/50" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyber-cyan/50 transition-all"
                    required
                  />
                </div>
              </div>

              {/* 确认密码（仅注册时） */}
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-white/80 text-sm mb-2 font-medium">
                    确认密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-cyan/50" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入密码"
                      className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyber-cyan/50 transition-all"
                      required
                    />
                  </div>
                </motion.div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white font-bold rounded-lg hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                {mode === 'login' ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    登录
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    注册
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* 切换模式 */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-cyber-cyan hover:text-cyber-purple transition-colors text-sm"
            >
              {mode === 'login' ? '还没有账号？点击注册' : '已有账号？点击登录'}
            </button>
          </div>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg">
            <p className="text-xs text-white/60 leading-relaxed">
              提示：所有数据都保存在浏览器本地，不会上传到服务器。不同用户的游戏数据完全隔离。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
}
