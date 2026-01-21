/**
 * AvatarDisplay - 头像显示组件
 * 根据头像类型渲染不同的显示效果，支持头像框
 */

'use client';

import { User } from 'lucide-react';
import { getAvatarById } from '@/data/avatars';
import { getFrameById } from '@/data/avatarFrames';
import type { UserAvatar } from '@/types/game';

interface AvatarDisplayProps {
  avatar?: UserAvatar;
  frameId?: string; // 头像框ID
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export default function AvatarDisplay({
  avatar,
  frameId,
  size = 'md',
  className = '',
  showBorder = true,
}: AvatarDisplayProps) {
  // 尺寸映射
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  // 获取头像框数据
  const frame = frameId ? getFrameById(frameId) : null;

  // 构建头像框样式
  const getFrameStyle = () => {
    if (!frame || !frame.style || frame.id === 'frame-none') return {};

    const style: React.CSSProperties = {};

    // 边框宽度
    if (frame.style.borderWidth) {
      style.borderWidth = `${frame.style.borderWidth}px`;
      style.borderStyle = frame.style.borderStyle || 'solid';
    }

    // 纯色边框
    if (frame.style.borderColor) {
      style.borderColor = frame.style.borderColor;
    }

    // 渐变边框
    if (frame.style.gradient) {
      const { gradient } = frame.style;
      let gradientStr = '';

      if (gradient.type === 'linear') {
        const angle = gradient.angle || 135;
        gradientStr = `linear-gradient(${angle}deg, ${gradient.colors.join(', ')})`;
      } else if (gradient.type === 'radial') {
        gradientStr = `radial-gradient(circle, ${gradient.colors.join(', ')})`;
      } else if (gradient.type === 'conic') {
        gradientStr = `conic-gradient(from 0deg, ${gradient.colors.join(', ')})`;
      }

      // 使用伪元素实现渐变边框
      style.position = 'relative';
      style.background = gradientStr;
      style.padding = `${frame.style.borderWidth || 4}px`;
    }

    // 阴影
    if (frame.style.shadow) {
      style.boxShadow = frame.style.shadow;
    }

    return style;
  };

  // 获取动画类名
  const getAnimationClass = () => {
    if (!frame || !frame.style.animation) return '';

    switch (frame.style.animation) {
      case 'spin':
        return 'animate-spin-slow';
      case 'pulse':
        return 'animate-pulse';
      default:
        return '';
    }
  };

  const frameStyle = getFrameStyle();
  const animationClass = getAnimationClass();
  const hasGradientBorder = frame?.style?.gradient;

  // 渲染emoji头像
  const renderEmojiAvatar = () => {
    if (avatar?.type !== 'emoji') return null;
    const avatarData = getAvatarById(avatar.data);
    if (!avatarData) return null;

    return (
      <div
        className={`${hasGradientBorder ? 'w-full h-full' : sizeClasses[size]} rounded-full flex items-center justify-center
          ${!hasGradientBorder && showBorder ? 'ring-2 ring-white/20' : ''}`}
        style={{
          background: avatarData.gradient
            ? `linear-gradient(135deg, ${avatarData.gradient.from}, ${avatarData.gradient.to})`
            : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <span>{avatarData.emoji}</span>
      </div>
    );
  };

  // 渲染URL头像
  const renderUrlAvatar = () => {
    if (avatar?.type !== 'url' && avatar?.type !== 'upload') return null;

    return (
      <div
        className={`${hasGradientBorder ? 'w-full h-full' : sizeClasses[size]} rounded-full overflow-hidden
          ${!hasGradientBorder && showBorder ? 'ring-2 ring-white/20' : ''} bg-white/10`}
      >
        <img
          src={avatar.data}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyber-cyan to-cyber-purple rounded-full">
                  <svg class="${iconSizes[size]} text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              `;
            }
          }}
        />
      </div>
    );
  };

  // 渲染默认头像
  const renderDefaultAvatar = () => (
    <div
      className={`${hasGradientBorder ? 'w-full h-full' : sizeClasses[size]} rounded-full flex items-center justify-center
        bg-gradient-to-br from-cyber-cyan to-cyber-purple
        ${!hasGradientBorder && showBorder ? 'ring-2 ring-white/20' : ''}`}
    >
      <User className={`${iconSizes[size]} text-white`} />
    </div>
  );

  // 选择渲染的头像类型
  const avatarContent = avatar?.type === 'emoji'
    ? renderEmojiAvatar()
    : avatar?.type === 'url' || avatar?.type === 'upload'
    ? renderUrlAvatar()
    : renderDefaultAvatar();

  // 如果有头像框，包裹一层
  if (frame && frame.id !== 'frame-none') {
    // 渐变边框需要外层有固定尺寸，纯色边框不需要
    const outerSizeClass = hasGradientBorder ? sizeClasses[size] : '';

    // 如果有动画，使用双层结构：外层容器 + 动画边框伪元素
    if (animationClass) {
      return (
        <div
          className={`${outerSizeClass} ${className} rounded-full inline-flex items-center justify-center relative`}
          style={hasGradientBorder ? { padding: `${frame.style.borderWidth || 4}px` } : frameStyle}
        >
          {/* 动画边框层 - 使用伪元素效果 */}
          {hasGradientBorder && (
            <div
              className={`absolute inset-0 ${animationClass} rounded-full -z-10`}
              style={{
                background: frameStyle.background,
                boxShadow: frameStyle.boxShadow,
              }}
            />
          )}
          {/* 静止头像层 */}
          <div className={hasGradientBorder ? 'relative' : `relative ${animationClass}`}>
            {avatarContent}
          </div>
        </div>
      );
    }

    // 无动画时使用原有的单层结构
    return (
      <div
        className={`${outerSizeClass} ${className} rounded-full inline-flex items-center justify-center`}
        style={frameStyle}
      >
        {avatarContent}
      </div>
    );
  }

  // 没有头像框，直接返回头像
  return <div className={className}>{avatarContent}</div>;
}
