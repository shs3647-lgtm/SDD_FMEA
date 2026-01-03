/**
 * @file level-colors.ts
 * @description 레벨별 표준 색상 정의 (1L~3L 기능/고장 분석용)
 * 
 * 워크시트와 트리뷰에서 동일한 색상을 사용
 */

// ============ 1L 구분(Type) 색상 - Your Plant / Ship to Plant / User ============
// 약어: YP, SP, User
export const L1_TYPE_COLORS: Record<string, { bg: string; light: string; text: string; border: string; short: string }> = {
  'Your Plant': { 
    bg: '#7b1fa2',      // 보라색
    light: '#e1bee7', 
    text: '#4a148c',
    border: '#7b1fa2',
    short: 'YP'
  },
  'Ship to Plant': { 
    bg: '#f57c00',      // 주황색
    light: '#ffe0b2', 
    text: '#e65100',
    border: '#f57c00',
    short: 'SP'
  },
  'User': { 
    bg: '#388e3c',      // 녹색
    light: '#c8e6c9', 
    text: '#1b5e20',
    border: '#388e3c',
    short: 'User'
  },
};

export const getL1TypeColor = (typeName: string) => 
  L1_TYPE_COLORS[typeName] || { bg: '#1976d2', light: '#bbdefb', text: '#0d47a1', border: '#1976d2', short: typeName };

// ============ 레벨별 헤더/배경 색상 ============

// 구조분석 (2단계) - 파란색 계열
export const STRUCTURE_COLORS = {
  header: '#1976d2',
  headerLight: '#42a5f5',
  cell: '#e3f2fd',
  cellAlt: '#bbdefb',
  text: '#0d47a1',
};

// 기능분석 (3단계) - 녹색 계열
export const FUNCTION_COLORS = {
  // 1L 완제품
  l1Header: '#1b5e20',
  l1Cell: '#e8f5e9',
  // 2L 메인공정
  l2Header: '#2e7d32',
  l2Cell: '#e8f5e9',
  // 3L 작업요소
  l3Header: '#388e3c',
  l3Cell: '#e8f5e9',
  // 공통
  text: '#1b5e20',
};

// 고장분석 (4단계) - 주황/남색 계열
export const FAILURE_COLORS = {
  // 1L 고장영향 (FE)
  l1Header: '#1a237e',
  l1Cell: '#f5f6fc',
  // 2L 고장형태 (FM)
  l2Header: '#e65100',
  l2Cell: '#fff3e0',
  // 3L 고장원인 (FC)
  l3Header: '#e65100',
  l3Cell: '#fff3e0',
  // 공통
  text: '#1a237e',
};

// ============ Tailwind 클래스 버전 ============
export const L1_TYPE_TW: Record<string, { bg: string; light: string; text: string; border: string }> = {
  'Your Plant': { 
    bg: 'bg-purple-700',
    light: 'bg-purple-100', 
    text: 'text-purple-900',
    border: 'border-purple-700'
  },
  'Ship to Plant': { 
    bg: 'bg-orange-600',
    light: 'bg-orange-100', 
    text: 'text-orange-900',
    border: 'border-orange-600'
  },
  'User': { 
    bg: 'bg-green-700',
    light: 'bg-green-100', 
    text: 'text-green-900',
    border: 'border-green-700'
  },
};

export const getL1TypeTw = (typeName: string) => 
  L1_TYPE_TW[typeName] || { bg: 'bg-blue-600', light: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-600' };

// ============ 트리뷰 표준 색상 (공정명/기능/고장) ============

// 구조분석 - 검정 글씨
export const TREE_STRUCTURE = {
  procBg: '#546e7a',        // 공정명 배경 (청회색)
  procText: '#ffffff',      // 공정명 글씨 (흰색)
  itemBg: '#eceff1',        // 하위 아이템 배경 (연회색)
  itemText: '#263238',      // 하위 아이템 글씨 (검정)
  border: '#546e7a',
};

// 기능분석 - 녹색 글씨
export const TREE_FUNCTION = {
  procBg: '#2e7d32',        // 공정명 배경 (녹색)
  procText: '#ffffff',      // 공정명 글씨 (흰색)
  itemBg: '#c8e6c9',        // 하위 아이템 배경 (연녹색)
  itemText: '#1b5e20',      // 하위 아이템 글씨 (진녹색)
  border: '#2e7d32',
};

// 고장분석 - 주황색 글씨
export const TREE_FAILURE = {
  procBg: '#e65100',        // 공정명 배경 (주황색)
  procText: '#ffffff',      // 공정명 글씨 (흰색)
  itemBg: '#ffe0b2',        // 하위 아이템 배경 (연주황색)
  itemText: '#e65100',      // 하위 아이템 글씨 (주황색)
  border: '#e65100',
};

