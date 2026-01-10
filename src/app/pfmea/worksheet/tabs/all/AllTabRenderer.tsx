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

  // ★ 고장영향(FE) → 기능분석 역전개를 위한 맵 생성
  // failureScope.reqId → 요구사항 → 기능 → 구분 역추적
  const l1Types = state.l1?.types || [];
  const failureScopes = (state.l1 as any)?.failureScopes || [];
  
  // reqId → { category, functionName, requirement } 매핑
  const reqToFuncMap = new Map<string, { category: string; functionName: string; requirement: string }>();
  // feId/feText → reqId 매핑
  const feToReqMap = new Map<string, string>();
  
  // 1. 요구사항 → 기능 → 구분 맵 생성
  l1Types.forEach((type: any) => {
    const category = type.name || '';
    (type.functions || []).forEach((func: any) => {
      const functionName = func.name || '';
      (func.requirements || []).forEach((req: any) => {
        if (req.id) {
          reqToFuncMap.set(req.id, { category, functionName, requirement: req.name || '' });
        }
      });
    });
  });
  
  // 2. failureScope → reqId 맵 생성
  failureScopes.forEach((fs: any) => {
    if (fs.id && fs.reqId) {
      feToReqMap.set(fs.id, fs.reqId);
    }
    // 텍스트로도 매핑 (fallback)
    if (fs.effect) {
      feToReqMap.set(fs.effect, fs.reqId || '');
    }
  });

  // ★ 고장연결 데이터 추출 (state.failureLinks에서) + 기능분석 역전개
  const rawFailureLinks = (state as any).failureLinks || [];
  const failureLinks = rawFailureLinks.map((link: any) => {
    const feId = link.feId || '';
    const feText = link.feText || link.cache?.feText || '';
    
    // ★ 1순위: link에 저장된 역전개 정보 사용 (confirmLink에서 저장)
    let feCategory = link.feScope || '';
    let feFunctionName = link.feFunctionName || '';
    let feRequirement = link.feRequirement || '';
    
    // ★ 2순위: 없으면 reqId 역추적
    if (!feFunctionName) {
      const reqId = feToReqMap.get(feId) || feToReqMap.get(feText) || '';
      if (reqId) {
        const funcData = reqToFuncMap.get(reqId);
        if (funcData) {
          if (!feCategory) feCategory = funcData.category;
          feFunctionName = funcData.functionName;
          feRequirement = funcData.requirement;
        }
      }
    }
    
    // ★ 3순위: failureScope에서 직접 찾기
    if (!feCategory) {
      const scope = failureScopes.find((fs: any) => fs.id === feId || fs.effect === feText);
      if (scope) {
        feCategory = scope.scope || '';
        feRequirement = scope.requirement || '';
      }
    }
    
    return {
      fmId: link.fmId || '',
      fmText: link.fmText || link.cache?.fmText || '',
      feId,
      feText,
      // ★ 심각도: severity 또는 feSeverity 둘 다 확인
      feSeverity: link.severity || link.feSeverity || link.cache?.feSeverity || 0,
      fcId: link.fcId || '',
      fcText: link.fcText || link.cache?.fcText || '',
      // ★ 역전개 데이터
      feCategory,        // 구분 (Your Plant / Ship to Plant / User)
      feFunctionName,    // 완제품기능
      feRequirement,     // 요구사항
    };
  });
  
  console.log('🔵 AllTabRenderer: 고장연결 데이터 (역전개 포함)', { 
    count: failureLinks.length,
    sample: failureLinks[0] || null,
  });

  // ★★★ 새로운 ALL 화면: AllTabEmpty 사용 ★★★
  // 사이드바, 제목, 메인메뉴, 탭 메뉴는 상위 컴포넌트에서 유지
  // 워크시트 영역만 새로운 시트로 대체
  return (
    <AllTabEmpty 
      rowCount={30} 
      showRPN={showRPN}
      visibleSteps={visibleStepNames}
      failureLinks={failureLinks}
    />
  );
}
