/**
 * @file FunctionL2Tab.tsx
 * @description 메인공정(L2) 기능 분석 - 3행 헤더 구조 (L1과 동일한 패턴)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FunctionTabProps } from './types';
import { COLORS, uid } from '../../constants';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import SpecialCharSelectModal, { SPECIAL_CHAR_DATA } from '@/components/modals/SpecialCharSelectModal';

// 특별특성 배지 컴포넌트 (기호만 표시)
function SpecialCharBadge({ value, onClick }: { value: string; onClick: () => void }) {
  // SPECIAL_CHAR_DATA에서 해당 심볼 찾기
  const charData = SPECIAL_CHAR_DATA.find(d => d.symbol === value);
  
  if (!value) {
    return (
      <div 
        onClick={onClick}
        style={{
          padding: '4px',
          cursor: 'pointer',
          fontSize: '10px',
          color: '#9e9e9e',
          fontWeight: 600,
          background: '#f5f5f5',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        - 미지정
      </div>
    );
  }
  
  const bgColor = charData?.color || '#9e9e9e';
  const icon = charData?.icon || '';
  
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '2px 4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <span 
        style={{
          background: bgColor,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}
        title={charData?.meaning || value}
      >
        {icon && <span style={{ fontSize: '9px' }}>{icon}</span>}
        {value}
      </span>
    </div>
  );
}

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

  // 확정 핸들러
  const handleConfirm = useCallback(() => {
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n먼저 입력을 완료해주세요.`);
      return;
    }
    setState(prev => ({ ...prev, l2Confirmed: true }));
    saveToLocalStorage?.();
    alert('2L 메인공정 기능분석이 확정되었습니다.');
  }, [missingCount, setState, saveToLocalStorage]);

  // 수정 핸들러
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, l2Confirmed: false }));
    saveToLocalStorage?.(); // 영구 저장
  }, [setState, saveToLocalStorage]);

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
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      const { type, procId, funcId } = modal;

      if (type === 'l2Function') {
        // 메인공정 기능 저장
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          const currentFuncs = proc.functions || [];
          return {
            ...proc,
            functions: selectedValues.map(val => {
              const existing = currentFuncs.find((f: any) => f.name === val);
              return existing || { id: uid(), name: val, productChars: [] };
            })
          };
        });
      } else if (type === 'l2ProductChar') {
        // 제품특성 저장 (특정 기능에 연결)
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            functions: proc.functions.map((f: any) => {
              if (f.id !== funcId) return f;
              const currentChars = f.productChars || [];
              return {
                ...f,
                productChars: selectedValues.map(val => {
                  const existing = currentChars.find((c: any) => c.name === val);
                  return existing || { id: uid(), name: val, specialChar: '' };
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
  }, [modal, setState, setDirty, saveToLocalStorage]);

  const handleDelete = useCallback((deletedValues: string[]) => {
    if (!modal) return;
    const deletedSet = new Set(deletedValues);
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      const { type, procId, funcId } = modal;

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
    if (saveToLocalStorage) setTimeout(() => saveToLocalStorage(), 100);
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // 특별특성 선택 핸들러
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
      return newState;
    });
    
    setDirty(true);
    setSpecialCharModal(null);
    if (saveToLocalStorage) setTimeout(() => saveToLocalStorage(), 100);
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
    <div style={{ padding: '0', overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '140px' }} />
          <col style={{ width: '280px' }} />
          <col style={{ width: '220px' }} />
          <col style={{ width: '60px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th style={{ background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              2단계 구조분석
            </th>
            <th colSpan={3} style={{ background: '#2e7d32', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                <span>3단계 : 2L 메인공정 기능분석</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {isConfirmed ? (
                    <span style={{ background: '#4caf50', color: 'white', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700 }}>
                      ✓ 확정됨
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      style={{ background: '#4caf50', color: 'white', border: 'none', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      확정
                    </button>
                  )}
                  <span style={{ background: missingCount > 0 ? '#f44336' : '#4caf50', color: 'white', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700 }}>
                    누락 {missingCount}건
                  </span>
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={handleEdit}
                      style={{ background: '#ff9800', color: 'white', border: 'none', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      수정
                    </button>
                  )}
                </div>
              </div>
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th style={{ background: '#42a5f5', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              2. 메인공정명
            </th>
            <th colSpan={3} style={{ background: '#7c4dff', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              2. 메인공정 기능/제품특성
              {missingCount > 0 && (
                <span style={{ marginLeft: '8px', background: '#f44336', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>
                  누락 {missingCount}건
                </span>
              )}
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr style={{ background: '#e3f2fd' }}>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              공정NO+공정명
            </th>
            <th style={{ background: '#a5d6a7', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              메인공정기능
              {missingCounts.functionCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#f44336', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: '9px' }}>
                  {missingCounts.functionCount}
                </span>
              )}
            </th>
            <th style={{ background: '#a5d6a7', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              제품특성
              {missingCounts.charCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#f44336', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: '9px' }}>
                  {missingCounts.charCount}
                </span>
              )}
            </th>
            <th style={{ background: '#ffcdd2', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              특별특성
            </th>
          </tr>
        </thead>
        
        <tbody>
          {state.l2.length === 0 ? (
            <tr>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700 }}>
                (구조분석에서 공정 추가)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="공정기능 선택" bgColor="#c8e6c9" onClick={() => {}} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="제품특성 선택" bgColor="#c8e6c9" onClick={() => {}} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', background: '#ffebee', color: '#999', fontSize: '10px' }}>
                -
              </td>
            </tr>
          ) : state.l2.map((proc, pIdx) => {
            const funcs = proc.functions || [];
            const procRowSpan = funcs.length === 0 ? 1 : funcs.reduce((a, f) => a + Math.max(1, (f.productChars || []).length), 0);
            
            // 공정에 기능이 없는 경우
            if (funcs.length === 0) {
              return (
                <tr key={proc.id}>
                  <td rowSpan={procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                    {proc.no}. {proc.name}
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value="" placeholder="공정기능 선택" bgColor="#c8e6c9" onClick={() => setModal({ type: 'l2Function', procId: proc.id, title: '메인공정 기능 선택', itemCode: 'A3' })} />
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value="" placeholder="제품특성 선택" bgColor="#c8e6c9" onClick={() => {}} />
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', background: '#ffebee', color: '#999', fontSize: '10px' }}>
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
                  <tr key={f.id}>
                    {fIdx === 0 && (
                      <td rowSpan={procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                        {proc.no}. {proc.name}
                      </td>
                    )}
                    <td rowSpan={funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', verticalAlign: 'middle' }}>
                      <SelectableCell 
                        value={f.name} 
                        placeholder="공정기능" 
                        bgColor="#c8e6c9" 
                        onClick={() => setModal({ type: 'l2Function', procId: proc.id, title: '메인공정 기능 선택', itemCode: 'A3' })} 
                        onDoubleClickEdit={(newValue) => handleInlineEditFunction(proc.id, f.id, newValue)}
                      />
                    </td>
                    <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                      <SelectableCell value="" placeholder="제품특성 선택" bgColor="#fff" onClick={() => setModal({ type: 'l2ProductChar', procId: proc.id, funcId: f.id, title: '제품특성 선택', itemCode: 'A4' })} />
                    </td>
                    <td style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', background: '#ffebee', color: '#999', fontSize: '10px' }}>
                      -
                    </td>
                  </tr>
                );
              }
              
              // 기능에 제품특성이 있는 경우
              return chars.map((c, cIdx) => (
                <tr key={c.id}>
                  {fIdx === 0 && cIdx === 0 && (
                    <td rowSpan={procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                      {proc.no}. {proc.name}
                    </td>
                  )}
                  {cIdx === 0 && (
                    <td rowSpan={funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', verticalAlign: 'middle' }}>
                      <SelectableCell 
                        value={f.name} 
                        placeholder="공정기능" 
                        bgColor="#c8e6c9" 
                        onClick={() => setModal({ type: 'l2Function', procId: proc.id, title: '메인공정 기능 선택', itemCode: 'A3' })} 
                        onDoubleClickEdit={(newValue) => handleInlineEditFunction(proc.id, f.id, newValue)}
                      />
                    </td>
                  )}
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell 
                      value={c.name} 
                      placeholder="제품특성" 
                      bgColor="#fff" 
                      onClick={() => setModal({ type: 'l2ProductChar', procId: proc.id, funcId: f.id, title: '제품특성 선택', itemCode: 'A4' })} 
                      onDoubleClickEdit={(newValue) => handleInlineEditProductChar(proc.id, f.id, c.id, newValue)}
                    />
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0', textAlign: 'center' }}>
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
