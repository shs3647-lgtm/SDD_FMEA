/**
 * @file AllViewTab.tsx
 * @description FMEA 전체보기 탭 (40열)
 * 구조분석(4) + 기능분석(8) + 고장분석(6) + 리스크분석(8) + 최적화(14) = 40열
 */

'use client';

import React from 'react';
import { WorksheetState } from '../constants';

interface FlatRow {
  l1Id: string;
  l1Name: string;
  l1TypeId?: string;
  l1TypeName?: string;
  l2Id: string;
  l2No: string;
  l2Name: string;
  l3Id: string;
  m4: string;
  l3Name: string;
}

interface AllViewTabProps {
  rows: FlatRow[];
  state: WorksheetState;
  l1Spans: number[];
  l1TypeSpans?: number[];
  l1FuncSpans?: number[];
  l2Spans: number[];
}

const BORDER = '1px solid #b0bec5';

// ============ 색상 정의 ============
const COLORS = {
  // 2단계 구조분석 - 파랑
  structure: { main: '#1565c0', header: '#bbdefb', cell: '#e3f2fd' },
  // 3단계 기능분석 - 녹색
  function: { main: '#1b5e20', header: '#c8e6c9', cell: '#e8f5e9' },
  // 4단계 고장분석 - 노랑/빨강
  failure: { main: '#c62828', header: '#fff9c4', cell: '#fffde7' },
  // 5단계 리스크분석 - 보라/분홍
  risk: { 
    main: '#6a1b9a', 
    prevention: { header: '#c8e6c9', cell: '#e8f5e9' },
    detection: { header: '#bbdefb', cell: '#e3f2fd' },
    evaluation: { header: '#f8bbd9', cell: '#fce4ec' },
  },
  // 6단계 최적화 - 녹색/파랑/주황
  opt: {
    main: '#2e7d32',
    plan: { header: '#bbdefb', cell: '#e3f2fd' },
    monitor: { header: '#ffe0b2', cell: '#fff3e0' },
    effect: { header: '#c8e6c9', cell: '#e8f5e9' },
  },
};

// ============ 40열 헤더 컴포넌트 ============
export function AllViewHeader() {
  return (
    <>
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
        {/* 구조분석 (3 서브그룹) */}
        <th colSpan={1} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정명</th>
        <th colSpan={1} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>2. 메인 공정명</th>
        <th colSpan={2} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>3. 작업 요소명</th>
        {/* 기능분석 (3 서브그룹) */}
        <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정기능/요구사항</th>
        <th colSpan={2} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>2. 메인공정기능 및 제품특성</th>
        <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>3. 작업요소의 기능 및 공정특성</th>
        {/* 고장분석 (3 서브그룹) */}
        <th colSpan={3} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>1. 자사/고객/사용자 고장영향(FE)</th>
        <th colSpan={1} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>2. 메인공정 고장형태(FM)</th>
        <th colSpan={2} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>3. 작업요소 고장원인(FC)</th>
        {/* 리스크분석 (3 서브그룹) */}
        <th colSpan={2} style={{ background: COLORS.risk.prevention.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>현재 예방관리</th>
        <th colSpan={2} style={{ background: COLORS.risk.detection.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>현재 검출관리</th>
        <th colSpan={4} style={{ background: COLORS.risk.evaluation.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>리스크 평가</th>
        {/* 최적화 (3 서브그룹) */}
        <th colSpan={4} style={{ background: COLORS.opt.plan.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>계획</th>
        <th colSpan={3} style={{ background: COLORS.opt.monitor.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>결과 모니터링</th>
        <th colSpan={7} style={{ background: COLORS.opt.effect.header, border: BORDER, padding: '2px', height: '20px', fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>효과 평가</th>
      </tr>

      {/* 3행: 컬럼명 */}
      <tr>
        {/* 구조분석 4열 */}
        <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완제품 공정명</th>
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
    </>
  );
}

// ============ 데이터 행 ============
function AllViewRow({ row, idx, l1Spans, l2Spans }: { row: FlatRow; idx: number; l1Spans: number[]; l2Spans: number[] }) {
  const cellStyle = { border: BORDER, padding: '2px 3px', fontSize: '8px', background: '#fff' };
  
  return (
    <tr style={{ height: '22px' }}>
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
}

// ============ 메인 컴포넌트 ============
export default function AllViewTab({ rows, state, l1Spans, l2Spans }: AllViewTabProps) {
  return (
    <>
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <AllViewHeader />
      </thead>
      
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={40} style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}>
              데이터가 없습니다. 구조분석부터 시작해주세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <AllViewRow key={`all-${row.l1Id}-${row.l2Id}-${row.l3Id}-${idx}`} row={row} idx={idx} l1Spans={l1Spans} l2Spans={l2Spans} />
          ))
        )}
      </tbody>
    </>
  );
}
