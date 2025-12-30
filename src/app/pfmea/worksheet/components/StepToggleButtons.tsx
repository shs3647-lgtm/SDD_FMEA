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
    { step: 2, label: '2단계', color: '#1565c0' },
    { step: 3, label: '3단계', color: '#1b5e20' },
    { step: 4, label: '4단계', color: '#c62828' },
    { step: 5, label: '5단계', color: '#00695c' },
    { step: 6, label: '6단계', color: '#ff6f00' },
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
    <div className="flex gap-1 items-center">
      <div className="flex gap-px">
        {steps.map(s => {
          const isActive = visibleSteps.includes(s.step);
          return (
            <button
              key={s.step}
              onClick={() => toggleStep(s.step)}
              className="px-1.5 py-0.5 text-xs font-bold cursor-pointer"
              style={{
                background: isActive ? s.color : '#f0f0f0',
                border: `1px solid ${isActive ? s.color : '#d0d0d0'}`,
                borderRadius: '3px',
                color: isActive ? '#fff' : '#999',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      
      {/* 전체화면 버튼 */}
      <div className="w-px h-4 bg-gray-400" style={{ margin: '0 2px' }} />
      <button
        onClick={showAllSteps}
        className="px-2 py-0.5 text-xs font-bold cursor-pointer"
        style={{
          background: isAllVisible ? '#1976d2' : '#f0f0f0',
          border: `1px solid ${isAllVisible ? '#1976d2' : '#d0d0d0'}`,
          borderRadius: '3px',
          color: isAllVisible ? '#fff' : '#666',
          whiteSpace: 'nowrap',
        }}
      >
        📊 전체화면
      </button>
    </div>
  );
}

