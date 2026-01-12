'use client';

/**
 * @file page.tsx
 * @description Control Plan 기초정보 Excel Import 메인 페이지
 * @version 1.0.0
 * @created 2026-01-12
 * @description FMEA Import 화면을 벤치마킹하여 CP용으로 수정
 */

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import CPTopNav from '@/components/layout/CPTopNav';

// CP 프로젝트 타입
interface CPProject {
  id: string;
  cpInfo?: {
    subject?: string;
  };
}

// Import 데이터 타입
interface ImportedData {
  id: string;
  processNo: string;
  category: string;
  itemCode: string;
  value: string;
  createdAt: Date;
}

// 미리보기 옵션
const PREVIEW_OPTIONS = [
  { value: 'P1', label: 'P1 공정번호' },
  { value: 'P2', label: 'P2 공정명' },
  { value: 'P3', label: 'P3 공정설명' },
  { value: 'P4', label: 'P4 설비/금형/JIG' },
  { value: 'P5', label: 'P5 제품특성' },
  { value: 'P6', label: 'P6 공정특성' },
  { value: 'P7', label: 'P7 특별특성' },
  { value: 'P8', label: 'P8 제품/공정사양' },
];

// 미리보기 테이블 컬럼 정의
const PREVIEW_COLUMNS = [
  { key: 'P1', label: '공정번호', width: 'w-[60px]' },
  { key: 'P2', label: '공정명', width: 'w-[80px]' },
  { key: 'P3', label: '공정설명', width: 'w-[120px]' },
  { key: 'P4', label: '설비/금형/JIG', width: 'w-[100px]' },
  { key: 'P5', label: '제품특성', width: 'w-[100px]' },
  { key: 'P6', label: '공정특성', width: 'w-[100px]' },
  { key: 'P8', label: '제품/공정사양', width: 'w-[100px]' },
  { key: 'M1', label: '평가방법', width: 'w-[80px]' },
  { key: 'M4', label: '관리방법', width: 'w-[80px]' },
  { key: 'M5', label: '대응계획', width: 'w-[100px]' },
];

// Tailwind 스타일 상수 - 엑셀 스타일 (여백 1px)
const tw = {
  tableWrapper: "border border-gray-400 rounded bg-white overflow-hidden",
  headerCell: "bg-[#0d9488] text-white px-1 py-0.5 border border-gray-400 text-[10px] font-bold text-center",
  headerCellSm: "bg-[#0d9488] text-white px-1 py-0.5 border border-gray-400 text-[10px] font-bold text-center",
  rowHeader: "bg-teal-100 text-[#00587a] px-1 py-0.5 border border-gray-300 text-[10px] font-bold text-center whitespace-nowrap",
  rowHeaderSm: "bg-teal-50 text-[#00587a] px-1 py-0.5 border border-gray-300 text-[10px] font-semibold text-center whitespace-nowrap",
  cell: "border border-gray-300 px-1 py-0.5 text-[10px] text-gray-700",
  cellPad: "border border-gray-300 px-1 py-0.5 text-[10px] text-center",
  cellCenter: "border border-gray-300 px-1 py-0.5 text-[10px] text-center",
  btnPrimary: "px-2 py-0.5 bg-teal-500 text-white border-none rounded cursor-pointer text-[10px] font-bold",
  btnBlue: "px-2 py-0.5 bg-blue-500 text-white border-none rounded cursor-pointer text-[10px] font-bold",
  btnGreen: "px-2 py-0.5 bg-green-500 text-white border-none rounded cursor-pointer text-[10px] font-bold",
  btnDanger: "px-2 py-0.5 bg-orange-500 text-white border-none rounded cursor-pointer text-[10px] font-bold",
  btnBrowse: "inline-block px-2 py-0.5 bg-gray-100 border border-gray-400 rounded cursor-pointer text-[10px] font-medium",
  btnSuccess: "px-2 py-0.5 bg-green-500 text-white border-none rounded cursor-pointer text-[10px] font-bold",
  btnSuccessDisabled: "px-2 py-0.5 bg-gray-300 text-white border-none rounded cursor-not-allowed text-[10px] font-bold",
  select: "w-full px-1 py-0 border border-gray-300 rounded text-[10px] bg-white",
  input: "w-full px-1 py-0 border-0 text-[10px] bg-transparent focus:outline-none",
  inputCenter: "w-full px-1 py-0 border-0 text-[10px] bg-transparent text-center focus:outline-none",
};

function CPImportPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idFromUrl = searchParams.get('id');
  
  // CP 선택 상태
  const [cpList, setCpList] = useState<CPProject[]>([]);
  const [selectedCpId, setSelectedCpId] = useState<string>(idFromUrl || '');
  
  // 상태 관리
  const [fileName, setFileName] = useState<string>('');
  const [flatData, setFlatData] = useState<ImportedData[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  
  // Import 상태
  const [pendingData, setPendingData] = useState<ImportedData[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // 미리보기
  const [previewColumn, setPreviewColumn] = useState('P1');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null); // 선택된 컬럼
  
  // 저장 상태
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const partialFileInputRef = useRef<HTMLInputElement>(null);
  
  // 개별 입포트 항목 코드
  const [partialItemCode, setPartialItemCode] = useState('P1');

  // 전체 템플릿 다운로드
  const downloadFullTemplate = () => {
    // Excel 파일 생성 (간단한 CSV로 대체)
    const headers = ['공정번호', '공정명', '공정설명', '설비/금형/JIG', '제품특성', '공정특성', '제품/공정사양', '평가방법', '관리방법', '대응계획'];
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + 
      '10,프레스,프레스 공정,Press M/C,치수,압력,10±0.5mm,캘리퍼스,SPC 관리,재작업\n' +
      '20,용접,용접 공정,Welding M/C,용접강도,전류,100A±5%,인장시험,육안검사,라인정지';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CP_전체_템플릿.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // 개별 템플릿 다운로드
  const downloadPartialTemplate = () => {
    const colInfo = PREVIEW_COLUMNS.find(c => c.key === partialItemCode);
    const colName = colInfo?.label || partialItemCode;
    
    const headers = ['공정번호', colName];
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + 
      '10,샘플값1\n' +
      '20,샘플값2\n' +
      '30,샘플값3';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CP_개별_${colName}_템플릿.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 페이지 로드 시 CP 목록 불러오기
  useEffect(() => {
    const loadCpList = () => {
      const stored = localStorage.getItem('cp-projects');
      if (stored) {
        try {
          const projects: CPProject[] = JSON.parse(stored);
          setCpList(projects);
          if (idFromUrl) {
            setSelectedCpId(idFromUrl);
          } else if (!selectedCpId && projects.length > 0) {
            setSelectedCpId(projects[0].id);
          }
        } catch (e) {
          console.error('CP 목록 로드 실패:', e);
        }
      }
    };
    loadCpList();
  }, [idFromUrl, selectedCpId]);

  // 파일 선택 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsParsing(true);
    setImportSuccess(false);
    
    // TODO: Excel 파싱 로직 구현
    // 임시로 샘플 데이터 생성
    setTimeout(() => {
      const sampleData: ImportedData[] = [
        { id: '1', processNo: '10', category: 'P', itemCode: 'P1', value: '10', createdAt: new Date() },
        { id: '2', processNo: '10', category: 'P', itemCode: 'P2', value: '프레스', createdAt: new Date() },
        { id: '3', processNo: '20', category: 'P', itemCode: 'P1', value: '20', createdAt: new Date() },
        { id: '4', processNo: '20', category: 'P', itemCode: 'P2', value: '용접', createdAt: new Date() },
      ];
      setPendingData(sampleData);
      setIsParsing(false);
    }, 1000);
  };

  // Import 실행
  const handleImport = () => {
    if (pendingData.length === 0) return;
    
    setIsImporting(true);
    
    setTimeout(() => {
      setFlatData(prev => [...prev, ...pendingData]);
      setPendingData([]);
      setIsImporting(false);
      setImportSuccess(true);
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setImportSuccess(false), 3000);
    }, 500);
  };

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // localStorage에 저장
      const key = `cp-import-data-${selectedCpId}`;
      localStorage.setItem(key, JSON.stringify(flatData));
      localStorage.setItem(`${key}-saved-at`, new Date().toISOString());
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 전체 삭제 (모든 데이터)
  const handleAllDelete = () => {
    if (!confirm('모든 데이터를 삭제하시겠습니까?')) return;
    setFlatData([]);
    setSelectedRows(new Set());
    setSelectedColumn(null);
  };

  // 선택 삭제 (행 기준)
  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) {
      alert('삭제할 행을 선택하세요.');
      return;
    }
    setFlatData(prev => prev.filter(d => !selectedRows.has(d.processNo)));
    setSelectedRows(new Set());
  };

  // 컬럼 전체 삭제
  const handleColumnAllDelete = () => {
    if (!selectedColumn) {
      alert('삭제할 컬럼을 선택하세요.');
      return;
    }
    const colLabel = PREVIEW_COLUMNS.find(c => c.key === selectedColumn)?.label || selectedColumn;
    if (!confirm(`"${colLabel}" 컬럼의 모든 데이터를 삭제하시겠습니까?`)) return;
    setFlatData(prev => prev.filter(d => d.itemCode !== selectedColumn));
    setSelectedColumn(null);
  };

  // 컬럼 선택 삭제 (선택된 행의 해당 컬럼만)
  const handleColumnDeleteSelected = () => {
    if (!selectedColumn) {
      alert('삭제할 컬럼을 선택하세요.');
      return;
    }
    if (selectedRows.size === 0) {
      alert('삭제할 행을 선택하세요.');
      return;
    }
    setFlatData(prev => prev.filter(d => !(d.itemCode === selectedColumn && selectedRows.has(d.processNo))));
    setSelectedRows(new Set());
  };

  // 컬럼 클릭 핸들러
  const handleColumnClick = (colKey: string) => {
    setSelectedColumn(prev => prev === colKey ? null : colKey);
  };

  // 행 선택
  const handleRowSelect = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 통계 계산
  const previewData = flatData.filter(d => d.itemCode === previewColumn);
  const stats = {
    total: flatData.length,
    missing: PREVIEW_OPTIONS.filter(opt => 
      flatData.filter(d => d.itemCode === opt.value).length === 0
    ).length,
    processCount: new Set(flatData.map(d => d.processNo)).size,
  };

  // 공정번호 기준으로 그룹화된 데이터 생성
  const groupedData = () => {
    const processNos = [...new Set(flatData.map(d => d.processNo))].sort();
    return processNos.map(processNo => {
      const row: Record<string, string> = { processNo };
      PREVIEW_COLUMNS.forEach(col => {
        const item = flatData.find(d => d.processNo === processNo && d.itemCode === col.key);
        row[col.key] = item?.value || '';
      });
      return row;
    });
  };

  return (
    <>
      <CPTopNav selectedCpId={selectedCpId} />
      
      <div className="pt-9 px-3 pb-3 bg-gray-100 min-h-screen font-[Malgun_Gothic,sans-serif]">
        {/* 제목 */}
        <h1 className="text-base font-bold text-teal-700 mb-3">
          📥 Control Plan 기초정보 Excel Import
        </h1>

        {/* 기초정보 테이블 */}
        <div className={tw.tableWrapper}>
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-[100px]" />
              <col /><col /><col /><col /><col /><col /><col />
              <col className="w-[55px]" />
              <col className="w-[55px]" />
            </colgroup>
            <thead>
              <tr>
                <th className={tw.headerCell}>구분</th>
                <th colSpan={7} className={tw.headerCell}>항목</th>
                <th className={tw.headerCellSm}>빈템플렛</th>
                <th className={tw.headerCellSm}>샘플</th>
              </tr>
            </thead>
            <tbody>
              {/* 공정정보 */}
              <tr>
                <td className={tw.rowHeader}>공정정보</td>
                <td className={tw.cell}>P1 공정번호</td>
                <td className={tw.cell}>P2 공정명</td>
                <td className={tw.cell}>P3 공정설명</td>
                <td className={tw.cell}>P4 설비/금형/JIG</td>
                <td className={tw.cell}></td>
                <td className={tw.cell}></td>
                <td className={tw.cell}></td>
                <td className={tw.cellPad}>
                  <button className={tw.btnPrimary}>양식</button>
                </td>
                <td className={tw.cellPad}>
                  <button className={tw.btnPrimary}>샘플</button>
                </td>
              </tr>
              {/* 특성정보 */}
              <tr>
                <td className={tw.rowHeader}>특성정보</td>
                <td className={tw.cell}>P5 제품특성</td>
                <td className={tw.cell}>P6 공정특성</td>
                <td className={tw.cell}>P7 특별특성</td>
                <td className={tw.cell}>P8 제품/공정사양</td>
                <td className={tw.cell}></td>
                <td className={tw.cell}></td>
                <td className={tw.cell}></td>
                <td className={tw.cellPad}>
                  <button className={tw.btnBlue}>양식</button>
                </td>
                <td className={tw.cellPad}>
                  <button className={tw.btnBlue}>샘플</button>
                </td>
              </tr>
              {/* 관리방법 */}
              <tr>
                <td className={tw.rowHeader}>관리방법</td>
                <td className={tw.cell}>M1 평가방법</td>
                <td className={tw.cell}>M2 샘플사이즈</td>
                <td className={tw.cell}>M3 관리빈도</td>
                <td className={tw.cell}>M4 관리방법</td>
                <td className={tw.cell}>M5 대응계획</td>
                <td className={tw.cell}></td>
                <td className={tw.cell}></td>
                <td className={tw.cellPad}>
                  <button className={tw.btnGreen}>양식</button>
                </td>
                <td className={tw.cellPad}>
                  <button className={tw.btnGreen}>샘플</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 상단과 메인 영역 사이 간격 */}
        <div className="h-4"></div>

        {/* CP 명 선택 (필수) */}
        <div className="flex items-center gap-4 mb-4 px-4 py-2.5 bg-amber-50 border border-amber-400 rounded">
          <span className="font-bold text-red-600 whitespace-nowrap text-xs">⚠️ CP 명 입력 필수 :</span>
          <select
            value={selectedCpId}
            onChange={(e) => setSelectedCpId(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-400 rounded text-xs bg-white font-bold"
          >
            {cpList.length === 0 && <option value="">CP 미등록 - 먼저 CP를 등록하세요</option>}
            {cpList.map((cp, idx) => (
              <option key={`cp-${cp.id || idx}`} value={cp.id}>
                {cp.cpInfo?.subject || cp.id}
              </option>
            ))}
          </select>
          <button 
            onClick={() => router.push('/control-plan/register')}
            className="px-3 py-1.5 bg-teal-600 text-white border-none rounded cursor-pointer text-[11px] font-bold whitespace-nowrap"
          >
            + 신규 등록
          </button>
        </div>

        {/* 블록 1: CP 기초정보 입력 - 전체/개별 입포트 */}
        <div className="mb-3">
          <div className={tw.tableWrapper}>
            <table className="w-full border-collapse">
              <tbody>
                <tr style={{ height: '28px' }}>
                  <td className={`${tw.rowHeader} w-[70px]`}>전체 입포트</td>
                  <td className={`${tw.cell} w-[180px]`}>
                    {isParsing ? (
                      <span className="text-gray-400 text-[10px]">파싱 중...</span>
                    ) : fileName ? (
                      <span className="text-teal-700 text-[10px]">{fileName}</span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">파일 선택</span>
                    )}
                    {pendingData.length > 0 && !importSuccess && (
                      <span className="ml-1 text-yellow-700 text-[9px]">({pendingData.length}건)</span>
                    )}
                    {importSuccess && (
                      <span className="ml-1 text-green-700 text-[9px]">
                        <CheckCircle size={10} className="align-middle mr-0.5 inline" />완료
                      </span>
                    )}
                  </td>
                  <td className={`${tw.cellCenter} w-[55px]`}>
                    <button 
                      onClick={downloadFullTemplate}
                      className="px-1.5 py-0.5 bg-blue-500 text-white border-none rounded cursor-pointer text-[9px] font-bold hover:bg-blue-600"
                    >📥 양식</button>
                  </td>
                  <td className={`${tw.cellCenter} w-[55px]`}>
                    <label className="cursor-pointer">
                      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} ref={fileInputRef} />
                      <span className={tw.btnBrowse}>찾아보기</span>
                    </label>
                  </td>
                  <td className={`${tw.cellCenter} w-[55px]`}>
                    <button 
                      onClick={handleImport}
                      disabled={pendingData.length === 0 || isImporting}
                      className={pendingData.length > 0 ? tw.btnSuccess : tw.btnSuccessDisabled}
                    >
                      {isImporting ? '...' : 'Import'}
                    </button>
                  </td>
                  <td className={`${tw.rowHeader} w-[70px]`}>개별 입포트</td>
                  <td className={`${tw.cell} w-[130px]`}>
                    <select 
                      value={partialItemCode}
                      onChange={(e) => setPartialItemCode(e.target.value)}
                      className="w-full px-1 py-0 border border-gray-300 rounded text-[10px] bg-teal-50"
                    >
                      {PREVIEW_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className={`${tw.cellCenter} w-[55px]`}>
                    <button 
                      onClick={downloadPartialTemplate}
                      className="px-1.5 py-0.5 bg-purple-500 text-white border-none rounded cursor-pointer text-[9px] font-bold hover:bg-purple-600"
                    >📥 양식</button>
                  </td>
                  <td className={`${tw.cellCenter} w-[55px]`}>
                    <label className="cursor-pointer">
                      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={partialFileInputRef} />
                      <span className={tw.btnBrowse}>찾아보기</span>
                    </label>
                  </td>
                  <td className={`${tw.cellCenter} w-[55px]`}>
                    <button className={tw.btnSuccessDisabled}>Import</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 블록 2: CP 기초정보 미리 보기 - 다중 컬럼 */}
        <div className="flex flex-col border-2 border-teal-600 rounded-lg overflow-hidden bg-white shadow-lg">
          {/* 헤더 */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-500 text-white px-3 py-2 text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📋</span> CP 기초정보 미리 보기
              {selectedColumn && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-gray-800 rounded text-[10px]">
                  선택: {PREVIEW_COLUMNS.find(c => c.key === selectedColumn)?.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-normal">
              <span className="bg-white/20 px-1.5 py-0.5 rounded">
                항목: <b className="text-yellow-300">{stats.total}</b>
              </span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded">
                공정: <b className="text-yellow-300">{stats.processCount}</b>
              </span>
              <span className="text-white/60">|</span>
              <button 
                onClick={handleAllDelete}
                className="px-2 py-0.5 bg-red-600 text-white border-none rounded cursor-pointer font-bold text-[9px] hover:bg-red-700"
              >전체 삭제</button>
              <button 
                onClick={handleDeleteSelected}
                className="px-2 py-0.5 bg-orange-500 text-white border-none rounded cursor-pointer font-bold text-[9px] hover:bg-orange-600"
              >행 삭제</button>
              <span className="text-white/60">|</span>
              <button 
                onClick={handleColumnAllDelete}
                disabled={!selectedColumn}
                className={`px-2 py-0.5 border-none rounded font-bold text-[9px] ${
                  selectedColumn 
                    ? 'bg-purple-600 text-white cursor-pointer hover:bg-purple-700' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >컬럼 전체삭제</button>
              <button 
                onClick={handleColumnDeleteSelected}
                disabled={!selectedColumn || selectedRows.size === 0}
                className={`px-2 py-0.5 border-none rounded font-bold text-[9px] ${
                  selectedColumn && selectedRows.size > 0
                    ? 'bg-pink-600 text-white cursor-pointer hover:bg-pink-700' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >컬럼 선택삭제</button>
              <span className="text-white/60">|</span>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`px-2.5 py-0.5 border-none rounded font-bold text-[9px] transition-colors ${
                  isSaved 
                    ? 'bg-green-400 text-white cursor-pointer' 
                    : 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600'
                } ${isSaving ? 'cursor-not-allowed' : ''}`}
              >
                {isSaving ? '저장중...' : isSaved ? '✓ 저장됨' : '💾 저장'}
              </button>
            </div>
          </div>
          
          {/* 테이블 - 엑셀 스타일 */}
          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[450px] bg-white">
            <table className="w-full border-collapse" style={{ minWidth: '1100px', borderSpacing: 0 }}>
              <thead className="sticky top-0 z-[1]">
                <tr style={{ height: '22px' }}>
                  <th className={`${tw.headerCell} w-[25px]`}>
                    <input 
                      type="checkbox" 
                      className="cursor-pointer w-3 h-3"
                      onChange={(e) => {
                        const allProcessNos = groupedData().map(r => r.processNo);
                        if (e.target.checked) {
                          setSelectedRows(new Set(allProcessNos));
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                      checked={groupedData().length > 0 && groupedData().every(r => selectedRows.has(r.processNo))}
                    />
                  </th>
                  <th className={`${tw.headerCell} w-[30px]`}>NO</th>
                  {PREVIEW_COLUMNS.map(col => (
                    <th 
                      key={col.key} 
                      className={`${tw.headerCell} cursor-pointer hover:bg-teal-700 transition-colors ${
                        selectedColumn === col.key ? 'bg-yellow-500 text-gray-800' : ''
                      }`}
                      onClick={() => handleColumnClick(col.key)}
                      title={`${col.label} 클릭하여 선택/해제`}
                    >
                      {col.label}
                      {selectedColumn === col.key && <span className="ml-1">✓</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedData().length === 0 ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <tr key={`empty-${i}`} style={{ height: '20px' }} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={tw.cellCenter}></td>
                      <td className={tw.cellCenter}>{i + 1}</td>
                      {PREVIEW_COLUMNS.map(col => (
                        <td key={col.key} className={tw.cell}>
                          <input 
                            type="text" 
                            placeholder=""
                            className={tw.input}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  groupedData().map((row, i) => (
                    <tr 
                      key={`row-${row.processNo}-${i}`}
                      style={{ height: '20px' }}
                      className={selectedRows.has(row.processNo) ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className={tw.cellCenter}>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.has(row.processNo)}
                          onChange={() => handleRowSelect(row.processNo)}
                          className="cursor-pointer w-3 h-3"
                        />
                      </td>
                      <td className={tw.cellCenter}>{i + 1}</td>
                      {PREVIEW_COLUMNS.map(col => (
                        <td key={col.key} className={tw.cell}>
                          {row[col.key] || ''}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* 푸터 */}
          <div className="px-4 py-2 bg-gradient-to-br from-teal-50 to-gray-100 border-t-2 border-gray-800 text-[11px] text-gray-700 text-center shrink-0 font-bold">
            ▼ 총 {groupedData().length}건 ━━ 데이터 끝 ━━ ▼
          </div>
        </div>
      </div>
    </>
  );
}

// Suspense boundary wrapper
export default function CPImportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">로딩 중...</div>}>
      <CPImportPageContent />
    </Suspense>
  );
}

