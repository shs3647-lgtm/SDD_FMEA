/**
 * @file FunctionL3Tab.tsx
 * @description 작업요소(L3) 기능 분석 - 3행 헤더 구조 (L1과 동일한 패턴)
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
  const charData = SPECIAL_CHAR_DATA.find(d => d.symbol === value);
  
  // 특별특성 미지정 시 (★ 사용 금지 - 현대차 특별특성과 혼동)
  if (!value) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: '4px 8px',
          background: '#f5f5f5',
          border: '1px dashed #9e9e9e',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#9e9e9e',
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%'
        }}
      >
        - 미지정
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 6px',
        background: charData?.color || '#e0e0e0',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
      title={charData?.meaning || value}
    >
      {value}
    </button>
  );
}

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

  // 항목별 누락 건수 분리 계산 (특별특성은 누락건 제외)
  const missingCounts = React.useMemo(() => {
    let functionCount = 0;  // 작업요소기능 누락
    let charCount = 0;      // 공정특성 누락
    
    state.l2.forEach(proc => {
      const l3List = proc.l3 || [];
      l3List.forEach(we => {
        // 작업요소 기능 체크
        const funcs = we.functions || [];
        if (funcs.length === 0) functionCount++;
        funcs.forEach(f => {
          if (isMissing(f.name)) functionCount++;
          // 공정특성 체크
          const chars = f.processChars || [];
          if (chars.length === 0) charCount++;
          chars.forEach(c => {
            if (isMissing(c.name)) charCount++;
          });
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
    setState(prev => ({ ...prev, l3Confirmed: true }));
    saveToLocalStorage?.();
    alert('3L 작업요소 기능분석이 확정되었습니다.');
  }, [missingCount, setState, saveToLocalStorage]);

  // 수정 핸들러
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, l3Confirmed: false }));
    saveToLocalStorage?.(); // 영구 저장
  }, [setState, saveToLocalStorage]);

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
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      const { type, procId, l3Id, funcId } = modal;

      if (type === 'l3Function') {
        // 작업요소 기능 저장
        newState.l2 = newState.l2.map((proc: any) => {
          if (proc.id !== procId) return proc;
          return {
            ...proc,
            l3: proc.l3.map((we: any) => {
              if (we.id !== l3Id) return we;
              const currentFuncs = we.functions || [];
              return {
                ...we,
                functions: selectedValues.map(val => {
                  const existing = currentFuncs.find((f: any) => f.name === val);
                  return existing || { id: uid(), name: val, processChars: [] };
                })
              };
            })
          };
        });
      } else if (type === 'l3ProcessChar') {
        // 공정특성 저장 (특정 기능에 연결)
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
                  return {
                    ...f,
                    processChars: selectedValues.map(val => {
                      const existing = currentChars.find((c: any) => c.name === val);
                      return existing || { id: uid(), name: val };
                    })
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
    setModal(null);
    saveToLocalStorage?.(); // 영구 저장
  }, [modal, setState, setDirty, saveToLocalStorage]);

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
    if (saveToLocalStorage) setTimeout(() => saveToLocalStorage(), 100);
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // 특별특성 선택 핸들러
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
      
      return newState;
    });
    
    setDirty(true);
    setSpecialCharModal(null);
    if (saveToLocalStorage) setTimeout(() => saveToLocalStorage(), 100);
  }, [specialCharModal, setState, setDirty, saveToLocalStorage]);

  // 공정의 총 행 수 계산
  const getProcRowSpan = (proc: any) => {
    const l3List = proc.l3 || [];
    if (l3List.length === 0) return 1;
    return l3List.reduce((acc: number, we: any) => {
      const funcs = we.functions || [];
      if (funcs.length === 0) return acc + 1;
      return acc + funcs.reduce((a: number, f: any) => a + Math.max(1, (f.processChars || []).length), 0);
    }, 0);
  };

  // 작업요소의 총 행 수 계산
  const getWeRowSpan = (we: any) => {
    const funcs = we.functions || [];
    if (funcs.length === 0) return 1;
    return funcs.reduce((a: number, f: any) => a + Math.max(1, (f.processChars || []).length), 0);
  };

  const hasAnyL3 = state.l2.some(p => (p.l3 || []).length > 0);

  return (
    <div style={{ padding: '0', overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '120px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '140px' }} />
          <col style={{ width: '180px' }} />
          <col style={{ width: '180px' }} />
          <col style={{ width: '80px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th colSpan={3} style={{ background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              2단계 구조분석
            </th>
            <th colSpan={3} style={{ background: '#388e3c', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                <span>3단계 : 3L 작업요소 기능분석</span>
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
            <th colSpan={3} style={{ background: '#42a5f5', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 작업요소 (4M)
            </th>
            <th colSpan={3} style={{ background: '#5c6bc0', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 작업요소 기능/공정특성/특별특성
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
              소속 공정
            </th>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              4M
            </th>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              작업요소
            </th>
            <th style={{ background: '#c5cae9', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              작업요소기능
              {missingCounts.functionCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#f44336', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: '9px' }}>
                  {missingCounts.functionCount}
                </span>
              )}
            </th>
            <th style={{ background: '#c5cae9', border: `1px solid ${COLORS.line}`, borderRight: '3px solid #ff9800', padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              공정특성
              {missingCounts.charCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#f44336', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: '9px' }}>
                  {missingCounts.charCount}
                </span>
              )}
            </th>
            <th style={{ background: '#ff9800', color: 'white', border: `1px solid ${COLORS.line}`, borderLeft: 'none', padding: '6px', fontSize: '10px', fontWeight: 700, textAlign: 'center' }}>
              특별특성
            </th>
          </tr>
        </thead>
        
        <tbody>
          {!hasAnyL3 ? (
            <tr>
              <td colSpan={3} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontSize: '11px', color: '#666' }}>
                (구조분석에서 작업요소 추가)
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="작업요소기능 선택" bgColor="#e8eaf6" onClick={() => {}} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, borderRight: '3px solid #ff9800', padding: '0' }}>
                <SelectableCell value="" placeholder="공정특성 선택" bgColor="#e8eaf6" onClick={() => {}} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, borderLeft: 'none', padding: '4px', textAlign: 'center', background: '#fff3e0' }}>
                <SpecialCharBadge value="" onClick={() => {}} />
              </td>
            </tr>
          ) : state.l2.flatMap((proc) => {
            const l3List = proc.l3 || [];
            if (l3List.length === 0) return [];
            
            const procRowSpan = getProcRowSpan(proc);
            let isFirstProcRow = true;
            
            return l3List.flatMap((we, weIdx) => {
              const funcs = we.functions || [];
              const weRowSpan = getWeRowSpan(we);
              
              // 작업요소에 기능이 없는 경우
              if (funcs.length === 0) {
                const row = (
                  <tr key={we.id}>
                    {isFirstProcRow && (
                      <td rowSpan={procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#e3f2fd', fontSize: '10px', fontWeight: 700, verticalAlign: 'middle' }}>
                        {proc.no}. {proc.name}
                      </td>
                    )}
                    <td rowSpan={weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', fontSize: '10px', background: '#e3f2fd', fontWeight: 500, verticalAlign: 'middle' }}>
                      {we.m4}
                    </td>
                    <td rowSpan={weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', background: '#e3f2fd', fontWeight: 600, fontSize: '11px', verticalAlign: 'middle' }}>
                      {we.name}
                    </td>
                    <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                      <SelectableCell value="" placeholder="작업요소기능 선택" bgColor="#e8eaf6" onClick={() => setModal({ type: 'l3Function', procId: proc.id, l3Id: we.id, title: '작업요소 기능 선택', itemCode: 'B2', workElementName: we.name })} />
                    </td>
                    <td style={{ border: `1px solid ${COLORS.line}`, borderRight: '3px solid #ff9800', padding: '0' }}>
                      <SelectableCell value="" placeholder="공정특성 선택" bgColor="#e8eaf6" onClick={() => {}} />
                    </td>
                    <td style={{ border: `1px solid ${COLORS.line}`, borderLeft: 'none', padding: '4px', textAlign: 'center', background: '#fff3e0' }}>
                      <SpecialCharBadge value="" onClick={() => {}} />
                    </td>
                  </tr>
                );
                isFirstProcRow = false;
                return [row];
              }
              
              // 작업요소에 기능이 있는 경우
              return funcs.flatMap((f, fIdx) => {
                const chars = f.processChars || [];
                const funcRowSpan = Math.max(1, chars.length);
                
                // 기능에 공정특성이 없는 경우
                if (chars.length === 0) {
                  const row = (
                    <tr key={f.id}>
                      {isFirstProcRow && (
                        <td rowSpan={procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#e3f2fd', fontSize: '10px', fontWeight: 700, verticalAlign: 'middle' }}>
                          {proc.no}. {proc.name}
                        </td>
                      )}
                      {fIdx === 0 && (
                        <>
                          <td rowSpan={weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', fontSize: '10px', background: '#e3f2fd', fontWeight: 500, verticalAlign: 'middle' }}>
                            {we.m4}
                          </td>
                          <td rowSpan={weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', background: '#e3f2fd', fontWeight: 600, fontSize: '11px', verticalAlign: 'middle' }}>
                            {we.name}
                          </td>
                        </>
                      )}
                      <td rowSpan={funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', verticalAlign: 'middle' }}>
                        <SelectableCell 
                          value={f.name} 
                          placeholder="작업요소기능" 
                          bgColor="#e8eaf6" 
                          onClick={() => setModal({ type: 'l3Function', procId: proc.id, l3Id: we.id, title: '작업요소 기능 선택', itemCode: 'B2', workElementName: we.name })} 
                          onDoubleClickEdit={(newValue) => handleInlineEditFunction(proc.id, we.id, f.id, newValue)}
                        />
                      </td>
                      <td style={{ border: `1px solid ${COLORS.line}`, borderRight: '3px solid #ff9800', padding: '0' }}>
                        <SelectableCell value="" placeholder="공정특성 선택" bgColor="#fff" onClick={() => setModal({ type: 'l3ProcessChar', procId: proc.id, l3Id: we.id, funcId: f.id, title: '공정특성 선택', itemCode: 'B3', workElementName: we.name })} />
                      </td>
                      <td style={{ border: `1px solid ${COLORS.line}`, borderLeft: 'none', padding: '4px', textAlign: 'center', background: '#fff3e0' }}>
                        <SpecialCharBadge value="" onClick={() => {}} />
                      </td>
                    </tr>
                  );
                  isFirstProcRow = false;
                  return [row];
                }
                
                // 기능에 공정특성이 있는 경우
                return chars.map((c, cIdx) => {
                  const row = (
                    <tr key={c.id}>
                      {isFirstProcRow && (
                        <td rowSpan={procRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#e3f2fd', fontSize: '10px', fontWeight: 700, verticalAlign: 'middle' }}>
                          {proc.no}. {proc.name}
                        </td>
                      )}
                      {fIdx === 0 && cIdx === 0 && (
                        <>
                          <td rowSpan={weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', fontSize: '10px', background: '#e3f2fd', fontWeight: 500, verticalAlign: 'middle' }}>
                            {we.m4}
                          </td>
                          <td rowSpan={weRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', background: '#e3f2fd', fontWeight: 600, fontSize: '11px', verticalAlign: 'middle' }}>
                            {we.name}
                          </td>
                        </>
                      )}
                      {cIdx === 0 && (
                        <td rowSpan={funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', verticalAlign: 'middle' }}>
                          <SelectableCell 
                            value={f.name} 
                            placeholder="작업요소기능" 
                            bgColor="#e8eaf6" 
                            onClick={() => setModal({ type: 'l3Function', procId: proc.id, l3Id: we.id, title: '작업요소 기능 선택', itemCode: 'B2', workElementName: we.name })} 
                            onDoubleClickEdit={(newValue) => handleInlineEditFunction(proc.id, we.id, f.id, newValue)}
                          />
                        </td>
                      )}
                      <td style={{ border: `1px solid ${COLORS.line}`, borderRight: '3px solid #ff9800', padding: '0' }}>
                        <SelectableCell 
                          value={c.name} 
                          placeholder="공정특성" 
                          bgColor="#fff" 
                          onClick={() => setModal({ type: 'l3ProcessChar', procId: proc.id, l3Id: we.id, funcId: f.id, title: '공정특성 선택', itemCode: 'B3', workElementName: we.name })} 
                          onDoubleClickEdit={(newValue) => handleInlineEditProcessChar(proc.id, we.id, f.id, c.id, newValue)}
                        />
                      </td>
                      <td style={{ border: `1px solid ${COLORS.line}`, borderLeft: 'none', padding: '4px', textAlign: 'center', background: '#fff3e0' }}>
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
