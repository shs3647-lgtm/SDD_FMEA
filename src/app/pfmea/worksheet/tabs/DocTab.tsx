/**
 * @file DocTab.tsx
 * @description FMEA 워크시트 - 문서화(7단계) 탭
 * @author AI Assistant
 * @created 2025-12-27
 */

'use client';

import React from 'react';
import { WorksheetState, COLORS } from '../constants';

interface FlatRow {
  l1Id: string;
  l1Name: string;
  l2Id: string;
  l2No: string;
  l2Name: string;
  l3Id: string;
  m4: string;
  l3Name: string;
}

interface DocTabProps {
  state: WorksheetState;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
}

// 공통 sticky 스타일
const stickyRow1 = { position: 'sticky' as const, top: 0, zIndex: 20 };
const stickyRow2 = { position: 'sticky' as const, top: '25px', zIndex: 20 };

/**
 * 문서화 탭 - 테이블 헤더
 */
export function DocHeader() {
  return (
    <>
      <tr>
        <th colSpan={5} style={{ ...stickyRow1, width: '100%', background: '#e0e0e0', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>문서화 (7단계)</th>
      </tr>
      <tr>
        <th style={{ ...stickyRow2, background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>고장형태</th>
        <th style={{ ...stickyRow2, background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>고장원인</th>
        <th style={{ ...stickyRow2, background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>현재관리</th>
        <th style={{ ...stickyRow2, background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>권고조치</th>
        <th style={{ ...stickyRow2, background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>비고</th>
      </tr>
    </>
  );
}

/**
 * 문서화 탭 - 테이블 행 (데이터 셀) - 개발예정
 */
export function DocRow({
  row,
  idx,
  l1Spans,
  l2Spans,
}: DocTabProps & { row: FlatRow; idx: number }) {
  return (
    <>
      {l1Spans[idx] > 0 && (
        <td 
          rowSpan={l1Spans[idx]} 
          className="text-center text-xs text-gray-400" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            verticalAlign: 'middle' 
          }}
        >
          {row.l1Name}
        </td>
      )}
      {l2Spans[idx] > 0 && (
        <td 
          rowSpan={l2Spans[idx]} 
          className="text-center text-xs text-gray-400" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            verticalAlign: 'middle' 
          }}
        >
          {row.l2No} {row.l2Name}
        </td>
      )}
      <td 
        className="text-xs text-gray-400" 
        style={{ 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px' 
        }}
      >
        [{row.m4}] {row.l3Name}
      </td>
      {/* 개발예정 셀들 */}
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
    </>
  );
}

/**
 * 문서화 탭 - 전체 컴포넌트
 */
export default function DocTab(props: DocTabProps) {
  const { rows } = props;
  
  return (
    <>
      <thead className="sticky top-0 z-10">
        <DocHeader />
      </thead>
      
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <DocRow {...props} row={row} idx={idx} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

