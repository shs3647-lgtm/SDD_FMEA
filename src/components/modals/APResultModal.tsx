/**
 * @file APResultModal.tsx
 * @description AP 결과 모달 - 5단계(리스크분석) 또는 6단계(최적화) AP 결과 표시
 */

'use client';

import React from 'react';

interface APResultItem {
  id: string;
  processName: string;
  failureMode: string;
  failureCause: string;
  severity: number;
  occurrence: number;
  detection: number;
  ap: 'H' | 'M' | 'L';
}

interface APResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: 5 | 6; // 5단계 또는 6단계
  data: APResultItem[];
}

// AP 등급별 색상
const AP_COLORS: Record<'H' | 'M' | 'L', { bg: string; text: string; label: string }> = {
  H: { bg: '#f87171', text: '#7f1d1d', label: 'High' },
  M: { bg: '#fde047', text: '#713f12', label: 'Medium' },
  L: { bg: '#86efac', text: '#14532d', label: 'Low' },
};

export default function APResultModal({ isOpen, onClose, stage, data }: APResultModalProps) {
  if (!isOpen) return null;

  // AP 개수 계산
  const hCount = data.filter(d => d.ap === 'H').length;
  const mCount = data.filter(d => d.ap === 'M').length;
  const lCount = data.filter(d => d.ap === 'L').length;
  const totalCount = data.length;

  // AP별 그룹핑
  const hItems = data.filter(d => d.ap === 'H');
  const mItems = data.filter(d => d.ap === 'M');
  const lItems = data.filter(d => d.ap === 'L');

  const stageLabel = stage === 5 ? '리스크분석 (5단계)' : '최적화 (6단계)';
  const stageColor = stage === 5 ? '#e53935' : '#ff9800';

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
          maxWidth: '900px',
          width: '95%',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            background: stageColor,
            color: '#fff',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '14px' }}>📊 {stage}AP 결과 - {stageLabel}</span>
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

        {/* 통계 요약 */}
        <div style={{ padding: '16px', background: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '50px', height: '36px', background: AP_COLORS.H.bg, borderRadius: '6px', 
              border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, fontSize: '16px', color: AP_COLORS.H.text 
            }}>
              {hCount}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: AP_COLORS.H.text }}>High (즉시 조치)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '50px', height: '36px', background: AP_COLORS.M.bg, borderRadius: '6px', 
              border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, fontSize: '16px', color: AP_COLORS.M.text 
            }}>
              {mCount}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: AP_COLORS.M.text }}>Medium (권고)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '50px', height: '36px', background: AP_COLORS.L.bg, borderRadius: '6px', 
              border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, fontSize: '16px', color: AP_COLORS.L.text 
            }}>
              {lCount}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: AP_COLORS.L.text }}>Low (유지)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '16px', paddingLeft: '16px', borderLeft: '2px solid #ccc' }}>
            <div style={{ 
              width: '50px', height: '36px', background: '#e0e0e0', borderRadius: '6px', 
              border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, fontSize: '16px', color: '#333' 
            }}>
              {totalCount}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#333' }}>Total</span>
          </div>
        </div>

        {/* 상세 테이블 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
              <div>AP 결과 데이터가 없습니다.</div>
              <div style={{ fontSize: '11px', marginTop: '8px' }}>리스크분석(5단계)을 먼저 진행해주세요.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr>
                  <th style={{ background: '#1e3a5f', color: '#fff', padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>AP</th>
                  <th style={{ background: '#1e3a5f', color: '#fff', padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>공정명</th>
                  <th style={{ background: '#1e3a5f', color: '#fff', padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>고장형태(FM)</th>
                  <th style={{ background: '#1e3a5f', color: '#fff', padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>고장원인(FC)</th>
                  <th style={{ background: '#1e3a5f', color: '#fff', padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 700, width: '50px' }}>S</th>
                  <th style={{ background: '#1e3a5f', color: '#fff', padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 700, width: '50px' }}>O</th>
                  <th style={{ background: '#1e3a5f', color: '#fff', padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 700, width: '50px' }}>D</th>
                </tr>
              </thead>
              <tbody>
                {/* High 항목 */}
                {hItems.map((item, idx) => (
                  <tr key={`h-${idx}`}>
                    <td style={{ background: AP_COLORS.H.bg, color: AP_COLORS.H.text, padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>H</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.processName}</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.failureMode}</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.failureCause}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700, color: item.severity >= 8 ? '#c62828' : '#333' }}>{item.severity}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>{item.occurrence}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>{item.detection}</td>
                  </tr>
                ))}
                {/* Medium 항목 */}
                {mItems.map((item, idx) => (
                  <tr key={`m-${idx}`}>
                    <td style={{ background: AP_COLORS.M.bg, color: AP_COLORS.M.text, padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>M</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.processName}</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.failureMode}</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.failureCause}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>{item.severity}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>{item.occurrence}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>{item.detection}</td>
                  </tr>
                ))}
                {/* Low 항목 */}
                {lItems.map((item, idx) => (
                  <tr key={`l-${idx}`}>
                    <td style={{ background: AP_COLORS.L.bg, color: AP_COLORS.L.text, padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>L</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.processName}</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.failureMode}</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>{item.failureCause}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>{item.severity}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>{item.occurrence}</td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>{item.detection}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

