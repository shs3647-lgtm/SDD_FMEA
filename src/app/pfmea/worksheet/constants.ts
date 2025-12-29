/**
 * @file constants.ts
 * @description FMEA 워크시트 상수 정의 (데이터 원자성 강화 버전)
 */

// ============ 원자적 데이터 유닛 (Atomic Units) ============

export interface AtomicUnit {
  id: string;
  name: string;
  description?: string;
}

// L1 트리 구조 (기능분석)
export interface L1Requirement extends AtomicUnit {
  failureEffect?: string;
  severity?: number;
}
export interface L1Function extends AtomicUnit {
  requirements: L1Requirement[];
}
export interface L1Type extends AtomicUnit {
  functions: L1Function[];
}

// L1 고장분석 구조
export interface L1FailureEffect extends AtomicUnit {
  severity?: number;
}
// 1L 고장영향 데이터 구조 (요구사항 -> 구분 -> 고장영향 -> 심각도)
export interface L1FailureScope extends AtomicUnit {
  requirement?: string; // 연결된 요구사항
  scope?: string; // Your Plant / Ship to Plant / User
  effect?: string; // 고장영향 내용
  severity?: number; // 심각도
  effects?: L1FailureEffect[]; // 하위호환용 (deprecated)
}

// L2 메인공정 기능/특성
export interface L2ProductChar extends AtomicUnit {
  specialChar?: string;
}
export interface L2Function extends AtomicUnit {
  productChars: L2ProductChar[];
}

// L2 고장분석 구조
export interface L2FailureMode extends AtomicUnit {
  sc?: boolean; // 특별특성
}

// L3 작업요소 기능/특성
export interface L3ProcessChar extends AtomicUnit {
  specialChar?: string;
}
export interface L3Function extends AtomicUnit {
  processChars: L3ProcessChar[];
}

// L3 고장분석 구조
export interface L3FailureCause extends AtomicUnit {
  occurrence?: number; // 발생도
}

// ============ 구조 요소 (Structure Elements) ============

export interface WorkElement {
  id: string;
  m4: string;
  name: string;
  order: number;
  // 원자적 기능 정의 (각 기능에 공정특성 포함)
  functions: L3Function[];
  processChars?: L3ProcessChar[]; // 하위호환용 (deprecated, 기능별로 관리)
  failureCause?: string; // 나중에 Atomic 연계 예정
  // 고장분석: 원자적 고장원인 배열
  failureCauses?: L3FailureCause[];
}

export interface Process {
  id: string;
  no: string;
  name: string;
  order: number;
  l3: WorkElement[];
  // 원자적 기능 정의 (각 기능에 제품특성 포함)
  functions: L2Function[];
  productChars?: L2ProductChar[]; // 하위호환용 (deprecated, 기능별로 관리)
  failureMode?: string; // 나중에 Atomic 연계 예정
  // 고장분석: 원자적 고장형태 배열
  failureModes?: L2FailureMode[];
}

export interface L1Data {
  id: string;
  name: string;
  types: L1Type[]; 
  failureEffect?: string; // 나중에 Atomic 연계 예정
  severity?: number;
  // 고장분석: 원자적 고장영향 스코프/효과 배열
  failureScopes?: L1FailureScope[];
}

// ============ 워크시트 상태 ============

export interface WorksheetState {
  l1: L1Data;
  l2: Process[];
  selected: { type: 'L1' | 'L2' | 'L3'; id: string | null };
  tab: string;
  levelView: string;
  search: string;
  visibleSteps: number[];
  // 확정 상태
  structureConfirmed?: boolean;
  l1Confirmed?: boolean;
  l2Confirmed?: boolean;
  l3Confirmed?: boolean;
  // 고장분석 확정 상태
  failureL1Confirmed?: boolean;
  failureL2Confirmed?: boolean;
  failureL3Confirmed?: boolean;
}

