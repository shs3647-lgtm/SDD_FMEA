/**
 * @file APTableInline.tsx
 * @description AP 테이블 인라인 컴포넌트 (5AP, 6AP 기준표)
 */

'use client';

import React from 'react';

// AP 테이블 데이터
const AP_TABLE_DATA: { s: string; o: string; d: ('H' | 'M' | 'L')[] }[] = [
  { s: '9-10', o: '8-10', d: ['H', 'H', 'H', 'H'] },
  { s: '9-10', o: '6-7', d: ['H', 'H', 'H', 'H'] },
  { s: '9-10', o: '4-5', d: ['H', 'H', 'L', 'L'] },
  { s: '9-10', o: '2-3', d: ['H', 'M', 'L', 'L'] },
  { s: '9-10', o: '1', d: ['H', 'L', 'L', 'L'] },
  { s: '7-8', o: '8-10', d: ['H', 'H', 'H', 'H'] },
  { s: '7-8', o: '6-7', d: ['H', 'H', 'M', 'H'] },
  { s: '7-8', o: '4-5', d: ['H', 'M', 'L', 'L'] },
  { s: '7-8', o: '2-3', d: ['M', 'L', 'L', 'L'] },
  { s: '7-8', o: '1', d: ['L', 'L', 'L', 'L'] },
  { s: '4-6', o: '8-10', d: ['H', 'H', 'M', 'L'] },
  { s: '4-6', o: '6-7', d: ['H', 'M', 'L', 'L'] },
  { s: '4-6', o: '4-5', d: ['H', 'M', 'L', 'L'] },
  { s: '4-6', o: '2-3', d: ['M', 'L', 'L', 'L'] },
  { s: '4-6', o: '1', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '8-10', d: ['M', 'L', 'L', 'L'] },
  { s: '2-3', o: '6-7', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '4-5', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '2-3', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '1', d: ['L', 'L', 'L', 'L'] },
];

const D_HEADERS = ['7-10', '5-6', '2-4', '1'];
const AP_COLORS: Record<'H' | 'M' | 'L', { bg: string; text: string }> = {
  H: { bg: '#f87171', text: '#7f1d1d' },
  M: { bg: '#fde047', text: '#713f12' },
  L: { bg: '#86efac', text: '#14532d' },
};

interface APTableInlineProps {
  onClose: () => void;
  showClose?: boolean;
  stage?: 5 | 6;
}

export default function APTableInline({ onClose, showClose = true, stage = 5 }: APTableInlineProps) {
  const severityRanges = ['9-10', '7-8', '4-6', '2-3'];
  const getSeverityRowSpan = (s: string) => AP_TABLE_DATA.filter(r => r.s === s).length;
  
  // 개수 계산
  let hCount = 0, mCount = 0, lCount = 0;
  AP_TABLE_DATA.forEach(row => {
    row.d.forEach(ap => {
      if (ap === 'H') hCount++;
      else if (ap === 'M') mCount++;
      else lCount++;
    });
  });

  // 단계별 헤더 색상
  const headerBg = stage === 6 ? '#2e7d32' : '#1e3a5f';
  const stageLabel = stage === 6 ? '6AP' : '5AP';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: headerBg, color: '#fff', padding: '6px 10px', fontSize: '11px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span>📊 {stageLabel} 기준표 (H:{hCount} M:{mCount} L:{lCount})</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '2px', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
          <colgroup>
            <col style={{ width: '13px' }} />
            <col style={{ width: '19px' }} />
            <col style={{ width: '19px' }} />
            <col style={{ width: '19px' }} />
            <col style={{ width: '19px' }} />
            <col style={{ width: '19px' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              <th style={{ border: '1px solid #000', padding: '1px', fontSize: '8px' }}>S</th>
              <th style={{ border: '1px solid #000', padding: '1px', fontSize: '8px' }}>O</th>
              {D_HEADERS.map(d => <th key={d} style={{ border: '1px solid #000', padding: '1px', fontSize: '8px' }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {AP_TABLE_DATA.map((row, idx) => {
              const isFirstOfSeverity = idx === 0 || AP_TABLE_DATA[idx - 1].s !== row.s;
              return (
                <tr key={idx}>
                  {isFirstOfSeverity && (
                    <td rowSpan={getSeverityRowSpan(row.s)} style={{ border: '1px solid #000', padding: '0', fontWeight: 700, textAlign: 'center', background: '#e3f2fd', fontSize: '9px', writingMode: 'vertical-rl' }}>
                      {row.s}
                    </td>
                  )}
                  <td style={{ border: '1px solid #000', padding: '1px', textAlign: 'center', background: '#f5f5f5', fontSize: '9px' }}>{row.o}</td>
                  {row.d.map((ap, dIdx) => (
                    <td key={dIdx} style={{ border: '1px solid #000', padding: '1px', textAlign: 'center', background: AP_COLORS[ap].bg, color: AP_COLORS[ap].text, fontWeight: 700, fontSize: '10px' }}>
                      {ap}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ background: '#f0f4f8', padding: '4px', fontSize: '9px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><span style={{ width: '12px', height: '12px', background: '#f87171', borderRadius: '2px' }}></span>H</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><span style={{ width: '12px', height: '12px', background: '#fde047', borderRadius: '2px' }}></span>M</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><span style={{ width: '12px', height: '12px', background: '#86efac', borderRadius: '2px' }}></span>L</span>
      </div>
    </div>
  );
}


