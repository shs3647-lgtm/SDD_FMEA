'use client';

/**
 * @file page.tsx
 * @description FMEA 워크시트 메인 페이지
 * @author AI Assistant
 * @created 2025-12-27
 * @refactored 모듈화 - constants, hooks, tabs 분리
 */

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ProcessSelectModal from './ProcessSelectModal';
import WorkElementSelectModal from './WorkElementSelectModal';
import PFMEATopNav from '@/components/layout/PFMEATopNav';

// 모듈화된 상수, hooks, 탭 컴포넌트
import { COLORS, TABS, ANALYSIS_TABS, EVALUATION_TABS, uid, getTabLabel, WorksheetState, WorkElement, Process, FlatRow } from './constants';
import { useWorksheetState } from './hooks';
import { 
  StructureTab, StructureColgroup, StructureHeader, StructureRow,
  FunctionTab, FunctionColgroup, FunctionHeader, FunctionRow,
  FailureTab, FailureColgroup, FailureHeader, FailureRow,
  RiskTab, RiskHeader, RiskRow,
  OptTab, OptHeader, OptRow,
  DocTab, DocHeader, DocRow,
} from './tabs';
import { FailureTab as FailureTabNew, FailureL1Tab, FailureL2Tab, FailureL3Tab } from './tabs/failure';
import { 
  exportFMEAWorksheet, 
  exportStructureAnalysis, 
  importStructureAnalysis,
  exportAllViewExcel,
  exportFunctionL1,
  exportFunctionL2,
  exportFunctionL3,
  downloadStructureTemplate 
} from './excel-export';
import SpecialCharMasterModal from '@/components/modals/SpecialCharMasterModal';
import SODMasterModal from '@/components/modals/SODMasterModal';
import APTableModal from '@/components/modals/APTableModal';
// 유틸리티 함수 import
import { 
  groupFailureLinksWithFunctionData,
  groupByProcessName,
  calculateLastRowMerge,
  type FMGroup
} from './utils';

// 분리된 UI 컴포넌트 import
import TopMenuBar from './components/TopMenuBar';
import TabMenu from './components/TabMenu';
import APTableInline from './components/APTableInline';
import AllTabRenderer from './tabs/all/AllTabRenderer';
import { PANEL_REGISTRY, getPanelById } from './panels';
import RightPanelMenu from './components/RightPanelMenu';

/**
 * FMEA 워크시트 메인 페이지 컨텐츠
 */
