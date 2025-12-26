/**
 * @file excel-template.ts
 * @description PFMEA 기초정보 Excel 템플릿 생성 유틸리티
 * @author AI Assistant
 * @created 2025-12-26
 * 
 * 번호 체계:
 * A: 공정 레벨 (A1-A6)
 * B: 작업요소 레벨 (B1-B5)
 * C: 완제품 레벨 (C1-C4)
 * D: 검사장비
 */

import ExcelJS from 'exceljs';
import { importColumns } from './mock-data';

/** 빈 템플릿 다운로드 */
export async function downloadEmptyTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FMEA Smart System';
  workbook.created = new Date();

  // 워크시트 생성
  const worksheet = workbook.addWorksheet('PFMEA 기초정보', {
    properties: { tabColor: { argb: '00587A' } },
  });

  // 컬럼 설정
  worksheet.columns = importColumns.map((col, i) => ({
    header: col.label,
    key: col.key,
    width: Math.max(col.width / 7, 15),
  }));

  // 헤더 스타일
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNumber) => {
    const col = importColumns[colNumber - 1];
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.level === 'A' ? '3B82F6' : col.level === 'B' ? '22C55E' : col.level === 'C' ? 'EF4444' : '6B7280' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '999999' } },
      left: { style: 'thin', color: { argb: '999999' } },
      bottom: { style: 'thin', color: { argb: '999999' } },
      right: { style: 'thin', color: { argb: '999999' } },
    };
  });

  // 안내 행 추가 (2번째 행)
  const guideRow = worksheet.addRow(importColumns.map(col => col.required ? '(필수)' : '(선택)'));
  guideRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FB' } };
    cell.font = { italic: true, color: { argb: '666666' }, size: 9 };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: '999999' } },
      left: { style: 'thin', color: { argb: '999999' } },
      bottom: { style: 'thin', color: { argb: '999999' } },
      right: { style: 'thin', color: { argb: '999999' } },
    };
  });

  // 빈 데이터 행 10개 추가
  for (let i = 0; i < 10; i++) {
    const row = worksheet.addRow(importColumns.map(() => ''));
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'CCCCCC' } },
        left: { style: 'thin', color: { argb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
        right: { style: 'thin', color: { argb: 'CCCCCC' } },
      };
    });
  }

  // 열 고정
  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 2 }];

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

/** 샘플 데이터 템플릿 다운로드 */
export async function downloadSampleTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FMEA Smart System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('PFMEA 기초정보', {
    properties: { tabColor: { argb: '00587A' } },
  });

  // 컬럼 설정
  worksheet.columns = importColumns.map((col) => ({
    header: col.label,
    key: col.key,
    width: Math.max(col.width / 7, 15),
  }));

  // 헤더 스타일
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNumber) => {
    const col = importColumns[colNumber - 1];
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.level === 'A' ? '3B82F6' : col.level === 'B' ? '22C55E' : col.level === 'C' ? 'EF4444' : '6B7280' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '999999' } },
      left: { style: 'thin', color: { argb: '999999' } },
      bottom: { style: 'thin', color: { argb: '999999' } },
      right: { style: 'thin', color: { argb: '999999' } },
    };
  });

  // 샘플 데이터
  const sampleData = [
    ['80', '성형', '그린타이어 부재료 반제품을 접착하여 그린타이어 생산', 'Bead To Bead 폭', 'Bead To Bead 폭 불만족', '육안검사', '카카스 드럼', '카카스 드럼 회전 및 반제품 부착', 'Center Deck 센터링', '장착Tool 규격 상이', '바코드 스캔', '성형', '차량 운행 지지', 'Air Retention', '공기 누설, 내구성 저하', '카메라'],
    ['80', '성형', '그린타이어 부재료 반제품을 접착하여 그린타이어 생산', 'G/T 중량', 'G/T 중량 불만족', '자동중량', '비드 드럼', '비드 고정 및 접착', '비드 압력', '작업지침서 미준수', 'PDA 확인', '성형', '차량 운행 지지', 'Air Retention', '공기 누설, 내구성 저하', '저울'],
    ['31', 'MB Mixing', '컴파운드 종류에 맞는 마스터배치 조건에 따라 혼련', 'Mooney Viscosity', 'Mooney Viscosity 불만족', '점도 측정', 'MB 믹서', '고무 혼련 및 배합', '혼련 온도', '계량기 오류', '온도 체크', 'MB Mixing', '타이어 성능 확보', 'Braking Performance', '제동 성능 불량', '점도계'],
  ];

  sampleData.forEach((data, idx) => {
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
  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 1 }];

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

