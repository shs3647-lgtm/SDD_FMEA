/**
 * @file SpecialCharSelectModal.tsx
 * @description 특별특성 선택 전용 모달 - 고객사별 특별특성 기호 선택
 */

'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

// 특별특성 데이터 타입
interface SpecialCharItem {
  id: string;
  customer: string;      // 고객사 (현대/기아, BMW, FORD 등)
  symbol: string;        // 고객기호 (IC, CC, BM-F 등)
  notation: string;      // 자사표기 (SC, FF)
  meaning: string;       // 의미
  icon?: string;         // 아이콘/그림
  color: string;         // 배지 색상
}

// 특별특성 마스터 데이터
const SPECIAL_CHAR_DATA: SpecialCharItem[] = [
  // 현대/기아
  { id: 'HK_IC', customer: '현대/기아', symbol: 'IC', notation: 'SC', meaning: '중요 (Important Characteristic)', icon: '◆', color: '#e53935' },
  { id: 'HK_CC', customer: '현대/기아', symbol: 'CC', notation: 'SC', meaning: '핵심 (Critical Characteristic)', icon: '★', color: '#d32f2f' },
  
  // BMW
  { id: 'BMW_F', customer: 'BMW', symbol: 'BM-F', notation: 'SC', meaning: '안전자 건강 (Safety/Health)', icon: '▲', color: '#ff9800' },
  { id: 'BMW_C', customer: 'BMW', symbol: 'BM-C', notation: 'SC', meaning: '핵심 (Critical)', icon: '●', color: '#f57c00' },
  { id: 'BMW_S', customer: 'BMW', symbol: 'BM-S', notation: 'SC', meaning: '안전자 안전 (Safety)', icon: '◆', color: '#ef6c00' },
  { id: 'BMW_L', customer: 'BMW', symbol: 'BM-L', notation: 'SC', meaning: '법규 (Legal)', icon: '■', color: '#e65100' },
  { id: 'BMW_E', customer: 'BMW', symbol: 'BM-E', notation: 'FF', meaning: '환경적 영향 (Environmental)', icon: '○', color: '#4caf50' },
  
  // FORD
  { id: 'FORD_CC', customer: 'FORD', symbol: 'CC', notation: 'SC', meaning: '핵심 특성 (Critical Characteristic)', icon: '◆', color: '#1976d2' },
  { id: 'FORD_OS', customer: 'FORD', symbol: 'OS', notation: 'SC', meaning: '작업자 안전 (Operator Safety)', icon: '▲', color: '#1565c0' },
  { id: 'FORD_YC', customer: 'FORD', symbol: 'YC', notation: 'SC', meaning: '규제 관련 (Regulatory)', icon: '●', color: '#0d47a1' },
  { id: 'FORD_SC', customer: 'FORD', symbol: 'SC', notation: 'SC', meaning: '품질 영향 (Significant)', icon: '■', color: '#2196f3' },
  { id: 'FORD_HI', customer: 'FORD', symbol: 'HI', notation: 'SC', meaning: '유해 환경 (Hazardous)', icon: '◇', color: '#42a5f5' },
  { id: 'FORD_YS', customer: 'FORD', symbol: 'YS', notation: 'FF', meaning: '법규 (Legal)', icon: '○', color: '#4caf50' },
  
  // GM
  { id: 'GM_D', customer: 'GM', symbol: 'D', notation: 'SC', meaning: '다이아몬드 (Diamond)', icon: '◆', color: '#9c27b0' },
  { id: 'GM_S', customer: 'GM', symbol: 'S', notation: 'SC', meaning: '쉴드 (Shield)', icon: '▼', color: '#7b1fa2' },
  
  // 기타/공통
  { id: 'COMMON_NONE', customer: '공통', symbol: '-', notation: '-', meaning: '해당없음', icon: '', color: '#9e9e9e' },
];

interface SpecialCharSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string, item: SpecialCharItem) => void;
  currentValue?: string;
  productCharName?: string;
}

