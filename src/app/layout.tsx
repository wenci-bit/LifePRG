/**
 * Root Layout - 根布局（性能优化版）
 *
 * 定义全局布局和元数据
 * 添加了错误边界保护
 */

import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import ClientErrorBoundary from '@/components/ClientErrorBoundary';

export const metadata: Metadata = {
  title: '工作空间 - 个人效率管理系统',
  description: '专业的个人任务管理与时间规划工具',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('liferpg-theme');
                  const theme = stored ? JSON.parse(stored).state.theme : 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ClientErrorBoundary>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ClientErrorBoundary>
      </body>
    </html>
  );
}
