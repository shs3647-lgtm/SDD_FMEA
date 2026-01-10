/**
 * @file AllTabEmpty.tsx
 * @description P-FMEA ALL 화면 빈화면 (구조분석 CSS 벤치마킹)
 * 
 * ★★★ 화면정의서 v2.2 + 구조분석 디자인 통일 ★★★
 * - 레벨별 색상 체계: L1(파란색), L2(녹색), L3(주황색)
 * - 표준 border: #ccc
 * - 버튼/배지: worksheet.ts 스타일 사용
 */

'use client';

import React, { useState } from 'react';
import { L1, L2, L3, border, btnConfirm, btnEdit, badgeConfirmed, badgeOk, badgeMissing } from '@/styles/worksheet';

// ============ 색상 정의 (구조분석 기준 통일) ============
const COLORS = {
  // 2단계: 구조분석 (컬럼별 개별 색상)
  structure: {
    product: { header: L1.header, headerLight: L1.headerLight, cell: L1.cell, cellAlt: L1.cellAlt },        // 완제품 공정명 (파란색)
    main: { header: L2.header, headerLight: L2.headerLight, cell: L2.cell, cellAlt: L2.cellAlt },           // 공정NO+공정명 (녹색)
    m4: { header: '#ef6c00', headerLight: '#ffa726', cell: '#fff3e0', cellAlt: '#ffe0b2' },                 // 4M (주황색)
    workElement: { header: '#f57c00', headerLight: '#ff9800', cell: '#ffe0b1', cellAlt: '#ffcc80' },       // 작업요소 (밝은 주황색)
  },
  // 3단계: 기능분석 (컬럼별 개별 색상)
  function: {
    division: { header: '#1565c0', headerLight: '#42a5f5', cell: '#e3f2fd', cellAlt: '#bbdefb' },        // 구분 (파란색)
    productFunc: { header: '#1976d2', headerLight: '#64b5f6', cell: '#e1f5fe', cellAlt: '#b3e5fc' },    // 완제품기능 (밝은 파란색)
    requirement: { header: '#0277bd', headerLight: '#4fc3f7', cell: '#e0f7fa', cellAlt: '#b2ebf2' },    // 요구사항 (청록 파란색)
    processFunc: { header: '#2e7d32', headerLight: '#66bb6a', cell: '#e8f5e9', cellAlt: '#c8e6c9' },    // 공정 기능 (녹색)
    productChar: { header: '#388e3c', headerLight: '#81c784', cell: '#f1f8e9', cellAlt: '#dcedc8' },    // 제품특성 (연한 녹색)
    workFunc: { header: '#ef6c00', headerLight: '#ffa726', cell: '#fff3e0', cellAlt: '#ffe0b2' },       // 작업요소 기능 (주황색)
    processChar: { header: '#fb8c00', headerLight: '#ffb74d', cell: '#fff8e1', cellAlt: '#ffecb3' },    // 공정특성 (밝은 주황색)
  },
  // 4단계: 고장분석 (FE=노랑, FM=네이비, FC=연두)
  failure: {
    fe: { header: '#f9a825', headerLight: '#fdd835', cell: '#fffde7', cellAlt: '#fff9c4' },
    fm: { header: '#303f9f', headerLight: '#5c6bc0', cell: '#e8eaf6', cellAlt: '#c5cae9' },
    fc: { header: '#388e3c', headerLight: '#66bb6a', cell: '#e8f5e9', cellAlt: '#c8e6c9' },
  },
  // 5단계: 리스크분석 (3색 시스템)
  risk: {
    prevention: { header: '#1565c0', headerLight: '#42a5f5', cell: '#e3f2fd', cellAlt: '#bbdefb' },  // 1. 예방관리 (파란색)
    detection: { header: '#2e7d32', headerLight: '#66bb6a', cell: '#e8f5e9', cellAlt: '#c8e6c9' },   // 2. 검출관리 (녹색)
    evaluation: { header: '#1a237e', headerLight: '#3949ab', cell: '#e8eaf6', cellAlt: '#c5cae9' }, // 3. 리스크평가 (네이비)
  },
  // 6단계: 최적화 (컬럼별 색상)
  optimization: {
    // 1. 계획 (5개 컬럼)
    prevention: { header: '#1565c0', headerLight: '#42a5f5', cell: '#e3f2fd', cellAlt: '#bbdefb' },    // 예방관리개선 (파란색)
    detection: { header: '#2e7d32', headerLight: '#66bb6a', cell: '#e8f5e9', cellAlt: '#c8e6c9' },     // 검출관리개선 (녹색)
    person: { header: '#7b1fa2', headerLight: '#ab47bc', cell: '#f3e5f5', cellAlt: '#e1bee7' },        // 책임자성명 (보라색)
    date: { header: '#00838f', headerLight: '#26c6da', cell: '#e0f7fa', cellAlt: '#b2ebf2' },          // 목표완료일자 (청록색)
    status: { header: '#ef6c00', headerLight: '#ffa726', cell: '#fff3e0', cellAlt: '#ffe0b2' },        // 상태 (주황색)
    // 2. 결과 모니터링 (2개 컬럼)
    result: { header: '#558b2f', headerLight: '#7cb342', cell: '#f1f8e9', cellAlt: '#dcedc8' },        // 개선결과근거 (연두색)
    complete: { header: '#00695c', headerLight: '#26a69a', cell: '#e0f2f1', cellAlt: '#b2dfdb' },      // 완료일자 (틸색)
    // 3. 효과 평가 (6개 컬럼)
    severity: { header: '#e65100', headerLight: '#ff9800', cell: '#fff3e0', cellAlt: '#ffe0b2' },      // 심각도 (주황색)
    occurrence: { header: '#e65100', headerLight: '#ff9800', cell: '#fff3e0', cellAlt: '#ffe0b2' },    // 발생도 (주황색)
    detection2: { header: '#e65100', headerLight: '#ff9800', cell: '#fff3e0', cellAlt: '#ffe0b2' },    // 검출도 (주황색)
    special: { header: '#283593', headerLight: '#5c6bc0', cell: '#e8eaf6', cellAlt: '#c5cae9' },       // 특별특성 (인디고색)
    ap: { header: '#f9a825', headerLight: '#ffeb3b', cell: '#fffde7', cellAlt: '#fff9c4' },            // AP (노란색)
    note: { header: '#5d4037', headerLight: '#8d6e63', cell: '#efebe9', cellAlt: '#d7ccc8' },          // 비고 (갈색)
    // Legacy (호환성)
    monitoring: { header: '#558b2f', headerLight: '#7cb342', cell: '#f1f8e9', cellAlt: '#dcedc8' },
    evaluation: { header: '#d84315', headerLight: '#ff7043', cell: '#fbe9e7', cellAlt: '#ffccbc' },
  },
};