function FMEAWorksheetPageContent() {
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
    l1TypeSpans,
    l1FuncSpans,
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
  const [isSpecialCharModalOpen, setIsSpecialCharModalOpen] = useState(false);
  const [isSODModalOpen, setIsSODModalOpen] = useState(false);
  const [showAPModal, setShowAPModal] = useState(false);
  const [show6APModal, setShow6APModal] = useState(false);
  const [targetL2Id, setTargetL2Id] = useState<string | null>(null);
  
  // 우측 패널 활성화 상태
  const [activePanelId, setActivePanelId] = useState<string>('tree');
  
  // 트리 접기/펼치기 상태
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  
  // 전체보기 탭의 AP 테이블 표시 상태
  const [showAPInAll, setShowAPInAll] = useState(false);
  const [apStageInAll, setApStageInAll] = useState<5 | 6>(5);
  
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

  // 구조분석 누락 건수 계산
  const calculateStructureMissing = useCallback(() => {
    let count = 0;
    
    // 완제품명 누락
    if (!state.l1.name || state.l1.name.trim() === '') count++;
    
    // 공정 및 작업요소 검사
    state.l2.forEach(proc => {
      const procName = proc.name || '';
      if (!procName || procName.includes('클릭') || procName.includes('선택')) count++;
      
      proc.l3.forEach(we => {
        const weName = we.name || '';
        if (!weName || weName.includes('클릭') || weName.includes('추가') || weName.includes('필요') || weName.includes('선택')) count++;
      });
    });
    
    return count;
  }, [state.l1.name, state.l2]);

  // 공정 모달 저장 핸들러
  const handleProcessSave = useCallback((selectedProcesses: { no: string; name: string }[]) => {
    console.log('[공정저장] 선택된 공정:', selectedProcesses.map(p => `${p.no}:${p.name}`));
    
    setState(prev => {
      const selectedNames = selectedProcesses.map(p => p.name);
      console.log('[공정저장] 선택된 이름들:', selectedNames);
      console.log('[공정저장] 기존 l2:', prev.l2.map(p => `${p.no}:${p.name}`));
      
      const keepL2 = prev.l2.filter(p => !p.name.includes('클릭') && selectedNames.includes(p.name));
      const keepNames = keepL2.map(p => p.name);
      console.log('[공정저장] 유지할 공정:', keepNames);
      
      // 선택된 순서대로 처리 (기존 유지 또는 신규 생성)
      const finalL2: Process[] = selectedProcesses.map((p, idx) => {
        // 기존에 있으면 유지
        const existing = prev.l2.find(e => e.name === p.name && !e.name.includes('클릭'));
        if (existing) {
          console.log('[공정저장] 기존 유지:', p.name);
          return { ...existing, no: p.no, order: (idx + 1) * 10 };
        }
        // 없으면 새로 생성
        console.log('[공정저장] 신규 생성:', p.name);
        return {
          id: uid(),
          no: p.no,
          name: p.name,
          order: (idx + 1) * 10,
          functions: [],
          productChars: [],
          l3: [{ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10, functions: [], processChars: [] }]
        };
      });
      
      // 빈 경우 기본 항목 추가
      if (finalL2.length === 0) {
        finalL2.push({
          id: uid(),
          no: '',
          name: '(클릭하여 공정 선택)',
          order: 10,
          functions: [],
          productChars: [],
          l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10, functions: [], processChars: [] }]
        });
      }
      
      console.log('[공정저장] 최종 l2:', finalL2.map(p => `${p.no}:${p.name}`));
      return { ...prev, l2: finalL2 };
    });
    setDirty(true);
  }, [setState, setDirty]);

  // 작업요소 모달 저장 핸들러 (2개 이상이면 행 삭제 가능, 1개면 내용만 삭제)
  const handleWorkElementSelect = useCallback((selectedElements: { id: string; m4: string; name: string }[]) => {
    console.log('[저장] targetL2Id:', targetL2Id);
    console.log('[저장] 선택된 항목:', selectedElements.map(e => `${e.m4}:${e.name}`));
    
    if (!targetL2Id) {
      console.log('[저장] targetL2Id 없음 - 중단');
      return;
    }
    
    // 중복 제거 (이름 기준)
    const uniqueElements = selectedElements.filter((e, idx, arr) => 
      arr.findIndex(x => x.name === e.name) === idx
    );
    console.log('[저장] 중복제거 후:', uniqueElements.map(e => `${e.m4}:${e.name}`));
    
    setState(prev => {
      const proc = prev.l2.find(p => p.id === targetL2Id);
      console.log('[저장] 현재 공정:', proc?.name, '현재 l3:', proc?.l3.map(w => `${w.m4}:${w.name}`));
      
      const newL2 = prev.l2.map(proc => {
        if (proc.id !== targetL2Id) return proc;
        
        const existingCount = proc.l3.length;
        console.log('[저장] 기존 행 수:', existingCount, '선택 수:', uniqueElements.length);
        
        // 선택된 항목들로 새 리스트 생성 (m4 기본값 'MN' 설정)
        const newL3: WorkElement[] = uniqueElements.map((e, idx) => ({
          id: uid(),
          m4: e.m4 || 'MN',  // m4가 없으면 기본값 'MN'
          name: e.name,
          order: (idx + 1) * 10,
          functions: [],
          processChars: [],
        }));
        
        // 행이 1개만 남았는데 0개 선택 → 내용만 비우고 행 유지
        if (existingCount === 1 && newL3.length === 0) {
          console.log('[저장] 1개→0개: 내용만 비움');
          newL3.push({ 
            id: proc.l3[0]?.id || uid(), 
            m4: '', 
            name: '(클릭하여 작업요소 추가)', 
            order: 10, 
            functions: [], 
            processChars: [] 
          });
        }
        
        // 최소 1행 보장 (혹시 모든 경우 대비)
        if (newL3.length === 0) {
          console.log('[저장] 0개: 기본 행 추가');
          newL3.push({ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10, functions: [], processChars: [] });
        }
        
        console.log('[저장] 최종 l3:', newL3.map(w => w.name));
        return { ...proc, l3: newL3 };
      });
      return { ...prev, l2: newL2 };
    });
    setDirty(true);
  }, [targetL2Id, setState, setDirty]);

  // 작업요소 모달 삭제 핸들러 (2개 이상이면 행 삭제, 1개면 내용만 삭제)
  const handleWorkElementDelete = useCallback((deletedNames: string[]) => {
    console.log('[삭제] targetL2Id:', targetL2Id, 'deletedNames:', deletedNames);
    if (!targetL2Id || deletedNames.length === 0) return;
    
    // 이름 정규화 (공백 제거)
    const normalizedDeletedNames = deletedNames.map(n => n.trim());
    
    setState(prev => {
      const newL2 = prev.l2.map(proc => {
        if (proc.id !== targetL2Id) return proc;
        
        console.log('[삭제] 현재 l3:', proc.l3.map(w => w.name));
        
        const currentCount = proc.l3.length;
        
        if (currentCount > 1) {
          // 2개 이상이면 행 자체 삭제
          const remainingL3 = proc.l3.filter(w => !normalizedDeletedNames.includes(w.name.trim()));
          console.log('[삭제] 2개이상, 남은 항목:', remainingL3.map(w => w.name));
          
          // 모두 삭제되면 최소 1행 유지
          if (remainingL3.length === 0) {
            remainingL3.push({ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10, functions: [], processChars: [] });
          }
          
          return { ...proc, l3: remainingL3 };
        } else {
          // 1개만 남았으면 내용만 삭제, 행 유지
          console.log('[삭제] 1개만 남음, 내용만 삭제');
          const updatedL3 = proc.l3.map(w => {
            const isMatch = normalizedDeletedNames.includes(w.name.trim());
            console.log('[삭제] 비교:', w.name.trim(), '포함여부:', isMatch);
            if (isMatch) {
              return { ...w, name: '(클릭하여 작업요소 추가)', m4: '' };
            }
            return w;
          });
          
          return { ...proc, l3: updatedL3 };
        }
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
    l1TypeSpans,
    l1FuncSpans,
    l2Spans,
    setDirty,
    handleInputBlur,
    handleInputKeyDown,
    handleSelect,
    setIsProcessModalOpen,
    setIsWorkElementModalOpen,
    setTargetL2Id,
    saveToLocalStorage,
    onAPClick: () => setShowAPModal(true),
  };

  return (
    <>
      <PFMEATopNav selectedFmeaId={currentFmea?.id} />
      
      <div className="h-full flex flex-col" style={{ fontFamily: 'Segoe UI, Malgun Gothic, Arial, sans-serif', background: COLORS.bg, color: COLORS.text, paddingTop: '28px' }}>
        
        {/* ========== 상단 메뉴 바 ========== */}
        <TopMenuBar
          fmeaList={fmeaList}
          currentFmea={currentFmea}
          selectedFmeaId={selectedFmeaId}
          dirty={dirty}
          isSaving={isSaving}
          lastSaved={lastSaved}
          currentTab={state.tab}
          importMessage={importMessage}
          fileInputRef={fileInputRef}
          onFmeaChange={handleFmeaChange}
          onSave={saveToLocalStorage}
          onNavigateToList={() => router.push('/pfmea/list')}
          onExport={() => {
            const fmeaName = currentFmea?.fmeaInfo?.subject || 'PFMEA';
            if (state.tab === 'structure') {
              handleStructureExport();
            } else if (state.tab === 'function-l1') {
              // 1L 완제품기능 (고장영향 미포함)
              exportFunctionL1(state, fmeaName, false);
            } else if (state.tab === 'failure-l1') {
              // 1L 고장영향 (고장영향 포함)
              exportFunctionL1(state, fmeaName, true);
            } else if (state.tab === 'function-l2') {
              // 2L 메인공정기능 (고장형태 미포함)
              exportFunctionL2(state, fmeaName, false);
            } else if (state.tab === 'failure-l2') {
              // 2L 고장형태 (고장형태 포함)
              exportFunctionL2(state, fmeaName, true);
            } else if (state.tab === 'function-l3') {
              // 3L 작업요소기능 (고장원인 미포함)
              exportFunctionL3(state, fmeaName, false);
            } else if (state.tab === 'failure-l3') {
              // 3L 고장원인 (고장원인 포함)
              exportFunctionL3(state, fmeaName, true);
            } else if (state.tab === 'all') {
              exportAllViewExcel(state, fmeaName);
            } else {
              exportFMEAWorksheet(state, fmeaName);
            }
          }}
          onImportClick={() => fileInputRef.current?.click()}
          onImportFile={handleImportFile}
          onDownloadTemplate={handleDownloadTemplate}
          onOpenSpecialChar={() => setIsSpecialCharModalOpen(true)}
          onOpenSOD={() => setIsSODModalOpen(true)}
          onOpen5AP={() => setShowAPModal(true)}
          onOpen6AP={() => setShow6APModal(true)}
        />

        {/* ========== 메인 레이아웃 ========== */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: 'calc(100vh - 90px)', // 상단 메뉴 높이 제외
            overflow: 'hidden',
            border: '2px solid #00587a',
          }}
        >
          {/* ===== 상단: 탭 메뉴 + 패널 선택 ===== */}
          <div style={{ 
            flexShrink: 0, 
            display: 'flex', 
            alignItems: 'stretch',
            height: '36px',
          }}>
            {/* 탭 메뉴 영역 (좌측) - 진한 네이비 */}
            <div style={{ 
              flex: 1,
              background: 'linear-gradient(to right, #1a237e, #283593, #1a237e)',
            }}>
              <TabMenu 
                state={state} 
                setState={setState} 
                onOpen5AP={() => setShowAPModal(true)}
                onOpen6AP={() => setShow6APModal(true)}
              />
            </div>
            
            {/* 패널 선택 메뉴 영역 (우측) - 350px 고정, 청록색 계열 */}
            {state.tab !== 'all' && state.tab !== 'failure-link' && (
              <div style={{ 
                width: '350px',
                flexShrink: 0,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px', 
                padding: '0 12px',
                background: 'linear-gradient(to right, #00695c, #00897b, #00695c)',
                borderLeft: '3px solid #ffd600',
                boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.2)',
              }}>
                <span style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255,255,255,0.7)', 
                  fontWeight: 600,
                  marginRight: '4px',
                }}>
                  패널
                </span>
                {PANEL_REGISTRY.map(panel => (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanelId(panel.id)}
                    style={{
                      padding: '5px 14px',
                      fontSize: '11px',
                      fontWeight: activePanelId === panel.id ? 700 : 500,
                      background: activePanelId === panel.id ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
                      border: activePanelId === panel.id ? '1px solid #4db6ac' : '1px solid transparent',
                      borderRadius: '4px',
                      color: activePanelId === panel.id ? '#b2dfdb' : '#fff',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      if (activePanelId !== panel.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.color = '#b2dfdb';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activePanelId !== panel.id) {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.15)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                  >
                    {panel.icon} {panel.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== 콘텐츠 영역 (좌측:워크시트 / 우측:패널) ===== */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
            {/* ===== 좌측: 워크시트 영역 ===== */}
            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                minWidth: 0,
                borderRight: state.tab === 'all' || state.tab === 'failure-link' ? 'none' : '4px solid #00587a',
              }}
            >

            {/* 테이블 제목 - 고정 (전체보기에서는 숨김) */}
            {state.tab !== 'all' && (
            <div 
              style={{ 
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                fontWeight: 900,
                padding: '4px 8px',
                fontSize: '13px',
                background: state.tab === 'structure' ? COLORS.structure.dark : COLORS.structure.light, 
                color: state.tab === 'structure' ? '#fff' : COLORS.text,
                borderBottom: `1px solid ${COLORS.line}`,
              }}
            >
              {/* 중앙 타이틀 - 기능분석/고장분석 탭은 자체 헤더가 있어서 숨김 */}
              {!state.tab.startsWith('function') && !state.tab.startsWith('failure') && (
                <span>P-FMEA {getTabLabel(state.tab)}({getStepNumber(state.tab)}단계)</span>
              )}
              
              {/* 구조분석일 때만 우측에 확정/누락/수정 버튼 */}
              {state.tab === 'structure' && (
                <div style={{ position: 'absolute', right: '8px', display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const missingCount = calculateStructureMissing();
                      if (missingCount > 0) {
                        alert(`⚠️ 누락건이 ${missingCount}건 있습니다.\n\n누락 항목을 채운 후 다시 확정해주세요.`);
                        return; // 누락이 있으면 확정 안 됨
                      }
                      
                      // 구조분석 데이터를 기능분석에 연동
                      setState(prev => {
                        // L2(공정)에 기능 초기화 (아직 없는 경우만)
                        const updatedL2 = prev.l2.map(proc => ({
                          ...proc,
                          functions: proc.functions?.length > 0 ? proc.functions : [
                            { id: uid(), name: '(클릭하여 공정기능 입력)', productChars: [] }
                          ],
                          l3: proc.l3.map(we => ({
                            ...we,
                            functions: we.functions?.length > 0 ? we.functions : [
                              { id: uid(), name: '(클릭하여 작업요소기능 입력)', processChars: [] }
                            ],
                          })),
                        }));
                        
                        return { 
                          ...prev, 
                          structureConfirmed: true,
                          structureConfirmedAt: new Date().toISOString(),
                          l2: updatedL2,
                        };
                      });
                      
                      alert('✓ 구조분석이 확정되었습니다.\n\n이제 기능분석(3단계) 탭이 활성화되었습니다.');
                      setDirty(true);
                    }}
                    disabled={(state as any).structureConfirmed}
                    style={{
                      background: (state as any).structureConfirmed ? '#9e9e9e' : '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '3px 10px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: (state as any).structureConfirmed ? 'not-allowed' : 'pointer',
                    }}
                  >
                    확정
                  </button>
                  <span style={{ 
                    background: calculateStructureMissing() > 0 ? '#f44336' : '#4caf50', 
                    color: 'white', 
                    padding: '3px 10px', 
                    borderRadius: '3px', 
                    fontSize: '11px', 
                    fontWeight: 700 
                  }}>
                    누락 {calculateStructureMissing()}건
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('구조분석을 수정하시겠습니까?')) {
                        setState(prev => ({ ...prev, structureConfirmed: false }));
                        setDirty(true);
                      }
                    }}
                    disabled={!(state as any).structureConfirmed}
                    style={{
                      background: (state as any).structureConfirmed ? '#ff9800' : '#9e9e9e',
                      color: 'white',
                      border: 'none',
                      padding: '3px 10px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: (state as any).structureConfirmed ? 'pointer' : 'not-allowed',
                    }}
                  >
                    수정
                  </button>
                </div>
              )}
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
              {state.tab.startsWith('function') ? (
                <FunctionTabFull {...tabProps} />
              ) : state.tab.startsWith('failure') ? (
                <FailureTabFull {...tabProps} />
              ) : state.tab === 'all' ? (
                /* 전체보기 탭: 통합 화면 (40열 구조) */
                <AllTabRenderer 
                  tab={state.tab} 
                  rows={rows} 
                  state={state} 
                  l1Spans={l1Spans} 
                  l1TypeSpans={l1TypeSpans}
                  l1FuncSpans={l1FuncSpans}
                  l2Spans={l2Spans}
                  onAPClick={() => setShowAPModal(true)}
                />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  {state.tab === 'structure' && <StructureTabFull {...tabProps} />}
                  {state.tab === 'doc' && <DocTabFull {...tabProps} />}
                </table>
              )}
            </div>
          </div>

          {/* ===== 우측: 패널 영역 (전체보기, 고장연결에서는 숨김) ===== */}
          {state.tab !== 'all' && state.tab !== 'failure-link' && (
          <div 
            style={{ 
              width: '350px',  // 280px → 350px 통일
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: '#f0f4f8',
            }}
          >
            {/* 패널 콘텐츠 (레이지 로딩) */}
            <Suspense fallback={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                fontSize: '14px',
                color: '#666'
              }}>
                ⏳ 로딩 중...
              </div>
            }>
              {(() => {
                const panel = getPanelById(activePanelId);
                if (!panel) return null;
                const PanelComponent = panel.component;
                return <PanelComponent state={state} />;
              })()}
            </Suspense>

            {/* 고장연결 결과 트리 */}
            {state.tab === 'failure-link' && (() => {
              const ui = (state as any).failureLinkUI || {};
              const { currentFMId, currentFM, savedLinks = [], stats = { linkedFM: 0, totalFM: 0, totalLinks: 0 } } = ui;
              const resultLinks = currentFMId ? savedLinks.filter((l: any) => l.fmId === currentFMId) : [];
              const COLORS_LINK = { mn: '#eef7ff', mc: '#ffe6e6', en: '#fef0ff', line: '#6f8fb4' };
              
              return (
                <>
                  <div style={{ background: '#3949ab', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🔗 연결 결과</span>
                    <span style={{ fontSize: '10px', fontWeight: 400 }}>연결: {stats.linkedFM}/{stats.totalFM} FM</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', padding: '4px', background: '#e8eaf6' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                      <thead>
                        <tr>
                          <th colSpan={3} style={{ background: '#bbdefb', padding: '3px', textAlign: 'center', fontWeight: 700, border: '1px solid #ccc' }}>1. 고장영향(FE)</th>
                          <th style={{ background: '#fff8e1', padding: '3px', textAlign: 'center', fontWeight: 700, border: '1px solid #ccc' }}>2. FM</th>
                          <th colSpan={3} style={{ background: '#c8e6c9', padding: '3px', textAlign: 'center', fontWeight: 700, border: '1px solid #ccc' }}>3. 고장원인(FC)</th>
                        </tr>
                        <tr>
                          <th style={{ background: '#e3f2fd', padding: '2px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc' }}>구분</th>
                          <th style={{ background: '#e3f2fd', padding: '2px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc' }}>FE</th>
                          <th style={{ background: '#e3f2fd', padding: '2px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc' }}>S</th>
                          <th style={{ background: '#fff8e1', padding: '2px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc' }}>FM</th>
                          <th style={{ background: '#e8f5e9', padding: '2px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc' }}>4M</th>
                          <th style={{ background: '#e8f5e9', padding: '2px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc' }}>작업요소</th>
                          <th style={{ background: '#e8f5e9', padding: '2px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc' }}>FC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultLinks.length === 0 ? (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '10px' }}>
                            {currentFMId ? '연결된 항목이 없습니다' : 'FM을 선택하세요'}
                          </td></tr>
                        ) : resultLinks.map((link: any, idx: number) => {
                          const m4Bg = link.fcM4 === 'MN' ? COLORS_LINK.mn : link.fcM4 === 'MC' ? COLORS_LINK.mc : COLORS_LINK.en;
                          return (
                            <tr key={idx}>
                              <td style={{ padding: '2px 3px', border: '1px solid #ccc', textAlign: 'center' }}>{link.feScope}</td>
                              <td style={{ padding: '2px 3px', border: '1px solid #ccc' }}>{link.feText}</td>
                              <td style={{ padding: '2px 3px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold', color: link.severity >= 8 ? '#c62828' : '#333' }}>{link.severity}</td>
                              {idx === 0 && (
                                <td rowSpan={resultLinks.length} style={{ padding: '2px 3px', border: '1px solid #ccc', background: '#fff8e1', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>{link.fmText}</td>
                              )}
                              <td style={{ padding: '2px 3px', border: '1px solid #ccc', textAlign: 'center', background: m4Bg }}>{link.fcM4}</td>
                              <td style={{ padding: '2px 3px', border: '1px solid #ccc' }}>{link.fcWorkElem}</td>
                              <td style={{ padding: '2px 3px', border: '1px solid #ccc' }}>{link.fcText}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaf6', fontSize: '10px', color: '#3949ab', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>총 {stats.totalLinks}개 연결</span>
                    <button 
                      onClick={() => {
                        const links = (state as any).failureLinks || [];
                        setState((prev: any) => ({ ...prev, failureLinks: links }));
                        setDirty(true);
                        saveToLocalStorage();
                        alert(`✅ ${links.length}개 고장연결이 저장되었습니다.`);
                      }}
                      style={{ padding: '3px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '9px' }}
                    >
                      💾 저장
                    </button>
                  </div>
                </>
              );
            })()}

            {/* 전체보기 탭: 전체 구조 표시 + AP 테이블 전환 */}
            {(state.tab === 'all') && (
              <>
                <div style={{ background: '#455a64', color: 'white', padding: '6px 10px', fontSize: '11px', fontWeight: 700, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📊 {showAPInAll ? `${apStageInAll}AP 기준표` : '전체 구조'}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => setShowAPInAll(false)}
                      style={{ 
                        padding: '2px 6px', 
                        fontSize: '9px', 
                        background: !showAPInAll ? '#fff' : 'rgba(255,255,255,0.3)', 
                        color: !showAPInAll ? '#455a64' : '#fff',
                        border: 'none', 
                        borderRadius: '2px', 
                        cursor: 'pointer',
                        fontWeight: !showAPInAll ? 700 : 400
                      }}
                    >
                      구조
                    </button>
                    <button 
                      onClick={() => { setShowAPInAll(true); setApStageInAll(5); }}
                      style={{ 
                        padding: '2px 6px', 
                        fontSize: '9px', 
                        background: showAPInAll && apStageInAll === 5 ? '#fff' : 'rgba(255,255,255,0.3)', 
                        color: showAPInAll && apStageInAll === 5 ? '#455a64' : '#fff',
                        border: 'none', 
                        borderRadius: '2px', 
                        cursor: 'pointer',
                        fontWeight: showAPInAll && apStageInAll === 5 ? 700 : 400
                      }}
                    >
                      5AP
                    </button>
                    <button 
                      onClick={() => { setShowAPInAll(true); setApStageInAll(6); }}
                      style={{ 
                        padding: '2px 6px', 
                        fontSize: '9px', 
                        background: showAPInAll && apStageInAll === 6 ? '#fff' : 'rgba(255,255,255,0.3)', 
                        color: showAPInAll && apStageInAll === 6 ? '#455a64' : '#fff',
                        border: 'none', 
                        borderRadius: '2px', 
                        cursor: 'pointer',
                        fontWeight: showAPInAll && apStageInAll === 6 ? 700 : 400
                      }}
                    >
                      6AP
                    </button>
                  </div>
                </div>
                
                {!showAPInAll ? (
                  <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#eceff1' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
                      <strong>L1:</strong> {state.l1.name} ({state.l1.types.length}개 구분)
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
                      <strong>L2:</strong> {state.l2.filter(p => !p.name.includes('클릭')).length}개 공정
                    </div>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      <strong>L3:</strong> {state.l2.reduce((sum, p) => sum + p.l3.filter(w => !w.name.includes('추가')).length, 0)}개 작업요소
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <APTableInline onClose={() => setShowAPInAll(false)} showClose={false} stage={apStageInAll} />
                  </div>
                )}
              </>
            )}
          </div>
          )}
          </div>
        </div>

        {/* 모달 */}
        <ProcessSelectModal
          isOpen={isProcessModalOpen}
          onClose={() => setIsProcessModalOpen(false)}
          onSave={handleProcessSave}
          onDelete={(ids) => {
            // 삭제할 공정 ID에 해당하는 공정을 state에서 제거
            setState(prev => {
              const processNamesToDelete = ids.map(id => {
                const match = prev.l2.find(p => p.id === id);
                return match?.name;
              }).filter(Boolean);
              
              const remainingL2 = prev.l2.filter(p => !processNamesToDelete.includes(p.name));
              
              // 모두 삭제되면 기본 항목 추가
              if (remainingL2.length === 0) {
                return {
                  ...prev,
                  l2: [{ id: uid(), no: '10', name: '(클릭하여 공정 선택)', order: 10, l3: [{ id: uid(), m4: '', name: '(공정 선택 필요)', order: 10, functions: [], processChars: [] }], functions: [], productChars: [], failureMode: '' }]
                };
              }
              return { ...prev, l2: remainingL2 };
            });
            setDirty(true);
          }}
          existingProcessNames={state.l2.filter(p => !p.name.includes('클릭')).map(p => p.name)}
          productLineName={state.l1.name || '완제품 제조라인'}
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

        {/* 특별특성 마스터 모달 */}
        <SpecialCharMasterModal
          isOpen={isSpecialCharModalOpen}
          onClose={() => setIsSpecialCharModalOpen(false)}
        />

        {/* SOD 마스터 모달 */}
        <SODMasterModal
          isOpen={isSODModalOpen}
          onClose={() => setIsSODModalOpen(false)}
        />
      </div>
    </>
  );
}

// Suspense boundary wrapper for useSearchParams
export default function FMEAWorksheetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">로딩 중...</div>}>
      <FMEAWorksheetPageContent />
    </Suspense>
  );
}

// ============ 하위 컴포넌트들 ============

function getStepNumber(tab: string): number {
  const map: Record<string, number> = { 
    structure: 2, 
    'function-l1': 3,
    'function-l2': 3,
    'function-l3': 3,
    'failure-l1': 4,
    'failure-l2': 4,
    'failure-l3': 4,
    'failure-link': 4,
    risk: 5, 
    opt: 6, 
    doc: 7, 
    all: 0 
  };
  return map[tab] || 0;
}

// TopMenuBar 컴포넌트는 components/TopMenuBar.tsx로 분리됨
// APTableInline 컴포넌트는 components/APTableInline.tsx로 분리됨

// TabMenu 컴포넌트는 components/TabMenu.tsx로 분리됨
// StepToggleButtons 컴포넌트는 components/StepToggleButtons.tsx로 분리됨

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
          <tr key={`structure-${idx}-${row.l3Id}`} style={{ height: '25px' }}>
            <StructureRow row={row} idx={idx} state={state} setState={setState} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} setDirty={setDirty} handleInputBlur={handleInputBlur} handleInputKeyDown={handleInputKeyDown} handleSelect={handleSelect} setIsProcessModalOpen={setIsProcessModalOpen} setIsWorkElementModalOpen={setIsWorkElementModalOpen} setTargetL2Id={setTargetL2Id} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

// 기능분석 탭
function FunctionTabFull(props: any) {
  return <FunctionTab {...props} />;
}

// 고장분석 탭 (L1, L2, L3) - FunctionTabFull과 동일한 구조
function FailureTabFull(props: any) {
  return <FailureTabNew {...props} />;
}

// 리스크분석 탭 (AP 클릭 시 트리뷰에 표시)
function RiskTabFull(props: any) {
  const { rows, l1Spans, l2Spans, state, onAPClick } = props;
  
  return (
    <>
      <thead style={stickyTheadStyle}><RiskHeader onAPClick={onAPClick} /></thead>
      <tbody>
        {rows.map((row: any, idx: number) => (
          <tr key={`risk-${idx}-${row.l3Id}`} style={{ height: '25px' }}>
            <RiskRow row={row} />
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
          <tr key={`opt-${idx}-${row.l3Id}`} style={{ height: '25px' }}>
            <OptRow row={row} />
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
          <tr key={`doc-${idx}-${row.l3Id}`} style={{ height: '25px' }}>
            <DocRow row={row} idx={idx} state={state} rows={rows} l1Spans={l1Spans} l2Spans={l2Spans} />
          </tr>
        ))}
      </tbody>
    </>
  );
}


// ============ 미사용 함수 삭제됨 ============
// EvalTabRenderer (394줄): AllTabRenderer.tsx로 대체
// AllViewTabFull (228줄): 미사용
