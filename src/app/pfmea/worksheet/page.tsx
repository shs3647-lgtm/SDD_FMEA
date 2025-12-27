'use client';

/**
 * @file page.tsx
 * @description FMEA 워크시트 메인 페이지
 * @author AI Assistant
 * @created 2025-12-27
 * @refactored 모듈화 - constants, hooks, tabs 분리
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProcessSelectModal from './ProcessSelectModal';
import WorkElementSelectModal from './WorkElementSelectModal';
import PFMEATopNav from '@/components/layout/PFMEATopNav';

// 모듈화된 상수, hooks, 탭 컴포넌트
import { COLORS, TABS, LEVELS, uid, getTabLabel, WorksheetState, WorkElement, Process } from './constants';
import { useWorksheetState } from './hooks';
import { 
  StructureTab, StructureColgroup, StructureHeader, StructureRow,
  FunctionTab, FunctionColgroup, FunctionHeader, FunctionRow,
  FailureTab, FailureColgroup, FailureHeader, FailureRow,
  RiskTab, RiskHeader, RiskRow,
  OptTab, OptHeader, OptRow,
  DocTab, DocHeader, DocRow,
} from './tabs';
import { 
  exportFMEAWorksheet, 
  exportStructureAnalysis, 
  importStructureAnalysis,
  downloadStructureTemplate 
} from './excel-export';

/**
 * FMEA 워크시트 메인 페이지
 */
