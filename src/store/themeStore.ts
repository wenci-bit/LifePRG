/**
 * Theme Store - 主题状态管理
 *
 * 管理白天/黑夜主题切换
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        }));
      },

      setTheme: (theme: Theme) => {
        set({ theme });
      },
    }),
    {
      name: 'liferpg-theme',
    }
  )
);
