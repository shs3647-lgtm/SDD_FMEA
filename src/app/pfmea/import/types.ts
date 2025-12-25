/**
 * @file types.ts
 * @description PFMEA 기초정보 Import 타입 정의
 * @author AI Assistant
 * @created 2025-12-26
 * @prd PRD-026-pfmea-master-data-import.md
 */

/** 공정정보 */
export interface ProcessInfo {
  id: number;
  process_no: string;
  process_name: string;
  process_desc: string;
  parent_no?: string;
  sort_order: number;
}

/** 작업요소 (4M) */
export interface WorkElement {
  id: number;
  lookup_key: string;
  process_no: string;
  process_name: string;
  element_name: string;
  element_4m: 'Man' | 'Machine' | 'Material' | 'Method';
  element_desc?: string;
}

/** 제품특성 */
export interface ProductChar {
  id: number;
  lookup_key: string;
  process_no: string;
  process_name: string;
  product_name: string;
  char_name: string;
}

/** 공정특성 */
export interface ProcessChar {
  id: number;
  lookup_key: string;
  process_no: string;
  char_name: string;
}

/** 요구사항/고장영향 */
export interface Requirement {
  id: number;
  req_no: string;
  category: 'Your Plant' | 'CAR MAKER' | 'User';
  description: string;
  requirement: string;
  failure_effect: string;
}

/** 고장형태 */
export interface FailureMode {
  id: number;
  lookup_key: string;
  process_no: string;
  product_char: string;
  fm_description: string;
}

/** 고장원인 */
export interface FailureCause {
  id: number;
  lookup_key: string;
  process_no: string;
  element_4m: string;
  fc_description: string;
}

/** 예방관리 */
export interface PreventionCtrl {
  id: number;
  ctrl_id: string;
  ctrl_description: string;
}

/** 검출관리 */
export interface DetectionCtrl {
  id: number;
  ctrl_id: string;
  ctrl_description: string;
}

/** Import 시트 정보 */
export interface ImportSheet {
  id: string;
  name: string;
  korName: string;
  level: 'L1' | 'L2' | 'L3' | 'Common';
  recordCount?: number;
  selected: boolean;
}

/** Import 결과 */
export interface ImportResult {
  sheet: string;
  count: number;
  errors: string[];
  success: boolean;
}

/** 3레벨 연계 데이터 */
export interface LevelData {
  l1: {
    productName?: string;
    productFunction?: string;
    requirement?: Requirement;
    failureEffect?: string;
  };
  l2: {
    processNo: string;
    processName: string;
    processDesc?: string;
    productChars: ProductChar[];
    failureModes: FailureMode[];
    detectionCtrls: DetectionCtrl[];
  };
  l3: {
    workElements: WorkElement[];
    processChars: ProcessChar[];
    failureCauses: FailureCause[];
    preventionCtrls: PreventionCtrl[];
  };
}

