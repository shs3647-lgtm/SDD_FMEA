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
import { renderCell } from './renderers';
import { useProcessRowSpan, useDescRowSpan, useWorkRowSpan, useContextMenu, useWorksheetHandlers } from './hooks';
import { createSampleItems } from './utils';
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
  
  // 자동 모드용 입력 모달 상태
  const [autoModal, setAutoModal] = useState<AutoModalState>({
    visible: false,
    rowIdx: -1,
    type: 'process',
    position: 'below',
  });
  
  // 계산된 값
  const groupSpans = useMemo(() => calculateGroupSpans(CP_COLUMNS), []);
  const totalWidth = useMemo(() => calculateTotalWidth(), []);
  
  // rowSpan 계산 훅
  const processRowSpan = useProcessRowSpan(state.items);
  const descRowSpan = useDescRowSpan(state.items);
  const workRowSpan = useWorkRowSpan(state.items);
  
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
  
  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        if (cpNoParam) {
          const cpRes = await fetch(`/api/control-plan/${cpNoParam}`);
          if (cpRes.ok) {
            const cpData = await cpRes.json();
            if (cpData.success && cpData.data) {
              setState(prev => ({
                ...prev,
                cpNo: cpData.data.cpNo,
                fmeaId: cpData.data.fmeaId || fmeaIdParam,
                fmeaNo: cpData.data.fmeaNo || '',
                partName: cpData.data.partName || '',
                customer: cpData.data.customer || '',
                items: cpData.data.items || [],
              }));
            }
          }
        }
        
        if (syncMode && fmeaIdParam) {
          await syncFromFmea(fmeaIdParam);
        }
        
        // 빈 데이터인 경우 샘플 데이터 생성
        setState(prev => {
          if (prev.items.length === 0) {
            return { ...prev, items: createSampleItems(cpNoParam) };
          }
          return prev;
        });
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [cpNoParam, fmeaIdParam, syncMode, syncFromFmea]);
  
  // 자동 모드: 셀 클릭 시 모달 열기
  const handleAutoModeClick = useCallback((rowIdx: number, type: ContextMenuType) => {
    setAutoModal({ visible: true, rowIdx, type, position: 'below' });
  }, []);

  // 수동 모드: 엔터 키로 행 추가
  const handleEnterKey = useCallback((rowIdx: number, type: ContextMenuType) => {
    if (inputMode === 'manual') {
      handleInsertRowBelow(rowIdx, type);
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
  
  const cpList: any[] = [];
  
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
          }
        }}
        onSave={handleSave}
        onSync={() => state.fmeaId && syncFromFmea(state.fmeaId)}
        onExport={() => {}}
        onImportClick={() => {}}
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
            className="overflow-x-auto overflow-y-scroll bg-white border-t border-gray-300 flex-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#c1c1c1 #f1f1f1',
              maxHeight: '100%',
            }}
          >
            <table className={`border-collapse w-full table-auto min-w-[${totalWidth}px]`}>
            <thead style={{ background: '#ffffff' }}>
              {/* 1행: 그룹 헤더 */}
              <tr>
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
              
              {/* 3행: 열번호 (A, B, C...) */}
              <tr>
                {CP_COLUMNS.map((col, idx) => (
                  <th
                    key={`col-${col.id}`}
                    className="bg-gray-200 text-gray-600 font-semibold text-[9px] text-center border border-gray-300"
                    style={{ height: HEIGHTS.header3 }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </th>
                ))}
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
      />
      
      {/* 자동 입력 모달 */}
      <AutoInputModal
        modal={autoModal}
        onClose={() => setAutoModal(prev => ({ ...prev, visible: false }))}
        onPositionChange={(pos) => setAutoModal(prev => ({ ...prev, position: pos }))}
        onInsert={handleAutoModalInsert}
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
