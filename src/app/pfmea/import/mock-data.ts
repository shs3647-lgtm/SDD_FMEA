/**
 * @file mock-data.ts
 * @description PFMEA 기초정보 목업 데이터 (PRD-026 기반)
 * @author AI Assistant
 * @created 2025-12-26
 */

import { ProcessInfo, WorkElement, ProductChar, FailureMode, FailureCause, ImportSheet, Requirement } from './types';

/** 공정정보 목업 데이터 */
export const mockProcesses: ProcessInfo[] = [
  { id: 1, process_no: '10', process_name: '원료입고', process_desc: '입고된 원재료를 입수하여 지정된 창고에 입고', sort_order: 10 },
  { id: 2, process_no: '20', process_name: '수입검사', process_desc: '원재료의 규격을 수입검사', sort_order: 20 },
  { id: 3, process_no: '11', process_name: '보관', process_desc: '보관기간내 원자재 품질을 위해 천연/합성고무 보관', parent_no: '10', sort_order: 11 },
  { id: 4, process_no: '30', process_name: '정련', process_desc: '고무,카본블랙,유황,화학약품을 투입하고, 원재료를 혼련하여 FM컴파운드 생산', sort_order: 30 },
  { id: 5, process_no: '31', process_name: 'MB Mixing', process_desc: '컴파운드 종류에 맞는 마스터배치 조건에 따라 혼련', parent_no: '30', sort_order: 31 },
  { id: 6, process_no: '32', process_name: 'FB Mixing', process_desc: '각 반제품의 성능에 맞는 파이널배치 조건에 따라 혼련', parent_no: '30', sort_order: 32 },
  { id: 7, process_no: '40', process_name: '압출', process_desc: '혼련된 컴파운드를 압출하여 반제품 생산', sort_order: 40 },
  { id: 8, process_no: '50', process_name: '압연', process_desc: '혼련된 컴파운드를 압연하여 시트 생산', sort_order: 50 },
  { id: 9, process_no: '60', process_name: '재단', process_desc: '압연된 시트를 지정된 규격으로 재단', sort_order: 60 },
  { id: 10, process_no: '70', process_name: '비드', process_desc: '비드 와이어에 고무를 피복', sort_order: 70 },
  { id: 11, process_no: '80', process_name: '성형', process_desc: '그린타이어 부재료 반제품을 접착하여 지정된 치수 및 형상의 그린타이어 생산', sort_order: 80 },
  { id: 12, process_no: '81', process_name: 'GT Inside Paint', process_desc: 'Green Tire Inside Paint를 도포하는 공정', parent_no: '80', sort_order: 81 },
  { id: 13, process_no: '90', process_name: '가류', process_desc: '그린타이어를 가류하여 완제품 타이어 생산', sort_order: 90 },
  { id: 14, process_no: '100', process_name: '검사', process_desc: '완제품 타이어의 품질 검사', sort_order: 100 },
];

/** 작업요소 목업 데이터 */
export const mockWorkElements: WorkElement[] = [
  { id: 1, lookup_key: '10저장탱크', process_no: '10', process_name: '원료입고', element_name: '저장탱크', element_4m: 'Machine' },
  { id: 2, lookup_key: '10자동창고', process_no: '10', process_name: '원료입고', element_name: '자동창고', element_4m: 'Machine' },
  { id: 3, lookup_key: '31MB믹서', process_no: '31', process_name: 'MB Mixing', element_name: 'MB 믹서', element_4m: 'Machine' },
  { id: 4, lookup_key: '32FB믹서', process_no: '32', process_name: 'FB Mixing', element_name: 'FB 믹서', element_4m: 'Machine' },
  { id: 5, lookup_key: '80카카스드럼', process_no: '80', process_name: '성형', element_name: '카카스 드럼', element_4m: 'Machine' },
  { id: 6, lookup_key: '80비드드럼', process_no: '80', process_name: '성형', element_name: '비드 드럼', element_4m: 'Machine' },
  { id: 7, lookup_key: '80빌딩서버', process_no: '80', process_name: '성형', element_name: '빌딩 서버', element_4m: 'Machine' },
  { id: 8, lookup_key: '00작업자', process_no: '00', process_name: '공통', element_name: '작업자', element_4m: 'Man' },
  { id: 9, lookup_key: '00원자재', process_no: '00', process_name: '공통', element_name: '원자재', element_4m: 'Material' },
];

/** 제품특성 목업 데이터 */
export const mockProductChars: ProductChar[] = [
  { id: 1, lookup_key: '10원료이미지', process_no: '10', process_name: '원료입고', product_name: '원재료', char_name: '이미지' },
  { id: 2, lookup_key: '10원료유효기간', process_no: '10', process_name: '원료입고', product_name: '원재료', char_name: '유효기간' },
  { id: 3, lookup_key: '31MBMooney', process_no: '31', process_name: 'MB Mixing', product_name: 'MB', char_name: 'Mooney Viscosity' },
  { id: 4, lookup_key: '32FBScorch', process_no: '32', process_name: 'FB Mixing', product_name: 'FB', char_name: 'Scorch Time' },
  { id: 5, lookup_key: '80GTBead', process_no: '80', process_name: '성형', product_name: 'Green Tire', char_name: 'Bead To Bead 폭' },
  { id: 6, lookup_key: '80GTPA', process_no: '80', process_name: '성형', product_name: 'Green Tire', char_name: 'PA (IL+SW) 폭' },
  { id: 7, lookup_key: '80GT중량', process_no: '80', process_name: '성형', product_name: 'Green Tire', char_name: 'G/T 중량' },
];

