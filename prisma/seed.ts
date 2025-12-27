/**
 * @file seed.ts
 * @description PFMEA 기초정보 시드 데이터
 * @author AI Assistant
 * @created 2025-12-26
 * 
 * 실행: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PFMEA 기초정보 시드 데이터
const masterData = [
  // A1 공정번호 + A2 공정명
  { itemCode: 'A1', processNo: '10', value: '자재입고' },
  { itemCode: 'A1', processNo: '20', value: '수입검사' },
  { itemCode: 'A1', processNo: '30', value: 'MB Mixing' },
  { itemCode: 'A1', processNo: '40', value: 'FM Mixing' },
  { itemCode: 'A1', processNo: '50', value: '압출' },
  { itemCode: 'A1', processNo: '60', value: '압연' },
  { itemCode: 'A1', processNo: '70', value: '비드성형' },
  { itemCode: 'A1', processNo: '80', value: '성형' },
  { itemCode: 'A1', processNo: '90', value: '가류' },
  { itemCode: 'A1', processNo: '100', value: '완제품검사(Inspection)' },
  { itemCode: 'A1', processNo: '110', value: '흡음고정' },
  { itemCode: 'A1', processNo: '111', value: '실란트' },
  { itemCode: 'A1', processNo: '120', value: '정기시험' },
  { itemCode: 'A1', processNo: '112', value: 'Rim조립' },

  // A3 공정기능
  { itemCode: 'A3', processNo: '10', value: '입고된 원자재를 검수하여 지정된 창고로 입고' },
  { itemCode: 'A3', processNo: '20', value: '원부자재 샘플링 수입검사' },
  { itemCode: 'A3', processNo: '30', value: '컴파운드 종류에 맞는 마스터배치 조건에 따라 혼련' },
  { itemCode: 'A3', processNo: '40', value: '파이널믹싱 조건에 따라 혼련하여 고무시트 생산' },
  { itemCode: 'A3', processNo: '50', value: '고무 압출하여 TREAD, SIDE 등 반제품 생산' },
  { itemCode: 'A3', processNo: '60', value: '스틸코드, 패브릭코드에 고무를 코팅하여 반제품 생산' },
  { itemCode: 'A3', processNo: '80', value: '그린타이어 부재료 반제품을 접착하여 그린타이어 생산' },
  { itemCode: 'A3', processNo: '90', value: '가류기에서 그린타이어를 가열/가압하여 완제품 생산' },
  { itemCode: 'A3', processNo: '100', value: '완성품의 외관, 균형, X-ray 검사' },

  // A4 제품특성
  { itemCode: 'A4', processNo: '10', value: '이물질' },
  { itemCode: 'A4', processNo: '10', value: '보관상태' },
  { itemCode: 'A4', processNo: '20', value: 'Mooney Viscosity' },
  { itemCode: 'A4', processNo: '30', value: 'Mooney Viscosity' },
  { itemCode: 'A4', processNo: '30', value: 'Scorch Time' },
  { itemCode: 'A4', processNo: '50', value: 'Tread 폭' },
  { itemCode: 'A4', processNo: '80', value: 'Bead To Bead 폭' },
  { itemCode: 'A4', processNo: '80', value: 'G/T 중량' },
  { itemCode: 'A4', processNo: '90', value: '가류도' },

  // A5 고장형태
  { itemCode: 'A5', processNo: '10', value: '이물입 오염' },
  { itemCode: 'A5', processNo: '10', value: '포장,제품 손상' },
  { itemCode: 'A5', processNo: '20', value: 'Mooney 불만족' },
  { itemCode: 'A5', processNo: '30', value: 'Mooney 불만족' },
  { itemCode: 'A5', processNo: '50', value: 'Tread 폭 불량' },
  { itemCode: 'A5', processNo: '80', value: 'Bead To Bead 폭 불만족' },
  { itemCode: 'A5', processNo: '90', value: '가류 불량' },

  // A6 검출관리
  { itemCode: 'A6', processNo: '20', value: 'Mooney Viscometer' },
  { itemCode: 'A6', processNo: '30', value: 'Rheometer' },
  { itemCode: 'A6', processNo: '80', value: '육안검사' },
  { itemCode: 'A6', processNo: '90', value: '가류도 측정' },
  { itemCode: 'A6', processNo: '100', value: 'X-ray 검사' },

  // B1 작업요소
  { itemCode: 'B1', processNo: '00', value: '셋업엔지니어' },
  { itemCode: 'B1', processNo: '00', value: '작업자' },
  { itemCode: 'B1', processNo: '00', value: '운반원' },
  { itemCode: 'B1', processNo: '00', value: '보전원' },
  { itemCode: 'B1', processNo: '00', value: '검사원' },
  { itemCode: 'B1', processNo: '10', value: '지게차' },
  { itemCode: 'B1', processNo: '20', value: 'MOONEY VISCOMETER' },
  { itemCode: 'B1', processNo: '30', value: 'MB 믹서' },
  { itemCode: 'B1', processNo: '50', value: '압출기' },
  { itemCode: 'B1', processNo: '80', value: '카카스 드럼' },
  { itemCode: 'B1', processNo: '90', value: '가류기' },

  // B2 작업요소기능
  { itemCode: 'B2', processNo: '00', value: '설비 조건을 셋업하고 공정 파라미터를 설정하며 초기품을 승인한다' },
  { itemCode: 'B2', processNo: '00', value: '작업을 수행하고 기준서를 준수하며 생산품을 이송한다' },
  { itemCode: 'B2', processNo: '10', value: '자재 운반 및 입고' },
  { itemCode: 'B2', processNo: '30', value: '고무 혼련 및 배합' },
  { itemCode: 'B2', processNo: '50', value: '고무 압출' },
  { itemCode: 'B2', processNo: '80', value: '카카스 드럼 회전 및 반제품 부착' },

  // B3 공정특성
  { itemCode: 'B3', processNo: '00', value: '설비 초기 조건 설정 정확도' },
  { itemCode: 'B3', processNo: '00', value: '표준작업방법 준수도' },
  { itemCode: 'B3', processNo: '30', value: '혼련 온도' },
  { itemCode: 'B3', processNo: '50', value: '압출 온도' },
  { itemCode: 'B3', processNo: '80', value: 'Center Deck 센터링' },
  { itemCode: 'B3', processNo: '90', value: '가류 온도' },

  // B4 고장원인
  { itemCode: 'B4', processNo: '00', value: '작업 표준서 미숙지로 인한 절차 누락' },
  { itemCode: 'B4', processNo: '00', value: '과도한 작업속도로 인한 조립 불량' },
  { itemCode: 'B4', processNo: '30', value: '계량기 오류' },
  { itemCode: 'B4', processNo: '50', value: '온도 설정 오류' },
  { itemCode: 'B4', processNo: '80', value: '장착Tool 규격 상이' },
  { itemCode: 'B4', processNo: '90', value: '온도 이탈' },

  // B5 예방관리
  { itemCode: 'B5', processNo: '10', value: '입고품 점검 체크시트 운영' },
  { itemCode: 'B5', processNo: '20', value: '업체 성적서 검증' },
  { itemCode: 'B5', processNo: '30', value: '온도 모니터링' },
  { itemCode: 'B5', processNo: '80', value: '바코드 스캔' },
  { itemCode: 'B5', processNo: '90', value: '온도 기록계' },

  // C1 구분
  { itemCode: 'C1', processNo: '', value: 'Your Plant' },
  { itemCode: 'C1', processNo: '', value: 'Ship to Plant' },
  { itemCode: 'C1', processNo: '', value: 'User' },

  // C2 제품(반)기능
  { itemCode: 'C2', processNo: 'Your Plant', value: '규격에 맞는 재료 투입과 배합 일관성을 확보할 수 있도록 기능을 제공한다' },
  { itemCode: 'C2', processNo: 'Your Plant', value: '설비 조건 및 작업 수행 정확도를 유지할 수 있도록 기능을 제공한다' },
  { itemCode: 'C2', processNo: 'Ship to Plant', value: '완제품 품질 및 성능을 확보할 수 있도록 기능을 제공한다' },
  { itemCode: 'C2', processNo: 'User', value: '차량 운행 시 안전성과 내구성을 확보한다' },

  // C3 제품(반)요구사항
  { itemCode: 'C3', processNo: 'Your Plant', value: '이종고무, 코드 투입, 셋업실수' },
  { itemCode: 'C3', processNo: 'Your Plant', value: '설비, 작업자 실수' },
  { itemCode: 'C3', processNo: 'Ship to Plant', value: '완제품 품질 규격' },
  { itemCode: 'C3', processNo: 'User', value: '안전 기준, 내구 기준' },

  // C4 고장영향
  { itemCode: 'C4', processNo: 'Your Plant', value: '이종 재료 혼입, 물성 불균일, 접착 불량으로 일부 폐기' },
  { itemCode: 'C4', processNo: 'Your Plant', value: '공정 조건 이탈, 품질 불균일로 일부 재작업' },
  { itemCode: 'C4', processNo: 'Ship to Plant', value: '완제품 성능 불량, 반품' },
  { itemCode: 'C4', processNo: 'User', value: '조기 마모, 안전 사고 위험' },
];

// 관계형 A 데이터
const relationA = [
  { processNo: '10', processName: '자재입고', processFunc: '입고된 원자재를 검수하여 창고 입고', productChar: '이물질', failureMode: '이물입 오염', detection: '육안검사' },
  { processNo: '20', processName: '수입검사', processFunc: '원부자재 샘플링 수입검사', productChar: 'Mooney', failureMode: 'Mooney 불만족', detection: 'Mooney Viscometer' },
  { processNo: '30', processName: 'MB Mixing', processFunc: 'MB조건에 따라 혼련', productChar: 'Mooney', failureMode: 'Mooney 불만족', detection: 'Rheometer' },
  { processNo: '40', processName: 'FM Mixing', processFunc: 'FM조건에 따라 혼련', productChar: 'Rheometer', failureMode: 'Rheometer 불만족', detection: 'Rheometer' },
  { processNo: '50', processName: '압출', processFunc: '고무 압출하여 반제품 생산', productChar: 'Tread 폭', failureMode: '폭 불량', detection: '두께 측정' },
  { processNo: '60', processName: '압연', processFunc: '스틸코드에 고무 코팅', productChar: 'Steel Cord 폭', failureMode: '폭 불량', detection: '폭 측정' },
  { processNo: '80', processName: '성형', processFunc: '그린타이어 생산', productChar: 'B2B 폭', failureMode: 'B2B 불만족', detection: '육안검사' },
  { processNo: '90', processName: '가류', processFunc: '가열/가압하여 완제품 생산', productChar: '가류도', failureMode: '가류 불량', detection: '가류도 측정' },
  { processNo: '100', processName: '완제품검사(Inspection)', processFunc: '완성품의 외관, 균형, X-ray 검사', productChar: '외관', failureMode: '외관 불량', detection: 'X-ray' },
  { processNo: '110', processName: '흡음고정', processFunc: '흡음재 부착', productChar: '부착력', failureMode: '부착 불량', detection: '육안검사' },
  { processNo: '111', processName: '실란트', processFunc: '실란트 도포', productChar: '도포량', failureMode: '도포 불량', detection: '중량 측정' },
  { processNo: '120', processName: '정기시험', processFunc: '정기 품질 시험', productChar: '시험 항목', failureMode: '시험 불합격', detection: '시험 장비' },
];

// 관계형 B 데이터
const relationB = [
  { processNo: '00', workElement: '셋업엔지니어', elementFunc: '설비 조건 셋업 및 파라미터 설정', processChar: '설정 정확도', failureCause: '표준서 미숙지', prevention: '교육훈련' },
  { processNo: '00', workElement: '작업자', elementFunc: '작업 수행 및 기준서 준수', processChar: '작업 준수도', failureCause: '작업속도 과다', prevention: '작업표준서' },
  { processNo: '00', workElement: '운반원', elementFunc: '자재 및 제품 운반', processChar: '운반 정확도', failureCause: '오배송', prevention: '바코드 스캔' },
  { processNo: '00', workElement: '보전원', elementFunc: '설비 유지보수', processChar: '보전 정확도', failureCause: '점검 누락', prevention: '점검표' },
  { processNo: '00', workElement: '검사원', elementFunc: '품질 검사 수행', processChar: '검사 정확도', failureCause: '검사 누락', prevention: '체크리스트' },
  { processNo: '10', workElement: '지게차', elementFunc: '자재 운반 및 입고', processChar: '운반 정확도', failureCause: '오배송', prevention: '바코드 스캔' },
  { processNo: '20', workElement: 'Mooney계', elementFunc: '점도 측정', processChar: '측정 정확도', failureCause: '센서 오류', prevention: '정기 교정' },
  { processNo: '30', workElement: 'MB 믹서', elementFunc: '고무 혼련 및 배합', processChar: '혼련 온도', failureCause: '온도 이탈', prevention: '온도 모니터링' },
  { processNo: '50', workElement: '압출기', elementFunc: '고무 압출', processChar: '압출 속도', failureCause: '속도 변동', prevention: '속도 모니터링' },
  { processNo: '80', workElement: '카카스 드럼', elementFunc: '드럼 회전 및 반제품 부착', processChar: '센터링', failureCause: '규격 상이', prevention: '바코드 스캔' },
  { processNo: '90', workElement: '가류기', elementFunc: '가열 가압', processChar: '가류 온도', failureCause: '온도 이탈', prevention: '온도 기록계' },
];

// 관계형 C 데이터
const relationC = [
  { category: 'Your Plant', productFunc: '재료 투입과 배합 일관성 확보', requirement: '이종고무 투입', failureEffect: '물성 불균일, 접착 불량' },
  { category: 'Your Plant', productFunc: '설비 조건 및 작업 수행 정확도 유지', requirement: '설비/작업자 실수', failureEffect: '공정 조건 이탈' },
  { category: 'Ship to Plant', productFunc: '완제품 품질 및 성능 확보', requirement: '완제품 규격', failureEffect: '성능 불량, 반품' },
  { category: 'User', productFunc: '차량 운행 시 안전성과 내구성 확보', requirement: '안전/내구 기준', failureEffect: '조기 마모, 안전 사고' },
];

async function main() {
  console.log('🌱 Seeding PFMEA Master Data...');

  // 기존 데이터 삭제
  await prisma.pFMEAMasterData.deleteMany();
  await prisma.pFMEARelationA.deleteMany();
  await prisma.pFMEARelationB.deleteMany();
  await prisma.pFMEARelationC.deleteMany();

  // 마스터 데이터 저장
  for (let i = 0; i < masterData.length; i++) {
    await prisma.pFMEAMasterData.create({
      data: { ...masterData[i], sortOrder: i },
    });
  }
  console.log(`✅ Master Data: ${masterData.length} items`);

  // 관계형 A 저장
  for (let i = 0; i < relationA.length; i++) {
    await prisma.pFMEARelationA.create({
      data: { ...relationA[i], sortOrder: i },
    });
  }
  console.log(`✅ Relation A: ${relationA.length} items`);

  // 관계형 B 저장
  for (let i = 0; i < relationB.length; i++) {
    await prisma.pFMEARelationB.create({
      data: { ...relationB[i], sortOrder: i },
    });
  }
  console.log(`✅ Relation B: ${relationB.length} items`);

  // 관계형 C 저장
  for (let i = 0; i < relationC.length; i++) {
    await prisma.pFMEARelationC.create({
      data: { ...relationC[i], sortOrder: i },
    });
  }
  console.log(`✅ Relation C: ${relationC.length} items`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




