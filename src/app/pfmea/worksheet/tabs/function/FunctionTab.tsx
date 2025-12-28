/**
 * @file FunctionTab.tsx
 * @description 기능분석 탭 - 레벨별 독립 분석 구조 (원자성 데이터 기반)
 */

'use client';

import React, { useState } from 'react';
import { FunctionTabProps } from './types';
import FunctionL1Tab from './FunctionL1Tab';
import FunctionL2Tab from './FunctionL2Tab';
import FunctionL3Tab from './FunctionL3Tab';

export default function FunctionTab(props: FunctionTabProps) {
  const { state } = props;
  
  // URL 또는 상태에 따른 기본 서브 레벨 설정
  const [subLevel, setSubLevel] = useState<'L1' | 'L2' | 'L3'>(() => {
    if (state.tab === 'function-l1') return 'L1';
    if (state.tab === 'function-l2') return 'L2';
    if (state.tab === 'function-l3') return 'L3';
    return 'L1';
  });

  const tabButtonStyle = (level: string) => ({
    padding: '8px 24px',
    fontSize: '12px',
    fontWeight: subLevel === level ? 900 : 500,
    cursor: 'pointer',
    borderBottom: subLevel === level ? '4px solid #7b1fa2' : 'none',
    color: subLevel === level ? '#7b1fa2' : '#555',
    background: subLevel === level ? '#fff' : 'transparent',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* 서브 레벨 선택 바 (STEP A: 기능 정의) */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        padding: '0 16px', 
        background: '#f1f3f5', 
        borderBottom: '1px solid #dee2e6',
        height: '40px',
        alignItems: 'flex-end'
      }}>
        <button style={tabButtonStyle('L1')} onClick={() => setSubLevel('L1')}>1L. 완제품 (FE 원천)</button>
        <button style={tabButtonStyle('L2')} onClick={() => setSubLevel('L2')}>2L. 메인공정 (FM 원천)</button>
        <button style={tabButtonStyle('L3')} onClick={() => setSubLevel('L3')}>3L. 작업요소 (FC 원천)</button>
        
        <div style={{ marginLeft: 'auto', paddingBottom: '8px', fontSize: '10px', color: '#888' }}>
          * 원자적 데이터 정의 단계 (STEP A)
        </div>
      </div>

      {/* 레벨별 독립 워크시트 영역 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {subLevel === 'L1' && <FunctionL1Tab {...props} />}
        {subLevel === 'L2' && <FunctionL2Tab {...props} />}
        {subLevel === 'L3' && <FunctionL3Tab {...props} />}
      </div>
    </div>
  );
}
