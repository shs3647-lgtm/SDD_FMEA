/**
 * @file FunctionL3Tab.tsx
 * @description 작업요소(L3) 기능 분석 - 3행 헤더 구조 (L1과 동일한 패턴)
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

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FunctionTabProps } from './types';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';
import { S, F, X, cell, cellP0, btnConfirm, btnEdit, btnDisabled, badgeOk, badgeConfirmed, badgeMissing, badgeCount } from '@/styles/worksheet';
import { handleEnterBlur } from '../../utils/keyboard';
import { getZebraColors } from '@/styles/level-colors';
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

export default function FunctionL3Tab({ state, setState, setDirty, saveToLocalStorage }: FunctionTabProps) {
  const [modal, setModal] = useState<{ 
    type: string; 
    procId: string; 
    l3Id: string; 
    funcId?: string;
    title: string; 
    itemCode: string;
    workElementName?: string;
  } | null>(null);

  // 특별특성 모달 상태
  const [specialCharModal, setSpecialCharModal] = useState<{ 
    procId: string; 
    l3Id: string;
    funcId: string; 
    charId: string; 
  } | null>(null);

  // 확정 상태 (state.l3Confirmed 사용)
  const isConfirmed = state.l3Confirmed || false;

  // ✅ 셀 클릭 시 확정됨 상태면 자동으로 수정 모드로 전환
  const handleCellClick = useCallback((modalConfig: any) => {
    if (isConfirmed) {
      setState(prev => ({ ...prev, l3Confirmed: false }));
      setDirty(true);
    }
    setModal(modalConfig);
  }, [isConfirmed, setState, setDirty]);

  // 누락 건수 계산 (플레이스홀더 패턴 모두 체크)
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

  // ✅ 항목별 누락 건수 분리 계산 (필터링된 데이터만 카운트)
  const missingCounts = React.useMemo(() => {
    let functionCount = 0;  // 작업요소기능 누락
    let charCount = 0;      // 공정특성 누락
    
    // ✅ 의미 있는 공정만 필터링
    const meaningfulProcs = state.l2.filter((p: any) => {
      const name = p.name || '';
      return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택');
    });
    
    meaningfulProcs.forEach(proc => {
      // ✅ 의미 있는 작업요소만 필터링
      const meaningfulL3 = (proc.l3 || []).filter((we: any) => {
        const name = we.name || '';
        return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('추가') && !name.includes('선택');
      });
      
      meaningfulL3.forEach(we => {
        // ✅ 의미 있는 기능만 필터링
        const meaningfulFuncs = (we.functions || []).filter((f: any) => {
          const name = f.name || '';
          return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택');
        });
        
        // 작업요소 기능 체크
        if (meaningfulFuncs.length === 0) functionCount++;
        meaningfulFuncs.forEach(f => {
          if (isMissing(f.name)) functionCount++;
          
          // ✅ 의미 있는 기능이 있는 경우에만 공정특성 누락 체크
          if (!isMissing(f.name)) {
            // ✅ 의미 있는 공정특성만 필터링
            const meaningfulChars = (f.processChars || []).filter((c: any) => {
              const name = c.name || '';
              return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택') && 
                     !name.includes('추가') && !name.includes('입력') && !name.includes('필요');
            });
            
            // 공정특성 체크: 의미 있는 기능이 있는데 공정특성이 없으면 누락
            if (meaningfulChars.length === 0) charCount++;
          }
        });
      });
    });
    return { functionCount, charCount, total: functionCount + charCount };
  }, [state.l2]);
  
  // 총 누락 건수 (기존 호환성)
  const missingCount = missingCounts.total;

  // ✅ 3L COUNT 계산 (작업요소, 작업요소기능, 공정특성)
  const workElementCount = useMemo(() => state.l2.reduce((sum, proc) => sum + (proc.l3 || []).filter((we: any) => we.name && !we.name.includes('클릭')).length, 0), [state.l2]);
  const l3FunctionCount = useMemo(() => state.l2.reduce((sum, proc) => sum + (proc.l3 || []).reduce((weSum: number, we: any) => weSum + (we.functions || []).filter((f: any) => f.name && !f.name.includes('클릭')).length, 0), 0), [state.l2]);
  const processCharCount = useMemo(() => state.l2.reduce((sum, proc) => sum + (proc.l3 || []).reduce((weSum: number, we: any) => weSum + (we.functions || []).reduce((funcSum: number, func: any) => funcSum + (func.processChars || []).filter((c: any) => c.name).length, 0), 0), 0), [state.l2]);

  // ✅ L3 기능 데이터 변경 감지용 ref (고장분석 패턴 적용)
  const l3FuncDataRef = useRef<string>('');
  
  // ✅ L3 기능 데이터 변경 시 자동 저장 (확실한 저장 보장)
  useEffect(() => {
    const allFuncs = state.l2.flatMap((p: any) => (p.l3 || []).flatMap((we: any) => we.functions || []));
    const dataKey = JSON.stringify(allFuncs);
    if (l3FuncDataRef.current && dataKey !== l3FuncDataRef.current) {
      console.log('[FunctionL3Tab] l3.functions 변경 감지, 자동 저장');
      saveToLocalStorage?.();
    }
    l3FuncDataRef.current = dataKey;
  }, [state.l2, saveToLocalStorage]);


  // 확정 핸들러 (고장분석 패턴 적용)
  const handleConfirm = useCallback(() => {
    console.log('[FunctionL3Tab] 확정 버튼 클릭, missingCount:', missingCount);
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n먼저 입력을 완료해주세요.`);
      return;
    }
    
    // ✅ 현재 기능 통계 로그
    const funcCount = state.l2.flatMap((p: any) => (p.l3 || []).flatMap((we: any) => we.functions || [])).length;
    const charCount = state.l2.flatMap((p: any) => (p.l3 || []).flatMap((we: any) => (we.functions || []).flatMap((f: any) => f.processChars || []))).length;
    console.log('[FunctionL3Tab] 확정 시 기능:', funcCount, '개, 공정특성:', charCount, '개');
    
    setState(prev => {
      const newState = { ...prev, l3Confirmed: true };
      console.log('[FunctionL3Tab] 확정 상태 업데이트:', newState.l3Confirmed);
      return newState;
    });
    setDirty(true);
    
    // ✅ 저장 보장 (stateRef 업데이트 대기 후 저장)
    setTimeout(() => {
      saveToLocalStorage?.();
      console.log('[FunctionL3Tab] 확정 후 localStorage 저장 완료');
    }, 200);
    
    alert('✅ 3L 작업요소 기능분석이 확정되었습니다.');
  }, [missingCount, state.l2, setState, setDirty, saveToLocalStorage]);

  // 수정 핸들러 (고장분석 패턴 적용)
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, l3Confirmed: false }));
    setDirty(true);
    setTimeout(() => saveToLocalStorage?.(), 200);
  }, [setState, setDirty, saveToLocalStorage]);

  // 작업요소 기능 인라인 편집 핸들러 (더블클릭)
  const handleInlineEditFunction = useCallback((procId: string, l3Id: string, funcId: string, newValue: string) => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(proc => {
        if (proc.id !== procId) return proc;
        return {
          ...proc,
          l3: proc.l3.map(we => {
            if (we.id !== l3Id) return we;
            return {
              ...we,
              functions: (we.functions || []).map(f => {
                if (f.id !== funcId) return f;
                return { ...f, name: newValue };
              })
            };
          })
        };
      })
    }));
    setDirty(true);
    saveToLocalStorage?.();
  }, [setState, setDirty, saveToLocalStorage]);

  // 공정특성 인라인 편집 핸들러 (더블클릭)
  const handleInlineEditProcessChar = useCallback((procId: string, l3Id: string, funcId: string, charId: string, newValue: string) => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(proc => {
        if (proc.id !== procId) return proc;
        return {
          ...proc,
          l3: proc.l3.map(we => {
            if (we.id !== l3Id) return we;
            return {
              ...we,
              functions: (we.functions || []).map(f => {
                if (f.id !== funcId) return f;
                return {
                  ...f,
                  processChars: (f.processChars || []).map(c => {
                    if (c.id !== charId) return c;
                    return { ...c, name: newValue };
                  })
                };
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
    const { type, procId, l3Id, funcId } = modal;
    const isConfirmed = state.l3Confirmed || false;
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));

      if (type === 'l3Function') {
        // 작업요소 기능 저장
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            l3: proc.l3.map((we: any) => {
              if (we.id !== l3Id) return we;
              const currentFuncs = we.functions || [];
              
              // 기존 funcId가 있으면 해당 기능만 수정
              if (funcId) {
                if (selectedValues.length === 0) {
                  // 선택 해제 시 해당 기능 삭제
                  return {
                    ...we,
                    functions: currentFuncs.filter((f: any) => f.id !== funcId)
                  };
                }
                return {
                  ...we,
                  functions: currentFuncs.map((f: any) => 
                    f.id === funcId 
                      ? { ...f, name: selectedValues[0] || f.name }
                      : f
                  )
                };
              }
              
              // ✅ 다중 선택: 각각 별도 행으로 추가 (L1/L2 패턴)
              const updatedFuncs = [...currentFuncs];
              const existingNames = new Set(currentFuncs.filter((f: any) => f.name && !f.name.includes('클릭')).map((f: any) => f.name));
              
              // 빈 기능 찾기
              const emptyFuncIdx = updatedFuncs.findIndex((f: any) => !f.name || f.name === '' || f.name.includes('클릭'));
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
                  updatedFuncs.push({ id: uid(), name: val, processChars: [] });
                  existingNames.add(val);
                }
              }
              
              return { ...we, functions: updatedFuncs };
            })
          };
        });
      } else if (type === 'l3ProcessChar') {
        // 공정특성 저장 (특정 기능에 연결)
        // ✅ 원칙: 상위(기능)가 없으면 하위(공정특성) 생성 안됨
        if (!funcId) {
          alert('먼저 작업요소기능을 선택해주세요.');
          return;
        }
        
        const charId = (modal as any).charId;
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            l3: proc.l3.map((we: any) => {
              if (we.id !== l3Id) return we;
              return {
                ...we,
                functions: (we.functions || []).map((f: any) => {
                  if (f.id !== funcId) return f;
                  const currentChars = f.processChars || [];
                  
                  // ✅ charId가 있으면 해당 항목만 수정 (다중선택 개별 수정)
                  if (charId) {
                    if (selectedValues.length === 0) {
                      return { ...f, processChars: currentChars.filter((c: any) => c.id !== charId) };
                    }
                    return {
                      ...f,
                      processChars: currentChars.map((c: any) => 
                        c.id === charId ? { ...c, name: selectedValues[0] || c.name } : c
                      )
                    };
                  }
                  
                  // ✅ 다중 선택: 각각 별도 행으로 추가 (L1/L2 패턴)
                  const updatedChars = [...currentChars];
                  const existingNames = new Set(currentChars.filter((c: any) => c.name && !c.name.includes('클릭')).map((c: any) => c.name));
                  
                  // 빈 공정특성 찾기
                  const emptyCharIdx = updatedChars.findIndex((c: any) => !c.name || c.name === '' || c.name.includes('클릭'));
                  let startIdx = 0;
                  
                  // 빈 공정특성이 있으면 첫 번째 선택값 할당
                  if (emptyCharIdx !== -1 && selectedValues.length > 0 && !existingNames.has(selectedValues[0])) {
                    updatedChars[emptyCharIdx] = { ...updatedChars[emptyCharIdx], name: selectedValues[0] };
                    existingNames.add(selectedValues[0]);
                    startIdx = 1;
                  }
                  
                  // 나머지 선택값들 각각 새 행으로 추가 (중복 제외)
                  for (let i = startIdx; i < selectedValues.length; i++) {
                    const val = selectedValues[i];
                    if (!existingNames.has(val)) {
                      updatedChars.push({ id: uid(), name: val, specialChar: '' });
                      existingNames.add(val);
                    }
                  }
                  
                  return { ...f, processChars: updatedChars };
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
    saveToLocalStorage?.(); // 영구 저장
  }, [modal, state.l3Confirmed, setState, setDirty, saveToLocalStorage]);

  const handleDelete = useCallback((deletedValues: string[]) => {
    if (!modal) return;
    const deletedSet = new Set(deletedValues);
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      const { type, procId, l3Id, funcId } = modal;

      if (type === 'l3Function') {
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            l3: proc.l3.map((we: any) => {
              if (we.id !== l3Id) return we;
              return {
                ...we,
                functions: (we.functions || []).filter((f: any) => !deletedSet.has(f.name))
              };
            })
          };
        });
      } else if (type === 'l3ProcessChar') {
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            l3: proc.l3.map((we: any) => {
              if (we.id !== l3Id) return we;
              return {
                ...we,
                functions: (we.functions || []).map((f: any) => {
                  if (f.id !== funcId) return f;
                  return {
                    ...f,
                    processChars: (f.processChars || []).filter((c: any) => !deletedSet.has(c.name))
                  };
                })
              };
            })
          };
        });
      }
      
      return newState;
    });
    
    setDirty(true);
    setTimeout(() => saveToLocalStorage?.(), 200);
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // 특별특성 선택 핸들러
  // ✅ 특별특성 업데이트 - CRUD Update → 확정 해제 필요
  const handleSpecialCharSelect = useCallback((symbol: string) => {
    if (!specialCharModal) return;
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      const { procId, l3Id, funcId, charId } = specialCharModal;
      
      newState.l2 = newState.l2.map((proc: any) => {
        if (proc.id !== procId) return proc;
        return {
          ...proc,
          l3: (proc.l3 || []).map((we: any) => {
            if (we.id !== l3Id) return we;
            return {
              ...we,
              functions: (we.functions || []).map((f: any) => {
                if (f.id !== funcId) return f;
                return {
                  ...f,
                  processChars: (f.processChars || []).map((c: any) => {
                    if (c.id !== charId) return c;
                    return { ...c, specialChar: symbol };
                  })
                };
              })
            };
          })
        };
      });
      // ✅ CRUD Update: 확정 상태 해제
      newState.l3Confirmed = false;
      return newState;
    });
    
    setDirty(true);
    setSpecialCharModal(null);
    setTimeout(() => saveToLocalStorage?.(), 200);
  }, [specialCharModal, setState, setDirty, saveToLocalStorage]);

  // ✅ 의미 있는 기능인지 체크하는 헬퍼
  const isMeaningfulFunc = (f: any) => {
    const name = f.name || '';
    return name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택') && 
           !name.includes('추가') && !name.includes('입력') && !name.includes('필요');
  };
  
  // ✅ 의미 있는 공정특성 필터 + 중복 제거
  const getMeaningfulChars = (chars: any[]) => {
    return (chars || []).filter((c: any, idx: number, arr: any[]) => {
      const name = c.name || '';
      const isMeaningful = name.trim() !== '' && !name.includes('클릭하여') && !name.includes('선택') && 
             !name.includes('추가') && !name.includes('입력') && !name.includes('필요');
      // ✅ 중복 제거: 같은 이름의 공정특성 중 첫 번째만 유지
      const isFirst = arr.findIndex((x: any) => x.name === c.name) === idx;
      return isMeaningful && isFirst;
    });
  };

  // 공정의 총 행 수 계산
  const getProcRowSpan = (proc: any) => {
    const l3List = proc.l3 || [];
    if (l3List.length === 0) return 1;
    return l3List.reduce((acc: number, we: any) => {
      const funcs = (we.functions || []).filter(isMeaningfulFunc);
      if (funcs.length === 0) return acc + 1;
      return acc + funcs.reduce((a: number, f: any) => a + Math.max(1, getMeaningfulChars(f.processChars).length), 0);
    }, 0);
  };

  // 작업요소의 총 행 수 계산
  const getWeRowSpan = (we: any) => {
    const funcs = (we.functions || []).filter(isMeaningfulFunc);
    if (funcs.length === 0) return 1;
    return funcs.reduce((a: number, f: any) => a + Math.max(1, getMeaningfulChars(f.processChars).length), 0);
  };

  const hasAnyL3 = state.l2.some(p => (p.l3 || []).length > 0);

  return (
    <div className="p-0 overflow-auto h-full" style={{ paddingBottom: '50px' }} onKeyDown={handleEnterBlur}>
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col className="w-[120px]" />
          <col className="w-[50px]" />
          <col className="w-[140px]" />
          <col className="w-[180px]" />
          <col className="w-[180px]" />
          <col className="w-[80px]" />
        </colgroup>
        
        {/* 3행 헤더 구조 - 하단 2px 검은색 구분선 */}
        <thead className="sticky top-0 z-20 bg-white border-b-2 border-black">
          {/* 1행: 단계 구분 */}
          <tr>
            <th colSpan={3} className="bg-[#1976d2] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center">
              2단계 구조분석
            </th>
            <th colSpan={3} className="bg-[#388e3c] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center">
              <div className="flex items-center justify-center gap-5">
                <span>3단계 : 3L 작업요소 기능분석</span>
                <div className="flex gap-1.5">
                  {isConfirmed ? (
                    <span className={badgeConfirmed}>✓ 확정됨({processCharCount})</span>
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
            <th colSpan={3} className="bg-[#1976d2] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              3. 작업요소 (4M)
            </th>
            <th colSpan={3} className="bg-[#388e3c] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center">
              3. 작업요소 기능/공정특성/특별특성
              {missingCount > 0 && (
                <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">
                  누락 {missingCount}건
                </span>
              )}
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 - COUNT 표시 표준: 항목명(숫자) */}
          <tr className="bg-[#e8f5e9]">
            <th className="bg-[#e3f2fd] border border-[#ccc] p-1.5 text-xs font-semibold">
              소속 공정
            </th>
            <th className="bg-[#e3f2fd] border border-[#ccc] p-1.5 text-xs font-semibold">
              4M
            </th>
            <th className="bg-[#e3f2fd] border border-[#ccc] p-1.5 text-xs font-semibold">
              작업요소<span className={`font-bold ${workElementCount > 0 ? 'text-green-700' : 'text-red-500'}`}>({workElementCount})</span>
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] p-1.5 text-xs font-semibold">
              작업요소기능<span className={`font-bold ${l3FunctionCount > 0 ? 'text-green-700' : 'text-red-500'}`}>({l3FunctionCount})</span>
            </th>
            <th className="bg-[#c8e6c9] border border-[#ccc] border-r-[2px] border-r-orange-500 p-1.5 text-xs font-semibold">
              공정특성<span className={`font-bold ${processCharCount > 0 ? 'text-green-700' : 'text-red-500'}`}>({processCharCount})</span>
            </th>
            <th className="bg-orange-500 text-white border border-[#ccc] border-l-0 p-1.5 text-xs font-semibold text-center whitespace-nowrap">
              특별특성
            </th>
          </tr>
        </thead>
        
        <tbody>
          {!hasAnyL3 ? (
            <tr className="bg-[#e8f5e9]">
              <td colSpan={3} className="border border-[#ccc] p-2.5 text-center bg-[#e3f2fd] text-xs text-gray-500">
                (구조분석에서 작업요소 추가)
              </td>
              <td className="border border-[#ccc] p-0">
                <SelectableCell value="" placeholder="작업요소기능 선택" bgColor={'#e8f5e9'} onClick={() => {}} />
              </td>
              <td className="border border-[#ccc] border-r-[2px] border-r-orange-500 p-0">
                <SelectableCell value="" placeholder="공정특성 선택" bgColor={'#e8f5e9'} onClick={() => {}} />
              </td>
              <td className="border border-[#ccc] border-l-0 p-1 text-center bg-[#fff3e0]">
                <SpecialCharBadge value="" onClick={() => {}} />
              </td>
            </tr>
          ) : (() => {
            let globalRowIdx = 0;
            return state.l2.flatMap((proc) => {
              const l3List = proc.l3 || [];
              if (l3List.length === 0) return [];
              
              const procRowSpan = getProcRowSpan(proc);
              let isFirstProcRow = true;
              
              return l3List.flatMap((we, weIdx) => {
                // ✅ 의미 있는 기능만 필터링
                const funcs = (we.functions || []).filter(isMeaningfulFunc);
                const weRowSpan = getWeRowSpan(we);
                
                // 작업요소에 기능이 없는 경우
                if (funcs.length === 0) {
                  const zebra = getZebraColors(globalRowIdx++); // 표준화된 색상
                  const row = (
                    <tr key={we.id}>
                      {isFirstProcRow && (
                        <td rowSpan={procRowSpan} className="border border-[#ccc] p-2 text-center text-xs font-semibold align-middle" style={{ background: zebra.structure }}>
                          {proc.no}. {proc.name}
                        </td>
                      )}
                      <td rowSpan={weRowSpan} className="border border-[#ccc] p-1 text-center text-xs font-medium align-middle" style={{ background: zebra.structure }}>
                        {we.m4}
                      </td>
                      <td rowSpan={weRowSpan} className="border border-[#ccc] p-2 font-semibold text-xs align-middle" style={{ background: zebra.structure }}>
                        {we.name}
                      </td>
                      <td className={cellP0} style={{ background: zebra.function }}>
                        <SelectableCell value="" placeholder="작업요소기능 선택" bgColor={zebra.function} onClick={() => handleCellClick({ type: 'l3Function', procId: proc.id, l3Id: we.id, title: '작업요소 기능 선택', itemCode: 'B2', workElementName: we.name })} />
                      </td>
                      <td className="border border-[#ccc] border-r-[2px] border-r-orange-500 p-0" style={{ background: zebra.failure }}>
                        <SelectableCell value="" placeholder="공정특성 선택" bgColor={zebra.failure} onClick={() => {}} />
                      </td>
                      <td className="border border-[#ccc] border-l-0 p-1 text-center" style={{ background: zebra.failure }}>
                        <SpecialCharBadge value="" onClick={() => {}} />
                      </td>
                    </tr>
                  );
                  isFirstProcRow = false;
                  return [row];
                }
                
                // 작업요소에 기능이 있는 경우
                return funcs.flatMap((f, fIdx) => {
                  // ✅ 의미 있는 공정특성만 필터링 + 중복 제거
                  const chars = getMeaningfulChars(f.processChars);
                  const funcRowSpan = Math.max(1, chars.length);
                  
                  // 기능에 공정특성이 없는 경우
                  if (chars.length === 0) {
                    const zebra = getZebraColors(globalRowIdx++); // 표준화된 색상
                    const row = (
                      <tr key={f.id}>
                        {isFirstProcRow && (
                          <td rowSpan={procRowSpan} className="border border-[#ccc] p-2 text-center text-xs font-semibold align-middle" style={{ background: zebra.structure }}>
                            {proc.no}. {proc.name}
                          </td>
                        )}
                        {fIdx === 0 && (
                          <>
                            <td rowSpan={weRowSpan} className="border border-[#ccc] p-1 text-center text-xs font-medium align-middle" style={{ background: zebra.structure }}>
                              {we.m4}
                            </td>
                            <td rowSpan={weRowSpan} className="border border-[#ccc] p-2 font-semibold text-xs align-middle" style={{ background: zebra.structure }}>
                              {we.name}
                            </td>
                          </>
                        )}
                        <td rowSpan={funcRowSpan} className="border border-[#ccc] p-0 align-middle" style={{ background: zebra.function }}>
                          <SelectableCell 
                            value={f.name} 
                            placeholder="작업요소기능" 
                            bgColor={zebra.function} 
                            onClick={() => handleCellClick({ type: 'l3Function', procId: proc.id, l3Id: we.id, funcId: f.id, title: '작업요소 기능 선택', itemCode: 'B2', workElementName: we.name })} 
                            onDoubleClickEdit={(newValue) => handleInlineEditFunction(proc.id, we.id, f.id, newValue)}
                          />
                        </td>
                        <td className="border border-[#ccc] border-r-[2px] border-r-orange-500 p-0" style={{ background: zebra.failure }}>
                          <SelectableCell value="" placeholder="공정특성 선택" bgColor={zebra.failure} onClick={() => handleCellClick({ type: 'l3ProcessChar', procId: proc.id, l3Id: we.id, funcId: f.id, title: '공정특성 선택', itemCode: 'B3', workElementName: we.name })} />
                        </td>
                        <td className="border border-[#ccc] border-l-0 p-1 text-center" style={{ background: zebra.failure }}>
                          <SpecialCharBadge value="" onClick={() => {}} />
                        </td>
                      </tr>
                    );
                    isFirstProcRow = false;
                    return [row];
                  }
                  
                  // 기능에 공정특성이 있는 경우
                  return chars.map((c, cIdx) => {
                    const zebra = getZebraColors(globalRowIdx++); // 표준화된 색상
                    const row = (
                      <tr key={c.id}>
                        {isFirstProcRow && (
                          <td rowSpan={procRowSpan} className="border border-[#ccc] p-2 text-center text-xs font-semibold align-middle" style={{ background: zebra.structure }}>
                            {proc.no}. {proc.name}
                          </td>
                        )}
                        {fIdx === 0 && cIdx === 0 && (
                          <>
                            <td rowSpan={weRowSpan} className="border border-[#ccc] p-1 text-center text-xs font-medium align-middle" style={{ background: zebra.structure }}>
                              {we.m4}
                            </td>
                            <td rowSpan={weRowSpan} className="border border-[#ccc] p-2 font-semibold text-xs align-middle" style={{ background: zebra.structure }}>
                              {we.name}
                            </td>
                          </>
                        )}
                        {cIdx === 0 && (
                          <td rowSpan={funcRowSpan} className="border border-[#ccc] p-0 align-middle" style={{ background: zebra.function }}>
                            <SelectableCell 
                              value={f.name} 
                              placeholder="작업요소기능" 
                              bgColor={zebra.function} 
                              onClick={() => handleCellClick({ type: 'l3Function', procId: proc.id, l3Id: we.id, funcId: f.id, title: '작업요소 기능 선택', itemCode: 'B2', workElementName: we.name })} 
                              onDoubleClickEdit={(newValue) => handleInlineEditFunction(proc.id, we.id, f.id, newValue)}
                            />
                          </td>
                        )}
                        <td className="border border-[#ccc] border-r-[2px] border-r-orange-500 p-0" style={{ background: zebra.failure }}>
                          <SelectableCell 
                            value={c.name} 
                            placeholder="공정특성" 
                            bgColor={zebra.failure} 
                            onClick={() => handleCellClick({ type: 'l3ProcessChar', procId: proc.id, l3Id: we.id, funcId: f.id, charId: c.id, title: '공정특성 선택', itemCode: 'B3', workElementName: we.name })} 
                            onDoubleClickEdit={(newValue) => handleInlineEditProcessChar(proc.id, we.id, f.id, c.id, newValue)}
                          />
                        </td>
                        <td className="border border-[#ccc] border-l-0 p-1 text-center" style={{ background: zebra.failure }}>
                          <SpecialCharBadge 
                            value={c.specialChar || ''} 
                            onClick={() => setSpecialCharModal({ procId: proc.id, l3Id: we.id, funcId: f.id, charId: c.id })} 
                          />
                        </td>
                      </tr>
                    );
                    isFirstProcRow = false;
                    return row;
                  });
                });
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
          workElementName={modal.workElementName}
          processName={state.l2.find(p => p.id === modal.procId)?.name}
          processNo={state.l2.find(p => p.id === modal.procId)?.no}
          processList={state.l2.map(p => ({ id: p.id, no: p.no, name: p.name }))}
          onProcessChange={(procId) => {
            setModal(prev => prev ? { ...prev, procId } : null);
          }}
          currentValues={(() => {
            const proc = state.l2.find(p => p.id === modal.procId);
            if (!proc) return [];
            const we = (proc.l3 || []).find(w => w.id === modal.l3Id);
            if (!we) return [];
            if (modal.type === 'l3Function') return (we.functions || []).map(f => f.name);
            if (modal.type === 'l3ProcessChar') {
              const func = (we.functions || []).find(f => f.id === modal.funcId);
              return func ? (func.processChars || []).map(c => c.name) : [];
            }
            return [];
          })()}
        />
      )}

      {/* 특별특성 선택 모달 */}
      {specialCharModal && (
        <SpecialCharSelectModal
          isOpen={!!specialCharModal}
          onClose={() => setSpecialCharModal(null)}
          onSelect={handleSpecialCharSelect}
          currentValue={(() => {
            const proc = state.l2.find(p => p.id === specialCharModal.procId);
            if (!proc) return '';
            const we = (proc.l3 || []).find(w => w.id === specialCharModal.l3Id);
            if (!we) return '';
            const func = (we.functions || []).find(f => f.id === specialCharModal.funcId);
            if (!func) return '';
            const char = (func.processChars || []).find(c => c.id === specialCharModal.charId);
            return char?.specialChar || '';
          })()}
          productCharName={(() => {
            const proc = state.l2.find(p => p.id === specialCharModal.procId);
            if (!proc) return '';
            const we = (proc.l3 || []).find(w => w.id === specialCharModal.l3Id);
            if (!we) return '';
            const func = (we.functions || []).find(f => f.id === specialCharModal.funcId);
            if (!func) return '';
            const char = (func.processChars || []).find(c => c.id === specialCharModal.charId);
            return char?.name || '';
          })()}
        />
      )}
    </div>
  );
}
