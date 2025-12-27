/**
 * @file StructureTab.tsx
 * @description FMEA 워크시트 - 구조분석(2단계) 탭
 * @author AI Assistant
 * @created 2025-12-27
 */

'use client';

import React from 'react';
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

/**
 * 구조분석 탭 - Colgroup (열 너비 정의)
 */
export function StructureColgroup() {
  return (
    <colgroup><col style={{ width: '18%' }} /><col style={{ width: '20%' }} /><col style={{ width: '40px' }} /><col /></colgroup>
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
        <th style={{ ...stickyFirstColStyle, zIndex: 15, width: '20%', background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>1. 완제품 공정명</th>
        <th onClick={onProcessModalOpen} className="cursor-pointer hover:bg-green-600" style={{ width: '25%', background: '#388e3c', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>2. 메인 공정명 🔍</th>
        <th colSpan={2} style={{ width: '55%', background: '#f57c00', color: 'white', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>3. 작업 요소명</th>
      </tr>
      {/* 서브 헤더 - 중간 색상 */}
      <tr>
        <th style={{ ...stickyFirstColStyle, zIndex: 15, background: '#90caf9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>완제품명+라인</th>
        <th style={{ background: '#a5d6a7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>공정NO+공정명</th>
        <th style={{ width: '5%', background: '#ffcc80', border: `1px solid ${COLORS.line}`, padding: '0', height: '22px', fontWeight: 700, fontSize: '10px' }}>4M</th>
        <th style={{ width: '55%', background: '#ffcc80', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>작업요소</th>
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
  // 첫 번째 행인지 확인 (입력 필드 표시 여부 결정)
  const isFirstL1Row = l1Spans[idx] > 0;
  const isFirstL2Row = l2Spans[idx] > 0;
  
  return (
    <>
      {/* L1: 완제품명 (모든 행에 표시 - 스크롤해도 항상 보임) */}
      <td 
        className="text-center text-xs"
        style={{ 
          position: 'sticky',
          left: 0,
          zIndex: 5,
          border: `1px solid ${COLORS.line}`, 
          padding: '2px 4px', 
          background: isFirstL1Row ? '#bbdefb' : '#e3f2fd', // 첫 행은 진하게
          verticalAlign: 'middle', 
          wordBreak: 'break-word',
          borderTop: isFirstL1Row ? '2px solid #1976d2' : undefined, // 그룹 구분선
        }}
      >
        {isFirstL1Row ? (
          // 첫 번째 행: 입력 필드
          <input
            type="text"
            value={state.l1.name}
            onChange={(e) => {
              setState(prev => ({ ...prev, l1: { ...prev.l1, name: e.target.value } }));
              setDirty(true);
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="입력"
            className="w-full text-center border-0 outline-none text-xs font-semibold"
            style={{ minHeight: '20px', background: 'rgba(255,255,255,0.95)', borderRadius: '3px' }}
          />
        ) : (
          // 반복 행: 텍스트만 표시 (연한 색상)
          <span style={{ color: '#666', fontSize: '10px' }}>
            {state.l1.name || '↑'}
          </span>
        )}
      </td>
      
      {/* L2: 메인공정 (모든 행에 표시) */}
      <td 
        className="text-center cursor-pointer hover:bg-green-200 text-xs"
        style={{ 
          border: `1px solid ${COLORS.line}`, 
          padding: '2px 4px', 
          background: isFirstL2Row ? '#c8e6c9' : '#e8f5e9', // 첫 행은 진하게
          verticalAlign: 'middle', 
          wordBreak: 'break-word',
          borderTop: isFirstL2Row ? '2px solid #388e3c' : undefined, // 그룹 구분선
        }}
        onClick={() => { 
          handleSelect('L2', row.l2Id); 
          setIsProcessModalOpen(true); 
        }}
      >
        {isFirstL2Row ? (
          // 첫 번째 행: 전체 표시
          row.l2Name.includes('클릭') 
            ? <span className="text-green-600 font-bold">🔍 클릭</span> 
            : <span style={{ fontWeight: 600 }}>{row.l2No} {row.l2Name} 🔍</span>
        ) : (
          // 반복 행: 간략히 표시
          <span style={{ color: '#666', fontSize: '10px' }}>
            {row.l2No} {row.l2Name.substring(0, 6)}...
          </span>
        )}
      </td>
      
      {/* 4M */}
      <td 
        className="text-center text-xs font-bold" 
        style={{ 
          border: `1px solid ${COLORS.line}`, 
          padding: '0', 
          background: '#fff8e1' 
        }}
      >
        {row.m4}
      </td>
      
      {/* L3: 작업요소 */}
      <td 
        className="cursor-pointer hover:bg-orange-100 text-xs"
        style={{ 
          border: `1px solid ${COLORS.line}`, 
          padding: '2px 4px', 
          background: row.l3Name.includes('추가') || row.l3Name.includes('클릭') 
            ? 'repeating-linear-gradient(45deg, #fff, #fff 4px, #fff3e0 4px, #fff3e0 8px)' 
            : '#fff3e0', 
          wordBreak: 'break-word' 
        }}
        onClick={() => { 
          handleSelect('L3', row.l3Id); 
          setTargetL2Id(row.l2Id); 
          setIsWorkElementModalOpen(true); 
        }}
      >
        {row.l3Name.includes('추가') || row.l3Name.includes('클릭') 
          ? <span className="text-orange-600 font-bold">🔍 클릭</span> 
          : <span>{row.l3Name} 🔍</span>
        }
      </td>
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

