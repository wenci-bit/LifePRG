/**
 * 属性平衡成就检测逻辑测试用例
 *
 * 这个文件包含了所有平衡类成就的测试用例
 * 可以用于验证成就检测逻辑的正确性
 */

import { describe, test, expect } from '@jest/globals';

// 辅助函数：计算属性差值
function getAttributeDifference(attributes: {
  int: number;
  vit: number;
  mng: number;
  cre: number;
}): number {
  const values = [attributes.int, attributes.vit, attributes.mng, attributes.cre];
  return Math.max(...values) - Math.min(...values);
}

// 辅助函数：检查先行者成就
function checkLeadingAchievement(
  leadAttr: number,
  otherAttrs: number[]
): boolean {
  // 其他属性必须≥70
  if (!otherAttrs.every(attr => attr >= 70)) return false;

  // 领先属性必须比所有其他属性高15-25点
  const differences = otherAttrs.map(attr => leadAttr - attr);
  return differences.every(diff => diff >= 15 && diff <= 25);
}

// 辅助函数：检查平衡成就
function checkBalanceAchievement(
  attributes: { int: number; vit: number; mng: number; cre: number },
  maxDiff: number,
  minValue: number
): boolean {
  const values = [attributes.int, attributes.vit, attributes.mng, attributes.cre];
  const max = Math.max(...values);
  const min = Math.min(...values);

  return (max - min <= maxDiff) && (min >= minValue);
}

describe('属性差值计算', () => {
  test('所有属性相等时差值为0', () => {
    const attributes = { int: 100, vit: 100, mng: 100, cre: 100 };
    expect(getAttributeDifference(attributes)).toBe(0);
  });

  test('最大最小差值计算正确', () => {
    const attributes = { int: 100, vit: 80, mng: 90, cre: 85 };
    expect(getAttributeDifference(attributes)).toBe(20); // 100 - 80
  });

  test('单项极高时差值计算正确', () => {
    const attributes = { int: 150, vit: 50, mng: 50, cre: 50 };
    expect(getAttributeDifference(attributes)).toBe(100); // 150 - 50
  });
});

describe('守护者学徒 (guardian_initiate)', () => {
  test('所有属性≥15时应该解锁', () => {
    const attributes = { int: 15, vit: 15, mng: 15, cre: 15 };
    const allAbove15 = Object.values(attributes).every(v => v >= 15);
    expect(allAbove15).toBe(true);
  });

  test('有一项<15时不应该解锁', () => {
    const attributes = { int: 15, vit: 14, mng: 15, cre: 15 };
    const allAbove15 = Object.values(attributes).every(v => v >= 15);
    expect(allAbove15).toBe(false);
  });

  test('所有属性>15时应该解锁', () => {
    const attributes = { int: 20, vit: 18, mng: 22, cre: 19 };
    const allAbove15 = Object.values(attributes).every(v => v >= 15);
    expect(allAbove15).toBe(true);
  });
});

