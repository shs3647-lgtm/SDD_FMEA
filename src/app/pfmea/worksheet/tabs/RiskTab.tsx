/**
 * @file RiskTab.tsx
 * @description FMEA 워크시트 - 리스크분석(5단계) 탭
 */

'use client';

import React from 'react';
import { WorksheetState, COLORS, FlatRow } from '../constants';

interface RiskTabProps {
  state: WorksheetState;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
}

export function RiskHeader() {
  return (
    <>
      <tr>
        <th style={{ width: '20%', background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>현재 예방관리</th>
        <th style={{ width: '20%', background: '#b3e5fc', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>현재 검출관리</th>
        <th colSpan={5} style={{ width: '60%', background: '#e1f5fe', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>리스크 평가</th>
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

export function RiskRow({
  row, idx, l1Spans, l2Spans,
}: RiskTabProps & { row: FlatRow; idx: number }) {
  return (
    <>
      <td className="text-xs text-gray-400" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px' }}>[{row.m4}] {row.l3Name}</td>
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fafafa' }}></td>
    </>
  );
}

export default function RiskTab(props: RiskTabProps) {
  const { rows } = props;
  return (
    <>
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <RiskHeader />
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={`${row.l1TypeId}-${row.l2Id}-${row.l3Id}`} style={{ height: '25px' }}>
            <RiskRow {...props} row={row} idx={idx} />
          </tr>
        ))}
      </tbody>
    </>
  );
}
