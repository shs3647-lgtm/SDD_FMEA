/**
 * @file excel-export.ts
 * @description FMEA 워크시트 Excel 내보내기
 * @author AI Assistant
 * @created 2025-12-27
 */

import ExcelJS from 'exceljs';
import { WorksheetState } from './constants';

// 색상 정의
const COLORS = {
  structure: '1976D2',   // 파랑
  function: '7B1FA2',    // 보라
  failure: 'C62828',     // 빨강
  risk: '1565C0',        // 청색
  optimization: '00695C', // 녹색
  header: '00587A',      // 네이비
  subHeader: '90CAF9',   // 연한 파랑
};

// 컬럼 정의
const EXPORT_COLUMNS = [
  // 구조분석 (4열)
  { id: 'l1Name', label: '완제품공정명', width: 15, group: 'structure' },
  { id: 'l2No', label: '공정번호', width: 10, group: 'structure' },
  { id: 'l2Name', label: '공정명', width: 18, group: 'structure' },
  { id: 'm4', label: '4M', width: 5, group: 'structure' },
  { id: 'l3Name', label: '작업요소', width: 18, group: 'structure' },
  // 기능분석 (3열)
  { id: 'l2Function', label: '공정기능', width: 20, group: 'function' },
  { id: 'l2ProductChar', label: '제품특성', width: 15, group: 'function' },
  { id: 'l3ProcessChar', label: '공정특성', width: 15, group: 'function' },
  // 고장분석 (8열)
  { id: 'l1FailureEffect', label: '고장영향', width: 18, group: 'failure' },
  { id: 'l1Severity', label: 'S', width: 5, group: 'failure' },
  { id: 'l2FailureMode', label: '고장모드', width: 18, group: 'failure' },
  { id: 'l3FailureCause', label: '고장원인', width: 18, group: 'failure' },
  { id: 'prevention', label: '예방관리', width: 15, group: 'failure' },
  { id: 'occurrence', label: 'O', width: 5, group: 'failure' },
  { id: 'detection', label: '검출관리', width: 15, group: 'failure' },
  { id: 'detectability', label: 'D', width: 5, group: 'failure' },
  // 리스크 (3열)
  { id: 'ap', label: 'AP', width: 6, group: 'risk' },
  { id: 'action', label: '권장조치', width: 20, group: 'risk' },
  { id: 'responsible', label: '책임/일정', width: 15, group: 'risk' },
  // 최적화 (6열)
  { id: 'actionTaken', label: '조치내용', width: 18, group: 'optimization' },
  { id: 'completionDate', label: '완료일', width: 12, group: 'optimization' },
  { id: 'newS', label: "S'", width: 5, group: 'optimization' },
  { id: 'newO', label: "O'", width: 5, group: 'optimization' },
  { id: 'newD', label: "D'", width: 5, group: 'optimization' },
  { id: 'newAP', label: "AP'", width: 6, group: 'optimization' },
];

// 그룹 정의
const GROUPS = [
  { name: '구조분석', count: 5, color: COLORS.structure },
  { name: '기능분석', count: 3, color: COLORS.function },
  { name: '고장분석', count: 8, color: COLORS.failure },
  { name: '리스크', count: 3, color: COLORS.risk },
  { name: '최적화', count: 6, color: COLORS.optimization },
];

// 헤더 스타일 적용
function applyHeaderStyle(cell: ExcelJS.Cell, color: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10, name: '맑은 고딕' };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFFFFF' } },
    left: { style: 'thin', color: { argb: 'FFFFFF' } },
    bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
    right: { style: 'thin', color: { argb: 'FFFFFF' } },
  };
}

// 데이터 스타일 적용
function applyDataStyle(cell: ExcelJS.Cell, isEvenRow: boolean) {
  cell.fill = { 
    type: 'pattern', 
    pattern: 'solid', 
    fgColor: { argb: isEvenRow ? 'F5F5F5' : 'FFFFFF' } 
  };
  cell.font = { size: 9, name: '맑은 고딕' };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: '999999' } },
    left: { style: 'thin', color: { argb: '999999' } },
    bottom: { style: 'thin', color: { argb: '999999' } },
    right: { style: 'thin', color: { argb: '999999' } },
  };
}

/**
 * FMEA 워크시트를 Excel로 내보내기
 */