describe('智慧引领 (guardian_focused_int)', () => {
  test('正常情况：INT=90, 其他=70', () => {
    const { int, vit, mng, cre } = { int: 90, vit: 70, mng: 70, cre: 70 };
    const result = checkLeadingAchievement(int, [vit, mng, cre]);
    expect(result).toBe(true);
  });

  test('边界情况：差值刚好15点', () => {
    const { int, vit, mng, cre } = { int: 85, vit: 70, mng: 70, cre: 70 };
    const result = checkLeadingAchievement(int, [vit, mng, cre]);
    expect(result).toBe(true);
  });

  test('边界情况：差值刚好25点', () => {
    const { int, vit, mng, cre } = { int: 95, vit: 70, mng: 70, cre: 70 };
    const result = checkLeadingAchievement(int, [vit, mng, cre]);
    expect(result).toBe(true);
  });

  test('失败情况：其他属性<70', () => {
    const { int, vit, mng, cre } = { int: 90, vit: 69, mng: 70, cre: 70 };
    const result = checkLeadingAchievement(int, [vit, mng, cre]);
    expect(result).toBe(false);
  });

  test('失败情况：差值<15', () => {
    const { int, vit, mng, cre } = { int: 84, vit: 70, mng: 70, cre: 70 };
    const result = checkLeadingAchievement(int, [vit, mng, cre]);
    expect(result).toBe(false);
  });

  test('失败情况：差值>25', () => {
    const { int, vit, mng, cre } = { int: 96, vit: 70, mng: 70, cre: 70 };
    const result = checkLeadingAchievement(int, [vit, mng, cre]);
    expect(result).toBe(false);
  });

  test('复杂情况：其他属性不相等但都≥70', () => {
    const { int, vit, mng, cre } = { int: 92, vit: 70, mng: 72, cre: 75 };
    const result = checkLeadingAchievement(int, [vit, mng, cre]);
    expect(result).toBe(true); // 差值: 22, 20, 17 都在15-25之间
  });

  test('失败情况：与某个属性差值过大', () => {
    const { int, vit, mng, cre } = { int: 100, vit: 70, mng: 80, cre: 85 };
    const result = checkLeadingAchievement(int, [vit, mng, cre]);
    expect(result).toBe(false); // 与VIT差值30>25
  });
});

describe('活力引领 (guardian_focused_vit)', () => {
  test('正常情况：VIT=88, 其他=70', () => {
    const { int, vit, mng, cre } = { int: 70, vit: 88, mng: 70, cre: 70 };
    const result = checkLeadingAchievement(vit, [int, mng, cre]);
    expect(result).toBe(true);
  });

  test('失败情况：其他属性有一项<70', () => {
    const { int, vit, mng, cre } = { int: 69, vit: 88, mng: 70, cre: 70 };
    const result = checkLeadingAchievement(vit, [int, mng, cre]);
    expect(result).toBe(false);
  });
});

describe('管理引领 (guardian_focused_mng)', () => {
  test('正常情况：MNG=90, 其他=72', () => {
    const { int, vit, mng, cre } = { int: 72, vit: 72, mng: 90, cre: 72 };
    const result = checkLeadingAchievement(mng, [int, vit, cre]);
    expect(result).toBe(true);
  });
});

describe('创造引领 (guardian_focused_cre)', () => {
  test('正常情况：CRE=95, 其他=75', () => {
    const { int, vit, mng, cre } = { int: 75, vit: 75, mng: 75, cre: 95 };
    const result = checkLeadingAchievement(cre, [int, vit, mng]);
    expect(result).toBe(true);
  });
});

describe('黄金比例 (guardian_attribute_balance)', () => {
  test('正常情况：差值=15, 最低=65', () => {
    const attributes = { int: 80, vit: 75, mng: 65, cre: 78 };
    const result = checkBalanceAchievement(attributes, 20, 60);
    expect(result).toBe(true);
  });

  test('边界情况：差值刚好20', () => {
    const attributes = { int: 80, vit: 70, mng: 60, cre: 75 };
    const result = checkBalanceAchievement(attributes, 20, 60);
    expect(result).toBe(true);
  });

  test('边界情况：最低刚好60', () => {
    const attributes = { int: 75, vit: 60, mng: 70, cre: 65 };
    const result = checkBalanceAchievement(attributes, 20, 60);
    expect(result).toBe(true);
  });

  test('失败情况：差值>20', () => {
    const attributes = { int: 81, vit: 70, mng: 60, cre: 75 };
    const result = checkBalanceAchievement(attributes, 20, 60);
    expect(result).toBe(false);
  });

  test('失败情况：最低<60', () => {
    const attributes = { int: 75, vit: 59, mng: 70, cre: 65 };
    const result = checkBalanceAchievement(attributes, 20, 60);
    expect(result).toBe(false);
  });

  test('完美情况：所有属性相等且≥60', () => {
    const attributes = { int: 70, vit: 70, mng: 70, cre: 70 };
    const result = checkBalanceAchievement(attributes, 20, 60);
    expect(result).toBe(true);
  });
});

