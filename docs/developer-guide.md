# LifeRPG 开发者文档

欢迎来到 LifeRPG 开发者文档！本文档将帮助你快速了解项目架构、开发流程和最佳实践。

---

## 📋 目录

1. [快速开始](#快速开始)
2. [项目结构](#项目结构)
3. [技术栈](#技术栈)
4. [核心模块详解](#核心模块详解)
5. [状态管理](#状态管理)
6. [数据流](#数据流)
7. [开发规范](#开发规范)
8. [测试指南](#测试指南)
9. [部署指南](#部署指南)
10. [常见问题](#常见问题)

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0
- 现代浏览器（支持 ES6+ 和 WebGL）

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/liferpg.git
cd liferpg

# 2. 安装依赖
npm install
# 或使用 pnpm
pnpm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问
# http://localhost:3000
```

### 可用脚本

```bash
# 开发模式
npm run dev          # 启动开发服务器（端口 3000）

# 构建
npm run build        # 生产环境构建
npm run start        # 启动生产服务器

# 代码检查
npm run lint         # 运行 ESLint 检查
npm run type-check   # TypeScript 类型检查
```

---

## 项目结构

```
sys5/
├── docs/                          # 文档目录
│   ├── user-guide.md             # 用户指南
│   ├── product-overview.md       # 产品概述
│   ├── attribute-balance-system.md # 属性平衡系统技术文档
│   └── developer-guide.md        # 开发者文档（本文档）
│
├── public/                        # 静态资源
│   └── (图片、字体等)
│
├── src/                           # 源代码目录
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 主页（入口）
│   │   └── globals.css           # 全局样式
│   │
│   ├── components/               # React 组件（43个）
│   │   ├── DashboardPage.tsx    # 主仪表盘
│   │   ├── QuestLog.tsx         # 任务列表
│   │   ├── HabitsCheckInPage.tsx # 习惯打卡+签到
│   │   ├── AchievementsPage.tsx # 成就系统
│   │   ├── ShopPage.tsx         # 奖励商店
│   │   ├── InventoryPage.tsx    # 背包系统
│   │   ├── AttributeBalancePage.tsx # 属性衰减分析
│   │   ├── AttributesDetailPage.tsx # 属性详情
│   │   ├── ExpDetailPage.tsx    # 经验详情
│   │   ├── CoinDetailPage.tsx   # 金币详情
│   │   ├── SettingsPage.tsx     # 设置页面
│   │   ├── PlannerPage.tsx      # 计划视图
│   │   ├── UserProfile.tsx      # 用户资料
│   │   ├── LoginPage.tsx        # 登录页面
│   │   ├── RegisterPage.tsx     # 注册页面
│   │   ├── ParticleBackground.tsx # 3D粒子背景
│   │   └── (其他组件...)
│   │
│   ├── store/                    # Zustand 状态管理
│   │   ├── gameStore.ts         # 游戏核心状态（2240行）
│   │   ├── userStore.ts         # 用户认证状态
│   │   └── themeStore.ts        # 主题配置状态
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   └── game.ts              # 游戏类型（593行）
│   │
│   ├── data/                     # 配置数据
│   │   ├── achievements.ts      # 成就配置（150+成就）
│   │   ├── levels.ts            # 等级系统配置
│   │   ├── checkIn.ts           # 签到奖励配置
│   │   ├── habits.ts            # 习惯系统配置
│   │   └── rewards.ts           # 奖励商店配置
│   │
│   └── utils/                    # 工具函数
│       ├── dateUtils.ts         # 日期处理
│       └── iconMap.ts           # 图标映射
│
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript 配置
├── tailwind.config.ts            # Tailwind CSS 配置
├── next.config.mjs               # Next.js 配置
└── README.md                     # 项目说明
```

---

## 技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 14.2 | React 框架，使用 App Router |
| **React** | 18.3 | UI 组件库 |
| **TypeScript** | 5.4 | 类型安全 |

### 状态管理

| 技术 | 版本 | 用途 |
|------|------|------|
| **Zustand** | 4.5 | 轻量级状态管理 |
| **zustand/middleware** | - | 持久化中间件（LocalStorage） |

### UI 和样式

| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | 3.x | 原子化 CSS 框架 |
| **Framer Motion** | - | 动画库 |
| **Lucide React** | - | 图标库 |

### 3D 渲染

| 技术 | 版本 | 用途 |
|------|------|------|
| **Three.js** | - | 3D 粒子特效（5000+粒子） |
| **@react-three/fiber** | - | React 集成 |

### 开发工具

| 技术 | 版本 | 用途 |
|------|------|------|
| **ESLint** | - | 代码检查 |
| **PostCSS** | - | CSS 处理 |

---

## 核心模块详解

### 1. 游戏状态管理 (gameStore.ts)

**文件位置：** `src/store/gameStore.ts`

**职责：**
- 管理所有游戏核心状态
- 提供游戏逻辑的 Actions
- 处理数据持久化

**核心状态：**

```typescript
interface GameState {
  // 等级系统
  level: number;
  currentExp: number;
  maxExp: number;

  // 资源
  coins: number;
  categorizedCoins: {
    int: number;
    vit: number;
    mng: number;
    cre: number;
    universal: number;
  };
  achievementPoints: number;

  // 属性系统
  attributes: {
    int: number;
    vit: number;
    mng: number;
    cre: number;
  };
  attributeRecords: AttributeRecord[];
  attributeDecayConfig: Record<AttributeType, AttributeDecayConfig>;

  // 任务与成就
  quests: Quest[];
  achievements: Achievement[];
  unlockedAchievements: string[];

  // 习惯与签到
  habits: Habit[];
  habitCheckIns: HabitCheckIn[];
  checkIn: CheckInState;

  // 背包
  inventory: InventoryItem[];
  purchasedRewards: string[];

  // 交易记录
  transactions: {
    coins: CoinTransaction[];
    exp: ExpTransaction[];
    attributes: AttributeChange[];
  };

  // 统计数据
  stats: {
    totalQuestsCompleted: number;
    totalFocusTime: number;
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: string;
    totalLoginDays: number;
  };

  // 专注模式
  focusModeActive: boolean;
  focusTimeRemaining: number;
  focusSessions: FocusSession[];
  currentFocusSession?: FocusSession;

  // 通知
  notifications: {
    levelUp: LevelUpNotification | null;
    achievement: AchievementNotification | null;
    checkIn: CheckInNotification | null;
  };

  // 设置
  settings: {
    particleMode: 'repulsion' | 'attraction' | 'wave';
    particleColorTheme: 'cyber' | 'rainbow' | 'mono' | 'grayscale';
    particleDimension: '2d' | '3d';
    particleDistribution: 'circular' | 'rectangular';
  };
}
```

**关键 Actions：**

```typescript
// 经验与升级
addExp(amount: number, reason: string, relatedId?: string): void
levelUp(): void

// 属性管理
increaseAttribute(attr: AttributeType, amount: number): void
addDynamicAttribute(attr: AttributeType, amount: number, reason: string, relatedId?: string, halfLifeDays?: number): void
calculateAttributeDecay(): void
getAttributeHealth(attr: AttributeType): number
getDecayingAttributes(): AttributeRecord[]
updateDecayConfig(attr: AttributeType, config: Partial<AttributeDecayConfig>): void

// 任务管理
addQuest(questData: Omit<Quest, 'id' | 'status' | 'createdAt'>): void
completeQuest(questId: string): void
uncompleteQuest(questId: string): void
deleteQuest(questId: string): void
updateQuest(questId: string, updates: Partial<Quest>): void
updateQuestProgress(questId: string, progress: number): void
addChildQuest(parentId: string, childQuestData): void
updateParentQuestProgress(parentId: string): void

// 金币管理
addCoins(amount: number): void
spendCoins(amount: number): boolean
spendCategorizedCoins(coinType: AttributeType, amount: number): boolean
spendUniversalCoins(amount: number): boolean
spendAchievementPoints(amount: number): boolean
purchaseReward(rewardId: string, coinType, coinAmount: number, pointsAmount?: number, rewardName?: string): boolean

// 成就系统
unlockAchievement(achievementId: string): void
checkAchievements(): void

// 签到系统
checkDailyLogin(): void
dailyCheckIn(): void

// 习惯管理
addHabit(habitData): void
updateHabit(habitId: string, updates: Partial<Habit>): void
deleteHabit(habitId: string): void
checkInHabit(habitId: string, value?: number, note?: string): boolean
uncheckInHabit(habitId: string, date?: string): void
updateHabitStats(habitId: string): void
checkDailyHabitsCompletion(): void
recheckTodayCheckInStatus(): void
getTodayHabitSummary(): HabitSummary

// 背包管理
addToInventory(itemData): void
useInventoryItem(itemId: string, note?: string): boolean
addItemNote(itemId: string, content: string): void
updateItemNote(itemId: string, noteId: string, content: string): void
deleteItemNote(itemId: string, noteId: string): void
removeFromInventory(itemId: string): void

// 专注模式
startFocusSession(mode, duration: number): void
endFocusSession(completed: boolean, interrupted: boolean): void

// 交易记录
addCoinTransaction(type, coinType, amount, reason, relatedId): void
addExpTransaction(type, amount, reason, relatedId): void
addAttributeChange(attribute, oldValue, newValue, reason, relatedId): void

// 通知管理
dismissLevelUpNotification(): void
dismissAchievementNotification(): void
dismissCheckInNotification(): void

// 设置
updateSettings(newSettings): void

// 重置
resetGame(): void
```

### 2. 用户认证 (userStore.ts)

**文件位置：** `src/store/userStore.ts`

**职责：**
- 管理用户认证状态
- 处理登录/注册/登出
- 多用户数据隔离

**核心功能：**

```typescript
interface UserState {
  currentUser: User | null;
  users: User[];

  // Actions
  register(username: string, password: string, additionalInfo?): boolean
  login(username: string, password: string): boolean
  logout(): void
  updateUserProfile(updates: Partial<User>): void
  deleteAccount(): void
  switchUser(userId: string): boolean
}
```

### 3. 主题管理 (themeStore.ts)

**文件位置：** `src/store/themeStore.ts`

**职责：**
- 管理全局主题（暗色/亮色）
- 管理粒子背景设置

### 4. 类型定义 (game.ts)

**文件位置：** `src/types/game.ts`

**包含 30+ 接口定义：**

```typescript
// 核心类型
type AttributeType = 'int' | 'vit' | 'mng' | 'cre';
enum QuestType { MAIN, SIDE, DAILY }
enum QuestStatus { ACTIVE, COMPLETED, FAILED }
enum HabitType { BOOLEAN, NUMERIC, DURATION }
enum HabitStatus { ACTIVE, PAUSED, COMPLETED, ARCHIVED }

// 实体接口
interface User { ... }
interface Quest { ... }
interface Habit { ... }
interface HabitCheckIn { ... }
interface Achievement { ... }
interface InventoryItem { ... }
interface AttributeRecord { ... }
interface AttributeDecayConfig { ... }
interface FocusSession { ... }

// 交易记录
interface CoinTransaction { ... }
interface ExpTransaction { ... }
interface AttributeChange { ... }

// 通知
interface LevelUpNotification { ... }
interface AchievementNotification { ... }
interface CheckInNotification { ... }

// Store 接口
interface GameStore extends GameState { ... }
interface UserStore extends UserState { ... }
```

---

## 状态管理

### Zustand 使用模式

LifeRPG 使用 Zustand 进行状态管理，主要优势：

1. **轻量级**：比 Redux 更简洁
2. **无需 Context Provider**：直接导入使用
3. **TypeScript 友好**：完整类型支持
4. **内置持久化**：使用 `persist` 中间件

### 创建 Store

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      level: 1,
      currentExp: 0,

      // Actions
      addExp: (amount: number) => {
        set((state) => ({
          currentExp: state.currentExp + amount
        }));
      },
    }),
    {
      name: 'liferpg-storage',
      storage: createJSONStorage(() => createUserStorage()),
    }
  )
);
```

### 使用 Store

```typescript
import { useGameStore } from '@/store/gameStore';

function MyComponent() {
  // 选择性订阅（性能优化）
  const level = useGameStore(state => state.level);
  const addExp = useGameStore(state => state.addExp);

  // 或批量订阅
  const { level, currentExp, addExp } = useGameStore();

  return (
    <div>
      <p>Level: {level}</p>
      <button onClick={() => addExp(10)}>+10 Exp</button>
    </div>
  );
}
```

### 多用户数据隔离

LifeRPG 支持多用户，每个用户的游戏数据独立存储：

```typescript
// 用户专属存储适配器
const createUserStorage = () => ({
  getItem: (name: string) => {
    const userId = getCurrentUserId();
    const key = userId ? `${name}-${userId}` : name;
    return localStorage.getItem(key);
  },
  setItem: (name: string, value: string) => {
    const userId = getCurrentUserId();
    const key = userId ? `${name}-${userId}` : name;
    localStorage.setItem(key, value);
  },
  removeItem: (name: string) => {
    const userId = getCurrentUserId();
    const key = userId ? `${name}-${userId}` : name;
    localStorage.removeItem(key);
  },
});
```

**存储键示例：**
```
localStorage['liferpg-storage']           // 单用户模式
localStorage['liferpg-storage-user123']   // 多用户模式（用户 123）
localStorage['liferpg-user-storage']      // 用户认证数据
```

---

## 数据流

### 任务完成流程

```
用户点击"完成任务"按钮
    ↓
completeQuest(questId)
    ↓
1. 更新任务状态为 COMPLETED
2. 增加 totalQuestsCompleted
    ↓
3. addExp(expReward, reason, questId)
    ├─ 应用等级加成 (max 1.3x)
    ├─ 应用连击加成 (max 1.5x)
    ├─ 循环检查多级升级
    │   └─ while (currentExp >= maxExp)
    │       ├─ level++
    │       ├─ currentExp -= maxExp
    │       ├─ 发放升级奖励金币
    │       └─ 记录升级信息
    └─ 显示升级通知（如果有）
    ↓
4. 分配分类金币
    ├─ coinPerAttribute = floor(coinReward / attributes.length)
    ├─ actualDistributed = coinPerAttribute * attributes.length
    ├─ universalAmount = floor(coinReward * 0.3)
    ├─ 更新 categorizedCoins[attr] += coinPerAttribute
    ├─ 更新 categorizedCoins.universal += universalAmount
    └─ 更新 coins += actualDistributed + universalAmount
    ↓
5. 增加属性（支持衰减）
    └─ for each attribute in quest.attributes:
        └─ addDynamicAttribute(attr, 10, reason, questId)
            ├─ 创建 AttributeRecord
            ├─ 添加到 attributeRecords[]
            ├─ 更新 attributes[attr] += 10
            └─ 记录 AttributeChange
    ↓
6. 更新父任务进度（如果是子任务）
    └─ updateParentQuestProgress(parentId)
        ├─ 计算子任务完成率
        ├─ 更新父任务 progress
        └─ 如果全部完成，自动完成父任务
    ↓
7. 检查成就解锁
    └─ checkAchievements()
        └─ for each achievement:
            ├─ 检查前置成就
            ├─ 检查达成条件
            └─ 如果满足：unlockAchievement(id)
                ├─ 添加到 unlockedAchievements
                ├─ 发放经验奖励
                ├─ 发放金币奖励
                ├─ 增加成就点数
                └─ 显示成就通知
```

### 习惯打卡流程

```
用户完成习惯打卡
    ↓
checkInHabit(habitId, value?, note?)
    ├─ 检查是否达到目标值
    ├─ 创建/更新 HabitCheckIn 记录
    └─ updateHabitStats(habitId)
        ├─ 计算总完成次数
        ├─ 计算当前连续天数
        ├─ 计算最长连续天数
        └─ 计算完成率
    ↓
checkDailyHabitsCompletion()
    ├─ 获取今日应完成的习惯
    ├─ 检查是否全部完成
    └─ 如果全部完成 && 今天未签到:
        └─ dailyCheckIn() (自动签到)
            ├─ 计算连续签到天数
            ├─ 计算签到奖励
            │   ├─ 基础奖励（exp + coins）
            │   └─ 连续奖励（7/14/30天特殊奖励）
            ├─ 更新签到历史
            ├─ 发放奖励
            └─ 显示签到通知
```

### 属性衰减流程

```
用户每日登录
    ↓
checkDailyLogin()
    ├─ 检查今天是否已登录
    ├─ 计算连击天数
    ├─ 发放每日登录奖励
    └─ calculateAttributeDecay() 🔥
        ↓
        遍历所有 attributeRecords
        └─ for each record:
            ├─ 计算距上次衰减的天数
            ├─ 应用指数衰减公式
            │   currentValue = amount × (1 - decayRate)^daysPassed
            ├─ 四舍五入到2位小数
            └─ 如果 currentValue < 0.01 或 (age > 90天 && value < 1):
                └─ 从列表中移除
        ↓
        更新总属性值
        └─ attributes[attr] = sum(records[attr].currentValue)
        ↓
        记录属性变化到交易历史
```

### 购买物品流程

```
用户点击购买
    ↓
purchaseReward(rewardId, coinType, coinAmount, pointsAmount, rewardName)
    ↓
第一阶段：验证资源
    ├─ 检查金币是否足够
    │   └─ if (coinType === 'any')
    │       └─ universal >= amount || total >= amount
    │   └─ else if (coinType === 'universal')
    │       └─ universal >= amount
    │   └─ else
    │       └─ categorizedCoins[coinType] >= amount
    ├─ 检查成就点数是否足够
    └─ 如果任何资源不足 → return false (交易失败)
    ↓
第二阶段：扣除资源 (only if 验证通过)
    ├─ 扣除金币
    │   └─ 根据 coinType 调用相应的 spend 方法
    ├─ 扣除成就点数
    └─ 记录交易历史
    ↓
第三阶段：发放物品
    ├─ 添加到 purchasedRewards（限购统计）
    └─ addToInventory(itemData)
        ├─ 检查是否已有相同物品
        ├─ 如果有且未满堆叠 → 增加数量
        └─ 否则 → 创建新物品
```

---

## 开发规范

### 代码风格

1. **TypeScript**：100% 类型覆盖，避免使用 `any`
2. **组件**：函数式组件 + Hooks
3. **命名**：
   - 组件：PascalCase (e.g., `DashboardPage.tsx`)
   - 函数/变量：camelCase (e.g., `addExp`, `currentLevel`)
   - 类型/接口：PascalCase (e.g., `Quest`, `AttributeType`)
   - 常量：UPPER_SNAKE_CASE (e.g., `ATTRIBUTE_CONFIG`)
4. **注释**：
   - 复杂逻辑添加注释
   - 所有 Action 添加 JSDoc 注释
   - 重要算法添加公式说明

### 目录组织

```
components/
├── (页面级组件)
│   ├── DashboardPage.tsx
│   ├── QuestLog.tsx
│   └── ...
├── (UI组件)
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── ...
└── (3D组件)
    └── ParticleBackground.tsx
```

### Git 提交规范

使用 Conventional Commits 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整（不影响功能）
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

**示例：**
```
feat(quest): 添加任务拖拽排序功能
fix(attribute): 修复属性衰减精度问题
docs(readme): 更新安装说明
refactor(store): 简化金币分配逻辑
```

### 性能优化建议

1. **组件优化**
   ```typescript
   // 使用 useMemo 缓存计算结果
   const stats = useMemo(() => {
     return calculateStats(data);
   }, [data]);

   // 使用 useCallback 缓存回调函数
   const handleClick = useCallback(() => {
     doSomething();
   }, []);
   ```

2. **Zustand 选择性订阅**
   ```typescript
   // ❌ 不好：订阅整个 state
   const state = useGameStore();

   // ✅ 好：只订阅需要的字段
   const level = useGameStore(state => state.level);
   const addExp = useGameStore(state => state.addExp);
   ```

3. **动态导入**
   ```typescript
   // 对大型组件使用动态导入
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <LoadingSpinner />,
   });
   ```

4. **列表渲染优化**
   ```typescript
   // 使用虚拟滚动处理长列表
   // 使用 key 优化 React diff
   {quests.map(quest => (
     <QuestCard key={quest.id} quest={quest} />
   ))}
   ```

---

## 测试指南

### 单元测试（待实现）

推荐使用 Jest + React Testing Library：

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

**示例测试：**

```typescript
// gameStore.test.ts
import { useGameStore } from '@/store/gameStore';

describe('GameStore', () => {
  beforeEach(() => {
    // 重置 store
    useGameStore.getState().resetGame();
  });

  test('addExp should increase experience', () => {
    const { addExp, currentExp } = useGameStore.getState();
    const initialExp = currentExp;

    addExp(50, 'test');

    expect(useGameStore.getState().currentExp).toBeGreaterThan(initialExp);
  });

  test('completeQuest should unlock achievements', () => {
    const { addQuest, completeQuest, unlockedAchievements } = useGameStore.getState();

    // 添加第一个任务
    addQuest({
      title: 'Test Quest',
      type: 'main',
      attributes: ['int'],
      expReward: 10,
      coinReward: 5,
    });

    const questId = useGameStore.getState().quests[0].id;
    completeQuest(questId);

    // 应该解锁"第一步"成就
    expect(unlockedAchievements).toContain('first_step');
  });
});
```

### E2E 测试（待实现）

推荐使用 Playwright 或 Cypress：

```typescript
// e2e/quest.spec.ts
test('user can complete a quest', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 登录
  await page.fill('[data-testid="username"]', 'testuser');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // 创建任务
  await page.click('[data-testid="new-quest-button"]');
  await page.fill('[data-testid="quest-title"]', 'Test Quest');
  await page.click('[data-testid="save-quest"]');

  // 完成任务
  await page.click('[data-testid="complete-quest"]');

  // 验证经验增加
  await expect(page.locator('[data-testid="current-exp"]')).toContainText(/[1-9]/);
});
```

---

## 部署指南

### Vercel 部署（推荐）

1. **关联 GitHub 仓库**
   ```bash
   # 推送代码到 GitHub
   git push origin main
   ```

2. **导入到 Vercel**
   - 访问 https://vercel.com
   - 点击 "Import Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测 Next.js 项目

3. **配置环境变量（如果需要）**
   - 在 Vercel Dashboard → Settings → Environment Variables
   - 添加必要的环境变量

4. **自动部署**
   - 每次推送到 main 分支，Vercel 会自动构建和部署
   - 预览环境：每个 PR 都会生成预览链接

### 静态导出

如果需要部署到静态托管平台（GitHub Pages、Netlify等）：

```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 启用静态导出
};

export default nextConfig;
```

```bash
# 构建静态文件
npm run build

# 输出目录：out/
# 可以直接部署到任何静态托管平台
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# 构建镜像
docker build -t liferpg .

# 运行容器
docker run -p 3000:3000 liferpg
```

---

## 常见问题

### Q1: 如何添加新的属性类型？

**A:** 需要修改以下文件：

1. **types/game.ts**
   ```typescript
   type AttributeType = 'int' | 'vit' | 'mng' | 'cre' | 'new_attr';
   ```

2. **store/gameStore.ts**
   ```typescript
   attributes: {
     int: 0,
     vit: 0,
     mng: 0,
     cre: 0,
     new_attr: 0, // 新增
   }

   attributeDecayConfig: {
     // ...
     new_attr: {
       attribute: 'new_attr',
       enabled: true,
       halfLifeDays: 10,
       minValue: 0,
       decayRate: 0.07,
     },
   }
   ```

3. **components/AttributesDetailPage.tsx**
   ```typescript
   const ATTRIBUTE_CONFIG = {
     // ...
     new_attr: { name: '新属性', icon: Icon, color: '#color', desc: '描述' },
   };
   ```

### Q2: 如何自定义成就？

**A:** 编辑 `src/data/achievements.ts`：

```typescript
{
  id: 'my_achievement',
  title: '我的成就',
  description: '完成特定条件',
  tier: 'gold',
  category: 'special',
  requirement: 100,
  reward: {
    exp: 50,
    coins: 30,
    points: 10,
  },
  prerequisites: [], // 前置成就ID
  hidden: false,
}
```

### Q3: 如何调整衰减速率？

**A:** 有两种方式：

**方式1：修改配置文件**
```typescript
// src/store/gameStore.ts
attributeDecayConfig: {
  vit: {
    halfLifeDays: 10, // 从7天改为10天
    decayRate: 0.07,  // 相应调整衰减率
  }
}
```

**方式2：运行时动态调整**
```typescript
const { updateDecayConfig } = useGameStore();

updateDecayConfig('vit', {
  halfLifeDays: 10,
  decayRate: 0.07,
});
```

### Q4: 如何添加新的商店物品？

**A:** 编辑 `src/data/rewards.ts`：

```typescript
{
  id: 'my_reward',
  name: '我的奖励',
  description: '描述',
  icon: '🎁',
  type: 'consumable', // 'consumable' | 'permanent' | 'limited_time'

  // 价格
  coinCost: 100,
  coinType: 'int', // 'int' | 'vit' | 'mng' | 'cre' | 'universal' | 'any'
  pointsCost: 10,

  // 购买条件
  levelRequired: 5,
  maxPurchases: 1, // 限购次数，不填为无限

  // 其他
  category: 'entertainment',
  tags: ['tag1', 'tag2'],
}
```

### Q5: 如何扩展用户系统？

**A:** 修改 `src/types/game.ts` 中的 `User` 接口：

```typescript
interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: UserAvatar;

  // 新增字段
  bio?: string;
  website?: string;
  socialLinks?: {
    github?: string;
    twitter?: string;
  };

  createdAt: number;
  lastLoginAt: number;
}
```

然后在 `src/store/userStore.ts` 中更新相关逻辑。

### Q6: 如何禁用属性衰减？

**A:** 有两种方式：

**方式1：全局禁用**
```typescript
// 在 gameStore.ts 中
attributeDecayConfig: {
  int: { ...config, enabled: false },
  vit: { ...config, enabled: false },
  mng: { ...config, enabled: false },
  cre: { ...config, enabled: false },
}
```

**方式2：运行时禁用**
```typescript
const { updateDecayConfig } = useGameStore();

['int', 'vit', 'mng', 'cre'].forEach(attr => {
  updateDecayConfig(attr as AttributeType, { enabled: false });
});
```

### Q7: 如何导出用户数据？

**A:** 可以在控制台运行：

```javascript
// 获取当前用户ID
const userStorage = localStorage.getItem('liferpg-user-storage');
const userId = JSON.parse(userStorage).state.currentUser.id;

// 获取游戏数据
const gameData = localStorage.getItem(`liferpg-storage-${userId}`);

// 导出为 JSON 文件
const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(gameData);
const downloadAnchor = document.createElement('a');
downloadAnchor.setAttribute("href", dataStr);
downloadAnchor.setAttribute("download", "liferpg-backup.json");
downloadAnchor.click();
```

**未来计划：** 在设置页面添加"导出数据"按钮。

### Q8: 如何重置游戏数据？

**A:** 使用 `resetGame()` 方法：

```typescript
const { resetGame } = useGameStore();

// 重置游戏（保留用户设置）
resetGame();
```

或者在设置页面点击"重置游戏"按钮。

### Q9: 如何自定义粒子背景？

**A:** 使用 `updateSettings` 方法：

```typescript
const { updateSettings } = useGameStore();

updateSettings({
  particleMode: 'wave', // 'repulsion' | 'attraction' | 'wave'
  particleColorTheme: 'rainbow', // 'cyber' | 'rainbow' | 'mono' | 'grayscale'
  particleDimension: '3d', // '2d' | '3d'
  particleDistribution: 'circular', // 'circular' | 'rectangular'
});
```

或在设置页面通过 UI 调整。

---

## 贡献指南

### 如何贡献

1. **Fork 项目**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/your-username/liferpg.git
   cd liferpg
   ```

3. **创建功能分支**
   ```bash
   git checkout -b feature/my-new-feature
   ```

4. **开发和测试**
   ```bash
   # 开发
   npm run dev

   # 测试（如果有）
   npm run test

   # 类型检查
   npm run type-check

   # 代码检查
   npm run lint
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add my new feature"
   ```

6. **推送到你的 Fork**
   ```bash
   git push origin feature/my-new-feature
   ```

7. **创建 Pull Request**
   - 在 GitHub 上打开你的 Fork
   - 点击 "New Pull Request"
   - 填写 PR 描述

### PR 要求

- ✅ 代码符合项目风格
- ✅ 通过 TypeScript 类型检查
- ✅ 通过 ESLint 检查
- ✅ 添加必要的注释
- ✅ 更新相关文档（如果需要）
- ✅ 测试覆盖（如果适用）

---

## 路线图

### 短期计划（Q1 2025）

- [ ] 移动端适配（响应式优化）
- [ ] 数据导出/导入功能
- [ ] 更多主题和皮肤
- [ ] 任务模板库
- [ ] 智能提醒系统
- [ ] 单元测试覆盖 > 80%

### 中期计划（Q2-Q3 2025）

- [ ] 云端同步（可选）
- [ ] 移动端 App（React Native）
- [ ] 社区功能（分享任务模板）
- [ ] 数据统计仪表盘
- [ ] Webhook 集成
- [ ] E2E 测试

### 长期计划（Q4 2025+）

- [ ] AI 助手（任务推荐、时间规划）
- [ ] 多人协作（团队任务）
- [ ] 游戏化扩展（宠物系统、装备系统）
- [ ] 第三方集成（日历、笔记等）
- [ ] API 开放平台

---

## 资源链接

### 官方文档

- [产品概述](./product-overview.md)
- [用户指南](./user-guide.md)
- [属性平衡系统](./attribute-balance-system.md)

### 技术文档

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Three.js 文档](https://threejs.org/docs)

### 社区

- GitHub Issues: [项目 Issues](https://github.com/yourusername/liferpg/issues)
- GitHub Discussions: [项目讨论区](https://github.com/yourusername/liferpg/discussions)

---

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../LICENSE) 文件。

---

## 致谢

感谢所有为 LifeRPG 做出贡献的开发者！

如有问题或建议，欢迎通过 GitHub Issues 联系我们。

---

**文档版本：** v1.0.0
**最后更新：** 2025-01-06
**维护者：** LifeRPG Development Team
