/**
 * @file types.ts
 * @description PFMEA Import 타입 정의
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 2단계 프로세스로 변경
 * 
 * 프로세스:
 * Step 1: Excel Import → Flat 데이터 저장
 * Step 2: 워크시트 팝업 → 상위-하위 관계 지정 → 관계형 DB 완성
 */

/** 공통 기초정보 아이템 */
export interface CommonItem {
  id: string;
  category: 'MN' | 'EN' | 'IM';  // Man, Environment, Indirect Material
  name: string;
  description?: string;
}

/** Import된 Flat 데이터 (Step 1) */
export interface ImportedFlatData {
  id: string;
  processNo: string;
  category: 'A' | 'B' | 'C';
  itemCode: string;  // A1, A2, A3, A4, A5, A6, B1, B2, B3, B4, B5, C1, C2, C3, C4
  value: string;
  createdAt: Date;
}

/** 공정 마스터 */
export interface ProcessMaster {
  processNo: string;
  processName: string;
  processDesc?: string;
}

/** 관계 매핑 (Step 2에서 사용자가 지정) */
export interface RelationMapping {
  id: string;
  processNo: string;
  
  // 상위 아이템
  parentItemCode: string;  // A4, B1, C1 등
  parentItemId: string;
  parentValue: string;
  
  // 하위 아이템
  childItemCode: string;   // A5, B3, C2 등
  childItemId: string;
  childValue: string;
  
  createdAt: Date;
  createdBy: string;
}

/** 관계 지정 팝업용 아이템 */
export interface RelationItem {
  id: string;
  code: string;
  value: string;
  selected: boolean;
}

/** 관계 지정 팝업 상태 */
export interface RelationMappingState {
  processNo: string;
  processName: string;
  
  // 선택 가능한 상위 아이템들
  parentItems: RelationItem[];
  parentCode: string;
  
  // 선택 가능한 하위 아이템들
  childItems: RelationItem[];
  childCode: string;
  
  // 이미 연결된 관계
  existingMappings: RelationMapping[];
}

/** Import 통계 */
export interface ImportStats {
  totalItems: number;
  byCategory: {
    A: number;
    B: number;
    C: number;
  };
  byItemCode: Record<string, number>;
  processCount: number;
}

/** 관계 지정 가능한 쌍 정의 */
export const RELATION_PAIRS = [
  // A 레벨: 제품특성 → 고장형태
  { parent: 'A4', child: 'A5', label: '제품특성 → 고장형태' },
  { parent: 'A5', child: 'A6', label: '고장형태 → 검출관리' },
  
  // B 레벨: 작업요소 → 요소기능 → 공정특성 → 고장원인 → 예방관리
  { parent: 'B1', child: 'B2', label: '작업요소 → 요소기능' },
  { parent: 'B2', child: 'B3', label: '요소기능 → 공정특성' },
  { parent: 'B3', child: 'B4', label: '공정특성 → 고장원인' },
  { parent: 'B4', child: 'B5', label: '고장원인 → 예방관리' },
  
  // C 레벨: 완제품공정 → 기능 → 요구사항 → 고장영향
  { parent: 'C1', child: 'C2', label: '완제품공정 → 기능' },
  { parent: 'C2', child: 'C3', label: '기능 → 요구사항' },
  { parent: 'C3', child: 'C4', label: '요구사항 → 고장영향' },
  
  // A-B 연결: 제품특성 → 작업요소
  { parent: 'A4', child: 'B1', label: '제품특성 → 작업요소' },
  
  // A-C 연결: 고장형태 → 고장영향
  { parent: 'A5', child: 'C4', label: '고장형태 → 고장영향(완제품)' },
] as const;

/** 아이템 코드 라벨 */
export const ITEM_CODE_LABELS: Record<string, string> = {
  A1: '공정번호',
  A2: '공정명',
  A3: '공정기능(설명)',
  A4: '제품특성',
  A5: '고장형태',
  A6: '검출관리',
  B1: '작업요소(설비)',
  B2: '요소기능',
  B3: '공정특성',
  B4: '고장원인',
  B5: '예방관리',
  C1: '완제품공정명',
  C2: '제품(반)기능',
  C3: '제품(반)요구사항',
  C4: '고장영향',
};

// ============ 이전 호환용 타입 (기존 코드 지원) ============

/** 레벨 타입 */
export type LevelType = 'A' | 'B' | 'C' | 'D';

/** Import 열 정의 */
export interface ImportColumn {
  key: string;
  label: string;
  width: number;
  required: boolean;
  level: LevelType;
}

/** Import 행 데이터 */
export interface ImportRowData {
  processNo: string;
  processName: string;
  processDesc: string;
  productChar: string;
  failureMode: string;
  detectionCtrl: string;
  workElement: string;
  elementFunc: string;
  processChar: string;
  failureCause: string;
  preventionCtrl: string;
  productProcessName: string;
  productFunc: string;
  requirement: string;
  failureEffect: string;
  inspectionEquip: string;
}

/** 자동 생성된 관계 (L1-L2-L3 구조) */
export interface GeneratedRelation {
  processNo: string;
  processName: string;
  l1: {
    productFunction: string;
    requirement: string;
    failureEffect: string;
  };
  l2: {
    productChars: string[];
    failureModes: string[];
    detectionCtrls: string[];
    inspectionEquips: string[];
  };
  l3: {
    workElements: { name: string; func: string }[];
    processChars: string[];
    failureCauses: string[];
    preventionCtrls: string[];
    equipments: string[];
  };
}
