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

import React, { useState, useMemo } from 'react';
import { L1, L2, L3, border } from '@/styles/worksheet';
import DataSelectModal from '@/components/modals/DataSelectModal';
import SODSelectModal from '@/components/modals/SODSelectModal';
import APResultModal from '@/components/modals/APResultModal';
import { useAllTabModals } from './hooks/useAllTabModals';
import { calculateAP } from './apCalculator';
import { findLinkedPreventionControlsForFailureCause, getAutoLinkMessage } from '../../utils/auto-link';
import type { WorksheetState } from '../../constants';

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
  { id: 2, step: '구조분석', group: '2. 메인 공정명', name: 'NO+공정명', width: 140, 
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

// ============ 고장연결 데이터 인터페이스 ============
interface FailureLinkRow {
  fmId: string;           // 고장형태 ID
  fmText: string;         // 고장형태 텍스트
  feId: string;           // 고장영향 ID
  feText: string;         // 고장영향 텍스트
  feSeverity: number;     // 심각도
  fcId: string;           // 고장원인 ID
  fcText: string;         // 고장원인 텍스트
  // ★ L1 역전개 데이터 (완제품명)
  l1ProductName?: string;     // 완제품 공정명
  // ★ FM 역전개 데이터 (고장형태 → 2L 기능분석)
  fmProcessNo?: string;       // 공정번호
  fmProcessName?: string;     // 공정명
  fmProcessFunction?: string; // 공정기능
  fmProductChar?: string;     // 제품특성
  // ★ FE 역전개 데이터 (고장영향 → 1L 기능분석)
  feCategory?: string;        // 구분 (Your Plant / Ship to Plant / User)
  feFunctionName?: string;    // 완제품기능
  feRequirement?: string;     // 요구사항
  // ★ FC 역전개 데이터 (고장원인 → 3L 기능분석)
  fcWorkFunction?: string;    // 작업요소 기능
  fcProcessChar?: string;     // 공정특성
  // ★ FC 역전개 데이터 (고장원인 → 2L 구조분석)
  fcM4?: string;              // 4M
  fcWorkElem?: string;        // 작업요소
}

interface ProcessedFMGroup {
  fmId: string;
  fmText: string;
  fmRowSpan: number;      // FM 셀합치기 행 수
  maxSeverity: number;    // 연결된 FE 중 최대 심각도
  maxSeverityFeText: string; // 최대 심각도를 가진 FE 텍스트
  // ★ L1 역전개 데이터 (완제품명)
  l1ProductName: string;      // 완제품 공정명
  // ★ FM 역전개 데이터 (2L 기능분석)
  fmProcessNo: string;        // 공정번호
  fmProcessName: string;      // 공정명
  fmProcessFunction: string;  // 공정기능
  fmProductChar: string;      // 제품특성
  rows: {
    feText: string;
    feSeverity: number;
    fcText: string;
    feRowSpan: number;    // FE 셀합치기 (마지막 행 병합용)
    fcRowSpan: number;    // FC 셀합치기 (마지막 행 병합용)
    isFirstRow: boolean;  // FM 첫 행 여부
    // ★ FE 역전개 데이터 (1L 기능분석)
    feCategory: string;       // 구분
    feFunctionName: string;   // 완제품기능
    feRequirement: string;    // 요구사항
    // ★ FC 역전개 데이터 (3L 기능분석)
    fcWorkFunction: string;   // 작업요소 기능
    fcProcessChar: string;    // 공정특성
    // ★ FC 역전개 데이터 (2L 구조분석)
    fcM4: string;             // 4M
    fcWorkElem: string;       // 작업요소
  }[];
}

/**
 * 고장연결 데이터를 FM 중심으로 그룹핑하고 rowSpan 계산
 * - 고장형태(FM)를 중심으로 고장영향(FE)과 고장원인(FC)을 매칭
 * - FE/FC 갯수가 다를 때 마지막 행을 셀합치기
 */
function processFailureLinks(links: FailureLinkRow[]): ProcessedFMGroup[] {
  if (!links || links.length === 0) return [];
  
  // FM별 그룹핑 (역전개 데이터 포함)
  interface FEData {
    text: string;
    severity: number;
    category: string;
    functionName: string;
    requirement: string;
  }
  interface FCData {
    text: string;
    workFunction: string;  // 작업요소 기능
    processChar: string;   // 공정특성
    m4: string;            // 4M
    workElem: string;      // 작업요소
  }
  interface FMData {
    fmText: string;
    // ★ L1 역전개 데이터
    l1ProductName: string;
    // ★ FM 역전개 데이터
    fmProcessNo: string;
    fmProcessName: string;
    fmProcessFunction: string;
    fmProductChar: string;
    fes: Map<string, FEData>;
    fcs: Map<string, FCData>;
  }
  const fmMap = new Map<string, FMData>();
  
  links.forEach(link => {
    if (!fmMap.has(link.fmId)) {
      fmMap.set(link.fmId, {
        fmText: link.fmText,
        // ★ L1 역전개 데이터
        l1ProductName: link.l1ProductName || '',
        // ★ FM 역전개 데이터
        fmProcessNo: link.fmProcessNo || '',
        fmProcessName: link.fmProcessName || '',
        fmProcessFunction: link.fmProcessFunction || '',
        fmProductChar: link.fmProductChar || '',
        fes: new Map(),
        fcs: new Map(),
      });
    }
    const group = fmMap.get(link.fmId)!;
    if (link.feId && link.feText) {
      group.fes.set(link.feId, { 
        text: link.feText, 
        severity: link.feSeverity || 0,
        category: link.feCategory || '',
        functionName: link.feFunctionName || '',
        requirement: link.feRequirement || '',
      });
    }
    if (link.fcId && link.fcText) {
      group.fcs.set(link.fcId, {
        text: link.fcText,
        workFunction: link.fcWorkFunction || '',
        processChar: link.fcProcessChar || '',
        m4: link.fcM4 || '',
        workElem: link.fcWorkElem || '',
      });
    }
  });
  
  // ProcessedFMGroup 생성
  const result: ProcessedFMGroup[] = [];
  
  fmMap.forEach((group, fmId) => {
    const feList = Array.from(group.fes.entries()).map(([id, data]) => ({ id, ...data }));
    const fcList = Array.from(group.fcs.entries()).map(([id, data]) => ({ id, ...data }));
    
    // ★ 최대 심각도 및 해당 FE 텍스트 계산
    let maxSeverity = 0;
    let maxSeverityFeText = '';
    feList.forEach(fe => {
      if (fe.severity > maxSeverity) {
        maxSeverity = fe.severity;
        maxSeverityFeText = fe.text;
      }
    });
    
    const maxRows = Math.max(feList.length, fcList.length, 1);
    const rows: ProcessedFMGroup['rows'] = [];
    
    for (let i = 0; i < maxRows; i++) {
      const fe = feList[i];
      const fc = fcList[i];
      
      // 마지막 행 셀합치기 계산: 더 짧은 쪽의 마지막 항목이 나머지 행 병합
      let feRowSpan = 1;
      let fcRowSpan = 1;
      
      if (feList.length < fcList.length && i === feList.length - 1 && feList.length > 0) {
        feRowSpan = maxRows - i;
      }
      if (fcList.length < feList.length && i === fcList.length - 1 && fcList.length > 0) {
        fcRowSpan = maxRows - i;
      }
      
      rows.push({
        feText: fe?.text || '',
        feSeverity: fe?.severity || 0,
        fcText: fc?.text || '',
        feRowSpan,
        fcRowSpan,
        isFirstRow: i === 0,
        // ★ FE 역전개 데이터 (1L 기능분석)
        feCategory: fe?.category || '',
        feFunctionName: fe?.functionName || '',
        feRequirement: fe?.requirement || '',
        // ★ FC 역전개 데이터 (3L 기능분석)
        fcWorkFunction: fc?.workFunction || '',
        fcProcessChar: fc?.processChar || '',
        // ★ FC 역전개 데이터 (2L 구조분석)
        fcM4: fc?.m4 || '',
        fcWorkElem: fc?.workElem || '',
      });
    }
    
    result.push({
      fmId,
      fmText: group.fmText,
      fmRowSpan: maxRows,
      maxSeverity,
      maxSeverityFeText,
      // ★ L1 역전개 데이터
      l1ProductName: group.l1ProductName,
      // ★ FM 역전개 데이터
      fmProcessNo: group.fmProcessNo,
      fmProcessName: group.fmProcessName,
      fmProcessFunction: group.fmProcessFunction,
      fmProductChar: group.fmProductChar,
      rows,
    });
  });
  
  return result;
}

// ============ 컴포넌트 ============
interface AllTabEmptyProps {
  rowCount?: number;
  showRPN?: boolean;
  visibleSteps?: string[];  // 표시할 단계명 목록 (예: ['구조분석', '기능분석'])
  failureLinks?: FailureLinkRow[];  // 고장연결 데이터
  state?: WorksheetState;  // 워크시트 상태
  setState?: React.Dispatch<React.SetStateAction<WorksheetState>>;  // 상태 업데이트 함수
  setDirty?: React.Dispatch<React.SetStateAction<boolean>>;  // ✅ DB 저장 트리거용
}

export default function AllTabEmpty({ 
  rowCount = 10, 
  showRPN = false,
  visibleSteps,
  failureLinks = [],
  state,
  setState,
  setDirty,
}: AllTabEmptyProps) {
  // 모달 관리 훅
  const {
    sodModal,
    controlModal,
    setControlModal,
    closeControlModal,
    closeSodModal,
    handleSODClick,
    handleSODSelect,
  } = useAllTabModals(setState);
  
  // AP 모달 상태 (5AP/6AP 결과)
  const [apModal, setApModal] = useState<{
    isOpen: boolean;
    stage: 5 | 6;
    data: Array<{
      id: string;
      processName: string;
      failureMode: string;
      failureCause: string;
      severity: number;
      occurrence: number;
      detection: number;
      ap: 'H' | 'M' | 'L';
    }>;
  }>({
    isOpen: false,
    stage: 5,
    data: [],
  });
  
  // 고장연결 데이터 처리
  const processedFMGroups = React.useMemo(() => processFailureLinks(failureLinks), [failureLinks]);
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
          {processedFMGroups.length > 0 ? (
            // ★ 고장연결 데이터가 있으면 FM 중심 셀합치기 렌더링
            processedFMGroups.flatMap((fmGroup, fmIdx) => 
              fmGroup.rows.map((row, rowInFM) => {
                const globalRowIdx = processedFMGroups.slice(0, fmIdx).reduce((acc, g) => acc + g.rows.length, 0) + rowInFM;
                const isLastRowOfFM = rowInFM === fmGroup.rows.length - 1;
                
                return (
                  <tr 
                    key={`fm-${fmGroup.fmId}-${rowInFM}`}
                    style={isLastRowOfFM ? { borderBottom: '2px solid #1a237e' } : undefined}
                  >
                    {columns.map((col, colIdx) => {
                      // 고장분석 컬럼 처리 (셀합치기 적용)
                      if (col.step === '고장분석') {
                        // 고장영향(FE) 컬럼 - "고장영향(S)" 형식 표시
                        if (col.name === '고장영향(FE)') {
                          // 첫 행이거나 rowSpan이 1인 경우에만 렌더링
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].feRowSpan === 1)) {
                            // 고장영향 텍스트 + 심각도 조합
                            const feDisplay = row.feText 
                              ? (row.feSeverity > 0 ? `${row.feText}(${row.feSeverity})` : row.feText)
                              : '';
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.feRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {feDisplay}
                              </td>
                            );
                          }
                          return null; // rowSpan으로 병합된 셀
                        }
                        
                        // 심각도 컬럼 - FM 전체 병합, 최대 숫자만 표시
                        if (col.name === '심각도') {
                          if (row.isFirstRow) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={fmGroup.fmRowSpan}
                                style={{
                                  background: fmIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '12px',
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                  fontWeight: 700,
                                }}
                              >
                                {fmGroup.maxSeverity > 0 ? fmGroup.maxSeverity : ''}
                              </td>
                            );
                          }
                          return null; // FM rowSpan으로 병합됨
                        }
                        
                        // 고장형태(FM) 컬럼 - FM 전체 행 병합 (FM 인덱스 기준 줄무늬)
                        if (col.name === '고장형태(FM)') {
                          if (row.isFirstRow) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={fmGroup.fmRowSpan}
                                style={{
                                  background: fmIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                  color: '#000',
                                }}
                              >
                                {fmGroup.fmText}
                              </td>
                            );
                          }
                          return null; // FM rowSpan으로 병합됨
                        }
                        
                        // 고장원인(FC) 컬럼
                        if (col.name === '고장원인(FC)') {
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].fcRowSpan === 1)) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {row.fcText}
                              </td>
                            );
                          }
                          return null;
                        }
                      }
                      
                      // ★ 구조분석 컬럼 - 역전개 데이터 표시
                      if (col.step === '구조분석') {
                        // 완제품 공정명 (L1 역전개)
                        if (col.name === '완제품 공정명') {
                          if (row.isFirstRow) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={fmGroup.fmRowSpan}
                                style={{
                                  background: fmIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {fmGroup.l1ProductName || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // NO+공정명 컬럼 (FM 역전개: 공정번호+메인공정명)
                        if (col.name === 'NO+공정명') {
                          if (row.isFirstRow) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={fmGroup.fmRowSpan}
                                style={{
                                  background: fmIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {fmGroup.fmProcessNo ? `${fmGroup.fmProcessNo} ${fmGroup.fmProcessName}` : fmGroup.fmProcessName}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // 4M 컬럼 (FC 역전개)
                        if (col.name === '4M') {
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].fcRowSpan === 1)) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {row.fcM4 || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // 작업요소 컬럼
                        if (col.name === '작업요소') {
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].fcRowSpan === 1)) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {row.fcWorkElem || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                      }
                      
                      // ★ 기능분석 컬럼 - 역전개 데이터 표시 (구분, 완제품기능, 요구사항)
                      if (col.step === '기능분석') {
                        // 구분 컬럼
                        if (col.name === '구분') {
                          // FE와 동일한 rowSpan 적용
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].feRowSpan === 1)) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.feRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {row.feCategory || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // 완제품기능 컬럼
                        if (col.name === '완제품기능') {
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].feRowSpan === 1)) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.feRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {row.feFunctionName || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // 요구사항 컬럼
                        if (col.name === '요구사항') {
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].feRowSpan === 1)) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.feRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {row.feRequirement || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // ★ 공정 기능 컬럼 (FM 역전개)
                        if (col.name === '공정 기능') {
                          if (row.isFirstRow) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={fmGroup.fmRowSpan}
                                style={{
                                  background: fmIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {fmGroup.fmProcessFunction || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // ★ 제품특성 컬럼 (FM 역전개)
                        if (col.name === '제품특성') {
                          if (row.isFirstRow) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={fmGroup.fmRowSpan}
                                style={{
                                  background: fmIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {fmGroup.fmProductChar || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // ★ 작업요소 기능 컬럼 (FC 역전개)
                        if (col.name === '작업요소 기능') {
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].fcRowSpan === 1)) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {row.fcWorkFunction || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        // ★ 공정특성 컬럼 (FC 역전개)
                        if (col.name === '공정특성') {
                          if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].fcRowSpan === 1)) {
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                }}
                              >
                                {row.fcProcessChar || ''}
                              </td>
                            );
                          }
                          return null;
                        }
                      }
                      
                      // 리스크분석 / 최적화 컬럼 - FC와 동일한 rowSpan 적용
                      if (col.step === '리스크분석' || col.step === '최적화') {
                        if (rowInFM === 0 || (rowInFM > 0 && fmGroup.rows[rowInFM - 1].fcRowSpan === 1)) {
                          // ★ 예방관리(PC) 셀
                          if (col.name === '예방관리(PC)' || col.name === '예방관리개선') {
                            const modalType = 'prevention';
                            const key = `${modalType}-${globalRowIdx}`;
                            const value = state?.riskData?.[key] || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  // ✅ 자동연결: 동일한 고장원인에 동일한 예방관리 자동 연결
                                  const currentFcText = row.fcText || '';
                                  if (currentFcText && failureLinks && state?.riskData) {
                                    const linkedPreventions = findLinkedPreventionControlsForFailureCause(
                                      state.riskData,
                                      failureLinks,
                                      currentFcText
                                    );
                                    
                                    // 자동연결된 예방관리가 있고, 현재 값이 없으면 자동 적용
                                    if (linkedPreventions.length > 0 && !value && setState) {
                                      const autoPrevention = linkedPreventions[0]; // 첫 번째 값 사용
                                      setState((prev: WorksheetState) => ({
                                        ...prev,
                                        riskData: { ...(prev.riskData || {}), [key]: autoPrevention }
                                      }));
                                      
                                      // ✅ DB 저장 트리거
                                      if (setDirty) {
                                        setDirty(true);
                                      }
                                      
                                      // 자동연결 알림
                                      const message = getAutoLinkMessage(linkedPreventions, '예방관리');
                                      console.log(`[AllTabEmpty] ${currentFcText}: ${message}`);
                                      if (linkedPreventions.length > 0) {
                                        setTimeout(() => {
                                          alert(`✨ 자동연결: "${autoPrevention}" (동일 고장원인 기반)`);
                                        }, 100);
                                      }
                                      return; // 자동연결 완료, 모달 열지 않음
                                    }
                                  }
                                  
                                  // 자동연결이 없거나 이미 값이 있으면 모달 열기
                                  setControlModal?.({ isOpen: true, type: modalType, rowIndex: globalRowIdx });
                                }}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 검출관리(DC) 셀
                          if (col.name === '검출관리(DC)' || col.name === '검출관리개선') {
                            const modalType = 'detection';
                            const key = `${modalType}-${globalRowIdx}`;
                            const value = state?.riskData?.[key] || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => setControlModal?.({ isOpen: true, type: modalType, rowIndex: globalRowIdx })}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 특별특성 셀
                          if (col.name === '특별특성') {
                            const modalType = 'specialChar';
                            const key = `${modalType}-${globalRowIdx}`;
                            const value = state?.riskData?.[key] || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => setControlModal?.({ isOpen: true, type: modalType, rowIndex: globalRowIdx })}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 발생도 셀 (리스크분석 또는 최적화)
                          if (col.name === '발생도') {
                            const targetType = col.step === '리스크분석' ? 'risk' : 'opt';
                            const key = `${targetType}-${globalRowIdx}-O`;
                            const currentValue = state?.riskData?.[key] as number | undefined;
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => handleSODClick('O', targetType, globalRowIdx, currentValue)}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                  fontWeight: currentValue ? 700 : 400,
                                }}
                              >
                                {currentValue || ''}
                              </td>
                            );
                          }
                          
                          // ★ 검출도 셀 (리스크분석 또는 최적화)
                          if (col.name === '검출도') {
                            const targetType = col.step === '리스크분석' ? 'risk' : 'opt';
                            const key = `${targetType}-${globalRowIdx}-D`;
                            const currentValue = state?.riskData?.[key] as number | undefined;
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => handleSODClick('D', targetType, globalRowIdx, currentValue)}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                  fontWeight: currentValue ? 700 : 400,
                                }}
                              >
                                {currentValue || ''}
                              </td>
                            );
                          }
                          
                          // ★ AP 셀 (리스크분석 또는 최적화)
                          if (col.name === 'AP') {
                            const targetType = col.step === '리스크분석' ? 'risk' : 'opt';
                            const stage = col.step === '리스크분석' ? 5 : 6;
                            
                            // AP 계산: S, O, D 값 가져오기
                            const sKey = `${targetType}-${globalRowIdx}-S`;
                            const oKey = `${targetType}-${globalRowIdx}-O`;
                            const dKey = `${targetType}-${globalRowIdx}-D`;
                            const s = (state?.riskData?.[sKey] as number) || 0;
                            const o = (state?.riskData?.[oKey] as number) || 0;
                            const d = (state?.riskData?.[dKey] as number) || 0;
                            const apValue = calculateAP(s, o, d);
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  // 현재 행의 AP 데이터로 모달 열기
                                  if (apValue && fmGroup && row.fcText) {
                                    const apData = [{
                                      id: `ap-${globalRowIdx}`,
                                      processName: fmGroup.fmProcessName || '',
                                      failureMode: fmGroup.fmText || '',
                                      failureCause: row.fcText || '',
                                      severity: s,
                                      occurrence: o,
                                      detection: d,
                                      ap: apValue,
                                    }];
                                    setApModal({ isOpen: true, stage, data: apData });
                                  } else {
                                    // 전체 AP 결과 표시 (모든 행 데이터 수집)
                                    const allApData: typeof apModal.data = [];
                                    processedFMGroups.forEach((group, gIdx) => {
                                      group.rows.forEach((r, rIdx) => {
                                        const gRowIdx = processedFMGroups.slice(0, gIdx).reduce((acc, g) => acc + g.rows.length, 0) + rIdx;
                                        const gSKey = `${targetType}-${gRowIdx}-S`;
                                        const gOKey = `${targetType}-${gRowIdx}-O`;
                                        const gDKey = `${targetType}-${gRowIdx}-D`;
                                        const gS = (state?.riskData?.[gSKey] as number) || 0;
                                        const gO = (state?.riskData?.[gOKey] as number) || 0;
                                        const gD = (state?.riskData?.[gDKey] as number) || 0;
                                        const gAp = calculateAP(gS, gO, gD);
                                        if (gAp && gS > 0 && gO > 0 && gD > 0) {
                                          allApData.push({
                                            id: `ap-${gRowIdx}`,
                                            processName: group.fmProcessName || '',
                                            failureMode: group.fmText || '',
                                            failureCause: r.fcText || '',
                                            severity: gS,
                                            occurrence: gO,
                                            detection: gD,
                                            ap: gAp,
                                          });
                                        }
                                      });
                                    });
                                    setApModal({ isOpen: true, stage, data: allApData });
                                  }
                                }}
                                style={{
                                  background: apValue === 'H' ? '#ef5350' : apValue === 'M' ? '#ffeb3b' : apValue === 'L' ? '#66bb6a' : (globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor),
                                  color: apValue ? '#000' : 'inherit',
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                  fontWeight: apValue ? 700 : 400,
                                }}
                              >
                                {apValue || ''}
                              </td>
                            );
                          }
                          
                          // ★ 습득교훈 셀 (텍스트 입력)
                          if (col.name === '습득교훈') {
                            const key = `lesson-${globalRowIdx}`;
                            const value = state?.riskData?.[key] as string || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  if (!setState) {
                                    console.error('setState가 없습니다.');
                                    return;
                                  }
                                  const newValue = prompt('습득교훈을 입력하세요:', value);
                                  if (newValue !== null) {
                                    setState((prev: WorksheetState) => ({
                                      ...prev,
                                      riskData: { ...(prev.riskData || {}), [key]: newValue }
                                    }));
                                  }
                                }}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 개선결과근거 셀 (텍스트 입력)
                          if (col.name === '개선결과근거') {
                            const key = `result-${globalRowIdx}`;
                            const value = state?.riskData?.[key] as string || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  if (!setState) {
                                    console.error('setState가 없습니다.');
                                    return;
                                  }
                                  const newValue = prompt('개선결과근거를 입력하세요:', value);
                                  if (newValue !== null) {
                                    setState((prev: WorksheetState) => ({
                                      ...prev,
                                      riskData: { ...(prev.riskData || {}), [key]: newValue }
                                    }));
                                  }
                                }}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 완료일자 셀 (날짜 입력)
                          if (col.name === '완료일자') {
                            const key = `completeDate-${globalRowIdx}`;
                            const value = state?.riskData?.[key] as string || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  if (!setState) {
                                    console.error('setState가 없습니다.');
                                    return;
                                  }
                                  const newValue = prompt('완료일자를 입력하세요 (YYYY-MM-DD):', value);
                                  if (newValue !== null) {
                                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                                    if (newValue && !dateRegex.test(newValue)) {
                                      alert('날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)');
                                      return;
                                    }
                                    setState((prev: WorksheetState) => ({
                                      ...prev,
                                      riskData: { ...(prev.riskData || {}), [key]: newValue }
                                    }));
                                  }
                                }}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 목표완료일자 셀 (날짜 입력)
                          if (col.name === '목표완료일자') {
                            const key = `targetDate-${globalRowIdx}`;
                            const value = state?.riskData?.[key] as string || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  if (!setState) {
                                    console.error('setState가 없습니다.');
                                    return;
                                  }
                                  const newValue = prompt('목표완료일자를 입력하세요 (YYYY-MM-DD):', value);
                                  if (newValue !== null) {
                                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                                    if (newValue && !dateRegex.test(newValue)) {
                                      alert('날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)');
                                      return;
                                    }
                                    setState((prev: WorksheetState) => ({
                                      ...prev,
                                      riskData: { ...(prev.riskData || {}), [key]: newValue }
                                    }));
                                  }
                                }}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 책임자성명 셀 (텍스트 입력)
                          if (col.name === '책임자성명') {
                            const key = `person-${globalRowIdx}`;
                            const value = state?.riskData?.[key] as string || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  if (!setState) {
                                    console.error('setState가 없습니다.');
                                    return;
                                  }
                                  const newValue = prompt('책임자성명을 입력하세요:', value);
                                  if (newValue !== null) {
                                    setState((prev: WorksheetState) => ({
                                      ...prev,
                                      riskData: { ...(prev.riskData || {}), [key]: newValue }
                                    }));
                                  }
                                }}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 상태 셀 (상태 선택)
                          if (col.name === '상태') {
                            const key = `status-${globalRowIdx}`;
                            const value = state?.riskData?.[key] as string || '';
                            const statusOptions = ['대기', '진행중', '완료', '보류'];
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  if (!setState) {
                                    console.error('setState가 없습니다.');
                                    return;
                                  }
                                  const selected = prompt(`상태를 선택하세요:\n${statusOptions.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}\n\n번호 입력:`, value ? String(statusOptions.indexOf(value) + 1) : '');
                                  if (selected !== null) {
                                    const idx = parseInt(selected) - 1;
                                    if (idx >= 0 && idx < statusOptions.length) {
                                      setState((prev: WorksheetState) => ({
                                        ...prev,
                                        riskData: { ...(prev.riskData || {}), [key]: statusOptions[idx] }
                                      }));
                                    } else {
                                      alert('잘못된 번호입니다.');
                                    }
                                  }
                                }}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ 재평가 SOD (심각도, 발생도, 검출도) - 최적화 효과 평가
                          if (col.name === '심각도(재평가)' || col.name === '심각도') {
                            if (col.step === '최적화') {
                              const key = `opt-${globalRowIdx}-S`;
                              const currentValue = state?.riskData?.[key] as number | undefined;
                              
                              return (
                                <td 
                                  key={colIdx}
                                  rowSpan={row.fcRowSpan}
                                  onClick={() => handleSODClick('S', 'opt', globalRowIdx, currentValue)}
                                  style={{
                                    background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                    height: `${HEIGHTS.body}px`,
                                    padding: '3px 4px',
                                    border: '1px solid #ccc',
                                    fontSize: '11px',
                                    textAlign: col.align,
                                    verticalAlign: 'middle',
                                    cursor: 'pointer',
                                    fontWeight: currentValue ? 700 : 400,
                                  }}
                                >
                                  {currentValue || ''}
                                </td>
                              );
                            }
                          }
                          
                          // ★ 비고 셀 (텍스트 입력)
                          if (col.name === '비고') {
                            const key = `note-${globalRowIdx}`;
                            const value = state?.riskData?.[key] as string || '';
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                onClick={() => {
                                  if (!setState) {
                                    console.error('setState가 없습니다.');
                                    return;
                                  }
                                  const newValue = prompt('비고를 입력하세요:', value);
                                  if (newValue !== null) {
                                    setState((prev: WorksheetState) => ({
                                      ...prev,
                                      riskData: { ...(prev.riskData || {}), [key]: newValue }
                                    }));
                                  }
                                }}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                }}
                              >
                                {value}
                              </td>
                            );
                          }
                          
                          // ★ RPN 셀 (자동 계산 표시)
                          if (col.name === 'RPN') {
                            const targetType = col.step === '리스크분석' ? 'risk' : 'opt';
                            const sKey = `${targetType}-${globalRowIdx}-S`;
                            const oKey = `${targetType}-${globalRowIdx}-O`;
                            const dKey = `${targetType}-${globalRowIdx}-D`;
                            const s = (state?.riskData?.[sKey] as number) || 0;
                            const o = (state?.riskData?.[oKey] as number) || 0;
                            const d = (state?.riskData?.[dKey] as number) || 0;
                            const rpn = s > 0 && o > 0 && d > 0 ? s * o * d : 0;
                            
                            return (
                              <td 
                                key={colIdx}
                                rowSpan={row.fcRowSpan}
                                style={{
                                  background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                  height: `${HEIGHTS.body}px`,
                                  padding: '3px 4px',
                                  border: '1px solid #ccc',
                                  fontSize: '11px',
                                  textAlign: col.align,
                                  verticalAlign: 'middle',
                                  fontWeight: rpn > 0 ? 700 : 400,
                                }}
                              >
                                {rpn > 0 ? rpn : ''}
                              </td>
                            );
                          }
                          
                          // 다른 리스크/최적화 컬럼
                          return (
                            <td 
                              key={colIdx}
                              rowSpan={row.fcRowSpan}
                              style={{
                                background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                                height: `${HEIGHTS.body}px`,
                                padding: '3px 4px',
                                border: '1px solid #ccc',
                                fontSize: '11px',
                                textAlign: col.align,
                                verticalAlign: 'middle',
                              }}
                            >
                            </td>
                          );
                        }
                        return null; // fcRowSpan으로 병합됨
                      }
                      
                      // 다른 컬럼은 빈 셀로 렌더링
                      return (
                        <td 
                          key={colIdx} 
                          style={{
                            background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
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
                      );
                    })}
                  </tr>
                );
              })
            )
          ) : (
            // ★ 고장연결 데이터가 없으면 빈 행 렌더링
            Array.from({ length: rowCount }, (_, rowIdx) => (
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
            ))
          )}
        </tbody>
      </table>

      {/* 예방관리/검출관리/특별특성 선택 모달 */}
      {controlModal.isOpen && state && setState && (
        <DataSelectModal
          isOpen={controlModal.isOpen}
          title={controlModal.type === 'prevention' ? '예방관리 선택' : controlModal.type === 'detection' ? '검출관리 선택' : '특별특성 선택'}
          itemCode={controlModal.type === 'prevention' ? 'B5' : controlModal.type === 'detection' ? 'B6' : 'SC'}
          onClose={closeControlModal}
          onSave={(selectedValues) => {
            if (setState && selectedValues.length > 0) {
              const selectedValue = selectedValues[0];
              const key = `${controlModal.type}-${controlModal.rowIndex}`;
              
              // ✅ 예방관리 자동연결: 동일한 고장원인에 동일한 예방관리 자동 연결
              let autoLinkedCount = 0;
              let currentFcText = '';
              let currentRowIdx = 0;
              
              if (controlModal.type === 'prevention' && failureLinks && processedFMGroups.length > 0) {
                // 현재 행의 고장원인 텍스트 찾기
                processedFMGroups.forEach((group, gIdx) => {
                  group.rows.forEach((r, rIdx) => {
                    const gRowIdx = processedFMGroups.slice(0, gIdx).reduce((acc, g) => acc + g.rows.length, 0) + rIdx;
                    if (gRowIdx === controlModal.rowIndex) {
                      currentFcText = r.fcText || '';
                      currentRowIdx = gRowIdx;
                    }
                  });
                });
                
                // 동일한 고장원인을 가진 다른 행들 찾기
                if (currentFcText) {
                  processedFMGroups.forEach((group, gIdx) => {
                    group.rows.forEach((r, rIdx) => {
                      const gRowIdx = processedFMGroups.slice(0, gIdx).reduce((acc, g) => acc + g.rows.length, 0) + rIdx;
                      // 현재 행이 아니고, 동일한 고장원인을 가진 행
                      if (gRowIdx !== currentRowIdx && r.fcText === currentFcText) {
                        const autoKey = `${controlModal.type}-${gRowIdx}`;
                        const existingValue = state?.riskData?.[autoKey];
                        // 값이 없거나 다른 값이면 자동 연결
                        if (!existingValue || existingValue !== selectedValue) {
                          autoLinkedCount++;
                        }
                      }
                    });
                  });
                }
              }
              
              // 현재 행 저장 + 자동연결된 행들 저장
              setState((prev: WorksheetState) => {
                const newRiskData = { ...(prev.riskData || {}) };
                
                // 현재 행 저장
                newRiskData[key] = selectedValue;
                
                // ✅ 자동연결: 동일한 고장원인을 가진 다른 행들에도 자동 저장
                if (controlModal.type === 'prevention' && failureLinks && processedFMGroups.length > 0 && autoLinkedCount > 0 && currentFcText) {
                  processedFMGroups.forEach((group, gIdx) => {
                    group.rows.forEach((r, rIdx) => {
                      const gRowIdx = processedFMGroups.slice(0, gIdx).reduce((acc, g) => acc + g.rows.length, 0) + rIdx;
                      if (gRowIdx !== currentRowIdx && r.fcText === currentFcText) {
                        const autoKey = `${controlModal.type}-${gRowIdx}`;
                        const existingValue = prev.riskData?.[autoKey];
                        // 값이 없거나 다른 값이면 자동 연결
                        if (!existingValue || existingValue !== selectedValue) {
                          newRiskData[autoKey] = selectedValue;
                        }
                      }
                    });
                  });
                }
                
                return { ...prev, riskData: newRiskData };
              });
              
              // ✅ DB 저장 트리거 (예방관리 저장 시)
              if (controlModal.type === 'prevention' && setDirty) {
                setDirty(true);
                console.log('[AllTabEmpty] 예방관리 저장 → DB 저장 트리거');
              }
              
              // 자동연결 알림
              if (autoLinkedCount > 0 && currentFcText) {
                setTimeout(() => {
                  alert(`✨ 자동연결: 동일한 고장원인 "${currentFcText}"에 "${selectedValue}" 예방관리가 ${autoLinkedCount}건 자동 연결되었습니다.`);
                }, 100);
              }
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
      
      {/* SOD 선택 모달 (심각도/발생도/검출도) */}
      <SODSelectModal
        isOpen={sodModal.isOpen}
        onClose={closeSodModal}
        onSelect={handleSODSelect}
        category={sodModal.category}
        fmeaType="P-FMEA"
        currentValue={sodModal.currentValue}
        scope={sodModal.scope}
      />
      
      {/* AP 결과 모달 (5AP/6AP) */}
      <APResultModal
        isOpen={apModal.isOpen}
        onClose={() => setApModal(prev => ({ ...prev, isOpen: false }))}
        stage={apModal.stage}
        data={apModal.data}
      />
    </div>
  );
}

// Export
export { COLUMNS_BASE, COLORS, HEIGHTS, getColumnsWithRPN, STEP_COLORS };
export type { ColumnDef };