// ============ 높이 정의 ============
const HEIGHTS = {
  header1: 28,  // 1행: 단계
  header2: 26,  // 2행: 분류
  header3: 24,  // 3행: 컬럼명
  body: 24,     // Body 행
};

// ============ 컬럼 정의 ============
interface ColumnDef {
  id: number;
  step: string;
  group: string;
  name: string;
  width: number;
  headerColor: string;
  cellColor: string;
  cellAltColor: string;
  align: 'left' | 'center' | 'right';
  isRPN?: boolean;
  isDark?: boolean; // 네이비 등 어두운 배경 → 흰색 글씨
}

// 기본화면 35컬럼 (RPN 제외)
const COLUMNS_BASE: ColumnDef[] = [
  // ■ 2단계: 구조분석 (4컬럼) - L1/L2/L3 색상
  { id: 1, step: '구조분석', group: '1. 완제품 공정명', name: '완제품 공정명', width: 160, 
    headerColor: COLORS.structure.product.headerLight, cellColor: COLORS.structure.product.cell, cellAltColor: COLORS.structure.product.cellAlt, align: 'left' },
  { id: 2, step: '구조분석', group: '2. 메인 공정명', name: '공정NO+공정명', width: 140, 
    headerColor: COLORS.structure.main.headerLight, cellColor: COLORS.structure.main.cell, cellAltColor: COLORS.structure.main.cellAlt, align: 'left' },
  { id: 3, step: '구조분석', group: '3. 작업 요소명', name: '4M', width: 50, 
    headerColor: COLORS.structure.m4.headerLight, cellColor: COLORS.structure.m4.cell, cellAltColor: COLORS.structure.m4.cellAlt, align: 'center' },
  { id: 4, step: '구조분석', group: '3. 작업 요소명', name: '작업요소', width: 120, 
    headerColor: COLORS.structure.workElement.headerLight, cellColor: COLORS.structure.workElement.cell, cellAltColor: COLORS.structure.workElement.cellAlt, align: 'left' },
  
  // ■ 3단계: 기능분석 (7컬럼) - 컬럼별 개별 색상
  { id: 5, step: '기능분석', group: '1. 완제품 공정기능/요구사항', name: '구분', width: 50, 
    headerColor: COLORS.function.division.headerLight, cellColor: COLORS.function.division.cell, cellAltColor: COLORS.function.division.cellAlt, align: 'center' },
  { id: 6, step: '기능분석', group: '1. 완제품 공정기능/요구사항', name: '완제품기능', width: 160, 
    headerColor: COLORS.function.productFunc.headerLight, cellColor: COLORS.function.productFunc.cell, cellAltColor: COLORS.function.productFunc.cellAlt, align: 'left' },
  { id: 7, step: '기능분석', group: '1. 완제품 공정기능/요구사항', name: '요구사항', width: 160, 
    headerColor: COLORS.function.requirement.headerLight, cellColor: COLORS.function.requirement.cell, cellAltColor: COLORS.function.requirement.cellAlt, align: 'left' },
  { id: 8, step: '기능분석', group: '2. 메인공정기능 및 제품특성', name: '공정 기능', width: 140, 
    headerColor: COLORS.function.processFunc.headerLight, cellColor: COLORS.function.processFunc.cell, cellAltColor: COLORS.function.processFunc.cellAlt, align: 'left' },
  { id: 9, step: '기능분석', group: '2. 메인공정기능 및 제품특성', name: '제품특성', width: 120, 
    headerColor: COLORS.function.productChar.headerLight, cellColor: COLORS.function.productChar.cell, cellAltColor: COLORS.function.productChar.cellAlt, align: 'left' },
  { id: 10, step: '기능분석', group: '3. 작업요소 기능 및 공정특성', name: '작업요소 기능', width: 140, 
    headerColor: COLORS.function.workFunc.headerLight, cellColor: COLORS.function.workFunc.cell, cellAltColor: COLORS.function.workFunc.cellAlt, align: 'left' },
  { id: 11, step: '기능분석', group: '3. 작업요소 기능 및 공정특성', name: '공정특성', width: 120, 
    headerColor: COLORS.function.processChar.headerLight, cellColor: COLORS.function.processChar.cell, cellAltColor: COLORS.function.processChar.cellAlt, align: 'left' },
  
  // ■ 4단계: 고장분석 (4컬럼) - FE/FM/FC 색상
  { id: 12, step: '고장분석', group: '1. 고장영향(FE)', name: '고장영향(FE)', width: 160, 
    headerColor: COLORS.failure.fe.headerLight, cellColor: COLORS.failure.fe.cell, cellAltColor: COLORS.failure.fe.cellAlt, align: 'left' },
  { id: 13, step: '고장분석', group: '1. 고장영향(FE)', name: '심각도', width: 50, 
    headerColor: COLORS.optimization.severity.headerLight, cellColor: COLORS.optimization.severity.cell, cellAltColor: COLORS.optimization.severity.cellAlt, align: 'center' },
  { id: 14, step: '고장분석', group: '2. 고장형태(FM)', name: '고장형태(FM)', width: 140, 
    headerColor: COLORS.failure.fm.headerLight, cellColor: COLORS.failure.fm.cell, cellAltColor: COLORS.failure.fm.cellAlt, align: 'left', isDark: true },
  { id: 15, step: '고장분석', group: '3. 고장원인(FC)', name: '고장원인(FC)', width: 160, 
    headerColor: COLORS.failure.fc.headerLight, cellColor: COLORS.failure.fc.cell, cellAltColor: COLORS.failure.fc.cellAlt, align: 'left' },
  
  // ■ 5단계: 리스크분석 (7컬럼) - 3색 시스템
  { id: 16, step: '리스크분석', group: '1. 현재 예방관리', name: '예방관리(PC)', width: 140, 
    headerColor: COLORS.risk.prevention.headerLight, cellColor: COLORS.risk.prevention.cell, cellAltColor: COLORS.risk.prevention.cellAlt, align: 'left' },
  { id: 17, step: '리스크분석', group: '1. 현재 예방관리', name: '발생도', width: 50, 
    headerColor: COLORS.optimization.severity.headerLight, cellColor: COLORS.optimization.severity.cell, cellAltColor: COLORS.optimization.severity.cellAlt, align: 'center' },
  { id: 18, step: '리스크분석', group: '2. 현재 검출관리', name: '검출관리(DC)', width: 140, 
    headerColor: COLORS.risk.detection.headerLight, cellColor: COLORS.risk.detection.cell, cellAltColor: COLORS.risk.detection.cellAlt, align: 'left' },
  { id: 19, step: '리스크분석', group: '2. 현재 검출관리', name: '검출도', width: 50, 
    headerColor: COLORS.optimization.severity.headerLight, cellColor: COLORS.optimization.severity.cell, cellAltColor: COLORS.optimization.severity.cellAlt, align: 'center' },
  { id: 20, step: '리스크분석', group: '3. 리스크 평가', name: 'AP', width: 30, 
    headerColor: COLORS.optimization.ap.headerLight, cellColor: COLORS.optimization.ap.cell, cellAltColor: COLORS.optimization.ap.cellAlt, align: 'center' },
  { id: 21, step: '리스크분석', group: '3. 리스크 평가', name: '특별특성', width: 50, 
    headerColor: COLORS.optimization.special.headerLight, cellColor: COLORS.optimization.special.cell, cellAltColor: COLORS.optimization.special.cellAlt, align: 'center' },
  { id: 22, step: '리스크분석', group: '3. 리스크 평가', name: '습득교훈', width: 100, 
    headerColor: COLORS.failure.fc.headerLight, cellColor: COLORS.failure.fc.cell, cellAltColor: COLORS.failure.fc.cellAlt, align: 'left' },
  
  // ■ 6단계: 최적화 (13컬럼) - 4색 시스템
  { id: 23, step: '최적화', group: '1. 계획', name: '예방관리개선', width: 140, 
    headerColor: COLORS.optimization.prevention.headerLight, cellColor: COLORS.optimization.prevention.cell, cellAltColor: COLORS.optimization.prevention.cellAlt, align: 'left' },
  { id: 24, step: '최적화', group: '1. 계획', name: '검출관리개선', width: 140, 
    headerColor: COLORS.optimization.detection.headerLight, cellColor: COLORS.optimization.detection.cell, cellAltColor: COLORS.optimization.detection.cellAlt, align: 'left' },
  { id: 25, step: '최적화', group: '1. 계획', name: '책임자성명', width: 80, 
    headerColor: COLORS.optimization.person.headerLight, cellColor: COLORS.optimization.person.cell, cellAltColor: COLORS.optimization.person.cellAlt, align: 'center' },
  { id: 26, step: '최적화', group: '1. 계획', name: '목표완료일자', width: 70, 
    headerColor: COLORS.optimization.date.headerLight, cellColor: COLORS.optimization.date.cell, cellAltColor: COLORS.optimization.date.cellAlt, align: 'center' },
  { id: 27, step: '최적화', group: '1. 계획', name: '상태', width: 50, 
    headerColor: COLORS.optimization.status.headerLight, cellColor: COLORS.optimization.status.cell, cellAltColor: COLORS.optimization.status.cellAlt, align: 'center' },
  { id: 28, step: '최적화', group: '2. 결과 모니터링', name: '개선결과근거', width: 100, 
    headerColor: COLORS.optimization.result.headerLight, cellColor: COLORS.optimization.result.cell, cellAltColor: COLORS.optimization.result.cellAlt, align: 'left' },
  { id: 29, step: '최적화', group: '2. 결과 모니터링', name: '완료일자', width: 70, 
    headerColor: COLORS.optimization.complete.headerLight, cellColor: COLORS.optimization.complete.cell, cellAltColor: COLORS.optimization.complete.cellAlt, align: 'center' },
  { id: 30, step: '최적화', group: '3. 효과 평가', name: '심각도', width: 50, 
    headerColor: COLORS.optimization.severity.headerLight, cellColor: COLORS.optimization.severity.cell, cellAltColor: COLORS.optimization.severity.cellAlt, align: 'center' },
  { id: 31, step: '최적화', group: '3. 효과 평가', name: '발생도', width: 50, 
    headerColor: COLORS.optimization.occurrence.headerLight, cellColor: COLORS.optimization.occurrence.cell, cellAltColor: COLORS.optimization.occurrence.cellAlt, align: 'center' },
  { id: 32, step: '최적화', group: '3. 효과 평가', name: '검출도', width: 50, 
    headerColor: COLORS.optimization.detection2.headerLight, cellColor: COLORS.optimization.detection2.cell, cellAltColor: COLORS.optimization.detection2.cellAlt, align: 'center' },
  { id: 33, step: '최적화', group: '3. 효과 평가', name: '특별특성', width: 50, 
    headerColor: COLORS.optimization.special.headerLight, cellColor: COLORS.optimization.special.cell, cellAltColor: COLORS.optimization.special.cellAlt, align: 'center' },
  { id: 34, step: '최적화', group: '3. 효과 평가', name: 'AP', width: 30, 
    headerColor: COLORS.optimization.ap.headerLight, cellColor: COLORS.optimization.ap.cell, cellAltColor: COLORS.optimization.ap.cellAlt, align: 'center' },
  { id: 35, step: '최적화', group: '3. 효과 평가', name: '비고', width: 80, 
    headerColor: COLORS.optimization.note.headerLight, cellColor: COLORS.optimization.note.cell, cellAltColor: COLORS.optimization.note.cellAlt, align: 'left' },
];

