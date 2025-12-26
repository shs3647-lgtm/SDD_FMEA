/**
 * @file types.ts
 * @description PFMEA 기초정보 Import 타입 정의 (번호 체계)
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 16컬럼 번호 체계로 변경
 * @prd PRD-026-pfmea-master-data-import.md
 * 
 * 번호 체계:
 * A: 공정 레벨 (A1-A6)
 * B: 작업요소 레벨 (B1-B5)
 * C: 완제품 레벨 (C1-C4)
 * D: 검사장비
 */

/** 단일 Import 행 데이터 (16컬럼) */
export interface ImportRowData {
  // A: 공정 레벨 (6개)
  processNo: string;           // A1.공정번호 (필수)
  processName: string;         // A2.공정명 (필수)
  processDesc: string;         // A3.공정기능(설명)
  productChar: string;         // A4.제품특성
  failureMode: string;         // A5.고장형태
  detectionCtrl: string;       // A6.검출관리
  // B: 작업요소 레벨 (5개)
  workElement: string;         // B1.작업요소(설비)
  workElementFunc: string;     // B2.요소기능
  processChar: string;         // B3.공정특성
  failureCause: string;        // B4.고장원인
  preventionCtrl: string;      // B5.예방관리
  // C: 완제품 레벨 (4개)
  productFunction: string;     // C1.완제품공정명
  productFunc?: string;        // C2.제품(반)기능
  requirement: string;         // C3.제품(반)요구사항
  failureEffect: string;       // C4.고장영향
  // D: 검사장비
  inspectionEquip: string;     // D.검사장비
}

/** Import 컬럼 정의 */
export interface ImportColumn {
  key: keyof ImportRowData;
  label: string;
  level: 'A' | 'B' | 'C' | 'D';  // A:공정, B:작업요소, C:완제품, D:검사장비
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
