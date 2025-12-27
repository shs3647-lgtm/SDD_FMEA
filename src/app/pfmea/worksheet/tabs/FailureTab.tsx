/**
 * @file FailureTab.tsx
 * @description FMEA 워크시트 - 고장분석(4단계) 탭
 * @author AI Assistant
 * @created 2025-12-27
 * @updated 구조분석과 동일한 스타일 적용
 */

'use client';

import React, { useState } from 'react';
import { WorksheetState, COLORS } from '../constants';

interface FlatRow {
  l1Id: string;
  l1Name: string;
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

// 고장분석 테마 색상
const FAIL_COLORS = {
  l1Main: '#c62828',      // 빨강 진한
  l1Sub: '#ef9a9a',       // 빨강 중간
  l1Cell: '#ffebee',      // 빨강 연한
  l2Main: '#ad1457',      // 핑크 진한  
  l2Sub: '#f48fb1',       // 핑크 중간
  l2Cell: '#fce4ec',      // 핑크 연한
  l3Main: '#6a1b9a',      // 퍼플 진한
  l3Sub: '#ce93d8',       // 퍼플 중간
  l3Cell: '#f3e5f5',      // 퍼플 연한
};

// 스티키 첫 번째 열 스타일
const stickyFirstColStyle: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 10,
};

/**
 * 편집 가능한 텍스트 셀
 */
function EditableCell({
  value,
  placeholder,
  bgColor,
  onChange,
  onBlur,
  onKeyDown,
}: {
  value: string;
  placeholder: string;
  bgColor: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(editValue);
    onBlur();
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setIsEditing(false);
          onKeyDown(e);
        }}
        autoFocus
        className="w-full px-1"
        style={{
          border: 'none',
          outline: '2px solid #c62828',
          background: '#fff',
          borderRadius: '2px',
          fontSize: '10px',
          fontFamily: 'inherit',
          height: '22px',
        }}
      />
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-red-100 w-full h-full flex items-center"
      onClick={() => {
        setEditValue(value);
        setIsEditing(true);
      }}
      style={{ minHeight: '22px', fontSize: '10px', fontFamily: 'inherit' }}
      title="클릭하여 수정"
    >
      {value || <span style={{ color: '#999', fontStyle: 'italic' }}>{placeholder}</span>}
    </div>
  );
}

/**
 * 심각도 드롭다운 셀
 */
function SeverityCell({
  value,
  onChange,
  saveToLocalStorage,
}: {
  value: number | undefined;
  onChange: (val: number | undefined) => void;
  saveToLocalStorage: () => void;
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => {
        const newVal = e.target.value ? Number(e.target.value) : undefined;
        onChange(newVal);
        saveToLocalStorage();
      }}
      className="w-full text-center"
      style={{
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: '11px',
        fontWeight: 700,
        height: '24px',
        cursor: 'pointer',
      }}
    >
      <option value="">-</option>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
        <option key={n} value={n} style={{ fontWeight: n >= 8 ? 700 : 400, color: n >= 8 ? '#c62828' : 'inherit' }}>
          {n}
        </option>
      ))}
    </select>
  );
}

/**
 * 고장분석 탭 - Colgroup
 */
export function FailureColgroup() {
  return (
    <colgroup>
      <col style={{ width: '22%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '22%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '28%' }} />
    </colgroup>
  );
}

/**
 * 고장분석 탭 - 테이블 헤더
 */
