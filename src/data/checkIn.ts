/**
 * 每日签到奖励配置
 *
 * 设计理念：
 * - 每日签到给予基础奖励
 * - 连续签到天数越多，奖励越丰厚
 * - 特殊日期（第7、14、21、28、30天）给予额外奖励
 */

export interface CheckInReward {
  day: number; // 连续签到天数
  exp: number; // 经验奖励
  coins: number; // 金币奖励
  categorizedCoins?: { // 分类金币奖励（可选）
    int?: number;
    vit?: number;
    mng?: number;
    cre?: number;
  };
  bonusMessage?: string; // 特殊奖励提示
  isSpecial?: boolean; // 是否特殊奖励日
}

/**
 * 计算签到奖励
 * @param consecutiveDays 连续签到天数
 * @returns 签到奖励对象
 */
export function calculateCheckInReward(consecutiveDays: number): CheckInReward {
  // 基础奖励
  const baseExp = 20;
  const baseCoin = 10;

  // 每连续签到1天，奖励递增
  const dailyBonus = Math.floor(consecutiveDays / 5) * 5; // 每5天增加5点奖励

  let exp = baseExp + dailyBonus;
  let coins = baseCoin + dailyBonus;
  let bonusMessage: string | undefined = undefined;
  let categorizedCoins: CheckInReward['categorizedCoins'] = undefined;
  let isSpecial = false;

  // 特殊奖励日
  if (consecutiveDays === 7) {
    // 第7天：周奖励
    exp += 50;
    coins += 30;
    categorizedCoins = {
      int: 10,
      vit: 10,
      mng: 10,
      cre: 10,
    };
    bonusMessage = '🎉 连续签到7天！获得额外奖励！';
    isSpecial = true;
  } else if (consecutiveDays === 14) {
    // 第14天：双周奖励
    exp += 80;
    coins += 50;
    categorizedCoins = {
      int: 15,
      vit: 15,
      mng: 15,
      cre: 15,
    };
    bonusMessage = '✨ 连续签到14天！坚持得太好了！';
    isSpecial = true;
  } else if (consecutiveDays === 21) {
    // 第21天：三周奖励
    exp += 120;
    coins += 70;
    categorizedCoins = {
      int: 20,
      vit: 20,
      mng: 20,
      cre: 20,
    };
    bonusMessage = '🔥 连续签到21天！养成习惯的关键时期！';
    isSpecial = true;
  } else if (consecutiveDays === 28) {
    // 第28天：四周奖励
    exp += 150;
    coins += 100;
    categorizedCoins = {
      int: 25,
      vit: 25,
      mng: 25,
      cre: 25,
    };
    bonusMessage = '🏆 连续签到28天！你已经是大师了！';
    isSpecial = true;
  } else if (consecutiveDays === 30) {
    // 第30天：月度大奖
    exp += 200;
    coins += 150;
    categorizedCoins = {
      int: 40,
      vit: 40,
      mng: 40,
      cre: 40,
    };
    bonusMessage = '👑 连续签到30天！月度传奇成就！';
    isSpecial = true;
  } else if (consecutiveDays % 30 === 0 && consecutiveDays > 30) {
    // 每30天的倍数：额外月度奖励
    exp += 250;
    coins += 200;
    categorizedCoins = {
      int: 50,
      vit: 50,
      mng: 50,
      cre: 50,
    };
    bonusMessage = `🌟 连续签到${consecutiveDays}天！你是真正的传奇！`;
    isSpecial = true;
  } else if (consecutiveDays % 100 === 0) {
    // 百日奖励
    exp += 500;
    coins += 500;
    categorizedCoins = {
      int: 100,
      vit: 100,
      mng: 100,
      cre: 100,
    };
    bonusMessage = `💎 连续签到${consecutiveDays}天！百日成就！`;
    isSpecial = true;
  }

  return {
    day: consecutiveDays,
    exp,
    coins,
    categorizedCoins,
    bonusMessage,
    isSpecial,
  };
}

/**
 * 获取下一个里程碑的天数
 * @param currentDays 当前连续签到天数
 * @returns 下一个里程碑天数
 */
export function getNextMilestone(currentDays: number): number {
  const milestones = [7, 14, 21, 28, 30, 60, 90, 100, 180, 365];

  for (const milestone of milestones) {
    if (currentDays < milestone) {
      return milestone;
    }
  }

  // 如果超过所有预设里程碑，返回下一个30的倍数
  return Math.ceil((currentDays + 1) / 30) * 30;
}

/**
 * 签到奖励提示信息
 */
export const CHECK_IN_MESSAGES = {
  welcome: '每日签到，坚持就是胜利！',
  encouragement: [
    '今天也要加油哦！',
    '坚持就是胜利！',
    '你做得很棒！',
    '继续保持这份热情！',
    '每一天都是新的开始！',
  ],
  alreadyCheckedIn: '今天已经签到过了，明天再来吧！',
  streakBroken: '签到中断了，重新开始吧！',
};

/**
 * 获取随机鼓励语
 */
export function getRandomEncouragement(): string {
  const messages = CHECK_IN_MESSAGES.encouragement;
  return messages[Math.floor(Math.random() * messages.length)];
}
