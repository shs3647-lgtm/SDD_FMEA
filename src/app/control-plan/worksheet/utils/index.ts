/**
 * @file utils/index.ts
 * @description CP 워크시트 유틸리티 함수
 */

import { CPItem } from '../types';

/**
 * 빈 CP 항목 생성
 */
export function createEmptyItem(
  cpId: string, 
  processNo: string = '', 
  processName: string = ''
): CPItem {
  return {
    id: `cpi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    cpId,
    processNo,
    processName,
    processLevel: 'Main',
    processDesc: '',
    workElement: '',
    detectorNo: false,
    detectorEp: false,
    detectorAuto: false,
    productChar: '',
    processChar: '',
    specialChar: '',
    specTolerance: '',
    evalMethod: '',
    sampleSize: '',
    sampleFreq: '',
    controlMethod: '',
    owner1: '',
    owner2: '',
    reactionPlan: '',
    sortOrder: 0,
  };
}

/**
 * 샘플 데이터 생성
 */
export function createSampleItems(cpId: string): CPItem[] {
  return [
    { 
      ...createEmptyItem(cpId, '10', '프레스'), 
      processDesc: '원료투입', 
      workElement: '원료계량', 
      productChar: '외관불량', 
      processChar: '압력', 
      specialChar: 'CC', 
      specTolerance: '100±5kgf', 
      evalMethod: '압력게이지', 
      sampleSize: '5', 
      sampleFreq: 'LOT', 
      controlMethod: 'SPC', 
      owner1: '생산', 
      owner2: '', 
      reactionPlan: '재작업', 
      sortOrder: 0 
    },
    { 
      ...createEmptyItem(cpId, '10', '프레스'), 
      processDesc: '성형', 
      workElement: '금형작업', 
      productChar: '치수불량', 
      processChar: '온도', 
      specialChar: 'SC', 
      specTolerance: '180±10℃', 
      evalMethod: '온도계', 
      sampleSize: '3', 
      sampleFreq: '1회/H', 
      controlMethod: 'CP관리', 
      owner1: '품질', 
      owner2: '', 
      reactionPlan: '조건조정', 
      sortOrder: 1 
    },
    { 
      ...createEmptyItem(cpId, '20', '가류'), 
      processDesc: '가열성형', 
      workElement: '온도관리', 
      productChar: '물성불량', 
      processChar: '시간', 
      specialChar: 'CC', 
      specTolerance: '15±1min', 
      evalMethod: '타이머', 
      sampleSize: '전수', 
      sampleFreq: '전수', 
      controlMethod: '자동제어', 
      owner1: '생산', 
      owner2: '품질', 
      reactionPlan: '폐기', 
      sortOrder: 2 
    },
    { 
      ...createEmptyItem(cpId, '30', '검사'), 
      processDesc: '품질검사', 
      workElement: '외관검사', 
      productChar: '외관결함', 
      processChar: '-', 
      specialChar: '', 
      specTolerance: '외관기준', 
      evalMethod: '육안검사', 
      sampleSize: '전수', 
      sampleFreq: '전수', 
      controlMethod: '표준서', 
      owner1: '품질', 
      owner2: '', 
      reactionPlan: '선별', 
      sortOrder: 3 
    },
  ];
}


