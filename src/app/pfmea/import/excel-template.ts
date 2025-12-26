/**
 * @file excel-template.ts
 * @description PFMEA 기초정보 Excel 템플릿 생성 유틸리티 (다중 시트 방식)
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 다중 시트 방식으로 변경
 * 
 * 시트 구조:
 * A1: 공정번호 + 공정명
 * A3-A6: 공정번호 + 해당 항목
 * B1-B5: 공정번호 + 해당 항목
 * C1-C4: 완제품공정명 + 해당 항목
 */

import ExcelJS from 'exceljs';

/** 시트 정의 */
const SHEET_DEFINITIONS = [
  { name: 'A1', headers: ['A1.공정번호', 'A2.공정명'], color: '3B82F6', required: [true, true] },
  { name: 'A3', headers: ['A1.공정번호', 'A3.공정기능(설명)'], color: '3B82F6', required: [true, false] },
  { name: 'A4', headers: ['A1.공정번호', 'A4.제품특성'], color: '3B82F6', required: [true, false] },
  { name: 'A5', headers: ['A1.공정번호', 'A5.고장형태'], color: '3B82F6', required: [true, false] },
  { name: 'A6', headers: ['A1.공정번호', 'A6.검출관리'], color: '3B82F6', required: [true, false] },
  { name: 'B1', headers: ['A1.공정번호', 'B1.작업요소(설비)'], color: '22C55E', required: [true, false] },
  { name: 'B2', headers: ['A1.공정번호', 'B2.요소기능'], color: '22C55E', required: [true, false] },
  { name: 'B3', headers: ['A1.공정번호', 'B3.공정특성'], color: '22C55E', required: [true, false] },
  { name: 'B4', headers: ['A1.공정번호', 'B4.고장원인'], color: '22C55E', required: [true, false] },
  { name: 'B5', headers: ['A1.공정번호', 'B5.예방관리'], color: '22C55E', required: [true, false] },
  { name: 'C1', headers: ['C1.완제품공정명'], color: 'EF4444', required: [true] },
  { name: 'C2', headers: ['C1.완제품공정명', 'C2.제품(반)기능'], color: 'EF4444', required: [true, false] },
  { name: 'C3', headers: ['C1.완제품공정명', 'C3.제품(반)요구사항'], color: 'EF4444', required: [true, false] },
  { name: 'C4', headers: ['C1.완제품공정명', 'C4.고장영향'], color: 'EF4444', required: [true, false] },
];

/** 공통 셀 스타일 적용 */
function applyHeaderStyle(cell: ExcelJS.Cell, color: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: '999999' } },
    left: { style: 'thin', color: { argb: '999999' } },
    bottom: { style: 'thin', color: { argb: '999999' } },
    right: { style: 'thin', color: { argb: '999999' } },
  };
}

function applyGuideStyle(cell: ExcelJS.Cell) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FB' } };
  cell.font = { italic: true, color: { argb: '666666' }, size: 9 };
  cell.alignment = { horizontal: 'center' };
  cell.border = {
    top: { style: 'thin', color: { argb: '999999' } },
    left: { style: 'thin', color: { argb: '999999' } },
    bottom: { style: 'thin', color: { argb: '999999' } },
    right: { style: 'thin', color: { argb: '999999' } },
  };
}

function applyDataStyle(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'CCCCCC' } },
    left: { style: 'thin', color: { argb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
    right: { style: 'thin', color: { argb: 'CCCCCC' } },
  };
}