// 단계별 메인 색상 (1행 헤더용)
const STEP_COLORS: Record<string, string> = {
  '구조분석': '#1976d2',      // 파란색
  '기능분석': '#388e3c',      // 녹색
  '고장분석': '#f57c00',      // 주황색
  '리스크분석': '#1a237e',    // 네이비
  '최적화': '#558b2f',        // 연두색
};

// 단계명 → 표시용 텍스트 (단계 번호 포함)
const STEP_LABELS: Record<string, string> = {
  '구조분석': '2단계 구조분석',
  '기능분석': '3단계 기능분석',
  '고장분석': '4단계 고장분석',
  '리스크분석': '5단계 리스크분석',
  '최적화': '6단계 최적화',
};

// RPN 컬럼 (옵션)
const RPN_COLUMNS: ColumnDef[] = [
  { id: 0, step: '리스크분석', group: '3. 리스크 평가', name: 'RPN', width: 40, 
    headerColor: COLORS.risk.evaluation.headerLight, cellColor: COLORS.risk.evaluation.cell, cellAltColor: COLORS.risk.evaluation.cellAlt, align: 'center', isRPN: true, isDark: true },
  { id: 0, step: '최적화', group: '3. 효과 평가', name: 'RPN', width: 40, 
    headerColor: COLORS.optimization.evaluation.headerLight, cellColor: COLORS.optimization.evaluation.cell, cellAltColor: COLORS.optimization.evaluation.cellAlt, align: 'center', isRPN: true },
];

