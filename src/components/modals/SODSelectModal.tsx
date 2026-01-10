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
    
    // ✅ 기존 localStorage 데이터 강제 삭제 (문제 해결을 위해)
    const savedData = localStorage.getItem('sod_master_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // ✅ 기존 데이터가 있더라도 항상 새로운 기본 데이터로 초기화
        console.log('[SODSelectModal] 기존 localStorage 데이터 삭제 후 새 데이터 초기화');
        localStorage.removeItem('sod_master_data');
        initializeDefaultSODData();
      } catch (e) {
        console.error('[SODSelectModal] localStorage 파싱 오류:', e);
        localStorage.removeItem('sod_master_data');
        initializeDefaultSODData();
      }
    } else {
      initializeDefaultSODData();
    }
  }, [isOpen]);

  const initializeDefaultSODData = () => {
    const uid = () => Math.random().toString(36).substr(2, 9);
    
    const PFMEA_SEVERITY = [
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 10, levelKr: '매우 높음', levelEn: 'Very High', 
        yourPlant: '고장으로 제조/조립근로자의 건강 및/또는 안전 리스크 초래 가능 (Failure may result in health and/or safety risk for manufacturing or assembly worker)', 
        shipToPlant: '고장으로 제조/조립근로자의 건강 및/또는 안전 리스크 초래 가능 (Failure may result in health and/or safety risk for manufacturing or assembly worker)', 
        endUser: '차량 및/또는 다른 자동차의 안전운행, 운전자, 승객 또는 도로 사용자나 보행자의 건강에 영향을 미침 (Affects safe operation of the vehicle and/or other vehicles, the health of driver or passenger(s) or road users or pedestrians)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 9, levelKr: '매우 높음', levelEn: 'Very High', 
        yourPlant: '고장이 발생하면 공장내 규제 미준수로 이어질수 있음 (Failure may result in in-plant regulatory non-compliance)', 
        shipToPlant: '고장이 발생하면 공장내 규제 미준수로 이어질수 있음 (Failure may result in in-plant regulatory non-compliance)', 
        endUser: '규제사항 미준수 (Noncompliance with regulations)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 8, levelKr: '높음', levelEn: 'High', 
        yourPlant: '영향을 받은 생산제품의 100%가 폐기될 수 있음 (100% of production run affected may have to be scrapped)', 
        shipToPlant: '1 Shift 이상 라인중단; 출하중단 가능 (Line shutdown greater than full production shift)', 
        endUser: '기대되는 사용수명기간 동안 정상 주행에 필요한 자동차 주요 기능의 상실 (Loss of primary vehicle function necessary for normal driving during expected service life)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 7, levelKr: '높음', levelEn: 'High', 
        yourPlant: '① 제품을 선별하고 일부 폐기 할 수도 있음 ② 공정에서 기준이탈; 라인속도저하, 인력추가필요 (Product may have to be sorted and portion scrapped; deviation from primary process; decreased line speed or added manpower)', 
        shipToPlant: '1시간~1shift 라인중단; 출하중단 가능; 규정 미준수이외에 필드수리/교체 (Line shutdown from 1 hour up to full production shift; stop shipment possible)', 
        endUser: '기대되는 사용수명기간 동안 정상 주행에 필요한 자동차 주요 기능의 저하 (Degradation of primary vehicle function necessary for normal driving during expected service life)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 6, levelKr: '중간', levelEn: 'Moderate', 
        yourPlant: '100% 라인 밖에서 재작업 및 승인 (100% of production run may have to be reworked off line and accepted)', 
        shipToPlant: '최대 1시간 까지 라인 중단 (Impact to Ship-to-Plant when known)', 
        endUser: '자동차 보조 기능 상실 (Loss of secondary vehicle function)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 5, levelKr: '중간', levelEn: 'Moderate', 
        yourPlant: '일부 제품을 라인밖에서 재작업 및 승인 (A portion of the production run may have to be reworked offline and accepted)', 
        shipToPlant: '영향을 받은 제품 100%미만; 추가적인 제품결함 가능성; 선별필요; 라인중단 없음 (Less than 100% of product affected; strong possibility for additional defective product; sort required; no line shutdown)', 
        endUser: '매우 좋지않은 외관, 소리, 진동, 거친소리 또는 촉각 (Very objectionable appearance, sound, vibration, harshness, or haptics)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 4, levelKr: '낮음', levelEn: 'Low', 
        yourPlant: '100% 스테이션에서 재작업 (100% of production run may have to be reworked in station before it is processed)', 
        shipToPlant: '영향을 받은 제품 100%미만; 선별필요; 라인중단 없음 (Less than 100% of product affected; sort required; no line shutdown)', 
        endUser: '좋지않은 외관, 소리, 진동, 거친소리 또는 촉각 (Objectionable appearance, sound, vibration, harshness, or haptics)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 3, levelKr: '낮음', levelEn: 'Low', 
        yourPlant: '일부 제품을 스테이션내 에서 재작업 (A portion of the production run may have to be reworked in-station before it is processed)', 
        shipToPlant: '선별이 필요할 수도 있고 그렇지 않을 수도 있음; 라인중단 없음 (Sort may or may not be required; no line shutdown)', 
        endUser: '외관, 소리, 진동, 거친소리 또는 촉각에 대해 매우 미세한 고객 불만 (Very slight customer annoyance with appearance, sound, vibration, harshness, or haptics)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 2, levelKr: '매우 낮음', levelEn: 'Very Low', 
        yourPlant: '재작업이 필요하지 않음; 고객 불만 없음 (No rework required; no customer complaint)', 
        shipToPlant: '선별 및 재작업 불필요; 라인중단 없음; 고객 불만 없음 (No sort or rework required; no line shutdown; no customer complaint)', 
        endUser: '외관, 소리, 진동, 거친소리 또는 촉각에 대해 미세한 고객 불만 (Slight customer annoyance with appearance, sound, vibration, harshness, or haptics)' },
      { fmeaType: 'P-FMEA' as const, category: 'S' as const, rating: 1, levelKr: '없음', levelEn: 'None', 
        yourPlant: '영향 없음 (No effect)', 
        shipToPlant: '영향 없음 (No effect)', 
        endUser: '영향 없음 (No effect)' },
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

  // ✅ 디버깅: scope 값 확인 (강화)
  useEffect(() => {
    if (isOpen) {
      console.log('[SODSelectModal] 모달 열림:', { 
        scope, 
        category, 
        fmeaType, 
        currentValue,
        scopeType: typeof scope,
        scopeValue: scope === 'Your Plant' ? 'YP' : scope === 'Ship to Plant' ? 'SP' : scope === 'User' ? 'User' : '없음'
      });
      
      // ✅ scope가 없으면 경고
      if (!scope) {
        console.warn('[SODSelectModal] ⚠️ scope가 전달되지 않았습니다!');
      }
    }
  }, [isOpen, scope, category, fmeaType, currentValue ?? undefined]);

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
              {scope === 'Your Plant' ? 'YOUR PLANT 심각도 기준' : 
               scope === 'Ship to Plant' ? 'SHIP TO PLANT 심각도 기준' : 
               scope === 'User' ? 'USER 심각도 기준' : 
               `${categoryLabels[category].full} 선택`}
            </h3>
            <p className="mt-1 mb-0 text-[11px] opacity-90">
              {fmeaType} | 현재 값: {currentValue ?? '미선택'}
              {scope && ` | 구분: ${scope === 'Your Plant' ? 'YP (Your Plant)' : scope === 'Ship to Plant' ? 'SP (Ship to Plant)' : 'User'}`}
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
                    {scope === 'Your Plant' ? 'YOUR PLANT 심각도 기준' : 
                     scope === 'Ship to Plant' ? 'SHIP TO PLANT 심각도 기준' : 
                     scope === 'User' ? 'USER 심각도 기준' : 
                     '설명'}
                    <br/><span className="text-[9px] opacity-80">
                      {scope === 'Your Plant' ? 'Your Plant Severity Criteria' : 
                       scope === 'Ship to Plant' ? 'Ship to Plant Severity Criteria' : 
                       scope === 'User' ? 'User Severity Criteria' : 
                       'Description'}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isSelected = currentValue === item.rating;
                  // ✅ scope에 따라 올바른 필드 선택 (명시적 체크)
                  let content: string | undefined = '';
                  if (category === 'S') {
                    // ✅ scope 값 명시적 비교 (대소문자 구분)
                    if (scope === 'Your Plant') {
                      content = item.yourPlant;
                    } else if (scope === 'Ship to Plant') {
                      content = item.shipToPlant;
                      // ✅ shipToPlant가 없으면 명시적으로 확인
                      if (!content) {
                        console.warn('[SODSelectModal] shipToPlant 필드가 비어있습니다. item:', item);
                        content = item.yourPlant || item.endUser || item.description;
                      }
                    } else if (scope === 'User') {
                      content = item.endUser;
                    } else {
                      // scope가 없으면 기본값
                      console.warn('[SODSelectModal] scope가 정의되지 않았습니다. scope:', scope);
                      content = item.yourPlant || item.endUser || item.description;
                    }
                  } else {
                    content = item.criteria || item.description;
                  }
                  
                  // ✅ 디버깅: scope와 content 확인 (첫 번째 항목과 rating 8)
                  if (isOpen && scope && category === 'S' && (item.rating === 10 || item.rating === 8)) {
                    console.log('[SODSelectModal] rating', item.rating, ':', { 
                      scope, 
                      yourPlant: item.yourPlant?.substring(0, 50), 
                      shipToPlant: item.shipToPlant?.substring(0, 50), 
                      endUser: item.endUser?.substring(0, 50), 
                      selectedContent: content?.substring(0, 50) 
                    });
                  }
                  
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
