/**
 * @file StructureTab.tsx
 * @description FMEA 워크시트 - 구조분석(2단계) 탭
 * @author AI Assistant
 * @created 2025-12-27
 */

'use client';

import React, { useState } from 'react';
import { WorksheetState, Process, L1Data, COLORS } from '../constants';

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

interface StructureTabProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
  setDirty: (dirty: boolean) => void;
  handleInputBlur: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent) => void;
  handleSelect: (type: 'L1' | 'L2' | 'L3', id: string | null) => void;
  setIsProcessModalOpen: (open: boolean) => void;
  setIsWorkElementModalOpen: (open: boolean) => void;
  setTargetL2Id: (id: string | null) => void;
}

const M4_OPTIONS = ['MN', 'MC', 'MT', 'EN'];

/**
 * 4M 셀 - 클릭하여 수정 가능
 */
function EditableM4Cell({ 
  value, l3Id, state, setState, setDirty 
}: { 
  value: string; 
  l3Id: string; 
  state: WorksheetState; 
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>; 
  setDirty: (dirty: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(p => ({
        ...p,
        l3: p.l3.map(w => w.id === l3Id ? { ...w, m4: editValue } : w)
      }))
    }));
    setDirty(true);
    setIsEditing(false);
  };

  // 4M 셀 고정 스타일 (20px 고정)
  const m4CellStyle: React.CSSProperties = {
    width: '20px',
    maxWidth: '20px',
    minWidth: '20px',
    borderTop: `1px solid ${COLORS.line}`,
    borderRight: `1px solid ${COLORS.line}`,
    borderBottom: `1px solid ${COLORS.line}`,
    borderLeft: `1px solid ${COLORS.line}`,
    padding: '0',
    textAlign: 'center',
    fontSize: '8px',
    fontWeight: 700,
    overflow: 'hidden',
  };

  if (isEditing) {
    return (
      <td style={{ ...m4CellStyle, background: '#fffde7' }}>
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
          autoFocus
          style={{ width: '100%', border: 'none', outline: '1px solid #ffc107', background: '#fffde7', fontSize: '7px', padding: '0', textAlign: 'center' }}
        >
          <option value="">-</option>
          {M4_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
    );
  }

  return (
    <td 
      className="cursor-pointer hover:bg-yellow-200" 
      style={{ ...m4CellStyle, background: '#fff8e1' }}
      onClick={() => { setEditValue(value); setIsEditing(true); }}
      title="클릭하여 수정"
    >
      {value || <span style={{ color: '#999' }}>-</span>}
    </td>
  );
}

/**
 * 작업요소(L3) 셀 - 클릭하여 수정 가능
 */
