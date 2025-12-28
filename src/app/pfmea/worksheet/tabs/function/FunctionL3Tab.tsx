/**
 * @file FunctionL3Tab.tsx
 * @description 작업요소(L3) 수준 기능 분석 - 독립 워크시트 (원자성 확보)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FunctionTabProps } from './types';
import { COLORS, uid } from '../../constants';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';

export default function FunctionL3Tab({ state, setState, setDirty }: FunctionTabProps) {
  const [modal, setModal] = useState<{ type: string; procId: string; l3Id: string; title: string; itemCode: string; processNo?: string } | null>(null);

  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal) return;
    
    setState(prev => {
      const newState = { ...prev };
      const { type, procId, l3Id } = modal;

      newState.l2 = newState.l2.map(proc => {
        if (proc.id !== procId) return proc;
        
        return {
          ...proc,
          l3: proc.l3.map(we => {
            if (we.id !== l3Id) return we;
            
            if (type === 'l3Function') {
              const currentFuncs = we.functions;
              return {
                ...we,
                functions: selectedValues.map(val => {
                  const existing = currentFuncs.find(f => f.name === val);
                  return existing || { id: uid(), name: val };
                })
              };
            } else if (type === 'l3ProcessChar') {
              const currentChar = we.processChars;
              return {
                ...we,
                processChars: selectedValues.map(val => {
                  const existing = currentChar.find(c => c.name === val);
                  return existing || { id: uid(), name: val };
                })
              };
            } else if (type === 'l3FailureCause') {
              return { ...we, failureCause: selectedValues.join(', ') };
            }
            return we;
          })
        };
      });
      
      return newState;
    });
    
    setDirty(true);
    setModal(null);
  }, [modal, setState, setDirty]);

  return (
    <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#303f9f' }}>
          3L. 작업요소 기능 및 공정특성 정의 (고장원인 FC의 근거 데이터)
        </h3>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '150px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '250px' }} />
          <col style={{ width: '200px' }} />
          <col style={{ width: '200px' }} />
        </colgroup>
        <thead>
          <tr style={{ background: '#303f9f', color: 'white' }}>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>소속 공정</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>4M</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>작업요소</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>작업요소 기능 🔍</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>공정 특성 🔍</th>
            <th style={{ border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '11px' }}>고장원인 (FC) 🔍</th>
          </tr>
        </thead>
        <tbody>
          {state.l2.map(proc => (
            proc.l3.map((we, idx) => (
              <tr key={we.id}>
                {idx === 0 && (
                  <td rowSpan={proc.l3.length} style={{ border: `1px solid ${COLORS.line}`, padding: '8px', textAlign: 'center', background: '#f8f9fa', fontSize: '10px', fontWeight: 500 }}>
                    {proc.no} {proc.name}
                  </td>
                )}
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', fontSize: '10px', background: '#fff' }}>{we.m4}</td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '8px', background: '#e8eaf6', fontWeight: 600, fontSize: '11px' }}>{we.name}</td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell 
                    value={we.functions.map(f => f.name).join(', ')} 
                    placeholder="작업요소 기능 선택" 
                    bgColor="#e8eaf6" 
                    onClick={() => setModal({ type: 'l3Function', procId: proc.id, l3Id: we.id, title: '작업요소 기능 선택', itemCode: 'B2', processNo: proc.no })} 
                  />
                </td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell 
                    value={we.processChars.map(c => c.name).join(', ')} 
                    placeholder="공정특성 선택" 
                    bgColor="#e8eaf6" 
                    onClick={() => setModal({ type: 'l3ProcessChar', procId: proc.id, l3Id: we.id, title: '공정특성 선택', itemCode: 'B3', processNo: proc.no })} 
                  />
                </td>
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell 
                    value={we.failureCause || ''} 
                    placeholder="고장원인(FC) 선택" 
                    bgColor="#fff" 
                    onClick={() => setModal({ type: 'l3FailureCause', procId: proc.id, l3Id: we.id, title: '고장원인(FC) 선택', itemCode: 'B4', processNo: proc.no })} 
                  />
                </td>
              </tr>
            ))
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
            const proc = state.l2.find(p => p.id === modal.procId);
            const we = proc?.l3.find(w => w.id === modal.l3Id);
            if (!we) return [];
            if (modal.type === 'l3Function') return we.functions.map(f => f.name);
            if (modal.type === 'l3ProcessChar') return we.processChars.map(c => c.name);
            if (modal.type === 'l3FailureCause') return we.failureCause ? [we.failureCause] : [];
            return [];
          })()}
        />
      )}
    </div>
  );
}
