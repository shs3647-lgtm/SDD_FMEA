/**
 * @file AllTabWithLinks.tsx
 * @description 전체보기 탭 - 고장연결 데이터가 있을 때 렌더링 (40열 FMEA 워크시트)
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { WorksheetState, FONT_WEIGHTS } from '../../constants';
import { groupFailureLinksWithFunctionData, groupByProcessName, calculateLastRowMerge } from '../../utils';
import { exportAllViewExcel } from '../../excel-export';
import SODSelectModal from '@/components/modals/SODSelectModal';
import DataSelectModal from '@/components/modals/DataSelectModal';
import { colHeaderStyle, colHeaderStyleWithOptions } from './AllTabStyles';
import { structureCellStyle, functionCellStyle, failureCellStyle, severityCellStyle, riskCellStyle, optCellStyle, rpnCellStyle, inputFieldStyle, dateInputStyle, selectFieldStyle } from './AllTabCellStyles';
import { evalRowStyle } from './AllTabEvalStyles';
import { calculateAP } from './apCalculator';
import { ALL_TAB_COLORS, TW_CLASSES, BORDER } from './constants';
import { useAllTabModals, SODModalState, ControlModalState } from './hooks/useAllTabModals';

interface AllTabWithLinksProps {
  state: WorksheetState;
  setState?: React.Dispatch<React.SetStateAction<WorksheetState>>;
  failureLinks: any[];
  visibleSteps?: number[];
}

/**
 * 고장연결 데이터가 있을 때 40열 테이블 렌더링
 */
// 기본 컬럼 폭 설정 (40개 컬럼)
const DEFAULT_COL_WIDTHS: Record<string, number> = {
  // 구조분석 4열
  col_product: 60, col_process: 80, col_m4_1: 30, col_part: 70,
  // 기능분석 8열
  col_scope1: 70, col_prodFunc: 120, col_req: 70, col_focusFunc: 160,
  col_prodChar: 80, col_m4_2: 30, col_partFunc: 140, col_designChar: 80,
  // 고장분석 6열
  col_scope2: 90, col_fe: 120, col_s: 30, col_fm: 120, col_fcPart: 100, col_fc: 130,
  // 리스크분석 8열
  col_prev: 90, col_o: 30, col_det: 90, col_d: 25, col_ap: 25, col_rpn: 30, col_sc: 60, col_lesson: 80,
  // 최적화 14열
  col_action: 120, col_resp: 60, col_target: 70, col_status: 50,
  col_result: 100, col_complete: 70, col_evidence: 60,
  col_s2: 25, col_o2: 25, col_d2: 25, col_ap2: 25, col_rpn2: 30, col_remark: 80, col_approved: 50,
};

