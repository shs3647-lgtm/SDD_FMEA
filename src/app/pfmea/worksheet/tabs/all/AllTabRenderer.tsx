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

  // 색상 정의 (조기 반환 전에 정의)
  const COLORS = {
    structure: { main: '#1565c0', header: '#bbdefb', cell: '#e3f2fd' },
    function: { main: '#1b5e20', header: '#c8e6c9', cell: '#e8f5e9' },
    failure: { main: '#c62828', header: '#fff9c4', cell: '#fffde7' },
    risk: { main: '#6a1b9a', prevention: { header: '#c8e6c9', cell: '#e8f5e9' }, detection: { header: '#bbdefb', cell: '#e3f2fd' }, evaluation: { header: '#f8bbd9', cell: '#fce4ec' } },
    opt: { main: '#2e7d32', plan: { header: '#bbdefb', cell: '#e3f2fd' }, monitor: { header: '#ffe0b2', cell: '#fff3e0' }, effect: { header: '#c8e6c9', cell: '#e8f5e9' } },
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
    
    return (
      <div style={{ width: '100%' }}>
        {/* 전체보기 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#1565c0', color: '#fff', marginBottom: '4px' }}>
          <div style={{ fontWeight: 900, fontSize: '12px' }}>
            📊 P-FMEA 전체보기 (FM:{totalFM} FE:{totalFE} FC:{totalFC}) - 총 {allRows.length}행
          </div>
          <button
            onClick={handleExportExcel}
            style={{
              padding: '6px 14px', fontSize: FONT_SIZES.header1, fontWeight: 700,
              background: '#4caf50', color: '#fff', border: 'none',
              borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            📥 Excel 내보내기
          </button>
        </div>
        <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ minWidth: '2800px', borderCollapse: 'collapse' }}>
          <thead style={stickyTheadStyle}>
            {/* 1행: 단계 대분류 */}
            <tr>
              <th colSpan={4} style={{ background: '#1565c0', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 구조분석(2단계)</th>
              <th colSpan={8} style={{ background: '#1b5e20', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 기능분석(3단계)</th>
              <th colSpan={6} style={{ background: '#c62828', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 고장분석(4단계)</th>
              <th colSpan={8} style={{ background: '#6a1b9a', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 리스크분석(5단계)</th>
              <th colSpan={14} style={{ background: '#e65100', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 최적화(6단계)</th>
            </tr>
            {/* 2행: 서브그룹 */}
            <tr>
              <th style={{ background: '#bbdefb', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>1.완제품</th>
              <th style={{ background: '#bbdefb', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>2.메인공정</th>
              <th colSpan={2} style={{ background: '#bbdefb', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>3.작업요소</th>
              <th colSpan={3} style={{ background: '#c8e6c9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>1.완제품기능/요구사항</th>
              <th colSpan={2} style={{ background: '#c8e6c9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>2.공정기능/제품특성</th>
              <th colSpan={3} style={{ background: '#c8e6c9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>3.작업요소기능/공정특성</th>
              <th colSpan={3} style={{ background: '#fff9c4', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>1.고장영향(FE)</th>
              <th style={{ background: '#fff9c4', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>2.고장형태</th>
              <th colSpan={2} style={{ background: '#fff9c4', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>3.고장원인(FC)</th>
              <th colSpan={2} style={{ background: '#e1bee7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>예방관리</th>
              <th colSpan={2} style={{ background: '#e1bee7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>검출관리</th>
              <th colSpan={4} style={{ background: '#e1bee7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>리스크평가</th>
              <th colSpan={4} style={{ background: '#ffe0b2', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>계획</th>
              <th colSpan={3} style={{ background: '#ffe0b2', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>모니터링</th>
              <th colSpan={7} style={{ background: '#ffe0b2', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>효과평가</th>
            </tr>
            {/* 3행: 컬럼명 */}
            <tr>
              {/* 구조분석 4열 */}
              <th style={{ width: '60px', background: '#e3f2fd', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>완제품</th>
              <th style={{ width: '80px', background: '#e3f2fd', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>NO+공정명</th>
              <th style={{ width: '25px', background: '#e3f2fd', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>4M</th>
              <th style={{ width: '70px', background: '#e3f2fd', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>작업요소</th>
              {/* 기능분석 8열 */}
              <th style={{ width: '35px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>구분</th>
              <th style={{ width: '80px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>완제품기능</th>
              <th style={{ width: '70px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>요구사항</th>
              <th style={{ width: '80px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>공정기능</th>
              <th style={{ width: '60px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>제품특성</th>
              <th style={{ width: '25px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>4M</th>
              <th style={{ width: '70px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>작업요소기능</th>
              <th style={{ width: '60px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>공정특성</th>
              {/* 고장분석 6열 */}
              <th style={{ width: '35px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>구분</th>
              <th style={{ width: '80px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>고장영향</th>
              <th style={{ width: '25px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>S</th>
              <th style={{ width: '80px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>고장형태</th>
              <th style={{ width: '60px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>작업요소</th>
              <th style={{ width: '80px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>고장원인</th>
              {/* 리스크분석 8열 */}
              <th style={{ width: '70px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>예방관리</th>
              <th style={{ width: '25px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>O</th>
              <th style={{ width: '70px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>검출관리</th>
              <th style={{ width: '25px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>D</th>
              <th style={{ width: '25px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>AP</th>
              <th style={{ width: '30px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>RPN</th>
              <th style={{ width: '40px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>특별특성</th>
              <th style={{ width: '60px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>습득교훈</th>
              {/* 최적화 14열 */}
              <th style={{ width: '70px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>예방개선</th>
              <th style={{ width: '70px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>검출개선</th>
              <th style={{ width: '50px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>책임자</th>
              <th style={{ width: '50px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>목표일</th>
              <th style={{ width: '35px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>상태</th>
              <th style={{ width: '60px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>개선근거</th>
              <th style={{ width: '50px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>완료일</th>
              <th style={{ width: '25px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>S</th>
              <th style={{ width: '25px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>O</th>
              <th style={{ width: '25px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>D</th>
              <th style={{ width: '40px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>특별특성</th>
              <th style={{ width: '25px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>AP</th>
              <th style={{ width: '30px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>RPN</th>
              <th style={{ width: '50px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: FONT_SIZES.small }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, idx) => {
              const cellStyle = { border: BORDER, padding: '2px', fontSize: FONT_SIZES.small, verticalAlign: 'middle' as const };
              const getScopeAbbr = (s: string) => s === 'Your Plant' ? 'YP' : s === 'Ship to Plant' ? 'SP' : s === 'User' ? 'U' : '';
              
              return (
                <tr key={`all-${idx}`} style={{ borderTop: row.showFm ? '2px solid #666' : undefined }}>
                  {/* ===== 구조분석 4열 ===== */}
                  {/* 1. 완제품 공정명: 전체 병합 */}
                  {idx === 0 && <td rowSpan={allRows.length} style={{ ...cellStyle, background: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>{state.l1?.name || ''}</td>}
                  {/* 2. 메인공정명: 공정별 병합 */}
                  {row.showProcess && row.processRowSpan > 0 && <td rowSpan={row.processRowSpan} style={{ ...cellStyle, background: '#e3f2fd' }}>{row.processName}</td>}
                  {/* 3. 4M: FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#e3f2fd', textAlign: 'center' }}>{row.fc?.m4 || ''}</td>}
                  {/* 4. 작업요소: FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#e3f2fd' }}>{row.fc?.workElem || ''}</td>}
                  
                  {/* ===== 기능분석 8열 (DB 연결 데이터 표시) ===== */}
                  {/* 1. 구분: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={{ ...cellStyle, background: '#e8f5e9', textAlign: 'center' }}>{row.fe?.funcData?.typeName || (row.fe ? getScopeAbbr(row.fe.scope) : '')}</td>}
                  {/* 2. 완제품기능: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.fe?.funcData ? { ...cellStyle, background: '#e8f5e9' } : { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' }}>{row.fe?.funcData?.funcName || '(미연결)'}</td>}
                  {/* 3. 요구사항: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.fe?.funcData ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' }}>{row.fe?.funcData?.reqName || '(미연결)'}</td>}
                  {/* 4. 공정기능: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2FuncData ? { ...cellStyle, background: '#e8f5e9' } : { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' }}>{row.l2FuncData?.funcName || '(미연결)'}</td>}
                  {/* 5. 제품특성: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2FuncData ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' }}>{row.l2FuncData?.productCharName || '(미연결)'}</td>}
                  {/* 6. 4M: FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#e8f5e9', textAlign: 'center' }}>{row.fc?.m4 || ''}</td>}
                  {/* 7. 작업요소기능: 기능분석 DB에서 조회 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={row.fc?.funcData ? { ...cellStyle, background: '#e8f5e9' } : (row.fc ? { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' } : { ...cellStyle, background: '#fafafa' })}>{row.fc?.funcData?.funcName || (row.fc ? '(미연결)' : '')}</td>}
                  {/* 8. 공정특성: 기능분석 DB에서 조회 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={row.fc?.funcData ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : (row.fc ? { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' } : { ...cellStyle, background: '#fafafa' })}>{row.fc?.funcData?.processCharName || (row.fc ? '(미연결)' : '')}</td>}
                  
                  {/* ===== 고장분석 6열 ===== */}
                  {/* 1. 구분: FE scope - 마지막 행 병합 */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: '#fffde7', textAlign: 'center' }}>{row.fe ? getScopeAbbr(row.fe.scope) : ''}</td>}
                  {/* 2. 고장영향: FE text - 마지막 행 병합 */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: '#fffde7' }}>{row.fe?.text || ''}</td>}
                  {/* 3. 심각도: FE severity - 마지막 행 병합 */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: '#fffde7', textAlign: 'center', fontWeight: 700, color: (row.fe?.severity || 0) >= 8 ? '#c62828' : '#333' }}>{row.fe?.severity || ''}</td>}
                  {/* 4. 고장형태: FM text - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={{ ...cellStyle, background: '#fff8e1', textAlign: 'center', fontWeight: 700 }}>{row.fmText}</td>}
                  {/* 5. 작업요소: FC workElem - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#fffde7' }}>{row.fc?.workElem || ''}</td>}
                  {/* 6. 고장원인: FC text - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#fffde7' }}>{row.fc?.text || ''}</td>}
                  
                  {/* ===== 리스크분석 8열 ===== */}
                  <td style={{ ...cellStyle, background: '#fce4ec' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec' }}></td>
                  
                  {/* ===== 최적화 14열 ===== */}
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
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
          {visibleSteps.includes(2) && <th colSpan={4} style={{ background: COLORS.structure.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 구조 분석(2단계)</th>}
          {visibleSteps.includes(3) && <th colSpan={8} style={{ background: COLORS.function.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 기능 분석(3단계)</th>}
          {visibleSteps.includes(4) && <th colSpan={6} style={{ background: COLORS.failure.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 고장 분석(4단계)</th>}
          {visibleSteps.includes(5) && <th colSpan={8} style={{ background: COLORS.risk.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 리스크 분석(5단계)</th>}
          {visibleSteps.includes(6) && <th colSpan={14} style={{ background: COLORS.opt.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: FONT_SIZES.cell, textAlign: 'center' }}>P-FMEA 최적화(6단계)</th>}
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
          <tr><td colSpan={totalCols} style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}>데이터가 없습니다.</td></tr>
        ) : rows.map((row, idx) => {
          const cellStyle = { border: BORDER, padding: '2px 3px', fontSize: FONT_SIZES.small, background: '#fff' };
          return (
            <tr key={`eval-${row.l1Id}-${row.l2Id}-${row.l3Id}-${idx}`} style={{ height: '22px' }}>
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

