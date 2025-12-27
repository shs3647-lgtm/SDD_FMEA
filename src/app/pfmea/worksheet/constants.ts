/**
 * @file constants.ts
 * @description FMEA 워크시트 상수 정의
 * @author AI Assistant
 * @created 2025-12-27
 */

// ============ 타입 정의 ============
export interface WorkElement {
  id: string;
  m4: string;
  name: string;
  order: number;
  function?: string;
  processChar?: string;
  failureCause?: string;
}

export interface Process {
  id: string;
  no: string;
  name: string;
  order: number;
  l3: WorkElement[];
  function?: string;
  productChar?: string;
  failureMode?: string;
}

export interface L1Data {
  id: string;
  name: string;
  function?: string;
  requirement?: string;
  failureEffect?: string;
  severity?: number;
}

export interface WorksheetState {
  l1: L1Data;
  l2: Process[];
  selected: { type: 'L1' | 'L2' | 'L3'; id: string | null };
  tab: string;
  levelView: string;
  search: string;
}

export interface FMEAProject {
  id: string;
  fmeaInfo?: {
    subject?: string;
  };
  project?: {
    productName?: string;
  };
}

// ============ 색상 정의 ============
export const COLORS = {
  blue: '#2b78c5',
  blue2: '#1f63aa',
  sky: '#bfe0ff',
  sky2: '#d7ecff',
  line: '#6f8fb4',
  bg: '#f5f7fb',
  warn: '#ffe1e1',
  text: '#0e223a',
  navy: '#1a237e',
  // 4M 배지 색상
  mn: { bg: '#eef7ff', border: '#cfe0f4', color: '#1f4f86' },
  mc: { bg: '#fff3e6', border: '#ffd2a6', color: '#8a4f00' },
  im: { bg: '#f0fff2', border: '#bdeac5', color: '#1b6b2a' },
  en: { bg: '#fef0ff', border: '#f0bdf5', color: '#7a1a88' },
} as const;

// ============ 탭 정의 ============
export const TABS = [
  { id: 'structure', label: '구조분석', step: 2 },
  { id: 'function', label: '기능분석', step: 3 },
  { id: 'failure', label: '고장분석', step: 4 },
  { id: 'risk', label: '리스크분석', step: 5 },
  { id: 'opt', label: '최적화', step: 6 },
  { id: 'doc', label: '문서화', step: 7 },
] as const;

export const ALL_VIEW_TAB = { id: 'all', label: '전체보기' } as const;

export const LEVELS = [
  { id: '1', label: '1L' },
  { id: '2', label: '2L' },
  { id: '3', label: '3L' },
  { id: 'all', label: 'All' },
] as const;

// ============ 유틸리티 함수 ============
export const uid = () => 'id_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16);

export const getTabLabel = (tabId: string): string => {
  const tab = TABS.find(t => t.id === tabId);
  return tab?.label || tabId;
};

export const getTabStep = (tabId: string): number => {
  const tab = TABS.find(t => t.id === tabId);
  return tab?.step || 0;
};

// ============ 초기 데이터 ============
export const createInitialState = (): WorksheetState => ({
  l1: { 
    id: uid(), 
    name: '', 
    function: '', 
    requirement: '', 
    failureEffect: '', 
    severity: undefined 
  },
  l2: [{
    id: uid(),
    no: '',
    name: '(클릭하여 공정 선택)',
    order: 10,
    l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10 }]
  }],
  selected: { type: 'L2', id: null },
  tab: 'structure',
  levelView: '2',
  search: ''
});

// ============ 4M 배지 스타일 ============
export const get4MBadgeStyle = (m4: string) => {
  const colorMap: Record<string, { bg: string; border: string; color: string }> = {
    MN: COLORS.mn,
    MC: COLORS.mc,
    IM: COLORS.im,
    EN: COLORS.en,
  };
  return colorMap[m4] || { bg: '#f5f5f5', border: '#ddd', color: '#666' };
};