describe('平衡守护者 (guardian_balanced)', () => {
  test('所有属性≥25时应该解锁', () => {
    const attributes = { int: 25, vit: 30, mng: 28, cre: 26 };
    const allAbove25 = Object.values(attributes).every(v => v >= 25);
    expect(allAbove25).toBe(true);
  });

  test('有一项<25时不应该解锁', () => {
    const attributes = { int: 25, vit: 24, mng: 28, cre: 26 };
    const allAbove25 = Object.values(attributes).every(v => v >= 25);
    expect(allAbove25).toBe(false);
  });
});

describe('和谐守护者 (guardian_harmony)', () => {
  test('所有属性≥50时应该解锁', () => {
    const attributes = { int: 50, vit: 55, mng: 52, cre: 53 };
    const allAbove50 = Object.values(attributes).every(v => v >= 50);
    expect(allAbove50).toBe(true);
  });
});

describe('完美守护者 (guardian_perfect)', () => {
  test('所有属性≥100时应该解锁', () => {
    const attributes = { int: 100, vit: 105, mng: 102, cre: 103 };
    const allAbove100 = Object.values(attributes).every(v => v >= 100);
    expect(allAbove100).toBe(true);
  });
});

describe('至高守护者 (guardian_ultimate)', () => {
  test('正常情况：所有≥120且差值≤15', () => {
    const attributes = { int: 120, vit: 125, mng: 122, cre: 128 };
    const allAbove120 = Object.values(attributes).every(v => v >= 120);
    const diff = getAttributeDifference(attributes);
    expect(allAbove120 && diff <= 15).toBe(true);
  });

  test('边界情况：差值刚好15', () => {
    const attributes = { int: 120, vit: 135, mng: 125, cre: 130 };
    const allAbove120 = Object.values(attributes).every(v => v >= 120);
    const diff = getAttributeDifference(attributes);
    expect(allAbove120 && diff <= 15).toBe(true);
  });

  test('失败情况：差值>15', () => {
    const attributes = { int: 120, vit: 136, mng: 125, cre: 130 };
    const allAbove120 = Object.values(attributes).every(v => v >= 120);
    const diff = getAttributeDifference(attributes);
    expect(allAbove120 && diff <= 15).toBe(false);
  });

  test('失败情况：有属性<120', () => {
    const attributes = { int: 119, vit: 125, mng: 122, cre: 128 };
    const allAbove120 = Object.values(attributes).every(v => v >= 120);
    const diff = getAttributeDifference(attributes);
    expect(allAbove120 && diff <= 15).toBe(false);
  });
});

describe('和谐共生 (perfect_all_attributes_max)', () => {
  test('正常情况：所有≥100且差值≤10', () => {
    const attributes = { int: 100, vit: 105, mng: 102, cre: 108 };
    const result = checkBalanceAchievement(attributes, 10, 100);
    expect(result).toBe(true);
  });

  test('边界情况：差值刚好10', () => {
    const attributes = { int: 100, vit: 110, mng: 105, cre: 108 };
    const result = checkBalanceAchievement(attributes, 10, 100);
    expect(result).toBe(true);
  });

  test('失败情况：差值>10', () => {
    const attributes = { int: 100, vit: 111, mng: 105, cre: 108 };
    const result = checkBalanceAchievement(attributes, 10, 100);
    expect(result).toBe(false);
  });

  test('完美情况：所有属性相等', () => {
    const attributes = { int: 100, vit: 100, mng: 100, cre: 100 };
    const result = checkBalanceAchievement(attributes, 10, 100);
    expect(result).toBe(true);
  });
});