export default function SpecialCharSelectModal({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  productCharName,
}: SpecialCharSelectModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('전체');
  const [search, setSearch] = useState('');

  // 고객사 목록
  const customers = useMemo(() => {
    const unique = [...new Set(SPECIAL_CHAR_DATA.map(d => d.customer))];
    return ['전체', ...unique];
  }, []);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let data = SPECIAL_CHAR_DATA;
    
    if (selectedCustomer !== '전체') {
      data = data.filter(d => d.customer === selectedCustomer);
    }
    
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(d => 
        d.symbol.toLowerCase().includes(q) ||
        d.meaning.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q)
      );
    }
    
    return data;
  }, [selectedCustomer, search]);

  // 고객사별 그룹핑
  const groupedData = useMemo(() => {
    const groups: Record<string, SpecialCharItem[]> = {};
    filteredData.forEach(item => {
      if (!groups[item.customer]) groups[item.customer] = [];
      groups[item.customer].push(item);
    });
    return groups;
  }, [filteredData]);

  if (!isOpen) return null;

  const handleSelect = (item: SpecialCharItem) => {
    onSelect(item.symbol, item);
    onClose();
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ 
          background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)', 
          padding: '16px 20px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>★ 특별특성 선택</h3>
              {productCharName && (
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
                  제품특성: {productCharName}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* 필터 영역 */}
        <div style={{ 
          padding: '12px 16px', 
          background: '#fafafa', 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          {/* 고객사 필터 */}
          <select
            value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '12px',
              minWidth: '120px',
            }}
          >
            {customers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* 검색 */}
          <input
            type="text"
            placeholder="기호 또는 의미 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
        </div>

        {/* 현재 선택 표시 */}
        {currentValue && (
          <div style={{ 
            padding: '8px 16px', 
            background: '#fff3e0', 
            borderBottom: '1px solid #ffe0b2',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: '#e65100' }}>현재 선택:</span>
            <span style={{ fontWeight: 700 }}>{currentValue}</span>
            <button
              onClick={() => { onSelect('', { id: '', customer: '', symbol: '', notation: '', meaning: '', color: '' }); onClose(); }}
              style={{
                marginLeft: 'auto',
                background: '#ffccbc',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                color: '#bf360c',
              }}
            >
              선택 해제
            </button>
          </div>
        )}

        {/* 콘텐츠 영역 */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '16px',
        }}>
          {Object.entries(groupedData).map(([customer, items]) => (
            <div key={customer} style={{ marginBottom: '16px' }}>
              {/* 고객사 헤더 */}
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#666',
                padding: '6px 12px',
                background: '#f5f5f5',
                borderRadius: '4px',
                marginBottom: '8px',
              }}>
                🏢 {customer}
              </div>

              {/* 특별특성 그리드 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}>
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      border: currentValue === item.symbol ? `2px solid ${item.color}` : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: currentValue === item.symbol ? `${item.color}10` : 'white',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${item.color}15`;
                      (e.currentTarget as HTMLElement).style.borderColor = item.color;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = currentValue === item.symbol ? `${item.color}10` : 'white';
                      (e.currentTarget as HTMLElement).style.borderColor = currentValue === item.symbol ? item.color : '#e0e0e0';
                    }}
                  >
                    {/* 아이콘 배지 */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: item.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {item.icon || item.symbol.charAt(0)}
                    </div>

                    {/* 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <span>{item.symbol}</span>
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '1px 6px', 
                          background: item.notation === 'SC' ? '#ffebee' : '#e8f5e9',
                          color: item.notation === 'SC' ? '#c62828' : '#2e7d32',
                          borderRadius: '3px',
                        }}>
                          {item.notation}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#666',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.meaning}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '12px 16px',
          background: '#f5f5f5',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#666' }}>
            SC: Safety/Critical | FF: Fit/Function
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

// 특별특성 데이터 export (다른 컴포넌트에서 사용)
export { SPECIAL_CHAR_DATA };
export type { SpecialCharItem };



