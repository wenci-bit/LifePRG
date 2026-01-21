# 等级系统调试信息

## 问题描述
- 完成50经验的任务，升到了6级
- 取消任务后，等级没有降回来

## 需要检查的数据

### 1. 当前状态
请在浏览器控制台（F12）执行以下命令查看当前状态：

```javascript
// 获取游戏状态
const state = JSON.parse(localStorage.getItem('liferpg-storage-你的用户ID'));

console.log('=== 当前状态 ===');
console.log('等级:', state.state.level);
console.log('当前经验:', state.state.currentExp);
console.log('升级所需:', state.state.maxExp);
console.log('连击天数:', state.state.stats.currentStreak);

console.log('\n=== 经验交易记录 ===');
state.state.transactions.exp.forEach(t => {
  if (!t.revoked) {
    console.log(`${t.type}: ${t.amount} - ${t.reason}`);
  }
});
```

### 2. 升级计算公式

**等级经验需求：**
- 1级 → 2级：100 * 1.5 = 150经验
- 2级 → 3级：200 * 1.5 = 300经验
- 3级 → 4级：300 * 1.5 = 450经验
- 4级 → 5级：400 * 1.5 = 600经验
- 5级 → 6级：500 * 1.5 = 750经验

**从1级升到6级总共需要：**
150 + 300 + 450 + 600 + 750 = 2250经验

**50经验任务的可能加成：**
- 无加成：50经验
- 连击3天：50 × 1.1 = 55经验
- 连击7天：50 × 1.2 = 60经验
- 连击14天：50 × 1.3 = 65经验
- 连击30天：50 × 1.5 = 75经验

**结论：** 50经验即使有最高加成（75经验）也不可能升到6级！

### 3. 可能的原因

#### 原因A：多次完成任务
- 是否多次点击了"完成任务"按钮？
- 检查经验交易记录中是否有多条相同任务的记录

#### 原因B：其他经验来源
- 每日登录奖励：10-60经验（根据连击）
- 成就解锁：各种经验奖励
- 检查所有经验交易记录

#### 原因C：降级逻辑未触发
- 取消任务时，`subtractExp` 可能没有正确执行
- 或者降级条件判断有问题

### 4. 测试步骤

#### 测试1：验证升级逻辑
1. 创建一个新账号
2. 创建一个50经验的任务
3. 完成任务
4. 查看等级变化
5. 查看经验交易记录

#### 测试2：验证降级逻辑
1. 在测试1的基础上
2. 取消完成任务
3. 查看等级是否降回1级
4. 查看经验是否变回0

### 5. 调试代码

在 `addExp` 函数中添加 console.log：

```typescript
addExp: (amount: number, reason: string, relatedId?: string) => {
  set((state) => {
    const expBonus = getExpBonus(state.level);
    const streakBonus = getStreakBonus(state.stats.currentStreak);
    const finalAmount = Math.floor(amount * expBonus * streakBonus);

    console.log('=== addExp 调试 ===');
    console.log('原始经验:', amount);
    console.log('等级加成:', expBonus);
    console.log('连击加成:', streakBonus);
    console.log('最终经验:', finalAmount);
    console.log('当前等级:', state.level);
    console.log('当前经验:', state.currentExp);

    // ... 后续逻辑
  });
}
```

在 `subtractExp` 函数中添加 console.log：

```typescript
subtractExp: (amount: number, reason: string, relatedId?: string) => {
  set((state) => {
    console.log('=== subtractExp 调试 ===');
    console.log('扣除经验:', amount);
    console.log('当前等级:', state.level);
    console.log('当前经验:', state.currentExp);

    let currentExp = state.currentExp - amount;
    console.log('扣除后经验:', currentExp);

    // ... 后续逻辑
  });
}
```

### 6. 预期行为

**正确的流程：**
```
初始状态：level=1, currentExp=0, maxExp=150

完成50经验任务（无加成）：
→ currentExp = 0 + 50 = 50
→ 50 < 150，不升级
→ 最终：level=1, currentExp=50

取消任务：
→ currentExp = 50 - 50 = 0
→ 0 >= 0，不降级
→ 最终：level=1, currentExp=0
```

**如果有连击加成（假设7天，1.2倍）：**
```
完成50经验任务：
→ finalAmount = 50 * 1.2 = 60
→ currentExp = 0 + 60 = 60
→ 60 < 150，不升级
→ 最终：level=1, currentExp=60

取消任务：
→ 扣除60经验（记录中的实际值）
→ currentExp = 60 - 60 = 0
→ 最终：level=1, currentExp=0
```

## 请提供以下信息

1. 你的连击天数是多少？
2. 完成任务前的等级和经验是多少？
3. 完成任务后的等级和经验是多少？
4. 取消任务后的等级和经验是多少？
5. 经验交易记录中有几条记录？

这些信息将帮助我定位问题所在。
