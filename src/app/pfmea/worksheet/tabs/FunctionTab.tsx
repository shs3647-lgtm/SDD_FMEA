/**
 * @file FunctionTab.tsx
 * @description FMEA 워크시트 - 기능분석(3단계) 탭
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
  l1Function: string;
  l1Requirement: string;
  l2Id: string;
  l2No: string;
  l2Name: string;
  l2Function: string;
  l2ProductChar: string;
  l3Id: string;
  m4: string;
  l3Name: string;
  l3Function: string;
  l3ProcessChar: string;
}

interface FunctionTabProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
  setDirty: (dirty: boolean) => void;
  handleInputBlur: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent) => void;
}

// 기능분석 테마 색상
const FUNC_COLORS = {
  l1Main: '#7b1fa2',      // 보라 진한
  l1Sub: '#ce93d8',       // 보라 중간
  l1Cell: '#f3e5f5',      // 보라 연한
  l2Main: '#512da8',      // 인디고 진한  
  l2Sub: '#b39ddb',       // 인디고 중간
  l2Cell: '#ede7f6',      // 인디고 연한
  l3Main: '#303f9f',      // 파랑 진한
  l3Sub: '#9fa8da',       // 파랑 중간
  l3Cell: '#e8eaf6',      // 파랑 연한
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
          outline: '2px solid #7b1fa2',
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
      className="cursor-pointer hover:bg-purple-100 w-full h-full flex items-center"
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
 * 기능분석 탭 - Colgroup
 */
