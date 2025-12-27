/**
 * @file FunctionTab.tsx
 * @description FMEA 워크시트 - 기능분석(3단계) 탭
 * @author AI Assistant
 * @created 2025-12-27
 */

'use client';

import React from 'react';
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

// 공통 sticky 스타일
const stickyRow1 = { position: 'sticky' as const, top: 0, zIndex: 20 };
const stickyRow2 = { position: 'sticky' as const, top: '25px', zIndex: 20 };

/**
 * 기능분석 탭 - 테이블 헤더
 */
export function FunctionHeader() {
  return (
    <>
      <tr>
        <th colSpan={2} style={{ 
          ...stickyRow1,
          background: '#c8e6c9', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '25px', 
          fontWeight: 900, 
          textAlign: 'center', 
          fontSize: '11px' 
        }}>
          1. 완제품 공정기능/요구사항
        </th>
        <th colSpan={2} style={{ 
          ...stickyRow1,
          background: '#a5d6a7', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '25px', 
          fontWeight: 900, 
          textAlign: 'center', 
          fontSize: '11px' 
        }}>
          2. 메인공정 기능 및 제품특성
        </th>
        <th colSpan={2} style={{ 
          ...stickyRow1,
          background: '#81c784', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '25px', 
          fontWeight: 900, 
          textAlign: 'center', 
          fontSize: '11px' 
        }}>
          3. 작업요소 기능 및 공정특성
        </th>
      </tr>
      <tr>
        <th style={{ 
          ...stickyRow2,
          width: '15%', 
          background: '#e8f5e9', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '22px', 
          fontWeight: 700, 
          fontSize: '10px' 
        }}>
          완제품 기능
        </th>
        <th style={{ 
          ...stickyRow2,
          width: '15%', 
          background: '#e8f5e9', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '22px', 
          fontWeight: 700, 
          fontSize: '10px' 
        }}>
          요구사항
        </th>
        <th style={{ 
          ...stickyRow2,
          width: '17%', 
          background: '#c8e6c9', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '22px', 
          fontWeight: 700, 
          fontSize: '10px' 
        }}>
          공정 기능
        </th>
        <th style={{ 
          ...stickyRow2,
          width: '17%', 
          background: '#c8e6c9', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '22px', 
          fontWeight: 700, 
          fontSize: '10px' 
        }}>
          제품특성
        </th>
        <th style={{ 
          ...stickyRow2,
          width: '18%', 
          background: '#a5d6a7', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '22px', 
          fontWeight: 700, 
          fontSize: '10px' 
        }}>
          작업요소 기능
        </th>
        <th style={{ 
          ...stickyRow2,
          width: '18%', 
          background: '#a5d6a7', 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          height: '22px', 
          fontWeight: 700, 
          fontSize: '10px' 
        }}>
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
  return (
    <>
      {/* L1: 완제품 기능 */}
      {l1Spans[idx] > 0 && (
        <td 
          rowSpan={l1Spans[idx]} 
          className="text-xs" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            background: '#f1f8e9', 
            verticalAlign: 'middle' 
          }}
        >
          <input 
            type="text" 
            value={row.l1Function} 
            onChange={(e) => { 
              setState(prev => ({ ...prev, l1: { ...prev.l1, function: e.target.value } })); 
              setDirty(true); 
            }}
            onBlur={handleInputBlur} 
            onKeyDown={handleInputKeyDown}
            placeholder="완제품 기능 입력" 
            className="w-full bg-transparent border-0 outline-none text-xs" 
            style={{ height: '20px' }} 
          />
        </td>
      )}
      
      {/* L1: 요구사항 */}
      {l1Spans[idx] > 0 && (
        <td 
          rowSpan={l1Spans[idx]} 
          className="text-xs" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            background: '#f1f8e9', 
            verticalAlign: 'middle' 
          }}
        >
          <input 
            type="text" 
            value={row.l1Requirement} 
            onChange={(e) => { 
              setState(prev => ({ ...prev, l1: { ...prev.l1, requirement: e.target.value } })); 
              setDirty(true); 
            }}
            onBlur={handleInputBlur} 
            onKeyDown={handleInputKeyDown}
            placeholder="요구사항 입력" 
            className="w-full bg-transparent border-0 outline-none text-xs" 
            style={{ height: '20px' }} 
          />
        </td>
      )}
      
      {/* L2: 공정 기능 */}
      {l2Spans[idx] > 0 && (
        <td 
          rowSpan={l2Spans[idx]} 
          className="text-xs" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            background: '#e8f5e9', 
            verticalAlign: 'middle' 
          }}
        >
          <input 
            type="text" 
            value={row.l2Function}
            onChange={(e) => { 
              setState(prev => ({ 
                ...prev, 
                l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, function: e.target.value } : p) 
              })); 
              setDirty(true); 
            }}
            onBlur={handleInputBlur} 
            onKeyDown={handleInputKeyDown}
            placeholder={`${row.l2No} ${row.l2Name} 기능`} 
            className="w-full bg-transparent border-0 outline-none text-xs" 
            style={{ height: '20px' }} 
          />
        </td>
      )}
      
      {/* L2: 제품특성 */}
      {l2Spans[idx] > 0 && (
        <td 
          rowSpan={l2Spans[idx]} 
          className="text-xs" 
          style={{ 
            border: `1px solid ${COLORS.line}`, 
            padding: '1px 4px', 
            background: '#e8f5e9', 
            verticalAlign: 'middle' 
          }}
        >
          <input 
            type="text" 
            value={row.l2ProductChar}
            onChange={(e) => { 
              setState(prev => ({ 
                ...prev, 
                l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, productChar: e.target.value } : p) 
              })); 
              setDirty(true); 
            }}
            onBlur={handleInputBlur} 
            onKeyDown={handleInputKeyDown}
            placeholder="제품특성 입력" 
            className="w-full bg-transparent border-0 outline-none text-xs" 
            style={{ height: '20px' }} 
          />
        </td>
      )}
      
      {/* L3: 작업요소 기능 */}
      <td 
        className="text-xs" 
        style={{ 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          background: '#dcedc8' 
        }}
      >
        <input 
          type="text" 
          value={row.l3Function}
          onChange={(e) => { 
            setState(prev => ({ 
              ...prev, 
              l2: prev.l2.map(p => ({ 
                ...p, 
                l3: p.l3.map(w => w.id === row.l3Id ? { ...w, function: e.target.value } : w) 
              })) 
            })); 
            setDirty(true); 
          }}
          onBlur={handleInputBlur} 
          onKeyDown={handleInputKeyDown}
          placeholder={`[${row.m4}] ${row.l3Name} 기능`} 
          className="w-full bg-transparent border-0 outline-none text-xs" 
          style={{ height: '20px' }} 
        />
      </td>
      
      {/* L3: 공정특성 */}
      <td 
        className="text-xs" 
        style={{ 
          border: `1px solid ${COLORS.line}`, 
          padding: '1px 4px', 
          background: '#dcedc8' 
        }}
      >
        <input 
          type="text" 
          value={row.l3ProcessChar}
          onChange={(e) => { 
            setState(prev => ({ 
              ...prev, 
              l2: prev.l2.map(p => ({ 
                ...p, 
                l3: p.l3.map(w => w.id === row.l3Id ? { ...w, processChar: e.target.value } : w) 
              })) 
            })); 
            setDirty(true); 
          }}
          onBlur={handleInputBlur} 
          onKeyDown={handleInputKeyDown}
          placeholder="공정특성 입력" 
          className="w-full bg-transparent border-0 outline-none text-xs" 
          style={{ height: '20px' }} 
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
      <thead className="sticky top-0 z-10">
        <FunctionHeader />
      </thead>
      
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <FunctionRow {...props} row={row} idx={idx} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

