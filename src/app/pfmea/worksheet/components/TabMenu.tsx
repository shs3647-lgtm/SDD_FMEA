/**
 * @file TabMenu.tsx
 * @description 워크시트 탭 메뉴 (반응형)
 * - 구조분석, 기능분석, 고장분석 등
 * - 화면 크기에 따라 자동 조정
 * 
 * @version 2.0.0 - 반응형 Tailwind CSS 적용
 */

'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  onAllClick?: () => void; // ★★★ 2026-01-12: ALL 탭 클릭 시 트리뷰 복귀 ★★★
}

export default function TabMenu({ state, setState, setStateSynced, setDirty, saveToLocalStorage, saveAtomicDB, onAllClick }: TabMenuProps) {
  const router = useRouter();
  const structureConfirmed = (state as any).structureConfirmed || false;
  const failureLinks = (state as any).failureLinks || [];
  const failureLinkConfirmed = (state as any).failureLinkConfirmed || false;
  const hasFailureLinks = failureLinks.length > 0;
  const riskConfirmed = (state as any).riskConfirmed || false;
  const optConfirmed = (state as any).optConfirmed || false;
  
  // 승인 버튼 핸들러 (개정관리 화면 이동)
  const handleApproval = useCallback(() => {
    const fmeaId = (state as any).fmeaId || '';
    if (confirm('🔏 FMEA 승인 프로세스를 시작합니다.\n\n개정관리 화면으로 이동하시겠습니까?')) {
      router.push(`/pfmea/revision?id=${fmeaId}`);
    }
  }, [(state as any).fmeaId, router]);
  
  // ✅ 탭 활성화 조건 - 모든 탭 항상 활성화 (확정 여부와 무관)
  const isTabEnabled = (tabId: string) => {
    // 모든 탭 활성화 - 사용자가 현재 상태를 볼 수 있도록
    return true;
  };
  
  // ✅ 탭 클릭 시 경고 메시지 - 경고만 표시하고 이동은 허용
  const getTabWarning = (tabId: string): string | null => {
    // 경고 없이 모든 탭 이동 허용
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
                  // ★ 2026-01-11: 탭 위치 localStorage 저장 (새로고침 시 유지)
                  const fmeaId = (state as any).fmeaId;
                  if (fmeaId) {
                    try {
                      localStorage.setItem(`pfmea_tab_${fmeaId}`, tab.id);
                    } catch (e) { /* ignore */ }
                  }
                  // ★★★ 2026-01-12: ALL 탭 클릭 시 트리뷰(전체화면)로 복귀 ★★★
                  if (tab.id === 'all') {
                    console.log('🔵 ALL 탭 클릭! onAllClick 호출');
                    onAllClick?.();
                  }
                }}
                className={`
                  px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5
                  text-[10px] sm:text-[11px] lg:text-xs
                  rounded transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer
                  ${isActive 
                    ? 'bg-indigo-700 border border-yellow-400 text-yellow-400 font-bold shadow-lg' 
                    : 'bg-transparent border border-transparent text-white font-medium hover:bg-white/15 hover:text-yellow-400'
                  }
                `}
                title={tab.label}
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
        
        {/* 단계별 토글 버튼 - 큰 화면에서만 */}
        <div className="hidden md:block">
          <StepToggleButtons state={state} setState={setState} />
        </div>
        
        {/* 구분선 */}
        <div className="hidden sm:block w-px h-5 bg-white/30 mx-1 lg:mx-2 shrink-0" />
        
        {/* 5단계/6단계 확정 버튼 - ALL 버튼 뒤쪽에 배치 */}
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
              // ✅ 5ST 확정: 고장연결 탭의 ALL 화면(전체보기)으로 이동
              setState(prev => ({ ...prev, tab: 'failureLink', failureLinkViewMode: 'result' }));
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
              // ✅ 6ST 확정: 고장연결 탭의 ALL 화면(전체보기)으로 이동
              setState(prev => ({ ...prev, tab: 'failureLink', failureLinkViewMode: 'result' }));
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
          
          {/* 🚀 승인 버튼: 항상 표시, 6ST 확정 후 활성화 */}
          <button
            onClick={optConfirmed ? handleApproval : undefined}
            disabled={!optConfirmed}
            className={`
              px-2 py-1 text-[10px] sm:text-xs rounded whitespace-nowrap border flex items-center gap-1
              ${optConfirmed 
                ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400 cursor-pointer font-bold' 
                : 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed opacity-60'
              }
            `}
            title={optConfirmed 
              ? '개정관리 화면으로 이동하여 FMEA 승인' 
              : '6ST 확정 후 활성화됩니다'
            }
          >
            📋 {optConfirmed ? '승인' : '승인'}
          </button>
        </div>
      </div>
    </div>
  );
}
