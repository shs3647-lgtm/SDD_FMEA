/**
 * @file EvalStructureTab.tsx
 * @description 구조분석 평가 탭 - 고장연결 결과 기반 구조분석 표시
 */

'use client';

import React from 'react';

const BORDER = '1px solid #ccc';
const stickyTheadStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 20, background: '#fff' };

// 구조분석 색상 (page.tsx와 동일)
const STRUCTURE_COLORS = {
  main: '#1565c0',
  header: '#bbdefb',
  cell: '#e3f2fd',
};

interface EvalStructureTabProps {
  failureLinks: any[];
  state: any;
}

export default function EvalStructureTab({ failureLinks, state }: EvalStructureTabProps) {
  // FM별 그룹핑 (FC만 필요)
  const fmGroups = new Map<string, { 
    fmId: string; fmText: string; fmProcess: string;
    fcs: { id: string; no: string; process: string; m4: string; workElem: string; text: string }[];
  }>();
  
  failureLinks.forEach((link: any) => {
    if (!fmGroups.has(link.fmId)) {
      fmGroups.set(link.fmId, { 
        fmId: link.fmId, fmText: link.fmText || '', fmProcess: link.fmProcess || '',
        fcs: []
      });
    }
    const group = fmGroups.get(link.fmId)!;
    if (link.fcId && link.fcId !== '' && !group.fcs.some(f => f.id === link.fcId)) {
      group.fcs.push({ 
        id: link.fcId, no: link.fcNo || '', process: link.fcProcess || '',
        m4: link.fcM4 || '', workElem: link.fcWorkElem || '', text: link.fcText || ''
      });
    }
  });
  
  // 공정명별 그룹핑 (셀합치기용)
  const processGroups = new Map<string, { fmList: any[]; startIdx: number }>();
  const allRows: any[] = [];
  
  Array.from(fmGroups.values()).forEach(group => {
    const procName = group.fmProcess;
    if (!processGroups.has(procName)) {
      processGroups.set(procName, { fmList: [], startIdx: -1 });
    }
    processGroups.get(procName)!.fmList.push(group);
  });
  
  let globalIdx = 0;
  processGroups.forEach((pg, procName) => {
    pg.startIdx = globalIdx;
    let processRowCount = 0;
    
    pg.fmList.forEach((group: any, fmIdx: number) => {
      const maxRows = Math.max(group.fcs.length, 1);
      
      for (let i = 0; i < maxRows; i++) {
        const fc = group.fcs[i] || null;
        allRows.push({
          processName: procName,
          showProcess: fmIdx === 0 && i === 0,
          processRowSpan: 0,
          fc: fc ? { m4: fc.m4, workElem: fc.workElem } : null,
        });
        processRowCount++;
        globalIdx++;
      }
    });
    
    if (pg.startIdx >= 0 && allRows[pg.startIdx]) {
      allRows[pg.startIdx].processRowSpan = processRowCount;
    }
  });
  
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead style={stickyTheadStyle}>
        <tr>
            <th colSpan={4} style={{ background: STRUCTURE_COLORS.main, color: '#fff', border: BORDER, padding: '6px', fontWeight: 900, fontSize: '11px', textAlign: 'center' }}>
            P-FMEA 구조 분석(2단계) - 공정명 중심 (총 {allRows.length}행)
          </th>
        </tr>
        <tr>
            <th style={{ background: STRUCTURE_COLORS.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정명</th>
            <th style={{ background: STRUCTURE_COLORS.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>2. 메인 공정명</th>
            <th colSpan={2} style={{ background: STRUCTURE_COLORS.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>3. 작업 요소명</th>
        </tr>
        <tr>
            <th style={{ width: '20%', background: STRUCTURE_COLORS.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>완제품공정명</th>
            <th style={{ width: '25%', background: STRUCTURE_COLORS.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>NO+공정명</th>
            <th style={{ width: '10%', background: STRUCTURE_COLORS.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>4M</th>
            <th style={{ width: '45%', background: STRUCTURE_COLORS.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>작업요소</th>
        </tr>
      </thead>
      <tbody>
        {allRows.map((row, idx) => {
          const cellStyle = { border: BORDER, padding: '4px', fontSize: '10px', verticalAlign: 'middle' as const };
          
          return (
            <tr key={`str-${idx}`}>
              {idx === 0 && <td rowSpan={allRows.length} style={{ ...cellStyle, background: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>{state.l1?.name || ''}</td>}
              {row.showProcess && row.processRowSpan > 0 && <td rowSpan={row.processRowSpan} style={{ ...cellStyle, background: '#e3f2fd' }}>{row.processName}</td>}
              <td style={{ ...cellStyle, background: '#e3f2fd', textAlign: 'center' }}>{row.fc?.m4 || ''}</td>
              <td style={{ ...cellStyle, background: '#e3f2fd' }}>{row.fc?.workElem || ''}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

