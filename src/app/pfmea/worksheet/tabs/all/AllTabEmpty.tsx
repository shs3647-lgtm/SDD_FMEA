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
  ColumnDef, StepSpan, GroupSpan 
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
}

export default function AllTabEmpty({ 
  rowCount = 10, 
  showRPN = false,
  visibleSteps,
  failureLinks = [],
  state,
  setState,
  setDirty,
}: AllTabEmptyProps) {
  // 모달 관리 훅
  const {
    sodModal,
    controlModal,
    setControlModal,
    closeControlModal,
    closeSodModal,
    handleSODClick,
    handleSODSelect,
  } = useAllTabModals(setState);
  
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
  
  // 고장연결 데이터 처리
  const processedFMGroups = React.useMemo(() => processFailureLinks(failureLinks), [failureLinks]);
  // visibleSteps가 지정되면 해당 단계만 필터링, 없으면 전체 표시
  const allColumns = showRPN ? getColumnsWithRPN() : COLUMNS_BASE;
  const columns = visibleSteps && visibleSteps.length > 0
    ? allColumns.filter(col => visibleSteps.includes(col.step))
    : allColumns;
  
  const stepSpans = calculateStepSpans(columns);
  const groupSpans = calculateGroupSpans(columns);
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  
  return (
    <div 
      className="relative bg-white"
      style={{ 
        display: 'inline-block',
        minWidth: '100%',
      }}
    >
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
                  border: '1px solid #ccc',
                  fontWeight: 800,
                  fontSize: '12px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span>{STEP_LABELS[span.step] || span.step}</span>
                </div>
              </th>
            ))}
          </tr>
          
          {/* 2행: 분류 (중분류) - 레벨별 색상, 네이비 배경은 흰색 글씨 */}
          <tr>
            {groupSpans.map((span, idx) => (
              <th
                key={idx}
                colSpan={span.colSpan}
                style={{
                  background: span.color,
                  color: span.isDark ? '#fff' : '#000',
                  height: `${HEIGHTS.header2}px`,
                  padding: '4px 6px',
                  border: '1px solid #ccc',
                  fontWeight: 600,
                  fontSize: '11px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {span.group}
              </th>
            ))}
          </tr>
          
          {/* 3행: 컬럼명 (소분류) - 네이비 배경은 흰색 글씨 */}
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  background: col.isDark ? col.headerColor : col.cellAltColor,
                  color: col.isDark ? '#fff' : '#000',
                  height: `${HEIGHTS.header3}px`,
                  padding: '3px 4px',
                  border: '1px solid #ccc',
                  fontWeight: 600,
                  fontSize: '11px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {processedFMGroups.length > 0 ? (
            // ★ 고장연결 데이터가 있으면 FM 중심 셀합치기 렌더링
            processedFMGroups.flatMap((fmGroup, fmIdx) => 
              fmGroup.rows.map((row, rowInFM) => {
                const globalRowIdx = processedFMGroups.slice(0, fmIdx).reduce((acc, g) => acc + g.rows.length, 0) + rowInFM;
                const isLastRowOfFM = rowInFM === fmGroup.rows.length - 1;
                
                return (
                  <tr 
                    key={`fm-${fmGroup.fmId}-${rowInFM}`}
                    style={isLastRowOfFM ? { borderBottom: '2px solid #1a237e' } : undefined}
                  >
                    {columns.map((col, colIdx) => {
                      // ★ 고장분석 컬럼 - FailureCellRenderer 사용 (모듈화)
                      if (col.step === '고장분석') {
                        const failureResult = FailureCellRenderer({
                          col, colIdx, fmGroup, fmIdx, row, rowInFM, globalRowIdx,
                        });
                        if (failureResult !== null) return failureResult;
                      }
                      
                      // ★ 구조분석 컬럼 - StructureCellRenderer 사용 (모듈화)
                      if (col.step === '구조분석') {
                        const structureResult = StructureCellRenderer({
                          col, colIdx, fmGroup, fmIdx, row, rowInFM, globalRowIdx,
                          l1ProductName: fmGroup.l1ProductName,
                        });
                        if (structureResult !== null) return structureResult;
                      }
                      
                      // ★ 기능분석 컬럼 - FunctionCellRenderer 사용 (모듈화)
                      if (col.step === '기능분석') {
                        const functionResult = FunctionCellRenderer({
                          col, colIdx, fmGroup, fmIdx, row, rowInFM, globalRowIdx,
                        });
                        if (functionResult !== null) return functionResult;
                      }
                      
                      // ★ 리스크분석 / 최적화 컬럼 - RiskOptCellRenderer 사용 (모듈화)
                      // ★ 중요: rowSpan 병합 체크는 FailureCellRenderer와 동일한 조건 사용
                      if (col.step === '리스크분석' || col.step === '최적화') {
                        // ★ FC별 rowSpan 조건: FailureCellRenderer와 동일
                        const isInMergedRange = (): boolean => {
                          for (let prevIdx = 0; prevIdx < rowInFM; prevIdx++) {
                            const prevRow = fmGroup.rows[prevIdx];
                            if (!prevRow) continue;
                            if (prevRow.fcRowSpan > 1 && prevIdx + prevRow.fcRowSpan > rowInFM) {
                              return true;
                            }
                          }
                          return false;
                        };
                        
                        // ★ 이전 행의 rowSpan에 포함되면 null 반환
                        if (rowInFM > 0 && isInMergedRange()) {
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
                            state={state}
                            setState={setState}
                            setDirty={setDirty}
                            setControlModal={setControlModal}
                            handleSODClick={handleSODClick}
                            setApModal={setApModal}
                          />
                        );
                      }
                      
                      // 다른 컬럼은 빈 셀로 렌더링
                      return (
                        <td 
                          key={colIdx} 
                          style={{
                            background: globalRowIdx % 2 === 0 ? col.cellColor : col.cellAltColor,
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
                      );
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
              const selectedValue = selectedValues[0];
              // ★ 고유 키: fmId-fcId 조합 사용 (없으면 rowIndex 폴백)
              const uniqueKey = controlModal.fmId && controlModal.fcId 
                ? `${controlModal.fmId}-${controlModal.fcId}` 
                : String(controlModal.rowIndex);
              const key = `${controlModal.type}-${uniqueKey}`;
              
              // ✅ 예방관리(PC) 자동연결: 동일한 고장원인에 동일한 예방관리 자동 연결
              // ⚠️ 예방관리개선(prevention-opt)은 자동연결하지 않음
              let autoLinkedCount = 0;
              let currentFcText = '';
              const currentFcId = controlModal.fcId || '';
              
              if (controlModal.type === 'prevention' && failureLinks && processedFMGroups.length > 0) {
                // 현재 행의 고장원인 텍스트 찾기
                processedFMGroups.forEach((group) => {
                  group.rows.forEach((r) => {
                    if (r.fcId === currentFcId) {
                      currentFcText = r.fcText || '';
                    }
                  });
                });
                
                // 동일한 고장원인을 가진 다른 행들 찾기
                if (currentFcText) {
                  processedFMGroups.forEach((group) => {
                    group.rows.forEach((r) => {
                      // 현재 fcId가 아니고, 동일한 고장원인 텍스트를 가진 행
                      if (r.fcId !== currentFcId && r.fcText === currentFcText) {
                        const autoUniqueKey = `${group.fmId}-${r.fcId}`;
                        const autoKey = `${controlModal.type}-${autoUniqueKey}`;
                        const existingValue = state?.riskData?.[autoKey];
                        if (!existingValue || existingValue !== selectedValue) {
                          autoLinkedCount++;
                        }
                      }
                    });
                  });
                }
              }
              
              // 현재 행 저장 + 자동연결된 행들 저장 (예방관리 PC만)
              setState((prev: WorksheetState) => {
                const newRiskData = { ...(prev.riskData || {}) };
                
                // 현재 행 저장
                newRiskData[key] = selectedValue;
                
                // ✅ 자동연결 (예방관리 PC만)
                if (controlModal.type === 'prevention' && autoLinkedCount > 0 && currentFcText) {
                  processedFMGroups.forEach((group) => {
                    group.rows.forEach((r) => {
                      if (r.fcId !== currentFcId && r.fcText === currentFcText) {
                        const autoUniqueKey = `${group.fmId}-${r.fcId}`;
                        const autoKey = `${controlModal.type}-${autoUniqueKey}`;
                        const existingValue = prev.riskData?.[autoKey];
                        if (!existingValue || existingValue !== selectedValue) {
                          newRiskData[autoKey] = selectedValue;
                        }
                      }
                    });
                  });
                }
                
                return { ...prev, riskData: newRiskData };
              });
              
              // ✅ DB 저장 트리거
              if (setDirty) {
                setDirty(true);
                console.log(`[AllTabEmpty] ${controlModal.type} 저장 (키: ${key}) → DB 저장 트리거`);
              }
              
              // 자동연결 알림
              if (controlModal.type === 'prevention' && autoLinkedCount > 0 && currentFcText) {
                setTimeout(() => {
                  alert(`✨ 자동연결: 동일한 고장원인 "${currentFcText}"에 "${selectedValue}" 예방관리가 ${autoLinkedCount}건 자동 연결되었습니다.`);
                }, 100);
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
          singleSelect={true}
          currentValues={[(() => {
            const uniqueKey = controlModal.fmId && controlModal.fcId 
              ? `${controlModal.fmId}-${controlModal.fcId}` 
              : String(controlModal.rowIndex);
            return (state.riskData || {})[`${controlModal.type}-${uniqueKey}`] || '';
          })()].filter(Boolean).map(String)}
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