describe('极限平衡 (extreme_all_balanced)', () => {
  test('正常情况：所有≥150且差值≤10', () => {
    const attributes = { int: 150, vit: 155, mng: 152, cre: 158 };
    const result = checkBalanceAchievement(attributes, 10, 150);
    expect(result).toBe(true);
  });

  test('边界情况：差值刚好10', () => {
    const attributes = { int: 150, vit: 160, mng: 155, cre: 158 };
    const result = checkBalanceAchievement(attributes, 10, 150);
    expect(result).toBe(true);
  });

  test('失败情况：差值>10', () => {
    const attributes = { int: 150, vit: 161, mng: 155, cre: 158 };
    const result = checkBalanceAchievement(attributes, 10, 150);
    expect(result).toBe(false);
  });

  test('失败情况：有属性<150', () => {
    const attributes = { int: 149, vit: 155, mng: 152, cre: 158 };
    const result = checkBalanceAchievement(attributes, 10, 150);
    expect(result).toBe(false);
  });

  test('完美情况：所有属性=150', () => {
    const attributes = { int: 150, vit: 150, mng: 150, cre: 150 };
    const result = checkBalanceAchievement(attributes, 10, 150);
    expect(result).toBe(true);
  });
});

describe('双八福气 (digit_attribute_88)', () => {
  test('所有属性≥88时应该解锁', () => {
    const attributes = { int: 88, vit: 88, mng: 88, cre: 88 };
    const allAbove88 = Object.values(attributes).every(v => v >= 88);
    expect(allAbove88).toBe(true);
  });

  test('有一项<88时不应该解锁', () => {
    const attributes = { int: 88, vit: 87, mng: 88, cre: 88 };
    const allAbove88 = Object.values(attributes).every(v => v >= 88);
    expect(allAbove88).toBe(false);
  });

  test('所有属性>88时应该解锁', () => {
    const attributes = { int: 90, vit: 92, mng: 89, cre: 91 };
    const allAbove88 = Object.values(attributes).every(v => v >= 88);
    expect(allAbove88).toBe(true);
  });
});

describe('终极传奇 (legendary_ultimate)', () => {
  test('正常情况：等级50+属性100且差值≤10+任务500', () => {
    const level = 50;
    const questsCompleted = 500;
    const attributes = { int: 100, vit: 105, mng: 102, cre: 108 };

    const meetsLevelRequirement = level >= 50;
    const meetsQuestRequirement = questsCompleted >= 500;
    const meetsAttributeRequirement = checkBalanceAchievement(attributes, 10, 100);

    expect(meetsLevelRequirement && meetsQuestRequirement && meetsAttributeRequirement).toBe(true);
  });

  test('失败情况：等级不足', () => {
    const level = 49;
    const questsCompleted = 500;
    const attributes = { int: 100, vit: 105, mng: 102, cre: 108 };

    const meetsLevelRequirement = level >= 50;
    const meetsQuestRequirement = questsCompleted >= 500;
    const meetsAttributeRequirement = checkBalanceAchievement(attributes, 10, 100);

    expect(meetsLevelRequirement && meetsQuestRequirement && meetsAttributeRequirement).toBe(false);
  });

  test('失败情况：任务不足', () => {
    const level = 50;
    const questsCompleted = 499;
    const attributes = { int: 100, vit: 105, mng: 102, cre: 108 };

    const meetsLevelRequirement = level >= 50;
    const meetsQuestRequirement = questsCompleted >= 500;
    const meetsAttributeRequirement = checkBalanceAchievement(attributes, 10, 100);

    expect(meetsLevelRequirement && meetsQuestRequirement && meetsAttributeRequirement).toBe(false);
  });

  test('失败情况：属性差值过大', () => {
    const level = 50;
    const questsCompleted = 500;
    const attributes = { int: 100, vit: 111, mng: 102, cre: 108 };

    const meetsLevelRequirement = level >= 50;
    const meetsQuestRequirement = questsCompleted >= 500;
    const meetsAttributeRequirement = checkBalanceAchievement(attributes, 10, 100);

    expect(meetsLevelRequirement && meetsQuestRequirement && meetsAttributeRequirement).toBe(false);
  });
});

