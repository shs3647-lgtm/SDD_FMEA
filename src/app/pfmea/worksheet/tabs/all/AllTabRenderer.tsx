/**
 * @file AllTabRenderer.tsx
 * @description 전체보기 탭 렌더러 (40열 FMEA 워크시트 + 기능분석 연동)
 */

'use client';

import React from 'react';
import { FlatRow, WorksheetState, FONT_SIZES, FONT_WEIGHTS, HEIGHTS } from '../../constants';
import { groupFailureLinksWithFunctionData, groupByProcessName, calculateLastRowMerge } from '../../utils';
import { exportAllViewExcel } from '../../excel-export';

interface AllTabRendererProps {
  tab: string;
  rows: FlatRow[];
  state: WorksheetState;
  l1Spans: number[];
  l1TypeSpans: number[];
  l1FuncSpans: number[];
  l2Spans: number[];
  onAPClick?: () => void;
}

export default function AllTabRenderer({ 
  tab, rows, state, l1Spans, l1TypeSpans, l1FuncSpans, l2Spans, onAPClick 
}: AllTabRendererProps) {
  const BORDER = '1px solid #b0bec5';
  const stickyTheadStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 20, background: '#fff' };

  // 탭에 따라 표시할 단계 결정 (각 평가탭은 해당 단계만 표시, 전체보기만 전체 표시)
  const getVisibleSteps = () => {
    switch (tab) {
      case 'eval-structure': return [2];           // 구조분석만
      case 'eval-function': return [3];            // 기능분석만
      case 'eval-failure': return [4];             // 고장분석만
      case 'risk': return [5];                     // 리스크분석만
      case 'opt': return [6];                      // 최적화만
      case 'all': return [2, 3, 4, 5, 6];          // 전체보기
      default: return [2, 3, 4, 5, 6];
    }
  };

  const visibleSteps = tab === 'all' ? (state.visibleSteps || [2, 3, 4, 5, 6]) : getVisibleSteps();
  
  // 전체보기일 때만 가로 스크롤 활성화
  const isAllView = tab === 'all';

  // ========== 🎨 고급스럽고 차분한 색상 시스템 ==========
  // 주황색: S, O, D, AP, RPN 핵심 지표에만 사용
  // 일반 컬럼: 파란색, 네이비, 녹색 계열 (차분하고 깔끔하게)
  const COLORS = {
    // 구조분석 (2단계) - 블루 계열
    structure: { 
      main: '#1565c0',  // 헤더1행 - 딥블루
      header: '#90caf9', cell: '#e3f2fd',  // 호환성 (하위 탭용)
      l1: { h2: '#1976d2', h3: '#90caf9', cell: '#e3f2fd' },  // 1L: 파랑
      l2: { h2: '#3949ab', h3: '#9fa8da', cell: '#e8eaf6' },  // 2L: 네이비
      l3: { h2: '#388e3c', h3: '#a5d6a7', cell: '#e8f5e9' },  // 3L: 녹색
    },
    // 기능분석 (3단계) - 그린 계열
    function: { 
      main: '#2e7d32',  // 헤더1행 - 딥그린
      header: '#a5d6a7', cell: '#e8f5e9',  // 호환성 (하위 탭용)
      l1: { h2: '#1e88e5', h3: '#90caf9', cell: '#e3f2fd' },  // 1L: 파랑
      l2: { h2: '#5c6bc0', h3: '#b3b9e8', cell: '#e8eaf6' },  // 2L: 네이비
      l3: { h2: '#43a047', h3: '#a5d6a7', cell: '#e8f5e9' },  // 3L: 녹색
    },
    // 고장분석 (4단계) - 네이비 계열 (전체 통일)
    failure: { 
      main: '#1a237e',  // 헤더1행 - 딥 인디고 (네이비)
      header: '#9fa8da', cell: '#e8eaf6',  // 호환성 (하위 탭용)
      l1: { h2: '#1976d2', h3: '#90caf9', cell: '#e3f2fd' },  // 1L: 파랑 (FE)
      l2: { h2: '#3949ab', h3: '#9fa8da', cell: '#e8eaf6' },  // 2L: 인디고 (FM)
      l3: { h2: '#43a047', h3: '#a5d6a7', cell: '#e8f5e9' },  // 3L: 녹색 (FC)
    },
    // 리스크분석 (5단계) - 네이비 계열
    risk: { 
      main: '#1a237e',  // 헤더1행 - 딥 인디고
      prevention: { header: '#9fa8da', h2: '#3949ab', h3: '#9fa8da', cell: '#e8eaf6' },
      detection: { header: '#7986cb', h2: '#303f9f', h3: '#7986cb', cell: '#e8eaf6' },
      evaluation: { header: '#5c6bc0', h2: '#283593', h3: '#5c6bc0', cell: '#e3e7f7' },
    },
    // 최적화 (6단계) - 그린 계열
    opt: { 
      main: '#1b5e20',  // 헤더1행 - 딥그린
      plan: { header: '#81c784', h2: '#2e7d32', h3: '#81c784', cell: '#e8f5e9' },
      monitor: { header: '#a5d6a7', h2: '#388e3c', h3: '#a5d6a7', cell: '#f1f8e9' },
      effect: { header: '#c8e6c9', h2: '#43a047', h3: '#c8e6c9', cell: '#f9fbe7' }
    },
    // 핵심 지표 강조색 - 고급스럽고 은은한 색상
    indicator: {
      severity: { bg: '#ffccbc', text: '#bf360c' },    // S - 연한 살구색 + 진한 글씨
      occurrence: { bg: '#ffe0b2', text: '#e65100' },  // O - 연한 피치 + 진한 글씨
      detection: { bg: '#fff3e0', text: '#ff6f00' },   // D - 아주 연한 크림 + 주황 글씨
      ap: { bg: '#fff8e1', text: '#ff8f00' },          // AP - 연한 아이보리 + 주황 글씨
      rpn: { bg: '#ffebee', text: '#c62828' },         // RPN - 연한 핑크 + 진한 빨강 글씨
      rpnHigh: { bg: '#ffcdd2', text: '#b71c1c' },     // RPN 높음 - 연한 핑크 + 진한 빨강
    },
    // 구분/4M 컬럼 (차분한 그레이 블루)
    special: {
      scope: { h3: '#78909c', cell: '#eceff1' },   // 구분 컬럼
      m4: { h3: '#546e7a', cell: '#cfd8dc' },      // 4M 컬럼
    }
  };
  
  // 고장연결 데이터
  const failureLinks = (state as any).failureLinks || [];
  
  // 전체보기(all) 탭: 고장연결 결과 기반 40열 테이블
  if (tab === 'all' && failureLinks.length > 0) {
    // ========== 1. FM별 그룹핑 + 기능분석 데이터 조회 (유틸리티 함수 사용) ==========
    const fmGroups = groupFailureLinksWithFunctionData(failureLinks, state);
    
    // 디버깅 로그
    console.log('=== 전체보기 데이터 검증 ===');
    console.log('FM 그룹 수:', fmGroups.size);
    fmGroups.forEach((g, k) => {
      console.log(`FM[${k}]: "${g.fmText}" (${g.fmProcess}) - FE:${g.fes.length}, FC:${g.fcs.length}`);
    });
    
    // ========== 2. 공정명별 그룹핑 (셀합치기용, 유틸리티 함수 사용) ==========
    const processGroups = groupByProcessName(fmGroups);
    const allRows: {
      processName: string;
      fmText: string;
      showFm: boolean;
      fmRowSpan: number;
      showProcess: boolean;
      processRowSpan: number;
      fe: { no: string; scope: string; text: string; severity: number; funcData: { typeName: string; funcName: string; reqName: string } | null } | null;
      feRowSpan: number;
      showFe: boolean;
      fc: { no: string; process: string; m4: string; workElem: string; text: string; funcData: { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string } | null } | null;
      fcRowSpan: number;
      showFc: boolean;
      l2FuncData: { processName: string; funcName: string; productCharName: string } | null;
    }[] = [];
    
    // 행 생성
    let globalIdx = 0;
    processGroups.forEach((pg, procName) => {
      pg.startIdx = globalIdx;
      let processRowCount = 0;
      
      pg.fmList.forEach((group, fmIdx) => {
        const feCount = group.fes.length;
        const fcCount = group.fcs.length;
        const maxRows = Math.max(feCount, fcCount, 1);
        
        for (let i = 0; i < maxRows; i++) {
          // 마지막 행 병합 계산 (유틸리티 함수 사용)
          const mergeConfig = calculateLastRowMerge(feCount, fcCount, i, maxRows);
          
          // FE 항목 추출
          let fe: { no: string; scope: string; text: string; severity: number; funcData: { typeName: string; funcName: string; reqName: string } | null } | null = null;
          if (mergeConfig.showFe && i < feCount) {
            fe = group.fes[i];
          }
          
          // FC 항목 추출
          let fc: { no: string; process: string; m4: string; workElem: string; text: string; funcData: { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string } | null } | null = null;
          if (mergeConfig.showFc && i < fcCount) {
            fc = group.fcs[i];
          }
          
          allRows.push({
            processName: procName,
            fmText: group.fmText,
            showFm: i === 0,
            fmRowSpan: maxRows,
            showProcess: fmIdx === 0 && i === 0,
            processRowSpan: 0, // 나중에 계산
            fe: fe,
            feRowSpan: mergeConfig.feRowSpan,
            showFe: mergeConfig.showFe,
            fc: fc,
            fcRowSpan: mergeConfig.fcRowSpan,
            showFc: mergeConfig.showFc,
            l2FuncData: group.l2FuncData || null,
          });
          
          processRowCount++;
          globalIdx++;
        }
      });
      
      // 공정 rowSpan 설정
      if (pg.startIdx >= 0 && allRows[pg.startIdx]) {
        allRows[pg.startIdx].processRowSpan = processRowCount;
      }
    });
    
    const totalFM = fmGroups.size;
    const totalFE = Array.from(fmGroups.values()).reduce((s, g) => s + g.fes.length, 0);
    const totalFC = Array.from(fmGroups.values()).reduce((s, g) => s + g.fcs.length, 0);
    
    console.log(`총 FM:${totalFM}, FE:${totalFE}, FC:${totalFC}, 행:${allRows.length}`);
    
    const handleExportExcel = () => {
      exportAllViewExcel(state, (state as any).fmeaName || 'PFMEA');
    };
    
    // AP 분석 결과 계산 (5단계, 6단계) - 상위 컴포넌트에서 사용
    const apCounts5 = { H: 0, M: 0, L: 0 };
    const apCounts6 = { H: 0, M: 0, L: 0 };
    allRows.forEach(row => {
      const severity = row.fe?.severity || 0;
      if (severity >= 8) apCounts5.H++;
      else if (severity >= 5) apCounts5.M++;
      else if (severity >= 1) apCounts5.L++;
    });
    
    // FMEA STATUS 정보를 state에 저장 (상위 컴포넌트에서 읽을 수 있도록)
    if (typeof window !== 'undefined') {
      (window as any).__FMEA_STATUS__ = {
        totalFM, totalFE, totalFC, totalRows: allRows.length,
        apCounts5, apCounts6
      };
    }
    
    return (
      <div style={{ width: '100%' }}>
        {/* 테이블 영역 - 헤더 삭제, 바로 테이블 시작 */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ minWidth: '2800px', borderCollapse: 'collapse' }}>
          <thead style={stickyTheadStyle}>
            {/* 1행: 단계 대분류 - 차분하고 고급스러운 색상 */}
            <tr>
              <th colSpan={4} style={{ background: COLORS.structure.main, color: '#fff', border: BORDER, padding: '4px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 구조분석(2단계)</th>
              <th colSpan={8} style={{ background: COLORS.function.main, color: '#fff', border: BORDER, padding: '4px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 기능분석(3단계)</th>
              <th colSpan={6} style={{ background: COLORS.failure.main, color: '#fff', border: BORDER, padding: '4px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 고장분석(4단계)</th>
              <th colSpan={8} style={{ background: COLORS.risk.main, color: '#fff', border: BORDER, padding: '4px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 리스크분석(5단계)</th>
              <th colSpan={14} style={{ background: COLORS.opt.main, color: '#fff', border: BORDER, padding: '4px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 최적화(6단계)</th>
            </tr>
            {/* 2행: 서브그룹 - 레벨별 색상 (1L=파랑, 2L=네이비, 3L=녹색) */}
            <tr>
              <th style={{ background: COLORS.structure.l1.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>1.완제품</th>
              <th style={{ background: COLORS.structure.l2.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>2.메인공정</th>
              <th colSpan={2} style={{ background: COLORS.structure.l3.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>3.작업요소</th>
              <th colSpan={3} style={{ background: COLORS.function.l1.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>1.완제품기능/요구사항</th>
              <th colSpan={2} style={{ background: COLORS.function.l2.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>2.공정기능/제품특성</th>
              <th colSpan={3} style={{ background: COLORS.function.l3.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>3.작업요소기능/공정특성</th>
              <th colSpan={3} style={{ background: COLORS.failure.l1.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>1.고장영향(FE)</th>
              <th style={{ background: COLORS.failure.l2.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>2.고장형태</th>
              <th colSpan={2} style={{ background: COLORS.failure.l3.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>3.고장원인(FC)</th>
              <th colSpan={2} style={{ background: COLORS.risk.prevention.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>예방관리</th>
              <th colSpan={2} style={{ background: COLORS.risk.detection.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>검출관리</th>
              <th colSpan={4} style={{ background: COLORS.risk.evaluation.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>리스크평가</th>
              <th colSpan={4} style={{ background: COLORS.opt.plan.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>계획</th>
              <th colSpan={3} style={{ background: COLORS.opt.monitor.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>모니터링</th>
              <th colSpan={7} style={{ background: COLORS.opt.effect.h2, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.semibold }}>효과평가</th>
            </tr>
            {/* 3행: 컬럼명 - 헤더2행의 연한 버전 */}
            <tr>
              {/* 구조분석 4열 */}
              <th style={{ width: '60px', background: COLORS.structure.l1.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>완제품</th>
              <th style={{ width: '80px', background: COLORS.structure.l2.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>NO+공정명</th>
              <th style={{ width: '30px', background: COLORS.special.m4.h3, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>4M</th>
              <th style={{ width: '70px', background: COLORS.structure.l3.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>작업요소</th>
              {/* 기능분석 8열 */}
              <th style={{ width: '35px', background: COLORS.special.scope.h3, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>구분</th>
              <th style={{ width: '80px', background: COLORS.function.l1.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>완제품기능</th>
              <th style={{ width: '70px', background: COLORS.function.l1.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>요구사항</th>
              <th style={{ width: '80px', background: COLORS.function.l2.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>공정기능</th>
              <th style={{ width: '60px', background: COLORS.function.l2.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>제품특성</th>
              <th style={{ width: '30px', background: COLORS.special.m4.h3, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>4M</th>
              <th style={{ width: '70px', background: COLORS.function.l3.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>작업요소기능</th>
              <th style={{ width: '60px', background: COLORS.function.l3.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>공정특성</th>
              {/* 고장분석 6열 */}
              <th style={{ width: '35px', background: COLORS.special.scope.h3, color: '#fff', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>구분</th>
              <th style={{ width: '80px', background: COLORS.failure.l1.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>고장영향</th>
              <th style={{ width: '25px', background: COLORS.indicator.severity.bg, color: COLORS.indicator.severity.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>S</th>
              <th style={{ width: '80px', background: COLORS.failure.l2.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>고장형태</th>
              <th style={{ width: '60px', background: COLORS.failure.l3.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>작업요소</th>
              <th style={{ width: '80px', background: COLORS.failure.l3.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>고장원인</th>
              {/* 리스크분석 8열 */}
              <th style={{ width: '70px', background: COLORS.risk.prevention.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>예방관리</th>
              <th style={{ width: '25px', background: COLORS.indicator.occurrence.bg, color: COLORS.indicator.occurrence.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>O</th>
              <th style={{ width: '70px', background: COLORS.risk.detection.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>검출관리</th>
              <th style={{ width: '25px', background: COLORS.indicator.detection.bg, color: COLORS.indicator.detection.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>D</th>
              <th style={{ width: '25px', background: COLORS.indicator.ap.bg, color: COLORS.indicator.ap.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>AP</th>
              <th style={{ width: '30px', background: COLORS.indicator.rpn.bg, color: COLORS.indicator.rpn.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>RPN</th>
              <th style={{ width: '40px', background: COLORS.risk.evaluation.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>특별특성</th>
              <th style={{ width: '60px', background: COLORS.risk.evaluation.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>습득교훈</th>
              {/* 최적화 14열 */}
              <th style={{ width: '70px', background: COLORS.opt.plan.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>예방개선</th>
              <th style={{ width: '70px', background: COLORS.opt.plan.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>검출개선</th>
              <th style={{ width: '50px', background: COLORS.opt.plan.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>책임자</th>
              <th style={{ width: '50px', background: COLORS.opt.plan.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>목표일</th>
              <th style={{ width: '35px', background: COLORS.opt.monitor.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>상태</th>
              <th style={{ width: '60px', background: COLORS.opt.monitor.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>개선근거</th>
              <th style={{ width: '50px', background: COLORS.opt.monitor.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>완료일</th>
              <th style={{ width: '25px', background: COLORS.indicator.severity.bg, color: COLORS.indicator.severity.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>S</th>
              <th style={{ width: '25px', background: COLORS.indicator.occurrence.bg, color: COLORS.indicator.occurrence.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>O</th>
              <th style={{ width: '25px', background: COLORS.indicator.detection.bg, color: COLORS.indicator.detection.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>D</th>
              <th style={{ width: '40px', background: COLORS.opt.effect.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>특별특성</th>
              <th style={{ width: '25px', background: COLORS.indicator.ap.bg, color: COLORS.indicator.ap.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>AP</th>
              <th style={{ width: '30px', background: COLORS.indicator.rpn.bg, color: COLORS.indicator.rpn.text, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.bold }}>RPN</th>
              <th style={{ width: '50px', background: COLORS.opt.effect.h3, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, idx) => {
              const zebraBg = idx % 2 === 1 ? '#f5f5f5' : '#fff';
              const cellStyle = { border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, verticalAlign: 'middle' as const, background: zebraBg };
              const getScopeAbbr = (s: string) => s === 'Your Plant' ? 'YOUR PLANT' : s === 'Ship to Plant' ? 'SHIP TO PLANT' : s === 'User' ? 'USER' : '';
              
              // 구조분석 4M 찾기: state.l2에서 작업요소명으로 찾기
              const getStructureM4 = () => {
                if (!row.fc?.workElem) return '';
                // state.l2에서 공정명과 작업요소명으로 매칭
                const process = state.l2?.find((p: any) => p.name === row.processName || `${p.no}. ${p.name}` === row.processName);
                if (!process) return '';
                const workElem = process.l3?.find((w: any) => w.name === row.fc?.workElem);
                return workElem?.m4 || '';
              };
              const structureM4 = getStructureM4();
              
              // RPN 계산: S × O × D (임시 더미 데이터 - 실제 데이터는 state에서)
              const severity = row.fe?.severity || 0;
              const occurrence = 0; // TODO: state에서 가져오기
              const detection = 0; // TODO: state에서 가져오기
              const rpn = severity * occurrence * detection;
              
              // AP 계산: Severity × (Occurrence + Detection) / 2 (간이 공식)
              const ap = occurrence && detection ? Math.round(severity * (occurrence + detection) / 2) : 0;
              
              return (
                <tr key={`all-${idx}`} style={{ borderTop: row.showFm ? '2px solid #666' : undefined, background: zebraBg }}>
                  {/* ===== 구조분석 4열 ===== */}
                  {/* 1. 완제품 공정명: 전체 병합 */}
                  {idx === 0 && <td rowSpan={allRows.length} style={{ ...cellStyle, background: COLORS.structure.l1.cell, fontWeight: FONT_WEIGHTS.semibold, textAlign: 'center' }}>{state.l1?.name || ''}</td>}
                  {/* 2. 메인공정명: 공정별 병합 */}
                  {row.showProcess && row.processRowSpan > 0 && <td rowSpan={row.processRowSpan} style={{ ...cellStyle, background: COLORS.structure.l2.cell, textAlign: 'center' }}>{row.processName}</td>}
                  {/* 3. 4M: 구조분석 데이터에서 가져오기 - FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: COLORS.special.m4.cell, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}>{structureM4 || ''}</td>}
                  {/* 4. 작업요소: FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: COLORS.structure.l3.cell }}>{row.fc?.workElem || ''}</td>}
                  
                  {/* ===== 기능분석 8열 (DB 연결 데이터 표시) ===== */}
                  {/* 1. 구분: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={{ ...cellStyle, background: COLORS.special.scope.cell, textAlign: 'center' }}>{row.fe?.funcData?.typeName || (row.fe ? getScopeAbbr(row.fe.scope) : '')}</td>}
                  {/* 2. 완제품기능: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.fe?.funcData ? { ...cellStyle, background: COLORS.function.l1.cell } : { ...cellStyle, background: '#fafafa', color: '#999', fontStyle: 'italic' }}>{row.fe?.funcData?.funcName || '(미연결)'}</td>}
                  {/* 3. 요구사항: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.fe?.funcData ? { ...cellStyle, background: COLORS.function.l1.cell, fontWeight: 600, textAlign: 'center' } : { ...cellStyle, background: '#fafafa', color: '#999', fontStyle: 'italic', textAlign: 'center' }}>{row.fe?.funcData?.reqName || '(미연결)'}</td>}
                  {/* 4. 공정기능: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2FuncData ? { ...cellStyle, background: COLORS.function.l2.cell } : { ...cellStyle, background: '#fafafa', color: '#999', fontStyle: 'italic' }}>{row.l2FuncData?.funcName || '(미연결)'}</td>}
                  {/* 5. 제품특성: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2FuncData ? { ...cellStyle, background: COLORS.function.l2.cell, fontWeight: 600, textAlign: 'center' } : { ...cellStyle, background: '#fafafa', color: '#999', fontStyle: 'italic', textAlign: 'center' }}>{row.l2FuncData?.productCharName || '(미연결)'}</td>}
                  {/* 6. 4M: 구조분석 데이터에서 가져오기 - FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: COLORS.special.m4.cell, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}>{structureM4 || ''}</td>}
                  {/* 7. 작업요소기능: 기능분석 DB에서 조회 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={row.fc?.funcData ? { ...cellStyle, background: COLORS.function.l3.cell } : (row.fc ? { ...cellStyle, background: '#fafafa', color: '#999', fontStyle: 'italic' } : { ...cellStyle, background: '#fafafa' })}>{row.fc?.funcData?.funcName || (row.fc ? '(미연결)' : '')}</td>}
                  {/* 8. 공정특성: 기능분석 DB에서 조회 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={row.fc?.funcData ? { ...cellStyle, background: COLORS.function.l3.cell, fontWeight: 600, textAlign: 'center' } : (row.fc ? { ...cellStyle, background: '#fafafa', color: '#999', fontStyle: 'italic', textAlign: 'center' } : { ...cellStyle, background: '#fafafa', textAlign: 'center' })}>{row.fc?.funcData?.processCharName || (row.fc ? '(미연결)' : '')}</td>}
                  
                  {/* ===== 고장분석 6열 ===== */}
                  {/* 1. 구분: FE scope - 마지막 행 병합 */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: COLORS.special.scope.cell, textAlign: 'center' }}>{row.fe ? getScopeAbbr(row.fe.scope) : ''}</td>}
                  {/* 2. 고장영향: FE text - 마지막 행 병합 */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: COLORS.failure.l1.cell }}>{row.fe?.text || ''}</td>}
                  {/* 3. 심각도: FE severity - 마지막 행 병합 (주황색 강조) */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: (row.fe?.severity || 0) >= 8 ? COLORS.indicator.severity.bg : COLORS.indicator.ap.bg, color: (row.fe?.severity || 0) >= 8 ? '#fff' : '#000', textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}>{row.fe?.severity || ''}</td>}
                  {/* 4. 고장형태: FM text - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={{ ...cellStyle, background: COLORS.failure.l2.cell, textAlign: 'center', fontWeight: FONT_WEIGHTS.semibold }}>{row.fmText}</td>}
                  {/* 5. 작업요소: FC workElem - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: COLORS.failure.l3.cell }}>{row.fc?.workElem || ''}</td>}
                  {/* 6. 고장원인: FC text - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: COLORS.failure.l3.cell }}>{row.fc?.text || ''}</td>}
                  
                  {/* ===== 리스크분석 8열 ===== */}
                  {/* 1. 예방관리(PC) - 네이비 계열 */}
                  <td style={{ ...cellStyle, background: COLORS.risk.prevention.cell }}></td>
                  {/* 2. 발생도(O) - 주황색 강조 */}
                  <td style={{ ...cellStyle, background: COLORS.indicator.occurrence.bg, color: COLORS.indicator.occurrence.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}>{occurrence || ''}</td>
                  {/* 3. 검출관리(DC) - 네이비 계열 */}
                  <td style={{ ...cellStyle, background: COLORS.risk.detection.cell }}></td>
                  {/* 4. 검출도(D) - 주황색 강조 */}
                  <td style={{ ...cellStyle, background: COLORS.indicator.detection.bg, color: COLORS.indicator.detection.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}>{detection || ''}</td>
                  {/* 5. AP - 황금색 강조 */}
                  <td style={{ ...cellStyle, background: COLORS.indicator.ap.bg, color: COLORS.indicator.ap.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}>{ap || ''}</td>
                  {/* 6. RPN - 빨간색 강조 */}
                  <td style={{ ...cellStyle, background: rpn >= 100 ? COLORS.indicator.rpnHigh.bg : COLORS.indicator.rpn.bg, color: rpn >= 100 ? COLORS.indicator.rpnHigh.text : COLORS.indicator.rpn.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}>{rpn || ''}</td>
                  {/* 7. 특별특성 */}
                  <td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell, textAlign: 'center' }}></td>
                  {/* 8. 습득교훈 */}
                  <td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td>
                  
                  {/* ===== 최적화 14열 ===== */}
                  <td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td>
                  <td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td>
                  <td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td>
                  <td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td>
                  <td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td>
                  <td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td>
                  <td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td>
                  <td style={{ ...cellStyle, background: COLORS.indicator.severity.bg, color: COLORS.indicator.severity.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}></td>
                  <td style={{ ...cellStyle, background: COLORS.indicator.occurrence.bg, color: COLORS.indicator.occurrence.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}></td>
                  <td style={{ ...cellStyle, background: COLORS.indicator.detection.bg, color: COLORS.indicator.detection.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}></td>
                  <td style={{ ...cellStyle, background: COLORS.opt.effect.cell, textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: COLORS.indicator.ap.bg, color: COLORS.indicator.ap.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}></td>
                  <td style={{ ...cellStyle, background: COLORS.indicator.rpn.bg, color: COLORS.indicator.rpn.text, textAlign: 'center', fontWeight: FONT_WEIGHTS.bold }}></td>
                  <td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    );
  }

  // 컬럼 수 계산
  const colCounts = { 2: 4, 3: 8, 4: 6, 5: 8, 6: 14 };
  const totalCols = visibleSteps.reduce((sum, step) => sum + (colCounts[step as keyof typeof colCounts] || 0), 0);
  
  // 전체보기는 고정 너비 (40열 * 약 80px = 3200px), 개별 탭은 100%
  const tableMinWidth = isAllView ? `${totalCols * 80}px` : '100%';

  return (
    <table style={{ 
      width: isAllView ? 'max-content' : '100%', 
      minWidth: tableMinWidth,
      borderCollapse: 'collapse', 
      tableLayout: isAllView ? 'auto' : 'fixed' 
    }}>
      <thead style={stickyTheadStyle}>
        {/* 1행: 단계 대분류 */}
        <tr>
          {visibleSteps.includes(2) && <th colSpan={4} style={{ background: COLORS.structure.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 구조 분석(2단계)</th>}
          {visibleSteps.includes(3) && <th colSpan={8} style={{ background: COLORS.function.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 기능 분석(3단계)</th>}
          {visibleSteps.includes(4) && <th colSpan={6} style={{ background: COLORS.failure.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 고장 분석(4단계)</th>}
          {visibleSteps.includes(5) && <th colSpan={8} style={{ background: COLORS.risk.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 리스크 분석(5단계)</th>}
          {visibleSteps.includes(6) && <th colSpan={14} style={{ background: COLORS.opt.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 최적화(6단계)</th>}
        </tr>
        {/* 2행: 서브그룹 */}
        <tr>
          {visibleSteps.includes(2) && <><th style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>1. 완제품 공정명</th><th style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>2. 메인 공정명</th><th colSpan={2} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>3. 작업 요소명</th></>}
          {visibleSteps.includes(3) && <><th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>1. 완제품 공정기능/요구사항</th><th colSpan={2} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>2. 메인공정기능 및 제품특성</th><th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>3. 작업요소기능 및 공정특성</th></>}
          {visibleSteps.includes(4) && <><th colSpan={3} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>1. 고장영향(FE)</th><th style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>2. 고장형태(FM)</th><th colSpan={2} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>3. 고장원인(FC)</th></>}
          {visibleSteps.includes(5) && <><th colSpan={2} style={{ background: COLORS.risk.prevention.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>현재 예방관리</th><th colSpan={2} style={{ background: COLORS.risk.detection.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>현재 검출관리</th><th colSpan={4} style={{ background: COLORS.risk.evaluation.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>리스크 평가</th></>}
          {visibleSteps.includes(6) && <><th colSpan={4} style={{ background: COLORS.opt.plan.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>계획</th><th colSpan={3} style={{ background: COLORS.opt.monitor.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>결과 모니터링</th><th colSpan={7} style={{ background: COLORS.opt.effect.header, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>효과 평가</th></>}
        </tr>
        {/* 3행: 컬럼명 */}
        <tr>
          {visibleSteps.includes(2) && <><th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>완제품공정명</th><th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>NO+공정명</th><th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>4M</th><th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>작업요소</th></>}
          {visibleSteps.includes(3) && <><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>구분</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>완제품기능</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>요구사항</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>공정기능</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>제품특성</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>작업요소</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>작업요소기능</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>공정특성</th></>}
          {visibleSteps.includes(4) && <><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>구분</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>고장영향(FE)</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>심각도</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>고장형태(FM)</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>작업요소</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>고장원인(FC)</th></>}
          {visibleSteps.includes(5) && <><th style={{ background: COLORS.risk.prevention.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>예방관리(PC)</th><th style={{ background: COLORS.risk.prevention.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>발생도</th><th style={{ background: COLORS.risk.detection.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>검출관리(DC)</th><th style={{ background: COLORS.risk.detection.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>검출도</th><th onClick={onAPClick} style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center', cursor: 'pointer' }}>AP 📊</th><th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>RPN</th><th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>특별특성</th><th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>습득교훈</th></>}
          {visibleSteps.includes(6) && <><th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>예방관리개선</th><th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>검출관리개선</th><th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>책임자성명</th><th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>목표완료일자</th><th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>상태</th><th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>개선결과근거</th><th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>완료일자</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>심각도</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>발생도</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>검출도</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>특별특성</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>AP</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>RPN</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, textAlign: 'center' }}>비고</th></>}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={totalCols} style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: FONT_SIZES.header1 }}>데이터가 없습니다.</td></tr>
        ) : rows.map((row, idx) => {
          const zebraBg = idx % 2 === 1 ? '#f5f5f5' : '#fff';
          const cellStyle = { border: BORDER, padding: '2px 3px', fontSize: FONT_SIZES.small, background: zebraBg };
          return (
            <tr key={`eval-${row.l1Id}-${row.l2Id}-${row.l3Id}-${idx}`} style={{ height: '22px', background: zebraBg }}>
              {visibleSteps.includes(2) && <>{l1Spans[idx] > 0 && <td rowSpan={l1Spans[idx]} style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l1Name}</td>}{l2Spans[idx] > 0 && <td rowSpan={l2Spans[idx]} style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l2No} {row.l2Name}</td>}<td style={{ ...cellStyle, background: COLORS.structure.cell, textAlign: 'center' }}>{row.m4}</td><td style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l3Name}</td></>}
              {visibleSteps.includes(3) && <>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l1Type || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l1Function || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l1Requirement || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l2Functions?.map((f: any) => f.name).join(', ') || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l2ProductChars?.map((c: any) => c.name).join(', ') || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.m4 || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l3Functions?.map((f: any) => f.name).join(', ') || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l3ProcessChars?.map((c: any) => c.name).join(', ') || ''}</td>
              </>}
              {visibleSteps.includes(4) && <>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.l1Type || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.l1FailureEffect || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell, textAlign: 'center' }}>{row.l1Severity || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.l2FailureMode || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.m4 || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.l3FailureCause || ''}</td>
              </>}
              {visibleSteps.includes(5) && <><td style={{ ...cellStyle, background: COLORS.risk.prevention.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.prevention.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.detection.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.detection.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td></>}
              {visibleSteps.includes(6) && <><td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td></>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

