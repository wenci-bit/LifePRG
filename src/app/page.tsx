/**
 * Home Page - 主页面（完整版 - 性能优化）
 *
 * 包含欢迎页、多页面导航和主题切换、用户认证
 * 性能优化：使用动态导入减少首次加载时间
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import ParticleBackground from '@/components/ParticleBackground';
import Navigation from '@/components/Navigation';
import HeroPage from '@/components/HeroPage';
import ThemeToggle from '@/components/ThemeToggle';
import LevelUpNotification from '@/components/LevelUpNotification';
import AchievementNotification from '@/components/AchievementNotification';
import CheckInNotification from '@/components/CheckInNotification';
import LowAttributeWarning from '@/components/LowAttributeWarning';
import LoginPage from '@/components/LoginPage';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';

// 懒加载各个页面组件 - 减少首次加载时间
const DashboardPage = dynamic(() => import('@/components/DashboardPage'), {
  loading: () => <PageSkeleton />,
  ssr: false
});

const QuestLog = dynamic(() => import('@/components/QuestLog'), {
  loading: () => <PageSkeleton />
});

const AchievementsPage = dynamic(() => import('@/components/AchievementsPage'), {
  loading: () => <PageSkeleton />
});

const ShopPage = dynamic(() => import('@/components/ShopPage').then(mod => ({ default: mod.ShopPage })), {
  loading: () => <PageSkeleton />
});

const SettingsPage = dynamic(() => import('@/components/SettingsPage'), {
  loading: () => <PageSkeleton />
});

const PlannerView = dynamic(() => import('@/components/PlannerView'), {
  loading: () => <PageSkeleton />
});

const InventoryPage = dynamic(() => import('@/components/InventoryPage'), {
  loading: () => <PageSkeleton />
});

const AttributesDetailPage = dynamic(() => import('@/components/AttributesDetailPage'), {
  loading: () => <PageSkeleton />
});

const CoinsDetailPage = dynamic(() => import('@/components/CoinsDetailPage'), {
  loading: () => <PageSkeleton />
});

const ExpDetailPage = dynamic(() => import('@/components/ExpDetailPage'), {
  loading: () => <PageSkeleton />
});

const UserProfilePage = dynamic(() => import('@/components/UserProfilePage'), {
  loading: () => <PageSkeleton />
});

const HabitsCheckInPage = dynamic(() => import('@/components/HabitsCheckInPage'), {
  loading: () => <PageSkeleton />
});

const AttributeBalancePage = dynamic(() => import('@/components/AttributeBalancePage'), {
  loading: () => <PageSkeleton />
});

/**
 * 加载骨架屏组件
 */
