/**
 * ErrorBoundary - 错误边界组件
 *
 * 捕获React组件树中的JavaScript错误，防止整个应用崩溃
 */

'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: {
    componentStack: string;
  };
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // 你同样可以将错误日志上报给服务器
    console.error('错误边界捕获到错误:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // 可以在这里发送错误到监控服务
    // sendErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          <div className="glass-card p-8 max-w-2xl mx-4">
            <div className="text-center">
              {/* 图标 */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20">
                  <span className="text-5xl">⚠️</span>
                </div>
              </div>

              {/* 标题 */}
              <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                出错了
              </h2>

              {/* 描述 */}
              <p className="text-white/70 mb-6">
                应用遇到了一个意外错误。您可以尝试刷新页面或返回首页。
              </p>

              {/* 错误详情（开发模式下显示） */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-cyber-cyan hover:text-cyber-purple transition-colors mb-2">
                    查看错误详情
                  </summary>
                  <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-60">
                    <p className="text-red-400 font-mono text-sm mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-white/60 text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo && (
                      <pre className="text-white/60 text-xs overflow-auto mt-4">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20
                    border border-white/20 hover:border-white/30
                    text-white font-medium transition-all duration-300
                    hover:scale-105 active:scale-95"
                >
                  重试
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 rounded-lg
                    bg-gradient-to-r from-cyber-cyan to-cyber-purple
                    hover:from-cyber-purple hover:to-cyber-cyan
                    text-white font-medium transition-all duration-300
                    hover:scale-105 active:scale-95 shadow-lg shadow-cyber-cyan/50"
                >
                  返回首页
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20
                    border border-white/20 hover:border-white/30
                    text-white font-medium transition-all duration-300
                    hover:scale-105 active:scale-95"
                >
                  刷新页面
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
