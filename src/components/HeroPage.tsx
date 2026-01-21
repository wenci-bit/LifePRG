/**
 * HeroPage - 每日启动页
 *
 * 每天的开始页面，显示问候、日期和每日名言
 */

'use client';

import { motion } from 'framer-motion';
import { Sunrise, Sun, Moon, ArrowRight, Calendar, Quote, LogOut } from 'lucide-react';
import { useMemo } from 'react';
import { useUserStore } from '@/store/userStore';

interface HeroPageProps {
  onEnter: () => void;
}

// 名人名言库
const QUOTES = [
  {
    text: "成功的秘诀在于坚持自己的目标和信念。",
    author: "狄斯雷利"
  },
  {
    text: "不要等待机会，而要创造机会。",
    author: "乔治·巴纳德·肖"
  },
  {
    text: "世上无难事，只怕有心人。",
    author: "王守仁"
  },
  {
    text: "知识就是力量。",
    author: "培根"
  },
  {
    text: "路漫漫其修远兮，吾将上下而求索。",
    author: "屈原"
  },
  {
    text: "天行健，君子以自强不息。",
    author: "《周易》"
  },
  {
    text: "宝剑锋从磨砺出，梅花香自苦寒来。",
    author: "古语"
  },
  {
    text: "业精于勤，荒于嬉；行成于思，毁于随。",
    author: "韩愈"
  },
  {
    text: "少壮不努力，老大徒伤悲。",
    author: "《长歌行》"
  },
  {
    text: "学而不思则罔，思而不学则殆。",
    author: "孔子"
  },
  {
    text: "博学之，审问之，慎思之，明辨之，笃行之。",
    author: "《礼记》"
  },
  {
    text: "千里之行，始于足下。",
    author: "老子"
  },
  {
    text: "锲而舍之，朽木不折；锲而不舍，金石可镂。",
    author: "荀子"
  },
  {
    text: "纸上得来终觉浅，绝知此事要躬行。",
    author: "陆游"
  },
  {
    text: "书山有路勤为径，学海无涯苦作舟。",
    author: "韩愈"
  },
  {
    text: "今日事，今日毕。",
    author: "富兰克林"
  },
  {
    text: "成功是一个过程，并不是一个结果。",
    author: "陈安之"
  },
  {
    text: "时间是一切财富中最宝贵的财富。",
    author: "德奥弗拉斯多"
  },
  {
    text: "你必须非常努力，才能看起来毫不费力。",
    author: "当代格言"
  },
  {
    text: "每一个不曾起舞的日子，都是对生命的辜负。",
    author: "尼采"
  },
];

export default function HeroPage({ onEnter }: HeroPageProps) {
  // 获取当前用户和登出函数
  const currentUser = useUserStore((state) => state.currentUser);
  const logout = useUserStore((state) => state.logout);

  // 处理退出登录
  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      window.location.reload();
    }
  };

  // 获取当前时间和问候语
  const { greeting, icon: TimeIcon, timeOfDay } = useMemo(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return { greeting: '早上好', icon: Sunrise, timeOfDay: 'morning' };
    } else if (hour >= 12 && hour < 18) {
      return { greeting: '下午好', icon: Sun, timeOfDay: 'afternoon' };
    } else {
      return { greeting: '晚上好', icon: Moon, timeOfDay: 'evening' };
    }
  }, []);

  // 获取今日日期
  const todayDate = useMemo(() => {
    const today = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const weekday = weekdays[today.getDay()];

    return {
      full: `${year}年${month}月${date}日`,
      weekday: weekday,
    };
  }, []);

  // 随机选择一句名言
  const dailyQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % QUOTES.length;
    return QUOTES[index];
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      {/* 退出登录按钮 - 左上角 */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        onClick={handleLogout}
        className="absolute top-8 left-8 z-20 group flex items-center gap-2 px-4 py-2 rounded-lg
          bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
          backdrop-blur-md transition-all duration-300"
        title="退出登录"
      >
        <LogOut className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
        <span className="text-white/70 group-hover:text-white font-medium text-sm transition-colors">
          退出登录
        </span>
      </motion.button>

      {/* 主内容 */}
      <div className="relative z-10 max-w-4xl w-full">
        {/* 时间问候 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-4 mb-6">
            <motion.div
              animate={{
                rotate: timeOfDay === 'morning' ? [0, 10, -10, 0] : 0,
                scale: timeOfDay === 'afternoon' ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <TimeIcon className="w-16 h-16 text-cyber-cyan" />
            </motion.div>
          </div>

          <h1 className="text-7xl md:text-8xl font-black font-orbitron mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-cyan">
              {greeting}
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold font-orbitron text-white mb-6"
          >
            {currentUser?.nickname || currentUser?.username || '旅行者'}
          </motion.p>

          {/* 日期 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 text-white/70 font-inter text-lg"
          >
            <Calendar className="w-5 h-5" />
            <span>{todayDate.full}</span>
            <span className="text-cyber-cyan">·</span>
            <span>{todayDate.weekday}</span>
          </motion.div>
        </motion.div>

        {/* 每日名言 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-8 mb-12 relative overflow-hidden"
        >
          {/* 装饰性引号 */}
          <div className="absolute top-4 left-4 opacity-10">
            <Quote className="w-16 h-16 text-cyber-cyan" />
          </div>

          <div className="relative z-10">
            <p className="text-2xl md:text-3xl font-bold text-white mb-4 leading-relaxed font-inter text-center">
              "{dailyQuote.text}"
            </p>
            <p className="text-right text-cyber-cyan font-inter text-lg">
              —— {dailyQuote.author}
            </p>
          </div>
        </motion.div>

        {/* 开始按钮 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          className="text-center"
        >
          <motion.button
            onClick={onEnter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-16 py-6 text-2xl font-bold font-orbitron rounded-2xl overflow-hidden"
          >
            {/* 按钮背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan to-cyber-purple" />

            {/* 悬停光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple to-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* 按钮内容 */}
            <span className="relative flex items-center gap-4">
              开启今日旅程
              <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
            </span>
          </motion.button>

          {/* 提示文字 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-sm text-white/40 font-inter"
          >
            新的一天，新的挑战，让我们开始吧
          </motion.p>
        </motion.div>

        {/* 底部装饰 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-16 text-center text-white/20 text-xs font-mono"
        >
          工作空间 · 专业效率管理系统
        </motion.div>
      </div>
    </div>
  );
}
