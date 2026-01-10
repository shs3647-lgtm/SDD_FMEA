/**
 * @file RiskOptCellRenderer.tsx
 * @description 리스크분석/최적화 단계 셀 렌더링 컴포넌트
 * 컬럼 이름에 따라 적절한 셀 컴포넌트를 라우팅
 */
'use client';

import React from 'react';
import type { WorksheetState } from '../../constants';

/** 컬럼 정의 */
interface ColumnDef {
  id: number;
  step: string;
  group: string;
  name: string;
  width: number;
  cellColor: string;
  cellAltColor: string;
  align: 'left' | 'center' | 'right';
}

/** 컨트롤 모달 타입 */
type ControlModalType = 'prevention' | 'detection' | 'specialChar' | 'prevention-opt' | 'detection-opt';
interface ControlModalState {
  isOpen: boolean;
  type: ControlModalType;
  rowIndex: number;
  fmId?: string;    // ★ 고유 키용
  fcId?: string;    // ★ 고유 키용
}

/** 셀 렌더러 Props */
interface RiskOptCellRendererProps {
  col: ColumnDef;
  colIdx: number;
  globalRowIdx: number;
  fcRowSpan: number;
  rowInFM: number;
  prevFcRowSpan: number;
  fmId?: string;    // ★ 고유 키용
  fcId?: string;    // ★ 고유 키용
  state?: WorksheetState;
  setState?: React.Dispatch<React.SetStateAction<WorksheetState>>;
  setDirty?: React.Dispatch<React.SetStateAction<boolean>>;
  setControlModal?: React.Dispatch<React.SetStateAction<ControlModalState>>;
  handleSODClick: (category: 'S' | 'O' | 'D', targetType: 'risk' | 'opt', rowIndex: number, currentValue?: number) => void;
  setApModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; stage: 5 | 6; data: any[] }>>;
}

/** 높이 상수 */
const HEIGHTS = { body: 28 };

/** 컬럼명과 필드 매핑 */
const FIELD_MAP: Record<string, string> = {
  '습득교훈': 'lesson',
  '개선결과근거': 'result',
  '책임자성명': 'person',
  '비고': 'note',
  '목표완료일자': 'targetDate',
  '완료일자': 'completeDate',
};

const STATUS_OPTIONS = ['대기', '진행중', '완료', '보류'];

/** 셀 스타일 생성 */
const getCellStyle = (
  globalRowIdx: number, 
  cellColor: string, 
  cellAltColor: string, 
  align: 'left' | 'center' | 'right',
  isClickable = false
) => ({
  background: globalRowIdx % 2 === 0 ? cellColor : cellAltColor,
  height: `${HEIGHTS.body}px`,
  padding: '3px 4px',
  border: '1px solid #ccc',
  fontSize: '11px',
  textAlign: align,
  verticalAlign: 'middle' as const,
  cursor: isClickable ? 'pointer' : 'default',
});

/** AP 색상 반환 */
const getAPColor = (ap: 'H' | 'M' | 'L' | null, cellColor: string, cellAltColor: string, globalRowIdx: number) => {
  if (ap === 'H') return '#ef5350';
  if (ap === 'M') return '#ffeb3b';
  if (ap === 'L') return '#66bb6a';
  return globalRowIdx % 2 === 0 ? cellColor : cellAltColor;
};

/** AP 계산 */
const calcAP = (s: number, o: number, d: number): 'H' | 'M' | 'L' | null => {
  if (s <= 0 || o <= 0 || d <= 0) return null;
  // 심각도 기반 우선순위
  if (s >= 9 && o >= 4) return 'H';
  if (s >= 9 && o >= 2 && d >= 4) return 'H';
  if (s >= 7 && o >= 6) return 'H';
  if (s >= 7 || o >= 6 || d >= 6) return 'M';
  return 'L';
};

/**
 * 리스크분석/최적화 컬럼별 셀 렌더링
 */
