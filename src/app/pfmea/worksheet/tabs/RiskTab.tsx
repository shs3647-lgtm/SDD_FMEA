/**
 * @file RiskTab.tsx
 * @description FMEA 워크시트 - 리스크분석(5단계) 탭
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

interface RiskTabProps {
  state: WorksheetState;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
}

/**
 * 리스크분석 탭 - 테이블 헤더
 */
export function RiskHeader() {
  return (
    <>
      <tr>
        <th style={{ 
          width: '20%', 
          background: '#bbdefb', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '25px', 
          fontWeight: 900, 
          textAlign: 'center', 
          fontSize: '11px' 
        }}>
          현재 예방관리
        </th>
        <th style={{ 
          width: '20%', 
          background: '#b3e5fc', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '25px', 
          fontWeight: 900, 
          textAlign: 'center', 
          fontSize: '11px' 
        }}>
          현재 검출관리
        </th>
        <th 
          style={{ 
            width: '60%', 
            background: '#e1f5fe', 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            height: '25px', 
            fontWeight: 900, 
            textAlign: 'center', 
            fontSize: '11px' 
          }} 
          colSpan={5}
        >
          리스크 평가
        </th>
      </tr>
      <tr>
        <th style={{ background: '#e3f2fd', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>예방관리</th>
        <th style={{ background: '#e1f5fe', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>검출관리</th>
        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>심각도(S)</th>
        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>발생도(O)</th>
        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>검출도(D)</th>
        <th style={{ background: '#fff3e0', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>AP</th>
        <th style={{ background: '#fff3e0', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>RPN</th>
      </tr>
    </>
  );
}

/**
 * 리스크분석 탭 - 테이블 행 (데이터 셀) - 개발예정
 */
export function RiskRow({
  row,
  idx,
  l1Spans,
  l2Spans,
}: RiskTabProps & { row: FlatRow; idx: number }) {
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
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
    </>
  );
}

/**
 * 리스크분석 탭 - 전체 컴포넌트
 */
export default function RiskTab(props: RiskTabProps) {
  const { rows } = props;
  
  return (
    <>
      <thead className="sticky top-0 z-10">
        <RiskHeader />
      </thead>
      
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <RiskRow {...props} row={row} idx={idx} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

