/**
 * @file OptTab.tsx
 * @description FMEA 워크시트 - 최적화(6단계) 탭
 * 14열: 계획(4) + 결과 모니터링(3) + 효과 평가(7)
 * 서브그룹별 다른 색상 적용
 */

'use client';

import React from 'react';
import { WorksheetState, COLORS as GLOBAL_COLORS } from '../constants';

interface FlatRow {
  l1Id: string;
  l1Name: string;
  l2Id: string;
  l2No: string;
  l2Name: string;
  l3Id: string;
  m4: string;
  l3Name: string;
}

interface OptTabProps {
  state: WorksheetState;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
}

const BORDER = '1px solid #b0bec5';

// 서브그룹별 색상 정의
const COLORS_OPT = {
  // 대분류 (전체)
  main: { bg: '#2e7d32', text: '#fff' },
  // 계획 (4열) - 연파랑
  plan: { headerBg: '#bbdefb', cellBg: '#e3f2fd' },
  // 결과 모니터링 (3열) - 연주황
  monitor: { headerBg: '#ffe0b2', cellBg: '#fff3e0' },
  // 효과 평가 (7열) - 연녹색
  effect: { headerBg: '#c8e6c9', cellBg: '#e8f5e9' },
};

// 컬럼 정의 (그룹별)
const PLAN_COLS = ['예방관리개선', '검출관리개선', '책임자성명', '목표완료일자'];
const MONITOR_COLS = ['상태', '개선결과근거', '완료일자'];
const EFFECT_COLS = ['심각도', '발생도', '검출도', '특별특성', 'AP', 'RPN', '비고'];

/**
 * 최적화 헤더
 */
