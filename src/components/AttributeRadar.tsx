/**
 * AttributeRadar - 属性雷达图组件
 *
 * 使用 SVG 绘制动态雷达图，展示四维属性
 * 特性:
 * - 平滑过渡动画
 * - 悬停交互
 * - 荧光效果
 */

'use client';

import { useGameStore } from '@/store/gameStore';
import { useThemeStore } from '@/store/themeStore';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

const ATTRIBUTES = [
  { key: 'int', label: 'INT', fullName: '智力/科研', color: '#00f3ff', angle: 0 },
  { key: 'vit', label: 'VIT', fullName: '活力/健康', color: '#0aff00', angle: 90 },
  { key: 'mng', label: 'MNG', fullName: '管理/规划', color: '#bc13fe', angle: 180 },
  { key: 'cre', label: 'CRE', fullName: '创造/灵感', color: '#ff003c', angle: 270 },
] as const;

export default function AttributeRadar() {
  const attributes = useGameStore((state) => state.attributes);
  const theme = useThemeStore((state) => state.theme);

  const centerX = 200;
  const centerY = 200;
  const maxRadius = 150;
  const maxValue = 100;

  // 根据主题动态设置颜色
  const gridColor = theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
  const axisColor = theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
  const textColor = theme === 'light' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const subTextColor = theme === 'light' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';

  /**
   * 计算雷达图的多边形路径
   */
  const radarPath = useMemo(() => {
    const points = ATTRIBUTES.map((attr) => {
      const value = attributes[attr.key as keyof typeof attributes];
      const radius = (value / maxValue) * maxRadius;
      const angleRad = (attr.angle * Math.PI) / 180;

      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);

      return `${x},${y}`;
    });

    return points.join(' ');
  }, [attributes]);

  /**
   * 生成网格线
   */
  const gridLines = useMemo(() => {
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    return levels.map((level, index) => {
      const radius = maxRadius * level;
      const points = ATTRIBUTES.map((attr) => {
        const angleRad = (attr.angle * Math.PI) / 180;
        const x = centerX + radius * Math.cos(angleRad);
        const y = centerY + radius * Math.sin(angleRad);
        return `${x},${y}`;
      }).join(' ');

      return (
        <polygon
          key={index}
          points={points}
          fill="none"
          stroke={gridColor}
          strokeWidth="1"
        />
      );
    });
  }, [gridColor]);

  /**
   * 生成轴线
   */
  const axisLines = useMemo(() => {
    return ATTRIBUTES.map((attr, index) => {
      const angleRad = (attr.angle * Math.PI) / 180;
      const x = centerX + maxRadius * Math.cos(angleRad);
      const y = centerY + maxRadius * Math.sin(angleRad);

      return (
        <line
          key={index}
          x1={centerX}
          y1={centerY}
          x2={x}
          y2={y}
          stroke={axisColor}
          strokeWidth="1"
        />
      );
    });
  }, [axisColor]);

  /**
   * 生成属性标签
   */
  const labels = useMemo(() => {
    return ATTRIBUTES.map((attr, index) => {
      const angleRad = (attr.angle * Math.PI) / 180;
      const labelRadius = maxRadius + 40;
      const x = centerX + labelRadius * Math.cos(angleRad);
      const y = centerY + labelRadius * Math.sin(angleRad);

      const value = attributes[attr.key as keyof typeof attributes];

      return (
        <g key={index}>
          {/* 属性名称 */}
          <text
            x={x}
            y={y - 10}
            textAnchor="middle"
            fill={attr.color}
            fontSize="16"
            fontWeight="700"
            className="font-orbitron"
          >
            {attr.label}
          </text>
          {/* 属性值 */}
          <text
            x={x}
            y={y + 8}
            textAnchor="middle"
            fill={textColor}
            fontSize="20"
            fontWeight="900"
            className="font-mono"
          >
            {value}
          </text>
          {/* 完整名称 */}
          <text
            x={x}
            y={y + 24}
            textAnchor="middle"
            fill={subTextColor}
            fontSize="10"
            className="font-inter"
          >
            {attr.fullName}
          </text>
        </g>
      );
    });
  }, [attributes, textColor, subTextColor]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="drop-shadow-2xl"
      >
        {/* 定义发光滤镜 */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 渐变定义 */}
          <radialGradient id="radarGradient">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#bc13fe" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* 背景网格 */}
        {gridLines}

        {/* 轴线 */}
        {axisLines}

        {/* 中心点 */}
        <circle cx={centerX} cy={centerY} r="3" fill="#00f3ff" />

        {/* 雷达图多边形 - 使用 Framer Motion 添加动画 */}
        <motion.polygon
          points={radarPath}
          fill="url(#radarGradient)"
          stroke="#00f3ff"
          strokeWidth="2"
          filter="url(#glow)"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* 属性节点 */}
        {ATTRIBUTES.map((attr, index) => {
          const value = attributes[attr.key as keyof typeof attributes];
          const radius = (value / maxValue) * maxRadius;
          const angleRad = (attr.angle * Math.PI) / 180;
          const x = centerX + radius * Math.cos(angleRad);
          const y = centerY + radius * Math.sin(angleRad);

          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="5"
              fill={attr.color}
              stroke="#fff"
              strokeWidth="2"
              filter="url(#glow)"
              whileHover={{ scale: 1.5 }}
              className="cursor-pointer"
            />
          );
        })}

        {/* 属性标签 */}
        {labels}
      </svg>

      {/* 标题 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <h3 className="text-xl font-orbitron font-bold text-cyber-cyan animate-glow-pulse">
          ATTRIBUTE MATRIX
        </h3>
      </div>
    </div>
  );
}
