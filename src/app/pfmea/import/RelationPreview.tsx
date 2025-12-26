/**
 * @file RelationPreview.tsx
 * @description 관계형 DATA 미리보기 컴포넌트
 * @author AI Assistant
 * @created 2025-12-26
 * 
 * A 공정, B 작업요소, C 완제품 탭으로 구분
 * 각 탭 클릭시 해당 데이터 표 형식으로 미리보기
 * 세로 스크롤 (디폴트 20행)
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ImportedFlatData } from './types';

interface RelationPreviewProps {
  data: ImportedFlatData[];
}

// 탭 정의
const TABS = [
  { 
    code: 'A', 
    label: 'A 공정', 
    color: 'blue',
    columns: [
      { code: 'A1', label: '공정번호' },
      { code: 'A2', label: '공정명' },
      { code: 'A3', label: '공정기능' },
      { code: 'A4', label: '제품특성' },
      { code: 'A5', label: '고장형태' },
      { code: 'A6', label: '검출관리' },
    ]
  },
  { 
    code: 'B', 
    label: 'B 작업요소', 
    color: 'green',
    columns: [
      { code: 'A1', label: '공정번호' },
      { code: 'B1', label: '작업요소' },
      { code: 'B2', label: '요소기능' },
      { code: 'B3', label: '공정특성' },
      { code: 'B4', label: '고장원인' },
      { code: 'B5', label: '예방관리' },
    ]
  },
  { 
    code: 'C', 
    label: 'C 완(반)제품', 
    color: 'red',
    columns: [
      { code: 'C1', label: '제품명' },
      { code: 'C2', label: '제품기능' },
      { code: 'C3', label: '요구사항' },
      { code: 'C4', label: '고장영향' },
    ]
  },
];

export default function RelationPreview({ data }: RelationPreviewProps) {
  const [activeTab, setActiveTab] = useState('A');

  // 현재 탭 정보
  const currentTab = TABS.find(t => t.code === activeTab);

  // 공정번호 목록 추출
  const processNos = useMemo(() => {
    const nos = new Set<string>();
    data.filter(d => d.itemCode === 'A1').forEach(d => {
      if (d.processNo) nos.add(d.processNo);
      if (d.value) nos.add(d.value);
    });
    return Array.from(nos).sort();
  }, [data]);

  // 완제품 목록 추출 (C 탭용)
  const productNames = useMemo(() => {
    const names = new Set<string>();
    data.filter(d => d.itemCode === 'C1').forEach(d => {
      if (d.value) names.add(d.value);
    });
    return Array.from(names);
  }, [data]);

  // 특정 공정번호의 특정 항목 값 가져오기
  const getValue = (processNo: string, itemCode: string) => {
    const item = data.find(d => d.processNo === processNo && d.itemCode === itemCode);
    return item?.value || '';
  };

  // C 탭용: 특정 제품명의 특정 항목 값 가져오기
  const getProductValue = (productName: string, itemCode: string) => {
    if (itemCode === 'C1') return productName;
    const item = data.find(d => {
      const c1Item = data.find(c => c.itemCode === 'C1' && c.value === productName);
      return d.itemCode === itemCode && c1Item;
    });
    return item?.value || '';
  };

  // 탭 색상
  const getTabColor = (tab: typeof TABS[number]) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      blue: { active: 'bg-blue-600 text-white', inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
      green: { active: 'bg-green-600 text-white', inactive: 'bg-green-50 text-green-700 hover:bg-green-100' },
      red: { active: 'bg-red-600 text-white', inactive: 'bg-red-50 text-red-700 hover:bg-red-100' },
    };
    return activeTab === tab.code ? colors[tab.color].active : colors[tab.color].inactive;
  };

  // 데이터 개수
  const getTabCount = (tabCode: string) => {
    return data.filter(d => d.itemCode.startsWith(tabCode)).length;
  };

  return (
    <div className="bg-white rounded-lg" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      {/* 탭 헤더 */}
      <div className="flex border-b">
        {TABS.map((tab) => {
          const count = getTabCount(tab.code);
          return (
            <button
              key={tab.code}
              onClick={() => setActiveTab(tab.code)}
              className={`flex-1 px-4 py-3 font-bold text-sm transition-colors ${getTabColor(tab)}`}
            >
              {tab.label}
              {count > 0 && (
                <Badge className="ml-2 text-xs bg-white/30">{count}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* 테이블 */}
      <div className="overflow-auto" style={{ maxHeight: '500px' }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead className="sticky top-0">
            <tr>
              {currentTab?.columns.map((col) => (
                <th 
                  key={col.code}
                  className="bg-[#00587a] text-white font-bold px-3 py-2 text-center whitespace-nowrap"
                  style={{ border: '1px solid #999' }}
                >
                  {col.code}.{col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeTab === 'C' ? (
              // C 탭: 제품명 기준
              productNames.length === 0 ? (
                <tr>
                  <td colSpan={currentTab?.columns.length || 4} className="text-center py-8 text-gray-500">
                    C 레벨 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                productNames.map((productName, idx) => (
                  <tr key={productName} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                    {currentTab?.columns.map((col) => (
                      <td 
                        key={col.code}
                        className="px-3 py-2 text-center"
                        style={{ border: '1px solid #ddd' }}
                      >
                        {col.code === 'C1' ? productName : getProductValue(productName, col.code) || '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )
            ) : (
              // A, B 탭: 공정번호 기준
              processNos.length === 0 ? (
                <tr>
                  <td colSpan={currentTab?.columns.length || 6} className="text-center py-8 text-gray-500">
                    {activeTab} 레벨 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                processNos.map((processNo, idx) => (
                  <tr key={processNo} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                    {currentTab?.columns.map((col) => (
                      <td 
                        key={col.code}
                        className={`px-3 py-2 ${col.code === 'A1' ? 'text-center font-bold text-[#00587a]' : ''}`}
                        style={{ border: '1px solid #ddd' }}
                      >
                        {col.code === 'A1' ? processNo : getValue(processNo, col.code) || '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {/* 안내 */}
      <div className="p-3 border-t text-xs text-gray-500 text-center">
        세로 스크롤 지원 (디폴트 20행 표시)
      </div>
    </div>
  );
}

