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
  setDirty?: React.Dispatch<React.SetStateAction<boolean>>;  // ✅ DB 저장 트리거용
  visibleSteps?: number[];
  fmeaId?: string;
  showRPN?: boolean; // RPN 표시 여부 (기본: false)
  // ★★★ 2026-01-12: 트리뷰 패널 전환 핸들러 추가 ★★★
  onOpen5AP?: () => void;
  onOpen6AP?: () => void;
  onOpenRPN?: () => void;
  activePanelId?: string; // 현재 활성 패널 ID
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
  setDirty,
  visibleSteps: propsVisibleSteps,
  fmeaId,
  showRPN = false,
  // ★★★ 2026-01-12: 트리뷰 패널 전환 핸들러 ★★★
  onOpen5AP,
  onOpen6AP,
  onOpenRPN,
  activePanelId,
}: AllTabRendererProps) {
  
  console.log('🔵 AllTabRenderer: 새로운 35컬럼 화면 렌더링', {
    tab,
    fmeaId,
    showRPN,
    stateL1Name: state.l1?.name,
  });

  // visibleSteps를 단계명으로 변환
  // ✅ 2026-01-12: visibleSteps가 객체일 수도 있으므로 배열로 정규화
  let visibleStepsNumbers: number[] = [2, 3, 4, 5, 6]; // 기본값
  
  if (propsVisibleSteps) {
    // props가 배열이면 그대로 사용
    visibleStepsNumbers = Array.isArray(propsVisibleSteps) ? propsVisibleSteps : [2, 3, 4, 5, 6];
  } else if (state.visibleSteps) {
    // state.visibleSteps가 배열이면 그대로, 객체면 배열로 변환
    if (Array.isArray(state.visibleSteps)) {
      visibleStepsNumbers = state.visibleSteps;
    } else if (typeof state.visibleSteps === 'object') {
      // { step2: true, step3: true, ... } 형태를 [2, 3, ...] 배열로 변환
      visibleStepsNumbers = [2, 3, 4, 5, 6].filter(step => {
        const key = `step${step}` as keyof typeof state.visibleSteps;
        return (state.visibleSteps as any)?.[key] !== false;
      });
    }
  }
  
  const stepNameMap: Record<number, string> = {
    2: '구조분석',
    3: '기능분석',
    4: '고장분석',
    5: '리스크분석',
    6: '최적화',
  };
  const visibleStepNames = visibleStepsNumbers.map(num => stepNameMap[num] || '').filter(Boolean);

  // ★ 완제품명 (L1)
  const l1ProductName = state.l1?.name || '';
  
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

  // ★ FC 역전개를 위한 맵 생성 (state.l2에서)
  // fcId → { workFunction, processChar, m4, workElem } 매핑
  const fcToL3Map = new Map<string, { workFunction: string; processChar: string; m4: string; workElem: string }>();
  const fcToTextMap = new Map<string, string>();  // ★ fcId → cause 텍스트 매핑
  
  (state.l2 || []).forEach((proc: any) => {
    // ★ 먼저 모든 failureCauses의 cause 텍스트 수집
    (proc.failureCauses || []).forEach((fc: any) => {
      if (fc.id) {
        // cause 또는 name 필드에서 고장원인 텍스트 가져오기
        const causeText = fc.cause || fc.name || '';
        if (causeText) {
          fcToTextMap.set(fc.id, causeText);
        }
      }
    });
    
    (proc.l3 || []).forEach((we: any) => {
      // ★★★ 핵심: 4M과 작업요소명 저장 ★★★
      const m4 = we.m4 || we.category || '';
      const workElem = we.name || we.element || '';
      
      (we.functions || []).forEach((fn: any) => {
        (fn.processChars || []).forEach((pc: any) => {
          // 이 공정특성에 연결된 고장원인들 찾기
          (proc.failureCauses || []).forEach((fc: any) => {
            if (fc.processCharId === pc.id) {
              fcToL3Map.set(fc.id, {
                workFunction: fn.name || '',
                processChar: pc.name || '',
                m4,        // ★ 4M 추가
                workElem,  // ★ 작업요소 추가
              });
            }
          });
        });
      });
    });
  });
  
  console.log('🟠 fcToTextMap:', { count: fcToTextMap.size, sample: Array.from(fcToTextMap.entries()).slice(0, 3) });
  console.log('🟠 fcToL3Map (with 4M, workElem):', { count: fcToL3Map.size, sample: Array.from(fcToL3Map.entries()).slice(0, 3) });

  // ★ FM 역전개를 위한 맵 생성 (state.l2에서)
  // fmId → { processFunction, productChar } 매핑
  const fmToL2Map = new Map<string, { processFunction: string; productChar: string; processNo: string; processName: string }>();
  const fmToTextMap = new Map<string, string>();  // ★ fmId → mode 텍스트 매핑
  
  (state.l2 || []).forEach((proc: any) => {
    if (!proc.name) return;
    
    // ★ 먼저 모든 failureModes의 mode 텍스트 수집
    (proc.failureModes || []).forEach((fm: any) => {
      if (fm.id) {
        const modeText = fm.mode || fm.name || '';
        if (modeText) {
          fmToTextMap.set(fm.id, modeText);
        }
      }
    });
    
    (proc.failureModes || []).forEach((fm: any) => {
      if (!fm.id) return;
      
      // productCharId로 제품특성 → 공정기능 역추적
      let processFunction = '';
      let productChar = '';
      
      if (fm.productCharId) {
        (proc.functions || []).forEach((fn: any) => {
          (fn.productChars || []).forEach((pc: any) => {
            if (pc.id === fm.productCharId) {
              processFunction = fn.name || '';
              productChar = pc.name || '';
            }
          });
        });
      }
      // fallback: 첫 번째 function과 productChar 사용
      if (!processFunction && (proc.functions || []).length > 0) {
        const firstFunc = proc.functions[0];
        processFunction = firstFunc.name || '';
        if ((firstFunc.productChars || []).length > 0) {
          productChar = firstFunc.productChars[0].name || '';
        }
      }
      
      fmToL2Map.set(fm.id, {
        processFunction,
        productChar,
        processNo: proc.no || '',
        processName: proc.name || '',
      });
    });
  });
  
  // ★ FE 텍스트 매핑 (failureScopes에서)
  const feToTextMap = new Map<string, { text: string; severity: number }>();
  failureScopes.forEach((fs: any) => {
    if (fs.id) {
      feToTextMap.set(fs.id, {
        text: fs.effect || fs.name || '',
        severity: fs.severity || 0,
      });
    }
  });
  
  console.log('🟠 fmToTextMap:', { count: fmToTextMap.size });
  console.log('🟠 feToTextMap:', { count: feToTextMap.size });

  // ★ 고장연결 데이터 추출 (state.failureLinks에서) + 기능분석 역전개
  const rawFailureLinks = (state as any).failureLinks || [];
  const failureLinks = rawFailureLinks.map((link: any) => {
    const feId = link.feId || '';
    const feText = link.feText || link.cache?.feText || '';
    const fmId = link.fmId || '';
    
    // ★ FE 역전개: 1순위 - link에 저장된 역전개 정보 사용
    let feCategory = link.feScope || '';
    let feFunctionName = link.feFunctionName || '';
    let feRequirement = link.feRequirement || '';
    
    // ★ FE 역전개: 2순위 - reqId 역추적
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
    
    // ★ FE 역전개: 3순위 - failureScope에서 직접 찾기
    if (!feCategory) {
      const scope = failureScopes.find((fs: any) => fs.id === feId || fs.effect === feText);
      if (scope) {
        feCategory = scope.scope || '';
        feRequirement = scope.requirement || '';
      }
    }
    
    // ★ FM 역전개: state.l2에서 공정기능, 제품특성 찾기
    const fmL2Data = fmToL2Map.get(fmId);
    const fmProcessFunction = fmL2Data?.processFunction || '';
    const fmProductChar = fmL2Data?.productChar || '';
    const fmProcessNo = fmL2Data?.processNo || '';
    const fmProcessName = fmL2Data?.processName || link.fmProcess || '';
    
    // ★ DB에서 텍스트 조회 (fallback)
    const dbFmText = fmToTextMap.get(fmId) || '';
    const dbFeData = feToTextMap.get(feId);
    const dbFcText = fcToTextMap.get(link.fcId || '') || '';
    
    // ★★★ 2026-01-12: fmText fallback 강화 - 최대한 텍스트 추출 ★★★
    let finalFmText = link.fmText || link.cache?.fmText || dbFmText || '';
    
    // ★ fallback: fmText가 비어있으면 fmId에서 추출 시도
    if (!finalFmText && fmId) {
      // state.l2에서 해당 fmId의 mode 검색
      (state.l2 || []).forEach((proc: any) => {
        (proc.failureModes || []).forEach((fm: any) => {
          if (fm.id === fmId) {
            finalFmText = fm.mode || fm.name || fm.failure || fmId;
          }
        });
      });
    }
    
    // ★ 최후의 fallback: fmId 자체를 표시
    if (!finalFmText) {
      finalFmText = fmId || '(고장형태 없음)';
    }
    
    return {
      fmId,
      // ★ fmText: 1순위 link, 2순위 cache, 3순위 DB 조회, 4순위 state.l2 검색, 5순위 fmId
      fmText: finalFmText,
      // ★ L1 역전개 데이터 (완제품명)
      l1ProductName,     // ★ 완제품 공정명
      fmProcessNo,       // ★ 공정번호
      fmProcessName,     // ★ 공정명
      fmProcessFunction, // ★ 공정기능 (역전개)
      fmProductChar,     // ★ 제품특성 (역전개)
      feId,
      // ★ feText: 1순위 link, 2순위 cache, 3순위 DB 조회
      feText: feText || dbFeData?.text || '',
      // ★ 심각도: 1순위 link, 2순위 cache, 3순위 DB 조회
      feSeverity: (() => {
        const sev = link.severity || link.feSeverity || link.cache?.feSeverity || dbFeData?.severity || 0;
        if (sev > 0) console.log(`🔴 심각도 발견: ${sev} (feId=${feId})`);
        return sev;
      })(),
      fcId: link.fcId || '',
      // ★ fcText: 1순위 link, 2순위 cache, 3순위 DB 조회
      fcText: link.fcText || link.cache?.fcText || dbFcText,
      // ★ FE 역전개 데이터
      feCategory,        // 구분 (Your Plant / Ship to Plant / User)
      feFunctionName,    // 완제품기능
      feRequirement,     // 요구사항
      // ★ FC 역전개 데이터 (고장원인 → 3L 기능분석)
      fcWorkFunction: link.fcWorkFunction || fcToL3Map.get(link.fcId || '')?.workFunction || '',  // 작업요소 기능
      fcProcessChar: link.fcProcessChar || fcToL3Map.get(link.fcId || '')?.processChar || '',    // 공정특성
      // ★★★ FC 역전개 데이터 (고장원인 → 2L 구조분석) - fcToL3Map에서 fallback ★★★
      fcM4: link.fcM4 || fcToL3Map.get(link.fcId || '')?.m4 || '',          // 4M
      fcWorkElem: link.fcWorkElem || fcToL3Map.get(link.fcId || '')?.workElem || '',  // 작업요소
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
      state={state}
      setState={setState}
      setDirty={setDirty}
      // ★★★ 2026-01-12: 트리뷰 패널 전환 핸들러 ★★★
      onOpen5AP={onOpen5AP}
      onOpen6AP={onOpen6AP}
      onOpenRPN={onOpenRPN}
      activePanelId={activePanelId}
    />
  );
}
