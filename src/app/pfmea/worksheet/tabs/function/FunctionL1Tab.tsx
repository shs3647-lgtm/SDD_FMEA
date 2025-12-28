/**
 * @file FunctionL1Tab.tsx
 * @description 완제품(L1) 기능 분석 - 3행 헤더 구조 (구조분석 + 기능분석)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FunctionTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid } from '../../constants';

export default function FunctionL1Tab({ state, setState, setDirty, saveToLocalStorage }: FunctionTabProps) {
  const [modal, setModal] = useState<{ type: string; id: string; title: string; itemCode: string } | null>(null);

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
  }, [modal, setState, setDirty]);

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
        <colgroup>
          <col style={{ width: '150px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '250px' }} />
          <col style={{ width: '250px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            <th 
              style={{ 
                background: '#1976d2', color: 'white', 
                border: `1px solid ${COLORS.line}`, padding: '8px', 
                fontSize: '12px', fontWeight: 800, textAlign: 'center'
              }}
            >
              2단계 구조분석
            </th>
            <th 
              colSpan={3}
              style={{ 
                background: '#7b1fa2', color: 'white', 
                border: `1px solid ${COLORS.line}`, padding: '8px', 
                fontSize: '12px', fontWeight: 800, textAlign: 'center'
              }}
            >
              3단계 : 1L 완제품 공정 기능분석
            </th>
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            <th 
              style={{ 
                background: '#42a5f5', color: 'white', 
                border: `1px solid ${COLORS.line}`, padding: '6px', 
                fontSize: '11px', fontWeight: 700, textAlign: 'center'
              }}
            >
              1. 완제품 공정명
            </th>
            <th 
              colSpan={3}
              style={{ 
                background: '#9c27b0', color: 'white', 
                border: `1px solid ${COLORS.line}`, padding: '6px', 
                fontSize: '11px', fontWeight: 700, textAlign: 'center'
              }}
            >
              1. 완제품 공정기능/요구사항
            </th>
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr style={{ background: '#e3f2fd' }}>
            <th style={{ background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              완제품 공정명
            </th>
            <th style={{ background: '#e1bee7', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              구분
            </th>
            <th style={{ background: '#e1bee7', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              완제품기능
            </th>
            <th style={{ background: '#e1bee7', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '10px', fontWeight: 700 }}>
              요구사항
            </th>
          </tr>
        </thead>
        
        <tbody>
          {state.l1.types.length === 0 ? (
            <tr>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700 }}>
                {state.l1.name || '(구조분석에서 입력)'}
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="구분 선택" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="기능 선택" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Function', id: '', title: '완제품 기능 선택', itemCode: 'C2' })} />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="요구사항 선택" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Requirement', id: '', title: '요구사항 선택', itemCode: 'C3' })} />
              </td>
            </tr>
          ) : state.l1.types.map((t, tIdx) => {
            const typeRowSpan = t.functions.length === 0 ? 1 : t.functions.reduce((a, f) => a + Math.max(1, f.requirements.length), 0);
            
            return t.functions.length === 0 ? (
              <tr key={t.id}>
                {tIdx === 0 && (
                  <td rowSpan={totalRows} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                    {state.l1.name || '(구조분석에서 입력)'}
                  </td>
                )}
                <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', background: '#f3e5f5', verticalAlign: 'middle' }}>
                  <SelectableCell value={t.name} placeholder="구분" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                </td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell value="" placeholder="기능 선택" bgColor="#fce4ec" onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} />
                </td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell value="" placeholder="요구사항 선택" bgColor="#fce4ec" onClick={() => setModal({ type: 'l1Requirement', id: '', title: '요구사항 선택', itemCode: 'C3' })} />
                </td>
              </tr>
            ) : t.functions.map((f, fIdx) => {
              const funcRowSpan = Math.max(1, f.requirements.length);
              
              return f.requirements.length === 0 ? (
                <tr key={f.id}>
                  {tIdx === 0 && fIdx === 0 && (
                    <td rowSpan={totalRows} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                      {state.l1.name || '(구조분석에서 입력)'}
                    </td>
                  )}
                  {fIdx === 0 && (
                    <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', background: '#f3e5f5', verticalAlign: 'middle' }}>
                      <SelectableCell value={t.name} placeholder="구분" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                    </td>
                  )}
                  <td rowSpan={funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', verticalAlign: 'middle' }}>
                    <SelectableCell value={f.name} placeholder="기능" bgColor="#fce4ec" onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} />
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value="" placeholder="요구사항 선택" bgColor="#fff" onClick={() => setModal({ type: 'l1Requirement', id: f.id, title: '요구사항 선택', itemCode: 'C3' })} />
                  </td>
                </tr>
              ) : f.requirements.map((r, rIdx) => (
                <tr key={r.id}>
                  {tIdx === 0 && fIdx === 0 && rIdx === 0 && (
                    <td rowSpan={totalRows} style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, verticalAlign: 'middle' }}>
                      {state.l1.name || '(구조분석에서 입력)'}
                    </td>
                  )}
                  {fIdx === 0 && rIdx === 0 && (
                    <td rowSpan={typeRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', background: '#f3e5f5', verticalAlign: 'middle' }}>
                      <SelectableCell value={t.name} placeholder="구분" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                    </td>
                  )}
                  {rIdx === 0 && (
                    <td rowSpan={funcRowSpan} style={{ border: `1px solid ${COLORS.line}`, padding: '0', verticalAlign: 'middle' }}>
                      <SelectableCell value={f.name} placeholder="기능" bgColor="#fce4ec" onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} />
                    </td>
                  )}
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value={r.name} placeholder="요구사항" bgColor="#fff" onClick={() => setModal({ type: 'l1Requirement', id: f.id, title: '요구사항 선택', itemCode: 'C3' })} />
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
