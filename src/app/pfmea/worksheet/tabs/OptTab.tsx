/**
 * @file OptTab.tsx
 * @description FMEA 워크시트 - 최적화(6단계) 탭
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

interface OptTabProps {
  state: WorksheetState;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
}

/**
 * 최적화 탭 - 테이블 헤더
 */
export function OptHeader() {
  return (
    <>
      <tr>
        <th colSpan={4} style={{ width: '35%', background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>개선조치 계획</th>
        <th colSpan={3} style={{ width: '35%', background: '#dcedc8', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>개선조치 결과</th>
        <th colSpan={4} style={{ width: '30%', background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>효과 평가</th>
      </tr>
      <tr>
        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>조치유형</th>
        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>권고조치사항</th>
        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>담당자</th>
        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>완료예정일</th>
        <th style={{ background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>취해진조치</th>
        <th style={{ background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>완료일자</th>
        <th style={{ background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>상태</th>
        <th style={{ background: '#fffde7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>S</th>
        <th style={{ background: '#fffde7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>O</th>
        <th style={{ background: '#fffde7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>D</th>
        <th style={{ background: '#fff8e1', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>AP</th>
      </tr>
    </>
  );
}

/**
 * 최적화 탭 - 테이블 행 (데이터 셀) - 개발예정
 */
export function OptRow({
  row,
  idx,
  l1Spans,
  l2Spans,
}: OptTabProps & { row: FlatRow; idx: number }) {
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
      {[...Array(8)].map((_, i) => (
        <td key={i} style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
      ))}
    </>
  );
}

/**
 * 최적화 탭 - 전체 컴포넌트
 */
export default function OptTab(props: OptTabProps) {
  const { rows } = props;
  
  return (
    <>
      <thead className="sticky top-0 z-10">
        <OptHeader />
      </thead>
      
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <OptRow {...props} row={row} idx={idx} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

