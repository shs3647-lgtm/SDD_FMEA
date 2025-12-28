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

  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      const { type, processId, funcId } = modal;

      if (type === 'l2FailureMode') {
        // 고장형태 추가
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== processId) return proc;
          const currentModes = proc.failureModes || [];
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
  }, [modal, setState, setDirty]);

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
          <col style={{ width: '350px' }} />
          <col style={{ width: '80px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th style={{ background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              2단계 구조분석
            </th>
            <th colSpan={2} style={{ background: FAIL_COLORS.header1, color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              4단계 : 2L 고장형태(FM) 분석
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th style={{ background: '#42a5f5', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              2. 메인공정명
            </th>
            <th colSpan={2} style={{ background: FAIL_COLORS.header2, color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              2. 고장형태(FM) / 특별특성(SC)
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr style={{ background: '#e3f2fd' }}>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              공정NO + 공정명
            </th>
            <th style={{ background: FAIL_COLORS.cellAlt, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              고장형태(FM)
            </th>
            <th style={{ background: FAIL_COLORS.cellAlt, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700, textAlign: 'center' }}>
              SC
            </th>
          </tr>
        </thead>
        
        <tbody>
          {processes.length === 0 ? (
            <tr>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700 }}>
                (구조분석에서 공정 입력)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="고장형태 선택" bgColor={FAIL_COLORS.cell} onClick={() => {}} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0', textAlign: 'center', background: FAIL_COLORS.cell }}>
                -
              </td>
            </tr>
          ) : processes.map((proc, pIdx) => {
            const modes = proc.failureModes || [];
            const procRowSpan = Math.max(1, modes.length);
            
            return modes.length === 0 ? (
              <tr key={proc.id}>
                <td rowSpan={procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                  {proc.no}. {proc.name}
                </td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell value="" placeholder="고장형태 선택" bgColor={FAIL_COLORS.cell} onClick={() => setModal({ type: 'l2FailureMode', processId: proc.id, title: `${proc.no}. ${proc.name} 고장형태`, itemCode: 'FM1' })} />
                </td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0', textAlign: 'center', background: FAIL_COLORS.cell }}>
                  -
                </td>
              </tr>
            ) : modes.map((mode: any, mIdx: number) => (
              <tr key={mode.id}>
                {mIdx === 0 && (
                  <td rowSpan={procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                    {proc.no}. {proc.name}
                  </td>
                )}
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell value={mode.name} placeholder="고장형태" bgColor="#fff" onClick={() => setModal({ type: 'l2FailureMode', processId: proc.id, title: `${proc.no}. ${proc.name} 고장형태`, itemCode: 'FM1' })} />
                </td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0', textAlign: 'center', background: mode.sc ? '#ffcdd2' : '#fff' }}>
                  <button
                    onClick={() => toggleSC(proc.id, mode.id)}
                    style={{ 
                      border: 'none', 
                      background: mode.sc ? '#c62828' : '#e0e0e0', 
                      color: mode.sc ? 'white' : '#666',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {mode.sc ? 'SC' : '-'}
                  </button>
                </td>
              </tr>
            ));
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

