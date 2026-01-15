/**
 * @file page.tsx
 * @description Control Plan 워크시트 메인 페이지 (모듈화 완료)
 * @line-count ~250줄 (500줄 미만)
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CPTopNav from '@/components/layout/CPTopNav';
import CPTopMenuBar from './components/CPTopMenuBar';
import CPTabMenu, { CPInputMode } from './components/CPTabMenu';
import { CPContextMenu } from './components/CPContextMenu';
import { AutoInputModal } from './components/AutoInputModal';
import ProcessFlowInputModal from './components/ProcessFlowInputModal';
import ProcessDescInputModal from './components/ProcessDescInputModal';
import EquipmentInputModal from './components/EquipmentInputModal';
import StandardInputModal from './components/StandardInputModal';
import { renderCell } from './renderers';
import { useProcessRowSpan, useDescRowSpan, useWorkRowSpan, useCharRowSpan, useContextMenu, useWorksheetHandlers } from './hooks';
import { createSampleItems, createEmptyItem } from './utils';
import { CPState, SaveStatus, AutoModalState, ContextMenuType } from './types';
import { 
  CP_COLUMNS, HEIGHTS,
  calculateGroupSpans, calculateTotalWidth,
} from './cpConstants';

// ============ 메인 컴포넌트 ============
function CPWorksheetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const cpNoParam = searchParams.get('cpNo') || '';
  const fmeaIdParam = searchParams.get('fmeaId') || '';
  const syncMode = searchParams.get('sync') === 'true';
  
  // 상태 관리
  const [state, setState] = useState<CPState>({
    cpNo: cpNoParam,
    fmeaId: fmeaIdParam,
    fmeaNo: '',
    partName: '',
    customer: '',
    items: [],
    dirty: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeTab, setActiveTab] = useState('all');
  const [inputMode, setInputMode] = useState<CPInputMode>('manual');
  
  // CP 목록 상태 (드롭다운용)
  const [cpList, setCpList] = useState<Array<{ id: string; cpNo: string; subject?: string }>>([]);
  
  // 자동 모드용 입력 모달 상태
  const [autoModal, setAutoModal] = useState<AutoModalState>({
    visible: false,
    rowIdx: -1,
    type: 'process',
    position: 'below',
  });
  
  // 공정명 입력 모달 상태
  const [processModal, setProcessModal] = useState({
    visible: false,
    rowIdx: -1,
  });
  
  // 공정설명 입력 모달 상태
  const [processDescModal, setProcessDescModal] = useState({
    visible: false,
    rowIdx: -1,
    processNo: '',
    processName: '',
  });
  
  // 설비/금형/JIG 입력 모달 상태
  const [equipmentModal, setEquipmentModal] = useState({
    visible: false,
    rowIdx: -1,
    processNo: '',
    processName: '',
  });

  // 범용 입력 모달 상태 (제품특성, 공정특성, 스펙/공차, 평가방법, 샘플, 관리방법, 대응계획)
  const [standardModal, setStandardModal] = useState({
    visible: false,
    rowIdx: -1,
    columnKey: '',
    columnName: '',
    processNo: '',
    processName: '',
  });
  
  // 계산된 값
  const groupSpans = useMemo(() => calculateGroupSpans(CP_COLUMNS), []);
  const totalWidth = useMemo(() => calculateTotalWidth(), []);
  
  // rowSpan 계산 훅 (각 병합은 독립적으로 계산됨)
  const processRowSpan = useProcessRowSpan(state.items);
  const descRowSpan = useDescRowSpan(state.items);
  const workRowSpan = useWorkRowSpan(state.items);
  const charRowSpan = useCharRowSpan(state.items);
  
  // 컨텍스트 메뉴 훅
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  
  // 워크시트 핸들러 훅
  const {
    handleCellChange,
    handleAddRow,
    handleInsertRowAbove,
    handleInsertRowBelow,
    handleDeleteRow,
    handleSave,
  } = useWorksheetHandlers({ state, setState, setSaveStatus, closeContextMenu });
  
  // FMEA에서 데이터 동기화
  const syncFromFmea = useCallback(async (fmeaId: string) => {
    try {
      const res = await fetch(`/api/pfmea/${fmeaId}`);
      if (!res.ok) return;
      
      const data = await res.json();
      if (!data.success || !data.data) return;
      
      const fmea = data.data;
      const newItems: any[] = [];
      
      // L2 (공정) 데이터 매핑
      (fmea.l2 || []).forEach((proc: any) => {
        (proc.productChars || []).forEach((pc: any) => {
          newItems.push({
            id: `cpi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            cpId: cpNoParam,
            processNo: proc.no,
            processName: proc.name,
            processLevel: 'Main',
            processDesc: proc.function || '',
            workElement: '',
            detectorNo: false,
            detectorEp: false,
            detectorAuto: false,
            productChar: pc.name || '',
            processChar: '',
            specialChar: pc.specialChar || '',
            specTolerance: '',
            evalMethod: '',
            sampleSize: '',
            sampleFreq: '',
            controlMethod: '',
            owner1: '',
            owner2: '',
            reactionPlan: '',
            sortOrder: newItems.length,
            refSeverity: pc.severity || null,
            linkStatus: 'linked',
          });
        });
        
        if (!proc.productChars?.length) {
          newItems.push({
            id: `cpi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            cpId: cpNoParam,
            processNo: proc.no,
            processName: proc.name,
            processLevel: 'Main',
            processDesc: proc.function || '',
            workElement: '',
            detectorNo: false,
            detectorEp: false,
            detectorAuto: false,
            productChar: '',
            processChar: '',
            specialChar: '',
            specTolerance: '',
            evalMethod: '',
            sampleSize: '',
            sampleFreq: '',
            controlMethod: '',
            owner1: '',
            owner2: '',
            reactionPlan: '',
            sortOrder: newItems.length,
            linkStatus: 'linked',
          });
        }
      });
      
      if (newItems.length > 0) {
        setState(prev => ({
          ...prev,
          fmeaNo: fmea.fmeaNo || fmeaId,
          partName: fmea.partName || fmea.project?.productName || '',
          customer: fmea.customer || fmea.project?.customer || '',
          items: newItems,
          dirty: true,
        }));
      }
    } catch (error) {
      console.error('FMEA 동기화 실패:', error);
    }
  }, [cpNoParam]);
  
  // CP 목록 로드 (드롭다운용)
  useEffect(() => {
    const loadCpList = async () => {
      try {
        const res = await fetch('/api/control-plan');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const cps = data.data.map((cp: any) => ({
              id: cp.cpNo,
              cpNo: cp.cpNo,
              subject: cp.subject || '',
            }));
            setCpList(cps);
            console.log('✅ CP 목록 로드:', cps.length, '개');
          }
        }
      } catch (error) {
        console.error('CP 목록 로드 실패:', error);
      }
    };
    
    loadCpList();
  }, []);
  
  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        if (cpNoParam) {
          console.log(`🔄 [CP 워크시트] ${cpNoParam} 데이터 로드 시작...`);
          const cpRes = await fetch(`/api/control-plan/${cpNoParam}/items`);
          if (cpRes.ok) {
            const cpData = await cpRes.json();
            if (cpData.success && cpData.data && cpData.data.length > 0) {
              setState(prev => ({
                ...prev,
                cpNo: cpNoParam,
                items: cpData.data,
                dirty: false,
              }));
              console.log(`✅ [CP 워크시트] 로드 완료: ${cpData.data.length}건`);
              setLoading(false);
              return;
            }
          }
        }
        
        if (syncMode && fmeaIdParam) {
          await syncFromFmea(fmeaIdParam);
        } else {
          // 빈 데이터인 경우 샘플 데이터 생성
          setState(prev => ({
            ...prev,
            items: createSampleItems(cpNoParam || 'CP26-M001'),
            dirty: false,
          }));
        }
      } catch (error) {
        console.error('❌ [CP 워크시트] 데이터 로드 실패:', error);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [cpNoParam, fmeaIdParam, syncMode, syncFromFmea]);

  // ★ 자동 저장 (Dirty 상태일 때 3초 후 저장)
  useEffect(() => {
    if (state.dirty && saveStatus !== 'saving') {
      const timer = setTimeout(() => {
        console.log('🚀 [CP 워크시트] 변경 감지: 자동 저장 실행');
        handleSave();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.dirty, handleSave, saveStatus]);
  
  // 자동 모드: 셀 클릭 시 모달 열기
  const handleAutoModeClick = useCallback((rowIdx: number, type: ContextMenuType, colKey?: string) => {
    console.log('🔥 handleAutoModeClick 호출됨:', { rowIdx, type, colKey, inputMode });
    
    // 공정명 셀 클릭 시 ProcessFlowInputModal 열기
    if (type === 'process' && colKey === 'processName') {
      setProcessModal({ visible: true, rowIdx });
    } 
    // 공정설명 셀 클릭 시 ProcessDescInputModal 열기
    else if (type === 'process' && colKey === 'processDesc') {
      const item = state.items[rowIdx];
      if (item && item.processNo && item.processName) {
        setProcessDescModal({ 
          visible: true, 
          rowIdx,
          processNo: item.processNo,
          processName: item.processName,
        });
      }
    } 
    // 설비/금형/JIG 셀 클릭 시 EquipmentInputModal 열기
    else if (type === 'work') {
      const item = state.items[rowIdx];
      if (item && item.processNo && item.processName) {
        setEquipmentModal({ 
          visible: true, 
          rowIdx,
          processNo: item.processNo,
          processName: item.processName,
        });
      }
    }
    // 제품특성, 공정특성, 스펙/공차, 평가방법, 샘플, 관리방법, 대응계획 등 텍스트 컬럼
    else if (type === 'char' || type === 'general') {
      const item = state.items[rowIdx];
      // 드롭다운/체크박스 컬럼은 제외
      const skipColumns = ['processLevel', 'specialChar', 'sampleFreq', 'owner1', 'owner2', 'detectorEp', 'detectorAuto', 'charNo', 'rowNo'];
      if (colKey && !skipColumns.includes(colKey)) {
        // 컬럼명 찾기
        const colDef = CP_COLUMNS.find(c => c.key === colKey);
        const columnName = colDef?.name || colKey;
        
        setStandardModal({
          visible: true,
          rowIdx,
          columnKey: colKey,
          columnName,
          processNo: item?.processNo || '',
          processName: item?.processName || '',
        });
      } else {
        // 드롭다운/체크박스는 기존 AutoInputModal 사용
        setAutoModal({ visible: true, rowIdx, type, position: 'below' });
      }
    }
    else {
      setAutoModal({ visible: true, rowIdx, type, position: 'below' });
    }
  }, [state.items]);

  // 설비 모달: 저장 핸들러
  const handleEquipmentSave = useCallback((selectedEquip: any) => {
    const targetRowIdx = equipmentModal.rowIdx;
    if (targetRowIdx < 0 || targetRowIdx >= state.items.length) return;
    
    const itemId = state.items[targetRowIdx].id;
    handleCellChange(itemId, 'workElement', selectedEquip.name);
    setEquipmentModal(prev => ({ ...prev, visible: false }));
  }, [equipmentModal.rowIdx, state.items, handleCellChange]);

  // 범용 입력 모달: 저장 핸들러
  const handleStandardModalSave = useCallback((value: string) => {
    const targetRowIdx = standardModal.rowIdx;
    const colKey = standardModal.columnKey;
    if (targetRowIdx < 0 || targetRowIdx >= state.items.length || !colKey) return;
    
    const itemId = state.items[targetRowIdx].id;
    handleCellChange(itemId, colKey, value);
    setStandardModal(prev => ({ ...prev, visible: false }));
  }, [standardModal.rowIdx, standardModal.columnKey, state.items, handleCellChange]);
  
  // 공정명 모달: 저장 핸들러
  const handleProcessSave = useCallback((selectedProcesses: any[]) => {
    if (selectedProcesses.length === 0) return;
    
    const targetRowIdx = processModal.rowIdx;
    
    setState(prev => {
      const newItems = [...prev.items];
      
      // 선택된 모든 공정에 대해 행 생성
      selectedProcesses.forEach((process, idx) => {
        if (idx === 0 && targetRowIdx >= 0 && targetRowIdx < newItems.length) {
          // 첫 번째 공정: 현재 행 업데이트
          newItems[targetRowIdx] = {
            ...newItems[targetRowIdx],
            processNo: process.no,
            processName: process.name,
          };
        } else {
          // 나머지 공정: 새 행 추가
          const newItem = createEmptyItem(
            prev.cpNo,
            process.no,
            process.name
          );
          newItem.sortOrder = newItems.length;
          
          // 첫 번째 공정이 현재 행에 업데이트된 경우 그 아래에 추가
          // 그렇지 않으면 맨 아래에 추가
          if (idx === 1 && targetRowIdx >= 0 && targetRowIdx < newItems.length) {
            newItems.splice(targetRowIdx + 1, 0, newItem);
          } else {
            newItems.push(newItem);
          }
        }
      });
      
      // sortOrder 재정렬
      newItems.forEach((item, idx) => item.sortOrder = idx);
      
      return {
        ...prev,
        items: newItems,
        dirty: true,
      };
    });
    
    setProcessModal({ visible: false, rowIdx: -1 });
  }, [processModal.rowIdx, state.cpNo]);
  
  // 공정설명 모달: 저장 핸들러
  const handleProcessDescSave = useCallback((selectedDesc: any) => {
    const targetRowIdx = processDescModal.rowIdx;
    
    if (targetRowIdx >= 0 && targetRowIdx < state.items.length) {
      setState(prev => ({
        ...prev,
        items: prev.items.map((item, idx) => {
          if (idx === targetRowIdx) {
            return {
              ...item,
              processDesc: selectedDesc.name,
            };
          }
          return item;
        }),
        dirty: true,
      }));
    }
    
    setProcessDescModal({ visible: false, rowIdx: -1, processNo: '', processName: '' });
  }, [processDescModal.rowIdx, state.items]);
  
  // 공정설명 모달: 연속 입력 핸들러
  const handleProcessDescContinuousAdd = useCallback((desc: any, addNewRow: boolean) => {
    const targetRowIdx = processDescModal.rowIdx;
    
    if (targetRowIdx >= 0 && targetRowIdx < state.items.length) {
      // 현재 행 업데이트
      setState(prev => ({
        ...prev,
        items: prev.items.map((item, idx) => {
          if (idx === targetRowIdx) {
            return {
              ...item,
              processDesc: desc.name,
            };
          }
          return item;
        }),
        dirty: true,
      }));
      
      // 새 행 추가
      if (addNewRow) {
        const newItem = {
          ...state.items[targetRowIdx],
          id: `item_${Date.now()}`,
          processDesc: '',
          sortOrder: state.items.length,
        };
        setState(prev => ({
          ...prev,
          items: [...prev.items, newItem],
          dirty: true,
        }));
        
        // 다음 행으로 포커스 이동
        setProcessDescModal({ 
          visible: true, 
          rowIdx: targetRowIdx + 1,
          processNo: processDescModal.processNo,
          processName: processDescModal.processName,
        });
      }
    }
  }, [processDescModal, state.items]);
  
  // 공정명 모달: 연속 입력 핸들러
  const handleProcessContinuousAdd = useCallback((process: any, addNewRow: boolean) => {
    const targetRowIdx = processModal.rowIdx;
    
    if (targetRowIdx >= 0 && targetRowIdx < state.items.length) {
      // 현재 행 업데이트
      setState(prev => ({
        ...prev,
        items: prev.items.map((item, idx) => {
          if (idx === targetRowIdx) {
            return {
              ...item,
              processNo: process.no,
              processName: process.name,
            };
          }
          return item;
        }),
        dirty: true,
      }));
      
      // 새 행 추가
      if (addNewRow) {
        const newItem = {
          ...state.items[targetRowIdx],
          id: `item_${Date.now()}`,
          processNo: '',
          processName: '',
          sortOrder: state.items.length,
        };
        setState(prev => ({
          ...prev,
          items: [...prev.items, newItem],
          dirty: true,
        }));
        
        // 다음 행으로 포커스 이동
        setProcessModal({ visible: true, rowIdx: targetRowIdx + 1 });
      }
    }
  }, [processModal.rowIdx, state.items]);

  // 수동 모드: 엔터 키로 행 추가
  const handleEnterKey = useCallback((rowIdx: number, type: ContextMenuType, colKey?: string) => {
    if (inputMode === 'manual') {
      handleInsertRowBelow(rowIdx, type, colKey);
    }
  }, [inputMode, handleInsertRowBelow]);
  
  // 자동 모드: 모달에서 행 추가
  const handleAutoModalInsert = useCallback(() => {
    const { rowIdx, type, position } = autoModal;
    if (position === 'above') {
      handleInsertRowAbove(rowIdx, type);
    } else {
      handleInsertRowBelow(rowIdx, type);
    }
    setAutoModal(prev => ({ ...prev, visible: false }));
  }, [autoModal, handleInsertRowAbove, handleInsertRowBelow]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }
  
  
  return (
    <>
      <CPTopNav selectedCpId={state.cpNo} />
      
      <CPTopMenuBar
        cpList={cpList}
        selectedCpId={state.cpNo}
        fmeaId={state.fmeaId}
        dirty={state.dirty}
        isSaving={saveStatus === 'saving'}
        itemCount={state.items.length}
        onCpChange={(id) => {
          if (id === '__NEW__') {
            setState(prev => ({ ...prev, cpNo: '', items: [], dirty: false }));
            router.push('/control-plan/worksheet');
          } else {
            // CP 선택 시 해당 CP로 이동
            setState(prev => ({ ...prev, cpNo: id, dirty: false }));
            router.push(`/control-plan/worksheet?cpNo=${id}`);
          }
        }}
        onSave={handleSave}
        onSync={() => state.fmeaId && syncFromFmea(state.fmeaId)}
        onExport={() => {}}
        onImportClick={() => router.push(`/control-plan/import?id=${state.cpNo}`)}
        onAddRow={handleAddRow}
      />
      
      <CPTabMenu
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        cpNo={state.cpNo}
        fmeaId={state.fmeaId}
        itemCount={state.items.length}
        dirty={state.dirty}
      />
      
      {/* ========== 메인 레이아웃 (메뉴 아래) ========== */}
      <div className="fixed top-[100px] left-[53px] right-0 bottom-0 flex flex-row overflow-hidden">
        
        {/* ===== 좌측: 워크시트 영역 ===== */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <div 
            id="cp-worksheet-scroll-container" 
            className="bg-white border-t border-gray-300 flex-1"
            style={{
              flex: 1,
              overflowX: 'scroll',
              overflowY: 'auto',
              background: '#fff',
              position: 'relative',
            }}
          >
            <table className="border-separate" style={{ borderSpacing: 0, width: 'max-content', minWidth: '100%', tableLayout: 'fixed' }}>
            <thead style={{ background: '#ffffff' }}>
              {/* 1행: 그룹 헤더 */}
              <tr>
                {/* 단계 열 헤더 */}
                <th
                  colSpan={1}
                  className="font-bold text-[11px] text-center sticky top-0 z-30 border border-white"
                  style={{ 
                    background: '#90caf9', // 연한 파란색
                    color: '#000000', // 검은색 글씨
                    height: HEIGHTS.header1,
                    width: 40,
                    minWidth: 40,
                    padding: 0,
                    margin: 0,
                  }}
                >
                  단계
                </th>
                {/* 나머지 그룹 헤더 */}
                {groupSpans.map((g, idx) => (
                  <th
                    key={idx}
                    colSpan={g.span}
                    className="text-white font-bold text-[11px] text-center sticky top-0 z-30 border border-white"
                    style={{ 
                      background: g.color, 
                      height: HEIGHTS.header1,
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {g.group}
                  </th>
                ))}
              </tr>
              
              {/* 2행: 컬럼명 헤더 */}
              <tr>
                {CP_COLUMNS.map(col => (
                  <th
                    key={col.id}
                    className="font-semibold text-[10px] text-center border border-gray-300 whitespace-nowrap sticky z-29"
                    style={{ 
                      width: col.width,
                      minWidth: col.width, 
                      background: col.headerColor, 
                      height: HEIGHTS.header2,
                      top: `${HEIGHTS.header1}px`,
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {col.name}
                    {col.pfmeaSync && <span className="ml-0.5 text-blue-600">*</span>}
                  </th>
                ))}
              </tr>
              
              {/* 3행: 열번호 (단계, A, B, C...) */}
              <tr>
                {CP_COLUMNS.map((col, idx) => {
                  // 단계 열은 숫자로 표시, 나머지는 알파벳 (단계 열 때문에 idx로 조정)
                  const colLetter = idx === 0 ? '' : String.fromCharCode(64 + idx); // A=65이므로 64+idx로 조정
                  // D열(processDesc), E열(workElement), I열(productChar)에 + 접두사 추가
                  const hasContextMenu = col.key === 'processDesc' || col.key === 'workElement' || col.key === 'productChar';
                  // 드롭다운이 있는 열: C열(processLevel), K열(specialChar), O열(sampleFreq), Q열(owner1), R열(owner2)
                  const hasDropdown = col.type === 'select' && (col.key === 'processLevel' || col.key === 'specialChar' || col.key === 'sampleFreq' || col.key === 'owner1' || col.key === 'owner2');
                  
                  // 그룹 배경색 결정: 단계(연한파란색), AB(녹색), CD(녹색), FGHI(녹색)
                  let groupBgColor = 'bg-gray-200'; // 기본 배경색
                  if (idx === 0) {
                    // 단계 열 (연한 파란색)
                    groupBgColor = 'bg-blue-300';
                  } else if (idx === 1 || idx === 2) {
                    // AB 그룹 (A열, B열) - 녹색
                    groupBgColor = 'bg-green-200';
                  } else if (idx === 3 || idx === 4) {
                    // CD 그룹 (C열, D열) - 녹색
                    groupBgColor = 'bg-green-200';
                  } else if (idx >= 6 && idx <= 9) {
                    // FGHI 그룹 (F열, G열, H열, I열) - 녹색
                    groupBgColor = 'bg-green-200';
                  }
                  
                  return (
                    <th
                      key={`col-${col.id}`}
                      className={`${groupBgColor} text-gray-600 font-semibold text-[9px] text-center border border-gray-300`}
                      style={{ 
                        height: HEIGHTS.header3,
                        width: col.width,
                        minWidth: col.width,
                        borderBottom: '2px solid #000000', // 3행 하단 2px 검은색 구분선
                        color: idx === 0 ? '#ffffff' : undefined, // 단계 열은 흰색 텍스트
                      }}
                    >
                      {idx === 0 ? (
                        'NO'
                      ) : hasContextMenu ? (
                        <span>
                          <span className="text-red-600 font-bold text-[12px]">+</span>
                          <span>{colLetter}</span>
                        </span>
                      ) : hasDropdown ? (
                        <span>
                          <span>{colLetter}</span>
                          <span className="text-gray-500 text-[8px] ml-0.5">▼</span>
                        </span>
                      ) : (
                        colLetter
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody>
              {state.items.map((item, rowIdx) => (
                <tr key={item.id}>
                  {CP_COLUMNS.map(col => renderCell({
                    item,
                    col,
                    rowIdx,
                    items: state.items,
                    processRowSpan,
                    descRowSpan,
                    workRowSpan,
                    charRowSpan,
                    inputMode,
                    onCellChange: handleCellChange,
                    onContextMenu: openContextMenu,
                    onAutoModeClick: handleAutoModeClick,
                    onEnterKey: handleEnterKey,
                  }))}
                </tr>
              ))}
              
              {state.items.length === 0 && (
                <tr>
                  <td colSpan={CP_COLUMNS.length} className="text-center text-gray-400 py-10">
                    데이터가 없습니다. "행 추가" 또는 "FMEA 동기화"를 클릭하세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      
      {/* 컨텍스트 메뉴 */}
      <CPContextMenu
        contextMenu={contextMenu}
        onClose={closeContextMenu}
        onInsertAbove={handleInsertRowAbove}
        onInsertBelow={handleInsertRowBelow}
        onDelete={handleDeleteRow}
        onCancel={closeContextMenu}
      />
      
      {/* 자동 입력 모달 */}
      <AutoInputModal
        modal={autoModal}
        onClose={() => setAutoModal(prev => ({ ...prev, visible: false }))}
        onPositionChange={(pos) => setAutoModal(prev => ({ ...prev, position: pos }))}
        onInsert={handleAutoModalInsert}
      />
      
      {/* 공정명 입력 모달 */}
      <ProcessFlowInputModal
        isOpen={processModal.visible}
        onClose={() => setProcessModal({ visible: false, rowIdx: -1 })}
        onSave={handleProcessSave}
        onContinuousAdd={handleProcessContinuousAdd}
        existingProcessNames={state.items
          .filter(item => item.processName && !item.processName.startsWith('_'))
          .map(item => item.processName)}
      />
      
      {/* 공정설명 입력 모달 */}
      <ProcessDescInputModal
        isOpen={processDescModal.visible}
        onClose={() => setProcessDescModal({ visible: false, rowIdx: -1, processNo: '', processName: '' })}
        onSave={handleProcessDescSave}
        onContinuousAdd={handleProcessDescContinuousAdd}
        processNo={processDescModal.processNo}
        processName={processDescModal.processName}
        existingDesc={processDescModal.rowIdx >= 0 && processDescModal.rowIdx < state.items.length 
          ? state.items[processDescModal.rowIdx].processDesc 
          : ''}
        currentRowIdx={processDescModal.rowIdx}
      />

      {/* 설비/금형/JIG 입력 모달 */}
      <EquipmentInputModal
        isOpen={equipmentModal.visible}
        onClose={() => setEquipmentModal({ visible: false, rowIdx: -1, processNo: '', processName: '' })}
        onSave={handleEquipmentSave}
        processNo={equipmentModal.processNo}
        processName={equipmentModal.processName}
        existingEquip={equipmentModal.rowIdx >= 0 && equipmentModal.rowIdx < state.items.length 
          ? state.items[equipmentModal.rowIdx].workElement 
          : ''}
      />

      {/* 범용 입력 모달 (제품특성, 공정특성, 스펙/공차, 평가방법, 샘플, 관리방법, 대응계획) */}
      <StandardInputModal
        isOpen={standardModal.visible}
        onClose={() => setStandardModal({ visible: false, rowIdx: -1, columnKey: '', columnName: '', processNo: '', processName: '' })}
        onSave={handleStandardModalSave}
        columnKey={standardModal.columnKey}
        columnName={standardModal.columnName}
        processNo={standardModal.processNo}
        processName={standardModal.processName}
        existingValue={standardModal.rowIdx >= 0 && standardModal.rowIdx < state.items.length 
          ? (state.items[standardModal.rowIdx] as any)[standardModal.columnKey] || ''
          : ''}
      />
    </>
  );
}

// Suspense wrapper
export default function ControlPlanWorksheetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">로딩 중...</div>}>
      <CPWorksheetContent />
    </Suspense>
  );
}
