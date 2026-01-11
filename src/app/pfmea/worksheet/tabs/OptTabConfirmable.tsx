/**
 * @file OptTabConfirmable.tsx  
 * @description FMEA 워크시트 - 최적화(6단계) 탭 (확정 기능 포함)
 * 입력 가능 + 로컬 자동 저장 + 확정 시 DB 저장
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WorksheetState } from '../constants';
import { btnConfirm, btnEdit, badgeConfirmed, badgeOk, badgeMissing } from '@/styles/worksheet';
import { triggerAutoBackup } from '@/lib/backup/backup-manager';

interface OptTabProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
  setStateSynced?: (updater: React.SetStateAction<WorksheetState>) => void;
  setDirty: (dirty: boolean) => void;
  saveToLocalStorage?: () => void;
  saveAtomicDB?: () => void;
}

// 최적화 데이터 타입
interface OptData {
  id: string;  // failureCauseId
  // 계획 (4개)
  planAction: string;  // 조치(개선)
  planPerson: string;  // 책임자
  planTarget: string;  // 목표완료일
  planComplete: string;  // 조치완료일
  // 결과 모니터링 (3개)
  monitorS: number;  // 심각도
  monitorO: number;  // 발생도
  monitorD: number;  // 검출도
  // 효과 평가 (7개)
  evalAP: number;  // AP
  evalRPN: number;  // RPN
  evalSpecialChar: string;  // 특별특성
  evalSeverity: number;  // 심각도
  evalLessonLearned: string;  // 습득교훈
  evalRemark: string;  // 비고
  evalDate: string;  // 평가일
}

/** 공통 스타일 */
const tw = {
  mainHeader: 'bg-[#4caf50] text-white border border-[#ccc] p-1.5 h-7 font-black text-xs text-center',
  subHeader: 'border border-[#ccc] p-1 h-6 font-bold text-xs text-center',
  colHeader: 'border border-[#ccc] p-0.5 h-5 font-semibold text-xs text-center whitespace-nowrap',
  cell: 'border border-[#ccc] px-1 py-0.5 text-xs',
  cellCenter: 'border border-[#ccc] px-1 py-0.5 text-xs text-center',
  planHeader: 'bg-yellow-200',
  planCell: 'bg-yellow-50',
  monitorHeader: 'bg-cyan-200',
  monitorCell: 'bg-cyan-50',
  evalHeader: 'bg-lime-200',
  evalCell: 'bg-lime-50',
  thead: 'sticky top-0 z-20 bg-white border-b-2 border-black',
  input: 'w-full bg-transparent border-none outline-none text-xs p-0',
  inputCenter: 'w-full bg-transparent border-none outline-none text-xs text-center p-0',
};

