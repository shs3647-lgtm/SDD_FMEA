/**
 * @file StructureTab.tsx
 * @description FMEA 워크시트 - 구조분석(2단계) 탭
 */

'use client';

import React, { useState, useRef } from 'react';
import { WorksheetState, COLORS, FlatRow, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../constants';

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
  saveToLocalStorage?: () => void; // 영구 저장 함수
}

// 4M 셀 - 읽기 전용 표시 (수정/삭제는 작업요소 모달에서)
function M4Cell({ value }: { value: string }) {
  const m4CellStyle: React.CSSProperties = {
    width: '20px', maxWidth: '20px', minWidth: '20px', border: `1px solid ${COLORS.line}`,
    padding: '0', textAlign: 'center', fontSize: FONT_SIZES.cell, fontWeight: FONT_WEIGHTS.semibold,
    background: '#fff8e1',
  };

  return (
    <td style={m4CellStyle}>
      {value || <span style={{ color: '#c62828', fontWeight: 600 }}>-</span>}
    </td>
  );
}

function EditableL3Cell({ 
  value, l3Id, l2Id, state, setState, setDirty, handleSelect, setTargetL2Id, setIsWorkElementModalOpen, saveToLocalStorage 
}: { 
  value: string; l3Id: string; l2Id: string; state: WorksheetState; setState: React.Dispatch<React.SetStateAction<WorksheetState>>; 
  setDirty: (dirty: boolean) => void; handleSelect: (type: 'L1' | 'L2' | 'L3', id: string | null) => void;
  setTargetL2Id: (id: string | null) => void; setIsWorkElementModalOpen: (open: boolean) => void;
  saveToLocalStorage?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlaceholder = value.includes('추가') || value.includes('클릭') || value.includes('필요');

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
      saveToLocalStorage?.(); // 영구 저장
    }
    setIsEditing(false);
  };

  // 모달 열기
  const openModal = () => {
    handleSelect('L3', l3Id);
    setTargetL2Id(l2Id);
    setIsWorkElementModalOpen(true);
  };

  // 클릭 → 모달 열기 (추가/삭제/선택)
  const handleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    
    clickTimerRef.current = setTimeout(() => {
      openModal();
      clickTimerRef.current = null;
    }, 200);
  };

  // 더블클릭 → 인라인 수정 (빠른 텍스트 편집)
  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (!isPlaceholder) {
      setEditValue(value); 
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <td style={{ border: `1px solid ${COLORS.line}`, padding: '2px', background: '#fff3e0' }}>
        <input
          type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
          autoFocus className="w-full px-1"
          style={{ border: 'none', outline: '2px solid #ff9800', background: '#fff', borderRadius: '2px', fontSize: FONT_SIZES.cell, fontFamily: 'inherit' }}
        />
      </td>
    );
  }

  return (
    <td 
      className="cursor-pointer hover:bg-orange-100"
      style={{ 
        border: `1px solid ${COLORS.line}`, padding: '2px 4px', 
        background: isPlaceholder ? 'repeating-linear-gradient(45deg, #fff, #fff 4px, #fff3e0 4px, #fff3e0 8px)' : '#fff3e0', 
        wordBreak: 'break-word', fontSize: FONT_SIZES.cell, fontFamily: 'inherit',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={isPlaceholder ? '클릭: 작업요소 추가' : '클릭: 모달 | 더블클릭: 텍스트 수정'}
    >
      {isPlaceholder ? <span style={{ color: '#c62828', fontWeight: 700 }}>🔍 클릭</span> : <span style={{ fontWeight: 400 }}>{value}</span>}
    </td>
  );
}

export function StructureColgroup() {
  return <colgroup><col style={{ width: '30%' }} /><col style={{ width: '30%' }} /><col style={{ width: '20px' }} /><col /></colgroup>;
}

interface MissingCounts {
  l1Count: number;  // 완제품 공정 누락
  l2Count: number;  // 메인공정명 누락
  l3Count: number;  // 작업요소 누락
}

export function StructureHeader({ onProcessModalOpen, missingCounts }: { onProcessModalOpen: () => void; missingCounts?: MissingCounts }) {
  return (
    <>
      <tr>
        <th style={{ width: '30%', background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: HEIGHTS.header, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center', fontSize: FONT_SIZES.header1 }}>
          1. 완제품 공정명
          {missingCounts && missingCounts.l1Count > 0 && (
            <span style={{ marginLeft: '6px', background: '#fff', color: '#c62828', padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 700 }}>
              {missingCounts.l1Count}
            </span>
          )}
        </th>
        <th onClick={onProcessModalOpen} className="cursor-pointer hover:bg-green-600" style={{ width: '30%', background: '#388e3c', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: HEIGHTS.header, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center', fontSize: FONT_SIZES.header1 }}>
          2. 메인 공정명 🔍
          {missingCounts && missingCounts.l2Count > 0 && (
            <span style={{ marginLeft: '6px', background: '#fff', color: '#c62828', padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 700 }}>
              {missingCounts.l2Count}
            </span>
          )}
        </th>
        <th colSpan={2} style={{ background: '#f57c00', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: HEIGHTS.header, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center', fontSize: FONT_SIZES.header1 }}>
          3. 작업 요소명
          {missingCounts && missingCounts.l3Count > 0 && (
            <span style={{ marginLeft: '6px', background: '#fff', color: '#c62828', padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 700 }}>
              {missingCounts.l3Count}
            </span>
          )}
        </th>
      </tr>
      <tr>
        <th style={{ background: '#90caf9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: HEIGHTS.header, fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.header2 }}>완제품명+라인</th>
        <th style={{ background: '#a5d6a7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: HEIGHTS.header, fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.header2 }}>공정NO+공정명</th>
        <th style={{ width: '20px', maxWidth: '20px', minWidth: '20px', background: '#ffcc80', border: `1px solid ${COLORS.line}`, padding: '0', height: HEIGHTS.header, fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell }}>4M</th>
        <th style={{ background: '#ffcc80', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: HEIGHTS.header, fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.header2 }}>작업요소</th>
      </tr>
    </>
  );
}

export function StructureRow({
  row, idx, l2Spans, state, setState, setDirty, handleInputBlur, handleInputKeyDown, handleSelect, setIsProcessModalOpen, setIsWorkElementModalOpen, setTargetL2Id, saveToLocalStorage,
}: StructureTabProps & { row: FlatRow; idx: number }) {
  // 완제품 공정명과 메인 공정명이 1:1로 병합되도록 l2Spans 사용
  const spanCount = l2Spans[idx];
  const showMergedCells = spanCount > 0;
  
  return (
    <>
      {/* 완제품 공정명: 메인 공정명과 동일하게 l2Spans 기준 병합 (1:1 매칭) */}
      {showMergedCells && (
        <td 
          rowSpan={spanCount} className="text-center text-xs"
          style={{ 
            border: `1px solid ${COLORS.line}`, padding: '4px', background: '#e3f2fd', verticalAlign: 'middle', wordBreak: 'break-word',
          }}
        >
          <input
            type="text" value={state.l1.name}
            onChange={(e) => { setState(prev => ({ ...prev, l1: { ...prev.l1, name: e.target.value } })); setDirty(true); }}
            onBlur={handleInputBlur} onKeyDown={handleInputKeyDown} placeholder="완제품명 입력"
            className="w-full text-center border-0 outline-none text-xs font-semibold"
            style={{ minHeight: '24px', background: 'rgba(255,255,255,0.95)', borderRadius: '3px', padding: '4px' }}
          />
        </td>
      )}
      
      {/* 메인 공정명: l2Spans 기준 병합 */}
      {showMergedCells && (
        <td 
          rowSpan={spanCount} className="text-center cursor-pointer hover:bg-green-200 text-xs"
          style={{ 
            border: `1px solid ${COLORS.line}`, padding: '4px', background: row.l2Name.includes('클릭') ? '#fff' : '#e8f5e9', verticalAlign: 'middle', wordBreak: 'break-word',
          }}
          onClick={() => { handleSelect('L2', row.l2Id); setIsProcessModalOpen(true); }}
        >
          {row.l2Name.includes('클릭') ? <span style={{ color: '#c62828', fontWeight: 700 }}>🔍 클릭하여 공정 선택</span> : <span style={{ fontWeight: 600 }}>{row.l2No} {row.l2Name} 🔍</span>}
        </td>
      )}
      <M4Cell value={row.m4} />
      <EditableL3Cell value={row.l3Name} l3Id={row.l3Id} l2Id={row.l2Id} state={state} setState={setState} setDirty={setDirty} handleSelect={handleSelect} setTargetL2Id={setTargetL2Id} setIsWorkElementModalOpen={setIsWorkElementModalOpen} saveToLocalStorage={saveToLocalStorage} />
    </>
  );
}

export default function StructureTab(props: StructureTabProps) {
  const { rows, setIsProcessModalOpen, state } = props;
  
  // 누락 건수 계산 (rows 배열 기반 - 화면에 표시되는 것과 일치)
  const missingCounts = React.useMemo(() => {
    const isMissing = (name: string | undefined | null) => {
      if (name === null || name === undefined) return true;
      if (!name) return true;
      const trimmed = String(name).trim();
      if (trimmed === '' || trimmed === '-') return true;
      if (String(name).includes('클릭')) return true;
      if (String(name).includes('추가')) return true;
      if (String(name).includes('선택')) return true;
      if (String(name).includes('입력')) return true;
      if (String(name).includes('필요')) return true;
      return false;
    };
    
    let l1Count = 0;  // 완제품 공정 누락
    let l2Count = 0;  // 메인공정명 누락 (중복 제거)
    let l3Count = 0;  // 작업요소 누락
    let m4Count = 0;  // 4M 누락
    
    // 완제품 공정명 체크
    if (isMissing(state.l1.name)) l1Count++;
    
    // 중복 제거를 위한 Set
    const checkedL2 = new Set<string>();
    
    // rows 배열 기반으로 체크 (화면에 표시되는 것과 일치)
    rows.forEach(row => {
      // 메인공정명 누락 체크 (중복 제거)
      if (!checkedL2.has(row.l2Id) && isMissing(row.l2Name)) {
        l2Count++;
        checkedL2.add(row.l2Id);
      }
      
      // 작업요소명 누락 체크
      if (isMissing(row.l3Name)) l3Count++;
      
      // 4M 누락 체크
      if (isMissing(row.m4)) m4Count++;
    });
    
    return { l1Count, l2Count, l3Count: l3Count + m4Count };
  }, [state.l1.name, rows]);
  
  return (
    <>
      <StructureColgroup />
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <StructureHeader onProcessModalOpen={() => setIsProcessModalOpen(true)} missingCounts={missingCounts} />
      </thead>
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
