/**
 * @file StatusBar.tsx
 * @description L7 상태바 (상태/모듈/단계/레벨/사용자 + 좌우스크롤바 표시)
 * @author AI Assistant
 * @created 2025-12-25
 * @version 1.1.0
 */

'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback, useRef } from 'react';

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
  /** 스크롤 컨테이너 ID (스크롤바 연동용) */
  scrollContainerId?: string;
}

/**
 * 상태바 컴포넌트 (L7)
 * 
 * @description
 * 화면 하단에 현재 작업 상태, 모듈, 단계, 레벨, 사용자 정보와
 * 좌우 스크롤바를 표시합니다.
 * 높이: 24px
 */
export function StatusBar({
  status = 'ready',
  module = 'PFMEA',
  step = '4단계-고장연결',
  level = 3,
  saved = true,
  userName = 'Admin',
  scrollContainerId = 'worksheet-scroll-container',
}: StatusBarProps) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // 상태별 색상 및 아이콘
  const statusConfig = {
    ready: { color: 'text-green-500', icon: '🟢', label: 'Ready' },
    editing: { color: 'text-yellow-500', icon: '🟡', label: 'Editing' },
    saving: { color: 'text-blue-500', icon: '🔵', label: 'Saving...' },
    error: { color: 'text-red-500', icon: '🔴', label: 'Error' },
  };

  const currentStatus = statusConfig[status];

  // 스크롤 컨테이너 가져오기
  const getScrollContainer = useCallback(() => {
    // CP Import 스크롤 컨테이너 확인 (우선순위 1)
    let container = document.getElementById('cp-import-scroll-container');
    if (container) {
      return container;
    }
    // CP 워크시트 스크롤 컨테이너 확인 (우선순위 2)
    container = document.getElementById('cp-worksheet-scroll-container');
    if (container) {
      return container;
    }
    // all-tab-scroll-wrapper 확인 (All 탭용, 우선순위 3)
    container = document.getElementById('all-tab-scroll-wrapper');
    if (container) {
      return container;
    }
    // 기본 worksheet-scroll-container 확인 (우선순위 4)
    container = document.getElementById(scrollContainerId);
    return container;
  }, [scrollContainerId]);

  // 스크롤 위치 업데이트
  const updateScrollPosition = useCallback(() => {
    const container = getScrollContainer();
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      setCanScroll(maxScroll > 0);
      if (maxScroll > 0) {
        setScrollPercent((container.scrollLeft / maxScroll) * 100);
      } else {
        setScrollPercent(0);
      }
    }
  }, [getScrollContainer]);

  // 왼쪽으로 스크롤
  const scrollLeft = useCallback(() => {
    const container = getScrollContainer();
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }, [getScrollContainer]);

  // 오른쪽으로 스크롤
  const scrollRight = useCallback(() => {
    const container = getScrollContainer();
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }, [getScrollContainer]);

  // 트랙 클릭으로 스크롤
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = getScrollContainer();
    const track = trackRef.current;
    if (!container || !track) return;

    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const maxScroll = container.scrollWidth - container.clientWidth;
    container.scrollLeft = percent * maxScroll;
  }, [getScrollContainer]);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // 드래그 중
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = getScrollContainer();
      const track = trackRef.current;
      if (!container || !track) return;

      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = x / rect.width;
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollLeft = percent * maxScroll;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, getScrollContainer]);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => updateScrollPosition();
    
    // 초기 로드 시 약간의 지연 후 확인 (테이블 렌더링 대기)
    const initialTimeout = setTimeout(() => {
      updateScrollPosition();
    }, 100);
    
    // 주기적으로 컨테이너 확인 (탭 전환 대응)
    const interval = setInterval(() => {
      updateScrollPosition();
    }, 500);

    // 모든 잠재적 스크롤 컨테이너에 리스너 추가
    const cpImportContainer = document.getElementById('cp-import-scroll-container');
    const cpContainer = document.getElementById('cp-worksheet-scroll-container');
    const allTabContainer = document.getElementById('all-tab-scroll-wrapper');
    const defaultContainer = document.getElementById(scrollContainerId);
    
    cpImportContainer?.addEventListener('scroll', handleScroll);
    cpContainer?.addEventListener('scroll', handleScroll);
    allTabContainer?.addEventListener('scroll', handleScroll);
    defaultContainer?.addEventListener('scroll', handleScroll);
    
    // 초기 위치 설정
    updateScrollPosition();

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      cpImportContainer?.removeEventListener('scroll', handleScroll);
      cpContainer?.removeEventListener('scroll', handleScroll);
      allTabContainer?.removeEventListener('scroll', handleScroll);
      defaultContainer?.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerId, updateScrollPosition]);

  return (
    <footer className="fixed bottom-0 left-12 right-0 z-20 h-8 bg-gray-100 border-t border-gray-300">
      <div className="flex h-full items-center px-2 text-xs text-gray-600 gap-2">
        {/* ======== 좌측: 상태 정보 ======== */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 상태 */}
          <span className={cn('flex items-center gap-1', currentStatus.color)}>
            {currentStatus.icon} {currentStatus.label}
          </span>
          <span className="text-gray-300">|</span>
          <span>{module}</span>
          <span className="text-gray-300">|</span>
          <span>{step}</span>
          <span className="text-gray-300">|</span>
          <span>{level}레벨</span>
          <span className="text-gray-300">|</span>
          <span className={saved ? 'text-green-500' : 'text-yellow-500'}>
            {saved ? '✓저장' : '●수정'}
          </span>
        </div>

        {/* ======== 중앙: 좌우 스크롤바 ======== */}
        <div className="flex-1 flex items-center gap-2 mx-4">
          {/* 왼쪽 화살표 버튼 */}
          <button
            onClick={scrollLeft}
            disabled={!canScroll || scrollPercent <= 0}
            className={cn(
              "w-6 h-5 flex items-center justify-center rounded",
              "bg-gray-200 hover:bg-gray-300 transition-colors",
              (!canScroll || scrollPercent <= 0) && "opacity-40 cursor-not-allowed"
            )}
            title="왼쪽으로 스크롤"
          >
            ◀
          </button>

          {/* 스크롤 트랙 */}
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className={cn(
              "flex-1 h-4 rounded cursor-pointer relative",
              canScroll ? "bg-gray-300" : "bg-gray-200"
            )}
            style={{
              background: canScroll 
                ? 'linear-gradient(to bottom, #d0d0d0, #e0e0e0)' 
                : '#e8e8e8',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {/* 스크롤 썸 (드래그 가능) */}
            {canScroll && (
              <div
                onMouseDown={handleDragStart}
                className="absolute top-0 h-full rounded cursor-grab active:cursor-grabbing"
                style={{
                  left: `${Math.max(0, Math.min(scrollPercent, 100) - 10)}%`,
                  width: '20%',
                  minWidth: '40px',
                  maxWidth: '100px',
                  background: isDragging 
                    ? 'linear-gradient(to bottom, #0d1757, #303f9f)'
                    : 'linear-gradient(to bottom, #1a237e, #3f51b5)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: isDragging ? 'none' : 'left 0.1s ease-out',
                }}
              />
            )}
            {!canScroll && (
              <div className="flex items-center justify-center h-full text-[10px] text-gray-500">
                스크롤 없음
              </div>
            )}
          </div>

          {/* 오른쪽 화살표 버튼 */}
          <button
            onClick={scrollRight}
            disabled={!canScroll || scrollPercent >= 100}
            className={cn(
              "w-6 h-5 flex items-center justify-center rounded",
              "bg-gray-200 hover:bg-gray-300 transition-colors",
              (!canScroll || scrollPercent >= 100) && "opacity-40 cursor-not-allowed"
            )}
            title="오른쪽으로 스크롤"
          >
            ▶
          </button>

          {/* 스크롤 퍼센트 표시 */}
          {canScroll && (
            <span className="text-[10px] text-gray-500 w-8 text-right">
              {Math.round(scrollPercent)}%
            </span>
          )}
        </div>

        {/* ======== 우측: 사용자 정보 ======== */}
        <div className="flex items-center gap-2 shrink-0">
          <span>👤 {userName}</span>
        </div>
      </div>
    </footer>
  );
}

export default StatusBar;
