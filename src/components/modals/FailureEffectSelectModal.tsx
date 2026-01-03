/**
 * @file FailureEffectSelectModal.tsx
 * @description 고장영향(FE) 선택 모달 - 표준화 적용
 * @version 2.0.0 - 표준화
 * @updated 2025-12-29
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

const DEFAULT_EFFECTS = [
  { id: 'FE_YP_1', value: '생산 지연', category: '기본', group: 'Your Plant' },
  { id: 'FE_YP_2', value: '재작업/폐기', category: '기본', group: 'Your Plant' },
  { id: 'FE_YP_3', value: '공정 정지', category: '기본', group: 'Your Plant' },
  { id: 'FE_SP_1', value: '조립 불가', category: '기본', group: 'Ship to Plant' },
  { id: 'FE_SP_2', value: '라인 정지', category: '기본', group: 'Ship to Plant' },
  { id: 'FE_SP_3', value: '외관 불량', category: '기본', group: 'Ship to Plant' },
  { id: 'FE_U_1', value: '차량 정지 (안전)', category: '기본', group: 'User' },
  { id: 'FE_U_2', value: '기능 작동 불능', category: '기본', group: 'User' },
  { id: 'FE_U_3', value: '성능 저하', category: '기본', group: 'User' },
  { id: 'FE_U_4', value: '소음/진동 발생', category: '기본', group: 'User' },
];

const GROUP_COLORS: Record<string, { bg: string; text: string }> = {
  'Your Plant': { bg: '#e8f5e9', text: '#2e7d32' },
  'Ship to Plant': { bg: '#fff3e0', text: '#e65100' },
  'User': { bg: '#fce4ec', text: '#c2185b' },
};

interface FailureEffect {
  id: string;
  effect: string;
  severity?: number;
}

interface FailureEffectSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (effects: FailureEffect[]) => void;
  parentType: string;
  parentReqName: string;
  parentReqId: string;
  parentFuncName?: string;
  currentEffects: FailureEffect[];
  productName?: string;
}

export default function FailureEffectSelectModal({
  isOpen,
  onClose,
  onSave,
  parentType,
  parentReqName,
  parentFuncName,
  currentEffects,
}: FailureEffectSelectModalProps) {
  const [items, setItems] = useState<{ id: string; value: string; category: string; group: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    let allItems = [...DEFAULT_EFFECTS];
    
    // 현재 항목 추가
    currentEffects.forEach((e, idx) => {
      if (!allItems.find(i => i.value === e.effect)) {
        allItems.push({ id: e.id, value: e.effect, category: '추가', group: parentType });
      }
    });
    
    setItems(allItems);
    
    // 기본 필터 설정
    if (parentType) setGroupFilter(parentType);
    
    // 현재 선택 설정
    const selected = new Set<string>();
    currentEffects.forEach(e => {
      const found = allItems.find(i => i.value === e.effect);
      if (found) selected.add(found.id);
    });
    setSelectedIds(selected);
  }, [isOpen, currentEffects, parentType]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (groupFilter !== 'All') {
      result = result.filter(i => i.group === groupFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.value.toLowerCase().includes(q));
    }
    return result;
  }, [items, groupFilter, search]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const selectAll = () => setSelectedIds(new Set(filteredItems.map(i => i.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleApply = () => {
    const effects: FailureEffect[] = items
      .filter(i => selectedIds.has(i.id))
      .map(i => {
        const existing = currentEffects.find(e => e.effect === i.value);
        return existing || { id: i.id, effect: i.value };
      });
    onSave(effects);
    onClose();
  };

  const handleDeleteAll = () => {
    if (!confirm('모든 항목을 삭제하시겠습니까?')) return;
    onSave([]);
    onClose();
  };

  const handleAddSave = () => {
    if (!newValue.trim()) return;
    const newItem = { id: `new_${Date.now()}`, value: newValue.trim(), category: '추가', group: parentType };
    setItems(prev => [newItem, ...prev]); // 맨 위에 추가
    setSelectedIds(prev => new Set([...prev, newItem.id]));
    setNewValue('');
  };

  const minRows = 10;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-end bg-black/40 pt-36 pr-5" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-[500px] flex flex-col overflow-hidden max-h-[calc(100vh-160px)]" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center gap-2">
            <span>💥</span>
            <h2 className="text-xs font-bold">고장영향(FE) 선택</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">닫기</button>
        </div>

        {/* ===== 상위항목 고정 표시 ===== */}
        <div className="px-3 py-2 border-b bg-gradient-to-r from-red-50 to-orange-50 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-red-700 shrink-0">★ 상위항목:</span>
          {parentType && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-600 font-bold">구분:</span>
              <span className="px-2 py-1 text-[10px] font-bold bg-red-600 text-white rounded">{parentType}</span>
            </div>
          )}
          {parentReqName && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-600 font-bold">요구사항:</span>
              <span className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded max-w-[180px] truncate" title={parentReqName}>{parentReqName}</span>
            </div>
          )}
        </div>

        {/* ===== 하위항목 라벨 ===== */}
        <div className="px-3 py-1 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <span className="text-[10px] font-bold text-green-700">▼ 하위항목: 고장영향(FE)</span>
        </div>

        {/* 검색 + 버튼 */}
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 고장영향 검색..."
            className="flex-1 px-2 py-1 text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <button onClick={selectAll} className="px-2 py-1 text-[10px] font-bold bg-blue-500 text-white rounded hover:bg-blue-600">전체</button>
          <button onClick={deselectAll} className="px-2 py-1 text-[10px] font-bold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">해제</button>
          <button onClick={handleApply} className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700">적용</button>
          <button onClick={handleDeleteAll} className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded hover:bg-red-600">삭제</button>
        </div>

        {/* 새 항목 입력 */}
        <div className="px-3 py-1.5 border-b bg-green-50 flex items-center gap-1">
          <span className="text-[10px] font-bold text-green-700">+</span>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSave()}
            placeholder="새 고장영향 입력..."
            className="flex-1 px-2 py-0.5 text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button onClick={handleAddSave} disabled={!newValue.trim()} className="px-2 py-0.5 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">저장</button>
        </div>

        {/* 리스트 */}
        <div className="overflow-auto p-2 h-[280px] min-h-[280px]">
          <div className="grid grid-cols-2 gap-1">
            {filteredItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              const isCurrent = currentEffects.some(e => e.effect === item.value);
              const groupColor = GROUP_COLORS[item.group] || { bg: '#f5f5f5', text: '#666' };
              
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                    isSelected ? (isCurrent ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400') : 'bg-white border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected ? (isCurrent ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500') : 'bg-white border-gray-300'
                  }`}>
                    {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: groupColor.bg, color: groupColor.text }}>
                    {item.group === 'Your Plant' ? 'YP' : item.group === 'Ship to Plant' ? 'SP' : 'U'}
                  </span>
                  <span className={`flex-1 text-[10px] truncate ${isSelected ? 'font-medium' : ''}`}>{item.value}</span>
                  {isSelected && <button onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>}
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, minRows - filteredItems.length) }).map((_, idx) => (
              <div key={`empty-${idx}`} className="flex items-center gap-2 px-2 py-1.5 rounded border border-gray-100 bg-gray-50/50">
                <div className="w-4 h-4 rounded border border-gray-200 bg-white shrink-0" />
                <span className="text-[9px] text-gray-300">--</span>
                <span className="flex-1 text-[10px] text-gray-300">-</span>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-center">
          <span className="text-xs font-bold text-red-600">✓ {selectedIds.size}개 선택</span>
        </div>
      </div>
    </div>
  );
}
