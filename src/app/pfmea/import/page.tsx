/**
 * @file page.tsx
 * @description PFMEA 기초정보 Excel Import 메인 페이지
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 디자인 시스템 표준화 적용
 * 
 * 테이블 디자인 (design-tokens.ts 참조):
 * - 헤더: #00587a (진한 남청색) + 흰색 글자
 * - 첫 번째 열: #00587a + 흰색 글자
 * - 데이터 행: 흰색 배경 / 짝수행: #e0f2fb
 * - 테두리: 1px solid #999
 * - 행높이: 28px, 글씨: 11px
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronUp, ChevronDown, Save, Upload, CheckCircle } from 'lucide-react';
import PFMEATopNav from '@/components/layout/PFMEATopNav';
import { COLORS, SIZES, TABLE_STYLES, BUTTON_STYLES, LAYOUT_STYLES } from '@/styles/design-tokens';
import { ImportedFlatData } from './types';
import { parseMultiSheetExcel, ParseResult } from './excel-parser';
import { 
  downloadEmptyTemplate, 
  downloadSampleTemplate,
  downloadRelationAEmpty,
  downloadRelationASample,
  downloadRelationBEmpty,
  downloadRelationBSample,
  downloadRelationCEmpty,
  downloadRelationCSample,
} from './excel-template';

// 샘플 데이터 20행 (PFMEA기초정보입력.xlsx 기반)
const SAMPLE_DATA: ImportedFlatData[] = [
  // 공정 10 - 입고검사
  { id: '10-A1', processNo: '10', category: 'A', itemCode: 'A1', value: '10', createdAt: new Date() },
  { id: '10-A2', processNo: '10', category: 'A', itemCode: 'A2', value: '입고검사', createdAt: new Date() },
  { id: '10-A3', processNo: '10', category: 'A', itemCode: 'A3', value: '원자재 품질 검사', createdAt: new Date() },
  { id: '10-A4', processNo: '10', category: 'A', itemCode: 'A4', value: '외관, 치수, 재질', createdAt: new Date() },
  { id: '10-A5', processNo: '10', category: 'A', itemCode: 'A5', value: '불량품 입고', createdAt: new Date() },
  { id: '10-A6', processNo: '10', category: 'A', itemCode: 'A6', value: '수입검사 체크시트', createdAt: new Date() },
  { id: '10-B1', processNo: '10', category: 'B', itemCode: 'B1', value: '측정기, 검사대', createdAt: new Date() },
  { id: '10-B2', processNo: '10', category: 'B', itemCode: 'B2', value: '치수측정, 외관검사', createdAt: new Date() },
  { id: '10-B3', processNo: '10', category: 'B', itemCode: 'B3', value: '검사정밀도', createdAt: new Date() },
  { id: '10-B4', processNo: '10', category: 'B', itemCode: 'B4', value: '검사누락, 오판정', createdAt: new Date() },
  { id: '10-B5', processNo: '10', category: 'B', itemCode: 'B5', value: '검사교육, 체크시트', createdAt: new Date() },
  // 공정 20 - 전처리
  { id: '20-A1', processNo: '20', category: 'A', itemCode: 'A1', value: '20', createdAt: new Date() },
  { id: '20-A2', processNo: '20', category: 'A', itemCode: 'A2', value: '전처리', createdAt: new Date() },
  { id: '20-A3', processNo: '20', category: 'A', itemCode: 'A3', value: '표면 세척 및 탈지', createdAt: new Date() },
  { id: '20-A4', processNo: '20', category: 'A', itemCode: 'A4', value: '청정도, 탈지율', createdAt: new Date() },
  { id: '20-A5', processNo: '20', category: 'A', itemCode: 'A5', value: '잔류이물, 탈지불량', createdAt: new Date() },
  { id: '20-A6', processNo: '20', category: 'A', itemCode: 'A6', value: '청정도 측정', createdAt: new Date() },
  { id: '20-B1', processNo: '20', category: 'B', itemCode: 'B1', value: '세척기, 탈지조', createdAt: new Date() },
  { id: '20-B2', processNo: '20', category: 'B', itemCode: 'B2', value: '세척, 탈지', createdAt: new Date() },
  { id: '20-B3', processNo: '20', category: 'B', itemCode: 'B3', value: '온도, 농도, 시간', createdAt: new Date() },
  { id: '20-B4', processNo: '20', category: 'B', itemCode: 'B4', value: '온도편차, 농도부족', createdAt: new Date() },
  { id: '20-B5', processNo: '20', category: 'B', itemCode: 'B5', value: '정기점검, 농도관리', createdAt: new Date() },
  // 공정 30 - 가공
  { id: '30-A1', processNo: '30', category: 'A', itemCode: 'A1', value: '30', createdAt: new Date() },
  { id: '30-A2', processNo: '30', category: 'A', itemCode: 'A2', value: '가공', createdAt: new Date() },
  { id: '30-A3', processNo: '30', category: 'A', itemCode: 'A3', value: 'CNC 절삭가공', createdAt: new Date() },
  { id: '30-A4', processNo: '30', category: 'A', itemCode: 'A4', value: '치수정밀도, 표면조도', createdAt: new Date() },
  { id: '30-A5', processNo: '30', category: 'A', itemCode: 'A5', value: '치수불량, 조도불량', createdAt: new Date() },
  { id: '30-A6', processNo: '30', category: 'A', itemCode: 'A6', value: '초중종품검사', createdAt: new Date() },
  { id: '30-B1', processNo: '30', category: 'B', itemCode: 'B1', value: 'CNC선반, 공구', createdAt: new Date() },
  { id: '30-B2', processNo: '30', category: 'B', itemCode: 'B2', value: '절삭, 가공', createdAt: new Date() },
  { id: '30-B3', processNo: '30', category: 'B', itemCode: 'B3', value: '이송속도, 절삭깊이', createdAt: new Date() },
  { id: '30-B4', processNo: '30', category: 'B', itemCode: 'B4', value: '공구마모, 셋팅오류', createdAt: new Date() },
  { id: '30-B5', processNo: '30', category: 'B', itemCode: 'B5', value: '공구교환주기, TPM', createdAt: new Date() },
  // 공정 40 - 열처리
  { id: '40-A1', processNo: '40', category: 'A', itemCode: 'A1', value: '40', createdAt: new Date() },
  { id: '40-A2', processNo: '40', category: 'A', itemCode: 'A2', value: '열처리', createdAt: new Date() },
  { id: '40-A3', processNo: '40', category: 'A', itemCode: 'A3', value: '담금질/뜨임', createdAt: new Date() },
  { id: '40-A4', processNo: '40', category: 'A', itemCode: 'A4', value: '경도, 조직', createdAt: new Date() },
  { id: '40-A5', processNo: '40', category: 'A', itemCode: 'A5', value: '경도미달, 변형', createdAt: new Date() },
  { id: '40-A6', processNo: '40', category: 'A', itemCode: 'A6', value: '경도검사, 조직검사', createdAt: new Date() },
  { id: '40-B1', processNo: '40', category: 'B', itemCode: 'B1', value: '열처리로, 냉각조', createdAt: new Date() },
  { id: '40-B2', processNo: '40', category: 'B', itemCode: 'B2', value: '가열, 냉각', createdAt: new Date() },
  { id: '40-B3', processNo: '40', category: 'B', itemCode: 'B3', value: '온도, 시간, 냉각속도', createdAt: new Date() },
  { id: '40-B4', processNo: '40', category: 'B', itemCode: 'B4', value: '온도이탈, 시간부족', createdAt: new Date() },
  { id: '40-B5', processNo: '40', category: 'B', itemCode: 'B5', value: '온도모니터링, 정기교정', createdAt: new Date() },
  // 공정 50 - 조립
  { id: '50-A1', processNo: '50', category: 'A', itemCode: 'A1', value: '50', createdAt: new Date() },
  { id: '50-A2', processNo: '50', category: 'A', itemCode: 'A2', value: '조립', createdAt: new Date() },
  { id: '50-A3', processNo: '50', category: 'A', itemCode: 'A3', value: '부품결합/체결', createdAt: new Date() },
  { id: '50-A4', processNo: '50', category: 'A', itemCode: 'A4', value: '체결력, 위치정도', createdAt: new Date() },
  { id: '50-A5', processNo: '50', category: 'A', itemCode: 'A5', value: '미체결, 오조립', createdAt: new Date() },
  { id: '50-A6', processNo: '50', category: 'A', itemCode: 'A6', value: '토크검사, 외관검사', createdAt: new Date() },
  { id: '50-B1', processNo: '50', category: 'B', itemCode: 'B1', value: '토크렌치, 지그', createdAt: new Date() },
  { id: '50-B2', processNo: '50', category: 'B', itemCode: 'B2', value: '체결, 정렬', createdAt: new Date() },
  { id: '50-B3', processNo: '50', category: 'B', itemCode: 'B3', value: '토크값, 체결순서', createdAt: new Date() },
  { id: '50-B4', processNo: '50', category: 'B', itemCode: 'B4', value: '토크부족, 순서누락', createdAt: new Date() },
  { id: '50-B5', processNo: '50', category: 'B', itemCode: 'B5', value: '작업표준서, 포카요케', createdAt: new Date() },
  // 완제품 정보
  { id: 'C1-1', processNo: 'ALL', category: 'C', itemCode: 'C1', value: 'YOUR PLANT', createdAt: new Date() },
  { id: 'C2-1', processNo: 'ALL', category: 'C', itemCode: 'C2', value: '동력전달', createdAt: new Date() },
  { id: 'C3-1', processNo: 'ALL', category: 'C', itemCode: 'C3', value: '내구성 10만km', createdAt: new Date() },
  { id: 'C4-1', processNo: 'ALL', category: 'C', itemCode: 'C4', value: '차량정지, 안전사고', createdAt: new Date() },
];

// 드롭다운 항목
const PREVIEW_OPTIONS = [
  { value: 'A1', label: 'A1 공정번호' },
  { value: 'A2', label: 'A2 공정명' },
  { value: 'A3', label: 'A3 공정기능' },
  { value: 'A4', label: 'A4 제품특성' },
  { value: 'A5', label: 'A5 고장형태' },
  { value: 'A6', label: 'A6 검출관리' },
  { value: 'B1', label: 'B1 작업요소' },
  { value: 'B2', label: 'B2 요소기능' },
  { value: 'B3', label: 'B3 공정특성' },
  { value: 'B4', label: 'B4 고장원인' },
  { value: 'B5', label: 'B5 예방관리' },
  { value: 'C1', label: 'C1 구분' },  // YOUR PLANT, SHIP TO PLANT, USER
  { value: 'C2', label: 'C2 제품기능' },
  { value: 'C3', label: 'C3 요구사항' },
  { value: 'C4', label: 'C4 고장영향' },
];

// FMEA 프로젝트 타입
interface FMEAProject {
  id: string;
  fmeaInfo?: {
    subject?: string;
  };
  project?: {
    productName?: string;
  };
}

export default function PFMEAImportPage() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id');
  
  // FMEA 선택 상태
  const [fmeaList, setFmeaList] = useState<FMEAProject[]>([]);
  const [selectedFmeaId, setSelectedFmeaId] = useState<string>(idFromUrl || '');
  
  // 상태 관리 - 빈 배열로 초기화 (저장된 데이터 우선 로드)
  const [importType, setImportType] = useState<'full' | 'partial'>('full');
  const [fileName, setFileName] = useState<string>('');
  const [flatData, setFlatData] = useState<ImportedFlatData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // 데이터 로드 완료 여부
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  
  // Import 상태
  const [pendingData, setPendingData] = useState<ImportedFlatData[]>([]); // 파싱된 데이터 임시 저장
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // 좌측 미리보기
  const [previewColumn, setPreviewColumn] = useState('A2');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // 우측 관계형 탭
  const [relationTab, setRelationTab] = useState<'A' | 'B' | 'C'>('A');
  
  // 개별 입포트 상태
  const [partialItemCode, setPartialItemCode] = useState('A3'); // 개별 입포트할 항목 코드
  const [partialFileName, setPartialFileName] = useState<string>('');
  const [partialPendingData, setPartialPendingData] = useState<ImportedFlatData[]>([]);
  const [isPartialParsing, setIsPartialParsing] = useState(false);
  
  // 저장 상태
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);  // 데이터 변경 여부
  
  // 관계형 데이터 입포트
  const relationFileInputRef = useRef<HTMLInputElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const partialFileInputRef = useRef<HTMLInputElement>(null);

  // =====================================================
  // 삭제 및 드래그앤드랍 핸들러
  // =====================================================

  /** FMEA 기초정보 미리 보기 데이터 다운로드 */
  const handleDownloadPreview = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const selectedLabel = PREVIEW_OPTIONS.find(opt => opt.value === previewColumn)?.label || previewColumn;
    const sheet = workbook.addWorksheet(selectedLabel);
    
    // 헤더 설정
    sheet.columns = [
      { header: 'NO', key: 'no', width: 8 },
      { header: '공정번호', key: 'processNo', width: 12 },
      { header: selectedLabel.split(' ')[1] || selectedLabel, key: 'value', width: 40 },
    ];
    
    // 헤더 스타일 - 디자인 표준 적용
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '00587A' } };
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, name: '맑은 고딕', size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { 
        top: { style: 'thin', color: { argb: 'FFFFFF' } }, 
        left: { style: 'thin', color: { argb: 'FFFFFF' } }, 
        bottom: { style: 'thin', color: { argb: 'FFFFFF' } }, 
        right: { style: 'thin', color: { argb: 'FFFFFF' } } 
      };
    });
    
    // 데이터 추가 - 가로세로 중앙정렬
    const previewData = flatData.filter(d => d.itemCode === previewColumn);
    previewData.forEach((item, idx) => {
      const row = sheet.addRow({ no: idx + 1, processNo: item.processNo, value: item.value });
      row.eachCell((cell) => {
        cell.border = { 
          top: { style: 'thin', color: { argb: '999999' } }, 
          left: { style: 'thin', color: { argb: '999999' } }, 
          bottom: { style: 'thin', color: { argb: '999999' } }, 
          right: { style: 'thin', color: { argb: '999999' } } 
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: '맑은 고딕', size: 10 };
      });
    });
    
    // 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `입포트_${selectedLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** 전체 삭제 (선택된 항목 코드의 모든 데이터 삭제) */
  const handleAllDelete = () => {
    if (!confirm(`${previewColumn} 항목의 모든 데이터를 삭제하시겠습니까?`)) return;
    setFlatData(prev => prev.filter(d => d.itemCode !== previewColumn));
    setSelectedRows(new Set());
  };

  /** 선택 삭제 (체크된 행만 삭제) */
  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!confirm(`선택된 ${selectedRows.size}개 항목을 삭제하시겠습니까?`)) return;
    setFlatData(prev => prev.filter(d => !selectedRows.has(d.id)));
    setSelectedRows(new Set());
  };

  /** 행 선택/해제 토글 */
  const handleRowSelect = (id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  /** 드래그 시작 */
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  /** 드래그 오버 (드롭 허용) */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /** 드롭 (순서 변경) */
  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    // 선택된 항목 코드의 데이터만 추출
    const selectedData = flatData.filter(d => d.itemCode === previewColumn);
    const otherData = flatData.filter(d => d.itemCode !== previewColumn);
    
    // 순서 변경
    const newSelectedData = [...selectedData];
    const [draggedItem] = newSelectedData.splice(draggedIndex, 1);
    newSelectedData.splice(targetIndex, 0, draggedItem);
    
    // 전체 데이터 업데이트
    setFlatData([...otherData, ...newSelectedData]);
    setDraggedIndex(null);
  };

  /** 드래그 종료 */
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // =====================================================
  // 개별 입포트 핸들러
  // =====================================================

  /** 개별 입포트 파일 선택 */
  const handlePartialFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPartialFileName(file.name);
    setIsPartialParsing(true);
    
    try {
      // Excel 파일 읽기
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      // 선택한 항목 코드에 해당하는 시트 찾기
      const targetSheet = workbook.getWorksheet(partialItemCode);
      if (!targetSheet) {
        alert(`시트 "${partialItemCode}"를 찾을 수 없습니다.\n\n시트 이름이 "${partialItemCode}"인지 확인해주세요.`);
        setIsPartialParsing(false);
        return;
      }
      
      // 데이터 파싱
      const newData: ImportedFlatData[] = [];
      const category = partialItemCode.charAt(0) as 'A' | 'B' | 'C';
      
      // 2행 또는 3행부터 읽기 (1행이 헤더, 2행이 안내일 수 있음)
      const startRow = 2;
      
      for (let i = startRow; i <= targetSheet.rowCount; i++) {
        const row = targetSheet.getRow(i);
        const processNo = String(row.getCell(1).value || '').trim();
        
        // 2열부터 모든 값 읽기
        for (let col = 2; col <= Math.max(row.cellCount, 5); col++) {
          const value = String(row.getCell(col).value || '').trim();
          if (processNo && value) {
            newData.push({
              id: `${processNo}-${partialItemCode}-${i}-${col}`,
              processNo: category === 'C' ? 'ALL' : processNo,
              category,
              itemCode: partialItemCode,
              value,
              createdAt: new Date(),
            });
          }
        }
      }
      
      if (newData.length === 0) {
        alert('파싱된 데이터가 없습니다. Excel 파일 형식을 확인해주세요.\n\n1열: 공정번호, 2열~: 데이터');
        setIsPartialParsing(false);
        return;
      }
      
      setPartialPendingData(newData);
      console.log(`개별 입포트 파싱 완료: ${newData.length}건`);
    } catch (error) {
      console.error('개별 입포트 파싱 오류:', error);
      alert('파일 파싱 중 오류가 발생했습니다.');
    } finally {
      setIsPartialParsing(false);
    }
  };

  /** 개별 입포트 실행 */
  const handlePartialImport = () => {
    if (partialPendingData.length === 0) {
      alert('Import할 데이터가 없습니다. 먼저 Excel 파일을 선택해주세요.');
      return;
    }
    
    // 기존 데이터에서 해당 항목 코드의 데이터 제거 후 새 데이터 추가 (중복 방지)
    const otherData = flatData.filter(d => d.itemCode !== partialItemCode);
    const mergedData = [...otherData, ...partialPendingData];
    
    setFlatData(mergedData);
    setPartialPendingData([]);
    setPreviewColumn(partialItemCode); // 미리보기를 해당 항목으로 변경
    setIsSaved(false); // Import 후에는 저장 안 된 상태
    
    alert(`${partialItemCode} 항목 ${partialPendingData.length}건 Import 완료!`);
  };

  // =====================================================
  // 관계형 데이터 다운로드/입포트 핸들러
  // =====================================================

  /** 관계형 데이터 Excel 다운로드 */
  const handleRelationDownload = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      
      // 현재 선택된 탭에 따라 시트 생성
      const sheetName = relationTab === 'A' ? 'A_공정' : relationTab === 'B' ? 'B_작업요소' : 'C_완제품';
      const sheet = workbook.addWorksheet(sheetName);
      
      // 헤더 설정
      if (relationTab === 'A') {
        sheet.columns = [
          { header: 'A1 No', key: 'A1', width: 10 },
          { header: 'A2 공정명', key: 'A2', width: 15 },
          { header: 'A3 기능', key: 'A3', width: 20 },
          { header: 'A4 특성', key: 'A4', width: 15 },
          { header: 'A5 고장', key: 'A5', width: 15 },
          { header: 'A6 검출', key: 'A6', width: 15 },
        ];
      } else if (relationTab === 'B') {
        sheet.columns = [
          { header: 'A1 No', key: 'A1', width: 10 },
          { header: 'B1 작업요소', key: 'B1', width: 15 },
          { header: 'B2 기능', key: 'B2', width: 20 },
          { header: 'B3 특성', key: 'B3', width: 15 },
          { header: 'B4 원인', key: 'B4', width: 15 },
          { header: 'B5 예방', key: 'B5', width: 15 },
        ];
      } else {
        sheet.columns = [
          { header: 'No', key: 'A1', width: 10 },
          { header: 'C1 구분', key: 'C1', width: 15 },
          { header: 'C2 기능', key: 'C2', width: 20 },
          { header: 'C3 요구', key: 'C3', width: 15 },
          { header: 'C4 영향', key: 'C4', width: 15 },
          { header: '비고', key: 'note', width: 15 },
        ];
      }
      
      // 헤더 스타일
      sheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '00587a' } };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
      });
      
      // 데이터 추가
      const relationData = getRelationData();
      relationData.forEach((row) => {
        sheet.addRow(row);
      });
      
      // 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `관계형_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log(`✅ ${sheetName} 다운로드 완료: ${relationData.length}건`);
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  /** 관계형 데이터 Excel 입포트 */
  const handleRelationImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      const sheet = workbook.worksheets[0];
      if (!sheet) {
        alert('Excel 파일에서 시트를 찾을 수 없습니다.');
        return;
      }
      
      const newData: ImportedFlatData[] = [];
      const category = relationTab;
      
      // 2행부터 데이터 읽기 (1행은 헤더)
      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        const processNo = String(row.getCell(1).value || '').trim();
        if (!processNo) continue;
        
        // 각 열을 해당 itemCode로 변환
        const colMapping = relationTab === 'A' 
          ? ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']
          : relationTab === 'B'
          ? ['A1', 'B1', 'B2', 'B3', 'B4', 'B5']
          : ['A1', 'C1', 'C2', 'C3', 'C4'];
        
        for (let col = 2; col <= colMapping.length; col++) {
          const value = String(row.getCell(col).value || '').trim();
          const itemCode = colMapping[col - 1];
          if (value && itemCode) {
            newData.push({
              id: `${processNo}-${itemCode}-${i}`,
              processNo: category === 'C' ? 'ALL' : processNo,
              category: itemCode.charAt(0) as 'A' | 'B' | 'C',
              itemCode,
              value,
              createdAt: new Date(),
            });
          }
        }
      }
      
      if (newData.length === 0) {
        alert('Import할 데이터가 없습니다.');
        return;
      }
      
      // 기존 데이터에 병합 (해당 카테고리만 대체)
      const itemCodes = relationTab === 'A' 
        ? ['A2', 'A3', 'A4', 'A5', 'A6']
        : relationTab === 'B'
        ? ['B1', 'B2', 'B3', 'B4', 'B5']
        : ['C1', 'C2', 'C3', 'C4'];
      
      const otherData = flatData.filter(d => !itemCodes.includes(d.itemCode));
      setFlatData([...otherData, ...newData]);
      setIsSaved(false);
      
      alert(`${relationTab} 관계형 데이터 ${newData.length}건 Import 완료!`);
      
      // 파일 입력 초기화
      if (relationFileInputRef.current) {
        relationFileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('관계형 입포트 오류:', error);
      alert('Import 중 오류가 발생했습니다.');
    }
  };

  /** 미리보기 데이터 저장 (LocalStorage + 향후 DB) */
  const handleSavePreview = async () => {
    setIsSaving(true);
    
    try {
      // LocalStorage에 저장 (실제 배포 시 DB로 전환)
      localStorage.setItem('pfmea_master_data', JSON.stringify(flatData));
      localStorage.setItem('pfmea_saved_at', new Date().toISOString());
      
      // TODO: 실제 API 호출 (Docker/PostgreSQL 실행 시)
      // await fetch('/api/pfmea/master-data', { 
      //   method: 'POST', 
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ items: flatData.map(d => ({ itemCode: d.itemCode, processNo: d.processNo, value: d.value })) })
      // });
      
      setIsSaved(true);
      console.log('✅ 데이터 저장 완료:', flatData.length, '건 (LocalStorage)');
      
      // 5초 후 저장 상태 리셋
      setTimeout(() => setIsSaved(false), 5000);
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  /** 관계형 데이터 저장 */
  const handleSaveRelation = async () => {
    try {
      // LocalStorage에 저장
      const relationData = {
        A: getRelationData('A'),
        B: getRelationData('B'),
        C: getRelationData('C'),
      };
      localStorage.setItem('pfmea_relation_data', JSON.stringify(relationData));
      localStorage.setItem('pfmea_relation_saved_at', new Date().toISOString());
      console.log('✅ 관계형 데이터 저장 완료');
      alert('관계형 데이터가 저장되었습니다.');
    } catch (error) {
      console.error('관계형 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 페이지 로드 시 FMEA 목록 및 저장된 데이터 불러오기
  useEffect(() => {
    // FMEA 목록 로드
    const storedProjects = localStorage.getItem('pfmea-projects');
    if (storedProjects) {
      try {
        const projects: FMEAProject[] = JSON.parse(storedProjects);
        setFmeaList(projects);
        // URL에서 id 파라미터가 있으면 해당 FMEA 선택 (등록화면에서 넘어온 경우)
        if (idFromUrl) {
          setSelectedFmeaId(idFromUrl);
        } else if (!selectedFmeaId && projects.length > 0) {
          // URL 파라미터 없고, 선택된 FMEA도 없으면 첫 번째 선택
          setSelectedFmeaId(projects[0].id);
        }
      } catch (e) {
        console.error('FMEA 목록 로드 실패:', e);
      }
    }
    
    // 저장된 데이터 불러오기
    const savedData = localStorage.getItem('pfmea_master_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFlatData(parsed);
          const savedAt = localStorage.getItem('pfmea_saved_at');
          setFileName(`저장된 데이터 (${savedAt ? new Date(savedAt).toLocaleString('ko-KR') : ''})`);
          console.log('📂 저장된 데이터 불러옴:', parsed.length, '건', savedAt ? `(${savedAt})` : '');
        }
      } catch (e) {
        console.error('저장된 데이터 파싱 오류:', e);
      }
    }
    setIsLoaded(true);
  }, [idFromUrl, selectedFmeaId]);

  // 파일 선택 핸들러 (파싱 후 pendingData에 저장, Import 버튼 클릭 시 DB 저장)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsParsing(true);
    setImportSuccess(false);
    
    try {
      const result = await parseMultiSheetExcel(file);
      setParseResult(result);
      
      // Flat 데이터 생성
      const flat: ImportedFlatData[] = [];
      result.processes.forEach((p) => {
        flat.push({ id: `${p.processNo}-A1`, processNo: p.processNo, category: 'A', itemCode: 'A1', value: p.processNo, createdAt: new Date() });
        flat.push({ id: `${p.processNo}-A2`, processNo: p.processNo, category: 'A', itemCode: 'A2', value: p.processName, createdAt: new Date() });
        p.processDesc.forEach((v, i) => flat.push({ id: `${p.processNo}-A3-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A3', value: v, createdAt: new Date() }));
        p.productChars.forEach((v, i) => flat.push({ id: `${p.processNo}-A4-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A4', value: v, createdAt: new Date() }));
        p.failureModes.forEach((v, i) => flat.push({ id: `${p.processNo}-A5-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A5', value: v, createdAt: new Date() }));
        p.detectionCtrls.forEach((v, i) => flat.push({ id: `${p.processNo}-A6-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A6', value: v, createdAt: new Date() }));
        p.workElements.forEach((v, i) => flat.push({ id: `${p.processNo}-B1-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B1', value: v, createdAt: new Date() }));
        p.elementFuncs.forEach((v, i) => flat.push({ id: `${p.processNo}-B2-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B2', value: v, createdAt: new Date() }));
        p.processChars.forEach((v, i) => flat.push({ id: `${p.processNo}-B3-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B3', value: v, createdAt: new Date() }));
        p.failureCauses.forEach((v, i) => flat.push({ id: `${p.processNo}-B4-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B4', value: v, createdAt: new Date() }));
        p.preventionCtrls.forEach((v, i) => flat.push({ id: `${p.processNo}-B5-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B5', value: v, createdAt: new Date() }));
      });
      result.products.forEach((p) => {
        flat.push({ id: `C1-${p.productProcessName}`, processNo: 'ALL', category: 'C', itemCode: 'C1', value: p.productProcessName, createdAt: new Date() });
        p.productFuncs.forEach((v, i) => flat.push({ id: `C2-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C2', value: v, createdAt: new Date() }));
        p.requirements.forEach((v, i) => flat.push({ id: `C3-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C3', value: v, createdAt: new Date() }));
        p.failureEffects.forEach((v, i) => flat.push({ id: `C4-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C4', value: v, createdAt: new Date() }));
      });
      // 파싱된 데이터를 pendingData에 저장 + 미리보기에 바로 표시
      setPendingData(flat);
      setFlatData(flat);  // 미리보기에 바로 표시
      
      // 디버깅: 파싱 결과 출력
      console.log('📊 전체 Import 결과:');
      console.log('  - 공정 수:', result.processes.length);
      console.log('  - 제품 수:', result.products.length);
      console.log('  - 시트별 현황:', result.sheetSummary);
      console.log('  - Flat 데이터 수:', flat.length);
      if (result.errors.length > 0) {
        console.warn('  - 오류:', result.errors);
      }
    } catch (error) {
      console.error('파싱 오류:', error);
    } finally {
      setIsParsing(false);
    }
  };

  /**
   * Import 버튼 클릭 핸들러
   * - 중복 데이터: 새로운 값으로 대체 (upsert)
   * - 신규 데이터: 추가
   */
  const handleImport = async () => {
    if (pendingData.length === 0) {
      alert('Import할 데이터가 없습니다. 먼저 Excel 파일을 선택해주세요.');
      return;
    }

    setIsImporting(true);
    setImportSuccess(false);

    try {
      // 중복 데이터 처리: processNo + itemCode 기준으로 upsert
      const existingMap = new Map<string, ImportedFlatData>();
      flatData.forEach(item => {
        const key = `${item.processNo}-${item.itemCode}-${item.value}`;
        existingMap.set(key, item);
      });

      // 신규/업데이트 데이터 병합
      const mergedData: ImportedFlatData[] = [...flatData];
      let addedCount = 0;
      let updatedCount = 0;

      pendingData.forEach(newItem => {
        const key = `${newItem.processNo}-${newItem.itemCode}-${newItem.value}`;
        const existingIndex = mergedData.findIndex(d => 
          d.processNo === newItem.processNo && 
          d.itemCode === newItem.itemCode && 
          d.id === newItem.id
        );

        if (existingIndex >= 0) {
          // 기존 데이터 업데이트
          mergedData[existingIndex] = { ...newItem, createdAt: new Date() };
          updatedCount++;
        } else {
          // 신규 데이터 추가
          mergedData.push({ ...newItem, createdAt: new Date() });
          addedCount++;
        }
      });

      // 상태 업데이트
      setFlatData(mergedData);
      setPendingData([]);
      setImportSuccess(true);

      // TODO: 실제 DB 저장 API 호출
      // await fetch('/api/pfmea/import', { method: 'POST', body: JSON.stringify(mergedData) });

      console.log(`Import 완료: 추가 ${addedCount}건, 업데이트 ${updatedCount}건`);
      
      // 3초 후 성공 표시 제거
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      console.error('Import 오류:', error);
      alert('Import 중 오류가 발생했습니다.');
    } finally {
      setIsImporting(false);
    }
  };

  // 미리보기 데이터 필터링
  const previewData = flatData.filter(d => d.itemCode === previewColumn);
  
  // 통계 계산
  const stats = {
    total: flatData.length,
    processCount: new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo)).size,
    aCount: flatData.filter(d => d.itemCode.startsWith('A')).length,
    bCount: flatData.filter(d => d.itemCode.startsWith('B')).length,
    cCount: flatData.filter(d => d.itemCode.startsWith('C')).length,
    missing: flatData.filter(d => !d.value || d.value.trim() === '').length,
  };

  // 관계형 데이터 필터링
  const getRelationData = () => {
    if (relationTab === 'A') {
      const processes = [...new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo))];
      return processes.map(pNo => ({
        A1: pNo,
        A2: flatData.find(d => d.processNo === pNo && d.itemCode === 'A2')?.value || '',
        A3: flatData.find(d => d.processNo === pNo && d.itemCode === 'A3')?.value || '',
        A4: flatData.find(d => d.processNo === pNo && d.itemCode === 'A4')?.value || '',
        A5: flatData.find(d => d.processNo === pNo && d.itemCode === 'A5')?.value || '',
        A6: flatData.find(d => d.processNo === pNo && d.itemCode === 'A6')?.value || '',
      }));
    } else if (relationTab === 'B') {
      const processes = [...new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo))];
      return processes.map(pNo => ({
        A1: pNo,
        B1: flatData.find(d => d.processNo === pNo && d.itemCode === 'B1')?.value || '',
        B2: flatData.find(d => d.processNo === pNo && d.itemCode === 'B2')?.value || '',
        B3: flatData.find(d => d.processNo === pNo && d.itemCode === 'B3')?.value || '',
        B4: flatData.find(d => d.processNo === pNo && d.itemCode === 'B4')?.value || '',
        B5: flatData.find(d => d.processNo === pNo && d.itemCode === 'B5')?.value || '',
      }));
    } else {
      // C 레벨: C1, C2, C3, C4 데이터 모두 표시
      const c1Data = flatData.filter(d => d.itemCode === 'C1');
      const c2Data = flatData.filter(d => d.itemCode === 'C2');
      const c3Data = flatData.filter(d => d.itemCode === 'C3');
      const c4Data = flatData.filter(d => d.itemCode === 'C4');
      
      // C1 데이터가 있으면 그것을 기준으로
      if (c1Data.length > 0) {
        return c1Data.map((p, idx) => ({
          A1: p.processNo !== 'ALL' ? p.processNo : String(idx + 1),
          C1: p.value,
          C2: c2Data[idx]?.value || '',
          C3: c3Data[idx]?.value || '',
          C4: c4Data[idx]?.value || '',
          note: '',
        }));
      }
      
      // C1이 없으면 C2, C3, C4 중 가장 많은 데이터 기준으로
      const maxLen = Math.max(c2Data.length, c3Data.length, c4Data.length, 1);
      return Array.from({ length: maxLen }).map((_, idx) => ({
        A1: String(idx + 1),
        C1: c1Data[idx]?.value || '',
        C2: c2Data[idx]?.value || '',
        C3: c3Data[idx]?.value || '',
        C4: c4Data[idx]?.value || '',
        note: '',
      }));
    }
  };

  const relationData = getRelationData();

  // =====================================================
  // 테이블 디자인 표준 (DESIGN_GUIDE.md 기준)
  // - 행 높이: 28px (컴팩트)
  // - 글씨 크기: 11px (통일)
  // - 패딩: 4px 6px
  // - 헤더: 네이비(#00587a), 가운데 정렬
  // - 테이블 모서리: 8px 라운드
  // - 열 너비: colgroup으로 고정
  // =====================================================
  const ROW_HEIGHT = '28px';
  const FONT_SIZE = '11px';
  const CELL_PADDING = '4px 6px';
  const headerStyle = { background: '#00587a', color: 'white', border: '1px solid #999', padding: CELL_PADDING, fontWeight: 'bold', textAlign: 'center' as const, whiteSpace: 'nowrap' as const, height: ROW_HEIGHT, fontSize: FONT_SIZE };
  const rowHeaderStyle = { background: '#00587a', color: 'white', border: '1px solid #999', padding: CELL_PADDING, fontWeight: 'bold', textAlign: 'center' as const, whiteSpace: 'nowrap' as const, height: ROW_HEIGHT, fontSize: FONT_SIZE };
  const cellStyle = { background: 'white', border: '1px solid #999', padding: CELL_PADDING, whiteSpace: 'nowrap' as const, height: ROW_HEIGHT, fontSize: FONT_SIZE };
  const lightBlueStyle = { background: '#e0f2fb', border: '1px solid #999', padding: CELL_PADDING, whiteSpace: 'nowrap' as const, height: ROW_HEIGHT, fontSize: FONT_SIZE };
  const tableWrapperStyle = { borderRadius: '8px', overflow: 'hidden', border: '1px solid #999' };
  const sectionTitleStyle = { fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#00587a' };

  return (
    <>
      {/* 상단 고정 바로가기 메뉴 */}
      <PFMEATopNav selectedFmeaId={selectedFmeaId} />
      
      <div style={{ padding: '36px 12px 12px 12px', background: '#f5f5f5', minHeight: '100vh', fontFamily: '"Malgun Gothic", sans-serif' }}>
        {/* 제목 */}
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#00587a', marginBottom: '12px' }}>
          📥 PFMEA 기초정보 Excel Import
        </h1>

      {/* 상단: 기초정보 테이블 */}
      <div style={tableWrapperStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup><col style={{ width: '100px' }} /><col /><col /><col /><col /><col /><col /><col style={{ width: '80px' }} /><col style={{ width: '80px' }} /></colgroup>
        <thead>
          <tr>
            <th style={{ ...headerStyle, textAlign: 'center' }}>구분</th>
            <th colSpan={6} style={{ ...headerStyle, textAlign: 'center' }}>기초정보</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>빈템플렛</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>샘플</th>
          </tr>
        </thead>
        <tbody>
          {/* 공통요소 */}
          <tr>
            <td style={{ ...rowHeaderStyle, textAlign: 'center' }}>공통요소</td>
            <td style={cellStyle}>A0 사람</td>
            <td style={cellStyle}>A0 부자재</td>
            <td style={cellStyle}>A0 작업환경</td>
            <td style={cellStyle}></td>
            <td style={cellStyle}></td>
            <td style={cellStyle}></td>
            <td style={{ ...cellStyle, textAlign: 'center', padding: '4px' }}>
              <button onClick={() => downloadEmptyTemplate()} style={{ padding: '4px 8px', background: '#00587a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', whiteSpace: 'nowrap' }}>기초정보</button>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', padding: '4px' }}>
              <button onClick={() => downloadSampleTemplate()} style={{ padding: '4px 8px', background: '#00587a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', whiteSpace: 'nowrap' }}>기초정보</button>
            </td>
          </tr>
          {/* A 공정 */}
          <tr>
            <td style={{ ...rowHeaderStyle, textAlign: 'center' }}>A 공정</td>
            <td style={cellStyle}>A1 공정번호</td>
            <td style={cellStyle}>A2 공정명</td>
            <td style={cellStyle}>A3 공정기능(설명)</td>
            <td style={cellStyle}>A4 제품특성</td>
            <td style={cellStyle}>A5 고장형태</td>
            <td style={cellStyle}>A6 검출관리</td>
            <td style={{ ...cellStyle, textAlign: 'center', padding: '4px' }}>
              <button onClick={() => downloadRelationAEmpty()} style={{ padding: '4px 8px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', whiteSpace: 'nowrap' }}>관계형A</button>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', padding: '4px' }}>
              <button onClick={() => downloadRelationASample()} style={{ padding: '4px 8px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', whiteSpace: 'nowrap' }}>관계형A</button>
            </td>
          </tr>
          {/* B 작업요소 */}
          <tr>
            <td style={{ ...rowHeaderStyle, textAlign: 'center' }}>B 작업요소</td>
            <td style={cellStyle}>B1 작업요소(설비)</td>
            <td style={cellStyle}>B2 작업요소기능</td>
            <td style={cellStyle}>B3 공정특성</td>
            <td style={cellStyle}>B4 고장원인</td>
            <td style={cellStyle}>B5 예방관리</td>
            <td style={cellStyle}></td>
            <td style={{ ...cellStyle, textAlign: 'center', padding: '4px' }}>
              <button onClick={() => downloadRelationBEmpty()} style={{ padding: '4px 8px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', whiteSpace: 'nowrap' }}>관계형B</button>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', padding: '4px' }}>
              <button onClick={() => downloadRelationBSample()} style={{ padding: '4px 8px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', whiteSpace: 'nowrap' }}>관계형B</button>
            </td>
          </tr>
          {/* C 완(반)제품 */}
          <tr>
            <td style={{ ...rowHeaderStyle, textAlign: 'center' }}>C 완(반)제품</td>
            <td style={cellStyle}>C1 구분</td>
            <td style={cellStyle}>C2 제품(반) 기능</td>
            <td style={cellStyle}>C3 제품(반) 요구사항</td>
            <td style={cellStyle}>C4 제품(반) 고장영향</td>
            <td style={cellStyle}></td>
            <td style={cellStyle}></td>
            <td style={{ ...cellStyle, textAlign: 'center', padding: '4px' }}>
              <button onClick={() => downloadRelationCEmpty()} style={{ padding: '4px 8px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', whiteSpace: 'nowrap' }}>관계형C</button>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', padding: '4px' }}>
              <button onClick={() => downloadRelationCSample()} style={{ padding: '4px 8px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', whiteSpace: 'nowrap' }}>관계형C</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      {/* 상단과 메인 영역 사이 간격 */}
      <div style={{ height: '15px' }}></div>

      {/* FMEA 명 선택 (필수) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', padding: '10px 15px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
        <span style={{ fontWeight: 'bold', color: '#dc3545', fontSize: '12px', whiteSpace: 'nowrap' }}>⚠️ FMEA 명 입력 필수 :</span>
        <select
          value={selectedFmeaId}
          onChange={(e) => setSelectedFmeaId(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #999', borderRadius: '4px', fontSize: '12px', background: 'white', fontWeight: 'bold' }}
        >
          {fmeaList.length === 0 && <option value="">FMEA 미등록 - 먼저 FMEA를 등록하세요</option>}
          {fmeaList.map(fmea => (
            <option key={fmea.id} value={fmea.id}>
              {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
            </option>
          ))}
        </select>
        <button 
          onClick={() => window.location.href = '/pfmea/register'}
          style={{ padding: '6px 12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
        >
          + 신규 등록
        </button>
      </div>

      {/* 블록 1: FMEA 기초정보 입력 + FMEA 분석 데이타 입력 */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'start', marginBottom: '20px' }}>
        {/* 좌측: FMEA 기초정보 입력 - 400px 고정 */}
        <div style={{ width: '400px', flexShrink: 0 }}>
          <h3 style={sectionTitleStyle}>FMEA 기초정보 입력</h3>
          <div style={tableWrapperStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup><col style={{ width: '100px' }} /><col /><col style={{ width: '80px' }} /><col style={{ width: '80px' }} /></colgroup>
              <tbody>
                <tr>
                  <td style={{ ...rowHeaderStyle, textAlign: 'center' }}>전체 입포트</td>
                  <td style={cellStyle}>
                    {isParsing ? (
                      <span style={{ color: '#999' }}>파싱 중...</span>
                    ) : fileName ? (
                      <span style={{ color: '#00587a' }}>{fileName}</span>
                    ) : null}
                    {pendingData.length > 0 && !importSuccess && (
                      <span style={{ marginLeft: '8px', color: '#f57f17', fontSize: '10px' }}>({pendingData.length}건 대기중)</span>
                    )}
                    {importSuccess && (
                      <span style={{ marginLeft: '8px', color: '#2e7d32', fontSize: '10px' }}>
                        <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                        Import 완료!
                      </span>
                    )}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelect} ref={fileInputRef} />
                      <span style={{ padding: '4px 12px', background: '#f0f0f0', border: '1px solid #999', borderRadius: '4px', fontSize: '11px' }}>찾아보기</span>
                    </label>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <button 
                      onClick={handleImport}
                      disabled={pendingData.length === 0 || isImporting}
                      style={{ 
                        padding: '4px 12px', 
                        background: pendingData.length > 0 ? '#4caf50' : '#ccc', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: pendingData.length > 0 ? 'pointer' : 'not-allowed', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Upload size={12} />
                      {isImporting ? '처리중...' : 'Import'}
                    </button>
                  </td>
                </tr>
                <tr>
                  <td style={{ ...rowHeaderStyle, textAlign: 'center' }}>개별 입포트</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* 항목 선택 드롭다운 */}
                      <select
                        value={partialItemCode}
                        onChange={(e) => setPartialItemCode(e.target.value)}
                        style={{ padding: '4px 8px', border: '1px solid #999', borderRadius: '4px', fontSize: '11px', background: '#e0f2fb' }}
                      >
                        {PREVIEW_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {/* 파일명 표시 */}
                      {isPartialParsing ? (
                        <span style={{ color: '#999', fontSize: '11px' }}>파싱 중...</span>
                      ) : partialFileName ? (
                        <span style={{ color: '#00587a', fontSize: '11px' }}>{partialFileName}</span>
                      ) : null}
                      {partialPendingData.length > 0 && (
                        <span style={{ color: '#f57f17', fontSize: '10px' }}>({partialPendingData.length}건)</span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <label style={{ cursor: 'pointer' }}>
                      <input 
                        type="file" 
                        accept=".xlsx,.xls" 
                        style={{ display: 'none' }} 
                        ref={partialFileInputRef}
                        onChange={handlePartialFileSelect}
                      />
                      <span style={{ padding: '4px 12px', background: '#f0f0f0', border: '1px solid #999', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>찾아보기</span>
                    </label>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <button 
                      onClick={handlePartialImport}
                      disabled={partialPendingData.length === 0}
                      style={{ 
                        padding: '4px 12px', 
                        background: partialPendingData.length > 0 ? '#4caf50' : '#ccc', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: partialPendingData.length > 0 ? 'pointer' : 'not-allowed', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Upload size={12} />
                      Import
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 우측: FMEA 분석 데이타 입력 */}
        <div style={{ flex: 1 }}>
          <h3 style={sectionTitleStyle}>FMEA 분석 데이타 입력</h3>
          <div style={tableWrapperStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup><col style={{ width: '100px' }} /><col /><col style={{ width: '80px' }} /><col style={{ width: '80px' }} /></colgroup>
              <tbody>
                {/* 전체 입포트 */}
                <tr>
                  <td style={{ ...rowHeaderStyle, textAlign: 'center' }}>전체 입포트</td>
                  <td style={cellStyle}>고장형태, 영향 및 원인분석 자료</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} />
                      <span style={{ padding: '4px 12px', background: '#f0f0f0', border: '1px solid #999', borderRadius: '4px', fontSize: '11px' }}>찾아보기</span>
                    </label>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <button style={{ padding: '4px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Import</button>
                  </td>
                </tr>
                {/* 개별 입포트 */}
                <tr>
                  <td style={{ ...rowHeaderStyle, textAlign: 'center' }}>개별 입포트</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select style={{ padding: '4px 8px', border: '1px solid #999', borderRadius: '4px', fontSize: '11px', background: '#fff3e0' }}>
                        <option value="C">고장영향 분석 자료</option>
                        <option value="A">고장형태 분석 자료</option>
                        <option value="B">고장원인 분석 자료</option>
                      </select>
                    </div>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} />
                      <span style={{ padding: '4px 12px', background: '#f0f0f0', border: '1px solid #999', borderRadius: '4px', fontSize: '11px' }}>찾아보기</span>
                    </label>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <button style={{ padding: '4px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Import</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 블록 2: FMEA 기초정보 미리 보기 + FMEA 분석 DATA 미리 보기 */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
        {/* 좌측: FMEA 기초정보 미리 보기 - 고정 400px */}
        <div style={{ width: '400px', flexShrink: 0 }}>

          {/* FMEA 기초정보 미리 보기 */}
          <h3 style={sectionTitleStyle}>FMEA 기초정보 미리 보기</h3>
          
          {/* 탭 + 테이블 통합 wrapper */}
          <div style={tableWrapperStyle}>
            {/* 탭 - 테이블 헤더와 동일한 너비 */}
            <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid #999' }}>
              <select 
                value={previewColumn}
                onChange={(e) => setPreviewColumn(e.target.value)}
                style={{ flex: 1, padding: '8px 8px', border: 'none', fontWeight: 'bold', background: '#e0f2fb', color: '#00587a', fontSize: '12px' }}
              >
                {PREVIEW_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button 
                onClick={handleDownloadPreview}
                style={{ padding: '8px 10px', background: '#e3f2fd', color: '#1565c0', border: 'none', borderLeft: '1px solid #999', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >다운로드</button>
              <button 
                onClick={handleAllDelete}
                style={{ padding: '8px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderLeft: '1px solid #999', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >All Del.</button>
              <button 
                onClick={handleDeleteSelected}
                style={{ padding: '8px 10px', background: '#fff9c4', color: '#f57f17', border: 'none', borderLeft: '1px solid #999', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >Del.</button>
              <button 
                onClick={handleSavePreview}
                disabled={isSaving}
                style={{ 
                  padding: '8px 12px', 
                  background: isSaved ? '#4caf50' : '#e1bee7', 
                  color: isSaved ? 'white' : '#6a1b9a', 
                  border: 'none', 
                  borderLeft: '1px solid #999', 
                  cursor: isSaving ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '11px',
                  transition: 'background 0.3s, color 0.3s'
                }}
              >
                {isSaving ? '저장중...' : isSaved ? '✓ 저장됨' : '저장'}
              </button>
            </div>

            {/* 테이블 - 10행 고정 (28px * 10 = 280px) + 헤더(28px) = 308px */}
            <div style={{ maxHeight: '308px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup><col style={{ width: '30px' }} /><col style={{ width: '35px' }} /><col style={{ width: '35px' }} /><col style={{ width: '60px' }} /><col /></colgroup>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={headerStyle}>
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          const selectedData = flatData.filter(d => d.itemCode === previewColumn);
                          if (e.target.checked) {
                            setSelectedRows(new Set(selectedData.map(d => d.id)));
                          } else {
                            setSelectedRows(new Set());
                          }
                        }}
                        checked={flatData.filter(d => d.itemCode === previewColumn).length > 0 && 
                                 flatData.filter(d => d.itemCode === previewColumn).every(d => selectedRows.has(d.id))}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={headerStyle}>NO</th>
                    <th style={headerStyle}>순서</th>
                    <th style={headerStyle}>공정번호</th>
                    {/* 선택된 항목명 동적 표시 */}
                    <th style={headerStyle}>{PREVIEW_OPTIONS.find(o => o.value === previewColumn)?.label.split(' ')[1] || '항목'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // 선택한 항목 코드에 해당하는 데이터 필터링
                    const selectedData = flatData.filter(d => d.itemCode === previewColumn);
                    
                    if (selectedData.length === 0) {
                      // 데이터 없으면 10개 빈 행
                      return Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i}>
                          <td style={{ ...cellStyle, textAlign: 'center' }}></td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
                              <ChevronUp style={{ width: '10px', height: '10px', color: '#ccc' }} />
                              <ChevronDown style={{ width: '10px', height: '10px', color: '#ccc' }} />
                            </div>
                          </td>
                          <td style={{ ...cellStyle, padding: '2px' }}>
                            <input 
                              type="text" 
                              placeholder="공정번호"
                              style={{ 
                                width: '100%', 
                                border: '1px solid #e0e0e0', 
                                borderRadius: '2px', 
                                padding: '2px 4px', 
                                fontSize: '11px',
                                background: '#fffef0',
                                textAlign: 'center'
                              }}
                              onBlur={(e) => {
                                if (e.target.value) {
                                  const row = e.target.closest('tr');
                                  const valueInput = row?.querySelector('input[placeholder="값 입력"]') as HTMLInputElement;
                                  const newData: ImportedFlatData = {
                                    id: `new-init-${Date.now()}-${i}`,
                                    processNo: e.target.value,
                                    itemCode: previewColumn,
                                    value: valueInput?.value || ''
                                  };
                                  setFlatData(prev => [...prev, newData]);
                                  setDirty(true);
                                }
                              }}
                            />
                          </td>
                          <td style={{ ...cellStyle, padding: '2px' }}>
                            <input 
                              type="text" 
                              placeholder="값 입력"
                              style={{ 
                                width: '100%', 
                                border: '1px solid #e0e0e0', 
                                borderRadius: '2px', 
                                padding: '2px 4px', 
                                fontSize: '11px',
                                background: '#fffef0'
                              }}
                            />
                          </td>
                        </tr>
                      ));
                    }
                    
                    // 선택한 항목 데이터 표시 (드래그앤드랍 지원)
                    const rows = selectedData.map((item, i) => (
                      <tr 
                        key={item.id} 
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(i)}
                        onDragEnd={handleDragEnd}
                        style={{ 
                          cursor: 'grab',
                          background: draggedIndex === i ? '#e3f2fd' : selectedRows.has(item.id) ? '#fff3e0' : 'white'
                        }}
                      >
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedRows.has(item.id)}
                            onChange={() => handleRowSelect(item.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0', cursor: 'grab' }}>
                            <ChevronUp style={{ width: '10px', height: '10px', color: '#666' }} />
                            <ChevronDown style={{ width: '10px', height: '10px', color: '#666' }} />
                          </div>
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{item.processNo}</td>
                        <td style={cellStyle}>{item.value}</td>
                      </tr>
                    ));
                    
                    // 10행 미만이면 빈 행 추가 (입력 가능)
                    const emptyRows = Array.from({ length: Math.max(0, 10 - selectedData.length) }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td style={{ ...cellStyle, textAlign: 'center' }}><input type="checkbox" /></td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{selectedData.length + i + 1}</td>
                        <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
                            <ChevronUp style={{ width: '10px', height: '10px', color: '#ccc' }} />
                            <ChevronDown style={{ width: '10px', height: '10px', color: '#ccc' }} />
                          </div>
                        </td>
                        <td style={{ ...cellStyle, padding: '2px' }}>
                          <input 
                            type="text" 
                            placeholder="공정번호"
                            style={{ 
                              width: '100%', 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '2px', 
                              padding: '2px 4px', 
                              fontSize: '11px',
                              background: '#fffef0',
                              textAlign: 'center'
                            }}
                            onBlur={(e) => {
                              if (e.target.value) {
                                const row = e.target.closest('tr');
                                const valueInput = row?.querySelector('input[placeholder="값 입력"]') as HTMLInputElement;
                                const newData: ImportedFlatData = {
                                  id: `new-left-${Date.now()}-${i}`,
                                  processNo: e.target.value,
                                  itemCode: previewColumn,
                                  value: valueInput?.value || ''
                                };
                                setFlatData(prev => [...prev, newData]);
                                setDirty(true);
                              }
                            }}
                          />
                        </td>
                        <td style={{ ...cellStyle, padding: '2px' }}>
                          <input 
                            type="text" 
                            placeholder="값 입력"
                            style={{ 
                              width: '100%', 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '2px', 
                              padding: '2px 4px', 
                              fontSize: '11px',
                              background: '#fffef0'
                            }}
                          />
                        </td>
                      </tr>
                    ));
                    
                    return [...rows, ...emptyRows];
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 우측: FMEA 분석 DATA 미리 보기 - 나머지 영역 */}
        <div style={{ flex: 1 }}>
          {/* FMEA 분석 DATA 미리 보기 */}
          <h3 style={sectionTitleStyle}>FMEA 분석 DATA 미리 보기</h3>
          
          {/* 탭 + 테이블 통합 wrapper - FMEA 기초정보 미리 보기와 동일한 디자인 */}
          <div style={tableWrapperStyle}>
            {/* 탭 - 드롭다운 + 버튼 */}
            <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid #999' }}>
              <select 
                value={relationTab}
                onChange={(e) => setRelationTab(e.target.value as 'A' | 'B' | 'C')}
                style={{ flex: 1, padding: '8px 8px', border: 'none', fontWeight: 'bold', background: '#e0f2fb', color: '#00587a', fontSize: '12px' }}
              >
                <option value="A">고장형태 분석(2L)</option>
                <option value="B">고장원인 분석(3L)</option>
                <option value="C">고장영향 분석(1L)</option>
              </select>
              <button 
                onClick={handleRelationDownload}
                style={{ padding: '8px 10px', background: '#e3f2fd', color: '#1565c0', border: 'none', borderLeft: '1px solid #999', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >다운로드</button>
              <button 
                style={{ padding: '8px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderLeft: '1px solid #999', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >All Del.</button>
              <button 
                style={{ padding: '8px 10px', background: '#fff9c4', color: '#f57f17', border: 'none', borderLeft: '1px solid #999', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >Del.</button>
              <button 
                onClick={handleSaveRelation} 
                style={{ padding: '8px 12px', background: '#e1bee7', color: '#6a1b9a', border: 'none', borderLeft: '1px solid #999', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
              >저장</button>
            </div>

            {/* 분석 DATA 테이블 - 탭별 다른 구조 */}
            <div style={{ maxHeight: '308px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup><col style={{ width: '25px' }} /><col style={{ width: '35px' }} /><col style={{ width: '35px' }} /><col style={{ width: '50px' }} /><col style={{ width: '80px' }} /><col style={{ width: '35%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /></colgroup>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ ...headerStyle, background: '#00587a', color: 'white' }}><input type="checkbox" /></th>
                  <th style={{ ...headerStyle, background: '#00587a', color: 'white' }}>NO</th>
                  <th style={{ ...headerStyle, background: '#00587a', color: 'white' }}>순서</th>
                  {relationTab === 'A' && (
                    <>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>공정번호</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>공정명</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>A3 기능</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>A4 특성</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>A5 고장형태</th>
                    </>
                  )}
                  {relationTab === 'B' && (
                    <>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>공정번호</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>작업요소</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>B2 기능</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>B3 특성</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>B4 고장원인</th>
                    </>
                  )}
                  {relationTab === 'C' && (
                    <>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>구분</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>제품기능</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>C3 요구사항</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>C4 고장영향</th>
                      <th style={{ ...headerStyle, background: '#00587a', color: 'white', wordBreak: 'break-word' }}>심각도</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {relationData.length === 0 ? (
                  Array.from({ length: 10 }).map((_, i) => {
                    const cols = relationTab === 'A' ? ['A1', 'A2', 'A3', 'A4', 'A5'] : relationTab === 'B' ? ['A1', 'B1', 'B2', 'B3', 'B4'] : ['C1', 'C2', 'C3', 'C4', 'C5'];
                    return (
                      <tr key={i}>
                        <td style={{ ...cellStyle, textAlign: 'center' }}><input type="checkbox" /></td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
                            <ChevronUp style={{ width: '10px', height: '10px', color: '#ccc' }} />
                            <ChevronDown style={{ width: '10px', height: '10px', color: '#ccc' }} />
                          </div>
                        </td>
                        {cols.map((col, j) => (
                          <td key={j} style={{ ...cellStyle, padding: '2px' }}>
                            <input 
                              type="text" 
                              placeholder="클릭하여 입력"
                              style={{ 
                                width: '100%', 
                                border: '1px solid #e0e0e0', 
                                borderRadius: '2px', 
                                padding: '2px 4px', 
                                fontSize: '11px',
                                background: '#fffef0'
                              }}
                              onBlur={(e) => {
                                if (e.target.value) {
                                  const newData: ImportedFlatData = {
                                    id: `new-${Date.now()}-${i}-${j}`,
                                    processNo: col === 'A1' ? e.target.value : String(i + 1),
                                    itemCode: col,
                                    value: e.target.value
                                  };
                                  setFlatData(prev => [...prev, newData]);
                                  setDirty(true);
                                }
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  relationData.map((row, i) => {
                    const keys = Object.keys(row);
                    return (
                      <tr key={i}>
                        <td style={{ ...cellStyle, textAlign: 'center' }}><input type="checkbox" /></td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
                            <ChevronUp style={{ width: '10px', height: '10px', color: '#666' }} />
                            <ChevronDown style={{ width: '10px', height: '10px', color: '#666' }} />
                          </div>
                        </td>
                        {keys.slice(0, 5).map((key, j) => {
                          const val = row[key as keyof typeof row];
                          return (
                            <td key={j} style={{ ...cellStyle, padding: '2px' }}>
                              {val ? (
                                <span style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.3', display: 'block', padding: '2px 4px' }}>{val}</span>
                              ) : (
                                <input 
                                  type="text" 
                                  placeholder="입력"
                                  style={{ 
                                    width: '100%', 
                                    border: '1px solid #e0e0e0', 
                                    borderRadius: '2px', 
                                    padding: '2px 4px', 
                                    fontSize: '11px',
                                    background: '#fffef0'
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value) {
                                      const processNo = row.A1 || row.C1 || String(i + 1);
                                      const newData: ImportedFlatData = {
                                        id: `edit-${Date.now()}-${i}-${j}`,
                                        processNo: String(processNo),
                                        itemCode: key,
                                        value: e.target.value
                                      };
                                      setFlatData(prev => [...prev, newData]);
                                      setDirty(true);
                                    }
                                  }}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
