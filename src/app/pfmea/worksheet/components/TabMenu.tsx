/**
 * @file TabMenu.tsx
 * @description 워크시트 탭 메뉴 (반응형)
 * - 구조분석, 기능분석, 고장분석 등
 * - 화면 크기에 따라 자동 조정
 * 
 * @version 2.0.0 - 반응형 Tailwind CSS 적용
 */

'use client';

import React from 'react';
import { WorksheetState, ANALYSIS_TABS } from '../constants';
import StepToggleButtons from './StepToggleButtons';

interface TabMenuProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
  setStateSynced?: (updater: React.SetStateAction<WorksheetState>) => void;
  setDirty: (dirty: boolean) => void;
  saveToLocalStorage?: () => void;
  saveAtomicDB?: () => void;
  onOpen5AP?: () => void;
  onOpen6AP?: () => void;
}

export default function TabMenu({ state, setState, setStateSynced, setDirty, saveToLocalStorage, saveAtomicDB }: TabMenuProps) {
  const structureConfirmed = (state as any).structureConfirmed || false;
  const failureLinks = (state as any).failureLinks || [];
  const failureLinkConfirmed = (state as any).failureLinkConfirmed || false;
  const hasFailureLinks = failureLinks.length > 0;
  const riskConfirmed = (state as any).riskConfirmed || false;
  const optConfirmed = (state as any).optConfirmed || false;
  
  // 탭 활성화 조건
  const isTabEnabled = (tabId: string) => {
    if (tabId === 'structure') return true;
    if (tabId.startsWith('function-')) return structureConfirmed;
    if (tabId.startsWith('failure-')) return structureConfirmed;
    if (tabId === 'risk' || tabId === 'opt') return failureLinkConfirmed;
    return structureConfirmed;
  };
  
  // 탭 클릭 시 경고 메시지
  const getTabWarning = (tabId: string): string | null => {
    if (tabId === 'risk' || tabId === 'opt') {
      if (!hasFailureLinks) return '⚠️ 고장연결이 없습니다.\n먼저 고장분석에서 고장연결을 완료해주세요.';
      if (!failureLinkConfirmed) return '⚠️ 고장연결이 확정되지 않았습니다.\n고장연결 탭에서 "전체확정" 버튼을 눌러주세요.';
    }
    if (!structureConfirmed && tabId !== 'structure') {
      return '⚠️ 구조분석을 먼저 확정해주세요.';
    }
    return null;
  };

  const analysisTabs = ANALYSIS_TABS;
  
  return (
    <div className="flex-shrink-0 h-8 sm:h-9 px-1 sm:px-2 flex items-center justify-between overflow-hidden">
      {/* 좌측: 탭 버튼들 - 스크롤 가능 */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide flex-1">
        {/* 분석 탭 */}
        <div className="flex gap-0.5 sm:gap-1">
          {analysisTabs.map(tab => {
            const isActive = state.tab === tab.id;
            const isEnabled = isTabEnabled(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  const warning = getTabWarning(tab.id);
                  if (warning) {
                    alert(warning);
                    return;
                  }
                  setState(prev => ({ ...prev, tab: tab.id }));
                }}
                className={`
                  px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5
                  text-[10px] sm:text-[11px] lg:text-xs
                  rounded transition-all duration-200 whitespace-nowrap shrink-0
                  ${isActive 
                    ? 'bg-indigo-700 border border-yellow-400 text-yellow-400 font-bold shadow-lg' 
                    : 'bg-transparent border border-transparent text-white font-medium hover:bg-white/15 hover:text-yellow-400'
                  }
                  ${isEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                `}
                title={!isEnabled ? '구조분석 확정 후 사용 가능' : tab.label}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.replace('분석', '').replace('기능', 'F').replace('고장', 'X')}</span>
                {!isEnabled && <span className="ml-0.5 text-[8px]">🔒</span>}
              </button>
            );
          })}
        </div>

        {/* 구분선 */}
        <div className="hidden sm:block w-px h-5 bg-white/30 mx-1 lg:mx-2 shrink-0" />
        
        {/* 5단계/6단계 확정 버튼 - 항상 표시 */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => {
              if (!failureLinkConfirmed) {
                alert('⚠️ 고장연결을 먼저 확정해주세요.');
                return;
              }
              if (riskConfirmed) {
                alert('✅ 이미 확정되었습니다.');
                return;
              }
              setState(prev => ({ ...prev, tab: 'risk' }));
            }}
            className={`
              px-2 py-1 text-[10px] sm:text-xs rounded whitespace-nowrap border
              ${riskConfirmed 
                ? 'bg-green-600 text-white border-green-500 cursor-default' 
                : failureLinkConfirmed
                  ? 'bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400 cursor-pointer'
                  : 'bg-gray-600 text-gray-300 border-gray-500 cursor-not-allowed opacity-70'
              }
            `}
          >
            {riskConfirmed ? '✓ 5ST확정' : '5ST확정'}
          </button>
          <button
            onClick={() => {
              if (!riskConfirmed) {
                alert('⚠️ 리스크분석(5단계)을 먼저 확정해주세요.');
                return;
              }
              if (optConfirmed) {
                alert('✅ 이미 확정되었습니다.');
                return;
              }
              setState(prev => ({ ...prev, tab: 'opt' }));
            }}
            className={`
              px-2 py-1 text-[10px] sm:text-xs rounded whitespace-nowrap border
              ${optConfirmed 
                ? 'bg-green-600 text-white border-green-500 cursor-default' 
                : riskConfirmed
                  ? 'bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400 cursor-pointer'
                  : 'bg-gray-600 text-gray-300 border-gray-500 cursor-not-allowed opacity-70'
              }
            `}
          >
            {optConfirmed ? '✓ 6ST확정' : '6ST확정'}
          </button>
        </div>
        
        {/* 구분선 */}
        <div className="hidden sm:block w-px h-5 bg-white/30 mx-1 lg:mx-2 shrink-0" />
        
        {/* 단계별 토글 버튼 - 큰 화면에서만 */}
        <div className="hidden md:block">
          <StepToggleButtons state={state} setState={setState} />
        </div>
      </div>
    </div>
  );
}
