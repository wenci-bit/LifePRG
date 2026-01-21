/**
 * Particle2DSystem - 2D 粒子背景组件（多模式版）
 *
 * 使用 Canvas 2D API 创建动态粒子系统
 * 特性:
 * - 10000+ 粒子点
 * - 青色到紫色的渐变效果
 * - 三种交互模式：排斥、引力、波纹
 * - 高性能优化
 */

'use client';

import { useRef, useEffect } from 'react';
import type { ParticleMode, ParticleColorTheme, ParticleDistribution } from '@/types/game';

interface Particle2DSystemProps {
  count?: number;
  mode?: ParticleMode;
  colorTheme?: ParticleColorTheme;
  distribution?: ParticleDistribution;
}

interface Particle {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
}

/**
 * 根据颜色主题生成颜色
 */
function getColorForTheme(t: number, theme: ParticleColorTheme): string {
  switch (theme) {
    case 'cyber':
      // 赛博朋克：青色到紫色
      const r = Math.floor(0 + t * 188);
      const g = Math.floor(243 - t * 224);
      const b = Math.floor(255 - t * 1);
      return `rgba(${r}, ${g}, ${b}, 0.7)`;

    case 'rainbow':
      // 彩虹：HSL色环
      const hue = Math.floor(t * 360);
      return `hsla(${hue}, 100%, 60%, 0.7)`;

    case 'monochrome':
      // 黑白：纯白色
      return `rgba(255, 255, 255, 0.7)`;

    case 'grayscale':
      // 灰度：从深灰到浅灰
      const gray = Math.floor(77 + t * 128); // 0.3 * 255 到 0.8 * 255
      return `rgba(${gray}, ${gray}, ${gray}, 0.7)`;

    default:
      return `rgba(0, 243, 255, 0.7)`;
  }
}

export default function Particle2DSystem({
  count = 10000,
  mode = 'repulsion',
  colorTheme = 'cyber',
  distribution = 'circular'
}: Particle2DSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // 初始化粒子
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 确保canvas有正确的尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      let x, y;

      if (distribution === 'circular') {
        // 圆形分布
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * Math.min(canvas.width, canvas.height) * 0.45;
        x = centerX + Math.cos(angle) * distance;
        y = centerY + Math.sin(angle) * distance;
      } else {
        // 矩形分布，覆盖整个canvas
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
      }

      particles.push({
        x,
        y,
        originalX: x,
        originalY: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: getColorForTheme(i / count, colorTheme),
        radius: 1.5 + Math.random() * 0.5,
      });
    }

    particlesRef.current = particles;
  }, [count, colorTheme, distribution]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 重新初始化粒子位置
      particlesRef.current.forEach((particle, i) => {
        let x, y;

        if (distribution === 'circular') {
          // 圆形分布
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * Math.min(canvas.width, canvas.height) * 0.45;
          x = centerX + Math.cos(angle) * distance;
          y = centerY + Math.sin(angle) * distance;
        } else {
          // 矩形分布，覆盖整个canvas
          x = Math.random() * canvas.width;
          y = Math.random() * canvas.height;
        }

        particle.x = x;
        particle.y = y;
        particle.originalX = x;
        particle.originalY = y;
        particle.color = getColorForTheme(i / count, colorTheme);
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [count, colorTheme, distribution]);

  // 鼠标移动监听
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 动画循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.016; // ~60fps

      // 清空画布
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      particlesRef.current.forEach((particle) => {
        const dx = particle.x - mouseX;
        const dy = particle.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 根据模式应用不同的交互效果
        if (mode === 'repulsion') {
          // 排斥模式
          const repulsionRadius = 150;
          if (distance < repulsionRadius) {
            const force = (1 - distance / repulsionRadius) * 8;
            const angle = Math.atan2(dy, dx);
            particle.x += Math.cos(angle) * force;
            particle.y += Math.sin(angle) * force;
          }
        } else if (mode === 'attraction') {
          // 引力模式
          const attractionRadius = 200;
          if (distance < attractionRadius) {
            const force = (1 - distance / attractionRadius) * 5;
            const angle = Math.atan2(dy, dx);
            particle.x -= Math.cos(angle) * force;
            particle.y -= Math.sin(angle) * force;
          }
        } else if (mode === 'wave') {
          // 波纹模式
          const waveRadius = 250;
          if (distance < waveRadius) {
            const wavePhase = timeRef.current * 3 + distance * 0.02;
            const waveAmplitude = (1 - distance / waveRadius) * 10;

            particle.y += Math.sin(wavePhase) * waveAmplitude * 0.1;

            const angle = Math.atan2(dy, dx);
            particle.x += Math.cos(angle) * Math.cos(wavePhase) * waveAmplitude * 0.1;
            particle.y += Math.sin(angle) * Math.cos(wavePhase) * waveAmplitude * 0.1;
          }
        }

        // 缓慢回归原始位置
        particle.x += (particle.originalX - particle.x) * 0.05;
        particle.y += (particle.originalY - particle.y) * 0.05;

        // 微小的随机运动
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 绘制粒子（不添加整体旋转效果）
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: 'var(--bg-color)' }}
    />
  );
}
