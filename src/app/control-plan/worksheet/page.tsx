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
import { useProcessRowSpan, useDescRowSpan, useWorkRowSpan, useCharRowSpan, useContextMenu, useWorksheetHandlers } from './hooks';
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
            className="bg-white border-t border-gray-300 flex-1"
            style={{
              flex: 1,
              overflowX: 'scroll',
              overflowY: 'auto',
              background: '#fff',
              position: 'relative',
            }}
          >
            <table className="border-separate table-auto" style={{ borderSpacing: 0, width: '100%', minWidth: `${totalWidth}px`, tableLayout: 'fixed' }}>
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
