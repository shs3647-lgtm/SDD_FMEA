/**
 * @file page.tsx
 * @description PFMEA 워크시트 메인 페이지
 * @version 1.0.0
 * @created 2025-12-26
 * @ref PRD-005-pfmea-worksheet.md
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { StepHeader } from './StepHeader';
import { WorksheetHeader } from './WorksheetHeader';
import { SAMPLE_HEADER, getInitialData } from './mock-data';
import type { PFMEAWorksheetRow, PFMEAHeader } from './types';

// Handsontable은 SSR 불가능하므로 dynamic import
const FMEAWorksheet = dynamic(
  () => import('./FMEAWorksheet').then((mod) => mod.FMEAWorksheet),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">워크시트 로딩중...</span>
        </div>
      </div>
    ),
  }
);

/** PFMEA 워크시트 페이지 */
export default function PFMEAWorksheetPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [header, setHeader] = useState<PFMEAHeader>(SAMPLE_HEADER);
  const [data, setData] = useState<PFMEAWorksheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 초기 데이터 로드
  useEffect(() => {
    // LocalStorage에서 데이터 로드 시도
    const savedData = localStorage.getItem('pfmea_worksheet_data');
    const savedHeader = localStorage.getItem('pfmea_worksheet_header');
    
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch {
        setData(getInitialData());
      }
    } else {
      setData(getInitialData());
    }
    
    if (savedHeader) {
      try {
        setHeader(JSON.parse(savedHeader));
      } catch {
        setHeader(SAMPLE_HEADER);
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // 데이터 변경 핸들러
  const handleDataChange = useCallback((newData: PFMEAWorksheetRow[]) => {
    setData(newData);
  }, []);
  
  // 헤더 변경 핸들러
  const handleHeaderChange = useCallback((newHeader: PFMEAHeader) => {
    setHeader(newHeader);
  }, []);
  
  // 저장 핸들러
  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('pfmea_worksheet_data', JSON.stringify(data));
      localStorage.setItem('pfmea_worksheet_header', JSON.stringify(header));
      localStorage.setItem('pfmea_worksheet_saved_at', new Date().toISOString());
      
      // 성공 피드백
      alert('✅ 워크시트가 저장되었습니다.');
    } catch (error) {
      console.error('저장 오류:', error);
      alert('❌ 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 새 행 추가
  const handleAddRow = () => {
    const newRow = getInitialData().slice(0, 1)[0]; // 빈 행 템플릿
    newRow.id = `row_${Date.now()}`;
    setData([...data, newRow]);
  };
  
  // Excel 내보내기
  const handleExport = () => {
    alert('📥 Excel 내보내기 기능은 곧 제공됩니다.');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">PFMEA 워크시트 로딩중...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full p-4 bg-slate-50">
      {/* 상단: 7단계 메뉴 */}
      <div className="flex items-center justify-between mb-4">
        <StepHeader currentStep={currentStep} onStepChange={setCurrentStep} />
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            + 행 추가
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
          >
            📥 Excel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? '저장중...' : '💾 저장'}
          </button>
        </div>
      </div>
      
      {/* 헤더 정보 */}
      <WorksheetHeader header={header} onChange={handleHeaderChange} />
      
      {/* 워크시트 영역 */}
      <div className="flex-1 min-h-0">
        <FMEAWorksheet
          data={data}
          onChange={handleDataChange}
          readOnly={false}
        />
      </div>
      
      {/* 하단 상태바 */}
      <div className="flex items-center justify-between mt-3 px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>총 {data.length}행</span>
          <span>|</span>
          <span>AP(H): {data.filter(r => r.ap === 'H').length}</span>
          <span>AP(M): {data.filter(r => r.ap === 'M').length}</span>
          <span>AP(L): {data.filter(r => r.ap === 'L').length}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>현재 단계: {currentStep > 0 ? `${currentStep}단계` : '고장연결'}</span>
          <span>|</span>
          <span>FMEA ID: {header.fmeaId}</span>
        </div>
      </div>
    </div>
  );
}

