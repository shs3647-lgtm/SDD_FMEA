/**
 * @file FailureL3Tab.tsx
 * @description 3L 고장원인(FC) 분석 - 3행 헤더 구조 (구조분석 + 고장분석)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FailureTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid } from '../../constants';

// 색상 정의
const FAIL_COLORS = {
  header1: '#6a1b9a',
  header2: '#8e24aa',
  header3: '#ab47bc',
  cell: '#f3e5f5',
  cellAlt: '#e1bee7',
};

export default function FailureL3Tab({ state, setState, setDirty, saveToLocalStorage }: FailureTabProps) {
  const [modal, setModal] = useState<{ type: string; processId: string; weId?: string; title: string; itemCode: string } | null>(null);

  // 공정 목록 (드롭다운용)
  const processList = useMemo(() => 
    state.l2.filter(p => p.name && !p.name.includes('클릭')).map(p => ({ id: p.id, no: p.no, name: `${p.no}. ${p.name}` })),
    [state.l2]
  );

  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      const { type, processId, weId } = modal;

      if (type === 'l3FailureCause') {
        // 고장원인 추가
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== processId) return proc;
          return {
            ...proc,
            l3: (proc.l3 || []).map((we: any) => {
              if (weId && we.id !== weId) return we;
              const currentCauses = we.failureCauses || [];
              return {
                ...we,
                failureCauses: selectedValues.map(val => {
                  const existing = currentCauses.find((c: any) => c.name === val);
                  return existing || { id: uid(), name: val, occurrence: undefined };
                })
              };
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
    
    const { type, processId, weId } = modal;
    const deletedSet = new Set(deletedValues);
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      
      if (type === 'l3FailureCause') {
        newState.l2 = newState.l2.map((proc: any) => {
          if (processId && proc.id !== processId) return proc;
          return {
            ...proc,
            l3: (proc.l3 || []).map((we: any) => {
              if (weId && we.id !== weId) return we;
              return { ...we, failureCauses: (we.failureCauses || []).filter((c: any) => !deletedSet.has(c.name)) };
            })
          };
        });
      }
      
      return newState;
    });
    
    setDirty(true);
    if (saveToLocalStorage) setTimeout(() => saveToLocalStorage(), 100);
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // 발생도 업데이트
  const updateOccurrence = useCallback((processId: string, weId: string, causeId: string, occurrence: number | undefined) => {
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState.l2 = newState.l2.map((proc: any) => {
        if (proc.id !== processId) return proc;
        return {
          ...proc,
          l3: (proc.l3 || []).map((we: any) => {
            if (we.id !== weId) return we;
            return {
              ...we,
              failureCauses: (we.failureCauses || []).map((c: any) => c.id === causeId ? { ...c, occurrence } : c)
            };
          })
        };
      });
      return newState;
    });
    setDirty(true);
    if (saveToLocalStorage) saveToLocalStorage();
  }, [setState, setDirty, saveToLocalStorage]);

  // 평탄화된 행 데이터
  const flatRows = useMemo(() => {
    const rows: any[] = [];
    const processes = state.l2.filter(p => p.name && !p.name.includes('클릭'));
    
    processes.forEach(proc => {
      const workElements = (proc.l3 || []).filter((we: any) => we.name && !we.name.includes('클릭'));
      
      if (workElements.length === 0) {
        rows.push({ proc, we: null, cause: null, procRowSpan: 1, weRowSpan: 1, isFirstProc: true, isFirstWe: true });
      } else {
        let procRowSpan = 0;
        workElements.forEach((we: any) => {
          procRowSpan += Math.max(1, (we.failureCauses || []).length);
        });
        
        let isFirstProc = true;
        workElements.forEach((we: any) => {
          const causes = we.failureCauses || [];
          const weRowSpan = Math.max(1, causes.length);
          
          if (causes.length === 0) {
            rows.push({ proc, we, cause: null, procRowSpan: isFirstProc ? procRowSpan : 0, weRowSpan, isFirstProc, isFirstWe: true });
            isFirstProc = false;
          } else {
            causes.forEach((cause: any, cIdx: number) => {
              rows.push({ 
                proc, we, cause, 
                procRowSpan: isFirstProc && cIdx === 0 ? procRowSpan : 0, 
                weRowSpan: cIdx === 0 ? weRowSpan : 0,
                isFirstProc: isFirstProc && cIdx === 0,
                isFirstWe: cIdx === 0
              });
            });
            isFirstProc = false;
          }
        });
      }
    });
    
    return rows;
  }, [state.l2]);

  return (
    <div style={{ padding: '0', overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '140px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '140px' }} />
          <col style={{ width: '280px' }} />
          <col style={{ width: '60px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th colSpan={3} style={{ background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              2단계 구조분석
            </th>
            <th colSpan={2} style={{ background: FAIL_COLORS.header1, color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              4단계 : 3L 고장원인(FC) 분석
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th colSpan={3} style={{ background: '#42a5f5', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 작업요소
            </th>
            <th colSpan={2} style={{ background: FAIL_COLORS.header2, color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 고장원인(FC) / 발생도(O)
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr style={{ background: '#e3f2fd' }}>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              소속공정
            </th>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700, textAlign: 'center' }}>
              4M
            </th>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              작업요소
            </th>
            <th style={{ background: FAIL_COLORS.cellAlt, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              고장원인(FC)
            </th>
            <th style={{ background: FAIL_COLORS.cellAlt, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700, textAlign: 'center' }}>
              O
            </th>
          </tr>
        </thead>
        
        <tbody>
          {flatRows.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700 }}>
                (구조분석에서 작업요소 입력)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="고장원인 선택" bgColor={FAIL_COLORS.cell} onClick={() => {}} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0', textAlign: 'center', background: FAIL_COLORS.cell }}>
                -
              </td>
            </tr>
          ) : flatRows.map((row, idx) => (
            <tr key={`${row.proc.id}-${row.we?.id || 'empty'}-${row.cause?.id || idx}`}>
              {row.procRowSpan > 0 && (
                <td rowSpan={row.procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '6px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle', fontSize: '11px' }}>
                  {row.proc.no}. {row.proc.name}
                </td>
              )}
              {row.weRowSpan > 0 && (
                <>
                  <td rowSpan={row.weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', background: '#e8f5e9', verticalAlign: 'middle' }}>
                    <span style={{ 
                      background: row.we?.m4 === 'MN' ? '#e3f2fd' : row.we?.m4 === 'MC' ? '#fff3e0' : row.we?.m4 === 'IM' ? '#e8f5e9' : '#fce4ec',
                      padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 700
                    }}>
                      {row.we?.m4 || '-'}
                    </span>
                  </td>
                  <td rowSpan={row.weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '6px', background: '#e8f5e9', verticalAlign: 'middle', fontSize: '11px' }}>
                    {row.we?.name || '(작업요소 없음)'}
                  </td>
                </>
              )}
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                {row.we ? (
                  <SelectableCell 
                    value={row.cause?.name || ''} 
                    placeholder="고장원인 선택" 
                    bgColor={row.cause ? '#fff' : FAIL_COLORS.cell} 
                    onClick={() => setModal({ type: 'l3FailureCause', processId: row.proc.id, weId: row.we.id, title: `${row.we.name} 고장원인`, itemCode: 'FC1' })} 
                  />
                ) : (
                  <span style={{ color: '#999', fontSize: '10px', padding: '8px', display: 'block' }}>-</span>
                )}
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0', textAlign: 'center', background: row.cause?.occurrence && row.cause.occurrence >= 7 ? '#ffcdd2' : '#fff' }}>
                {row.cause ? (
                  <select
                    value={row.cause.occurrence || ''}
                    onChange={(e) => updateOccurrence(row.proc.id, row.we.id, row.cause.id, e.target.value ? Number(e.target.value) : undefined)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '11px', fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  >
                    <option value="">-</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n} style={{ fontWeight: n >= 7 ? 700 : 400, color: n >= 7 ? '#c62828' : 'inherit' }}>{n}</option>)}
                  </select>
                ) : '-'}
              </td>
            </tr>
          ))}
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
            if (modal.type === 'l3FailureCause') {
              const proc = state.l2.find(p => p.id === modal.processId);
              const we = (proc?.l3 || []).find((w: any) => w.id === modal.weId);
              return (we?.failureCauses || []).map((c: any) => c.name);
            }
            return [];
          })()}
          processName={processList.find(p => p.id === modal.processId)?.name}
          workElementName={(() => {
            const proc = state.l2.find(p => p.id === modal.processId);
            const we = (proc?.l3 || []).find((w: any) => w.id === modal.weId);
            return we?.name;
          })()}
          processList={processList}
          onProcessChange={(newProcId) => setModal(modal ? { ...modal, processId: newProcId } : null)}
        />
      )}
    </div>
  );
}

