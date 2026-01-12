/**
 * @file AllTabEmpty.tsx
 * @description P-FMEA ALL 화면 빈화면 (구조분석 CSS 벤치마킹)
 * 
 * ★★★ 화면정의서 v2.2 + 구조분석 디자인 통일 ★★★
 * - 레벨별 색상 체계: L1(파란색), L2(녹색), L3(주황색)
 * - 표준 border: #ccc
 * - 버튼/배지: worksheet.ts 스타일 사용
 */

'use client';

import React, { useState, useMemo } from 'react';
import { border } from '@/styles/worksheet';
import DataSelectModal from '@/components/modals/DataSelectModal';
import SODSelectModal from '@/components/modals/SODSelectModal';
import APResultModal from '@/components/modals/APResultModal';
import LLDSelectModal from '@/components/modals/LLDSelectModal';
import { UserSelectModal } from '@/components/modals/UserSelectModal';
import { useAllTabModals } from './hooks/useAllTabModals';
import { calculateAP } from './apCalculator';
import { RiskOptCellRenderer } from './RiskOptCellRenderer';
import { FailureCellRenderer } from './FailureCellRenderer';
import { FunctionCellRenderer } from './FunctionCellRenderer';
import { StructureCellRenderer } from './StructureCellRenderer';
import { processFailureLinks, FailureLinkRow, ProcessedFMGroup } from './processFailureLinks';
import { 
  COLORS, HEIGHTS, COLUMNS_BASE, STEP_COLORS, STEP_LABELS,
  getColumnsWithRPN, calculateStepSpans, calculateGroupSpans,
  ColumnDef, StepSpan, GroupSpan,
  CELL_STYLE, FM_DIVIDER, STEP_DIVIDER, STEP_FIRST_COLUMN_IDS  // ★ 2026-01-11: 셀 스타일 최적화 + 단계 구분선
} from './allTabConstants';
import type { WorksheetState } from '../../constants';

// ============ 상수는 allTabConstants.ts에서 import ============

// ============ 고장연결 데이터는 processFailureLinks.ts에서 import ============

// ★ processFailureLinks는 ./processFailureLinks.ts에서 import

// ============ 컴포넌트 ============
interface AllTabEmptyProps {
  rowCount?: number;
  showRPN?: boolean;
  visibleSteps?: string[];  // 표시할 단계명 목록 (예: ['구조분석', '기능분석'])
  failureLinks?: FailureLinkRow[];  // 고장연결 데이터
  state?: WorksheetState;  // 워크시트 상태
  setState?: React.Dispatch<React.SetStateAction<WorksheetState>>;  // 상태 업데이트 함수
  setDirty?: React.Dispatch<React.SetStateAction<boolean>>;  // ✅ DB 저장 트리거용
  // ★★★ 2026-01-12: 트리뷰 패널 전환 핸들러 ★★★
  onOpen5AP?: () => void;
  onOpen6AP?: () => void;
  onOpenRPN?: () => void;
  activePanelId?: string; // 현재 활성 패널 ID
}

