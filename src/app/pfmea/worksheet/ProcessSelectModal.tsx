'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';

interface ProcessItem {
  id: string;
  no: string;
  name: string;
}

interface ProcessWithL3Info {
  name: string;
  l3Count: number; // 하위 작업요소 수 (유효한 것만)
}

interface ProcessSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedProcesses: ProcessItem[]) => void;
  onDelete?: (processIds: string[]) => void; // 삭제 콜백
  existingProcessNames?: string[]; // 현재 선택된 공정명들
  existingProcessesInfo?: ProcessWithL3Info[]; // 하위 작업요소 정보
}

// 기초정보에서 공정명 로드 (LocalStorage)
const loadProcessesFromBasicInfo = (): ProcessItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedData = localStorage.getItem('pfmea_master_data');
    if (savedData) {
      const flatData = JSON.parse(savedData);
      const processSet = new Map<string, ProcessItem>();
      
      flatData.forEach((item: any, idx: number) => {
        if (item.code === 'A2' && item.value) {
          const processName = item.value;
          if (!processSet.has(processName)) {
            const no = String((processSet.size + 1) * 10);
            processSet.set(processName, {
              id: `proc_${idx}_${Date.now()}`,
              no,
              name: processName
            });
          }
        }
      });
      
      if (processSet.size > 0) return Array.from(processSet.values());
    }
    
    // 기본 샘플 데이터
    return [
      { id: 'p1', no: '10', name: '자재입고' },
      { id: 'p2', no: '11', name: '가온' },
      { id: 'p3', no: '20', name: '수입검사' },
      { id: 'p4', no: '30', name: '믹싱' },
      { id: 'p5', no: '40', name: '압출' },
      { id: 'p6', no: '50', name: '재단' },
      { id: 'p7', no: '60', name: '비드' },
      { id: 'p8', no: '70', name: '성형' },
      { id: 'p9', no: '80', name: '가류' },
      { id: 'p10', no: '90', name: '검사' },
      { id: 'p11', no: '100', name: '완성검사' },
      { id: 'p12', no: '110', name: '포장' },
      { id: 'p13', no: '120', name: '출하' },
    ];
  } catch (e) {
    console.error('Failed to load processes:', e);
    return [];
  }
};

