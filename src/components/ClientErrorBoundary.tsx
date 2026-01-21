/**
 * ClientErrorBoundary - 客户端错误边界包装器
 *
 * 用于在layout.tsx中使用ErrorBoundary
 */

'use client';

import ErrorBoundary from './ErrorBoundary';
import { ReactNode } from 'react';

export default function ClientErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
