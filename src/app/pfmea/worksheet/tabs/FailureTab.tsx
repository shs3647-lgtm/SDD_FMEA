/**
 * @file FailureTab.tsx
 * @description FMEA 워크시트 - 고장분석(4단계) 탭
 */

'use client';

import React, { useState } from 'react';
import { WorksheetState, COLORS, FlatRow } from '../constants';

interface FailureTabProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
  setDirty: (dirty: boolean) => void;
  handleInputBlur: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent) => void;
  saveToLocalStorage: () => void;
}

// 색상 표준 (COLOR_STANDARD_V2.md) - 고장분석 모두 주황색 계열
const FAIL_COLORS = {
  l1Main: '#f57c00', l1Sub: '#ffb74d', l1Cell: '#fff3e0',   // L1: 진한주황
  l2Main: '#f57c00', l2Sub: '#ffb74d', l2Cell: '#fff3e0',   // L2: 동일
  l3Main: '#e65100', l3Sub: '#ff9800', l3Cell: '#fff3e0',   // L3: 더 진한 주황
};

const stickyFirstColStyle: React.CSSProperties = { position: 'sticky', left: 0, zIndex: 10 };

function EditableCell({
  value, placeholder, bgColor, onChange, onBlur, onKeyDown,
}: {
  value: string; placeholder: string; bgColor: string; onChange: (val: string) => void; onBlur: () => void; onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => { onChange(editValue); onBlur(); setIsEditing(false); };

  if (isEditing) {
    return (
      <input
        type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); onKeyDown(e); }}
        autoFocus className="w-full px-1"
        style={{ border: 'none', outline: '2px solid #f57c00', background: '#fff', borderRadius: '2px', fontSize: '12px', fontFamily: 'inherit', height: '22px' }}
      />
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-red-100 w-full h-full flex items-center"
      onClick={() => { setEditValue(value); setIsEditing(true); }}
      style={{ minHeight: '22px', fontSize: '12px', fontFamily: 'inherit' }}
      title="클릭하여 수정"
    >
      {value || <span style={{ color: '#999', fontStyle: 'italic' }}>{placeholder}</span>}
    </div>
  );
}

function SeverityCell({ value, onChange, saveToLocalStorage }: { value: number | undefined; onChange: (val: number | undefined) => void; saveToLocalStorage: () => void; }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => { const newVal = e.target.value ? Number(e.target.value) : undefined; onChange(newVal); saveToLocalStorage(); }}
      className="w-full text-center"
      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', fontWeight: 700, height: '24px', cursor: 'pointer' }}
    >
      <option value="">-</option>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n} style={{ fontWeight: n >= 8 ? 700 : 400, color: n >= 8 ? '#f57c00' : 'inherit' }}>{n}</option>)}
    </select>
  );
}

export function FailureColgroup() {
  return <colgroup><col style={{ width: '22%' }} /><col style={{ width: '8%' }} /><col style={{ width: '22%' }} /><col style={{ width: '20%' }} /><col style={{ width: '28%' }} /></colgroup>;
}

export function FailureHeader() {
  return (
    <>
      <tr>
        <th colSpan={2} style={{ ...stickyFirstColStyle, zIndex: 15, background: FAIL_COLORS.l1Main, color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '12px' }}>1. 고장영향(FE) / 심각도(S)</th>
        <th style={{ background: FAIL_COLORS.l2Main, color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '12px' }}>2. 고장형태(FM)</th>
        <th colSpan={2} style={{ background: FAIL_COLORS.l3Main, color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '12px' }}>3. 고장원인(FC)</th>
      </tr>
      <tr>
        <th style={{ ...stickyFirstColStyle, zIndex: 15, background: FAIL_COLORS.l1Sub, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '12px' }}>고장영향(FE)</th>
        <th style={{ background: FAIL_COLORS.l1Sub, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '12px', textAlign: 'center' }}>S</th>
        <th style={{ background: FAIL_COLORS.l2Sub, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '12px' }}>고장형태(FM)</th>
        <th style={{ background: FAIL_COLORS.l3Sub, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '12px' }}>작업요소</th>
        <th style={{ background: FAIL_COLORS.l3Sub, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '12px' }}>고장원인(FC)</th>
      </tr>
    </>
  );
}

