/**
 * @file page.tsx
 * @description CP 기초정보 Excel Import 페이지 (모듈화 완료)
 * @updated 2026-01-13 - 3개 미리보기 탭 + 행별 수정/삭제/저장
 * @line-count ~500줄
 */

'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Pencil, Trash2, Save, X } from 'lucide-react';
import ExcelJS from 'exceljs';
import CPTopNav from '@/components/layout/CPTopNav';
import { CPProject, ImportedData } from './types';
import { PREVIEW_COLUMNS, GROUP_SHEET_OPTIONS, INDIVIDUAL_SHEET_OPTIONS, GROUP_HEADERS, tw } from './constants';
import { useImportHandlers } from './hooks';

type PreviewTab = 'full' | 'group' | 'individual';

// 개별 항목 컬럼 매핑
const ITEM_COLUMN_MAP: Record<string, string> = {
  processName: 'processName', processDesc: 'processDesc', equipment: 'equipment',
  productChar: 'productChar', processChar: 'processChar', spec: 'spec',
  evalMethod: 'evalMethod', sampleSize: 'sampleSize', frequency: 'frequency',
  reactionPlanItem: 'reactionPlan', ep: 'ep', autoDetector: 'autoDetector',
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
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  
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
          // 공정번호 데이터
          parsedData.push({
            id: `i-${rowNumber}-1`,
            processNo,
            category: 'individual',
            itemCode: 'processNo',
            value: processNo,
            createdAt: new Date(),
          });
          // 개별 항목 데이터
          parsedData.push({
            id: `i-${rowNumber}-2`,
            processNo,
            category: 'individual',
            itemCode,
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

  // 전체/그룹 파일 선택 (임시 구현)
  const handleFullFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFullFileName(file.name);
    setIsFullParsing(true);
    setTimeout(() => {
      const sampleData: ImportedData[] = [
        { id: '1', processNo: '10', category: 'full', itemCode: 'processNo', value: '10', createdAt: new Date() },
        { id: '2', processNo: '10', category: 'full', itemCode: 'processName', value: '자재입고', createdAt: new Date() },
      ];
      setFullPendingData(sampleData);
      setIsFullParsing(false);
    }, 500);
  };
  
  const handleGroupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGroupFileName(file.name);
    setIsGroupParsing(true);
    setTimeout(() => {
      const sampleData: ImportedData[] = [
        { id: 'g1', processNo: '10', category: selectedSheet, itemCode: 'processNo', value: '10', createdAt: new Date() },
      ];
      setGroupPendingData(sampleData);
      setIsGroupParsing(false);
    }, 500);
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

  // ===== 행별 수정/삭제/저장 =====
  const handleEditRow = (processNo: string, data: ImportedData[]) => {
    setEditingRowId(processNo);
    const row = data.filter(d => d.processNo === processNo);
    const values: Record<string, string> = {};
    row.forEach(r => { values[r.itemCode] = r.value; });
    setEditValues(values);
  };
  
  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditValues({});
  };
  
  const handleSaveRow = (processNo: string, tab: PreviewTab) => {
    const setData = tab === 'full' ? setFullData : tab === 'group' ? setGroupData : setItemData;
    
    setData(prev => prev.map(d => {
      if (d.processNo === processNo && editValues[d.itemCode] !== undefined) {
        return { ...d, value: editValues[d.itemCode] };
      }
      return d;
    }));
    
    setEditingRowId(null);
    setEditValues({});
  };
  
  const handleDeleteRow = (processNo: string, tab: PreviewTab) => {
    if (!confirm(`공정번호 "${processNo}" 행을 삭제하시겠습니까?`)) return;
    if (tab === 'full') setFullData(prev => prev.filter(d => d.processNo !== processNo));
    else if (tab === 'group') setGroupData(prev => prev.filter(d => d.processNo !== processNo));
    else setItemData(prev => prev.filter(d => d.processNo !== processNo));
  };

  // ===== 전체 저장 =====
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const key = `cp-import-data-${selectedCpId}`;
      localStorage.setItem(key, JSON.stringify({ full: fullData, group: groupData, item: itemData }));
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

  // 미리보기 테이블 렌더링
  const renderPreviewTable = (data: ImportedData[], tab: PreviewTab) => {
    const processNos = [...new Set(data.map(d => d.processNo))];
    
    return (
      <table className="w-full border-collapse min-w-[1050px] border-spacing-0">
        <thead className="sticky top-0 z-[1]">
          <tr className="h-[18px]">
            <th colSpan={3} className="bg-gray-600 text-white text-[10px] font-medium text-center border border-gray-400 antialiased">관리</th>
            {GROUP_HEADERS.map(grp => (
              <th key={grp.key} colSpan={grp.colSpan} className={`${grp.color} text-white text-[10px] font-medium text-center border border-gray-400 antialiased`}>
                {grp.label}
              </th>
            ))}
          </tr>
          <tr className="h-[22px]">
            <th className={`${tw.headerCell} w-[22px]`}>
              <input type="checkbox" className="w-3 h-3" onChange={(e) => {
                if (e.target.checked) setSelectedRows(new Set(data.map(d => d.processNo)));
                else setSelectedRows(new Set());
              }} />
            </th>
            <th className={`${tw.headerCell} w-[25px]`}>No</th>
            <th className={`${tw.headerCell} w-[45px]`}>작업</th>
            {PREVIEW_COLUMNS.map(col => {
              const groupColor = { processInfo: 'bg-teal-500', detector: 'bg-purple-500', controlItem: 'bg-blue-500', controlMethod: 'bg-green-500', reactionPlan: 'bg-orange-400' }[col.group || 'processInfo'];
              return (
                <th key={col.key} className={`${groupColor} text-white px-0.5 py-0.5 border border-gray-400 text-[10px] font-medium text-center ${col.width} cursor-pointer whitespace-nowrap antialiased ${selectedColumn === col.key ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => handleColumnClick(col.key)}>
                  {col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {processNos.length === 0 ? (
            Array.from({ length: 10 }).map((_, i) => (
              <tr key={`empty-${i}`} className={`h-5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className={tw.cellCenter}></td>
                <td className={tw.cellCenter}>{i + 1}</td>
                <td className={tw.cellCenter}></td>
                {PREVIEW_COLUMNS.map(col => <td key={col.key} className={tw.cell}></td>)}
              </tr>
            ))
          ) : (
            processNos.map((processNo, i) => {
              const row = data.filter(d => d.processNo === processNo);
              const getValue = (key: string) => row.find(r => r.itemCode === key)?.value || '';
              const isEditing = editingRowId === processNo;
              
              return (
                <tr key={`row-${processNo}-${i}`} className={`h-5 ${selectedRows.has(processNo) ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className={tw.cellCenter}>
                    <input type="checkbox" className="w-2.5 h-2.5" checked={selectedRows.has(processNo)} onChange={() => handleRowSelect(processNo)} />
                  </td>
                  <td className={tw.cellCenter}>{i + 1}</td>
                  <td className={tw.cellCenter}>
                    <div className="flex items-center justify-center gap-0.5">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveRow(processNo, tab)} className="p-0.5 bg-green-500 text-white rounded hover:bg-green-600" title="저장">
                            <Save size={9} />
                          </button>
                          <button onClick={handleCancelEdit} className="p-0.5 bg-gray-400 text-white rounded hover:bg-gray-500" title="취소">
                            <X size={9} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditRow(processNo, data)} className="p-0.5 bg-blue-500 text-white rounded hover:bg-blue-600" title="수정">
                            <Pencil size={9} />
                          </button>
                          <button onClick={() => handleDeleteRow(processNo, tab)} className="p-0.5 bg-red-500 text-white rounded hover:bg-red-600" title="삭제">
                            <Trash2 size={9} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  {PREVIEW_COLUMNS.map(col => (
                    <td key={col.key} className={`${tw.cell} ${selectedColumn === col.key ? 'bg-yellow-100' : ''}`}>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editValues[col.key] ?? getValue(col.key)} 
                          onChange={(e) => setEditValues(prev => ({ ...prev, [col.key]: e.target.value }))}
                          className="w-full px-0.5 py-0 border border-blue-400 rounded text-[10px] bg-white focus:outline-none font-normal antialiased" 
                        />
                      ) : (
                        <span className="antialiased font-normal">{getValue(col.key)}</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  return (
    <>
      <CPTopNav selectedCpId={selectedCpId} />
      
      <div className="min-h-screen bg-[#f5f7fa] px-2 py-2 pt-9 font-[Malgun_Gothic]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2 bg-white px-2 py-1 rounded border border-gray-300">
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
        <div className={tw.tableWrapper}>
          <table className="w-full border-collapse">
            <tbody>
              {/* 1행: 전체 */}
              <tr className="h-7">
                <td className={`${tw.rowHeader} w-[70px]`}>CP 선택</td>
                <td className={`${tw.cell} w-[100px]`}>
                  <select value={selectedCpId} onChange={(e) => setSelectedCpId(e.target.value)} className={tw.select}>
                    <option value="">선택</option>
                    {cpList.map((cp, idx) => <option key={`${cp.id}-${idx}`} value={cp.id}>{cp.id}</option>)}
                  </select>
                </td>
                <td className={`${tw.rowHeader} w-[70px]`}>전체 다운</td>
                <td className={`${tw.cell} w-[130px]`}>
                  <div className="flex items-center gap-1">
                    <button onClick={downloadFullTemplate} className={tw.btnPrimary}>📥양식</button>
                    <button onClick={downloadFullSampleTemplate} className={tw.btnBlue}>📥샘플</button>
                  </div>
                </td>
                <td className={`${tw.rowHeader} w-[50px]`}>Import</td>
                <td className={`${tw.cell} w-[180px]`}>
                  <div className="flex items-center gap-1">
                    <input type="file" ref={fullFileInputRef} accept=".xlsx,.xls" onChange={handleFullFileSelect} className="hidden" />
                    <button onClick={() => fullFileInputRef.current?.click()} className={tw.btnBrowse}>{fullFileName || '파일 선택'}</button>
                    <button onClick={handleFullImport} disabled={fullPendingData.length === 0 || isFullImporting} className={fullPendingData.length === 0 ? tw.btnSuccessDisabled : tw.btnBlue}>
                      {isFullImporting ? '...' : '적용'}
                    </button>
                  </div>
                </td>
                <td className={`${tw.cellCenter} w-[60px]`}>
                  {isFullParsing && <span className="text-blue-500 text-[10px]">파싱중...</span>}
                  {fullImportSuccess && <span className="text-green-500 text-[10px]"><CheckCircle size={12} /></span>}
                  {!isFullParsing && !fullImportSuccess && <span className="text-gray-400 text-[10px]">{fullPendingData.length > 0 ? `${fullPendingData.length}건` : '대기'}</span>}
                </td>
              </tr>
              {/* 2행: 그룹 시트 */}
              <tr className="h-7">
                <td className={`${tw.rowHeader}`}>그룹 시트</td>
                <td className={`${tw.cell}`}>
                  <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} className={tw.select}>
                    {GROUP_SHEET_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </td>
                <td className={`${tw.rowHeader}`}>그룹 다운</td>
                <td className={`${tw.cell}`}>
                  <div className="flex items-center gap-1">
                    <button onClick={downloadGroupSheetTemplate} className={tw.btnPrimary}>📥양식</button>
                    <button onClick={downloadGroupSheetSampleTemplate} className={tw.btnBlue}>📥샘플</button>
                  </div>
                </td>
                <td className={`${tw.rowHeader}`}>Import</td>
                <td className={`${tw.cell}`}>
                  <div className="flex items-center gap-1">
                    <input type="file" ref={groupFileInputRef} accept=".xlsx,.xls" onChange={handleGroupFileSelect} className="hidden" />
                    <button onClick={() => groupFileInputRef.current?.click()} className={tw.btnBrowse}>{groupFileName || '파일 선택'}</button>
                    <button onClick={handleGroupImport} disabled={groupPendingData.length === 0 || isGroupImporting} className={groupPendingData.length === 0 ? tw.btnSuccessDisabled : tw.btnBlue}>
                      {isGroupImporting ? '...' : '적용'}
                    </button>
                  </div>
                </td>
                <td className={`${tw.cellCenter}`}>
                  {isGroupParsing && <span className="text-blue-500 text-[10px]">파싱중...</span>}
                  {groupImportSuccess && <span className="text-green-500 text-[10px]"><CheckCircle size={12} /></span>}
                  {!isGroupParsing && !groupImportSuccess && <span className="text-gray-400 text-[10px]">{groupPendingData.length > 0 ? `${groupPendingData.length}건` : '대기'}</span>}
                </td>
              </tr>
              {/* 3행: 개별 항목 */}
              <tr className="h-7">
                <td className={`${tw.rowHeader}`}>개별 항목</td>
                <td className={`${tw.cell}`}>
                  <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className={tw.select}>
                    {INDIVIDUAL_SHEET_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </td>
                <td className={`${tw.rowHeader}`}>개별 다운</td>
                <td className={`${tw.cell}`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => downloadItemTemplate(selectedItem)} className={tw.btnOrange}>📥양식</button>
                    <button onClick={() => downloadItemSampleTemplate(selectedItem)} className="px-2 py-0.5 bg-orange-600 text-white border-none rounded cursor-pointer text-[10px] font-bold">📥샘플</button>
                  </div>
                </td>
                <td className={`${tw.rowHeader}`}>Import</td>
                <td className={`${tw.cell}`}>
                  <div className="flex items-center gap-1">
                    <input type="file" ref={itemFileInputRef} accept=".xlsx,.xls" onChange={handleItemFileSelect} className="hidden" />
                    <button onClick={() => itemFileInputRef.current?.click()} className={tw.btnBrowse}>{itemFileName || '파일 선택'}</button>
                    <button onClick={handleItemImport} disabled={itemPendingData.length === 0 || isItemImporting} className={itemPendingData.length === 0 ? tw.btnSuccessDisabled : tw.btnOrange}>
                      {isItemImporting ? '...' : '적용'}
                    </button>
                  </div>
                </td>
                <td className={`${tw.cellCenter}`}>
                  {isItemParsing && <span className="text-orange-500 text-[10px]">파싱중...</span>}
                  {itemImportSuccess && <span className="text-green-500 text-[10px]"><CheckCircle size={12} /></span>}
                  {!isItemParsing && !itemImportSuccess && <span className="text-gray-400 text-[10px]">{itemPendingData.length > 0 ? `${itemPendingData.length}건` : '대기'}</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 미리보기 탭 */}
        <div className="flex items-center gap-1 mt-2 mb-1">
          <span className="text-xs text-gray-600 font-semibold mr-2">📋 미리보기:</span>
          <button onClick={() => setActiveTab('full')} className={`px-3 py-1 text-[11px] font-bold rounded-t border border-b-0 ${activeTab === 'full' ? 'bg-teal-500 text-white border-teal-500' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
            전체 Import ({stats.full}건)
          </button>
          <button onClick={() => setActiveTab('group')} className={`px-3 py-1 text-[11px] font-bold rounded-t border border-b-0 ${activeTab === 'group' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
            그룹 시트 ({stats.group}건)
          </button>
          <button onClick={() => setActiveTab('individual')} className={`px-3 py-1 text-[11px] font-bold rounded-t border border-b-0 ${activeTab === 'individual' ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
            개별 항목 ({stats.item}건)
          </button>
        </div>

        {/* 미리보기 테이블 */}
        <div className={`flex-1 overflow-x-auto overflow-y-auto max-h-[380px] bg-white border-2 ${activeTab === 'full' ? 'border-teal-500' : activeTab === 'group' ? 'border-blue-500' : 'border-orange-500'}`}>
          {activeTab === 'full' && renderPreviewTable(fullData, 'full')}
          {activeTab === 'group' && renderPreviewTable(groupData, 'group')}
          {activeTab === 'individual' && renderPreviewTable(itemData, 'individual')}
        </div>

        {/* 하단 상태바 */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 bg-white px-2 py-1 rounded border border-gray-300">
          <span>전체: {stats.full}개 | 그룹: {stats.group}개 | 개별: {stats.item}개</span>
          <span>버전: Control Plan Import v2.4</span>
        </div>
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
