/**
 * ThemeProvider - 主题初始化组件
 *
 * 在客户端加载时立即设置dark类
 */

'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // 立即应用主题
    const applyTheme = (currentTheme: 'light' | 'dark') => {
      document.documentElement.setAttribute('data-theme', currentTheme);

      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 更新 CSS 变量
      if (currentTheme === 'light') {
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
    };

    applyTheme(theme);
  }, [theme]);

  // 在组件挂载前立即执行
  useEffect(() => {
    // 从localStorage读取主题
    const stored = localStorage.getItem('liferpg-theme');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        const currentTheme = state?.theme || 'dark';

        document.documentElement.setAttribute('data-theme', currentTheme);

        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // 默认使用dark
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } else {
      // 默认使用dark
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  return <>{children}</>;
}
