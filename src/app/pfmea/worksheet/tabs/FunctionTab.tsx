/**
 * @file FunctionTab.tsx
 * @description FMEA 워크시트 - 기능분석(3단계) 탭
 * @author AI Assistant
 * @created 2025-12-27
 * @updated 구조분석과 동일한 스타일 적용 + 구분(C1) 컬럼 추가 + 모달 선택 방식 적용
 */

'use client';

import React, { useState, useCallback } from 'react';
import { WorksheetState, COLORS } from '../constants';
import DataSelectModal from '@/components/modals/DataSelectModal';

interface FlatRow {
  l1Id: string;
  l1Name: string;
  l1Type: string;        // C1: 구분 (Your Plant, Ship to Plant, User)
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

// 모달 타입 정의
type ModalType = 'l1Type' | 'l1Function' | 'l1Requirement' | 'l2Function' | 'l2ProductChar' | 'l3Function' | 'l3ProcessChar' | null;

// 모달 설정
const MODAL_CONFIG: Record<string, { title: string; itemCode: string }> = {
  l1Type: { title: '구분 선택', itemCode: 'C1' },
  l1Function: { title: '완제품 기능 선택', itemCode: 'C2' },
  l1Requirement: { title: '요구사항 선택', itemCode: 'C3' },
  l2Function: { title: '공정 기능 선택', itemCode: 'A3' },
  l2ProductChar: { title: '제품특성 선택', itemCode: 'A4' },
  l3Function: { title: '작업요소 기능 선택', itemCode: 'B2' },
  l3ProcessChar: { title: '공정특성 선택', itemCode: 'B3' },
};

/**
 * 선택 가능한 셀 (클릭하면 모달 열림)
 */
function SelectableCell({
  value,
  placeholder,
  bgColor,
  onClick,
}: {
  value: string;
  placeholder: string;
  bgColor: string;
  onClick: () => void;
}) {
  return (
    <div
      className="cursor-pointer hover:bg-black/5 w-full h-full flex items-center p-1"
      onClick={onClick}
      style={{ 
        minHeight: '24px', 
        fontSize: '10px', 
        fontFamily: 'inherit',
        background: value ? 'transparent' : `repeating-linear-gradient(45deg, ${bgColor}, ${bgColor} 4px, #fff 4px, #fff 8px)`
      }}
      title="클릭하여 선택"
    >
      {value || <span className="text-gray-400 italic">🔍 {placeholder}</span>}
    </div>
  );
}

/**
 * 기능분석 탭 - Colgroup
 */
export function FunctionColgroup() {
  return (
    <colgroup><col style={{ width: '80px' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /><col style={{ width: '17%' }} /><col style={{ width: '17%' }} /><col style={{ width: '18%' }} /><col style={{ width: '18%' }} /></colgroup>
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
          colSpan={3} 
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
            width: '80px',
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
          구분
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
  onOpenModal,
}: FunctionTabProps & { row: FlatRow; idx: number; onOpenModal: (type: ModalType, id: string, processNo?: string) => void }) {
  const spanCount = l2Spans[idx];
  const showL1MergedCell = l1Spans[idx] > 0;
  const showL2MergedCell = spanCount > 0;

  return (
    <>
      {/* L1: 구분 */}
      {showL1MergedCell && (
        <td 
          rowSpan={l1Spans[idx]} 
          style={{ 
            ...stickyFirstColStyle,
            zIndex: 5,
            width: '80px',
            borderTop: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            borderLeft: `1px solid ${COLORS.line}`,
            padding: '0 4px', 
            background: FUNC_COLORS.l1Cell, 
            verticalAlign: 'middle',
            textAlign: 'center',
          }}
        >
          <SelectableCell
            value={row.l1Type}
            placeholder="구분"
            bgColor={FUNC_COLORS.l1Cell}
            onClick={() => onOpenModal('l1Type', row.l1Id)}
          />
        </td>
      )}

      {/* L1: 완제품 기능 */}
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
          <SelectableCell
            value={row.l1Function}
            placeholder="완제품 기능"
            bgColor={FUNC_COLORS.l1Cell}
            onClick={() => onOpenModal('l1Function', row.l1Id)}
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
          <SelectableCell
            value={row.l1Requirement}
            placeholder="요구사항"
            bgColor={FUNC_COLORS.l1Cell}
            onClick={() => onOpenModal('l1Requirement', row.l1Id)}
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
          <SelectableCell
            value={row.l2Function}
            placeholder="공정 기능"
            bgColor={FUNC_COLORS.l2Cell}
            onClick={() => onOpenModal('l2Function', row.l2Id, row.l2No)}
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
          <SelectableCell
            value={row.l2ProductChar}
            placeholder="제품특성"
            bgColor={FUNC_COLORS.l2Cell}
            onClick={() => onOpenModal('l2ProductChar', row.l2Id, row.l2No)}
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
        <SelectableCell
          value={row.l3Function}
          placeholder="작업요소 기능"
          bgColor={FUNC_COLORS.l3Cell}
          onClick={() => onOpenModal('l3Function', row.l3Id, row.l2No)}
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
        <SelectableCell
          value={row.l3ProcessChar}
          placeholder="공정특성"
          bgColor={FUNC_COLORS.l3Cell}
          onClick={() => onOpenModal('l3ProcessChar', row.l3Id, row.l2No)}
        />
      </td>
    </>
  );
}

/**
 * 기능분석 탭 - 전체 컴포넌트
 */
export default function FunctionTab(props: FunctionTabProps) {
  const { rows, state, setState, setDirty } = props;

  // 모달 상태
  const [modalType, setModalType] = useState<ModalType>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [targetProcessNo, setTargetProcessNo] = useState<string>('');

  // 모달 열기
  const handleOpenModal = useCallback((type: ModalType, id: string, processNo?: string) => {
    setModalType(type);
    setTargetId(id);
    setTargetProcessNo(processNo || '');
  }, []);

  // 현재 값 가져오기
  const getCurrentValues = useCallback((): string[] => {
    if (!modalType || !targetId) return [];
    
    const parse = (val: string | undefined) => val ? val.split(',').map(v => v.trim()) : [];

    switch (modalType) {
      case 'l1Type': return parse(state.l1.type);
      case 'l1Function': return parse(state.l1.function);
      case 'l1Requirement': return parse(state.l1.requirement);
      case 'l2Function': {
        const proc = state.l2.find(p => p.id === targetId);
        return parse(proc?.function);
      }
      case 'l2ProductChar': {
        const proc = state.l2.find(p => p.id === targetId);
        return parse(proc?.productChar);
      }
      case 'l3Function': {
        for (const proc of state.l2) {
          const we = proc.l3.find(w => w.id === targetId);
          if (we) return parse(we.function);
        }
        return [];
      }
      case 'l3ProcessChar': {
        for (const proc of state.l2) {
          const we = proc.l3.find(w => w.id === targetId);
          if (we) return parse(we.processChar);
        }
        return [];
      }
      default: return [];
    }
  }, [modalType, targetId, state]);

  // 모달 저장
  const handleModalSave = useCallback((selectedValues: string[]) => {
    const joinedValue = selectedValues.join(', ');
    
    setState(prev => {
      switch (modalType) {
        case 'l1Type': return { ...prev, l1: { ...prev.l1, type: joinedValue } };
        case 'l1Function': return { ...prev, l1: { ...prev.l1, function: joinedValue } };
        case 'l1Requirement': return { ...prev, l1: { ...prev.l1, requirement: joinedValue } };
        case 'l2Function': return {
          ...prev,
          l2: prev.l2.map(p => p.id === targetId ? { ...p, function: joinedValue } : p)
        };
        case 'l2ProductChar': return {
          ...prev,
          l2: prev.l2.map(p => p.id === targetId ? { ...p, productChar: joinedValue } : p)
        };
        case 'l3Function': return {
          ...prev,
          l2: prev.l2.map(p => ({
            ...p,
            l3: p.l3.map(w => w.id === targetId ? { ...w, function: joinedValue } : w)
          }))
        };
        case 'l3ProcessChar': return {
          ...prev,
          l2: prev.l2.map(p => ({
            ...p,
            l3: p.l3.map(w => w.id === targetId ? { ...w, processChar: joinedValue } : w)
          }))
        };
        default: return prev;
      }
    });
    
    setDirty(true);
    setModalType(null);
  }, [modalType, targetId, setState, setDirty]);

  const modalConfig = modalType ? MODAL_CONFIG[modalType] : null;
  
  return (
    <>
      <FunctionColgroup />
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <FunctionHeader />
      </thead>
      
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-center text-gray-400 py-8">
              구조분석 탭에서 데이터를 먼저 입력하세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={row.l3Id} style={{ height: '28px' }}>
              <FunctionRow {...props} row={row} idx={idx} onOpenModal={handleOpenModal} />
            </tr>
          ))
        )}
      </tbody>

      {/* 데이터 선택 모달 */}
      {modalType && modalConfig && (
        <DataSelectModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          onSave={handleModalSave}
          title={modalConfig.title}
          itemCode={modalConfig.itemCode}
          currentValues={getCurrentValues()}
          processNo={targetProcessNo || undefined}
        />
      )}
    </>
  );
}
