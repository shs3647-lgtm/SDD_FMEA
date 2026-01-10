/**
 * @file FailureCellRenderer.tsx
 * @description 고장분석(4단계) 셀 렌더링 - 고장영향(FE), 심각도, 고장형태(FM), 고장원인(FC)
 */
'use client';

import React from 'react';

const HEIGHTS = { body: 28 };

interface ColumnDef {
  id: number;
  step: string;
  group: string;
  name: string;
  width: number;
  cellColor: string;
  cellAltColor: string;
  align: 'left' | 'center' | 'right';
}

interface FMGroupRow {
  isFirstRow: boolean;
  feIdx?: number;
  fcIdx?: number;
  feText: string;
  feSeverity: number;
  fcText: string;
  fcM4: string;
  fcWorkElem: string;
  fcWorkFunction: string;
  fcProcessChar: string;
  feCategory: string;
  feFunctionName: string;
  feRequirement: string;
  feRowSpan: number;
  fcRowSpan: number;
}

interface FMGroup {
  fmId: string;
  fmText: string;
  fmRowSpan: number;
  fmProcessNo: string;
  fmProcessName: string;
  fmProcessFunction: string;
  fmProductChar: string;
  maxSeverity: number;
  rows: FMGroupRow[];
}

interface FailureCellRendererProps {
  col: ColumnDef;
  colIdx: number;
  fmGroup: FMGroup;
  fmIdx: number;
  row: FMGroupRow;
  rowInFM: number;
  globalRowIdx: number;
}

export function FailureCellRenderer({
  col,
  colIdx,
  fmGroup,
  fmIdx,
  row,
  rowInFM,
  globalRowIdx,
}: FailureCellRendererProps): React.ReactElement | null {
  const cellStyle = (rowSpan: number, useGlobalIdx = false) => ({
    background: (useGlobalIdx ? globalRowIdx : fmIdx) % 2 === 0 ? col.cellColor : col.cellAltColor,
    height: `${HEIGHTS.body}px`,
    padding: '3px 4px',
    border: '1px solid #ccc',
    fontSize: '11px',
    textAlign: col.align,
    verticalAlign: 'middle' as const,
  });

  // ★ 누적 rowSpan 범위 체크 헬퍼 함수
  const isInMergedRange = (type: 'fe' | 'fc'): boolean => {
    for (let prevIdx = 0; prevIdx < rowInFM; prevIdx++) {
      const prevRow = fmGroup.rows[prevIdx];
      if (!prevRow) continue;
      const span = type === 'fe' ? prevRow.feRowSpan : prevRow.fcRowSpan;
      if (span > 1 && prevIdx + span > rowInFM) {
        return true; // 이전 행의 rowSpan 범위 안에 있음
      }
    }
    return false;
  };

  // ★ 고장영향(FE) - FE별 병합, (S)형식 표시
  if (col.name === '고장영향(FE)') {
    // 누적 범위 체크: 이전 행의 feRowSpan 범위 안에 있으면 렌더링하지 않음
    if (rowInFM === 0 || !isInMergedRange('fe')) {
      const severityDisplay = row.feSeverity > 0 ? `(${row.feSeverity})` : '';
      return (
        <td key={colIdx} rowSpan={row.feRowSpan} style={{ ...cellStyle(row.feRowSpan), borderBottom: rowInFM === fmGroup.rows.length - 1 ? '2px solid #303f9f' : '1px solid #ccc' }}>
          {row.feText}{severityDisplay}
        </td>
      );
    }
    return null;
  }

  // ★ 심각도 - FM 전체 병합, 최대값
  if (col.name === '심각도') {
    if (row.isFirstRow) {
      return (
        <td key={colIdx} rowSpan={fmGroup.fmRowSpan} style={{ ...cellStyle(fmGroup.fmRowSpan), fontSize: '12px', textAlign: 'center', fontWeight: 700 }}>
          {fmGroup.maxSeverity > 0 ? fmGroup.maxSeverity : ''}
        </td>
      );
    }
    return null;
  }

  // ★ 고장형태(FM) - FM 전체 병합
  if (col.name === '고장형태(FM)') {
    if (row.isFirstRow) {
      return (
        <td key={colIdx} rowSpan={fmGroup.fmRowSpan} style={{ ...cellStyle(fmGroup.fmRowSpan), textAlign: 'center', color: '#000', borderBottom: '2px solid #303f9f' }}>
          {fmGroup.fmText}
        </td>
      );
    }
    return null;
  }

  // ★ 고장원인(FC) - FC별 병합
  if (col.name === '고장원인(FC)') {
    // 누적 범위 체크: 이전 행의 fcRowSpan 범위 안에 있으면 렌더링하지 않음
    if (rowInFM === 0 || !isInMergedRange('fc')) {
      return (
        <td key={colIdx} rowSpan={row.fcRowSpan} style={{ ...cellStyle(row.fcRowSpan, true), borderBottom: rowInFM === fmGroup.rows.length - 1 ? '2px solid #303f9f' : '1px solid #ccc' }}>
          {row.fcText}
        </td>
      );
    }
    return null;
  }

  return null;
}

