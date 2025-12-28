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
  scope?: 'Your Plant' | 'Ship to Plant' | 'User'; // 구분에 따른 심각도 필터
}

export default function SODSelectModal({
  isOpen,
  onClose,
  onSelect,
  category,
  fmeaType = 'P-FMEA',
  currentValue,
  scope
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
          background: 'white', borderRadius: '12px', width: '800px', maxWidth: '95%',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          background: scope === 'Your Plant' ? '#1976d2' : scope === 'Ship to Plant' ? '#e65100' : scope === 'User' ? '#7b1fa2' : categoryLabels[category].color,
          color: 'white', padding: '16px 20px', borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              {scope ? `${scope} ` : ''}{categoryLabels[category].full} 선택
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.9 }}>
              {fmeaType} | 현재 값: {currentValue ?? '미선택'}
              {scope && ` | 구분: ${scope}`}
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
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>등록된 {categoryLabels[category].full} 기준이 없습니다.</p>
              <p style={{ fontSize: '12px' }}>No {categoryLabels[category].en} criteria registered.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>메뉴바의'📊SOD' 버튼에서 등록해주세요.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#c62828', color: 'white' }}>
                  <th style={{ padding: '8px 6px', border: '1px solid #b71c1c', width: '45px' }}>등급<br/><span style={{ fontSize: '9px', opacity: 0.8 }}>Rating</span></th>
                  <th style={{ padding: '8px 6px', border: '1px solid #b71c1c', width: '70px' }}>레벨(한글)<br/><span style={{ fontSize: '9px', opacity: 0.8 }}>Level(KR)</span></th>
                  <th style={{ padding: '8px 6px', border: '1px solid #b71c1c', width: '70px' }}>레벨(영문)<br/><span style={{ fontSize: '9px', opacity: 0.8 }}>Level(EN)</span></th>
                  <th style={{ padding: '8px 6px', border: '1px solid #b71c1c' }}>
                    {scope === 'Your Plant' ? '귀사의 공장에 미치는 영향' : scope === 'Ship to Plant' ? '고객사(Ship to Plant)에 미치는 영향' : scope === 'User' ? '최종사용자(End User)에게 미치는 영향' : '설명'}
                    <br/><span style={{ fontSize: '9px', opacity: 0.8 }}>{scope === 'Your Plant' ? 'Impact to Your Plant' : scope === 'Ship to Plant' ? 'Impact to Ship to Plant' : scope === 'User' ? 'Impact to End User' : 'Description'}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const bgColor = item.rating >= 9 ? '#ef5350' : item.rating >= 7 ? '#ffab91' : item.rating >= 5 ? '#fff59d' : '#c8e6c9';
                  const textColor = item.rating >= 9 ? '#fff' : '#333';
                  const content = category === 'S' 
                    ? (scope === 'Your Plant' ? item.yourPlant : scope === 'Ship to Plant' ? item.shipToPlant : scope === 'User' ? item.endUser : item.yourPlant || item.endUser || item.description)
                    : item.criteria || item.description;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleSelect(item)}
                      style={{ 
                        background: currentValue === item.rating ? '#bbdefb' : bgColor, 
                        cursor: 'pointer',
                        borderLeft: currentValue === item.rating ? '4px solid #1976d2' : 'none'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    >
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 700, fontSize: '14px', color: textColor }}>{item.rating}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', color: textColor }}>{item.levelKr}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', color: textColor }}>{item.levelEn}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', color: textColor, lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 500 }}>{content}</div>
                        {category === 'S' && content && (
                          <div style={{ fontSize: '10px', color: item.rating >= 9 ? 'rgba(255,255,255,0.8)' : '#666', marginTop: '3px', fontStyle: 'italic' }}>
                            {scope === 'Your Plant' && item.shipToPlant && `(고객사: ${item.shipToPlant?.slice(0, 30)}...)`}
                            {scope === 'Ship to Plant' && item.yourPlant && `(귀사: ${item.yourPlant?.slice(0, 30)}...)`}
                            {scope === 'User' && item.yourPlant && `(귀사: ${item.yourPlant?.slice(0, 30)}...)`}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

