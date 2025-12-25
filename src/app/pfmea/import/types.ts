/**
 * @file types.ts
 * @description PFMEA 기초정보 Import 타입 정의 (단순화 버전)
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 16컬럼 단일 시트 방식으로 변경
 * @prd PRD-026-pfmea-master-data-import.md
 * 
 * 사용자는 1개 시트에 16컬럼만 입력하면
 * 시스템이 공정번호 기준으로 관계형 DB를 자동 생성
 */

/** 단일 Import 행 데이터 (16컬럼) */
export interface ImportRowData {
  processNo: string;           // A: 공정번호 (필수, 연결 KEY)
  processName: string;         // B: 공정명 (필수)
  processDesc: string;         // C: 공정기능(설명)
  productChar: string;         // D: 제품특성 (L2)
  workElement: string;         // E: 작업요소 (L3)
  workElementFunc: string;     // F: 작업요소기능
  processChar: string;         // G: 공정특성 (L3)
  productFunction: string;     // H: 완제품기능 (L1)
  requirement: string;         // I: 완제품요구사항 (L1)
  failureEffect: string;       // J: 고장영향 FE (L1)
  failureMode: string;         // K: 고장형태 FM (L2)
  failureCause: string;        // L: 고장원인 FC (L3)
  detectionCtrl: string;       // M: 검출관리 DC (L2)
  preventionCtrl: string;      // N: 예방관리 PC (L3)
  equipment: string;           // O: 설비/장비 (L3)
  inspectionEquip: string;     // P: 검사장비 EP (L2)
}

/** Import 컬럼 정의 */
export interface ImportColumn {
  key: keyof ImportRowData;
  label: string;
  level: 'KEY' | 'L1' | 'L2' | 'L3';
  required: boolean;
  width: number;
}

/** Import 결과 */
export interface ImportResult {
  success: boolean;
  totalRows: number;
  processCount: number;
  generatedTables: {
    tableName: string;
    recordCount: number;
  }[];
  errors: string[];
}

/** 자동 생성된 관계형 데이터 */
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

/** 미리보기 통계 */
export interface PreviewStats {
  totalRows: number;
  uniqueProcesses: number;
  l1Items: number;
  l2Items: number;
  l3Items: number;
}

/** 공통 작업요소 분류 (4M+E+IM) */
export type CommonCategory = 'MN' | 'MA' | 'MT' | 'ME' | 'EN' | 'IM';

/** 공통 기초정보 항목 */
export interface CommonItem {
  id: string;
  category: CommonCategory;
  categoryName: string;
  name: string;
  description?: string;
  failureCauses?: string[];  // 관련 고장원인
}

/** 공통 카테고리 정의 */
export const COMMON_CATEGORIES: { code: CommonCategory; name: string; color: string }[] = [
  { code: 'MN', name: 'Man (사람)', color: 'bg-blue-500' },
  { code: 'MA', name: 'Machine (설비)', color: 'bg-purple-500' },
  { code: 'MT', name: 'Material (원자재)', color: 'bg-orange-500' },
  { code: 'ME', name: 'Method (작업방법)', color: 'bg-cyan-500' },
  { code: 'EN', name: 'Environment (환경)', color: 'bg-teal-500' },
  { code: 'IM', name: 'Indirect Material (부자재)', color: 'bg-pink-500' },
];
