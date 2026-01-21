/**
 * DailyCheckIn - 每日签到组件
 *
 * 功能：
 * - 签到按钮
 * - 签到日历（本月）
 * - 连续签到进度
 * - 奖励预览
 */

'use client';

import { motion } from 'framer-motion';
import { Calendar, Gift, Flame, Star, Check, Lock } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { calculateCheckInReward, getNextMilestone, getRandomEncouragement } from '@/data/checkIn';
import { useEffect, useState } from 'react';

export default function DailyCheckIn() {
  const {
    checkIn,
    dailyCheckIn,
  } = useGameStore((state) => ({
    checkIn: state.checkIn,
    dailyCheckIn: state.dailyCheckIn,
  }));

  const [currentMonth, setCurrentMonth] = useState('');
  const [monthDays, setMonthDays] = useState<Date[]>([]);

  // 初始化当前月份的日期列表
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // 设置当前月份字符串
    setCurrentMonth(`${year}年${month + 1}月`);

    // 获取当月所有日期
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Date[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      // 使用本地时间，设置为中午12点避免时区问题
      days.push(new Date(year, month, i, 12, 0, 0));
    }

    setMonthDays(days);
  }, []);

  // 格式化日期为 YYYY-MM-DD（本地时间）
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 检查某天是否已签到
  const isCheckedIn = (date: Date): boolean => {
    const dateString = formatLocalDate(date);
    return checkIn.checkInHistory.includes(dateString);
  };

  // 检查是否是今天
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatLocalDate(date) === formatLocalDate(today);
  };

  // 处理签到
  const handleCheckIn = () => {
    dailyCheckIn();
  };

  // 计算下次签到奖励（使用安全的默认值）
  const currentStreak = checkIn.checkInStreak ?? 0;
  const nextReward = calculateCheckInReward(currentStreak + 1);
  const nextMilestone = getNextMilestone(currentStreak);

  // 今天是否已签到 - 通过比较最后签到日期和今天的日期
  const today = new Date();
  const todayString = formatLocalDate(today);
  const hasCheckedInToday = checkIn.lastCheckInDate === todayString;

  return (
    <div className="space-y-6">
      {/* 主签到区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧：签到按钮和状态 */}
          <div className="flex-1 text-center">
            <h2 className="text-3xl font-black font-orbitron text-gray-900 dark:text-white mb-4">
              每日签到
            </h2>

            {/* 连续签到天数 */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-2xl">
                <Flame className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-white/60 font-inter">连续签到</p>
                  <p className="text-4xl font-black font-mono text-orange-400">
                    {currentStreak} 天
                  </p>
                </div>
              </div>
            </div>

            {/* 签到按钮 */}
            <motion.button
              onClick={handleCheckIn}
              disabled={hasCheckedInToday}
              whileHover={!hasCheckedInToday ? { scale: 1.05 } : {}}
              whileTap={!hasCheckedInToday ? { scale: 0.95 } : {}}
              className={`
                w-full max-w-sm mx-auto py-6 px-8 rounded-2xl font-bold font-inter text-lg
                transition-all duration-300 shadow-xl
                ${hasCheckedInToday
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-2xl'
                }
              `}
            >
              {hasCheckedInToday ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-6 h-6" />
                  今日已签到
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Calendar className="w-6 h-6" />
                  立即签到
                </span>
              )}
            </motion.button>

            {/* 鼓励语 */}
            {!hasCheckedInToday && (
              <p className="text-gray-600 dark:text-white/60 text-sm mt-4 font-inter">
                {getRandomEncouragement()}
              </p>
            )}

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-white/60 font-inter mb-1">本月签到</p>
                <p className="text-2xl font-bold font-mono text-cyber-cyan">
                  {checkIn.currentMonthCheckIns ?? 0}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-white/60 font-inter mb-1">累计签到</p>
                <p className="text-2xl font-bold font-mono text-cyber-purple">
                  {checkIn.totalCheckIns ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* 右侧：奖励预览 */}
          <div className="flex-1">
            <h3 className="text-xl font-bold font-orbitron text-gray-900 dark:text-white mb-4">
              明日签到奖励
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
                <span className="text-gray-700 dark:text-white/80 font-inter">经验值</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  +{nextReward.exp}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
                <span className="text-gray-700 dark:text-white/80 font-inter">金币</span>
                <span className="text-lg font-bold text-yellow-400 font-mono">
                  +{nextReward.coins}
                </span>
              </div>

              {nextReward.categorizedCoins && (
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-purple-300 font-inter mb-2">分类金币</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {nextReward.categorizedCoins.int && (
                      <div className="text-blue-300">智慧币 +{nextReward.categorizedCoins.int}</div>
                    )}
                    {nextReward.categorizedCoins.vit && (
                      <div className="text-green-300">活力币 +{nextReward.categorizedCoins.vit}</div>
                    )}
                    {nextReward.categorizedCoins.mng && (
                      <div className="text-purple-300">管理币 +{nextReward.categorizedCoins.mng}</div>
                    )}
                    {nextReward.categorizedCoins.cre && (
                      <div className="text-orange-300">创意币 +{nextReward.categorizedCoins.cre}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 里程碑提示 */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-amber-300 font-inter">
                  下一个里程碑
                </span>
              </div>
              <p className="text-gray-700 dark:text-white/80 font-inter">
                连续签到 <span className="text-2xl font-bold text-amber-400 font-mono">{nextMilestone}</span> 天
              </p>
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                  style={{ width: `${(currentStreak / nextMilestone) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-white/60 mt-2 font-inter">
                还需 {nextMilestone - currentStreak} 天
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 签到日历 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8"
      >
        <h3 className="text-2xl font-bold font-orbitron text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-cyber-cyan" />
          {currentMonth} 签到日历
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {/* 星期标题 */}
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div key={day} className="text-center p-2 text-gray-400 dark:text-white/40 font-inter text-sm">
              {day}
            </div>
          ))}

          {/* 空白占位（月初前的空格） */}
          {monthDays.length > 0 &&
            Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

          {/* 日期 */}
          {monthDays.map((date) => {
            const checked = isCheckedIn(date);
            const today = isToday(date);
            const isFuture = date > new Date();

            return (
              <motion.div
                key={date.toISOString()}
                whileHover={!isFuture ? { scale: 1.1 } : {}}
                className={`
                  relative p-2 aspect-square rounded-lg flex items-center justify-center text-sm font-mono
                  transition-all duration-200
                  ${checked
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold shadow-lg'
                    : isFuture
                    ? 'bg-white/5 text-gray-400 dark:text-white/30'
                    : 'bg-white/5 text-gray-700 dark:text-white/60 hover:bg-white/10'
                  }
                  ${today ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black' : ''}
                `}
              >
                {checked && (
                  <Check className="absolute top-1 right-1 w-3 h-3 text-white" />
                )}
                {isFuture && (
                  <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-400 dark:text-white/30" />
                )}
                {date.getDate()}
              </motion.div>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm font-inter">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-600" />
            <span className="text-gray-600 dark:text-white/60">已签到</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-2 ring-cyan-400" />
            <span className="text-gray-600 dark:text-white/60">今天</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/5" />
            <span className="text-gray-600 dark:text-white/60">未签到</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