export function FailureHeader() {
  return (
    <>
      {/* 메인 헤더 - 진한 색상 */}
      <tr>
        <th 
          colSpan={2} 
          style={{ 
            ...stickyFirstColStyle, 
            zIndex: 15, 
            background: FAIL_COLORS.l1Main, 
            color: 'white', 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '1px 4px', 
            height: '25px', 
            fontWeight: 900, 
            textAlign: 'center', 
            fontSize: '11px' 
          }}
        >
          1. 고장영향(FE) / 심각도(S)
        </th>
        <th 
          style={{ 
            background: FAIL_COLORS.l2Main, 
            color: 'white', 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '1px 4px', 
            height: '25px', 
            fontWeight: 900, 
            textAlign: 'center', 
            fontSize: '11px' 
          }}
        >
          2. 고장형태(FM)
        </th>
        <th 
          colSpan={2} 
          style={{ 
            background: FAIL_COLORS.l3Main, 
            color: 'white', 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '1px 4px', 
            height: '25px', 
            fontWeight: 900, 
            textAlign: 'center', 
            fontSize: '11px' 
          }}
        >
          3. 고장원인(FC)
        </th>
      </tr>
      {/* 서브 헤더 - 중간 색상 */}
      <tr>
        <th 
          style={{ 
            ...stickyFirstColStyle, 
            zIndex: 15, 
            background: FAIL_COLORS.l1Sub, 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '1px 4px', 
            height: '22px', 
            fontWeight: 700, 
            fontSize: '10px' 
          }}
        >
          고장영향(FE)
        </th>
        <th 
          style={{ 
            background: FAIL_COLORS.l1Sub, 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '1px 4px', 
            height: '22px', 
            fontWeight: 700, 
            fontSize: '10px',
            textAlign: 'center',
          }}
        >
          S
        </th>
        <th 
          style={{ 
            background: FAIL_COLORS.l2Sub, 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '1px 4px', 
            height: '22px', 
            fontWeight: 700, 
            fontSize: '10px' 
          }}
        >
          고장형태(FM)
        </th>
        <th 
          style={{ 
            background: FAIL_COLORS.l3Sub, 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '1px 4px', 
            height: '22px', 
            fontWeight: 700, 
            fontSize: '10px' 
          }}
        >
          작업요소
        </th>
        <th 
          style={{ 
            background: FAIL_COLORS.l3Sub, 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '1px 4px', 
            height: '22px', 
            fontWeight: 700, 
            fontSize: '10px' 
          }}
        >
          고장원인(FC)
        </th>
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
  const spanCount = l2Spans[idx];
  const showL1MergedCell = l1Spans[idx] > 0;
  const showL2MergedCell = spanCount > 0;

  return (
    <>
      {/* L1: 고장영향 */}
      {showL1MergedCell && (
        <td 
          rowSpan={l1Spans[idx]} 
          style={{ 
            ...stickyFirstColStyle,
            zIndex: 5,
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '2px 4px', 
            background: FAIL_COLORS.l1Cell, 
            verticalAlign: 'middle',
            wordBreak: 'break-word',
          }}
        >
          <EditableCell
            value={row.l1FailureEffect}
            placeholder="고장영향(FE) 입력"
            bgColor={FAIL_COLORS.l1Cell}
            onChange={(val) => {
              setState(prev => ({ ...prev, l1: { ...prev.l1, failureEffect: val } }));
              setDirty(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        </td>
      )}
      
      {/* L1: 심각도 */}
      {showL1MergedCell && (
        <td 
          rowSpan={l1Spans[idx]} 
          style={{ 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '0', 
            background: row.l1Severity && row.l1Severity >= 8 ? '#ffcdd2' : FAIL_COLORS.l1Cell, 
            verticalAlign: 'middle',
            textAlign: 'center',
          }}
        >
          <SeverityCell
            value={row.l1Severity}
            onChange={(val) => {
              setState(prev => ({ ...prev, l1: { ...prev.l1, severity: val } }));
              setDirty(true);
            }}
            saveToLocalStorage={saveToLocalStorage}
          />
        </td>
      )}
      
      {/* L2: 고장형태 */}
      {showL2MergedCell && (
        <td 
          rowSpan={spanCount} 
          style={{ 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '2px 4px', 
            background: FAIL_COLORS.l2Cell, 
            verticalAlign: 'middle',
            wordBreak: 'break-word',
          }}
        >
          <EditableCell
            value={row.l2FailureMode}
            placeholder={`${row.l2No} ${row.l2Name} 고장형태`}
            bgColor={FAIL_COLORS.l2Cell}
            onChange={(val) => {
              setState(prev => ({
                ...prev,
                l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, failureMode: val } : p)
              }));
              setDirty(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        </td>
      )}
      
      {/* L3: 작업요소 (읽기 전용) */}
      <td 
        style={{ 
          borderTop: `1px solid ${COLORS.line}`,
          borderRight: `1px solid ${COLORS.line}`,
          borderBottom: `1px solid ${COLORS.line}`,
          borderLeft: `1px solid ${COLORS.line}`,
          padding: '2px 4px', 
          background: FAIL_COLORS.l3Cell,
          fontSize: '10px',
          textAlign: 'center',
        }}
      >
        <span 
          style={{ 
            background: row.m4 === 'MN' ? '#e3f2fd' : row.m4 === 'MC' ? '#fff3e0' : row.m4 === 'MT' ? '#e8f5e9' : '#fce4ec',
            padding: '1px 4px',
            borderRadius: '3px',
            fontWeight: 600,
            fontSize: '9px',
          }}
        >
          [{row.m4}]
        </span>
        <span style={{ marginLeft: '4px' }}>{row.l3Name}</span>
      </td>
      
      {/* L3: 고장원인 */}
      <td 
        style={{ 
          borderTop: `1px solid ${COLORS.line}`,
          borderRight: `1px solid ${COLORS.line}`,
          borderBottom: `1px solid ${COLORS.line}`,
          borderLeft: `1px solid ${COLORS.line}`,
          padding: '2px 4px', 
          background: FAIL_COLORS.l3Cell,
          wordBreak: 'break-word',
        }}
      >
        <EditableCell
          value={row.l3FailureCause}
          placeholder="고장원인(FC) 입력"
          bgColor={FAIL_COLORS.l3Cell}
          onChange={(val) => {
            setState(prev => ({
              ...prev,
              l2: prev.l2.map(p => ({
                ...p,
                l3: p.l3.map(w => w.id === row.l3Id ? { ...w, failureCause: val } : w)
              }))
            }));
            setDirty(true);
          }}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
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
      <FailureColgroup />
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <FailureHeader />
      </thead>
      
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center text-gray-400 py-8">
              구조분석 탭에서 데이터를 먼저 입력하세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={row.l3Id} style={{ height: '28px' }}>
              <FailureRow {...props} row={row} idx={idx} />
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}
