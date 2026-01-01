/**
 * @file SODSelectModal.tsx
 * @description SOD(심각도/발생도/검출도) 선택 모달
 * 
 * @version 2.0.0 - 인라인 스타일 제거, Tailwind CSS 적용
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
  scope?: 'Your Plant' | 'Ship to Plant' | 'User';
}

/** 공통 스타일 */
const tw = {
  overlay: 'fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center',
  modal: 'bg-white rounded-xl w-[800px] max-w-[95%] max-h-[80vh] flex flex-col shadow-2xl',
  header: 'text-white py-4 px-5 rounded-t-xl flex justify-between items-center',
  closeBtn: 'bg-white/20 border-none text-white w-7 h-7 rounded cursor-pointer text-base hover:bg-white/30',
  content: 'flex-1 overflow-auto p-3',
  table: 'w-full border-collapse text-[11px]',
  th: 'py-2 px-1.5 border border-red-900 text-center',
  td: 'py-2 px-1.5 border border-gray-300 cursor-pointer',
  footer: 'p-3 border-t border-gray-200 bg-gray-100 rounded-b-xl flex justify-between items-center',
  cancelBtn: 'py-1.5 px-4 bg-gray-500 text-white border-none rounded text-xs cursor-pointer hover:bg-gray-600',
  empty: 'text-center py-10 text-gray-500',
};

/** 카테고리별 색상 */
const categoryColors = {
  S: { bg: 'bg-red-700', color: '#c62828' },
  O: { bg: 'bg-blue-700', color: '#1565c0' },
  D: { bg: 'bg-green-700', color: '#2e7d32' },
};

/** 등급별 배경색 클래스 */
const getRatingBg = (rating: number): string => {
  if (rating >= 9) return 'bg-red-400 text-white';
  if (rating >= 7) return 'bg-orange-200';
  if (rating >= 5) return 'bg-yellow-200';
  return 'bg-green-200';
};

