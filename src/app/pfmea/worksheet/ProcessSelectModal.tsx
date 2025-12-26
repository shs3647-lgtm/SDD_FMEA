'use client';

import React, { useState, useEffect } from 'react';

interface ProcessItem {
  id: string;
  no: string;
  name: string;
}

interface ProcessSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedProcesses: ProcessItem[]) => void;
  existingProcessNames?: string[]; // 현재 선택된 공정명들
}

// 기초정보에서 공정명 로드 (LocalStorage)
const loadProcessesFromBasicInfo = (): ProcessItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedData = localStorage.getItem('pfmea-flat-data');
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
  existingProcessNames = []
}: ProcessSelectModalProps) {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredProcesses = processes.filter(p => 
    (p.no.includes(searchTerm) || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // 현재 선택된 공정인지 확인
  const isCurrentlySelected = (name: string) => existingProcessNames.includes(name);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredProcesses.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = () => {
    const selected = processes.filter(p => selectedIds.has(p.id));
    onSave(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[70vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: '#2b78c5' }}>
          <h2 className="text-white font-bold text-sm">🏭 공정 선택 (다중선택)</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded px-2 py-1 text-lg">✕</button>
        </div>

        {/* 검색 + 버튼 */}
        <div className="px-4 py-2 border-b flex items-center gap-2 bg-gray-50">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색..."
            className="flex-1 px-3 py-2 text-sm border rounded"
          />
          <button 
            onClick={selectAll}
            className="px-3 py-2 text-xs font-bold bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
          >
            전체선택
          </button>
          <button 
            onClick={deselectAll}
            className="px-3 py-2 text-xs font-bold bg-gray-400 text-white rounded hover:bg-gray-500 whitespace-nowrap"
          >
            해제
          </button>
        </div>

        {/* 공정 목록 - 그리드 형태 */}
        <div className="flex-1 overflow-auto p-4">
          {filteredProcesses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {processes.length === 0 ? '등록된 공정이 없습니다.' : '검색 결과가 없습니다.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredProcesses.map(proc => {
                const isCurrent = isCurrentlySelected(proc.name);
                return (
                  <div 
                    key={proc.id}
                    onClick={() => toggleSelect(proc.id)}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                      selectedIds.has(proc.id) 
                        ? isCurrent 
                          ? 'bg-green-100 border-green-400' 
                          : 'bg-blue-100 border-blue-400' 
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* 체크박스 네모 */}
                    <div 
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                        selectedIds.has(proc.id) 
                          ? isCurrent 
                            ? 'bg-green-500 border-green-500'
                            : 'bg-blue-500 border-blue-500' 
                          : 'bg-white border-gray-400'
                      }`}
                    >
                      {selectedIds.has(proc.id) && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </div>
                    {/* 공정번호 + 공정명 (한줄) */}
                    <span className="text-sm font-medium truncate">
                      {proc.no} {proc.name}
                      {isCurrent && <span className="ml-1 text-[10px] text-green-600">(현재)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-600 font-bold">
            ✓ {selectedIds.size}개 선택
          </span>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold border rounded hover:bg-gray-100"
            >
              취소
            </button>
            <button 
              onClick={handleSave}
              disabled={selectedIds.size === 0}
              className="px-6 py-2 text-sm font-bold bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