export default function FMEAWorksheetPage() {
  const router = useRouter();
  
  // 워크시트 상태 관리 Hook
  const {
    state,
    setState,
    dirty,
    setDirty,
    isSaving,
    lastSaved,
    fmeaList,
    currentFmea,
    selectedFmeaId,
    handleFmeaChange,
    rows,
    l1Spans,
    l2Spans,
    saveToLocalStorage,
    handleInputKeyDown,
    handleInputBlur,
    handleSelect,
    addL2,
  } = useWorksheetState();
  
  // 모달 상태
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isWorkElementModalOpen, setIsWorkElementModalOpen] = useState(false);
  const [targetL2Id, setTargetL2Id] = useState<string | null>(null);
  
  // 트리 접기/펼치기 상태
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  
  const toggleCollapse = useCallback((procId: string) => {
    setCollapsedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(procId)) {
        newSet.delete(procId);
      } else {
        newSet.add(procId);
      }
      return newSet;
    });
  }, []);

  // Import 모달 상태
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 구조분석 Import 핸들러
  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportMessage(null);
    const result = await importStructureAnalysis(file, setState, setDirty);
    
    setImportMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 3초 후 메시지 숨기기
    setTimeout(() => setImportMessage(null), 3000);
  }, [setState, setDirty]);

  // 구조분석 Export 핸들러
  const handleStructureExport = useCallback(async () => {
    const fmeaName = currentFmea?.fmeaInfo?.subject || currentFmea?.project?.productName || 'PFMEA';
    await exportStructureAnalysis(state, fmeaName);
  }, [state, currentFmea]);

  // 템플릿 다운로드 핸들러
  const handleDownloadTemplate = useCallback(async () => {
    await downloadStructureTemplate();
  }, []);

  // 공정 모달 저장 핸들러
  const handleProcessSave = useCallback((selectedProcesses: { no: string; name: string }[]) => {
    setState(prev => {
      const selectedNames = selectedProcesses.map(p => p.name);
      const keepL2 = prev.l2.filter(p => !p.name.includes('클릭') && selectedNames.includes(p.name));
      const keepNames = keepL2.map(p => p.name);
      
      const newL2: Process[] = selectedProcesses
        .filter(p => !keepNames.includes(p.name))
        .map((p, idx) => ({
          id: uid(),
          no: p.no,
          name: p.name,
          order: (keepL2.length + idx + 1) * 10,
          l3: [{ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10 }]
        }));
      
      let finalL2 = [...keepL2, ...newL2];
      if (finalL2.length === 0) {
        finalL2 = [{
          id: uid(),
          no: '',
          name: '(클릭하여 공정 선택)',
          order: 10,
          l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10 }]
        }];
      }
      return { ...prev, l2: finalL2 };
    });
    setDirty(true);
  }, [setState, setDirty]);

  // 작업요소 모달 저장 핸들러
  const handleWorkElementSelect = useCallback((selectedElements: { id: string; m4: string; name: string }[]) => {
    if (!targetL2Id) return;
    
    setState(prev => {
      const newL2 = prev.l2.map(proc => {
        if (proc.id !== targetL2Id) return proc;
        
        const newL3: WorkElement[] = selectedElements.map((e, idx) => ({
          id: uid(),
          m4: e.m4,
          name: e.name,
          order: (idx + 1) * 10
        }));
        
        if (newL3.length === 0) {
          newL3.push({ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10 });
        }
        return { ...proc, l3: newL3 };
      });
      return { ...prev, l2: newL2 };
    });
    setDirty(true);
  }, [targetL2Id, setState, setDirty]);

  // 작업요소 모달 삭제 핸들러 (워크시트에서 실제 삭제)
  const handleWorkElementDelete = useCallback((deletedNames: string[]) => {
    if (!targetL2Id || deletedNames.length === 0) return;
    
    setState(prev => {
      const newL2 = prev.l2.map(proc => {
        if (proc.id !== targetL2Id) return proc;
        
        // 삭제된 이름에 해당하지 않는 작업요소만 유지
        const remainingL3 = proc.l3.filter(w => !deletedNames.includes(w.name));
        
        // 모두 삭제되면 기본 항목 추가
        if (remainingL3.length === 0) {
          remainingL3.push({ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10 });
        }
        
        return { ...proc, l3: remainingL3 };
      });
      return { ...prev, l2: newL2 };
    });
    setDirty(true);
  }, [targetL2Id, setState, setDirty]);

  // 작업요소명 수정
  const renameL3 = useCallback((l3Id: string, newName: string) => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(p => ({
        ...p,
        l3: p.l3.map(w => w.id === l3Id ? { ...w, name: newName } : w)
      }))
    }));
    setDirty(true);
  }, [setState, setDirty]);

  // 검색 필터링된 트리 데이터
  const filteredTree = useMemo(() => {
    const q = state.search.toLowerCase();
    if (!q) return state.l2;
    return state.l2.filter(proc => {
      const procLabel = `${proc.no} ${proc.name}`.toLowerCase();
      return procLabel.includes(q) || proc.l3.some(w => `${w.m4} ${w.name}`.toLowerCase().includes(q));
    });
  }, [state.l2, state.search]);

  // 공통 탭 props
  const tabProps = {
    state,
    setState,
    rows,
    l1Spans,
    l2Spans,
    setDirty,
    handleInputBlur,
    handleInputKeyDown,
    handleSelect,
    setIsProcessModalOpen,
    setIsWorkElementModalOpen,
    setTargetL2Id,
    saveToLocalStorage,
  };

  return (
    <>
      <PFMEATopNav selectedFmeaId={currentFmea?.id} />
      
      <div className="h-full flex flex-col" style={{ fontFamily: 'Segoe UI, Malgun Gothic, Arial, sans-serif', background: COLORS.bg, color: COLORS.text, paddingTop: '28px' }}>
        
        {/* ========== 상단 메뉴 바 ========== */}
        <TopMenuBar
          fmeaList={fmeaList}
          currentFmea={currentFmea}
          dirty={dirty}
          isSaving={isSaving}
          lastSaved={lastSaved}
          currentTab={state.tab}
          importMessage={importMessage}
          fileInputRef={fileInputRef}
          onFmeaChange={handleFmeaChange}
          onSave={saveToLocalStorage}
          onNavigateToList={() => router.push('/pfmea/list')}
          onExport={state.tab === 'structure' ? handleStructureExport : () => exportFMEAWorksheet(state, currentFmea?.fmeaInfo?.subject || 'PFMEA')}
          onImportClick={() => fileInputRef.current?.click()}
          onImportFile={handleImportFile}
          onDownloadTemplate={handleDownloadTemplate}
        />

        {/* ========== 메인 레이아웃 (좌측:워크시트 / 우측:트리 완전 분리) ========== */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'row',
            height: 'calc(100vh - 90px)', // 상단 메뉴 높이 제외
            overflow: 'hidden',
            border: '2px solid #00587a',
          }}
        >
          {/* ===== 좌측: 워크시트 영역 ===== */}
          <div 
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minWidth: 0,
              borderRight: state.tab === 'all' ? 'none' : '4px solid #00587a',
            }}
          >
            {/* 탭 메뉴 - 고정 */}
            <div style={{ flexShrink: 0 }}>
              <TabMenu state={state} setState={setState} />
            </div>

            {/* 테이블 제목 - 고정 (전체보기에서는 숨김) */}
            {state.tab !== 'all' && (
            <div 
              style={{ 
                flexShrink: 0,
                textAlign: 'center',
                fontWeight: 900,
                padding: '4px 0',
                fontSize: '13px',
                background: state.tab === 'structure' ? '#1a237e' : COLORS.sky2, 
                color: state.tab === 'structure' ? '#fff' : COLORS.text,
                borderBottom: `1px solid ${COLORS.line}`,
              }}
            >
              P-FMEA {getTabLabel(state.tab)}({getStepNumber(state.tab)}단계)
            </div>
            )}

            {/* 테이블 스크롤 영역 */}
            <div 
              style={{ 
                flex: 1,
                overflow: 'auto',
                background: '#fff',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                {state.tab === 'structure' && <StructureTabFull {...tabProps} />}
                {state.tab === 'function' && <FunctionTabFull {...tabProps} />}
                {state.tab === 'failure' && <FailureTabFull {...tabProps} />}
                {state.tab === 'risk' && <RiskTabFull {...tabProps} />}
                {state.tab === 'opt' && <OptTabFull {...tabProps} />}
                {state.tab === 'doc' && <DocTabFull {...tabProps} />}
                {state.tab === 'all' && <AllViewTabFull rows={rows} state={state} l1Spans={l1Spans} l2Spans={l2Spans} />}
              </table>
            </div>
          </div>

          {/* ===== 우측: 트리 영역 (전체보기에서는 숨김) ===== */}
          {state.tab !== 'all' && (
          <div 
            style={{ 
              width: '280px', 
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: '#f0f4f8',
            }}
          >
            {/* 트리 헤더 */}
            <div style={{ flexShrink: 0, background: '#e3f2fd', padding: '6px 8px', borderBottom: '1px solid #90caf9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🌳</span>
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#1565c0' }}>구조 트리</span>
              </div>
            </div>
            
            {/* 완제품명 입력 - 📦 클릭하면 메인공정 모달 */}
            <div style={{ flexShrink: 0, background: '#e3f2fd', padding: '4px 8px', borderBottom: '1px solid #90caf9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span 
                  onClick={() => setIsProcessModalOpen(true)}
                  style={{ fontSize: '14px', cursor: 'pointer', padding: '2px' }}
                  title="클릭하여 메인공정 추가/관리"
                >
                  📦
                </span>
                <input
                  type="text"
                  value={state.l1.name}
                  onChange={(e) => { setState(prev => ({ ...prev, l1: { ...prev.l1, name: e.target.value } })); setDirty(true); }}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  placeholder="완제품명+라인"
                  style={{ flex: 1, padding: '4px 8px', fontSize: '12px', fontWeight: 700, border: '1px solid #90caf9', borderRadius: '4px' }}
                />
                <button 
                  onClick={() => setIsProcessModalOpen(true)}
                  style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700, background: '#2196f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  title="공정 추가"
                >
                  +
                </button>
              </div>
            </div>

            {/* 트리 스크롤 영역 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
              <div style={{ marginLeft: '8px', borderLeft: '2px solid #90caf9', paddingLeft: '8px' }}>
                {filteredTree.sort((a, b) => a.order - b.order).map((proc, pIdx) => {
                  const isCollapsed = collapsedIds.has(proc.id);
                  const hasChildren = proc.l3.filter(w => !w.name.includes('추가') && !w.name.includes('클릭')).length > 0;
                  
                  return (
                  <div key={proc.id} style={{ marginBottom: '4px' }}>
                    {/* L2: 공정 헤더 */}
                    <div 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '4px', borderRadius: '4px',
                        background: state.selected.type === 'L2' && state.selected.id === proc.id ? '#bbdefb' : 'transparent',
                      }}
                    >
                      {/* 접기/펼치기 토글 버튼 */}
                      <span 
                        onClick={() => toggleCollapse(proc.id)}
                        style={{ 
                          fontSize: '10px', 
                          color: hasChildren ? '#1976d2' : '#ccc', 
                          cursor: hasChildren ? 'pointer' : 'default',
                          width: '14px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                        }}
                        title={isCollapsed ? '펼치기' : '접기'}
                      >
                        {isCollapsed ? '▷' : '▼'}
                      </span>
                      
                      {/* 공정 아이콘 + 공정명 - 클릭하면 작업요소 모달 열기 */}
                      <span 
                        onClick={() => { handleSelect('L2', proc.id); setTargetL2Id(proc.id); setIsWorkElementModalOpen(true); }}
                        style={{ fontSize: '12px', cursor: 'pointer' }}
                        title="클릭하여 작업요소 관리"
                      >
                        📁
                      </span>
                      
                      {/* 공정명 - 클릭하면 작업요소 모달 (공정번호는 팝업에서 입력한 번호) */}
                      <div 
                        onClick={() => { handleSelect('L2', proc.id); setTargetL2Id(proc.id); setIsWorkElementModalOpen(true); }}
                        style={{ flex: 1, padding: '2px 6px', fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '3px', background: '#fff', cursor: 'pointer' }}
                        title="클릭하여 작업요소 관리"
                      >
                        {proc.no ? `${proc.no}-${proc.name}` : `${pIdx + 1}-${proc.name}`}
                      </div>
                      
                      {/* 작업요소 개수 표시 */}
                      <span style={{ fontSize: '9px', color: '#888', background: '#e0e0e0', padding: '1px 4px', borderRadius: '8px' }}>
                        {proc.l3.filter(w => !w.name.includes('추가') && !w.name.includes('클릭')).length}
                      </span>
                    </div>

                    {/* L3: 작업요소 (접힌 상태면 숨김) */}
                    {!isCollapsed && (
                      <div style={{ marginLeft: '20px' }}>
                        {proc.l3.filter(w => !state.search || `${w.m4} ${w.name}`.toLowerCase().includes(state.search.toLowerCase())).sort((a, b) => a.order - b.order).map((w, wIdx) => {
                          // 작업요소 번호: 공정번호.순번 (공통은 00.N)
                          const procNum = proc.no || '00';
                          const elemNum = `${procNum}.${wIdx + 1}`;
                          // 4M 배지 색상
                          const m4Colors: Record<string, { bg: string; text: string }> = {
                            MN: { bg: '#e3f2fd', text: '#1565c0' },
                            MC: { bg: '#fff8e1', text: '#f57c00' },
                            MT: { bg: '#e8f5e9', text: '#2e7d32' },
                            EN: { bg: '#fce4ec', text: '#c2185b' },
                          };
                          const m4Style = m4Colors[w.m4] || { bg: '#f5f5f5', text: '#666' };
                          
                          return (
                          <div 
                            key={w.id} 
                            onClick={() => handleSelect('L3', w.id)}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 4px', cursor: 'pointer', borderRadius: '3px',
                              background: state.selected.type === 'L3' && state.selected.id === w.id ? '#c8e6c9' : 'transparent',
                            }}
                          >
                            {/* 4M 배지 */}
                            <span style={{ 
                              fontSize: '9px', 
                              fontWeight: 700, 
                              padding: '0px 2px', 
                              borderRadius: '2px',
                              background: m4Style.bg,
                              color: m4Style.text,
                              minWidth: '16px',
                              textAlign: 'center',
                            }}>
                              {w.m4 || '-'}
                            </span>
                            {/* 번호 */}
                            <span style={{ fontSize: '9px', color: '#888', minWidth: '24px' }}>{elemNum}</span>
                            {/* 이름 */}
                            <input
                              type="text"
                              value={w.name}
                              onChange={(e) => renameL3(w.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ flex: 1, padding: '1px 3px', fontSize: '10px', border: '1px solid #e0e0e0', borderRadius: '2px', background: '#fff' }}
                            />
                          </div>
                        );})}
                      </div>
                    )}
                  </div>
                );})}
              </div>
            </div>

            {/* 하단 정보 */}
            <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '11px', color: '#666' }}>
              공정: {state.l2.filter(p => !p.name.includes('클릭')).length}개 | 
              작업요소: {state.l2.reduce((sum, p) => sum + p.l3.filter(w => !w.name.includes('추가') && !w.name.includes('클릭')).length, 0)}개
            </div>
          </div>
          )}
        </div>

        {/* 모달 */}
        <ProcessSelectModal
          isOpen={isProcessModalOpen}
          onClose={() => setIsProcessModalOpen(false)}
          onSave={handleProcessSave}
          existingProcessNames={state.l2.filter(p => !p.name.includes('클릭')).map(p => p.name)}
        />

        <WorkElementSelectModal
          isOpen={isWorkElementModalOpen}
          onClose={() => { setIsWorkElementModalOpen(false); setTargetL2Id(null); }}
          onSave={handleWorkElementSelect}
          onDelete={handleWorkElementDelete}
          processNo={state.l2.find(p => p.id === targetL2Id)?.no || ''}
          processName={state.l2.find(p => p.id === targetL2Id)?.name || ''}
          existingElements={state.l2.find(p => p.id === targetL2Id)?.l3.filter(w => !w.name.includes('추가')).map(w => w.name) || []}
        />
      </div>
    </>
  );
}