// 옵션화면용 37컬럼 생성 함수
function getColumnsWithRPN(): ColumnDef[] {
  const columns = [...COLUMNS_BASE];
  const riskRpnIdx = columns.findIndex(c => c.id === 21);
  columns.splice(riskRpnIdx, 0, { ...RPN_COLUMNS[0], id: 21 });
  for (let i = riskRpnIdx; i < columns.length; i++) {
    columns[i] = { ...columns[i], id: i + 1 };
  }
  const optRpnIdx = columns.findIndex(c => c.name === '비고' && c.step === '최적화');
  columns.splice(optRpnIdx, 0, { ...RPN_COLUMNS[1], id: optRpnIdx + 1 });
  for (let i = optRpnIdx; i < columns.length; i++) {
    columns[i] = { ...columns[i], id: i + 1 };
  }
  return columns;
}

// ============ 1행 (단계) colSpan 계산 ============
interface StepSpan {
  step: string;
  colSpan: number;
  color: string;
}

function calculateStepSpans(columns: ColumnDef[]): StepSpan[] {
  const spans: StepSpan[] = [];
  let currentStep = '';
  let currentSpan = 0;
  
  columns.forEach((col, idx) => {
    if (col.step !== currentStep) {
      if (currentSpan > 0) {
        spans.push({ step: currentStep, colSpan: currentSpan, color: STEP_COLORS[currentStep] || '#666' });
      }
      currentStep = col.step;
      currentSpan = 1;
    } else {
      currentSpan++;
    }
    
    if (idx === columns.length - 1) {
      spans.push({ step: currentStep, colSpan: currentSpan, color: STEP_COLORS[currentStep] || '#666' });
    }
  });
  
  return spans;
}

