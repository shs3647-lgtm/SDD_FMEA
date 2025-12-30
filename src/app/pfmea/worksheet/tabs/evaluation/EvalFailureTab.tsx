/**
 * @file EvalFailureTab.tsx
 * @description 고장분석 평가 탭 - 고장연결 결과 표시
 */

'use client';

import React from 'react';
import { COLORS } from '../../constants';

const BORDER = '1px solid #ccc';
const stickyTheadStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 10 };

interface EvalFailureTabProps {
  failureLinks: any[];
}

export default function EvalFailureTab({ failureLinks }: EvalFailureTabProps) {
  // FM별 그룹핑
  const fmGroups = new Map<string, { fmId: string; fmText: string; fmNo: string; fes: any[]; fcs: any[] }>();
  failureLinks.forEach((link: any) => {
    if (!fmGroups.has(link.fmId)) {
      fmGroups.set(link.fmId, { fmId: link.fmId, fmText: link.fmText, fmNo: link.fmNo || '', fes: [], fcs: [] });
    }
    const group = fmGroups.get(link.fmId)!;
    if (link.feId && !group.fes.some(f => f.id === link.feId)) {
      group.fes.push({ id: link.feId, scope: link.feScope, text: link.feText, severity: link.severity, feNo: link.feNo, processName: link.fcProcess });
    }
    if (link.fcId && !group.fcs.some(f => f.id === link.fcId)) {
      group.fcs.push({ id: link.fcId, text: link.fcText, workElem: link.fcWorkElem, fcNo: link.fcNo, processName: link.fcProcess });
    }
  });
  const groups = Array.from(fmGroups.values());
  
  // 렌더링 행 생성 - FM 중심, FE/FC는 각각 한 줄씩
  const renderRows: any[] = [];
  groups.forEach(group => {
    const maxRows = Math.max(group.fes.length, group.fcs.length, 1);
    for (let i = 0; i < maxRows; i++) {
      const fe = group.fes[i];
      const fc = group.fcs[i];
      renderRows.push({
        fmId: group.fmId, fmText: group.fmText, fmNo: group.fmNo,
        showFm: i === 0, fmRowSpan: maxRows,
        fe, showFe: !!fe,
        fc, showFc: !!fc,
      });
    }
  });
  
  const totalFE = groups.reduce((s, g) => s + g.fes.length, 0);
  const totalFC = groups.reduce((s, g) => s + g.fcs.length, 0);
  
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead style={stickyTheadStyle}>
        <tr>
          <th colSpan={9} style={{ background: COLORS.failure.main, color: '#fff', border: BORDER, padding: '6px', fontWeight: 900, fontSize: '11px', textAlign: 'center' }}>
            P-FMEA 고장 분석(4단계) - 연결 결과 (FM:{groups.length} FE:{totalFE} FC:{totalFC})
          </th>
        </tr>
        <tr>
          <th colSpan={4} style={{ background: '#e3f2fd', border: BORDER, padding: '4px', fontSize: '10px', textAlign: 'center', fontWeight: 700 }}>고장영향(FE)</th>
          <th rowSpan={2} style={{ width: '12%', background: '#fff8e1', border: BORDER, padding: '4px', fontSize: '10px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>고장형태(FM)</th>
          <th colSpan={4} style={{ background: '#e8f5e9', border: BORDER, padding: '4px', fontSize: '10px', textAlign: 'center', fontWeight: 700 }}>고장원인(FC)</th>
        </tr>
        <tr>
          <th style={{ width: '5%', background: '#e3f2fd', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>No</th>
          <th style={{ width: '6%', background: '#e3f2fd', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>구분</th>
          <th style={{ width: '15%', background: '#e3f2fd', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>고장영향</th>
          <th style={{ width: '4%', background: '#e3f2fd', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>S</th>
          <th style={{ width: '5%', background: '#e8f5e9', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>No</th>
          <th style={{ width: '10%', background: '#e8f5e9', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>공정명</th>
          <th style={{ width: '12%', background: '#e8f5e9', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>작업요소</th>
          <th style={{ background: '#e8f5e9', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>고장원인</th>
        </tr>
      </thead>
      <tbody>
        {renderRows.map((row, idx) => (
          <tr key={`fail-${row.fmId}-${idx}`} style={{ borderTop: row.showFm ? '2px solid #999' : undefined }}>
            {/* FE 영역 */}
            {row.showFe ? (
              <>
                <td style={{ border: BORDER, padding: '3px', fontSize: '9px', background: '#e8f5e9', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>{row.fe?.feNo || ''}</td>
                <td style={{ border: BORDER, padding: '3px', fontSize: '9px', background: '#e3f2fd', textAlign: 'center' }}>
                  {row.fe?.scope === 'Your Plant' ? 'YP' : row.fe?.scope === 'Ship to Plant' ? 'SP' : row.fe?.scope === 'User' ? 'USER' : ''}
                </td>
                <td style={{ border: BORDER, padding: '3px', fontSize: '9px' }}>{row.fe?.text || ''}</td>
                <td style={{ border: BORDER, padding: '3px', fontSize: '10px', textAlign: 'center', fontWeight: 700, color: (row.fe?.severity || 0) >= 8 ? '#c62828' : '#333' }}>{row.fe?.severity || ''}</td>
              </>
            ) : (
              <><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td></>
            )}
            {/* FM 영역 - 병합 */}
            {row.showFm && (
              <td rowSpan={row.fmRowSpan} style={{ border: BORDER, padding: '4px', fontSize: '9px', background: '#fff8e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 600 }}>
                <div style={{ fontSize: '8px', color: '#f57c00', marginBottom: '2px' }}>{row.fmNo}</div>
                <div>{row.fmText}</div>
              </td>
            )}
            {/* FC 영역 */}
            {row.showFc ? (
              <>
                <td style={{ border: BORDER, padding: '3px', fontSize: '9px', background: '#e8f5e9', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>{row.fc?.fcNo || ''}</td>
                <td style={{ border: BORDER, padding: '3px', fontSize: '9px' }}>{row.fc?.processName || ''}</td>
                <td style={{ border: BORDER, padding: '3px', fontSize: '9px' }}>{row.fc?.workElem || ''}</td>
                <td style={{ border: BORDER, padding: '3px', fontSize: '9px' }}>{row.fc?.text || ''}</td>
              </>
            ) : (
              <><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td></>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

