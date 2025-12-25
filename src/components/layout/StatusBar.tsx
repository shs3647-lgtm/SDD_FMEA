/**
 * @file StatusBar.tsx
 * @description L7 상태바 (상태/모듈/단계/레벨/사용자 표시)
 * @author AI Assistant
 * @created 2025-12-25
 * @version 1.0.0
 */

'use client';

import { cn } from '@/lib/utils';

interface StatusBarProps {
  /** 현재 상태 */
  status?: 'ready' | 'editing' | 'saving' | 'error';
  /** 현재 모듈 */
  module?: string;
  /** 현재 단계 */
  step?: string;
  /** 현재 레벨 */
  level?: number;
  /** 저장 상태 */
  saved?: boolean;
  /** 사용자명 */
  userName?: string;
}

/**
 * 상태바 컴포넌트 (L7)
 * 
 * @description
 * 화면 하단에 현재 작업 상태, 모듈, 단계, 레벨, 사용자 정보를 표시합니다.
 * 높이: 24px
 */
export function StatusBar({
  status = 'ready',
  module = 'PFMEA',
  step = '4단계-고장연결',
  level = 3,
  saved = true,
  userName = 'Admin',
}: StatusBarProps) {
  // 상태별 색상 및 아이콘
  const statusConfig = {
    ready: { color: 'text-green-500', icon: '🟢', label: 'Ready' },
    editing: { color: 'text-yellow-500', icon: '🟡', label: 'Editing' },
    saving: { color: 'text-blue-500', icon: '🔵', label: 'Saving...' },
    error: { color: 'text-red-500', icon: '🔴', label: 'Error' },
  };

  const currentStatus = statusConfig[status];

  return (
    <footer className="fixed bottom-0 left-12 right-0 z-20 h-6 bg-gray-100 border-t border-gray-200">
      <div className="flex h-full items-center justify-between px-4 text-xs text-gray-600">
        {/* ======== 좌측: 상태 정보 ======== */}
        <div className="flex items-center gap-4">
          {/* 상태 */}
          <span className={cn('flex items-center gap-1', currentStatus.color)}>
            {currentStatus.icon} {currentStatus.label}
          </span>

          {/* 구분선 */}
          <span className="text-gray-300">|</span>

          {/* 모듈 */}
          <span>{module}</span>

          {/* 구분선 */}
          <span className="text-gray-300">|</span>

          {/* 단계 */}
          <span>{step}</span>

          {/* 구분선 */}
          <span className="text-gray-300">|</span>

          {/* 레벨 */}
          <span>{level}레벨</span>

          {/* 구분선 */}
          <span className="text-gray-300">|</span>

          {/* 저장 상태 */}
          <span className={saved ? 'text-green-500' : 'text-yellow-500'}>
            {saved ? '🟢 저장됨' : '🟡 수정됨'}
          </span>
        </div>

        {/* ======== 우측: 사용자 정보 ======== */}
        <div className="flex items-center gap-2">
          <span>사용자: {userName}</span>
        </div>
      </div>
    </footer>
  );
}

export default StatusBar;