export function OptHeader() {
  return (
    <>
      {/* 1행: 대분류 */}
      <tr>
        <th
          colSpan={14}
          style={{
            background: COLORS_OPT.main.bg,
            color: COLORS_OPT.main.text,
            border: BORDER,
            padding: '6px',
            height: '28px',
            fontWeight: 900,
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          P-FMEA 최적화(6단계)
        </th>
      </tr>

      {/* 2행: 서브그룹 */}
      <tr>
        <th colSpan={4} style={{ background: COLORS_OPT.plan.headerBg, border: BORDER, padding: '4px', height: '24px', fontWeight: 700, fontSize: '11px', textAlign: 'center' }}>
          계획
        </th>
        <th colSpan={3} style={{ background: COLORS_OPT.monitor.headerBg, border: BORDER, padding: '4px', height: '24px', fontWeight: 700, fontSize: '11px', textAlign: 'center' }}>
          결과 모니터링
        </th>
        <th colSpan={7} style={{ background: COLORS_OPT.effect.headerBg, border: BORDER, padding: '4px', height: '24px', fontWeight: 700, fontSize: '11px', textAlign: 'center' }}>
          효과 평가
        </th>
      </tr>

      {/* 3행: 컬럼명 */}
      <tr>
        {/* 계획 (4열) */}
        {PLAN_COLS.map(col => (
          <th key={col} style={{ background: COLORS_OPT.plan.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {col}
          </th>
        ))}
        {/* 결과 모니터링 (3열) */}
        {MONITOR_COLS.map(col => (
          <th key={col} style={{ background: COLORS_OPT.monitor.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {col}
          </th>
        ))}
        {/* 효과 평가 (7열) */}
        {EFFECT_COLS.map(col => (
          <th key={col} style={{ background: COLORS_OPT.effect.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {col}
          </th>
        ))}
      </tr>
    </>
  );
}

/**
 * 최적화 행
 */
export function OptRow({ row }: { row: FlatRow }) {
  return (
    <>
      {/* 계획 (4열) */}
      {PLAN_COLS.map((_, idx) => (
        <td key={`plan-${idx}`} style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', background: '#fafafa' }}></td>
      ))}
      {/* 결과 모니터링 (3열) */}
      {MONITOR_COLS.map((_, idx) => (
        <td key={`monitor-${idx}`} style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', background: '#fafafa' }}></td>
      ))}
      {/* 효과 평가 (7열) */}
      {EFFECT_COLS.map((_, idx) => (
        <td key={`effect-${idx}`} style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', textAlign: 'center', background: '#fafafa' }}></td>
      ))}
    </>
  );
}

/**
 * 최적화 탭 메인 컴포넌트
 */
export default function OptTab({ rows }: OptTabProps) {
  return (
    <>
      <colgroup>
        {/* 계획 4열 */}
        <col style={{ width: '90px' }} />
        <col style={{ width: '90px' }} />
        <col style={{ width: '70px' }} />
        <col style={{ width: '80px' }} />
        {/* 결과 모니터링 3열 */}
        <col style={{ width: '50px' }} />
        <col style={{ width: '100px' }} />
        <col style={{ width: '70px' }} />
        {/* 효과 평가 7열 */}
        <col style={{ width: '45px' }} />
        <col style={{ width: '45px' }} />
        <col style={{ width: '45px' }} />
        <col style={{ width: '60px' }} />
        <col style={{ width: '35px' }} />
        <col style={{ width: '40px' }} />
        <col style={{ width: '80px' }} />
      </colgroup>
      
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <OptHeader />
      </thead>
      
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td 
              colSpan={14} 
              style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}
            >
              리스크분석을 먼저 완료해주세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={`opt-${row.l3Id}-${idx}`} style={{ height: '24px' }}>
              <OptRow row={row} />
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}

// ============ OptTabFull (구조~최적화 통합 40열 화면) ============
export function OptTabFull({ state, rows, l1Spans, l2Spans }: OptTabProps) {
  const BORDER = '1px solid #b0bec5';
  
  // 색상 정의
  const COLORS = {
    structure: { main: '#1565c0', header: '#bbdefb', cell: '#e3f2fd' },
    function: { main: '#1b5e20', header: '#c8e6c9', cell: '#e8f5e9' },
    failure: { main: '#c62828', header: '#fff9c4', cell: '#fffde7' },
    risk: {
      main: '#6a1b9a',
      prevention: { header: '#c8e6c9', cell: '#e8f5e9' },
      detection: { header: '#bbdefb', cell: '#e3f2fd' },
      evaluation: { header: '#f8bbd9', cell: '#fce4ec' },
    },
    opt: {
      main: '#2e7d32',
      plan: { header: '#bbdefb', cell: '#e3f2fd' },
      monitor: { header: '#ffe0b2', cell: '#fff3e0' },
      effect: { header: '#c8e6c9', cell: '#e8f5e9' },
    },
  };

  return (
    <>
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        {/* 1행: 단계 대분류 */}
        <tr>
          <th colSpan={4} style={{ background: COLORS.structure.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>
            P-FMEA 구조 분석(2단계)
          </th>
          <th colSpan={8} style={{ background: COLORS.function.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>
            P-FMEA 기능 분석(3단계)
          </th>
          <th colSpan={6} style={{ background: COLORS.failure.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>
            P-FMEA 고장 분석(4단계)
          </th>
          <th colSpan={8} style={{ background: COLORS.risk.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>
            P-FMEA 리스크 분석(5단계)
          </th>
          <th colSpan={14} style={{ background: COLORS.opt.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>
            P-FMEA 최적화(6단계)
          </th>
        </tr>

        {/* 2행: 서브그룹 */}
        <tr>
          {/* 구조분석 */}
          <th colSpan={1} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정명</th>
          <th colSpan={1} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 메인 공정명</th>
          <th colSpan={2} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 작업 요소명</th>
          {/* 기능분석 */}
          <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정기능/요구사항</th>
          <th colSpan={2} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 메인공정기능 및 제품특성</th>
          <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 작업요소기능 및 공정특성</th>
          {/* 고장분석 */}
          <th colSpan={3} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 고장영향(FE)</th>
          <th colSpan={1} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 고장형태(FM)</th>
          <th colSpan={2} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 고장원인(FC)</th>
          {/* 리스크분석 */}
          <th colSpan={2} style={{ background: COLORS.risk.prevention.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>현재 예방관리</th>
          <th colSpan={2} style={{ background: COLORS.risk.detection.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>현재 검출관리</th>
          <th colSpan={4} style={{ background: COLORS.risk.evaluation.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>리스크 평가</th>
          {/* 최적화 */}
          <th colSpan={4} style={{ background: COLORS.opt.plan.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>계획</th>
          <th colSpan={3} style={{ background: COLORS.opt.monitor.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>결과 모니터링</th>
          <th colSpan={7} style={{ background: COLORS.opt.effect.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>효과 평가</th>
        </tr>

        {/* 3행: 컬럼명 */}
        <tr>
          {/* 구조분석 4열 */}
          <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완제품공정명</th>
          <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>NO+공정명</th>
          <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>4M</th>
          <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th>
          {/* 기능분석 8열 */}
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>구분</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완제품기능</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>요구사항</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>공정기능</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>제품특성</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소기능</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>공정특성</th>
          {/* 고장분석 6열 */}
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>구분</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장영향(FE)</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>심각도</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장형태(FM)</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장원인(FC)</th>
          {/* 리스크분석 8열 */}
          <th style={{ background: COLORS.risk.prevention.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>예방관리(PC)</th>
          <th style={{ background: COLORS.risk.prevention.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>발생도</th>
          <th style={{ background: COLORS.risk.detection.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출관리(DC)</th>
          <th style={{ background: COLORS.risk.detection.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출도</th>
          <th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>AP</th>
          <th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>RPN</th>
          <th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>특별특성</th>
          <th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>습득교훈</th>
          {/* 최적화 14열 */}
          <th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>예방관리개선</th>
          <th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출관리개선</th>
          <th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>책임자성명</th>
          <th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>목표완료일자</th>
          <th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>상태</th>
          <th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>개선결과근거</th>
          <th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완료일자</th>
          <th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>심각도</th>
          <th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>발생도</th>
          <th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출도</th>
          <th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>특별특성</th>
          <th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>AP</th>
          <th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>RPN</th>
          <th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>비고</th>
        </tr>
      </thead>
      
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={40} style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}>
              리스크분석을 먼저 완료해주세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => {
            const cellStyle = { border: BORDER, padding: '2px 3px', fontSize: '8px', background: '#fff' };
            return (
              <tr key={`opt-full-${row.l1Id}-${row.l2Id}-${row.l3Id}-${idx}`} style={{ height: '22px' }}>
                {/* 구조분석 4열 */}
                {l1Spans[idx] > 0 && <td rowSpan={l1Spans[idx]} style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l1Name}</td>}
                {l2Spans[idx] > 0 && <td rowSpan={l2Spans[idx]} style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l2No} {row.l2Name}</td>}
                <td style={{ ...cellStyle, background: COLORS.structure.cell, textAlign: 'center' }}>{row.m4}</td>
                <td style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l3Name}</td>
                {/* 기능분석 8열 */}
                {[...Array(8)].map((_, i) => <td key={`func-${i}`} style={{ ...cellStyle, background: COLORS.function.cell }}></td>)}
                {/* 고장분석 6열 */}
                {[...Array(6)].map((_, i) => <td key={`fail-${i}`} style={{ ...cellStyle, background: COLORS.failure.cell }}></td>)}
                {/* 리스크분석 8열 */}
                <td style={{ ...cellStyle, background: COLORS.risk.prevention.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.risk.prevention.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.risk.detection.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.risk.detection.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td>
                {/* 최적화 14열 */}
                <td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td>
                <td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td>
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );
}
