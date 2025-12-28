'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';

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
  onDelete?: (deletedNames: string[]) => void; // 워크시트에서 실제 삭제
  processNo?: string;
  processName?: string;
  existingElements?: string[];
}

const M4_CATEGORIES = [
  { code: 'MN', label: 'Man', color: '#e3f2fd', textColor: '#1565c0', borderColor: '#90caf9' },
  { code: 'MC', label: 'Machine', color: '#fff8e1', textColor: '#f57c00', borderColor: '#ffe082' },
  { code: 'IM', label: 'In Material', color: '#e8f5e9', textColor: '#2e7d32', borderColor: '#a5d6a7' },
  { code: 'EN', label: 'Environment', color: '#fce4ec', textColor: '#c2185b', borderColor: '#f8bbd0' },
];

// [데이터 복구] 공정별 작업요소 전체 데이터
const WORK_ELEMENTS_BY_PROCESS: Record<string, WorkElement[]> = {
  'COMMON': [
    { id: 'c1', m4: 'MN', name: '00작업자', processNo: 'COMMON' },
    { id: 'c2', m4: 'MN', name: '00셋업 엔지니어', processNo: 'COMMON' },
    { id: 'c3', m4: 'EN', name: '00 온도', processNo: 'COMMON' },
    { id: 'c4', m4: 'EN', name: '00 습도', processNo: 'COMMON' },
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
    { id: '20-1', m4: 'MN', name: '20검사원', processNo: '20' },
    { id: '20-2', m4: 'MC', name: '20MOONEY VISCOMETER', processNo: '20' },
    { id: '20-3', m4: 'MC', name: '20경도계', processNo: '20' },
    { id: '20-4', m4: 'MC', name: '20비중계', processNo: '20' },
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
  '50': [
    { id: '50-1', m4: 'MC', name: '50재단기', processNo: '50' },
    { id: '50-2', m4: 'MC', name: '50절단날', processNo: '50' },
  ],
  '60': [
    { id: '60-1', m4: 'MC', name: '60비드성형기', processNo: '60' },
    { id: '60-2', m4: 'IM', name: '60비드와이어', processNo: '60' },
  ],
  '70': [
    { id: '70-1', m4: 'MC', name: '70성형드럼', processNo: '70' },
    { id: '70-2', m4: 'MC', name: '70성형기', processNo: '70' },
  ],
  '80': [
    { id: '80-1', m4: 'MC', name: '80가류기', processNo: '80' },
    { id: '80-2', m4: 'MC', name: '80몰드', processNo: '80' },
  ],
  '90': [
    { id: '90-1', m4: 'MN', name: '90검사원', processNo: '90' },
    { id: '90-2', m4: 'MC', name: '90X-ray', processNo: '90' },
    { id: '90-3', m4: 'MC', name: '90균형검사기', processNo: '90' },
  ],
};

const loadWorkElementsForProcess = (processNo: string): WorkElement[] => {
  const commonElements = WORK_ELEMENTS_BY_PROCESS['COMMON'] || [];
  const processElements = WORK_ELEMENTS_BY_PROCESS[processNo] || [];
  
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem('pfmea_master_data');
      if (savedData) {
        const flatData = JSON.parse(savedData);
        const additionalElements: WorkElement[] = [];
        let currentM4 = '';
        let currentProcessNo = '';
        
        flatData.forEach((item: any, idx: number) => {
          if (item.code === 'A2' && item.value) {
            const match = item.value.match(/^(\d+)/);
            currentProcessNo = match ? match[1] : '';
          }
          if (item.code === 'A4' && item.value) {
            currentM4 = item.value.toUpperCase();
          }
          if (item.code === 'A5' && item.value) {
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
  onDelete,
  processNo = '',
  processName = '',
  existingElements = []
}: WorkElementSelectModalProps) {
  const [elements, setElements] = useState<WorkElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterM4, setFilterM4] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'common' | 'process'>('all');
  const [activeTab, setActiveTab] = useState('list');
  
  const [manualM4, setManualM4] = useState('MN');
  const [manualName, setManualName] = useState('');
  const [manualElements, setManualElements] = useState<WorkElement[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);

  useEffect(() => {
    if (isOpen && processNo) {
      const loaded = loadWorkElementsForProcess(processNo);
      setElements(loaded);
      
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
      setActiveTab('list');
      setManualElements([]);
    }
  }, [isOpen, processNo, existingElements]);

  const filteredElements = useMemo(() => {
    return elements.filter(e => 
      (filterM4 === 'all' || e.m4 === filterM4) &&
      (filterType === 'all' || 
       (filterType === 'common' && e.processNo === 'COMMON') ||
       (filterType === 'process' && e.processNo === processNo)) &&
      (e.m4.includes(searchTerm.toUpperCase()) || e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [elements, filterM4, filterType, searchTerm, processNo]);

  const commonCount = elements.filter(e => e.processNo === 'COMMON').length;
  const processCount = elements.filter(e => e.processNo === processNo).length;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const selectAll = () => setSelectedIds(new Set(filteredElements.map(e => e.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleSave = () => {
    const selectedFromList = elements.filter(e => selectedIds.has(e.id));
    onSave([...selectedFromList, ...manualElements]);
    onClose();
  };

  // 선택 삭제 (현재 워크시트에서)
  const handleDeleteSelected = () => {
    const selectedNames = elements
      .filter(e => selectedIds.has(e.id) && existingElements.includes(e.name))
      .map(e => e.name);
    if (selectedNames.length === 0) {
      alert('삭제할 항목이 없습니다. (현재 워크시트에 있는 항목만 삭제 가능)');
      return;
    }
    if (!window.confirm(`선택한 ${selectedNames.length}개 작업요소를 삭제하시겠습니까?\n\n${selectedNames.join(', ')}`)) return;
    
    if (onDelete) {
      onDelete(selectedNames);
    }
    setSelectedIds(new Set());
    setDeleteMode(false);
    onClose();
  };

  const handleDeleteSingle = (name: string) => {
    if (!window.confirm(`"${name}" 작업요소를 삭제하시겠습니까?`)) return;
    if (onDelete) {
      onDelete([name]);
    }
    onClose();
  };

  const isExisting = (name: string) => existingElements.includes(name);

  const getM4Style = (m4: string) => {
    const cat = M4_CATEGORIES.find(c => c.code === m4);
    return cat ? { background: cat.color, color: cat.textColor, borderColor: cat.borderColor } : {};
  };

  const totalSelected = selectedIds.size + manualElements.length;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`작업요소 선택 - ${processNo} ${processName}`}
      icon="🔧"
      width="680px"
      tabs={[
        { id: 'list', label: '목록에서 선택', icon: '📋' },
        { id: 'manual', label: '직접 입력', icon: '✏️' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      saveDisabled={totalSelected === 0}
      footerContent={
        <span className="text-sm font-bold text-blue-600">
          ✓ {totalSelected}개 선택
        </span>
      }
    >
      {activeTab === 'list' ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex border-b bg-gray-50/30 shrink-0">
            {[
              { id: 'all', label: `전체 (${commonCount + processCount})`, icon: null },
              { id: 'common', label: `공통 (${commonCount})`, icon: '🌐' },
              { id: 'process', label: `${processNo}번 공정 (${processCount})`, icon: '🏭' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={`flex-1 px-3 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  filterType === type.id 
                    ? 'bg-white border-blue-500 text-blue-600' 
                    : 'text-gray-500 border-transparent hover:bg-gray-100'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50/50 shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <select
              value={filterM4}
              onChange={(e) => setFilterM4(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">전체 4M</option>
              {M4_CATEGORIES.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button onClick={selectAll} className="px-3 py-2 text-xs font-bold bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-sm transition-colors">전체</button>
              <button onClick={deselectAll} className="px-3 py-2 text-xs font-bold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-sm transition-colors">해제</button>
              {onDelete && (
                <button 
                  onClick={() => setDeleteMode(!deleteMode)} 
                  className={`px-3 py-2 text-xs font-bold rounded-md shadow-sm transition-colors ${
                    deleteMode ? 'bg-red-500 text-white' : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  🗑️ 삭제
                </button>
              )}
            </div>
          </div>

          {/* 삭제 모드 안내 */}
          {deleteMode && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-red-700 font-medium">🗑️ 삭제할 작업요소를 선택하세요 (현재 워크시트 항목만 삭제 가능)</span>
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1 text-xs font-bold bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                선택 삭제
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4 bg-gray-50/20">
            {filteredElements.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                <span className="text-4xl mb-4">🔍</span>
                <p className="font-medium">검색 결과가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredElements.map(elem => {
                  const isSelected = selectedIds.has(elem.id);
                  const m4Style = getM4Style(elem.m4);
                  const existing = isExisting(elem.name);
                  return (
                    <div key={elem.id} onClick={() => toggleSelect(elem.id)} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm group ${
                      existing 
                        ? isSelected ? 'bg-green-50 border-green-400 ring-1 ring-green-400' : 'bg-green-50/50 border-green-300'
                        : isSelected ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? existing ? 'bg-green-500 border-green-500 scale-110' : 'bg-blue-500 border-blue-500 scale-110' 
                          : 'bg-white border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-inner shrink-0 ${elem.processNo === 'COMMON' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {elem.processNo === 'COMMON' ? '공통' : elem.processNo}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-black rounded border shrink-0 shadow-sm" style={m4Style}>{elem.m4}</span>
                      <span className={`flex-1 text-sm truncate font-medium ${isSelected ? (existing ? 'text-green-900' : 'text-blue-900') : 'text-gray-700'}`}>
                        {elem.name}
                        {existing && <span className="ml-1 text-[9px] text-green-600">(현재)</span>}
                      </span>
                      
                      {/* 삭제 버튼 (삭제모드 & 현재 항목만) */}
                      {deleteMode && existing && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSingle(elem.name); }}
                          className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors shrink-0"
                          title="삭제"
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
        </div>
      ) : (
        <div className="p-6 flex flex-col h-full bg-gray-50/20">
          <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="text-blue-500">➕</span> 신규 작업요소 등록</h3>
            <div className="flex gap-2">
              <select value={manualM4} onChange={(e) => setManualM4(e.target.value)} className="px-3 py-2.5 text-sm border rounded-lg w-24 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                {M4_CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
              <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && manualName.trim()) { setManualElements(prev => [...prev, { id: `manual_${Date.now()}`, m4: manualM4, name: manualName.trim(), processNo: processNo }]); setManualName(''); } }} placeholder={`${processNo}번 공정 작업요소명 입력`} className="flex-1 px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
              <button onClick={() => { if (!manualName.trim()) return; setManualElements(prev => [...prev, { id: `manual_${Date.now()}`, m4: manualM4, name: manualName.trim(), processNo: processNo }]); setManualName(''); }} disabled={!manualName.trim()} className="px-6 py-2.5 text-sm font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all disabled:bg-gray-200 active:scale-95">추가</button>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">입력된 항목 ({manualElements.length})</h3>
            {manualElements.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {manualElements.map(elem => (
                  <div key={elem.id} className="flex items-center gap-2 p-3 border rounded-lg bg-white shadow-sm border-green-200">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 shadow-inner">{processNo}</span>
                    <span className="px-2 py-0.5 text-[10px] font-black rounded border shadow-sm" style={getM4Style(elem.m4)}>{elem.m4}</span>
                    <span className="flex-1 text-sm font-medium text-gray-700 truncate">{elem.name}</span>
                    <button onClick={() => setManualElements(prev => prev.filter(e => e.id !== elem.id))} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-full transition-all">✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-20 border-2 border-dashed rounded-xl bg-white/50"><p className="text-sm">추가된 항목이 없습니다.</p></div>
            )}
          </div>
        </div>
      )}
    </BaseModal>
  );
}
