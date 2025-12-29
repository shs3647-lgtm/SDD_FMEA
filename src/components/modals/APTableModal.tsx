/**
 * @file APTableModal.tsx
 * @description AP(Action Priority) 테이블 점수기준표 모달
 * Severity × Occurrence × Detection 3차원 매트릭스
 * H(High)=빨강, M(Medium)=노랑, L(Low)=녹색
 */

'use client';

import React from 'react';

interface APTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// AP 테이블 데이터 정의
// 구조: [Severity범위, Occurrence범위, Detection별 AP등급(7-10, 5-6, 2-4, 1-1)]
const AP_TABLE_DATA: { s: string; o: string; d: ('H' | 'M' | 'L')[] }[] = [
  // Severity 9-10
  { s: '9-10', o: '8-10', d: ['H', 'H', 'H', 'H'] },
  { s: '9-10', o: '6-7', d: ['H', 'H', 'H', 'H'] },
  { s: '9-10', o: '4-5', d: ['H', 'H', 'L', 'L'] },
  { s: '9-10', o: '2-3', d: ['H', 'M', 'L', 'L'] },
  { s: '9-10', o: '1', d: ['H', 'L', 'L', 'L'] },
  // Severity 7-8
  { s: '7-8', o: '8-10', d: ['H', 'H', 'H', 'H'] },
  { s: '7-8', o: '6-7', d: ['H', 'H', 'M', 'H'] },
  { s: '7-8', o: '4-5', d: ['H', 'M', 'L', 'L'] },
  { s: '7-8', o: '2-3', d: ['M', 'L', 'L', 'L'] },
  { s: '7-8', o: '1', d: ['L', 'L', 'L', 'L'] },
  // Severity 4-6
  { s: '4-6', o: '8-10', d: ['H', 'H', 'M', 'L'] },
  { s: '4-6', o: '6-7', d: ['H', 'M', 'L', 'L'] },
  { s: '4-6', o: '4-5', d: ['H', 'M', 'L', 'L'] },
  { s: '4-6', o: '2-3', d: ['M', 'L', 'L', 'L'] },
  { s: '4-6', o: '1', d: ['L', 'L', 'L', 'L'] },
  // Severity 2-3
  { s: '2-3', o: '8-10', d: ['M', 'L', 'L', 'L'] },
  { s: '2-3', o: '6-7', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '4-5', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '2-3', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '1', d: ['L', 'L', 'L', 'L'] },
];

// AP 등급별 색상
const AP_COLORS: Record<'H' | 'M' | 'L', { bg: string; text: string; label: string }> = {
  H: { bg: '#f87171', text: '#7f1d1d', label: 'High (H)' },
  M: { bg: '#fde047', text: '#713f12', label: 'Medium (M)' },
  L: { bg: '#86efac', text: '#14532d', label: 'Low (L)' },
};

// Detection 헤더
const D_HEADERS = ['7-10', '5-6', '2-4', '1'];

