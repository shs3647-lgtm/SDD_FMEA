/**
 * @file FailureL3Tab.tsx
 * @description 3L 고장원인(FC) 분석 - 3행 헤더 구조 (구조분석 + 고장분석)
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FailureTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';
import { S, F, X, cell, cellP0, btnConfirm, btnEdit, btnDisabled, badgeOk, badgeConfirmed, badgeMissing, badgeCount } from '@/styles/worksheet';

// 색상 정의
const FAIL_COLORS = {
  header1: '#1a237e', header2: '#3949ab', header3: '#5c6bc0', cell: '#f5f6fc', cellAlt: '#e8eaf6',
};

// 스타일 함수
const BORDER = '1px solid #b0bec5';
const cellBase: React.CSSProperties = { border: BORDER, padding: '4px 6px', fontSize: FONT_SIZES.cell, verticalAlign: 'middle' };
const headerStyle = (bg: string, color = '#fff'): React.CSSProperties => ({ ...cellBase, background: bg, color, fontWeight: FONT_WEIGHTS.bold, textAlign: 'center' });
const dataCell = (bg: string): React.CSSProperties => ({ ...cellBase, background: bg });

export default function FailureL3Tab({ state, setState, setDirty, saveToLocalStorage }: FailureTabProps) {
  const [modal, setModal] = useState<{ type: string; processId: string; weId?: string; title: string; itemCode: string } | null>(null);

  // 공정 목록 (드롭다운용)
  const processList = useMemo(() => 
    state.l2.filter(p => p.name && !p.name.includes('클릭')).map(p => ({ id: p.id, no: p.no, name: `${p.no}. ${p.name}` })),
    [state.l2]
  );

  // 확정 상태
  const isConfirmed = state.failureL3Confirmed || false;

  // ✅ 셀 클릭 시 확정됨 상태면 자동으로 수정 모드로 전환
  const handleCellClick = useCallback((modalConfig: any) => {
    if (isConfirmed) {
      setState(prev => ({ ...prev, failureL3Confirmed: false }));
      setDirty(true);
    }
    setModal(modalConfig);
  }, [isConfirmed, setState, setDirty]);

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

  // ✅ failureCauses 변경 감지용 ref
  const failureCausesRef = useRef<string>('');
  
  // ✅ failureCauses 변경 시 자동 저장 (확실한 저장 보장)
  useEffect(() => {
    const allCauses = state.l2.flatMap((p: any) => (p.l3 || []).flatMap((we: any) => we.failureCauses || []));
    const causesKey = JSON.stringify(allCauses);
    
    if (failureCausesRef.current && causesKey !== failureCausesRef.current) {
      console.log('[FailureL3Tab] failureCauses 변경 감지, 자동 저장');
      saveToLocalStorage?.();
    }
    failureCausesRef.current = causesKey;
  }, [state.l2, saveToLocalStorage]);


  // 확정 핸들러 (L2 패턴 적용)
  const handleConfirm = useCallback(() => {
    console.log('[FailureL3Tab] 확정 버튼 클릭, missingCount:', missingCount);
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n먼저 입력을 완료해주세요.`);
      return;
    }
    
    // ✅ 현재 고장원인 통계 로그
    const allCauses = state.l2.flatMap((p: any) => (p.l3 || []).flatMap((we: any) => we.failureCauses || []));
    console.log('[FailureL3Tab] 확정 시 고장원인:', allCauses.length, '개');
    
    setState(prev => {
      const newState = { ...prev, failureL3Confirmed: true };
      console.log('[FailureL3Tab] 확정 상태 업데이트:', newState.failureL3Confirmed);
      return newState;
    });
    setDirty(true);
    
    // ✅ 즉시 저장 (requestAnimationFrame 사용)
    requestAnimationFrame(() => {
      saveToLocalStorage?.();
      console.log('[FailureL3Tab] 확정 후 localStorage 저장 완료');
    });
    
    alert('3L 고장원인(FC) 분석이 확정되었습니다.');
  }, [missingCount, state.l2, setState, setDirty, saveToLocalStorage]);

  // 수정 핸들러
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, failureL3Confirmed: false }));
    setDirty(true);
    requestAnimationFrame(() => saveToLocalStorage?.());
  }, [setState, setDirty, saveToLocalStorage]);

  /**
   * [핵심] handleSave - 원자성 저장 (L2 패턴 적용)
   * - 여러 개 선택 시 각각 별도 레코드로 저장
   * - ✅ 저장 후 즉시 localStorage에 반영
   */
  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    const isConfirmed = state.failureL3Confirmed || false;
    const { type, processId, weId } = modal;
    const causeId = (modal as any).causeId;
    
    console.log('[FailureL3Tab] 저장 시작', { processId, weId, causeId, selectedCount: selectedValues.length, isConfirmed });
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));

      if (type === 'l3FailureCause') {
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== processId) return proc;
          return {
            ...proc,
            l3: (proc.l3 || []).map((we: any) => {
              if (weId && we.id !== weId) return we;
              const currentCauses = we.failureCauses || [];
              
              // ✅ causeId가 있으면 해당 항목만 수정 (다중선택 개별 수정)
              if (causeId) {
                if (selectedValues.length === 0) {
                  return { ...we, failureCauses: currentCauses.filter((c: any) => c.id !== causeId) };
                }
                return {
                  ...we,
                  failureCauses: currentCauses.map((c: any) => 
                    c.id === causeId ? { ...c, name: selectedValues[0] || c.name } : c
                  )
                };
              }
              
              // ✅ causeId가 없으면 빈 셀 클릭 → 새 항목 추가
              const emptyCause = currentCauses.find((c: any) => !c.name || c.name === '');
              if (emptyCause && selectedValues.length > 0) {
                return {
                  ...we,
                  failureCauses: currentCauses.map((c: any) => 
                    c.id === emptyCause.id ? { ...c, name: selectedValues[0] } : c
                  )
                };
              }
              
              // ✅ 중복 체크: 같은 이름의 고장원인이 이미 있으면 추가하지 않음
              if (selectedValues.length > 0) {
                const existingNames = new Set(currentCauses.map((c: any) => c.name));
                const newValue = selectedValues[0];
                if (existingNames.has(newValue)) {
                  alert(`⚠️ 중복 항목: "${newValue}"는 이미 등록되어 있습니다.`);
                  return we;
                }
                const newCause = { id: uid(), name: newValue, occurrence: undefined };
                console.log('[FailureL3Tab] 새 고장원인 추가:', newCause.name);
                return { ...we, failureCauses: [...currentCauses, newCause] };
              }
              
              return we;
            })
          };
        });
      }
      
      console.log('[FailureL3Tab] 상태 업데이트 완료');
      return newState;
    });
    
    setDirty(true);
    setModal(null);
    
    // ✅ 즉시 저장 (requestAnimationFrame 사용)
    requestAnimationFrame(() => {
      saveToLocalStorage?.();
      console.log('[FailureL3Tab] 저장 완료');
    });
  }, [modal, state.failureL3Confirmed, setState, setDirty, saveToLocalStorage]);

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
    requestAnimationFrame(() => saveToLocalStorage?.());
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
    <div className="p-0 overflow-auto h-full">
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[160px]" />
          <col className="w-[50px]" />
          <col className="w-[280px]" />
        </colgroup>
        
        {/* 3행 헤더 구조 - 하단 2px 검은색 구분선 */}
        <thead className="border-b-2 border-black">
          {/* 1행: 단계 구분 */}
          <tr>
            <th colSpan={2} className="bg-[#1976d2] text-white border border-[#ccc] px-1.5 py-1 text-xs font-extrabold text-center whitespace-nowrap">
              구조분석(2단계)
            </th>
            <th colSpan={2} className="bg-[#388e3c] text-white border border-[#ccc] px-1.5 py-1 text-xs font-extrabold text-center whitespace-nowrap">
              기능분석(3단계)
            </th>
            <th className="bg-[#e65100] text-white border border-[#ccc] px-1.5 py-1 text-xs font-extrabold text-center">
              <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                <span className="whitespace-nowrap">고장분석(4단계)</span>
                <div className="flex gap-1">
                  {isConfirmed ? (
                    <span className={badgeConfirmed}>✓ 확정됨({state.l2.reduce((sum, p) => sum + (p.l3 || []).reduce((s2, w) => s2 + (w.failureCauses?.length || 0), 0), 0)})</span>
                  ) : (
                    <button type="button" onClick={handleConfirm} className={btnConfirm}>확정</button>
                  )}
                  <span className={missingCount > 0 ? badgeMissing : badgeOk}>누락 {missingCount}건</span>
                  {isConfirmed && (
                    <button type="button" onClick={handleEdit} className={btnEdit}>수정</button>
                  )}
                </div>
              </div>
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 (표준화) */}
          <tr>
            <th className="bg-[#1976d2] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              2. 메인 공정명
            </th>
            <th className="bg-[#f57c00] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              3. 작업 요소명
            </th>
            <th colSpan={2} className="bg-[#388e3c] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              3. 작업요소의 기능 및 공정특성
            </th>
            <th className="bg-[#e65100] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              3. 고장원인(FC)
              {missingCount > 0 && (
                <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">
                  누락 {missingCount}건
                </span>
              )}
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr>
            <th className="bg-[#bbdefb] border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              NO+공정명
            </th>
            <th className="bg-[#bbdefb] border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              작업요소
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              공정특성
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] p-1 text-[11px] font-semibold text-center">
              특별특성
            </th>
            <th className="bg-[#ffe0b2] border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              고장원인(FC)
              {missingCounts.failureCauseCount > 0 && (
                <span className="ml-1 bg-orange-500 text-white px-1.5 py-0.5 rounded-lg text-[11px]">
                  {missingCounts.failureCauseCount}
                </span>
              )}
            </th>
          </tr>
        </thead>
        
        <tbody>
          {flatRows.length === 0 ? (
            <tr>
              <td className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold">
                (구조분석에서 공정 입력)
              </td>
              <td className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold">
                (작업요소 입력)
              </td>
              <td className="border border-[#ccc] p-2.5 text-center bg-[#c8e6c9]">
                (기능분석에서 입력)
              </td>
              <td className="border border-[#ccc] p-2.5 text-center bg-[#c8e6c9]">
                -
              </td>
              <td className={cellP0}>
                <SelectableCell value="" placeholder="고장원인 선택" bgColor={FAIL_COLORS.cell} onClick={() => {}} />
              </td>
            </tr>
          ) : flatRows.map((row, idx) => {
            // 기능분석에서 입력한 공정특성 가져오기 (we.functions[].processChars[] 에서)
            const processChars = (row.we?.functions || []).flatMap((f: any) => f.processChars || []);
            const processChar = processChars[0];
            const zebraBg = idx % 2 === 1 ? '#ffe0b2' : '#fff3e0';
            const structureZebra = idx % 2 === 1 ? '#bbdefb' : '#e3f2fd';
            const functionZebra = idx % 2 === 1 ? '#c8e6c9' : '#e8f5e9';
            
            return (
              <tr key={`${row.proc.id}-${row.we?.id || 'empty'}-${row.cause?.id || idx}`} className={zebraBg}>
                {row.procRowSpan > 0 && (
                  <td rowSpan={row.procRowSpan} className={`border border-[#ccc] p-1.5 text-center ${structureZebra} font-semibold align-middle text-xs`}>
                    {row.proc.no}. {row.proc.name}
                  </td>
                )}
                {row.weRowSpan > 0 && (
                  <td rowSpan={row.weRowSpan} className={`border border-[#ccc] p-1.5 text-center ${structureZebra} align-middle text-xs`}>
                    {row.we?.name || '(작업요소 없음)'}
                  </td>
                )}
                {row.weRowSpan > 0 && (
                  <td rowSpan={row.weRowSpan} className={`border border-[#ccc] p-1.5 text-center ${functionZebra} align-middle text-xs`}>
                    {processChar?.name || '(기능분석에서 입력)'}
                  </td>
                )}
                {row.weRowSpan > 0 && (
                  <td rowSpan={row.weRowSpan} className={`border border-[#ccc] p-1.5 text-center ${functionZebra} align-middle text-xs`}>
                    {processChar?.specialChar || '-'}
                  </td>
                )}
                <td className={cellP0}>
                  {row.we ? (
                    <SelectableCell 
                      value={row.cause?.name || ''} 
                      placeholder="고장원인 선택" 
                      bgColor={zebraBg} 
                      onClick={() => {
                        // [원자성 규칙] 상위 항목(공정특성)이 없으면 하위(고장원인) 추가 불가
                        if (!processChar?.name) {
                          alert('⚠️ 상위 항목(공정특성)이 없습니다.\n\n고장원인을 추가하려면 먼저 기능분석에서 공정특성을 입력해주세요.\n\n[기능분석 3L(작업요소) → 공정특성 입력]');
                          return;
                        }
                        handleCellClick({ type: 'l3FailureCause', processId: row.proc.id, weId: row.we.id, causeId: row.cause?.id || undefined, title: `${row.we.name} 고장원인`, itemCode: 'FC1' });
                      }} 
                    />
                  ) : (
                    <span className="text-[#e65100] text-xs font-semibold p-2 block">-</span>
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
          singleSelect={false} // [원자성] 여러 개 선택 가능, 각각 별도 행으로 저장!
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

