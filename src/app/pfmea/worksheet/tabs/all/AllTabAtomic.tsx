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

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { FONT_WEIGHTS } from '../../constants';
import { ALL_TAB_COLORS, BORDER } from './constants';
import { getZebraColors } from '@/styles/level-colors';

const HEADER_ROW_H = 24; // 3행 sticky header stacking용

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
  optRemarks: string | null;
  linkId: string;
  fmId: string;
  feId: string;
  fcId: string;
}

interface AllTabAtomicProps {
  fmeaId: string;
  visibleSteps?: number[];
  setState?: React.Dispatch<React.SetStateAction<any>>;
}

export default function AllTabAtomic({ fmeaId, visibleSteps = [2, 3, 4, 5, 6], setState }: AllTabAtomicProps) {
  const COLORS = ALL_TAB_COLORS;
  const [rows, setRows] = useState<AllViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // 단계 조합에 따른 최적화 폭 계산
  const getOptimizedWidth = useMemo(() => {
    const steps = visibleSteps.sort((a, b) => a - b).join(',');
    const widthMap: Record<string, number> = {
      '2': 300,           // 2ST만: 구조분석만
      '2,3': 1380,        // 2ST+3ST: 3단계, 4단계 한 화면
      '2,3,4': 1900,      // 2ST+3ST+4ST: 5단계, 6단계 일부
      '2,3,4,5': 2500,    // 2ST+3ST+4ST+5ST: 6단계 보이게
      '2,3,4,5,6': 3500,  // 전체: 모든 단계
    };
    return widthMap[steps] || 1350;
  }, [visibleSteps]);

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

  const stickyHeaderCellStyle = (bg: string, top: number, color = '#fff', zIndex = 50, fontSize = '10px', fontWeight: number | string = 500): React.CSSProperties => ({
    ...headerCellStyle(bg, color),
    position: 'sticky',
    top,
    zIndex,
    height: HEADER_ROW_H,
    lineHeight: `${HEADER_ROW_H - 6}px`,
    padding: '2px 4px',
    fontSize,
    fontWeight,
    whiteSpace: 'nowrap',
  });

  const cellStyle = (bg: string, textAlign: 'left' | 'center' = 'center'): React.CSSProperties => ({
    background: bg, border: BORDER, padding: '4px 6px',
    fontSize: '11px', verticalAlign: 'middle', textAlign
  });

  // 단계 토글 핸들러
  const handleStepToggle = useCallback((step: number) => {
    if (!setState) return;
    
    setState((prev: any) => {
      const currentSteps = prev.visibleSteps || [2, 3, 4, 5, 6];
      const isVisible = currentSteps.includes(step);
      
      // 최소 1개는 선택되어야 함
      if (isVisible && currentSteps.length === 1) {
        console.log(`[AllTabAtomic] 최소 1개 필요 - 토글 취소`);
        return prev;
      }
      
      const newSteps = isVisible
        ? currentSteps.filter((s: number) => s !== step)
        : [...currentSteps, step].sort((a: number, b: number) => a - b);
      
      console.log(`[AllTabAtomic] ${step}ST ${isVisible ? '숨김' : '표시'} → [${newSteps.join(',')}]`);
      
      return { ...prev, visibleSteps: newSteps };
    });
  }, [setState]);

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
    <div style={{ width: '100%', height: '100%' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: getOptimizedWidth }}>
        <colgroup>
          {/* 구조분석 4열 */}
          {visibleSteps.includes(2) && (
            <>
              <col style={{ width: '100px' }} />
              <col style={{ width: '40px' }} />
              <col style={{ width: '20px' }} />
              <col style={{ width: '120px' }} />
            </>
          )}
          {/* 기능분석 8열 */}
          {visibleSteps.includes(3) && (
            <>
              <col style={{ width: '30px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '30px' }} />
              <col style={{ width: '190px' }} />
              <col style={{ width: '80px' }} />
            </>
          )}
          {/* 고장분석 5열 */}
          {visibleSteps.includes(4) && (
            <>
              <col style={{ width: '200px' }} />
              <col style={{ width: '40px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '40px' }} />
            </>
          )}
          {/* 리스크분석 8열 */}
          {visibleSteps.includes(5) && (
            <>
              <col style={{ width: '90px' }} />
              <col style={{ width: '30px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '25px' }} />
              <col style={{ width: '25px' }} />
              <col style={{ width: '30px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '80px' }} />
            </>
          )}
          {/* 최적화 14열 */}
          {visibleSteps.includes(6) && (
            <>
              <col style={{ width: '70px' }} />
              <col style={{ width: '70px' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: '35px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: '25px' }} />
              <col style={{ width: '25px' }} />
              <col style={{ width: '25px' }} />
              <col style={{ width: '40px' }} />
              <col style={{ width: '25px' }} />
              <col style={{ width: '30px' }} />
              <col style={{ width: '50px' }} />
            </>
          )}
        </colgroup>
        <thead>
          {/* 1행: 단계 구분 */}
          <tr>
            {visibleSteps.includes(2) && (
              <th 
                colSpan={4} 
                style={{ ...stickyHeaderCellStyle(COLORS.structure.main, 0, '#fff', 60), cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}
                onClick={() => handleStepToggle(2)}
                title="2단계 클릭하여 숨기기/보이기"
              >
                P-FMEA 구조 분석(2단계)
              </th>
            )}
            {visibleSteps.includes(3) && (
              <th 
                colSpan={8} 
                style={{ ...stickyHeaderCellStyle(COLORS.function.main, 0, '#fff', 60), cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}
                onClick={() => handleStepToggle(3)}
                title="3단계 클릭하여 숨기기/보이기"
              >
                P-FMEA 기능 분석(3단계)
              </th>
            )}
            {visibleSteps.includes(4) && (
              <th 
                colSpan={5} 
                style={{ ...stickyHeaderCellStyle(COLORS.failure.main, 0, '#fff', 60), cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}
                onClick={() => handleStepToggle(4)}
                title="4단계 클릭하여 숨기기/보이기"
              >
                P-FMEA 고장 분석(4단계)
              </th>
            )}
            {visibleSteps.includes(5) && (
              <th 
                colSpan={8} 
                style={{ ...stickyHeaderCellStyle(COLORS.risk.main, 0, '#fff', 60), cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}
                onClick={() => handleStepToggle(5)}
                title="5단계 클릭하여 숨기기/보이기"
              >
                P-FMEA 리스크 분석(5단계)
              </th>
            )}
            {visibleSteps.includes(6) && (
              <th 
                colSpan={14} 
                style={{ ...stickyHeaderCellStyle(COLORS.opt.main, 0, '#fff', 60), cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}
                onClick={() => handleStepToggle(6)}
                title="6단계 클릭하여 숨기기/보이기"
              >
                P-FMEA 최적화(6단계)
              </th>
            )}
          </tr>
          
          {/* 2행: 항목 그룹 */}
          <tr>
            {visibleSteps.includes(2) && (
              <>
                <th style={stickyHeaderCellStyle(COLORS.structure.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>1. 완제품 공정명</th>
                <th style={stickyHeaderCellStyle(COLORS.structure.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>2. 메인 공정명</th>
                <th colSpan={2} style={stickyHeaderCellStyle(COLORS.structure.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>3. 작업 요소명</th>
              </>
            )}
            {visibleSteps.includes(3) && (
              <>
                <th colSpan={3} style={stickyHeaderCellStyle(COLORS.function.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>1. 완제품 공정기능/요구사항</th>
                <th colSpan={2} style={stickyHeaderCellStyle(COLORS.function.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>2. 메인공정기능 및 제품특성</th>
                <th colSpan={3} style={stickyHeaderCellStyle(COLORS.function.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>3. 작업요소의 기능 및 공정특성</th>
              </>
            )}
            {visibleSteps.includes(4) && (
              <>
                <th colSpan={2} style={stickyHeaderCellStyle(COLORS.failure.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>1. 자사/고객/사용자 고장영향(FE)</th>
                <th style={stickyHeaderCellStyle(COLORS.failure.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>2. 메인공정 고장형태(FM)</th>
                <th colSpan={2} style={stickyHeaderCellStyle(COLORS.failure.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>3. 작업요소 고장원인(FC)</th>
              </>
            )}
            {visibleSteps.includes(5) && (
              <>
                <th colSpan={2} style={stickyHeaderCellStyle(COLORS.risk.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>현재 예방관리</th>
                <th colSpan={2} style={stickyHeaderCellStyle(COLORS.risk.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>현재 검출관리</th>
                <th colSpan={4} style={stickyHeaderCellStyle(COLORS.risk.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>리스크 평가</th>
              </>
            )}
            {visibleSteps.includes(6) && (
              <>
                <th colSpan={4} style={stickyHeaderCellStyle(COLORS.opt.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>계획</th>
                <th colSpan={3} style={stickyHeaderCellStyle(COLORS.opt.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>결과 모니터링</th>
                <th colSpan={7} style={stickyHeaderCellStyle(COLORS.opt.main, HEADER_ROW_H, '#fff', 59, '10px', 600)}>효과 평가</th>
              </>
            )}
          </tr>
          
          {/* 3행: 세부 컬럼 */}
          <tr>
            {visibleSteps.includes(2) && (
              <>
                <th style={stickyHeaderCellStyle(COLORS.structure.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>완제품 공정명</th>
                <th style={stickyHeaderCellStyle(COLORS.structure.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>NO+공정명</th>
                <th style={stickyHeaderCellStyle(COLORS.special.m4.h3, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>4M</th>
                <th style={stickyHeaderCellStyle(COLORS.structure.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>작업요소</th>
              </>
            )}
            {visibleSteps.includes(3) && (
              <>
                <th style={stickyHeaderCellStyle(COLORS.special.scope.h3, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>구분</th>
                <th style={stickyHeaderCellStyle(COLORS.function.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>완제품기능</th>
                <th style={stickyHeaderCellStyle(COLORS.function.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>요구사항</th>
                <th style={stickyHeaderCellStyle(COLORS.function.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>공정 기능</th>
                <th style={stickyHeaderCellStyle(COLORS.function.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>제품특성</th>
                <th style={stickyHeaderCellStyle(COLORS.function.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>작업요소</th>
                <th style={stickyHeaderCellStyle(COLORS.function.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>작업요소 기능</th>
                <th style={stickyHeaderCellStyle(COLORS.function.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>공정특성</th>
              </>
            )}
            {visibleSteps.includes(4) && (
              <>
                <th style={stickyHeaderCellStyle(COLORS.special.scope.h3, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>구분</th>
                <th style={stickyHeaderCellStyle(COLORS.failure.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>고장영향(FE)</th>
                <th style={stickyHeaderCellStyle(COLORS.indicator.severity.bg, HEADER_ROW_H * 2, COLORS.indicator.severity.text, 58, '10px', 600)}>심각도</th>
                <th style={stickyHeaderCellStyle(COLORS.failure.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>고장형태(FM)</th>
                <th style={stickyHeaderCellStyle(COLORS.failure.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>작업요소</th>
                <th style={stickyHeaderCellStyle(COLORS.failure.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>고장원인(FC)</th>
              </>
            )}
            {visibleSteps.includes(5) && (
              <>
                <th style={stickyHeaderCellStyle(COLORS.risk.prevention.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>예방관리(PC)</th>
                <th style={stickyHeaderCellStyle(COLORS.indicator.occurrence.bg, HEADER_ROW_H * 2, COLORS.indicator.occurrence.text, 58, '10px', 600)}>발생도</th>
                <th style={stickyHeaderCellStyle(COLORS.risk.detection.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>검출관리(DC)</th>
                <th style={stickyHeaderCellStyle(COLORS.indicator.detection.bg, HEADER_ROW_H * 2, COLORS.indicator.detection.text, 58, '10px', 600)}>검출도</th>
                <th style={stickyHeaderCellStyle(COLORS.indicator.ap.bg, HEADER_ROW_H * 2, COLORS.indicator.ap.text, 58, '10px', 600)}>AP</th>
                <th style={stickyHeaderCellStyle(COLORS.risk.evaluation.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>RPN</th>
                <th style={stickyHeaderCellStyle(COLORS.risk.evaluation.header, HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>특별특성</th>
                <th style={stickyHeaderCellStyle('#f97316', HEADER_ROW_H * 2, '#fff', 58, '10px', 600)}>습득교훈</th>
              </>
            )}
            {visibleSteps.includes(6) && (
              <>
                <th style={stickyHeaderCellStyle('#bbdefb', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>예방관리개선</th>
                <th style={stickyHeaderCellStyle('#bbdefb', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>검출관리개선</th>
                <th style={stickyHeaderCellStyle('#bbdefb', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>책임자성명</th>
                <th style={stickyHeaderCellStyle('#bbdefb', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>목표완료일자</th>
                <th style={stickyHeaderCellStyle('#ffccbc', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>상태</th>
                <th style={stickyHeaderCellStyle('#ffccbc', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>개선결과근거</th>
                <th style={stickyHeaderCellStyle('#ffccbc', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>완료일자</th>
                <th style={stickyHeaderCellStyle('#c8e6c9', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>심각도</th>
                <th style={stickyHeaderCellStyle('#c8e6c9', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>발생도</th>
                <th style={stickyHeaderCellStyle('#c8e6c9', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>검출도</th>
                <th style={stickyHeaderCellStyle('#c8e6c9', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>특별특성</th>
                <th style={stickyHeaderCellStyle('#c8e6c9', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>AP</th>
                <th style={stickyHeaderCellStyle('#c8e6c9', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>RPN</th>
                <th style={stickyHeaderCellStyle('#c8e6c9', HEADER_ROW_H * 2, '#000', 58, '10px', 600)}>비고</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {processedRows.map((pr, idx) => {
            const r = pr.row;
            const zebra = getZebraColors(pr.globalIdx);
            
            return (
              <tr key={pr.row.linkId}>
                {/* 구조분석 */}
                {visibleSteps.includes(2) && (
                  <>
                    {pr.showProcess && (
                      <>
                        <td rowSpan={pr.processRowSpan} style={cellStyle(zebra.structure, 'center')}>{r.l1StructName}</td>
                        <td rowSpan={pr.processRowSpan} style={cellStyle(zebra.structure, 'center')}>{r.l2StructNo} {r.l2StructName}</td>
                      </>
                    )}
                    <td style={cellStyle(zebra.structure, 'center')}>{r.l3M4}</td>
                    <td style={cellStyle(zebra.structure, 'center')}>{r.l3Name}</td>
                  </>
                )}
                
                {/* 기능분석 */}
                {visibleSteps.includes(3) && (
                  <>
                    {pr.showFe && (
                      <>
                        <td rowSpan={pr.feRowSpan} style={cellStyle(zebra.function, 'center')}>{r.l1FuncCategory}</td>
                        <td rowSpan={pr.feRowSpan} style={cellStyle(zebra.function, 'left')}>{r.l1FuncName}</td>
                        <td rowSpan={pr.feRowSpan} style={cellStyle(zebra.function, 'center')}>{r.l1Requirement}</td>
                      </>
                    )}
                    {pr.showFm && (
                      <>
                        <td rowSpan={pr.fmRowSpan} style={cellStyle(zebra.function, 'left')}>{r.l2FuncName}</td>
                        <td rowSpan={pr.fmRowSpan} style={cellStyle(zebra.function, 'center')}>{r.l2ProductChar}</td>
                        <td rowSpan={pr.fmRowSpan} style={cellStyle(zebra.function, 'center')}>{r.l2SpecialChar}</td>
                      </>
                    )}
                    <td style={cellStyle(zebra.function, 'left')}>{r.l3FuncName}</td>
                    <td style={cellStyle(zebra.function, 'center')}>{r.l3ProcessChar}</td>
                  </>
                )}
                
                {/* 고장분석 */}
                {visibleSteps.includes(4) && (
                  <>
                    {pr.showFe && (
                      <>
                        <td rowSpan={pr.feRowSpan} style={cellStyle(zebra.failure, 'center')}>{r.feEffect}</td>
                        <td rowSpan={pr.feRowSpan} style={{ ...cellStyle(zebra.failure, 'center'), fontWeight: 600 }}>{r.feSeverity || ''}</td>
                      </>
                    )}
                    {pr.showFm && (
                      <td rowSpan={pr.fmRowSpan} style={cellStyle(zebra.failure, 'center')}>{r.fmMode}</td>
                    )}
                    <td style={cellStyle(zebra.failure, 'center')}>{r.fcCause}</td>
                    <td style={cellStyle(zebra.failure, 'center')}>{r.fcOccurrence || ''}</td>
                  </>
                )}
                
                {/* 리스크분석 */}
                {visibleSteps.includes(5) && (
                  <>
                    <td style={cellStyle('#fff', 'center')}>{r.preventionControl || ''}</td>
                    <td style={cellStyle('#fff', 'center')}>{r.riskOccurrence || ''}</td>
                    <td style={cellStyle('#fff', 'center')}>{r.detectionControl || ''}</td>
                    <td style={cellStyle('#fff', 'center')}>{r.riskDetection || ''}</td>
                    <td style={{ ...cellStyle('#fff', 'center'), fontWeight: 600, color: r.riskAP === 'H' ? '#d32f2f' : r.riskAP === 'M' ? '#f57c00' : '#388e3c' }}>{r.riskAP || ''}</td>
                    <td style={cellStyle('#fff', 'center')}>{(r.riskSeverity || 0) * (r.riskOccurrence || 0) * (r.riskDetection || 0)}</td>
                    <td style={cellStyle('#fff', 'center')}>{r.l2SpecialChar || ''}</td>
                    <td style={cellStyle('#fff', 'center')}></td>
                  </>
                )}
                
                {/* 최적화 */}
                {visibleSteps.includes(6) && (
                  <>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}>{r.optResponsible || ''}</td>
                    <td style={cellStyle('#fff', 'center')}>{r.optTargetDate || ''}</td>
                    <td style={cellStyle('#fff', 'center')}>{r.optStatus || ''}</td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}></td>
                    <td style={cellStyle('#fff', 'center')}>{r.optRemarks || ''}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

