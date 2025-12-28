/**
 * @file FunctionL1Tab.tsx
 * @description 완제품(L1) 수준 기능 분석 - 독립 워크시트 (원자성 확보)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FunctionTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { COLORS, uid } from '../../constants';

export default function FunctionL1Tab({ state, setState, setDirty }: FunctionTabProps) {
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
      else if (type === 'l1FailureEffect') {
        newState.l1.types = newState.l1.types.map(t => ({
          ...t,
          functions: t.functions.map(f => ({
            ...f,
            requirements: f.requirements.map(r => {
              if (r.id !== id) return r;
              return { ...r, failureEffect: selectedValues.join(', ') };
            })
          }))
        }));
      }
      else if (type === 'l1Severity') {
        newState.l1.types = newState.l1.types.map(t => ({
          ...t,
          functions: t.functions.map(f => ({
            ...f,
            requirements: f.requirements.map(r => {
              if (r.id !== id) return r;
              return { ...r, severity: parseInt(selectedValues[0]) || undefined };
            })
          }))
        }));
      }
      
      return newState;
    });
    
    setDirty(true);
    setModal(null);
  }, [modal, setState, setDirty]);

  return (
    <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#7b1fa2' }}>
          1L. 완제품 기능 및 요구사항 정의 (고장영향 FE의 근거 데이터)
        </h3>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '120px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '220px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '60px' }} />
        </colgroup>
        <thead>
          <tr style={{ background: '#7b1fa2', color: 'white' }}>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>완제품명</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>구분 🔍</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>완제품 기능 🔍</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>요구사항 🔍</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>고장영향 (FE) 🔍</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>심각도(S)</th>
          </tr>
        </thead>
        <tbody>
          {state.l1.types.length === 0 ? (
            <tr>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '12px', textAlign: 'center', background: '#f3e5f5', fontWeight: 700 }}>{state.l1.name || '(완제품명 미입력)'}</td>
              <td colSpan={5} style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell value="" placeholder="구분 선택" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
              </td>
            </tr>
          ) : state.l1.types.map((t, tIdx) => {
            return t.functions.length === 0 ? (
              <tr key={t.id}>
                {tIdx === 0 && (
                  <td rowSpan={state.l1.types.reduce((acc, curr) => acc + Math.max(1, curr.functions.length), 0)} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#f3e5f5', fontWeight: 700 }}>{state.l1.name}</td>
                )}
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell value={t.name} placeholder="구분" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                </td>
                <td colSpan={4} style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell value="" placeholder="완제품 기능 선택" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} />
                </td>
              </tr>
            ) : t.functions.map((f, fIdx) => {
              return f.requirements.length === 0 ? (
                <tr key={f.id}>
                  {tIdx === 0 && fIdx === 0 && (
                    <td rowSpan={state.l1.types.reduce((acc, curr) => acc + Math.max(1, curr.functions.length), 0)} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#f3e5f5', fontWeight: 700 }}>{state.l1.name}</td>
                  )}
                  {fIdx === 0 && (
                    <td rowSpan={t.functions.length} style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                      <SelectableCell value={t.name} placeholder="구분" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                    </td>
                  )}
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value={f.name} placeholder="기능" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} />
                  </td>
                  <td colSpan={3} style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value="" placeholder="요구사항 선택" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Requirement', id: f.id, title: '요구사항 선택', itemCode: 'C3' })} />
                  </td>
                </tr>
              ) : f.requirements.map((r, rIdx) => (
                <tr key={r.id}>
                  {tIdx === 0 && fIdx === 0 && rIdx === 0 && (
                    <td rowSpan={state.l1.types.reduce((acc, curr) => acc + curr.functions.reduce((a, c) => a + Math.max(1, c.requirements.length), 0), 0)} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#f3e5f5', fontWeight: 700 }}>{state.l1.name}</td>
                  )}
                  {fIdx === 0 && rIdx === 0 && (
                    <td rowSpan={t.functions.reduce((acc, curr) => acc + Math.max(1, curr.requirements.length), 0)} style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                      <SelectableCell value={t.name} placeholder="구분" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Type', id: state.l1.id, title: '구분 선택', itemCode: 'C1' })} />
                    </td>
                  )}
                  {rIdx === 0 && (
                    <td rowSpan={f.requirements.length} style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                      <SelectableCell value={f.name} placeholder="기능" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Function', id: t.id, title: '완제품 기능 선택', itemCode: 'C2' })} />
                    </td>
                  )}
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value={r.name} placeholder="요구사항" bgColor="#f3e5f5" onClick={() => setModal({ type: 'l1Requirement', id: f.id, title: '요구사항 선택', itemCode: 'C3' })} />
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value={r.failureEffect || ''} placeholder="고장영향 선택" bgColor="#fff" onClick={() => setModal({ type: 'l1FailureEffect', id: r.id, title: '고장영향(FE) 선택', itemCode: 'C4' })} />
                  </td>
                  <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                    <SelectableCell value={r.severity?.toString() || ''} placeholder="S" bgColor="#fff" onClick={() => setModal({ type: 'l1Severity', id: r.id, title: '심각도(S) 선택', itemCode: 'S1' })} />
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
          title={modal.title}
          itemCode={modal.itemCode}
          singleSelect={modal.type === 'l1Severity'}
          currentValues={(() => {
            if (modal.type === 'l1Type') return state.l1.types.map(t => t.name);
            if (modal.type === 'l1Function') return state.l1.types.find(t => t.id === modal.id)?.functions.map(f => f.name) || [];
            if (modal.type === 'l1Requirement') {
              for (const t of state.l1.types) {
                const f = t.functions.find(f => f.id === modal.id);
                if (f) return f.requirements.map(r => r.name);
              }
            }
            if (modal.type === 'l1FailureEffect') {
              for (const t of state.l1.types) {
                for (const f of t.functions) {
                  const r = f.requirements.find(r => r.id === modal.id);
                  if (r) return r.failureEffect ? [r.failureEffect] : [];
                }
              }
            }
            if (modal.type === 'l1Severity') {
              for (const t of state.l1.types) {
                for (const f of t.functions) {
                  const r = f.requirements.find(r => r.id === modal.id);
                  if (r) return r.severity ? [r.severity.toString()] : [];
                }
              }
            }
            return [];
          })()}
        />
      )}
    </div>
  );
}
