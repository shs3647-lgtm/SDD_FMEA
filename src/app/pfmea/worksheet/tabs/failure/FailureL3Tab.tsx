/**
 * @file FailureL3Tab.tsx
 * @description 3L 고장원인(FC) 분석 - 3행 헤더 구조 (구조분석 + 고장분석)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FailureTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';

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

  // 확정 상태
  const isConfirmed = state.failureL3Confirmed || false;

  // 플레이스홀더 패턴 체크 함수
  const isMissing = (name: string | undefined) => {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed === '' || trimmed === '-') return true;
    if (name.includes('클릭')) return true;
    if (name.includes('추가')) return true;
    if (name.includes('선택')) return true;
    if (name.includes('입력')) return true;
    if (name.includes('필요')) return true;
    return false;
  };

  // 항목별 누락 건수 분리 계산
  const missingCounts = useMemo(() => {
    let failureCauseCount = 0;   // 고장원인 누락
    
    state.l2.forEach(proc => {
      (proc.l3 || []).forEach(we => {
        const causes = we.failureCauses || [];
        if (causes.length === 0 && we.name && !isMissing(we.name)) failureCauseCount++;
        causes.forEach(c => {
          if (isMissing(c.name)) failureCauseCount++;
        });
      });
    });
    return { failureCauseCount, total: failureCauseCount };
  }, [state.l2]);
  
  // 총 누락 건수 (기존 호환성)
  const missingCount = missingCounts.total;

  // 확정 핸들러
  const handleConfirm = useCallback(() => {
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n먼저 입력을 완료해주세요.`);
      return;
    }
    setState(prev => ({ ...prev, failureL3Confirmed: true }));
    saveToLocalStorage?.();
    alert('3L 고장원인(FC) 분석이 확정되었습니다.');
  }, [missingCount, setState, saveToLocalStorage]);

  // 수정 핸들러
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, failureL3Confirmed: false }));
  }, [setState]);

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
    
    // 저장 후 localStorage에 반영
    if (saveToLocalStorage) {
      setTimeout(() => saveToLocalStorage(), 100);
    }
  }, [modal, setState, setDirty, saveToLocalStorage]);

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
          <col style={{ width: '120px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '160px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '280px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th colSpan={2} style={{ background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px 6px', fontSize: FONT_SIZES.cell, fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
              구조분석(2단계)
            </th>
            <th colSpan={2} style={{ background: '#388e3c', color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px 6px', fontSize: FONT_SIZES.cell, fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
              기능분석(3단계)
            </th>
            <th style={{ background: FAIL_COLORS.header1, color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px 6px', fontSize: FONT_SIZES.cell, fontWeight: 800, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                <span style={{ whiteSpace: 'nowrap' }}>고장분석(4단계)</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {isConfirmed ? (
                    <span style={{ background: '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '3px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold }}>✓ 확정됨</span>
                  ) : (
                    <button type="button" onClick={handleConfirm} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '3px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, cursor: 'pointer' }}>확정</button>
                  )}
                  <span style={{ background: missingCount > 0 ? '#f44336' : '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '3px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold }}>누락 {missingCount}건</span>
                  {isConfirmed && (
                    <button type="button" onClick={handleEdit} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '3px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, cursor: 'pointer' }}>수정</button>
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
            <th style={{ background: '#42a5f5', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 작업 요소명
            </th>
            <th colSpan={2} style={{ background: '#66bb6a', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 작업요소의 기능 및 공정특성
            </th>
            <th style={{ background: FAIL_COLORS.header2, color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 고장원인(FC)
              {missingCount > 0 && (
                <span style={{ marginLeft: '8px', background: '#fff', color: '#c62828', padding: '2px 8px', borderRadius: '10px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold }}>
                  누락 {missingCount}건
                </span>
              )}
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              NO+공정명
            </th>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              작업요소
            </th>
            <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              공정특성
            </th>
            <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '4px', fontSize: FONT_SIZES.small, fontWeight: 700, textAlign: 'center' }}>
              특별특성
            </th>
            <th style={{ background: FAIL_COLORS.cellAlt, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              고장원인(FC)
              {missingCounts.failureCauseCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#c62828', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: FONT_SIZES.small }}>
                  {missingCounts.failureCauseCount}
                </span>
              )}
            </th>
          </tr>
        </thead>
        
        <tbody>
          {flatRows.length === 0 ? (
            <tr>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700 }}>
                (구조분석에서 공정 입력)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700 }}>
                (작업요소 입력)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#c8e6c9' }}>
                (기능분석에서 입력)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#c8e6c9' }}>
                -
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="고장원인 선택" bgColor={FAIL_COLORS.cell} onClick={() => {}} />
              </td>
            </tr>
          ) : flatRows.map((row, idx) => {
            // 기능분석에서 입력한 공정특성 가져오기 (we.functions[].processChars[] 에서)
            const processChars = (row.we?.functions || []).flatMap((f: any) => f.processChars || []);
            const processChar = processChars[0];
            
            return (
              <tr key={`${row.proc.id}-${row.we?.id || 'empty'}-${row.cause?.id || idx}`}>
                {row.procRowSpan > 0 && (
                  <td rowSpan={row.procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '6px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle', fontSize: '11px' }}>
                    {row.proc.no}. {row.proc.name}
                  </td>
                )}
                {row.weRowSpan > 0 && (
                  <td rowSpan={row.weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '6px', textAlign: 'center', background: '#bbdefb', verticalAlign: 'middle', fontSize: '11px' }}>
                    {row.we?.name || '(작업요소 없음)'}
                  </td>
                )}
                {row.weRowSpan > 0 && (
                  <td rowSpan={row.weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '6px', textAlign: 'center', background: '#c8e6c9', verticalAlign: 'middle', fontSize: '11px' }}>
                    {processChar?.name || '(기능분석에서 입력)'}
                  </td>
                )}
                {row.weRowSpan > 0 && (
                  <td rowSpan={row.weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '6px', textAlign: 'center', background: '#c8e6c9', verticalAlign: 'middle', fontSize: '11px' }}>
                    {processChar?.specialChar || '-'}
                  </td>
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
                    <span style={{ color: '#c62828', fontSize: FONT_SIZES.cell, fontWeight: 600, padding: '8px', display: 'block' }}>-</span>
                  )}
                </td>
              </tr>
            );
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