export default function OptTabConfirmable({ 
  state, 
  setState, 
  setStateSynced, 
  setDirty, 
  saveToLocalStorage,
  saveAtomicDB 
}: OptTabProps) {
  const router = useRouter();
  
  // 확정 상태
  const isConfirmed = (state as any).optConfirmed || false;
  const isUpstreamConfirmed = (state as any).riskConfirmed || false;
  
  // 최적화 데이터 - state에서 관리
  const optData = (state as any).optimization || [];
  
  // 자동 저장 ref
  const optDataRef = useRef<string>('');
  
  // 최적화 데이터 변경 시 자동 저장
  useEffect(() => {
    const dataKey = JSON.stringify(optData);
    if (optDataRef.current && dataKey !== optDataRef.current) {
      console.log('[OptTab] optimization 변경 감지, 자동 저장');
      saveToLocalStorage?.();
    }
    optDataRef.current = dataKey;
  }, [optData, saveToLocalStorage]);
  
  // 최적화 데이터 업데이트
  const updateOptData = useCallback((id: string, field: keyof OptData, value: any) => {
    setState(prev => {
      const optimization = (prev as any).optimization || [];
      const existing = optimization.find((o: OptData) => o.id === id);
      
      if (existing) {
        // 업데이트
        const updated = optimization.map((o: OptData) => 
          o.id === id ? { ...o, [field]: value } : o
        );
        return { ...prev, optimization: updated } as any;
      } else {
        // 신규 추가
        const newOpt: OptData = {
          id,
          planAction: '',
          planPerson: '',
          planTarget: '',
          planComplete: '',
          monitorS: 0,
          monitorO: 0,
          monitorD: 0,
          evalAP: 0,
          evalRPN: 0,
          evalSpecialChar: '',
          evalSeverity: 0,
          evalLessonLearned: '',
          evalRemark: '',
          evalDate: '',
          [field]: value,
        };
        return { ...prev, optimization: [...optimization, newOpt] } as any;
      }
    });
    setDirty(true);
  }, [setState, setDirty]);
  
  // RPN 자동 계산
  const calculateRPN = useCallback((id: string, s: number, o: number, d: number) => {
    const rpn = s * o * d;
    updateOptData(id, 'evalRPN', rpn);
  }, [updateOptData]);
  
  // 확정 핸들러
  const handleConfirm = useCallback(() => {
    if (!isUpstreamConfirmed) {
      alert('⚠️ 리스크평가를 먼저 확정해주세요.\n\n리스크평가 확정 후 최적화를 확정할 수 있습니다.');
      return;
    }
    
    console.log('[OptTab] 확정 버튼 클릭');
    
    const updateFn = (prev: any) => {
      const newState = { ...prev, optConfirmed: true };
      console.log('[OptTab] 확정 상태 업데이트:', newState.optConfirmed);
      return newState;
    };
    
    if (setStateSynced) {
      setStateSynced(updateFn);
    } else {
      setState(updateFn);
    }
    setDirty(true);
    
    // 저장
    setTimeout(() => {
      saveToLocalStorage?.();
      saveAtomicDB?.();
      console.log('[OptTab] 확정 후 localStorage + DB 저장 완료');
    }, 50);
    
    // ✅ 자동 백업 트리거 (최적화 확정 시)
    setTimeout(async () => {
      const fmeaId = (state as any).fmeaId || '';
      const fmeaName = (state as any).fmeaName || state.l1?.name || fmeaId;
      try {
        const backupResult = await triggerAutoBackup(fmeaId, fmeaName, state);
        if (backupResult) {
          console.log('[OptTab] 자동 백업 완료:', backupResult);
        }
      } catch (error) {
        console.error('[OptTab] 자동 백업 실패:', error);
      }
    }, 300);
    
    // 🚀 FMEA 완성 후 승인 확인
    setTimeout(() => {
      const fmeaId = (state as any).fmeaId || '';
      if (confirm('🎉 FMEA 작성이 완료되었습니다!\n\nFMEA를 승인하시겠습니까?\n\n[확인] → 개정관리 화면으로 이동\n[취소] → 현재 화면 유지')) {
        console.log('[OptTab] FMEA 승인 → 개정관리 화면 이동');
        router.push(`/pfmea/revision?id=${fmeaId}`);
      }
    }, 200);
  }, [isUpstreamConfirmed, (state as any).fmeaId, setState, setStateSynced, setDirty, saveToLocalStorage, saveAtomicDB, router]);
  
  // 승인 버튼 클릭 핸들러 (개정관리 화면 이동)
  const handleApproval = useCallback(() => {
    const fmeaId = (state as any).fmeaId || '';
    if (confirm('🔏 FMEA 승인 프로세스를 시작합니다.\n\n개정관리 화면으로 이동하시겠습니까?')) {
      router.push(`/pfmea/revision?id=${fmeaId}`);
    }
  }, [(state as any).fmeaId, router]);
  
  // 수정 핸들러
  const handleEdit = useCallback(() => {
    const updateFn = (prev: any) => ({ ...prev, optConfirmed: false });
    if (setStateSynced) {
      setStateSynced(updateFn);
    } else {
      setState(updateFn);
    }
    setDirty(true);
    setTimeout(() => saveToLocalStorage?.(), 50);
  }, [setState, setStateSynced, setDirty, saveToLocalStorage]);
  
  // 고장원인 목록 가져오기
  const failureCauses = state.l2.flatMap(proc => 
    (proc as any).failureCauses || []
  );
  
  return (
    <>
      <thead className={tw.thead}>
        {/* 1행: 대분류 */}
        <tr>
          <th colSpan={14} className={tw.mainHeader}>
            <div className="flex items-center justify-between">
              <span className="flex-1 text-center">P-FMEA 최적화(6단계)</span>
              <div className="flex gap-1 absolute right-2">
                {/* 확정/수정 버튼 */}
                {isConfirmed ? (
                  <span className={badgeConfirmed}>✓ 확정됨</span>
                ) : (
                  <button type="button" onClick={handleConfirm} className={btnConfirm}>확정</button>
                )}
                {isConfirmed && (
                  <button type="button" onClick={handleEdit} className={btnEdit}>수정</button>
                )}
                
                {/* 승인 버튼: 항상 표시, 6ST 확정 후 활성화 */}
                <button 
                  type="button" 
                  onClick={isConfirmed ? handleApproval : undefined}
                  disabled={!isConfirmed}
                  className={`px-2 py-0.5 text-xs font-bold rounded border flex items-center gap-1 ${
                    isConfirmed 
                      ? 'bg-green-500 text-white border-green-600 hover:bg-green-600 cursor-pointer' 
                      : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
                  }`}
                  title={isConfirmed 
                    ? "개정관리 화면으로 이동하여 FMEA 승인" 
                    : "6ST 확정 후 활성화됩니다"
                  }
                >
                  📋 승인
                </button>
              </div>
            </div>
          </th>
        </tr>

        {/* 2행: 서브그룹 */}
        <tr>
          <th colSpan={4} className={`${tw.subHeader} ${tw.planHeader}`}>계획</th>
          <th colSpan={3} className={`${tw.subHeader} ${tw.monitorHeader}`}>결과 모니터링</th>
          <th colSpan={7} className={`${tw.subHeader} ${tw.evalHeader}`}>효과 평가</th>
        </tr>

        {/* 3행: 컬럼명 */}
        <tr>
          <th className={`${tw.colHeader} ${tw.planCell}`}>조치(개선)</th>
          <th className={`${tw.colHeader} ${tw.planCell}`}>책임자</th>
          <th className={`${tw.colHeader} ${tw.planCell}`}>목표완료일</th>
          <th className={`${tw.colHeader} ${tw.planCell}`}>조치완료일</th>
          <th className={`${tw.colHeader} ${tw.monitorCell}`}>S</th>
          <th className={`${tw.colHeader} ${tw.monitorCell}`}>O</th>
          <th className={`${tw.colHeader} ${tw.monitorCell}`}>D</th>
          <th className={`${tw.colHeader} ${tw.evalCell}`}>AP</th>
          <th className={`${tw.colHeader} ${tw.evalCell}`}>RPN</th>
          <th className={`${tw.colHeader} ${tw.evalCell}`}>특별특성</th>
          <th className={`${tw.colHeader} ${tw.evalCell}`}>심각도</th>
          <th className={`${tw.colHeader} ${tw.evalCell}`}>습득교훈</th>
          <th className={`${tw.colHeader} ${tw.evalCell}`}>비고</th>
          <th className={`${tw.colHeader} ${tw.evalCell}`}>평가일</th>
        </tr>
      </thead>
      
      <tbody>
        {failureCauses.length === 0 ? (
          <tr>
            <td colSpan={14} className="text-center p-10 text-gray-500 text-xs">
              리스크평가를 먼저 완료해주세요.
            </td>
          </tr>
        ) : (
          failureCauses.map((fc: any, idx: number) => {
            const optItem = optData.find((o: OptData) => o.id === fc.id) || {};
            const isDisabled = isConfirmed;
            
            return (
              <tr key={`opt-${fc.id}-${idx}`} className={`h-6 ${idx % 2 === 1 ? 'bg-gray-100' : 'bg-white'}`}>
                {/* 계획 */}
                <td className={`${tw.cell} ${tw.planCell}`}>
                  <input
                    type="text"
                    value={optItem.planAction || ''}
                    onChange={(e) => updateOptData(fc.id, 'planAction', e.target.value)}
                    disabled={isDisabled}
                    className={tw.input}
                    placeholder="조치"
                  />
                </td>
                <td className={`${tw.cell} ${tw.planCell}`}>
                  <input
                    type="text"
                    value={optItem.planPerson || ''}
                    onChange={(e) => updateOptData(fc.id, 'planPerson', e.target.value)}
                    disabled={isDisabled}
                    className={tw.input}
                    placeholder="책임자"
                  />
                </td>
                <td className={`${tw.cell} ${tw.planCell}`}>
                  <input
                    type="date"
                    value={optItem.planTarget || ''}
                    onChange={(e) => updateOptData(fc.id, 'planTarget', e.target.value)}
                    disabled={isDisabled}
                    className={tw.input}
                  />
                </td>
                <td className={`${tw.cell} ${tw.planCell}`}>
                  <input
                    type="date"
                    value={optItem.planComplete || ''}
                    onChange={(e) => updateOptData(fc.id, 'planComplete', e.target.value)}
                    disabled={isDisabled}
                    className={tw.input}
                  />
                </td>
                
                {/* 결과 모니터링 */}
                <td className={`${tw.cellCenter} ${tw.monitorCell}`}>
                  <input
                    type="number"
                    value={optItem.monitorS || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      updateOptData(fc.id, 'monitorS', val);
                      calculateRPN(fc.id, val, optItem.monitorO || 0, optItem.monitorD || 0);
                    }}
                    disabled={isDisabled}
                    className={tw.inputCenter}
                    min="1"
                    max="10"
                  />
                </td>
                <td className={`${tw.cellCenter} ${tw.monitorCell}`}>
                  <input
                    type="number"
                    value={optItem.monitorO || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      updateOptData(fc.id, 'monitorO', val);
                      calculateRPN(fc.id, optItem.monitorS || 0, val, optItem.monitorD || 0);
                    }}
                    disabled={isDisabled}
                    className={tw.inputCenter}
                    min="1"
                    max="10"
                  />
                </td>
                <td className={`${tw.cellCenter} ${tw.monitorCell}`}>
                  <input
                    type="number"
                    value={optItem.monitorD || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      updateOptData(fc.id, 'monitorD', val);
                      calculateRPN(fc.id, optItem.monitorS || 0, optItem.monitorO || 0, val);
                    }}
                    disabled={isDisabled}
                    className={tw.inputCenter}
                    min="1"
                    max="10"
                  />
                </td>
                
                {/* 효과 평가 */}
                <td className={`${tw.cellCenter} ${tw.evalCell}`}>
                  <input
                    type="number"
                    value={optItem.evalAP || ''}
                    onChange={(e) => updateOptData(fc.id, 'evalAP', parseInt(e.target.value) || 0)}
                    disabled={isDisabled}
                    className={tw.inputCenter}
                  />
                </td>
                <td className={`${tw.cellCenter} ${tw.evalCell} font-bold`}>
                  {optItem.evalRPN || 0}
                </td>
                <td className={`${tw.cellCenter} ${tw.evalCell}`}>
                  <input
                    type="text"
                    value={optItem.evalSpecialChar || ''}
                    onChange={(e) => updateOptData(fc.id, 'evalSpecialChar', e.target.value)}
                    disabled={isDisabled}
                    className={tw.inputCenter}
                    maxLength={3}
                  />
                </td>
                <td className={`${tw.cellCenter} ${tw.evalCell}`}>
                  <input
                    type="number"
                    value={optItem.evalSeverity || ''}
                    onChange={(e) => updateOptData(fc.id, 'evalSeverity', parseInt(e.target.value) || 0)}
                    disabled={isDisabled}
                    className={tw.inputCenter}
                    min="1"
                    max="10"
                  />
                </td>
                <td className={`${tw.cell} ${tw.evalCell}`}>
                  <input
                    type="text"
                    value={optItem.evalLessonLearned || ''}
                    onChange={(e) => updateOptData(fc.id, 'evalLessonLearned', e.target.value)}
                    disabled={isDisabled}
                    className={tw.input}
                    placeholder="습득교훈"
                  />
                </td>
                <td className={`${tw.cell} ${tw.evalCell}`}>
                  <input
                    type="text"
                    value={optItem.evalRemark || ''}
                    onChange={(e) => updateOptData(fc.id, 'evalRemark', e.target.value)}
                    disabled={isDisabled}
                    className={tw.input}
                    placeholder="비고"
                  />
                </td>
                <td className={`${tw.cell} ${tw.evalCell}`}>
                  <input
                    type="date"
                    value={optItem.evalDate || ''}
                    onChange={(e) => updateOptData(fc.id, 'evalDate', e.target.value)}
                    disabled={isDisabled}
                    className={tw.input}
                  />
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );
}


