/**
 * @file FailureModeSelectModal.tsx
 * @description 고장형태(FM) 선택 모달 - 표준화 적용
 * @version 2.0.0 - 표준화
 * @updated 2025-12-29
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

const DEFAULT_MODES = [
  { id: 'FM_1', value: '규격 미달', category: '기본' },
  { id: 'FM_2', value: '규격 초과', category: '기본' },
  { id: 'FM_3', value: '변형', category: '기본' },
  { id: 'FM_4', value: '파손', category: '기본' },
  { id: 'FM_5', value: '누락', category: '기본' },
  { id: 'FM_6', value: '오염', category: '기본' },
  { id: 'FM_7', value: '기능 불량', category: '기본' },
  { id: 'FM_8', value: '외관 불량', category: '기본' },
  { id: 'FM_9', value: '균열', category: '기본' },
  { id: 'FM_10', value: '부식', category: '기본' },
  { id: 'FM_11', value: '이탈', category: '기본' },
  { id: 'FM_12', value: '마모', category: '기본' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  '기본': { bg: '#e8f5e9', text: '#2e7d32' },
  '추가': { bg: '#fff3e0', text: '#e65100' },
};

interface FailureMode {
  id: string;
  name: string;
}

interface FailureModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modes: FailureMode[]) => void;
  parentType: 'productChar' | 'processChar';
  parentName: string;
  parentId: string;
  currentModes: FailureMode[];
  processName?: string;
  functionName?: string;
}

export default function FailureModeSelectModal({
  isOpen,
  onClose,
  onSave,
  parentName,
  processName,
  functionName,
  currentModes,
}: FailureModeSelectModalProps) {
  const [items, setItems] = useState<{ id: string; value: string; category: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    let allItems = [...DEFAULT_MODES];
    
    currentModes.forEach((m) => {
      if (!allItems.find(i => i.value === m.name)) {
        allItems.push({ id: m.id, value: m.name, category: '추가' });
      }
    });
    
    setItems(allItems);
    
    const selected = new Set<string>();
    currentModes.forEach(m => {
      const found = allItems.find(i => i.value === m.name);
      if (found) selected.add(found.id);
    });
    setSelectedIds(selected);
  }, [isOpen, currentModes]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.value.toLowerCase().includes(q));
  }, [items, search]);

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
    const modes: FailureMode[] = items
      .filter(i => selectedIds.has(i.id))
      .map(i => {
        const existing = currentModes.find(m => m.name === i.value);
        return existing || { id: i.id, name: i.value };
      });
    onSave(modes);
    onClose();
  };

  const handleDeleteAll = () => {
    if (!confirm('모든 항목을 삭제하시겠습니까?')) return;
    onSave([]);
    onClose();
  };

  const handleAddSave = () => {
    if (!newValue.trim()) return;
    const newItem = { id: `new_${Date.now()}`, value: newValue.trim(), category: '추가' };
    setItems(prev => [...prev, newItem]);
    setSelectedIds(prev => new Set([...prev, newItem.id]));
    setNewValue('');
  };

  const minRows = 10;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-[600px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ maxHeight: '70vh' }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <h2 className="text-xs font-bold">고장형태(FM) 선택</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">닫기</button>
        </div>

        {/* 상위 항목 고정 표시 */}
        {(processName || functionName || parentName) && (
          <div className="px-3 py-2 border-b bg-gradient-to-r from-orange-50 to-amber-50 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-orange-700 shrink-0">📌 상위항목:</span>
            {processName && (
              <span className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded">{processName}</span>
            )}
            {functionName && (
              <span className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded max-w-[200px] truncate" title={functionName}>{functionName}</span>
            )}
            {parentName && (
              <span className="px-2 py-1 text-[10px] font-bold bg-purple-600 text-white rounded max-w-[200px] truncate" title={parentName}>{parentName}</span>
            )}
          </div>
        )}

        {/* 검색 + 버튼 */}
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 고장형태 검색..."
            className="flex-1 px-2 py-1 text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
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
            placeholder="새 고장형태 입력..."
            className="flex-1 px-2 py-0.5 text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button onClick={handleAddSave} disabled={!newValue.trim()} className="px-2 py-0.5 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">저장</button>
        </div>

        {/* 리스트 */}
        <div className="overflow-auto p-2" style={{ height: '280px', minHeight: '280px' }}>
          <div className="grid grid-cols-2 gap-1">
            {filteredItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              const isCurrent = currentModes.some(m => m.name === item.value);
              const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['기본'];
              
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                    isSelected ? (isCurrent ? 'bg-green-50 border-green-400' : 'bg-orange-50 border-orange-400') : 'bg-white border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected ? (isCurrent ? 'bg-green-500 border-green-500' : 'bg-orange-500 border-orange-500') : 'bg-white border-gray-300'
                  }`}>
                    {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: catColor.bg, color: catColor.text }}>{item.category}</span>
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
          <span className="text-xs font-bold text-orange-600">✓ {selectedIds.size}개 선택</span>
        </div>
      </div>
    </div>
  );
}
