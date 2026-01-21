/**
 * ParticleBackground - 3D 粒子点云背景组件（多模式版 - 性能优化版）
 *
 * 使用 React-Three-Fiber 和 Three.js 创建动态粒子系统
 * 特性:
 * - 自适应粒子数量（根据设备性能）
 * - 青色到紫色的渐变效果
 * - 三种交互模式：排斥、引力、波纹
 * - 性能优化（InstancedMesh + 设备检测）
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import type { ParticleMode, ParticleColorTheme } from '@/types/game';
import Particle2DSystem from './Particle2DSystem';

interface ParticleSystemProps {
  count?: number;
  mode?: ParticleMode;
  colorTheme?: ParticleColorTheme;
}

/**
 * 根据设备性能自动调整粒子数量
 */
function getOptimalParticleCount(): number {
  // 检测是否为移动设备
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // 检测CPU核心数（低端设备通常 <= 4核）
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  // 检测是否为触摸设备
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isMobile || isTouchDevice) {
    return 15000; // 移动设备：15K粒子
  } else if (isLowEnd) {
    return 30000; // 低端PC：30K粒子
  } else {
    return 50000; // 高性能设备：50K粒子
  }
}

/**
 * 粒子系统核心组件
 */
function ParticleSystem({ count = getOptimalParticleCount(), mode = 'repulsion', colorTheme = 'cyber' }: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const mousePos = useRef(new THREE.Vector2(0, 0));
  const mousePos3D = useRef(new THREE.Vector3(0, 0, 0));
  const time = useRef(0);
  const { camera } = useThree();

  /**
   * 根据颜色主题生成颜色
   */
  const getColorForTheme = (t: number, theme: ParticleColorTheme): THREE.Color => {
    const color = new THREE.Color();

    switch (theme) {
      case 'cyber':
        // 赛博朋克：青色到紫色
        color.setRGB(
          0 + t * 0.74, // R: 0 -> 188/255
          0.95 - t * 0.88, // G: 243/255 -> 19/255
          1 - t * 0.01 // B: 255/255 -> 254/255
        );
        break;

      case 'rainbow':
        // 彩虹：完整色环
        color.setHSL(t, 1.0, 0.6);
        break;

      case 'monochrome':
        // 黑白：纯白色
        color.setRGB(1, 1, 1);
        break;

      case 'grayscale':
        // 灰度：从深灰到浅灰
        const gray = 0.3 + t * 0.5;
        color.setRGB(gray, gray, gray);
        break;

      default:
        color.setRGB(0, 0.95, 1);
    }

    return color;
  };

  /**
   * 初始化粒子位置和颜色
   * 使用 useMemo 优化性能，避免重复计算
   */
  const particles = useMemo(() => {
    const temp = [];
    const colors = [];

    for (let i = 0; i < count; i++) {
      // 使用球体分布算法生成粒子位置
      const theta = Math.random() * Math.PI * 2; // 水平角度
      const phi = Math.acos(Math.random() * 2 - 1); // 垂直角度
      const radius = 15 + Math.random() * 12; // 半径随机变化

      // 球坐标转笛卡尔坐标
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      temp.push({
        position: new THREE.Vector3(x, y, z),
        originalPosition: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015
        ),
      });

      // 根据主题生成颜色
      const t = i / count;
      const color = getColorForTheme(t, colorTheme);
      colors.push(color);
    }

    return { temp, colors };
  }, [count, colorTheme]);

  /**
   * 鼠标移动监听
   */
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // 获取标准化设备坐标 (NDC)
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // 将2D屏幕坐标转换为3D世界坐标
      // 使用相机的视角投影，将鼠标位置映射到z=0平面
      const vector = new THREE.Vector3(mousePos.current.x, mousePos.current.y, 0);
      vector.unproject(camera);

      // 从相机位置到投影点的方向
      const dir = vector.sub(camera.position).normalize();

      // 计算射线与z=0平面的交点
      // 相机在z=30，我们要找z=0平面的交点
      const distance = -camera.position.z / dir.z;

      mousePos3D.current.copy(camera.position).add(dir.multiplyScalar(distance));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera]);

  /**
   * 动画循环
   * 实现粒子的缓慢旋转和不同模式的鼠标交互
   */
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();
    time.current = state.clock.getElapsedTime();

    // 使用准确映射的3D鼠标位置
    const mousePosInSpace = mousePos3D.current;

    particles.temp.forEach((particle, i) => {
      const distance = particle.position.distanceTo(mousePosInSpace);

      // 根据模式应用不同的交互效果
      if (mode === 'repulsion') {
        // 模式1：排斥模式（原有的）
        const repulsionStrength = 18;
        const repulsionRadius = 12;

        if (distance < repulsionRadius) {
          const direction = new THREE.Vector3()
            .subVectors(particle.position, mousePosInSpace)
            .normalize();

          const force = (1 - distance / repulsionRadius) * repulsionStrength;
          particle.position.add(direction.multiplyScalar(force * delta));
        }
      } else if (mode === 'attraction') {
        // 模式2：引力模式 - 粒子被鼠标吸引
        const attractionStrength = 12;
        const attractionRadius = 15;

        if (distance < attractionRadius) {
          const direction = new THREE.Vector3()
            .subVectors(mousePosInSpace, particle.position)
            .normalize();

          const force = (1 - distance / attractionRadius) * attractionStrength;
          particle.position.add(direction.multiplyScalar(force * delta));
        }
      } else if (mode === 'wave') {
        // 模式3：波纹模式 - 产生波纹效果
        const waveStrength = 3;
        const waveRadius = 18;

        if (distance < waveRadius) {
          const wavePhase = time.current * 3 + distance * 0.5;
          const waveAmplitude = (1 - distance / waveRadius) * waveStrength;

          // 垂直波动
          particle.position.y += Math.sin(wavePhase) * waveAmplitude * delta;

          // 径向扩散
          const direction = new THREE.Vector3()
            .subVectors(particle.position, mousePosInSpace)
            .normalize();

          particle.position.add(
            direction.multiplyScalar(Math.cos(wavePhase) * waveAmplitude * delta)
          );
        }
      }

      // 粒子缓慢回归原始位置
      particle.position.lerp(particle.originalPosition, 0.05);

      // 微小的随机运动
      particle.position.add(particle.velocity);

      // 随时间轻微旋转
      const angle = time.current * 0.08;
      const rotatedX =
        particle.position.x * Math.cos(angle) -
        particle.position.z * Math.sin(angle);
      const rotatedZ =
        particle.position.x * Math.sin(angle) +
        particle.position.z * Math.cos(angle);

      // 更新 InstancedMesh 的矩阵
      dummy.position.set(rotatedX, particle.position.y, rotatedZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // 更新颜色
      const color = particles.colors[i].clone();
      mesh.setColorAt(i, color);
    });

    // 标记需要更新
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* 粒子大小和透明度优化 */}
      <sphereGeometry args={[0.04, 6, 6]} />
      <meshBasicMaterial
        color="#00f3ff"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

/**
 * 导出的粒子背景组件
 */
export default function ParticleBackground() {
  const particleMode = useGameStore((state) => state.settings.particleMode);
  const particleColorTheme = useGameStore((state) => state.settings.particleColorTheme);
  const particleDimension = useGameStore((state) => state.settings.particleDimension);
  const particleDistribution = useGameStore((state) => state.settings.particleDistribution);

  // 根据维度选择渲染2D或3D粒子系统
  if (particleDimension === '2d') {
    return (
      <Particle2DSystem
        count={10000}
        mode={particleMode}
        colorTheme={particleColorTheme}
        distribution={particleDistribution}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        style={{ background: 'var(--bg-color)' }}
      >
        {/* 环境光 */}
        <ambientLight intensity={0.5} />

        {/* 粒子系统 - 根据用户选择的模式和颜色渲染（自适应粒子数量） */}
        <ParticleSystem mode={particleMode} colorTheme={particleColorTheme} />
      </Canvas>
    </div>
  );
}
