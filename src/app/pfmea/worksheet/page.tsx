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
  FunctionTab, FunctionHeader, FunctionRow,
  FailureTab, FailureHeader, FailureRow,
  RiskTab, RiskHeader, RiskRow,
  OptTab, OptHeader, OptRow,
  DocTab, DocHeader, DocRow,
} from './tabs';

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
    setTargetL2Id(null);
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
          onFmeaChange={handleFmeaChange}
          onSave={saveToLocalStorage}
          onNavigateToList={() => router.push('/pfmea/list')}
        />

        {/* ========== 메인 레이아웃 ========== */}
        <div className="flex-1 flex overflow-hidden" style={{ gap: 0 }}>
          
          {/* 좌측: 워크시트 */}
          <main className="flex-1 flex flex-col bg-white min-w-0" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
            
            {/* 탭 + 레벨 메뉴 - 고정 */}
            <TabMenu state={state} setState={setState} />

            {/* 테이블 제목 - 고정 */}
            <div 
              className="text-center font-black py-1 text-sm flex-shrink-0"
              style={{ 
                background: state.tab === 'structure' ? '#1a237e' : COLORS.sky2, 
                color: state.tab === 'structure' ? '#fff' : COLORS.text,
                border: `1px solid ${COLORS.line}`, 
                borderBottom: 0 
              }}
            >
              P-FMEA {getTabLabel(state.tab)}({getStepNumber(state.tab)}단계)
            </div>

            {/* 테이블 영역 - 단일 테이블 + CSS sticky 헤더 */}
            <div 
              className="flex-1" 
              style={{ 
                border: `1px solid ${COLORS.line}`, 
                overflow: 'auto',
                maxHeight: 'calc(100vh - 180px)'  // 헤더/메뉴 높이 제외
              }}
            >
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                {state.tab === 'structure' && <StructureTabFull {...tabProps} />}
                {state.tab === 'function' && <FunctionTabFull {...tabProps} />}
                {state.tab === 'failure' && <FailureTabFull {...tabProps} />}
                {state.tab === 'risk' && <RiskTabFull {...tabProps} />}
                {state.tab === 'opt' && <OptTabFull {...tabProps} />}
                {state.tab === 'doc' && <DocTabFull {...tabProps} />}
                {state.tab === 'all' && <AllViewTabFull />}
              </table>
            </div>
          </main>

          {/* 구분선 */}
          <div className="flex-shrink-0" style={{ width: '4px', background: '#00587a', marginLeft: 0 }} />

          {/* 우측: 트리 */}
          <RightTreePanel
            state={state}
            setState={setState}
            filteredTree={filteredTree}
            onAddL2={addL2}
            onSelect={handleSelect}
            onRenameL3={renameL3}
            setDirty={setDirty}
            handleInputBlur={handleInputBlur}
            handleInputKeyDown={handleInputKeyDown}
            setIsProcessModalOpen={setIsProcessModalOpen}
            setIsWorkElementModalOpen={setIsWorkElementModalOpen}
            setTargetL2Id={setTargetL2Id}
          />
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
  onFmeaChange: (id: string) => void;
  onSave: () => void;
  onNavigateToList: () => void;
}

