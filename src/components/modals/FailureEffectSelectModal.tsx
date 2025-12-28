/**
 * @file FailureEffectSelectModal.tsx
 * @description 고장영향(FE) 선택 모달 - 상위 항목(요구사항) 고정 연결
 * 
 * FMEA 논리 구조:
 * 요구사항 → 고장영향(FE) → 심각도(S) [1:N 연결]
 * 모달에서 상위 요구사항이 고정되고, 해당 요구사항에 연결된 고장영향만 선택/추가
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';

// 기본 고장영향 옵션 (구분별)
const DEFAULT_FAILURE_EFFECTS = [
  // Your Plant (사내)
  { id: 'FE_YP_1', value: '생산 지연', category: '기본', group: 'Your Plant' },
  { id: 'FE_YP_2', value: '재작업/폐기', category: '기본', group: 'Your Plant' },
  { id: 'FE_YP_3', value: '공정 정지', category: '기본', group: 'Your Plant' },
  { id: 'FE_YP_4', value: '설비 손상', category: '기본', group: 'Your Plant' },
  { id: 'FE_YP_5', value: '품질 비용 증가', category: '기본', group: 'Your Plant' },
  // Ship to Plant (고객사)
  { id: 'FE_SP_1', value: '조립 불가', category: '기본', group: 'Ship to Plant' },
  { id: 'FE_SP_2', value: '라인 정지', category: '기본', group: 'Ship to Plant' },
  { id: 'FE_SP_3', value: '외관 불량', category: '기본', group: 'Ship to Plant' },
  { id: 'FE_SP_4', value: '치수 불량', category: '기본', group: 'Ship to Plant' },
  { id: 'FE_SP_5', value: '반품/클레임', category: '기본', group: 'Ship to Plant' },
  // User (최종 사용자)
  { id: 'FE_U_1', value: '차량 정지 (안전)', category: '기본', group: 'User' },
  { id: 'FE_U_2', value: '기능 작동 불능', category: '기본', group: 'User' },
  { id: 'FE_U_3', value: '성능 저하', category: '기본', group: 'User' },
  { id: 'FE_U_4', value: '소음/진동 발생', category: '기본', group: 'User' },
  { id: 'FE_U_5', value: '내구성 저하', category: '기본', group: 'User' },
  { id: 'FE_U_6', value: '승차감 저하', category: '기본', group: 'User' },
];

const GROUP_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'Your Plant': { label: 'Your Plant', color: '#2e7d32', bg: '#e8f5e9' },
  'Ship to Plant': { label: 'Ship to Plant', color: '#e65100', bg: '#fff3e0' },
  'User': { label: 'User', color: '#c2185b', bg: '#fce4ec' },
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
  // 상위 항목 (고정 표시)
  parentType: string; // 구분 (Your Plant / Ship to Plant / User)
  parentReqName: string; // 요구사항명
  parentReqId: string;
  parentFuncName?: string; // 완제품 기능명
  // 현재 연결된 고장영향
  currentEffects: FailureEffect[];
  // 추가 컨텍스트
  productName?: string;
}

export default function FailureEffectSelectModal({
  isOpen,
  onClose,
  onSave,
  parentType,
  parentReqName,
  parentReqId,
  parentFuncName,
  currentEffects,
  productName,
}: FailureEffectSelectModalProps) {
  const [selectedEffects, setSelectedEffects] = useState<Set<string>>(new Set());
  const [newValue, setNewValue] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [customEffects, setCustomEffects] = useState<{ id: string; value: string; category: string; group: string }[]>([]);

  // 모든 옵션 (기본 + 사용자 추가)
  const allOptions = useMemo(() => {
    return [...DEFAULT_FAILURE_EFFECTS, ...customEffects];
  }, [customEffects]);

  // 필터링된 옵션
  const filteredOptions = useMemo(() => {
    let result = allOptions;
    
    // 그룹 필터
    if (groupFilter !== 'all') {
      result = result.filter(opt => opt.group === groupFilter);
    }
    
    // 검색 필터
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(opt => opt.value.toLowerCase().includes(q));
    }
    
    return result;
  }, [allOptions, search, groupFilter]);

  // 초기화
  useEffect(() => {
    if (isOpen) {
      const currentNames = new Set(currentEffects.map(e => e.effect));
      setSelectedEffects(currentNames);
      
      // 사용자 추가 항목 복원
      const customItems = currentEffects
        .filter(e => !DEFAULT_FAILURE_EFFECTS.find(d => d.value === e.effect))
        .map(e => ({ id: e.id, value: e.effect, category: '추가', group: parentType }));
      setCustomEffects(customItems);
      
      // 기본 필터를 상위 구분으로 설정
      if (parentType && GROUP_LABELS[parentType]) {
        setGroupFilter(parentType);
      }
    }
  }, [isOpen, currentEffects, parentType]);

  const toggleSelect = useCallback((value: string) => {
    setSelectedEffects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(value)) newSet.delete(value);
      else newSet.add(value);
      return newSet;
    });
  }, []);

  const handleAddNew = useCallback(() => {
    if (!newValue.trim()) return;
    const trimmed = newValue.trim();
    
    if (allOptions.find(o => o.value === trimmed)) {
      alert('이미 존재하는 항목입니다.');
      return;
    }
    
    const newItem = { id: `custom_${Date.now()}`, value: trimmed, category: '추가', group: parentType };
    setCustomEffects(prev => [...prev, newItem]);
    setSelectedEffects(prev => new Set([...prev, trimmed]));
    setNewValue('');
  }, [newValue, allOptions, parentType]);

  const handleSave = useCallback(() => {
    const effects: FailureEffect[] = [];
    
    selectedEffects.forEach(name => {
      const existing = currentEffects.find(e => e.effect === name);
      if (existing) {
        effects.push(existing);
      } else {
        effects.push({ id: `fe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, effect: name });
      }
    });
    
    onSave(effects);
    onClose();
  }, [selectedEffects, currentEffects, onSave, onClose]);

  const selectAll = () => setSelectedEffects(new Set(filteredOptions.map(o => o.value)));
  const deselectAll = () => setSelectedEffects(new Set());

  const parentColor = GROUP_LABELS[parentType]?.color || '#1976d2';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`고장영향(FE) 선택`}
      icon="💥"
      width="700px"
      tabs={[
        { id: 'list', label: '목록에서 선택', icon: '📋' },
        { id: 'manual', label: '직접 입력', icon: '✏️' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      saveDisabled={selectedEffects.size === 0}
      footerContent={
        <span className="text-sm font-bold text-blue-600">
          ✓ {selectedEffects.size}개 선택
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
            연결된 요구사항 (고정)
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {productName && (
            <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm">
              📦 {productName}
            </span>
          )}
          <span 
            className="px-3 py-1.5 text-white text-sm font-bold rounded-lg shadow-sm"
            style={{ background: parentColor }}
          >
            📂 {parentType}
          </span>
          {parentFuncName && (
            <span className="px-3 py-1.5 bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm">
              ⚙️ {parentFuncName}
            </span>
          )}
          <span 
            className="px-4 py-2 text-white text-sm font-bold rounded-lg shadow-md"
            style={{ background: '#1976d2' }}
          >
            🏷️ {parentReqName}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2 italic">
          * 위 요구사항에 연결될 고장영향을 선택하세요. 고장영향은 이 요구사항의 하위 항목으로 저장됩니다.
        </p>
      </div>

      {activeTab === 'list' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 구분 필터 탭 */}
          <div className="flex border-b bg-gray-50/30 shrink-0 overflow-x-auto">
            <button
              onClick={() => setGroupFilter('all')}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                groupFilter === 'all' 
                  ? 'bg-white border-blue-500 text-blue-600' 
                  : 'text-gray-500 border-transparent hover:bg-gray-100'
              }`}
            >
              전체 ({allOptions.length})
            </button>
            {Object.entries(GROUP_LABELS).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => setGroupFilter(key)}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  groupFilter === key 
                    ? 'bg-white border-current' 
                    : 'text-gray-500 border-transparent hover:bg-gray-100'
                }`}
                style={{ borderColor: groupFilter === key ? color : 'transparent', color: groupFilter === key ? color : undefined }}
              >
                {label} ({allOptions.filter(o => o.group === key).length})
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
                placeholder="고장영향 검색..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <div className="flex gap-1">
              <button onClick={selectAll} className="px-3 py-2 text-xs font-bold bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm transition-colors">전체선택</button>
              <button onClick={deselectAll} className="px-3 py-2 text-xs font-bold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-sm transition-colors">해제</button>
            </div>
          </div>

          {/* 고장영향 그리드 */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50/20">
            <div className="grid grid-cols-2 gap-3">
              {filteredOptions.map(opt => {
                const isSelected = selectedEffects.has(opt.value);
                const isCurrent = currentEffects.some(e => e.effect === opt.value);
                const groupInfo = GROUP_LABELS[opt.group] || { label: '기타', color: '#666', bg: '#f5f5f5' };
                
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

                    {/* 그룹 배지 */}
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: groupInfo.bg, color: groupInfo.color, border: `1px solid ${groupInfo.color}40` }}
                    >
                      {groupInfo.label === 'Your Plant' ? 'YP' : groupInfo.label === 'Ship to Plant' ? 'SP' : 'U'}
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
              <span className="text-red-500">➕</span> 새 고장영향 등록
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newValue.trim()) handleAddNew(); }}
                placeholder="새로운 고장영향을 입력하세요..."
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
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">추가된 항목 ({customEffects.length})</h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {customEffects.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">추가</span>
                  <span className="flex-1 text-sm text-gray-700">{item.value}</span>
                  <button
                    onClick={() => {
                      setCustomEffects(prev => prev.filter(e => e.id !== item.id));
                      setSelectedEffects(prev => {
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

