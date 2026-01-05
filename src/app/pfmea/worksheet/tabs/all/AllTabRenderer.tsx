/**
 * @file AllTabRenderer.tsx
 * @description 전체보기 탭 렌더러 (40열 FMEA 워크시트 + 기능분석 연동)
 * @refactored 2025-12-30 - AllTabWithLinks.tsx, AllTabBasic.tsx로 분리
 * @updated 2026-01-05 - AllTabAtomic.tsx 추가 (원자성 DB 기반)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { FlatRow, WorksheetState } from '../../constants';
import AllTabWithLinks from './AllTabWithLinks';
import AllTabBasic from './AllTabBasic';
import AllTabAtomic from './AllTabAtomic';

interface AllTabRendererProps {
  tab: string;
  rows: FlatRow[];
  state: WorksheetState;
  setState?: React.Dispatch<React.SetStateAction<WorksheetState>>;
  l1Spans: number[];
  l1TypeSpans: number[];
  l1FuncSpans: number[];
  l2Spans: number[];
  onAPClick?: () => void;
  visibleSteps?: number[];
  fmeaId?: string; // 원자성 DB 조회용
  useAtomicDB?: boolean; // 원자성 DB 사용 여부 (기본: true)
}

export default function AllTabRenderer({ 
  tab, rows, state, setState, l1Spans, l1TypeSpans, l1FuncSpans, l2Spans, onAPClick,
  visibleSteps: propsVisibleSteps,
  fmeaId,
  useAtomicDB = true // 기본값: 원자성 DB 사용
}: AllTabRendererProps) {
  
  // 디버깅: 컴포넌트 렌더링 시 state 확인
  useEffect(() => {
    const riskDataObj = state.riskData || {};
    const severityKeys = Object.keys(riskDataObj).filter(k => k.startsWith('S-fe-'));
    console.log('🔵 AllTabRenderer 마운트/업데이트:', {
      tab,
      riskDataCount: Object.keys(riskDataObj).length,
      severityKeys: severityKeys,
      hasSetState: !!setState,
      stateL1Name: state.l1?.name,
      fmeaId,
      useAtomicDB
    });
  }, [state.riskData, tab, setState, state.l1, fmeaId, useAtomicDB]);

  // 탭에 따라 표시할 단계 결정
  const getVisibleSteps = () => {
    switch (tab) {
      case 'eval-structure': return [2];
      case 'eval-function': return [3];
      case 'eval-failure': return [4];
      case 'risk': return [5];
      case 'opt': return [6];
      case 'all': return [2, 3, 4, 5, 6];
      default: return [2, 3, 4, 5, 6];
    }
  };

  // visibleSteps: props 우선, 없으면 state, 그래도 없으면 기본값
  const visibleSteps = propsVisibleSteps || (tab === 'all' ? (state.visibleSteps || [2, 3, 4, 5, 6]) : getVisibleSteps());
  
  // 고장연결 데이터
  const failureLinks = (state as any).failureLinks || [];
  
  // ★★★ 전체보기(all) 탭: 원자성 DB 기반 렌더링 (우선) ★★★
  if (tab === 'all' && fmeaId && useAtomicDB) {
    console.log('🔷 AllTabRenderer: 원자성 DB 모드 사용');
    return (
      <AllTabAtomic
        fmeaId={fmeaId}
        visibleSteps={visibleSteps}
      />
    );
  }
  
  // 레거시: 고장연결 결과 기반 40열 테이블 (state 기반)
  if (tab === 'all' && failureLinks.length > 0) {
    console.log('🔶 AllTabRenderer: 레거시 모드 사용 (state.failureLinks)');
    return (
      <AllTabWithLinks
        state={state}
        setState={setState}
        failureLinks={failureLinks}
        visibleSteps={visibleSteps}
      />
    );
  }

  // 기본 테이블 렌더링
  return (
    <AllTabBasic
      rows={rows}
      state={state}
      setState={setState}
      l1Spans={l1Spans}
      l1TypeSpans={l1TypeSpans}
      l1FuncSpans={l1FuncSpans}
      l2Spans={l2Spans}
      visibleSteps={visibleSteps}
      onAPClick={onAPClick}
    />
  );
}