function TopMenuBar({ fmeaList, currentFmea, dirty, isSaving, lastSaved, onFmeaChange, onSave, onNavigateToList }: TopMenuBarProps) {
  return (
    <div className="flex items-center justify-between py-1" style={{ background: COLORS.blue, paddingLeft: 0, paddingRight: '8px' }}>
      {/* FMEA명 */}
      <div className="flex items-center gap-2">
        <span className="text-white text-xs font-bold cursor-pointer hover:underline" onClick={onNavigateToList}>📋 FMEA명:</span>
        <select
          value={currentFmea?.id || ''}
          onChange={(e) => onFmeaChange(e.target.value)}
          className="px-2 py-0.5 text-xs font-semibold rounded border-0"
          style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', minWidth: '180px' }}
        >
          {fmeaList.length === 0 && <option value="">FMEA 미등록</option>}
          {fmeaList.map((fmea: any) => (
            <option key={fmea.id} value={fmea.id} style={{ color: '#333' }}>
              {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
            </option>
          ))}
        </select>
        <button onClick={onNavigateToList} className="px-2 py-1 text-xs text-white rounded hover:bg-white/20">📋</button>
      </div>

      <div className="w-px h-6 bg-white/40" />

      {/* 저장/Import/Export */}
      <div className="flex items-center gap-1">
        <button onClick={onSave} disabled={isSaving} className="px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1"
          style={{ background: isSaving ? '#ff9800' : dirty ? '#4caf50' : 'rgba(255,255,255,0.18)', color: '#fff' }}>
          {isSaving ? '⏳ 저장중...' : dirty ? '💾 저장' : '✅ 저장됨'}
        </button>
        {lastSaved && <span className="text-xs text-white/70">{lastSaved}</span>}
        <button className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📥 Import</button>
        <button className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📤 Export</button>
      </div>

      <div className="w-px h-6 bg-white/40" />

      {/* 특별특성/AP/RPN/LLD */}
      <div className="flex items-center gap-1">
        <button className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>⭐특별특성</button>
        <button className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,100,100,0.5)' }}>🔴5AP</button>
        <button className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,165,0,0.5)' }}>🟠6AP</button>
        <button className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📊RPN</button>
        <button className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📚LLD</button>
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
                    border: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderRadius: '2px 2px 0 0',
                    borderBottom: 0,
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

// ============ 탭별 전체 컴포넌트 (헤더 sticky + 바디) ============

// 공통 sticky thead 스타일
const stickyTheadStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 10 };

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
      <thead style={stickyTheadStyle}><FunctionHeader /></thead>
      <tbody>
        {rows.map((row: any, idx: number) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <FunctionRow row={row} idx={idx} state={state} setState={setState} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} setDirty={setDirty} handleInputBlur={handleInputBlur} handleInputKeyDown={handleInputKeyDown} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

// 고장분석 탭
function FailureTabFull(props: any) {
  const { rows, l1Spans, l2Spans, state, setState, setDirty, handleInputBlur, handleInputKeyDown, saveToLocalStorage } = props;
  return (
    <>
      <thead style={stickyTheadStyle}><FailureHeader /></thead>
      <tbody>
        {rows.map((row: any, idx: number) => (
          <tr key={row.l3Id} style={{ height: '25px' }}>
            <FailureRow row={row} idx={idx} state={state} setState={setState} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} setDirty={setDirty} handleInputBlur={handleInputBlur} handleInputKeyDown={handleInputKeyDown} saveToLocalStorage={saveToLocalStorage} />
          </tr>
        ))}
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

// 전체보기 탭
function AllViewTabFull() {
  return (
    <>
      <thead style={stickyTheadStyle}>
        <tr><th colSpan={38} style={{ background: COLORS.sky, padding: '4px', textAlign: 'center' }}>전체보기 (38열 FMEA 워크시트) - 개발예정</th></tr>
      </thead>
      <tbody>
        <tr><td colSpan={38} className="text-center text-gray-400 py-8">전체보기 탭은 개발 예정입니다.</td></tr>
      </tbody>
    </>
  );
}

interface RightTreePanelProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
  filteredTree: Process[];
  onAddL2: () => void;
  onSelect: (type: 'L1' | 'L2' | 'L3', id: string | null) => void;
  onRenameL3: (id: string, name: string) => void;
  setDirty: (dirty: boolean) => void;
  handleInputBlur: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent) => void;
  setIsProcessModalOpen: (open: boolean) => void;
  setIsWorkElementModalOpen: (open: boolean) => void;
  setTargetL2Id: (id: string | null) => void;
}

