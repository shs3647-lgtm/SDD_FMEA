/**
 * @file StandardSelectModal.tsx
 * @description 표준화된 선택 모달
 * - 제목: 입력항목 표시 (예: 요구사항, 작업요소 등)
 * - 상위항목: 드롭다운 + 필터 + 현재 선택 표시
 * - 하위항목: 검색/입력 + 저장
 * - 버튼: 전체, 해제, 적용, 삭제
 * @version 2.0.0
 * @updated 2025-12-29
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// =====================================================
// 타입 정의
// =====================================================
export interface SelectItem {
  id: string;
  no?: string;
  value: string;
  category?: string;
  parentId?: string;
  belongsTo?: string;
}

export interface ParentItem {
  id: string;
  no?: string;
  value: string;
}

export interface FilterOption {
  id: string;
  label: string;
}

interface StandardSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedItems: SelectItem[]) => void;
  onDelete?: (items: SelectItem[]) => void;
  
  // 기본 설정
  title: string;                    // 입력항목 표시 (예: 요구사항)
  icon?: string;
  
  // 데이터
  items: SelectItem[];
  selectedValues?: string[];
  
  // 상위항목
  parentItems?: ParentItem[];
  parentLabel?: string;             // "상위항목"
  selectedParentId?: string;
  selectedParentValue?: string;     // 현재 선택된 상위항목 값 표시
  onParentChange?: (parentId: string) => void;
  
  // 필터
  filterOptions?: FilterOption[];
  filterLabel?: string;
  
  // 옵션
  multiSelect?: boolean;
  showCategory?: boolean;
  columns?: 1 | 2;
  
  // 새 항목 추가
  categoryOptions?: FilterOption[]; // 새 항목 추가 시 카테고리 선택
  onAdd?: (value: string, category?: string) => void;
}

// 카테고리별 색상
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  '기본': { bg: '#e8f5e9', text: '#2e7d32' },
  '추가': { bg: '#fff3e0', text: '#e65100' },
  'YP': { bg: '#e3f2fd', text: '#1565c0' },
  'SP': { bg: '#fff3e0', text: '#e65100' },
  'U': { bg: '#fce4ec', text: '#c2185b' },
  'MN': { bg: '#e8f5e9', text: '#2e7d32' },
  'MC': { bg: '#e3f2fd', text: '#1565c0' },
  'IM': { bg: '#fff3e0', text: '#e65100' },
  'EN': { bg: '#fce4ec', text: '#7b1fa2' },
};

export default function StandardSelectModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  title,
  icon = '📋',
  items,
  selectedValues = [],
  parentItems,
  parentLabel = '상위항목',
  selectedParentId,
  selectedParentValue,
  onParentChange,
  filterOptions,
  filterLabel = 'ALL',
  multiSelect = true,
  showCategory = true,
  columns = 2,
  categoryOptions,
  onAdd,
}: StandardSelectModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState(categoryOptions?.[0]?.id || 'MN');

  // 초기화
  useEffect(() => {
    if (isOpen) {
      const ids = new Set<string>();
      selectedValues.forEach(val => {
        const found = items.find(i => i.value === val);
        if (found) ids.add(found.id);
      });
      setSelectedIds(ids);
      setSearch('');
    }
  }, [isOpen, selectedValues, items]);

  // 필터링
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    if (selectedParentId && selectedParentId !== 'all') {
      result = result.filter(i => i.parentId === selectedParentId);
    }
    
    if (activeFilter !== 'all') {
      result = result.filter(i => 
        i.category === activeFilter || i.belongsTo === activeFilter
      );
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.value.toLowerCase().includes(q));
    }
    
    return result;
  }, [items, selectedParentId, activeFilter, search]);

  // 선택 토글
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else {
        if (!multiSelect) newSet.clear();
        newSet.add(id);
      }
      return newSet;
    });
  }, [multiSelect]);

  // 전체 선택/해제
  const selectAll = () => setSelectedIds(new Set(filteredItems.map(i => i.id)));
  const deselectAll = () => setSelectedIds(new Set());

  // 적용
  const handleApply = () => {
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    onSave(selectedItems);
    onClose();
  };

  // 삭제
  const handleDelete = () => {
    if (!onDelete || selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    if (confirm(`선택한 ${selectedItems.length}개 항목을 삭제하시겠습니까?`)) {
      onDelete(selectedItems);
      setSelectedIds(new Set());
    }
  };

  // 새 항목 저장
  const handleAddSave = () => {
    if (!onAdd || !newValue.trim()) return;
    onAdd(newValue.trim(), newCategory);
    setNewValue('');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-end bg-black/40"
      onClick={onClose}
      style={{ paddingTop: '80px', paddingRight: '20px' }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-[500px] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        {/* ===== 헤더: 제목 ===== */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <h2 className="text-xs font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">닫기</button>
        </div>

        {/* ===== 상위항목 + 필터 + 현재선택 표시 + 버튼 ===== */}
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2 flex-wrap">
          {/* 상위항목 드롭다운 */}
          {parentItems && parentItems.length > 0 && (
            <select
              value={selectedParentId || 'all'}
              onChange={(e) => onParentChange?.(e.target.value)}
              className="px-2 py-1 text-[10px] font-bold bg-white border border-gray-300 rounded cursor-pointer"
            >
              <option value="all">{parentLabel}</option>
              {parentItems.map(p => (
                <option key={p.id} value={p.id}>
                  {p.no ? `${p.no}. ` : ''}{p.value}
                </option>
              ))}
            </select>
          )}

          {/* 필터 드롭다운 */}
          {filterOptions && filterOptions.length > 0 && (
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-2 py-1 text-[10px] font-bold bg-[#00587a] text-white rounded cursor-pointer border-0"
            >
              <option value="all" className="bg-white text-gray-800">{filterLabel}</option>
              {filterOptions.map(f => (
                <option key={f.id} value={f.id} className="bg-white text-gray-800">{f.label}</option>
              ))}
            </select>
          )}

          {/* 현재 선택된 상위항목 값 표시 */}
          {selectedParentValue && (
            <div className="flex-1 px-3 py-1 bg-[#00587a] text-white text-[10px] font-bold rounded text-center truncate">
              {selectedParentValue}
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-1 ml-auto">
            <button onClick={selectAll} className="px-2 py-1 text-[10px] font-bold bg-blue-500 text-white rounded hover:bg-blue-600">전체</button>
            <button onClick={deselectAll} className="px-2 py-1 text-[10px] font-bold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">해제</button>
            <button onClick={handleApply} className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700">적용</button>
            {onDelete && (
              <button onClick={handleDelete} className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded hover:bg-red-600">삭제</button>
            )}
          </div>
        </div>

        {/* ===== 하위항목 검색/입력 + 저장 ===== */}
        <div className="px-3 py-1.5 border-b bg-green-50 flex items-center gap-1">
          <span className="text-[10px] font-bold text-green-700">+</span>
          {/* 카테고리 선택 */}
          {categoryOptions && categoryOptions.length > 0 && (
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-1 py-0.5 text-[10px] border rounded"
            >
              {categoryOptions.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          )}
          {/* 검색/입력 */}
          <input
            type="text"
            value={search || newValue}
            onChange={(e) => {
              setSearch(e.target.value);
              setNewValue(e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && onAdd && handleAddSave()}
            placeholder="검색 입력"
            className="flex-1 px-2 py-0.5 text-[10px] bg-[#00587a] text-white placeholder-white/60 rounded focus:outline-none"
          />
          {/* 저장 버튼 */}
          {onAdd && (
            <button
              onClick={handleAddSave}
              disabled={!newValue.trim()}
              className="px-2 py-0.5 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              저장
            </button>
          )}
        </div>

        {/* ===== 리스트 (고정 높이) ===== */}
        <div className="overflow-auto p-2 h-[280px] min-h-[280px]">
          <div className={`grid gap-1 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {filteredItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              const catColor = CATEGORY_COLORS[item.category || ''] || 
                              CATEGORY_COLORS[item.belongsTo || ''] || 
                              { bg: '#f5f5f5', text: '#616161' };
              
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-400' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* 체크박스 */}
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                  }`}>
                    {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>

                  {/* 카테고리 배지 */}
                  {showCategory && (item.category || item.belongsTo) && (
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: catColor.bg, color: catColor.text }}
                    >
                      {item.category || item.belongsTo}
                    </span>
                  )}

                  {/* 값 */}
                  <span className={`flex-1 text-[10px] truncate ${
                    isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'
                  }`}>
                    {item.value}
                  </span>

                  {/* 삭제 X */}
                  {isSelected && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`"${item.value}" 삭제?`)) {
                          onDelete([item]);
                          setSelectedIds(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(item.id);
                            return newSet;
                          });
                        }
                      }}
                      className="text-red-400 hover:text-red-600 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            {/* 빈 행 채우기 */}
            {Array.from({ length: Math.max(0, 10 - filteredItems.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded border border-gray-100 bg-gray-50/50"
              >
                <div className="w-4 h-4 rounded border border-gray-200 bg-white shrink-0" />
                <span className="text-[9px] text-gray-300">--</span>
                <span className="flex-1 text-[10px] text-gray-300">-</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 푸터: 선택 개수 ===== */}
        <div className="px-3 py-2 border-t bg-gray-50 text-center">
          <span className="text-[10px] font-bold text-blue-600">✓ {selectedIds.size}개 선택</span>
        </div>
      </div>
    </div>
  );
}
