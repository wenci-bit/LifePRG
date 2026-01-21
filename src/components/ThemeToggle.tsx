/**
 * ThemeToggle - 主题切换按钮
 *
 * 白天/黑夜模式切换
 */

'use client';

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  // 应用主题到 document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // 为Tailwind dark模式添加/移除dark类
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 更新 CSS 变量
    if (theme === 'light') {
      document.documentElement.style.setProperty('--bg-color', '#f0f4f8');
      document.documentElement.style.setProperty('--text-color', '#1a202c');
      document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.7)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
    } else {
      document.documentElement.style.setProperty('--bg-color', '#050505');
      document.documentElement.style.setProperty('--text-color', '#ffffff');
      document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
    }
  }, [theme]);

  // 初始化时设置dark类
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed top-6 right-6 z-50 w-14 h-14 rounded-full glass-card flex items-center justify-center group overflow-hidden"
      title={theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'}
    >
      {/* 背景动画 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyber-cyan to-cyber-purple opacity-0 group-hover:opacity-20 transition-opacity"
      />

      {/* 图标 */}
      <div className="relative">
        {theme === 'dark' ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Moon className="w-6 h-6 text-cyber-cyan" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Sun className="w-6 h-6 text-yellow-500" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
