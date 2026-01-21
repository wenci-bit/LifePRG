# Zustand 状态管理优化指南

## 📌 优化原则

### ✅ 推荐做法：使用选择器

```typescript
// ✅ 好 - 只订阅需要的状态
const level = useGameStore(state => state.level);
const coins = useGameStore(state => state.coins);

// ✅ 好 - 多个状态时使用对象选择器
const { level, coins } = useGameStore(state => ({
  level: state.level,
  coins: state.coins,
}));
```

### ❌ 避免的做法

```typescript
// ❌ 差 - 订阅整个store,导致不必要的重渲染
const gameState = useGameStore();
const level = gameState.level;

// ❌ 差 - 解构整个store
const { level, coins, quests, attributes, ... } = useGameStore();
```

## 🎯 优化后的组件示例

### 示例 1: 简单组件

```typescript
// components/LevelDisplay.tsx
export function LevelDisplay() {
  // 只订阅level,当其他状态变化时不会重渲染
  const level = useGameStore(state => state.level);

  return <div>Level {level}</div>;
}
```

### 示例 2: 使用多个状态

```typescript
// components/StatsCard.tsx
import { useGameStore } from '@/store/gameStore';
import { shallow } from 'zustand/shallow';

export function StatsCard() {
  // 使用shallow比较,只有这些值变化时才重渲染
  const { level, currentExp, maxExp, coins } = useGameStore(
    state => ({
      level: state.level,
      currentExp: state.currentExp,
      maxExp: state.maxExp,
      coins: state.coins,
    }),
    shallow
  );

  return (
    <div>
      <p>Level: {level}</p>
      <p>EXP: {currentExp}/{maxExp}</p>
      <p>Coins: {coins}</p>
    </div>
  );
}
```

### 示例 3: 使用Actions

```typescript
// components/QuestCard.tsx
export function QuestCard({ questId }: { questId: string }) {
  // 分离数据订阅和action
  const quest = useGameStore(state =>
    state.quests.find(q => q.id === questId)
  );

  // Actions不会导致重渲染
  const completeQuest = useGameStore(state => state.completeQuest);
  const deleteQuest = useGameStore(state => state.deleteQuest);

  if (!quest) return null;

  return (
    <div>
      <h3>{quest.title}</h3>
      <button onClick={() => completeQuest(questId)}>
        完成
      </button>
      <button onClick={() => deleteQuest(questId)}>
        删除
      </button>
    </div>
  );
}
```

## 🚀 性能提升对比

| 方法 | 重渲染次数 | 性能 |
|------|-----------|------|
| 订阅整个store | 每次状态更新都重渲染 | ❌ 差 |
| 使用选择器 | 只有相关状态变化才重渲染 | ✅ 好 |
| 使用shallow比较 | 对象引用变化但值不变时不重渲染 | ✅✅ 最佳 |

## 📊 实际应用

### DashboardPage 优化示例

```typescript
// 优化前
const gameState = useGameStore();

// 优化后
const { level, currentExp, maxExp, coins, stats, quests, attributes, completeQuest } =
  useGameStore((state) => ({
    level: state.level,
    currentExp: state.currentExp,
    maxExp: state.maxExp,
    coins: state.coins,
    stats: state.stats,
    quests: state.quests,
    attributes: state.attributes,
    completeQuest: state.completeQuest,
  }), shallow);
```

## 💡 调试技巧

### 检测重渲染

```typescript
import { useEffect } from 'react';

export function MyComponent() {
  const level = useGameStore(state => state.level);

  useEffect(() => {
    console.log('Component re-rendered, level:', level);
  });

  return <div>Level: {level}</div>;
}
```

### 使用 React DevTools Profiler

1. 打开 React DevTools
2. 切换到 Profiler 标签
3. 点击录制
4. 执行一些操作
5. 停止录制,查看哪些组件重渲染了

## 🎓 最佳实践总结

1. **最小化订阅**: 只订阅组件真正需要的状态
2. **使用shallow**: 当订阅对象时使用shallow比较
3. **分离concerns**: 数据订阅和actions分开
4. **避免在render中创建新对象**: 会导致每次都是新引用
5. **使用useMemo**: 对计算密集的派生状态使用useMemo
6. **监控性能**: 使用React DevTools定期检查

## 🔗 参考资源

- [Zustand 官方文档](https://github.com/pmndrs/zustand)
- [React性能优化](https://react.dev/learn/render-and-commit)
