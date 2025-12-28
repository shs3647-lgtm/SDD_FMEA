/**
 * @file FunctionColgroup.tsx
 * @description 기능분석 탭 컬럼 정의 (구조분석 열 포함)
 */

'use client';

import React from 'react';

export default function FunctionColgroup() {
  return (
    <colgroup>
      {/* 구조분석 영역 (4열) */}
      <col style={{ width: '100px' }} /> {/* 완제품명 */}
      <col style={{ width: '120px' }} /> {/* 공정명 */}
      <col style={{ width: '40px' }} />  {/* 4M */}
      <col style={{ width: '100px' }} /> {/* 작업요소 */}
      
      {/* 기능분석 영역 (10열) */}
      <col style={{ width: '80px' }} />  {/* L1 구분 */}
      <col style={{ width: '180px' }} /> {/* 완제품기능 */}
      <col style={{ width: '150px' }} /> {/* 요구사항 */}
      
      <col style={{ width: '150px' }} /> {/* 공정기능 */}
      <col style={{ width: '120px' }} /> {/* 제품특성 */}
      
      <col style={{ width: '150px' }} /> {/* 작업요소기능 */}
      <col style={{ width: '120px' }} /> {/* 공정특성 */}
    </colgroup>
  );
}
