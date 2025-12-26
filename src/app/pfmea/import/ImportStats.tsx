/**
 * @file ImportStats.tsx
 * @description 입포트 현황 통계 컴포넌트
 * @author AI Assistant
 * @created 2025-12-26
 */

'use client';

import React from 'react';
import { ImportedFlatData } from './types';

interface ImportStatsProps {
  data: ImportedFlatData[];
}

export default function ImportStats({ data }: ImportStatsProps) {
  // 통계 계산
  const totalRows = data.length;
  const processCount = data.filter(d => d.itemCode.startsWith('A')).length;
  const workElementCount = data.filter(d => d.itemCode.startsWith('B')).length;
  const productCount = data.filter(d => d.itemCode.startsWith('C')).length;
  const emptyCount = data.filter(d => !d.value || d.value.trim() === '').length;

  return (
    <div className="bg-white rounded-lg p-4" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 className="text-sm font-bold text-[#00587a] mb-3">입포트 현황</h3>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center" style={{ border: '1px solid #999' }}>총행</th>
            <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center" style={{ border: '1px solid #999' }}>공정항목</th>
            <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center" style={{ border: '1px solid #999' }}>작업요소</th>
            <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center" style={{ border: '1px solid #999' }}>완제품</th>
            <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center" style={{ border: '1px solid #999' }}>누락</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="bg-white text-center text-black font-bold text-lg py-2" style={{ border: '1px solid #999' }}>
              {totalRows}
            </td>
            <td className="bg-blue-50 text-center text-blue-600 font-bold text-lg py-2" style={{ border: '1px solid #999' }}>
              {processCount}
            </td>
            <td className="bg-green-50 text-center text-green-600 font-bold text-lg py-2" style={{ border: '1px solid #999' }}>
              {workElementCount}
            </td>
            <td className="bg-red-50 text-center text-red-600 font-bold text-lg py-2" style={{ border: '1px solid #999' }}>
              {productCount}
            </td>
            <td className="bg-yellow-50 text-center text-yellow-600 font-bold text-lg py-2" style={{ border: '1px solid #999' }}>
              {emptyCount}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