function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-white/10 rounded-lg w-1/4"></div>
      <div className="h-64 bg-white/10 rounded-lg"></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-32 bg-white/10 rounded-lg"></div>
        <div className="h-32 bg-white/10 rounded-lg"></div>
        <div className="h-32 bg-white/10 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showHero, setShowHero] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLowAttributeWarning, setShowLowAttributeWarning] = useState(false);

  // 用户状态
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  // 从 store 获取通知状态
  const levelUpNotification = useGameStore((state) => state.notifications.levelUp);
  const achievementNotification = useGameStore((state) => state.notifications.achievement);
  const checkInNotification = useGameStore((state) => state.notifications.checkIn);
  const dismissLevelUpNotification = useGameStore((state) => state.dismissLevelUpNotification);
  const dismissAchievementNotification = useGameStore((state) => state.dismissAchievementNotification);
  const dismissCheckInNotification = useGameStore((state) => state.dismissCheckInNotification);
  const checkDailyLogin = useGameStore((state) => state.checkDailyLogin);
  const getLowAttributeWarnings = useGameStore((state) => state.getLowAttributeWarnings);

  // 检查每日登录（仅在用户已登录时）
  useEffect(() => {
    if (isLoggedIn) {
      checkDailyLogin();
    }
  }, [checkDailyLogin, isLoggedIn]);

  // 检查低属性警告（进入主应用后延迟3秒显示）
  useEffect(() => {
    if (isLoggedIn && !showHero) {
      const timer = setTimeout(() => {
        const warnings = getLowAttributeWarnings();
        // 只显示 critical 和 warning 级别的警告
        const importantWarnings = warnings.filter(
          (w) => w.level === 'critical' || w.level === 'warning'
        );
        if (importantWarnings.length > 0) {
          setShowLowAttributeWarning(true);
        }
      }, 3000); // 延迟3秒，避免与其他通知冲突

      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, showHero, getLowAttributeWarnings]);

  // 从欢迎页进入主应用
  const handleEnter = () => {
    setShowHero(false);
  };

  // 页面切换
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  // 登录成功后的处理
  const handleLoginSuccess = () => {
    // 刷新页面以加载用户数据
    window.location.reload();
  };

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen relative">
        <ParticleBackground />
        <LoginPage onSuccess={handleLoginSuccess} />
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      {/* 粒子背景层 */}
      <ParticleBackground />

      {/* 主题切换按钮 */}
      <ThemeToggle />

      {/* 升级通知 */}
      {levelUpNotification && (
        <LevelUpNotification
          show={true}
          level={levelUpNotification.level}
          rewards={levelUpNotification.rewards}
          onClose={dismissLevelUpNotification}
        />
      )}

      {/* 成就通知 */}
      {achievementNotification && (
        <AchievementNotification
          achievement={achievementNotification}
          onClose={dismissAchievementNotification}
        />
      )}

      {/* 签到通知 */}
      {checkInNotification && (
        <CheckInNotification
          show={true}
          day={checkInNotification.day}
          rewards={checkInNotification.rewards}
          onClose={dismissCheckInNotification}
        />
      )}

      {/* 低属性警告 */}
      {showLowAttributeWarning && (
        <LowAttributeWarning
          warnings={getLowAttributeWarnings().filter(
            (w) => w.level === 'critical' || w.level === 'warning'
          )}
          onClose={() => setShowLowAttributeWarning(false)}
          onNavigateToQuests={() => setCurrentPage('quests')}
        />
      )}

      <AnimatePresence mode="wait">
        {showHero ? (
          /* 欢迎页 */
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <HeroPage onEnter={handleEnter} />
          </motion.div>
        ) : (
          /* 主应用 */
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 导航栏 */}
            <Navigation currentPage={currentPage} onPageChange={handlePageChange} />

            {/* 主内容区 */}
            <div className="relative z-10 container mx-auto px-6 py-12 pl-24">
              {/* 标题 */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <h1 className="text-5xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-cyan animate-glow-pulse mb-2">
                  LIFE RPG
                </h1>
                <p className="text-white/60 font-inter tracking-widest text-sm">
                  {currentPage === 'dashboard' && '主页'}
                  {currentPage === 'quests' && '任务日志'}
                  {currentPage === 'planner' && '计划视图'}
                  {currentPage === 'habits' && '习惯打卡'}
                  {currentPage === 'achievements' && '成就系统'}
                  {currentPage === 'shop' && '奖励商店'}
                  {currentPage === 'inventory' && '我的背包'}
                  {currentPage === 'attributes' && '属性详情'}
                  {currentPage === 'balance' && '属性平衡'}
                  {currentPage === 'coins' && '金币详情'}
                  {currentPage === 'exp' && '经验详情'}
                  {currentPage === 'profile' && '用户资料'}
                  {currentPage === 'settings' && '设置'}
                </p>
              </motion.div>

              {/* 页面内容 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-[1600px]"
                >
                  {currentPage === 'dashboard' && <DashboardPage onNavigate={handlePageChange} />}
                  {currentPage === 'quests' && (
                    <div className="max-w-[1200px]">
                      <QuestLog />
                    </div>
                  )}
                  {currentPage === 'planner' && <PlannerView />}
                  {currentPage === 'habits' && <HabitsCheckInPage />}
                  {currentPage === 'achievements' && <AchievementsPage />}
                  {currentPage === 'shop' && <ShopPage />}
                  {currentPage === 'inventory' && <InventoryPage />}
                  {currentPage === 'attributes' && <AttributesDetailPage onNavigate={handlePageChange} />}
                  {currentPage === 'balance' && <AttributeBalancePage onNavigate={handlePageChange} />}
                  {currentPage === 'coins' && <CoinsDetailPage onNavigate={handlePageChange} />}
                  {currentPage === 'exp' && <ExpDetailPage onNavigate={handlePageChange} />}
                  {currentPage === 'profile' && <UserProfilePage />}
                  {currentPage === 'settings' && <SettingsPage />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
