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
  }, [modal, setState, setDirty]);

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
          <col style={{ width: '150px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '200px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th colSpan={3} style={{ background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              2단계 구조분석
            </th>
            <th colSpan={2} style={{ background: '#303f9f', color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
              3단계 : 3L 작업요소 기능분석
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th colSpan={3} style={{ background: '#42a5f5', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 작업요소 (4M)
            </th>
            <th colSpan={2} style={{ background: '#5c6bc0', color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
              3. 작업요소 기능/공정특성
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
            </th>
            <th style={{ background: '#c5cae9', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              공정특성
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
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="공정특성 선택" bgColor="#e8eaf6" onClick={() => {}} />
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
                    <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                      <SelectableCell value="" placeholder="공정특성 선택" bgColor="#e8eaf6" onClick={() => {}} />
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
                        <SelectableCell value={f.name} placeholder="작업요소기능" bgColor="#e8eaf6" onClick={() => setModal({ type: 'l3Function', procId: proc.id, l3Id: we.id, title: '작업요소 기능 선택', itemCode: 'B2', workElementName: we.name })} />
                      </td>
                      <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                        <SelectableCell value="" placeholder="공정특성 선택" bgColor="#fff" onClick={() => setModal({ type: 'l3ProcessChar', procId: proc.id, l3Id: we.id, funcId: f.id, title: '공정특성 선택', itemCode: 'B3', workElementName: we.name })} />
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
                          <SelectableCell value={f.name} placeholder="작업요소기능" bgColor="#e8eaf6" onClick={() => setModal({ type: 'l3Function', procId: proc.id, l3Id: we.id, title: '작업요소 기능 선택', itemCode: 'B2', workElementName: we.name })} />
                        </td>
                      )}
                      <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                        <SelectableCell value={c.name} placeholder="공정특성" bgColor="#fff" onClick={() => setModal({ type: 'l3ProcessChar', procId: proc.id, l3Id: we.id, funcId: f.id, title: '공정특성 선택', itemCode: 'B3', workElementName: we.name })} />
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
    </div>
  );
}