/** 고장형태 목업 데이터 */
export const mockFailureModes: FailureMode[] = [
  { id: 1, lookup_key: '10이미지누락', process_no: '10', product_char: '이미지', fm_description: '이미지 누락' },
  { id: 2, lookup_key: '10유효기간초과', process_no: '10', product_char: '유효기간', fm_description: '유효기간 초과' },
  { id: 3, lookup_key: '31Mooney불만족', process_no: '31', product_char: 'Mooney Viscosity', fm_description: 'Mooney Viscosity 불만족' },
  { id: 4, lookup_key: '80Bead폭불만족', process_no: '80', product_char: 'Bead To Bead 폭', fm_description: 'Bead To Bead 폭 불만족' },
  { id: 5, lookup_key: '80GT중량불만족', process_no: '80', product_char: 'G/T 중량', fm_description: 'G/T 중량 불만족' },
];

/** 고장원인 목업 데이터 */
export const mockFailureCauses: FailureCause[] = [
  { id: 1, lookup_key: '00작업표준서미준수', process_no: '00', element_4m: '작업자', fc_description: '작업 표준서 미준수에 따른 설정 오류' },
  { id: 2, lookup_key: '10저장탱크보관불량', process_no: '10', element_4m: '저장탱크', fc_description: '저장용액 보관방법 미준수에 따른 품질 저하' },
  { id: 3, lookup_key: '31계량기오류', process_no: '31', element_4m: '계량기', fc_description: '계량기 오류(정확/고장/초과/부족 등)' },
  { id: 4, lookup_key: '80잘못된반제품장착', process_no: '80', element_4m: '빌딩 서버', fc_description: '잘못된 반제품 장착' },
  { id: 5, lookup_key: '80장착Tool규격상이', process_no: '80', element_4m: '카카스 드럼', fc_description: '장착Tool 규격 상이' },
];

/** 요구사항 목업 데이터 */
export const mockRequirements: Requirement[] = [
  { id: 1, req_no: '1.1', category: 'Your Plant', description: '입고에 맞는 원료 수입과 보관 일관성을 확보', requirement: '수량관리, 자동 관리, 선입선출', failure_effect: '자재 원료 혼선, 재고 불일치' },
  { id: 2, req_no: '1.8', category: 'Your Plant', description: 'Air Retention 성능을 확보', requirement: 'Air Retention', failure_effect: '공기 누설, 내구성 저하' },
  { id: 3, req_no: '2.1', category: 'CAR MAKER', description: '제동력을 신뢰하고 작동할 수 있도록', requirement: 'Dry/Wet Braking Performance', failure_effect: '제동 성능불량, 정차 불가' },
  { id: 4, req_no: '3.1', category: 'User', description: '외관 품질을 유지할 수 있도록', requirement: 'Traction', failure_effect: '외관 훼손, 소비자 불만' },
];

/** Import 시트 목록 (15개) */
export const importSheets: ImportSheet[] = [
  { id: 'process', name: 'M_PROCESS', korName: '공정정보', level: 'L2', recordCount: 45, selected: true },
  { id: 'work_element', name: 'M_WORK_ELEMENT', korName: '작업요소', level: 'L3', recordCount: 120, selected: true },
  { id: 'product', name: 'M_PRODUCT', korName: '제품정보', level: 'L2', recordCount: 30, selected: true },
  { id: 'product_char', name: 'M_PRODUCT_CHAR', korName: '제품특성', level: 'L2', recordCount: 180, selected: true },
  { id: 'process_char', name: 'M_PROCESS_CHAR', korName: '공정특성', level: 'L3', recordCount: 150, selected: true },
  { id: 'requirement', name: 'M_REQUIREMENT', korName: '요구사항', level: 'L1', recordCount: 36, selected: true },
  { id: 'failure_effect', name: 'M_FAILURE_EFFECT', korName: '고장영향', level: 'L1', recordCount: 36, selected: true },
  { id: 'failure_mode', name: 'M_FAILURE_MODE', korName: '고장형태', level: 'L2', recordCount: 200, selected: true },
  { id: 'failure_cause', name: 'M_FAILURE_CAUSE', korName: '고장원인', level: 'L3', recordCount: 180, selected: true },
  { id: 'prevention_ctrl', name: 'M_PREVENTION_CTRL', korName: '예방관리', level: 'L3', recordCount: 50, selected: true },
  { id: 'detection_ctrl', name: 'M_DETECTION_CTRL', korName: '검출관리', level: 'L2', recordCount: 40, selected: true },
  { id: '4m_category', name: 'M_4M_CATEGORY', korName: '4M분류', level: 'Common', recordCount: 4, selected: true },
  { id: 'complete_product', name: 'M_COMPLETE_PRODUCT', korName: '완제품', level: 'L1', recordCount: 10, selected: true },
  { id: 'equipment', name: 'M_EQUIPMENT', korName: '설비/장비', level: 'L3', recordCount: 80, selected: true },
  { id: 'inspection_equip', name: 'M_INSPECTION_EQUIPMENT', korName: '검사장비', level: 'L2', recordCount: 25, selected: true },
];

/** 공정번호로 관련 데이터 조회 */
export const getDataByProcessNo = (processNo: string) => {
  const process = mockProcesses.find(p => p.process_no === processNo);
  const workElements = mockWorkElements.filter(w => w.process_no === processNo || w.process_no === '00');
  const productChars = mockProductChars.filter(p => p.process_no === processNo);
  const failureModes = mockFailureModes.filter(f => f.process_no === processNo);
  const failureCauses = mockFailureCauses.filter(f => f.process_no === processNo || f.process_no === '00');

  return { process, workElements, productChars, failureModes, failureCauses };
};