describe('综合测试场景', () => {
  test('场景1：新手玩家（均衡发展）', () => {
    const attributes = { int: 20, vit: 20, mng: 20, cre: 20 };

    // 应该解锁守护者学徒
    const canUnlockInitiate = Object.values(attributes).every(v => v >= 15);
    expect(canUnlockInitiate).toBe(true);

    // 不应该解锁平衡守护者
    const canUnlockBalanced = Object.values(attributes).every(v => v >= 25);
    expect(canUnlockBalanced).toBe(false);

    // 差值为0，平衡度完美
    const diff = getAttributeDifference(attributes);
    expect(diff).toBe(0);
  });

  test('场景2：中期玩家（先行者路线）', () => {
    const attributes = { int: 90, vit: 70, mng: 72, cre: 75 };

    // 应该解锁智慧引领
    const canUnlockIntLeading = checkLeadingAchievement(
      attributes.int,
      [attributes.vit, attributes.mng, attributes.cre]
    );
    expect(canUnlockIntLeading).toBe(true);

    // 不应该解锁黄金比例（差值20，但最低70≥60，应该可以）
    const canUnlockGoldenRatio = checkBalanceAchievement(attributes, 20, 60);
    expect(canUnlockGoldenRatio).toBe(true);

    // 差值为20
    const diff = getAttributeDifference(attributes);
    expect(diff).toBe(20);
  });

  test('场景3：后期玩家（完美平衡）', () => {
    const attributes = { int: 105, vit: 100, mng: 102, cre: 108 };

    // 应该解锁完美守护者
    const canUnlockPerfect = Object.values(attributes).every(v => v >= 100);
    expect(canUnlockPerfect).toBe(true);

    // 应该解锁和谐共生
    const canUnlockHarmony = checkBalanceAchievement(attributes, 10, 100);
    expect(canUnlockHarmony).toBe(true);

    // 差值为8
    const diff = getAttributeDifference(attributes);
    expect(diff).toBe(8);
  });

  test('场景4：失衡玩家（需要调整）', () => {
    const attributes = { int: 150, vit: 60, mng: 65, cre: 70 };

    // 不应该解锁任何先行者成就（其他属性有<70的）
    const canUnlockIntLeading = checkLeadingAchievement(
      attributes.int,
      [attributes.vit, attributes.mng, attributes.cre]
    );
    expect(canUnlockIntLeading).toBe(false);

    // 不应该解锁黄金比例（差值90>20）
    const canUnlockGoldenRatio = checkBalanceAchievement(attributes, 20, 60);
    expect(canUnlockGoldenRatio).toBe(false);

    // 差值为90，严重失衡
    const diff = getAttributeDifference(attributes);
    expect(diff).toBe(90);
  });

  test('场景5：终极玩家（极限平衡）', () => {
    const attributes = { int: 155, vit: 150, mng: 152, cre: 158 };

    // 应该解锁极限平衡
    const canUnlockExtreme = checkBalanceAchievement(attributes, 10, 150);
    expect(canUnlockExtreme).toBe(true);

    // 应该解锁至高守护者（所有≥120且差值≤15）
    const allAbove120 = Object.values(attributes).every(v => v >= 120);
    const diff = getAttributeDifference(attributes);
    const canUnlockUltimate = allAbove120 && diff <= 15;
    expect(canUnlockUltimate).toBe(true);

    // 差值为8
    expect(diff).toBe(8);
  });
});

describe('边界值测试', () => {
  test('属性值为0', () => {
    const attributes = { int: 0, vit: 0, mng: 0, cre: 0 };
    const diff = getAttributeDifference(attributes);
    expect(diff).toBe(0);
  });

  test('属性值为负数（理论上不应该出现）', () => {
    const attributes = { int: -10, vit: 0, mng: 5, cre: 10 };
    const diff = getAttributeDifference(attributes);
    expect(diff).toBe(20); // 10 - (-10)
  });

  test('属性值非常大', () => {
    const attributes = { int: 10000, vit: 9990, mng: 9995, cre: 10000 };
    const diff = getAttributeDifference(attributes);
    expect(diff).toBe(10);
  });

  test('浮点数属性值（理论上不应该出现）', () => {
    const attributes = { int: 100.5, vit: 100.2, mng: 100.8, cre: 100.1 };
    const diff = getAttributeDifference(attributes);
    expect(diff).toBeCloseTo(0.7, 1);
  });
});

export {
  getAttributeDifference,
  checkLeadingAchievement,
  checkBalanceAchievement,
};
