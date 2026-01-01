/**
 * @file SODCompareChart.tsx
 * @description S/O/D 개선 전후 버터플라이 차트 (좌: 개선전, 우: 개선후)
 */

'use client';

import React from 'react';

interface SODData {
  before: { s: number; o: number; d: number };
  after: { s: number; o: number; d: number };
}

interface SODCompareChartProps {
  data: SODData;
}

export function SODCompareChart({ data }: SODCompareChartProps) {
  const maxValue = 10; // S/O/D는 1-10 스케일
  
  const items = [
    { id: 'S', label: 'Severity', labelKr: '심각도', before: data.before.s, after: data.after.s, color: '#dc2626' },
    { id: 'O', label: 'Occurrence', labelKr: '발생도', before: data.before.o, after: data.after.o, color: '#f97316' },
    { id: 'D', label: 'Detection', labelKr: '검출도', before: data.before.d, after: data.after.d, color: '#8b5cf6' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 범례 */}
      <div className="flex items-center justify-center gap-6 mb-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#1976d2] rounded-sm" />
          <span className="text-slate-600 font-medium">개선 전</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#43a047] rounded-sm" />
          <span className="text-slate-600 font-medium">개선 후</span>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="flex-1 flex flex-col justify-center gap-3 px-2">
        {items.map((item) => {
          const beforePct = (item.before / maxValue) * 100;
          const afterPct = (item.after / maxValue) * 100;
          const improvement = item.before - item.after;
          const improvementPct = item.before > 0 ? Math.round((improvement / item.before) * 100) : 0;

          return (
            <div key={item.id} className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center">
              {/* 왼쪽: 개선 전 (오른쪽 정렬 바) */}
              <div className="flex items-center gap-2 justify-end">
                <span className="text-[11px] font-bold text-slate-700 min-w-[24px] text-right">
                  {item.before}
                </span>
                <div className="flex-1 h-5 bg-slate-100 rounded-sm overflow-hidden relative max-w-[120px]">
                  <div 
                    className="absolute top-0 bottom-0 right-0 bg-[#1976d2] transition-all duration-500"
                    style={{ width: `${beforePct}%` }}
                  />
                </div>
              </div>

              {/* 중앙: 라벨 */}
              <div className="flex flex-col items-center justify-center">
                <div 
                  className="text-lg font-black"
                  style={{ color: item.color }}
                >
                  {item.id}
                </div>
                <div className="text-[9px] text-slate-500">{item.labelKr}</div>
                {improvement > 0 && (
                  <div className="text-[9px] text-green-600 font-semibold">
                    ▼{improvement.toFixed(1)} ({improvementPct}%)
                  </div>
                )}
              </div>

              {/* 오른쪽: 개선 후 (왼쪽 정렬 바) */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-5 bg-slate-100 rounded-sm overflow-hidden relative max-w-[120px]">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-[#43a047] transition-all duration-500"
                    style={{ width: `${afterPct}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 min-w-[24px]">
                  {item.after}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 라벨 */}
      <div className="grid grid-cols-[1fr_80px_1fr] gap-2 mt-2 text-[9px] text-slate-400">
        <div className="text-right">← 개선 전</div>
        <div className="text-center">평균값 (1-10)</div>
        <div className="text-left">개선 후 →</div>
      </div>
    </div>
  );
}

