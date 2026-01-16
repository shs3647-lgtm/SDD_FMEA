/**
 * @file WorkElementSelectModal.tsx
 * @description 작업요소 선택 모달 - 검색/입력 통합 버전
 * @version 4.0.0 - 검색+입력 통합
 * @updated 2026-01-16
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

interface WorkElement {
  id: string;
  m4: string;
  name: string;
  processNo?: string;
}

interface WorkElementSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedElements: WorkElement[]) => void;
  onDelete?: (deletedNames: string[]) => void;
  processNo?: string;
  processName?: string;
  existingElements?: string[];
  // ✅ 기존 저장된 작업요소 (전체 객체) - 이전에 추가한 항목 유지용
  existingL3?: WorkElement[];
  onContinuousAdd?: (element: WorkElement, addNewRow: boolean) => void;
}

const M4_OPTIONS = [
  { id: 'MN', label: 'MN', bg: '#e8f5e9', text: '#2e7d32' },
  { id: 'MC', label: 'MC', bg: '#e3f2fd', text: '#1565c0' },
  { id: 'IM', label: 'IM', bg: '#fff3e0', text: '#e65100' },
  { id: 'EN', label: 'EN', bg: '#fce4ec', text: '#c2185b' },
];

// 공정별 작업요소 데이터
const WORK_ELEMENTS_BY_PROCESS: Record<string, WorkElement[]> = {
  'COMMON': [
    { id: 'c1', m4: 'MN', name: '00작업자', processNo: 'COMMON' },
    { id: 'c2', m4: 'MN', name: '00셋업 엔지니어', processNo: 'COMMON' },
    { id: 'c3', m4: 'MN', name: '00검사원', processNo: 'COMMON' },
    { id: 'c4', m4: 'MN', name: '00보전원', processNo: 'COMMON' },
    { id: 'c5', m4: 'MN', name: '00 운반원', processNo: 'COMMON' },
    { id: 'c6', m4: 'EN', name: '00 온도', processNo: 'COMMON' },
    { id: 'c7', m4: 'EN', name: '00 습도', processNo: 'COMMON' },
  ],
  '10': [
    { id: '10-1', m4: 'MC', name: '10자동창고', processNo: '10' },
    { id: '10-2', m4: 'MC', name: '10컨베이어', processNo: '10' },
    { id: '10-3', m4: 'IM', name: '10원자재', processNo: '10' },
  ],
  '11': [
    { id: '11-1', m4: 'MC', name: '11가온실', processNo: '11' },
    { id: '11-2', m4: 'MC', name: '11히터', processNo: '11' },
  ],
  '20': [
    { id: '20-1', m4: 'MC', name: '20MOONEY VISCOMETER', processNo: '20' },
    { id: '20-2', m4: 'MC', name: '20경도계', processNo: '20' },
    { id: '20-3', m4: 'MC', name: '20비중계', processNo: '20' },
  ],
  '30': [
    { id: '30-1', m4: 'MC', name: '30믹서', processNo: '30' },
    { id: '30-2', m4: 'MC', name: '30밴버리', processNo: '30' },
    { id: '30-3', m4: 'IM', name: '30배합제', processNo: '30' },
  ],
  '40': [
    { id: '40-1', m4: 'MC', name: '40압출기', processNo: '40' },
    { id: '40-2', m4: 'MC', name: '40다이', processNo: '40' },
  ],
};

const loadWorkElements = (processNo: string): WorkElement[] => {
  const common = WORK_ELEMENTS_BY_PROCESS['COMMON'] || [];
  const process = WORK_ELEMENTS_BY_PROCESS[processNo] || [];
  return [...common, ...process];
};

export default function WorkElementSelectModal({ 
  isOpen, 
  onClose, 
  onSave,
  processNo = '',
  processName = '',
  existingElements = [],
  existingL3 = [],
  onContinuousAdd,
}: WorkElementSelectModalProps) {
  const [elements, setElements] = useState<WorkElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentProcessNo, setCurrentProcessNo] = useState(processNo);
  
  // ✅ 통합 입력 필드 상태
  const [inputValue, setInputValue] = useState('');
  const [selectedM4, setSelectedM4] = useState('MN');
  const [filterM4, setFilterM4] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ top: 200, right: 0 });

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
        right: Math.max(-350, Math.min(window.innerWidth - 350, prev.right - deltaX))
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setModalPosition({ top: 200, right: 0 });
      setCurrentProcessNo(processNo);
      
      // ✅ 기본 작업요소 로드
      const loaded = loadWorkElements(processNo);
      
      // ✅ 기존 저장된 항목들 (existingL3) 병합 - 중복 제거
      const loadedIds = new Set(loaded.map(e => e.id));
      const loadedNames = new Set(loaded.map(e => e.name.toLowerCase()));
      
      // existingL3에서 중복되지 않는 항목만 추가
      const customItems = existingL3.filter(item => 
        !loadedIds.has(item.id) && !loadedNames.has(item.name.toLowerCase())
      );
      
      // 기존 저장된 항목을 앞에 배치
      const mergedElements = [...customItems, ...loaded];
      setElements(mergedElements);
      
      // ✅ 기존 저장된 항목들 모두 선택 상태로
      const preSelected = new Set<string>();
      existingL3.forEach(item => {
        // 병합된 리스트에서 찾기 (ID 또는 이름으로)
        const found = mergedElements.find(e => 
          e.id === item.id || e.name.toLowerCase() === item.name.toLowerCase()
        );
        if (found) {
          preSelected.add(found.id);
        }
      });
      
      setSelectedIds(preSelected);
      setInputValue('');
      setFilterM4('all');
      setSelectedM4('MN');
      
      console.log('📊 [모달 초기화] 기본:', loaded.length, '개, 커스텀:', customItems.length, '개, 선택됨:', preSelected.size, '개');
      
      // 입력 필드 포커스
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, processNo, existingL3]);

  // ✅ 필터링: 입력값으로 검색 + 4M 필터
  const filteredElements = useMemo(() => {
    let result = elements;
    
    // 4M 필터
    if (filterM4 !== 'all') {
      result = result.filter(e => e.m4 === filterM4);
    }
    
    // 입력값으로 검색
    if (inputValue.trim()) {
      const q = inputValue.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q));
    }
    
    return result;
  }, [elements, filterM4, inputValue]);

  // ✅ 정확히 일치하는 항목 찾기
  const exactMatch = useMemo(() => {
    if (!inputValue.trim()) return null;
    return elements.find(e => e.name.toLowerCase() === inputValue.toLowerCase());
  }, [elements, inputValue]);

  // 선택 토글
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  // 전체 선택/해제
  const selectAll = () => setSelectedIds(new Set(filteredElements.map(e => e.id)));
  const deselectAll = () => setSelectedIds(new Set());

  // 적용
  const handleApply = () => {
    const selected = elements.filter(e => selectedIds.has(e.id));
    console.log('🟢 [handleApply] 저장될 항목들:', selected);
    onSave(selected);
    // ✅ 2026-01-16: 적용 후 모달 유지 (닫기 버튼으로만 닫음)
  };

  // ✅ Enter 키 처리: 검색 결과 선택 또는 새 항목 추가
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    // 1. 정확히 일치하는 항목이 있으면 → 선택/해제 토글
    if (exactMatch) {
      toggleSelect(exactMatch.id);
      setInputValue('');
      console.log(`✅ 기존 항목 선택: ${exactMatch.name}`);
      // ✅ 2026-01-16: 엔터 시 워크시트에 즉시 반영 (모달 유지)
      const currentSelected = elements.filter(el => selectedIds.has(el.id));
      const allSelected = currentSelected.some(s => s.id === exactMatch.id)
        ? currentSelected.filter(s => s.id !== exactMatch.id)
        : [...currentSelected, exactMatch];
      onSave(allSelected);
      console.log('[WorkElementSelectModal] 워크시트 반영:', allSelected.map(el => el.name));
      return;
    }
    
    // 2. 검색 결과가 1개면 → 그것 선택
    if (filteredElements.length === 1) {
      toggleSelect(filteredElements[0].id);
      setInputValue('');
      console.log(`✅ 검색 결과 선택: ${filteredElements[0].name}`);
      // ✅ 2026-01-16: 엔터 시 워크시트에 즉시 반영 (모달 유지)
      const currentSelected = elements.filter(el => selectedIds.has(el.id));
      const allSelected = currentSelected.some(s => s.id === filteredElements[0].id)
        ? currentSelected.filter(s => s.id !== filteredElements[0].id)
        : [...currentSelected, filteredElements[0]];
      onSave(allSelected);
      console.log('[WorkElementSelectModal] 워크시트 반영:', allSelected.map(el => el.name));
      return;
    }
    
    // 3. 새 항목 추가
    const newElem: WorkElement = {
      id: `new_${Date.now()}`,
      m4: selectedM4,
      name: trimmed,
      processNo: currentProcessNo,
    };
    
    setElements(prev => [newElem, ...prev]);
    setSelectedIds(prev => new Set([...prev, newElem.id]));
    setFilterM4('all');
    setInputValue('');
    
    // localStorage 저장
    try {
      const savedData = localStorage.getItem('pfmea_master_data') || '[]';
      const masterData = JSON.parse(savedData);
      masterData.push({
        id: newElem.id,
        code: 'A5',
        value: newElem.name,
        m4: newElem.m4,
        processNo: currentProcessNo,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('pfmea_master_data', JSON.stringify(masterData));
    } catch (e) {
      console.error('저장 오류:', e);
    }
    
    // ✅ 2026-01-16: 엔터 시 워크시트에 즉시 반영 (모달 유지)
    const currentSelected = elements.filter(el => selectedIds.has(el.id));
    onSave([...currentSelected, newElem]);
    console.log('[WorkElementSelectModal] 워크시트 반영:', [...currentSelected, newElem].map(el => el.name));
    
    console.log(`✅ 새 항목 추가: ${selectedM4} ${trimmed}`);
  };

  const getM4Style = (m4: string) => {
    const opt = M4_OPTIONS.find(o => o.id === m4);
    return opt ? { background: opt.bg, color: opt.text } : {};
  };

  if (!isOpen) return null;

  // 입력 상태에 따른 힌트 메시지
  const getHintMessage = () => {
    if (!inputValue.trim()) return '검색 또는 새 항목 입력 후 Enter';
    if (exactMatch) return `Enter → "${exactMatch.name}" 선택`;
    if (filteredElements.length === 1) return `Enter → "${filteredElements[0].name}" 선택`;
    if (filteredElements.length > 1) return `${filteredElements.length}개 검색됨 - 클릭하여 선택`;
    return `Enter → "${inputValue}" 새로 추가`;
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/40"
      // ✅ 2026-01-16: 배경 클릭으로 닫히지 않음 (닫기 버튼으로만 닫음)
    >
      <div 
        className="fixed bg-white rounded-lg shadow-2xl w-[350px] flex flex-col overflow-hidden max-h-[calc(100vh-120px)] cursor-move"
        style={{ top: `${modalPosition.top}px`, right: `${modalPosition.right}px` }}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        {/* ===== 헤더 ===== */}
        <div 
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span>🔧</span>
            <h2 className="text-xs font-bold">작업요소 선택</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">닫기</button>
        </div>

        {/* ===== 상위항목(공정) ===== */}
        <div className="px-3 py-1.5 border-b bg-gradient-to-r from-red-50 to-orange-50 flex items-center gap-2">
          <span className="text-[10px] font-bold text-red-700">★ 공정:</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded">
            {currentProcessNo} {processName}
          </span>
        </div>

        {/* ===== 통합 입력 영역 ===== */}
        <div className="px-3 py-2 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-1.5">
            {/* 4M 필터 */}
            <select
              value={filterM4}
              onChange={(e) => setFilterM4(e.target.value)}
              className="px-1 py-1 text-[10px] border rounded cursor-pointer shrink-0"
            >
              <option value="all">전체</option>
              {M4_OPTIONS.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            
            {/* 4M 선택 (새 항목용) */}
            <select
              value={selectedM4}
              onChange={(e) => setSelectedM4(e.target.value)}
              className="px-1 py-1 text-[10px] border rounded font-bold"
              style={getM4Style(selectedM4)}
            >
              {M4_OPTIONS.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            
            {/* 통합 입력 필드 */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="🔍 검색 또는 새 항목 입력..."
              className="flex-1 px-2 py-1 text-[11px] border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
          </div>
          
          {/* 힌트 메시지 */}
          <div className="mt-1 text-[9px] text-gray-500 text-center">
            {getHintMessage()}
          </div>
        </div>

        {/* ===== 버튼 영역 ===== */}
        <div className="px-3 py-1.5 border-b bg-gray-50 flex items-center gap-2">
          <button onClick={selectAll} className="px-3 py-1 text-[11px] font-bold bg-blue-500 text-white rounded hover:bg-blue-600">전체</button>
          <button onClick={deselectAll} className="px-3 py-1 text-[11px] font-bold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">해제</button>
          <div className="flex-1" />
          <button onClick={handleApply} className="px-4 py-1 text-[11px] font-bold bg-green-600 text-white rounded hover:bg-green-700">✓ 적용 ({selectedIds.size})</button>
        </div>

        {/* ===== 리스트 ===== */}
        <div className="overflow-auto p-2 min-h-[250px] max-h-[350px]">
          <div className="grid grid-cols-2 gap-1">
            {filteredElements.map(elem => {
              const isSelected = selectedIds.has(elem.id);
              const m4Style = getM4Style(elem.m4);
              const isHighlighted = exactMatch?.id === elem.id || (filteredElements.length === 1);
              
              return (
                <div
                  key={elem.id}
                  onClick={() => toggleSelect(elem.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-400' 
                      : isHighlighted
                        ? 'bg-yellow-50 border-yellow-400 ring-1 ring-yellow-300'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* 체크박스 */}
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                  }`}>
                    {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>

                  {/* 4M 배지 */}
                  <span 
                    className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0"
                    style={m4Style}
                  >
                    {elem.m4}
                  </span>

                  {/* 이름 */}
                  <span className={`flex-1 text-[10px] truncate ${
                    isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'
                  }`}>
                    {elem.name}
                  </span>
                </div>
              );
            })}
            
            {/* 검색 결과 없을 때 새 항목 미리보기 */}
            {inputValue.trim() && filteredElements.length === 0 && (
              <div className="col-span-2 flex items-center gap-2 px-2 py-2 rounded border-2 border-dashed border-green-400 bg-green-50">
                <span className="text-green-600 font-bold">+</span>
                <span 
                  className="text-[9px] font-bold px-1 py-0.5 rounded"
                  style={getM4Style(selectedM4)}
                >
                  {selectedM4}
                </span>
                <span className="text-[10px] text-green-700 font-medium">
                  "{inputValue}" 새로 추가
                </span>
                <span className="text-[9px] text-gray-400 ml-auto">Enter</span>
              </div>
            )}
            
            {/* 빈 행 채우기 */}
            {filteredElements.length < 8 && !inputValue.trim() && 
              Array.from({ length: Math.max(0, 8 - filteredElements.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded border border-gray-100 bg-gray-50/50"
                >
                  <div className="w-4 h-4 rounded border border-gray-200 bg-white shrink-0" />
                  <span className="text-[9px] text-gray-300">--</span>
                  <span className="flex-1 text-[10px] text-gray-300">-</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* ===== 푸터 ===== */}
        <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">총 {elements.length}개</span>
          <span className="text-xs font-bold text-blue-600">✓ {selectedIds.size}개 선택</span>
        </div>
      </div>
    </div>
  );
}
