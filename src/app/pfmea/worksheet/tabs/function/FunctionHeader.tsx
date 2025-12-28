/**
 * @file FunctionHeader.tsx
 * @description 기능분석 탭 헤더 정의 (구조분석 열 포함)
 */

'use client';

import React from 'react';
import { COLORS } from '../../constants';
import { stickyFirstColStyle } from './constants';

export default function FunctionHeader() {
  return (
    <>
      {/* 1행: 메인 그룹 헤더 */}
      <tr>
        <th colSpan={4} style={{ ...stickyFirstColStyle, zIndex: 25, background: '#1976d2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px', height: '28px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
          Step 1. 구조 분석 (연계)
        </th>
        <th colSpan={3} style={{ background: '#7b1fa2', color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px', height: '28px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
          1. 완제품 기능 및 요구사항 (L1)
        </th>
        <th colSpan={2} style={{ background: '#512da8', color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px', height: '28px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
          2. 메인공정 기능 및 제품특성 (L2)
        </th>
        <th colSpan={2} style={{ background: '#303f9f', color: 'white', border: `1px solid ${COLORS.line}`, padding: '4px', height: '28px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
          3. 작업요소 기능 및 공정특성 (L3)
        </th>
      </tr>
      
      {/* 2행: 세부 컬럼 헤더 */}
      <tr style={{ position: 'sticky', top: '28px', zIndex: 20, background: '#fff' }}>
        <th style={{ ...stickyFirstColStyle, zIndex: 25, background: '#e3f2fd', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>완제품명</th>
        <th style={{ background: '#e3f2fd', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>메인공정</th>
        <th style={{ background: '#e3f2fd', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>4M</th>
        <th style={{ background: '#e3f2fd', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>작업요소</th>
        
        <th style={{ background: '#f3e5f5', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>구분</th>
        <th style={{ background: '#f3e5f5', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>완제품기능</th>
        <th style={{ background: '#f3e5f5', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>요구사항</th>
        
        <th style={{ background: '#ede7f6', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>공정기능</th>
        <th style={{ background: '#ede7f6', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>제품특성</th>
        
        <th style={{ background: '#e8eaf6', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>작업요소기능</th>
        <th style={{ background: '#e8eaf6', border: `1px solid ${COLORS.line}`, padding: '2px 4px', height: '24px', fontWeight: 700, fontSize: '10px' }}>공정특성</th>
      </tr>
    </>
  );
}
