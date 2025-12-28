/**
 * @file FailureCauseSelectModal.tsx
 * @description 고장원인(FC) 선택 모달 - 상위 항목(공정특성) 고정 연결
 * 
 * FMEA 논리 구조:
 * 공정특성 → 고장원인 (1:N 연결)
 * 모달에서 상위 공정특성이 고정되고, 해당 특성에 연결된 고장원인만 선택/추가
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';

// 기본 고장원인 옵션 (4M+1E 분류)
const DEFAULT_FAILURE_CAUSES = [
  // 사람(Man)
  { id: 'FC_MN_1', value: '작업자 실수', category: '기본', group: 'MN' },
  { id: 'FC_MN_2', value: '교육 미흡', category: '기본', group: 'MN' },
  { id: 'FC_MN_3', value: '숙련도 부족', category: '기본', group: 'MN' },
  { id: 'FC_MN_4', value: '작업표준 미준수', category: '기본', group: 'MN' },
  { id: 'FC_MN_5', value: '피로/부주의', category: '기본', group: 'MN' },
  // 설비(Machine)
  { id: 'FC_MC_1', value: '설비 마모', category: '기본', group: 'MC' },
  { id: 'FC_MC_2', value: '설비 고장', category: '기본', group: 'MC' },
  { id: 'FC_MC_3', value: '정비 미흡', category: '기본', group: 'MC' },
  { id: 'FC_MC_4', value: '설정값 오류', category: '기본', group: 'MC' },
  { id: 'FC_MC_5', value: '지그/치구 불량', category: '기본', group: 'MC' },
  // 자재(Material)
  { id: 'FC_IM_1', value: '원자재 불량', category: '기본', group: 'IM' },
  { id: 'FC_IM_2', value: '부자재 불량', category: '기본', group: 'IM' },
  { id: 'FC_IM_3', value: '자재 혼입', category: '기본', group: 'IM' },
  { id: 'FC_IM_4', value: '자재 변질', category: '기본', group: 'IM' },
  // 방법(Method)
  { id: 'FC_MT_1', value: '작업방법 부적합', category: '기본', group: 'MT' },
  { id: 'FC_MT_2', value: '검사방법 부적합', category: '기본', group: 'MT' },
  { id: 'FC_MT_3', value: '표준 미비', category: '기본', group: 'MT' },
  // 환경(Environment)
  { id: 'FC_EN_1', value: '온도 부적합', category: '기본', group: 'EN' },
  { id: 'FC_EN_2', value: '습도 부적합', category: '기본', group: 'EN' },
  { id: 'FC_EN_3', value: '이물 혼입', category: '기본', group: 'EN' },
  { id: 'FC_EN_4', value: '조명 불량', category: '기본', group: 'EN' },
];

const GROUP_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  MN: { label: '사람', color: '#d32f2f', bg: '#ffebee' },
  MC: { label: '설비', color: '#1565c0', bg: '#e3f2fd' },
  IM: { label: '자재', color: '#2e7d32', bg: '#e8f5e9' },
  MT: { label: '방법', color: '#7b1fa2', bg: '#f3e5f5' },
  EN: { label: '환경', color: '#f57c00', bg: '#fff3e0' },
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
  // 상위 항목 (고정 표시)
  parentName: string; // 공정특성명
  parentId: string;
  // 현재 연결된 고장원인
  currentCauses: FailureCause[];
  // 추가 컨텍스트
  processName?: string;
  workElementName?: string;
  functionName?: string;
}

export default function FailureCauseSelectModal({
  isOpen,
  onClose,
  onSave,
  parentName,
  parentId,
  currentCauses,
  processName,
  workElementName,
  functionName,
}: FailureCauseSelectModalProps) {
  const [selectedCauses, setSelectedCauses] = useState<Set<string>>(new Set());
  const [newValue, setNewValue] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [customCauses, setCustomCauses] = useState<{ id: string; value: string; category: string; group: string }[]>([]);

  // 모든 옵션 (기본 + 사용자 추가)
  const allOptions = useMemo(() => {
    return [...DEFAULT_FAILURE_CAUSES, ...customCauses];
  }, [customCauses]);

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
      const currentNames = new Set(currentCauses.map(c => c.name));
      setSelectedCauses(currentNames);
      
      // 사용자 추가 항목 복원
      const customItems = currentCauses
        .filter(c => !DEFAULT_FAILURE_CAUSES.find(d => d.value === c.name))
        .map(c => ({ id: c.id, value: c.name, category: '추가', group: 'custom' }));
      setCustomCauses(customItems);
    }
  }, [isOpen, currentCauses]);

  const toggleSelect = useCallback((value: string) => {
    setSelectedCauses(prev => {
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
    
    const newItem = { id: `custom_${Date.now()}`, value: trimmed, category: '추가', group: 'custom' };
    setCustomCauses(prev => [...prev, newItem]);
    setSelectedCauses(prev => new Set([...prev, trimmed]));
    setNewValue('');
  }, [newValue, allOptions]);

  const handleSave = useCallback(() => {
    const causes: FailureCause[] = [];
    
    selectedCauses.forEach(name => {
      const existing = currentCauses.find(c => c.name === name);
      if (existing) {
        causes.push(existing);
      } else {
        causes.push({ id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name });
      }
    });
    
    onSave(causes);
    onClose();
  }, [selectedCauses, currentCauses, onSave, onClose]);

  const selectAll = () => setSelectedCauses(new Set(filteredOptions.map(o => o.value)));
  const deselectAll = () => setSelectedCauses(new Set());

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`고장원인(FC) 선택`}
      icon="🔍"
      width="700px"
      tabs={[
        { id: 'list', label: '목록에서 선택', icon: '📋' },
        { id: 'manual', label: '직접 입력', icon: '✏️' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      saveDisabled={selectedCauses.size === 0}
      footerContent={
        <span className="text-sm font-bold text-blue-600">
          ✓ {selectedCauses.size}개 선택
        </span>
      }
    >
      {/* 상위 항목 고정 표시 영역 */}
      <div 
        className="px-4 py-3 border-b-2 shrink-0"
        style={{ 
          background: 'linear-gradient(135deg, #1565c015, #1565c008)',
          borderColor: '#1565c0'
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔗</span>
          <span className="text-sm font-bold text-blue-800">
            연결된 공정특성 (고정)
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {processName && (
            <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm">
              📦 {processName}
            </span>
          )}
          {workElementName && (
            <span className="px-3 py-1.5 bg-purple-600 text-white text-sm font-bold rounded-lg shadow-sm">
              🔧 {workElementName}
            </span>
          )}
          {functionName && (
            <span className="px-3 py-1.5 bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm">
              ⚙️ {functionName}
            </span>
          )}
          <span className="px-4 py-2 bg-blue-800 text-white text-sm font-bold rounded-lg shadow-md">
            🏷️ {parentName}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2 italic">
          * 위 공정특성에 연결될 고장원인을 선택하세요. 고장원인은 이 특성의 하위 항목으로 저장됩니다.
        </p>
      </div>

      {activeTab === 'list' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 4M+1E 필터 탭 */}
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
                placeholder="고장원인 검색..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <div className="flex gap-1">
              <button onClick={selectAll} className="px-3 py-2 text-xs font-bold bg-orange-500 text-white rounded-md hover:bg-orange-600 shadow-sm transition-colors">전체선택</button>
              <button onClick={deselectAll} className="px-3 py-2 text-xs font-bold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-sm transition-colors">해제</button>
            </div>
          </div>

          {/* 고장원인 그리드 */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50/20">
            <div className="grid grid-cols-2 gap-3">
              {filteredOptions.map(opt => {
                const isSelected = selectedCauses.has(opt.value);
                const isCurrent = currentCauses.some(c => c.name === opt.value);
                const groupInfo = GROUP_LABELS[opt.group] || { label: '기타', color: '#666', bg: '#f5f5f5' };
                
                return (
                  <div 
                    key={opt.id}
                    onClick={() => toggleSelect(opt.value)}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm group ${
                      isSelected 
                        ? isCurrent 
                          ? 'bg-green-50 border-green-400 ring-1 ring-green-400' 
                          : 'bg-orange-50 border-orange-400 ring-1 ring-orange-400'
                        : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    {/* 체크박스 */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                      isSelected 
                        ? isCurrent ? 'bg-green-500 border-green-500' : 'bg-orange-500 border-orange-500' 
                        : 'bg-white border-gray-300 group-hover:border-orange-400'
                    }`}>
                      {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>

                    {/* 그룹 배지 */}
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: groupInfo.bg, color: groupInfo.color, border: `1px solid ${groupInfo.color}40` }}
                    >
                      {groupInfo.label}
                    </span>

                    {/* 이름 */}
                    <span className={`flex-1 text-sm truncate font-medium ${
                      isSelected ? (isCurrent ? 'text-green-900' : 'text-orange-900') : 'text-gray-700'
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
              <span className="text-orange-500">➕</span> 새 고장원인 등록
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newValue.trim()) handleAddNew(); }}
                placeholder="새로운 고장원인을 입력하세요..."
                className="flex-1 px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
              />
              <button
                onClick={handleAddNew}
                disabled={!newValue.trim()}
                className="px-6 py-2.5 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-md transition-all disabled:bg-gray-200 active:scale-95"
              >
                추가
              </button>
            </div>
          </div>

          {/* 입력된 항목 표시 */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">추가된 항목 ({customCauses.length})</h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {customCauses.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">추가</span>
                  <span className="flex-1 text-sm text-gray-700">{item.value}</span>
                  <button
                    onClick={() => {
                      setCustomCauses(prev => prev.filter(c => c.id !== item.id));
                      setSelectedCauses(prev => {
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