function EditableL3Cell({ 
  value, l3Id, l2Id, state, setState, setDirty, handleSelect, setTargetL2Id, setIsWorkElementModalOpen 
}: { 
  value: string; 
  l3Id: string;
  l2Id: string;
  state: WorksheetState; 
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>; 
  setDirty: (dirty: boolean) => void;
  handleSelect: (type: 'L1' | 'L2' | 'L3', id: string | null) => void;
  setTargetL2Id: (id: string | null) => void;
  setIsWorkElementModalOpen: (open: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  
  const isPlaceholder = value.includes('추가') || value.includes('클릭');

  const handleSave = () => {
    if (editValue.trim() && editValue !== value) {
      setState(prev => ({
        ...prev,
        l2: prev.l2.map(p => ({
          ...p,
          l3: p.l3.map(w => w.id === l3Id ? { ...w, name: editValue.trim() } : w)
        }))
      }));
      setDirty(true);
    }
    setIsEditing(false);
  };

  // 플레이스홀더면 모달 열기
  const handleClick = () => {
    if (isPlaceholder) {
      handleSelect('L3', l3Id);
      setTargetL2Id(l2Id);
      setIsWorkElementModalOpen(true);
    } else {
      setEditValue(value);
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <td style={{ 
        borderTop: `1px solid ${COLORS.line}`,
        borderRight: `1px solid ${COLORS.line}`,
        borderBottom: `1px solid ${COLORS.line}`,
        borderLeft: `1px solid ${COLORS.line}`,
        padding: '2px', 
        background: '#fff3e0' 
      }}>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
          autoFocus
          className="w-full text-xs px-1"
          style={{ border: 'none', outline: '2px solid #ff9800', background: '#fff', borderRadius: '2px' }}
        />
      </td>
    );
  }

  return (
    <td 
      className="cursor-pointer hover:bg-orange-100 text-xs"
      style={{ 
        borderTop: `1px solid ${COLORS.line}`,
        borderRight: `1px solid ${COLORS.line}`,
        borderBottom: `1px solid ${COLORS.line}`,
        borderLeft: `1px solid ${COLORS.line}`,
        padding: '2px 4px', 
        background: isPlaceholder 
          ? 'repeating-linear-gradient(45deg, #fff, #fff 4px, #fff3e0 4px, #fff3e0 8px)' 
          : '#fff3e0', 
        wordBreak: 'break-word' 
      }}
      onClick={handleClick}
      title={isPlaceholder ? '클릭하여 작업요소 추가' : '클릭하여 수정'}
    >
      {isPlaceholder 
        ? <span className="text-orange-600 font-bold">🔍 클릭</span> 
        : <span>{value} ✏️</span>
      }
    </td>
  );
}

/**
 * 구조분석 탭 - Colgroup (열 너비 정의)
 */
export function StructureColgroup() {
  return (
    <colgroup><col style={{ width: '30%' }} /><col style={{ width: '30%' }} /><col style={{ width: '20px' }} /><col style={{ width: '40%' }} /></colgroup>
  );
}

/**
 * 구조분석 탭 - 테이블 헤더
 */
// 첫 번째 열(완제품공정명) sticky 스타일
const stickyFirstColStyle: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 5,
};

export function StructureHeader({
  onProcessModalOpen
}: {
  onProcessModalOpen: () => void;
}) {
  return (
    <>
      {/* 메인 헤더 - 진한 색상 */}
      <tr>
        <th style={{ ...stickyFirstColStyle, zIndex: 15, width: '30%', background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>1. 완제품 공정명</th>
        <th onClick={onProcessModalOpen} className="cursor-pointer hover:bg-green-600" style={{ width: '30%', background: '#388e3c', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>2. 메인 공정명 🔍</th>
        <th colSpan={2} style={{ background: '#f57c00', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>3. 작업 요소명</th>
      </tr>
      {/* 서브 헤더 - 중간 색상 */}
      <tr>
        <th style={{ ...stickyFirstColStyle, zIndex: 15, background: '#90caf9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>완제품명+라인</th>
        <th style={{ background: '#a5d6a7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>공정NO+공정명</th>
        <th style={{ width: '20px', maxWidth: '20px', minWidth: '20px', background: '#ffcc80', border: `1px solid ${COLORS.line}`, padding: '0', height: '22px', fontWeight: 700, fontSize: '8px' }}>4M</th>
        <th style={{ background: '#ffcc80', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>작업요소</th>
      </tr>
    </>
  );
}

/**
 * 구조분석 탭 - 테이블 행 (데이터 셀)
 */
export function StructureRow({
  row,
  idx,
  l1Spans,
  l2Spans,
  state,
  setState,
  setDirty,
  handleInputBlur,
  handleInputKeyDown,
  handleSelect,
  setIsProcessModalOpen,
  setIsWorkElementModalOpen,
  setTargetL2Id,
}: StructureTabProps & { row: FlatRow; idx: number }) {
  // L2 기준으로 셀 합치기 (L1과 L2는 1:1 매칭)
  const spanCount = l2Spans[idx];
  const showMergedCells = spanCount > 0;
  
  return (
    <>
      {/* L1: 완제품명 (L2와 1:1 매칭, 작업요소 추가 시 셀 합치기) */}
      {showMergedCells && (
        <td 
          rowSpan={spanCount}
          className="text-center text-xs"
          style={{ 
            position: 'sticky',
            left: 0,
            zIndex: 5,
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '4px', 
            background: '#e3f2fd',
            verticalAlign: 'middle', 
            wordBreak: 'break-word',
          }}
        >
          <input
            type="text"
            value={state.l1.name}
            onChange={(e) => {
              setState(prev => ({ ...prev, l1: { ...prev.l1, name: e.target.value } }));
              setDirty(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="완제품명 입력"
            className="w-full text-center border-0 outline-none text-xs font-semibold"
            style={{ minHeight: '24px', background: 'rgba(255,255,255,0.95)', borderRadius: '3px', padding: '4px' }}
          />
        </td>
      )}
      
      {/* L2: 메인공정 (L1과 1:1 매칭, 작업요소 추가 시 셀 합치기) */}
      {showMergedCells && (
        <td 
          rowSpan={spanCount}
          className="text-center cursor-pointer hover:bg-green-200 text-xs"
          style={{ 
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '4px', 
            background: row.l2Name.includes('클릭') ? '#fff' : '#e8f5e9',
            verticalAlign: 'middle', 
            wordBreak: 'break-word',
          }}
          onClick={() => { 
            handleSelect('L2', row.l2Id); 
            setIsProcessModalOpen(true); 
          }}
        >
          {row.l2Name.includes('클릭') 
            ? <span className="text-green-600 font-bold">🔍 클릭하여 공정 선택</span> 
            : <span style={{ fontWeight: 600 }}>{row.l2No} {row.l2Name} 🔍</span>
          }
        </td>
      )}
      
      {/* 4M - 클릭하여 수정 */}
      <EditableM4Cell
        value={row.m4}
        l3Id={row.l3Id}
        state={state}
        setState={setState}
        setDirty={setDirty}
      />
      
      {/* L3: 작업요소 - 클릭하여 수정 */}
      <EditableL3Cell
        value={row.l3Name}
        l3Id={row.l3Id}
        l2Id={row.l2Id}
        state={state}
        setState={setState}
        setDirty={setDirty}
        handleSelect={handleSelect}
        setTargetL2Id={setTargetL2Id}
        setIsWorkElementModalOpen={setIsWorkElementModalOpen}
      />
    </>
  );
}

/**
 * 구조분석 탭 - 전체 컴포넌트
 */
export default function StructureTab(props: StructureTabProps) {
  const { rows, setIsProcessModalOpen } = props;
  
  return (
    <>
      {/* Colgroup */}
      <StructureColgroup />
      
      {/* Header - sticky 고정 */}
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <StructureHeader onProcessModalOpen={() => setIsProcessModalOpen(true)} />
      </thead>
      
      {/* Body */}
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <StructureRow {...props} row={row} idx={idx} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

