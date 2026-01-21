/**
 * PomodoroTimer - 全屏专注番茄钟
 *
 * 高级、精致、效率的番茄工作法计时器
 * 开始计时后进入全屏沉浸模式
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  X,
  Settings,
  Coffee,
  Zap,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Minimize2,
  XCircle,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useThemeStore } from '@/store/themeStore';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface Props {
  onClose: () => void;
  onMinimize?: () => void;
  timerIndex?: number; // 计时器索引，用于多个浮窗时的定位
  initialTitle?: string; // 初始标题
}

export default function PomodoroTimer({ onClose, onMinimize, timerIndex = 0, initialTitle = '专注任务' }: Props) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [wasFullscreen, setWasFullscreen] = useState(false); // 记录最小化前是否是全屏
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [title, setTitle] = useState(initialTitle); // 番茄钟标题
  const [isEditingTitle, setIsEditingTitle] = useState(false); // 是否正在编辑标题

  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const initialDurationRef = useRef<number>(0);

  const updateFocusTime = useGameStore((state) => state.updateFocusTime);
  const startFocusSession = useGameStore((state) => state.startFocusSession);
  const endFocusSession = useGameStore((state) => state.endFocusSession);
  const currentFocusSession = useGameStore((state) => state.currentFocusSession);
  const stats = useGameStore((state) => state.stats);
  const theme = useThemeStore((state) => state.theme);

  // 计时器逻辑
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          if (mode === 'work') {
            updateFocusTime(stats.totalFocusTime + 1 / 60);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining, mode]);

  // 定时器完成
  const handleTimerComplete = () => {
    setIsRunning(false);

    // 结束当前会话（完成）
    endFocusSession(true, false);

    // 发送浏览器通知
    if ('Notification' in window && Notification.permission === 'granted') {
      const message = mode === 'work'
        ? '🎉 工作时段完成！休息一下吧！'
        : '✨ 休息结束！继续专注工作！';
      new Notification('番茄钟提醒', { body: message });
    }

    // 切换模式
    if (mode === 'work') {
      setCompletedSessions((prev) => prev + 1);
      const nextSession = completedSessions + 1;

      if (nextSession % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
        setTimeRemaining(settings.longBreakDuration * 60);
      } else {
        setMode('shortBreak');
        setTimeRemaining(settings.shortBreakDuration * 60);
      }
    } else {
      setMode('work');
      setTimeRemaining(settings.workDuration * 60);
    }
  };

  // 开始/暂停
  const toggleTimer = () => {
    if (!isRunning) {
      // 开始计时时请求通知权限
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      // 开始新的专注会话
      const duration = mode === 'work'
        ? settings.workDuration * 60
        : mode === 'shortBreak'
        ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60;
      startFocusSession(mode, duration);
      // 自动进入全屏
      setIsFullscreen(true);
    }
    setIsRunning(!isRunning);
  };

  // 处理关闭
  const handleClose = () => {
    if (isRunning) {
      // 如果正在计时，结束会话（中断）
      endFocusSession(false, true);
    }
    onClose();
  };

  // 处理最小化
  const handleMinimize = () => {
    setWasFullscreen(isFullscreen); // 记录当前是否全屏
    setIsMinimized(true);
    setIsFullscreen(false);
  };

  // 处理展开
  const handleExpand = () => {
    setIsMinimized(false);
    setIsFullscreen(wasFullscreen); // 恢复之前的全屏状态
  };

  // 处理放弃
  const handleAbandon = () => {
    if (confirm('确定要放弃当前专注吗？')) {
      // 如果有活动的专注会话，结束它（标记为中断）
      if (currentFocusSession) {
        endFocusSession(false, true);
      }
      // 重置计时器
      setIsRunning(false);
      setTimeRemaining(
        mode === 'work'
          ? settings.workDuration * 60
          : mode === 'shortBreak'
          ? settings.shortBreakDuration * 60
          : settings.longBreakDuration * 60
      );
      // 关闭番茄钟窗口
      onClose();
    }
  };

  // 切换模式
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);

    if (newMode === 'work') {
      setTimeRemaining(settings.workDuration * 60);
    } else if (newMode === 'shortBreak') {
      setTimeRemaining(settings.shortBreakDuration * 60);
    } else {
      setTimeRemaining(settings.longBreakDuration * 60);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 计算进度百分比
  const getProgress = () => {
    const totalTime = mode === 'work'
      ? settings.workDuration * 60
      : mode === 'shortBreak'
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60;

    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  // 获取模式配置
  const getModeConfig = () => {
    const isBreak = mode !== 'work';

    if (mode === 'work') {
      return {
        label: '专注工作',
        subtitle: '保持专注，全力以赴',
        icon: Zap,
        gradient: theme === 'dark'
          ? 'from-indigo-600 via-purple-600 to-pink-600'
          : 'from-indigo-500 via-purple-500 to-pink-500',
        accentColor: 'text-purple-400',
        glowColor: 'shadow-purple-500/50',
        progressColor: 'from-purple-400 to-pink-400',
        bgPattern: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
      };
    } else if (mode === 'shortBreak') {
      return {
        label: '短暂休息',
        subtitle: '放松身心，补充能量',
        icon: Coffee,
        gradient: theme === 'dark'
          ? 'from-emerald-600 via-teal-600 to-cyan-600'
          : 'from-emerald-500 via-teal-500 to-cyan-500',
        accentColor: 'text-emerald-400',
        glowColor: 'shadow-emerald-500/50',
        progressColor: 'from-emerald-400 to-cyan-400',
        bgPattern: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
      };
    } else {
      return {
        label: '长时间休息',
        subtitle: '充分放松，恢复精力',
        icon: Coffee,
        gradient: theme === 'dark'
          ? 'from-blue-600 via-indigo-600 to-violet-600'
          : 'from-blue-500 via-indigo-500 to-violet-500',
        accentColor: 'text-blue-400',
        glowColor: 'shadow-blue-500/50',
        progressColor: 'from-blue-400 to-violet-400',
        bgPattern: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 50%)',
      };
    }
  };

  const config = getModeConfig();
  const ModeIcon = config.icon;

  // 格式化时间（使用useMemo避免闪动）
  const displayTime = useMemo(() => formatTime(timeRemaining), [timeRemaining]);
  const displayProgress = useMemo(() => getProgress(), [timeRemaining, mode, settings]);

  // 最小化浮窗
  const MinimizedTimer = () => {
    // 计算浮窗位置（底部堆叠）
    const bottomOffset = 6 + (timerIndex * 320); // 每个浮窗高度约300px + 20px间距

    return (
    <div
      className={`fixed right-6 z-[10000] w-72 rounded-2xl shadow-2xl border-2 overflow-hidden transition-all ${
        theme === 'dark' ? 'bg-gray-900 border-white/20' : 'bg-white border-gray-200'
      }`}
      style={{
        bottom: `${bottomOffset}px`,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* 顶部渐变装饰 */}
      <div
        className={`h-2 bg-gradient-to-r ${config.gradient}`}
      />

      <div className="p-4">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient} flex-shrink-0`}>
              <ModeIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingTitle(false);
                  }}
                  autoFocus
                  className={`w-full px-2 py-1 text-sm font-bold rounded ${
                    theme === 'dark'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-black/5 text-gray-900 border border-gray-300'
                  } focus:outline-none focus:border-cyber-cyan`}
                />
              ) : (
                <p
                  onClick={() => setIsEditingTitle(true)}
                  className={`text-sm font-bold cursor-pointer truncate ${
                    theme === 'dark' ? 'text-white hover:text-cyan-300' : 'text-gray-900 hover:text-cyan-600'
                  } transition-colors`}
                  title="点击编辑标题"
                >
                  {title}
                </p>
              )}
              <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                {config.label} · {isRunning ? '进行中' : '已暂停'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleExpand}
              className={`p-2 rounded-lg transition-all ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
              title="展开"
            >
              <Maximize2 className={`w-4 h-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-all ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
              title="关闭"
            >
              <X className={`w-4 h-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        {/* 时间显示 */}
        <div className="text-center mb-3">
          <p className={`text-4xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {displayTime}
          </p>
        </div>

        {/* 进度条 */}
        <div className={`h-2 rounded-full overflow-hidden mb-3 ${
          theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
        }`}>
          <div
            className={`h-full bg-gradient-to-r ${config.progressColor} transition-all duration-1000 ease-linear`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTimer();
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isRunning
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                : `bg-gradient-to-r ${config.gradient} text-white`
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                暂停
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                继续
              </>
            )}
          </button>

          {(isRunning || timeRemaining < (mode === 'work' ? settings.workDuration * 60 : mode === 'shortBreak' ? settings.shortBreakDuration * 60 : settings.longBreakDuration * 60)) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAbandon();
              }}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                theme === 'dark'
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-600'
              }`}
              title="放弃"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
    );
  };

  // 小窗口模式
  const CompactView = () => (
    <div className={`glass-card p-10 max-w-3xl w-full mx-auto ${theme === 'dark' ? 'bg-black/60' : 'bg-white/60'} backdrop-blur-xl`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 flex-1">
          <Zap className="w-6 h-6 text-cyber-cyan flex-shrink-0" />
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              autoFocus
              className={`text-2xl font-bold font-orbitron px-3 py-1 rounded-lg ${
                theme === 'dark'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white text-gray-900 border border-gray-300'
              } focus:outline-none focus:border-cyber-cyan`}
            />
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              className={`text-2xl font-bold font-orbitron cursor-pointer ${
                theme === 'dark' ? 'text-white hover:text-cyan-300' : 'text-gray-900 hover:text-cyan-600'
              } transition-colors`}
              title="点击编辑标题"
            >
              {title}
            </h2>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-lg transition-all ${
              theme === 'dark'
                ? 'hover:bg-white/10'
                : 'hover:bg-black/10'
            }`}
            title="设置"
          >
            <Settings className={`w-6 h-6 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`} />
          </button>
          {isRunning && (
            <button
              onClick={handleMinimize}
              className={`p-3 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'hover:bg-white/10'
                  : 'hover:bg-black/10'
              }`}
              title="最小化"
            >
              <Minimize2 className={`w-6 h-6 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`} />
            </button>
          )}
          <button
            onClick={handleClose}
            className={`p-3 rounded-lg transition-all ${
              theme === 'dark'
                ? 'hover:bg-white/10'
                : 'hover:bg-black/10'
            }`}
            title="关闭"
          >
            <X className={`w-6 h-6 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-8 p-6 rounded-lg border overflow-hidden ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10'
                : 'bg-black/5 border-black/10'
            }`}
          >
            <h3 className={`text-base font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              时长设置
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                  工作时长（分钟）
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.workDuration}
                  onChange={(e) => setSettings({ ...settings, workDuration: parseInt(e.target.value) || 25 })}
                  className={`w-full px-4 py-3 rounded-lg border font-mono text-base focus:outline-none focus:border-cyber-cyan ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                  短休息（分钟）
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.shortBreakDuration}
                  onChange={(e) => setSettings({ ...settings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                  className={`w-full px-4 py-3 rounded-lg border font-mono text-base focus:outline-none focus:border-cyber-cyan ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                  长休息（分钟）
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })}
                  className={`w-full px-4 py-3 rounded-lg border font-mono text-base focus:outline-none focus:border-cyber-cyan ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 模式切换 */}
      <div className="flex gap-3 mb-8">
        {(['work', 'shortBreak', 'longBreak'] as const).map((m) => {
          const labels = { work: '工作', shortBreak: '短休息', longBreak: '长休息' };
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-base transition-all ${
                isActive
                  ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg ${config.glowColor}`
                  : theme === 'dark'
                  ? 'bg-white/5 text-white/60 hover:bg-white/10'
                  : 'bg-black/5 text-gray-600 hover:bg-black/10'
              }`}
            >
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* 时间显示 */}
      <div className="text-center mb-8">
        <p className={`text-9xl font-black font-mono mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {displayTime}
        </p>
        <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
          {config.label}
        </p>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTimer();
          }}
          className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-xl text-lg font-bold transition-all shadow-lg ${
            isRunning
              ? `bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-orange-500/50`
              : `bg-gradient-to-r ${config.gradient} text-white ${config.glowColor}`
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-6 h-6" />
              暂停
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              开始专注
            </>
          )}
        </button>

        {(isRunning || timeRemaining < (mode === 'work' ? settings.workDuration * 60 : mode === 'shortBreak' ? settings.shortBreakDuration * 60 : settings.longBreakDuration * 60)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAbandon();
            }}
            className={`px-6 py-5 rounded-xl font-bold text-lg transition-all shadow-lg ${
              theme === 'dark'
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-2 border-red-500/30'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-600 border-2 border-red-500/30'
            }`}
            title="放弃"
          >
            <XCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>
          <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
            今日完成
          </p>
          <p className={`text-3xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {completedSessions}
          </p>
        </div>
        <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>
          <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
            累计专注
          </p>
          <p className={`text-3xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {Math.floor(stats.totalFocusTime)}m
          </p>
        </div>
      </div>
    </div>
  );

  // 全屏模式
  const FullscreenView = () => {
    // 缓存进度显示文字，避免每秒重新计算
    const progressMinutes = useMemo(() =>
      Math.floor((displayProgress / 100) * (mode === 'work' ? settings.workDuration : mode === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration))
    , [displayProgress, mode, settings]);

    const totalMinutes = useMemo(() =>
      mode === 'work' ? settings.workDuration : mode === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration
    , [mode, settings]);

    return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: theme === 'dark'
          ? `linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%), ${config.bgPattern}`
          : `linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%), ${config.bgPattern}`,
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className={`absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl bg-gradient-to-r ${config.gradient} opacity-20`} />
        <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl bg-gradient-to-r ${config.gradient} opacity-20`} />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 w-full max-w-4xl px-8 text-center">
        {/* 顶部控制栏 */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            {isRunning ? (
              <button
                onClick={handleMinimize}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white/80'
                    : 'bg-black/10 hover:bg-black/20 text-gray-700'
                }`}
              >
                <Minimize2 className="w-4 h-4" />
                <span className="text-sm">最小化</span>
              </button>
            ) : (
              <button
                onClick={() => setIsFullscreen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white/80'
                    : 'bg-black/10 hover:bg-black/20 text-gray-700'
                }`}
              >
                <Minimize2 className="w-4 h-4" />
                <span className="text-sm">退出全屏</span>
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className={`p-3 rounded-lg transition-all ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 text-white/80'
                : 'bg-black/10 hover:bg-black/20 text-gray-700'
            }`}
            title="关闭"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 模式图标和标题 */}
        <div className="mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 bg-gradient-to-r ${config.gradient} shadow-2xl ${config.glowColor}`}>
            <ModeIcon className="w-10 h-10 text-white" />
          </div>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              autoFocus
              className={`text-3xl font-bold font-orbitron mb-2 px-4 py-2 rounded-lg text-center ${
                theme === 'dark'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white text-gray-900 border border-gray-300'
              } focus:outline-none focus:border-cyber-cyan`}
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className={`text-3xl font-bold font-orbitron mb-2 cursor-pointer ${
                theme === 'dark' ? 'text-white hover:text-cyan-300' : 'text-gray-900 hover:text-cyan-600'
              } transition-colors`}
              title="点击编辑标题"
            >
              {title}
            </h1>
          )}
          <p className={`text-lg ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
            {config.label} · {config.subtitle}
          </p>
        </div>

        {/* 超大时钟 */}
        <div className="mb-12">
          <div className={`inline-block px-16 py-12 rounded-3xl ${
            theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
          } backdrop-blur-xl border ${
            theme === 'dark' ? 'border-white/10' : 'border-black/10'
          }`}>
            <p className={`text-9xl font-black font-mono tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {displayTime}
            </p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className={`h-3 rounded-full overflow-hidden ${
            theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
          }`}>
            <div
              className={`h-full bg-gradient-to-r ${config.progressColor} shadow-lg ${config.glowColor} transition-all duration-1000 ease-linear`}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            <span className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
              {progressMinutes} 分钟
            </span>
            <span className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
              {totalMinutes} 分钟
            </span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="mb-16 flex items-center justify-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTimer();
            }}
            className={`inline-flex items-center gap-4 px-12 py-6 rounded-2xl font-bold text-xl transition-all shadow-2xl ${
              isRunning
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-orange-500/50'
                : `bg-gradient-to-r ${config.gradient} text-white ${config.glowColor}`
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-7 h-7" />
                暂停计时
              </>
            ) : (
              <>
                <Play className="w-7 h-7" />
                开始专注
              </>
            )}
          </button>

          {(isRunning || timeRemaining < (mode === 'work' ? settings.workDuration * 60 : mode === 'shortBreak' ? settings.shortBreakDuration * 60 : settings.longBreakDuration * 60)) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAbandon();
              }}
              className={`inline-flex items-center gap-4 px-8 py-6 rounded-2xl font-bold text-xl transition-all shadow-2xl ${
                theme === 'dark'
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-2 border-red-500/30'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-600 border-2 border-red-500/30'
              }`}
              title="放弃"
            >
              <XCircle className="w-7 h-7" />
            </button>
          )}
        </div>

        {/* 底部统计 */}
        <div className="flex justify-center gap-12">
          <div className="text-center">
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
              今日完成
            </p>
            <p className={`text-3xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {completedSessions}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
              累计专注
            </p>
            <p className={`text-3xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {Math.floor(stats.totalFocusTime)}m
            </p>
          </div>
        </div>
      </div>
    </div>
    );
  };

  // 根据状态渲染不同视图
  if (typeof window === 'undefined') return null;

  // 如果是最小化状态，只渲染浮窗
  if (isMinimized) {
    return createPortal(<MinimizedTimer />, document.body);
  }

  return createPortal(
    <AnimatePresence mode="wait">
      {isFullscreen ? (
        <FullscreenView key="fullscreen" />
      ) : (
        <motion.div
          key="compact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CompactView />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