export interface FlatRow {
  l1Id: string;
  l1Name: string;
  l1TypeId: string;
  l1Type: string;
  l1FunctionId: string;
  l1Function: string;
  l1RequirementId: string;
  l1Requirement: string;
  l1FailureEffect: string;
  l1Severity: string;
  l2Id: string;
  l2No: string;
  l2Name: string;
  l2Functions: L2Function[];
  l2ProductChars: L2ProductChar[];
  l2FailureMode: string;
  l3Id: string;
  m4: string;
  l3Name: string;
  l3Functions: L3Function[];
  l3ProcessChars: L3ProcessChar[];
  l3FailureCause: string;
}

export interface FMEAProject {
  id: string;
  fmeaInfo?: { subject?: string };
  project?: { productName?: string };
}

// ============ 색상 및 설정 ============
export const COLORS = {
  blue: '#2b78c5', blue2: '#1f63aa', sky: '#bfe0ff', sky2: '#d7ecff', line: '#6f8fb4',
  bg: '#f5f7fb', warn: '#ffe1e1', text: '#0e223a', navy: '#1a237e',
  mn: { bg: '#eef7ff', border: '#cfe0f4', color: '#1f4f86' },
  mc: { bg: '#fff3e6', border: '#ffd2a6', color: '#8a4f00' },
  im: { bg: '#f0fff2', border: '#bdeac5', color: '#1b6b2a' },
  en: { bg: '#fef0ff', border: '#f0bdf5', color: '#7a1a88' },
} as const;

// 분석 탭 (Analysis) - 개별 단계별 분석
export const ANALYSIS_TABS = [
  { id: 'structure', label: '구조분석', step: 2 },
  { id: 'function-l1', label: '1L 완제품 기능', step: 3 },
  { id: 'function-l2', label: '2L 메인공정 기능', step: 3 },
  { id: 'function-l3', label: '3L 작업요소 기능', step: 3 },
  { id: 'failure-l1', label: '1L 고장영향', step: 4 },
  { id: 'failure-l2', label: '2L 고장형태', step: 4 },
  { id: 'failure-l3', label: '3L 고장원인', step: 4 },
  { id: 'failure-link', label: '고장연결', step: 4 },
] as const;

// 평가 탭 (Evaluation) - 전체 40열 화면
export const EVALUATION_TABS = [
  { id: 'eval-structure', label: '구조분석', step: 2 },
  { id: 'eval-function', label: '기능분석', step: 3 },
  { id: 'eval-failure', label: '고장분석', step: 4 },
  { id: 'risk', label: '리스크분석', step: 5 },
  { id: 'opt', label: '최적화', step: 6 },
] as const;

// 전체 탭 (하위 호환)
export const TABS = [...ANALYSIS_TABS, ...EVALUATION_TABS.filter(t => t.id === 'risk' || t.id === 'opt')] as const;

export const ALL_VIEW_TAB = { id: 'all', label: '전체보기' } as const;

// LEVELS는 더 이상 사용하지 않음 (삭제됨)
export const LEVELS = [] as const;

export const uid = () => 'id_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16);

export const getTabLabel = (tabId: string): string => TABS.find(t => t.id === tabId)?.label || tabId;
export const getTabStep = (tabId: string): number => TABS.find(t => t.id === tabId)?.step || 0;

export const createInitialState = (): WorksheetState => ({
  l1: { id: uid(), name: '', types: [], failureEffect: '', severity: undefined },
  l2: [{ 
    id: uid(), no: '', name: '(클릭하여 공정 선택)', order: 10, 
    functions: [], productChars: [],
    l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10, functions: [], processChars: [] }] 
  }],
  selected: { type: 'L2', id: null }, tab: 'structure', levelView: '2', search: '', visibleSteps: [2, 3, 4, 5, 6]
});

export const get4MBadgeStyle = (m4: string) => {
  const colorMap: any = { MN: COLORS.mn, MC: COLORS.mc, IM: COLORS.im, EN: COLORS.en };
  return colorMap[m4] || { bg: '#f5f5f5', border: '#ddd', color: '#666' };
};
