/**
 * @file RiskTab.tsx
 * @description FMEA 워크시트 - 리스크분석(5단계) 탭
 * 8열: 현재 예방관리(2) + 현재 검출관리(2) + 리스크 평가(4)
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

interface RiskTabProps {
  state: WorksheetState;
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
  onAPClick?: () => void;
}

const BORDER = '1px solid #b0bec5';

// 서브그룹별 색상 정의
const COLORS_RISK = {
  // 대분류 (전체)
  main: { bg: '#6a1b9a', text: '#fff' },
  // 현재 예방관리 (2열) - 연녹색
  prevention: { headerBg: '#c8e6c9', cellBg: '#e8f5e9' },
  // 현재 검출관리 (2열) - 연파랑
  detection: { headerBg: '#bbdefb', cellBg: '#e3f2fd' },
  // 리스크 평가 (4열) - 연분홍
  evaluation: { headerBg: '#f8bbd9', cellBg: '#fce4ec' },
};

/**
 * 리스크분석 헤더
 */
export function RiskHeader({ onAPClick }: { onAPClick?: () => void }) {
  return (
    <>
      {/* 1행: 대분류 */}
      <tr>
        <th
          colSpan={8}
          style={{
            background: COLORS_RISK.main.bg,
            color: COLORS_RISK.main.text,
            border: BORDER,
            padding: '6px',
            height: '28px',
            fontWeight: 900,
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          P-FMEA 리스크 분석(5단계)
        </th>
      </tr>

      {/* 2행: 서브그룹 */}
      <tr>
        <th colSpan={2} style={{ background: COLORS_RISK.prevention.headerBg, border: BORDER, padding: '4px', height: '24px', fontWeight: 700, fontSize: '11px', textAlign: 'center' }}>
          현재 예방관리
        </th>
        <th colSpan={2} style={{ background: COLORS_RISK.detection.headerBg, border: BORDER, padding: '4px', height: '24px', fontWeight: 700, fontSize: '11px', textAlign: 'center' }}>
          현재 검출관리
        </th>
        <th colSpan={4} style={{ background: COLORS_RISK.evaluation.headerBg, border: BORDER, padding: '4px', height: '24px', fontWeight: 700, fontSize: '11px', textAlign: 'center' }}>
          리스크 평가
        </th>
      </tr>

      {/* 3행: 컬럼명 */}
      <tr>
        {/* 현재 예방관리 (2열) */}
        <th style={{ background: COLORS_RISK.prevention.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          예방관리(PC)
        </th>
        <th style={{ background: COLORS_RISK.prevention.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          발생도
        </th>
        {/* 현재 검출관리 (2열) */}
        <th style={{ background: COLORS_RISK.detection.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          검출관리(DC)
        </th>
        <th style={{ background: COLORS_RISK.detection.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          검출도
        </th>
        {/* 리스크 평가 (4열) */}
        <th 
          onClick={onAPClick}
          style={{ 
            background: COLORS_RISK.evaluation.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap',
            cursor: onAPClick ? 'pointer' : 'default',
          }}
        >
          AP 📊
        </th>
        <th style={{ background: COLORS_RISK.evaluation.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          RPN
        </th>
        <th style={{ background: COLORS_RISK.evaluation.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          특별특성
        </th>
        <th style={{ background: COLORS_RISK.evaluation.cellBg, border: BORDER, padding: '3px', height: '22px', fontWeight: 600, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          습득교훈
        </th>
      </tr>
    </>
  );
}

/**
 * 리스크분석 행
 */
export function RiskRow({ row }: { row: FlatRow }) {
  return (
    <>
      {/* 현재 예방관리 (2열) */}
      <td style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', background: '#fafafa' }}></td>
      <td style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', background: '#fafafa', textAlign: 'center' }}></td>
      {/* 현재 검출관리 (2열) */}
      <td style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', background: '#fafafa' }}></td>
      <td style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', background: '#fafafa', textAlign: 'center' }}></td>
      {/* 리스크 평가 (4열) */}
      <td style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', textAlign: 'center', background: '#fafafa' }}></td>
      <td style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', textAlign: 'center', background: '#fafafa' }}></td>
      <td style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', textAlign: 'center', background: '#fafafa' }}></td>
      <td style={{ border: BORDER, padding: '2px 4px', fontSize: '10px', background: '#fafafa' }}></td>
    </>
  );
}

/**
 * 리스크분석 탭 메인 컴포넌트
 */
export default function RiskTab({ rows, onAPClick }: RiskTabProps) {
  return (
    <>
      <colgroup>
        {/* 예방관리 2열 */}
        <col style={{ width: '120px' }} />
        <col style={{ width: '50px' }} />
        {/* 검출관리 2열 */}
        <col style={{ width: '120px' }} />
        <col style={{ width: '50px' }} />
        {/* 리스크 평가 4열 */}
        <col style={{ width: '40px' }} />
        <col style={{ width: '50px' }} />
        <col style={{ width: '70px' }} />
        <col style={{ width: '100px' }} />
      </colgroup>
      
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <RiskHeader onAPClick={onAPClick} />
      </thead>
      
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td 
              colSpan={8} 
              style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}
            >
              고장분석을 먼저 완료해주세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={`risk-${row.l3Id}-${idx}`} style={{ height: '24px' }}>
              <RiskRow row={row} />
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}

// ============ RiskTabFull (구조~리스크 통합 화면) ============
export function RiskTabFull({ state, rows, l1Spans, l2Spans, onAPClick }: RiskTabProps) {
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
        </tr>

        {/* 2행: 서브그룹 */}
        <tr>
          <th colSpan={1} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정명</th>
          <th colSpan={1} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 메인 공정명</th>
          <th colSpan={2} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 작업 요소명</th>
          <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정기능/요구사항</th>
          <th colSpan={2} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 메인공정기능 및 제품특성</th>
          <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 작업요소의 기능 및 공정특성</th>
          <th colSpan={3} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 고장영향(FE)</th>
          <th colSpan={1} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 고장형태(FM)</th>
          <th colSpan={2} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 고장원인(FC)</th>
          <th colSpan={2} style={{ background: COLORS.risk.prevention.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>현재 예방관리</th>
          <th colSpan={2} style={{ background: COLORS.risk.detection.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>현재 검출관리</th>
          <th colSpan={4} style={{ background: COLORS.risk.evaluation.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>리스크 평가</th>
        </tr>

        {/* 3행: 컬럼명 */}
        <tr>
          <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완제품공정명</th>
          <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>NO+공정명</th>
          <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>4M</th>
          <th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>구분</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완제품기능</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>요구사항</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>공정기능</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>제품특성</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소기능</th>
          <th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>공정특성</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>구분</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장영향(FE)</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>심각도</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장형태(FM)</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th>
          <th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장원인(FC)</th>
          <th style={{ background: COLORS.risk.prevention.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>예방관리(PC)</th>
          <th style={{ background: COLORS.risk.prevention.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>발생도</th>
          <th style={{ background: COLORS.risk.detection.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출관리(DC)</th>
          <th style={{ background: COLORS.risk.detection.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출도</th>
          <th onClick={onAPClick} style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center', cursor: 'pointer' }}>AP 📊</th>
          <th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>RPN</th>
          <th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>특별특성</th>
          <th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>습득교훈</th>
        </tr>
      </thead>
      
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={26} style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}>
              고장분석을 먼저 완료해주세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => {
            const cellStyle = { border: BORDER, padding: '2px 3px', fontSize: '8px', background: '#fff' };
            return (
              <tr key={`risk-full-${row.l1Id}-${row.l2Id}-${row.l3Id}-${idx}`} style={{ height: '22px' }}>
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
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );
}
