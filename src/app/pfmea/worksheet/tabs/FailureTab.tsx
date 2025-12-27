/**
 * @file FailureTab.tsx
 * @description FMEA 워크시트 - 고장분석(4단계) 탭
 * @author AI Assistant
 * @created 2025-12-27
 */

'use client';

import React from 'react';
import { WorksheetState, COLORS } from '../constants';

interface FlatRow {
  l1Id: string;
  l1FailureEffect: string;
  l1Severity: number | undefined;
  l2Id: string;
  l2No: string;
  l2Name: string;
  l2FailureMode: string;
  l3Id: string;
  m4: string;
  l3Name: string;
  l3FailureCause: string;
}

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

/**
 * 고장분석 탭 - 테이블 헤더
 */
export function FailureHeader() {
  return (
    <>
      <tr>
        <th colSpan={2} style={{ background: '#ffcdd2', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>1. 고장영향(FE) / 심각도</th>
        <th style={{ background: '#ef9a9a', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>2. 고장형태(FM)</th>
        <th colSpan={2} style={{ background: '#e57373', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px', color: '#fff' }}>3. 작업요소 고장원인(FC)</th>
      </tr>
      <tr>
        <th style={{ width: '22%', background: '#ffebee', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>고장영향(FE)</th>
        <th style={{ width: '10%', background: '#ffebee', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>심각도</th>
        <th style={{ width: '22%', background: '#ffcdd2', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>고장형태(FM)</th>
        <th style={{ width: '20%', background: '#ef9a9a', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>작업요소</th>
        <th style={{ width: '26%', background: '#ef9a9a', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>고장원인(FC)</th>
      </tr>
    </>
  );
}

/**
 * 고장분석 탭 - 테이블 행 (데이터 셀)
 */
export function FailureRow({
  row,
  idx,
  l1Spans,
  l2Spans,
  state,
  setState,
  setDirty,
  handleInputBlur,
  handleInputKeyDown,
  saveToLocalStorage,
}: FailureTabProps & { row: FlatRow; idx: number }) {
  return (
    <>
      {/* L1: 고장영향 */}
      {l1Spans[idx] > 0 && (
        <td 
          rowSpan={l1Spans[idx]} 
          className="text-xs" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            background: '#ffebee', 
            verticalAlign: 'middle' 
          }}
        >
          <input 
            type="text" 
            value={row.l1FailureEffect}
            onChange={(e) => { 
              setState(prev => ({ ...prev, l1: { ...prev.l1, failureEffect: e.target.value } })); 
              setDirty(true); 
            }}
            onBlur={handleInputBlur} 
            onKeyDown={handleInputKeyDown}
            placeholder="고장영향(FE) 입력" 
            className="w-full bg-transparent border-0 outline-none text-xs" 
            style={{ height: '20px' }} 
          />
        </td>
      )}
      
      {/* L1: 심각도 */}
      {l1Spans[idx] > 0 && (
        <td 
          rowSpan={l1Spans[idx]} 
          className="text-xs text-center" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            background: '#ffebee', 
            verticalAlign: 'middle' 
          }}
        >
          <select 
            value={row.l1Severity || ''}
            onChange={(e) => { 
              setState(prev => ({ 
                ...prev, 
                l1: { 
                  ...prev.l1, 
                  severity: e.target.value ? Number(e.target.value) : undefined 
                } 
              })); 
              setDirty(true); 
              saveToLocalStorage(); 
            }}
            className="w-full bg-transparent border-0 outline-none text-xs text-center" 
            style={{ height: '20px' }}
          >
            <option value="">-</option>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </td>
      )}
      
      {/* L2: 고장형태 */}
      {l2Spans[idx] > 0 && (
        <td 
          rowSpan={l2Spans[idx]} 
          className="text-xs" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            background: '#ffcdd2', 
            verticalAlign: 'middle' 
          }}
        >
          <input 
            type="text" 
            value={row.l2FailureMode}
            onChange={(e) => { 
              setState(prev => ({ 
                ...prev, 
                l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, failureMode: e.target.value } : p) 
              })); 
              setDirty(true); 
            }}
            onBlur={handleInputBlur} 
            onKeyDown={handleInputKeyDown}
            placeholder={`${row.l2No} ${row.l2Name} 고장형태`} 
            className="w-full bg-transparent border-0 outline-none text-xs" 
            style={{ height: '20px' }} 
          />
        </td>
      )}
      
      {/* L3: 작업요소 */}
      <td 
        className="text-xs text-center" 
        style={{ 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          background: '#fce4ec' 
        }}
      >
        [{row.m4}] {row.l3Name}
      </td>
      
      {/* L3: 고장원인 */}
      <td 
        className="text-xs" 
        style={{ 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          background: '#fce4ec' 
        }}
      >
        <input 
          type="text" 
          value={row.l3FailureCause}
          onChange={(e) => { 
            setState(prev => ({ 
              ...prev, 
              l2: prev.l2.map(p => ({ 
                ...p, 
                l3: p.l3.map(w => w.id === row.l3Id ? { ...w, failureCause: e.target.value } : w) 
              })) 
            })); 
            setDirty(true); 
          }}
          onBlur={handleInputBlur} 
          onKeyDown={handleInputKeyDown}
          placeholder="고장원인(FC) 입력" 
          className="w-full bg-transparent border-0 outline-none text-xs" 
          style={{ height: '20px' }} 
        />
      </td>
    </>
  );
}

/**
 * 고장분석 탭 - 전체 컴포넌트
 */
export default function FailureTab(props: FailureTabProps) {
  const { rows } = props;
  
  return (
    <>
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <FailureHeader />
      </thead>
      
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <FailureRow {...props} row={row} idx={idx} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

