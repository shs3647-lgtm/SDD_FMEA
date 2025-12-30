/**
 * @file FailureL2Tab.tsx
 * @description 2L 고장형태(FM) 분석 - 3행 헤더 구조 (구조분석 + 고장분석)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FailureTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';

// 색상 정의 - 네이비 기반 고급스러운 디자인
const FAIL_COLORS = {
  header1: '#1a237e',   // 딥 인디고
  header2: '#3949ab',   // 인디고
  header3: '#5c6bc0',   // 라이트 인디고
  cell: '#f5f6fc',      // 아주 연한 인디고
  cellAlt: '#e8eaf6',   // 연한 인디고
};

export default function FailureL2Tab({ state, setState, setDirty, saveToLocalStorage }: FailureTabProps) {
  const [modal, setModal] = useState<{ 
    type: string; 
    processId: string; 
    funcId?: string; 
    title: string; 
    itemCode: string;
    // 상위항목 정보 (고장형태의 상위는 제품특성)
    parentProductChar?: string;
    processName?: string;
  } | null>(null);

  // 공정 목록 (드롭다운용)
  const processList = useMemo(() => 
    state.l2.filter(p => p.name && !p.name.includes('클릭')).map(p => ({ id: p.id, no: p.no, name: `${p.no}. ${p.name}` })),
    [state.l2]
  );

  // 확정 상태
  const isConfirmed = state.failureL2Confirmed || false;

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
    let failureModeCount = 0;   // 고장형태 누락
    
    state.l2.forEach(proc => {
      if (isMissing(proc.name)) return;
      const modes = proc.failureModes || [];
      if (modes.length === 0) failureModeCount++;
      modes.forEach(m => {
        if (isMissing(m.name)) failureModeCount++;
      });
    });
    return { failureModeCount, total: failureModeCount };
  }, [state.l2]);
  
  // 총 누락 건수 (기존 호환성)
  const missingCount = missingCounts.total;

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
          <col style={{ width: '150px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '150px' }} />
          <col style={{ width: '250px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th style={{ background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px 6px', fontSize: FONT_SIZES.cell, fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
              구조분석(2단계)
            </th>
            <th colSpan={2} style={{ background: '#388e3c', color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px 6px', fontSize: FONT_SIZES.cell, fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
              기능분석(3단계)
            </th>
            <th style={{ background: FAIL_COLORS.header1, color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px 6px', fontSize: FONT_SIZES.cell, fontWeight: 800, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                <span style={{ whiteSpace: 'nowrap' }}>고장분석(4단계)</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                  {isConfirmed ? (
                    <span style={{ background: '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: FONT_SIZES.cell, fontWeight: 800, whiteSpace: 'nowrap', lineHeight: 1.1 }}>확정</span>
                  ) : (
                    <button type="button" onClick={handleConfirm} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: FONT_SIZES.cell, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1.1 }}>확정</button>
                  )}
                  <span style={{ background: missingCount > 0 ? '#f57c00' : '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: FONT_SIZES.cell, fontWeight: 800, whiteSpace: 'nowrap', lineHeight: 1.1 }}>누락 {missingCount}건</span>
                  {isConfirmed && (
                    <button type="button" onClick={handleEdit} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: FONT_SIZES.cell, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1.1 }}>수정</button>
                  )}
                </div>
              </div>
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th style={{ background: '#42a5f5', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header1, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              2. 메인 공정명
            </th>
            <th colSpan={2} style={{ background: '#66bb6a', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header1, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              2. 메인공정기능 및 제품특성
            </th>
            <th style={{ background: FAIL_COLORS.header2, color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header1, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              2. 메인공정 고장형태(FM)
              {missingCount > 0 && (
                <span style={{ marginLeft: '8px', background: '#fff', color: '#f57c00', padding: '2px 8px', borderRadius: '10px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold }}>
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
            <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              메인공정기능
            </th>
            <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              제품특성
            </th>
            <th style={{ background: FAIL_COLORS.cellAlt, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>
              고장형태(FM)
              {missingCounts.failureModeCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#f57c00', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: FONT_SIZES.small }}>
                  {missingCounts.failureModeCount}
                </span>
              )}
            </th>
          </tr>
        </thead>
        
        <tbody>
          {processes.length === 0 ? (
            <tr>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: FONT_WEIGHTS.semibold }}>
                (구조분석에서 공정 입력)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#c8e6c9' }}>
                (기능분석에서 공정기능 입력)
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
            const functions = proc.functions || [];
            // 기능분석에서 입력한 제품특성 가져오기 (functions[].productChars[] 에서)
            const allProductChars: { funcName: string; charName: string; funcId: string }[] = [];
            functions.forEach((f: any) => {
              const pChars = f.productChars || [];
              if (pChars.length === 0) {
                allProductChars.push({ funcName: f.name, charName: '', funcId: f.id });
              } else {
                pChars.forEach((pc: any) => {
                  allProductChars.push({ funcName: f.name, charName: pc.name, funcId: f.id });
                });
              }
            });
            
            // 최대 행 수 (기능/제품특성 vs 고장형태)
            const totalRows = Math.max(1, allProductChars.length, modes.length);
            
            // 기능별 rowSpan 계산
            const funcSpans: { funcName: string; startIdx: number; rowSpan: number }[] = [];
            let currentFunc = '';
            let funcStartIdx = 0;
            allProductChars.forEach((pc, idx) => {
              if (pc.funcName !== currentFunc) {
                if (currentFunc) {
                  funcSpans.push({ funcName: currentFunc, startIdx: funcStartIdx, rowSpan: idx - funcStartIdx });
                }
                currentFunc = pc.funcName;
                funcStartIdx = idx;
              }
            });
            if (currentFunc) {
              funcSpans.push({ funcName: currentFunc, startIdx: funcStartIdx, rowSpan: allProductChars.length - funcStartIdx });
            }
            
            // 해당 행에서 기능 셀을 표시해야 하는지 확인
            const getFuncForRow = (rowIdx: number) => {
              const span = funcSpans.find(s => rowIdx >= s.startIdx && rowIdx < s.startIdx + s.rowSpan);
              return span ? { showFunc: rowIdx === span.startIdx, funcName: span.funcName, funcRowSpan: span.rowSpan } : null;
            };
            
            return Array.from({ length: totalRows }).map((_, rowIdx) => {
              const mode = modes[rowIdx];
              const productChar = allProductChars[rowIdx];
              const funcInfo = getFuncForRow(rowIdx);
              const zebraBg = rowIdx % 2 === 1 ? COLORS.failure.zebra : COLORS.failure.light;
              const structureZebra = rowIdx % 2 === 1 ? COLORS.structure.zebra : COLORS.structure.light;
              const functionZebra = rowIdx % 2 === 1 ? COLORS.function.zebra : COLORS.function.light;
              
              return (
                <tr key={`${proc.id}-${rowIdx}`} style={{ background: zebraBg }}>
                  {rowIdx === 0 && (
                    <td rowSpan={totalRows} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: structureZebra, fontWeight: FONT_WEIGHTS.semibold, verticalAlign: 'middle' }}>
                      {proc.no}. {proc.name}
                    </td>
                  )}
                  {/* 메인공정기능 */}
                  {funcInfo?.showFunc && (
                    <td rowSpan={funcInfo.funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'left', background: functionZebra, fontSize: FONT_SIZES.header1, verticalAlign: 'middle' }}>
                      {funcInfo.funcName || '(기능분석에서 입력)'}
                    </td>
                  )}
                  {!funcInfo && rowIdx === 0 && (
                    <td rowSpan={totalRows} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: functionZebra, fontSize: FONT_SIZES.header1, verticalAlign: 'middle' }}>
                      (기능분석에서 입력)
                    </td>
                  )}
                  {/* 제품특성 */}
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: functionZebra, fontSize: FONT_SIZES.header1, verticalAlign: 'middle' }}>
                    {productChar?.charName || (rowIdx < allProductChars.length ? '' : '')}
                  </td>
                  {/* 고장형태 */}
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell 
                      value={mode?.name || ''} 
                      placeholder={rowIdx === 0 ? "고장형태 선택" : ""} 
                      bgColor={zebraBg} 
                      onClick={() => setModal({ 
                        type: 'l2FailureMode', 
                        processId: proc.id, 
                        title: `${proc.no}. ${proc.name} 고장형태`, 
                        itemCode: 'FM1',
                        // 상위항목: 제품특성 (고장형태의 상위는 제품특성!)
                        parentProductChar: productChar?.charName || '',
                        processName: `${proc.no}. ${proc.name}`
                      })} 
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
          // 상위항목: 공정명 + 제품특성 (고장형태의 상위는 제품특성!)
          processName={modal.processName || processList.find(p => p.id === modal.processId)?.name}
          parentFunction={modal.parentProductChar}
          currentValues={(() => {
            if (modal.type === 'l2FailureMode') {
              const proc = state.l2.find(p => p.id === modal.processId);
              return (proc?.failureModes || []).map((m: any) => m.name);
            }
            return [];
          })()}
          processList={processList}
          onProcessChange={(newProcId) => setModal(modal ? { ...modal, processId: newProcId } : null)}
        />
      )}
    </div>
  );
}
