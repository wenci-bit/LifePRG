/**
 * 图标映射工具
 * 统一管理商店和背包的图标显示
 */

import {
  Brain,
  Heart,
  BarChart,
  Lightbulb,
  Coins,
  UtensilsCrossed,
  Gamepad2,
  Bed,
  Palette,
  Film,
  Zap,
  Frame,
  Award,
  Sparkles,
  RefreshCw,
  BookTemplate,
  Dumbbell,
  Bell,
  Download,
  Gift,
  Clover,
  Ticket,
  Star,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ElementType> = {
  Brain,
  Heart,
  BarChart,
  Lightbulb,
  Coins,
  UtensilsCrossed,
  Gamepad2,
  Bed,
  Palette,
  Film,
  Zap,
  Frame,
  Award,
  Sparkles,
  RefreshCw,
  BookTemplate,
  Dumbbell,
  Bell,
  Download,
  Gift,
  Clover,
  Ticket,
  Star,
};

/**
 * 根据图标名称获取图标组件
 * @param iconName 图标名称
 * @param defaultIcon 默认图标（如果找不到）
 * @returns 图标组件
 */
export function getIconComponent(iconName: string, defaultIcon = Gift): React.ElementType {
  return ICON_MAP[iconName] || defaultIcon;
}