export default function APTableModal({ isOpen, onClose }: APTableModalProps) {
  if (!isOpen) return null;

  // Severity별 그룹 계산 (rowSpan용)
  const getSeverityRowSpan = (sRange: string): number => {
    return AP_TABLE_DATA.filter(row => row.s === sRange).length;
  };

  // Severity 범위 목록 (중복 제거)
  const severityRanges = [...new Set(AP_TABLE_DATA.map(row => row.s))];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxWidth: '700px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            background: '#1e3a5f',
            color: '#fff',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '14px' }}>📊 AP(Action Priority) 점수 기준표</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* 범례 */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: '16px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
          {Object.entries(AP_COLORS).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '24px', height: '18px', background: val.bg, borderRadius: '3px', border: '1px solid #ccc' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: val.text }}>{val.label}</span>
            </div>
          ))}
        </div>

        {/* 테이블 */}
        <div style={{ padding: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '2px solid #000' }}>
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    background: '#1e3a5f',
                    color: '#fff',
                    padding: '10px 8px',
                    border: '2px solid #000',
                    textAlign: 'center',
                    fontWeight: 700,
                    width: '12%',
                  }}
                >
                  Severity<br />(S)
                </th>
                <th
                  rowSpan={2}
                  style={{
                    background: '#1e3a5f',
                    color: '#fff',
                    padding: '10px 8px',
                    border: '2px solid #000',
                    textAlign: 'center',
                    fontWeight: 700,
                    width: '12%',
                  }}
                >
                  Occurrence<br />(O)
                </th>
                <th
                  colSpan={4}
                  style={{
                    background: '#1e3a5f',
                    color: '#fff',
                    padding: '10px 8px',
                    border: '2px solid #000',
                    textAlign: 'center',
                    fontWeight: 700,
                  }}
                >
                  Detection (D)
                </th>
              </tr>
              <tr>
                {D_HEADERS.map((d) => (
                  <th
                    key={d}
                    style={{
                      background: '#2d4a6f',
                      color: '#fff',
                      padding: '8px',
                      border: '2px solid #000',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      width: '19%',
                    }}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AP_TABLE_DATA.map((row, rowIdx) => {
                // 현재 Severity의 첫 번째 행인지 확인
                const isFirstOfSeverity = rowIdx === 0 || AP_TABLE_DATA[rowIdx - 1].s !== row.s;
                const severityRowSpan = getSeverityRowSpan(row.s);

                return (
                  <tr key={rowIdx}>
                    {/* Severity 셀 (첫 번째 행에만 표시, rowSpan 적용) */}
                    {isFirstOfSeverity && (
                      <td
                        rowSpan={severityRowSpan}
                        style={{
                          background: '#e8f4fc',
                          padding: '8px',
                          border: '1px solid #000',
                          textAlign: 'center',
                          fontWeight: 700,
                          verticalAlign: 'middle',
                          fontSize: '16px',
                        }}
                      >
                        {row.s}
                      </td>
                    )}
                    {/* Occurrence 셀 */}
                    <td
                      style={{
                        background: '#f0f7ff',
                        padding: '8px',
                        border: '1px solid #000',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {row.o}
                    </td>
                    {/* Detection별 AP 등급 셀 - 병합 없이 개별 표시 */}
                    {row.d.map((ap, dIdx) => (
                      <td
                        key={dIdx}
                        style={{
                          background: AP_COLORS[ap].bg,
                          color: AP_COLORS[ap].text,
                          padding: '8px',
                          border: '1px solid #000',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        {ap}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AP 개수 통계 */}
        {(() => {
          let hCount = 0, mCount = 0, lCount = 0;
          AP_TABLE_DATA.forEach(row => {
            row.d.forEach(ap => {
              if (ap === 'H') hCount++;
              else if (ap === 'M') mCount++;
              else if (ap === 'L') lCount++;
            });
          });
          return (
            <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #ddd', display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', height: '28px', background: AP_COLORS.H.bg, borderRadius: '4px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: AP_COLORS.H.text }}>{hCount}</div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: AP_COLORS.H.text }}>High (즉시 조치)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', height: '28px', background: AP_COLORS.M.bg, borderRadius: '4px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: AP_COLORS.M.text }}>{mCount}</div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: AP_COLORS.M.text }}>Medium (권고)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', height: '28px', background: AP_COLORS.L.bg, borderRadius: '4px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: AP_COLORS.L.text }}>{lCount}</div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: AP_COLORS.L.text }}>Low (유지)</span>
              </div>
            </div>
          );
        })()}

        {/* 설명 */}
        <div style={{ padding: '10px 16px', background: '#f5f5f5', borderTop: '1px solid #ddd', fontSize: '10px', color: '#666', textAlign: 'center' }}>
          <strong>조치 기준:</strong>
          <span style={{ marginLeft: '8px' }}>H: 즉시 개선 조치 필요</span>
          <span style={{ marginLeft: '12px' }}>M: 개선 조치 권고</span>
          <span style={{ marginLeft: '12px' }}>L: 현상 유지 가능</span>
        </div>
      </div>
    </div>
  );
}

