/**
 * @file TabMenu.tsx
 * @description 워크시트 탭 메뉴 (구조분석, 기능분석, 고장분석 등)
 */

'use client';

import React from 'react';
import { WorksheetState, ANALYSIS_TABS, COLORS } from '../constants';
import StepToggleButtons from './StepToggleButtons';

interface TabMenuProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
}

export default function TabMenu({ state, setState }: TabMenuProps) {
  const structureConfirmed = (state as any).structureConfirmed || false;
  const failureLinks = (state as any).failureLinks || [];
  const hasFailureLinks = failureLinks.length > 0; // 고장연결 완료 여부
  
  // 탭 활성화 조건
  const isTabEnabled = (tabId: string) => {
    if (tabId === 'structure') return true;
    if (tabId.startsWith('function-')) return structureConfirmed;
    if (tabId.startsWith('failure-')) return structureConfirmed;
    // 평가 탭 (리스크분석, 최적화)은 고장연결 후 활성화
    if (tabId === 'risk' || tabId === 'opt') return hasFailureLinks;
    return structureConfirmed;
  };

  // 분석 탭 + 평가 탭 (구분선으로 구분)
  const analysisTabs = ANALYSIS_TABS;
  const evaluationTabs = [
    { id: 'risk', label: '리스크분석', step: 5 },
    { id: 'opt', label: '최적화', step: 6 },
  ];
  
  return (
    <div className="flex-shrink-0 bg-white py-0.5" style={{ borderBottom: `2px solid ${COLORS.blue}`, paddingLeft: 0, paddingRight: '8px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* 분석 탭 */}
          <div className="flex gap-px">
            {analysisTabs.map(tab => {
              const isActive = state.tab === tab.id;
              const isEnabled = isTabEnabled(tab.id);
              const activeColor = tab.id === 'structure' ? '#1a237e' : COLORS.blue;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isEnabled) {
                      alert('⚠️ 구조분석을 먼저 확정해주세요.');
                      return;
                    }
                    setState(prev => ({ ...prev, tab: tab.id }));
                  }}
                  className="font-bold"
                  style={{
                    padding: '3px 6px',
                    fontSize: '10px',
                    background: isActive ? activeColor : isEnabled ? '#e8f0f8' : '#f0f0f0',
                    borderTop: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderRight: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderLeft: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderBottom: 'none',
                    borderRadius: '2px 2px 0 0',
                    color: isActive ? '#fff' : isEnabled ? COLORS.text : '#aaa',
                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                    opacity: isEnabled ? 1 : 0.6,
                    whiteSpace: 'nowrap',
                  }}
                  title={!isEnabled ? '구조분석 확정 후 사용 가능' : ''}
                >
                  {tab.label}
                  {!isEnabled && <span style={{ marginLeft: '2px', fontSize: '7px' }}>🔒</span>}
                </button>
              );
            })}
          </div>

          {/* 단계별 토글 버튼 - 모든 탭에서 표시 */}
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <StepToggleButtons state={state} setState={setState} />
        </div>

        <div className="flex items-center gap-1" style={{ marginLeft: '4px' }}>
          <div className="w-px h-4 bg-gray-300" />
          <button
            onClick={() => setState(prev => ({ ...prev, tab: 'all', levelView: 'all', visibleSteps: [2, 3, 4, 5, 6] }))}
            style={{
              background: state.tab === 'all' ? COLORS.blue : '#fff',
              border: `1px solid ${COLORS.blue}`,
              borderRadius: '3px',
              color: state.tab === 'all' ? '#fff' : COLORS.blue,
              padding: '3px 6px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            전체보기
          </button>
        </div>
      </div>
    </div>
  );
}