/** 빈 템플릿 다운로드 (다중 시트) */
export async function downloadEmptyTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FMEA Smart System';
  workbook.created = new Date();

  // 각 시트 생성
  SHEET_DEFINITIONS.forEach((def) => {
    const worksheet = workbook.addWorksheet(def.name, {
      properties: { tabColor: { argb: def.color } },
    });

    // 컬럼 설정
    worksheet.columns = def.headers.map((header, i) => ({
      header,
      key: `col${i}`,
      width: i === 0 ? 15 : 30,
    }));

    // 헤더 스타일
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => applyHeaderStyle(cell, def.color));

    // 안내 행 (2행)
    const guideRow = worksheet.addRow(def.required.map(r => r ? '(필수)' : '(선택)'));
    guideRow.eachCell((cell) => applyGuideStyle(cell));

    // 빈 데이터 행 10개
    for (let i = 0; i < 10; i++) {
      const row = worksheet.addRow(def.headers.map(() => ''));
      row.eachCell((cell) => applyDataStyle(cell));
    }

    // 열 고정
    worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }];
  });

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PFMEA_기초정보_템플릿_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 샘플 데이터 (다중 시트용) */
const SAMPLE_DATA: Record<string, string[][]> = {
  'A1': [
    ['80', '성형'],
    ['31', 'MB Mixing'],
    ['50', '압출'],
  ],
  'A3': [
    ['80', '그린타이어 부재료 반제품을 접착하여 그린타이어 생산'],
    ['31', '컴파운드 종류에 맞는 마스터배치 조건에 따라 혼련'],
    ['50', '고무 압출하여 반제품 생산'],
  ],
  'A4': [
    ['80', 'Bead To Bead 폭'],
    ['80', 'G/T 중량'],
    ['31', 'Mooney Viscosity'],
    ['50', '압출물 폭'],
  ],
  'A5': [
    ['80', 'Bead To Bead 폭 불만족'],
    ['80', 'G/T 중량 불만족'],
    ['31', 'Mooney Viscosity 불만족'],
    ['50', '압출물 폭 불량'],
  ],
  'A6': [
    ['80', '육안검사'],
    ['80', '자동중량'],
    ['31', '점도 측정'],
    ['50', '두께 측정'],
  ],
  'B1': [
    ['80', '카카스 드럼'],
    ['80', '비드 드럼'],
    ['31', 'MB 믹서'],
    ['50', '압출기'],
  ],
  'B2': [
    ['80', '카카스 드럼 회전 및 반제품 부착'],
    ['80', '비드 고정 및 접착'],
    ['31', '고무 혼련 및 배합'],
    ['50', '고무 압출'],
  ],
  'B3': [
    ['80', 'Center Deck 센터링'],
    ['80', '비드 압력'],
    ['31', '혼련 온도'],
    ['50', '압출 속도'],
  ],
  'B4': [
    ['80', '장착Tool 규격 상이'],
    ['80', '작업지침서 미준수'],
    ['31', '계량기 오류'],
    ['50', '온도 설정 오류'],
  ],
  'B5': [
    ['80', '바코드 스캔'],
    ['80', 'PDA 확인'],
    ['31', '온도 체크'],
    ['50', '속도 모니터링'],
  ],
  'C1': [
    ['자사반제품'],
    ['자사완제품'],
    ['고객'],
    ['사용자'],
  ],
  'C2': [
    ['자사반제품', '반제품 품질 확보'],
    ['자사완제품', '차량 운행 지지'],
    ['고객', '타이어 성능 확보'],
    ['사용자', '안전 운행'],
  ],
  'C3': [
    ['자사반제품', '치수 사양'],
    ['자사완제품', 'Air Retention'],
    ['고객', 'Braking Performance'],
    ['사용자', '내구성'],
  ],
  'C4': [
    ['자사반제품', '반제품 불량'],
    ['자사완제품', '공기 누설, 내구성 저하'],
    ['고객', '제동 성능 불량'],
    ['사용자', '조기 마모'],
  ],
};

/** 샘플 데이터 템플릿 다운로드 (다중 시트) */
export async function downloadSampleTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FMEA Smart System';
  workbook.created = new Date();

  // 각 시트 생성
  SHEET_DEFINITIONS.forEach((def) => {
    const worksheet = workbook.addWorksheet(def.name, {
      properties: { tabColor: { argb: def.color } },
    });

    // 컬럼 설정
    worksheet.columns = def.headers.map((header, i) => ({
      header,
      key: `col${i}`,
      width: i === 0 ? 15 : 30,
    }));

    // 헤더 스타일
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => applyHeaderStyle(cell, def.color));

    // 안내 행 (2행)
    const guideRow = worksheet.addRow(def.required.map(r => r ? '(필수)' : '(선택)'));
    guideRow.eachCell((cell) => applyGuideStyle(cell));

    // 샘플 데이터 추가
    const sampleRows = SAMPLE_DATA[def.name] || [];
    sampleRows.forEach((data, idx) => {
      const row = worksheet.addRow(data);
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFF' : 'E0F2FB' } };
        cell.border = {
          top: { style: 'thin', color: { argb: '999999' } },
          left: { style: 'thin', color: { argb: '999999' } },
          bottom: { style: 'thin', color: { argb: '999999' } },
          right: { style: 'thin', color: { argb: '999999' } },
        };
      });
    });

    // 열 고정
    worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }];
  });

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PFMEA_기초정보_샘플_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