// ============ 2행 (분류) colSpan 계산 ============
interface GroupSpan {
  group: string;
  colSpan: number;
  color: string;
  isDark?: boolean; // 네이비 등 어두운 배경 → 흰색 글씨
}

function calculateGroupSpans(columns: ColumnDef[]): GroupSpan[] {
  const spans: GroupSpan[] = [];
  let currentGroup = '';
  let currentSpan = 0;
  let currentColor = '';
  let currentIsDark = false;
  
  columns.forEach((col, idx) => {
    if (col.group !== currentGroup) {
      if (currentSpan > 0) {
        spans.push({ group: currentGroup, colSpan: currentSpan, color: currentColor, isDark: currentIsDark });
      }
      currentGroup = col.group;
      currentSpan = 1;
      currentColor = col.headerColor;
      currentIsDark = col.isDark || false;
    } else {
      currentSpan++;
    }
    
    if (idx === columns.length - 1) {
      spans.push({ group: currentGroup, colSpan: currentSpan, color: currentColor, isDark: currentIsDark });
    }
  });
  
  return spans;
}

// ============ 컴포넌트 ============
interface AllTabEmptyProps {
  rowCount?: number;
  showRPN?: boolean;
  isConfirmed?: boolean;
  workElementCount?: number;
  missingCount?: number;
  onConfirm?: () => void;
  onEdit?: () => void;
  visibleSteps?: string[];  // 표시할 단계명 목록 (예: ['구조분석', '기능분석'])
}

