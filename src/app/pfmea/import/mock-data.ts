/**
 * @file mock-data.ts
 * @description PFMEA 기초정보 목업 데이터 (단순화된 16컬럼 형식)
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 1시트 16컬럼 방식으로 변경
 */

import { ImportRowData, ImportColumn, GeneratedRelation, CommonItem } from './types';

/** 16개 컬럼 정의 */
export const importColumns: ImportColumn[] = [
  { key: 'processNo', label: '공정번호', level: 'KEY', required: true, width: 80 },
  { key: 'processName', label: '공정명', level: 'KEY', required: true, width: 100 },
  { key: 'processDesc', label: '공정기능(설명)', level: 'L2', required: false, width: 200 },
  { key: 'productChar', label: '제품특성', level: 'L2', required: false, width: 120 },
  { key: 'workElement', label: '작업요소', level: 'L3', required: false, width: 100 },
  { key: 'workElementFunc', label: '작업요소기능', level: 'L3', required: false, width: 150 },
  { key: 'processChar', label: '공정특성', level: 'L3', required: false, width: 100 },
  { key: 'productFunction', label: '완제품기능', level: 'L1', required: false, width: 120 },
  { key: 'requirement', label: '요구사항', level: 'L1', required: false, width: 120 },
  { key: 'failureEffect', label: '고장영향(FE)', level: 'L1', required: false, width: 120 },
  { key: 'failureMode', label: '고장형태(FM)', level: 'L2', required: false, width: 120 },
  { key: 'failureCause', label: '고장원인(FC)', level: 'L3', required: false, width: 120 },
  { key: 'detectionCtrl', label: '검출관리(DC)', level: 'L2', required: false, width: 100 },
  { key: 'preventionCtrl', label: '예방관리(PC)', level: 'L3', required: false, width: 100 },
  { key: 'equipment', label: '설비/장비', level: 'L3', required: false, width: 100 },
  { key: 'inspectionEquip', label: '검사장비(EP)', level: 'L2', required: false, width: 100 },
];

/** 샘플 Import 데이터 (16컬럼 형식) */
export const sampleImportData: ImportRowData[] = [
  {
    processNo: '80', processName: '성형', processDesc: '그린타이어 부재료 반제품을 접착하여 그린타이어 생산',
    productChar: 'Bead To Bead 폭', workElement: '카카스 드럼', workElementFunc: '카카스 드럼 회전 및 반제품 부착',
    processChar: 'Center Deck 센터링', productFunction: '차량 운행 지지', requirement: 'Air Retention',
    failureEffect: '공기 누설, 내구성 저하', failureMode: 'Bead To Bead 폭 불만족', failureCause: '장착Tool 규격 상이',
    detectionCtrl: '육안검사', preventionCtrl: '바코드 스캔', equipment: '카카스 드럼', inspectionEquip: '카메라'
  },
  {
    processNo: '80', processName: '성형', processDesc: '그린타이어 부재료 반제품을 접착하여 그린타이어 생산',
    productChar: 'G/T 중량', workElement: '비드 드럼', workElementFunc: '비드 고정 및 접착',
    processChar: '비드 압력', productFunction: '차량 운행 지지', requirement: 'Air Retention',
    failureEffect: '공기 누설, 내구성 저하', failureMode: 'G/T 중량 불만족', failureCause: '작업지침서 미준수',
    detectionCtrl: '자동중량', preventionCtrl: 'PDA 확인', equipment: '비드 드럼', inspectionEquip: '저울'
  },
  {
    processNo: '80', processName: '성형', processDesc: '그린타이어 부재료 반제품을 접착하여 그린타이어 생산',
    productChar: 'PA (IL+SW) 폭', workElement: '빌딩 서버', workElementFunc: '반제품 전달',
    processChar: '사이드레터 정렬', productFunction: '차량 운행 지지', requirement: 'Air Retention',
    failureEffect: '공기 누설, 내구성 저하', failureMode: 'PA 폭 불만족', failureCause: '잘못된 반제품 장착',
    detectionCtrl: '육안검사', preventionCtrl: '작업지침 확인', equipment: '빌딩 서버', inspectionEquip: '줄자'
  },
  {
    processNo: '31', processName: 'MB Mixing', processDesc: '컴파운드 종류에 맞는 마스터배치 조건에 따라 혼련',
    productChar: 'Mooney Viscosity', workElement: 'MB 믹서', workElementFunc: '고무 혼련 및 배합',
    processChar: '혼련 온도', productFunction: '타이어 성능 확보', requirement: 'Braking Performance',
    failureEffect: '제동 성능 불량', failureMode: 'Mooney Viscosity 불만족', failureCause: '계량기 오류',
    detectionCtrl: '점도 측정', preventionCtrl: '온도 체크', equipment: 'MB 믹서', inspectionEquip: '점도계'
  },
  {
    processNo: '31', processName: 'MB Mixing', processDesc: '컴파운드 종류에 맞는 마스터배치 조건에 따라 혼련',
    productChar: 'Scorch Time', workElement: 'MB 믹서', workElementFunc: '고무 혼련 및 배합',
    processChar: '혼련 시간', productFunction: '타이어 성능 확보', requirement: 'Braking Performance',
    failureEffect: '제동 성능 불량', failureMode: 'Scorch Time 불만족', failureCause: '타이머 설정 오류',
    detectionCtrl: '시간 측정', preventionCtrl: '파라미터 확인', equipment: 'MB 믹서', inspectionEquip: '타이머'
  },
  {
    processNo: '10', processName: '원료입고', processDesc: '입고된 원재료를 입수하여 지정된 창고에 입고',
    productChar: '원료 이미지', workElement: '저장탱크', workElementFunc: '원료 저장',
    processChar: '보관 온도', productFunction: '원료 품질 유지', requirement: '선입선출',
    failureEffect: '재고 불일치', failureMode: '이미지 누락', failureCause: '저장용액 보관방법 미준수',
    detectionCtrl: '육안검사', preventionCtrl: 'QR코드 스캔', equipment: '저장탱크', inspectionEquip: '바코드리더'
  },
  {
    processNo: '10', processName: '원료입고', processDesc: '입고된 원재료를 입수하여 지정된 창고에 입고',
    productChar: '유효기간', workElement: '자동창고', workElementFunc: '자동 입출고 관리',
    processChar: '습도', productFunction: '원료 품질 유지', requirement: '선입선출',
    failureEffect: '품질 저하', failureMode: '유효기간 초과', failureCause: '선입선출 미준수',
    detectionCtrl: '시스템 알람', preventionCtrl: '자동 관리', equipment: '자동창고', inspectionEquip: 'WMS'
  },
];

