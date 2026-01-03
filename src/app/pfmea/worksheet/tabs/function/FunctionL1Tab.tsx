/**
 * @file FunctionL1Tab.tsx
 * @description 완제품(L1) 기능 분석 - 3행 헤더 구조 (구조분석 + 기능분석)
 */

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FunctionTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';
import { WS, btnConfirm, btnEdit, badgeConfirmed, badgeOk, badgeMissing } from '@/styles/worksheet';

// 구분(Type)별 색상 정의 - 공통 색상 사용
import { L1_TYPE_COLORS, getL1TypeColor } from '@/styles/level-colors';
const getTypeColor = getL1TypeColor;

// 스타일 함수
const BORDER = '1px solid #b0bec5';
const cellBase: React.CSSProperties = { border: BORDER, padding: '4px 6px', fontSize: FONT_SIZES.cell, verticalAlign: 'middle' };
const headerStyle = (bg: string, color = '#fff'): React.CSSProperties => ({ ...cellBase, background: bg, color, fontWeight: FONT_WEIGHTS.bold, textAlign: 'center' });
const dataCell = (bg: string): React.CSSProperties => ({ ...cellBase, background: bg });

export default function FunctionL1Tab({ state, setState, setDirty, saveToLocalStorage }: FunctionTabProps) {
  const [modal, setModal] = useState<{ type: string; id: string; title: string; itemCode: string; parentFunction?: string; parentCategory?: string } | null>(null);
  
  // 확정 상태는 state에서 관리 (localStorage에 저장됨)
  const isConfirmed = state.l1Confirmed || false;

  // ✅ 셀 클릭 시 확정됨 상태면 자동으로 수정 모드로 전환
  const handleCellClick = useCallback((modalConfig: any) => {
    if (isConfirmed) {
      setState(prev => ({ ...prev, l1Confirmed: false }));
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
  const missingCounts = React.useMemo(() => {
    let functionCount = 0;     // 완제품기능 누락
    let requirementCount = 0;  // 요구사항 누락
    
    // 구분이 없으면 누락
    if (state.l1.types.length === 0) {
      functionCount += 1;
    }
    state.l1.types.forEach(t => {
      // 기능이 없으면 누락
      if (t.functions.length === 0) {
        functionCount += 1;
      }
      t.functions.forEach(f => {
        // 기능 이름 체크
        if (isMissing(f.name)) functionCount++;
        // 요구사항이 없으면 누락
        if (!f.requirements || f.requirements.length === 0) {
          requirementCount += 1;
        }
        // 요구사항 이름 체크
        (f.requirements || []).forEach(r => {
          if (isMissing(r.name)) requirementCount++;
        });
      });
    });
    return { functionCount, requirementCount, total: functionCount + requirementCount };
  }, [state.l1.types]);
  
  // 총 누락 건수 (기존 호환성)
  const missingCount = missingCounts.total;

  // ✅ 1L COUNT 계산 (완제품기능, 요구사항)
  const functionCount = useMemo(() => {
    return state.l1.types.reduce((sum, type) => 
      sum + (type.functions || []).filter(f => f.name && !f.name.includes('클릭')).length, 0);
  }, [state.l1.types]);
  
  const requirementCount = useMemo(() => {
    return state.l1.types.reduce((sum, type) => 
      sum + (type.functions || []).reduce((funcSum, func) => 
        funcSum + (func.requirements || []).filter((r: any) => r.name && !r.name.includes('클릭')).length, 0), 0);
  }, [state.l1.types]);

  // ✅ L1 기능 데이터 변경 감지용 ref (고장분석 패턴 적용)
  const l1DataRef = useRef<string>('');
  
  // ✅ L1 데이터 변경 시 자동 저장 (확실한 저장 보장)
  useEffect(() => {
    const dataKey = JSON.stringify(state.l1.types);
    if (l1DataRef.current && dataKey !== l1DataRef.current) {
      console.log('[FunctionL1Tab] l1.types 변경 감지, 자동 저장');
      saveToLocalStorage?.();
    }
    l1DataRef.current = dataKey;
  }, [state.l1.types, saveToLocalStorage]);


  // 확정 핸들러 (고장분석 패턴 적용)
  const handleConfirm = useCallback(() => {
    console.log('[FunctionL1Tab] 확정 버튼 클릭, missingCount:', missingCount);
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n모든 항목을 입력 후 확정해 주세요.`);
      return;
    }
    
    // ✅ 현재 기능 통계 로그
    const funcCount = state.l1.types.flatMap(t => t.functions).length;
    const reqCount = state.l1.types.flatMap(t => t.functions.flatMap(f => f.requirements || [])).length;
    console.log('[FunctionL1Tab] 확정 시 기능:', funcCount, '개, 요구사항:', reqCount, '개');
    
    setState(prev => {
      const newState = { ...prev, l1Confirmed: true };
      console.log('[FunctionL1Tab] 확정 상태 업데이트:', newState.l1Confirmed);
      return newState;
    });
    setDirty(true);
    
    // ✅ 즉시 저장 (requestAnimationFrame 사용)
    requestAnimationFrame(() => {
      saveToLocalStorage?.();
      console.log('[FunctionL1Tab] 확정 후 localStorage 저장 완료');
    });
    
    alert('✅ 1L 완제품 기능분석이 확정되었습니다.');
  }, [missingCount, state.l1.types, setState, setDirty, saveToLocalStorage]);

  // 수정 핸들러 (고장분석 패턴 적용)
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, l1Confirmed: false }));
    setDirty(true);
    requestAnimationFrame(() => saveToLocalStorage?.());
  }, [setState, setDirty, saveToLocalStorage]);

  // 인라인 편집 핸들러 - 요구사항 (더블클릭)
  const handleInlineEditRequirement = useCallback((typeId: string, funcId: string, reqId: string, newValue: string) => {
    setState(prev => ({
      ...prev,
      l1: {
        ...prev.l1,
        types: prev.l1.types.map(t => {
          if (t.id !== typeId) return t;
          return {
            ...t,
            functions: t.functions.map(f => {
              if (f.id !== funcId) return f;
              return {
                ...f,
                requirements: f.requirements.map(r => {
                  if (r.id !== reqId) return r;
                  return { ...r, name: newValue };
                })
              };
            })
          };
        })
      }
    }));
    setDirty(true);
    saveToLocalStorage?.(); // 영구 저장
  }, [setState, setDirty, saveToLocalStorage]);

  // 인라인 편집 핸들러 - 기능 (더블클릭)
  const handleInlineEditFunction = useCallback((typeId: string, funcId: string, newValue: string) => {
    setState(prev => ({
      ...prev,
      l1: {
        ...prev.l1,
        types: prev.l1.types.map(t => {
          if (t.id !== typeId) return t;
          return {
            ...t,
            functions: t.functions.map(f => {
              if (f.id !== funcId) return f;
              return { ...f, name: newValue };
            })
          };
        })
      }
    }));
    setDirty(true);
    saveToLocalStorage?.(); // 영구 저장
  }, [setState, setDirty, saveToLocalStorage]);

  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    console.log('[FunctionL1Tab] handleSave 시작', { type: modal.type, id: modal.id, selectedValues });
    
    setState(prev => {
      // ✅ 깊은 복사 (FailureL2Tab 패턴)
      const newState = JSON.parse(JSON.stringify(prev));
      const { type, id } = modal;

      if (type === 'l1Type') {
        const currentTypes = [...newState.l1.types];
        const existingNames = new Set(currentTypes.filter(t => t.name && !t.name.includes('클릭하여')).map(t => t.name));
        
        // 빈 타입 찾기
        const emptyTypeIdx = currentTypes.findIndex(t => !t.name || t.name === '' || t.name.includes('클릭하여'));
        let startIdx = 0;
        
        // 빈 타입이 있으면 첫 번째 선택값 할당
        if (emptyTypeIdx !== -1 && selectedValues.length > 0 && !existingNames.has(selectedValues[0])) {
          currentTypes[emptyTypeIdx] = { ...currentTypes[emptyTypeIdx], name: selectedValues[0] };
          existingNames.add(selectedValues[0]);
          startIdx = 1;
        }
        
        // ✅ 나머지 선택값들 각각 새 행으로 추가 (중복 제외)
        for (let i = startIdx; i < selectedValues.length; i++) {
          const val = selectedValues[i];
          if (!existingNames.has(val)) {
            currentTypes.push({ id: uid(), name: val, functions: [] });
            existingNames.add(val);
          }
        }
        
        newState.l1.types = currentTypes;
      } 
      else if (type === 'l1Function') {
        const funcId = (modal as any).funcId;
        newState.l1.types = newState.l1.types.map(t => {
          if (t.id !== id) return t;
          const currentFuncs = t.functions;
          
          // ✅ funcId가 있으면 해당 기능만 수정
          if (funcId) {
            if (selectedValues.length === 0) {
              // 선택 해제 시 해당 기능 삭제
              return {
                ...t,
                functions: currentFuncs.filter(f => f.id !== funcId)
              };
            }
            return {
              ...t,
              functions: currentFuncs.map(f => 
                f.id === funcId 
                  ? { ...f, name: selectedValues[0] || f.name }
                  : f
              )
            };
          }
          
          // ✅ 다중 선택: 각각 별도 행으로 추가
          const updatedFuncs = [...currentFuncs];
          const existingNames = new Set(currentFuncs.filter(f => f.name && !f.name.includes('클릭하여')).map(f => f.name));
          
          // 빈 기능 찾기
          const emptyFuncIdx = updatedFuncs.findIndex(f => !f.name || f.name === '' || f.name.includes('클릭하여'));
          let startIdx = 0;
          
          // 빈 기능이 있으면 첫 번째 선택값 할당
          if (emptyFuncIdx !== -1 && selectedValues.length > 0 && !existingNames.has(selectedValues[0])) {
            updatedFuncs[emptyFuncIdx] = { ...updatedFuncs[emptyFuncIdx], name: selectedValues[0] };
            existingNames.add(selectedValues[0]);
            startIdx = 1;
          }
          
          // 나머지 선택값들 각각 새 행으로 추가 (중복 제외)
          for (let i = startIdx; i < selectedValues.length; i++) {
            const val = selectedValues[i];
            if (!existingNames.has(val)) {
              updatedFuncs.push({ id: uid(), name: val, requirements: [] });
              existingNames.add(val);
            }
          }
          
          return { ...t, functions: updatedFuncs };
        });
      }
      else if (type === 'l1Requirement') {
        const reqId = (modal as any).reqId;
        newState.l1.types = newState.l1.types.map(t => ({
          ...t,
          functions: t.functions.map(f => {
            if (f.id !== id) return f;
            const currentReqs = f.requirements || [];
            
            // ✅ reqId가 있으면 해당 요구사항만 수정
            if (reqId) {
              if (selectedValues.length === 0) {
                return { ...f, requirements: currentReqs.filter(r => r.id !== reqId) };
              }
              return {
                ...f,
                requirements: currentReqs.map(r => 
                  r.id === reqId ? { ...r, name: selectedValues[0] || r.name } : r
                )
              };
            }
            
            // ✅ 다중 선택: 각각 별도 행으로 추가
            const updatedReqs = [...currentReqs];
            const existingNames = new Set(currentReqs.filter(r => r.name && !r.name.includes('클릭하여')).map(r => r.name));
            
            // 빈 요구사항 찾기
            const emptyReqIdx = updatedReqs.findIndex(r => !r.name || r.name === '' || r.name.includes('클릭하여'));
            let startIdx = 0;
            
            // 빈 요구사항이 있으면 첫 번째 선택값 할당
            if (emptyReqIdx !== -1 && selectedValues.length > 0 && !existingNames.has(selectedValues[0])) {
              updatedReqs[emptyReqIdx] = { ...updatedReqs[emptyReqIdx], name: selectedValues[0] };
              existingNames.add(selectedValues[0]);
              startIdx = 1;
            }
            
            // 나머지 선택값들 각각 새 행으로 추가 (중복 제외)
            for (let i = startIdx; i < selectedValues.length; i++) {
              const val = selectedValues[i];
              if (!existingNames.has(val)) {
                updatedReqs.push({ id: uid(), name: val });
                existingNames.add(val);
              }
            }
            
            return { ...f, requirements: updatedReqs };
          })
        }));
      }
      
      return newState;
    });
    
    setDirty(true);
    setModal(null);
    saveToLocalStorage?.(); // 영구 저장
  }, [modal, state, setState, setDirty, saveToLocalStorage]);

  // 워크시트 데이터 삭제 핸들러
  const handleDelete = useCallback((deletedValues: string[]) => {
    console.log('[FunctionL1Tab] handleDelete 호출됨');
    console.log('[FunctionL1Tab] deletedValues:', deletedValues);
    console.log('[FunctionL1Tab] modal:', modal);
    
    if (!modal) {
      console.error('[FunctionL1Tab] modal이 없음!');
      return;
    }
    
    const { type, id } = modal;
    const deletedSet = new Set(deletedValues);
    console.log('[FunctionL1Tab] type:', type, 'id:', id);
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev)); // Deep clone
      
      if (type === 'l1Type') {
        // 구분 삭제 - 해당 타입과 하위 모든 데이터 삭제
        console.log('[FunctionL1Tab] l1Type 삭제, 이전 types:', newState.l1.types.map((t: any) => t.name));
        newState.l1.types = newState.l1.types.filter((t: any) => !deletedSet.has(t.name));
        console.log('[FunctionL1Tab] l1Type 삭제 후 types:', newState.l1.types.map((t: any) => t.name));
      } 
      else if (type === 'l1Function') {
        // 완제품 기능 삭제 - 모든 타입에서 삭제 (id가 비어있을 수 있음)
        console.log('[FunctionL1Tab] l1Function 삭제');
        newState.l1.types = newState.l1.types.map((t: any) => {
          if (id && t.id !== id) return t;
          const beforeCount = t.functions.length;
          const newFunctions = t.functions.filter((f: any) => !deletedSet.has(f.name));
          console.log(`[FunctionL1Tab] type ${t.name}: ${beforeCount} -> ${newFunctions.length} functions`);
          return { ...t, functions: newFunctions };
        });
      }
      else if (type === 'l1Requirement') {
        // 요구사항 삭제
        console.log('[FunctionL1Tab] l1Requirement 삭제');
        newState.l1.types = newState.l1.types.map((t: any) => ({
          ...t,
          functions: t.functions.map((f: any) => {
            if (id && f.id !== id) return f;
            const beforeCount = (f.requirements || []).length;
            const newReqs = (f.requirements || []).filter((r: any) => !deletedSet.has(r.name));
            console.log(`[FunctionL1Tab] function ${f.name}: ${beforeCount} -> ${newReqs.length} requirements`);
            return { ...f, requirements: newReqs };
          })
        }));
      }
      
      console.log('[FunctionL1Tab] 새 상태 반환');
      return newState;
    });
    
    setDirty(true);
    
    // ✅ 즉시 저장 (requestAnimationFrame 사용)
    console.log('[FunctionL1Tab] 저장 실행');
    requestAnimationFrame(() => saveToLocalStorage?.());
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // 총 행 수 계산
  const getTotalRows = () => {
    if (state.l1.types.length === 0) return 1;
    return state.l1.types.reduce((acc, t) => {
      if (t.functions.length === 0) return acc + 1;
      return acc + t.functions.reduce((a, f) => a + Math.max(1, f.requirements.length), 0);
    }, 0);
  };

  const totalRows = getTotalRows();

  return (
    <div className="p-0 overflow-auto h-full">
      <table className="w-full border-collapse table-fixed">
        {/* 컬럼 너비: 완제품공정명 120px, 구분 95px(구분선택 한줄표시), 완제품기능 auto(넓게+줄바꿈), 요구사항 140px */}
        <colgroup>
          <col className="w-[120px]" /><col className="w-[95px]" /><col /><col className="w-[140px]" />
        </colgroup>
        
        {/* 3행 헤더 구조 - 하단 2px 검은색 구분선 */}
        <thead className="border-b-2 border-black">
          {/* 1행: 단계 구분 */}
          <tr>
            <th className="bg-[#1976d2] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center">
              2단계 구조분석
            </th>
            <th colSpan={3} className="bg-[#388e3c] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center relative">
              <div className="flex items-center justify-center">
                <span className="flex-1 text-center">3단계 : 1L 완제품 공정 기능분석</span>
                <div className="flex gap-1 absolute right-2">
                  {isConfirmed ? (
                    <span className={badgeConfirmed}>✓ 확정됨({requirementCount})</span>
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
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th className="bg-[#1976d2] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              1. 완제품 공정명
            </th>
            <th colSpan={3} className="bg-[#388e3c] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              1. 완제품 공정기능/요구사항
              {missingCount > 0 && (
                <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">
                  누락 {missingCount}건
                </span>
              )}
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 - 1L COUNT 표시 (한 줄) */}
          <tr className="bg-[#e8f5e9]">
            <th className="bg-[#e3f2fd] border border-[#ccc] p-1.5 text-xs font-semibold">
              완제품 공정명<span className="text-green-700 font-bold">(1)</span>
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] p-1.5 text-xs font-semibold">
              구분
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] p-1.5 text-xs font-semibold">
              완제품기능<span className={`font-bold ${functionCount > 0 ? 'text-green-700' : 'text-red-500'}`}>({functionCount})</span>
            </th>
            <th className="bg-[#fff3e0] border border-[#ccc] p-1.5 text-xs font-semibold text-[#e65100]">
              요구사항<span className={`font-bold ${requirementCount > 0 ? 'text-green-700' : 'text-red-500'}`}>({requirementCount})</span>
            </th>
          </tr>
        </thead>
        
        <tbody>
          {state.l1.types.length === 0 ? (
            <tr className="bg-[#e8f5e9]">
              <td className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold">
                {state.l1.name || '(구조분석에서 입력)'}
              </td>
              <td className="border border-[#ccc] p-0">
                <SelectableCell value="" placeholder="구분 선택" bgColor={COLORS.function.light} onClick={() => handleCellClick({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
              </td>
              <td className="border border-[#ccc] p-0">
                <SelectableCell value="" placeholder="기능 선택" bgColor={COLORS.function.light} onClick={() => handleCellClick({ type: 'l1Function', id: '', title: '완제품 기능 선택', itemCode: 'C2' })} />
              </td>
              <td className="border border-[#ccc] p-0">
                <SelectableCell value="" placeholder="요구사항 선택" bgColor={COLORS.function.light} onClick={() => handleCellClick({ type: 'l1Requirement', id: '', title: '요구사항 선택', itemCode: 'C3', parentFunction: '' })} />
              </td>
            </tr>
          ) : (() => {
            let globalRowIdx = 0;
            return state.l1.types.map((t, tIdx) => {
              // 각 구분(type)별 행 수 계산
              const typeRowSpan = t.functions.length === 0 ? 1 : t.functions.reduce((a, f) => a + Math.max(1, f.requirements.length), 0);
              
              return t.functions.length === 0 ? (
                <tr key={t.id} className={globalRowIdx++ % 2 === 1 ? "bg-[#c8e6c9]" : "bg-[#e8f5e9]"}>
                  {/* 완제품 공정명 - 각 구분과 1:1 매칭 */}
                  <td rowSpan={typeRowSpan} className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold align-middle">
                    {state.l1.name || '(구조분석에서 입력)'}
                  </td>
                  <td rowSpan={typeRowSpan} className={`border border-[#ccc] p-1 align-middle text-center font-bold text-xs cursor-pointer hover:bg-opacity-80`} style={{ background: getTypeColor(t.name).light, color: getTypeColor(t.name).text }} onClick={() => handleCellClick({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })}>
                    {getTypeColor(t.name).short || t.name}
                  </td>
                  <td className="border border-[#ccc] p-0">
                    <SelectableCell value="" placeholder="기능 선택" bgColor={COLORS.function.light} onClick={() => handleCellClick({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} />
                  </td>
                  <td className="border border-[#ccc] p-0">
                    <SelectableCell value="" placeholder="요구사항 선택" bgColor={COLORS.function.light} onClick={() => handleCellClick({ type: 'l1Requirement', id: '', title: '요구사항 선택', itemCode: 'C3', parentFunction: '' })} />
                  </td>
                </tr>
              ) : t.functions.map((f, fIdx) => {
                const funcRowSpan = Math.max(1, f.requirements.length);
                
                return f.requirements.length === 0 ? (
                  <tr key={f.id} className={globalRowIdx++ % 2 === 1 ? "bg-[#c8e6c9]" : "bg-[#e8f5e9]"}>
                    {/* 완제품 공정명 - 각 구분의 첫 행에서만 표시 (1:1 매칭) */}
                    {fIdx === 0 && (
                      <td rowSpan={typeRowSpan} className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold align-middle">
                        {state.l1.name || '(구조분석에서 입력)'}
                      </td>
                    )}
                    {fIdx === 0 && (
                      <td rowSpan={typeRowSpan} className={`border border-[#ccc] p-0 align-middle`} style={{ background: getTypeColor(t.name).light }}>
                        <SelectableCell value={getTypeColor(t.name).short} placeholder="구분" bgColor={getTypeColor(t.name).light} textColor={getTypeColor(t.name).text} textAlign="center" onClick={() => handleCellClick({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                      </td>
                    )}
                    <td rowSpan={funcRowSpan} className="border border-[#ccc] p-0 align-middle">
                      <SelectableCell value={f.name} placeholder="기능" bgColor={COLORS.function.light} textColor="#000000" onClick={() => handleCellClick({ type: 'l1Function', id: t.id, funcId: f.id, title: '완제품 기능 선택', itemCode: 'C2' })} onDoubleClickEdit={(newValue) => handleInlineEditFunction(t.id, f.id, newValue)} />
                    </td>
                    <td className="border border-[#ccc] p-0">
                      <SelectableCell value="" placeholder="요구사항 선택" bgColor={COLORS.function.zebra} textColor={COLORS.function.text} onClick={() => handleCellClick({ type: 'l1Requirement', id: f.id, title: '요구사항 선택', itemCode: 'C3', parentFunction: f.name, parentCategory: t.name })} />
                    </td>
                  </tr>
                ) : f.requirements.map((r, rIdx) => (
                  <tr key={r.id} className={globalRowIdx++ % 2 === 1 ? "bg-[#c8e6c9]" : "bg-[#e8f5e9]"}>
                    {/* 완제품 공정명 - 각 구분의 첫 행에서만 표시 (1:1 매칭) */}
                    {fIdx === 0 && rIdx === 0 && (
                      <td rowSpan={typeRowSpan} className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold align-middle">
                        {state.l1.name || '(구조분석에서 입력)'}
                      </td>
                    )}
                    {fIdx === 0 && rIdx === 0 && (
                      <td rowSpan={typeRowSpan} className={`border border-[#ccc] p-0 align-middle`} style={{ background: getTypeColor(t.name).light }}>
                        <SelectableCell value={getTypeColor(t.name).short} placeholder="구분" bgColor={getTypeColor(t.name).light} textColor={getTypeColor(t.name).text} textAlign="center" onClick={() => handleCellClick({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                      </td>
                    )}
                    {rIdx === 0 && (
                      <td rowSpan={funcRowSpan} className="border border-[#ccc] p-0 align-middle">
                        <SelectableCell value={f.name} placeholder="기능" bgColor={COLORS.function.light} textColor="#000000" onClick={() => handleCellClick({ type: 'l1Function', id: t.id, funcId: f.id, title: '완제품 기능 선택', itemCode: 'C2' })} onDoubleClickEdit={(newValue) => handleInlineEditFunction(t.id, f.id, newValue)} />
                      </td>
                    )}
                    <td className="border border-[#ccc] p-0">
                      <SelectableCell 
                        value={r.name} 
                        placeholder="요구사항" 
                        bgColor={COLORS.function.zebra} 
                        textColor={COLORS.function.text} 
                        onClick={() => handleCellClick({ type: 'l1Requirement', id: f.id, reqId: r.id, title: '요구사항 선택', itemCode: 'C3', parentFunction: f.name, parentCategory: t.name })} 
                        onDoubleClickEdit={(newValue) => handleInlineEditRequirement(t.id, f.id, r.id, newValue)}
                      />
                    </td>
                  </tr>
                ));
              });
            });
          })()}
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
          processName={state.l1.name || '완제품 공정'}
          parentFunction={modal.parentFunction}
          parentCategory={modal.parentCategory}
          currentValues={(() => {
            if (modal.type === 'l1Type') return state.l1.types.map(t => t.name);
            if (modal.type === 'l1Function') return state.l1.types.find(t => t.id === modal.id)?.functions.map(f => f.name) || [];
            if (modal.type === 'l1Requirement') {
              for (const t of state.l1.types) {
                const f = t.functions.find(f => f.id === modal.id);
                if (f) return f.requirements.map(r => r.name);
              }
            }
            return [];
          })()}
        />
      )}
    </div>
  );
}
