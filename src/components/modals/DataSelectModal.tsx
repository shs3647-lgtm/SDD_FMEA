/**
 * @file DataSelectModal.tsx
 * @description 공용 데이터 선택 모달 - WorkElementSelectModal과 동일한 구조
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';

export const ITEM_CODE_LABELS: Record<string, { label: string; category: string; level: 'L1' | 'L2' | 'L3' }> = {
  C1: { label: '구분', category: 'C', level: 'L1' },
  C2: { label: '완제품 기능', category: 'C', level: 'L1' },
  C3: { label: '요구사항', category: 'C', level: 'L1' },
  C4: { label: '고장영향', category: 'C', level: 'L1' },
  A3: { label: '공정 기능', category: 'A', level: 'L2' },
  A4: { label: '제품특성', category: 'A', level: 'L2' },
  A5: { label: '고장형태', category: 'A', level: 'L2' },
  A6: { label: '검출관리', category: 'A', level: 'L2' },
  B2: { label: '작업요소 기능', category: 'B', level: 'L3' },
  B3: { label: '공정특성', category: 'B', level: 'L3' },
  B4: { label: '고장원인', category: 'B', level: 'L3' },
  B5: { label: '예방관리', category: 'B', level: 'L3' },
  S1: { label: '심각도', category: 'S', level: 'L1' },
};

// 카테고리별 색상
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '기본': { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  '추가': { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
};

export interface DataItem {
  id: string;
  value: string;
  category?: string; // '기본' | '추가'
  belongsTo?: string; // 'Your Plant' | 'Ship to Plant' | 'User' | 'All'
  processNo?: string;
}

interface DataSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedValues: string[]) => void;
  onDelete?: (deletedValues: string[]) => void; // 워크시트 데이터 삭제 콜백
  title: string;
  itemCode: string;
  currentValues: string[];
  processNo?: string;
  singleSelect?: boolean;
}

export default function DataSelectModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  title,
  itemCode,
  currentValues,
  processNo,
  singleSelect = false,
}: DataSelectModalProps) {
  const [items, setItems] = useState<DataItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newValue, setNewValue] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [filterType, setFilterType] = useState<'all' | 'default' | 'added'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const itemInfo = ITEM_CODE_LABELS[itemCode] || { label: itemCode, category: 'A', level: 'L1' };

  // 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    const loadData = () => {
      try {
        let allItems: DataItem[] = [];
        
        // 기본 옵션 정의
        const defaultItems: Record<string, DataItem[]> = {
          C1: [
            { id: 'C1_1', value: 'Your Plant', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C1_2', value: 'Ship to Plant', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C1_3', value: 'User', category: '기본', belongsTo: 'User' },
          ],
          C3: [
            // Your Plant 관련
            { id: 'C3_1', value: '재료 규격 준수', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C3_2', value: '배합비 정확도', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C3_3', value: '공정 파라미터 관리', category: '기본', belongsTo: 'Your Plant' },
            // Ship to Plant 관련
            { id: 'C3_4', value: '규격 치수 유지', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C3_5', value: '외관 품질 확보', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C3_6', value: '포장 상태 유지', category: '기본', belongsTo: 'Ship to Plant' },
            // User 관련
            { id: 'C3_7', value: '내구성 확보', category: '기본', belongsTo: 'User' },
            { id: 'C3_8', value: '안전 기준 충족', category: '기본', belongsTo: 'User' },
            { id: 'C3_9', value: '성능 요건 충족', category: '기본', belongsTo: 'User' },
          ],
          C2: [
            // Your Plant 관련
            { id: 'C2_1', value: '규격에 맞는 재료 투입', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C2_2', value: '배합 일관성 확보', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C2_3', value: '공정 품질 유지', category: '기본', belongsTo: 'Your Plant' },
            // Ship to Plant 관련
            { id: 'C2_4', value: '차량에 적정하게 장착 가능', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C2_5', value: '치수 및 형상 유지', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C2_6', value: '외관 품질 유지', category: '기본', belongsTo: 'Ship to Plant' },
            // User 관련
            { id: 'C2_7', value: '주행 안전성 확보', category: '기본', belongsTo: 'User' },
            { id: 'C2_8', value: '동력전달 기능 수행', category: '기본', belongsTo: 'User' },
            { id: 'C2_9', value: '승차감 제공', category: '기본', belongsTo: 'User' },
          ],
          C4: [
            { id: 'C4_1', value: '차량 정지 (안전 관련)', category: '기본' },
            { id: 'C4_2', value: '차량 주요기능 작동 불능', category: '기본' },
            { id: 'C4_3', value: '차량 성능 저하', category: '기본' },
            { id: 'C4_4', value: '외관 불량', category: '기본' },
            { id: 'C4_5', value: '이음 발생', category: '기본' },
          ],
          S1: Array.from({ length: 10 }, (_, i) => ({
            id: `S1_${i + 1}`,
            value: (10 - i).toString(),
            category: '기본'
          })),
        };
        
        // 기본 옵션 추가
        if (defaultItems[itemCode]) {
          allItems = [...defaultItems[itemCode]];
        }
        
        // localStorage에서 추가 데이터 로드
        const savedData = localStorage.getItem('pfmea_master_data');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          let filteredData = parsedData.filter((item: any) => item.itemCode === itemCode);
          if (processNo) filteredData = filteredData.filter((item: any) => item.processNo === processNo);
          
          filteredData.forEach((item: any, idx: number) => {
            if (item.value && item.value.trim()) {
              const value = item.value.trim();
              // 중복 체크
              if (!allItems.find(i => i.value === value)) {
                allItems.push({
                  id: `${itemCode}_added_${idx}`,
                  value,
                  category: '추가',
                  processNo: item.processNo,
                });
              }
            }
          });
        }
        
        // 현재 워크시트에 있는 값들도 목록에 추가 (삭제 가능하도록)
        currentValues.forEach((val, idx) => {
          if (val && val.trim() && !allItems.find(i => i.value === val)) {
            allItems.push({
              id: `${itemCode}_current_${idx}`,
              value: val,
              category: '추가', // 워크시트에 있는 항목은 삭제 가능
            });
          }
        });
        
        setItems(allItems);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      }
    };
    loadData();
  }, [isOpen, itemCode, processNo, currentValues]);

  // 선택 상태 초기화
  useEffect(() => {
    if (items.length > 0 && currentValues.length > 0) {
      const newSelectedIds = new Set<string>();
      currentValues.forEach(val => {
        const found = items.find(item => item.value === val);
        if (found) newSelectedIds.add(found.id);
      });
      setSelectedIds(newSelectedIds);
    } else {
      setSelectedIds(new Set());
    }
  }, [items, currentValues]);

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    let result = items;
    
    // 카테고리 필터 (기본/추가)
    if (filterType === 'default') result = result.filter(i => i.category === '기본');
    if (filterType === 'added') result = result.filter(i => i.category === '추가');
    
    // 구분 필터 (Your Plant / Ship to Plant / User)
    if (categoryFilter !== 'All') {
      result = result.filter(i => i.belongsTo === categoryFilter || !i.belongsTo);
    }
    
    // 검색 필터
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => item.value.toLowerCase().includes(q));
    }
    
    return result;
  }, [items, filterType, search, categoryFilter]);

  const defaultCount = items.filter(i => i.category === '기본').length;
  const addedCount = items.filter(i => i.category === '추가').length;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else {
        if (singleSelect) newSet.clear();
        newSet.add(id);
      }
      return newSet;
    });
  }, [singleSelect]);

  const selectAll = () => setSelectedIds(new Set(filteredItems.map(i => i.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleAddNew = () => {
    if (!newValue.trim()) return;
    const newItem: DataItem = { id: `new_${Date.now()}`, value: newValue.trim(), category: '추가' };
    setItems(prev => [...prev, newItem]);
    setSelectedIds(prev => new Set([...prev, newItem.id]));
    setNewValue('');
  };

  const handleSave = () => {
    const selectedValues = items.filter(item => selectedIds.has(item.id)).map(item => item.value);
    onSave(selectedValues);
    onClose();
  };

  const isCurrentlySelected = (value: string) => currentValues.includes(value);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon="📋"
      width="600px"
      tabs={[
        { id: 'list', label: '목록에서 선택', icon: '📋' },
        { id: 'manual', label: '직접 입력', icon: '✏️' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      saveDisabled={selectedIds.size === 0}
      footerContent={
        <span className="text-sm font-bold text-blue-600">
          ✓ {selectedIds.size}개 선택
        </span>
      }
    >
      {activeTab === 'list' ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* 필터 탭 - WorkElementSelectModal과 동일 */}
          <div className="flex border-b bg-gray-50/30 shrink-0">
            {[
              { id: 'all', label: `전체 (${items.length})`, icon: null },
              { id: 'default', label: `기본 (${defaultCount})`, icon: '🌐' },
              { id: 'added', label: `추가 (${addedCount})`, icon: '➕' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={`flex-1 px-3 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  filterType === type.id 
                    ? 'bg-white border-blue-500 text-blue-600' 
                    : 'text-gray-500 border-transparent hover:bg-gray-100'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {/* 검색 및 버튼 */}
          <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50/50 shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${itemInfo.label} 검색...`}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            {/* 구분 필터 (C1, C2, C3 관련 모달에서만 표시) */}
            {['C1', 'C2', 'C3'].includes(itemCode) && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All</option>
                <option value="Your Plant">Your Plant</option>
                <option value="Ship to Plant">Ship to Plant</option>
                <option value="User">User</option>
              </select>
            )}
            {!singleSelect && (
              <div className="flex gap-1">
                <button onClick={selectAll} className="px-3 py-2 text-xs font-bold bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-sm transition-colors">전체선택</button>
                <button onClick={deselectAll} className="px-3 py-2 text-xs font-bold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-sm transition-colors">해제</button>
                {currentValues.length > 0 && (
                  <button 
                    onClick={() => {
                      if (confirm(`워크시트에서 ${currentValues.length}개 항목을 모두 삭제하시겠습니까?\n\n삭제 후 복구할 수 없습니다.`)) {
                        if (onDelete) {
                          onDelete(currentValues);
                        }
                        onClose();
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm transition-colors"
                  >
                    전체삭제 ({currentValues.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 아이템 그리드 - 2열 */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50/20">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <span className="text-4xl mb-4">📋</span>
                <p className="font-medium">데이터가 없습니다.</p>
                <p className="text-sm mt-1">"직접 입력" 탭에서 추가해 보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map(item => {
                  const isSelected = selectedIds.has(item.id);
                  const isCurrent = isCurrentlySelected(item.value);
                  const catColor = CATEGORY_COLORS[item.category || '기본'] || CATEGORY_COLORS['기본'];
                  
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm group ${
                        isSelected 
                          ? isCurrent 
                            ? 'bg-green-50 border-green-400 ring-1 ring-green-400' 
                            : 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      {/* 체크박스 */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                        isSelected 
                          ? isCurrent ? 'bg-green-500 border-green-500' : 'bg-blue-500 border-blue-500' 
                          : 'bg-white border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>

                      {/* 카테고리 배지 */}
                      <span 
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded shadow-inner shrink-0"
                        style={{ background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
                      >
                        {item.category || '기본'}
                      </span>

                      {/* 소속 배지 (belongsTo) */}
                      {item.belongsTo && ['C2', 'C3'].includes(itemCode) && (
                        <span 
                          className="text-[8px] font-medium px-1.5 py-0.5 rounded shrink-0"
                          style={{ 
                            background: item.belongsTo === 'Your Plant' ? '#e8f5e9' : 
                                       item.belongsTo === 'Ship to Plant' ? '#fff3e0' : '#fce4ec',
                            color: item.belongsTo === 'Your Plant' ? '#2e7d32' : 
                                   item.belongsTo === 'Ship to Plant' ? '#e65100' : '#c2185b',
                            border: `1px solid ${item.belongsTo === 'Your Plant' ? '#a5d6a7' : 
                                    item.belongsTo === 'Ship to Plant' ? '#ffcc80' : '#f48fb1'}`
                          }}
                        >
                          {item.belongsTo === 'Your Plant' ? 'YP' : 
                           item.belongsTo === 'Ship to Plant' ? 'SP' : 'U'}
                        </span>
                      )}

                      {/* 이름 */}
                      <span className={`flex-1 text-sm truncate font-medium ${
                        isSelected ? (isCurrent ? 'text-green-900' : 'text-blue-900') : 'text-gray-700'
                      }`}>
                        {item.value}
                        {isCurrent && <span className="ml-1 text-[9px] font-normal text-green-600">(현재)</span>}
                      </span>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col h-full bg-gray-50/20">
          <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-blue-500">➕</span> 새 {itemInfo.label} 등록
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newValue.trim()) handleAddNew(); }}
                placeholder={`새로운 ${itemInfo.label}을 입력하세요...`}
                className="flex-1 px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
              <button
                onClick={handleAddNew}
                disabled={!newValue.trim()}
                className="px-6 py-2.5 text-sm font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all disabled:bg-gray-200 active:scale-95"
              >
                추가
              </button>
            </div>
          </div>

          {/* 입력된 항목 표시 */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">입력된 항목 ({items.filter(i => i.category === '추가').length})</h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {items.filter(i => i.category === '추가').map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">추가</span>
                  <span className="flex-1 text-sm text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
