/**
 * @file FunctionL2Tab.tsx
 * @description 메인공정(L2) 수준 기능 분석 - 독립 워크시트 (원자성 확보)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FunctionTabProps } from './types';
import { COLORS, uid } from '../../constants';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';

export default function FunctionL2Tab({ state, setState, setDirty }: FunctionTabProps) {
  const [modal, setModal] = useState<{ type: string; id: string; title: string; itemCode: string; processNo?: string } | null>(null);

  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    setState(prev => {
      const newState = { ...prev };
      const { type, id } = modal;

      newState.l2 = newState.l2.map(proc => {
        if (proc.id !== id) return proc;
        
        if (type === 'l2Function') {
          const currentFuncs = proc.functions;
          return {
            ...proc,
            functions: selectedValues.map(val => {
              const existing = currentFuncs.find(f => f.name === val);
              return existing || { id: uid(), name: val };
            })
          };
        } else if (type === 'l2ProductChar') {
          const currentChar = proc.productChars;
          return {
            ...proc,
            productChars: selectedValues.map(val => {
              const existing = currentChar.find(c => c.name === val);
              return existing || { id: uid(), name: val };
            })
          };
        } else if (type === 'l2FailureMode') {
          return { ...proc, failureMode: selectedValues.join(', ') };
        }
        return proc;
      });
      
      return newState;
    });
    
    setDirty(true);
    setModal(null);
  }, [modal, setState, setDirty]);

  return (
    <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#512da8' }}>
          2L. 메인공정 기능 및 제품특성 정의 (고장형태 FM의 근거 데이터)
        </h3>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '150px' }} />
          <col style={{ width: '250px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '200px' }} />
        </colgroup>
        <thead>
          <tr style={{ background: '#512da8', color: 'white' }}>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>공정NO+공정명</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>메인공정 기능 🔍</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>제품 특성 🔍</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>고장형태 (FM) 🔍</th>
          </tr>
        </thead>
        <tbody>
          {state.l2.map((proc) => (
            <tr key={proc.id}>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '10px', textAlign: 'center', background: '#ede7f6', fontWeight: 600, fontSize: '11px' }}>
                {proc.no} {proc.name}
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell 
                  value={proc.functions.map(f => f.name).join(', ')} 
                  placeholder="공정기능 선택" 
                  bgColor="#ede7f6" 
                  onClick={() => setModal({ type: 'l2Function', id: proc.id, title: '메인공정 기능 선택', itemCode: 'A3', processNo: proc.no })} 
                />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell 
                  value={proc.productChars.map(c => c.name).join(', ')} 
                  placeholder="제품특성 선택" 
                  bgColor="#ede7f6" 
                  onClick={() => setModal({ type: 'l2ProductChar', id: proc.id, title: '제품특성 선택', itemCode: 'A4', processNo: proc.no })} 
                />
              </td>
              <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                <SelectableCell 
                  value={proc.failureMode || ''} 
                  placeholder="고장형태(FM) 선택" 
                  bgColor="#fff" 
                  onClick={() => setModal({ type: 'l2FailureMode', id: proc.id, title: '고장형태(FM) 선택', itemCode: 'A5', processNo: proc.no })} 
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <DataSelectModal
          isOpen={!!modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          title={modal.title}
          itemCode={modal.itemCode}
          processNo={modal.processNo}
          currentValues={(() => {
            const proc = state.l2.find(p => p.id === modal.id);
            if (!proc) return [];
            if (modal.type === 'l2Function') return proc.functions.map(f => f.name);
            if (modal.type === 'l2ProductChar') return proc.productChars.map(c => c.name);
            if (modal.type === 'l2FailureMode') return proc.failureMode ? [proc.failureMode] : [];
            return [];
          })()}
        />
      )}
    </div>
  );
}
