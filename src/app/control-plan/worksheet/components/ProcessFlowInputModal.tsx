/**
 * @file ProcessFlowInputModal.tsx
 * @description CP 공정명 입력 모달 - PFMEA ProcessSelectModal 벤치마킹
 * @version 1.0.0
 * @updated 2026-01-14
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface ProcessItem {
  id: string;
  no: string;
  name: string;
}

interface ProcessFlowInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedProcesses: ProcessItem[]) => void;
  onDelete?: (processIds: string[]) => void;
  existingProcessNames?: string[];
  // 연속입력 모드: 저장 시 워크시트에 즉시 반영 + 새 행 추가
  onContinuousAdd?: (process: ProcessItem, addNewRow: boolean) => void;
  // 현재 행 인덱스 (자동 입력 모드용)
  currentRowIdx?: number;
}

// DB에서 CP 마스터 공정 로드 (우선순위 1 - PUBLIC DB)
const loadMasterProcessesFromDB = async (): Promise<ProcessItem[]> => {
  try {
    // CP 마스터 공정 데이터 조회 (PFMEA와 동일한 구조)
    const res = await fetch('/api/control-plan/master-processes');
    if (res.ok) {
      const data = await res.json();
      if (data.processes && data.processes.length > 0) {
        console.log('✅ DB에서 CP 마스터 공정 로드:', data.processes.length, '개');
        return data.processes;
      }
    }
  } catch (e) {
    console.error('CP 마스터 공정 로드 실패:', e);
  }
  return [];
};

// 기초정보에서 공정명 로드 (localStorage 폴백, 우선순위 2 - 임시 백업용)
const loadProcessesFromBasicInfo = (): ProcessItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    // CP 마스터 데이터 (임시 백업용)
    const cpMasterData = localStorage.getItem('cp_master_data');
    if (cpMasterData) {
      const flatData = JSON.parse(cpMasterData);
      const processSet = new Map<string, ProcessItem>();
      
      flatData.forEach((item: any, idx: number) => {
        if (item.itemCode === 'A2' && item.value) {
          const processName = item.value.trim();
          if (!processSet.has(processName)) {
            const no = item.processNo || String((processSet.size + 1) * 10);
            processSet.set(processName, {
              id: `cp_proc_${idx}_${Date.now()}`,
              no,
              name: processName
            });
          }
        }
      });
      
      if (processSet.size > 0) {
        console.log('⚠️ localStorage에서 CP 마스터 공정 로드 (임시 백업):', processSet.size, '개');
        return Array.from(processSet.values());
      }
    }
    
    return [];
  } catch (e) {
    console.error('Failed to load processes:', e);
    return [];
  }
};

export default function ProcessFlowInputModal({ 
  isOpen, 
  onClose, 
  onSave,
  onDelete,
  existingProcessNames = [],
  onContinuousAdd,
  currentRowIdx,
}: ProcessFlowInputModalProps) {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newNo, setNewNo] = useState('');
  const [newName, setNewName] = useState('');

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<string>('');
  
  // ✅ 연속입력 모드 상태
  const [continuousMode, setContinuousMode] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  
  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ top: 200, right: 350 });

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // 드래그 중
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setModalPosition(prev => ({
        top: Math.max(0, Math.min(window.innerHeight - 200, prev.top + deltaY)),
        right: Math.max(0, Math.min(window.innerWidth - 350, prev.right - deltaX))
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 모달이 열릴 때 위치 초기화 (우측 350px)
  useEffect(() => {
    if (isOpen) {
      setModalPosition({ top: 200, right: 350 });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setDataSource('');
      
      // DB에서 마스터 공정 로드 (우선순위 1: PUBLIC DB), 없으면 localStorage 폴백 (임시 백업용)
      const loadData = async () => {
        console.log('🔄 CP 공정 데이터 로드 시작... (PUBLIC DB 우선)');
        
        let loaded = await loadMasterProcessesFromDB();
        
        if (loaded.length > 0) {
          setDataSource('CP Master (PUBLIC DB)');
          console.log('✅ CP 마스터 공정 사용 (PUBLIC DB):', loaded.length, '개');
        } else {
          // DB에 없으면 localStorage에서 로드 (임시 백업용)
          loaded = loadProcessesFromBasicInfo();
          if (loaded.length > 0) {
            setDataSource('localStorage (임시 백업)');
            console.log('⚠️ localStorage 폴백 (임시 백업):', loaded.length, '개');
          } else {
            setDataSource('없음 - 직접 입력 필요');
            console.log('❌ 공정 데이터 없음');
          }
        }
        
        console.log('📋 로드된 공정:', loaded.map(p => p.name).join(', '));
        setProcesses(loaded);
        
        const preSelected = new Set<string>();
        loaded.forEach(p => {
          if (existingProcessNames.includes(p.name)) {
            preSelected.add(p.id);
          }
        });
        setSelectedIds(preSelected);
        setLoading(false);
      };
      
      loadData();
      setSearch('');
      setEditingId(null);
      // ✅ 연속입력 상태 초기화
      setContinuousMode(false);
      setAddedCount(0);
    }
  }, [isOpen, existingProcessNames]);

  const filteredProcesses = useMemo(() => {
    let result = processes;
    
    // 검색 필터링
    if (search.trim()) {
      const q = search.toLowerCase();
      result = processes.filter(p => 
        p.no.includes(q) || p.name.toLowerCase().includes(q)
      );
    }
    
    // 공정 번호 기준 숫자 정렬 (10, 20, 30 순서)
    return [...result].sort((a, b) => {
      const numA = parseInt(a.no.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.no.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [processes, search]);
  
  const toggleSelect = useCallback((id: string) => {
    if (editingId) return;
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, [editingId]);

  const selectAll = () => setSelectedIds(new Set(filteredProcesses.map(p => p.id)));
  const deselectAll = () => setSelectedIds(new Set());
  
  const handleSave = () => {
    const selected = processes.filter(p => selectedIds.has(p.id));
    onSave(selected);
    onClose();
  };

  // 더블클릭 수정
  const handleDoubleClick = (proc: ProcessItem) => {
    setEditingId(proc.id);
    setEditValue(proc.name);
  };

  const handleEditSave = () => {
    if (editingId && editValue.trim()) {
      setProcesses(prev => prev.map(p => 
        p.id === editingId ? { ...p, name: editValue.trim() } : p
      ));
    }
    setEditingId(null);
  };

  const isCurrentlySelected = (name: string) => existingProcessNames.includes(name);

  // 신규 공정 추가
  const handleAddNew = () => {
    if (!newName.trim()) return;
    
    // 중복 확인 - 이미 존재하면 무시
    if (processes.some(p => p.name === newName.trim())) return;
    
    // 공정번호 자동 생성 (입력 안했으면)
    const procNo = newNo.trim() || String((processes.length + 1) * 10);
    
    const newProc: ProcessItem = {
      id: `proc_new_${Date.now()}`,
      no: procNo,
      name: newName.trim(),
    };
    
    setProcesses(prev => [newProc, ...prev]);
    setSelectedIds(prev => new Set([...prev, newProc.id]));
    
    // localStorage에도 저장 (CP 마스터 데이터)
    try {
      const savedData = localStorage.getItem('cp_master_data') || '[]';
      const masterData = JSON.parse(savedData);
      masterData.push({
        id: newProc.id,
        itemCode: 'A2',
        value: newProc.name,
        processNo: procNo,
        category: '공정현황',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('cp_master_data', JSON.stringify(masterData));
      console.log('✅ 신규 공정 저장 (CP 마스터):', newProc.name);
    } catch (e) {
      console.error('저장 오류:', e);
    }
    
    // ✅ 연속입력 모드: 워크시트에 즉시 반영 + 새 행 추가
    if (continuousMode && onContinuousAdd) {
      onContinuousAdd(newProc, true);
      setAddedCount(prev => prev + 1);
      console.log(`[연속입력] "${newProc.name}" 추가 완료 (총 ${addedCount + 1}개)`);
    }
    
    setNewNo('');
    setNewName('');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/40"
      onClick={onClose}
    >
      <div 
        className="fixed bg-white rounded-lg shadow-2xl w-[350px] max-w-[350px] min-w-[350px] flex flex-col overflow-hidden max-h-[calc(100vh-120px)] cursor-move"
        style={{ 
          top: `${modalPosition.top}px`, 
          right: `${modalPosition.right}px` 
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        {/* 헤더 - 드래그 가능 */}
        <div 
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🏭</span>
            <h2 className="text-xs font-bold">공정명 선택</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">닫기</button>
        </div>

        {/* 데이터 소스 + 연속입력 토글 */}
        <div className="px-3 py-1 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-green-700">공정명</span>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-2 py-0.5 rounded ${dataSource.includes('Master') ? 'bg-blue-100 text-blue-700' : dataSource.includes('local') ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
              {loading ? '로딩중...' : `📂 ${dataSource} (${processes.length}개)`}
            </span>
            {/* ✅ 연속입력 토글 */}
            {onContinuousAdd && (
              <button
                onClick={() => {
                  setContinuousMode(!continuousMode);
                  if (!continuousMode) setAddedCount(0);
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                  continuousMode 
                    ? 'bg-purple-600 text-white ring-2 ring-purple-300' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title={continuousMode ? '연속입력 모드 ON: 저장 시 워크시트에 즉시 반영 + 새 행 추가' : '연속입력 모드 OFF'}
              >
                🔄 연속입력 {continuousMode ? 'ON' : 'OFF'}
                {continuousMode && addedCount > 0 && <span className="ml-1 px-1 bg-white/30 rounded">{addedCount}</span>}
              </button>
            )}
          </div>
        </div>

        {/* 신규 공정 추가 */}
        <div className={`px-3 py-1.5 border-b flex items-center gap-1 ${continuousMode ? 'bg-purple-50' : 'bg-green-50'}`}>
          <span className={`text-[10px] font-bold shrink-0 ${continuousMode ? 'text-purple-700' : 'text-green-700'}`}>+</span>
          <input
            type="text"
            value={newNo}
            onChange={(e) => setNewNo(e.target.value)}
            placeholder="No"
            className={`w-12 px-1 py-0.5 text-[10px] border rounded focus:outline-none focus:ring-1 text-center ${
              continuousMode ? 'focus:ring-purple-500 border-purple-300' : 'focus:ring-green-500'
            }`}
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleAddNew(); } }}
            placeholder={continuousMode ? "입력 후 Enter → 즉시 반영 + 새 행 추가" : "공정명 입력..."}
            className={`flex-1 px-2 py-0.5 text-[10px] border rounded focus:outline-none focus:ring-1 ${
              continuousMode ? 'focus:ring-purple-500 border-purple-300' : 'focus:ring-green-500'
            }`}
            autoFocus={continuousMode}
          />
          <button
            onClick={handleAddNew}
            disabled={!newName.trim()}
            className={`px-2 py-0.5 text-[10px] font-bold text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
              continuousMode ? 'bg-purple-600' : 'bg-green-600'
            }`}
          >
            저장
          </button>
        </div>

        {/* 검색 + 버튼 */}
        <div className="px-2 py-1.5 border-b bg-gray-50">
          {/* 첫 줄: 검색 */}
          <div className="mb-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 공정명 또는 번호 검색..."
              className="w-full px-2 py-0.5 text-[9px] border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          {/* 두 번째 줄: 버튼들 */}
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="px-4 py-1.5 text-[13px] font-bold bg-blue-500 text-white rounded hover:bg-blue-600">전체</button>
            <button onClick={deselectAll} className="px-4 py-1.5 text-[13px] font-bold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">해제</button>
            <button onClick={handleSave} className="px-4 py-1.5 text-[13px] font-bold bg-green-600 text-white rounded hover:bg-green-700">적용</button>
          </div>
        </div>

        {/* 컴팩트 테이블 - 고정 높이 */}
        <div className="overflow-auto p-2 h-80 min-h-[320px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">마스터 공정 데이터 로딩중...</p>
              </div>
            </div>
          ) : processes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-lg mb-2">📭</p>
                <p className="text-xs text-gray-500 mb-2">등록된 공정이 없습니다</p>
                <p className="text-[10px] text-gray-400">위 입력창에서 직접 추가해주세요</p>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-1">
            {filteredProcesses.map(proc => {
                const isSelected = selectedIds.has(proc.id);
                const isCurrent = isCurrentlySelected(proc.name);
                const isEditing = editingId === proc.id;
                
                return (
                  <div
                    key={proc.id}
                    onClick={() => toggleSelect(proc.id)}
                    onDoubleClick={() => handleDoubleClick(proc)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                      isSelected 
                        ? isCurrent 
                          ? 'bg-green-50 border-green-400' 
                          : 'bg-blue-50 border-blue-400'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    {/* 체크박스 */}
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? isCurrent ? 'bg-green-500 border-green-500' : 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}>
                      {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                    </div>

                    {/* 번호 */}
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded min-w-[28px] text-center">
                      {proc.no}
                    </span>

                    {/* 이름 (수정 모드 or 표시 모드) */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleEditSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleEditSave(); }
                            if (e.key === 'Escape') { e.stopPropagation(); setEditingId(null); }
                          }}
                          autoFocus
                          className="w-full px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={`text-xs truncate block ${
                          isSelected ? (isCurrent ? 'text-green-800 font-medium' : 'text-blue-800 font-medium') : 'text-gray-700'
                        }`}>
                          {proc.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* 빈 행 채우기 - 최소 12개 행 유지 */}
              {Array.from({ length: Math.max(0, 12 - filteredProcesses.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded border border-gray-100 bg-gray-50/50"
                >
                  <div className="w-4 h-4 rounded border border-gray-200 bg-white shrink-0" />
                  <span className="text-[10px] font-bold text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded min-w-[28px] text-center">--</span>
                  <span className="flex-1 text-xs text-gray-300">-</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 - 선택 수 표시만 */}
        <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-600">✓ {selectedIds.size}개 선택</span>
        </div>
      </div>
    </div>
  );
}

