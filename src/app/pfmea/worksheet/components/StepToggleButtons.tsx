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
    { step: 2, label: '2ST', color: '#5c6bc0' },  // 네이비 계열
    { step: 3, label: '3ST', color: '#7986cb' },  // 네이비 밝음
    { step: 4, label: '4ST', color: '#5c6bc0' },  // 네이비 계열
    { step: 5, label: '5ST', color: '#7986cb' },  // 네이비 밝음
    { step: 6, label: '6ST', color: '#5c6bc0' },  // 네이비 계열
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

  return (
    <div className="flex gap-1.5 items-center">
      <div className="flex gap-1">
        {steps.map(s => {
          const isActive = visibleSteps.includes(s.step);
          return (
            <button
              key={s.step}
              onClick={() => toggleStep(s.step)}
              className="px-3 py-1 cursor-pointer transition-all"
              style={{
                background: isActive ? s.color : 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                opacity: isActive ? 1 : 0.7,
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = '0.85';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = '0.7';
                }
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* 구분선 */}
      <div className="w-px h-5 bg-white/30 mx-1" />

      {/* 전체보기 버튼 */}
      <button
        onClick={() => setState(prev => ({ ...prev, tab: 'all', levelView: 'all', visibleSteps: [2, 3, 4, 5, 6] }))}
        className="px-3 py-1 cursor-pointer transition-all"
        style={{
          background: state.tab === 'all' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '12px',
          fontWeight: state.tab === 'all' ? 600 : 400,
        }}
        onMouseOver={(e) => {
          if (state.tab !== 'all') {
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
          }
        }}
        onMouseOut={(e) => {
          if (state.tab !== 'all') {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }
        }}
      >
        ALL
      </button>
    </div>
  );
}