export async function exportFMEAWorksheet(state: WorksheetState, fmeaName: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FMEA Smart System';
  workbook.created = new Date();

  // 워크시트 생성
  const worksheet = workbook.addWorksheet('PFMEA 워크시트', {
    properties: { tabColor: { argb: COLORS.header } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }], // 헤더 2행 고정
  });

  // 컬럼 너비 설정
  worksheet.columns = EXPORT_COLUMNS.map(col => ({
    key: col.id,
    width: col.width,
  }));

  // 1행: 그룹 헤더
  let colIndex = 1;
  GROUPS.forEach(group => {
    const startCol = colIndex;
    const endCol = colIndex + group.count - 1;
    
    // 병합
    worksheet.mergeCells(1, startCol, 1, endCol);
    const cell = worksheet.getCell(1, startCol);
    cell.value = group.name;
    applyHeaderStyle(cell, group.color);
    
    colIndex = endCol + 1;
  });
  worksheet.getRow(1).height = 22;

  // 2행: 컬럼 헤더
  const headerRow = worksheet.getRow(2);
  EXPORT_COLUMNS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.label;
    const groupColor = COLORS[col.group as keyof typeof COLORS] || COLORS.header;
    applyHeaderStyle(cell, groupColor);
  });
  headerRow.height = 22;

  // 데이터 행 생성
  let rowNum = 3;
  state.l2.forEach(proc => {
    // 공정 필터링 (플레이스홀더 제외)
    if (proc.name.includes('클릭') || proc.name.includes('선택')) return;

    proc.l3.forEach(elem => {
      // 작업요소 필터링 (플레이스홀더 제외)
      if (elem.name.includes('추가') || elem.name.includes('클릭')) return;

      const row = worksheet.getRow(rowNum);
      const isEvenRow = (rowNum - 3) % 2 === 0;

      // 데이터 매핑
      const rowData: Record<string, string | number | undefined> = {
        l1Name: state.l1.name,
        l2No: proc.no,
        l2Name: proc.name,
        m4: elem.m4,
        l3Name: elem.name,
        l2Function: proc.function || '',
        l2ProductChar: proc.productChar || '',
        l3ProcessChar: elem.processChar || '',
        l1FailureEffect: state.l1.failureEffect || '',
        l1Severity: state.l1.severity,
        l2FailureMode: proc.failureMode || '',
        l3FailureCause: elem.failureCause || '',
        prevention: '',
        occurrence: '',
        detection: '',
        detectability: '',
        ap: '',
        action: '',
        responsible: '',
        actionTaken: '',
        completionDate: '',
        newS: '',
        newO: '',
        newD: '',
        newAP: '',
      };

      EXPORT_COLUMNS.forEach((col, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = rowData[col.id] ?? '';
        applyDataStyle(cell, isEvenRow);
      });

      row.height = 20;
      rowNum++;
    });
  });

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // 파일명: FMEA명_날짜.xlsx
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  link.download = `${fmeaName || 'PFMEA'}_워크시트_${date}.xlsx`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============ 구조분석 전용 Excel Export/Import ============

// 구조분석 컬럼 정의
const STRUCTURE_COLUMNS = [
  { id: 'l1Name', label: '완제품공정명', width: 20 },
  { id: 'l2No', label: '공정번호', width: 10 },
  { id: 'l2Name', label: '공정명', width: 20 },
  { id: 'm4', label: '4M', width: 6 },
  { id: 'l3Name', label: '작업요소', width: 25 },
];

/**
 * 구조분석 데이터 Excel 내보내기
 */
