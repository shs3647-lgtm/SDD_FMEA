/**
 * @file EvalFunctionTab.tsx
 * @description 기능분석 평가 탭 - 고장연결 결과 기반 기능분석 DB 데이터 표시
 * ★ 원칙: 고장분석 텍스트가 아닌, 실제 기능분석 DB에 저장된 데이터를 표시
 */

'use client';

import React from 'react';
import { COLORS } from '../../constants';

const BORDER = '1px solid #ccc';
const stickyTheadStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 10 };

interface EvalFunctionTabProps {
  failureLinks: any[];
  state: any;
}

export default function EvalFunctionTab({ failureLinks, state }: EvalFunctionTabProps) {
  // 기능분석 데이터 조회용 맵 구축
  // 1L: 요구사항 맵 (id -> { type, funcName, reqName })
  const requirementMap = new Map<string, { typeName: string; funcName: string; reqName: string }>();
  (state.l1?.types || []).forEach((type: any) => {
    (type.functions || []).forEach((func: any) => {
      (func.requirements || []).forEach((req: any) => {
        requirementMap.set(req.id, { typeName: type.name, funcName: func.name, reqName: req.name });
      });
    });
  });
  
  // 2L: 제품특성 맵 (processName -> { funcName, productChar })
  const productCharMap = new Map<string, { processName: string; funcName: string; productCharName: string }[]>();
  (state.l2 || []).forEach((proc: any) => {
    const key = proc.name || '';
    if (!productCharMap.has(key)) productCharMap.set(key, []);
    (proc.functions || []).forEach((func: any) => {
      (func.productChars || []).forEach((pc: any) => {
        productCharMap.get(key)!.push({ processName: proc.name, funcName: func.name, productCharName: pc.name });
      });
    });
  });
  
  // 3L: 공정특성 맵 (workElemName -> { funcName, processChar })
  const processCharMap = new Map<string, { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string }[]>();
  (state.l2 || []).forEach((proc: any) => {
    (proc.l3 || []).forEach((we: any) => {
      const key = we.name || '';
      if (!processCharMap.has(key)) processCharMap.set(key, []);
      (we.functions || []).forEach((func: any) => {
        (func.processChars || []).forEach((pc: any) => {
          processCharMap.get(key)!.push({ processName: proc.name, workElemName: we.name, m4: we.m4 || '', funcName: func.name, processCharName: pc.name });
        });
      });
    });
  });
  
  // FM별 그룹핑 + 기능분석 데이터 조회
  const fmGroups = new Map<string, { 
    fmId: string; fmText: string; fmProcess: string;
    // 고장 데이터 + 연결된 기능 데이터
    fes: { feId: string; feScope: string; feText: string; severity: number; funcData: { typeName: string; funcName: string; reqName: string } | null }[];
    fcs: { fcId: string; m4: string; workElem: string; fcText: string; funcData: { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string } | null }[];
    l2FuncData: { processName: string; funcName: string; productCharName: string } | null;
  }>();
  
  failureLinks.forEach((link: any) => {
    if (!fmGroups.has(link.fmId)) {
      // 2L 제품특성 조회: fmProcess와 매칭
      const procKey = (link.fmProcess || '').replace(/^\d+\s*/, '').trim();
      const l2Funcs = productCharMap.get(procKey) || productCharMap.get(link.fmProcess || '') || [];
      
      fmGroups.set(link.fmId, { 
        fmId: link.fmId, fmText: link.fmText || '', fmProcess: link.fmProcess || '',
        fes: [], fcs: [],
        l2FuncData: l2Funcs.length > 0 ? l2Funcs[0] : null
      });
    }
    const group = fmGroups.get(link.fmId)!;
    
    // FE 추가 (기능분석 데이터 조회)
    if (link.feId && link.feId !== '' && !group.fes.some(f => f.feId === link.feId)) {
      // 1L 요구사항 조회: feId로 직접 조회하거나, failureScopes에서 reqId 찾기
      const failureScope = (state.l1?.failureScopes || []).find((fs: any) => fs.id === link.feId) as any;
      const reqData = failureScope?.reqId ? requirementMap.get(failureScope.reqId) : null;
      
      group.fes.push({ 
        feId: link.feId, feScope: link.feScope || '', feText: link.feText || '', severity: link.severity || 0,
        funcData: reqData || null
      });
    }
    
    // FC 추가 (기능분석 데이터 조회)
    if (link.fcId && link.fcId !== '' && !group.fcs.some(f => f.fcId === link.fcId)) {
      // 3L 공정특성 조회: workElem으로 매칭
      const weKey = link.fcWorkElem || '';
      const l3Funcs = processCharMap.get(weKey) || [];
      
      group.fcs.push({ 
        fcId: link.fcId, m4: link.fcM4 || '', workElem: link.fcWorkElem || '', fcText: link.fcText || '',
        funcData: l3Funcs.length > 0 ? l3Funcs[0] : null
      });
    }
  });
  
  // 행 생성
  const allRows: {
    fmText: string; fmProcess: string;
    showFm: boolean;
    fmRowSpan: number;
    // 1L 기능분석 데이터
    l1Func: { typeName: string; funcName: string; reqName: string } | null;
    // 2L 기능분석 데이터
    l2Func: { processName: string; funcName: string; productCharName: string } | null;
    // 3L 기능분석 데이터
    l3Func: { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string } | null;
    // 고장 데이터 (참조용)
    fe: { scope: string; text: string } | null;
    fc: { m4: string; workElem: string; text: string } | null;
  }[] = [];
  
  Array.from(fmGroups.values()).forEach(group => {
    const maxRows = Math.max(group.fes.length, group.fcs.length, 1);
    
    for (let i = 0; i < maxRows; i++) {
      const feItem = group.fes[i] || null;
      const fcItem = group.fcs[i] || null;
      allRows.push({
        fmText: group.fmText, fmProcess: group.fmProcess,
        showFm: i === 0,
        fmRowSpan: maxRows,
        l1Func: feItem?.funcData || null,
        l2Func: group.l2FuncData,
        l3Func: fcItem?.funcData || null,
        fe: feItem ? { scope: feItem.feScope, text: feItem.feText } : null,
        fc: fcItem ? { m4: fcItem.m4, workElem: fcItem.workElem, text: fcItem.fcText } : null,
      });
    }
  });
  
  const getScopeAbbr = (s: string) => s === 'Your Plant' ? 'YP' : s === 'Ship to Plant' ? 'SP' : s === 'User' ? 'U' : '';
  
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead style={stickyTheadStyle}>
        <tr>
          <th colSpan={8} style={{ background: COLORS.function.main, color: '#fff', border: BORDER, padding: '6px', fontWeight: 900, fontSize: '11px', textAlign: 'center' }}>
            P-FMEA 기능 분석(3단계) - DB 연결 데이터 (고장분석 ↔ 기능분석 1:1 매칭)
          </th>
        </tr>
        <tr>
          <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정기능/요구사항</th>
          <th colSpan={2} style={{ background: COLORS.function.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>2. 메인공정기능/제품특성</th>
          <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>3. 작업요소기능/공정특성</th>
        </tr>
        <tr>
          <th style={{ width: '6%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>구분</th>
          <th style={{ width: '15%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>완제품기능</th>
          <th style={{ width: '15%', background: '#c8e6c9', border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center', fontWeight: 700 }}>요구사항</th>
          <th style={{ width: '15%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>공정기능</th>
          <th style={{ width: '12%', background: '#c8e6c9', border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center', fontWeight: 700 }}>제품특성</th>
          <th style={{ width: '7%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>4M</th>
          <th style={{ width: '15%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>작업요소기능</th>
          <th style={{ width: '15%', background: '#c8e6c9', border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center', fontWeight: 700 }}>공정특성</th>
        </tr>
      </thead>
      <tbody>
        {allRows.map((row, idx) => {
          const cellStyle = { border: BORDER, padding: '4px', fontSize: '10px', verticalAlign: 'middle' as const };
          // 기능분석 데이터가 없으면 빨간색으로 표시
          const missingStyle = { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' as const };
          
          return (
            <tr key={`func-${idx}`} style={{ borderTop: row.showFm ? '2px solid #999' : undefined }}>
              {/* 1. 완제품 기능/요구사항 - DB 데이터 */}
              {/* 구분: 기능분석 DB에서 조회 */}
              {row.showFm && <td rowSpan={row.fmRowSpan} style={{ ...cellStyle, background: '#e8f5e9', textAlign: 'center' }}>{row.l1Func?.typeName || getScopeAbbr(row.fe?.scope || '')}</td>}
              {/* 완제품기능: 기능분석 DB에서 조회 */}
              {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l1Func ? { ...cellStyle, background: '#e8f5e9' } : missingStyle}>{row.l1Func?.funcName || '(미연결)'}</td>}
              {/* 요구사항: 기능분석 DB에서 조회 */}
              {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l1Func ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : missingStyle}>{row.l1Func?.reqName || '(미연결)'}</td>}
              {/* 2. 공정기능/제품특성 - DB 데이터 */}
              {/* 공정기능: 기능분석 DB에서 조회 */}
              {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2Func ? { ...cellStyle, background: '#e8f5e9' } : missingStyle}>{row.l2Func?.funcName || '(미연결)'}</td>}
              {/* 제품특성: 기능분석 DB에서 조회 */}
              {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2Func ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : missingStyle}>{row.l2Func?.productCharName || '(미연결)'}</td>}
              {/* 3. 작업요소 기능/공정특성 - DB 데이터 */}
              {/* 4M: 기능분석 DB에서 조회 */}
              <td style={{ ...cellStyle, background: '#e8f5e9', textAlign: 'center' }}>{row.l3Func?.m4 || row.fc?.m4 || ''}</td>
              {/* 작업요소기능: 기능분석 DB에서 조회 */}
              <td style={row.l3Func ? { ...cellStyle, background: '#e8f5e9' } : (row.fc ? missingStyle : { ...cellStyle, background: '#fafafa' })}>{row.l3Func?.funcName || (row.fc ? '(미연결)' : '')}</td>
              {/* 공정특성: 기능분석 DB에서 조회 */}
              <td style={row.l3Func ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : (row.fc ? missingStyle : { ...cellStyle, background: '#fafafa' })}>{row.l3Func?.processCharName || (row.fc ? '(미연결)' : '')}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

