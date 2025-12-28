/**
 * @file FailureL1Tab.tsx
 * @description 1L 고장영향(FE) 분석 - 기능분석 자동연동
 * 구조: 완제품 공정명 | 구분(자동) | 요구사항 | 고장영향(FE) | 심각도
 * 기능분석에서 입력한 요구사항을 가져와서 고장영향 분석
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FailureTabProps } from './types';
import SelectableCell from '@/components/worksheet/SelectableCell';
import DataSelectModal from '@/components/modals/DataSelectModal';
import SODSelectModal from '@/components/modals/SODSelectModal';
import { COLORS, uid } from '../../constants';

// 색상 정의
const STEP_COLORS = {
  structure: { header1: '#1976d2', header2: '#42a5f5', header3: '#bbdefb', cell: '#e3f2fd' },
  function: { header1: '#1b5e20', header2: '#2e7d32', header3: '#a5d6a7', cell: '#c8e6c9' },
  failure: { header1: '#c62828', header2: '#e53935', header3: '#ffcdd2', cell: '#ffebee' },
};

// 기능분석에서 가져온 요구사항 데이터
interface RequirementFromFunction {
  id: string;
  name: string;
  typeName: string; // 구분 (Your Plant / Ship to Plant / User)
  funcName: string; // 완제품 기능
}

// 고장영향 데이터
interface FailureEffect {
  id: string;
  reqId: string; // 연결된 요구사항 ID
  effect: string; // 고장영향
  severity?: number; // 심각도
}

export default function FailureL1Tab({ state, setState, setDirty, saveToLocalStorage }: FailureTabProps) {
  const [modal, setModal] = useState<{ 
    type: string; 
    effectId?: string;
    reqId?: string;
    title: string; 
    itemCode: string 
  } | null>(null);

  // SOD 모달 상태
  const [sodModal, setSODModal] = useState<{
    effectId: string;
    currentValue?: number;
    scope?: 'Your Plant' | 'Ship to Plant' | 'User';
  } | null>(null);

  // 확정 상태
  const isConfirmed = state.failureL1Confirmed || false;

  // 누락 건수 계산 (state.l1.failureScopes 사용)
  const missingCount = useMemo(() => {
    let count = 0;
    const effects = state.l1?.failureScopes || [];
    // 요구사항은 있는데 고장영향이 없는 경우
    const types = state.l1?.types || [];
    types.forEach((type: any) => {
      (type.functions || []).forEach((func: any) => {
        (func.requirements || []).forEach((req: any) => {
          const hasEffect = effects.some((e: any) => e.reqId === req.id && e.effect);
          if (!hasEffect) count++;
        });
      });
    });
    return count;
  }, [state.l1?.types, state.l1?.failureScopes]);

  // 확정 핸들러
  const handleConfirm = useCallback(() => {
    if (missingCount > 0) {
      alert(`누락된 항목이 ${missingCount}건 있습니다.\n먼저 입력을 완료해주세요.`);
      return;
    }
    setState(prev => ({ ...prev, failureL1Confirmed: true }));
    saveToLocalStorage?.();
    alert('1L 고장영향 분석이 확정되었습니다.');
  }, [missingCount, setState, saveToLocalStorage]);

  // 수정 핸들러
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, failureL1Confirmed: false }));
  }, [setState]);

  // 기능분석 L1에서 요구사항 목록 가져오기 (구분 포함)
  // 요구사항이 없는 구분/기능도 표시
  const requirementsFromFunction: RequirementFromFunction[] = useMemo(() => {
    const reqs: RequirementFromFunction[] = [];
    const types = state.l1?.types || [];
    
    types.forEach((type: any) => {
      const functions = type.functions || [];
      
      if (functions.length === 0) {
        // 구분만 있고 기능이 없는 경우
        reqs.push({
          id: `type_${type.id}`,
          name: '(기능분석에서 기능 입력 필요)',
          typeName: type.name,
          funcName: ''
        });
      } else {
        functions.forEach((func: any) => {
          const requirements = func.requirements || [];
          
          if (requirements.length === 0) {
            // 기능은 있지만 요구사항이 없는 경우
            reqs.push({
              id: `func_${func.id}`,
              name: '(기능분석에서 요구사항 입력 필요)',
              typeName: type.name,
              funcName: func.name
            });
          } else {
            requirements.forEach((req: any) => {
              reqs.push({
                id: req.id,
                name: req.name,
                typeName: type.name,
                funcName: func.name
              });
            });
          }
        });
      }
    });
    
    return reqs;
  }, [state.l1?.types]);

  // 고장영향 데이터 (localStorage에서)
  const failureEffects: FailureEffect[] = useMemo(() => {
    return (state.l1.failureScopes || []).map((s: any) => ({
      id: s.id,
      reqId: s.reqId || '',
      effect: s.effect || '',
      severity: s.severity
    }));
  }, [state.l1.failureScopes]);

  // 평탄화된 행 데이터 (기능분석 요구사항 기준)
  const flatRows = useMemo(() => {
    const rows: {
      reqId: string;
      reqName: string;
      typeName: string; // 구분 (자동)
      funcName: string; // 완제품 기능
      effects: FailureEffect[];
      totalRowSpan: number;
    }[] = [];

    if (requirementsFromFunction.length === 0) {
      // 기능분석 데이터 없음
      return [];
    }

    requirementsFromFunction.forEach(req => {
      const effects = failureEffects.filter(e => e.reqId === req.id);
      rows.push({
        reqId: req.id,
        reqName: req.name,
        typeName: req.typeName,
        funcName: req.funcName,
        effects: effects.length > 0 ? effects : [{ id: '', reqId: req.id, effect: '', severity: undefined }],
        totalRowSpan: Math.max(1, effects.length)
      });
    });

    return rows;
  }, [requirementsFromFunction, failureEffects]);

  // 총 행 수
  const totalRows = flatRows.reduce((acc, row) => acc + row.totalRowSpan, 0) || 1;


  // 고장영향 선택 저장 (각 값을 개별 행으로 추가)
  const handleSave = useCallback((selectedValues: string[]) => {
    if (!modal || !modal.reqId) return;
    
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      if (!newState.l1.failureScopes) newState.l1.failureScopes = [];
      
      // 해당 요구사항의 기존 고장영향 제거
      newState.l1.failureScopes = newState.l1.failureScopes.filter(
        (s: any) => s.reqId !== modal.reqId
      );
      
      // 선택된 각 값을 개별 행으로 추가
      selectedValues.forEach(val => {
        newState.l1.failureScopes.push({
          id: uid(),
          reqId: modal.reqId,
          effect: val,
          severity: undefined
        });
      });
      
      return newState;
    });
    
    setDirty(true);
    setModal(null);
    if (saveToLocalStorage) setTimeout(() => saveToLocalStorage(), 100);
  }, [modal, setState, setDirty, saveToLocalStorage]);

  // 삭제 핸들러
  const handleDelete = useCallback((deletedValues: string[]) => {
    // 필요시 구현
  }, []);

  // 심각도 업데이트
  const updateSeverity = useCallback((effectId: string, severity: number | undefined) => {
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState.l1.failureScopes = (newState.l1.failureScopes || []).map((s: any) => {
        if (s.id !== effectId) return s;
        return { ...s, severity };
      });
      return newState;
    });
    setDirty(true);
    if (saveToLocalStorage) saveToLocalStorage();
  }, [setState, setDirty, saveToLocalStorage]);

  // 행 삭제
  const deleteRow = useCallback((effectId: string) => {
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState.l1.failureScopes = (newState.l1.failureScopes || []).filter((s: any) => s.id !== effectId);
      return newState;
    });
    setDirty(true);
    if (saveToLocalStorage) setTimeout(() => saveToLocalStorage(), 100);
  }, [setState, setDirty, saveToLocalStorage]);

  // 현재 모달의 currentValues (해당 요구사항의 모든 고장영향)
  const getCurrentValues = useCallback(() => {
    if (!modal || !modal.reqId) return [];
    // 해당 요구사항의 모든 고장영향 반환
    return failureEffects
      .filter(e => e.reqId === modal.reqId && e.effect)
      .map(e => e.effect);
  }, [modal, failureEffects]);

  // 구분별 rowSpan 계산을 위한 그룹핑
  const typeGroups = useMemo(() => {
    const groups: { typeName: string; rows: typeof flatRows; rowSpan: number }[] = [];
    const typeMap = new Map<string, typeof flatRows>();
    
    flatRows.forEach(row => {
      if (!typeMap.has(row.typeName)) {
        typeMap.set(row.typeName, []);
      }
      typeMap.get(row.typeName)!.push(row);
    });
    
    typeMap.forEach((rows, typeName) => {
      const rowSpan = rows.reduce((acc, r) => acc + r.totalRowSpan, 0);
      groups.push({ typeName, rows, rowSpan });
    });
    
    return groups;
  }, [flatRows]);

  // 구분별 번호 생성 (Y1, Y2, S1, S2, U1, U2...)
  const getFeNo = useCallback((typeName: string, index: number): string => {
    const prefix = typeName === 'Your Plant' ? 'Y' : typeName === 'Ship to Plant' ? 'S' : typeName === 'User' ? 'U' : 'X';
    return `${prefix}${index + 1}`;
  }, []);

  // 렌더링할 행 데이터 생성 (완제품 공정명은 구분별로 1:1 매칭)
  const renderRows = useMemo(() => {
    const rows: {
      key: string;
      showProduct: boolean;
      productRowSpan: number;
      showType: boolean;
      typeRowSpan: number;
      typeName: string;
      feNo: string; // 번호 추가 (Y1, S1, U1...)
      showReq: boolean;
      reqRowSpan: number;
      reqName: string;
      reqId: string;
      effectId: string;
      effect: string;
      severity?: number;
    }[] = [];

    let typeShown: Record<string, boolean> = {};
    // 구분별 카운터
    const typeCounters: Record<string, number> = { 'Your Plant': 0, 'Ship to Plant': 0, 'User': 0 };

    typeGroups.forEach((group) => {
      let productShownInGroup = false;
      
      group.rows.forEach((reqRow) => {
        reqRow.effects.forEach((eff, eIdx) => {
          const isFirstInType = !typeShown[group.typeName];
          const isFirstInReq = eIdx === 0;

          // 유효한 고장영향이 있으면 번호 증가
          let feNo = '';
          if (eff.id && eff.effect) {
            const currentCount = typeCounters[group.typeName] || 0;
            feNo = getFeNo(group.typeName, currentCount);
            typeCounters[group.typeName] = currentCount + 1;
          }

          rows.push({
            key: eff.id || `empty-${reqRow.reqId}-${eIdx}`,
            // 완제품 공정명: 구분별로 1:1 매칭 (각 구분 그룹의 첫 행에만 표시)
            showProduct: isFirstInType,
            productRowSpan: group.rowSpan, // 해당 구분의 행 수만큼 span
            showType: isFirstInType,
            typeRowSpan: group.rowSpan,
            typeName: group.typeName,
            feNo, // 번호 추가
            showReq: isFirstInReq,
            reqRowSpan: reqRow.totalRowSpan,
            reqName: reqRow.reqName,
            reqId: reqRow.reqId,
            effectId: eff.id,
            effect: eff.effect,
            severity: eff.severity
          });

          typeShown[group.typeName] = true;
        });
      });
    });

    return rows;
  }, [typeGroups, getFeNo]);

  return (
    <div style={{ padding: '0', overflow: 'auto', height: '100%' }}>
      {/* 안내 메시지 */}
      {requirementsFromFunction.length === 0 && (
        <div style={{ padding: '20px', background: '#fff3e0', borderBottom: `1px solid ${COLORS.line}`, textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#e65100', fontWeight: 600 }}>
            ⚠️ 기능분석(L1)에서 요구사항을 먼저 입력해주세요. 입력된 요구사항이 여기에 자동으로 표시됩니다.
          </span>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '180px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '180px' }} />
          <col style={{ width: '350px' }} />
          <col style={{ width: '60px' }} />
          <col style={{ width: '50px' }} />
        </colgroup>
        
        {/* 3행 헤더 구조 */}
        <thead>
          <tr>
            <th style={{ background: STEP_COLORS.structure.header1, color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
              P-FMEA 구조 분석(2단계)
            </th>
            <th colSpan={2} style={{ background: STEP_COLORS.function.header1, color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
              P-FMEA 기능 분석(3단계)
            </th>
            <th colSpan={3} style={{ background: STEP_COLORS.failure.header1, color: 'white', border: `1px solid ${COLORS.line}`, padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <span>4단계 : 1L 고장영향(FE) 분석</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {isConfirmed ? (
                    <span style={{ background: '#4caf50', color: 'white', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700 }}>✓ 확정됨</span>
                  ) : (
                    <button type="button" onClick={handleConfirm} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>확정</button>
                  )}
                  <span style={{ background: missingCount > 0 ? '#f44336' : '#4caf50', color: 'white', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700 }}>누락 {missingCount}건</span>
                  {isConfirmed && (
                    <button type="button" onClick={handleEdit} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>수정</button>
                  )}
                </div>
              </div>
            </th>
          </tr>
          
          <tr>
            <th style={{ background: STEP_COLORS.structure.header2, color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              1. 완제품 공정명
            </th>
            <th colSpan={2} style={{ background: STEP_COLORS.function.header2, color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              1. 완제품 공정기능/요구사항
            </th>
            <th colSpan={4} style={{ background: STEP_COLORS.failure.header2, color: 'white', border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              1. 고장영향(FE) / 심각도(S)
            </th>
          </tr>
          
          <tr>
            <th style={{ background: STEP_COLORS.structure.header3, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              완제품 공정명
            </th>
            <th style={{ background: STEP_COLORS.function.header3, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              구분
            </th>
            <th style={{ background: STEP_COLORS.function.header3, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              No
            </th>
            <th style={{ background: STEP_COLORS.function.header3, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              요구사항
            </th>
            <th style={{ background: STEP_COLORS.failure.header3, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              고장영향(FE)
            </th>
            <th style={{ background: STEP_COLORS.failure.header3, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              S
            </th>
            <th style={{ background: STEP_COLORS.failure.header3, border: `1px solid ${COLORS.line}`, padding: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
              삭제
            </th>
          </tr>
        </thead>
        
        <tbody>
          {renderRows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ border: `1px solid ${COLORS.line}`, padding: '30px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
                기능분석(L1)에서 요구사항을 입력하면 여기에 자동으로 표시됩니다.
              </td>
            </tr>
          ) : (
            renderRows.map((row) => (
              <tr key={row.key}>
                {/* 완제품 공정명 */}
                {row.showProduct && (
                  <td 
                    rowSpan={row.productRowSpan} 
                    style={{ 
                      border: `1px solid ${COLORS.line}`, 
                      padding: '10px', 
                      textAlign: 'center', 
                      background: STEP_COLORS.structure.cell, 
                      fontWeight: 700, 
                      verticalAlign: 'middle',
                      fontSize: '12px'
                    }}
                  >
                    {state.l1.name || '(구조분석에서 입력)'}
                  </td>
                )}
                
                {/* 구분 (자동) - 구분별 색상 적용 */}
                {row.showType && (
                  <td 
                    rowSpan={row.typeRowSpan} 
                    style={{ 
                      border: `1px solid ${COLORS.line}`, 
                      padding: '8px', 
                      textAlign: 'center', 
                      background: row.typeName === 'Your Plant' ? '#ffe0b2' : row.typeName === 'Ship to Plant' ? '#ffcc80' : row.typeName === 'User' ? '#e1bee7' : STEP_COLORS.function.cell, 
                      fontWeight: 600, 
                      verticalAlign: 'middle',
                      fontSize: '11px',
                      color: row.typeName === 'Your Plant' ? '#1565c0' : row.typeName === 'Ship to Plant' ? '#e65100' : row.typeName === 'User' ? '#7b1fa2' : '#333'
                    }}
                  >
                    {row.typeName}
                  </td>
                )}
                
                {/* 번호 (Y1, S1, U1...) */}
                <td 
                  style={{ 
                    border: `1px solid ${COLORS.line}`, 
                    padding: '4px', 
                    textAlign: 'center', 
                    background: row.typeName === 'Your Plant' ? '#e3f2fd' : row.typeName === 'Ship to Plant' ? '#fff3e0' : row.typeName === 'User' ? '#f3e5f5' : '#fff', 
                    fontWeight: 700, 
                    fontSize: '11px',
                    color: row.typeName === 'Your Plant' ? '#1565c0' : row.typeName === 'Ship to Plant' ? '#e65100' : row.typeName === 'User' ? '#7b1fa2' : '#333'
                  }}
                >
                  {row.feNo || '-'}
                </td>
                
                {/* 요구사항 (자동) */}
                {row.showReq && (
                  <td 
                    rowSpan={row.reqRowSpan} 
                    style={{ 
                      border: `1px solid ${COLORS.line}`, 
                      padding: '8px', 
                      background: STEP_COLORS.function.cell, 
                      verticalAlign: 'middle',
                      textAlign: 'center',
                      fontSize: '11px'
                    }}
                  >
                    {row.reqName}
                  </td>
                )}
                
                {/* 고장영향(FE) */}
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '0' }}>
                  <SelectableCell 
                    value={row.effect} 
                    placeholder="고장영향 선택" 
                    bgColor="#fff" 
                    onClick={() => setModal({ 
                      type: 'effect', 
                      effectId: row.effectId || undefined,
                      reqId: row.reqId,
                      title: '고장영향(FE) 선택', 
                      itemCode: 'FE2' 
                    })} 
                  />
                </td>
                
                {/* 심각도 - 클릭하면 SOD 모달 팝업 */}
                <td 
                  style={{ 
                    border: `1px solid ${COLORS.line}`, 
                    padding: '4px', 
                    textAlign: 'center', 
                    background: row.severity && row.severity >= 8 ? '#ffcdd2' : row.severity && row.severity >= 5 ? '#fff9c4' : '#fff',
                    cursor: row.effectId ? 'pointer' : 'default'
                  }}
                  onClick={() => row.effectId && setSODModal({ 
                    effectId: row.effectId, 
                    currentValue: row.severity,
                    scope: row.typeName as 'Your Plant' | 'Ship to Plant' | 'User'
                  })}
                  title={row.effectId ? '클릭하여 심각도 선택' : ''}
                >
                  {row.effectId ? (
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '13px',
                      color: row.severity && row.severity >= 8 ? '#c62828' : row.severity && row.severity >= 5 ? '#f57f17' : '#333'
                    }}>
                      {row.severity || '🔍'}
                    </span>
                  ) : (
                    <span style={{ color: '#999', fontSize: '10px' }}>-</span>
                  )}
                </td>
                
                {/* 편집 (삭제) */}
                <td style={{ border: `1px solid ${COLORS.line}`, padding: '4px', textAlign: 'center', background: '#fff' }}>
                  {row.effectId ? (
                    <button
                      onClick={() => deleteRow(row.effectId)}
                      style={{
                        padding: '2px 6px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                      title="행 삭제"
                    >
                      ✕
                    </button>
                  ) : (
                    <span style={{ color: '#ccc' }}>-</span>
                  )}
                </td>
              </tr>
            ))
          )}
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
          currentValues={getCurrentValues()}
        />
      )}

      {/* SOD 선택 모달 */}
      <SODSelectModal
        isOpen={!!sodModal}
        onClose={() => setSODModal(null)}
        onSelect={(rating) => {
          if (sodModal) {
            updateSeverity(sodModal.effectId, rating);
            setSODModal(null);
          }
        }}
        category="S"
        fmeaType="P-FMEA"
        currentValue={sodModal?.currentValue}
        scope={sodModal?.scope}
      />
    </div>
  );
}
