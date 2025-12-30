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
import EvalStructureTab from './tabs/evaluation/EvalStructureTab';
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                fontWeight: 900,
                padding: '4px 8px',
                fontSize: '13px',
                background: state.tab === 'structure' ? '#1a237e' : COLORS.sky2, 
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
              ) : state.tab.startsWith('eval-') || state.tab === 'risk' || state.tab === 'opt' || state.tab === 'all' ? (
                /* 평가 탭: 통합 화면 (40열 구조) */
                <EvalTabRenderer 
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

          {/* ===== 우측: 트리 영역 (전체보기, 고장연결에서는 숨김) ===== */}
          {state.tab !== 'all' && state.tab !== 'failure-link' && (
          <div 
            style={{ 
              width: (state.tab === 'risk' || state.tab === 'opt') ? '280px' : '280px', 
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: '#f0f4f8',
            }}
          >
            {/* 탭에 따라 1:1 대응 트리 표시 */}
            {state.tab === 'structure' && (
              <>
                {/* 구조 트리 */}
                <div style={{ background: '#1976d2', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  🌳 구조 트리
                </div>
                <div style={{ flexShrink: 0, background: '#e3f2fd', padding: '6px 10px', borderBottom: '1px solid #90caf9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>📦</span>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{state.l1.name || '(완제품명 입력)'}</span>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#f8fafc' }}>
                  {state.l2.filter(p => !p.name.includes('클릭')).map(proc => (
                    <div key={proc.id} style={{ marginBottom: '6px', marginLeft: '8px', borderLeft: '2px solid #90caf9', paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px', background: '#e8f5e9', borderRadius: '4px' }}>
                        <span>📁</span>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{proc.no}-{proc.name}</span>
                        <span style={{ fontSize: '9px', color: '#888', marginLeft: 'auto', background: '#fff', padding: '1px 6px', borderRadius: '8px' }}>{proc.l3.filter(w => !w.name.includes('추가')).length}</span>
                      </div>
                      <div style={{ marginLeft: '16px' }}>
                        {proc.l3.filter(w => !w.name.includes('추가') && !w.name.includes('클릭')).map(w => (
                          <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 4px', fontSize: '10px' }}>
                            <span style={{ fontSize: '8px', fontWeight: 700, padding: '0 4px', borderRadius: '2px', background: w.m4 === 'MN' ? '#e3f2fd' : w.m4 === 'MC' ? '#fff3e0' : w.m4 === 'IM' ? '#e8f5e9' : '#fce4ec' }}>{w.m4}</span>
                            <span>{w.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '10px', color: '#666' }}>
                  공정: {state.l2.filter(p => !p.name.includes('클릭')).length}개 | 작업요소: {state.l2.reduce((sum, p) => sum + p.l3.filter(w => !w.name.includes('추가')).length, 0)}개
                </div>
              </>
            )}

            {/* 1L 기능트리 (완제품 기능분석) */}
            {state.tab === 'function-l1' && (
              <>
                <div style={{ background: '#1b5e20', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  🎯 1L 기능트리 (완제품)
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#e8f5e9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px', background: '#c8e6c9', borderRadius: '4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px' }}>📦</span>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{state.l1.name || '(완제품명)'}</span>
                  </div>
                  {state.l1.types.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#888', padding: '16px', textAlign: 'center', background: '#f5f5f5', borderRadius: '4px' }}>구분/기능/요구사항을 정의하세요</div>
                  ) : state.l1.types.map(t => {
                    // 구분별 색상 (워크시트와 동일)
                    const typeColors: Record<string, { bg: string; light: string; text: string; border: string }> = {
                      'Your Plant': { bg: '#1976d2', light: '#bbdefb', text: '#0d47a1', border: '#1976d2' },
                      'Ship to Plant': { bg: '#f57c00', light: '#ffe0b2', text: '#e65100', border: '#f57c00' },
                      'User': { bg: '#7b1fa2', light: '#e1bee7', text: '#4a148c', border: '#7b1fa2' },
                    };
                    const color = typeColors[t.name] || { bg: '#388e3c', light: '#c8e6c9', text: '#1b5e20', border: '#388e3c' };
                    
                    return (
                      <div key={t.id} style={{ marginLeft: '12px', marginBottom: '8px', borderLeft: `3px solid ${color.border}`, paddingLeft: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'white', padding: '4px 8px', background: color.bg, borderRadius: '3px', marginBottom: '4px' }}>
                          📋 {t.name}
                        </div>
                        {t.functions.map(f => (
                          <div key={f.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                            <div style={{ fontSize: '10px', color: '#000000', fontWeight: 600, padding: '2px 6px', background: '#fce4ec', borderRadius: '2px' }}>⚙️ {f.name}</div>
                            {f.requirements.map(r => (
                              <div key={r.id} style={{ marginLeft: '16px', fontSize: '9px', color: '#e65100', fontWeight: 500, padding: '2px 4px', background: '#fff3e0', borderRadius: '2px', marginTop: '2px' }}>• {r.name}</div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '10px', color: '#666' }}>
                  구분: {state.l1.types.length}개 | 기능: {state.l1.types.reduce((s, t) => s + t.functions.length, 0)}개 | 요구사항: {state.l1.types.reduce((s, t) => s + t.functions.reduce((a, f) => a + f.requirements.length, 0), 0)}개
                </div>
              </>
            )}

            {/* 2L 기능트리 (메인공정 기능분석) */}
            {state.tab === 'function-l2' && (
              <>
                <div style={{ background: '#2e7d32', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  🔧 2L 기능트리 (메인공정)
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#e8f5e9' }}>
                  {state.l2.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#888', padding: '16px', textAlign: 'center', background: '#f5f5f5', borderRadius: '4px' }}>구조분석에서 공정을 추가하세요</div>
                  ) : state.l2.map(proc => (
                    <div key={proc.id} style={{ marginBottom: '10px', borderLeft: '2px solid #4caf50', paddingLeft: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#1b5e20', padding: '4px 8px', background: '#a5d6a7', borderRadius: '3px', marginBottom: '4px' }}>
                        🏭 {proc.no}. {proc.name}
                      </div>
                      {(proc.functions || []).length === 0 ? (
                        <div style={{ fontSize: '10px', color: '#888', marginLeft: '12px', padding: '4px' }}>기능 미정의</div>
                      ) : (proc.functions || []).map(f => (
                        <div key={f.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                          <div style={{ fontSize: '10px', color: '#2e7d32', padding: '2px 6px', background: '#c8e6c9', borderRadius: '2px' }}>⚙️ {f.name}</div>
                          {(f.productChars || []).map(c => (
                            <div key={c.id} style={{ marginLeft: '16px', fontSize: '9px', color: '#555', padding: '1px 4px' }}>📐 {c.name}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '10px', color: '#666' }}>
                  공정: {state.l2.length}개 | 기능: {state.l2.reduce((s, p) => s + (p.functions || []).length, 0)}개 | 제품특성: {state.l2.reduce((s, p) => s + (p.functions || []).reduce((a, f) => a + (f.productChars || []).length, 0), 0)}개
                </div>
              </>
            )}

            {/* 3L 기능트리 (작업요소 기능분석) */}
            {state.tab === 'function-l3' && (
              <>
                <div style={{ background: '#388e3c', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  🛠️ 3L 기능트리 (작업요소)
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#e8f5e9' }}>
                  {state.l2.every(p => (p.l3 || []).length === 0) ? (
                    <div style={{ fontSize: '11px', color: '#888', padding: '16px', textAlign: 'center', background: '#f5f5f5', borderRadius: '4px' }}>구조분석에서 작업요소를 추가하세요</div>
                  ) : state.l2.filter(p => (p.l3 || []).length > 0).map(proc => (
                    <div key={proc.id} style={{ marginBottom: '10px', borderLeft: '2px solid #4caf50', paddingLeft: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#1b5e20', padding: '4px 8px', background: '#a5d6a7', borderRadius: '3px', marginBottom: '4px' }}>
                        🏭 {proc.no}. {proc.name}
                      </div>
                      {(proc.l3 || []).map(we => (
                        <div key={we.id} style={{ marginLeft: '12px', marginBottom: '6px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#2e7d32', padding: '2px 6px', background: '#c8e6c9', borderRadius: '2px', marginBottom: '2px' }}>
                            [{we.m4}] {we.name}
                          </div>
                          {(we.functions || []).length === 0 ? (
                            <div style={{ fontSize: '9px', color: '#888', marginLeft: '12px', padding: '2px' }}>기능 미정의</div>
                          ) : (we.functions || []).map(f => (
                            <div key={f.id} style={{ marginLeft: '12px' }}>
                              <div style={{ fontSize: '9px', color: '#2e7d32', padding: '1px 4px' }}>⚙️ {f.name}</div>
                              {(f.processChars || []).map(c => (
                                <div key={c.id} style={{ marginLeft: '12px', fontSize: '8px', color: '#555', padding: '1px 4px' }}>📏 {c.name}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '10px', color: '#666' }}>
                  작업요소: {state.l2.reduce((s, p) => s + (p.l3 || []).length, 0)}개 | 기능: {state.l2.reduce((s, p) => s + (p.l3 || []).reduce((a, w) => a + (w.functions || []).length, 0), 0)}개
                </div>
              </>
            )}

            {/* 1L 고장영향 트리 */}
            {state.tab === 'failure-l1' && (
              <>
                <div style={{ background: '#c62828', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  ⚠️ 1L 고장영향 트리 (FE)
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#ffebee' }}>
                  {/* 완제품 공정명 */}
                  <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px', color: '#c62828', padding: '4px 8px', background: '#ffcdd2', borderRadius: '4px' }}>
                    📦 {state.l1.name || '(완제품 공정명)'}
                  </div>
                  
                  {/* 구분별 트리 */}
                  {(state.l1.types || []).map((type: any) => (
                    <div key={type.id} style={{ marginLeft: '8px', marginBottom: '8px' }}>
                      {/* 구분 (Your Plant / Ship to Plant / User) */}
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#d32f2f', padding: '2px 6px', background: '#ffe0e0', borderRadius: '3px', marginBottom: '4px' }}>
                        🏷️ {type.name}
                      </div>
                      
                      {/* 기능 → 요구사항 → 고장영향 */}
                      {(type.functions || []).length === 0 ? (
                        <div style={{ marginLeft: '12px', fontSize: '9px', color: '#999', fontStyle: 'italic' }}>
                          (기능 미입력)
                        </div>
                      ) : (type.functions || []).map((func: any) => (
                        <div key={func.id} style={{ marginLeft: '12px', marginBottom: '6px' }}>
                          {/* 완제품기능 */}
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#1b5e20', padding: '2px 6px', background: '#c8e6c9', borderRadius: '2px', marginBottom: '2px' }}>
                            ⚙️ {func.name}
                          </div>
                          {/* 요구사항 */}
                          {(func.requirements || []).length === 0 ? (
                            <div style={{ marginLeft: '12px', fontSize: '9px', color: '#999', fontStyle: 'italic' }}>
                              (요구사항 미입력)
                            </div>
                          ) : (func.requirements || []).map((req: any) => {
                            // 해당 요구사항의 고장영향 찾기
                            const effects = (state.l1.failureScopes || []).filter((s: any) => s.reqId === req.id);
                            return (
                              <div key={req.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 600, color: '#e65100', padding: '1px 4px', background: '#fff3e0', borderRadius: '2px' }}>
                                  📋 {req.name}
                                </div>
                                {/* 고장영향 */}
                                {effects.length === 0 ? (
                                  <div style={{ marginLeft: '12px', fontSize: '9px', color: '#aaa', fontStyle: 'italic' }}>
                                    (고장영향 미입력)
                                  </div>
                                ) : effects.map((eff: any) => (
                                  <div key={eff.id} style={{ marginLeft: '12px', fontSize: '9px', color: '#c62828', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span>⚡ {eff.effect || '(미입력)'}</span>
                                    {eff.severity && (
                                      <span style={{ 
                                        color: eff.severity >= 8 ? '#fff' : '#666', 
                                        fontWeight: 700,
                                        background: eff.severity >= 8 ? '#c62828' : '#e0e0e0',
                                        padding: '0 4px',
                                        borderRadius: '2px',
                                        fontSize: '8px'
                                      }}>
                                        S:{eff.severity}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {(state.l1.types || []).length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', fontSize: '10px', padding: '20px' }}>
                      기능분석(L1)에서 구분을 먼저 입력해주세요.
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ffcdd2', background: '#ffebee', fontSize: '10px', color: '#c62828' }}>
                  구분: {(state.l1.types || []).length}개 | 
                  요구사항: {(state.l1.types || []).reduce((s: number, t: any) => s + (t.functions || []).reduce((a: number, f: any) => a + (f.requirements || []).length, 0), 0)}개 | 
                  고장영향: {(state.l1.failureScopes || []).filter((s: any) => s.effect).length}개
                </div>
              </>
            )}

            {/* 2L 고장형태 트리 */}
            {state.tab === 'failure-l2' && (
              <>
                <div style={{ background: '#ad1457', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  🔥 2L 고장형태 트리 (FM)
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#fce4ec' }}>
                  {state.l2.filter(p => p.name && !p.name.includes('클릭')).map(proc => {
                    const functions = proc.functions || [];
                    return (
                      <div key={proc.id} style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#ad1457' }}>🔧 {proc.no}. {proc.name}</div>
                        {functions.length > 0 ? functions.map((f: any) => {
                          const productChars = f.productChars || [];
                          return (
                            <div key={f.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                              <div style={{ fontSize: '9px', fontWeight: 600, color: '#388e3c' }}>📋 {f.name}</div>
                              {productChars.length > 0 ? productChars.map((pc: any) => (
                                <div key={pc.id} style={{ marginLeft: '12px', marginBottom: '2px' }}>
                                  <div style={{ fontSize: '9px', color: '#1976d2' }}>🏷️ {pc.name}</div>
                                  {(proc.failureModes || []).filter((m: any) => !pc.name || m.productCharId === pc.id || !m.productCharId).slice(0, 3).map((m: any) => (
                                    <div key={m.id} style={{ marginLeft: '12px', fontSize: '9px', color: '#c62828', display: 'flex', gap: '6px' }}>
                                      <span>└ ⚠️ {m.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )) : (
                                <div style={{ marginLeft: '12px', fontSize: '9px', color: '#999' }}>└ (제품특성 미입력)</div>
                              )}
                            </div>
                          );
                        }) : (
                          <div style={{ marginLeft: '12px', fontSize: '9px', color: '#999' }}>└ (메인공정기능 미입력)</div>
                        )}
                        {/* 기능에 연결되지 않은 고장형태 표시 */}
                        {functions.length === 0 && (proc.failureModes || []).map((m: any) => (
                          <div key={m.id} style={{ marginLeft: '16px', fontSize: '9px', color: '#c62828', display: 'flex', gap: '6px' }}>
                            <span>└ ⚠️ {m.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 3L 고장원인 트리 */}
            {state.tab === 'failure-l3' && (
              <>
                <div style={{ background: '#6a1b9a', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  ⚡ 3L 고장원인 트리 (FC)
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#f3e5f5' }}>
                  {state.l2.filter(p => p.name && !p.name.includes('클릭')).map(proc => (
                    <div key={proc.id} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#6a1b9a' }}>🔧 {proc.no}. {proc.name}</div>
                      {(proc.l3 || []).filter((w: any) => w.name && !w.name.includes('클릭')).map((we: any) => (
                        <div key={we.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                          <div style={{ fontSize: '9px', fontWeight: 600, color: '#8e24aa' }}>
                            [{we.m4}] {we.name}
                          </div>
                          {(we.failureCauses || []).map((c: any) => (
                            <div key={c.id} style={{ marginLeft: '16px', fontSize: '9px', color: '#666', display: 'flex', gap: '8px' }}>
                              <span>└ {c.name}</span>
                              {c.occurrence && <span style={{ color: c.occurrence >= 7 ? '#c62828' : '#666', fontWeight: c.occurrence >= 7 ? 700 : 400 }}>O:{c.occurrence}</span>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

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

            {/* 리스크분석 탭: 5단계 AP 테이블 표시 */}
            {state.tab === 'risk' && (
              <APTableInline onClose={() => {}} stage={5} />
            )}

            {/* 최적화 탭: 6단계 AP 테이블 표시 */}
            {state.tab === 'opt' && (
              <APTableInline onClose={() => {}} stage={6} />
            )}
            
            {/* 전체보기 탭: 전체 구조 표시 */}
            {(state.tab === 'all') && (
              <>
                <div style={{ background: '#455a64', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  📊 전체 구조
                </div>
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
              </>
            )}
          </div>
          )}
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

interface TopMenuBarProps {
  fmeaList: any[];
  currentFmea: any;
  selectedFmeaId: string | null;
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
  onOpenSpecialChar: () => void;
  onOpenSOD: () => void;
  onOpen5AP: () => void;
  onOpen6AP: () => void;
}

function TopMenuBar({ 
  fmeaList, currentFmea, selectedFmeaId, dirty, isSaving, lastSaved, currentTab, importMessage, fileInputRef,
  onFmeaChange, onSave, onNavigateToList, onExport, onImportClick, onImportFile, onDownloadTemplate, onOpenSpecialChar, onOpenSOD, onOpen5AP, onOpen6AP 
}: TopMenuBarProps) {
  const [showImportMenu, setShowImportMenu] = React.useState(false);

  return (
    <div className="flex items-center py-1 gap-2 flex-wrap" style={{ background: COLORS.blue, paddingLeft: '4px', paddingRight: '8px' }}>
      {/* FMEA명 */}
      <div className="flex items-center gap-1">
        <span className="text-white text-xs font-bold cursor-pointer hover:underline" onClick={onNavigateToList}>📋 FMEA명:</span>
        <select
          value={selectedFmeaId || '__NEW__'}
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

      {/* 특별특성/SOD/AP/RPN/LLD */}
      <div className="flex items-center gap-1">
        <button onClick={onOpenSpecialChar} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(255,255,255,0.18)' }}>⭐특별특성</button>
        <button onClick={onOpenSOD} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(76,175,80,0.6)' }}>📊SOD</button>
        <button onClick={onOpen5AP} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(255,100,100,0.5)' }}>🔴5AP</button>
        <button onClick={onOpen6AP} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(255,165,0,0.5)' }}>🟠6AP</button>
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📊RPN</button>
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📚LLD</button>
      </div>
    </div>
  );
}

// AP 테이블 인라인 (트리뷰 영역용)
const AP_TABLE_DATA: { s: string; o: string; d: ('H' | 'M' | 'L')[] }[] = [
  { s: '9-10', o: '8-10', d: ['H', 'H', 'H', 'H'] },
  { s: '9-10', o: '6-7', d: ['H', 'H', 'H', 'H'] },
  { s: '9-10', o: '4-5', d: ['H', 'H', 'L', 'L'] },
  { s: '9-10', o: '2-3', d: ['H', 'M', 'L', 'L'] },
  { s: '9-10', o: '1', d: ['H', 'L', 'L', 'L'] },
  { s: '7-8', o: '8-10', d: ['H', 'H', 'H', 'H'] },
  { s: '7-8', o: '6-7', d: ['H', 'H', 'M', 'H'] },
  { s: '7-8', o: '4-5', d: ['H', 'M', 'L', 'L'] },
  { s: '7-8', o: '2-3', d: ['M', 'L', 'L', 'L'] },
  { s: '7-8', o: '1', d: ['L', 'L', 'L', 'L'] },
  { s: '4-6', o: '8-10', d: ['H', 'H', 'M', 'L'] },
  { s: '4-6', o: '6-7', d: ['H', 'M', 'L', 'L'] },
  { s: '4-6', o: '4-5', d: ['H', 'M', 'L', 'L'] },
  { s: '4-6', o: '2-3', d: ['M', 'L', 'L', 'L'] },
  { s: '4-6', o: '1', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '8-10', d: ['M', 'L', 'L', 'L'] },
  { s: '2-3', o: '6-7', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '4-5', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '2-3', d: ['L', 'L', 'L', 'L'] },
  { s: '2-3', o: '1', d: ['L', 'L', 'L', 'L'] },
];

const D_HEADERS = ['7-10', '5-6', '2-4', '1'];
const AP_COLORS: Record<'H' | 'M' | 'L', { bg: string; text: string }> = {
  H: { bg: '#f87171', text: '#7f1d1d' },
  M: { bg: '#fde047', text: '#713f12' },
  L: { bg: '#86efac', text: '#14532d' },
};

function APTableInline({ onClose, showClose = true, stage = 5 }: { onClose: () => void; showClose?: boolean; stage?: 5 | 6 }) {
  const severityRanges = ['9-10', '7-8', '4-6', '2-3'];
  const getSeverityRowSpan = (s: string) => AP_TABLE_DATA.filter(r => r.s === s).length;
  
  // 개수 계산
  let hCount = 0, mCount = 0, lCount = 0;
  AP_TABLE_DATA.forEach(row => {
    row.d.forEach(ap => {
      if (ap === 'H') hCount++;
      else if (ap === 'M') mCount++;
      else lCount++;
    });
  });

  // 단계별 헤더 색상
  const headerBg = stage === 6 ? '#2e7d32' : '#1e3a5f';
  const stageLabel = stage === 6 ? '6AP' : '5AP';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: headerBg, color: '#fff', padding: '6px 10px', fontSize: '11px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span>📊 {stageLabel} 기준표 (H:{hCount} M:{mCount} L:{lCount})</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '2px', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
          <colgroup>
            <col style={{ width: '13px' }} />
            <col style={{ width: '19px' }} />
            <col style={{ width: '19px' }} />
            <col style={{ width: '19px' }} />
            <col style={{ width: '19px' }} />
            <col style={{ width: '19px' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              <th style={{ border: '1px solid #000', padding: '1px', fontSize: '8px' }}>S</th>
              <th style={{ border: '1px solid #000', padding: '1px', fontSize: '8px' }}>O</th>
              {D_HEADERS.map(d => <th key={d} style={{ border: '1px solid #000', padding: '1px', fontSize: '8px' }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {AP_TABLE_DATA.map((row, idx) => {
              const isFirstOfSeverity = idx === 0 || AP_TABLE_DATA[idx - 1].s !== row.s;
              return (
                <tr key={idx}>
                  {isFirstOfSeverity && (
                    <td rowSpan={getSeverityRowSpan(row.s)} style={{ border: '1px solid #000', padding: '0', fontWeight: 700, textAlign: 'center', background: '#e3f2fd', fontSize: '9px', writingMode: 'vertical-rl' }}>
                      {row.s}
                    </td>
                  )}
                  <td style={{ border: '1px solid #000', padding: '1px', textAlign: 'center', background: '#f5f5f5', fontSize: '9px' }}>{row.o}</td>
                  {row.d.map((ap, dIdx) => (
                    <td key={dIdx} style={{ border: '1px solid #000', padding: '1px', textAlign: 'center', background: AP_COLORS[ap].bg, color: AP_COLORS[ap].text, fontWeight: 700, fontSize: '10px' }}>
                      {ap}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ background: '#f0f4f8', padding: '4px', fontSize: '9px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><span style={{ width: '12px', height: '12px', background: '#f87171', borderRadius: '2px' }}></span>H</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><span style={{ width: '12px', height: '12px', background: '#fde047', borderRadius: '2px' }}></span>M</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><span style={{ width: '12px', height: '12px', background: '#86efac', borderRadius: '2px' }}></span>L</span>
      </div>
    </div>
  );
}

interface TabMenuProps {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
}

function TabMenu({ state, setState }: TabMenuProps) {
  const structureConfirmed = (state as any).structureConfirmed || false;
  const failureLinks = (state as any).failureLinks || [];
  const hasFailureLinks = failureLinks.length > 0; // 고장연결 완료 여부
  
  // 탭 활성화 조건
  const isTabEnabled = (tabId: string) => {
    if (tabId === 'structure') return true;
    if (tabId.startsWith('function-')) return structureConfirmed;
    if (tabId.startsWith('failure-')) return structureConfirmed;
    // 평가 탭 (리스크분석, 최적화)은 고장연결 후 활성화
    if (tabId === 'risk' || tabId === 'opt') return hasFailureLinks;
    return structureConfirmed;
  };

  // 분석 탭 + 평가 탭 (구분선으로 구분)
  const analysisTabs = ANALYSIS_TABS;
  const evaluationTabs = [
    { id: 'risk', label: '리스크분석', step: 5 },
    { id: 'opt', label: '최적화', step: 6 },
  ];
  
  return (
    <div className="flex-shrink-0 bg-white py-0.5" style={{ borderBottom: `2px solid ${COLORS.blue}`, paddingLeft: 0, paddingRight: '8px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* 분석 탭 */}
          <div className="flex gap-px">
            {analysisTabs.map(tab => {
              const isActive = state.tab === tab.id;
              const isEnabled = isTabEnabled(tab.id);
              const activeColor = tab.id === 'structure' ? '#1a237e' : COLORS.blue;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isEnabled) {
                      alert('⚠️ 구조분석을 먼저 확정해주세요.');
                      return;
                    }
                    setState(prev => ({ ...prev, tab: tab.id }));
                  }}
                  className="font-bold"
                  style={{
                    padding: '3px 6px',
                    fontSize: '10px',
                    background: isActive ? activeColor : isEnabled ? '#e8f0f8' : '#f0f0f0',
                    borderTop: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderRight: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderLeft: `1px solid ${isActive ? activeColor : '#c0d0e0'}`,
                    borderBottom: 'none',
                    borderRadius: '2px 2px 0 0',
                    color: isActive ? '#fff' : isEnabled ? COLORS.text : '#aaa',
                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                    opacity: isEnabled ? 1 : 0.6,
                    whiteSpace: 'nowrap',
                  }}
                  title={!isEnabled ? '구조분석 확정 후 사용 가능' : ''}
                >
                  {tab.label}
                  {!isEnabled && <span style={{ marginLeft: '2px', fontSize: '7px' }}>🔒</span>}
                </button>
              );
            })}
          </div>

          {/* 구분선 */}
          <div style={{ width: '2px', height: '20px', background: '#1976d2', margin: '0 4px' }} />

          {/* 평가 탭 (고장연결 후 활성화) - 5개: 구조분석, 기능분석, 고장분석, 리스크분석, 최적화 */}
          <div className="flex gap-px">
            {[
              { id: 'eval-structure', label: '구조분석', step: 2 },
              { id: 'eval-function', label: '기능분석', step: 3 },
              { id: 'eval-failure', label: '고장분석', step: 4 },
              { id: 'risk', label: '리스크분석', step: 5 },
              { id: 'opt', label: '최적화', step: 6 },
            ].map(tab => {
              const isActive = state.tab === tab.id;
              const isEnabled = hasFailureLinks;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isEnabled) {
                      alert('⚠️ 고장연결을 먼저 완료해주세요.');
                      return;
                    }
                    setState(prev => ({ ...prev, tab: tab.id }));
                  }}
                  className="font-bold"
                  style={{
                    padding: '3px 6px',
                    fontSize: '10px',
                    background: isActive ? '#4caf50' : isEnabled ? '#e8f5e9' : '#e0e0e0',
                    borderTop: `1px solid ${isActive ? '#4caf50' : isEnabled ? '#a5d6a7' : '#bdbdbd'}`,
                    borderRight: `1px solid ${isActive ? '#4caf50' : isEnabled ? '#a5d6a7' : '#bdbdbd'}`,
                    borderLeft: `1px solid ${isActive ? '#4caf50' : isEnabled ? '#a5d6a7' : '#bdbdbd'}`,
                    borderBottom: 'none',
                    borderRadius: '2px 2px 0 0',
                    color: isActive ? '#fff' : isEnabled ? '#2e7d32' : '#9e9e9e',
                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                  }}
                  title={!isEnabled ? '고장연결 완료 후 사용 가능' : ''}
                >
                  {tab.label}
                  {!isEnabled && <span style={{ marginLeft: '2px', fontSize: '7px' }}>🔒</span>}
                </button>
              );
            })}
          </div>
          
          {/* 단계별 토글 버튼 - 전체보기(All) 선택 시에만 표시 */}
          {state.tab === 'all' && (
            <>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <StepToggleButtons state={state} setState={setState} />
            </>
          )}
        </div>

        <div className="flex items-center gap-1" style={{ marginLeft: '4px' }}>
          <div className="w-px h-4 bg-gray-300" />
          <button
            onClick={() => setState(prev => ({ ...prev, tab: 'all', levelView: 'all' }))}
            style={{
              background: state.tab === 'all' ? COLORS.blue : '#fff',
              border: `1px solid ${COLORS.blue}`,
              borderRadius: '3px',
              color: state.tab === 'all' ? '#fff' : COLORS.blue,
              padding: '3px 6px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
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
    { step: 3, label: '3단계', color: '#1b5e20' },
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

// ============ 평가 탭 렌더러 (eval-structure, eval-function, eval-failure, risk, opt, all) ============
function EvalTabRenderer({ tab, rows, state, l1Spans, l1TypeSpans, l1FuncSpans, l2Spans, onAPClick }: {
  tab: string;
  rows: FlatRow[];
  state: WorksheetState;
  l1Spans: number[];
  l1TypeSpans: number[];
  l1FuncSpans: number[];
  l2Spans: number[];
  onAPClick?: () => void;
}) {
  const BORDER = '1px solid #b0bec5';
  const stickyTheadStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 20, background: '#fff' };

  // 탭에 따라 표시할 단계 결정 (각 평가탭은 해당 단계만 표시, 전체보기만 전체 표시)
  const getVisibleSteps = () => {
    switch (tab) {
      case 'eval-structure': return [2];           // 구조분석만
      case 'eval-function': return [3];            // 기능분석만
      case 'eval-failure': return [4];             // 고장분석만
      case 'risk': return [5];                     // 리스크분석만
      case 'opt': return [6];                      // 최적화만
      case 'all': return [2, 3, 4, 5, 6];          // 전체보기
      default: return [2, 3, 4, 5, 6];
    }
  };

  const visibleSteps = tab === 'all' ? (state.visibleSteps || [2, 3, 4, 5, 6]) : getVisibleSteps();
  
  // 전체보기일 때만 가로 스크롤 활성화
  const isAllView = tab === 'all';

  // 색상 정의 (조기 반환 전에 정의)
  const COLORS = {
    structure: { main: '#1565c0', header: '#bbdefb', cell: '#e3f2fd' },
    function: { main: '#1b5e20', header: '#c8e6c9', cell: '#e8f5e9' },
    failure: { main: '#c62828', header: '#fff9c4', cell: '#fffde7' },
    risk: { main: '#6a1b9a', prevention: { header: '#c8e6c9', cell: '#e8f5e9' }, detection: { header: '#bbdefb', cell: '#e3f2fd' }, evaluation: { header: '#f8bbd9', cell: '#fce4ec' } },
    opt: { main: '#2e7d32', plan: { header: '#bbdefb', cell: '#e3f2fd' }, monitor: { header: '#ffe0b2', cell: '#fff3e0' }, effect: { header: '#c8e6c9', cell: '#e8f5e9' } },
  };
  
  // 고장연결 데이터
  const failureLinks = (state as any).failureLinks || [];
  
  // eval-structure 탭: 고장연결 결과 기반 구조분석 (공정명 중심 셀합치기)
  if (tab === 'eval-structure' && failureLinks.length > 0) {
    return <EvalStructureTab failureLinks={failureLinks} state={state} />;
  }

  // eval-function 탭: 고장연결 결과 기반 기능분석 (DB 연결 데이터 표시)
  // ★ 원칙: 고장분석 텍스트가 아닌, 실제 기능분석 DB에 저장된 데이터를 표시
  if (tab === 'eval-function' && failureLinks.length > 0) {
    // 기능분석 데이터 조회용 맵 구축
    // 1L: 요구사항 맵 (id -> { type, funcName, reqName })
    const requirementMap = new Map<string, { typeName: string; funcName: string; reqName: string }>();
    (state.l1?.types || []).forEach((type: any) => {
      (type.functions || []).forEach((func: any) => {
        (func.requirements || []).forEach((req: any) => {
          requirementMap.set(req.id, { typeName: type.name, funcName: func.name, reqName: req.name });
        });
      });
    });
    
    // 2L: 제품특성 맵 (processName -> { funcName, productChar })
    const productCharMap = new Map<string, { processName: string; funcName: string; productCharName: string }[]>();
    (state.l2 || []).forEach((proc: any) => {
      const key = proc.name || '';
      if (!productCharMap.has(key)) productCharMap.set(key, []);
      (proc.functions || []).forEach((func: any) => {
        (func.productChars || []).forEach((pc: any) => {
          productCharMap.get(key)!.push({ processName: proc.name, funcName: func.name, productCharName: pc.name });
        });
      });
    });
    
    // 3L: 공정특성 맵 (workElemName -> { funcName, processChar })
    const processCharMap = new Map<string, { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string }[]>();
    (state.l2 || []).forEach((proc: any) => {
      (proc.l3 || []).forEach((we: any) => {
        const key = we.name || '';
        if (!processCharMap.has(key)) processCharMap.set(key, []);
        (we.functions || []).forEach((func: any) => {
          (func.processChars || []).forEach((pc: any) => {
            processCharMap.get(key)!.push({ processName: proc.name, workElemName: we.name, m4: we.m4 || '', funcName: func.name, processCharName: pc.name });
          });
        });
      });
    });
    
    // FM별 그룹핑 + 기능분석 데이터 조회
    const fmGroups = new Map<string, { 
      fmId: string; fmText: string; fmProcess: string;
      // 고장 데이터 + 연결된 기능 데이터
      fes: { feId: string; feScope: string; feText: string; severity: number; funcData: { typeName: string; funcName: string; reqName: string } | null }[];
      fcs: { fcId: string; m4: string; workElem: string; fcText: string; funcData: { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string } | null }[];
      l2FuncData: { processName: string; funcName: string; productCharName: string } | null;
    }>();
    
    failureLinks.forEach((link: any) => {
      if (!fmGroups.has(link.fmId)) {
        // 2L 제품특성 조회: fmProcess와 매칭
        const procKey = (link.fmProcess || '').replace(/^\d+\s*/, '').trim();
        const l2Funcs = productCharMap.get(procKey) || productCharMap.get(link.fmProcess || '') || [];
        
        fmGroups.set(link.fmId, { 
          fmId: link.fmId, fmText: link.fmText || '', fmProcess: link.fmProcess || '',
          fes: [], fcs: [],
          l2FuncData: l2Funcs.length > 0 ? l2Funcs[0] : null
        });
      }
      const group = fmGroups.get(link.fmId)!;
      
      // FE 추가 (기능분석 데이터 조회)
      if (link.feId && link.feId !== '' && !group.fes.some(f => f.feId === link.feId)) {
        // 1L 요구사항 조회: feId로 직접 조회하거나, failureScopes에서 reqId 찾기
        const failureScope = (state.l1?.failureScopes || []).find((fs: any) => fs.id === link.feId) as any;
        const reqData = failureScope?.reqId ? requirementMap.get(failureScope.reqId) : null;
        
        group.fes.push({ 
          feId: link.feId, feScope: link.feScope || '', feText: link.feText || '', severity: link.severity || 0,
          funcData: reqData || null
        });
      }
      
      // FC 추가 (기능분석 데이터 조회)
      if (link.fcId && link.fcId !== '' && !group.fcs.some(f => f.fcId === link.fcId)) {
        // 3L 공정특성 조회: workElem으로 매칭
        const weKey = link.fcWorkElem || '';
        const l3Funcs = processCharMap.get(weKey) || [];
        
        group.fcs.push({ 
          fcId: link.fcId, m4: link.fcM4 || '', workElem: link.fcWorkElem || '', fcText: link.fcText || '',
          funcData: l3Funcs.length > 0 ? l3Funcs[0] : null
        });
      }
    });
    
    // 행 생성
    const allRows: {
      fmText: string; fmProcess: string;
      showFm: boolean;
      fmRowSpan: number;
      // 1L 기능분석 데이터
      l1Func: { typeName: string; funcName: string; reqName: string } | null;
      // 2L 기능분석 데이터
      l2Func: { processName: string; funcName: string; productCharName: string } | null;
      // 3L 기능분석 데이터
      l3Func: { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string } | null;
      // 고장 데이터 (참조용)
      fe: { scope: string; text: string } | null;
      fc: { m4: string; workElem: string; text: string } | null;
    }[] = [];
    
    Array.from(fmGroups.values()).forEach(group => {
      const maxRows = Math.max(group.fes.length, group.fcs.length, 1);
      
      for (let i = 0; i < maxRows; i++) {
        const feItem = group.fes[i] || null;
        const fcItem = group.fcs[i] || null;
        allRows.push({
          fmText: group.fmText, fmProcess: group.fmProcess,
          showFm: i === 0,
          fmRowSpan: maxRows,
          l1Func: feItem?.funcData || null,
          l2Func: group.l2FuncData,
          l3Func: fcItem?.funcData || null,
          fe: feItem ? { scope: feItem.feScope, text: feItem.feText } : null,
          fc: fcItem ? { m4: fcItem.m4, workElem: fcItem.workElem, text: fcItem.fcText } : null,
        });
      }
    });
    
    const getScopeAbbr = (s: string) => s === 'Your Plant' ? 'YP' : s === 'Ship to Plant' ? 'SP' : s === 'User' ? 'U' : '';
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead style={stickyTheadStyle}>
          <tr>
            <th colSpan={8} style={{ background: COLORS.function.main, color: '#fff', border: BORDER, padding: '6px', fontWeight: 900, fontSize: '11px', textAlign: 'center' }}>
              P-FMEA 기능 분석(3단계) - DB 연결 데이터 (고장분석 ↔ 기능분석 1:1 매칭)
            </th>
          </tr>
          <tr>
            <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정기능/요구사항</th>
            <th colSpan={2} style={{ background: COLORS.function.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>2. 메인공정기능/제품특성</th>
            <th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '4px', fontSize: '9px', textAlign: 'center' }}>3. 작업요소기능/공정특성</th>
          </tr>
          <tr>
            <th style={{ width: '6%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>구분</th>
            <th style={{ width: '15%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>완제품기능</th>
            <th style={{ width: '15%', background: '#c8e6c9', border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center', fontWeight: 700 }}>요구사항</th>
            <th style={{ width: '15%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>공정기능</th>
            <th style={{ width: '12%', background: '#c8e6c9', border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center', fontWeight: 700 }}>제품특성</th>
            <th style={{ width: '7%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>4M</th>
            <th style={{ width: '15%', background: COLORS.function.cell, border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center' }}>작업요소기능</th>
            <th style={{ width: '15%', background: '#c8e6c9', border: BORDER, padding: '3px', fontSize: '9px', textAlign: 'center', fontWeight: 700 }}>공정특성</th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row, idx) => {
            const cellStyle = { border: BORDER, padding: '4px', fontSize: '10px', verticalAlign: 'middle' as const };
            // 기능분석 데이터가 없으면 빨간색으로 표시
            const missingStyle = { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' as const };
            
            return (
              <tr key={`func-${idx}`} style={{ borderTop: row.showFm ? '2px solid #999' : undefined }}>
                {/* 1. 완제품 기능/요구사항 - DB 데이터 */}
                {/* 구분: 기능분석 DB에서 조회 */}
                {row.showFm && <td rowSpan={row.fmRowSpan} style={{ ...cellStyle, background: '#e8f5e9', textAlign: 'center' }}>{row.l1Func?.typeName || getScopeAbbr(row.fe?.scope || '')}</td>}
                {/* 완제품기능: 기능분석 DB에서 조회 */}
                {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l1Func ? { ...cellStyle, background: '#e8f5e9' } : missingStyle}>{row.l1Func?.funcName || '(미연결)'}</td>}
                {/* 요구사항: 기능분석 DB에서 조회 */}
                {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l1Func ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : missingStyle}>{row.l1Func?.reqName || '(미연결)'}</td>}
                {/* 2. 공정기능/제품특성 - DB 데이터 */}
                {/* 공정기능: 기능분석 DB에서 조회 */}
                {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2Func ? { ...cellStyle, background: '#e8f5e9' } : missingStyle}>{row.l2Func?.funcName || '(미연결)'}</td>}
                {/* 제품특성: 기능분석 DB에서 조회 */}
                {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2Func ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : missingStyle}>{row.l2Func?.productCharName || '(미연결)'}</td>}
                {/* 3. 작업요소 기능/공정특성 - DB 데이터 */}
                {/* 4M: 기능분석 DB에서 조회 */}
                <td style={{ ...cellStyle, background: '#e8f5e9', textAlign: 'center' }}>{row.l3Func?.m4 || row.fc?.m4 || ''}</td>
                {/* 작업요소기능: 기능분석 DB에서 조회 */}
                <td style={row.l3Func ? { ...cellStyle, background: '#e8f5e9' } : (row.fc ? missingStyle : { ...cellStyle, background: '#fafafa' })}>{row.l3Func?.funcName || (row.fc ? '(미연결)' : '')}</td>
                {/* 공정특성: 기능분석 DB에서 조회 */}
                <td style={row.l3Func ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : (row.fc ? missingStyle : { ...cellStyle, background: '#fafafa' })}>{row.l3Func?.processCharName || (row.fc ? '(미연결)' : '')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  // eval-failure 탭: 고장연결 결과 표시 (두 번째 이미지 형식)
  if (tab === 'eval-failure' && failureLinks.length > 0) {
    // FM별 그룹핑
    const fmGroups = new Map<string, { fmId: string; fmText: string; fmNo: string; fes: any[]; fcs: any[] }>();
    failureLinks.forEach((link: any) => {
      if (!fmGroups.has(link.fmId)) {
        fmGroups.set(link.fmId, { fmId: link.fmId, fmText: link.fmText, fmNo: link.fmNo || '', fes: [], fcs: [] });
      }
      const group = fmGroups.get(link.fmId)!;
      if (link.feId && !group.fes.some(f => f.id === link.feId)) {
        group.fes.push({ id: link.feId, scope: link.feScope, text: link.feText, severity: link.severity, feNo: link.feNo, processName: link.fcProcess });
      }
      if (link.fcId && !group.fcs.some(f => f.id === link.fcId)) {
        group.fcs.push({ id: link.fcId, text: link.fcText, workElem: link.fcWorkElem, fcNo: link.fcNo, processName: link.fcProcess });
      }
    });
    const groups = Array.from(fmGroups.values());
    
    // 렌더링 행 생성 - FM 중심, FE/FC는 각각 한 줄씩
    const renderRows: any[] = [];
    groups.forEach(group => {
      const maxRows = Math.max(group.fes.length, group.fcs.length, 1);
      for (let i = 0; i < maxRows; i++) {
        const fe = group.fes[i];
        const fc = group.fcs[i];
        renderRows.push({
          fmId: group.fmId, fmText: group.fmText, fmNo: group.fmNo,
          showFm: i === 0, fmRowSpan: maxRows,
          fe, showFe: !!fe,
          fc, showFc: !!fc,
        });
      }
    });
    
    const totalFE = groups.reduce((s, g) => s + g.fes.length, 0);
    const totalFC = groups.reduce((s, g) => s + g.fcs.length, 0);
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead style={stickyTheadStyle}>
          <tr>
            <th colSpan={9} style={{ background: COLORS.failure.main, color: '#fff', border: BORDER, padding: '6px', fontWeight: 900, fontSize: '11px', textAlign: 'center' }}>
              P-FMEA 고장 분석(4단계) - 연결 결과 (FM:{groups.length} FE:{totalFE} FC:{totalFC})
            </th>
          </tr>
          <tr>
            <th colSpan={4} style={{ background: '#e3f2fd', border: BORDER, padding: '4px', fontSize: '10px', textAlign: 'center', fontWeight: 700 }}>고장영향(FE)</th>
            <th rowSpan={2} style={{ width: '12%', background: '#fff8e1', border: BORDER, padding: '4px', fontSize: '10px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>고장형태(FM)</th>
            <th colSpan={4} style={{ background: '#e8f5e9', border: BORDER, padding: '4px', fontSize: '10px', textAlign: 'center', fontWeight: 700 }}>고장원인(FC)</th>
          </tr>
          <tr>
            <th style={{ width: '5%', background: '#e3f2fd', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>No</th>
            <th style={{ width: '6%', background: '#e3f2fd', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>구분</th>
            <th style={{ width: '15%', background: '#e3f2fd', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>고장영향</th>
            <th style={{ width: '4%', background: '#e3f2fd', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>S</th>
            <th style={{ width: '5%', background: '#e8f5e9', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>No</th>
            <th style={{ width: '10%', background: '#e8f5e9', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>공정명</th>
            <th style={{ width: '12%', background: '#e8f5e9', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>작업요소</th>
            <th style={{ background: '#e8f5e9', border: BORDER, padding: '3px', fontSize: '9px', fontWeight: 600 }}>고장원인</th>
          </tr>
        </thead>
        <tbody>
          {renderRows.map((row, idx) => (
            <tr key={`fail-${row.fmId}-${idx}`} style={{ borderTop: row.showFm ? '2px solid #999' : undefined }}>
              {/* FE 영역 */}
              {row.showFe ? (
                <>
                  <td style={{ border: BORDER, padding: '3px', fontSize: '9px', background: '#e8f5e9', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>{row.fe?.feNo || ''}</td>
                  <td style={{ border: BORDER, padding: '3px', fontSize: '9px', background: '#e3f2fd', textAlign: 'center' }}>
                    {row.fe?.scope === 'Your Plant' ? 'YP' : row.fe?.scope === 'Ship to Plant' ? 'SP' : row.fe?.scope === 'User' ? 'USER' : ''}
                  </td>
                  <td style={{ border: BORDER, padding: '3px', fontSize: '9px' }}>{row.fe?.text || ''}</td>
                  <td style={{ border: BORDER, padding: '3px', fontSize: '10px', textAlign: 'center', fontWeight: 700, color: (row.fe?.severity || 0) >= 8 ? '#c62828' : '#333' }}>{row.fe?.severity || ''}</td>
                </>
              ) : (
                <><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td></>
              )}
              {/* FM 영역 - 병합 */}
              {row.showFm && (
                <td rowSpan={row.fmRowSpan} style={{ border: BORDER, padding: '4px', fontSize: '9px', background: '#fff8e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 600 }}>
                  <div style={{ fontSize: '8px', color: '#f57c00', marginBottom: '2px' }}>{row.fmNo}</div>
                  <div>{row.fmText}</div>
                </td>
              )}
              {/* FC 영역 */}
              {row.showFc ? (
                <>
                  <td style={{ border: BORDER, padding: '3px', fontSize: '9px', background: '#e8f5e9', textAlign: 'center', fontWeight: 700, color: '#2e7d32' }}>{row.fc?.fcNo || ''}</td>
                  <td style={{ border: BORDER, padding: '3px', fontSize: '9px' }}>{row.fc?.processName || ''}</td>
                  <td style={{ border: BORDER, padding: '3px', fontSize: '9px' }}>{row.fc?.workElem || ''}</td>
                  <td style={{ border: BORDER, padding: '3px', fontSize: '9px' }}>{row.fc?.text || ''}</td>
                </>
              ) : (
                <><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td><td style={{ border: BORDER, background: '#fafafa' }}></td></>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // 전체보기(all) 탭: 고장연결 결과 기반 40열 테이블
  if (tab === 'all' && failureLinks.length > 0) {
    // ========== 1. FM별 그룹핑 + 기능분석 데이터 조회 (유틸리티 함수 사용) ==========
    const fmGroups = groupFailureLinksWithFunctionData(failureLinks, state);
    
    // 디버깅 로그
    console.log('=== 전체보기 데이터 검증 ===');
    console.log('FM 그룹 수:', fmGroups.size);
    fmGroups.forEach((g, k) => {
      console.log(`FM[${k}]: "${g.fmText}" (${g.fmProcess}) - FE:${g.fes.length}, FC:${g.fcs.length}`);
    });
    
    // ========== 2. 공정명별 그룹핑 (셀합치기용, 유틸리티 함수 사용) ==========
    const processGroups = groupByProcessName(fmGroups);
    const allRows: {
      processName: string;
      fmText: string;
      showFm: boolean;
      fmRowSpan: number;
      showProcess: boolean;
      processRowSpan: number;
      fe: { no: string; scope: string; text: string; severity: number; funcData: { typeName: string; funcName: string; reqName: string } | null } | null;
      feRowSpan: number;
      showFe: boolean;
      fc: { no: string; process: string; m4: string; workElem: string; text: string; funcData: { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string } | null } | null;
      fcRowSpan: number;
      showFc: boolean;
      l2FuncData: { processName: string; funcName: string; productCharName: string } | null;
    }[] = [];
    
    // 행 생성
    let globalIdx = 0;
    processGroups.forEach((pg, procName) => {
      pg.startIdx = globalIdx;
      let processRowCount = 0;
      
      pg.fmList.forEach((group, fmIdx) => {
        const feCount = group.fes.length;
        const fcCount = group.fcs.length;
        const maxRows = Math.max(feCount, fcCount, 1);
        
        for (let i = 0; i < maxRows; i++) {
          // 마지막 행 병합 계산 (유틸리티 함수 사용)
          const mergeConfig = calculateLastRowMerge(feCount, fcCount, i, maxRows);
          
          // FE 항목 추출
          let fe: { no: string; scope: string; text: string; severity: number; funcData: { typeName: string; funcName: string; reqName: string } | null } | null = null;
          if (mergeConfig.showFe && i < feCount) {
            fe = group.fes[i];
          }
          
          // FC 항목 추출
          let fc: { no: string; process: string; m4: string; workElem: string; text: string; funcData: { processName: string; workElemName: string; m4: string; funcName: string; processCharName: string } | null } | null = null;
          if (mergeConfig.showFc && i < fcCount) {
            fc = group.fcs[i];
          }
          
          allRows.push({
            processName: procName,
            fmText: group.fmText,
            showFm: i === 0,
            fmRowSpan: maxRows,
            showProcess: fmIdx === 0 && i === 0,
            processRowSpan: 0, // 나중에 계산
            fe: fe,
            feRowSpan: mergeConfig.feRowSpan,
            showFe: mergeConfig.showFe,
            fc: fc,
            fcRowSpan: mergeConfig.fcRowSpan,
            showFc: mergeConfig.showFc,
            l2FuncData: group.l2FuncData || null,
          });
          
          processRowCount++;
          globalIdx++;
        }
      });
      
      // 공정 rowSpan 설정
      if (pg.startIdx >= 0 && allRows[pg.startIdx]) {
        allRows[pg.startIdx].processRowSpan = processRowCount;
      }
    });
    
    const totalFM = fmGroups.size;
    const totalFE = Array.from(fmGroups.values()).reduce((s, g) => s + g.fes.length, 0);
    const totalFC = Array.from(fmGroups.values()).reduce((s, g) => s + g.fcs.length, 0);
    
    console.log(`총 FM:${totalFM}, FE:${totalFE}, FC:${totalFC}, 행:${allRows.length}`);
    
    const handleExportExcel = () => {
      exportAllViewExcel(state, (state as any).fmeaName || 'PFMEA');
    };
    
    return (
      <div style={{ width: '100%' }}>
        {/* 전체보기 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#1565c0', color: '#fff', marginBottom: '4px' }}>
          <div style={{ fontWeight: 900, fontSize: '12px' }}>
            📊 P-FMEA 전체보기 (FM:{totalFM} FE:{totalFE} FC:{totalFC}) - 총 {allRows.length}행
          </div>
          <button
            onClick={handleExportExcel}
            style={{
              padding: '6px 14px', fontSize: '11px', fontWeight: 700,
              background: '#4caf50', color: '#fff', border: 'none',
              borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            📥 Excel 내보내기
          </button>
        </div>
        <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ minWidth: '2800px', borderCollapse: 'collapse' }}>
          <thead style={stickyTheadStyle}>
            {/* 1행: 단계 대분류 */}
            <tr>
              <th colSpan={4} style={{ background: '#1565c0', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 구조분석(2단계)</th>
              <th colSpan={8} style={{ background: '#1b5e20', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 기능분석(3단계)</th>
              <th colSpan={6} style={{ background: '#c62828', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 고장분석(4단계)</th>
              <th colSpan={8} style={{ background: '#6a1b9a', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 리스크분석(5단계)</th>
              <th colSpan={14} style={{ background: '#e65100', color: '#fff', border: BORDER, padding: '4px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 최적화(6단계)</th>
            </tr>
            {/* 2행: 서브그룹 */}
            <tr>
              <th style={{ background: '#bbdefb', border: BORDER, padding: '2px', fontSize: '8px' }}>1.완제품</th>
              <th style={{ background: '#bbdefb', border: BORDER, padding: '2px', fontSize: '8px' }}>2.메인공정</th>
              <th colSpan={2} style={{ background: '#bbdefb', border: BORDER, padding: '2px', fontSize: '8px' }}>3.작업요소</th>
              <th colSpan={3} style={{ background: '#c8e6c9', border: BORDER, padding: '2px', fontSize: '8px' }}>1.완제품기능/요구사항</th>
              <th colSpan={2} style={{ background: '#c8e6c9', border: BORDER, padding: '2px', fontSize: '8px' }}>2.공정기능/제품특성</th>
              <th colSpan={3} style={{ background: '#c8e6c9', border: BORDER, padding: '2px', fontSize: '8px' }}>3.작업요소기능/공정특성</th>
              <th colSpan={3} style={{ background: '#fff9c4', border: BORDER, padding: '2px', fontSize: '8px' }}>1.고장영향(FE)</th>
              <th style={{ background: '#fff9c4', border: BORDER, padding: '2px', fontSize: '8px' }}>2.고장형태</th>
              <th colSpan={2} style={{ background: '#fff9c4', border: BORDER, padding: '2px', fontSize: '8px' }}>3.고장원인(FC)</th>
              <th colSpan={2} style={{ background: '#e1bee7', border: BORDER, padding: '2px', fontSize: '8px' }}>예방관리</th>
              <th colSpan={2} style={{ background: '#e1bee7', border: BORDER, padding: '2px', fontSize: '8px' }}>검출관리</th>
              <th colSpan={4} style={{ background: '#e1bee7', border: BORDER, padding: '2px', fontSize: '8px' }}>리스크평가</th>
              <th colSpan={4} style={{ background: '#ffe0b2', border: BORDER, padding: '2px', fontSize: '8px' }}>계획</th>
              <th colSpan={3} style={{ background: '#ffe0b2', border: BORDER, padding: '2px', fontSize: '8px' }}>모니터링</th>
              <th colSpan={7} style={{ background: '#ffe0b2', border: BORDER, padding: '2px', fontSize: '8px' }}>효과평가</th>
            </tr>
            {/* 3행: 컬럼명 */}
            <tr>
              {/* 구조분석 4열 */}
              <th style={{ width: '60px', background: '#e3f2fd', border: BORDER, padding: '2px', fontSize: '7px' }}>완제품</th>
              <th style={{ width: '80px', background: '#e3f2fd', border: BORDER, padding: '2px', fontSize: '7px' }}>NO+공정명</th>
              <th style={{ width: '25px', background: '#e3f2fd', border: BORDER, padding: '2px', fontSize: '7px' }}>4M</th>
              <th style={{ width: '70px', background: '#e3f2fd', border: BORDER, padding: '2px', fontSize: '7px' }}>작업요소</th>
              {/* 기능분석 8열 */}
              <th style={{ width: '35px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: '7px' }}>구분</th>
              <th style={{ width: '80px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: '7px' }}>완제품기능</th>
              <th style={{ width: '70px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: '7px' }}>요구사항</th>
              <th style={{ width: '80px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: '7px' }}>공정기능</th>
              <th style={{ width: '60px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: '7px' }}>제품특성</th>
              <th style={{ width: '25px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: '7px' }}>4M</th>
              <th style={{ width: '70px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: '7px' }}>작업요소기능</th>
              <th style={{ width: '60px', background: '#e8f5e9', border: BORDER, padding: '2px', fontSize: '7px' }}>공정특성</th>
              {/* 고장분석 6열 */}
              <th style={{ width: '35px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: '7px' }}>구분</th>
              <th style={{ width: '80px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: '7px' }}>고장영향</th>
              <th style={{ width: '25px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: '7px' }}>S</th>
              <th style={{ width: '80px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: '7px' }}>고장형태</th>
              <th style={{ width: '60px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: '7px' }}>작업요소</th>
              <th style={{ width: '80px', background: '#fffde7', border: BORDER, padding: '2px', fontSize: '7px' }}>고장원인</th>
              {/* 리스크분석 8열 */}
              <th style={{ width: '70px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: '7px' }}>예방관리</th>
              <th style={{ width: '25px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: '7px' }}>O</th>
              <th style={{ width: '70px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: '7px' }}>검출관리</th>
              <th style={{ width: '25px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: '7px' }}>D</th>
              <th style={{ width: '25px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: '7px' }}>AP</th>
              <th style={{ width: '30px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: '7px' }}>RPN</th>
              <th style={{ width: '40px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: '7px' }}>특별특성</th>
              <th style={{ width: '60px', background: '#fce4ec', border: BORDER, padding: '2px', fontSize: '7px' }}>습득교훈</th>
              {/* 최적화 14열 */}
              <th style={{ width: '70px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>예방개선</th>
              <th style={{ width: '70px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>검출개선</th>
              <th style={{ width: '50px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>책임자</th>
              <th style={{ width: '50px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>목표일</th>
              <th style={{ width: '35px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>상태</th>
              <th style={{ width: '60px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>개선근거</th>
              <th style={{ width: '50px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>완료일</th>
              <th style={{ width: '25px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>S</th>
              <th style={{ width: '25px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>O</th>
              <th style={{ width: '25px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>D</th>
              <th style={{ width: '40px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>특별특성</th>
              <th style={{ width: '25px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>AP</th>
              <th style={{ width: '30px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>RPN</th>
              <th style={{ width: '50px', background: '#fff3e0', border: BORDER, padding: '2px', fontSize: '7px' }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, idx) => {
              const cellStyle = { border: BORDER, padding: '2px', fontSize: '8px', verticalAlign: 'middle' as const };
              const getScopeAbbr = (s: string) => s === 'Your Plant' ? 'YP' : s === 'Ship to Plant' ? 'SP' : s === 'User' ? 'U' : '';
              
              return (
                <tr key={`all-${idx}`} style={{ borderTop: row.showFm ? '2px solid #666' : undefined }}>
                  {/* ===== 구조분석 4열 ===== */}
                  {/* 1. 완제품 공정명: 전체 병합 */}
                  {idx === 0 && <td rowSpan={allRows.length} style={{ ...cellStyle, background: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>{state.l1?.name || ''}</td>}
                  {/* 2. 메인공정명: 공정별 병합 */}
                  {row.showProcess && row.processRowSpan > 0 && <td rowSpan={row.processRowSpan} style={{ ...cellStyle, background: '#e3f2fd' }}>{row.processName}</td>}
                  {/* 3. 4M: FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#e3f2fd', textAlign: 'center' }}>{row.fc?.m4 || ''}</td>}
                  {/* 4. 작업요소: FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#e3f2fd' }}>{row.fc?.workElem || ''}</td>}
                  
                  {/* ===== 기능분석 8열 (DB 연결 데이터 표시) ===== */}
                  {/* 1. 구분: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={{ ...cellStyle, background: '#e8f5e9', textAlign: 'center' }}>{row.fe?.funcData?.typeName || (row.fe ? getScopeAbbr(row.fe.scope) : '')}</td>}
                  {/* 2. 완제품기능: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.fe?.funcData ? { ...cellStyle, background: '#e8f5e9' } : { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' }}>{row.fe?.funcData?.funcName || '(미연결)'}</td>}
                  {/* 3. 요구사항: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.fe?.funcData ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' }}>{row.fe?.funcData?.reqName || '(미연결)'}</td>}
                  {/* 4. 공정기능: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2FuncData ? { ...cellStyle, background: '#e8f5e9' } : { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' }}>{row.l2FuncData?.funcName || '(미연결)'}</td>}
                  {/* 5. 제품특성: 기능분석 DB에서 조회 - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={row.l2FuncData ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' }}>{row.l2FuncData?.productCharName || '(미연결)'}</td>}
                  {/* 6. 4M: FC별 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#e8f5e9', textAlign: 'center' }}>{row.fc?.m4 || ''}</td>}
                  {/* 7. 작업요소기능: 기능분석 DB에서 조회 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={row.fc?.funcData ? { ...cellStyle, background: '#e8f5e9' } : (row.fc ? { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' } : { ...cellStyle, background: '#fafafa' })}>{row.fc?.funcData?.funcName || (row.fc ? '(미연결)' : '')}</td>}
                  {/* 8. 공정특성: 기능분석 DB에서 조회 - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={row.fc?.funcData ? { ...cellStyle, background: '#c8e6c9', fontWeight: 600 } : (row.fc ? { ...cellStyle, background: '#ffebee', color: '#c62828', fontStyle: 'italic' } : { ...cellStyle, background: '#fafafa' })}>{row.fc?.funcData?.processCharName || (row.fc ? '(미연결)' : '')}</td>}
                  
                  {/* ===== 고장분석 6열 ===== */}
                  {/* 1. 구분: FE scope - 마지막 행 병합 */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: '#fffde7', textAlign: 'center' }}>{row.fe ? getScopeAbbr(row.fe.scope) : ''}</td>}
                  {/* 2. 고장영향: FE text - 마지막 행 병합 */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: '#fffde7' }}>{row.fe?.text || ''}</td>}
                  {/* 3. 심각도: FE severity - 마지막 행 병합 */}
                  {row.showFe && <td rowSpan={row.feRowSpan} style={{ ...cellStyle, background: '#fffde7', textAlign: 'center', fontWeight: 700, color: (row.fe?.severity || 0) >= 8 ? '#c62828' : '#333' }}>{row.fe?.severity || ''}</td>}
                  {/* 4. 고장형태: FM text - FM 병합 */}
                  {row.showFm && <td rowSpan={row.fmRowSpan} style={{ ...cellStyle, background: '#fff8e1', textAlign: 'center', fontWeight: 700 }}>{row.fmText}</td>}
                  {/* 5. 작업요소: FC workElem - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#fffde7' }}>{row.fc?.workElem || ''}</td>}
                  {/* 6. 고장원인: FC text - 마지막 행 병합 */}
                  {row.showFc && <td rowSpan={row.fcRowSpan} style={{ ...cellStyle, background: '#fffde7' }}>{row.fc?.text || ''}</td>}
                  
                  {/* ===== 리스크분석 8열 ===== */}
                  <td style={{ ...cellStyle, background: '#fce4ec' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fce4ec' }}></td>
                  
                  {/* ===== 최적화 14열 ===== */}
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0', textAlign: 'center' }}></td>
                  <td style={{ ...cellStyle, background: '#fff3e0' }}></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    );
  }

  // 컬럼 수 계산
  const colCounts = { 2: 4, 3: 8, 4: 6, 5: 8, 6: 14 };
  const totalCols = visibleSteps.reduce((sum, step) => sum + (colCounts[step as keyof typeof colCounts] || 0), 0);
  
  // 전체보기는 고정 너비 (40열 * 약 80px = 3200px), 개별 탭은 100%
  const tableMinWidth = isAllView ? `${totalCols * 80}px` : '100%';

  return (
    <table style={{ 
      width: isAllView ? 'max-content' : '100%', 
      minWidth: tableMinWidth,
      borderCollapse: 'collapse', 
      tableLayout: isAllView ? 'auto' : 'fixed' 
    }}>
      <thead style={stickyTheadStyle}>
        {/* 1행: 단계 대분류 */}
        <tr>
          {visibleSteps.includes(2) && <th colSpan={4} style={{ background: COLORS.structure.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 구조 분석(2단계)</th>}
          {visibleSteps.includes(3) && <th colSpan={8} style={{ background: COLORS.function.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 기능 분석(3단계)</th>}
          {visibleSteps.includes(4) && <th colSpan={6} style={{ background: COLORS.failure.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 고장 분석(4단계)</th>}
          {visibleSteps.includes(5) && <th colSpan={8} style={{ background: COLORS.risk.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 리스크 분석(5단계)</th>}
          {visibleSteps.includes(6) && <th colSpan={14} style={{ background: COLORS.opt.main, color: '#fff', border: BORDER, padding: '4px', height: '24px', fontWeight: 900, fontSize: '10px', textAlign: 'center' }}>P-FMEA 최적화(6단계)</th>}
        </tr>
        {/* 2행: 서브그룹 */}
        <tr>
          {visibleSteps.includes(2) && <><th style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정명</th><th style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 메인 공정명</th><th colSpan={2} style={{ background: COLORS.structure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 작업 요소명</th></>}
          {visibleSteps.includes(3) && <><th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 완제품 공정기능/요구사항</th><th colSpan={2} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 메인공정기능 및 제품특성</th><th colSpan={3} style={{ background: COLORS.function.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 작업요소기능 및 공정특성</th></>}
          {visibleSteps.includes(4) && <><th colSpan={3} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>1. 고장영향(FE)</th><th style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>2. 고장형태(FM)</th><th colSpan={2} style={{ background: COLORS.failure.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>3. 고장원인(FC)</th></>}
          {visibleSteps.includes(5) && <><th colSpan={2} style={{ background: COLORS.risk.prevention.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>현재 예방관리</th><th colSpan={2} style={{ background: COLORS.risk.detection.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>현재 검출관리</th><th colSpan={4} style={{ background: COLORS.risk.evaluation.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>리스크 평가</th></>}
          {visibleSteps.includes(6) && <><th colSpan={4} style={{ background: COLORS.opt.plan.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>계획</th><th colSpan={3} style={{ background: COLORS.opt.monitor.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>결과 모니터링</th><th colSpan={7} style={{ background: COLORS.opt.effect.header, border: BORDER, padding: '2px', fontSize: '9px', textAlign: 'center' }}>효과 평가</th></>}
        </tr>
        {/* 3행: 컬럼명 */}
        <tr>
          {visibleSteps.includes(2) && <><th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완제품공정명</th><th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>NO+공정명</th><th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>4M</th><th style={{ background: COLORS.structure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th></>}
          {visibleSteps.includes(3) && <><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>구분</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완제품기능</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>요구사항</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>공정기능</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>제품특성</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소기능</th><th style={{ background: COLORS.function.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>공정특성</th></>}
          {visibleSteps.includes(4) && <><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>구분</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장영향(FE)</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>심각도</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장형태(FM)</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>작업요소</th><th style={{ background: COLORS.failure.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>고장원인(FC)</th></>}
          {visibleSteps.includes(5) && <><th style={{ background: COLORS.risk.prevention.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>예방관리(PC)</th><th style={{ background: COLORS.risk.prevention.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>발생도</th><th style={{ background: COLORS.risk.detection.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출관리(DC)</th><th style={{ background: COLORS.risk.detection.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출도</th><th onClick={onAPClick} style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center', cursor: 'pointer' }}>AP 📊</th><th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>RPN</th><th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>특별특성</th><th style={{ background: COLORS.risk.evaluation.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>습득교훈</th></>}
          {visibleSteps.includes(6) && <><th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>예방관리개선</th><th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출관리개선</th><th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>책임자성명</th><th style={{ background: COLORS.opt.plan.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>목표완료일자</th><th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>상태</th><th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>개선결과근거</th><th style={{ background: COLORS.opt.monitor.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>완료일자</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>심각도</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>발생도</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>검출도</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>특별특성</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>AP</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>RPN</th><th style={{ background: COLORS.opt.effect.cell, border: BORDER, padding: '2px', fontSize: '8px', textAlign: 'center' }}>비고</th></>}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={totalCols} style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}>데이터가 없습니다.</td></tr>
        ) : rows.map((row, idx) => {
          const cellStyle = { border: BORDER, padding: '2px 3px', fontSize: '8px', background: '#fff' };
          return (
            <tr key={`eval-${row.l1Id}-${row.l2Id}-${row.l3Id}-${idx}`} style={{ height: '22px' }}>
              {visibleSteps.includes(2) && <>{l1Spans[idx] > 0 && <td rowSpan={l1Spans[idx]} style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l1Name}</td>}{l2Spans[idx] > 0 && <td rowSpan={l2Spans[idx]} style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l2No} {row.l2Name}</td>}<td style={{ ...cellStyle, background: COLORS.structure.cell, textAlign: 'center' }}>{row.m4}</td><td style={{ ...cellStyle, background: COLORS.structure.cell }}>{row.l3Name}</td></>}
              {visibleSteps.includes(3) && <>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l1Type || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l1Function || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l1Requirement || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l2Functions?.map((f: any) => f.name).join(', ') || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l2ProductChars?.map((c: any) => c.name).join(', ') || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.m4 || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l3Functions?.map((f: any) => f.name).join(', ') || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.function.cell }}>{row.l3ProcessChars?.map((c: any) => c.name).join(', ') || ''}</td>
              </>}
              {visibleSteps.includes(4) && <>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.l1Type || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.l1FailureEffect || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell, textAlign: 'center' }}>{row.l1Severity || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.l2FailureMode || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.m4 || ''}</td>
                <td style={{ ...cellStyle, background: COLORS.failure.cell }}>{row.l3FailureCause || ''}</td>
              </>}
              {visibleSteps.includes(5) && <><td style={{ ...cellStyle, background: COLORS.risk.prevention.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.prevention.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.detection.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.detection.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td><td style={{ ...cellStyle, background: COLORS.risk.evaluation.cell }}></td></>}
              {visibleSteps.includes(6) && <><td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.plan.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.monitor.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td><td style={{ ...cellStyle, background: COLORS.opt.effect.cell }}></td></>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// 전체보기 탭 - 38열 FMEA 워크시트 (Excel과 동일, 셀합치기 적용)
function AllViewTabFull({ rows, state, l1Spans, l1TypeSpans, l1FuncSpans, l2Spans }: { 
  rows: FlatRow[]; 
  state: WorksheetState; 
  l1Spans: number[]; 
  l1TypeSpans: number[];
  l1FuncSpans: number[];
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
    // 리스크분석 5단계 (8열) - RPN 추가
    { id: 'prevention', label: '예방관리(PC)', width: '80px', step: 5 },
    { id: 'occurrence', label: '발생도', width: '35px', step: 5 },
    { id: 'detection', label: '검출관리(DC)', width: '80px', step: 5 },
    { id: 'detectability', label: '검출도', width: '35px', step: 5 },
    { id: 'ap', label: 'AP', width: '30px', step: 5 },
    { id: 'rpn', label: 'RPN', width: '35px', step: 5 },
    { id: 'specialChar', label: '특별특성', width: '50px', step: 5 },
    { id: 'lessonLearned', label: '습득교훈', width: '80px', step: 5 },
    // 최적화 6단계 (14열) - RPN 추가
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
    { id: 'newRPN', label: 'RPN', width: '35px', step: 6 },
    { id: 'remarks', label: '비고', width: '80px', step: 6 },
  ];

  // 표시할 단계 목록
  const visibleSteps = state.visibleSteps || [2, 3, 4, 5, 6];

  // 필터링된 컬럼
  const filteredColumns = allViewColumns.filter(col => visibleSteps.includes(col.step));

  // 단계별 그룹 정의 (필터링)
  const stepGroups = [
    { step: 2, name: 'P-FMEA 구조분석(2단계)', count: 4, bg: '#1565c0' },
    { step: 3, name: 'P-FMEA 기능분석(3단계)', count: 8, bg: '#1b5e20' },
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
      3: '#1b5e20', // 기능 - 진한녹색
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
      case 'l1Type': return row.l1Type || '';
      case 'l1Function': return row.l1Function || '';
      case 'l1Requirement': return row.l1Requirement || '';
      case 'l2Function': return row.l2Functions.map(f => f.name).join(', ') || '';
      case 'l2ProductChar': return row.l2ProductChars.map(c => c.name).join(', ') || '';
      case 'l3Function': return row.l3Functions.map(f => f.name).join(', ') || '';
      case 'l3ProcessChar': return row.l3ProcessChars.map(c => c.name).join(', ') || '';
      case 'failureEffect': return row.l1FailureEffect || '';
      case 'severity': return row.l1Severity || '';
      case 'failureMode': return row.l2FailureMode || '';
      case 'failureCause': return row.l3FailureCause || '';
      default: return '';
    }
  };

          return (
            <>
              {/* Colgroup - 컬럼 너비 정의 */}
              <colgroup>{filteredColumns.map((col, i) => (<col key={i} style={{ width: col.width }} />))}</colgroup>

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
            const l1TypeSpan = l1TypeSpans[idx];
            const l1FuncSpan = l1FuncSpans[idx];
            const l2Span = l2Spans[idx];
            
            // 병합 기준별 컬럼 분리
            const isL1Base = (id: string) => ['l1Name', 'feType'].includes(id);
            const isL1TypeBase = (id: string) => ['l1Type'].includes(id);
            const isL1FuncBase = (id: string) => ['l1Function'].includes(id);
            const isL2Base = (id: string) => ['l2Name', 'l2Function', 'l2ProductChar', 'failureMode'].includes(id);
            
            return (
              <tr key={`allview-${idx}-${row.l3Id}`} style={{ height: '26px' }}>
                {filteredColumns.map((col, i) => {
                  // 1. L1 완제품명 기준 병합
                  if (isL1Base(col.id)) {
                    if (l1Span === 0) return null;
                    return (
                      <td key={i} rowSpan={l1Span > 0 ? l1Span : undefined} style={{ border: '1px solid #ddd', padding: '2px 3px', fontSize: '9px', background: '#f3e5f5', textAlign: 'center', verticalAlign: 'middle', fontWeight: 700 }}>
                        {getCellValue(row, col.id)}
                      </td>
                    );
                  }
                  
                  // 2. L1 구분 기준 병합
                  if (isL1TypeBase(col.id)) {
                    if (l1TypeSpan === 0) return null;
                    return (
                      <td key={i} rowSpan={l1TypeSpan > 0 ? l1TypeSpan : undefined} style={{ border: '1px solid #ddd', padding: '2px 3px', fontSize: '9px', background: '#f3e5f5', textAlign: 'center', verticalAlign: 'middle' }}>
                        {getCellValue(row, col.id)}
                      </td>
                    );
                  }

                  // 3. L1 기능 기준 병합
                  if (isL1FuncBase(col.id)) {
                    if (l1FuncSpan === 0) return null;
                    return (
                      <td key={i} rowSpan={l1FuncSpan > 0 ? l1FuncSpan : undefined} style={{ border: '1px solid #ddd', padding: '2px 3px', fontSize: '9px', background: '#f3e5f5', textAlign: 'center', verticalAlign: 'middle' }}>
                        {getCellValue(row, col.id)}
                      </td>
                    );
                  }
                  
                  // 4. L2 공정 기준 병합
                  if (isL2Base(col.id)) {
                    if (l2Span === 0) return null;
                    return (
                      <td key={i} rowSpan={l2Span > 0 ? l2Span : undefined} style={{ border: '1px solid #ddd', padding: '2px 3px', fontSize: '9px', background: '#ede7f6', textAlign: 'center', verticalAlign: 'middle' }}>
                        {getCellValue(row, col.id)}
                      </td>
                    );
                  }
                  
                  // 5. 그 외 (L1 요구사항, L3 작업요소 등) - 병합 안함
                  return (
                    <td
                      key={i}
                      style={{
                        border: '1px solid #ddd',
                        padding: '2px 3px',
                        fontSize: '9px',
                        background: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                        whiteSpace: col.id === 'l3Name' ? 'nowrap' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        verticalAlign: 'middle',
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