export default function AllTabWithLinks({ state, setState, failureLinks, visibleSteps: propsVisibleSteps }: AllTabWithLinksProps) {
  const COLORS = ALL_TAB_COLORS;
  // visibleSteps: props 우선, 없으면 state, 그래도 없으면 기본값
  const visibleSteps = propsVisibleSteps || (state.visibleSteps || [2, 3, 4, 5, 6]);
  
  // 테이블 ref
  const tableRef = useRef<HTMLTableElement>(null);
  
  // ===== 컬럼 리사이즈 기능 (순수 DOM 조작) =====
  const handleColumnResize = useCallback((e: React.MouseEvent<HTMLDivElement>, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const table = tableRef.current;
    if (!table) return;
    
    const startX = e.clientX;
    const headerRow = table.querySelector('thead tr:last-child') as HTMLTableRowElement;
    if (!headerRow) return;
    
    const th = headerRow.cells[colIndex] as HTMLTableCellElement;
    if (!th) return;
    
    const startWidth = th.offsetWidth;
    
    // 드래그 중 커서 변경
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(30, startWidth + delta);
      th.style.width = `${newWidth}px`;
      th.style.minWidth = `${newWidth}px`;
      
      // colgroup의 해당 col도 업데이트
      const colgroup = table.querySelector('colgroup');
      if (colgroup && colgroup.children[colIndex]) {
        (colgroup.children[colIndex] as HTMLElement).style.width = `${newWidth}px`;
      }
    };
    
    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // 리사이즈 핸들이 포함된 헤더 셀 생성
  const createResizableTh = (colIndex: number, content: React.ReactNode, style: React.CSSProperties, key?: string) => (
    <th key={key || `col-${colIndex}`} style={{ ...style, position: 'relative' }}>
      {content}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '8px',
          cursor: 'col-resize',
          background: 'transparent',
          zIndex: 100,
        }}
        onMouseDown={(e) => handleColumnResize(e, colIndex)}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,35,126,0.5)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      />
    </th>
  );
  
  // 모달 훅 사용
  const {
    sodModal,
    controlModal,
    handleSODClick,
    handleSODSelect,
    handleLessonInput,
    openControlModal,
    closeControlModal,
    closeSodModal,
    setControlModal
  } = useAllTabModals(setState);
  
  // 스타일 함수
  const headerCellStyle = (bg: string, color = '#fff'): React.CSSProperties => ({
    background: bg, color, border: BORDER, padding: '4px', 
    fontWeight: FONT_WEIGHTS.semibold, fontSize: '11px', textAlign: 'center'
  });
  
  const subHeaderStyle = (bg: string): React.CSSProperties => ({
    background: bg, color: '#fff', border: BORDER, padding: '2px', 
    fontSize: '10px', fontWeight: FONT_WEIGHTS.semibold
  });

  // FM별 그룹핑 + 기능분석 데이터 조회
  const fmGroups = groupFailureLinksWithFunctionData(failureLinks, state);
  
  // 공정명별 그룹핑 (셀합치기용)
  const processGroups = groupByProcessName(fmGroups);
  
  // 행 데이터 생성
  const allRows: {
    processName: string;
    fmText: string;
    showFm: boolean;
    fmRowSpan: number;
    showProcess: boolean;
    processRowSpan: number;
    fe: { no: string; scope: string; text: string; severity: number; funcData: any } | null;
    feRowSpan: number;
    showFe: boolean;
    fc: { no: string; process: string; m4: string; workElem: string; text: string; funcData: any } | null;
    fcRowSpan: number;
    showFc: boolean;
    l2FuncData: any;
    maxFeSeverity: number;
    allFeSeverities: number[];
    allFeTexts: string[];
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
      
      const allFeSeverities = group.fes.map((fe: any) => fe.severity || 0);
      const allFeTexts = group.fes.map((fe: any) => fe.text || '');
      const maxFeSeverity = allFeSeverities.length > 0 ? Math.max(...allFeSeverities) : 0;
      
      for (let i = 0; i < maxRows; i++) {
        const mergeConfig = calculateLastRowMerge(feCount, fcCount, i, maxRows);
        
        let fe = null;
        if (mergeConfig.showFe && i < feCount) {
          fe = group.fes[i];
        }
        
        let fc = null;
        if (mergeConfig.showFc && i < fcCount) {
          fc = group.fcs[i];
        }
        
        allRows.push({
          processName: procName,
          fmText: group.fmText,
          showFm: i === 0,
          fmRowSpan: maxRows,
          showProcess: fmIdx === 0 && i === 0,
          processRowSpan: 0,
          fe, feRowSpan: mergeConfig.feRowSpan, showFe: mergeConfig.showFe,
          fc, fcRowSpan: mergeConfig.fcRowSpan, showFc: mergeConfig.showFc,
          l2FuncData: group.l2FuncData || null,
          maxFeSeverity, allFeSeverities, allFeTexts,
        });
        
        processRowCount++;
        globalIdx++;
      }
    });
    
    if (pg.startIdx >= 0 && allRows[pg.startIdx]) {
      allRows[pg.startIdx].processRowSpan = processRowCount;
    }
  });
  
  const totalFM = fmGroups.size;
  const totalFE = Array.from(fmGroups.values()).reduce((s, g) => s + g.fes.length, 0);
  const totalFC = Array.from(fmGroups.values()).reduce((s, g) => s + g.fcs.length, 0);
  
  // FMEA STATUS 저장
  if (typeof window !== 'undefined') {
    (window as any).__FMEA_STATUS__ = { totalFM, totalFE, totalFC, totalRows: allRows.length };
  }
  
  // 컬럼 키 배열 (순서대로)
  const COL_KEYS = [
    // 구조분석 4열
    'col_product', 'col_process', 'col_m4_1', 'col_part',
    // 기능분석 8열
    'col_scope1', 'col_prodFunc', 'col_req', 'col_focusFunc', 'col_prodChar', 'col_m4_2', 'col_partFunc', 'col_designChar',
    // 고장분석 6열
    'col_scope2', 'col_fe', 'col_s', 'col_fm', 'col_fcPart', 'col_fc',
    // 리스크분석 8열
    'col_prev', 'col_o', 'col_det', 'col_d', 'col_ap', 'col_rpn', 'col_sc', 'col_lesson',
    // 최적화 14열
    'col_action', 'col_detAction', 'col_resp', 'col_target', 'col_status', 'col_result', 'col_complete',
    'col_s2', 'col_o2', 'col_d2', 'col_sc2', 'col_ap2', 'col_rpn2', 'col_remark',
  ];

  // 리사이즈 핸들이 있는 헤더 셀 (직접 DOM 조작)
  const ResizableTh = ({ colKey, children, style, colSpan }: { colKey: string; children: React.ReactNode; style: React.CSSProperties; colSpan?: number }) => {
    const thRef = useRef<HTMLTableCellElement>(null);
    
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      const th = thRef.current;
      if (!th) return;
      
      const startX = e.clientX;
      const startWidth = th.offsetWidth;
      
      // 드래그 중 스타일
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(30, startWidth + delta);
        th.style.width = `${newWidth}px`;
        th.style.minWidth = `${newWidth}px`;
        
        // colgroup의 해당 col도 업데이트
        const table = th.closest('table');
        if (table) {
          const colgroup = table.querySelector('colgroup');
          const colIndex = Array.from(th.parentElement?.children || []).indexOf(th);
          if (colgroup && colgroup.children[colIndex]) {
            (colgroup.children[colIndex] as HTMLElement).style.width = `${newWidth}px`;
          }
        }
      };
      
      const handleMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, []);
    
    const initialWidth = DEFAULT_COL_WIDTHS[colKey] || 60;
    
    return (
      <th 
        ref={thRef}
        colSpan={colSpan}
        style={{ 
          ...style, 
          position: 'relative', 
          width: colSpan ? undefined : `${initialWidth}px`,
          minWidth: colSpan ? undefined : '30px',
        }}
      >
        {children}
        {!colSpan && (
          <div 
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              cursor: 'col-resize',
              background: 'transparent',
              zIndex: 100,
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,35,126,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          />
        )}
      </th>
    );
  };

  return (
    <div style={{ width: '100%', minWidth: '1800px', overflowX: 'visible' }}>
      <table 
        ref={tableRef}
        className={`${TW_CLASSES.table} w-full all-tab-table`} 
        style={{ tableLayout: 'fixed', minWidth: '1800px' }}
      >
        {/* colgroup으로 컬럼 폭 제어 */}
        <colgroup>
          {COL_KEYS.map((key, idx) => (
            <col key={key} data-col-index={idx} style={{ width: `${DEFAULT_COL_WIDTHS[key] || 60}px` }} />
          ))}
        </colgroup>
        <thead className={TW_CLASSES.stickyHead}>
          {/* 1행: 단계 대분류 */}
          <tr>
            {visibleSteps.includes(2) && <th colSpan={4} style={headerCellStyle(COLORS.structure.main)}>P-FMEA 구조분석(2단계)</th>}
            {visibleSteps.includes(3) && <th colSpan={8} style={headerCellStyle(COLORS.function.main)}>P-FMEA 기능분석(3단계)</th>}
            {visibleSteps.includes(4) && <th colSpan={6} style={headerCellStyle('#f57c00')}>P-FMEA 고장분석(4단계)</th>}
            {visibleSteps.includes(5) && <th colSpan={8} style={headerCellStyle(COLORS.risk.main)}>P-FMEA 리스크분석(5단계)</th>}
            {visibleSteps.includes(6) && <th colSpan={14} style={headerCellStyle(COLORS.opt.main)}>P-FMEA 최적화(6단계)</th>}
          </tr>
          {/* 2행: 서브그룹 */}
          <tr>
            {visibleSteps.includes(2) && <>
              <th style={subHeaderStyle(COLORS.structure.l1.h2)}>1.완제품 공정명</th>
              <th style={subHeaderStyle(COLORS.structure.l2.h2)}>2.메인공정</th>
              <th colSpan={2} style={subHeaderStyle(COLORS.structure.l3.h2)}>3.작업요소</th>
            </>}
            {visibleSteps.includes(3) && <>
              <th colSpan={3} style={subHeaderStyle(COLORS.function.l1.h2)}>1.완제품 기능</th>
              <th colSpan={2} style={subHeaderStyle(COLORS.function.l2.h2)}>2.공정기능/제품특성</th>
              <th colSpan={3} style={subHeaderStyle(COLORS.function.l3.h2)}>3.작업요소기능/공정특성</th>
            </>}
            {visibleSteps.includes(4) && <>
              <th colSpan={3} style={subHeaderStyle(COLORS.failure.l1.h2)}>1.고장영향(FE)</th>
              <th style={subHeaderStyle(COLORS.failure.l2.h2)}>2.고장형태</th>
              <th colSpan={2} style={subHeaderStyle(COLORS.failure.l3.h2)}>3.고장원인(FC)</th>
            </>}
            {visibleSteps.includes(5) && <>
              <th colSpan={2} style={subHeaderStyle(COLORS.risk.prevention.h2)}>예방관리</th>
              <th colSpan={2} style={subHeaderStyle(COLORS.risk.detection.h2)}>검출관리</th>
              <th colSpan={4} style={subHeaderStyle(COLORS.risk.evaluation.h2)}>리스크평가</th>
            </>}
            {visibleSteps.includes(6) && <>
              <th colSpan={4} style={subHeaderStyle(COLORS.opt.plan.h2)}>계획</th>
              <th colSpan={3} style={subHeaderStyle(COLORS.opt.monitor.h2)}>모니터링</th>
              <th colSpan={7} style={subHeaderStyle(COLORS.opt.effect.h2)}>효과평가</th>
            </>}
          </tr>
          {/* 3행: 컬럼명 (드래그 리사이즈 가능) */}
          <tr>
            {/* 구조분석 4열 */}
            {visibleSteps.includes(2) && <>
              <ResizableTh colKey="col_product" style={colHeaderStyle('60px', COLORS.structure.l1.h3)}>제품명</ResizableTh>
              <ResizableTh colKey="col_process" style={colHeaderStyle('80px', COLORS.structure.l2.h3)}>NO+공정명</ResizableTh>
              <ResizableTh colKey="col_m4_1" style={colHeaderStyleWithOptions('30px', COLORS.special.m4.h3, '#fff', { fontWeight: FONT_WEIGHTS.bold })}>4M</ResizableTh>
              <ResizableTh colKey="col_part" style={colHeaderStyle('70px', COLORS.structure.l3.h3)}>작업요소</ResizableTh>
            </>}
            {/* 기능분석 8열 */}
            {visibleSteps.includes(3) && <>
              <ResizableTh colKey="col_scope1" style={colHeaderStyle('70px', COLORS.special.scope.h3, '#fff')}>구분</ResizableTh>
              <ResizableTh colKey="col_prodFunc" style={colHeaderStyle('120px', COLORS.function.l1.h3)}>제품 기능</ResizableTh>
              <ResizableTh colKey="col_req" style={colHeaderStyle('70px', COLORS.function.l1.h3)}>요구사항</ResizableTh>
              <ResizableTh colKey="col_focusFunc" style={colHeaderStyle('160px', COLORS.function.l2.h3)}>공정기능</ResizableTh>
              <ResizableTh colKey="col_prodChar" style={colHeaderStyleWithOptions('80px', COLORS.function.l2.h3, undefined, { whiteSpace: 'nowrap' })}>제품특성</ResizableTh>
              <ResizableTh colKey="col_m4_2" style={colHeaderStyleWithOptions('30px', COLORS.special.m4.h3, '#fff', { fontWeight: FONT_WEIGHTS.bold })}>4M</ResizableTh>
              <ResizableTh colKey="col_partFunc" style={colHeaderStyle('140px', COLORS.function.l3.h3)}>작업요소기능</ResizableTh>
              <ResizableTh colKey="col_designChar" style={colHeaderStyleWithOptions('80px', COLORS.function.l3.h3, undefined, { whiteSpace: 'nowrap' })}>공정특성</ResizableTh>
            </>}
            {/* 고장분석 6열 */}
            {visibleSteps.includes(4) && <>
              <ResizableTh colKey="col_scope2" style={colHeaderStyleWithOptions('90px', COLORS.special.scope.h3, '#fff', { whiteSpace: 'nowrap' })}>구분</ResizableTh>
              <ResizableTh colKey="col_fe" style={colHeaderStyleWithOptions('120px', COLORS.failure.l1.h3, undefined, { whiteSpace: 'nowrap' })}>고장영향</ResizableTh>
              <ResizableTh colKey="col_s" style={colHeaderStyleWithOptions('30px', COLORS.indicator.severity.bg, COLORS.indicator.severity.text, { fontWeight: FONT_WEIGHTS.bold })}>S</ResizableTh>
              <ResizableTh colKey="col_fm" style={colHeaderStyleWithOptions('120px', COLORS.failure.l2.h3, undefined, { whiteSpace: 'nowrap' })}>고장형태</ResizableTh>
              <ResizableTh colKey="col_fcPart" style={colHeaderStyleWithOptions('100px', COLORS.failure.l3.h3, undefined, { whiteSpace: 'nowrap' })}>작업요소</ResizableTh>
              <ResizableTh colKey="col_fc" style={colHeaderStyleWithOptions('130px', COLORS.failure.l3.h3, undefined, { whiteSpace: 'nowrap' })}>고장원인</ResizableTh>
            </>}
            {/* 리스크분석 8열 */}
            {visibleSteps.includes(5) && <>
              <ResizableTh colKey="col_prev" style={colHeaderStyleWithOptions('90px', COLORS.risk.prevention.h3, '#fff', { whiteSpace: 'nowrap' })}>예방관리</ResizableTh>
              <ResizableTh colKey="col_o" style={colHeaderStyleWithOptions('30px', COLORS.indicator.occurrence.bg, COLORS.indicator.occurrence.text, { fontWeight: FONT_WEIGHTS.bold })}>O</ResizableTh>
              <ResizableTh colKey="col_det" style={colHeaderStyleWithOptions('90px', COLORS.risk.detection.h3, '#fff', { whiteSpace: 'nowrap' })}>검출관리</ResizableTh>
              <ResizableTh colKey="col_d" style={colHeaderStyleWithOptions('25px', COLORS.indicator.detection.bg, COLORS.indicator.detection.text, { fontWeight: FONT_WEIGHTS.bold })}>D</ResizableTh>
              <ResizableTh colKey="col_ap" style={colHeaderStyleWithOptions('25px', COLORS.indicator.ap.bg, COLORS.indicator.ap.text, { fontWeight: FONT_WEIGHTS.bold })}>AP</ResizableTh>
              <ResizableTh colKey="col_rpn" style={colHeaderStyleWithOptions('30px', COLORS.indicator.rpn.bg, COLORS.indicator.rpn.text, { fontWeight: FONT_WEIGHTS.bold })}>RPN</ResizableTh>
              <ResizableTh colKey="col_sc" style={colHeaderStyleWithOptions('60px', COLORS.risk.evaluation.h3, undefined, { whiteSpace: 'nowrap' })}>특별특성</ResizableTh>
              <ResizableTh colKey="col_lesson" style={colHeaderStyleWithOptions('80px', '#f97316', '#fff', { whiteSpace: 'nowrap' })}>습득교훈</ResizableTh>
            </>}
            {/* 최적화 14열 */}
            {visibleSteps.includes(6) && <>
              <ResizableTh colKey="col_action" style={colHeaderStyle('70px', COLORS.opt.plan.h3)}>예방개선</ResizableTh>
              <ResizableTh colKey="col_detAction" style={colHeaderStyle('70px', COLORS.opt.plan.h3)}>검출개선</ResizableTh>
              <ResizableTh colKey="col_resp" style={colHeaderStyle('50px', COLORS.opt.plan.h3)}>책임자</ResizableTh>
              <ResizableTh colKey="col_target" style={colHeaderStyle('50px', COLORS.opt.plan.h3)}>목표일</ResizableTh>
              <ResizableTh colKey="col_status" style={colHeaderStyle('35px', COLORS.opt.monitor.h3)}>상태</ResizableTh>
              <ResizableTh colKey="col_result" style={colHeaderStyle('60px', COLORS.opt.monitor.h3)}>개선근거</ResizableTh>
              <ResizableTh colKey="col_complete" style={colHeaderStyle('50px', COLORS.opt.monitor.h3)}>완료일</ResizableTh>
              <ResizableTh colKey="col_s2" style={colHeaderStyleWithOptions('25px', COLORS.indicator.severity.bg, COLORS.indicator.severity.text, { fontWeight: FONT_WEIGHTS.bold })}>S</ResizableTh>
              <ResizableTh colKey="col_o2" style={colHeaderStyleWithOptions('25px', COLORS.indicator.occurrence.bg, COLORS.indicator.occurrence.text, { fontWeight: FONT_WEIGHTS.bold })}>O</ResizableTh>
              <ResizableTh colKey="col_d2" style={colHeaderStyleWithOptions('25px', COLORS.indicator.detection.bg, COLORS.indicator.detection.text, { fontWeight: FONT_WEIGHTS.bold })}>D</ResizableTh>
              <ResizableTh colKey="col_sc2" style={colHeaderStyle('40px', COLORS.opt.effect.h3)}>특별특성</ResizableTh>
              <ResizableTh colKey="col_ap2" style={colHeaderStyleWithOptions('25px', COLORS.indicator.ap.bg, COLORS.indicator.ap.text, { fontWeight: FONT_WEIGHTS.bold })}>AP</ResizableTh>
              <ResizableTh colKey="col_rpn2" style={colHeaderStyleWithOptions('30px', COLORS.indicator.rpn.bg, COLORS.indicator.rpn.text, { fontWeight: FONT_WEIGHTS.bold })}>RPN</ResizableTh>
              <ResizableTh colKey="col_remark" style={colHeaderStyle('50px', COLORS.opt.effect.h3)}>비고</ResizableTh>
            </>}
          </tr>
        </thead>
        <tbody>
          {allRows.map((row, idx) => {
            const zebraBg = idx % 2 === 1 ? '#f5f5f5' : '#fff';
            const getScopeAbbr = (s: string) => s === 'Your Plant' ? 'YOUR PLANT' : s === 'Ship to Plant' ? 'SHIP TO PLANT' : s === 'User' ? 'USER' : '';
            
            // 구조분석 4M 찾기
            const getStructureM4 = () => {
              if (!row.fc?.workElem) return '';
              const process = state.l2?.find((p: any) => p.name === row.processName || `${p.no}. ${p.name}` === row.processName);
              if (!process) return '';
              const workElem = process.l3?.find((w: any) => w.name === row.fc?.workElem);
              return workElem?.m4 || '';
            };
            const structureM4 = getStructureM4();
            
            // RPN 계산
            const riskData = state.riskData || {};
            const allSeveritiesWithDB = row.allFeTexts.map((feT, i) => {
              const dbSev = riskData[`S-fe-${feT}`];
              const rawVal = dbSev !== undefined ? Number(dbSev) : row.allFeSeverities[i] || 0;
              return Math.min(Math.max(rawVal, 0), 10);
            });
            const severity = allSeveritiesWithDB.length > 0 ? Math.max(...allSeveritiesWithDB, 0) : 0;
            const rawO = Number(riskData[`risk-${idx}-O`]) || 0;
            const rawD = Number(riskData[`risk-${idx}-D`]) || 0;
            const occurrence = Math.min(Math.max(rawO, 0), 10);
            const detection = Math.min(Math.max(rawD, 0), 10);
            const rpn = severity * occurrence * detection;
            const ap = calculateAP(severity, occurrence, detection);
            
            return (
              <tr key={`all-${idx}`} style={evalRowStyle(zebraBg, row.showFm ? '2px solid #666' : undefined)}>
                {/* 구조분석 4열 */}
                {visibleSteps.includes(2) && <>
                  {idx === 0 && <td rowSpan={allRows.length} className="text-center font-semibold" style={structureCellStyle(COLORS.structure.l1.cell, 0, COLORS.structure.l1.cell, { textAlign: 'center', fontWeight: FONT_WEIGHTS.semibold })}>{state.l1?.name || ''}</td>}
                  {row.showProcess && row.processRowSpan > 0 && <td rowSpan={row.processRowSpan} style={structureCellStyle(COLORS.structure.l2.cell, idx, zebraBg, { textAlign: 'center' })}>{row.processName}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={structureCellStyle(COLORS.special.m4.cell, idx, zebraBg, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold })}>{structureM4 || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={structureCellStyle(COLORS.structure.l3.cell, idx, zebraBg)}>{row.fc?.workElem || ''}</td>}
                </>}
                
                {/* 기능분석 8열 */}
                {visibleSteps.includes(3) && <>
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={structureCellStyle(COLORS.special.scope.cell, idx, zebraBg, { textAlign: 'center' })}>{row.fe?.funcData?.typeName || (row.fe ? getScopeAbbr(row.fe.scope) : '')}</td>}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={functionCellStyle(COLORS.function.l1.cell, idx, zebraBg, !!row.fe?.funcData)}>{row.fe?.funcData?.funcName || '(미연결)'}</td>}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={functionCellStyle(COLORS.function.l1.cell, idx, zebraBg, !!row.fe?.funcData, { textAlign: 'center', fontWeight: 600 })}>{row.fe?.funcData?.reqName || '(미연결)'}</td>}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={functionCellStyle(COLORS.function.l2.cell, idx, zebraBg, !!row.l2FuncData)}>{row.l2FuncData?.funcName || '(미연결)'}</td>}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={functionCellStyle(COLORS.function.l2.cell, idx, zebraBg, !!row.l2FuncData, { textAlign: 'center', fontWeight: 600 })}>{row.l2FuncData?.productCharName || '(미연결)'}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={structureCellStyle(COLORS.special.m4.cell, idx, zebraBg, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold })}>{structureM4 || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={functionCellStyle(COLORS.function.l3.cell, idx, zebraBg, !!row.fc?.funcData)}>{row.fc?.funcData?.funcName || (row.fc ? '(미연결)' : '')}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={functionCellStyle(COLORS.function.l3.cell, idx, zebraBg, !!row.fc?.funcData, { textAlign: 'center', fontWeight: 600 })}>{row.fc?.funcData?.processCharName || (row.fc ? '(미연결)' : '')}</td>}
                </>}
                
                {/* 고장분석 6열 */}
                {visibleSteps.includes(4) && <>
                  {row.showFe && <td rowSpan={row.feRowSpan} style={failureCellStyle(COLORS.special.scope.cell, idx, zebraBg, { textAlign: 'center' })}>{row.fe ? getScopeAbbr(row.fe.scope) : ''}</td>}
                  {row.showFe && (() => {
                    const feText = row.fe?.text || '';
                    const feSeverityFromDB = riskData[`S-fe-${feText}`] || row.fe?.severity || 0;
                    return (
                      <td rowSpan={row.feRowSpan} style={failureCellStyle(COLORS.failure.l1.cell, idx, zebraBg)}>
                        {feText}{feSeverityFromDB ? <span className="text-red-800 font-semibold">({feSeverityFromDB})</span> : ''}
                      </td>
                    );
                  })()}
                  {row.showFe && (() => {
                    const feText = row.fe?.text || '';
                    const riskDataRef = state.riskData || {};
                    const allSevWithDB = row.allFeTexts.map((feT, i) => {
                      const dbSev = riskDataRef[`S-fe-${feT}`];
                      return dbSev !== undefined ? Number(dbSev) : row.allFeSeverities[i] || 0;
                    });
                    const maxSeverity = allSevWithDB.length > 0 ? Math.max(...allSevWithDB, 0) : 0;
                    const currentFeSev = Number(riskDataRef[`S-fe-${feText}`]) || row.fe?.severity || 0;
                    return (
                      <td 
                        rowSpan={row.feRowSpan} 
                        style={severityCellStyle(maxSeverity, idx, zebraBg)}
                        onClick={() => handleSODClick('S', 'risk', idx, currentFeSev, row.fe?.scope, undefined, feText)}
                        title={`클릭하여 "${feText}" 심각도 평가`}
                      >
                        {maxSeverity || ''}
                      </td>
                    );
                  })()}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={failureCellStyle(COLORS.failure.l2.cell, idx, zebraBg, { textAlign: 'center', fontWeight: FONT_WEIGHTS.semibold })}>{row.fmText}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={failureCellStyle(COLORS.failure.l3.cell, idx, zebraBg)}>{row.fc?.workElem || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={failureCellStyle(COLORS.failure.l3.cell, idx, zebraBg)}>{row.fc?.text || ''}</td>}
                </>}
                
                {/* 리스크분석 8열 */}
                {visibleSteps.includes(5) && <>
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.risk.prevention.cell, idx, zebraBg, '#000', { cursor: 'pointer', fontWeight: 500 })} onClick={() => openControlModal('prevention', idx, row.fc?.text)} title={`클릭하여 예방관리 선택`}>{riskData[`prevention-${idx}`] || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.indicator.occurrence.bg, idx, zebraBg, COLORS.indicator.occurrence.text, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold, cursor: 'pointer' })} onClick={() => handleSODClick('O', 'risk', idx, occurrence)} title="클릭하여 발생도 평가">{occurrence || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.risk.detection.cell, idx, zebraBg, '#000', { cursor: 'pointer', fontWeight: 500 })} onClick={() => openControlModal('detection', idx, row.fc?.text)} title={`클릭하여 검출관리 선택`}>{riskData[`detection-${idx}`] || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.indicator.detection.bg, idx, zebraBg, COLORS.indicator.detection.text, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold, cursor: 'pointer' })} onClick={() => handleSODClick('D', 'risk', idx, detection)} title="클릭하여 검출도 평가">{detection || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.indicator.ap.bg, idx, zebraBg, COLORS.indicator.ap.text, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold })}>{ap || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={rpnCellStyle(rpn, idx, zebraBg, COLORS)}>{rpn || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.risk.evaluation.cell, idx, zebraBg, '#dc2626', { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold, cursor: 'pointer' })} onClick={() => openControlModal('specialChar', idx, row.fc?.text)} title="클릭하여 특별특성 선택">{riskData[`specialChar-${idx}`] || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle('#fed7aa', idx, zebraBg, '0')}><input type="text" value={String(riskData[`lesson-${idx}`] || '')} onChange={(e) => handleLessonInput(idx, e.target.value)} style={inputFieldStyle} /></td>}
                </>}
                
                {/* 최적화 14열 */}
                {visibleSteps.includes(6) && <>
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle(COLORS.opt.plan.cell, idx, zebraBg, '0')}><input type="text" value={String(riskData[`opt-action-${idx}`] || '')} onChange={(e) => setState && setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [`opt-action-${idx}`]: e.target.value } }))} style={inputFieldStyle} /></td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle(COLORS.opt.plan.cell, idx, zebraBg, '0')}><input type="text" value={String(riskData[`opt-detection-action-${idx}`] || '')} onChange={(e) => setState && setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [`opt-detection-action-${idx}`]: e.target.value } }))} style={inputFieldStyle} /></td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle(COLORS.opt.plan.cell, idx, zebraBg, '0')}><input type="text" value={String(riskData[`opt-manager-${idx}`] || '')} onChange={(e) => setState && setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [`opt-manager-${idx}`]: e.target.value } }))} style={inputFieldStyle} /></td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle(COLORS.opt.plan.cell, idx, zebraBg, '0')}><input type="date" value={String(riskData[`opt-target-date-${idx}`] || '')} onChange={(e) => setState && setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [`opt-target-date-${idx}`]: e.target.value } }))} style={dateInputStyle} /></td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle(COLORS.opt.monitor.cell, idx, zebraBg, '0')}><select value={String(riskData[`opt-status-${idx}`] || '')} onChange={(e) => setState && setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [`opt-status-${idx}`]: e.target.value } }))} style={selectFieldStyle}><option value=""></option><option value="진행">진행</option><option value="지연">지연</option><option value="완료">완료</option></select></td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle(COLORS.opt.monitor.cell, idx, zebraBg, '0')}><input type="text" value={String(riskData[`opt-improve-reason-${idx}`] || '')} onChange={(e) => setState && setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [`opt-improve-reason-${idx}`]: e.target.value } }))} style={inputFieldStyle} /></td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle(COLORS.opt.monitor.cell, idx, zebraBg, '0')}><input type="date" value={String(riskData[`opt-complete-date-${idx}`] || '')} onChange={(e) => setState && setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [`opt-complete-date-${idx}`]: e.target.value } }))} style={dateInputStyle} /></td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.indicator.severity.bg, idx, zebraBg, COLORS.indicator.severity.text, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold, cursor: 'pointer' })} onClick={() => handleSODClick('S', 'opt', idx, Number(riskData[`opt-${idx}-S`]) || undefined)} title="클릭하여 최적화 심각도 평가">{riskData[`opt-${idx}-S`] || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.indicator.occurrence.bg, idx, zebraBg, COLORS.indicator.occurrence.text, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold, cursor: 'pointer' })} onClick={() => handleSODClick('O', 'opt', idx, Number(riskData[`opt-${idx}-O`]) || undefined)} title="클릭하여 최적화 발생도 평가">{riskData[`opt-${idx}-O`] || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.indicator.detection.bg, idx, zebraBg, COLORS.indicator.detection.text, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold, cursor: 'pointer' })} onClick={() => handleSODClick('D', 'opt', idx, Number(riskData[`opt-${idx}-D`]) || undefined)} title="클릭하여 최적화 검출도 평가">{riskData[`opt-${idx}-D`] || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.opt.effect.cell, idx, zebraBg, '#ffd600', { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold, cursor: 'pointer' })} onClick={() => openControlModal('specialChar', idx, `opt-${idx}`)} title="클릭하여 특별특성 선택">{riskData[`opt-specialChar-${idx}`] || ''}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={riskCellStyle(COLORS.indicator.ap.bg, idx, zebraBg, COLORS.indicator.ap.text, { textAlign: 'center', fontWeight: FONT_WEIGHTS.bold })}>{(() => { const optS = Math.min(Math.max(Number(riskData[`opt-${idx}-S`]) || 0, 0), 10); const optO = Math.min(Math.max(Number(riskData[`opt-${idx}-O`]) || 0, 0), 10); const optD = Math.min(Math.max(Number(riskData[`opt-${idx}-D`]) || 0, 0), 10); return calculateAP(optS, optO, optD); })()}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={rpnCellStyle((() => { const optS = Math.min(Math.max(Number(riskData[`opt-${idx}-S`]) || 0, 0), 10); const optO = Math.min(Math.max(Number(riskData[`opt-${idx}-O`]) || 0, 0), 10); const optD = Math.min(Math.max(Number(riskData[`opt-${idx}-D`]) || 0, 0), 10); return optS * optO * optD; })(), idx, zebraBg, COLORS)}>{(() => { const optS = Math.min(Math.max(Number(riskData[`opt-${idx}-S`]) || 0, 0), 10); const optO = Math.min(Math.max(Number(riskData[`opt-${idx}-O`]) || 0, 0), 10); const optD = Math.min(Math.max(Number(riskData[`opt-${idx}-D`]) || 0, 0), 10); return optS * optO * optD || ''; })()}</td>}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={optCellStyle(COLORS.opt.effect.cell, idx, zebraBg, '0')}><input type="text" value={String(riskData[`opt-note-${idx}`] || '')} onChange={(e) => setState && setState((prev: WorksheetState) => ({ ...prev, riskData: { ...(prev.riskData || {}), [`opt-note-${idx}`]: e.target.value } }))} style={inputFieldStyle} /></td>}
                </>}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* SOD 선택 모달 */}
      <SODSelectModal
        isOpen={sodModal.isOpen}
        onClose={closeSodModal}
        onSelect={handleSODSelect}
        category={sodModal.category}
        fmeaType="P-FMEA"
        currentValue={sodModal.currentValue}
        scope={sodModal.scope}
      />
      
      {/* 예방관리/검출관리/특별특성 선택 모달 */}
      {controlModal.isOpen && (
        <DataSelectModal
          isOpen={controlModal.isOpen}
          title={controlModal.type === 'prevention' ? '예방관리 선택' : controlModal.type === 'detection' ? '검출관리 선택' : '특별특성 선택'}
          itemCode={controlModal.type === 'prevention' ? 'B5' : controlModal.type === 'detection' ? 'B6' : 'SC'}
          onClose={closeControlModal}
          onSave={(selectedValues) => {
            if (setState && selectedValues.length > 0) {
              const key = `${controlModal.type}-${controlModal.rowIndex}`;
              setState((prev: WorksheetState) => ({
                ...prev,
                riskData: { ...(prev.riskData || {}), [key]: selectedValues[0] }
              }));
            }
            closeControlModal();
          }}
          onDelete={() => {
            if (setState) {
              const key = `${controlModal.type}-${controlModal.rowIndex}`;
              setState((prev: WorksheetState) => {
                const newRiskData = { ...(prev.riskData || {}) };
                delete newRiskData[key];
                return { ...prev, riskData: newRiskData };
              });
            }
            closeControlModal();
          }}
          singleSelect={true}
          currentValues={[(state.riskData || {})[`${controlModal.type}-${controlModal.rowIndex}`] || ''].filter(Boolean).map(String)}
        />
      )}
    </div>
  );
}

