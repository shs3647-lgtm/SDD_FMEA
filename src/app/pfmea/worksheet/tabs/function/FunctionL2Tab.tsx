/**
 * @file FunctionL2Tab.tsx
 * @description 메인공정(L2) 기능 분석 - 3행 헤더 구조 (L1과 동일한 패턴)
 */

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FunctionTabProps } from './types';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';
import { S, F, X, cell, cellP0, btnConfirm, btnEdit, btnDisabled, badgeOk, badgeConfirmed, badgeMissing, badgeCount } from '@/styles/worksheet';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import SpecialCharSelectModal, { SPECIAL_CHAR_DATA } from '@/components/modals/SpecialCharSelectModal';

// 스타일 함수
const BORDER = '1px solid #b0bec5';
const cellBase: React.CSSProperties = { border: BORDER, padding: '4px 6px', fontSize: FONT_SIZES.cell, verticalAlign: 'middle' };
const headerStyle = (bg: string, color = '#fff'): React.CSSProperties => ({ ...cellBase, background: bg, color, fontWeight: FONT_WEIGHTS.bold, textAlign: 'center' });
const dataCell = (bg: string): React.CSSProperties => ({ ...cellBase, background: bg });

// 특별특성 배지 - 공통 컴포넌트 사용
import SpecialCharBadge from '@/components/common/SpecialCharBadge';