export async function exportStructureAnalysis(state: WorksheetState, fmeaName: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FMEA Smart System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('구조분석', {
    properties: { tabColor: { argb: '1976D2' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // 컬럼 너비 설정
  worksheet.columns = STRUCTURE_COLUMNS.map(col => ({
    key: col.id,
    width: col.width,
  }));

  // 헤더 행
  const headerRow = worksheet.getRow(1);
  STRUCTURE_COLUMNS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.label;
    applyHeaderStyle(cell, '1976D2');
  });
  headerRow.height = 25;

  // 데이터 행
  let rowNum = 2;
  state.l2.forEach(proc => {
    if (proc.name.includes('클릭') || proc.name.includes('선택')) return;

    proc.l3.forEach(elem => {
      if (elem.name.includes('추가') || elem.name.includes('클릭')) return;

      const row = worksheet.getRow(rowNum);
      const isEvenRow = (rowNum - 2) % 2 === 0;

      const values = [
        state.l1.name,
        proc.no,
        proc.name,
        elem.m4,
        elem.name,
      ];

      values.forEach((val, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = val || '';
        applyDataStyle(cell, isEvenRow);
      });

      row.height = 22;
      rowNum++;
    });
  });

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  link.download = `${fmeaName || 'PFMEA'}_구조분석_${date}.xlsx`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 빈 구조분석 템플릿 다운로드
 */
export async function downloadStructureTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FMEA Smart System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('구조분석_템플릿', {
    properties: { tabColor: { argb: '1976D2' } },
  });

  // 컬럼 너비 설정
  worksheet.columns = STRUCTURE_COLUMNS.map(col => ({
    key: col.id,
    width: col.width,
  }));

  // 헤더 행
  const headerRow = worksheet.getRow(1);
  STRUCTURE_COLUMNS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.label;
    applyHeaderStyle(cell, '1976D2');
  });
  headerRow.height = 25;

  // 안내 행
  const guideRow = worksheet.getRow(2);
  ['(예: 타이어 제조공정)', '(예: 10)', '(예: 자재입고)', '(MN/MC/IM/EN)', '(예: 작업자)'].forEach((guide, idx) => {
    const cell = guideRow.getCell(idx + 1);
    cell.value = guide;
    cell.font = { italic: true, color: { argb: '666666' }, size: 9 };
    cell.alignment = { horizontal: 'center' };
  });

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'PFMEA_구조분석_템플릿.xlsx';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 구조분석 Excel 가져오기
 */
export async function importStructureAnalysis(
  file: File,
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>,
  setDirty: (dirty: boolean) => void
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { success: false, message: '워크시트를 찾을 수 없습니다.', count: 0 };
    }

    // 데이터 파싱
    const rows: Array<{
      l1Name: string;
      l2No: string;
      l2Name: string;
      m4: string;
      l3Name: string;
    }> = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 스킵

      const l1Name = row.getCell(1).value?.toString() || '';
      const l2No = row.getCell(2).value?.toString() || '';
      const l2Name = row.getCell(3).value?.toString() || '';
      const m4 = row.getCell(4).value?.toString() || '';
      const l3Name = row.getCell(5).value?.toString() || '';

      // 빈 행 스킵
      if (!l2Name && !l3Name) return;
      // 안내 행 스킵
      if (l1Name.includes('예:') || l2No.includes('예:')) return;

      rows.push({ l1Name, l2No, l2Name, m4, l3Name });
    });

    if (rows.length === 0) {
      return { success: false, message: '가져올 데이터가 없습니다.', count: 0 };
    }

    // 상태 업데이트
    setState(prev => {
      const newL1Name = rows[0]?.l1Name || prev.l1.name;
      
      // 공정별로 그룹화
      const processMap = new Map<string, { no: string; name: string; elements: Array<{ m4: string; name: string }> }>();
      
      rows.forEach(row => {
        const key = `${row.l2No}_${row.l2Name}`;
        if (!processMap.has(key)) {
          processMap.set(key, { no: row.l2No, name: row.l2Name, elements: [] });
        }
        if (row.l3Name) {
          processMap.get(key)!.elements.push({ m4: row.m4, name: row.l3Name });
        }
      });

      // 새 L2 배열 생성
      const newL2 = Array.from(processMap.values()).map((proc, pIdx) => ({
        id: `proc_${Date.now()}_${pIdx}`,
        no: proc.no,
        name: proc.name,
        order: (pIdx + 1) * 10,
        l3: proc.elements.length > 0 
          ? proc.elements.map((elem, eIdx) => ({
              id: `elem_${Date.now()}_${pIdx}_${eIdx}`,
              m4: elem.m4,
              name: elem.name,
              order: (eIdx + 1) * 10,
            }))
          : [{ id: `elem_${Date.now()}_${pIdx}_0`, m4: '', name: '(작업요소 추가)', order: 10 }]
      }));

      return {
        ...prev,
        l1: { ...prev.l1, name: newL1Name },
        l2: newL2,
      };
    });

    setDirty(true);

    return { success: true, message: `${rows.length}개 항목을 가져왔습니다.`, count: rows.length };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: '파일 읽기 오류가 발생했습니다.', count: 0 };
  }
}