/** 공정번호로 관계형 데이터 자동 생성 */
export const generateRelations = (data: ImportRowData[]): GeneratedRelation[] => {
  const processMap = new Map<string, GeneratedRelation>();

  data.forEach(row => {
    const key = row.processNo;
    
    if (!processMap.has(key)) {
      processMap.set(key, {
        processNo: row.processNo,
        processName: row.processName,
        l1: {
          productFunction: row.productFunction,
          requirement: row.requirement,
          failureEffect: row.failureEffect,
        },
        l2: { productChars: [], failureModes: [], detectionCtrls: [], inspectionEquips: [] },
        l3: { workElements: [], processChars: [], failureCauses: [], preventionCtrls: [], equipments: [] },
      });
    }

    const rel = processMap.get(key)!;

    // L2 데이터 추가 (중복 제거)
    if (row.productChar && !rel.l2.productChars.includes(row.productChar)) {
      rel.l2.productChars.push(row.productChar);
    }
    if (row.failureMode && !rel.l2.failureModes.includes(row.failureMode)) {
      rel.l2.failureModes.push(row.failureMode);
    }
    if (row.detectionCtrl && !rel.l2.detectionCtrls.includes(row.detectionCtrl)) {
      rel.l2.detectionCtrls.push(row.detectionCtrl);
    }
    if (row.inspectionEquip && !rel.l2.inspectionEquips.includes(row.inspectionEquip)) {
      rel.l2.inspectionEquips.push(row.inspectionEquip);
    }

    // L3 데이터 추가 (중복 제거)
    if (row.workElement && !rel.l3.workElements.find(w => w.name === row.workElement)) {
      rel.l3.workElements.push({ name: row.workElement, func: row.workElementFunc });
    }
    if (row.processChar && !rel.l3.processChars.includes(row.processChar)) {
      rel.l3.processChars.push(row.processChar);
    }
    if (row.failureCause && !rel.l3.failureCauses.includes(row.failureCause)) {
      rel.l3.failureCauses.push(row.failureCause);
    }
    if (row.preventionCtrl && !rel.l3.preventionCtrls.includes(row.preventionCtrl)) {
      rel.l3.preventionCtrls.push(row.preventionCtrl);
    }
    if (row.equipment && !rel.l3.equipments.includes(row.equipment)) {
      rel.l3.equipments.push(row.equipment);
    }
  });

  return Array.from(processMap.values());
};

/** 미리보기 통계 계산 */
export const calculateStats = (data: ImportRowData[]) => {
  const uniqueProcesses = new Set(data.map(d => d.processNo)).size;
  const l1Items = new Set(data.flatMap(d => [d.productFunction, d.requirement, d.failureEffect].filter(Boolean))).size;
  const l2Items = new Set(data.flatMap(d => [d.productChar, d.failureMode, d.detectionCtrl, d.inspectionEquip].filter(Boolean))).size;
  const l3Items = new Set(data.flatMap(d => [d.workElement, d.processChar, d.failureCause, d.preventionCtrl, d.equipment].filter(Boolean))).size;

  return { totalRows: data.length, uniqueProcesses, l1Items, l2Items, l3Items };
};

