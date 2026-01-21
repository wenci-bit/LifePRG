/**
 * SettingsPage - 设置页面
 *
 * 提供系统设置、数据管理和个性化选项
 */

'use client';

import { motion } from 'framer-motion';
import { Settings, Download, Upload, RotateCcw, Info, Trash2, Sparkles, Brain, Key, MessageSquare, Cpu } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useState } from 'react';
import type { ParticleMode, ParticleColorTheme, ParticleDimension, ParticleDistribution } from '@/types/game';
import { AIProvider, AI_MODELS } from '@/services/aiService';

export default function SettingsPage() {
  const resetGame = useGameStore((state) => state.resetGame);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const particleMode = useGameStore((state) => state.settings.particleMode);
  const particleColorTheme = useGameStore((state) => state.settings.particleColorTheme);
  const particleDimension = useGameStore((state) => state.settings.particleDimension);
  const particleDistribution = useGameStore((state) => state.settings.particleDistribution);
  const gameState = useGameStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // AI 配置状态
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('ai-provider') as AIProvider) || AIProvider.DEEPSEEK;
  });
  const [aiModel, setAiModel] = useState(() => {
    return localStorage.getItem('ai-model') || 'deepseek-chat';
  });
  const [aiApiKey, setAiApiKey] = useState(() => {
    return localStorage.getItem('ai-api-key') || 'sk-f10bb23f3510481ba6ddec8ed5cb5d8f';
  });
  const [aiTemperature, setAiTemperature] = useState(() => {
    return parseFloat(localStorage.getItem('ai-temperature') || '0.7');
  });
  const [aiMaxTokens, setAiMaxTokens] = useState(() => {
    return parseInt(localStorage.getItem('ai-max-tokens') || '800');
  });
  const [aiCustomPrompt, setAiCustomPrompt] = useState(() => {
    return localStorage.getItem('ai-custom-prompt') || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);

  // 当提供商改变时，重置模型为该提供商的第一个模型
  const handleProviderChange = (provider: AIProvider) => {
    setAiProvider(provider);
    const defaultModel = AI_MODELS[provider][0].id;
    setAiModel(defaultModel);
  };

  // 导出数据
  const handleExport = () => {
    const dataStr = JSON.stringify(gameState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liferpg-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 导入数据
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const data = JSON.parse(event.target.result);
            // 这里需要一个新的 action 来导入数据
            localStorage.setItem('liferpg-storage', JSON.stringify({ state: data }));
            window.location.reload();
          } catch (error) {
            alert('导入失败：文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 重置数据
  const handleReset = () => {
    if (showResetConfirm) {
      resetGame();
      setShowResetConfirm(false);
      alert('数据已重置！');
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  // 切换粒子模式
  const handleParticleModeChange = (mode: ParticleMode) => {
    updateSettings({ particleMode: mode });
  };

  // 切换粒子颜色主题
  const handleColorThemeChange = (theme: ParticleColorTheme) => {
    updateSettings({ particleColorTheme: theme });
  };

  // 切换粒子维度
  const handleDimensionChange = (dimension: ParticleDimension) => {
    updateSettings({ particleDimension: dimension });
  };

  // 切换粒子分布模式
  const handleDistributionChange = (distribution: ParticleDistribution) => {
    updateSettings({ particleDistribution: distribution });
  };

  // 保存 AI 配置
  const handleSaveAIConfig = () => {
    localStorage.setItem('ai-provider', aiProvider);
    localStorage.setItem('ai-model', aiModel);
    localStorage.setItem('ai-api-key', aiApiKey);
    localStorage.setItem('ai-temperature', aiTemperature.toString());
    localStorage.setItem('ai-max-tokens', aiMaxTokens.toString());
    localStorage.setItem('ai-custom-prompt', aiCustomPrompt);
    alert('AI 配置已保存！');
  };

  // 重置 AI 配置为默认值
  const handleResetAIConfig = () => {
    const defaultProvider = AIProvider.DEEPSEEK;
    const defaultModel = 'deepseek-chat';
    const defaultApiKey = 'sk-f10bb23f3510481ba6ddec8ed5cb5d8f';
    const defaultTemperature = 0.7;
    const defaultMaxTokens = 800;
    const defaultPrompt = '';

    setAiProvider(defaultProvider);
    setAiModel(defaultModel);
    setAiApiKey(defaultApiKey);
    setAiTemperature(defaultTemperature);
    setAiMaxTokens(defaultMaxTokens);
    setAiCustomPrompt(defaultPrompt);

    localStorage.setItem('ai-provider', defaultProvider);
    localStorage.setItem('ai-model', defaultModel);
    localStorage.setItem('ai-api-key', defaultApiKey);
    localStorage.setItem('ai-temperature', defaultTemperature.toString());
    localStorage.setItem('ai-max-tokens', defaultMaxTokens.toString());
    localStorage.setItem('ai-custom-prompt', defaultPrompt);

    alert('AI 配置已重置为默认值！');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black font-orbitron text-white">
              设置
            </h1>
            <p className="text-white/60 font-inter">
              管理你的数据和偏好设置
            </p>
          </div>
        </div>
      </motion.div>

      {/* 数据管理 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8"
      >
        <h2 className="text-2xl font-bold font-orbitron text-white mb-6 flex items-center gap-3">
          <Info className="w-6 h-6 text-cyber-cyan" />
          数据管理
        </h2>

        <div className="space-y-4">
          {/* 导出数据 */}
          <SettingItem
            icon={Download}
            title="导出数据"
            description="将你的进度导出为 JSON 文件"
            buttonText="导出"
            buttonColor="from-cyber-cyan to-blue-600"
            onClick={handleExport}
          />

          {/* 导入数据 */}
          <SettingItem
            icon={Upload}
            title="导入数据"
            description="从 JSON 文件恢复进度"
            buttonText="导入"
            buttonColor="from-cyber-purple to-purple-600"
            onClick={handleImport}
          />

          {/* 重置数据 */}
          <SettingItem
            icon={showResetConfirm ? Trash2 : RotateCcw}
            title={showResetConfirm ? '确认重置？' : '重置数据'}
            description={
              showResetConfirm
                ? '所有数据将被清除，此操作不可撤销！'
                : '清除所有数据，重新开始'
            }
            buttonText={showResetConfirm ? '确认重置' : '重置'}
            buttonColor={showResetConfirm ? 'from-red-600 to-red-800' : 'from-orange-500 to-red-600'}
            onClick={handleReset}
            warning={showResetConfirm}
          />
        </div>
      </motion.div>

      {/* AI 配置 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.125 }}
        className="glass-card p-8"
      >
        <h2 className="text-2xl font-bold font-orbitron text-white mb-6 flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-400" />
          AI 智能助手配置
        </h2>

        <div className="space-y-6">
          {/* API 提供商和模型选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API 提供商 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 font-inter">
                <Cpu className="w-4 h-4 text-purple-400" />
                API 提供商
              </label>
              <select
                value={aiProvider}
                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 font-inter cursor-pointer"
              >
                <option value={AIProvider.DEEPSEEK} className="bg-gray-800">DeepSeek</option>
                <option value={AIProvider.OPENAI} className="bg-gray-800">OpenAI</option>
                <option value={AIProvider.CLAUDE} className="bg-gray-800">Claude (Anthropic)</option>
                <option value={AIProvider.QWEN} className="bg-gray-800">通义千问 (Qwen)</option>
              </select>
              <p className="text-xs text-white/50 mt-2 font-inter">
                选择你要使用的 AI 服务提供商
              </p>
            </div>

            {/* 模型选择 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 font-inter">
                <Sparkles className="w-4 h-4 text-purple-400" />
                模型选择
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 font-inter cursor-pointer"
              >
                {AI_MODELS[aiProvider].map((model) => (
                  <option key={model.id} value={model.id} className="bg-gray-800">
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-white/50 mt-2 font-inter">
                {AI_MODELS[aiProvider].find(m => m.id === aiModel)?.description || '选择具体的模型'}
              </p>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 font-inter">
              <Key className="w-4 h-4 text-purple-400" />
              API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 font-mono text-sm"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
              >
                {showApiKey ? '隐藏' : '显示'}
              </button>
            </div>
            <p className="text-xs text-white/50 mt-2 font-inter">
              获取 API Key：
              {aiProvider === AIProvider.DEEPSEEK && (
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline ml-1">
                  DeepSeek 平台
                </a>
              )}
              {aiProvider === AIProvider.OPENAI && (
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline ml-1">
                  OpenAI 平台
                </a>
              )}
              {aiProvider === AIProvider.CLAUDE && (
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline ml-1">
                  Anthropic Console
                </a>
              )}
              {aiProvider === AIProvider.QWEN && (
                <a href="https://dashscope.console.aliyun.com/apiKey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline ml-1">
                  阿里云控制台
                </a>
              )}
            </p>
          </div>

          {/* 模型参数 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temperature */}
            <div>
              <label className="block text-sm font-bold text-white mb-3 font-inter">
                Temperature（创造性）
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiTemperature}
                  onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${aiTemperature * 100}%, rgba(255, 255, 255, 0.1) ${aiTemperature * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>精确 (0.0)</span>
                  <span className="text-purple-400 font-bold font-mono">{aiTemperature.toFixed(1)}</span>
                  <span>创造 (1.0)</span>
                </div>
              </div>
              <p className="text-xs text-white/50 mt-2 font-inter">
                值越高，回答越有创造性；值越低，回答越精确
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-bold text-white mb-3 font-inter">
                Max Tokens（输出长度）
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                step="100"
                value={aiMaxTokens}
                onChange={(e) => setAiMaxTokens(parseInt(e.target.value) || 800)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 font-mono"
              />
              <p className="text-xs text-white/50 mt-2 font-inter">
                控制 AI 回答的最大长度（建议 500-1000）
              </p>
            </div>
          </div>

          {/* 自定义提示词 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 font-inter">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              自定义系统提示词（可选）
            </label>
            <textarea
              value={aiCustomPrompt}
              onChange={(e) => setAiCustomPrompt(e.target.value)}
              placeholder="留空则使用默认提示词。如果需要自定义，请在此输入你的系统提示词..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 font-inter text-sm resize-none"
            />
            <p className="text-xs text-white/50 mt-2 font-inter">
              自定义提示词将覆盖默认的专业理论提示词。如果不确定，建议留空使用默认设置。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAIConfig}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold font-inter transition-all"
            >
              保存配置
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResetAIConfig}
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium font-inter transition-all"
            >
              重置默认
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 视觉设置 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold font-orbitron text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyber-purple" />
          视觉效果
        </h2>

        <div className="space-y-4">
          {/* 粒子交互模式 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 font-inter">
              交互模式
            </h3>
            <div className="flex gap-2">
              {/* 排斥模式 */}
              <button
                onClick={() => handleParticleModeChange('repulsion')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                  particleMode === 'repulsion'
                    ? 'border-cyber-cyan bg-cyber-cyan/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">🌀</div>
                  <p className="text-xs font-inter font-medium">排斥</p>
                </div>
              </button>

              {/* 引力模式 */}
              <button
                onClick={() => handleParticleModeChange('attraction')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                  particleMode === 'attraction'
                    ? 'border-cyber-purple bg-cyber-purple/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">✨</div>
                  <p className="text-xs font-inter font-medium">引力</p>
                </div>
              </button>

              {/* 波纹模式 */}
              <button
                onClick={() => handleParticleModeChange('wave')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                  particleMode === 'wave'
                    ? 'border-cyber-green bg-cyber-green/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">🌊</div>
                  <p className="text-xs font-inter font-medium">波纹</p>
                </div>
              </button>
            </div>
          </div>

          {/* 粒子颜色主题 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 font-inter">
              颜色主题
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {/* 赛博朋克主题 */}
              <button
                onClick={() => handleColorThemeChange('cyber')}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  particleColorTheme === 'cyber'
                    ? 'border-cyber-cyan bg-cyber-cyan/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">🌈</div>
                  <p className="text-xs font-inter font-medium">赛博朋克</p>
                </div>
              </button>

              {/* 彩虹主题 */}
              <button
                onClick={() => handleColorThemeChange('rainbow')}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  particleColorTheme === 'rainbow'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">🎨</div>
                  <p className="text-xs font-inter font-medium">彩虹</p>
                </div>
              </button>

              {/* 黑白主题 */}
              <button
                onClick={() => handleColorThemeChange('monochrome')}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  particleColorTheme === 'monochrome'
                    ? 'border-white bg-white/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">⚪</div>
                  <p className="text-xs font-inter font-medium">黑白</p>
                </div>
              </button>

              {/* 灰度主题 */}
              <button
                onClick={() => handleColorThemeChange('grayscale')}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  particleColorTheme === 'grayscale'
                    ? 'border-gray-400 bg-gray-400/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">⚫</div>
                  <p className="text-xs font-inter font-medium">灰度</p>
                </div>
              </button>
            </div>
          </div>

          {/* 粒子维度 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2 font-inter">
              粒子维度
            </h3>
            <div className="flex gap-2">
              {/* 2D模式 */}
              <button
                onClick={() => handleDimensionChange('2d')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                  particleDimension === '2d'
                    ? 'border-cyan-400 bg-cyan-400/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">📐</div>
                  <p className="text-xs font-inter font-medium">2D</p>
                </div>
              </button>

              {/* 3D模式 */}
              <button
                onClick={() => handleDimensionChange('3d')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                  particleDimension === '3d'
                    ? 'border-purple-400 bg-purple-400/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">🎲</div>
                  <p className="text-xs font-inter font-medium">3D</p>
                </div>
              </button>
            </div>
          </div>

          {/* 粒子分布模式（仅在2D模式下显示） */}
          {particleDimension === '2d' && (
            <div>
              <h3 className="text-sm font-bold text-white mb-2 font-inter">
                分布模式
              </h3>
              <div className="flex gap-2">
                {/* 圆形分布 */}
                <button
                  onClick={() => handleDistributionChange('circular')}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                    particleDistribution === 'circular'
                      ? 'border-pink-400 bg-pink-400/20 text-white'
                      : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">⭕</div>
                    <p className="text-xs font-inter font-medium">圆形</p>
                  </div>
                </button>

                {/* 矩形分布 */}
                <button
                  onClick={() => handleDistributionChange('rectangular')}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                    particleDistribution === 'rectangular'
                      ? 'border-amber-400 bg-amber-400/20 text-white'
                      : 'border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">⬜</div>
                    <p className="text-xs font-inter font-medium">矩形</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 数据统计 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8"
      >
        <h2 className="text-2xl font-bold font-orbitron text-white mb-6">
          数据统计
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="当前等级" value={gameState.level} />
          <StatCard label="总经验值" value={gameState.currentExp} />
          <StatCard label="金币" value={gameState.coins} />
          <StatCard label="完成任务" value={gameState.stats.totalQuestsCompleted} />
          <StatCard label="INT" value={gameState.attributes.int} color="text-cyber-cyan" />
          <StatCard label="VIT" value={gameState.attributes.vit} color="text-cyber-green" />
          <StatCard label="MNG" value={gameState.attributes.mng} color="text-cyber-purple" />
          <StatCard label="CRE" value={gameState.attributes.cre} color="text-cyber-red" />
        </div>
      </motion.div>

      {/* 关于 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8"
      >
        <h2 className="text-2xl font-bold font-orbitron text-white mb-6">
          关于工作空间
        </h2>

        <div className="space-y-4 text-white/70 font-inter">
          <p>
            <strong className="text-white">工作空间</strong> 是一款专业的个人效率管理系统。
          </p>
          <p>
            通过科学的目标管理机制，将日常任务转化为可量化的成长轨迹，帮助你更好地规划时间、完成目标。
          </p>
          <p>
            内置番茄钟专注工具、任务分类管理、数据可视化分析等功能，让自我提升变得更加系统化和高效。
          </p>

          <div className="pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/50 mb-1">版本</p>
                <p className="text-white font-mono">v1.0.0</p>
              </div>
              <div>
                <p className="text-white/50 mb-1">技术栈</p>
                <p className="text-white font-mono">Next.js + Three.js</p>
              </div>
              <div>
                <p className="text-white/50 mb-1">核心功能</p>
                <p className="text-white">任务管理 · 时间追踪</p>
              </div>
              <div>
                <p className="text-white/50 mb-1">设计理念</p>
                <p className="text-white">专业 · 高效 · 简洁</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 底部提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-8"
      >
        <p className="text-white/40 text-sm font-inter">
          数据存储在浏览器本地，清除缓存会导致数据丢失，建议定期导出备份
        </p>
      </motion.div>
    </div>
  );
}

/**
 * 设置项组件
 */
function SettingItem({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonColor,
  onClick,
  warning = false,
}: {
  icon: any;
  title: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  onClick: () => void;
  warning?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-xl border ${
        warning ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${buttonColor} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 font-inter">
              {title}
            </h3>
            <p className="text-sm text-white/60 font-inter">
              {description}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={`px-6 py-2 rounded-lg bg-gradient-to-r ${buttonColor} text-white font-bold font-inter whitespace-nowrap ${
            warning ? 'animate-pulse' : ''
          }`}
        >
          {buttonText}
        </motion.button>
      </div>
    </div>
  );
}

/**
 * 统计卡片
 */
function StatCard({
  label,
  value,
  color = 'text-white',
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="p-4 bg-white/5 rounded-xl text-center">
      <p className="text-xs text-white/50 font-inter mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