// ============ 하위 컴포넌트들 ============

function getStepNumber(tab: string): number {
  const map: Record<string, number> = { structure: 2, function: 3, failure: 4, risk: 5, opt: 6, doc: 7, all: 0 };
  return map[tab] || 0;
}

interface TopMenuBarProps {
  fmeaList: any[];
  currentFmea: any;
  dirty: boolean;
  isSaving: boolean;
  lastSaved: string;
  currentTab: string;
  importMessage: { type: 'success' | 'error'; text: string } | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFmeaChange: (id: string) => void;
  onSave: () => void;
  onNavigateToList: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

function TopMenuBar({ 
  fmeaList, currentFmea, dirty, isSaving, lastSaved, currentTab, importMessage, fileInputRef,
  onFmeaChange, onSave, onNavigateToList, onExport, onImportClick, onImportFile, onDownloadTemplate 
}: TopMenuBarProps) {
  const [showImportMenu, setShowImportMenu] = React.useState(false);

  return (
    <div className="flex items-center py-1 gap-2 flex-wrap" style={{ background: COLORS.blue, paddingLeft: '4px', paddingRight: '8px' }}>
      {/* FMEA명 */}
      <div className="flex items-center gap-1">
        <span className="text-white text-xs font-bold cursor-pointer hover:underline" onClick={onNavigateToList}>📋 FMEA명:</span>
        <select
          value={currentFmea?.id || '__NEW__'}
          onChange={(e) => onFmeaChange(e.target.value)}
          className="px-1 py-0.5 text-xs font-semibold rounded border-0"
          style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', minWidth: '140px' }}
        >
          <option value="__NEW__" style={{ color: '#333', fontWeight: 'bold' }}>📄 빈화면 (새로 작성)</option>
          {fmeaList.map((fmea: any) => (
            <option key={fmea.id} value={fmea.id} style={{ color: '#333' }}>
              {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
            </option>
          ))}
        </select>
        <button onClick={onNavigateToList} className="px-1 py-0.5 text-xs text-white rounded hover:bg-white/20">📋</button>
      </div>

      <div className="w-px h-5 bg-white/40" />

      {/* 저장/Import/Export */}
      <div className="flex items-center gap-1 relative">
        <button onClick={onSave} disabled={isSaving} className="px-1.5 py-0.5 text-xs font-bold rounded"
          style={{ background: isSaving ? '#ff9800' : dirty ? '#4caf50' : 'rgba(255,255,255,0.18)', color: '#fff' }}>
          {isSaving ? '⏳저장중' : dirty ? '💾저장' : '✅저장됨'}
        </button>
        
        {/* Import 버튼 및 드롭다운 */}
        <div className="relative">
          <button 
            onClick={() => setShowImportMenu(!showImportMenu)}
            className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" 
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            📥Import▾
          </button>
          {showImportMenu && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border z-50"
              style={{ minWidth: '160px' }}
              onMouseLeave={() => setShowImportMenu(false)}
            >
              <button
                onClick={() => { 
                  fileInputRef.current?.click(); 
                  setShowImportMenu(false); 
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b"
              >
                📂 Excel 파일 가져오기
              </button>
              <button
                onClick={() => { 
                  onDownloadTemplate(); 
                  setShowImportMenu(false); 
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50"
              >
                📋 템플릿 다운로드
              </button>
            </div>
          )}
        </div>
        
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={onImportFile}
          className="hidden"
        />
        
        <button onClick={onExport} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(255,255,255,0.18)' }}>📤Export</button>
        
        {/* Import 결과 메시지 */}
        {importMessage && (
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ 
              background: importMessage.type === 'success' ? '#4caf50' : '#f44336',
              color: '#fff'
            }}
          >
            {importMessage.text}
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-white/40" />

      {/* 특별특성/AP/RPN/LLD */}
      <div className="flex items-center gap-1">
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>⭐특별특성</button>
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,100,100,0.5)' }}>🔴5AP</button>
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,165,0,0.5)' }}>🟠6AP</button>
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📊RPN</button>
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📚LLD</button>
      </div>
    </div>
  );
}

interface TabMenuProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
}

function TabMenu({ state, setState }: TabMenuProps) {
  return (
    <div className="flex-shrink-0 bg-white py-0.5" style={{ borderBottom: `2px solid ${COLORS.blue}`, paddingLeft: 0, paddingRight: '8px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* 탭 */}
          <div className="flex gap-px">
            {TABS.map(tab => {
              const isActive = state.tab === tab.id;
              const activeColor = tab.id === 'structure' ? '#1a237e' : COLORS.blue;
              return (
                <button
                  key={tab.id}
                  onClick={() => setState(prev => ({ ...prev, tab: tab.id }))}
                  className="px-2 py-0.5 text-xs font-bold cursor-pointer"
                  style={{
                    background: isActive ? activeColor : '#e8f0f8',
                    borderTop: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderRight: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderLeft: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderBottom: 'none',
                    borderRadius: '2px 2px 0 0',
                    color: isActive ? '#fff' : COLORS.text
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          {/* 레벨 */}
          <div className="flex gap-px">
            {LEVELS.map(lv => (
              <button
                key={lv.id}
                onClick={() => setState(prev => ({ ...prev, levelView: lv.id }))}
                className="px-1.5 py-0.5 text-xs font-bold cursor-pointer"
                style={{
                  background: state.levelView === lv.id ? '#fff' : '#f0f0f0',
                  border: `1px solid ${state.levelView === lv.id ? COLORS.blue : '#d0d0d0'}`,
                  borderRadius: '3px',
                  color: state.levelView === lv.id ? COLORS.blue : '#666'
                }}
              >
                {lv.label}
              </button>
            ))}
          </div>
          
          {/* 단계별 토글 버튼 - 전체보기(All) 선택 시에만 표시 (All 버튼 바로 옆) */}
          {state.tab === 'all' && (
            <>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <StepToggleButtons state={state} setState={setState} />
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="w-px h-4 bg-gray-300" />
          <button
            onClick={() => setState(prev => ({ ...prev, tab: 'all', levelView: 'all' }))}
            className="px-1.5 py-0.5 text-xs font-bold cursor-pointer"
            style={{
              background: state.tab === 'all' ? COLORS.blue : '#fff',
              border: `1px solid ${COLORS.blue}`,
              borderRadius: '3px',
              color: state.tab === 'all' ? '#fff' : COLORS.blue
            }}
          >
            전체보기
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ 단계별 토글 버튼 ============
function StepToggleButtons({ state, setState }: { state: WorksheetState; setState: React.Dispatch<React.SetStateAction<WorksheetState>> }) {
  const steps = [
    { step: 2, label: '2단계', color: '#1565c0' },
    { step: 3, label: '3단계', color: '#7b1fa2' },
    { step: 4, label: '4단계', color: '#c62828' },
    { step: 5, label: '5단계', color: '#00695c' },
    { step: 6, label: '6단계', color: '#ff6f00' },
  ];

  const toggleStep = (step: number) => {
    setState(prev => {
      const currentSteps = prev.visibleSteps || [2, 3, 4, 5, 6];
      const isVisible = currentSteps.includes(step);
      
      // 최소 1개는 선택되어야 함
      if (isVisible && currentSteps.length === 1) return prev;
      
      const newSteps = isVisible
        ? currentSteps.filter(s => s !== step)
        : [...currentSteps, step].sort((a, b) => a - b);
      
      return { ...prev, visibleSteps: newSteps };
    });
  };

  const visibleSteps = state.visibleSteps || [2, 3, 4, 5, 6];

  return (
    <div className="flex gap-px">
      {steps.map(s => {
        const isActive = visibleSteps.includes(s.step);
        return (
          <button
            key={s.step}
            onClick={() => toggleStep(s.step)}
            className="px-1.5 py-0.5 text-xs font-bold cursor-pointer"
            style={{
              background: isActive ? s.color : '#f0f0f0',
              border: `1px solid ${isActive ? s.color : '#d0d0d0'}`,
              borderRadius: '3px',
              color: isActive ? '#fff' : '#999',
              opacity: isActive ? 1 : 0.6,
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// ============ 탭별 전체 컴포넌트 (헤더 sticky + 바디) ============

// 공통 sticky thead 스타일 (반드시 background 있어야 스크롤 시 내용 안 비침)
const stickyTheadStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 20, background: '#fff' };

// 구조분석 탭
function StructureTabFull(props: any) {
  const { rows, l1Spans, l2Spans, state, setState, setDirty, handleInputBlur, handleInputKeyDown, handleSelect, setIsProcessModalOpen, setIsWorkElementModalOpen, setTargetL2Id } = props;
  return (
    <>
      <StructureColgroup />
      <thead style={stickyTheadStyle}>
        <StructureHeader onProcessModalOpen={() => setIsProcessModalOpen(true)} />
      </thead>
      <tbody>
        {rows.map((row: any, idx: number) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <StructureRow row={row} idx={idx} state={state} setState={setState} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} setDirty={setDirty} handleInputBlur={handleInputBlur} handleInputKeyDown={handleInputKeyDown} handleSelect={handleSelect} setIsProcessModalOpen={setIsProcessModalOpen} setIsWorkElementModalOpen={setIsWorkElementModalOpen} setTargetL2Id={setTargetL2Id} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

// 기능분석 탭
function FunctionTabFull(props: any) {
  const { rows, l1Spans, l2Spans, state, setState, setDirty, handleInputBlur, handleInputKeyDown } = props;
  return (
    <>
      <FunctionColgroup />
      <thead style={stickyTheadStyle}><FunctionHeader /></thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center text-gray-400 py-8">
              구조분석 탭에서 데이터를 먼저 입력하세요.
            </td>
          </tr>
        ) : (
          rows.map((row: any, idx: number) => (
            <tr key={row.l3Id} style={{ height: '28px' }}>
              <FunctionRow row={row} idx={idx} state={state} setState={setState} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} setDirty={setDirty} handleInputBlur={handleInputBlur} handleInputKeyDown={handleInputKeyDown} />
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}

// 고장분석 탭
function FailureTabFull(props: any) {
  const { rows, l1Spans, l2Spans, state, setState, setDirty, handleInputBlur, handleInputKeyDown, saveToLocalStorage } = props;
  return (
    <>
      <FailureColgroup />
      <thead style={stickyTheadStyle}><FailureHeader /></thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center text-gray-400 py-8">
              구조분석 탭에서 데이터를 먼저 입력하세요.
            </td>
          </tr>
        ) : (
          rows.map((row: any, idx: number) => (
            <tr key={row.l3Id} style={{ height: '28px' }}>
              <FailureRow row={row} idx={idx} state={state} setState={setState} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} setDirty={setDirty} handleInputBlur={handleInputBlur} handleInputKeyDown={handleInputKeyDown} saveToLocalStorage={saveToLocalStorage} />
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}

// 리스크분석 탭
function RiskTabFull(props: any) {
  const { rows, l1Spans, l2Spans, state } = props;
  return (
    <>
      <thead style={stickyTheadStyle}><RiskHeader /></thead>
      <tbody>
        {rows.map((row: any, idx: number) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <RiskRow row={row} idx={idx} state={state} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

// 최적화 탭
function OptTabFull(props: any) {
  const { rows, l1Spans, l2Spans, state } = props;
  return (
    <>
      <thead style={stickyTheadStyle}><OptHeader /></thead>
      <tbody>
        {rows.map((row: any, idx: number) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <OptRow row={row} idx={idx} state={state} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

// 문서화 탭
function DocTabFull(props: any) {
  const { rows, l1Spans, l2Spans, state } = props;
  return (
    <>
      <thead style={stickyTheadStyle}><DocHeader /></thead>
      <tbody>
        {rows.map((row: any, idx: number) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <DocRow row={row} idx={idx} state={state} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

// 전체보기 탭 - 38열 FMEA 워크시트 (Excel과 동일, 셀합치기 적용)
function AllViewTabFull({ rows, state, l1Spans, l2Spans }: { 
  rows: FlatRow[]; 
  state: WorksheetState; 
  l1Spans: number[]; 
  l2Spans: number[]; 
}) {
  // 38열 컬럼 정의 (Excel "PFMEA 40열.xlsx"와 동일)
  const allViewColumns = [
    // 구조분석 2단계 (4열)
    { id: 'l1Name', label: '완제품 공정명', width: '80px', step: 2 },
    { id: 'l2Name', label: 'NO+공정명', width: '90px', step: 2 },
    { id: 'm4', label: '4M', width: '22px', step: 2 },
    { id: 'l3Name', label: '작업요소', width: '80px', step: 2 },
    // 기능분석 3단계 (8열)
    { id: 'l1Type', label: '구분', width: '40px', step: 3 },
    { id: 'l1Function', label: '완제품기능', width: '80px', step: 3 },
    { id: 'l1Requirement', label: '요구사항', width: '80px', step: 3 },
    { id: 'l2Function', label: '공정기능', width: '80px', step: 3 },
    { id: 'l2ProductChar', label: '제품특성', width: '60px', step: 3 },
    { id: 'l3Type', label: '작업요소', width: '40px', step: 3 },
    { id: 'l3Function', label: '작업요소기능', width: '80px', step: 3 },
    { id: 'l3ProcessChar', label: '공정특성', width: '60px', step: 3 },
    // 고장분석 4단계 (6열)
    { id: 'feType', label: '구분', width: '40px', step: 4 },
    { id: 'failureEffect', label: '고장영향(FE)', width: '80px', step: 4 },
    { id: 'severity', label: '심각도', width: '35px', step: 4 },
    { id: 'failureMode', label: '고장형태(FM)', width: '80px', step: 4 },
    { id: 'fcType', label: '작업요소', width: '40px', step: 4 },
    { id: 'failureCause', label: '고장원인(FC)', width: '80px', step: 4 },
    // 리스크분석 5단계 (7열)
    { id: 'prevention', label: '예방관리(PC)', width: '80px', step: 5 },
    { id: 'occurrence', label: '발생도', width: '35px', step: 5 },
    { id: 'detection', label: '검출관리(DC)', width: '80px', step: 5 },
    { id: 'detectability', label: '검출도', width: '35px', step: 5 },
    { id: 'ap', label: 'AP', width: '30px', step: 5 },
    { id: 'specialChar', label: '특별특성', width: '50px', step: 5 },
    { id: 'lessonLearned', label: '습득교훈', width: '80px', step: 5 },
    // 최적화 6단계 (13열)
    { id: 'preventionImprove', label: '예방관리개선', width: '80px', step: 6 },
    { id: 'detectionImprove', label: '검출관리개선', width: '80px', step: 6 },
    { id: 'responsible', label: '책임자성명', width: '60px', step: 6 },
    { id: 'targetDate', label: '목표완료일자', width: '70px', step: 6 },
    { id: 'status', label: '상태', width: '40px', step: 6 },
    { id: 'resultEvidence', label: '개선결과근거', width: '80px', step: 6 },
    { id: 'completionDate', label: '완료일자', width: '70px', step: 6 },
    { id: 'newSeverity', label: '심각도', width: '35px', step: 6 },
    { id: 'newOccurrence', label: '발생도', width: '35px', step: 6 },
    { id: 'newDetectability', label: '검출도', width: '35px', step: 6 },
    { id: 'newSpecialChar', label: '특별특성', width: '50px', step: 6 },
    { id: 'newAP', label: 'AP', width: '30px', step: 6 },
    { id: 'remarks', label: '비고', width: '80px', step: 6 },
  ];

  // 표시할 단계 목록
  const visibleSteps = state.visibleSteps || [2, 3, 4, 5, 6];

  // 필터링된 컬럼
  const filteredColumns = allViewColumns.filter(col => visibleSteps.includes(col.step));

  // 단계별 그룹 정의 (필터링)
  const stepGroups = [
    { step: 2, name: 'P-FMEA 구조분석(2단계)', count: 4, bg: '#1565c0' },
    { step: 3, name: 'P-FMEA 기능분석(3단계)', count: 8, bg: '#7b1fa2' },
    { step: 4, name: 'P-FMEA 고장분석(4단계)', count: 6, bg: '#c62828' },
    { step: 5, name: 'P-FMEA 리스크분석(5단계)', count: 7, bg: '#00695c' },
    { step: 6, name: 'P-FMEA 최적화(6단계)', count: 13, bg: '#ff6f00' },
  ].filter(g => visibleSteps.includes(g.step));

  // 서브 그룹 정의 (3행) - 필터링
  const subGroups = [
    // 구조분석
    { label: '1. 완제품 공정명', cols: 1, step: 2 },
    { label: '2. 메인 공정명', cols: 1, step: 2 },
    { label: '3. 작업 요소명', cols: 2, step: 2 },
    // 기능분석
    { label: '1. 완제품 공정기능/요구사항', cols: 3, step: 3 },
    { label: '2. 메인공정기능 및 제품특성', cols: 2, step: 3 },
    { label: '3. 작업요소의 기능 및 공정특성', cols: 3, step: 3 },
    // 고장분석
    { label: '1. 자사/고객/사용자 고장영향(FE)', cols: 3, step: 4 },
    { label: '2. 메인공정 고장형태(FM)', cols: 1, step: 4 },
    { label: '3. 작업요소 고장원인(FC)', cols: 2, step: 4 },
    // 리스크분석
    { label: '현재 예방관리', cols: 2, step: 5 },
    { label: '현재 검출관리', cols: 2, step: 5 },
    { label: '리스크 평가', cols: 3, step: 5 },
    // 최적화
    { label: '계획', cols: 4, step: 6 },
    { label: '결과 모니터링', cols: 3, step: 6 },
    { label: '효과 평가', cols: 6, step: 6 },
  ].filter(sg => visibleSteps.includes(sg.step));

  // 단계별 색상
  const getStepColor = (step: number) => {
    const colors: Record<number, string> = {
      2: '#1565c0', // 구조 - 파랑
      3: '#7b1fa2', // 기능 - 보라
      4: '#c62828', // 고장 - 빨강
      5: '#00695c', // 리스크 - 청록
      6: '#ff6f00', // 최적화 - 주황
    };
    return colors[step] || '#666';
  };

  // 데이터 가져오기 함수
  const getCellValue = (row: FlatRow, colId: string): string => {
    switch (colId) {
      case 'l1Name': return row.l1Name || '';
      case 'l2Name': return row.l2No ? `${row.l2No} ${row.l2Name}` : row.l2Name;
      case 'm4': return row.m4 || '';
      case 'l3Name': return row.l3Name || '';
      case 'l1Function': return row.l1Function || '';
      case 'l1Requirement': return row.l1Requirement || '';
      case 'l2Function': return row.l2Function || '';
      case 'l2ProductChar': return row.l2ProductChar || '';
      case 'l3Function': return row.l3Function || '';
      case 'l3ProcessChar': return row.l3ProcessChar || '';
      case 'failureEffect': return row.l1FailureEffect || '';
      case 'severity': return row.l1Severity?.toString() || '';
      case 'failureMode': return row.l2FailureMode || '';
      case 'failureCause': return row.l3FailureCause || '';
      default: return '';
    }
  };

  return (
    <>
      {/* Colgroup - 컬럼 너비 정의 */}
      <colgroup>
        {filteredColumns.map((col, i) => (
          <col key={i} style={{ width: col.width }} />
        ))}
      </colgroup>

      {/* 헤더 - sticky 고정 */}
      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        {/* 1행: 단계별 그룹 헤더 */}
        <tr>
          {stepGroups.map(g => (
            <th
              key={g.step}
              colSpan={g.count}
              style={{
                background: g.bg,
                color: '#fff',
                border: '1px solid #fff',
                padding: '6px 4px',
                fontWeight: 900,
                fontSize: '11px',
                textAlign: 'center',
              }}
            >
              {g.name}
            </th>
          ))}
        </tr>
        {/* 2행: 서브 그룹 헤더 */}
        <tr>
          {subGroups.map((sg, i) => (
            <th
              key={i}
              colSpan={sg.cols}
              style={{
                background: getStepColor(sg.step),
                color: '#fff',
                border: '1px solid #fff',
                padding: '4px 2px',
                fontWeight: 700,
                fontSize: '9px',
                textAlign: 'center',
                opacity: 0.85,
              }}
            >
              {sg.label}
            </th>
          ))}
        </tr>
        {/* 3행: 컬럼 헤더 */}
        <tr>
          {filteredColumns.map((col, i) => (
            <th
              key={i}
              style={{
                background: getStepColor(col.step),
                color: '#fff',
                border: '1px solid #ccc',
                padding: '3px 2px',
                fontWeight: 600,
                fontSize: '8px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                opacity: 0.75,
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      {/* 바디 - 데이터 (셀합치기 적용) */}
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={filteredColumns.length} className="text-center text-gray-400 py-8">
              구조분석 탭에서 데이터를 먼저 입력하세요.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => {
            const l1Span = l1Spans[idx];
            const l2Span = l2Spans[idx];
            
            // L1 레벨 컬럼 (완제품 기준 병합)
            const l1Columns = ['l1Name', 'l1Type', 'l1Function', 'l1Requirement', 'feType', 'failureEffect', 'severity'];
            // L2 레벨 컬럼 (공정 기준 병합)
            const l2Columns = ['l2Name', 'l2Function', 'l2ProductChar', 'failureMode'];
            
            return (
              <tr key={row.l3Id} style={{ height: '26px' }}>
                {filteredColumns.map((col, i) => {
                  // L1 레벨 셀 - 병합 처리
                  if (l1Columns.includes(col.id)) {
                    if (l1Span === 0) return null; // 병합된 셀은 렌더링 안함
                    return (
                      <td
                        key={i}
                        rowSpan={l1Span > 0 ? l1Span : undefined}
                        style={{
                          border: '1px solid #ddd',
                          padding: '2px 3px',
                          fontSize: '9px',
                          background: '#e3f2fd',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                        }}
                      >
                        {getCellValue(row, col.id)}
                      </td>
                    );
                  }
                  
                  // L2 레벨 셀 - 병합 처리
                  if (l2Columns.includes(col.id)) {
                    if (l2Span === 0) return null; // 병합된 셀은 렌더링 안함
                    return (
                      <td
                        key={i}
                        rowSpan={l2Span > 0 ? l2Span : undefined}
                        style={{
                          border: '1px solid #ddd',
                          padding: '2px 3px',
                          fontSize: '9px',
                          background: '#e8f5e9',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                        }}
                      >
                        {getCellValue(row, col.id)}
                      </td>
                    );
                  }
                  
                  // L3 레벨 셀 (작업요소) - 병합 안함
                  return (
                    <td
                      key={i}
                      style={{
                        border: '1px solid #ddd',
                        padding: '2px 3px',
                        fontSize: '9px',
                        background: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                      }}
                    >
                      {getCellValue(row, col.id)}
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );
}

