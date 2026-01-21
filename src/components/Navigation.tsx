/**
 * Navigation - 优化的侧边导航栏（内联展开式）
 *
 * 采用垂直内联展开设计，点击后在导航栏内部展开子菜单
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  Trophy,
  ShoppingBag,
  Calendar,
  CalendarDays,
  Settings,
  ChevronDown,
  Gift,
  CalendarCheck,
  Package,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import AvatarDisplay from './AvatarDisplay';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

interface NavItem {
  id: string;
  icon: any;
  label: string;
  subItems?: {
    id: string;
    icon: any;
    label: string;
  }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: '主页',
  },
  {
    id: 'planning',
    icon: CalendarCheck,
    label: '计划',
    subItems: [
      { id: 'habits', icon: CheckCircle2, label: '习惯打卡' },
      { id: 'planner', icon: CalendarDays, label: '计划视图' },
      { id: 'quests', icon: Target, label: '任务视图' },
    ],
  },
  {
    id: 'rewards',
    icon: Gift,
    label: '奖励',
    subItems: [
      { id: 'achievements', icon: Trophy, label: '成就' },
      { id: 'shop', icon: ShoppingBag, label: '商店' },
      { id: 'inventory', icon: Package, label: '背包' },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    label: '设置',
  },
];

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // 获取当前用户信息
  const currentUser = useUserStore((state) => state.currentUser);

  const handleItemClick = (item: NavItem) => {
    if (item.subItems) {
      // 如果有子菜单，切换展开/收起
      setExpandedMenu(expandedMenu === item.id ? null : item.id);
    } else {
      // 直接跳转
      onPageChange(item.id);
      setExpandedMenu(null);
    }
  };

  const handleSubItemClick = (pageId: string) => {
    onPageChange(pageId);
  };

  // 判断当前项是否激活（包括子项）
  const isItemActive = (item: NavItem) => {
    if (item.id === currentPage) return true;
    if (item.subItems) {
      return item.subItems.some((sub) => sub.id === currentPage);
    }
    return false;
  };

  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <div className="glass-card p-3 min-w-[180px] flex flex-col gap-4">
        {/* 用户信息区域 */}
        {currentUser && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPageChange('profile')}
            className={`flex flex-col items-center gap-3 px-4 py-4 rounded-xl transition-all ${
              currentPage === 'profile'
                ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white shadow-lg shadow-cyber-cyan/30'
                : 'bg-white/5 hover:bg-white/10 text-white'
            }`}
          >
            <AvatarDisplay
              avatar={currentUser.avatar}
              frameId={currentUser.avatarFrame}
              size="md"
              showBorder={true}
              className="flex-shrink-0"
            />
            <div className="w-full text-center">
              <p className="text-sm font-bold truncate">
                {currentUser.nickname || currentUser.username}
              </p>
              <p className="text-xs text-white/60 truncate">@{currentUser.username}</p>
            </div>
          </motion.button>
        )}

        {/* 分隔线 */}
        <div className="h-px bg-white/10" />

        {/* 导航菜单 */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const hasSubmenu = !!item.subItems;
            const isExpanded = expandedMenu === item.id;

            return (
              <div key={item.id}>
                {/* 主菜单按钮 */}
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white shadow-lg shadow-cyber-cyan/30'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-inter font-medium text-sm flex-1 text-left">
                    {item.label}
                  </span>
                  {hasSubmenu && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  )}
                </motion.button>

                {/* 子菜单（内联展开） */}
                <AnimatePresence>
                  {hasSubmenu && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8 pr-2 py-2 space-y-1">
                        {item.subItems!.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = currentPage === subItem.id;

                          return (
                            <motion.button
                              key={subItem.id}
                              whileHover={{ x: 4 }}
                              onClick={() => handleSubItemClick(subItem.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                                isSubActive
                                  ? 'bg-white/15 text-white border-l-2 border-cyber-cyan'
                                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                              }`}
                            >
                              <SubIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-inter">{subItem.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
