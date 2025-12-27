/**
 * @file DataSelectModal.tsx
 * @description 공용 데이터 선택 모달 (다중선택, 신규입력 지원)
 * @author AI Assistant
 * @created 2025-12-28
 * 
 * 사용처: 기능분석, 고장분석 등 모든 탭에서 재사용
 * - 완제품 기능 (C2)
 * - 요구사항 (C3)
 * - 공정 기능 (A3)
 * - 제품특성 (A4)
 * - 작업요소 기능 (B2)
 * - 공정특성 (B3)
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
};

// 레벨별 테마 색상
const LEVEL_COLORS = {
  L1: { main: '#7b1fa2', light: '#f3e5f5', border: '#ce93d8' },  // 보라
  L2: { main: '#512da8', light: '#ede7f6', border: '#b39ddb' },  // 인디고
  L3: { main: '#303f9f', light: '#e8eaf6', border: '#9fa8da' },  // 파랑
};

export interface DataItem {
  id: string;
  value: string;
  processNo?: string;  // 공정별 필터링용
  selected?: boolean;
}

interface DataSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedValues: string[]) => void;
  title: string;
  itemCode: string;  // C2, C3, A3, A4, B2, B3 등
  currentValues: string[];  // 현재 선택된 값들
  processNo?: string;  // 특정 공정 필터링 (옵션)
}

export default function DataSelectModal({
  isOpen,
  onClose,
  onSave,
  title,
  itemCode,
  currentValues,
  processNo,
}: DataSelectModalProps) {
  const [items, setItems] = useState<DataItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newValue, setNewValue] = useState('');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  const itemInfo = ITEM_CODE_LABELS[itemCode] || { label: itemCode, category: 'A', level: 'L1' };
  const colors = LEVEL_COLORS[itemInfo.level];

  // 하이드레이션 오류 방지
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // localStorage에서 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    const loadData = () => {
      try {
        const savedData = localStorage.getItem('pfmea_master_data');
        let initialItems: DataItem[] = [];
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // itemCode에 해당하는 데이터 필터링
          let filteredData = parsedData.filter((item: any) => item.itemCode === itemCode);
          
          // 공정번호 필터링 (옵션)
          if (processNo) {
            filteredData = filteredData.filter((item: any) => item.processNo === processNo);
          }
          
          // 중복 제거 및 DataItem 형식으로 변환
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

        // C1(구분)인 경우 기본 항목 추가
        if (itemCode === 'C1' && initialItems.length === 0) {
          initialItems = [
            { id: 'C1_1', value: 'Your Plant' },
            { id: 'C1_2', value: 'Ship to Plant' },
            { id: 'C1_3', value: 'User' },
          ];
        }
        
        setItems(initialItems);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        setItems([]);
      }
    };

    loadData();
  }, [isOpen, itemCode, processNo]);

  // 현재 값들로 선택 상태 초기화
  useEffect(() => {
    if (items.length > 0 && currentValues.length > 0) {
      const newSelectedIds = new Set<string>();
      currentValues.forEach(val => {
        const found = items.find(item => item.value === val);
        if (found) {
          newSelectedIds.add(found.id);
        }
      });
      setSelectedIds(newSelectedIds);
    }
  }, [items, currentValues]);

  // 검색 필터링
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    return items.filter(item => item.value.toLowerCase().includes(searchLower));
  }, [items, search]);

  // 체크박스 토글
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        // C1(구분)인 경우 단일 선택처럼 동작 (선택 시 다른 것들 해제)
        if (itemCode === 'C1') {
          return new Set([id]);
        }
        newSet.add(id);
      }
      return newSet;
    });
  }, [itemCode]);

  // 전체 선택/해제
  const toggleAll = useCallback(() => {
    if (itemCode === 'C1') return; // 구분은 전체선택 방지
    
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    }
  }, [selectedIds, filteredItems, itemCode]);

  // 신규 항목 추가
  const handleAddNew = useCallback(() => {
    if (!newValue.trim()) return;
    
    const newItem: DataItem = {
      id: `new_${Date.now()}`,
      value: newValue.trim(),
    };
    
    setItems(prev => [...prev, newItem]);
    // C1인 경우 신규 추가하면 그것만 선택됨
    if (itemCode === 'C1') {
      setSelectedIds(new Set([newItem.id]));
    } else {
      setSelectedIds(prev => new Set([...prev, newItem.id]));
    }
    setNewValue('');
  }, [newValue, itemCode]);

  // 저장
  const handleSave = useCallback(() => {
    const selectedValues = items
      .filter(item => selectedIds.has(item.id))
      .map(item => item.value);
    onSave(selectedValues);
    onClose();
  }, [items, selectedIds, onSave, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl"
        style={{ width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div 
          className="flex items-center justify-between px-4 py-3 rounded-t-lg"
          style={{ background: colors.main, color: '#fff' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">📋 {title}</span>
            <span 
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {itemInfo.label} ({itemCode})
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* 검색 + 전체선택 */}
        <div className="px-4 py-2 border-b flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="flex-1 px-3 py-1.5 border rounded text-sm"
            style={{ borderColor: colors.border }}
          />
          {itemCode !== 'C1' && (
            <button
              onClick={toggleAll}
              className="px-3 py-1.5 text-xs font-bold rounded"
              style={{ 
                background: selectedIds.size === filteredItems.length ? colors.main : colors.light,
                color: selectedIds.size === filteredItems.length ? '#fff' : colors.main,
                border: `1px solid ${colors.border}`,
              }}
            >
              {selectedIds.size === filteredItems.length ? '전체해제' : '전체선택'}
            </button>
          )}
        </div>

        {/* 아이템 리스트 */}
        <div className="flex-1 overflow-auto px-4 py-2" style={{ maxHeight: '300px' }}>
          {filteredItems.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>데이터가 없습니다.</p>
              <p className="text-xs mt-1">아래에서 직접 입력하세요.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map(item => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-50"
                  style={{
                    background: selectedIds.has(item.id) ? colors.light : 'transparent',
                    border: `1px solid ${selectedIds.has(item.id) ? colors.border : '#e5e7eb'}`,
                  }}
                >
                  <input
                    type={itemCode === 'C1' ? 'radio' : 'checkbox'}
                    name={itemCode === 'C1' ? 'data-select' : undefined}
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4"
                    style={{ accentColor: colors.main }}
                  />
                  <span className="flex-1 text-sm">{item.value}</span>
                  {item.processNo && (
                    <span className="text-xs text-gray-400">({item.processNo})</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 신규 입력 */}
        <div className="px-4 py-3 border-t" style={{ background: colors.light }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: colors.main }}>
              ➕ 신규 입력:
            </span>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddNew(); }}
              placeholder={`새 ${itemInfo.label} 입력...`}
              className="flex-1 px-3 py-1.5 border rounded text-sm"
              style={{ borderColor: colors.border }}
            />
            <button
              onClick={handleAddNew}
              disabled={!newValue.trim()}
              className="px-3 py-1.5 text-xs font-bold rounded"
              style={{
                background: newValue.trim() ? colors.main : '#e5e7eb',
                color: newValue.trim() ? '#fff' : '#999',
              }}
            >
              추가
            </button>
          </div>
        </div>

        {/* 선택 현황 + 버튼 */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            선택됨: <strong style={{ color: colors.main }}>{selectedIds.size}</strong>개
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold rounded border"
              style={{ borderColor: colors.border, color: colors.main }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-bold rounded text-white"
              style={{ background: colors.main }}
            >
              확인 ({selectedIds.size}개)
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
