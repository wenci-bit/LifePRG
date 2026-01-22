/**
 * LifeRPG 用户管理 Store
 * 管理用户登录、注册、资料等
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStore, User } from '@/types/game';

// 用户凭证存储接口（简单的本地存储方案）
interface UserCredential {
  userId: string;
  username: string;
  passwordHash: string; // 实际使用中应该加密
  email?: string;
}

// 简单的密码哈希函数（生产环境应使用更安全的方法）
const hashPassword = (password: string): string => {
  // 这里使用简单的编码，实际应用中应使用 bcrypt 等安全哈希算法
  return btoa(password);
};

// 验证密码
const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      isLoggedIn: false,
      users: [],

      /**
       * 注册新用户
       */
      register: (username: string, password: string, email?: string) => {
        const state = get();

        // 检查用户名是否已存在
        const credentials = JSON.parse(
          localStorage.getItem('liferpg-credentials') || '[]'
        ) as UserCredential[];

        const existingUser = credentials.find(
          (cred) => cred.username.toLowerCase() === username.toLowerCase()
        );

        if (existingUser) {
          alert('用户名已存在！');
          return false;
        }

        // 创建新用户
        const userId = generateId();
        const newUser: User = {
          id: userId,
          username,
          email,
          nickname: username,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          onboarding: {
            completed: false, // 新用户未完成引导
            growthGoals: [],
            customGoals: [],
            taskIntensity: 'moderate',
          },
        };

        // 保存凭证
        const newCredential: UserCredential = {
          userId,
          username,
          passwordHash: hashPassword(password),
          email,
        };

        credentials.push(newCredential);
        localStorage.setItem('liferpg-credentials', JSON.stringify(credentials));

        // 更新用户列表
        set({
          users: [...state.users, newUser],
          currentUser: newUser,
          isLoggedIn: true,
        });

        return true;
      },

      /**
       * 用户登录
       */
      login: (username: string, password: string) => {
        const state = get();

        // 获取凭证
        const credentials = JSON.parse(
          localStorage.getItem('liferpg-credentials') || '[]'
        ) as UserCredential[];

        const credential = credentials.find(
          (cred) => cred.username.toLowerCase() === username.toLowerCase()
        );

        if (!credential) {
          alert('用户不存在！');
          return false;
        }

        if (!verifyPassword(password, credential.passwordHash)) {
          alert('密码错误！');
          return false;
        }

        // 查找或创建用户信息
        let user = state.users.find((u) => u.id === credential.userId);

        if (!user) {
          user = {
            id: credential.userId,
            username: credential.username,
            email: credential.email,
            nickname: credential.username,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
          };

          set({
            users: [...state.users, user],
          });
        } else {
          // 更新最后登录时间
          user = { ...user, lastLoginAt: Date.now() };
          set({
            users: state.users.map((u) => (u.id === user!.id ? user! : u)),
          });
        }

        set({
          currentUser: user,
          isLoggedIn: true,
        });

        return true;
      },

      /**
       * 用户登出
       */
      logout: () => {
        set({
          currentUser: null,
          isLoggedIn: false,
        });
      },

      /**
       * 更新用户资料
       */
      updateProfile: (updates) => {
        const state = get();
        if (!state.currentUser) return;

        const updatedUser = {
          ...state.currentUser,
          ...updates,
        };

        set({
          currentUser: updatedUser,
          users: state.users.map((u) =>
            u.id === updatedUser.id ? updatedUser : u
          ),
        });
      },

      /**
       * 删除账户
       */
      deleteAccount: (userId: string) => {
        const state = get();

        // 删除凭证
        const credentials = JSON.parse(
          localStorage.getItem('liferpg-credentials') || '[]'
        ) as UserCredential[];

        const newCredentials = credentials.filter((cred) => cred.userId !== userId);
        localStorage.setItem('liferpg-credentials', JSON.stringify(newCredentials));

        // 删除用户数据
        localStorage.removeItem(`liferpg-storage-${userId}`);

        // 更新用户列表
        const newUsers = state.users.filter((u) => u.id !== userId);

        set({
          users: newUsers,
        });

        // 如果删除的是当前用户，登出
        if (state.currentUser?.id === userId) {
          set({
            currentUser: null,
            isLoggedIn: false,
          });
        }

        return true;
      },

      /**
       * 切换用户（需要重新输入密码）
       */
      switchUser: (userId: string) => {
        const state = get();
        const user = state.users.find((u) => u.id === userId);

        if (!user) return false;

        // 提示输入密码
        const password = prompt(`请输入用户 ${user.username} 的密码：`);
        if (!password) return false;

        // 验证密码
        const credentials = JSON.parse(
          localStorage.getItem('liferpg-credentials') || '[]'
        ) as UserCredential[];

        const credential = credentials.find((cred) => cred.userId === userId);

        if (!credential || !verifyPassword(password, credential.passwordHash)) {
          alert('密码错误！');
          return false;
        }

        // 切换用户
        const updatedUser = { ...user, lastLoginAt: Date.now() };

        set({
          currentUser: updatedUser,
          isLoggedIn: true,
          users: state.users.map((u) => (u.id === userId ? updatedUser : u)),
        });

        return true;
      },
    }),
    {
      name: 'liferpg-user-storage', // 用户信息存储 key
    }
  )
);