export default function AllTabEmpty({ 
  rowCount = 10, 
  showRPN = false,
  visibleSteps,
  failureLinks = [],
  state,
  setState,
  setDirty,
  // ★★★ 2026-01-12: 트리뷰 패널 전환 핸들러 ★★★
  onOpen5AP,
  onOpen6AP,
  onOpenRPN,
  activePanelId,
}: AllTabEmptyProps) {
  // 모달 관리 훅 (★ 2026-01-12: setDirty 추가하여 DB 저장 트리거)
  const {
    sodModal,
    controlModal,
    setControlModal,
    closeControlModal,
    closeSodModal,
    handleSODClick,
    handleSODSelect,
    lldModal,
    openLldModal,
    closeLldModal,
    handleLldSelect,
    openUserModal,
    closeUserModal,
    handleUserSelect,
    userModal,
  } = useAllTabModals(setState, setDirty);
  
  // AP 모달 상태 (5AP/6AP 결과)
  const [apModal, setApModal] = useState<{
    isOpen: boolean;
    stage: 5 | 6;
    data: Array<{
      id: string;
      processName: string;
      failureMode: string;
      failureCause: string;
      severity: number;
      occurrence: number;
      detection: number;
      ap: 'H' | 'M' | 'L';
    }>;
  }>({
    isOpen: false,
    stage: 5,
    data: [],
  });
  
  // 고장연결 데이터 처리 (state.l2에서 최신 FM 텍스트 가져오기)
  const processedFMGroups = React.useMemo(() => processFailureLinks(failureLinks, state?.l2), [failureLinks, state?.l2]);
  // visibleSteps가 지정되면 해당 단계만 필터링, 없으면 전체 표시
  const allColumns = showRPN ? getColumnsWithRPN() : COLUMNS_BASE;
  const columns = visibleSteps && visibleSteps.length > 0
    ? allColumns.filter(col => visibleSteps.includes(col.step))
    : allColumns;
  
  const stepSpans = calculateStepSpans(columns);
  const groupSpans = calculateGroupSpans(columns);
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  
  // ★ 디버그: stepSpans 확인
  console.log('📋 [stepSpans]', stepSpans.map(s => s.step));
  
  // ★★★ 2026-01-12: 심각도를 모든 소스에서 찾기 (근본적 해결) ★★★
  const globalMaxSeverity = useMemo(() => {
    let maxS = 0;
    const riskData = state?.riskData || {};
    
    // 1. failureScopes에서 심각도 찾기
    (state?.l1?.failureScopes || []).forEach((fs: any) => {
      if (fs.severity && fs.severity > maxS) maxS = fs.severity;
    });
    
    // 2. riskData의 S-fe-* 키에서 심각도 찾기
    Object.keys(riskData).forEach(key => {
      if (key.startsWith('S-fe-') || key.startsWith('severity-')) {
        const val = Number(riskData[key]) || 0;
        if (val > maxS) maxS = val;
      }
    });
    
    // 3. processedFMGroups에서 심각도 찾기
    processedFMGroups.forEach(fmGroup => {
      if (fmGroup.maxSeverity > maxS) maxS = fmGroup.maxSeverity;
    });
    
    // 4. failureLinks에서 직접 심각도 찾기
    failureLinks.forEach((link: any) => {
      const linkSev = link.severity || link.feSeverity || 0;
      if (linkSev > maxS) maxS = linkSev;
    });
    
    console.log('🎯 [globalMaxSeverity] 최종 심각도:', maxS);
    return maxS;
  }, [state?.l1?.failureScopes, state?.riskData, processedFMGroups, failureLinks]);
  
  // ★★★ 2026-01-12: 5AP H/M/L 통계 계산 - APTable5와 동일한 로직으로 통일 ★★★
  const apStats = useMemo(() => {
    let hCount = 0, mCount = 0, lCount = 0;
    const hItems: Array<{
      id: string;
      processName: string;
      failureMode: string;
      failureCause: string;
      severity: number;
      occurrence: number;
      detection: number;
      ap: 'H' | 'M' | 'L';
      fmId: string;
      fcId: string;
      globalRowIdx: number;
    }> = [];
    
    const riskData = state?.riskData || {};
    
    // ★★★ APTable5와 동일: 모든 risk-*-O/D 키에서 uniqueKey 추출 ★★★
    const allUniqueKeys = new Set<string>();
    Object.keys(riskData).forEach(key => {
      // 패턴 1: risk-{숫자}-O/D (레거시)
      const numericMatch = key.match(/^risk-(\d+)-(O|D)$/);
      if (numericMatch) {
        allUniqueKeys.add(numericMatch[1]);
        return;
      }
      // 패턴 2: risk-{fmId}-{fcId}-O/D (새 형식)
      const compositeMatch = key.match(/^risk-(.+)-(O|D)$/);
      if (compositeMatch) {
        allUniqueKeys.add(compositeMatch[1]);
      }
    });
    
    // ★★★ APTable5와 동일: globalMaxSeverity 사용 ★★★
    const maxSeverity = globalMaxSeverity;
    
    let idx = 0;
    allUniqueKeys.forEach(uniqueKey => {
      const o = Number(riskData[`risk-${uniqueKey}-O`]) || 0;
      const d = Number(riskData[`risk-${uniqueKey}-D`]) || 0;
      const s = maxSeverity;
      
      if (s > 0 && o > 0 && d > 0) {
        const ap = calculateAP(s, o, d) as 'H' | 'M' | 'L' | '';
        
        // processedFMGroups에서 fmId, fcId 정보 찾기 (개선방향 표시용)
        let processName = '';
        let failureMode = '';
        let failureCause = '';
        let fmId = '';
        let fcId = '';
        
        // uniqueKey가 숫자인 경우 (레거시)
        const numericIdx = parseInt(uniqueKey);
        if (!isNaN(numericIdx)) {
          // processedFMGroups에서 해당 인덱스의 데이터 찾기
          let currentIdx = 0;
          for (const fmGroup of processedFMGroups) {
            for (const row of fmGroup.rows) {
              if (currentIdx === numericIdx) {
                processName = fmGroup.fmProcessName;
                failureMode = fmGroup.fmText;
                failureCause = row.fcText;
                fmId = fmGroup.fmId;
                fcId = row.fcId;
                break;
              }
              currentIdx++;
            }
            if (fmId) break;
          }
        } else {
          // uniqueKey가 fmId-fcId 형식인 경우
          const parts = uniqueKey.split('-');
          if (parts.length >= 2) {
            fmId = parts[0];
            fcId = parts.slice(1).join('-');
            
            // processedFMGroups에서 해당 fmId, fcId의 데이터 찾기
            for (const fmGroup of processedFMGroups) {
              if (fmGroup.fmId === fmId) {
                processName = fmGroup.fmProcessName;
                failureMode = fmGroup.fmText;
                const row = fmGroup.rows.find(r => r.fcId === fcId);
                if (row) {
                  failureCause = row.fcText;
                }
                break;
              }
            }
          }
        }
        
        if (ap === 'H') {
          hCount++;
          hItems.push({
            id: uniqueKey,
            processName,
            failureMode,
            failureCause,
            severity: s,
            occurrence: o,
            detection: d,
            ap: 'H',
            fmId,
            fcId,
            globalRowIdx: idx,
          });
        } else if (ap === 'M') {
          mCount++;
        } else if (ap === 'L') {
          lCount++;
        }
      }
      idx++;
    });
    
    console.log('📊 [apStats] APTable5 동일 로직 적용:', {
      uniqueKeysCount: allUniqueKeys.size,
      maxSeverity,
      result: { hCount, mCount, lCount, total: hCount + mCount + lCount },
    });
    
    return { hCount, mCount, lCount, total: hCount + mCount + lCount, hItems };
  }, [state?.riskData, globalMaxSeverity, processedFMGroups]);
  
  // ★★★ 2026-01-12: 개선방향 패널 상태 ★★★
  const [showImprovePanel, setShowImprovePanel] = useState(false);
  const [improvedItems, setImprovedItems] = useState<Set<string>>(new Set());
  
  // ★ L로 낮추기 위한 목표 점수 계산
  const getTargetScore = (current: number): number => {
    if (current >= 7) return 3;
    if (current >= 5) return 2;
    if (current >= 3) return 1;
    return 1;
  };
  
  // ★ 개선 적용 (레거시 + 신규 키 지원)
  const handleImprove = (fmId: string, fcId: string, type: 'O' | 'D', current: number, globalRowIdx: number) => {
    const uniqueKey = fmId && fcId ? `${fmId}-${fcId}` : `legacy-${globalRowIdx}`;
    const itemKey = `${uniqueKey}-${type}`;
    setImprovedItems(prev => new Set([...prev, itemKey]));
    
    if (setState) {
      const target = getTargetScore(current);
      // ★ fmId와 fcId가 있으면 신규 키, 없으면 레거시 키 사용
      const riskKey = fmId && fcId 
        ? `risk-${fmId}-${fcId}-${type}` 
        : `risk-${globalRowIdx}-${type}`;
      setState(prev => ({
        ...prev,
        riskData: {
          ...(prev.riskData || {}),
          [riskKey]: target,
        }
      }));
      if (setDirty) setDirty(true);
      console.log(`[개선적용] ${riskKey}: ${current} → ${target}`);
    }
  };
  
  return (
    <div 
      className="relative bg-white"
      style={{ 
        display: 'inline-block',
        minWidth: '100%',
      }}
    >
      {/* ★★★ 2026-01-12: H→L 개선방향 패널 ★★★ */}
      {showImprovePanel && apStats.hItems.length > 0 && (
        <div className="sticky top-[44px] z-30 bg-orange-50 border-b-2 border-orange-300 p-3 max-h-[250px] overflow-auto">
          <div className="text-[12px] font-bold text-orange-700 mb-2 flex justify-between items-center">
            <span>🔧 H→L 개선 제안 ({apStats.hItems.length}건)</span>
            <button 
              onClick={() => setShowImprovePanel(false)}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >×</button>
          </div>
          <div className="grid gap-2">
            {apStats.hItems.map((item, idx) => {
              const oImproved = improvedItems.has(`${item.fmId}-${item.fcId}-O`);
              const dImproved = improvedItems.has(`${item.fmId}-${item.fcId}-D`);
              const targetO = getTargetScore(item.occurrence);
              const targetD = getTargetScore(item.detection);
              
              return (
                <div key={item.id} className="bg-white rounded p-2 border border-orange-200 text-[11px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-700">
                      #{idx + 1} {item.processName} - {item.failureMode}
                    </span>
                    <span className="text-gray-500">
                      S:{item.severity} O:{item.occurrence} D:{item.detection}
                    </span>
                  </div>
                  <div className="text-gray-600 mb-2 text-[10px]">
                    원인: {item.failureCause}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleImprove(item.fmId, item.fcId, 'O', item.occurrence, item.globalRowIdx)}
                      disabled={oImproved}
                      className={`flex-1 py-1 px-2 rounded text-[10px] font-semibold transition-all ${
                        oImproved 
                          ? 'bg-green-100 text-green-700 cursor-default' 
                          : 'bg-orange-400 text-white hover:bg-orange-500 cursor-pointer'
                      }`}
                    >
                      {oImproved ? '✓ 예방개선 완료' : `예방관리 O:${item.occurrence}→${targetO}`}
                    </button>
                    <button
                      onClick={() => handleImprove(item.fmId, item.fcId, 'D', item.detection, item.globalRowIdx)}
                      disabled={dImproved}
                      className={`flex-1 py-1 px-2 rounded text-[10px] font-semibold transition-all ${
                        dImproved 
                          ? 'bg-green-100 text-green-700 cursor-default' 
                          : 'bg-orange-400 text-white hover:bg-orange-500 cursor-pointer'
                      }`}
                    >
                      {dImproved ? '✓ 검출개선 완료' : `검출관리 D:${item.detection}→${targetD}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <table
        style={{
          width: `${totalWidth}px`,
          minWidth: `${totalWidth}px`,
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        {/* colgroup */}
        <colgroup>
          {columns.map((col, idx) => (
            <col key={idx} style={{ width: `${col.width}px` }} />
          ))}
        </colgroup>
        
        <thead className="sticky top-0 z-20 border-b-2 border-[#1a237e]">
          {/* 1행: 단계 (대분류) - 구조분석 스타일 */}
          <tr>
            {stepSpans.map((span, idx) => (
              <th
                key={idx}
                colSpan={span.colSpan}
                style={{
                  background: span.color,
                  color: '#fff',
                  height: `${HEIGHTS.header1}px`,
                  padding: '4px 8px',
                  borderTop: '1px solid #ccc',
                  borderRight: '1px solid #ccc',
                  borderBottom: '1px solid #ccc',
                  borderLeft: `${STEP_DIVIDER.borderWidth} ${STEP_DIVIDER.borderStyle} ${STEP_DIVIDER.borderColor}`,
                  fontWeight: 800,
                  fontSize: '12px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {span.step === '리스크분석' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>{STEP_LABELS[span.step]}</span>
                    {/* H/M/L 통계 배지 */}
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      <span style={{ background: '#ef5350', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>H:{apStats.hCount}</span>
                      <span style={{ background: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>M:{apStats.mCount}</span>
                      <span style={{ background: '#4caf50', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>L:{apStats.lCount}</span>
                    </span>
                  </div>
                ) : (
                  <span>{STEP_LABELS[span.step] || span.step}</span>
                )}
              </th>
            ))}
          </tr>
          
          {/* 2행: 분류 (중분류) - 레벨별 색상, 네이비 배경은 흰색 글씨 */}
          <tr>
            {groupSpans.map((span, idx) => {
              const isStepFirst = STEP_FIRST_COLUMN_IDS.includes(span.startColId);
              return (
                <th
                  key={idx}
                  colSpan={span.colSpan}
                  style={{
                    background: span.color,
                    color: span.isDark ? '#fff' : '#000',
                    height: `${HEIGHTS.header2}px`,
                    padding: '4px 6px',
                    borderTop: '1px solid #ccc',
                    borderRight: '1px solid #ccc',
                    borderBottom: '1px solid #ccc',
                    borderLeft: isStepFirst ? `${STEP_DIVIDER.borderWidth} ${STEP_DIVIDER.borderStyle} ${STEP_DIVIDER.borderColor}` : '1px solid #ccc',
                    fontWeight: 600,
                    fontSize: '11px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {span.group}
                </th>
              );
            })}
          </tr>
          
          {/* 3행: 컬럼명 (소분류) - 네이비 배경은 흰색 글씨 */}
          <tr>
            {columns.map((col, idx) => {
              const isStepFirst = STEP_FIRST_COLUMN_IDS.includes(col.id);
              return (
                <th
                  key={idx}
                  style={{
                    background: col.isDark ? col.headerColor : col.cellAltColor,
                    color: col.isDark ? '#fff' : '#000',
                    height: `${HEIGHTS.header3}px`,
                    padding: '3px 4px',
                    borderTop: '1px solid #ccc',
                    borderRight: '1px solid #ccc',
                    borderBottom: '1px solid #ccc',
                    borderLeft: isStepFirst ? `${STEP_DIVIDER.borderWidth} ${STEP_DIVIDER.borderStyle} ${STEP_DIVIDER.borderColor}` : '1px solid #ccc',
                    fontWeight: 600,
                    fontSize: '11px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.name}
                </th>
              );
            })}
          </tr>
        </thead>
        
        <tbody>
          {processedFMGroups.length > 0 ? (
            // ★ 고장연결 데이터가 있으면 FM 중심 셀합치기 렌더링
            processedFMGroups.flatMap((fmGroup, fmIdx) => 
              fmGroup.rows.map((row, rowInFM) => {
                const globalRowIdx = processedFMGroups.slice(0, fmIdx).reduce((acc, g) => acc + g.rows.length, 0) + rowInFM;
                const isLastRowOfFM = rowInFM === fmGroup.rows.length - 1;
                
                // ★ 2026-01-11: FM 그룹 구분선 및 최적화 스타일
                const fmDividerStyle = isLastRowOfFM ? {
                  borderBottom: `${FM_DIVIDER.borderWidth} ${FM_DIVIDER.borderStyle} ${FM_DIVIDER.borderColor}`,
                } : {};
                
                return (
                  <tr 
                    key={`fm-${fmGroup.fmId}-${rowInFM}`}
                    data-last-row={isLastRowOfFM ? 'true' : undefined}
                    style={fmDividerStyle}
                  >
                    {columns.map((col, colIdx) => {
                      // ★★★ 2026-01-11 핵심 수정: rowSpan 범위 체크 헬퍼 함수 ★★★
                      // 이전 행의 rowSpan 범위에 포함되면 true (셀 렌더링 안 함)
                      const isInMergedRange = (type: 'fe' | 'fc' | 'fm'): boolean => {
                        if (rowInFM === 0) return false; // 첫 행은 항상 렌더링
                        for (let prevIdx = 0; prevIdx < rowInFM; prevIdx++) {
                          const prevRow = fmGroup.rows[prevIdx];
                          if (!prevRow) continue;
                          let span = 1;
                          if (type === 'fe') span = prevRow.feRowSpan;
                          else if (type === 'fc') span = prevRow.fcRowSpan;
                          else if (type === 'fm') span = fmGroup.fmRowSpan;
                          if (span > 1 && prevIdx + span > rowInFM) {
                            return true;
                          }
                        }
                        return false;
                      };
                      
                      // ★ 고장분석 컬럼 - FailureCellRenderer 사용 (모듈화)
                      // ★★★ 수정: null 반환 시 빈 td 렌더링 안 함 (rowSpan 범위 존중) ★★★
                      if (col.step === '고장분석') {
                        return FailureCellRenderer({
                          col, colIdx, fmGroup, fmIdx, row, rowInFM, globalRowIdx,
                          handleSODClick,  // ★ 2026-01-11: 심각도 클릭 핸들러 전달
                        });
                      }
                      
                      // ★ 구조분석 컬럼 - StructureCellRenderer 사용 (모듈화)
                      // ★★★ 수정: null 반환 시 빈 td 렌더링 안 함 (rowSpan 범위 존중) ★★★
                      if (col.step === '구조분석') {
                        return StructureCellRenderer({
                          col, colIdx, fmGroup, fmIdx, row, rowInFM, globalRowIdx,
                          l1ProductName: fmGroup.l1ProductName,
                        });
                      }
                      
                      // ★ 기능분석 컬럼 - FunctionCellRenderer 사용 (모듈화)
                      // ★★★ 수정: null 반환 시 빈 td 렌더링 안 함 (rowSpan 범위 존중) ★★★
                      if (col.step === '기능분석') {
                        return FunctionCellRenderer({
                          col, colIdx, fmGroup, fmIdx, row, rowInFM, globalRowIdx,
                        });
                      }
                      
                      // ★ 리스크분석 / 최적화 컬럼 - RiskOptCellRenderer 사용 (모듈화)
                      // ★★★ FC와 동일한 병합 조건 사용 ★★★
                      if (col.step === '리스크분석' || col.step === '최적화') {
                        // ★ 이전 행의 fcRowSpan 범위에 포함되면 null 반환
                        if (isInMergedRange('fc')) {
                          return null;
                        }
                        
                        return (
                          <RiskOptCellRenderer
                            key={colIdx}
                            col={col}
                            colIdx={colIdx}
                            globalRowIdx={globalRowIdx}
                            fcRowSpan={row.fcRowSpan}
                            rowInFM={rowInFM}
                            prevFcRowSpan={1}
                            fmId={fmGroup.fmId}
                            fcId={row.fcId}
                            fcText={row.fcText}
                            state={state}
                            setState={setState}
                            setDirty={setDirty}
                            setControlModal={setControlModal}
                            handleSODClick={handleSODClick}
                            setApModal={setApModal}
                            openLldModal={openLldModal}
                            openUserModal={openUserModal}
                          />
                        );
                      }
                      
                      // ★ 그 외 알 수 없는 단계 컬럼 (존재하지 않아야 함)
                      console.warn(`[AllTabEmpty] 알 수 없는 단계: ${col.step}, 컬럼: ${col.name}`);
                      return null;
                    })}
                  </tr>
                );
              })
            )
          ) : (
            // ★ 고장연결 데이터가 없으면 빈 행 렌더링
            Array.from({ length: rowCount }, (_, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td 
                    key={colIdx} 
                    style={{
                      background: rowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
                      height: `${HEIGHTS.body}px`,
                      padding: '3px 4px',
                      border: '1px solid #ccc',
                      fontSize: '11px',
                      textAlign: col.align,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 예방관리/검출관리/특별특성 선택 모달 */}
      {controlModal.isOpen && state && setState && (
        <DataSelectModal
          isOpen={controlModal.isOpen}
          title={
            controlModal.type === 'prevention' ? '예방관리 선택' :
            controlModal.type === 'prevention-opt' ? '예방관리개선 선택' :
            controlModal.type === 'detection' ? '검출관리 선택' :
            controlModal.type === 'detection-opt' ? '검출관리개선 선택' :
            '특별특성 선택'
          }
          itemCode={
            controlModal.type === 'prevention' || controlModal.type === 'prevention-opt' ? 'B5' :
            controlModal.type === 'detection' || controlModal.type === 'detection-opt' ? 'B6' :
            'SC'
          }
          onClose={closeControlModal}
          onSave={(selectedValues) => {
            if (setState && selectedValues.length > 0) {
              // ★★★ 2026-01-11: 여러 개 선택 시 줄바꿈으로 연결하여 하나의 셀에 저장 ★★★
              const selectedValue = selectedValues.join('\n');
              
              // ★ 고유 키: fmId-fcId 조합 사용 (없으면 rowIndex 폴백)
              const uniqueKey = controlModal.fmId && controlModal.fcId 
                ? `${controlModal.fmId}-${controlModal.fcId}` 
                : String(controlModal.rowIndex);
              const key = `${controlModal.type}-${uniqueKey}`;
              
              // ★★★ 2026-01-11: 동일원인 자동연결 - 예방관리(PC) + 검출관리(DC) 모두 지원 ★★★
              // ⚠️ 예방관리개선/검출관리개선(prevention-opt/detection-opt)은 자동연결하지 않음
              const autoLinkTypes = ['prevention', 'detection'];
              const isAutoLinkType = autoLinkTypes.includes(controlModal.type);
              
              let autoLinkedCount = 0;
              const currentFcId = controlModal.fcId || '';
              // ★ fcText는 모달에서 직접 전달받음 (더 이상 검색 불필요)
              const currentFcText = controlModal.fcText || '';
              
              // 디버깅 로그
              console.log('[자동연결] 시작:', { 
                type: controlModal.type, 
                isAutoLinkType,
                currentFcId, 
                currentFcText,
                fmId: controlModal.fmId,
                processedFMGroups: processedFMGroups.length
              });
              
              if (isAutoLinkType && processedFMGroups.length > 0 && currentFcText) {
                // 동일한 고장원인을 가진 다른 행들 찾기
                processedFMGroups.forEach((group) => {
                  group.rows.forEach((r) => {
                    // 현재 fcId가 아니고, 동일한 고장원인 텍스트를 가진 행
                    if (r.fcId !== currentFcId && r.fcText === currentFcText) {
                      autoLinkedCount++;
                      console.log('[자동연결] 발견:', { fmId: group.fmId, fcId: r.fcId, fcText: r.fcText });
                    }
                  });
                });
              }
              
              console.log('[자동연결] 결과:', { autoLinkedCount, currentFcText });
              
              // ★★★ 2026-01-11: 발생도/검출도 자동연결용 변수 (알림 표시용) ★★★
              // 현재 상태에서 발생도/검출도 확인 (setState 전에 미리 계산)
              let occurrenceAutoLinkedCount = 0;
              let currentOccurrenceValue: number | null = null;
              let detectionAutoLinkedCount = 0;
              let currentDetectionValue: number | null = null;
              
              // 예방관리 → 발생도 자동연결
              if (controlModal.type === 'prevention' && state) {
                const currentOccurrenceKey = controlModal.fmId && controlModal.fcId
                  ? `risk-${controlModal.fmId}-${controlModal.fcId}-O`
                  : `risk-${controlModal.rowIndex}-O`;
                const currentOccurrence = state.riskData?.[currentOccurrenceKey];
                
                if (typeof currentOccurrence === 'number' && currentOccurrence >= 1 && currentOccurrence <= 10) {
                  currentOccurrenceValue = currentOccurrence;
                  
                  // 같은 예방관리를 가진 다른 행들 찾기
                  if (processedFMGroups.length > 0) {
                    processedFMGroups.forEach((group) => {
                      group.rows.forEach((r) => {
                        const targetUniqueKey = `${group.fmId}-${r.fcId}`;
                        const targetPreventionKey = `prevention-${targetUniqueKey}`;
                        const targetPreventionValue = state?.riskData?.[targetPreventionKey] || '';
                        
                        // 예방관리 값이 일치하고, 현재 행이 아니며, 발생도가 없거나 다른 행
                        if (targetPreventionValue === selectedValue && 
                            (group.fmId !== controlModal.fmId || r.fcId !== currentFcId)) {
                          const targetOccurrenceKey = `risk-${targetUniqueKey}-O`;
                          const existingOccurrence = state?.riskData?.[targetOccurrenceKey];
                          if (!existingOccurrence || existingOccurrence !== currentOccurrence) {
                            occurrenceAutoLinkedCount++;
                          }
                        }
                      });
                    });
                  }
                }
              }
              
              // ★★★ 2026-01-11: 검출관리 → 검출도 자동연결 (동일 고장형태(FM) 내에서만) ★★★
              if (controlModal.type === 'detection' && state && controlModal.fmId) {
                const currentDetectionKey = controlModal.fmId && controlModal.fcId
                  ? `risk-${controlModal.fmId}-${controlModal.fcId}-D`
                  : `risk-${controlModal.rowIndex}-D`;
                const currentDetection = state.riskData?.[currentDetectionKey];
                
                if (typeof currentDetection === 'number' && currentDetection >= 1 && currentDetection <= 10) {
                  currentDetectionValue = currentDetection;
                  
                  // ★★★ 2026-01-12: 동일한 고장형태(FM) 내에서만 검출도 자동연결 ★★★
                  const currentFMGroup = processedFMGroups.find(g => g.fmId === controlModal.fmId);
                  if (currentFMGroup) {
                    currentFMGroup.rows.forEach((r) => {
                      if (r.fcId === currentFcId) return; // 현재 행은 스킵
                      
                      const targetUniqueKey = `${controlModal.fmId}-${r.fcId}`;
                      const targetDetectionKey = `detection-${targetUniqueKey}`;
                      const targetDetectionValue = state?.riskData?.[targetDetectionKey] || '';
                      
                      // 검출관리 값이 일치하고, 검출도가 없거나 다른 행
                      if (targetDetectionValue === selectedValue) {
                        const targetDetectionOccurrenceKey = `risk-${targetUniqueKey}-D`;
                        const existingDetection = state?.riskData?.[targetDetectionOccurrenceKey];
                        if (!existingDetection || existingDetection !== currentDetection) {
                          detectionAutoLinkedCount++;
                        }
                      }
                    });
                  }
                }
              }
              
              // ★★★ 2026-01-12: 검출관리 선택 시 이미 지정된 검출도 자동 적용 ★★★
              let autoAppliedDetectionValue: number | null = null;
              if (controlModal.type === 'detection' && state && processedFMGroups.length > 0 && controlModal.fmId) {
                // 동일한 고장형태(FM) 내에서 동일한 검출관리를 사용하고 있는지 확인
                const currentFMGroup = processedFMGroups.find(g => g.fmId === controlModal.fmId);
                if (currentFMGroup) {
                  for (const r of currentFMGroup.rows) {
                    if (r.fcId === currentFcId) continue; // 현재 행은 스킵
                    
                    const targetUniqueKey = `${controlModal.fmId}-${r.fcId}`;
                    const targetDetectionKey = `detection-${targetUniqueKey}`;
                    const targetDetectionValue = state.riskData?.[targetDetectionKey] || '';
                    
                    // 검출관리 값이 일치하면 해당 행의 검출도 확인
                    if (targetDetectionValue === selectedValue) {
                      const targetDetectionOccurrenceKey = `risk-${targetUniqueKey}-D`;
                      const existingDetection = state.riskData?.[targetDetectionOccurrenceKey];
                      
                      if (typeof existingDetection === 'number' && existingDetection >= 1 && existingDetection <= 10) {
                        autoAppliedDetectionValue = existingDetection;
                        console.log(`[검출관리-검출도 자동지정] 동일 고장형태(FM) 내 검출관리 "${selectedValue}"에 이미 지정된 검출도 ${existingDetection}점 발견`);
                        break;
                      }
                    }
                  }
                }
              }
              
              // 현재 행 저장 + 자동연결된 행들 저장
              setState((prev: WorksheetState) => {
                const newRiskData = { ...(prev.riskData || {}) };
                
                // 현재 행 저장
                newRiskData[key] = selectedValue;
                
                // ★★★ 2026-01-12: 검출관리 선택 시 이미 지정된 검출도 자동 적용 (현재 행 + 동일 FM 내 다른 행) ★★★
                if (controlModal.type === 'detection' && autoAppliedDetectionValue !== null && controlModal.fmId) {
                  const currentDetectionKey = controlModal.fmId && controlModal.fcId
                    ? `risk-${controlModal.fmId}-${controlModal.fcId}-D`
                    : `risk-${controlModal.rowIndex}-D`;
                  newRiskData[currentDetectionKey] = autoAppliedDetectionValue;
                  console.log(`[검출관리-검출도 자동지정] 현재 행에 검출도 ${autoAppliedDetectionValue}점 자동 적용: ${currentDetectionKey}`);
                  
                  // ★★★ 동일한 고장형태(FM) 내 다른 행에도 동일한 검출도 자동 적용 ★★★
                  const currentFMGroup = processedFMGroups.find(g => g.fmId === controlModal.fmId);
                  if (currentFMGroup) {
                    let appliedCount = 0;
                    currentFMGroup.rows.forEach((r) => {
                      if (r.fcId === currentFcId) return; // 현재 행은 스킵 (이미 적용됨)
                      
                      const targetUniqueKey = `${controlModal.fmId}-${r.fcId}`;
                      const targetDetectionKey = `detection-${targetUniqueKey}`;
                      const targetDetectionValue = prev.riskData?.[targetDetectionKey] || '';
                      
                      // 검출관리 값이 일치하고, 검출도가 없거나 다른 행
                      if (targetDetectionValue === selectedValue) {
                        const targetDetectionOccurrenceKey = `risk-${targetUniqueKey}-D`;
                        const existingDetection = prev.riskData?.[targetDetectionOccurrenceKey];
                        if (!existingDetection || existingDetection !== autoAppliedDetectionValue) {
                          newRiskData[targetDetectionOccurrenceKey] = autoAppliedDetectionValue;
                          appliedCount++;
                          console.log(`[검출관리-검출도 자동지정] 동일 FM 내 다른 행에도 적용: ${targetDetectionOccurrenceKey} = ${autoAppliedDetectionValue}`);
                        }
                      }
                    });
                    if (appliedCount > 0) {
                      console.log(`[검출관리-검출도 자동지정] 동일 고장형태(FM) 내 ${appliedCount}개 행에 검출도 ${autoAppliedDetectionValue}점 자동 적용`);
                    }
                  }
                }
                
                // ✅ 자동연결 1: 동일원인에 예방관리/검출관리 자동연결 (예방관리 PC + 검출관리 DC)
                if (isAutoLinkType && autoLinkedCount > 0 && currentFcText) {
                  processedFMGroups.forEach((group) => {
                    group.rows.forEach((r) => {
                      if (r.fcId !== currentFcId && r.fcText === currentFcText) {
                        const autoUniqueKey = `${group.fmId}-${r.fcId}`;
                        const autoKey = `${controlModal.type}-${autoUniqueKey}`;
                        newRiskData[autoKey] = selectedValue;
                        console.log('[자동연결-원인] 적용:', autoKey, '=', selectedValue);
                      }
                    });
                  });
                }
                
                // ★★★ 2026-01-11: 자동연결 2: 동일 예방관리에 동일 발생도 자동연결 ★★★
                if (controlModal.type === 'prevention' && processedFMGroups.length > 0 && currentOccurrenceValue !== null) {
                  processedFMGroups.forEach((group) => {
                    group.rows.forEach((r) => {
                      const targetUniqueKey = `${group.fmId}-${r.fcId}`;
                      const targetPreventionKey = `prevention-${targetUniqueKey}`;
                      const targetPreventionValue = prev.riskData?.[targetPreventionKey] || '';
                      
                      // 예방관리 값이 일치하고, 현재 행이 아니며, 발생도가 없거나 다른 행
                      if (targetPreventionValue === selectedValue && 
                          (group.fmId !== controlModal.fmId || r.fcId !== currentFcId)) {
                        const targetOccurrenceKey = `risk-${targetUniqueKey}-O`;
                        const existingOccurrence = prev.riskData?.[targetOccurrenceKey];
                        if (!existingOccurrence || existingOccurrence !== currentOccurrenceValue) {
                          newRiskData[targetOccurrenceKey] = currentOccurrenceValue;
                          console.log('[자동연결-발생도] 적용:', targetOccurrenceKey, '=', currentOccurrenceValue, '(예방관리:', selectedValue, ')');
                        }
                      }
                    });
                  });
                }
                
                // ★★★ 2026-01-12: 자동연결 3: 동일 고장형태(FM) 내 동일 검출관리에 동일 검출도 자동연결 ★★★
                if (controlModal.type === 'detection' && controlModal.fmId && currentDetectionValue !== null) {
                  const currentFMGroup = processedFMGroups.find(g => g.fmId === controlModal.fmId);
                  if (currentFMGroup) {
                    currentFMGroup.rows.forEach((r) => {
                      if (r.fcId === currentFcId) return; // 현재 행은 스킵
                      
                      const targetUniqueKey = `${controlModal.fmId}-${r.fcId}`;
                      const targetDetectionKey = `detection-${targetUniqueKey}`;
                      const targetDetectionValue = prev.riskData?.[targetDetectionKey] || '';
                      
                      // 검출관리 값이 일치하고, 검출도가 없거나 다른 행
                      if (targetDetectionValue === selectedValue) {
                        const targetDetectionOccurrenceKey = `risk-${targetUniqueKey}-D`;
                        const existingDetection = prev.riskData?.[targetDetectionOccurrenceKey];
                        if (!existingDetection || existingDetection !== currentDetectionValue) {
                          newRiskData[targetDetectionOccurrenceKey] = currentDetectionValue;
                          console.log('[자동연결-검출도] 동일 FM 내 적용:', targetDetectionOccurrenceKey, '=', currentDetectionValue, '(검출관리:', selectedValue, ')');
                        }
                      }
                    });
                  }
                }
                
                return { ...prev, riskData: newRiskData };
              });
              
              if (occurrenceAutoLinkedCount > 0 && currentOccurrenceValue !== null) {
                console.log(`[자동연결-발생도] 완료: ${occurrenceAutoLinkedCount}건 자동 연결 (발생도: ${currentOccurrenceValue})`);
              }
              
              if (detectionAutoLinkedCount > 0 && currentDetectionValue !== null) {
                console.log(`[자동연결-검출도] 완료: ${detectionAutoLinkedCount}건 자동 연결 (검출도: ${currentDetectionValue})`);
              }
              
              // ✅ DB 저장 트리거
              if (setDirty) {
                setDirty(true);
                console.log(`[AllTabEmpty] ${controlModal.type} 저장 (키: ${key}) → DB 저장 트리거`);
              }
              
              // 자동연결 알림
              if (isAutoLinkType && autoLinkedCount > 0 && currentFcText) {
                const typeName = controlModal.type === 'prevention' ? '예방관리' : '검출관리';
                setTimeout(() => {
                  alert(`✨ 자동연결: 동일한 고장원인 "${currentFcText}"에\n"${selectedValue.split('\n').join(', ')}"\n${typeName}가 ${autoLinkedCount}건 자동 연결되었습니다.`);
                }, 100);
              }
              
              // ★★★ 2026-01-11: 발생도 자동연결 알림 (예방관리 저장 후) ★★★
              if (controlModal.type === 'prevention' && occurrenceAutoLinkedCount > 0 && currentOccurrenceValue !== null) {
                setTimeout(() => {
                  alert(`✨ 발생도 자동연결: 동일한 예방관리 "${selectedValue.split('\n').join(', ')}"에\n발생도 ${currentOccurrenceValue}점이 ${occurrenceAutoLinkedCount}건 자동 연결되었습니다.`);
                }, 300); // 원인 알림 이후 표시
              }
              
              // ★★★ 2026-01-11: 검출도 자동연결 알림 (검출관리 저장 후) ★★★
              if (controlModal.type === 'detection' && detectionAutoLinkedCount > 0 && currentDetectionValue !== null) {
                setTimeout(() => {
                  alert(`✨ 검출도 자동연결: 동일한 검출관리 "${selectedValue.split('\n').join(', ')}"에\n검출도 ${currentDetectionValue}점이 ${detectionAutoLinkedCount}건 자동 연결되었습니다.`);
                }, 300); // 원인 알림 이후 표시
              }
              
              // ★★★ 2026-01-12: 검출관리 선택 시 이미 지정된 검출도 자동 적용 알림 ★★★
              if (controlModal.type === 'detection' && autoAppliedDetectionValue !== null) {
                setTimeout(() => {
                  alert(`✨ 검출도 자동지정: 동일한 고장형태(FM) 내 검출관리 "${selectedValue.split('\n').join(', ')}"에 이미 지정된\n검출도 ${autoAppliedDetectionValue}점이 현재 항목에 자동 적용되었습니다.\n(검출도는 필요시 수정 가능합니다.)`);
                }, 400); // 다른 알림 이후 표시
              }
            }
            closeControlModal();
          }}
          onDelete={() => {
            if (setState) {
              const uniqueKey = controlModal.fmId && controlModal.fcId 
                ? `${controlModal.fmId}-${controlModal.fcId}` 
                : String(controlModal.rowIndex);
              const key = `${controlModal.type}-${uniqueKey}`;
              setState((prev: WorksheetState) => {
                const newRiskData = { ...(prev.riskData || {}) };
                delete newRiskData[key];
                return { ...prev, riskData: newRiskData };
              });
            }
            closeControlModal();
          }}
          singleSelect={false}
          currentValues={(() => {
            const uniqueKey = controlModal.fmId && controlModal.fcId 
              ? `${controlModal.fmId}-${controlModal.fcId}` 
              : String(controlModal.rowIndex);
            const savedValue = (state.riskData || {})[`${controlModal.type}-${uniqueKey}`] || '';
            return savedValue ? savedValue.split('\n').filter(Boolean) : [];
          })()}
        />
      )}
      
      {/* SOD 선택 모달 (심각도/발생도/검출도) */}
      <SODSelectModal
        isOpen={sodModal.isOpen}
        onClose={closeSodModal}
        onSelect={handleSODSelect}
        category={sodModal.category}
        fmeaType="P-FMEA"
        currentValue={sodModal.currentValue}
        scope={sodModal.scope}
      />

      {/* ★ LLD 선택 모달 (습득교훈) */}
      <LLDSelectModal
        isOpen={lldModal.isOpen}
        onClose={closeLldModal}
        onSelect={handleLldSelect}
        currentValue={lldModal.currentValue}
        fmeaId={state?.fmeaId || 'pfm26-001'}  // ★ 현재 FMEA ID 전달
      />
      
      {/* ★ 사용자 선택 모달 (책임자성명) */}
      <UserSelectModal
        isOpen={userModal.isOpen}
        onClose={closeUserModal}
        onSelect={handleUserSelect}
        currentValue={userModal.currentValue}
      />
      
      {/* AP 결과 모달 (5AP/6AP) */}
      <APResultModal
        isOpen={apModal.isOpen}
        onClose={() => setApModal(prev => ({ ...prev, isOpen: false }))}
        stage={apModal.stage}
        data={apModal.data}
      />
    </div>
  );
}

// Export
export { COLUMNS_BASE, COLORS, HEIGHTS, getColumnsWithRPN, STEP_COLORS };
export type { ColumnDef };
