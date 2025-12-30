/**
 * @file StepToggleButtons.tsx
 * @description 단계별 토글 버튼 (2~6단계 표시/숨김 제어)
 */

'use client';

import React from 'react';
import { WorksheetState } from '../constants';

interface StepToggleButtonsProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
}

export default function StepToggleButtons({ state, setState }: StepToggleButtonsProps) {
  const steps = [
    { step: 2, label: '2ST' },
    { step: 3, label: '3ST' },
    { step: 4, label: '4ST' },
    { step: 5, label: '5ST' },
    { step: 6, label: '6ST' },
  ];

  const toggleStep = (step: number) => {
    setState(prev => {
      const currentSteps = prev.visibleSteps || [2, 3, 4, 5, 6];
      const isVisible = currentSteps.includes(step);
      
      // 최소 1개는 선택되어야 함
      if (isVisible && currentSteps.length === 1) return prev;
      
      const newSteps = isVisible
        ? currentSteps.filter(s => s !== step)
        : [...currentSteps, step].sort((a, b) => a - b);
      
      return { ...prev, visibleSteps: newSteps };
    });
  };

  const showAllSteps = () => {
    setState(prev => ({ ...prev, visibleSteps: [2, 3, 4, 5, 6] }));
  };

  const visibleSteps = state.visibleSteps || [2, 3, 4, 5, 6];
  const isAllVisible = visibleSteps.length === 5;

  const isAllTab = state.tab === 'all';

  return (
    <div className="flex gap-1.5 items-center">
      {/* 2ST~6ST 항상 표시 - ALL 탭에서만 토글 동작 */}
      <div className="flex gap-1">
        {steps.map(s => {
          const isActive = isAllTab && visibleSteps.includes(s.step);
          return (
            <button
              key={s.step}
              onClick={() => {
                if (!isAllTab) {
                  // 분석 탭에서 클릭 시 ALL 탭으로 이동
                  setState(prev => ({ ...prev, tab: 'all', levelView: 'all', visibleSteps: [2, 3, 4, 5, 6] }));
                } else {
                  toggleStep(s.step);
                }
              }}
              className="px-3 py-1 cursor-pointer transition-all"
              style={{
                background: isActive ? '#3949ab' : '#5c6bc0',
                border: isActive ? '1px solid #ffd600' : '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: isActive ? '#ffd600' : '#fff',
                fontSize: '12px',
                fontWeight: 600,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#7986cb';
                if (!isActive) e.currentTarget.style.color = '#ffd600';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = isActive ? '#3949ab' : '#5c6bc0';
                e.currentTarget.style.color = isActive ? '#ffd600' : '#fff';
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      
      {/* 구분선 */}
      <div className="w-px h-5 bg-white/30 mx-1" />

      {/* 전체보기 버튼 - 항상 표시 */}
      <button
        onClick={() => setState(prev => ({ ...prev, tab: 'all', levelView: 'all', visibleSteps: [2, 3, 4, 5, 6] }))}
        className="px-3 py-1 cursor-pointer transition-all"
        style={{
          background: isAllTab ? '#3949ab' : '#5c6bc0',
          border: isAllTab ? '1px solid #ffd600' : '1px solid rgba(255,255,255,0.3)',
          borderRadius: '4px',
          color: isAllTab ? '#ffd600' : '#fff',
          fontSize: '12px',
          fontWeight: 600,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#7986cb';
          if (!isAllTab) e.currentTarget.style.color = '#ffd600';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = isAllTab ? '#3949ab' : '#5c6bc0';
          e.currentTarget.style.color = isAllTab ? '#ffd600' : '#fff';
        }}
      >
        ALL
      </button>
    </div>
  );
}

