/**
 * @file SODSelectModal.tsx
 * @description SOD(심각도/발생도/검출도) 선택 모달
 * 고장분석에서 심각도 등 선택 시 사용
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface SODItem {
  id: string;
  fmeaType: 'P-FMEA' | 'D-FMEA';
  category: 'S' | 'O' | 'D';
  rating: number;
  levelKr: string;
  levelEn: string;
  yourPlant?: string;
  shipToPlant?: string;
  endUser?: string;
  description?: string;
  criteria?: string;
}

interface SODSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (rating: number, item: SODItem) => void;
  category: 'S' | 'O' | 'D';
  fmeaType?: 'P-FMEA' | 'D-FMEA';
  currentValue?: number;
}

export default function SODSelectModal({
  isOpen,
  onClose,
  onSelect,
  category,
  fmeaType = 'P-FMEA',
  currentValue
}: SODSelectModalProps) {
  const [items, setItems] = useState<SODItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const savedData = localStorage.getItem('sod_master_data');
    if (savedData) {
      setItems(JSON.parse(savedData));
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.fmeaType === fmeaType && item.category === category)
      .sort((a, b) => b.rating - a.rating);
  }, [items, fmeaType, category]);

  const categoryLabels = {
    S: { kr: '심각도', en: 'Severity', color: '#c62828', full: '심각도(Severity)' },
    O: { kr: '발생도', en: 'Occurrence', color: '#1565c0', full: '발생도(Occurrence)' },
    D: { kr: '검출도', en: 'Detection', color: '#2e7d32', full: '검출도(Detection)' },
  };

  const handleSelect = (item: SODItem) => {
    onSelect(item.rating, item);
    onClose();
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '12px', width: '600px', maxWidth: '95%',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          background: categoryLabels[category].color,
          color: 'white', padding: '16px 20px', borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              {categoryLabels[category].full} 선택 (Select {categoryLabels[category].en})
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.9 }}>
              {fmeaType} | 현재 값(Current): {currentValue ?? '미선택(Not Selected)'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>

        {/* 테이블 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>등록된 {categoryLabels[category].full} 기준이 없습니다.</p>
              <p style={{ fontSize: '12px' }}>No {categoryLabels[category].en} criteria registered.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>메뉴바의 '📊SOD' 버튼에서 등록해주세요.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', border: currentValue === item.rating ? `2px solid ${categoryLabels[category].color}` : '1px solid #e0e0e0',
                    borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                    background: currentValue === item.rating ? '#e3f2fd' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* 등급 뱃지 */}
                  <div style={{
                    minWidth: '40px', height: '40px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '18px',
                    background: item.rating >= 8 ? '#ffcdd2' : item.rating >= 5 ? '#fff9c4' : '#c8e6c9',
                    color: item.rating >= 8 ? '#c62828' : item.rating >= 5 ? '#f57f17' : '#2e7d32'
                  }}>
                    {item.rating}
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>
                      {item.levelKr} ({item.levelEn})
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {category === 'S' 
                        ? item.endUser || item.yourPlant 
                        : item.criteria || item.description}
                    </div>
                  </div>

                  {/* 선택 표시 */}
                  {currentValue === item.rating && (
                    <div style={{ color: categoryLabels[category].color, fontSize: '18px' }}>✓</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', background: '#f5f5f5', borderRadius: '0 0 12px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>
              {filteredItems.length}개 항목 ({filteredItems.length} items)
            </span>
            <button
              onClick={onClose}
              style={{ padding: '6px 16px', background: '#757575', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
            >
              취소 (Cancel)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