function RightTreePanel({ 
  state, setState, filteredTree, onAddL2, onSelect, onRenameL3, setDirty,
  handleInputBlur, handleInputKeyDown, setIsProcessModalOpen, setIsWorkElementModalOpen, setTargetL2Id 
}: RightTreePanelProps) {
  return (
    <aside className="flex flex-col flex-shrink-0" style={{ width: '280px', marginLeft: 0, paddingLeft: 0, background: '#fff' }}>
      {/* L1: 완제품명 */}
      <div className="flex-shrink-0 border-b" style={{ background: '#e3f2fd' }}>
        <div className="flex items-center gap-1 px-1 py-0.5">
          <span className="text-blue-600 text-sm">📦</span>
          <input
            type="text"
            value={state.l1.name}
            onChange={(e) => { setState(prev => ({ ...prev, l1: { ...prev.l1, name: e.target.value } })); setDirty(true); }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="완제품명+라인 입력"
            className="flex-1 px-2 py-1 text-sm font-bold border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
            style={{ borderColor: '#90caf9' }}
          />
          <button onClick={onAddL2} className="px-2 py-1 text-xs font-bold rounded bg-blue-500 text-white hover:bg-blue-600" title="공정 추가">+</button>
        </div>
      </div>

      {/* L2, L3 트리 */}
      <div className="flex-1 overflow-auto p-2">
        <div className="ml-2" style={{ borderLeft: '2px solid #90caf9' }}>
          {filteredTree.sort((a, b) => a.order - b.order).map((proc, pIdx) => (
            <div key={proc.id} className="mb-0.5">
              <div 
                className={`flex items-center gap-1 py-0.5 cursor-pointer hover:bg-blue-50 rounded ${state.selected.type === 'L2' && state.selected.id === proc.id ? 'bg-blue-100' : ''}`}
                onClick={() => { onSelect('L2', proc.id); setTargetL2Id(proc.id); setIsWorkElementModalOpen(true); }}
              >
                <span className="w-5 h-5 flex items-center justify-center text-gray-500 text-xs">{proc.l3.length > 0 ? '▼' : '▷'}</span>
                <span className="text-gray-400 text-sm">📁</span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={`1.${pIdx + 1}-${proc.name}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^1\.\d+-/, '');
                      setState(prev => ({ ...prev, l2: prev.l2.map(p => p.id === proc.id ? { ...p, name: val } : p) }));
                      setDirty(true);
                    }}
                    className="w-full px-2 py-1 text-xs border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                    style={{ borderColor: '#e0e0e0' }}
                  />
                </div>
              </div>

              <div className="ml-4">
                {proc.l3.filter(w => !state.search || `${w.m4} ${w.name}`.toLowerCase().includes(state.search.toLowerCase())).sort((a, b) => a.order - b.order).map((w, wIdx) => (
                  <div 
                    key={w.id} 
                    className={`flex items-center gap-1 py-0.5 cursor-pointer hover:bg-blue-50 rounded ${state.selected.type === 'L3' && state.selected.id === w.id ? 'bg-blue-100' : ''}`}
                    onClick={() => onSelect('L3', w.id)}
                  >
                    <span className="w-3 h-3"></span>
                    <span className="text-gray-400 text-xs">📄</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={`1.${pIdx + 1}.${wIdx + 1}-${w.name}`}
                        onChange={(e) => { const val = e.target.value.replace(/^1\.\d+\.\d+-/, ''); onRenameL3(w.id, val); }}
                        className="w-full px-1 py-0.5 text-xs border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                        style={{ borderColor: '#e0e0e0' }}
                      />
                    </div>
                  </div>
                ))}
                <div 
                  className="flex items-center gap-1 py-0.5 px-1 cursor-pointer hover:bg-green-100 rounded border border-dashed border-green-400 text-green-600 mt-0.5"
                  onClick={() => { setTargetL2Id(proc.id); setIsWorkElementModalOpen(true); }}
                >
                  <span className="text-xs">➕</span>
                  <span className="text-xs">작업요소 추가</span>
                </div>
              </div>
            </div>
          ))}

          <div 
            className="flex items-center gap-1 py-0.5 px-1 ml-1 cursor-pointer hover:bg-green-100 rounded border border-dashed border-green-400 text-green-600 mt-0.5"
            onClick={() => setIsProcessModalOpen(true)}
          >
            <span className="text-xs">➕</span>
            <span className="text-xs">공정 추가</span>
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="flex-shrink-0 px-3 py-1 border-t text-xs text-gray-500" style={{ background: '#f8f9fa' }}>
        공정: {state.l2.filter(p => !p.name.includes('클릭')).length}개 | 
        작업요소: {state.l2.reduce((sum, p) => sum + p.l3.filter(w => !w.name.includes('추가') && !w.name.includes('클릭')).length, 0)}개
      </div>
    </aside>
  );
}
