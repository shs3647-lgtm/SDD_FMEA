/**
 * @file page.tsx
 * @description PFMEA 기초정보 Excel Import 메인 페이지 (2단계 프로세스)
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 2단계 프로세스로 변경
 * @prd PRD-026-pfmea-master-data-import.md
 * 
 * 프로세스:
 * Step 1: Excel Import - A1~C4 시트별 Flat 데이터 Import
 * Step 2: 워크시트 팝업 - 상위-하위 관계 지정 → 관계형 DB 완성
 * 
 * 테이블 디자인 원칙:
 * - 헤더: #00587a (진한 남청색) + 흰색 글자
 * - 첫 번째 열: #00587a + 흰색 글자
 * - 짝수 행: #e0f2fb (연한 하늘색)
 * - 홀수 행: #ffffff (흰색)
 * - 테두리: 1px solid #999
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileSpreadsheet, Database, Check, Download, Table2, Link2, Layers, AlertTriangle } from 'lucide-react';

import { ImportRowData, GeneratedRelation, CommonItem, ImportedFlatData, LevelRelation, FailureChain, ITEM_CODE_LABELS } from './types';
import { importColumns, sampleImportData, generateRelations, calculateStats, commonItems as defaultCommonItems, addCommonItemsToRelation } from './mock-data';
import CommonItemManager from './CommonItemManager';
import { downloadEmptyTemplate, downloadSampleTemplate } from './excel-template';
import { parseMultiSheetExcel, ParseResult, ProcessRelation, ProductRelation } from './excel-parser';
import LevelRelationPopup from './LevelRelationPopup';
import FailureChainPopup from './FailureChainPopup';
import ImportPreviewGrid from './ImportPreviewGrid';

export default function PFMEAImportPage() {
  // 상태 관리
  const [fileName, setFileName] = useState<string>('');
  const [importData, setImportData] = useState<ImportRowData[]>(sampleImportData);
  const [selectedProcessNo, setSelectedProcessNo] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // 다중 시트 파싱 결과
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<ProcessRelation | null>(null);

  // Step 2: L1-L2-L3 관계 지정
  const [showLevelPopup, setShowLevelPopup] = useState(false);
  const [flatData, setFlatData] = useState<ImportedFlatData[]>([]);
  const [levelRelations, setLevelRelations] = useState<LevelRelation[]>([]);

  // Step 3: 고장 인과관계 지정
  const [showFailurePopup, setShowFailurePopup] = useState(false);
  const [failureChains, setFailureChains] = useState<FailureChain[]>([]);

  // 미리보기 그리드 탭
  const [previewTab, setPreviewTab] = useState<string>('A1');

  // 공통 기초정보 관리 (추가/수정/삭제 가능)
  const [commonItemList, setCommonItemList] = useState<CommonItem[]>(defaultCommonItems);
  const [includeCommon, setIncludeCommon] = useState(true);
  const relations = generateRelations(importData);
  const stats = calculateStats(importData);
  const baseRelation = relations.find(r => r.processNo === selectedProcessNo);
  const selectedRelation = baseRelation && includeCommon ? addCommonItemsToRelation(baseRelation, commonItemList) : baseRelation;

  // 파일 선택 및 파싱
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setImportComplete(false);
      setIsParsing(true);

      try {
        const result = await parseMultiSheetExcel(file);
        setParseResult(result);
        
        // Flat 데이터 생성 (Step 2를 위해)
        const flat: ImportedFlatData[] = [];
        result.processes.forEach((p) => {
          // A 레벨
          flat.push({ id: `${p.processNo}-A1`, processNo: p.processNo, category: 'A', itemCode: 'A1', value: p.processNo, createdAt: new Date() });
          flat.push({ id: `${p.processNo}-A2`, processNo: p.processNo, category: 'A', itemCode: 'A2', value: p.processName, createdAt: new Date() });
          p.processDesc.forEach((v, i) => flat.push({ id: `${p.processNo}-A3-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A3', value: v, createdAt: new Date() }));
          p.productChars.forEach((v, i) => flat.push({ id: `${p.processNo}-A4-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A4', value: v, createdAt: new Date() }));
          p.failureModes.forEach((v, i) => flat.push({ id: `${p.processNo}-A5-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A5', value: v, createdAt: new Date() }));
          p.detectionCtrls.forEach((v, i) => flat.push({ id: `${p.processNo}-A6-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A6', value: v, createdAt: new Date() }));
          // B 레벨
          p.workElements.forEach((v, i) => flat.push({ id: `${p.processNo}-B1-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B1', value: v, createdAt: new Date() }));
          p.elementFuncs.forEach((v, i) => flat.push({ id: `${p.processNo}-B2-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B2', value: v, createdAt: new Date() }));
          p.processChars.forEach((v, i) => flat.push({ id: `${p.processNo}-B3-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B3', value: v, createdAt: new Date() }));
          p.failureCauses.forEach((v, i) => flat.push({ id: `${p.processNo}-B4-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B4', value: v, createdAt: new Date() }));
          p.preventionCtrls.forEach((v, i) => flat.push({ id: `${p.processNo}-B5-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B5', value: v, createdAt: new Date() }));
        });
        // C 레벨 (완제품)
        result.products.forEach((p) => {
          flat.push({ id: `C1-${p.productProcessName}`, processNo: 'ALL', category: 'C', itemCode: 'C1', value: p.productProcessName, createdAt: new Date() });
          p.productFuncs.forEach((v, i) => flat.push({ id: `C2-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C2', value: v, createdAt: new Date() }));
          p.requirements.forEach((v, i) => flat.push({ id: `C3-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C3', value: v, createdAt: new Date() }));
          p.failureEffects.forEach((v, i) => flat.push({ id: `C4-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C4', value: v, createdAt: new Date() }));
        });
        setFlatData(flat);
        
        // 첫 번째 공정 선택
        if (result.processes.length > 0) {
          setSelectedProcessNo(result.processes[0].processNo);
          setSelectedProcess(result.processes[0]);
        }
      } catch (error) {
        console.error('파싱 오류:', error);
      } finally {
        setIsParsing(false);
      }
    }
  };

  // 공정 선택 변경
  const handleProcessChange = (processNo: string) => {
    setSelectedProcessNo(processNo);
    const process = parseResult?.processes.find(p => p.processNo === processNo);
    setSelectedProcess(process || null);
  };

  // Step 2: L1-L2-L3 관계 저장/삭제
  const handleSaveLevelRelation = (relation: LevelRelation) => {
    setLevelRelations(prev => [...prev, relation]);
  };

  const handleDeleteLevelRelation = (relationId: string) => {
    setLevelRelations(prev => prev.filter(r => r.id !== relationId));
  };

  // Step 3: 고장 인과관계 저장/삭제
  const handleSaveFailureChain = (chain: FailureChain) => {
    setFailureChains(prev => [...prev, chain]);
  };

  const handleDeleteFailureChain = (chainId: string) => {
    setFailureChains(prev => prev.filter(c => c.id !== chainId));
  };

  // Import 실행 (시뮬레이션)
  const handleImport = async () => {
    setIsImporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsImporting(false);
    setImportComplete(true);
  };

  // 고유 공정 목록
  const uniqueProcesses = Array.from(new Set(importData.map(d => d.processNo)))
    .map(no => ({ no, name: importData.find(d => d.processNo === no)?.processName || '' }));

  return (
    <div className="p-5 min-h-full" style={{ background: '#f5f5f5', fontFamily: '"Malgun Gothic", sans-serif' }}>
      {/* 페이지 헤더 */}
      <div className="max-w-[1400px] mx-auto mb-5">
        <h1 className="text-2xl font-bold text-[#00587a] mb-2">PFMEA 기초정보 Excel Import</h1>
        <div className="p-4 border-l-4 border-[#00587a]" style={{ background: '#e0f2fb' }}>
          <strong>안내:</strong> <span className="font-semibold text-[#00587a]">1개 시트, 16컬럼</span>만 입력하면 시스템이 공정번호 기준으로 <span className="font-semibold text-[#00587a]">관계형 DB를 자동 생성</span>합니다.
        </div>
      </div>

      {/* 16개 기초정보 항목 - 번호 부여 */}
      <div className="max-w-[1400px] mx-auto mb-3">
        <div className="bg-white rounded-lg px-4 py-2" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {/* A: 공정 레벨 (6개) */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-bold text-[#00587a] mr-1 whitespace-nowrap">A.공정:</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-400 text-xs text-blue-700 whitespace-nowrap">A1.공정번호</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-400 text-xs text-blue-700 whitespace-nowrap">A2.공정명</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-400 text-xs text-blue-700 whitespace-nowrap">A3.공정기능(설명)</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-400 text-xs text-blue-700 whitespace-nowrap">A4.제품특성</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-400 text-xs text-blue-700 whitespace-nowrap">A5.고장형태</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-400 text-xs text-blue-700 whitespace-nowrap">A6.검출관리</span>
            
            <span className="mx-2 text-gray-300">|</span>
            
            {/* B: 작업요소 레벨 (5개) */}
            <span className="text-xs font-bold text-green-700 mr-1 whitespace-nowrap">B.작업요소:</span>
            <span className="px-2 py-0.5 rounded bg-green-50 border border-green-400 text-xs text-green-700 whitespace-nowrap">B1.작업요소(설비)</span>
            <span className="px-2 py-0.5 rounded bg-green-50 border border-green-400 text-xs text-green-700 whitespace-nowrap">B2.요소기능</span>
            <span className="px-2 py-0.5 rounded bg-green-50 border border-green-400 text-xs text-green-700 whitespace-nowrap">B3.공정특성</span>
            <span className="px-2 py-0.5 rounded bg-green-50 border border-green-400 text-xs text-green-700 whitespace-nowrap">B4.고장원인</span>
            <span className="px-2 py-0.5 rounded bg-green-50 border border-green-400 text-xs text-green-700 whitespace-nowrap">B5.예방관리</span>
            
            <span className="mx-2 text-gray-300">|</span>
            
            {/* C: 완제품 레벨 (4개) */}
            <span className="text-xs font-bold text-red-700 mr-1 whitespace-nowrap">C.완제품:</span>
            <span className="px-2 py-0.5 rounded bg-red-50 border border-red-300 text-xs text-red-700 whitespace-nowrap">C1.완제품공정명</span>
            <span className="px-2 py-0.5 rounded bg-red-50 border border-red-300 text-xs text-red-700 whitespace-nowrap">C2.제품(반)기능</span>
            <span className="px-2 py-0.5 rounded bg-red-50 border border-red-300 text-xs text-red-700 whitespace-nowrap">C3.제품(반)요구사항</span>
            <span className="px-2 py-0.5 rounded bg-red-50 border border-red-300 text-xs text-red-700 whitespace-nowrap">C4.고장영향</span>
          </div>

          {/* 공통항목 (6M) */}
          <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-200">
            <span className="text-xs font-bold text-purple-700 mr-1 whitespace-nowrap">공통(6M):</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-300 text-xs text-purple-700 whitespace-nowrap">👤사람</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-300 text-xs text-purple-700 whitespace-nowrap">📦자재</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-300 text-xs text-purple-700 whitespace-nowrap">📋방법</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-300 text-xs text-purple-700 whitespace-nowrap">📏측정</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-300 text-xs text-purple-700 whitespace-nowrap">🌡️환경</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-300 text-xs text-purple-700 whitespace-nowrap">🧴부자재</span>
            <span className="text-[10px] text-gray-500 ml-1">← 모든 공정 자동적용 (B1.작업요소에 포함)</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 좌측: Excel Import 영역 */}
        <div className="space-y-5">
          {/* 파일 선택 카드 */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 className="text-lg font-bold text-[#00587a] mb-4 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel 파일 선택
            </h2>
            
            <div className="flex gap-3">
              <Input type="text" placeholder="파일을 선택하세요..." value={fileName} readOnly className="flex-1" />
              <label className="cursor-pointer">
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                <Button className="bg-[#00587a] hover:bg-[#004560] text-white" asChild>
                  <span><Upload className="h-4 w-4 mr-2" />찾아보기...</span>
                </Button>
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#00587a] text-[#00587a] hover:bg-[#e0f2fb]"
                onClick={() => downloadEmptyTemplate()}
              >
                <Download className="h-4 w-4 mr-2" />
                빈 템플릿 다운로드
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#00587a] text-[#00587a] hover:bg-[#e0f2fb]"
                onClick={() => downloadSampleTemplate()}
              >
                <Download className="h-4 w-4 mr-2" />
                샘플 데이터 다운로드
              </Button>
            </div>

            {fileName && (
              <div className="mt-3 p-3 border-l-4 border-green-500 text-sm text-green-700" style={{ background: '#d1fae5' }}>
                파일 로드됨: {fileName}
              </div>
            )}

            {/* Import 결과 통계 - 파일 선택 바로 아래 */}
            {flatData.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-[#00587a] mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Import 미리보기
                </h3>
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>총 행</th>
                      <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>공정 수</th>
                      <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>A.공정</th>
                      <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>B.작업요소</th>
                      <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>C.완제품</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="bg-white text-center text-black font-bold text-xl py-2" style={{ border: '1px solid #999' }}>
                        {flatData.length}
                      </td>
                      <td className="bg-[#e0f2fb] text-center text-[#00587a] font-bold text-xl py-2" style={{ border: '1px solid #999' }}>
                        {new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo)).size}
                      </td>
                      <td className="bg-blue-50 text-center text-blue-600 font-bold text-xl py-2" style={{ border: '1px solid #999' }}>
                        {flatData.filter(d => d.itemCode.startsWith('A')).length}
                      </td>
                      <td className="bg-green-50 text-center text-green-600 font-bold text-xl py-2" style={{ border: '1px solid #999' }}>
                        {flatData.filter(d => d.itemCode.startsWith('B')).length}
                      </td>
                      <td className="bg-red-50 text-center text-red-600 font-bold text-xl py-2" style={{ border: '1px solid #999' }}>
                        {flatData.filter(d => d.itemCode.startsWith('C')).length}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Import 데이터 미리보기 그리드 */}
          {flatData.length > 0 && (
            <ImportPreviewGrid
              data={flatData}
              onDataChange={setFlatData}
              onSave={() => {
                setImportComplete(true);
                console.log('저장 완료:', flatData.length, '개 항목');
              }}
            />
          )}

          {/* 공통 기초정보 (추가/수정/삭제 가능) */}
          <CommonItemManager
            items={commonItemList}
            onItemsChange={setCommonItemList}
            includeCommon={includeCommon}
            onIncludeCommonChange={setIncludeCommon}
          />

          {/* 16컬럼 형식 안내 - 표준 테이블 디자인 */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 className="text-lg font-bold text-[#00587a] mb-4 flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Excel 형식 (16컬럼)
            </h2>

            <div className="overflow-x-auto max-h-[200px]">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead className="sticky top-0">
                  <tr>
                    <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>컬럼</th>
                    <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-left" style={{ border: '1px solid #999' }}>필드명</th>
                    <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>레벨</th>
                    <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>필수</th>
                  </tr>
                </thead>
                <tbody>
                  {importColumns.map((col, i) => (
                    <tr key={col.key}>
                      {/* 첫 번째 열: row-header 스타일 */}
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>
                        {col.label.split('.')[0]}
                      </td>
                      <td className={`px-3 py-2 text-left text-black ${i % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        {col.label}
                      </td>
                      <td className={`px-3 py-2 text-center ${i % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        <Badge className={
                          col.level === 'A' ? 'bg-blue-500' :
                          col.level === 'B' ? 'bg-green-500' :
                          col.level === 'C' ? 'bg-red-500' : 'bg-gray-500'
                        }>{col.level}</Badge>
                      </td>
                      <td className={`px-3 py-2 text-center text-black ${i % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        {col.required ? 'O' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 미리보기 통계 - 표준 디자인 */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 className="text-lg font-bold text-[#00587a] mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Import 미리보기
            </h2>

            {/* 통계 테이블 - 표준 디자인 */}
            <table className="w-full text-sm mb-4" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>총 행</th>
                  <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>공정 수</th>
                  <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>A.공정</th>
                  <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>B.작업요소</th>
                  <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>C.완제품</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="bg-white text-center text-black font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.totalRows}</td>
                  <td className="bg-[#e0f2fb] text-center text-[#00587a] font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.uniqueProcesses}</td>
                  <td className="bg-blue-50 text-center text-blue-600 font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.l1Items}</td>
                  <td className="bg-green-50 text-center text-green-600 font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.l2Items}</td>
                  <td className="bg-red-50 text-center text-red-600 font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.l3Items}</td>
                </tr>
              </tbody>
            </table>

            <Button
              className="w-full bg-[#00587a] hover:bg-[#004560] text-white font-bold py-3"
              disabled={!fileName || isImporting}
              onClick={handleImport}
            >
              {isImporting ? '관계형 DB 생성 중...' : 'Import 실행 → 관계형 DB 자동 생성'}
            </Button>

            {importComplete && (
              <div className="mt-3 p-3 border-l-4 border-green-500 text-sm text-green-700" style={{ background: '#d1fae5' }}>
                Import 완료! {stats.uniqueProcesses}개 공정, 15개 관계형 테이블 자동 생성됨
              </div>
            )}
          </div>
        </div>

        {/* 우측: 자동 생성된 관계형 데이터 확인 */}
        <div className="space-y-5">
          {/* 파싱 결과 요약 */}
          {parseResult && (
            <div className="bg-white rounded-lg p-5" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 className="text-lg font-bold text-[#00587a] mb-4">
                시트별 파싱 결과
              </h2>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {parseResult.sheetSummary.filter(s => s.rowCount > 0).map((sheet) => (
                  <div key={sheet.name} className="px-2 py-1 rounded bg-[#e0f2fb] text-center">
                    <span className="font-bold text-[#00587a]">{sheet.name}</span>
                    <span className="text-gray-600 ml-1">({sheet.rowCount})</span>
                  </div>
                ))}
              </div>
              {parseResult.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded text-xs text-red-600">
                  {parseResult.errors.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* 공정 선택 - 표준 디자인 */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 className="text-lg font-bold text-[#00587a] mb-4">
              공정번호 기준 자동 생성된 관계
            </h2>

            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td className="bg-[#00587a] text-white font-bold px-3 py-2 text-center w-24" style={{ border: '1px solid #999' }}>공정번호</td>
                  <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                    <Select value={selectedProcessNo} onValueChange={handleProcessChange}>
                      <SelectTrigger className="w-full border-0 shadow-none">
                        <SelectValue placeholder="공정을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {parseResult?.processes.map((p) => (
                          <SelectItem key={p.processNo} value={p.processNo}>
                            {p.processNo} - {p.processName}
                          </SelectItem>
                        )) || uniqueProcesses.map((p) => (
                          <SelectItem key={p.no} value={p.no}>
                            {p.no} - {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 다중 시트 파싱 결과 표시 */}
          {selectedProcess && (
            <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {/* A 레벨: 공정 */}
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th colSpan={2} className="bg-blue-500 text-white font-bold px-3 py-2 text-left" style={{ border: '1px solid #999' }}>
                      A.공정 레벨 ({selectedProcess.processNo} - {selectedProcess.processName})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProcess.processDesc.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2 w-28" style={{ border: '1px solid #999' }}>A3.공정기능</td>
                      <td className="bg-white px-3 py-2 text-black" style={{ border: '1px solid #999' }}>
                        {selectedProcess.processDesc.join(', ')}
                      </td>
                    </tr>
                  )}
                  {selectedProcess.productChars.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>A4.제품특성</td>
                      <td className="bg-[#e0f2fb] px-3 py-2" style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcess.productChars.map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-blue-500 text-blue-600">{item}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedProcess.failureModes.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>A5.고장형태</td>
                      <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcess.failureModes.map((item, i) => (
                            <Badge key={i} className="text-xs bg-red-500 text-white">{item}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedProcess.detectionCtrls.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>A6.검출관리</td>
                      <td className="bg-[#e0f2fb] px-3 py-2" style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcess.detectionCtrls.map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-blue-500 text-blue-600">{item}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* B 레벨: 작업요소 */}
              <table className="w-full text-sm mt-0" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th colSpan={2} className="bg-green-500 text-white font-bold px-3 py-2 text-left" style={{ border: '1px solid #999' }}>
                      B.작업요소 레벨
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProcess.workElements.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2 w-28" style={{ border: '1px solid #999' }}>B1.작업요소</td>
                      <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcess.workElements.map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-green-500 text-green-600">{item}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedProcess.elementFuncs.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>B2.요소기능</td>
                      <td className="bg-[#e0f2fb] px-3 py-2" style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcess.elementFuncs.map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-green-500 text-green-600">{item}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedProcess.processChars.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>B3.공정특성</td>
                      <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcess.processChars.map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-green-500 text-green-600">{item}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedProcess.failureCauses.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>B4.고장원인</td>
                      <td className="bg-[#e0f2fb] px-3 py-2" style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcess.failureCauses.map((item, i) => (
                            <Badge key={i} className="text-xs bg-orange-500 text-white">{item}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedProcess.preventionCtrls.length > 0 && (
                    <tr>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>B5.예방관리</td>
                      <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcess.preventionCtrls.map((item, i) => (
                            <Badge key={i} className="text-xs bg-green-600 text-white">{item}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* C 레벨: 완제품 */}
          {parseResult && parseResult.products.length > 0 && (
            <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th colSpan={2} className="bg-red-500 text-white font-bold px-3 py-2 text-left" style={{ border: '1px solid #999' }}>
                      C.완제품 레벨 (공통)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.products.map((product, idx) => (
                    <tr key={product.productProcessName}>
                      <td className="bg-[#00587a] text-white font-bold px-3 py-2 w-28" style={{ border: '1px solid #999' }}>
                        {product.productProcessName}
                      </td>
                      <td className={`px-3 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        <div className="flex flex-wrap gap-1">
                          {product.productFuncs.map((f, i) => (
                            <Badge key={`f-${i}`} variant="outline" className="text-xs border-red-400 text-red-600">{f}</Badge>
                          ))}
                          {product.requirements.map((r, i) => (
                            <Badge key={`r-${i}`} variant="outline" className="text-xs border-red-400 text-red-600">{r}</Badge>
                          ))}
                          {product.failureEffects.map((e, i) => (
                            <Badge key={`e-${i}`} className="text-xs bg-red-500 text-white">{e}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Step 2: L1-L2-L3 관계 지정 버튼 */}
          {parseResult && parseResult.processes.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Step 2: L1-L2-L3 계층 관계 지정
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                완제품(L1) → 공정(L2) → 작업요소(L3) 계층 구조를 지정하세요.
              </p>
              <Button 
                onClick={() => setShowLevelPopup(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Layers className="h-4 w-4 mr-2" />
                L1-L2-L3 관계 지정
                {levelRelations.length > 0 && (
                  <Badge className="ml-2 bg-white text-blue-700">
                    {levelRelations.length}개 연결
                  </Badge>
                )}
              </Button>
            </div>
          )}

          {/* Step 3: 고장 인과관계 지정 버튼 */}
          {parseResult && parseResult.processes.length > 0 && levelRelations.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Step 3: 고장 인과관계 지정
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                고장원인(FC) → 고장형태(FM) → 고장영향(FE) 인과관계를 지정하세요.
              </p>
              <Button 
                onClick={() => setShowFailurePopup(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!selectedProcessNo}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                고장 인과관계 지정 ({selectedProcessNo || '공정 선택 필요'})
                {failureChains.length > 0 && (
                  <Badge className="ml-2 bg-white text-orange-700">
                    {failureChains.length}개 체인
                  </Badge>
                )}
              </Button>
            </div>
          )}

          {/* 확정 버튼 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="border-[#999] text-gray-600 hover:bg-gray-100">취소</Button>
            <Button 
              className="bg-[#00587a] hover:bg-[#004560] text-white font-bold" 
              disabled={!parseResult || levelRelations.length === 0 || failureChains.length === 0}
              onClick={handleImport}
            >
              {isImporting ? '관계형 DB 생성 중...' : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  관계형 DB 완성 (L1-L2-L3: {levelRelations.length}, FC-FM-FE: {failureChains.length})
                </>
              )}
            </Button>
          </div>

          {importComplete && (
            <div className="p-3 border-l-4 border-green-500 text-sm text-green-700" style={{ background: '#d1fae5' }}>
              Import 완료! {parseResult?.processes.length}개 공정, {parseResult?.products.length}개 완제품 관계형 DB 생성됨
            </div>
          )}

          {/* 색상 범례 */}
          <div className="bg-white rounded-lg p-4 mt-5" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#00587a]" style={{ border: '1px solid #999' }}></div>
                <span>헤더/좌측열: #00587a</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#e0f2fb]" style={{ border: '1px solid #999' }}></div>
                <span>짝수 행: #e0f2fb</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white" style={{ border: '1px solid #999' }}></div>
                <span>홀수 행: #ffffff</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: L1-L2-L3 관계 지정 팝업 */}
      <LevelRelationPopup
        isOpen={showLevelPopup}
        onClose={() => setShowLevelPopup(false)}
        flatData={flatData}
        existingRelations={levelRelations}
        onSaveRelation={handleSaveLevelRelation}
        onDeleteRelation={handleDeleteLevelRelation}
      />

      {/* Step 3: 고장 인과관계 지정 팝업 */}
      <FailureChainPopup
        isOpen={showFailurePopup}
        onClose={() => setShowFailurePopup(false)}
        processNo={selectedProcessNo}
        processName={selectedProcess?.processName || ''}
        flatData={flatData}
        existingChains={failureChains}
        onSaveChain={handleSaveFailureChain}
        onDeleteChain={handleDeleteFailureChain}
      />
    </div>
  );
}
