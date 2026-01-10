/**
 * @file AllTabRenderer.tsx
 * @description 전체보기 탭 렌더러 (35컬럼 기본화면)
 * @updated 2026-01-10 - 화면정의서 v2.2 기준 3색 시스템 적용
 * 
 * ★★★ 새로운 ALL 화면 ★★★
 * - 기본화면: 35컬럼 (RPN 제외)
 * - 옵션화면: 37컬럼 (RPN 포함)
 * - 2행 분류 기준 3색 시스템 (구조/기능/고장분석)
 */

'use client';

import React from 'react';
import { WorksheetState } from '../../constants';
import AllTabEmpty from './AllTabEmpty';

interface AllTabRendererProps {
  tab: string;
  state: WorksheetState;
  setState?: React.Dispatch<React.SetStateAction<WorksheetState>>;
  visibleSteps?: number[];
  fmeaId?: string;
  showRPN?: boolean; // RPN 표시 여부 (기본: false)
  // 레거시 props (호환성 유지용)
  rows?: any[];
  l1Spans?: number[];
  l1TypeSpans?: number[];
  l1FuncSpans?: number[];
  l2Spans?: number[];
  onAPClick?: () => void;
  useAtomicDB?: boolean;
}

export default function AllTabRenderer({ 
  tab,
  state,
  setState,
  visibleSteps: propsVisibleSteps,
  fmeaId,
  showRPN = false,
}: AllTabRendererProps) {
  
  console.log('🔵 AllTabRenderer: 새로운 35컬럼 화면 렌더링', {
    tab,
    fmeaId,
    showRPN,
    stateL1Name: state.l1?.name,
  });

  // visibleSteps를 단계명으로 변환
  const visibleStepsNumbers = propsVisibleSteps || state.visibleSteps || [2, 3, 4, 5, 6];
  const stepNameMap: Record<number, string> = {
    2: '구조분석',
    3: '기능분석',
    4: '고장분석',
    5: '리스크분석',
    6: '최적화',
  };
  const visibleStepNames = visibleStepsNumbers.map(num => stepNameMap[num] || '').filter(Boolean);

  // ★★★ 새로운 ALL 화면: AllTabEmpty 사용 ★★★
  // 사이드바, 제목, 메인메뉴, 탭 메뉴는 상위 컴포넌트에서 유지
  // 워크시트 영역만 새로운 시트로 대체
  return (
    <AllTabEmpty 
      rowCount={30} 
      showRPN={showRPN}
      visibleSteps={visibleStepNames}
    />
  );
}
