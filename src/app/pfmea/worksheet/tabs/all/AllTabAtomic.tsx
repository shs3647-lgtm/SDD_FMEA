/**
 * @file AllTabAtomic.tsx
 * @description 전체보기 탭 - 원자성 DB에서 직접 JOIN으로 데이터 가져와 렌더링
 * 
 * ★★★ 핵심 아키텍처 ★★★
 * - 기존 state 기반 로직 대신 /api/fmea/all-view API 호출
 * - CASCADE JOIN된 데이터를 직접 테이블로 렌더링
 * - AI 분석/고장예측을 위한 재현성 있는 데이터 구조
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { FONT_WEIGHTS } from '../../constants';
import { BORDER } from './constants';
import { getZebraColors } from '@/styles/level-colors';

// 간단한 색상 상수 (원자성 전용)
const ATOMIC_COLORS = {
  structure: { header: '#1565c0', sub: '#90caf9' },
  function: { header: '#2e7d32', sub: '#a5d6a7' },
  failure: { header: '#1a237e', sub: '#9fa8da' },
  risk: { header: '#5c6bc0', sub: '#7986cb' },
  opt: { header: '#2e7d32', sub: '#81c784' },
};

interface AllViewRow {
  l1StructName: string;
  l2StructNo: string;
  l2StructName: string;
  l3M4: string;
  l3Name: string;
  l1FuncCategory: string;
  l1FuncName: string;
  l1Requirement: string;
  l2FuncName: string;
  l2ProductChar: string;
  l2SpecialChar: string;
  l3FuncName: string;
  l3ProcessChar: string;
  l3SpecialChar: string;
  feEffect: string;
  feSeverity: number;
  fmMode: string;
  fcCause: string;
  fcOccurrence: number | null;
  riskSeverity: number | null;
  riskOccurrence: number | null;
  riskDetection: number | null;
  riskAP: string | null;
  preventionControl: string | null;
  detectionControl: string | null;
  optAction: string | null;
  optResponsible: string | null;
  optTargetDate: string | null;
  optStatus: string | null;
  linkId: string;
  fmId: string;
  feId: string;
  fcId: string;
}

interface AllTabAtomicProps {
  fmeaId: string;
  visibleSteps?: number[];
}

export default function AllTabAtomic({ fmeaId, visibleSteps = [2, 3, 4, 5, 6] }: AllTabAtomicProps) {
  const COLORS = ATOMIC_COLORS;
  const [rows, setRows] = useState<AllViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // 원자성 DB에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/fmea/all-view?fmeaId=${encodeURIComponent(fmeaId)}`);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load data');
        }
        
        setRows(data.rows || []);
        setStats(data.stats);
        console.log('[AllTabAtomic] ✅ 원자성 DB에서 로드 완료:', data.stats);
      } catch (err: any) {
        setError(err.message);
        console.error('[AllTabAtomic] ❌ 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (fmeaId) loadData();
  }, [fmeaId]);

  // 공정별 그룹핑 (rowSpan 계산용)
  const processedRows = useMemo(() => {
    if (rows.length === 0) return [];
    
    // 공정별, FM별 그룹핑
    const result: { row: AllViewRow; processRowSpan: number; fmRowSpan: number; feRowSpan: number; showProcess: boolean; showFm: boolean; showFe: boolean; globalIdx: number }[] = [];
    
    let prevProcess = '';
    let prevFm = '';
    let prevFe = '';
    let processStartIdx = 0;
    let fmStartIdx = 0;
    let feStartIdx = 0;
    
    rows.forEach((row, idx) => {
      const isNewProcess = row.l2StructNo !== prevProcess;
      const isNewFm = row.fmId !== prevFm;
      const isNewFe = row.feId !== prevFe;
      
      // 새 공정이면 이전 공정의 rowSpan 계산
      if (isNewProcess && idx > 0) {
        result[processStartIdx].processRowSpan = idx - processStartIdx;
      }
      if (isNewFm && idx > 0) {
        result[fmStartIdx].fmRowSpan = idx - fmStartIdx;
      }
      if (isNewFe && idx > 0) {
        result[feStartIdx].feRowSpan = idx - feStartIdx;
      }
      
      result.push({
        row,
        processRowSpan: 1,
        fmRowSpan: 1,
        feRowSpan: 1,
        showProcess: isNewProcess,
        showFm: isNewFm,
        showFe: isNewFe,
        globalIdx: idx,
      });
      
      if (isNewProcess) {
        processStartIdx = idx;
        prevProcess = row.l2StructNo;
      }
      if (isNewFm) {
        fmStartIdx = idx;
        prevFm = row.fmId;
      }
      if (isNewFe) {
        feStartIdx = idx;
        prevFe = row.feId;
      }
    });
    
    // 마지막 그룹의 rowSpan 계산
    if (result.length > 0) {
      result[processStartIdx].processRowSpan = rows.length - processStartIdx;
      result[fmStartIdx].fmRowSpan = rows.length - fmStartIdx;
      result[feStartIdx].feRowSpan = rows.length - feStartIdx;
    }
    
    return result;
  }, [rows]);

  // 스타일 함수
  const headerCellStyle = (bg: string, color = '#fff'): React.CSSProperties => ({
    background: bg, color, border: BORDER, padding: '4px',
    fontWeight: FONT_WEIGHTS.semibold, fontSize: '11px', textAlign: 'center'
  });

  const cellStyle = (bg: string): React.CSSProperties => ({
    background: bg, border: BORDER, padding: '4px 6px',
    fontSize: '11px', verticalAlign: 'middle'
  });

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#666' }}>⏳ 원자성 DB에서 데이터 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#d32f2f' }}>❌ 로드 오류: {error}</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#666' }}>📋 고장연결 데이터가 없습니다.</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>고장분석 → 고장연결 탭에서 연결을 완료해주세요.</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
      {/* 통계 정보 */}
      {stats && (
        <div style={{ padding: '8px 16px', background: '#f5f5f5', borderBottom: '1px solid #ddd', fontSize: 12 }}>
          <span style={{ marginRight: 16 }}>📊 원자성 DB 기반</span>
          <span style={{ marginRight: 16 }}>공정: {stats.processCount}개</span>
          <span style={{ marginRight: 16 }}>고장형태: {stats.fmCount}개</span>
          <span style={{ marginRight: 16 }}>고장영향: {stats.feCount}개</span>
          <span style={{ marginRight: 16 }}>고장원인: {stats.fcCount}개</span>
          <span style={{ marginRight: 16 }}>연결: {stats.totalLinks}개</span>
        </div>
      )}
      
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 2000 }}>
        <thead>
          {/* 단계 헤더 */}
          <tr>
            <th colSpan={5} style={headerCellStyle(COLORS.structure.header)}>2. 구조분석</th>
            <th colSpan={8} style={headerCellStyle(COLORS.function.header)}>3. 기능분석</th>
            <th colSpan={5} style={headerCellStyle(COLORS.failure.header)}>4. 고장분석</th>
            <th colSpan={6} style={headerCellStyle(COLORS.risk.header)}>5. 리스크분석</th>
            <th colSpan={4} style={headerCellStyle(COLORS.opt.header)}>6. 최적화</th>
          </tr>
          {/* 컬럼 헤더 */}
          <tr>
            {/* 구조분석 */}
            <th style={headerCellStyle(COLORS.structure.sub)}>완제품</th>
            <th style={headerCellStyle(COLORS.structure.sub)}>공정No</th>
            <th style={headerCellStyle(COLORS.structure.sub)}>공정명</th>
            <th style={headerCellStyle(COLORS.structure.sub)}>4M</th>
            <th style={headerCellStyle(COLORS.structure.sub)}>작업요소</th>
            {/* 기능분석 */}
            <th style={headerCellStyle(COLORS.function.sub)}>범위</th>
            <th style={headerCellStyle(COLORS.function.sub)}>완제품기능</th>
            <th style={headerCellStyle(COLORS.function.sub)}>요구사항</th>
            <th style={headerCellStyle(COLORS.function.sub)}>공정기능</th>
            <th style={headerCellStyle(COLORS.function.sub)}>제품특성</th>
            <th style={headerCellStyle(COLORS.function.sub)}>특별특성</th>
            <th style={headerCellStyle(COLORS.function.sub)}>작업기능</th>
            <th style={headerCellStyle(COLORS.function.sub)}>공정특성</th>
            {/* 고장분석 */}
            <th style={headerCellStyle(COLORS.failure.sub)}>고장영향</th>
            <th style={headerCellStyle(COLORS.failure.sub)}>S</th>
            <th style={headerCellStyle(COLORS.failure.sub)}>고장형태</th>
            <th style={headerCellStyle(COLORS.failure.sub)}>고장원인</th>
            <th style={headerCellStyle(COLORS.failure.sub)}>O</th>
            {/* 리스크분석 */}
            <th style={headerCellStyle(COLORS.risk.sub)}>S</th>
            <th style={headerCellStyle(COLORS.risk.sub)}>O</th>
            <th style={headerCellStyle(COLORS.risk.sub)}>D</th>
            <th style={headerCellStyle(COLORS.risk.sub)}>AP</th>
            <th style={headerCellStyle(COLORS.risk.sub)}>예방관리</th>
            <th style={headerCellStyle(COLORS.risk.sub)}>검출관리</th>
            {/* 최적화 */}
            <th style={headerCellStyle(COLORS.opt.sub)}>권고조치</th>
            <th style={headerCellStyle(COLORS.opt.sub)}>담당자</th>
            <th style={headerCellStyle(COLORS.opt.sub)}>목표일</th>
            <th style={headerCellStyle(COLORS.opt.sub)}>상태</th>
          </tr>
        </thead>
        <tbody>
          {processedRows.map((pr, idx) => {
            const r = pr.row;
            const zebra = getZebraColors(pr.globalIdx);
            
            return (
              <tr key={pr.row.linkId}>
                {/* 구조분석 */}
                {pr.showProcess && (
                  <>
                    <td rowSpan={pr.processRowSpan} style={cellStyle(zebra.structure)}>{r.l1StructName}</td>
                    <td rowSpan={pr.processRowSpan} style={cellStyle(zebra.structure)}>{r.l2StructNo}</td>
                    <td rowSpan={pr.processRowSpan} style={cellStyle(zebra.structure)}>{r.l2StructName}</td>
                  </>
                )}
                <td style={cellStyle(zebra.structure)}>{r.l3M4}</td>
                <td style={cellStyle(zebra.structure)}>{r.l3Name}</td>
                
                {/* 기능분석 */}
                {pr.showFe && (
                  <>
                    <td rowSpan={pr.feRowSpan} style={cellStyle(zebra.function)}>{r.l1FuncCategory}</td>
                    <td rowSpan={pr.feRowSpan} style={cellStyle(zebra.function)}>{r.l1FuncName}</td>
                    <td rowSpan={pr.feRowSpan} style={cellStyle(zebra.function)}>{r.l1Requirement}</td>
                  </>
                )}
                {pr.showFm && (
                  <>
                    <td rowSpan={pr.fmRowSpan} style={cellStyle(zebra.function)}>{r.l2FuncName}</td>
                    <td rowSpan={pr.fmRowSpan} style={cellStyle(zebra.function)}>{r.l2ProductChar}</td>
                    <td rowSpan={pr.fmRowSpan} style={cellStyle(zebra.function)}>{r.l2SpecialChar}</td>
                  </>
                )}
                <td style={cellStyle(zebra.function)}>{r.l3FuncName}</td>
                <td style={cellStyle(zebra.function)}>{r.l3ProcessChar}</td>
                
                {/* 고장분석 */}
                {pr.showFe && (
                  <>
                    <td rowSpan={pr.feRowSpan} style={cellStyle(zebra.failure)}>{r.feEffect}</td>
                    <td rowSpan={pr.feRowSpan} style={{ ...cellStyle(zebra.failure), textAlign: 'center', fontWeight: 600 }}>{r.feSeverity || ''}</td>
                  </>
                )}
                {pr.showFm && (
                  <td rowSpan={pr.fmRowSpan} style={cellStyle(zebra.failure)}>{r.fmMode}</td>
                )}
                <td style={cellStyle(zebra.failure)}>{r.fcCause}</td>
                <td style={{ ...cellStyle(zebra.failure), textAlign: 'center' }}>{r.fcOccurrence || ''}</td>
                
                {/* 리스크분석 */}
                <td style={{ ...cellStyle('#fff'), textAlign: 'center' }}>{r.riskSeverity || ''}</td>
                <td style={{ ...cellStyle('#fff'), textAlign: 'center' }}>{r.riskOccurrence || ''}</td>
                <td style={{ ...cellStyle('#fff'), textAlign: 'center' }}>{r.riskDetection || ''}</td>
                <td style={{ ...cellStyle('#fff'), textAlign: 'center', fontWeight: 600, color: r.riskAP === 'H' ? '#d32f2f' : r.riskAP === 'M' ? '#f57c00' : '#388e3c' }}>{r.riskAP || ''}</td>
                <td style={cellStyle('#fff')}>{r.preventionControl || ''}</td>
                <td style={cellStyle('#fff')}>{r.detectionControl || ''}</td>
                
                {/* 최적화 */}
                <td style={cellStyle('#fff')}>{r.optAction || ''}</td>
                <td style={cellStyle('#fff')}>{r.optResponsible || ''}</td>
                <td style={cellStyle('#fff')}>{r.optTargetDate || ''}</td>
                <td style={{ ...cellStyle('#fff'), textAlign: 'center' }}>{r.optStatus || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

