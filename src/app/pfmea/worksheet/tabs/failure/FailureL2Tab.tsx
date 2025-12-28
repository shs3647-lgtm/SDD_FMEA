/**
 * @file FailureL2Tab.tsx
 * @description 2L 고장형태(FM) 분석 - 3행 헤더 구조 (구조분석 + 고장분석)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FailureTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid } from '../../constants';

// 색상 정의
const FAIL_COLORS = {
  header1: '#ad1457',
  header2: '#d81b60',
  header3: '#ec407a',
  cell: '#fce4ec',
  cellAlt: '#f8bbd9',
};

export default function FailureL2Tab({ state, setState, setDirty, saveToLocalStorage }: FailureTabProps) {
  const [modal, setModal] = useState<{ type: string; processId: string; funcId?: string; title: string; itemCode: string } | null>(null);

  // 공정 목록 (드롭다운용)
  const processList = useMemo(() => 
    state.l2.filter(p => p.name && !p.name.includes('클릭')).map(p => ({ id: p.id, no: p.no, name: `${p.no}. ${p.name}` })),
    [state.l2]
  );

  // 확정 상태
  const isConfirmed = state.failureL2Confirmed || false;

  // 누락 건수 계산
  const missingCount = useMemo(() => {
    let count = 0;
    state.l2.forEach(proc => {
      if (!proc.name || proc.name === '클릭') return;
      const modes = proc.failureModes || [];
      if (modes.length === 0) count++;
      modes.forEach(m => {
        if (!m.name || m.name === '클릭' || m.name.includes('추가')) count++;
      });
    });
    return count;
  }, [state.l2]);

  // 확정 핸들러
  const handleConfirm = useCallback(() => {
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n먼저 입력을 완료해주세요.`);
      return;
    }
    setState(prev => ({ ...prev, failureL2Confirmed: true }));
    saveToLocalStorage?.();
    alert('2L 고장형태(FM) 분석이 확정되었습니다.');
  }, [missingCount, setState, saveToLocalStorage]);

  // 수정 핸들러
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, failureL2Confirmed: false }));
  }, [setState]);

  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    console.log('[FailureL2Tab] 저장 시작:', selectedValues);
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      const { type, processId, funcId } = modal;

      if (type === 'l2FailureMode') {
        // 고장형태 추가
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== processId) return proc;
          const currentModes = proc.failureModes || [];
          console.log('[FailureL2Tab] 공정:', proc.name, '기존 모드:', currentModes.length, '새 모드:', selectedValues.length);
          return {
            ...proc,
            failureModes: selectedValues.map(val => {
              const existing = currentModes.find((m: any) => m.name === val);
              return existing || { id: uid(), name: val, sc: false };
            })
          };
        });
      }
      
      return newState;
    });
    
    setDirty(true);
    setModal(null);
    
    // 저장 후 localStorage에 반영
    if (saveToLocalStorage) {
      setTimeout(() => saveToLocalStorage(), 100);
    }
  }, [modal, setState, setDirty, saveToLocalStorage]);

  const handleDelete = useCallback((deletedValues: string[]) => {
    if (!modal) return;
    
    const { type, processId } = modal;
    const deletedSet = new Set(deletedValues);
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      
      if (type === 'l2FailureMode') {
        newState.l2 = newState.l2.map((proc: any) => {
          if (processId && proc.id !== processId) return proc;
          return { ...proc, failureModes: (proc.failureModes || []).filter((m: any) => !deletedSet.has(m.name)) };
        });
      }
      
      return newState;
    });
    
    setDirty(true);
    if (saveToLocalStorage) setTimeout(() => saveToLocalStorage(), 100);
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // SC 토글
  const toggleSC = useCallback((processId: string, modeId: string) => {
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState.l2 = newState.l2.map((proc: any) => {
        if (proc.id !== processId) return proc;
        return {
          ...proc,
          failureModes: (proc.failureModes || []).map((m: any) => m.id === modeId ? { ...m, sc: !m.sc } : m)
        };
      });
      return newState;
    });
    setDirty(true);
    if (saveToLocalStorage) saveToLocalStorage();
  }, [setState, setDirty, saveToLocalStorage]);

  // 총 행 수 계산
  const getTotalRows = () => {
    const procs = state.l2.filter(p => p.name && !p.name.includes('클릭'));
    if (procs.length === 0) return 1;
    return procs.reduce((acc, proc) => acc + Math.max(1, (proc.failureModes || []).length), 0);
  };

  const totalRows = getTotalRows();
  const processes = state.l2.filter(p => p.name && !p.name.includes('클릭'));

  return (
    <div style={{ padding: '0', overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '180px' }} />
          <col style={{ width: '250px' }} />
          <col style={{ width: '300px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th style={{ background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              P-FMEA 구조 분석(2단계)
            </th>
            <th style={{ background: '#388e3c', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              P-FMEA 기능 분석(3단계)
            </th>
            <th style={{ background: FAIL_COLORS.header1, color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <span>P-FMEA 고장 분석(4단계)</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {isConfirmed ? (
                    <span style={{ background: '#4caf50', color: 'white', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700 }}>✓ 확정됨</span>
                  ) : (
                    <button type="button" onClick={handleConfirm} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>확정</button>
                  )}
                  <span style={{ background: missingCount > 0 ? '#f44336' : '#4caf50', color: 'white', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700 }}>누락 {missingCount}건</span>
                  {isConfirmed && (
                    <button type="button" onClick={handleEdit} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>수정</button>
                  )}
                </div>
              </div>
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th style={{ background: '#42a5f5', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              2. 메인 공정명
            </th>
            <th style={{ background: '#66bb6a', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              2. 메인공정기능 및 제품특성
            </th>
            <th style={{ background: FAIL_COLORS.header2, color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              2. 메인공정 고장형태(FM)
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700, textAlign: 'center' }}>
              NO+공정명
            </th>
            <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700, textAlign: 'center' }}>
              제품특성
            </th>
            <th style={{ background: FAIL_COLORS.cellAlt, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700, textAlign: 'center' }}>
              고장형태(FM)
            </th>
          </tr>
        </thead>
        
        <tbody>
          {processes.length === 0 ? (
            <tr>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700 }}>
                (구조분석에서 공정 입력)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#c8e6c9' }}>
                (기능분석에서 제품특성 입력)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="고장형태 선택" bgColor={FAIL_COLORS.cell} onClick={() => {}} />
              </td>
            </tr>
          ) : processes.map((proc) => {
            const modes = proc.failureModes || [];
            // 기능분석에서 입력한 제품특성 가져오기 (functions[].productChars[] 에서)
            const productChars = (proc.functions || []).flatMap((f: any) => f.productChars || []);
            
            // 제품특성이 없으면 1행, 있으면 제품특성 수와 고장형태 수 중 큰 값
            const totalRows = Math.max(1, modes.length);
            
            // 제품특성별 고장형태 매핑 (제품특성이 여러개면 균등 분배)
            const charCount = productChars.length || 1;
            const modesPerChar = Math.ceil(totalRows / charCount);
            
            // 각 제품특성의 시작 행 인덱스 계산
            const getCharForRow = (rowIdx: number) => {
              if (productChars.length === 0) return null;
              const charIdx = Math.floor(rowIdx / modesPerChar);
              return productChars[Math.min(charIdx, productChars.length - 1)];
            };
            
            // 각 제품특성의 rowSpan 계산
            const getCharRowSpan = (rowIdx: number) => {
              if (productChars.length === 0) return totalRows;
              if (productChars.length === 1) return totalRows;
              const charIdx = Math.floor(rowIdx / modesPerChar);
              if (charIdx >= productChars.length - 1) {
                // 마지막 제품특성은 나머지 모든 행을 차지
                return totalRows - (charIdx * modesPerChar);
              }
              return modesPerChar;
            };
            
            // 제품특성 셀을 표시해야 하는 행인지 확인
            const shouldShowCharCell = (rowIdx: number) => {
              if (productChars.length === 0) return rowIdx === 0;
              if (productChars.length === 1) return rowIdx === 0;
              return rowIdx % modesPerChar === 0;
            };
            
            return Array.from({ length: totalRows }).map((_, rowIdx) => {
              const mode = modes[rowIdx];
              const productChar = getCharForRow(rowIdx);
              const showCharCell = shouldShowCharCell(rowIdx);
              const charRowSpan = showCharCell ? getCharRowSpan(rowIdx) : 0;
              
              return (
                <tr key={`${proc.id}-${rowIdx}`}>
                  {rowIdx === 0 && (
                    <td rowSpan={totalRows} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                      {proc.no}. {proc.name}
                    </td>
                  )}
                  {showCharCell && (
                    <td rowSpan={charRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#c8e6c9', fontSize: '11px', verticalAlign: 'middle' }}>
                      {productChar?.name || '(기능분석에서 입력)'}
                    </td>
                  )}
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell 
                      value={mode?.name || ''} 
                      placeholder={rowIdx === 0 ? "고장형태 선택" : ""} 
                      bgColor={mode ? "#fff" : FAIL_COLORS.cell} 
                      onClick={() => setModal({ type: 'l2FailureMode', processId: proc.id, title: `${proc.no}. ${proc.name} 고장형태`, itemCode: 'FM1' })} 
                    />
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>

      {modal && (
        <DataSelectModal
          isOpen={!!modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          title={modal.title}
          itemCode={modal.itemCode}
          singleSelect={false}
          currentValues={(() => {
            if (modal.type === 'l2FailureMode') {
              const proc = state.l2.find(p => p.id === modal.processId);
              return (proc?.failureModes || []).map((m: any) => m.name);
            }
            return [];
          })()}
          processName={processList.find(p => p.id === modal.processId)?.name}
          processList={processList}
          onProcessChange={(newProcId) => setModal(modal ? { ...modal, processId: newProcId } : null)}
        />
      )}
    </div>
  );
}