export default function AllTabEmpty({ 
  rowCount = 10, 
  showRPN = false,
  isConfirmed = false,
  workElementCount = 0,
  missingCount = 0,
  onConfirm,
  onEdit,
  visibleSteps,
}: AllTabEmptyProps) {
  // visibleSteps가 지정되면 해당 단계만 필터링, 없으면 전체 표시
  const allColumns = showRPN ? getColumnsWithRPN() : COLUMNS_BASE;
  const columns = visibleSteps && visibleSteps.length > 0
    ? allColumns.filter(col => visibleSteps.includes(col.step))
    : allColumns;
  
  const stepSpans = calculateStepSpans(columns);
  const groupSpans = calculateGroupSpans(columns);
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  
  return (
    <div 
      className="relative bg-white"
      style={{ 
        display: 'inline-block',
        minWidth: '100%',
      }}
    >
      <table
        style={{
          width: `${totalWidth}px`,
          minWidth: `${totalWidth}px`,
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        {/* colgroup */}
        <colgroup>
          {columns.map((col, idx) => (
            <col key={idx} style={{ width: `${col.width}px` }} />
          ))}
        </colgroup>
        
        <thead className="sticky top-0 z-20 border-b-2 border-[#1a237e]">
          {/* 1행: 단계 (대분류) - 구조분석 스타일 */}
          <tr>
            {stepSpans.map((span, idx) => (
              <th
                key={idx}
                colSpan={span.colSpan}
                style={{
                  background: span.color,
                  color: '#fff',
                  height: `${HEIGHTS.header1}px`,
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  fontWeight: 800,
                  fontSize: '12px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span>{STEP_LABELS[span.step] || span.step}</span>
                  {/* 첫 번째 단계(구조분석)에만 확정/수정 버튼 표시 */}
                  {idx === 0 && (
                    <div className="flex gap-1.5">
                      {isConfirmed ? (
                        <>
                          <span className={badgeConfirmed}>✓ 확정됨({workElementCount})</span>
                          {missingCount === 0 ? (
                            <span className={badgeOk}>누락 0건</span>
                          ) : (
                            <span className={badgeMissing}>누락 {missingCount}건</span>
                          )}
                          {onEdit && (
                            <button type="button" onClick={onEdit} className={btnEdit}>수정</button>
                          )}
                        </>
                      ) : (
                        <>
                          {missingCount === 0 ? (
                            <span className={badgeOk}>누락 0건</span>
                          ) : (
                            <span className={badgeMissing}>누락 {missingCount}건</span>
                          )}
                          {onConfirm && (
                            <button type="button" onClick={onConfirm} className={btnConfirm}>확정</button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
          
          {/* 2행: 분류 (중분류) - 레벨별 색상, 네이비 배경은 흰색 글씨 */}
          <tr>
            {groupSpans.map((span, idx) => (
              <th
                key={idx}
                colSpan={span.colSpan}
                style={{
                  background: span.color,
                  color: span.isDark ? '#fff' : '#000',
                  height: `${HEIGHTS.header2}px`,
                  padding: '4px 6px',
                  border: '1px solid #ccc',
                  fontWeight: 600,
                  fontSize: '11px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {span.group}
              </th>
            ))}
          </tr>
          
          {/* 3행: 컬럼명 (소분류) - 네이비 배경은 흰색 글씨 */}
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  background: col.isDark ? col.headerColor : col.cellAltColor,
                  color: col.isDark ? '#fff' : '#000',
                  height: `${HEIGHTS.header3}px`,
                  padding: '3px 4px',
                  border: '1px solid #ccc',
                  fontWeight: 600,
                  fontSize: '11px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {Array.from({ length: rowCount }, (_, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx} 
                  style={{
                    background: rowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                    height: `${HEIGHTS.body}px`,
                    padding: '3px 4px',
                    border: '1px solid #ccc',
                    fontSize: '11px',
                    textAlign: col.align,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Export
export { COLUMNS_BASE, COLORS, HEIGHTS, getColumnsWithRPN, STEP_COLORS };
export type { ColumnDef };