export default function FunctionL2Tab({ state, setState, setDirty, saveToLocalStorage }: FunctionTabProps) {
  const [modal, setModal] = useState<{ type: string; procId: string; funcId?: string; charId?: string; title: string; itemCode: string } | null>(null);
  
  // 특별특성 모달 상태
  const [specialCharModal, setSpecialCharModal] = useState<{ 
    procId: string; 
    funcId: string; 
    charId: string; 
    charName: string;
    currentValue: string;
  } | null>(null);

  // 확정 상태 (state.l2Confirmed 사용)
  const isConfirmed = state.l2Confirmed || false;

  // ✅ 셀 클릭 시 확정됨 상태면 자동으로 수정 모드로 전환
  const handleCellClick = useCallback((modalConfig: any) => {
    if (isConfirmed) {
      setState(prev => ({ ...prev, l2Confirmed: false }));
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

  // 항목별 누락 건수 분리 계산 (특별특성은 누락건 제외)
  const missingCounts = React.useMemo(() => {
    let functionCount = 0;   // 메인공정기능 누락
    let charCount = 0;       // 제품특성 누락
    
    state.l2.forEach(proc => {
      // 공정기능 체크
      const funcs = proc.functions || [];
      if (funcs.length === 0) functionCount++;
      funcs.forEach(f => {
        if (isMissing(f.name)) functionCount++;
        // 제품특성 체크
        const chars = f.productChars || [];
        if (chars.length === 0) charCount++;
        chars.forEach(c => {
          if (isMissing(c.name)) charCount++;
        });
      });
    });
    return { functionCount, charCount, total: functionCount + charCount };
  }, [state.l2]);
  
  // 총 누락 건수 (기존 호환성)
  const missingCount = missingCounts.total;

  // ✅ 2L COUNT 계산 (메인공정, 메인공정기능, 제품특성)
  const processCount = useMemo(() => state.l2.filter(p => p.name && !p.name.includes('클릭')).length, [state.l2]);
  const l2FunctionCount = useMemo(() => state.l2.reduce((sum, proc) => sum + (proc.functions || []).filter((f: any) => f.name && !f.name.includes('클릭')).length, 0), [state.l2]);
  const productCharCount = useMemo(() => state.l2.reduce((sum, proc) => sum + (proc.functions || []).reduce((funcSum, func) => funcSum + (func.productChars || []).filter((c: any) => c.name).length, 0), 0), [state.l2]);

  // ✅ L2 기능 데이터 변경 감지용 ref (고장분석 패턴 적용)
  const l2FuncDataRef = useRef<string>('');
  
  // ✅ L2 기능 데이터 변경 시 자동 저장 (확실한 저장 보장)
  useEffect(() => {
    const allFuncs = state.l2.flatMap((p: any) => p.functions || []);
    const dataKey = JSON.stringify(allFuncs);
    if (l2FuncDataRef.current && dataKey !== l2FuncDataRef.current) {
      console.log('[FunctionL2Tab] l2.functions 변경 감지, 자동 저장');
      saveToLocalStorage?.();
    }
    l2FuncDataRef.current = dataKey;
  }, [state.l2, saveToLocalStorage]);


  // 확정 핸들러 (고장분석 패턴 적용)
  const handleConfirm = useCallback(() => {
    console.log('[FunctionL2Tab] 확정 버튼 클릭, missingCount:', missingCount);
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n먼저 입력을 완료해주세요.`);
      return;
    }
    
    // ✅ 현재 기능 통계 로그
    const funcCount = state.l2.flatMap((p: any) => p.functions || []).length;
    const charCount = state.l2.flatMap((p: any) => (p.functions || []).flatMap((f: any) => f.productChars || [])).length;
    console.log('[FunctionL2Tab] 확정 시 기능:', funcCount, '개, 제품특성:', charCount, '개');
    
    setState(prev => {
      const newState = { ...prev, l2Confirmed: true };
      console.log('[FunctionL2Tab] 확정 상태 업데이트:', newState.l2Confirmed);
      return newState;
    });
    setDirty(true);
    
    // ✅ 즉시 저장 (requestAnimationFrame 사용)
    requestAnimationFrame(() => {
      saveToLocalStorage?.();
      console.log('[FunctionL2Tab] 확정 후 localStorage 저장 완료');
    });
    
    alert('✅ 2L 메인공정 기능분석이 확정되었습니다.');
  }, [missingCount, state.l2, setState, setDirty, saveToLocalStorage]);

  // 수정 핸들러 (고장분석 패턴 적용)
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, l2Confirmed: false }));
    setDirty(true);
    requestAnimationFrame(() => saveToLocalStorage?.());
  }, [setState, setDirty, saveToLocalStorage]);

  // 메인공정 기능 인라인 편집 핸들러 (더블클릭)
  const handleInlineEditFunction = useCallback((procId: string, funcId: string, newValue: string) => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(proc => {
        if (proc.id !== procId) return proc;
        return {
          ...proc,
          functions: (proc.functions || []).map(f => {
            if (f.id !== funcId) return f;
            return { ...f, name: newValue };
          })
        };
      })
    }));
    setDirty(true);
    saveToLocalStorage?.();
  }, [setState, setDirty, saveToLocalStorage]);

  // 제품특성 인라인 편집 핸들러 (더블클릭)
  const handleInlineEditProductChar = useCallback((procId: string, funcId: string, charId: string, newValue: string) => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(proc => {
        if (proc.id !== procId) return proc;
        return {
          ...proc,
          functions: (proc.functions || []).map(f => {
            if (f.id !== funcId) return f;
            return {
              ...f,
              productChars: (f.productChars || []).map(c => {
                if (c.id !== charId) return c;
                return { ...c, name: newValue };
              })
            };
          })
        };
      })
    }));
    setDirty(true);
    saveToLocalStorage?.();
  }, [setState, setDirty, saveToLocalStorage]);

  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    const { type, procId, funcId } = modal;
    const isConfirmed = state.l2Confirmed || false;
    
    // 하위 데이터가 있는 기능 삭제 시 경고
    if (type === 'l2Function') {
      const proc = state.l2.find((p: any) => p.id === procId);
      if (proc) {
        const currentFuncs = proc.functions || [];
        const selectedSet = new Set(selectedValues);
        const funcsToRemove = currentFuncs.filter((f: any) => !selectedSet.has(f.name));
        const funcsWithChildren = funcsToRemove.filter((f: any) => (f.productChars || []).length > 0);
        
        if (funcsWithChildren.length > 0) {
          const childCounts = funcsWithChildren.map((f: any) => 
            `• ${f.name}: 제품특성 ${(f.productChars || []).length}개`
          ).join('\n');
          
          const confirmed = confirm(
            `⚠️ 해제한 기능에 하위 데이터가 있습니다.\n\n` +
            `${childCounts}\n\n` +
            `적용하면 하위 데이터(제품특성)도 함께 삭제됩니다.\n` +
            `정말 적용하시겠습니까?`
          );
          
          if (!confirmed) {
            return; // 적용 취소
          }
        }
      }
    }
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));

      if (type === 'l2Function') {
        // 메인공정 기능 저장
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          const currentFuncs = proc.functions || [];
          
          // 기존 funcId가 있으면 해당 기능만 수정
          if (funcId) {
            if (selectedValues.length === 0) {
              // 선택 해제 시 해당 기능 삭제
              return {
                ...proc,
                functions: currentFuncs.filter((f: any) => f.id !== funcId)
              };
            }
            return {
              ...proc,
              functions: currentFuncs.map((f: any) => 
                f.id === funcId 
                  ? { ...f, name: selectedValues[0] || f.name }
                  : f
              )
            };
          }
          
          // 빈 기능 셀 클릭 시: 첫 번째 선택값만 첫 번째 빈 기능에 적용
          const emptyFunc = currentFuncs.find((f: any) => !f.name || f.name === '');
          
          if (emptyFunc && selectedValues.length > 0) {
            // 빈 기능이 있으면 첫 번째 선택값만 할당
            return {
              ...proc,
              functions: currentFuncs.map((f: any) => 
                f.id === emptyFunc.id 
                  ? { ...f, name: selectedValues[0] }
                  : f
              )
            };
          }
          
          // ✅ 중복 체크: 같은 이름의 기능이 이미 있으면 추가하지 않음
          if (selectedValues.length > 0) {
            const existingNames = new Set(currentFuncs.map((f: any) => f.name));
            const newValue = selectedValues[0];
            if (existingNames.has(newValue)) {
              alert(`⚠️ 중복 항목: "${newValue}"는 이미 등록되어 있습니다.`);
              return proc;
            }
            const newFunc = { id: uid(), name: newValue, productChars: [] };
            return {
              ...proc,
              functions: [...currentFuncs, newFunc]
            };
          }
          
          return proc;
        });
      } else if (type === 'l2ProductChar') {
        // 제품특성 저장 (특정 기능에 연결)
        const charId = (modal as any).charId;
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            functions: proc.functions.map((f: any) => {
              if (f.id !== funcId) return f;
              const currentChars = f.productChars || [];
              
              // ✅ charId가 있으면 해당 항목만 수정 (다중선택 개별 수정)
              if (charId) {
                if (selectedValues.length === 0) {
                  return { ...f, productChars: currentChars.filter((c: any) => c.id !== charId) };
                }
                return {
                  ...f,
                  productChars: currentChars.map((c: any) => 
                    c.id === charId ? { ...c, name: selectedValues[0] || c.name } : c
                  )
                };
              }
              
              // ✅ charId가 없으면 빈 셀 클릭 → 새 항목 추가
              const emptyChar = currentChars.find((c: any) => !c.name || c.name === '');
              if (emptyChar && selectedValues.length > 0) {
                return {
                  ...f,
                  productChars: currentChars.map((c: any) => 
                    c.id === emptyChar.id ? { ...c, name: selectedValues[0] } : c
                  )
                };
              }
              
              // ✅ 중복 체크: 같은 이름의 제품특성이 이미 있으면 추가하지 않음
              if (selectedValues.length > 0) {
                const existingNames = new Set(currentChars.map((c: any) => c.name));
                const newValue = selectedValues[0];
                if (existingNames.has(newValue)) {
                  alert(`⚠️ 중복 항목: "${newValue}"는 이미 등록되어 있습니다.`);
                  return f;
                }
                const newChar = { id: uid(), name: newValue, specialChar: '' };
                return { ...f, productChars: [...currentChars, newChar] };
              }
              
              return f;
            })
          };
        });
      }
      
      return newState;
    });
    
    setDirty(true);
    setModal(null);
    saveToLocalStorage?.(); // 영구 저장
  }, [modal, setState, setDirty, saveToLocalStorage]);

  const handleDelete = useCallback((deletedValues: string[]) => {
    if (!modal) return;
    const deletedSet = new Set(deletedValues);
    const { type, procId, funcId } = modal;
    
    // 하위 데이터 확인 (l2Function 삭제 시)
    if (type === 'l2Function') {
      const proc = state.l2.find((p: any) => p.id === procId);
      if (proc) {
        const funcsToDelete = (proc.functions || []).filter((f: any) => deletedSet.has(f.name));
        const funcsWithChildren = funcsToDelete.filter((f: any) => (f.productChars || []).length > 0);
        
        if (funcsWithChildren.length > 0) {
          const childCounts = funcsWithChildren.map((f: any) => 
            `• ${f.name}: 제품특성 ${(f.productChars || []).length}개`
          ).join('\n');
          
          const confirmed = confirm(
            `⚠️ 선택한 기능에 하위 데이터가 있습니다.\n\n` +
            `${childCounts}\n\n` +
            `삭제하면 하위 데이터(제품특성)도 함께 삭제됩니다.\n` +
            `정말 삭제하시겠습니까?`
          );
          
          if (!confirmed) {
            return; // 삭제 취소
          }
        }
      }
    }
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));

      if (type === 'l2Function') {
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            functions: proc.functions.filter((f: any) => !deletedSet.has(f.name))
          };
        });
      } else if (type === 'l2ProductChar') {
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            functions: proc.functions.map((f: any) => {
              if (f.id !== funcId) return f;
              return {
                ...f,
                productChars: (f.productChars || []).filter((c: any) => !deletedSet.has(c.name))
              };
            })
          };
        });
      }
      
      return newState;
    });
    
    setDirty(true);
    requestAnimationFrame(() => saveToLocalStorage?.());
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // 특별특성 선택 핸들러
  // ✅ 특별특성 업데이트 - CRUD Update → 확정 해제 필요
  const handleSpecialCharSelect = useCallback((symbol: string) => {
    if (!specialCharModal) return;
    
    const { procId, funcId, charId } = specialCharModal;
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState.l2 = newState.l2.map((proc: any) => {
        if (proc.id !== procId) return proc;
        return {
          ...proc,
          functions: proc.functions.map((f: any) => {
            if (f.id !== funcId) return f;
            return {
              ...f,
              productChars: (f.productChars || []).map((c: any) => {
                if (c.id !== charId) return c;
                return { ...c, specialChar: symbol };
              })
            };
          })
        };
      });
      // ✅ CRUD Update: 확정 상태 해제
      newState.l2Confirmed = false;
      return newState;
    });
    
    setDirty(true);
    setSpecialCharModal(null);
    requestAnimationFrame(() => saveToLocalStorage?.());
  }, [specialCharModal, setState, setDirty, saveToLocalStorage]);

  // 총 행 수 계산
  const getTotalRows = () => {
    if (state.l2.length === 0) return 1;
    return state.l2.reduce((acc, proc) => {
      const funcs = proc.functions || [];
      if (funcs.length === 0) return acc + 1;
      return acc + funcs.reduce((a, f) => a + Math.max(1, (f.productChars || []).length), 0);
    }, 0);
  };

  const totalRows = getTotalRows();

  return (
    <div className="p-0 overflow-auto h-full">
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col className="w-[140px]" />
          <col className="w-[280px]" />
          <col className="w-[220px]" />
          <col className="w-[60px]" />
        </colgroup>
        
        {/* 3행 헤더 구조 - 하단 2px 검은색 구분선 */}
        <thead className="border-b-2 border-black">
          {/* 1행: 단계 구분 */}
          <tr>
            <th className="bg-[#1976d2] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center">
              2단계 구조분석
            </th>
            <th colSpan={3} className="bg-[#388e3c] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center">
              <div className="flex items-center justify-center gap-5">
                <span>3단계 : 2L 메인공정 기능분석</span>
                <div className="flex gap-1.5">
                  {isConfirmed ? (
                    <span className={badgeConfirmed}>✓ 확정됨({productCharCount})</span>
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
              2. 메인공정명
            </th>
            <th colSpan={3} className="bg-[#388e3c] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              2. 메인공정 기능/제품특성
              {missingCount > 0 && (
                <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">
                  누락 {missingCount}건
                </span>
              )}
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 - 2L COUNT 표시 (한 줄) */}
          <tr className="bg-[#e8f5e9]">
            <th className="bg-[#e3f2fd] border border-[#ccc] p-1.5 text-xs font-semibold">
              공정NO+공정명<span className={`font-bold ${processCount > 0 ? 'text-green-700' : 'text-red-500'}`}>({processCount})</span>
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] p-1.5 text-xs font-semibold">
              메인공정기능<span className={`font-bold ${l2FunctionCount > 0 ? 'text-green-700' : 'text-red-500'}`}>({l2FunctionCount})</span>
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] border-r-[2px] border-r-orange-500 p-1.5 text-xs font-semibold">
              제품특성<span className={`font-bold ${productCharCount > 0 ? 'text-green-700' : 'text-red-500'}`}>({productCharCount})</span>
            </th>
            <th className="bg-orange-500 text-white border border-[#ccc] border-l-0 p-1.5 text-xs font-semibold text-center">
              특별특성
            </th>
          </tr>
        </thead>
        
        <tbody>
          {state.l2.length === 0 ? (
            <tr className="bg-[#e8f5e9]">
              <td className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold">
                (구조분석에서 공정 추가)
              </td>
              <td className={cellP0}>
                <SelectableCell value="" placeholder="공정기능 선택" bgColor={'#e8f5e9'} onClick={() => {}} />
              </td>
              <td className={cellP0}>
                <SelectableCell value="" placeholder="제품특성 선택" bgColor={'#e8f5e9'} onClick={() => {}} />
              </td>
              <td className="border border-[#ccc] p-1 text-center bg-[#fff3e0] text-[#999] text-xs">
                -
              </td>
            </tr>
          ) : (() => {
            let globalRowIdx = 0;
            return state.l2.map((proc, pIdx) => {
              const funcs = proc.functions || [];
              const procRowSpan = funcs.length === 0 ? 1 : funcs.reduce((a, f) => a + Math.max(1, (f.productChars || []).length), 0);
              
              // 공정에 기능이 없는 경우
              if (funcs.length === 0) {
                return (
                  <tr key={proc.id} className={globalRowIdx++ % 2 === 1 ? "bg-[#c8e6c9]" : "bg-[#e8f5e9]"}>
                    <td rowSpan={procRowSpan} className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold align-middle">
                      {proc.no}. {proc.name}
                    </td>
                    <td className={cellP0}>
                      <SelectableCell value="" placeholder="공정기능 선택" bgColor={'#e8f5e9'} onClick={() => handleCellClick({ type: 'l2Function', procId: proc.id, title: '메인공정 기능 선택', itemCode: 'A3' })} />
                    </td>
                    <td className={cellP0}>
                      <SelectableCell value="" placeholder="제품특성 선택" bgColor={'#e8f5e9'} onClick={() => {}} />
                    </td>
                    <td className="border border-[#ccc] p-1 text-center bg-[#fff3e0] text-[#999] text-xs">
                      -
                    </td>
                  </tr>
                );
              }
              
              // 공정에 기능이 있는 경우
              return funcs.map((f, fIdx) => {
                const chars = f.productChars || [];
                const funcRowSpan = Math.max(1, chars.length);
                
                // 기능에 제품특성이 없는 경우
                if (chars.length === 0) {
                  return (
                    <tr key={f.id} className={globalRowIdx++ % 2 === 1 ? "bg-[#c8e6c9]" : "bg-[#e8f5e9]"}>
                      {fIdx === 0 && (
                        <td rowSpan={procRowSpan} className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold align-middle">
                          {proc.no}. {proc.name}
                        </td>
                      )}
                      <td rowSpan={funcRowSpan} className="border border-[#ccc] p-0 align-middle">
                        <SelectableCell 
                          value={f.name} 
                          placeholder="공정기능" 
                          bgColor={'#e8f5e9'} 
                          onClick={() => handleCellClick({ type: 'l2Function', procId: proc.id, funcId: f.id, title: '메인공정 기능 선택', itemCode: 'A3' })} 
                          onDoubleClickEdit={(newValue) => handleInlineEditFunction(proc.id, f.id, newValue)}
                        />
                      </td>
                      <td className={cellP0}>
                        <SelectableCell value="" placeholder="제품특성 선택" bgColor={'#c8e6c9'} onClick={() => handleCellClick({ type: 'l2ProductChar', procId: proc.id, funcId: f.id, title: '제품특성 선택', itemCode: 'A4' })} />
                      </td>
                      <td className="border border-[#ccc] p-1 text-center bg-[#fff3e0] text-[#999] text-xs">
                        -
                      </td>
                    </tr>
                  );
                }
                
                // 기능에 제품특성이 있는 경우
                return chars.map((c, cIdx) => (
                  <tr key={c.id} className={globalRowIdx++ % 2 === 1 ? "bg-[#c8e6c9]" : "bg-[#e8f5e9]"}>
                    {fIdx === 0 && cIdx === 0 && (
                      <td rowSpan={procRowSpan} className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] font-semibold align-middle">
                        {proc.no}. {proc.name}
                      </td>
                    )}
                    {cIdx === 0 && (
                      <td rowSpan={funcRowSpan} className="border border-[#ccc] p-0 align-middle">
                        <SelectableCell 
                          value={f.name} 
                          placeholder="공정기능" 
                          bgColor={'#e8f5e9'} 
                          onClick={() => handleCellClick({ type: 'l2Function', procId: proc.id, funcId: f.id, title: '메인공정 기능 선택', itemCode: 'A3' })} 
                          onDoubleClickEdit={(newValue) => handleInlineEditFunction(proc.id, f.id, newValue)}
                        />
                      </td>
                    )}
                    <td className="border border-[#ccc] border-r-[2px] border-r-orange-500 p-0">
                      <SelectableCell 
                        value={c.name} 
                        placeholder="제품특성" 
                        bgColor={'#c8e6c9'} 
                        onClick={() => handleCellClick({ type: 'l2ProductChar', procId: proc.id, funcId: f.id, charId: c.id, title: '제품특성 선택', itemCode: 'A4' })} 
                        onDoubleClickEdit={(newValue) => handleInlineEditProductChar(proc.id, f.id, c.id, newValue)}
                      />
                    </td>
                    <td className="border border-[#ccc] p-0 text-center">
                      <SpecialCharBadge 
                        value={(c as any).specialChar || ''} 
                        onClick={() => setSpecialCharModal({ 
                          procId: proc.id, 
                          funcId: f.id, 
                          charId: c.id, 
                          charName: c.name,
                          currentValue: (c as any).specialChar || ''
                        })} 
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
          processName={state.l2.find(p => p.id === modal.procId)?.name}
          processNo={state.l2.find(p => p.id === modal.procId)?.no}
          processList={state.l2.map(p => ({ id: p.id, no: p.no, name: p.name }))}
          onProcessChange={(procId) => {
            const proc = state.l2.find(p => p.id === procId);
            if (proc) setModal(prev => prev ? { ...prev, procId } : null);
          }}
          currentValues={(() => {
            const proc = state.l2.find(p => p.id === modal.procId);
            if (!proc) return [];
            if (modal.type === 'l2Function') return (proc.functions || []).map(f => f.name);
            if (modal.type === 'l2ProductChar') {
              const func = (proc.functions || []).find(f => f.id === modal.funcId);
              return func ? (func.productChars || []).map(c => c.name) : [];
            }
            return [];
          })()}
        />
      )}

      {/* 특별특성 전용 모달 */}
      {specialCharModal && (
        <SpecialCharSelectModal
          isOpen={!!specialCharModal}
          onClose={() => setSpecialCharModal(null)}
          onSelect={handleSpecialCharSelect}
          currentValue={specialCharModal.currentValue}
          productCharName={specialCharModal.charName}
        />
      )}
    </div>
  );
}
