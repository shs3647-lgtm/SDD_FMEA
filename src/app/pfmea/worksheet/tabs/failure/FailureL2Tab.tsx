/**
 * @file FailureL2Tab.tsx
 * @description 2L 고장형태(FM) 분석 - 원자성 데이터 구조 적용
 * @refactored 2025-12-30 - 부모-자식 관계 정확 구현
 * 
 * ⚠️⚠️⚠️ 코드프리즈 (CODE FREEZE) ⚠️⚠️⚠️
 * ============================================
 * 이 파일은 완전히 프리즈되었습니다.
 * 
 * ❌ 절대 수정 금지:
 * - 코드 변경 금지
 * - 주석 변경 금지
 * - 스타일 변경 금지
 * - 로직 변경 금지
 * 
 * ✅ 수정 허용 조건:
 * 1. 사용자가 명시적으로 수정 요청
 * 2. 수정 사유와 범위를 명확히 지시
 * 3. 코드프리즈 경고를 확인하고 진행
 * 
 * 📅 프리즈 일자: 2025-01-03
 * 📌 프리즈 범위: 구조분석부터 3L원인분석까지 전체
 * ============================================
 * 
 * [원자성 원칙]
 * ⭐ 1. 한 상위에 여러 하위 연결 가능
 * ⭐ 2. 각 하위는 별도 행에 저장 (배열 아님!)
 * ⭐ 3. 상위는 rowSpan으로 셀 합치기
 * ⭐ 4. 모든 하위에 상위 FK(productCharId) 저장
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FailureTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS } from '../../constants';
import { S, F, X, cell, cellP0, btnConfirm, btnEdit, btnDisabled, badgeOk, badgeConfirmed, badgeMissing, badgeCount } from '@/styles/worksheet';
import { getZebraColors } from '@/styles/level-colors';
import { findLinkedFailureModesForProductChar, getAutoLinkMessage } from '../../utils/auto-link';
import { handleEnterBlur } from '../../utils/keyboard';

const FAIL_COLORS = {
  header1: '#1a237e', header2: '#3949ab', header3: '#5c6bc0', cell: '#f5f6fc', cellAlt: '#e8eaf6',
};

// 스타일 함수
const BORDER = '1px solid #b0bec5';
const cellBase: React.CSSProperties = { border: BORDER, padding: '4px 6px', fontSize: FONT_SIZES.cell, verticalAlign: 'middle' };
const headerStyle = (bg: string, color = '#fff'): React.CSSProperties => ({ ...cellBase, background: bg, color, fontWeight: FONT_WEIGHTS.bold, textAlign: 'center' });
const dataCell = (bg: string): React.CSSProperties => ({ ...cellBase, background: bg });

export default function FailureL2Tab({ state, setState, setDirty, saveToLocalStorage, saveAtomicDB }: FailureTabProps) {
  const [modal, setModal] = useState<{ 
    type: string; 
    processId: string; 
    productCharId: string;
    title: string; 
    itemCode: string;
    parentProductChar: string;
    processName: string;
  } | null>(null);

  const processList = useMemo(() => 
    state.l2.filter(p => p.name && !p.name.includes('클릭')).map(p => ({ id: p.id, no: p.no, name: `${p.no}. ${p.name}` })),
    [state.l2]
  );

  const isConfirmed = state.failureL2Confirmed || false;
  // ✅ 상위 단계(기능분석 2L) 확정 여부 - 미확정이면 FM 입력/확정/표시를 막음
  const isUpstreamConfirmed = state.l2Confirmed || false;

  // ✅ 셀 클릭 시 확정됨 상태면 자동으로 수정 모드로 전환
  const handleCellClick = useCallback((modalConfig: any) => {
    if (!isUpstreamConfirmed) {
      alert('⚠️ 기능분석(2L)을 먼저 확정해주세요.\n\n기능분석 확정 후 고장형태(FM)을 입력할 수 있습니다.');
      return;
    }
    if (isConfirmed) {
      setState(prev => ({ ...prev, failureL2Confirmed: false }));
      setDirty(true);
    }
    setModal(modalConfig);
  }, [isUpstreamConfirmed, isConfirmed, setState, setDirty]);

  const isMissing = (name: string | undefined) => {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed === '' || trimmed === '-') return true;
    if (name.includes('클릭') || name.includes('추가') || name.includes('선택') || name.includes('입력')) return true;
    return false;
  };

  // ✅ 항목별 누락 건수 분리 계산 (필터링된 데이터만 카운트)
  // ⚠️ 중복 제품특성은 1번만 카운트 (buildFlatRows 중복 제거 로직과 동일)
  const missingCounts = useMemo(() => {
    // ✅ 상위 단계 미확정이면 누락 계산 자체를 하지 않음 (확정 게이트)
    if (!isUpstreamConfirmed) return { failureModeCount: 0, total: 0 };
    let failureModeCount = 0;
    
    // ✅ 의미 있는 공정만 필터링
    const meaningfulProcs = state.l2.filter((p: any) => {
      const name = p.name || '';
      return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택');
    });
    
    meaningfulProcs.forEach(proc => {
      const allModes = proc.failureModes || [];
      
      // ✅ 공정별 중복 제품특성 추적 (이름 기준)
      const countedCharsInProc = new Set<string>();
      
      // ✅ 의미 있는 기능만 필터링
      const meaningfulFuncs = (proc.functions || []).filter((f: any) => {
        const name = f.name || '';
        return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택');
      });
      
      meaningfulFuncs.forEach((f: any) => {
        // ✅ 의미 있는 제품특성만 필터링
        const meaningfulChars = (f.productChars || []).filter((pc: any) => {
          const name = pc.name || '';
          return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택');
        });
        
        meaningfulChars.forEach((pc: any) => {
          const charName = pc.name?.trim();
          
          // ✅ 중복 제품특성 스킵 (이미 카운트한 이름은 무시)
          if (countedCharsInProc.has(charName)) {
            return;
          }
          countedCharsInProc.add(charName);
          
          const linkedModes = allModes.filter((m: any) => m.productCharId === pc.id);
          if (linkedModes.length === 0) {
            failureModeCount++;
          } else {
            linkedModes.forEach((m: any) => {
              if (isMissing(m.name)) failureModeCount++;
            });
          }
        });
      });
    });
    return { failureModeCount, total: failureModeCount };
  }, [isUpstreamConfirmed, state.l2]);
  
  const missingCount = missingCounts.total;

  // ✅ 확정 건수 계산 (중복 제품특성 제외, 화면 표시 개수와 일치)
  const confirmedCount = useMemo(() => {
    if (!isUpstreamConfirmed) return 0;
    let count = 0;
    
    const meaningfulProcs = state.l2.filter((p: any) => {
      const name = p.name || '';
      return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택');
    });
    
    meaningfulProcs.forEach(proc => {
      const allModes = proc.failureModes || [];
      const countedCharsInProc = new Set<string>();
      
      const meaningfulFuncs = (proc.functions || []).filter((f: any) => {
        const name = f.name || '';
        return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택');
      });
      
      meaningfulFuncs.forEach((f: any) => {
        const meaningfulChars = (f.productChars || []).filter((pc: any) => {
          const name = pc.name || '';
          return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택');
        });
        
        meaningfulChars.forEach((pc: any) => {
          const charName = pc.name?.trim();
          if (countedCharsInProc.has(charName)) return;
          countedCharsInProc.add(charName);
          
          // 해당 제품특성에 연결된 고장형태 개수 카운트
          const linkedModes = allModes.filter((m: any) => m.productCharId === pc.id && !isMissing(m.name));
          count += linkedModes.length > 0 ? linkedModes.length : 0;
        });
      });
    });
    return count;
  }, [isUpstreamConfirmed, state.l2]);

  const handleConfirm = useCallback(() => {
    if (!isUpstreamConfirmed) {
      alert('⚠️ 기능분석(2L)을 먼저 확정해주세요.\n\n기능분석 확정 후 고장형태(FM)을 확정할 수 있습니다.');
      return;
    }
    console.log('[FailureL2Tab] 확정 버튼 클릭, missingCount:', missingCount);
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n먼저 입력을 완료해주세요.`);
      return;
    }
    
    // ✅ 현재 고장형태 통계 로그
    const allModes = state.l2.flatMap((p: any) => p.failureModes || []);
    console.log('[FailureL2Tab] 확정 시 고장형태:', allModes.length, '개');
    
    setState(prev => {
      const newState = { ...prev, failureL2Confirmed: true };
      console.log('[FailureL2Tab] 확정 상태 업데이트:', newState.failureL2Confirmed);
      return newState;
    });
    setDirty(true);
    
    // ✅ 확정 상태 저장 - setTimeout으로 state 업데이트 대기
    setTimeout(() => {
      saveToLocalStorage?.();
      // ✅ 확정 시 DB 저장 (명시적 호출)
      if (saveAtomicDB) {
        saveAtomicDB().catch(e => console.error('[FailureL2Tab] DB 저장 오류:', e));
      }
      console.log('[FailureL2Tab] 확정 후 localStorage 및 DB 저장 완료');
    }, 100);
    
    alert('2L 고장형태(FM) 분석이 확정되었습니다.');
  }, [isUpstreamConfirmed, missingCount, state.l2, setState, setDirty, saveToLocalStorage, saveAtomicDB]);

  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, failureL2Confirmed: false }));
    setDirty(true);
    setTimeout(() => saveToLocalStorage?.(), 100);
  }, [setState, setDirty, saveToLocalStorage]);

  // ✅ failureModes 변경 감지용 ref
  const failureModesRef = useRef<string>('');
  
  // ✅ failureModes 변경 시 자동 저장 (확실한 저장 보장)
  useEffect(() => {
    const allModes = state.l2.flatMap((p: any) => p.failureModes || []);
    const modesKey = JSON.stringify(allModes);
    
    if (failureModesRef.current && modesKey !== failureModesRef.current) {
      console.log('[FailureL2Tab] failureModes 변경 감지, 자동 저장');
      saveToLocalStorage?.();
    }
    failureModesRef.current = modesKey;
  }, [state.l2, saveToLocalStorage]);

  /**
   * [핵심] handleSave - 원자성 저장
   * - 여러 개 선택 시 각각 별도 레코드로 저장
   * - 모든 레코드에 productCharId FK 저장
   * - ✅ 저장 후 즉시 localStorage에 반영
   */
  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    const isConfirmed = state.failureL2Confirmed || false;
    const { processId, productCharId } = modal;
    const modeId = (modal as any).modeId;
    
    console.log('[FailureL2Tab] 저장 시작', { processId, productCharId, modeId, selectedCount: selectedValues.length, isConfirmed });
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      
      newState.l2 = newState.l2.map((proc: any) => {
        if (proc.id !== processId) return proc;
        
        const currentModes = proc.failureModes || [];
        
        // ✅ modeId가 있으면 해당 항목만 수정 (다중선택 개별 수정)
        if (modeId) {
          if (selectedValues.length === 0) {
            return { ...proc, failureModes: currentModes.filter((m: any) => m.id !== modeId) };
          }
          return {
            ...proc,
            failureModes: currentModes.map((m: any) => 
              m.id === modeId ? { ...m, name: selectedValues[0] || m.name } : m
            )
          };
        }
        
        // ✅ modeId가 없으면 빈 셀 클릭 → 새 항목 추가 (productCharId별)
        // 1. 다른 productCharId의 고장형태는 보존
        const otherModes = currentModes.filter((m: any) => m.productCharId !== productCharId);
        
        // 2. 선택된 값들 각각 별도 레코드로 생성
        const newModes = selectedValues.map(val => {
          const existing = currentModes.find((m: any) => 
            m.productCharId === productCharId && m.name === val
          );
          return existing || { 
            id: uid(), 
            name: val, 
            sc: false, 
            productCharId: productCharId
          };
        });
        
        console.log('[FailureL2Tab] 보존:', otherModes.length, '새로:', newModes.length, '최종:', [...otherModes, ...newModes].length, '개');
        
        return {
          ...proc,
          failureModes: [...otherModes, ...newModes]
        };
      });
      
      // ✅ 자동연결: 동일한 제품특성 이름을 가진 다른 공정에도 동일한 고장형태 추가
      const currentCharName = modal.parentCharName;
      if (currentCharName && selectedValues.length > 0) {
        let autoLinkedCount = 0;
        
        newState.l2 = newState.l2.map((proc: any) => {
          // 현재 공정은 이미 처리됨
          if (proc.id === processId) return proc;
          
          // 동일한 이름의 제품특성 찾기
          const allChars = (proc.functions || []).flatMap((f: any) => f.productChars || []);
          const matchingChars = allChars.filter((c: any) => c.name === currentCharName);
          
          if (matchingChars.length === 0) return proc;
          
          const currentModes = proc.failureModes || [];
          const updatedModes = [...currentModes];
          
          matchingChars.forEach((charItem: any) => {
            selectedValues.forEach(val => {
              const exists = updatedModes.some((m: any) => 
                m.productCharId === charItem.id && m.name === val
              );
              if (!exists) {
                updatedModes.push({
                  id: uid(),
                  name: val,
                  sc: false,
                  productCharId: charItem.id
                });
                autoLinkedCount++;
              }
            });
          });
          
          return { ...proc, failureModes: updatedModes };
        });
        
        if (autoLinkedCount > 0) {
          const message = getAutoLinkMessage(selectedValues, '고장형태');
          console.log(`[FailureL2Tab] ${currentCharName}: ${message} (${autoLinkedCount}건 자동연결)`);
        }
      }
      
      console.log('[FailureL2Tab] 상태 업데이트 완료');
      return newState;
    });
    
    setDirty(true);
    setModal(null);
    
    // ✅ 저장 보장 (stateRef 업데이트 대기 후 저장)
    setTimeout(() => {
      saveToLocalStorage?.();
      console.log('[FailureL2Tab] 저장 완료');
    }, 200);
  }, [modal, state.failureL2Confirmed, setState, setDirty, saveToLocalStorage]);

  const handleDelete = useCallback((deletedValues: string[]) => {
    if (!modal) return;
    
    const { processId, productCharId } = modal;
    const deletedSet = new Set(deletedValues);
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      
      newState.l2 = newState.l2.map((proc: any) => {
        if (proc.id !== processId) return proc;
        
        return { 
          ...proc, 
          failureModes: (proc.failureModes || []).filter((m: any) => {
            if (m.productCharId !== productCharId) return true;
            return !deletedSet.has(m.name);
          })
        };
      });
      
      return newState;
    });
    
    setDirty(true);
    setTimeout(() => saveToLocalStorage?.(), 200);
  }, [modal, setState, setDirty, saveToLocalStorage]);

  const processes = state.l2.filter(p => p.name && !p.name.includes('클릭'));

  /**
   * [핵심] 플랫 행 구조 생성
   * - 각 고장형태가 별도 행
   * - 제품특성은 rowSpan으로 합치기
   * - 공정/기능도 적절히 rowSpan
   */
  const buildFlatRows = useMemo(() => {
    // ✅ 상위 단계 미확정이면 표시 자체를 하지 않음
    if (!isUpstreamConfirmed) return [];
    const rows: {
      procId: string;
      procNo: string;
      procName: string;
      procRowSpan: number;
      showProc: boolean;
      funcId: string;
      funcName: string;
      funcRowSpan: number;
      showFunc: boolean;
      charId: string;
      charName: string;
      specialChar?: string;
      charRowSpan: number;
      showChar: boolean;
      modeId: string;
      modeName: string;
    }[] = [];

    // ✅ 의미 있는 데이터만 필터링하는 헬퍼 함수
    const isMeaningful = (name: string | undefined | null) => {
      if (!name) return false;
      const trimmed = String(name).trim();
      if (trimmed === '') return false;
      if (trimmed.includes('클릭')) return false;
      if (trimmed.includes('선택')) return false;
      if (trimmed.includes('입력')) return false;
      if (trimmed.includes('필요')) return false;
      if (trimmed.includes('추가')) return false;
      return true;
    };

    // ✅ 공정별로 이미 표시한 제품특성 이름 추적 (중복 제거)
    const displayedCharsByProc = new Map<string, Set<string>>();
    
    processes.forEach(proc => {
      const allModes = proc.failureModes || [];
      // ✅ 의미 있는 기능만 필터링
      const functions = (proc.functions || []).filter((f: any) => isMeaningful(f.name));
      
      // 이 공정에서 이미 표시된 제품특성 이름 Set
      if (!displayedCharsByProc.has(proc.id)) {
        displayedCharsByProc.set(proc.id, new Set());
      }
      const displayedCharsInProc = displayedCharsByProc.get(proc.id)!;
      
      let procRowCount = 0;
      let procFirstRowIdx = rows.length;
      
      if (functions.length === 0) {
        // 의미 있는 기능이 없으면 이 공정은 건너뜀 (빈행 생성 안함)
        return;
      } else {
        functions.forEach((f: any, fIdx: number) => {
          // ✅ 의미 있는 제품특성만 필터링 + 중복 이름 제거
          const allPChars = (f.productChars || []).filter((pc: any) => isMeaningful(pc.name));
          const pChars = allPChars.filter((pc: any) => {
            const charName = pc.name?.trim();
            if (displayedCharsInProc.has(charName)) {
              console.log('[FailureL2Tab] 중복 제품특성 스킵:', charName, '공정:', proc.name);
              return false; // 이미 표시된 제품특성은 스킵
            }
            displayedCharsInProc.add(charName);
            return true;
          });
          let funcRowCount = 0;
          const funcFirstRowIdx = rows.length;
          
          if (pChars.length === 0) {
            // 의미 있는 제품특성이 없으면 이 기능은 건너뜀 (빈행 생성 안함)
            return;
          } else {
            pChars.forEach((pc: any, pcIdx: number) => {
              const linkedModes = allModes.filter((m: any) => m.productCharId === pc.id);
              const charFirstRowIdx = rows.length;
              
              if (linkedModes.length === 0) {
                // 고장형태 없는 제품특성 (빈 행 1개)
                rows.push({
                  procId: proc.id, procNo: proc.no, procName: proc.name,
                  procRowSpan: 0, showProc: false,
                  funcId: f.id, funcName: f.name, funcRowSpan: 0, showFunc: false,
                  charId: pc.id, charName: pc.name, specialChar: pc.specialChar || '', charRowSpan: 1, showChar: true,
                  modeId: '', modeName: ''
                });
              } else {
                // 각 고장형태가 별도 행!
                linkedModes.forEach((m: any, mIdx: number) => {
                  rows.push({
                    procId: proc.id, procNo: proc.no, procName: proc.name,
                    procRowSpan: 0, showProc: false,
                    funcId: f.id, funcName: f.name, funcRowSpan: 0, showFunc: false,
                    charId: pc.id, charName: pc.name, specialChar: pc.specialChar || '',
                    charRowSpan: mIdx === 0 ? linkedModes.length : 0,
                    showChar: mIdx === 0,
                    modeId: m.id, modeName: m.name
                  });
                });
              }
              
              // 제품특성 rowSpan 갱신 (첫 행만)
              const charRowCount = Math.max(1, linkedModes.length);
              if (rows[charFirstRowIdx]) {
                rows[charFirstRowIdx].charRowSpan = charRowCount;
              }
              funcRowCount += charRowCount;
            });
          }
          
          // 기능 rowSpan 갱신 (첫 행만)
          if (rows[funcFirstRowIdx]) {
            rows[funcFirstRowIdx].funcRowSpan = funcRowCount;
            rows[funcFirstRowIdx].showFunc = true;
          }
          procRowCount += funcRowCount;
        });
      }
      
      // 공정 rowSpan 갱신 (첫 행만)
      if (rows[procFirstRowIdx]) {
        rows[procFirstRowIdx].procRowSpan = procRowCount;
        rows[procFirstRowIdx].showProc = true;
      }
    });

    return rows;
  }, [isUpstreamConfirmed, processes]);

  return (
    <div className="p-0 overflow-auto h-full" style={{ paddingBottom: '50px' }} onKeyDown={handleEnterBlur}>
      <table className="w-full border-collapse table-fixed" style={{minWidth: '800px', marginBottom: '50px'}}>
        <colgroup>
          <col style={{ width: '15%', minWidth: '100px' }} />
          <col style={{ width: '25%', minWidth: '150px' }} />
          <col style={{ width: '18%', minWidth: '100px' }} />
          <col style={{ width: '7%', minWidth: '50px' }} />
          <col style={{ width: '35%', minWidth: '200px' }} />
        </colgroup>
        
        {/* 헤더 - 하단 2px 검은색 구분선 */}
        <thead className="sticky top-0 z-20 bg-white border-b-2 border-black">
          {/* 1행: 단계 구분 + 확정/수정 버튼 (표준화) */}
          <tr>
            <th className="bg-[#1976d2] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center">
              구조분석(2단계)
            </th>
            <th colSpan={3} className="bg-[#388e3c] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center">
              기능분석(3단계)
            </th>
            <th className="bg-[#e65100] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center">
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <span className="font-bold">고장분석(4단계)</span>
                <div className="flex gap-1">
                  {isConfirmed ? (
                    <span className={badgeConfirmed}>✓ 확정됨({confirmedCount})</span>
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
          
          <tr>
            <th className="bg-[#42a5f5] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              2. 메인 공정명
            </th>
            <th colSpan={3} className="bg-[#66bb6a] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              2. 메인공정기능 및 제품특성
            </th>
            <th className="bg-[#f57c00] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              2. 메인공정 고장형태(FM)
              {missingCount > 0 && (
                <span className="ml-2 bg-yellow-400 text-red-700 px-3 py-1 rounded-md text-sm font-extrabold animate-pulse shadow-lg">
                  ⚠️ 누락 {missingCount}건
                </span>
              )}
            </th>
          </tr>
          
          <tr>
            <th className="bg-[#bbdefb] border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              NO+공정명
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              메인공정기능
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] border-r-[2px] border-r-orange-500 p-1.5 text-xs font-semibold text-center">
              제품특성
            </th>
            <th className="bg-orange-500 text-white border border-[#ccc] border-l-0 p-1 text-[11px] font-semibold text-center whitespace-nowrap">
              특별특성
            </th>
            <th className="bg-[#ffe0b2] border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              고장형태(FM)
            </th>
          </tr>
        </thead>
        
        <tbody>
          {buildFlatRows.length === 0 ? (
            <tr>
              <td className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold">
                {!isUpstreamConfirmed ? '⚠️ 기능분석(2L) 확정 필요' : '(구조분석에서 공정 입력)'}
              </td>
              <td className="border border-[#ccc] p-2.5 text-center bg-[#c8e6c9]">
                {!isUpstreamConfirmed ? '하위 단계는 상위 단계 확정 후 활성화됩니다.' : '(기능분석에서 공정기능 입력)'}
              </td>
              <td className="border border-[#ccc] border-r-[2px] border-r-orange-500 p-2.5 text-center bg-[#c8e6c9]">
                {!isUpstreamConfirmed ? '-' : '(기능분석에서 제품특성 입력)'}
              </td>
              <td className="border border-[#ccc] border-l-0 p-1 text-center bg-orange-100 text-xs">
                -
              </td>
              <td className={cellP0}>
                <SelectableCell value="" placeholder="고장형태 선택" bgColor={FAIL_COLORS.cell} onClick={() => {}} />
              </td>
            </tr>
          ) : buildFlatRows.map((row, idx) => {
            const zebra = getZebraColors(idx); // 표준화된 색상
            
            return (
              <tr key={`row-${idx}`}>
                {/* 공정명 - rowSpan (파란색) */}
                {row.showProc && (
                  <td rowSpan={row.procRowSpan} className="border border-[#ccc] p-2 text-center font-semibold align-middle" style={{ background: zebra.structure }}>
                    {row.procNo}. {row.procName}
                  </td>
                )}
                {/* 기능명 - rowSpan (녹색) */}
                {row.showFunc && (
                  <td rowSpan={row.funcRowSpan} className="border border-[#ccc] p-2 text-left text-xs align-middle" style={{ background: zebra.function }}>
                    {row.funcName || '(기능분석에서 입력)'}
                  </td>
                )}
                {/* 제품특성 - rowSpan (주황색) */}
                {row.showChar && (
                  <td rowSpan={row.charRowSpan} className="border border-[#ccc] border-r-[2px] border-r-orange-500 p-2 text-center text-xs align-middle" style={{ background: zebra.failure }}>
                    {row.charName || ''}
                  </td>
                )}
                {/* 특별특성 - rowSpan (주황색) */}
                {row.showChar && (
                  <td rowSpan={row.charRowSpan} className="border border-[#ccc] p-1 text-center text-xs align-middle" style={{ background: zebra.failure }}>
                    {row.specialChar ? (
                      <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${
                        row.specialChar === 'CC' ? 'bg-red-600' : 
                        row.specialChar === 'SC' ? 'bg-orange-500' : 'bg-blue-600'
                      }`}>
                        {row.specialChar}
                      </span>
                    ) : '-'}
                  </td>
                )}
                {/* 고장형태 - 각 행마다 (주황색 줄무늬) */}
                <td className={cellP0} style={{ background: zebra.failure }}>
                  <SelectableCell 
                    value={row.modeName || ''} 
                    placeholder={row.charName ? "고장형태 선택" : ""} 
                    bgColor={zebra.failure} 
                    onClick={() => {
                      if (!row.charId || !row.charName) {
                        alert('⚠️ 상위 항목(제품특성)이 없습니다.\n\n고장형태를 추가하려면 먼저 기능분석에서 제품특성을 입력해주세요.\n\n[기능분석 2L(메인공정) → 제품특성 입력]');
                        return;
                      }
                      handleCellClick({ 
                        type: 'l2FailureMode', 
                        processId: row.procId, 
                        productCharId: row.charId,
                        // modeId 제거 → 항상 다중선택 모드 (productCharId 기준으로 전체 관리)
                        title: `${row.procNo}. ${row.procName} 고장형태`, 
                        itemCode: 'FM1',
                        parentProductChar: row.charName,
                        processName: `${row.procNo}. ${row.procName}`
                      });
                    }} 
                  />
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
          processName={modal.processName}
          parentFunction={modal.parentProductChar}
          currentValues={(() => {
            if (modal.type === 'l2FailureMode') {
              const proc = state.l2.find(p => p.id === modal.processId);
              const allModes = proc?.failureModes || [];
              const linkedModes = allModes.filter((m: any) => m.productCharId === modal.productCharId);
              return linkedModes.map((m: any) => m.name);
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
