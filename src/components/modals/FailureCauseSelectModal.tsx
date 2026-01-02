/**
 * @file FailureCauseSelectModal.tsx
 * @description 고장원인(FC) 선택 모달 - 표준화 적용
 * @version 2.0.0 - 표준화
 * @updated 2025-12-29
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

const DEFAULT_CAUSES = [
  { id: 'FC_MN_1', value: '작업자 실수', category: '기본', group: 'MN' },
  { id: 'FC_MN_2', value: '교육 미흡', category: '기본', group: 'MN' },
  { id: 'FC_MN_3', value: '숙련도 부족', category: '기본', group: 'MN' },
  { id: 'FC_MC_1', value: '설비 마모', category: '기본', group: 'MC' },
  { id: 'FC_MC_2', value: '설비 고장', category: '기본', group: 'MC' },
  { id: 'FC_MC_3', value: '정비 미흡', category: '기본', group: 'MC' },
  { id: 'FC_IM_1', value: '원자재 불량', category: '기본', group: 'IM' },
  { id: 'FC_IM_2', value: '부자재 불량', category: '기본', group: 'IM' },
  { id: 'FC_EN_1', value: '온도 부적합', category: '기본', group: 'EN' },
  { id: 'FC_EN_2', value: '습도 부적합', category: '기본', group: 'EN' },
  { id: 'FC_EN_3', value: '이물 혼입', category: '기본', group: 'EN' },
];

// 4M 분류: MN(Man,사람) / MC(Machine,설비) / IM(In-Material,부자재) / EN(Environment,환경)
const GROUP_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  MN: { bg: '#ffebee', text: '#d32f2f', label: '사람(Man)' },
  MC: { bg: '#e3f2fd', text: '#1565c0', label: '설비(Machine)' },
  IM: { bg: '#e8f5e9', text: '#2e7d32', label: '부자재(In-Material)' },
  EN: { bg: '#fff3e0', text: '#f57c00', label: '환경(Environment)' },
};

interface FailureCause {
  id: string;
  name: string;
  occurrence?: number;
}

interface FailureCauseSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (causes: FailureCause[]) => void;
  parentName: string;
  parentId: string;
  currentCauses: FailureCause[];
  processName?: string;
  workElementName?: string;
  functionName?: string;
}

export default function FailureCauseSelectModal({
  isOpen,
  onClose,
  onSave,
  parentName,
  processName,
  workElementName,
  functionName,
  currentCauses,
}: FailureCauseSelectModalProps) {
  const [items, setItems] = useState<{ id: string; value: string; category: string; group: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [newValue, setNewValue] = useState('');
  const [newGroup, setNewGroup] = useState('MN');

  useEffect(() => {
    if (!isOpen) return;
    
    let allItems = [...DEFAULT_CAUSES];
    
    currentCauses.forEach((c) => {
      if (!allItems.find(i => i.value === c.name)) {
        allItems.push({ id: c.id, value: c.name, category: '추가', group: 'MN' });
      }
    });
    
    setItems(allItems);
    
    const selected = new Set<string>();
    currentCauses.forEach(c => {
      const found = allItems.find(i => i.value === c.name);
      if (found) selected.add(found.id);
    });
    setSelectedIds(selected);
  }, [isOpen, currentCauses]);

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
    const causes: FailureCause[] = items
      .filter(i => selectedIds.has(i.id))
      .map(i => {
        const existing = currentCauses.find(c => c.name === i.value);
        return existing || { id: i.id, name: i.value };
      });
    onSave(causes);
    onClose();
  };

  const handleDeleteAll = () => {
    if (!confirm('모든 항목을 삭제하시겠습니까?')) return;
    onSave([]);
    onClose();
  };

  const handleAddSave = () => {
    if (!newValue.trim()) return;
    const newItem = { id: `new_${Date.now()}`, value: newValue.trim(), category: '추가', group: newGroup };
    setItems(prev => [...prev, newItem]);
    setSelectedIds(prev => new Set([...prev, newItem.id]));
    setNewValue('');
  };

  const minRows = 10;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-end bg-black/40 pt-36 pr-5" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-[500px] flex flex-col overflow-hidden max-h-[calc(100vh-160px)]" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <div className="flex items-center gap-2">
            <span>🔍</span>
            <h2 className="text-xs font-bold">고장원인(FC) 선택</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">닫기</button>
        </div>

        {/* ===== 상위항목 고정 표시 ===== */}
        <div className="px-3 py-2 border-b bg-gradient-to-r from-red-50 to-orange-50 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-red-700 shrink-0">★ 상위항목:</span>
          {functionName && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-600 font-bold">공정특성:</span>
              <span className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded max-w-[150px] truncate" title={functionName}>{functionName}</span>
            </div>
          )}
          {workElementName && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-600 font-bold">작업요소:</span>
              <span className="px-2 py-1 text-[10px] font-bold bg-purple-600 text-white rounded">{workElementName}</span>
            </div>
          )}
          {processName && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-600 font-bold">공정:</span>
              <span className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded">{processName}</span>
            </div>
          )}
        </div>

        {/* ===== 하위항목 라벨 ===== */}
        <div className="px-3 py-1 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <span className="text-[10px] font-bold text-green-700">▼ 하위항목: 고장원인(FC)</span>
        </div>

        {/* 4M 필터 + 검색 + 버튼 */}
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-2 py-1 text-[10px] font-bold bg-amber-600 text-white rounded border-0 cursor-pointer"
          >
            <option value="All" className="bg-white text-gray-800">All 4M</option>
            <option value="MN" className="bg-white text-gray-800">MN(Man,사람)</option>
            <option value="MC" className="bg-white text-gray-800">MC(Machine,설비)</option>
            <option value="IM" className="bg-white text-gray-800">IM(In-Material,부자재)</option>
            <option value="EN" className="bg-white text-gray-800">EN(Environment,환경)</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 고장원인 검색..."
            className="flex-1 px-2 py-1 text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button onClick={selectAll} className="px-2 py-1 text-[10px] font-bold bg-blue-500 text-white rounded hover:bg-blue-600">전체</button>
          <button onClick={deselectAll} className="px-2 py-1 text-[10px] font-bold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">해제</button>
          <button onClick={handleApply} className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700">적용</button>
          <button onClick={handleDeleteAll} className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded hover:bg-red-600">삭제</button>
        </div>

        {/* 새 항목 입력 */}
        <div className="px-3 py-1.5 border-b bg-green-50 flex items-center gap-1">
          <span className="text-[10px] font-bold text-green-700">+</span>
          <select value={newGroup} onChange={(e) => setNewGroup(e.target.value)} className="px-1 py-0.5 text-[10px] border rounded">
            <option value="MN">MN</option>
            <option value="MC">MC</option>
            <option value="IM">IM</option>
            <option value="EN">EN</option>
          </select>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSave()}
            placeholder="새 고장원인 입력..."
            className="flex-1 px-2 py-0.5 text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button onClick={handleAddSave} disabled={!newValue.trim()} className="px-2 py-0.5 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">저장</button>
        </div>

        {/* 리스트 */}
        <div className="overflow-auto p-2 h-[280px] min-h-[280px]">
          <div className="grid grid-cols-2 gap-1">
            {filteredItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              const isCurrent = currentCauses.some(c => c.name === item.value);
              const groupColor = GROUP_COLORS[item.group] || { bg: '#f5f5f5', text: '#666', label: '기타' };
              
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                    isSelected ? (isCurrent ? 'bg-green-50 border-green-400' : 'bg-amber-50 border-amber-400') : 'bg-white border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected ? (isCurrent ? 'bg-green-500 border-green-500' : 'bg-amber-500 border-amber-500') : 'bg-white border-gray-300'
                  }`}>
                    {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: groupColor.bg, color: groupColor.text }}>{groupColor.label}</span>
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
          <span className="text-xs font-bold text-amber-600">✓ {selectedIds.size}개 선택</span>
        </div>
      </div>
    </div>
  );
}
