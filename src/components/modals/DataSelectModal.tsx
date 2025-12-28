/**
 * @file DataSelectModal.tsx
 * @description 공용 데이터 선택 모달 (다중선택, 신규입력 지원)
 * @author AI Assistant
 * @created 2025-12-28
 * 
 * 사용처: 기능분석, 고장분석 등 모든 탭에서 재사용
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';

// 아이템 코드별 라벨 정의
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

// 레벨별 테마 색상 (표준화된 색상 사용)
const LEVEL_THEMES = {
  L1: { main: '#7b1fa2', bg: '#f3e5f5', border: '#ce93d8', text: '#4a148c' },  // 보라
  L2: { main: '#512da8', bg: '#ede7f6', border: '#b39ddb', text: '#311b92' },  // 인디고
  L3: { main: '#303f9f', bg: '#e8eaf6', border: '#9fa8da', text: '#1a237e' },  // 파랑
};

export interface DataItem {
  id: string;
  value: string;
  processNo?: string;
  selected?: boolean;
}

interface DataSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedValues: string[]) => void;
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

  const itemInfo = ITEM_CODE_LABELS[itemCode] || { label: itemCode, category: 'A', level: 'L1' };
  const theme = LEVEL_THEMES[itemInfo.level];

  // 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    const loadData = () => {
      try {
        const savedData = localStorage.getItem('pfmea_master_data');
        let initialItems: DataItem[] = [];
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          let filteredData = parsedData.filter((item: any) => item.itemCode === itemCode);
          if (processNo) filteredData = filteredData.filter((item: any) => item.processNo === processNo);
          
          const uniqueValues = new Map<string, DataItem>();
          filteredData.forEach((item: any, idx: number) => {
            if (item.value && item.value.trim()) {
              const key = item.value.trim();
              if (!uniqueValues.has(key)) {
                uniqueValues.set(key, {
                  id: `${itemCode}_${idx}`,
                  value: key,
                  processNo: item.processNo,
                });
              }
            }
          });
          initialItems = Array.from(uniqueValues.values());
        }

        if (itemCode === 'C1' && initialItems.length === 0) {
          initialItems = [
            { id: 'C1_1', value: 'Your Plant' },
            { id: 'C1_2', value: 'Ship to Plant' },
            { id: 'C1_3', value: 'User' },
          ];
        }

        if (itemCode === 'C3' && initialItems.length === 0) {
          initialItems = [
            { id: 'C3_1', value: 'Your Plant' },
            { id: 'C3_2', value: 'Ship to Plant' },
            { id: 'C3_3', value: 'User' },
          ];
        }
        
        if (itemCode === 'S1' && initialItems.length === 0) {
          initialItems = Array.from({ length: 10 }, (_, i) => ({
            id: `S1_${i + 1}`,
            value: (10 - i).toString()
          }));
        }

        if (itemCode === 'C4' && initialItems.length === 0) {
          initialItems = [
            { id: 'C4_1', value: '차량 정지 (안전 관련)' },
            { id: 'C4_2', value: '차량 주요기능 작동 불능' },
            { id: 'C4_3', value: '차량 성능 저하' },
            { id: 'C4_4', value: '외관 불량' },
            { id: 'C4_5', value: '이음 발생' },
          ];
        }
        setItems(initialItems);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      }
    };
    loadData();
  }, [isOpen, itemCode, processNo]);

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

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item => item.value.toLowerCase().includes(q));
  }, [items, search]);

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

  const toggleAll = () => {
    // [표준화] C1도 전체 선택 허용
    if (selectedIds.size === filteredItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredItems.map(item => item.id)));
  };

  const handleAddNew = () => {
    if (!newValue.trim()) return;
    const newItem: DataItem = { id: `new_${Date.now()}`, value: newValue.trim() };
    setItems(prev => [...prev, newItem]);
    setSelectedIds(prev => new Set([...prev, newItem.id]));
    setNewValue('');
  };

  const handleSave = () => {
    const selectedValues = items
      .filter(item => selectedIds.has(item.id))
      .map(item => item.value);
    onSave(selectedValues);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon="📋"
      headerColor={theme.main}
      width="520px"
      tabs={[
        { id: 'list', label: '목록에서 선택', icon: '🔍' },
        { id: 'manual', label: '직접 입력', icon: '⌨️' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      saveDisabled={selectedIds.size === 0}
      footerContent={
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: theme.main }}>
            ✓ {selectedIds.size}개 선택됨
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border">
            {itemInfo.label} ({itemCode})
          </span>
        </div>
      }
    >
      {activeTab === 'list' ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50/50">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${itemInfo.label} 검색...`}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 outline-none transition-all shadow-sm"
                style={{ borderColor: theme.border }}
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            {/* [표준화] 모든 항목에 대해 전체 선택 버튼 표시 (단일 선택 모드 제외) */}
            {!singleSelect && (
              <button 
                onClick={toggleAll}
                className="px-3 py-2 text-xs font-bold rounded-md border shadow-sm transition-colors whitespace-nowrap"
                style={{ 
                  background: selectedIds.size === filteredItems.length && filteredItems.length > 0 ? theme.main : '#fff',
                  color: selectedIds.size === filteredItems.length && filteredItems.length > 0 ? '#fff' : theme.main,
                  borderColor: theme.border
                }}
              >
                {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? '전체해제' : '전체선택'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 bg-gray-50/20">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <span className="text-4xl mb-4">📋</span>
                <p className="font-medium">데이터가 없습니다.</p>
                <p className="text-sm mt-1">"직접 입력" 탭에서 추가해 보세요.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map(item => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm group ${
                        isSelected 
                          ? 'ring-1' 
                          : 'bg-white border-gray-200 hover:shadow-md'
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? theme.bg : '#fff',
                        borderColor: isSelected ? theme.main : '#e5e7eb',
                        boxShadow: isSelected ? `0 0 0 1px ${theme.main}` : 'none'
                      }}
                    >
                      {/* [표준화] Radio 대신 Checkbox로 통일 */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-blue-500 border-blue-500 scale-110' : 'bg-white border-gray-300 group-hover:border-blue-400'
                      }`}
                      style={{ backgroundColor: isSelected ? theme.main : '#fff', borderColor: isSelected ? theme.main : '#d1d5db' }}>
                        {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {item.value}
                      </span>
                      {item.processNo && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border">
                          {item.processNo}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gray-50/20 h-full flex flex-col">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: theme.main }}>
              <span>➕</span> 새 {itemInfo.label} 등록
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddNew(); }}
                placeholder={`새로운 ${itemInfo.label}을 입력하세요...`}
                className="flex-1 px-4 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 shadow-sm transition-all"
                style={{ borderColor: theme.border }}
              />
              <button
                onClick={handleAddNew}
                disabled={!newValue.trim()}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-md transition-all active:scale-95 disabled:bg-gray-200"
                style={{ background: newValue.trim() ? theme.main : '#e5e7eb' }}
              >
                추가
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-3 px-1 italic">
              * 입력 후 '추가' 버튼을 누르거나 Enter를 치면 목록에 추가됩니다.
            </p>
          </div>
          <div className="mt-auto p-4 rounded-lg border border-dashed text-center bg-white/50" style={{ borderColor: theme.border }}>
            <p className="text-xs text-gray-500">자주 사용하는 {itemInfo.label} 항목을 직접 등록하여 관리할 수 있습니다.</p>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
