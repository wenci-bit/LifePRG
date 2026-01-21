/**
 * Reward Shop Data - 兑换商店数据
 *
 * 分类金币系统 + 丰富的兑换内容
 */

export type CoinType = 'int' | 'vit' | 'mng' | 'cre' | 'universal';
export type RewardCategory = 'indulgence' | 'boost' | 'decoration' | 'functional' | 'special';

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  icon: string;

  // 价格系统
  price: {
    coinType: CoinType | 'any';  // 需要的金币类型，'any' 表示任何类型都可以
    amount: number;
    achievementPoints?: number;  // 某些物品需要成就点数
  };

  // 购买限制
  limit?: number;  // 限购数量（undefined 表示无限）
  requireLevel?: number;  // 需要的等级
  requireAchievements?: string[];  // 需要的成就

  // 物品效果
  effect?: {
    type: 'exp_boost' | 'coin_boost' | 'attribute_points' | 'title' | 'cosmetic' | 'functional';
    value?: number;
    duration?: number;  // 持续时间（分钟）
    permanent?: boolean;  // 是否永久
  };

  // 稀有度
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  // 特殊标记
  isLimitedTime?: boolean;  // 是否限时
  isFeatured?: boolean;     // 是否精选
}

export const REWARD_SHOP: RewardItem[] = [
  // ========== 放纵类（Indulgence）- 需要对应类别金币 ==========
  // 设计理念：只有在对应领域努力过，才能享受放纵

  {
    id: 'indulge_feast',
    name: '放纵美食',
    description: '奖励自己一顿大餐！只有坚持健康饮食才能偶尔放纵',
    category: 'indulgence',
    icon: 'UtensilsCrossed',
    price: {
      coinType: 'vit',  // 需要活力币（健康类任务获得）
      amount: 50,
    },
    limit: undefined,  // 无限购买
    effect: {
      type: 'cosmetic',
      permanent: false,
    },
    rarity: 'common',
  },
  {
    id: 'indulge_gaming',
    name: '娱乐时间券',
    description: '2小时无罪恶感娱乐时间！工作之后的放松',
    category: 'indulgence',
    icon: 'Gamepad2',
    price: {
      coinType: 'int',  // 需要智慧币（学习类任务获得）
      amount: 80,
    },
    effect: {
      type: 'cosmetic',
      duration: 120,
    },
    rarity: 'rare',
  },
  {
    id: 'indulge_lazy_day',
    name: '懒散日',
    description: '24小时完全放松！只有高效工作者才配享受',
    category: 'indulgence',
    icon: 'Bed',
    price: {
      coinType: 'mng',  // 需要管理币（规划类任务获得）
      amount: 120,
    },
    limit: 2,  // 每周限购2次
    effect: {
      type: 'cosmetic',
      duration: 1440,
    },
    rarity: 'epic',
  },
  {
    id: 'indulge_creative_freedom',
    name: '自由创作日',
    description: '放下所有任务，自由创作！创意工作者的奖励',
    category: 'indulgence',
    icon: 'Palette',
    price: {
      coinType: 'cre',  // 需要创意币（创作类任务获得）
      amount: 100,
    },
    effect: {
      type: 'cosmetic',
      duration: 720,
    },
    rarity: 'rare',
  },
  {
    id: 'indulge_movie_night',
    name: '电影之夜',
    description: '3小时电影马拉松，零食自由！',
    category: 'indulgence',
    icon: 'Film',
    price: {
      coinType: 'universal',
      amount: 60,
    },
    rarity: 'common',
  },

  // ========== 提升类（Boost）- 任何金币都可购买 ==========

  {
    id: 'boost_exp_30min',
    name: '经验加成卡（30分钟）',
    description: '+50% 经验获取，持续30分钟',
    category: 'boost',
    icon: 'Zap',
    price: {
      coinType: 'any',
      amount: 30,
    },
    effect: {
      type: 'exp_boost',
      value: 50,
      duration: 30,
    },
    rarity: 'common',
  },
  {
    id: 'boost_exp_1hour',
    name: '经验加成卡（1小时）',
    description: '+50% 经验获取，持续1小时',
    category: 'boost',
    icon: 'Zap',
    price: {
      coinType: 'any',
      amount: 50,
    },
    effect: {
      type: 'exp_boost',
      value: 50,
      duration: 60,
    },
    rarity: 'rare',
  },
  {
    id: 'boost_exp_3hour',
    name: '经验加成卡（3小时）',
    description: '+100% 双倍经验，持续3小时',
    category: 'boost',
    icon: 'Zap',
    price: {
      coinType: 'any',
      amount: 150,
    },
    effect: {
      type: 'exp_boost',
      value: 100,
      duration: 180,
    },
    rarity: 'epic',
    isFeatured: true,
  },
  {
    id: 'boost_coin_1day',
    name: '金币加成卡（1天）',
    description: '+50% 金币获取，持续24小时',
    category: 'boost',
    icon: 'Coins',
    price: {
      coinType: 'any',
      amount: 80,
    },
    effect: {
      type: 'coin_boost',
      value: 50,
      duration: 1440,
    },
    rarity: 'rare',
  },
  {
    id: 'boost_attribute_int',
    name: 'INT 属性点',
    description: '永久增加 5 点智力属性',
    category: 'boost',
    icon: 'Brain',
    price: {
      coinType: 'int',
      amount: 200,
    },
    limit: 10,  // 最多购买10次（+50点）
    effect: {
      type: 'attribute_points',
      value: 5,
      permanent: true,
    },
    rarity: 'epic',
  },
  {
    id: 'boost_attribute_vit',
    name: 'VIT 属性点',
    description: '永久增加 5 点活力属性',
    category: 'boost',
    icon: 'Heart',
    price: {
      coinType: 'vit',
      amount: 200,
    },
    limit: 10,  // 最多购买10次（+50点）
    effect: {
      type: 'attribute_points',
      value: 5,
      permanent: true,
    },
    rarity: 'epic',
  },
  {
    id: 'boost_attribute_mng',
    name: 'MNG 属性点',
    description: '永久增加 5 点管理属性',
    category: 'boost',
    icon: 'BarChart',
    price: {
      coinType: 'mng',
      amount: 200,
    },
    limit: 10,  // 最多购买10次（+50点）
    effect: {
      type: 'attribute_points',
      value: 5,
      permanent: true,
    },
    rarity: 'epic',
  },
  {
    id: 'boost_attribute_cre',
    name: 'CRE 属性点',
    description: '永久增加 5 点创意属性',
    category: 'boost',
    icon: 'Lightbulb',
    price: {
      coinType: 'cre',
      amount: 200,
    },
    limit: 10,  // 最多购买10次（+50点）
    effect: {
      type: 'attribute_points',
      value: 5,
      permanent: true,
    },
    rarity: 'epic',
  },

  // ========== 装饰类（Decoration）- 任何金币都可购买 ==========

  {
    id: 'deco_frame_bronze',
    name: '青铜头像边框',
    description: '为你的头像添加青铜边框',
    category: 'decoration',
    icon: 'Frame',
    price: {
      coinType: 'any',
      amount: 50,
    },
    limit: 1,  // 永久装饰，只能购买一次
    effect: {
      type: 'cosmetic',
      permanent: true,
    },
    rarity: 'common',
  },
  {
    id: 'deco_frame_silver',
    name: '白银头像边框',
    description: '为你的头像添加白银边框',
    category: 'decoration',
    icon: 'Frame',
    price: {
      coinType: 'any',
      amount: 100,
    },
    limit: 1,  // 永久装饰，只能购买一次
    requireLevel: 10,
    effect: {
      type: 'cosmetic',
      permanent: true,
    },
    rarity: 'rare',
  },
  {
    id: 'deco_frame_gold',
    name: '黄金头像边框',
    description: '为你的头像添加黄金边框',
    category: 'decoration',
    icon: 'Frame',
    price: {
      coinType: 'any',
      amount: 200,
    },
    limit: 1,  // 永久装饰，只能购买一次
    requireLevel: 20,
    effect: {
      type: 'cosmetic',
      permanent: true,
    },
    rarity: 'epic',
  },
  {
    id: 'deco_title_scholar',
    name: '称号：学者',
    description: '获得专属称号"学者"',
    category: 'decoration',
    icon: 'Award',
    price: {
      coinType: 'int',
      amount: 150,
    },
    limit: 1,  // 永久称号，只能购买一次
    requireLevel: 15,
    effect: {
      type: 'title',
      permanent: true,
    },
    rarity: 'rare',
  },
  {
    id: 'deco_title_athlete',
    name: '称号：运动健将',
    description: '获得专属称号"运动健将"',
    category: 'decoration',
    icon: 'Award',
    price: {
      coinType: 'vit',
      amount: 150,
    },
    limit: 1,  // 永久称号，只能购买一次
    requireLevel: 15,
    effect: {
      type: 'title',
      permanent: true,
    },
    rarity: 'rare',
  },
  {
    id: 'deco_title_manager',
    name: '称号：时间管理大师',
    description: '获得专属称号"时间管理大师"',
    category: 'decoration',
    icon: 'Award',
    price: {
      coinType: 'mng',
      amount: 150,
    },
    limit: 1,  // 永久称号，只能购买一次
    requireLevel: 15,
    effect: {
      type: 'title',
      permanent: true,
    },
    rarity: 'rare',
  },
  {
    id: 'deco_title_artist',
    name: '称号：艺术家',
    description: '获得专属称号"艺术家"',
    category: 'decoration',
    icon: 'Award',
    price: {
      coinType: 'cre',
      amount: 150,
    },
    limit: 1,  // 永久称号，只能购买一次
    requireLevel: 15,
    effect: {
      type: 'title',
      permanent: true,
    },
    rarity: 'rare',
  },
  {
    id: 'deco_theme_aurora',
    name: '主题：极光',
    description: '粒子背景变为极光色彩',
    category: 'decoration',
    icon: 'Sparkles',
    price: {
      coinType: 'any',
      amount: 300,
    },
    limit: 1,  // 永久主题，只能购买一次
    requireLevel: 25,
    effect: {
      type: 'cosmetic',
      permanent: true,
    },
    rarity: 'epic',
  },
  {
    id: 'deco_theme_sunset',
    name: '主题：日落',
    description: '粒子背景变为日落色彩',
    category: 'decoration',
    icon: 'Sparkles',
    price: {
      coinType: 'any',
      amount: 300,
    },
    limit: 1,  // 永久主题，只能购买一次
    requireLevel: 25,
    effect: {
      type: 'cosmetic',
      permanent: true,
    },
    rarity: 'epic',
  },

  // ========== 功能类（Functional）- 需要成就点数+对应金币 ==========

  {
    id: 'func_attribute_reset',
    name: '属性重置卷',
    description: '重置所有属性点，重新分配',
    category: 'functional',
    icon: 'RefreshCw',
    price: {
      coinType: 'any',
      amount: 500,
      achievementPoints: 50,
    },
    limit: 3,
    requireLevel: 20,
    effect: {
      type: 'functional',
      permanent: false,
    },
    rarity: 'legendary',
  },
  {
    id: 'func_quest_template_scholar',
    name: '任务模板：学习计划',
    description: '一键创建完整的学习计划任务组',
    category: 'functional',
    icon: 'BookTemplate',
    price: {
      coinType: 'int',
      amount: 100,
    },
    limit: 1,  // 永久功能，只能购买一次
    effect: {
      type: 'functional',
      permanent: true,
    },
    rarity: 'rare',
  },
  {
    id: 'func_quest_template_fitness',
    name: '任务模板：健身计划',
    description: '一键创建完整的健身计划任务组',
    category: 'functional',
    icon: 'Dumbbell',
    price: {
      coinType: 'vit',
      amount: 100,
    },
    limit: 1,  // 永久功能，只能购买一次
    effect: {
      type: 'functional',
      permanent: true,
    },
    rarity: 'rare',
  },
  {
    id: 'func_custom_reminder',
    name: '自定义提醒',
    description: '设置每日任务提醒和目标提醒',
    category: 'functional',
    icon: 'Bell',
    price: {
      coinType: 'any',
      amount: 150,
    },
    limit: 1,  // 永久功能，只能购买一次
    effect: {
      type: 'functional',
      permanent: true,
    },
    rarity: 'rare',
  },
  {
    id: 'func_data_export',
    name: '高级数据导出',
    description: '导出详细的数据分析报告（PDF/Excel）',
    category: 'functional',
    icon: 'Download',
    price: {
      coinType: 'any',
      amount: 200,
      achievementPoints: 30,
    },
    limit: 1,  // 永久功能，只能购买一次
    requireLevel: 15,
    effect: {
      type: 'functional',
      permanent: true,
    },
    rarity: 'epic',
  },

  // ========== 特殊类（Special）- 限时/精选 ==========

  {
    id: 'special_mystery_box',
    name: '神秘宝箱',
    description: '随机获得大量金币、经验或稀有物品',
    category: 'special',
    icon: 'Gift',
    price: {
      coinType: 'any',
      amount: 100,
    },
    effect: {
      type: 'cosmetic',
      permanent: false,
    },
    rarity: 'epic',
    isFeatured: true,
  },
  {
    id: 'special_lucky_charm',
    name: '幸运符',
    description: '24小时内所有奖励 +20%',
    category: 'special',
    icon: 'Clover',
    price: {
      coinType: 'any',
      amount: 120,
      achievementPoints: 20,
    },
    effect: {
      type: 'exp_boost',
      value: 20,
      duration: 1440,
    },
    rarity: 'legendary',
    isFeatured: true,
  },
  {
    id: 'special_weekend_pass',
    name: '周末通行证',
    description: '周末双倍经验和金币',
    category: 'special',
    icon: 'Ticket',
    price: {
      coinType: 'any',
      amount: 200,
    },
    limit: 1,
    effect: {
      type: 'exp_boost',
      value: 100,
      duration: 2880,
    },
    rarity: 'legendary',
    isLimitedTime: true,
  },
];

// 兑换类别名称
export const REWARD_CATEGORY_NAMES = {
  indulgence: '放纵奖励',
  boost: '能力提升',
  decoration: '装饰外观',
  functional: '功能解锁',
  special: '特殊限定',
};

// 兑换类别描述
export const REWARD_CATEGORY_DESC = {
  indulgence: '努力过后的放纵，用对应领域的金币兑换',
  boost: '提升属性和获取效率',
  decoration: '个性化外观和称号',
  functional: '解锁高级功能',
  special: '限时精选和神秘奖励',
};

// 金币类型名称和图标
export const COIN_TYPE_INFO = {
  int: { name: '智慧币', icon: 'Brain', color: '#3b82f6', desc: '学习、科研类任务获得' },
  vit: { name: '活力币', icon: 'Heart', color: '#ef4444', desc: '健康、运动类任务获得' },
  mng: { name: '管理币', icon: 'BarChart', color: '#8b5cf6', desc: '规划、管理类任务获得' },
  cre: { name: '创意币', icon: 'Lightbulb', color: '#f59e0b', desc: '创作、创新类任务获得' },
  universal: { name: '通用币', icon: 'Coins', color: '#10b981', desc: '任何任务都可获得' },
};
