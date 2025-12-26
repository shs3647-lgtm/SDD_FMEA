'use client';

import React, { useState, useEffect } from 'react';

interface WorkElement {
  id: string;
  m4: string;
  name: string;
  processNo?: string; // 공정번호 (공통이면 'COMMON')
}

interface WorkElementSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedElements: WorkElement[]) => void;
  processNo?: string;
  processName?: string;
  existingElements?: string[];
}

const M4_CATEGORIES = [
  { code: 'MN', label: 'Man', color: '#dbeafe', borderColor: '#3b82f6' },
  { code: 'MC', label: 'Machine', color: '#fef3c7', borderColor: '#f59e0b' },
  { code: 'MT', label: 'Material', color: '#d1fae5', borderColor: '#10b981' },
  { code: 'EN', label: 'Environment', color: '#fce7f3', borderColor: '#ec4899' },
];

// 공정별 작업요소 샘플 데이터
const WORK_ELEMENTS_BY_PROCESS: Record<string, WorkElement[]> = {
  // 공통 작업요소 (모든 공정에 표시)
  'COMMON': [
    { id: 'c1', m4: 'MN', name: '00작업자', processNo: 'COMMON' },
    { id: 'c2', m4: 'MN', name: '00셋업 엔지니어', processNo: 'COMMON' },
    { id: 'c3', m4: 'EN', name: '00 온도', processNo: 'COMMON' },
    { id: 'c4', m4: 'EN', name: '00 습도', processNo: 'COMMON' },
  ],
  // 10번 공정 - 자재입고
  '10': [
    { id: '10-1', m4: 'MC', name: '10자동창고', processNo: '10' },
    { id: '10-2', m4: 'MC', name: '10컨베이어', processNo: '10' },
    { id: '10-3', m4: 'MT', name: '10원자재', processNo: '10' },
  ],
  // 11번 공정 - 가온
  '11': [
    { id: '11-1', m4: 'MC', name: '11가온실', processNo: '11' },
    { id: '11-2', m4: 'MC', name: '11히터', processNo: '11' },
  ],
  // 20번 공정 - 수입검사
  '20': [
    { id: '20-1', m4: 'MN', name: '20검사원', processNo: '20' },
    { id: '20-2', m4: 'MC', name: '20MOONEY VISCOMETER', processNo: '20' },
    { id: '20-3', m4: 'MC', name: '20경도계', processNo: '20' },
    { id: '20-4', m4: 'MC', name: '20비중계', processNo: '20' },
  ],
  // 30번 공정 - 믹싱
  '30': [
    { id: '30-1', m4: 'MC', name: '30믹서', processNo: '30' },
    { id: '30-2', m4: 'MC', name: '30밴버리', processNo: '30' },
    { id: '30-3', m4: 'MT', name: '30배합제', processNo: '30' },
  ],
  // 40번 공정 - 압출
  '40': [
    { id: '40-1', m4: 'MC', name: '40압출기', processNo: '40' },
    { id: '40-2', m4: 'MC', name: '40다이', processNo: '40' },
  ],
  // 50번 공정 - 재단
  '50': [
    { id: '50-1', m4: 'MC', name: '50재단기', processNo: '50' },
    { id: '50-2', m4: 'MC', name: '50절단날', processNo: '50' },
  ],
  // 60번 공정 - 비드
  '60': [
    { id: '60-1', m4: 'MC', name: '60비드성형기', processNo: '60' },
    { id: '60-2', m4: 'MT', name: '60비드와이어', processNo: '60' },
  ],
  // 70번 공정 - 성형
  '70': [
    { id: '70-1', m4: 'MC', name: '70성형드럼', processNo: '70' },
    { id: '70-2', m4: 'MC', name: '70성형기', processNo: '70' },
  ],
  // 80번 공정 - 가류
  '80': [
    { id: '80-1', m4: 'MC', name: '80가류기', processNo: '80' },
    { id: '80-2', m4: 'MC', name: '80몰드', processNo: '80' },
  ],
  // 90번 공정 - 검사
  '90': [
    { id: '90-1', m4: 'MN', name: '90검사원', processNo: '90' },
    { id: '90-2', m4: 'MC', name: '90X-ray', processNo: '90' },
    { id: '90-3', m4: 'MC', name: '90균형검사기', processNo: '90' },
  ],
};

