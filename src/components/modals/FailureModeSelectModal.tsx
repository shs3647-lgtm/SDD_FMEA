/**
 * @file FailureModeSelectModal.tsx
 * @description 고장형태(FM) 선택 모달 - 상위 항목(제품특성) 고정 연결
 * 
 * FMEA 논리 구조:
 * 제품특성 → 고장형태 (1:N 연결)
 * 모달에서 상위 제품특성이 고정되고, 해당 특성에 연결된 고장형태만 선택/추가
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';

// 기본 고장형태 옵션
const DEFAULT_FAILURE_MODES = [
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

interface FailureMode {
  id: string;
  name: string;
}

interface FailureModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modes: FailureMode[]) => void;
  // 상위 항목 (고정 표시)
  parentType: 'productChar' | 'processChar';
  parentName: string; // 제품특성명 또는 공정특성명
  parentId: string;
  // 현재 연결된 고장형태
  currentModes: FailureMode[];
  // 추가 컨텍스트
  processName?: string;
  functionName?: string;
}

export default function FailureModeSelectModal({
  isOpen,
  onClose,
  onSave,
  parentType,
  parentName,
  parentId,
  currentModes,
  processName,
  functionName,
}: FailureModeSelectModalProps) {
  const [selectedModes, setSelectedModes] = useState<Set<string>>(new Set());
  const [newValue, setNewValue] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [customModes, setCustomModes] = useState<{ id: string; value: string; category: string }[]>([]);

  // 모든 옵션 (기본 + 사용자 추가)
  const allOptions = useMemo(() => {
    return [...DEFAULT_FAILURE_MODES, ...customModes];
  }, [customModes]);

  // 필터링된 옵션
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return allOptions;
    const q = search.toLowerCase();
    return allOptions.filter(opt => opt.value.toLowerCase().includes(q));
  }, [allOptions, search]);

  // 초기화 - 현재 선택된 항목 설정
  useEffect(() => {
    if (isOpen) {
      const currentNames = new Set(currentModes.map(m => m.name));
      setSelectedModes(currentNames);
      
      // 사용자 추가 항목 복원
      const customItems = currentModes
        .filter(m => !DEFAULT_FAILURE_MODES.find(d => d.value === m.name))
        .map(m => ({ id: m.id, value: m.name, category: '추가' }));
      setCustomModes(customItems);
    }
  }, [isOpen, currentModes]);

  const toggleSelect = useCallback((value: string) => {
    setSelectedModes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(value)) newSet.delete(value);
      else newSet.add(value);
      return newSet;
    });
  }, []);

  const handleAddNew = useCallback(() => {
    if (!newValue.trim()) return;
    const trimmed = newValue.trim();
    
    // 중복 체크
    if (allOptions.find(o => o.value === trimmed)) {
      alert('이미 존재하는 항목입니다.');
      return;
    }
    
    // 추가
    const newItem = { id: `custom_${Date.now()}`, value: trimmed, category: '추가' };
    setCustomModes(prev => [...prev, newItem]);
    setSelectedModes(prev => new Set([...prev, trimmed]));
    setNewValue('');
  }, [newValue, allOptions]);

  const handleSave = useCallback(() => {
    const modes: FailureMode[] = [];
    
    selectedModes.forEach(name => {
      const existing = currentModes.find(m => m.name === name);
      if (existing) {
        modes.push(existing);
      } else {
        modes.push({ id: `fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name });
      }
    });
    
    onSave(modes);
    onClose();
  }, [selectedModes, currentModes, onSave, onClose]);

  const selectAll = () => setSelectedModes(new Set(filteredOptions.map(o => o.value)));
  const deselectAll = () => setSelectedModes(new Set());
  
  // 모두 삭제 후 저장
  const clearAndSave = () => {
    if (!window.confirm('모든 고장형태를 삭제하시겠습니까?')) return;
    onSave([]);
    onClose();
  };

  const parentLabel = parentType === 'productChar' ? '제품특성' : '공정특성';
  const parentColor = parentType === 'productChar' ? '#1b5e20' : '#1565c0';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`고장형태(FM) 선택`}
      icon="⚠️"
      width="650px"
      tabs={[
        { id: 'list', label: '목록에서 선택', icon: '📋' },
        { id: 'manual', label: '직접 입력', icon: '✏️' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      saveDisabled={selectedModes.size === 0}
      footerContent={
        <span className="text-sm font-bold text-blue-600">
          ✓ {selectedModes.size}개 선택
        </span>
      }
    >
      {/* 상위 항목 고정 표시 영역 */}
      <div 
        className="px-4 py-3 border-b-2 shrink-0"
        style={{ 
          background: `linear-gradient(135deg, ${parentColor}15, ${parentColor}08)`,
          borderColor: parentColor 
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔗</span>
          <span className="text-sm font-bold" style={{ color: parentColor }}>
            연결된 {parentLabel} (고정)
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {processName && (
            <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm">
              📦 {processName}
            </span>
          )}
          {functionName && (
            <span className="px-3 py-1.5 bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm">
              ⚙️ {functionName}
            </span>
          )}
          <span 
            className="px-4 py-2 text-white text-sm font-bold rounded-lg shadow-md"
            style={{ background: parentColor }}
          >
            🏷️ {parentName}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2 italic">
          * 위 {parentLabel}에 연결될 고장형태를 선택하세요. 고장형태는 이 특성의 하위 항목으로 저장됩니다.
        </p>
      </div>

      {activeTab === 'list' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 검색 및 버튼 */}
          <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50/50 shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="고장형태 검색..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <div className="flex gap-1">
              <button onClick={selectAll} className="px-3 py-2 text-xs font-bold bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm transition-colors">전체선택</button>
              <button onClick={deselectAll} className="px-3 py-2 text-xs font-bold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-sm transition-colors">해제</button>
              <button onClick={clearAndSave} className="px-3 py-2 text-xs font-bold bg-red-700 text-white rounded-md hover:bg-red-800 shadow-sm transition-colors">🗑️ 모두삭제</button>
            </div>
          </div>

          {/* 고장형태 그리드 */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50/20">
            <div className="grid grid-cols-2 gap-3">
              {filteredOptions.map(opt => {
                const isSelected = selectedModes.has(opt.value);
                const isCurrent = currentModes.some(m => m.name === opt.value);
                
                return (
                  <div 
                    key={opt.id}
                    onClick={() => toggleSelect(opt.value)}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm group ${
                      isSelected 
                        ? isCurrent 
                          ? 'bg-green-50 border-green-400 ring-1 ring-green-400' 
                          : 'bg-red-50 border-red-400 ring-1 ring-red-400'
                        : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-md'
                    }`}
                  >
                    {/* 체크박스 */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                      isSelected 
                        ? isCurrent ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500' 
                        : 'bg-white border-gray-300 group-hover:border-red-400'
                    }`}>
                      {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>

                    {/* 카테고리 배지 */}
                    <span 
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-inner shrink-0 ${
                        opt.category === '추가' 
                          ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {opt.category}
                    </span>

                    {/* 이름 */}
                    <span className={`flex-1 text-sm truncate font-medium ${
                      isSelected ? (isCurrent ? 'text-green-900' : 'text-red-900') : 'text-gray-700'
                    }`}>
                      {opt.value}
                      {isCurrent && <span className="ml-1 text-[9px] font-normal text-green-600">(현재)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col flex-1 bg-gray-50/20">
          <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-red-500">➕</span> 새 고장형태 등록
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newValue.trim()) handleAddNew(); }}
                placeholder="새로운 고장형태를 입력하세요..."
                className="flex-1 px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 outline-none shadow-sm"
              />
              <button
                onClick={handleAddNew}
                disabled={!newValue.trim()}
                className="px-6 py-2.5 text-sm font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all disabled:bg-gray-200 active:scale-95"
              >
                추가
              </button>
            </div>
          </div>

          {/* 입력된 항목 표시 */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">추가된 항목 ({customModes.length})</h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {customModes.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">추가</span>
                  <span className="flex-1 text-sm text-gray-700">{item.value}</span>
                  <button
                    onClick={() => {
                      setCustomModes(prev => prev.filter(m => m.id !== item.id));
                      setSelectedModes(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(item.value);
                        return newSet;
                      });
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