export default function SODSelectModal({
  isOpen, onClose, onSelect, category, fmeaType = 'P-FMEA', currentValue, scope
}: SODSelectModalProps) {
  const [items, setItems] = useState<SODItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    const savedData = localStorage.getItem('sod_master_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (!parsed || parsed.length === 0) {
        initializeDefaultSODData();
      } else {
        setItems(parsed);
      }
    } else {
      initializeDefaultSODData();
    }
  }, [isOpen]);

  const initializeDefaultSODData = () => {
    const uid = () => Math.random().toString(36).substr(2, 9);
    
    const PFMEA_SEVERITY = [
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 10, levelKr: '매우 높음', levelEn: 'Very High', yourPlant: '건강/안전 위험', shipToPlant: '건강/안전 위험', endUser: '안전운행 영향' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 9, levelKr: '매우 높음', levelEn: 'Very High', yourPlant: '규제 미준수', shipToPlant: '규제 미준수', endUser: '규제사항 미준수' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 8, levelKr: '높음', levelEn: 'High', yourPlant: '100% 폐기', shipToPlant: '1 Shift 이상 라인중단', endUser: '주요 기능 상실' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 7, levelKr: '높음', levelEn: 'High', yourPlant: '선별 및 일부 폐기', shipToPlant: '1시간~1shift 라인중단', endUser: '주요 기능 저하' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 6, levelKr: '중간', levelEn: 'Moderate', yourPlant: '라인 외 재작업', shipToPlant: '최대 1시간 라인중단', endUser: '보조 기능 상실' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 5, levelKr: '중간', levelEn: 'Moderate', yourPlant: '라인 내 재작업', shipToPlant: '30분 미만 라인중단', endUser: '보조 기능 저하' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 4, levelKr: '낮음', levelEn: 'Low', yourPlant: '선별 작업', shipToPlant: '생산성 감소', endUser: '외관/소음 불만족' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 3, levelKr: '낮음', levelEn: 'Low', yourPlant: '약간의 불편', shipToPlant: '약간의 불편', endUser: '대부분 인지 안됨' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 2, levelKr: '매우 낮음', levelEn: 'Very Low', yourPlant: '거의 인지 안됨', shipToPlant: '거의 인지 안됨', endUser: '거의 인지 안됨' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 1, levelKr: '없음', levelEn: 'None', yourPlant: '영향 없음', shipToPlant: '영향 없음', endUser: '영향 없음' },
    ];
    
    const PFMEA_OCCURRENCE = [
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 10, levelKr: '매우 높음', levelEn: 'Very High', criteria: '≥100/1000개', description: '예방관리 없음' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 9, levelKr: '매우 높음', levelEn: 'Very High', criteria: '50/1000개', description: '예방관리 거의 없음' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 8, levelKr: '높음', levelEn: 'High', criteria: '20/1000개', description: '예방관리 미흡' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 7, levelKr: '높음', levelEn: 'High', criteria: '10/1000개', description: '예방관리 약함' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 6, levelKr: '중간', levelEn: 'Moderate', criteria: '2/1000개', description: '예방관리 보통' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 5, levelKr: '중간', levelEn: 'Moderate', criteria: '0.5/1000개', description: '예방관리 양호' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 4, levelKr: '낮음', levelEn: 'Low', criteria: '0.1/1000개', description: '예방관리 우수' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 3, levelKr: '낮음', levelEn: 'Low', criteria: '0.01/1000개', description: '예방관리 매우 우수' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 2, levelKr: '매우 낮음', levelEn: 'Very Low', criteria: '≤0.001/1000개', description: '고도의 예방관리' },
      { fmeaType: 'P-FMEA' as const, category: 'O' as const, rating: 1, levelKr: '매우 낮음', levelEn: 'Very Low', criteria: '거의 0', description: '실패 불가능' },
    ];
    
    const PFMEA_DETECTION = [
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 10, levelKr: '거의 불가능', levelEn: 'Almost Impossible', criteria: '검출 불가', description: '검출관리 없음' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 9, levelKr: '매우 어려움', levelEn: 'Very Remote', criteria: '검출 매우 어려움', description: '간접 검증' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 8, levelKr: '어려움', levelEn: 'Remote', criteria: '검출 어려움', description: '육안 검사' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 7, levelKr: '매우 낮음', levelEn: 'Very Low', criteria: '검출 매우 낮음', description: '이중 육안 검사' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 6, levelKr: '낮음', levelEn: 'Low', criteria: '검출 낮음', description: '게이지/SPC' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 5, levelKr: '보통', levelEn: 'Moderate', criteria: '검출 보통', description: '자동 검사' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 4, levelKr: '다소 높음', levelEn: 'Moderately High', criteria: '검출 다소 높음', description: '복수 검사' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 3, levelKr: '높음', levelEn: 'High', criteria: '검출 높음', description: '자동 차단' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 2, levelKr: '매우 높음', levelEn: 'Very High', criteria: '검출 매우 높음', description: '에러 프루프' },
      { fmeaType: 'P-FMEA' as const, category: 'D' as const, rating: 1, levelKr: '거의 확실', levelEn: 'Almost Certain', criteria: '검출 거의 확실', description: '실패 방지 설계' },
    ];
    
    const defaultItems: SODItem[] = [
      ...PFMEA_SEVERITY.map(item => ({ ...item, id: uid() })),
      ...PFMEA_OCCURRENCE.map(item => ({ ...item, id: uid() })),
      ...PFMEA_DETECTION.map(item => ({ ...item, id: uid() })),
    ];
    
    setItems(defaultItems);
    localStorage.setItem('sod_master_data', JSON.stringify(defaultItems));
  };

  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.fmeaType === fmeaType && item.category === category)
      .sort((a, b) => b.rating - a.rating);
  }, [items, fmeaType, category]);

  const categoryLabels = {
    S: { kr: '심각도', en: 'Severity', full: '심각도(Severity)' },
    O: { kr: '발생도', en: 'Occurrence', full: '발생도(Occurrence)' },
    D: { kr: '검출도', en: 'Detection', full: '검출도(Detection)' },
  };

  const handleSelect = (item: SODItem) => {
    onSelect(item.rating, item);
    onClose();
  };

  if (!mounted || !isOpen) return null;

  const headerBg = scope === 'Your Plant' ? 'bg-blue-600' : scope === 'Ship to Plant' ? 'bg-orange-600' : scope === 'User' ? 'bg-purple-700' : categoryColors[category].bg;

  const modalContent = (
    <div className={tw.overlay} onClick={onClose}>
      <div className={tw.modal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={`${tw.header} ${headerBg}`}>
          <div>
            <h3 className="m-0 text-base font-bold">
              {scope ? `${scope} ` : ''}{categoryLabels[category].full} 선택
            </h3>
            <p className="mt-1 mb-0 text-[11px] opacity-90">
              {fmeaType} | 현재 값: {currentValue ?? '미선택'}
              {scope && ` | 구분: ${scope}`}
            </p>
          </div>
          <button onClick={onClose} className={tw.closeBtn}>✕</button>
        </div>

        {/* 테이블 */}
        <div className={tw.content}>
          {filteredItems.length === 0 ? (
            <div className={tw.empty}>
              <p>등록된 {categoryLabels[category].full} 기준이 없습니다.</p>
              <p className="text-xs">No {categoryLabels[category].en} criteria registered.</p>
              <p className="text-xs mt-2">메뉴바의 📊SOD 버튼에서 등록해주세요.</p>
            </div>
          ) : (
            <table className={tw.table}>
              <thead>
                <tr className="bg-red-700 text-white">
                  <th className={`${tw.th} w-[45px]`}>등급<br/><span className="text-[9px] opacity-80">Rating</span></th>
                  <th className={`${tw.th} w-[70px]`}>레벨(한글)<br/><span className="text-[9px] opacity-80">Level(KR)</span></th>
                  <th className={`${tw.th} w-[70px]`}>레벨(영문)<br/><span className="text-[9px] opacity-80">Level(EN)</span></th>
                  <th className={tw.th}>
                    {scope === 'Your Plant' ? '귀사의 공장에 미치는 영향' : scope === 'Ship to Plant' ? '고객사에 미치는 영향' : scope === 'User' ? '최종사용자에게 미치는 영향' : '설명'}
                    <br/><span className="text-[9px] opacity-80">{scope === 'Your Plant' ? 'Impact to Your Plant' : scope === 'Ship to Plant' ? 'Impact to Ship to Plant' : scope === 'User' ? 'Impact to End User' : 'Description'}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isSelected = currentValue === item.rating;
                  const content = category === 'S' 
                    ? (scope === 'Your Plant' ? item.yourPlant : scope === 'Ship to Plant' ? item.shipToPlant : scope === 'User' ? item.endUser : item.yourPlant || item.endUser || item.description)
                    : item.criteria || item.description;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleSelect(item)}
                      className={`${getRatingBg(item.rating)} hover:opacity-80 ${isSelected ? 'border-l-4 border-l-blue-600 bg-blue-100' : ''}`}
                    >
                      <td className={`${tw.td} text-center font-bold text-sm`}>{item.rating}</td>
                      <td className={`${tw.td} text-center`}>{item.levelKr}</td>
                      <td className={`${tw.td} text-center`}>{item.levelEn}</td>
                      <td className={`${tw.td} leading-relaxed`}>
                        <div className="font-medium">{content}</div>
                        {category === 'S' && content && (
                          <div className={`text-[10px] mt-0.5 italic ${item.rating >= 9 ? 'text-white/80' : 'text-gray-600'}`}>
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
        <div className={tw.footer}>
          <span className="text-[11px] text-gray-600">
            {filteredItems.length}개 항목 ({filteredItems.length} items)
          </span>
          <button onClick={onClose} className={tw.cancelBtn}>
            취소 (Cancel)
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
