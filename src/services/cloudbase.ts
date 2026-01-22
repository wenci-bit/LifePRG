/**
 * 腾讯云开发 CloudBase 服务
 * 用于云端数据存储和用户认证
 * 注意：仅在客户端使用
 */

// 集合名称常量
export const COLLECTIONS = {
  USERS: 'users',           // 用户信息
  GAME_DATA: 'gameData',    // 游戏数据
};

// 检查是否在客户端
const isClient = typeof window !== 'undefined';

// 延迟初始化的变量
let app: any = null;
let db: any = null;
let auth: any = null;
let initialized = false;

/**
 * 初始化 CloudBase（仅客户端）
 */
const initCloudbase = async () => {
  if (!isClient || initialized) return;

  try {
    const cloudbase = (await import('@cloudbase/js-sdk')).default;

    app = cloudbase.init({
      env: 'life-prg-2026-4gc68mpt84899aee',
    });

    db = app.database();
    auth = app.auth({
      persistence: 'local',
    });

    initialized = true;
    console.log('CloudBase 初始化成功');
  } catch (error) {
    console.error('CloudBase 初始化失败:', error);
  }
};

/**
 * 确保 CloudBase 已初始化
 */
const ensureInitialized = async () => {
  if (!initialized) {
    await initCloudbase();
  }
  return initialized;
};

/**
 * 云端用户认证服务
 */
export const cloudAuth = {
  /**
   * 匿名登录
   */
  async loginAnonymously() {
    if (!await ensureInitialized() || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      const loginState = await auth.signInAnonymously();
      return { success: true, loginState };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 邮箱验证码登录/注册
   */
  async signInWithEmail(email: string, verificationCode: string) {
    if (!await ensureInitialized() || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      const loginState = await auth.signInWithEmail({
        email,
        verificationCode,
      });
      return { success: true, loginState };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 获取邮箱验证码
   */
  async getEmailVerification(email: string) {
    if (!await ensureInitialized() || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      const result = await auth.getVerification({
        type: 'email',
        target: email,
      });
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 登出
   */
  async logout() {
    if (!await ensureInitialized() || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      await auth.signOut();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 获取当前登录状态
   */
  async getLoginState() {
    if (!await ensureInitialized() || !auth) {
      return null;
    }

    try {
      const loginState = await auth.getLoginState();
      return loginState;
    } catch (error) {
      return null;
    }
  },

  /**
   * 获取当前用户ID
   */
  async getCurrentUserId() {
    if (!await ensureInitialized() || !auth) {
      return null;
    }

    try {
      const loginState = await auth.getLoginState();
      return loginState?.user?.uid || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    if (!await ensureInitialized() || !auth) {
      return null;
    }

    try {
      const user = await auth.getCurrentUser();
      return user;
    } catch (error) {
      return null;
    }
  },
};

/**
 * 云端数据服务
 */
export const cloudData = {
  /**
   * 保存游戏数据到云端
   */
  async saveGameData(userId: string, gameState: any) {
    if (!await ensureInitialized() || !db || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      // 先尝试匿名登录（如果未登录）
      const loginState = await auth.getLoginState();
      if (!loginState) {
        await auth.signInAnonymously();
      }

      const collection = db.collection(COLLECTIONS.GAME_DATA);

      // 检查是否已存在
      const existingDoc = await collection.where({ visitorId: userId }).get();

      if (existingDoc.data && existingDoc.data.length > 0) {
        // 更新现有记录
        await collection.where({ visitorId: userId }).update({
          data: gameState,
          updatedAt: new Date().getTime(),
        });
      } else {
        // 创建新记录
        await collection.add({
          visitorId: userId,
          data: gameState,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('保存游戏数据失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 从云端加载游戏数据
   */
  async loadGameData(userId: string) {
    if (!await ensureInitialized() || !db || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      // 先尝试匿名登录（如果未登录）
      const loginState = await auth.getLoginState();
      if (!loginState) {
        await auth.signInAnonymously();
      }

      const collection = db.collection(COLLECTIONS.GAME_DATA);
      const result = await collection.where({ visitorId: userId }).get();

      if (result.data && result.data.length > 0) {
        return { success: true, data: result.data[0].data };
      }

      return { success: true, data: null };
    } catch (error: any) {
      console.error('加载游戏数据失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 保存用户信息到云端
   */
  async saveUserInfo(userId: string, userInfo: any) {
    if (!await ensureInitialized() || !db || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      // 先尝试匿名登录（如果未登录）
      const loginState = await auth.getLoginState();
      if (!loginState) {
        await auth.signInAnonymously();
      }

      const collection = db.collection(COLLECTIONS.USERS);

      const existingDoc = await collection.where({ visitorId: userId }).get();

      if (existingDoc.data && existingDoc.data.length > 0) {
        await collection.where({ visitorId: userId }).update({
          ...userInfo,
          updatedAt: new Date().getTime(),
        });
      } else {
        await collection.add({
          ...userInfo,
          visitorId: userId,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('保存用户信息失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 从云端加载用户信息
   */
  async loadUserInfo(userId: string) {
    if (!await ensureInitialized() || !db || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      // 先尝试匿名登录（如果未登录）
      const loginState = await auth.getLoginState();
      if (!loginState) {
        await auth.signInAnonymously();
      }

      const collection = db.collection(COLLECTIONS.USERS);
      const result = await collection.where({ visitorId: userId }).get();

      if (result.data && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }

      return { success: true, data: null };
    } catch (error: any) {
      console.error('加载用户信息失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 删除用户所有数据
   */
  async deleteUserData(userId: string) {
    if (!await ensureInitialized() || !db || !auth) {
      return { success: false, error: '云服务未初始化' };
    }

    try {
      const loginState = await auth.getLoginState();
      if (!loginState) {
        await auth.signInAnonymously();
      }

      await db.collection(COLLECTIONS.GAME_DATA).where({ visitorId: userId }).remove();
      await db.collection(COLLECTIONS.USERS).where({ visitorId: userId }).remove();
      return { success: true };
    } catch (error: any) {
      console.error('删除用户数据失败:', error);
      return { success: false, error: error.message };
    }
  },
};

// 导出初始化函数供外部调用
export { initCloudbase, ensureInitialized };
