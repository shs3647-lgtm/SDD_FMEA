/**
 * @file FunctionL1Tab.tsx
 * @description 완제품(L1) 기능 분석 - 3행 헤더 구조 (구조분석 + 기능분석)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FunctionTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';

// 구분(Type)별 색상 정의
const TYPE_COLORS: Record<string, { bg: string; light: string; text: string }> = {
  'Your Plant': { bg: '#1976d2', light: '#bbdefb', text: '#0d47a1' },      // 파란색
  'Ship to Plant': { bg: '#f57c00', light: '#ffe0b2', text: '#e65100' },   // 주황색
  'User': { bg: '#7b1fa2', light: '#e1bee7', text: '#4a148c' },            // 보라색
};

const getTypeColor = (typeName: string) => {
  return TYPE_COLORS[typeName] || { bg: '#388e3c', light: '#c8e6c9', text: '#1b5e20' }; // 기본 녹색
};

export default function FunctionL1Tab({ state, setState, setDirty, saveToLocalStorage }: FunctionTabProps) {
  const [modal, setModal] = useState<{ type: string; id: string; title: string; itemCode: string; parentFunction?: string; parentCategory?: string } | null>(null);
  
  // 확정 상태는 state에서 관리 (localStorage에 저장됨)
  const isConfirmed = (state as any).l1Confirmed || false;

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

  // 확정 핸들러
  const handleConfirm = () => {
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n모든 항목을 입력 후 확정해 주세요.`);
      return;
    }
    setState((prev: any) => ({ ...prev, l1Confirmed: true }));
    setDirty(true);
    saveToLocalStorage?.(); // 영구 저장
    alert('✅ 완제품 기능분석이 확정되었습니다.');
  };

  // 수정 핸들러
  const handleEdit = () => {
    setState((prev: any) => ({ ...prev, l1Confirmed: false }));
    setDirty(true);
    saveToLocalStorage?.(); // 영구 저장
    alert('🔓 수정 모드로 전환되었습니다.');
  };

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
    
    setState(prev => {
      const newState = { ...prev };
      const { type, id } = modal;

      if (type === 'l1Type') {
        const currentTypes = newState.l1.types;
        newState.l1.types = selectedValues.map(val => {
          const existing = currentTypes.find(t => t.name === val);
          return existing || { id: uid(), name: val, functions: [] };
        });
      } 
      else if (type === 'l1Function') {
        newState.l1.types = newState.l1.types.map(t => {
          if (t.id !== id) return t;
          const currentFuncs = t.functions;
          return {
            ...t,
            functions: selectedValues.map(val => {
              const existing = currentFuncs.find(f => f.name === val);
              return existing || { id: uid(), name: val, requirements: [] };
            })
          };
        });
      }
      else if (type === 'l1Requirement') {
        newState.l1.types = newState.l1.types.map(t => ({
          ...t,
          functions: t.functions.map(f => {
            if (f.id !== id) return f;
            const currentReqs = f.requirements || [];
            return {
              ...f,
              requirements: selectedValues.map(val => {
                const existing = currentReqs.find(r => r.name === val);
                return existing || { id: uid(), name: val };
              })
            };
          })
        }));
      }
      
      return newState;
    });
    
    setDirty(true);
    setModal(null);
    saveToLocalStorage?.(); // 영구 저장
  }, [modal, setState, setDirty, saveToLocalStorage]);

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
    
    // 즉시 저장
    if (saveToLocalStorage) {
      console.log('[FunctionL1Tab] 100ms 후 저장 예약');
      setTimeout(() => {
        console.log('[FunctionL1Tab] 저장 실행');
        saveToLocalStorage();
      }, 100);
    }
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
    <div style={{ padding: '0', overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        {/* 컬럼 너비: 완제품공정명 150px, 구분 90px, 완제품기능 auto, 요구사항 200px */}
        <colgroup>
          <col style={{ width: '150px' }} /><col style={{ width: '90px' }} /><col /><col style={{ width: '200px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th 
              style={{ 
                background: '#1976d2', color: 'white', 
                border: `1px solid ${COLORS.line}`, padding: '8px', 
                fontSize: FONT_SIZES.header1, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center'
              }}
            >
              2단계 구조분석
            </th>
            <th 
              colSpan={3}
              style={{ 
                background: '#1b5e20', color: 'white', 
                border: `1px solid ${COLORS.line}`, padding: '8px', 
                fontSize: FONT_SIZES.header1, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ flex: 1, textAlign: 'center' }}>3단계 : 1L 완제품 공정 기능분석</span>
                <div style={{ display: 'flex', gap: '4px', position: 'absolute', right: '8px' }}>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isConfirmed}
                    style={{
                      padding: '4px 12px',
                      background: isConfirmed ? '#9e9e9e' : '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: FONT_SIZES.header1,
                      fontWeight: FONT_WEIGHTS.semibold,
                      cursor: isConfirmed ? 'not-allowed' : 'pointer',
                      opacity: isConfirmed ? 0.7 : 1
                    }}
                  >
                    {isConfirmed ? '✓ 확정됨' : '확정'}
                  </button>
                  <span style={{
                    padding: '4px 10px',
                    background: missingCount > 0 ? '#f57c00' : '#4caf50',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: FONT_SIZES.header1,
                    fontWeight: FONT_WEIGHTS.semibold
                  }}>
                    누락 {missingCount}건
                  </span>
                  <button
                    type="button"
                    onClick={handleEdit}
                    disabled={!isConfirmed}
                    style={{
                      padding: '4px 12px',
                      background: !isConfirmed ? '#9e9e9e' : '#2196f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: FONT_SIZES.header1,
                      fontWeight: FONT_WEIGHTS.semibold,
                      cursor: !isConfirmed ? 'not-allowed' : 'pointer',
                      opacity: !isConfirmed ? 0.7 : 1
                    }}
                  >
                    수정
                  </button>
                </div>
              </div>
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th 
              style={{ 
                background: '#1976d2', color: 'white', 
                border: `1px solid ${COLORS.line}`, padding: '6px', 
                fontSize: FONT_SIZES.header1, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center'
              }}
            >
              1. 완제품 공정명
            </th>
            <th 
              colSpan={3}
              style={{ 
                background: '#388e3c', color: 'white', 
                border: `1px solid ${COLORS.line}`, padding: '6px', 
                fontSize: FONT_SIZES.header1, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center'
              }}
            >
              1. 완제품 공정기능/요구사항
              {missingCount > 0 && (
                <span style={{ marginLeft: '8px', background: '#f57c00', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: FONT_SIZES.cell }}>
                  누락 {missingCount}건
                </span>
              )}
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr style={{ background: '#e8f5e9' }}>
            <th style={{ background: '#e3f2fd', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold }}>
              완제품 공정명
            </th>
            <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold }}>
              구분
            </th>
            <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold }}>
              완제품기능
              {missingCounts.functionCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#f57c00', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: FONT_SIZES.small }}>
                  {missingCounts.functionCount}
                </span>
              )}
            </th>
            <th style={{ background: '#fff3e0', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: FONT_SIZES.header2, fontWeight: FONT_WEIGHTS.semibold, color: '#e65100' }}>
              요구사항
              {missingCounts.requirementCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#f57c00', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: FONT_SIZES.small }}>
                  {missingCounts.requirementCount}
                </span>
              )}
            </th>
          </tr>
        </thead>
        
        <tbody>
          {state.l1.types.length === 0 ? (
            <tr style={{ background: COLORS.function.light }}>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: COLORS.structure.light, fontWeight: FONT_WEIGHTS.semibold }}>
                {state.l1.name || '(구조분석에서 입력)'}
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="구분 선택" bgColor={COLORS.function.light} onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="기능 선택" bgColor={COLORS.function.light} onClick={() => setModal({ type: 'l1Function', id: '', title: '완제품 기능 선택', itemCode: 'C2' })} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="요구사항 선택" bgColor={COLORS.function.light} onClick={() => setModal({ type: 'l1Requirement', id: '', title: '요구사항 선택', itemCode: 'C3', parentFunction: '' })} />
              </td>
            </tr>
          ) : (() => {
            let globalRowIdx = 0;
            return state.l1.types.map((t, tIdx) => {
              // 각 구분(type)별 행 수 계산
              const typeRowSpan = t.functions.length === 0 ? 1 : t.functions.reduce((a, f) => a + Math.max(1, f.requirements.length), 0);
              
              return t.functions.length === 0 ? (
                <tr key={t.id} style={{ background: globalRowIdx++ % 2 === 1 ? COLORS.function.zebra : COLORS.function.light }}>
                  {/* 완제품 공정명 - 각 구분과 1:1 매칭 */}
                  <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: COLORS.structure.light, fontWeight: FONT_WEIGHTS.semibold, verticalAlign: 'middle' }}>
                    {state.l1.name || '(구조분석에서 입력)'}
                  </td>
                  <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', background: getTypeColor(t.name).light, verticalAlign: 'middle' }}>
                    <SelectableCell value={t.name} placeholder="구분" bgColor={getTypeColor(t.name).light} textColor={getTypeColor(t.name).text} textAlign="center" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value="" placeholder="기능 선택" bgColor={COLORS.function.light} onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} />
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value="" placeholder="요구사항 선택" bgColor={COLORS.function.light} onClick={() => setModal({ type: 'l1Requirement', id: '', title: '요구사항 선택', itemCode: 'C3', parentFunction: '' })} />
                  </td>
                </tr>
              ) : t.functions.map((f, fIdx) => {
                const funcRowSpan = Math.max(1, f.requirements.length);
                
                return f.requirements.length === 0 ? (
                  <tr key={f.id} style={{ background: globalRowIdx++ % 2 === 1 ? COLORS.function.zebra : COLORS.function.light }}>
                    {/* 완제품 공정명 - 각 구분의 첫 행에서만 표시 (1:1 매칭) */}
                    {fIdx === 0 && (
                      <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: COLORS.structure.light, fontWeight: FONT_WEIGHTS.semibold, verticalAlign: 'middle' }}>
                        {state.l1.name || '(구조분석에서 입력)'}
                      </td>
                    )}
                    {fIdx === 0 && (
                      <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', background: getTypeColor(t.name).light, verticalAlign: 'middle' }}>
                        <SelectableCell value={t.name} placeholder="구분" bgColor={getTypeColor(t.name).light} textColor={getTypeColor(t.name).text} textAlign="center" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                      </td>
                    )}
                    <td rowSpan={funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', verticalAlign: 'middle' }}>
                      <SelectableCell value={f.name} placeholder="기능" bgColor={COLORS.function.light} textColor="#000000" onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} onDoubleClickEdit={(newValue) => handleInlineEditFunction(t.id, f.id, newValue)} />
                    </td>
                    <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                      <SelectableCell value="" placeholder="요구사항 선택" bgColor={COLORS.function.zebra} textColor={COLORS.function.text} onClick={() => setModal({ type: 'l1Requirement', id: f.id, title: '요구사항 선택', itemCode: 'C3', parentFunction: f.name, parentCategory: t.name })} />
                    </td>
                  </tr>
                ) : f.requirements.map((r, rIdx) => (
                  <tr key={r.id} style={{ background: globalRowIdx++ % 2 === 1 ? COLORS.function.zebra : COLORS.function.light }}>
                    {/* 완제품 공정명 - 각 구분의 첫 행에서만 표시 (1:1 매칭) */}
                    {fIdx === 0 && rIdx === 0 && (
                      <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: COLORS.structure.light, fontWeight: FONT_WEIGHTS.semibold, verticalAlign: 'middle' }}>
                        {state.l1.name || '(구조분석에서 입력)'}
                      </td>
                    )}
                    {fIdx === 0 && rIdx === 0 && (
                      <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', background: getTypeColor(t.name).light, verticalAlign: 'middle' }}>
                        <SelectableCell value={t.name} placeholder="구분" bgColor={getTypeColor(t.name).light} textColor={getTypeColor(t.name).text} textAlign="center" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                      </td>
                    )}
                    {rIdx === 0 && (
                      <td rowSpan={funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', verticalAlign: 'middle' }}>
                        <SelectableCell value={f.name} placeholder="기능" bgColor={COLORS.function.light} textColor="#000000" onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} onDoubleClickEdit={(newValue) => handleInlineEditFunction(t.id, f.id, newValue)} />
                      </td>
                    )}
                    <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                      <SelectableCell 
                        value={r.name} 
                        placeholder="요구사항" 
                        bgColor={COLORS.function.zebra} 
                        textColor={COLORS.function.text} 
                        onClick={() => setModal({ type: 'l1Requirement', id: f.id, title: '요구사항 선택', itemCode: 'C3', parentFunction: f.name, parentCategory: t.name })} 
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
