/**
 * 任务图标库
 *
 * 提供丰富的任务图标选择
 */

export interface QuestIconOption {
  emoji: string;
  label: string;
  category: 'work' | 'study' | 'health' | 'life' | 'social' | 'creative';
}

export const QUEST_ICONS: QuestIconOption[] = [
  // 工作类
  { emoji: '💼', label: '公文包', category: 'work' },
  { emoji: '📊', label: '图表', category: 'work' },
  { emoji: '📈', label: '增长趋势', category: 'work' },
  { emoji: '💻', label: '电脑', category: 'work' },
  { emoji: '📝', label: '记笔记', category: 'work' },
  { emoji: '📋', label: '剪贴板', category: 'work' },
  { emoji: '📁', label: '文件夹', category: 'work' },
  { emoji: '✅', label: '完成', category: 'work' },
  { emoji: '🎯', label: '目标', category: 'work' },
  { emoji: '🔨', label: '工具', category: 'work' },
  { emoji: '⚙️', label: '设置', category: 'work' },
  { emoji: '📧', label: '邮件', category: 'work' },
  { emoji: '📞', label: '电话', category: 'work' },
  { emoji: '🖊️', label: '钢笔', category: 'work' },
  { emoji: '📅', label: '日历', category: 'work' },

  // 学习类
  { emoji: '📚', label: '书籍', category: 'study' },
  { emoji: '📖', label: '打开的书', category: 'study' },
  { emoji: '✏️', label: '铅笔', category: 'study' },
  { emoji: '📐', label: '三角尺', category: 'study' },
  { emoji: '🔬', label: '显微镜', category: 'study' },
  { emoji: '🧪', label: '试管', category: 'study' },
  { emoji: '🎓', label: '学士帽', category: 'study' },
  { emoji: '🧠', label: '大脑', category: 'study' },
  { emoji: '💡', label: '灯泡', category: 'study' },
  { emoji: '🔍', label: '放大镜', category: 'study' },
  { emoji: '📜', label: '卷轴', category: 'study' },
  { emoji: '🗂️', label: '文件盒', category: 'study' },
  { emoji: '📌', label: '图钉', category: 'study' },
  { emoji: '🎒', label: '书包', category: 'study' },
  { emoji: '📓', label: '笔记本', category: 'study' },

  // 健康类
  { emoji: '💪', label: '肌肉', category: 'health' },
  { emoji: '🏃', label: '跑步', category: 'health' },
  { emoji: '🧘', label: '冥想', category: 'health' },
  { emoji: '🏋️', label: '举重', category: 'health' },
  { emoji: '🚴', label: '骑车', category: 'health' },
  { emoji: '🏊', label: '游泳', category: 'health' },
  { emoji: '⚽', label: '足球', category: 'health' },
  { emoji: '🏀', label: '篮球', category: 'health' },
  { emoji: '🎾', label: '网球', category: 'health' },
  { emoji: '🧗', label: '攀岩', category: 'health' },
  { emoji: '🥗', label: '沙拉', category: 'health' },
  { emoji: '💊', label: '药丸', category: 'health' },
  { emoji: '🩺', label: '听诊器', category: 'health' },
  { emoji: '😴', label: '睡觉', category: 'health' },
  { emoji: '🛌', label: '床', category: 'health' },

  // 生活类
  { emoji: '🏠', label: '房子', category: 'life' },
  { emoji: '🧹', label: '扫帚', category: 'life' },
  { emoji: '🧺', label: '篮子', category: 'life' },
  { emoji: '🛒', label: '购物车', category: 'life' },
  { emoji: '🍳', label: '煎锅', category: 'life' },
  { emoji: '🍕', label: '披萨', category: 'life' },
  { emoji: '☕', label: '咖啡', category: 'life' },
  { emoji: '🎮', label: '游戏手柄', category: 'life' },
  { emoji: '🎬', label: '电影', category: 'life' },
  { emoji: '🎵', label: '音乐', category: 'life' },
  { emoji: '🎸', label: '吉他', category: 'life' },
  { emoji: '📺', label: '电视', category: 'life' },
  { emoji: '🛋️', label: '沙发', category: 'life' },
  { emoji: '🚗', label: '汽车', category: 'life' },
  { emoji: '✈️', label: '飞机', category: 'life' },

  // 社交类
  { emoji: '👥', label: '人群', category: 'social' },
  { emoji: '💬', label: '对话', category: 'social' },
  { emoji: '📱', label: '手机', category: 'social' },
  { emoji: '🎉', label: '庆祝', category: 'social' },
  { emoji: '🎁', label: '礼物', category: 'social' },
  { emoji: '🎂', label: '蛋糕', category: 'social' },
  { emoji: '🎈', label: '气球', category: 'social' },
  { emoji: '💐', label: '花束', category: 'social' },
  { emoji: '🌹', label: '玫瑰', category: 'social' },
  { emoji: '❤️', label: '爱心', category: 'social' },
  { emoji: '👋', label: '挥手', category: 'social' },
  { emoji: '🤝', label: '握手', category: 'social' },
  { emoji: '👨‍👩‍👧‍👦', label: '家庭', category: 'social' },
  { emoji: '☎️', label: '电话', category: 'social' },
  { emoji: '✉️', label: '信封', category: 'social' },

  // 创意类
  { emoji: '🎨', label: '调色板', category: 'creative' },
  { emoji: '🖌️', label: '画笔', category: 'creative' },
  { emoji: '✨', label: '闪光', category: 'creative' },
  { emoji: '🌟', label: '星星', category: 'creative' },
  { emoji: '💫', label: '流星', category: 'creative' },
  { emoji: '🎭', label: '戏剧', category: 'creative' },
  { emoji: '📷', label: '相机', category: 'creative' },
  { emoji: '📹', label: '摄像机', category: 'creative' },
  { emoji: '🎥', label: '电影摄影机', category: 'creative' },
  { emoji: '🎤', label: '麦克风', category: 'creative' },
  { emoji: '🎧', label: '耳机', category: 'creative' },
  { emoji: '🎼', label: '乐谱', category: 'creative' },
  { emoji: '🎹', label: '钢琴', category: 'creative' },
  { emoji: '🎺', label: '小号', category: 'creative' },
  { emoji: '🎻', label: '小提琴', category: 'creative' },
];

export const QUEST_ICON_CATEGORIES = [
  { id: 'work', label: '工作', color: 'from-blue-500 to-cyan-500' },
  { id: 'study', label: '学习', color: 'from-purple-500 to-pink-500' },
  { id: 'health', label: '健康', color: 'from-green-500 to-emerald-500' },
  { id: 'life', label: '生活', color: 'from-orange-500 to-yellow-500' },
  { id: 'social', label: '社交', color: 'from-pink-500 to-red-500' },
  { id: 'creative', label: '创意', color: 'from-indigo-500 to-purple-500' },
] as const;

// 默认图标
export const DEFAULT_QUEST_ICON = '🎯';
