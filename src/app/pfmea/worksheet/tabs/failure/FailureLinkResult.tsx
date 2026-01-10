/**
 * @file FailureLinkResult.tsx
 * @description 고장연결 결과 테이블 화면
 */

'use client';

import React, { useMemo } from 'react';
import { COLORS, FONT_SIZES } from '../../constants';
import { groupFailureLinksByFM, calculateLastRowMerge } from '../../utils';
import {
  resultTableContainer,
  resultTableHeaderStyle,
  resultFooterStyle,
  tdCenterStyle,
  tdStyle
} from './FailureLinkStyles';

interface LinkResult { 
  fmId: string; feId: string; feNo: string; feScope: string; feText: string; severity: number; 
  fmText: string; fmProcess: string; fcId: string; fcNo: string; fcProcess: string; 
  fcM4: string; fcWorkElem: string; fcText: string; 
}

interface FMItem { id: string; fmNo: string; processName: string; text: string; }

interface FailureLinkResultProps {
  savedLinks: LinkResult[];
  fmData: FMItem[];
}

export default function FailureLinkResult({ savedLinks, fmData }: FailureLinkResultProps) {
  // FM별 그룹핑
  const fmGroupsMap = useMemo(() => groupFailureLinksByFM(savedLinks), [savedLinks]);
  
  // 렌더링용 그룹 데이터 변환
  const groups = useMemo(() => {
    const result: { 
      fmId: string; fmText: string; fmProcess: string; fmNo: string;
      fes: { id: string; scope: string; text: string; severity: number; feNo: string }[];
      fcs: { id: string; processName: string; m4: string; workElem: string; text: string; fcNo: string }[];
    }[] = [];
    
    fmGroupsMap.forEach((group, fmId) => {
      const fm = fmData.find(f => f.id === fmId);
      result.push({
        fmId: group.fmId,
        fmText: group.fmText,
        fmProcess: group.fmProcess,
        fmNo: fm?.fmNo || group.fmNo || '',
        fes: group.fes.map(fe => ({
          id: fe.id,
          scope: fe.scope,
          text: fe.text,
          severity: fe.severity,
          feNo: fe.no
        })),
        fcs: group.fcs.map(fc => ({
          id: fc.id,
          processName: fc.process,
          m4: fc.m4,
          workElem: fc.workElem,
          text: fc.text,
          fcNo: fc.no
        }))
      });
    });
    
    return result;
  }, [fmGroupsMap, fmData]);

  // 렌더링할 행 데이터 생성
  const renderRows = useMemo(() => {
    const rows: { 
      fmId: string; rowIdx: number; totalRows: number;
      fe?: { id: string; scope: string; text: string; severity: number; feNo: string }; feRowSpan: number; showFe: boolean;
      fm: { text: string; no: string; process: string }; showFm: boolean;
      fc?: { id: string; processName: string; m4: string; workElem: string; text: string; fcNo: string }; fcRowSpan: number; showFc: boolean;
    }[] = [];

    groups.forEach(group => {
      const feCount = group.fes.length;
      const fcCount = group.fcs.length;
      const totalRows = Math.max(feCount, fcCount, 1);
      
      for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
        const mergeConfig = calculateLastRowMerge(feCount, fcCount, rowIdx, totalRows);
        
        let feItem: typeof group.fes[0] | undefined = undefined;
        if (mergeConfig.showFe && rowIdx < feCount) {
          feItem = group.fes[rowIdx];
        }
        
        let fcItem: typeof group.fcs[0] | undefined = undefined;
        if (mergeConfig.showFc && rowIdx < fcCount) {
          fcItem = group.fcs[rowIdx];
        }
        
        rows.push({
          fmId: group.fmId,
          rowIdx,
          totalRows,
          fe: feItem,
          feRowSpan: mergeConfig.feRowSpan,
          showFe: mergeConfig.showFe,
          fm: { text: group.fmText, no: group.fmNo, process: group.fmProcess },
          showFm: rowIdx === 0,
          fc: fcItem,
          fcRowSpan: mergeConfig.fcRowSpan,
          showFc: mergeConfig.showFc
        });
      }
    });
    
    return rows;
  }, [groups]);

  return (
    <div style={resultTableContainer}>
      {/* P-FMEA 고장 분석 (4단계) 헤더 */}
      <div className="text-center font-bold text-white py-2 mb-0" style={{ background: '#5c6bc0' }}>
        P-FMEA 고장 분석(4단계)
      </div>
      <table className="w-full border-collapse text-xs">
        <thead>
          {/* 1행: 메인 그룹 헤더 */}
          <tr>
            <th colSpan={3} style={{ background: '#f9a825', color: '#333', padding: '8px', border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
              1.자사/고객/사용자<br/>고장영향(FE)
            </th>
            <th colSpan={2} style={{ background: '#7e57c2', color: 'white', padding: '8px', border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
              2.메인공정<br/>고장형태(FM)
            </th>
            <th colSpan={2} style={{ background: '#66bb6a', color: 'white', padding: '8px', border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
              3.작업요소<br/>고장원인(FC)
            </th>
          </tr>
          {/* 2행: 세부 컬럼 헤더 */}
          <tr>
            <th className="w-[12%] p-2 border border-gray-400 font-semibold" style={{ background: '#fff8e1' }}>구분</th>
            <th className="w-[18%] p-2 border border-gray-400 font-semibold" style={{ background: '#fff8e1' }}>고장영향<br/>(FE)</th>
            <th className="w-[6%] p-2 border border-gray-400 font-semibold" style={{ background: '#ede7f6' }}>심각<br/>도</th>
            <th className="w-[16%] p-2 border border-gray-400 font-semibold" style={{ background: '#ede7f6' }}></th>
            <th className="w-[16%] p-2 border border-gray-400 font-semibold" style={{ background: '#e8f5e9' }}>고장형태<br/>(FM)</th>
            <th className="w-[10%] p-2 border border-gray-400 font-semibold" style={{ background: '#e8f5e9' }}>작업<br/>요소</th>
          </tr>
        </thead>
        <tbody>
          {renderRows.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center p-10 text-gray-400">
                <div className="text-[28px] mb-2.5">📋</div>
                <div>연결된 고장이 없습니다</div>
              </td>
            </tr>
          ) : renderRows.map((row, idx) => {
            // FE(고장영향) 배경: 노란색 계열
            const feBg = idx % 2 === 1 ? '#fff8e1' : '#fffde7';
            // FM(고장형태) 배경: 보라색 계열
            const fmBg = idx % 2 === 1 ? '#ede7f6' : '#f3e5f5';
            // FC(고장원인) 배경: 녹색 계열
            const fcBg = idx % 2 === 1 ? '#c8e6c9' : '#e8f5e9';
            
            return (
              <tr key={`${row.fmId}-${row.rowIdx}`} className={row.rowIdx === 0 ? 'border-t-2 border-gray-500' : ''}>
                {/* FE 영역: 구분, 고장영향 */}
                {row.showFe && (
                  <>
                    <td rowSpan={row.feRowSpan} style={{ background: feBg, border: '1px solid #bbb', padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {row.fe?.scope || ''}
                    </td>
                    <td rowSpan={row.feRowSpan} style={{ background: feBg, border: '1px solid #bbb', padding: '6px', verticalAlign: 'middle' }}>
                      {row.fe?.text || ''}
                    </td>
                  </>
                )}
                {/* FM 영역: 심각도, 고장형태 */}
                {row.showFm && (
                  <>
                    <td rowSpan={row.totalRows} style={{ background: fmBg, border: '1px solid #bbb', padding: '6px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: (row.fe?.severity || 0) >= 8 ? '#d32f2f' : (row.fe?.severity || 0) >= 5 ? '#f57c00' : '#333' }}>
                      {row.fe?.severity || ''}
                    </td>
                    <td rowSpan={row.totalRows} style={{ background: fmBg, border: '1px solid #bbb', padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div className="font-semibold text-purple-900">{row.fm.text}</div>
                    </td>
                  </>
                )}
                {/* FC 영역: 고장원인, 작업요소 */}
                {row.showFc && (
                  <>
                    <td rowSpan={row.fcRowSpan} style={{ background: fcBg, border: '1px solid #bbb', padding: '6px', verticalAlign: 'middle' }}>
                      {row.fc?.text || ''}
                    </td>
                    <td rowSpan={row.fcRowSpan} style={{ background: fcBg, border: '1px solid #bbb', padding: '6px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px' }}>
                      {row.fc?.workElem || ''}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* 통계 */}
      <div style={resultFooterStyle}>
        <strong className="font-bold">📊 연결 현황:</strong> FM {groups.length}개 | FE {groups.reduce((sum, g) => sum + g.fes.length, 0)}개 | FC {groups.reduce((sum, g) => sum + g.fcs.length, 0)}개
      </div>
    </div>
  );
}