export default function ProcessSelectModal({ 
  isOpen, 
  onClose, 
  onSave,
  onDelete,
  existingProcessNames = [],
  existingProcessesInfo = []
}: ProcessSelectModalProps) {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadProcessesFromBasicInfo();
      setProcesses(loaded);
      
      // 기존 선택된 공정들을 미리 체크
      const preSelected = new Set<string>();
      loaded.forEach(p => {
        if (existingProcessNames.includes(p.name)) {
          preSelected.add(p.id);
        }
      });
      setSelectedIds(preSelected);
      setSearchTerm('');
    }
  }, [isOpen, existingProcessNames]);

  const filteredProcesses = useMemo(() => {
    return processes.filter(p => 
      (p.no.includes(searchTerm) || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [processes, searchTerm]);
  
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const selectAll = () => setSelectedIds(new Set(filteredProcesses.map(p => p.id)));
  const deselectAll = () => setSelectedIds(new Set());
  
  // 전체 해제 후 바로 저장 (모두 삭제)
  const clearAndSave = () => {
    const totalL3Count = existingProcessesInfo.reduce((sum, p) => sum + p.l3Count, 0);
    const message = `⚠️ 모든 데이터를 삭제하시겠습니까?\n\n` +
      `• 공정: ${existingProcessNames.length}개\n` +
      `• 하위 작업요소: ${totalL3Count}개\n\n` +
      `삭제된 데이터는 복구할 수 없습니다.`;
    
    if (!window.confirm(message)) return;
    onSave([]); // 빈 배열 전달
    onClose();
  };

  const handleSave = () => {
    const selected = processes.filter(p => selectedIds.has(p.id));
    const selectedNames = new Set(selected.map(p => p.name));
    
    // 선택 해제된 공정 중 하위 작업요소가 있는 것 확인
    const removedWithL3 = existingProcessesInfo.filter(p => 
      !selectedNames.has(p.name) && p.l3Count > 0
    );
    
    if (removedWithL3.length > 0) {
      const details = removedWithL3.map(p => `• ${p.name}: ${p.l3Count}개 작업요소`).join('\n');
      const confirmed = window.confirm(
        `⚠️ 선택 해제된 공정에 하위 작업요소가 있습니다.\n\n${details}\n\n이 공정들과 하위 작업요소를 모두 삭제하시겠습니까?`
      );
      if (!confirmed) return;
    }
    
    onSave(selected);
    onClose();
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const selectedNames = processes.filter(p => selectedIds.has(p.id)).map(p => p.name);
    if (!window.confirm(`선택한 ${selectedIds.size}개 공정을 삭제하시겠습니까?\n\n${selectedNames.join(', ')}`)) return;
    
    if (onDelete) {
      onDelete(Array.from(selectedIds));
    }
    setSelectedIds(new Set());
    setDeleteMode(false);
    onClose();
  };

  const handleDeleteSingle = (id: string, name: string) => {
    if (!window.confirm(`"${name}" 공정을 삭제하시겠습니까?`)) return;
    if (onDelete) {
      onDelete([id]);
    }
    onClose();
  };

  const isCurrentlySelected = (name: string) => existingProcessNames.includes(name);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="공정 선택 (다중선택)"
      icon="🏭"
      width="550px"
      onSave={handleSave}
      saveDisabled={selectedIds.size === 0}
      footerContent={
        <span className="text-sm font-bold text-blue-600">
          ✓ {selectedIds.size}개 선택
        </span>
      }
    >
      {/* 검색 및 컨트롤 */}
      <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50/50">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="공정명 또는 번호 검색..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={selectAll} 
            className="px-3 py-2 text-xs font-bold bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-sm transition-colors whitespace-nowrap"
          >
            전체선택
          </button>
          <button 
            onClick={deselectAll} 
            className="px-3 py-2 text-xs font-bold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-sm transition-colors whitespace-nowrap"
          >
            해제
          </button>
          <button 
            onClick={clearAndSave} 
            className="px-3 py-2 text-xs font-bold bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm transition-colors whitespace-nowrap"
          >
            🗑️ 모두삭제
          </button>
        </div>
      </div>
      
      {/* 삭제 모드 안내 */}
      {deleteMode && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between">
          <span className="text-xs text-red-700 font-medium">🗑️ 삭제할 공정을 선택하세요</span>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              selectedIds.size > 0 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            선택 삭제 ({selectedIds.size}개)
          </button>
        </div>
      )}

      {/* 리스트 그리드 */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50/20">
        {filteredProcesses.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
            <span className="text-4xl mb-4">🏭</span>
            <p className="font-medium">등록된 공정이 없거나 검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProcesses.map(proc => {
              const isSelected = selectedIds.has(proc.id);
              const isCurrent = isCurrentlySelected(proc.name);
              
              return (
                <div 
                  key={proc.id}
                  onClick={() => toggleSelect(proc.id)}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm group ${
                    isSelected 
                      ? isCurrent 
                        ? 'bg-green-50 border-green-400 ring-1 ring-green-400' 
                        : 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {/* 체크박스 */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? isCurrent ? 'bg-green-500 border-green-500' : 'bg-blue-500 border-blue-500' 
                      : 'bg-white border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>

                  {/* 공정번호 배지 */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-inner shrink-0 ${
                    isCurrent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {proc.no}
                  </span>

                  {/* 이름 */}
                  <span className={`flex-1 text-sm truncate font-medium ${
                    isSelected ? (isCurrent ? 'text-green-900' : 'text-blue-900') : 'text-gray-700'
                  }`}>
                    {proc.name}
                    {isCurrent && <span className="ml-1 text-[9px] font-normal text-green-600">(현재)</span>}
                  </span>
                  
                  {/* 개별 삭제 버튼 (현재 선택된 것만) */}
                  {isCurrent && (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        // 해당 공정의 하위 작업요소 수 확인
                        const procInfo = existingProcessesInfo.find(p => p.name === proc.name);
                        const l3Count = procInfo?.l3Count || 0;
                        
                        const message = l3Count > 0
                          ? `⚠️ 공정과 하위 작업요소를 모두 삭제하시겠습니까?\n\n` +
                            `• 공정: ${proc.name}\n` +
                            `• 하위 작업요소: ${l3Count}개\n\n` +
                            `삭제된 데이터는 복구할 수 없습니다.`
                          : `"${proc.name}" 공정을 삭제하시겠습니까?`;
                        
                        if (!window.confirm(message)) return;
                        // 해당 항목 선택 해제 후 저장
                        const newSelectedIds = new Set(selectedIds);
                        newSelectedIds.delete(proc.id);
                        const selected = processes.filter(p => newSelectedIds.has(p.id));
                        onSave(selected);
                        onClose();
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-full transition-colors font-bold"
                      title="이 공정 삭제"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