// 기초정보에서 작업요소 로드 (공정번호 기반)
const loadWorkElementsForProcess = (processNo: string): WorkElement[] => {
  // 공통 작업요소
  const commonElements = WORK_ELEMENTS_BY_PROCESS['COMMON'] || [];
  
  // 해당 공정 작업요소
  const processElements = WORK_ELEMENTS_BY_PROCESS[processNo] || [];
  
  // LocalStorage에서 추가 데이터 로드
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem('pfmea-flat-data');
      if (savedData) {
        const flatData = JSON.parse(savedData);
        const additionalElements: WorkElement[] = [];
        let currentM4 = '';
        let currentProcessNo = '';
        
        flatData.forEach((item: any, idx: number) => {
          if (item.code === 'A2' && item.value) {
            // 공정명에서 공정번호 추출 (예: "10 자재입고" -> "10")
            const match = item.value.match(/^(\d+)/);
            currentProcessNo = match ? match[1] : '';
          }
          if (item.code === 'A4' && item.value) {
            currentM4 = item.value.toUpperCase();
          }
          if (item.code === 'A5' && item.value) {
            // 공통이거나 해당 공정인 경우에만 추가
            if (currentProcessNo === processNo || currentProcessNo === '') {
              additionalElements.push({
                id: `imported_${idx}_${Date.now()}`,
                m4: currentM4 || 'MN',
                name: item.value,
                processNo: currentProcessNo || 'COMMON'
              });
            }
          }
        });
        
        if (additionalElements.length > 0) {
          return [...commonElements, ...processElements, ...additionalElements];
        }
      }
    } catch (e) {
      console.error('Failed to load work elements:', e);
    }
  }
  
  return [...commonElements, ...processElements];
};

