/**
 * @file FailureL3Tab.tsx
 * @description 3L 고장원인(FC) 분석 - 3행 헤더 구조 (구조분석 + 고장분석)
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
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FailureTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';
import { S, F, X, cell, cellP0, btnConfirm, btnEdit, btnDisabled, badgeOk, badgeConfirmed, badgeMissing, badgeCount } from '@/styles/worksheet';
import { getZebraColors } from '@/styles/level-colors';
import { handleEnterBlur } from '../../utils/keyboard';

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
  const [modal, setModal] = useState<{ 
    type: string; 
    processId: string; 
    weId?: string; 
    processCharId?: string;  // ✅ 공정특성 ID 추가 (CASCADE 연결)
    processCharName?: string;
    title: string; 
    itemCode: string 
  } | null>(null);

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

  // ✅ 항목별 누락 건수 분리 계산 - CASCADE 구조 (공정특성 기준)
  const missingCounts = useMemo(() => {
    let failureCauseCount = 0;   // 고장원인 누락
    
    state.l2.forEach(proc => {
      const allCauses = proc.failureCauses || [];  // 공정 레벨 고장원인
      
      (proc.l3 || []).forEach(we => {
        if (!we.name || isMissing(we.name)) return;
        
        // 작업요소의 모든 공정특성 수집
        (we.functions || []).forEach((f: any) => {
          (f.processChars || []).forEach((pc: any) => {
            // 이 공정특성에 연결된 고장원인들
            const linkedCauses = allCauses.filter((c: any) => c.processCharId === pc.id);
            if (linkedCauses.length === 0) {
              failureCauseCount++;  // 공정특성에 고장원인 없음
            } else {
              linkedCauses.forEach(c => {
                if (isMissing(c.name)) failureCauseCount++;
              });
            }
          });
        });
      });
    });
    return { failureCauseCount, total: failureCauseCount };
  }, [state.l2]);
  
  // 총 누락 건수 (기존 호환성)
  const missingCount = missingCounts.total;

  // ✅ failureCauses 변경 감지용 ref (FailureL2Tab 패턴과 동일)
  const failureCausesRef = useRef<string>('');
  
  // ✅ failureCauses 변경 시 자동 저장 (확실한 저장 보장)
  // ⚠️ 중요: failureCauses는 proc.failureCauses에 저장됨 (FailureL2Tab 패턴)
  useEffect(() => {
    // proc.failureCauses를 확인 (we.failureCauses가 아님!)
    const allCauses = state.l2.flatMap((p: any) => p.failureCauses || []);
    const causesKey = JSON.stringify(allCauses);
    
    if (failureCausesRef.current && causesKey !== failureCausesRef.current) {
      console.log('[FailureL3Tab] failureCauses 변경 감지, 자동 저장');
      saveToLocalStorage?.();
    }
    failureCausesRef.current = causesKey;
  }, [state.l2, saveToLocalStorage]);

  // ========== 저장 후 검증 (디버그 모드에서만) ==========
  // 이전: state.l2 변경마다 비교 → 타이밍 문제로 항상 불일치
  // 현재: 저장 직후에만 검증 (자동 저장 로직에서 처리)


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
    
    // ✅ 확정 상태 저장 - setTimeout으로 state 업데이트 대기
    setTimeout(() => {
      saveToLocalStorage?.();
      console.log('[FailureL3Tab] 확정 후 localStorage 저장 완료');
    }, 100);
    
    alert('3L 고장원인(FC) 분석이 확정되었습니다.');
  }, [missingCount, state.l2, setState, setDirty, saveToLocalStorage]);

  // 수정 핸들러
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, failureL3Confirmed: false }));
    setDirty(true);
    setTimeout(() => saveToLocalStorage?.(), 100);
  }, [setState, setDirty, saveToLocalStorage]);

  /**
   * ✅ [핵심] handleSave - CASCADE 구조 (공정특성→고장원인 연결)
   * - 공정 레벨에 failureCauses 저장 (FailureL2Tab 패턴)
   * - 각 고장원인에 processCharId FK 저장
   */
  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    const { type, processId, processCharId } = modal;
    const causeId = (modal as any).causeId;
    
    console.log('[FailureL3Tab] 저장 시작', { processId, processCharId, causeId, selectedCount: selectedValues.length });
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));

      if (type === 'l3FailureCause') {
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== processId) return proc;
          
          const currentCauses = proc.failureCauses || [];
          
          // ✅ causeId가 있으면 해당 항목만 수정 (다중선택 개별 수정)
          if (causeId) {
            if (selectedValues.length === 0) {
              return { ...proc, failureCauses: currentCauses.filter((c: any) => c.id !== causeId) };
            }
            return {
              ...proc,
              failureCauses: currentCauses.map((c: any) => 
                c.id === causeId ? { ...c, name: selectedValues[0] || c.name } : c
              )
            };
          }
          
          // ✅ causeId가 없으면 빈 셀 클릭 → 새 항목 추가 (processCharId별)
          // 1. 다른 processCharId의 고장원인은 보존
          const otherCauses = currentCauses.filter((c: any) => c.processCharId !== processCharId);
          
          // 2. 선택된 값들 각각 별도 레코드로 생성
          const newCauses = selectedValues.map(val => {
            const existing = currentCauses.find((c: any) => 
              c.processCharId === processCharId && c.name === val
            );
            return existing || { 
              id: uid(), 
              name: val, 
              occurrence: undefined,
              processCharId: processCharId  // ✅ CASCADE 연결
            };
          });
          
          console.log('[FailureL3Tab] 보존:', otherCauses.length, '새로:', newCauses.length);
          
          return {
            ...proc,
            failureCauses: [...otherCauses, ...newCauses]
          };
        });
      }
      
      // ✅ CRUD Update: 확정 상태 해제
      newState.failureL3Confirmed = false;
      
      console.log('[FailureL3Tab] 상태 업데이트 완료');
      return newState;
    });
    
    setDirty(true);
    setModal(null);
    
    // ✅ 즉시 저장 (강화된 저장 로직)
    // 1. requestAnimationFrame으로 상태 업데이트 완료 대기
    requestAnimationFrame(() => {
      // 2. 추가 대기 후 저장 (상태 반영 보장)
      setTimeout(() => {
        saveToLocalStorage?.();
        console.log('[FailureL3Tab] 저장 완료');
        
        // 3. 저장 후 검증 (다음 프레임에서)
        requestAnimationFrame(() => {
          const savedKey = `pfmea_worksheet_${(state as any).fmeaId || 'current'}`;
          const saved = localStorage.getItem(savedKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              const savedCauses = parsed.l2?.flatMap((p: any) => p.failureCauses || []) || [];
              const currentCauses = state.l2.flatMap((p: any) => p.failureCauses || []);
              console.log('[FailureL3Tab] 저장 검증:', {
                저장된개수: savedCauses.length,
                현재개수: currentCauses.length,
                일치: savedCauses.length === currentCauses.length
              });
            } catch (e) {
              console.error('[FailureL3Tab] 저장 검증 오류:', e);
            }
          }
        });
      }, 100);
    });
  }, [modal, setState, setDirty, saveToLocalStorage, state]);

  const handleDelete = useCallback((deletedValues: string[]) => {
    if (!modal) return;
    
    const { type, processId, processCharId } = modal;
    const deletedSet = new Set(deletedValues);
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      
      if (type === 'l3FailureCause') {
        // ✅ 공정 레벨에서 삭제 (processCharId 기준)
        newState.l2 = newState.l2.map((proc: any) => {
          if (processId && proc.id !== processId) return proc;
          return {
            ...proc,
            failureCauses: (proc.failureCauses || []).filter((c: any) => 
              !(c.processCharId === processCharId && deletedSet.has(c.name))
            )
          };
        });
      }
      
      // ✅ CRUD Delete: 확정 상태 해제
      newState.failureL3Confirmed = false;
      
      return newState;
    });
    
    setDirty(true);
    requestAnimationFrame(() => saveToLocalStorage?.());
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // ✅ 발생도 업데이트 - 공정 레벨에서 수정 (CASCADE)
  const updateOccurrence = useCallback((processId: string, causeId: string, occurrence: number | undefined) => {
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState.l2 = newState.l2.map((proc: any) => {
        if (proc.id !== processId) return proc;
        return {
          ...proc,
          failureCauses: (proc.failureCauses || []).map((c: any) => 
            c.id === causeId ? { ...c, occurrence } : c
          )
        };
      });
      // ✅ CRUD Update: 확정 상태 해제
      newState.failureL3Confirmed = false;
      return newState;
    });
    setDirty(true);
    if (saveToLocalStorage) saveToLocalStorage();
  }, [setState, setDirty, saveToLocalStorage]);

  /**
   * ✅ 평탄화된 행 데이터 - CASCADE 구조 (FailureL2Tab 패턴)
   * 공정(proc) → 작업요소(we) → 기능(func) → 공정특성(char) → 고장원인(cause)
   * 공정특성 기준으로 행 분리, 각 고장원인에 processCharId 연결
   */
  const flatRows = useMemo(() => {
    const rows: any[] = [];
    const processes = state.l2.filter(p => p.name && !p.name.includes('클릭'));
    
    processes.forEach(proc => {
      const workElements = (proc.l3 || []).filter((we: any) => we.name && !we.name.includes('클릭'));
      const allCauses = proc.failureCauses || [];  // 공정 레벨에 저장된 고장원인
      
      if (workElements.length === 0) {
        rows.push({ proc, we: null, processChar: null, cause: null, procRowSpan: 1, weRowSpan: 1, charRowSpan: 1, showProc: true, showWe: true, showChar: true });
        return;
      }
      
      let procRowCount = 0;
      const procFirstRowIdx = rows.length;
      
      workElements.forEach((we: any, weIdx: number) => {
        // 작업요소의 모든 공정특성 수집
        const allProcessChars: any[] = [];
        (we.functions || []).forEach((f: any) => {
          (f.processChars || []).forEach((c: any) => {
            allProcessChars.push({ ...c, funcId: f.id, funcName: f.name });
          });
        });
        
        let weRowCount = 0;
        const weFirstRowIdx = rows.length;
        
        if (allProcessChars.length === 0) {
          // 공정특성 없음 - 빈 행 1개
          rows.push({
            proc, we, processChar: null, cause: null,
            procRowSpan: 0, weRowSpan: 1, charRowSpan: 1,
            showProc: false, showWe: true, showChar: true
          });
          weRowCount = 1;
        } else {
          // 각 공정특성별로 행 생성
          allProcessChars.forEach((pc: any, pcIdx: number) => {
            // 이 공정특성에 연결된 고장원인들
            const linkedCauses = allCauses.filter((c: any) => c.processCharId === pc.id);
            const charFirstRowIdx = rows.length;
            
            if (linkedCauses.length === 0) {
              // 고장원인 없음 - 빈 행 1개
              rows.push({
                proc, we, processChar: pc, cause: null,
                procRowSpan: 0, weRowSpan: 0, charRowSpan: 1,
                showProc: false, showWe: false, showChar: true
              });
            } else {
              // 각 고장원인별로 행 생성
              linkedCauses.forEach((cause: any, cIdx: number) => {
                rows.push({
                  proc, we, processChar: pc, cause,
                  procRowSpan: 0, weRowSpan: 0,
                  charRowSpan: cIdx === 0 ? linkedCauses.length : 0,
                  showProc: false, showWe: false, showChar: cIdx === 0
                });
              });
            }
            
            const charRowCount = Math.max(1, linkedCauses.length);
            if (rows[charFirstRowIdx]) {
              rows[charFirstRowIdx].charRowSpan = charRowCount;
            }
            weRowCount += charRowCount;
          });
        }
        
        // 작업요소 rowSpan 갱신
        if (rows[weFirstRowIdx]) {
          rows[weFirstRowIdx].weRowSpan = weRowCount;
          rows[weFirstRowIdx].showWe = true;
        }
        procRowCount += weRowCount;
      });
      
      // 공정 rowSpan 갱신
      if (rows[procFirstRowIdx]) {
        rows[procFirstRowIdx].procRowSpan = procRowCount;
        rows[procFirstRowIdx].showProc = true;
      }
    });
    
    return rows;
  }, [state.l2]);

  return (
    <div className="p-0 overflow-auto h-full" style={{ paddingBottom: '50px' }} onKeyDown={handleEnterBlur}>
      <table className="w-full border-collapse table-fixed" style={{ marginBottom: '50px' }}>
        <colgroup>
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[160px]" />
          <col className="w-[50px]" />
          <col className="w-[280px]" />
        </colgroup>
        
        {/* 3행 헤더 구조 - 하단 2px 검은색 구분선 */}
        <thead className="sticky top-0 z-20 bg-white border-b-2 border-black">
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
                    <span className={badgeConfirmed}>✓ 확정됨({state.l2.reduce((sum, p) => sum + (p.failureCauses?.length || 0), 0)})</span>
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
            <th className="bg-[#1976d2] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              3. 작업 요소명
            </th>
            <th colSpan={2} className="bg-[#388e3c] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              3. 작업요소의 기능 및 공정특성
            </th>
            <th className="bg-[#e65100] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              3. 고장원인(FC)
              {missingCount > 0 && (
                <span className="ml-2 bg-yellow-400 text-red-700 px-3 py-1 rounded-md text-sm font-extrabold animate-pulse shadow-lg">
                  ⚠️ 누락 {missingCount}건
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
            <th className="bg-[#c8e6c9] border border-[#ccc] border-r-[2px] border-r-orange-500 p-1.5 text-xs font-semibold text-center">
              공정특성
            </th>
            <th className="bg-orange-500 text-white border border-[#ccc] border-l-0 p-1 text-[11px] font-semibold text-center whitespace-nowrap">
              특별특성
            </th>
            <th className="bg-[#ffe0b2] border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              고장원인(FC)
              {missingCounts.failureCauseCount > 0 && (
                <span className="ml-2 bg-red-600 text-white px-2.5 py-1 rounded-md text-sm font-extrabold animate-pulse shadow-lg ring-2 ring-red-300">
                  누락 {missingCounts.failureCauseCount}건
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
            // ✅ CASCADE 구조: processChar가 직접 flatRows에 포함됨
            const zebra = getZebraColors(idx); // 표준화된 색상
            
            return (
              <tr key={`${row.proc.id}-${row.we?.id || 'empty'}-${row.processChar?.id || 'nochar'}-${row.cause?.id || idx}`}>
                {/* 공정 셀: showProc && procRowSpan > 0 (파란색) */}
                {row.showProc && row.procRowSpan > 0 && (
                  <td rowSpan={row.procRowSpan} className="border border-[#ccc] p-1.5 text-center font-semibold align-middle text-xs" style={{ background: zebra.structure }}>
                    {row.proc.no}. {row.proc.name}
                  </td>
                )}
                
                {/* 작업요소 셀: showWe && weRowSpan > 0 (파란색) */}
                {row.showWe && row.weRowSpan > 0 && (
                  <td rowSpan={row.weRowSpan} className="border border-[#ccc] p-1.5 text-center align-middle text-xs" style={{ background: zebra.structure }}>
                    {row.we?.name || '(작업요소 없음)'}
                  </td>
                )}
                
                {/* ✅ 공정특성 셀: showChar && charRowSpan > 0 (녹색) */}
                {row.showChar && row.charRowSpan > 0 && (
                  <td rowSpan={row.charRowSpan} className="border border-[#ccc] border-r-[2px] border-r-orange-500 p-1.5 text-center align-middle text-xs" style={{ background: zebra.function }}>
                    {row.processChar?.name || '(기능분석에서 입력)'}
                  </td>
                )}
                {/* 특별특성 셀 (녹색) */}
                {row.showChar && row.charRowSpan > 0 && (
                  <td rowSpan={row.charRowSpan} className="border border-[#ccc] p-1 text-center align-middle text-xs" style={{ background: zebra.function }}>
                    {row.processChar?.specialChar ? (
                      <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${
                        row.processChar.specialChar === 'CC' ? 'bg-red-600' : 
                        row.processChar.specialChar === 'SC' ? 'bg-orange-500' : 'bg-blue-600'
                      }`}>
                        {row.processChar.specialChar}
                      </span>
                    ) : '-'}
                  </td>
                )}
                
                {/* 고장원인 셀 */}
                <td className={cellP0} style={{ backgroundColor: zebra.failure }}>
                  {row.we && row.processChar ? (
                    <SelectableCell 
                      value={row.cause?.name || ''} 
                      placeholder="고장원인 선택" 
                      bgColor={zebra.failure} 
                      onClick={() => {
                        handleCellClick({ 
                          type: 'l3FailureCause', 
                          processId: row.proc.id, 
                          weId: row.we.id, 
                          processCharId: row.processChar.id,  // ✅ CASCADE 연결
                          processCharName: row.processChar.name,
                          causeId: row.cause?.id || undefined, 
                          title: `${row.processChar.name} → 고장원인`, 
                          itemCode: 'FC1' 
                        });
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
          singleSelect={false}
          currentValues={(() => {
            if (modal.type === 'l3FailureCause') {
              // ✅ 공정 레벨에서 해당 processCharId에 연결된 고장원인만 가져오기
              const proc = state.l2.find(p => p.id === modal.processId);
              const allCauses = proc?.failureCauses || [];
              return allCauses
                .filter((c: any) => c.processCharId === modal.processCharId)
                .map((c: any) => c.name);
            }
            return [];
          })()}
          processName={processList.find(p => p.id === modal.processId)?.name}
          workElementName={modal.processCharName || ''}  // ✅ 공정특성명 표시
          processList={processList}
          onProcessChange={(newProcId) => setModal(modal ? { ...modal, processId: newProcId } : null)}
        />
      )}
    </div>
  );
}

