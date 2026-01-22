/**
 * LifeRPG 用户管理 Store
 * 支持云端存储（腾讯云开发）+ 本地备份
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStore, User } from '@/types/game';
import { cloudAuth, cloudData } from '@/services/cloudbase';

// 存储模式
type StorageMode = 'cloud' | 'local' | 'hybrid';

// 扩展 UserStore 类型
interface ExtendedUserStore extends UserStore {
  storageMode: StorageMode;
  isCloudConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncError: string | null;

  // 云端方法
  setStorageMode: (mode: StorageMode) => void;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  checkCloudConnection: () => Promise<boolean>;
}

// 用户凭证存储接口（本地备份用）
interface UserCredential {
  userId: string;
  username: string;
  passwordHash: string;
  email?: string;
}

// 简单的密码哈希函数（本地备份用）
const hashPassword = (password: string): string => {
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

export const useUserStore = create<ExtendedUserStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      isLoggedIn: false,
      users: [],

      // 云端状态
      storageMode: 'hybrid' as StorageMode, // 默认混合模式：云端优先，本地备份
      isCloudConnected: false,
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,

      /**
       * 设置存储模式
       */
      setStorageMode: (mode: StorageMode) => {
        set({ storageMode: mode });
      },

      /**
       * 检查云端连接
       */
      checkCloudConnection: async () => {
        try {
          const loginState = await cloudAuth.getLoginState();
          const connected = !!loginState;
          set({ isCloudConnected: connected });
          return connected;
        } catch (error) {
          set({ isCloudConnected: false });
          return false;
        }
      },

      /**
       * 同步数据到云端
       */
      syncToCloud: async () => {
        const state = get();
        if (!state.currentUser) return false;

        set({ isSyncing: true, syncError: null });

        try {
          const result = await cloudData.saveUserInfo(state.currentUser.id, state.currentUser);

          if (result.success) {
            set({
              isSyncing: false,
              lastSyncTime: Date.now(),
              isCloudConnected: true,
            });
            return true;
          } else {
            set({
              isSyncing: false,
              syncError: result.error || '同步失败',
            });
            return false;
          }
        } catch (error: any) {
          set({
            isSyncing: false,
            syncError: error.message || '同步失败',
            isCloudConnected: false,
          });
          return false;
        }
      },

      /**
       * 从云端同步数据
       */
      syncFromCloud: async () => {
        const state = get();
        if (!state.currentUser) return false;

        set({ isSyncing: true, syncError: null });

        try {
          const result = await cloudData.loadUserInfo(state.currentUser.id);

          if (result.success && result.data) {
            set({
              currentUser: { ...state.currentUser, ...result.data },
              isSyncing: false,
              lastSyncTime: Date.now(),
              isCloudConnected: true,
            });
            return true;
          } else {
            set({ isSyncing: false });
            return false;
          }
        } catch (error: any) {
          set({
            isSyncing: false,
            syncError: error.message || '同步失败',
            isCloudConnected: false,
          });
          return false;
        }
      },

      /**
       * 注册新用户（云端 + 本地）
       */
      register: (username: string, password: string, email?: string) => {
        const state = get();
        const mode = state.storageMode;

        // 本地检查用户名是否已存在
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
            completed: false,
            growthGoals: [],
            customGoals: [],
            taskIntensity: 'moderate',
          },
        };

        // 本地保存凭证（作为备份或离线使用）
        const newCredential: UserCredential = {
          userId,
          username,
          passwordHash: hashPassword(password),
          email,
        };

        credentials.push(newCredential);
        localStorage.setItem('liferpg-credentials', JSON.stringify(credentials));

        // 更新状态
        set({
          users: [...state.users, newUser],
          currentUser: newUser,
          isLoggedIn: true,
        });

        // 如果是云端或混合模式，异步同步到云端
        if (mode === 'cloud' || mode === 'hybrid') {
          // 同步用户信息到云端
          cloudData.saveUserInfo(userId, newUser).then((result) => {
            if (result.success) {
              set({ isCloudConnected: true, lastSyncTime: Date.now() });
            }
          });
        }

        return true;
      },

      /**
       * 用户登录（优先云端，回退本地）
       */
      login: (username: string, password: string) => {
        const state = get();
        const mode = state.storageMode;

        // 获取本地凭证
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
          user = { ...user, lastLoginAt: Date.now() };
          set({
            users: state.users.map((u) => (u.id === user!.id ? user! : u)),
          });
        }

        set({
          currentUser: user,
          isLoggedIn: true,
        });

        // 如果是云端或混合模式，尝试从云端同步最新数据
        if (mode === 'cloud' || mode === 'hybrid') {
          cloudData.loadUserInfo(credential.userId).then((result) => {
            if (result.success && result.data) {
              const cloudUser = result.data;
              // 合并云端数据（云端优先）
              const mergedUser = {
                ...user,
                ...cloudUser,
                lastLoginAt: Date.now(),
              };
              set({
                currentUser: mergedUser,
                users: get().users.map((u) =>
                  u.id === mergedUser.id ? mergedUser : u
                ),
                isCloudConnected: true,
                lastSyncTime: Date.now(),
              });
            }
          });
        }

        return true;
      },

      /**
       * 用户登出
       */
      logout: () => {
        const state = get();

        // 如果是云端模式，也登出云端
        if (state.storageMode === 'cloud' || state.storageMode === 'hybrid') {
          cloudAuth.logout().catch(console.error);
        }

        set({
          currentUser: null,
          isLoggedIn: false,
          isCloudConnected: false,
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

        // 同步到云端
        if (state.storageMode === 'cloud' || state.storageMode === 'hybrid') {
          cloudData.saveUserInfo(updatedUser.id, updatedUser).then((result) => {
            if (result.success) {
              set({ lastSyncTime: Date.now() });
            }
          });
        }
      },

      /**
       * 删除账户
       */
      deleteAccount: (userId: string) => {
        const state = get();

        // 删除本地凭证
        const credentials = JSON.parse(
          localStorage.getItem('liferpg-credentials') || '[]'
        ) as UserCredential[];

        const newCredentials = credentials.filter((cred) => cred.userId !== userId);
        localStorage.setItem('liferpg-credentials', JSON.stringify(newCredentials));

        // 删除本地用户数据
        localStorage.removeItem(`liferpg-storage-${userId}`);

        // 删除云端数据
        if (state.storageMode === 'cloud' || state.storageMode === 'hybrid') {
          cloudData.deleteUserData(userId).catch(console.error);
        }

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
       * 切换用户
       */
      switchUser: (userId: string) => {
        const state = get();
        const user = state.users.find((u) => u.id === userId);

        if (!user) return false;

        const password = prompt(`请输入用户 ${user.username} 的密码：`);
        if (!password) return false;

        const credentials = JSON.parse(
          localStorage.getItem('liferpg-credentials') || '[]'
        ) as UserCredential[];

        const credential = credentials.find((cred) => cred.userId === userId);

        if (!credential || !verifyPassword(password, credential.passwordHash)) {
          alert('密码错误！');
          return false;
        }

        const updatedUser = { ...user, lastLoginAt: Date.now() };

        set({
          currentUser: updatedUser,
          isLoggedIn: true,
          users: state.users.map((u) => (u.id === userId ? updatedUser : u)),
        });

        // 从云端同步数据
        if (state.storageMode === 'cloud' || state.storageMode === 'hybrid') {
          cloudData.loadUserInfo(userId).then((result) => {
            if (result.success && result.data) {
              const mergedUser = { ...updatedUser, ...result.data };
              set({
                currentUser: mergedUser,
                isCloudConnected: true,
                lastSyncTime: Date.now(),
              });
            }
          });
        }

        return true;
      },
    }),
    {
      name: 'liferpg-user-storage',
    }
  )
);