export function RiskOptCellRenderer({
  col,
  colIdx,
  globalRowIdx,
  fcRowSpan,
  rowInFM,
  prevFcRowSpan,
  fmId = '',    // ★ 고유 키용
  fcId = '',    // ★ 고유 키용
  state,
  setState,
  setDirty,
  setControlModal,
  handleSODClick,
  setApModal,
}: RiskOptCellRendererProps): React.ReactElement | null {
  const targetType = col.step === '리스크분석' ? 'risk' : 'opt';
  const stage = col.step === '리스크분석' ? 5 : 6;
  
  // ★ 고유 키 생성: fmId-fcId 조합 (없으면 globalRowIdx 폴백)
  const uniqueKey = fmId && fcId ? `${fmId}-${fcId}` : String(globalRowIdx);
  
  // ★ rowSpan 조건: 첫 번째 행이거나 이전 행의 fcRowSpan이 1인 경우에만 셀 렌더링
  // prevFcRowSpan > 1이면 이전 행에서 이미 rowSpan으로 병합되어 있으므로 렌더링하지 않음
  // 단, rowInFM === 0이면 무조건 첫 번째 행이므로 렌더링
  const shouldRender = rowInFM === 0 || prevFcRowSpan <= 1;
  if (!shouldRender) {
    return null; // fcRowSpan으로 병합됨 - 이전 행에서 이미 rowSpan 처리됨
  }
  
  const style = getCellStyle(globalRowIdx, col.cellColor, col.cellAltColor, col.align, true);

  // ★ 예방관리(PC) / 예방관리개선 / 검출관리(DC) / 검출관리개선 / 특별특성 셀
  const controlTypes: Record<string, ControlModalType> = {
    '예방관리(PC)': 'prevention',
    '예방관리개선': 'prevention-opt',
    '검출관리(DC)': 'detection',
    '검출관리개선': 'detection-opt',
    '특별특성': 'specialChar',
  };
  if (controlTypes[col.name]) {
    const modalType = controlTypes[col.name];
    const key = `${modalType}-${uniqueKey}`;
    const value = state?.riskData?.[key] || '';
    return (
      <td key={colIdx} rowSpan={fcRowSpan} onDoubleClick={() => setControlModal?.({ isOpen: true, type: modalType, rowIndex: globalRowIdx, fmId, fcId })} style={style}>
        {value}
      </td>
    );
  }

  // ★ 발생도 / 검출도 셀
  if (col.name === '발생도' || col.name === '검출도') {
    const category: 'O' | 'D' = col.name === '발생도' ? 'O' : 'D';
    const key = `${targetType}-${uniqueKey}-${category}`;
    const currentValue = (state?.riskData?.[key] as number) || 0;
    return (
      <td key={colIdx} rowSpan={fcRowSpan} onDoubleClick={() => handleSODClick(category, targetType as 'risk' | 'opt', globalRowIdx, currentValue)} style={{ ...style, fontWeight: currentValue ? 700 : 400 }}>
        {currentValue || ''}
      </td>
    );
  }

  // ★ 심각도(재평가) / 발생도(재평가) / 검출도(재평가) 셀 (최적화 단계)
  const reEvalMap: Record<string, 'S' | 'O' | 'D'> = {
    '심각도(재평가)': 'S',
    '발생도(재평가)': 'O',
    '검출도(재평가)': 'D',
  };
  if (reEvalMap[col.name] && col.step === '최적화') {
    const category = reEvalMap[col.name];
    const key = `opt-${globalRowIdx}-${category}`;
    const currentValue = (state?.riskData?.[key] as number) || 0;
    return (
      <td key={colIdx} rowSpan={fcRowSpan} onDoubleClick={() => handleSODClick(category, 'opt', globalRowIdx, currentValue)} style={{ ...style, fontWeight: currentValue ? 700 : 400 }}>
        {currentValue || ''}
      </td>
    );
  }

  // ★ AP 셀 (5단계 리스크분석 / 6단계 최적화)
  if (col.name === 'AP' || col.name === 'AP(재평가)') {
    const sKey = `${targetType}-${globalRowIdx}-S`;
    const oKey = `${targetType}-${globalRowIdx}-O`;
    const dKey = `${targetType}-${globalRowIdx}-D`;
    const s = (state?.riskData?.[sKey] as number) || 0;
    const o = (state?.riskData?.[oKey] as number) || 0;
    const d = (state?.riskData?.[dKey] as number) || 0;
    const apValue = calcAP(s, o, d);
    const bgColor = getAPColor(apValue, col.cellColor, col.cellAltColor, globalRowIdx);
    
    return (
      <td key={colIdx} rowSpan={fcRowSpan} onDoubleClick={() => {
        if (apValue) {
          setApModal({ isOpen: true, stage: stage as 5 | 6, data: [{ id: `ap-${globalRowIdx}`, processName: '', failureMode: '', failureCause: '', severity: s, occurrence: o, detection: d, ap: apValue }] });
        }
      }} style={{ ...style, background: bgColor, fontWeight: apValue ? 700 : 400 }}>
        {apValue || ''}
      </td>
    );
  }

  // ★ 텍스트 입력 셀 (습득교훈, 개선결과근거, 책임자성명, 비고)
  if (FIELD_MAP[col.name] && !col.name.includes('일자')) {
    const field = FIELD_MAP[col.name];
    const key = `${field}-${globalRowIdx}`;
    const value = (state?.riskData?.[key] as string) || '';
    return (
      <td key={colIdx} rowSpan={fcRowSpan} onDoubleClick={() => {
        if (!setState) return;
        const newValue = prompt(`${col.name}을(를) 입력하세요:`, value);
        if (newValue !== null) {
          setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [key]: newValue } }));
          if (setDirty) setDirty(true);
        }
      }} style={style}>
        {value}
      </td>
    );
  }

  // ★ 날짜 입력 셀 (목표완료일자, 완료일자)
  if (col.name === '목표완료일자' || col.name === '완료일자') {
    const field = FIELD_MAP[col.name];
    const key = `${field}-${globalRowIdx}`;
    const value = (state?.riskData?.[key] as string) || '';
    return (
      <td key={colIdx} rowSpan={fcRowSpan} onDoubleClick={() => {
        if (!setState) return;
        const newValue = prompt(`${col.name}을(를) 입력하세요 (YYYY-MM-DD):`, value);
        if (newValue !== null) {
          if (newValue && !/^\d{4}-\d{2}-\d{2}$/.test(newValue)) { alert('날짜 형식이 올바르지 않습니다.'); return; }
          setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [key]: newValue } }));
          if (setDirty) setDirty(true);
        }
      }} style={style}>
        {value}
      </td>
    );
  }

  // ★ 상태 셀
  if (col.name === '상태') {
    const key = `status-${globalRowIdx}`;
    const value = (state?.riskData?.[key] as string) || '';
    return (
      <td key={colIdx} rowSpan={fcRowSpan} onDoubleClick={() => {
        if (!setState) return;
        const selected = prompt(`상태를 선택하세요:\n${STATUS_OPTIONS.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}\n\n번호 입력:`, value ? String(STATUS_OPTIONS.indexOf(value) + 1) : '');
        if (selected !== null) {
          const idx = parseInt(selected) - 1;
          if (idx >= 0 && idx < STATUS_OPTIONS.length) {
            setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [key]: STATUS_OPTIONS[idx] } }));
            if (setDirty) setDirty(true);
          }
        }
      }} style={style}>
        {value}
      </td>
    );
  }

  // ★ RPN 셀 (자동 계산)
  if (col.name === 'RPN' || col.name === 'RPN(재평가)') {
    const sKey = `${targetType}-${globalRowIdx}-S`;
    const oKey = `${targetType}-${globalRowIdx}-O`;
    const dKey = `${targetType}-${globalRowIdx}-D`;
    const s = (state?.riskData?.[sKey] as number) || 0;
    const o = (state?.riskData?.[oKey] as number) || 0;
    const d = (state?.riskData?.[dKey] as number) || 0;
    const rpn = s > 0 && o > 0 && d > 0 ? s * o * d : 0;
    return (
      <td key={colIdx} rowSpan={fcRowSpan} style={{ ...style, cursor: 'default', fontWeight: rpn > 0 ? 700 : 400 }}>
        {rpn > 0 ? rpn : ''}
      </td>
    );
  }

  // ★ 특별특성(재평가) 셀
  if (col.name === '특별특성(재평가)') {
    const key = `specialChar-opt-${globalRowIdx}`;
    const value = state?.riskData?.[key] || '';
    return (
      <td key={colIdx} rowSpan={fcRowSpan} onDoubleClick={() => setControlModal?.({ isOpen: true, type: 'specialChar', rowIndex: globalRowIdx })} style={style}>
        {value}
      </td>
    );
  }

  // ★ 기본 빈 셀
  return <td key={colIdx} rowSpan={fcRowSpan} style={{ ...style, cursor: 'default' }}></td>;
}

