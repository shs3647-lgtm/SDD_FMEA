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

// L1 트리 구조
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

// L2 메인공정 기능/특성
export interface L2ProductChar extends AtomicUnit {}
export interface L2Function extends AtomicUnit {
  productChars: L2ProductChar[];
}

// L3 작업요소 기능/특성
export interface L3ProcessChar extends AtomicUnit {}
export interface L3Function extends AtomicUnit {
  processChars: L3ProcessChar[];
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
}

export interface L1Data {
  id: string;
  name: string;
  types: L1Type[]; 
  failureEffect?: string; // 나중에 Atomic 연계 예정
  severity?: number;
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

export const TABS = [
  { id: 'structure', label: '구조분석', step: 2 },
  { id: 'function-l1', label: '1L 완제품 기능', step: 3 },
  { id: 'function-l2', label: '2L 메인공정 기능', step: 3 },
  { id: 'function-l3', label: '3L 작업요소 기능', step: 3 },
  { id: 'failure', label: '고장분석', step: 4 },
  { id: 'risk', label: '리스크분석', step: 5 },
  { id: 'opt', label: '최적화', step: 6 },
  { id: 'doc', label: '문서화', step: 7 },
] as const;

export const ALL_VIEW_TAB = { id: 'all', label: '전체보기' } as const;

export const LEVELS = [
  { id: '1', label: '1L' }, { id: '2', label: '2L' }, { id: '3', label: '3L' }, { id: 'all', label: 'All' },
] as const;

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