export function FunctionColgroup() {
  return (
    <colgroup>
      <col style={{ width: '15%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '17%' }} />
      <col style={{ width: '17%' }} />
      <col style={{ width: '18%' }} />
      <col style={{ width: '18%' }} />
    </colgroup>
  );
}

/**
 * 기능분석 탭 - 테이블 헤더
 */
export function FunctionHeader() {
  return (
    <>
      {/* 메인 헤더 - 진한 색상 */}
      <tr>
        <th 
          colSpan={2} 
          style={{ 
            ...stickyFirstColStyle, 
            zIndex: 15, 
            background: FUNC_COLORS.l1Main, 
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
          1. 완제품 기능/요구사항
        </th>
        <th 
          colSpan={2} 
          style={{ 
            background: FUNC_COLORS.l2Main, 
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
          2. 메인공정 기능/제품특성
        </th>
        <th 
          colSpan={2} 
          style={{ 
            background: FUNC_COLORS.l3Main, 
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
          3. 작업요소 기능/공정특성
        </th>
      </tr>
      {/* 서브 헤더 - 중간 색상 */}
      <tr>
        <th 
          style={{ 
            ...stickyFirstColStyle, 
            zIndex: 15, 
            background: FUNC_COLORS.l1Sub, 
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
          완제품 기능
        </th>
        <th 
          style={{ 
            background: FUNC_COLORS.l1Sub, 
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
          요구사항
        </th>
        <th 
          style={{ 
            background: FUNC_COLORS.l2Sub, 
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
          공정 기능
        </th>
        <th 
          style={{ 
            background: FUNC_COLORS.l2Sub, 
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
          제품특성
        </th>
        <th 
          style={{ 
            background: FUNC_COLORS.l3Sub, 
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
          작업요소 기능
        </th>
        <th 
          style={{ 
            background: FUNC_COLORS.l3Sub, 
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
          공정특성
        </th>
      </tr>
    </>
  );
}

/**
 * 기능분석 탭 - 테이블 행 (데이터 셀)
 */
export function FunctionRow({
  row,
  idx,
  l1Spans,
  l2Spans,
  state,
  setState,
  setDirty,
  handleInputBlur,
  handleInputKeyDown,
}: FunctionTabProps & { row: FlatRow; idx: number }) {
  const spanCount = l2Spans[idx];
  const showL1MergedCell = l1Spans[idx] > 0;
  const showL2MergedCell = spanCount > 0;

  return (
    <>
      {/* L1: 완제품 기능 */}
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
            background: FUNC_COLORS.l1Cell, 
            verticalAlign: 'middle',
            wordBreak: 'break-word',
          }}
        >
          <EditableCell
            value={row.l1Function}
            placeholder="완제품 기능 입력"
            bgColor={FUNC_COLORS.l1Cell}
            onChange={(val) => {
              setState(prev => ({ ...prev, l1: { ...prev.l1, function: val } }));
              setDirty(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        </td>
      )}
      
      {/* L1: 요구사항 */}
      {showL1MergedCell && (
        <td 
          rowSpan={l1Spans[idx]} 
          style={{ 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '2px 4px', 
            background: FUNC_COLORS.l1Cell, 
            verticalAlign: 'middle',
            wordBreak: 'break-word',
          }}
        >
          <EditableCell
            value={row.l1Requirement}
            placeholder="요구사항 입력"
            bgColor={FUNC_COLORS.l1Cell}
            onChange={(val) => {
              setState(prev => ({ ...prev, l1: { ...prev.l1, requirement: val } }));
              setDirty(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        </td>
      )}
      
      {/* L2: 공정 기능 */}
      {showL2MergedCell && (
        <td 
          rowSpan={spanCount} 
          style={{ 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '2px 4px', 
            background: FUNC_COLORS.l2Cell, 
            verticalAlign: 'middle',
            wordBreak: 'break-word',
          }}
        >
          <EditableCell
            value={row.l2Function}
            placeholder={`${row.l2No} ${row.l2Name} 기능`}
            bgColor={FUNC_COLORS.l2Cell}
            onChange={(val) => {
              setState(prev => ({
                ...prev,
                l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, function: val } : p)
              }));
              setDirty(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        </td>
      )}
      
      {/* L2: 제품특성 */}
      {showL2MergedCell && (
        <td 
          rowSpan={spanCount} 
          style={{ 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '2px 4px', 
            background: FUNC_COLORS.l2Cell, 
            verticalAlign: 'middle',
            wordBreak: 'break-word',
          }}
        >
          <EditableCell
            value={row.l2ProductChar}
            placeholder="제품특성 입력"
            bgColor={FUNC_COLORS.l2Cell}
            onChange={(val) => {
              setState(prev => ({
                ...prev,
                l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, productChar: val } : p)
              }));
              setDirty(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        </td>
      )}
      
      {/* L3: 작업요소 기능 */}
      <td 
        style={{ 
          borderTop: `1px solid ${COLORS.line}`,
          borderRight: `1px solid ${COLORS.line}`,
          borderBottom: `1px solid ${COLORS.line}`,
          borderLeft: `1px solid ${COLORS.line}`,
          padding: '2px 4px', 
          background: FUNC_COLORS.l3Cell,
          wordBreak: 'break-word',
        }}
      >
        <EditableCell
          value={row.l3Function}
          placeholder={`[${row.m4}] ${row.l3Name} 기능`}
          bgColor={FUNC_COLORS.l3Cell}
          onChange={(val) => {
            setState(prev => ({
              ...prev,
              l2: prev.l2.map(p => ({
                ...p,
                l3: p.l3.map(w => w.id === row.l3Id ? { ...w, function: val } : w)
              }))
            }));
            setDirty(true);
          }}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
        />
      </td>
      
      {/* L3: 공정특성 */}
      <td 
        style={{ 
          borderTop: `1px solid ${COLORS.line}`,
          borderRight: `1px solid ${COLORS.line}`,
          borderBottom: `1px solid ${COLORS.line}`,
          borderLeft: `1px solid ${COLORS.line}`,
          padding: '2px 4px', 
          background: FUNC_COLORS.l3Cell,
          wordBreak: 'break-word',
        }}
      >
        <EditableCell
          value={row.l3ProcessChar}
          placeholder="공정특성 입력"
          bgColor={FUNC_COLORS.l3Cell}
          onChange={(val) => {
            setState(prev => ({
              ...prev,
              l2: prev.l2.map(p => ({
                ...p,
                l3: p.l3.map(w => w.id === row.l3Id ? { ...w, processChar: val } : w)
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
 * 기능분석 탭 - 전체 컴포넌트
 */
export default function FunctionTab(props: FunctionTabProps) {
  const { rows } = props;
  
  return (
    <>
      <FunctionColgroup />
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <FunctionHeader />
      </thead>
      
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center text-gray-400 py-8">
              구조분석 탭에서 데이터를 먼저 입력하세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={row.l3Id} style={{ height: '28px' }}>
              <FunctionRow {...props} row={row} idx={idx} />
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}
