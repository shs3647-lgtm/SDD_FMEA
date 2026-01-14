/**
 * @file ProcessFlowInputModal.tsx
 * @description CP 怨듭젙紐??낅젰 紐⑤떖 - PFMEA ProcessSelectModal 踰ㅼ튂留덊궧
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
  // ?곗냽?낅젰 紐⑤뱶: ??????뚰겕?쒗듃??利됱떆 諛섏쁺 + ????異붽?
  onContinuousAdd?: (process: ProcessItem, addNewRow: boolean) => void;
  // ?꾩옱 ???몃뜳??(?먮룞 ?낅젰 紐⑤뱶??
  currentRowIdx?: number;
}

// DB?먯꽌 留덉뒪??FMEA 怨듭젙 濡쒕뱶
const loadMasterProcessesFromDB = async (): Promise<ProcessItem[]> => {
  try {
    // 留덉뒪??FMEA (pfm26-M001) 怨듭젙 ?곗씠??議고쉶
    const res = await fetch('/api/fmea/master-processes');
    if (res.ok) {
      const data = await res.json();
      if (data.processes && data.processes.length > 0) {
        console.log('??DB?먯꽌 留덉뒪??怨듭젙 濡쒕뱶:', data.processes.length, '媛?);
        return data.processes;
      }
    }
  } catch (e) {
    console.error('留덉뒪??怨듭젙 濡쒕뱶 ?ㅽ뙣:', e);
  }
  return [];
};

// 湲곗큹?뺣낫?먯꽌 怨듭젙紐?濡쒕뱶 (localStorage ?대갚)
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
  
  // ???곗냽?낅젰 紐⑤뱶 ?곹깭
  const [continuousMode, setContinuousMode] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  
  // ?쒕옒洹??곹깭
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ top: 200, right: 350 });

  // ?쒕옒洹??쒖옉
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // ?쒕옒洹?以?  useEffect(() => {
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

  // 紐⑤떖???대┫ ???꾩튂 珥덇린??(?곗륫 350px)
  useEffect(() => {
    if (isOpen) {
      setModalPosition({ top: 200, right: 350 });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setDataSource('');
      
      // DB?먯꽌 留덉뒪??怨듭젙 濡쒕뱶 (?곗꽑), ?놁쑝硫?localStorage ?대갚
      const loadData = async () => {
        console.log('?봽 CP 怨듭젙 ?곗씠??濡쒕뱶 ?쒖옉...');
        
        let loaded = await loadMasterProcessesFromDB();
        
        if (loaded.length > 0) {
          setDataSource('Master FMEA (DB)');
          console.log('??留덉뒪??怨듭젙 ?ъ슜:', loaded.length, '媛?);
        } else {
          // DB???놁쑝硫?localStorage?먯꽌 濡쒕뱶
          loaded = loadProcessesFromBasicInfo();
          if (loaded.length > 0) {
            setDataSource('localStorage');
            console.log('?좑툘 localStorage ?대갚:', loaded.length, '媛?);
          } else {
            setDataSource('?놁쓬 - 吏곸젒 ?낅젰 ?꾩슂');
            console.log('??怨듭젙 ?곗씠???놁쓬');
          }
        }
        
        console.log('?뱥 濡쒕뱶??怨듭젙:', loaded.map(p => p.name).join(', '));
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
      // ???곗냽?낅젰 ?곹깭 珥덇린??      setContinuousMode(false);
      setAddedCount(0);
    }
  }, [isOpen, existingProcessNames]);

  const filteredProcesses = useMemo(() => {
    let result = processes;
    
    // 寃???꾪꽣留?    if (search.trim()) {
      const q = search.toLowerCase();
      result = processes.filter(p => 
        p.no.includes(q) || p.name.toLowerCase().includes(q)
      );
    }
    
    // 怨듭젙 踰덊샇 湲곗? ?レ옄 ?뺣젹 (10, 20, 30 ?쒖꽌)
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

  // ?붾툝?대┃ ?섏젙
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

  // ?좉퇋 怨듭젙 異붽?
  const handleAddNew = () => {
    if (!newName.trim()) return;
    
    // 以묐났 ?뺤씤 - ?대? 議댁옱?섎㈃ 臾댁떆
    if (processes.some(p => p.name === newName.trim())) return;
    
    // 怨듭젙踰덊샇 ?먮룞 ?앹꽦 (?낅젰 ?덊뻽?쇰㈃)
    const procNo = newNo.trim() || String((processes.length + 1) * 10);
    
    const newProc: ProcessItem = {
      id: `proc_new_${Date.now()}`,
      no: procNo,
      name: newName.trim(),
    };
    
    setProcesses(prev => [newProc, ...prev]);
    setSelectedIds(prev => new Set([...prev, newProc.id]));
    
    // localStorage?먮룄 ???    try {
      const savedData = localStorage.getItem('pfmea_master_data') || '[]';
      const masterData = JSON.parse(savedData);
      masterData.push({
        id: newProc.id,
        code: 'A2',
        value: newProc.name,
        processNo: procNo,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('pfmea_master_data', JSON.stringify(masterData));
      console.log('???좉퇋 怨듭젙 ???', newProc.name);
    } catch (e) {
      console.error('????ㅻ쪟:', e);
    }
    
    // ???곗냽?낅젰 紐⑤뱶: ?뚰겕?쒗듃??利됱떆 諛섏쁺 + ????異붽?
    if (continuousMode && onContinuousAdd) {
      onContinuousAdd(newProc, true);
      setAddedCount(prev => prev + 1);
      console.log(`[?곗냽?낅젰] "${newProc.name}" 異붽? ?꾨즺 (珥?${addedCount + 1}媛?`);
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
        {/* ?ㅻ뜑 - ?쒕옒洹?媛??*/}
        <div 
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">?룺</span>
            <h2 className="text-xs font-bold">怨듭젙紐??좏깮</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">?リ린</button>
        </div>

        {/* ?곗씠???뚯뒪 + ?곗냽?낅젰 ?좉? */}
        <div className="px-3 py-1 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-green-700">怨듭젙紐?/span>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-2 py-0.5 rounded ${dataSource.includes('Master') ? 'bg-blue-100 text-blue-700' : dataSource.includes('local') ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
              {loading ? '濡쒕뵫以?..' : `?뱛 ${dataSource} (${processes.length}媛?`}
            </span>
            {/* ???곗냽?낅젰 ?좉? */}
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
                title={continuousMode ? '?곗냽?낅젰 紐⑤뱶 ON: ??????뚰겕?쒗듃??利됱떆 諛섏쁺 + ????異붽?' : '?곗냽?낅젰 紐⑤뱶 OFF'}
              >
                ?봽 ?곗냽?낅젰 {continuousMode ? 'ON' : 'OFF'}
                {continuousMode && addedCount > 0 && <span className="ml-1 px-1 bg-white/30 rounded">{addedCount}</span>}
              </button>
            )}
          </div>
        </div>

        {/* ?좉퇋 怨듭젙 異붽? */}
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
            placeholder={continuousMode ? "?낅젰 ??Enter ??利됱떆 諛섏쁺 + ????異붽?" : "怨듭젙紐??낅젰..."}
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
            ???          </button>
        </div>

        {/* 寃??+ 踰꾪듉 */}
        <div className="px-2 py-1.5 border-b bg-gray-50">
          {/* 泥?以? 寃??*/}
          <div className="mb-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="?뵇 怨듭젙紐??먮뒗 踰덊샇 寃??.."
              className="w-full px-2 py-0.5 text-[9px] border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          {/* ??踰덉㎏ 以? 踰꾪듉??*/}
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="px-4 py-1.5 text-[13px] font-bold bg-blue-500 text-white rounded hover:bg-blue-600">?꾩껜</button>
            <button onClick={deselectAll} className="px-4 py-1.5 text-[13px] font-bold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">?댁젣</button>
            <button onClick={handleSave} className="px-4 py-1.5 text-[13px] font-bold bg-green-600 text-white rounded hover:bg-green-700">?곸슜</button>
          </div>
        </div>

        {/* 而댄뙥???뚯씠釉?- 怨좎젙 ?믪씠 */}
        <div className="overflow-auto p-2 h-80 min-h-[320px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">留덉뒪??怨듭젙 ?곗씠??濡쒕뵫以?..</p>
              </div>
            </div>
          ) : processes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-lg mb-2">?벊</p>
                <p className="text-xs text-gray-500 mb-2">?깅줉??怨듭젙???놁뒿?덈떎</p>
                <p className="text-[10px] text-gray-400">???낅젰李쎌뿉??吏곸젒 異붽??댁＜?몄슂</p>
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
                    {/* 泥댄겕諛뺤뒪 */}
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? isCurrent ? 'bg-green-500 border-green-500' : 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}>
                      {isSelected && <span className="text-white text-[8px] font-bold">??/span>}
                    </div>

                    {/* 踰덊샇 */}
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded min-w-[28px] text-center">
                      {proc.no}
                    </span>

                    {/* ?대쫫 (?섏젙 紐⑤뱶 or ?쒖떆 紐⑤뱶) */}
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
              {/* 鍮???梨꾩슦湲?- 理쒖냼 12媛????좎? */}
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

        {/* ?명꽣 - ?좏깮 ???쒖떆留?*/}
        <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-600">??{selectedIds.size}媛??좏깮</span>
        </div>
      </div>
    </div>
  );
}