export function FailureRow({
  row, idx, l1Spans, l2Spans, state, setState, setDirty, handleInputBlur, handleInputKeyDown, saveToLocalStorage,
}: FailureTabProps & { row: FlatRow; idx: number }) {
  return (
    <>
      {l1Spans[idx] > 0 && (
        <td 
          rowSpan={l1Spans[idx]} 
          style={{ ...stickyFirstColStyle, zIndex: 5, border: `1px solid ${COLORS.line}`, padding: '2px 4px', background: FAIL_COLORS.l1Cell, verticalAlign: 'middle', wordBreak: 'break-word' }}
        >
          <EditableCell
            value={row.l1FailureEffect} placeholder="고장영향(FE) 입력" bgColor={FAIL_COLORS.l1Cell}
            onChange={(val) => { setState(prev => ({ ...prev, l1: { ...prev.l1, failureEffect: val } })); setDirty(true); }}
            onBlur={handleInputBlur} onKeyDown={handleInputKeyDown}
          />
        </td>
      )}
      {l1Spans[idx] > 0 && (
        <td rowSpan={l1Spans[idx]} style={{ border: `1px solid ${COLORS.line}`, padding: '0', background: row.l1Severity && Number(row.l1Severity) >= 8 ? '#ffe0b2' : FAIL_COLORS.l1Cell, verticalAlign: 'middle', textAlign: 'center' }}>
          <SeverityCell value={row.l1Severity ? Number(row.l1Severity) : undefined} onChange={(val) => { setState(prev => ({ ...prev, l1: { ...prev.l1, severity: val } })); setDirty(true); }} saveToLocalStorage={saveToLocalStorage} />
        </td>
      )}
      {l2Spans[idx] > 0 && (
        <td rowSpan={l2Spans[idx]} style={{ border: `1px solid ${COLORS.line}`, padding: '2px 4px', background: FAIL_COLORS.l2Cell, verticalAlign: 'middle', wordBreak: 'break-word' }}>
          <EditableCell
            value={row.l2FailureMode} placeholder={`${row.l2No} ${row.l2Name} 고장형태`} bgColor={FAIL_COLORS.l2Cell}
            onChange={(val) => { setState(prev => ({ ...prev, l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, failureMode: val } : p) })); setDirty(true); }}
            onBlur={handleInputBlur} onKeyDown={handleInputKeyDown}
          />
        </td>
      )}
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '2px 4px', background: FAIL_COLORS.l3Cell, fontSize: '12px', textAlign: 'center' }}>
        <span style={{ background: row.m4 === 'MN' ? '#e3f2fd' : row.m4 === 'MC' ? '#fff3e0' : row.m4 === 'IM' ? '#e8f5e9' : '#fce4ec', padding: '1px 4px', borderRadius: '3px', fontWeight: 600, fontSize: '9px' }}>[{row.m4}]</span>
        <span style={{ marginLeft: '4px' }}>{row.l3Name}</span>
      </td>
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '2px 4px', background: FAIL_COLORS.l3Cell, wordBreak: 'break-word' }}>
        <EditableCell
          value={row.l3FailureCause} placeholder="고장원인(FC) 입력" bgColor={FAIL_COLORS.l3Cell}
          onChange={(val) => { setState(prev => ({ ...prev, l2: prev.l2.map(p => ({ ...p, l3: p.l3.map(w => w.id === row.l3Id ? { ...w, failureCause: val } : w) })) })); setDirty(true); }}
          onBlur={handleInputBlur} onKeyDown={handleInputKeyDown}
        />
      </td>
    </>
  );
}

export default function FailureTab(props: FailureTabProps) {
  const { rows } = props;
  return (
    <>
      <FailureColgroup />
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <FailureHeader />
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={5} className="text-center text-gray-400 py-8">구조분석 탭에서 데이터를 먼저 입력하세요.</td></tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={`${row.l1TypeId}-${row.l2Id}-${row.l3Id}`} style={{ height: '28px', background: idx % 2 === 1 ? COLORS.failure.zebra : COLORS.failure.light }}>
              <FailureRow {...props} row={row} idx={idx} />
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}
