/**
 * @file page.tsx
 * @description CP 기초정보 Excel Import 페이지 (모듈화 완료)
 * @updated 2026-01-13 - 3개 미리보기 탭 + 행별 수정/삭제/저장
 * @line-count ~500줄
 */

'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import CPTopNav from '@/components/layout/CPTopNav';
import { CPProject, ImportedData } from './types';
import { tw } from './constants';
import { useImportHandlers, useEditHandlers } from './hooks';
import { saveMasterDataset, loadActiveMasterDataset } from './utils/cp-master-api';
import PreviewTable from './components/PreviewTable';
import PreviewTabs from './components/PreviewTabs';
import ImportStatusBar from './components/ImportStatusBar';
import ImportMenuBar from './components/ImportMenuBar';

type PreviewTab = 'full' | 'group' | 'individual';

// 개별 항목 컬럼 매핑
const ITEM_COLUMN_MAP: Record<string, string> = {
  processName: 'processName', processDesc: 'processDesc', equipment: 'equipment',
  productChar: 'productChar', processChar: 'processChar', spec: 'spec',
  evalMethod: 'evalMethod', sampleSize: 'sampleSize', frequency: 'frequency',
  reactionPlanItem: 'reactionPlan', ep: 'ep', autoDetector: 'autoDetector',
};

// ★ itemCode 표준화 매핑 (PFMEA 벤치마킹: A1~A7, B1~B10)
// 파싱 단계에서부터 표준화하여 일관성 보장
const STANDARDIZE_ITEM_CODE: Record<string, string> = {
  'processNo': 'A1',      // 공정번호
  'processName': 'A2',    // 공정명
  'level': 'A3',          // 레벨
  'processDesc': 'A4',    // 공정설명
  'equipment': 'A5',      // 설비
  'ep': 'A6',             // EP
  'autoDetector': 'A7',   // 자동검출
  'productChar': 'B1',    // 제품특성
  'processChar': 'B2',    // 공정특성
  'specialChar': 'B3',    // 특별특성
  'spec': 'B4',           // 규격
  'evalMethod': 'B5',     // 평가방법
  'sampleSize': 'B6',     // 샘플크기
  'frequency': 'B7',      // 빈도
  'owner1': 'B8',         // 책임자1
  'owner2': 'B9',         // 책임자2
  'reactionPlan': 'B10',  // 대응계획
};

// itemCode 표준화 헬퍼 함수
const standardizeItemCode = (itemCode: string): string => {
  return STANDARDIZE_ITEM_CODE[itemCode] || itemCode;
};

function CPImportPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idFromUrl = searchParams.get('id');
  
  // 상태 관리
  const [cpList, setCpList] = useState<CPProject[]>([]);
  const [selectedCpId, setSelectedCpId] = useState<string>(idFromUrl || '');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState('processInfo');
  const [selectedItem, setSelectedItem] = useState('processName');
  const [activeTab, setActiveTab] = useState<PreviewTab>('individual');  // 개별항목 기본
  
  // 마스터 데이터셋 상태 (DB 저장용)
  const [masterDatasetId, setMasterDatasetId] = useState<string | null>(null);
  const [masterDatasetName, setMasterDatasetName] = useState<string>('MASTER');
  
  // ===== 3개 데이터 저장소 =====
  const [fullData, setFullData] = useState<ImportedData[]>([]);
  const [groupData, setGroupData] = useState<ImportedData[]>([]);
  const [itemData, setItemData] = useState<ImportedData[]>([]);
  
  // ===== 전체 Import 상태 =====
  const [fullFileName, setFullFileName] = useState<string>('');
  const [fullPendingData, setFullPendingData] = useState<ImportedData[]>([]);
  const [isFullParsing, setIsFullParsing] = useState(false);
  const [isFullImporting, setIsFullImporting] = useState(false);
  const [fullImportSuccess, setFullImportSuccess] = useState(false);
  const fullFileInputRef = useRef<HTMLInputElement>(null);
  
  // ===== 그룹 시트 Import 상태 =====
  const [groupFileName, setGroupFileName] = useState<string>('');
  const [groupPendingData, setGroupPendingData] = useState<ImportedData[]>([]);
  const [isGroupParsing, setIsGroupParsing] = useState(false);
  const [isGroupImporting, setIsGroupImporting] = useState(false);
  const [groupImportSuccess, setGroupImportSuccess] = useState(false);
  const groupFileInputRef = useRef<HTMLInputElement>(null);
  
  // ===== 개별 항목 Import 상태 =====
  const [itemFileName, setItemFileName] = useState<string>('');
  const [itemPendingData, setItemPendingData] = useState<ImportedData[]>([]);
  const [isItemParsing, setIsItemParsing] = useState(false);
  const [isItemImporting, setIsItemImporting] = useState(false);
  const [itemImportSuccess, setItemImportSuccess] = useState(false);
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  // 편집 핸들러 훅
  const {
    editingRowId,
    editValues,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleDelete,
    handleCellChange,
  } = useEditHandlers({
    fullData,
    groupData,
    itemData,
    setFullData,
    setGroupData,
    setItemData,
  });

  // 핸들러 훅
  const {
    downloadFullTemplate, downloadFullSampleTemplate,
    downloadGroupSheetTemplate, downloadGroupSheetSampleTemplate,
    downloadItemTemplate, downloadItemSampleTemplate,
    handleColumnClick, handleRowSelect,
  } = useImportHandlers({
    selectedCpId, flatData: fullData, setFlatData: setFullData,
    pendingData: fullPendingData, setPendingData: setFullPendingData,
    selectedRows, setSelectedRows, selectedColumn, setSelectedColumn,
    setIsSaving, setIsSaved,
    setIsImporting: setIsFullImporting, setImportSuccess: setFullImportSuccess,
    setFileName: setFullFileName, setIsParsing: setIsFullParsing,
    selectedSheet,
  });

  // CP 목록 로드
  useEffect(() => {
    const stored = localStorage.getItem('cp-projects');
    if (stored) {
      try {
        const projects: CPProject[] = JSON.parse(stored);
        setCpList(projects);
        if (idFromUrl) setSelectedCpId(idFromUrl);
        else if (!selectedCpId && projects.length > 0) setSelectedCpId(projects[0].id);
      } catch (e) { console.error('CP 목록 로드 실패:', e); }
    }
  }, [idFromUrl, selectedCpId]);

  // ===== 개별항목 Excel 파싱 (실제 구현) =====
  const handleItemFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setItemFileName(file.name);
    setIsItemParsing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('시트를 찾을 수 없습니다');
      
      const parsedData: ImportedData[] = [];
      const itemCode = ITEM_COLUMN_MAP[selectedItem] || selectedItem;
      
      // 3행부터 데이터 읽기 (1행: 헤더, 2행: 안내)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return; // 헤더/안내 행 스킵
        
        const processNo = String(row.getCell(1).value || '').trim();
        const value = String(row.getCell(2).value || '').trim();
        
        if (processNo && value) {
          // 공정번호 데이터 (표준화: A1)
          parsedData.push({
            id: `i-${rowNumber}-1`,
            processNo,
            category: 'individual',
            itemCode: standardizeItemCode('processNo'), // A1
            value: processNo,
            createdAt: new Date(),
          });
          // 개별 항목 데이터 (표준화)
          parsedData.push({
            id: `i-${rowNumber}-2`,
            processNo,
            category: 'individual',
            itemCode: standardizeItemCode(itemCode), // A2, A4, B1 등
            value,
            createdAt: new Date(),
          });
        }
      });
      
      setItemPendingData(parsedData);
      console.log('✅ 개별항목 파싱 완료:', parsedData.length, '건');
    } catch (error) {
      console.error('❌ Excel 파싱 실패:', error);
      alert('Excel 파일을 읽는데 실패했습니다.');
    } finally {
      setIsItemParsing(false);
    }
  };

  // 전체 파일 선택 - 모든 시트의 모든 행과 열 데이터 파싱
  const handleFullFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFullFileName(file.name);
    setIsFullParsing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const parsedData: ImportedData[] = [];
      
      // 시트명과 itemCode 매핑 (표준화된 itemCode 사용)
      const sheetMapping: Record<string, { category: string; headers: string[]; itemCodes: string[] }> = {
        '공정현황': {
          category: 'processInfo',
          headers: ['공정번호', '공정명', '레벨', '공정설명', '설비/금형/지그'],
          itemCodes: ['A1', 'A2', 'A3', 'A4', 'A5'], // 표준화된 itemCode
        },
        '검출장치': {
          category: 'detector',
          headers: ['공정번호', '공정명', 'EP', '자동검사장치'],
          itemCodes: ['A1', 'A2', 'A6', 'A7'], // 표준화된 itemCode
        },
        '관리항목': {
          category: 'controlItem',
          headers: ['공정번호', '공정명', '제품특성', '공정특성', '특별특성', '스펙/공차'],
          itemCodes: ['A1', 'A2', 'B1', 'B2', 'B3', 'B4'], // 표준화된 itemCode
        },
        '관리방법': {
          category: 'controlMethod',
          headers: ['공정번호', '공정명', '평가방법', '샘플크기', '주기', '책임1', '책임2'],
          itemCodes: ['A1', 'A2', 'B5', 'B6', 'B7', 'B8', 'B9'], // 표준화된 itemCode
        },
        '대응계획': {
          category: 'reactionPlan',
          headers: ['공정번호', '공정명', '제품특성', '공정특성', '대응계획'],
          itemCodes: ['A1', 'A2', 'B1', 'B2', 'B10'], // 표준화된 itemCode
        },
      };
      
      // 모든 시트 순회
      workbook.worksheets.forEach((worksheet, sheetIdx) => {
        const sheetName = worksheet.name;
        const mapping = sheetMapping[sheetName];
        
        if (!mapping) {
          console.warn(`⚠️ 알 수 없는 시트: ${sheetName}`);
          return;
        }
        
        console.log(`📋 시트 "${sheetName}" 파싱 시작...`);
        let rowCount = 0;
        
        // 3행부터 데이터 읽기 (1행: 헤더, 2행: 안내)
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber <= 2) return; // 헤더/안내 행 스킵
          
          // 공정번호와 공정명 추출 (첫 번째, 두 번째 컬럼)
          const processNo = String(row.getCell(1).value || '').trim();
          const processName = String(row.getCell(2).value || '').trim();
          
          // 공정번호가 없으면 스킵
          if (!processNo) return;
          
          rowCount++;
          
          // 모든 컬럼 데이터 추출 (빈 값도 포함)
          mapping.headers.forEach((header, colIdx) => {
            const itemCode = mapping.itemCodes[colIdx];
            const cell = row.getCell(colIdx + 1);
            let value = '';
            
            // 셀 값 추출 (다양한 타입 처리)
            if (cell.value !== null && cell.value !== undefined) {
              if (typeof cell.value === 'object' && 'text' in cell.value) {
                value = String(cell.value.text || '').trim();
              } else if (typeof cell.value === 'object' && 'result' in cell.value) {
                value = String(cell.value.result || '').trim();
              } else {
                value = String(cell.value || '').trim();
              }
            }
            
            // 모든 컬럼 데이터 추가 (빈 값도 포함하여 모든 데이터 추출)
            parsedData.push({
              id: `full-${sheetIdx}-${rowNumber}-${colIdx}`,
              processNo,
              processName: itemCode === 'processName' ? value : processName || '',
              category: mapping.category,
              itemCode,
              value,
              createdAt: new Date(),
            });
          });
        });
        
        console.log(`✅ 시트 "${sheetName}": ${rowCount}개 행 파싱 완료`);
      });
      
      setFullPendingData(parsedData);
      console.log('✅ 전체 Import 파싱 완료:', parsedData.length, '건');
    } catch (error) {
      console.error('❌ Excel 파싱 실패:', error);
      alert('Excel 파일을 읽는데 실패했습니다.');
    } finally {
      setIsFullParsing(false);
    }
  };
  
  // 그룹 시트 파일 선택 - 선택된 시트의 모든 행과 열 데이터 파싱
  const handleGroupFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setGroupFileName(file.name);
    setIsGroupParsing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const parsedData: ImportedData[] = [];
      
      // 선택된 시트의 매핑 정보
      const sheetMapping: Record<string, { category: string; headers: string[]; itemCodes: string[] }> = {
        'processInfo': {
          category: 'processInfo',
          headers: ['공정번호', '공정명', '레벨', '공정설명', '설비/금형/지그'],
          itemCodes: ['processNo', 'processName', 'level', 'processDesc', 'equipment'],
        },
        'detector': {
          category: 'detector',
          headers: ['공정번호', '공정명', 'EP', '자동검사장치'],
          itemCodes: ['processNo', 'processName', 'ep', 'autoDetector'],
        },
        'controlItem': {
          category: 'controlItem',
          headers: ['공정번호', '공정명', '제품특성', '공정특성', '특별특성', '스펙/공차'],
          itemCodes: ['processNo', 'processName', 'productChar', 'processChar', 'specialChar', 'spec'],
        },
        'controlMethod': {
          category: 'controlMethod',
          headers: ['공정번호', '공정명', '평가방법', '샘플크기', '주기', '책임1', '책임2'],
          itemCodes: ['processNo', 'processName', 'evalMethod', 'sampleSize', 'frequency', 'owner1', 'owner2'],
        },
        'reactionPlan': {
          category: 'reactionPlan',
          headers: ['공정번호', '공정명', '제품특성', '공정특성', '대응계획'],
          itemCodes: ['processNo', 'processName', 'productChar', 'processChar', 'reactionPlan'],
        },
      };
      
      // 시트명 매핑 (selectedSheet 값 → 실제 시트명)
      const sheetNameMap: Record<string, string> = {
        'processInfo': '공정현황',
        'detector': '검출장치',
        'controlItem': '관리항목',
        'controlMethod': '관리방법',
        'reactionPlan': '대응계획',
      };
      
      const targetSheetName = sheetNameMap[selectedSheet];
      const mapping = sheetMapping[selectedSheet];
      
      if (!targetSheetName || !mapping) {
        alert(`알 수 없는 시트: ${selectedSheet}`);
        setIsGroupParsing(false);
        return;
      }
      
      // 해당 시트 찾기
      const worksheet = workbook.worksheets.find(ws => ws.name === targetSheetName);
      
      if (!worksheet) {
        alert(`시트 "${targetSheetName}"를 찾을 수 없습니다.`);
        setIsGroupParsing(false);
        return;
      }
      
      console.log(`📋 시트 "${targetSheetName}" 파싱 시작...`);
      let rowCount = 0;
      
      // 3행부터 데이터 읽기 (1행: 헤더, 2행: 안내)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return; // 헤더/안내 행 스킵
        
        // 공정번호와 공정명 추출 (첫 번째, 두 번째 컬럼)
        const processNo = String(row.getCell(1).value || '').trim();
        const processName = String(row.getCell(2).value || '').trim();
        
        // 공정번호가 없으면 스킵
        if (!processNo) return;
        
        rowCount++;
        
        // 모든 컬럼 데이터 추출 (빈 값도 포함)
        mapping.headers.forEach((header, colIdx) => {
          const itemCode = mapping.itemCodes[colIdx];
          const cell = row.getCell(colIdx + 1);
          let value = '';
          
          // 셀 값 추출 (다양한 타입 처리)
          if (cell.value !== null && cell.value !== undefined) {
            if (typeof cell.value === 'object' && 'text' in cell.value) {
              value = String(cell.value.text || '').trim();
            } else if (typeof cell.value === 'object' && 'result' in cell.value) {
              value = String(cell.value.result || '').trim();
            } else {
              value = String(cell.value || '').trim();
            }
          }
          
          // 모든 컬럼 데이터 추가 (빈 값도 포함하여 모든 데이터 추출)
          // ★ itemCode 표준화 적용
          const standardizedItemCode = standardizeItemCode(itemCode);
          parsedData.push({
            id: `group-${selectedSheet}-${rowNumber}-${colIdx}`,
            processNo,
            processName: standardizedItemCode === 'A2' ? value : processName || '', // A2 = 공정명
            category: mapping.category,
            itemCode: standardizedItemCode, // 표준화된 itemCode (A1, A2, A3 등)
            value,
            createdAt: new Date(),
          });
        });
      });
      
      setGroupPendingData(parsedData);
      console.log(`✅ 그룹 시트 "${targetSheetName}" 파싱 완료: ${rowCount}개 행, ${parsedData.length}건`);
    } catch (error) {
      console.error('❌ Excel 파싱 실패:', error);
      alert('Excel 파일을 읽는데 실패했습니다.');
    } finally {
      setIsGroupParsing(false);
    }
  };
  
  // ===== Import 실행 =====
  const handleFullImport = () => {
    if (fullPendingData.length === 0) return;
    setIsFullImporting(true);
    setTimeout(() => {
      setFullData(prev => [...prev, ...fullPendingData]);
      setFullPendingData([]);
      setIsFullImporting(false);
      setFullImportSuccess(true);
      setActiveTab('full');
      setTimeout(() => setFullImportSuccess(false), 3000);
    }, 300);
  };
  
  const handleGroupImport = () => {
    if (groupPendingData.length === 0) return;
    setIsGroupImporting(true);
    setTimeout(() => {
      setGroupData(prev => [...prev, ...groupPendingData]);
      setGroupPendingData([]);
      setIsGroupImporting(false);
      setGroupImportSuccess(true);
      setActiveTab('group');
      setTimeout(() => setGroupImportSuccess(false), 3000);
    }, 300);
  };
  
  const handleItemImport = () => {
    if (itemPendingData.length === 0) return;
    setIsItemImporting(true);
    setTimeout(() => {
      setItemData(prev => [...prev, ...itemPendingData]);
      setItemPendingData([]);
      setIsItemImporting(false);
      setItemImportSuccess(true);
      setActiveTab('individual');
      setTimeout(() => setItemImportSuccess(false), 3000);
    }, 300);
  };

  // ===== 전체 저장 =====
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. localStorage 저장 (기존 방식 유지)
      const key = `cp-import-data-${selectedCpId}`;
      localStorage.setItem(key, JSON.stringify({ full: fullData, group: groupData, item: itemData }));
      
      // 2. DB 저장 (모든 데이터를 flat 형식으로 변환)
      // ★ itemCode는 이미 파싱 단계에서 표준화되었으므로 그대로 사용
      const allData = [...fullData, ...groupData, ...itemData];
      const flatData = allData.map(d => ({
        id: d.id,
        processNo: d.processNo,
        category: d.category,
        itemCode: d.itemCode, // 이미 표준화됨 (A1, A2, A3 등)
        value: d.value,
        createdAt: d.createdAt,
      }));
      
      console.log('📤 CP DB 저장:', {
        totalItems: flatData.length,
        processCount: new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo)).size,
        processNameCount: flatData.filter(d => d.itemCode === 'A2').length,
      });
      
      const res = await saveMasterDataset({
        datasetId: masterDatasetId,
        name: masterDatasetName || 'MASTER',
        setActive: true,
        replace: true,
        flatData,
      });
      
      if (!res.ok) {
        console.warn('[CP Import] DB master save failed (localStorage kept)');
        alert('⚠️ DB 저장 실패! 로컬에만 저장되었습니다.');
      } else {
        if (res.datasetId) setMasterDatasetId(res.datasetId);
        console.log('✅ CP DB 저장 완료:', flatData.length, '건');
      }
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 통계
  const stats = {
    full: [...new Set(fullData.map(d => d.processNo))].length,
    group: [...new Set(groupData.map(d => d.processNo))].length,
    item: [...new Set(itemData.map(d => d.processNo))].length,
  };

  // 전체 선택 핸들러
  const handleSelectAll = useCallback((processNos: string[]) => {
    setSelectedRows(processNos.length > 0 ? new Set(processNos) : new Set());
  }, [setSelectedRows]);

  return (
    <>
      <CPTopNav selectedCpId={selectedCpId} />
      
      <div className="h-screen overflow-hidden bg-[#f5f7fa] px-4 py-2 pt-9 font-[Malgun_Gothic] flex flex-col">
        {/* 헤더 - 고정 크기 */}
        <div className="flex items-center justify-between mb-2 bg-white px-2 py-1 rounded border border-gray-300 w-[1414px] min-w-[1414px] max-w-[1414px] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">📥</span>
            <h1 className="text-sm font-bold text-gray-800">Control Plan 기초정보 Import</h1>
            <span className="text-xs text-gray-500">(CP No: {selectedCpId || '-'})</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveAll} disabled={isSaving || (fullData.length === 0 && groupData.length === 0 && itemData.length === 0)} 
              className={`${isSaved ? tw.btnSuccess : (fullData.length === 0 && groupData.length === 0 && itemData.length === 0) ? tw.btnSuccessDisabled : tw.btnGreen}`}>
              {isSaved ? '✓ 저장완료' : '💾 전체저장'}
            </button>
            <button onClick={() => router.push('/control-plan/list')} className={tw.btnPrimary}>← 목록</button>
          </div>
        </div>

        {/* 3행 입력 영역 */}
        <ImportMenuBar
          selectedCpId={selectedCpId}
          cpList={cpList}
          onCpChange={setSelectedCpId}
          downloadFullTemplate={downloadFullTemplate}
          downloadFullSampleTemplate={downloadFullSampleTemplate}
          fullFileInputRef={fullFileInputRef}
          fullFileName={fullFileName}
          onFullFileSelect={handleFullFileSelect}
          onFullImport={handleFullImport}
          fullPendingCount={fullPendingData.length}
          isFullParsing={isFullParsing}
          isFullImporting={isFullImporting}
          fullImportSuccess={fullImportSuccess}
          fullDataCount={fullData.length}
          selectedSheet={selectedSheet}
          onSheetChange={setSelectedSheet}
          downloadGroupSheetTemplate={downloadGroupSheetTemplate}
          downloadGroupSheetSampleTemplate={downloadGroupSheetSampleTemplate}
          groupFileInputRef={groupFileInputRef}
          groupFileName={groupFileName}
          onGroupFileSelect={handleGroupFileSelect}
          onGroupImport={handleGroupImport}
          groupPendingCount={groupPendingData.length}
          isGroupParsing={isGroupParsing}
          isGroupImporting={isGroupImporting}
          groupImportSuccess={groupImportSuccess}
          groupDataCount={groupData.length}
          selectedItem={selectedItem}
          onItemChange={setSelectedItem}
          downloadItemTemplate={downloadItemTemplate}
          downloadItemSampleTemplate={downloadItemSampleTemplate}
          itemFileInputRef={itemFileInputRef}
          itemFileName={itemFileName}
          onItemFileSelect={handleItemFileSelect}
          onItemImport={handleItemImport}
          itemPendingCount={itemPendingData.length}
          isItemParsing={isItemParsing}
          isItemImporting={isItemImporting}
          itemImportSuccess={itemImportSuccess}
          itemDataCount={itemData.length}
        />

        {/* 미리보기 탭 */}
        <PreviewTabs activeTab={activeTab} onTabChange={setActiveTab} stats={stats} />

        {/* 미리보기 테이블 */}
        <div 
          id="cp-import-scroll-container" 
          className={`bg-white border-2 overflow-x-auto overflow-y-auto relative w-full flex-1 ${activeTab === 'full' ? 'border-teal-500' : activeTab === 'group' ? 'border-blue-500' : 'border-orange-500'}`}
        >
          {activeTab === 'full' && (
            <PreviewTable
              data={fullData}
              tab="full"
              selectedRows={selectedRows}
              selectedColumn={selectedColumn}
              editingRowId={editingRowId}
              editValues={editValues}
              onRowSelect={handleRowSelect}
              onColumnClick={handleColumnClick}
              onEditStart={handleEditStart}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
              onDelete={handleDelete}
              onCellChange={handleCellChange}
              onSelectAll={handleSelectAll}
            />
          )}
          {activeTab === 'group' && (
            <PreviewTable
              data={groupData}
              tab="group"
              selectedRows={selectedRows}
              selectedColumn={selectedColumn}
              editingRowId={editingRowId}
              editValues={editValues}
              onRowSelect={handleRowSelect}
              onColumnClick={handleColumnClick}
              onEditStart={handleEditStart}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
              onDelete={handleDelete}
              onCellChange={handleCellChange}
              onSelectAll={handleSelectAll}
            />
          )}
          {activeTab === 'individual' && (
            <PreviewTable
              data={itemData}
              tab="individual"
              selectedRows={selectedRows}
              selectedColumn={selectedColumn}
              editingRowId={editingRowId}
              editValues={editValues}
              onRowSelect={handleRowSelect}
              onColumnClick={handleColumnClick}
              onEditStart={handleEditStart}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
              onDelete={handleDelete}
              onCellChange={handleCellChange}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>

        {/* 하단 상태바 */}
        <ImportStatusBar stats={stats} />
      </div>
    </>
  );
}

export default function CPImportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">로딩 중...</div>}>
      <CPImportPageContent />
    </Suspense>
  );
}