/** 공통 기초정보 (모든 공정에서 사용) */
export const commonItems: CommonItem[] = [
  // MN: Man (사람) - 5개
  { id: 'MN01', category: 'MN', categoryName: 'Man (사람)', name: '셋업엔지니어', description: '설비 셋업 및 조정 담당', failureCauses: ['셋업 파라미터 설정 오류', '셋업 절차 미준수'] },
  { id: 'MN02', category: 'MN', categoryName: 'Man (사람)', name: '작업자', description: '생산 작업 수행', failureCauses: ['작업표준서 미준수', '작업 실수', '교육 부족'] },
  { id: 'MN03', category: 'MN', categoryName: 'Man (사람)', name: '운반원', description: '자재 및 제품 운반', failureCauses: ['운반 중 손상', '오배송', '취급 부주의'] },
  { id: 'MN04', category: 'MN', categoryName: 'Man (사람)', name: '보전원', description: '설비 유지보수 담당', failureCauses: ['예방정비 미실시', '정비 오류', '점검 누락'] },
  { id: 'MN05', category: 'MN', categoryName: 'Man (사람)', name: '검사원', description: '품질 검사 수행', failureCauses: ['검사 누락', '오판정', '검사 기준 미준수'] },

  // EN: Environment (환경) - 5개
  { id: 'EN01', category: 'EN', categoryName: 'Environment (환경)', name: '온도', description: '작업장 온도 조건', failureCauses: ['온도 범위 이탈', '온도 변동 과다'] },
  { id: 'EN02', category: 'EN', categoryName: 'Environment (환경)', name: '습도', description: '작업장 습도 조건', failureCauses: ['습도 범위 이탈', '결로 발생'] },
  { id: 'EN03', category: 'EN', categoryName: 'Environment (환경)', name: '이물', description: '이물질 오염 요인', failureCauses: ['이물 혼입', '청정도 미달'] },
  { id: 'EN04', category: 'EN', categoryName: 'Environment (환경)', name: '정전기', description: '정전기 발생 조건', failureCauses: ['정전기 방전', 'ESD 손상'] },
  { id: 'EN05', category: 'EN', categoryName: 'Environment (환경)', name: '진동', description: '설비/작업장 진동', failureCauses: ['진동으로 인한 이완', '정밀도 저하'] },

  // IM: Indirect Material (부자재) - 6개
  { id: 'IM01', category: 'IM', categoryName: 'Indirect Material (부자재)', name: '그리이스', description: '윤활용 그리이스', failureCauses: ['도포량 과다/부족', '종류 오적용', '유효기간 초과'] },
  { id: 'IM02', category: 'IM', categoryName: 'Indirect Material (부자재)', name: '작동유', description: '유압 작동유', failureCauses: ['오일 오염', '오일량 부족', '점도 불량'] },
  { id: 'IM03', category: 'IM', categoryName: 'Indirect Material (부자재)', name: '냉각수', description: '설비 냉각용 냉각수', failureCauses: ['냉각수 부족', '온도 이상', '오염'] },
  { id: 'IM04', category: 'IM', categoryName: 'Indirect Material (부자재)', name: '윤활유', description: '설비 윤활용 오일', failureCauses: ['윤활 불량', '오일 누유', '교환주기 초과'] },
  { id: 'IM05', category: 'IM', categoryName: 'Indirect Material (부자재)', name: '이형제', description: '금형 이형제', failureCauses: ['도포 불균일', '종류 오적용'] },
  { id: 'IM06', category: 'IM', categoryName: 'Indirect Material (부자재)', name: '비닐커버', description: '보호용 비닐커버', failureCauses: ['손상된 커버 사용', '미적용'] },
];

/** 공통 항목을 관계형 데이터에 추가 */
export const addCommonItemsToRelation = (relation: GeneratedRelation): GeneratedRelation => {
  const commonWorkElements = commonItems.map(item => ({
    name: `[${item.category}] ${item.name}`,
    func: item.description || ''
  }));
  
  const commonFailureCauses = commonItems.flatMap(item => 
    (item.failureCauses || []).map(fc => `[${item.category}] ${fc}`)
  );

  return {
    ...relation,
    l3: {
      ...relation.l3,
      workElements: [...relation.l3.workElements, ...commonWorkElements],
      failureCauses: [...relation.l3.failureCauses, ...commonFailureCauses],
    }
  };
};