export default function WorkElementSelectModal({ 
  isOpen, 
  onClose, 
  onSave,
  processNo = '',
  processName = '',
  existingElements = []
}: WorkElementSelectModalProps) {
  const [elements, setElements] = useState<WorkElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterM4, setFilterM4] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'common' | 'process'>('all');
  
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualM4, setManualM4] = useState('MN');
  const [manualName, setManualName] = useState('');
  const [manualElements, setManualElements] = useState<WorkElement[]>([]);

  useEffect(() => {
    if (isOpen && processNo) {
      const loaded = loadWorkElementsForProcess(processNo);
      setElements(loaded);
      
      // 기존 선택된 작업요소들을 미리 체크
      const preSelected = new Set<string>();
      loaded.forEach(e => {
        if (existingElements.includes(e.name)) {
          preSelected.add(e.id);
        }
      });
      setSelectedIds(preSelected);
      
      setSearchTerm('');
      setFilterM4('all');
      setFilterType('all');
      setIsManualMode(false);
      setManualElements([]);
      setManualName('');
    }
  }, [isOpen, processNo, existingElements]);

  // 이미 선택된 항목도 표시 (disabled 상태로)
  const filteredElements = elements.filter(e => 
    (filterM4 === 'all' || e.m4 === filterM4) &&
    (filterType === 'all' || 
     (filterType === 'common' && e.processNo === 'COMMON') ||
     (filterType === 'process' && e.processNo === processNo)) &&
    (e.m4.includes(searchTerm.toUpperCase()) || e.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const commonCount = elements.filter(e => e.processNo === 'COMMON').length;
  const processCount = elements.filter(e => e.processNo === processNo).length;
  
  // 이미 추가된 항목인지 확인
  const isAlreadyAdded = (name: string) => existingElements.includes(name);

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

  const selectAll = () => setSelectedIds(new Set(filteredElements.map(e => e.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const addManualElement = () => {
    if (!manualName.trim()) return;
    setManualElements(prev => [...prev, {
      id: `manual_${Date.now()}`,
      m4: manualM4,
      name: manualName.trim(),
      processNo: processNo
    }]);
    setManualName('');
  };

  const removeManualElement = (id: string) => {
    setManualElements(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = () => {
    const selectedFromList = elements.filter(e => selectedIds.has(e.id));
    onSave([...selectedFromList, ...manualElements]);
    onClose();
  };

  const getM4Style = (m4: string) => {
    const cat = M4_CATEGORIES.find(c => c.code === m4);
    return cat ? { background: cat.color, borderColor: cat.borderColor } : {};
  };

  if (!isOpen) return null;

  const totalSelected = selectedIds.size + manualElements.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: '#2b78c5' }}>
          <h2 className="text-white font-bold text-sm">
            🔧 작업요소 선택 - {processNo} {processName}
          </h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded px-2 py-1 text-lg">✕</button>
        </div>

        {/* 모드 탭 */}
        <div className="flex border-b">
          <button
            onClick={() => setIsManualMode(false)}
            className={`flex-1 px-4 py-2 text-sm font-bold ${!isManualMode ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'}`}
          >
            📋 목록에서 선택
          </button>
          <button
            onClick={() => setIsManualMode(true)}
            className={`flex-1 px-4 py-2 text-sm font-bold ${isManualMode ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'}`}
          >
            ✏️ 직접 입력
          </button>
        </div>

        {!isManualMode ? (
          <>
            {/* 필터 탭: 공통 / 해당공정 / 전체 */}
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 px-3 py-2 text-xs font-bold ${filterType === 'all' ? 'bg-white border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                전체 ({commonCount + processCount})
              </button>
              <button
                onClick={() => setFilterType('common')}
                className={`flex-1 px-3 py-2 text-xs font-bold ${filterType === 'common' ? 'bg-white border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
              >
                🌐 공통 ({commonCount})
              </button>
              <button
                onClick={() => setFilterType('process')}
                className={`flex-1 px-3 py-2 text-xs font-bold ${filterType === 'process' ? 'bg-white border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
              >
                🏭 {processNo}번 공정 ({processCount})
              </button>
            </div>

            {/* 검색 + 4M 필터 */}
            <div className="px-4 py-2 border-b flex items-center gap-2 bg-gray-50">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색..."
                className="flex-1 px-3 py-2 text-sm border rounded"
              />
              <select
                value={filterM4}
                onChange={(e) => setFilterM4(e.target.value)}
                className="px-2 py-2 text-sm border rounded"
              >
                <option value="all">전체 4M</option>
                {M4_CATEGORIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <button onClick={selectAll} className="px-3 py-2 text-xs font-bold bg-blue-500 text-white rounded">전체</button>
              <button onClick={deselectAll} className="px-3 py-2 text-xs font-bold bg-gray-400 text-white rounded">해제</button>
            </div>

            {/* 작업요소 그리드 */}
            <div className="flex-1 overflow-auto p-4">
              {filteredElements.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  검색 결과가 없습니다.<br/>
                  <span className="text-sm">"직접 입력" 탭을 이용하세요.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredElements.map(elem => {
                    const isCurrent = isAlreadyAdded(elem.name);
                    const isSelected = selectedIds.has(elem.id);
                    return (
                      <div 
                        key={elem.id}
                        onClick={() => toggleSelect(elem.id)}
                        className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                          isSelected 
                            ? isCurrent 
                              ? 'bg-green-100 border-green-400' 
                              : 'bg-blue-100 border-blue-400'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {/* 체크박스 */}
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                          isSelected 
                            ? isCurrent 
                              ? 'bg-green-500 border-green-500'
                              : 'bg-blue-500 border-blue-500' 
                            : 'bg-white border-gray-400'
                        }`}>
                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        {/* 공통/공정 표시 */}
                        <span className={`text-[10px] font-bold px-1 rounded ${
                          elem.processNo === 'COMMON' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {elem.processNo === 'COMMON' ? '공통' : elem.processNo}
                        </span>
                        {/* 4M 배지 */}
                        <span 
                          className="px-1.5 py-0.5 text-xs font-bold rounded border flex-shrink-0"
                          style={getM4Style(elem.m4)}
                        >
                          {elem.m4}
                        </span>
                        {/* 이름 */}
                        <span className="text-sm truncate">
                          {elem.name}
                          {isCurrent && <span className="ml-1 text-[10px] text-green-600">(현재)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* 직접 입력 */
          <div className="flex-1 overflow-auto p-4">
            <div className="flex gap-2 mb-4">
              <select
                value={manualM4}
                onChange={(e) => setManualM4(e.target.value)}
                className="px-3 py-2 text-sm border rounded w-20"
              >
                {M4_CATEGORIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addManualElement()}
                placeholder={`${processNo}번 공정 작업요소명 입력`}
                className="flex-1 px-3 py-2 text-sm border rounded"
              />
              <button
                onClick={addManualElement}
                className="px-4 py-2 text-sm font-bold bg-green-500 text-white rounded hover:bg-green-600"
              >
                추가
              </button>
            </div>

            {manualElements.length > 0 ? (
              <div className="space-y-2">
                {manualElements.map(elem => (
                  <div key={elem.id} className="flex items-center gap-2 p-2 border rounded bg-green-50">
                    <span className="text-[10px] font-bold px-1 rounded bg-orange-100 text-orange-700">{processNo}</span>
                    <span className="px-1.5 py-0.5 text-xs font-bold rounded border" style={getM4Style(elem.m4)}>
                      {elem.m4}
                    </span>
                    <span className="flex-1 text-sm">{elem.name}</span>
                    <button onClick={() => removeManualElement(elem.id)} className="text-red-500 hover:text-red-700">✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                {processNo}번 공정 작업요소를 입력하세요
              </div>
            )}
          </div>
        )}

        {/* 푸터 */}
        <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-600 font-bold">✓ {totalSelected}개 선택</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold border rounded hover:bg-gray-100">취소</button>
            <button 
              onClick={handleSave}
              disabled={totalSelected === 0}
              className="px-6 py-2 text-sm font-bold bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
