/**
 * @file page.tsx
 * @description PFMEA 기초정보 Excel Import 메인 페이지 (단순화 버전)
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 1시트 16컬럼 방식으로 변경
 * @updated 2025-12-26 - table-design-reference.html 표준 디자인 적용
 * @prd PRD-026-pfmea-master-data-import.md
 * 
 * 사용자는 1개 시트에 16컬럼만 입력하면
 * 시스템이 공정번호 기준으로 관계형 DB를 자동 생성
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
import { Upload, FileSpreadsheet, Database, Check, Download, Table2, Factory, Cog, Box, Users, Wrench, AlertTriangle, ShieldCheck, ClipboardCheck, Gauge, Settings, Package, Thermometer, Zap, Target, Search, Shield } from 'lucide-react';

import { ImportRowData, GeneratedRelation, CommonItem } from './types';
import { importColumns, sampleImportData, generateRelations, calculateStats, commonItems as defaultCommonItems, addCommonItemsToRelation } from './mock-data';
import CommonItemManager from './CommonItemManager';

export default function PFMEAImportPage() {
  // 상태 관리
  const [fileName, setFileName] = useState<string>('');
  const [importData, setImportData] = useState<ImportRowData[]>(sampleImportData);
  const [selectedProcessNo, setSelectedProcessNo] = useState<string>('80');
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  // 공통 기초정보 관리 (추가/수정/삭제 가능)
  const [commonItemList, setCommonItemList] = useState<CommonItem[]>(defaultCommonItems);
  const [includeCommon, setIncludeCommon] = useState(true);
  const relations = generateRelations(importData);
  const stats = calculateStats(importData);
  const baseRelation = relations.find(r => r.processNo === selectedProcessNo);
  const selectedRelation = baseRelation && includeCommon ? addCommonItemsToRelation(baseRelation, commonItemList) : baseRelation;

  // 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setImportComplete(false);
    }
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

      {/* 16개 기초정보 아이콘 영역 */}
      <div className="max-w-[1400px] mx-auto mb-5">
        <div className="bg-white rounded-lg p-5" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#00587a]">16개 기초정보 항목</h2>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-600 rounded"></span> KEY</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> L1</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded"></span> L2</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> L3</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded"></span> 공통</span>
            </div>
          </div>
          
          {/* 16개 아이콘 그리드 */}
          <div className="grid grid-cols-8 gap-2">
            {/* KEY 항목 (1-2) */}
            <div className="flex flex-col items-center p-2 rounded border-2 border-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
              <Factory className="h-6 w-6 text-gray-600 mb-1" />
              <span className="text-[10px] font-bold text-gray-700 text-center">공정번호</span>
              <Badge className="bg-gray-600 text-white text-[8px] mt-1">KEY</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
              <Cog className="h-6 w-6 text-gray-600 mb-1" />
              <span className="text-[10px] font-bold text-gray-700 text-center">공정명</span>
              <Badge className="bg-gray-600 text-white text-[8px] mt-1">KEY</Badge>
            </div>
            
            {/* L1 항목 (8-10) */}
            <div className="flex flex-col items-center p-2 rounded border-2 border-red-400 bg-red-50 hover:bg-red-100 transition-colors">
              <Package className="h-6 w-6 text-red-500 mb-1" />
              <span className="text-[10px] font-bold text-red-700 text-center">완제품기능</span>
              <Badge className="bg-red-500 text-white text-[8px] mt-1">L1</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-red-400 bg-red-50 hover:bg-red-100 transition-colors">
              <Target className="h-6 w-6 text-red-500 mb-1" />
              <span className="text-[10px] font-bold text-red-700 text-center">요구사항</span>
              <Badge className="bg-red-500 text-white text-[8px] mt-1">L1</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-red-400 bg-red-50 hover:bg-red-100 transition-colors">
              <AlertTriangle className="h-6 w-6 text-red-500 mb-1" />
              <span className="text-[10px] font-bold text-red-700 text-center">고장영향</span>
              <Badge className="bg-red-500 text-white text-[8px] mt-1">L1</Badge>
            </div>
            
            {/* L2 항목 (3-4, 11, 13, 16) */}
            <div className="flex flex-col items-center p-2 rounded border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <Settings className="h-6 w-6 text-yellow-600 mb-1" />
              <span className="text-[10px] font-bold text-yellow-700 text-center">공정기능</span>
              <Badge className="bg-yellow-500 text-white text-[8px] mt-1">L2</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <Box className="h-6 w-6 text-yellow-600 mb-1" />
              <span className="text-[10px] font-bold text-yellow-700 text-center">제품특성</span>
              <Badge className="bg-yellow-500 text-white text-[8px] mt-1">L2</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <Zap className="h-6 w-6 text-yellow-600 mb-1" />
              <span className="text-[10px] font-bold text-yellow-700 text-center">고장형태</span>
              <Badge className="bg-yellow-500 text-white text-[8px] mt-1">L2</Badge>
            </div>
            
            {/* 두 번째 줄 */}
            <div className="flex flex-col items-center p-2 rounded border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <Search className="h-6 w-6 text-yellow-600 mb-1" />
              <span className="text-[10px] font-bold text-yellow-700 text-center">검출관리</span>
              <Badge className="bg-yellow-500 text-white text-[8px] mt-1">L2</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <Gauge className="h-6 w-6 text-yellow-600 mb-1" />
              <span className="text-[10px] font-bold text-yellow-700 text-center">검사장비</span>
              <Badge className="bg-yellow-500 text-white text-[8px] mt-1">L2</Badge>
            </div>
            
            {/* L3 항목 (5-7, 12, 14-15) */}
            <div className="flex flex-col items-center p-2 rounded border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors">
              <Users className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-[10px] font-bold text-green-700 text-center">작업요소</span>
              <Badge className="bg-green-500 text-white text-[8px] mt-1">L3</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors">
              <ClipboardCheck className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-[10px] font-bold text-green-700 text-center">요소기능</span>
              <Badge className="bg-green-500 text-white text-[8px] mt-1">L3</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors">
              <Thermometer className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-[10px] font-bold text-green-700 text-center">공정특성</span>
              <Badge className="bg-green-500 text-white text-[8px] mt-1">L3</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors">
              <AlertTriangle className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-[10px] font-bold text-green-700 text-center">고장원인</span>
              <Badge className="bg-green-500 text-white text-[8px] mt-1">L3</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors">
              <Shield className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-[10px] font-bold text-green-700 text-center">예방관리</span>
              <Badge className="bg-green-500 text-white text-[8px] mt-1">L3</Badge>
            </div>
            <div className="flex flex-col items-center p-2 rounded border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors">
              <Wrench className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-[10px] font-bold text-green-700 text-center">설비/장비</span>
              <Badge className="bg-green-500 text-white text-[8px] mt-1">L3</Badge>
            </div>
          </div>

          {/* 공통항목 (6M) */}
          <div className="mt-4 pt-3 border-t border-[#999]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-purple-700">공통항목 (작업요소에 자동 포함)</span>
              <span className="text-xs text-gray-500">- 모든 공정에 공통 적용</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { code: 'MN', name: '사람(Man)', icon: '👤' },
                { code: 'MA', name: '자재(Material)', icon: '📦' },
                { code: 'MT', name: '방법(Method)', icon: '📋' },
                { code: 'ME', name: '측정(Measure)', icon: '📏' },
                { code: 'EN', name: '환경(Environ)', icon: '🌡️' },
                { code: 'IM', name: '부자재(Indirect)', icon: '🧴' },
              ].map((item) => (
                <div key={item.code} className="flex items-center gap-1 px-3 py-1.5 rounded border-2 border-purple-400 bg-purple-50">
                  <span>{item.icon}</span>
                  <span className="text-xs font-bold text-purple-700">{item.code}</span>
                  <span className="text-[10px] text-purple-600">{item.name}</span>
                </div>
              ))}
            </div>
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
              <Button variant="outline" size="sm" className="border-[#00587a] text-[#00587a] hover:bg-[#e0f2fb]">
                <Download className="h-4 w-4 mr-2" />
                빈 템플릿 다운로드
              </Button>
              <Button variant="outline" size="sm" className="border-[#00587a] text-[#00587a] hover:bg-[#e0f2fb]">
                <Download className="h-4 w-4 mr-2" />
                샘플 데이터 다운로드
              </Button>
            </div>

            {fileName && (
              <div className="mt-3 p-3 border-l-4 border-green-500 text-sm text-green-700" style={{ background: '#d1fae5' }}>
                파일 로드됨: {fileName}
              </div>
            )}
          </div>

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
                        {String.fromCharCode(65 + i)}
                      </td>
                      <td className={`px-3 py-2 text-left text-black ${i % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        {col.label}
                      </td>
                      <td className={`px-3 py-2 text-center ${i % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        <Badge className={
                          col.level === 'KEY' ? 'bg-gray-600' :
                          col.level === 'L1' ? 'bg-red-500' :
                          col.level === 'L2' ? 'bg-yellow-500' : 'bg-green-500'
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
                  <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>L1 항목</th>
                  <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>L2 항목</th>
                  <th className="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style={{ border: '1px solid #999' }}>L3 항목</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="bg-white text-center text-black font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.totalRows}</td>
                  <td className="bg-[#e0f2fb] text-center text-[#00587a] font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.uniqueProcesses}</td>
                  <td className="bg-white text-center text-red-600 font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.l1Items}</td>
                  <td className="bg-[#e0f2fb] text-center text-yellow-600 font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.l2Items}</td>
                  <td className="bg-white text-center text-green-600 font-bold text-2xl py-3" style={{ border: '1px solid #999' }}>{stats.l3Items}</td>
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
                    <Select value={selectedProcessNo} onValueChange={setSelectedProcessNo}>
                      <SelectTrigger className="w-full border-0 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueProcesses.map((p) => (
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

          {/* 자동 생성된 3레벨 관계 - 표준 테이블 디자인 */}
          {selectedRelation && (
            <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {/* L1 테이블 */}
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th colSpan={2} className="bg-red-500 text-white font-bold px-3 py-2 text-left" style={{ border: '1px solid #999' }}>
                      L1 완제품 레벨 (자동 추출)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2 w-28" style={{ border: '1px solid #999' }}>완제품기능</td>
                    <td className="bg-white px-3 py-2 text-black" style={{ border: '1px solid #999' }}>{selectedRelation.l1.productFunction}</td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>요구사항</td>
                    <td className="bg-[#e0f2fb] px-3 py-2 text-black" style={{ border: '1px solid #999' }}>{selectedRelation.l1.requirement}</td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>고장영향(FE)</td>
                    <td className="bg-white px-3 py-2 text-black" style={{ border: '1px solid #999' }}>{selectedRelation.l1.failureEffect}</td>
                  </tr>
                </tbody>
              </table>

              {/* L2 테이블 */}
              <table className="w-full text-sm mt-0" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th colSpan={2} className="bg-yellow-500 text-white font-bold px-3 py-2 text-left" style={{ border: '1px solid #999' }}>
                      L2 공정 레벨 ({selectedRelation.processNo}-{selectedRelation.processName})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2 w-28" style={{ border: '1px solid #999' }}>제품특성</td>
                    <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l2.productChars.map((pc, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-[#00587a] text-[#00587a]">{pc}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>고장형태(FM)</td>
                    <td className="bg-[#e0f2fb] px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l2.failureModes.map((fm, i) => (
                          <Badge key={i} className="text-xs bg-red-500 text-white">{fm}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>검출관리(DC)</td>
                    <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l2.detectionCtrls.map((dc, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-blue-500 text-blue-600">{dc}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>검사장비(EP)</td>
                    <td className="bg-[#e0f2fb] px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l2.inspectionEquips.map((ep, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-gray-500 text-gray-600">{ep}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* L3 테이블 */}
              <table className="w-full text-sm mt-0" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th colSpan={2} className="bg-green-500 text-white font-bold px-3 py-2 text-left" style={{ border: '1px solid #999' }}>
                      L3 작업요소 레벨 (자동 추출)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2 w-28" style={{ border: '1px solid #999' }}>작업요소</td>
                    <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l3.workElements.map((we, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-[#00587a] text-[#00587a]" title={we.func}>{we.name}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>공정특성</td>
                    <td className="bg-[#e0f2fb] px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l3.processChars.map((pc, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-[#00587a] text-[#00587a]">{pc}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>고장원인(FC)</td>
                    <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l3.failureCauses.map((fc, i) => (
                          <Badge key={i} className="text-xs bg-orange-500 text-white">{fc}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>예방관리(PC)</td>
                    <td className="bg-[#e0f2fb] px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l3.preventionCtrls.map((pc, i) => (
                          <Badge key={i} className="text-xs bg-green-600 text-white">{pc}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-[#00587a] text-white font-bold px-3 py-2" style={{ border: '1px solid #999' }}>설비/장비</td>
                    <td className="bg-white px-3 py-2" style={{ border: '1px solid #999' }}>
                      <div className="flex flex-wrap gap-1">
                        {selectedRelation.l3.equipments.map((eq, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-gray-500 text-gray-600">{eq}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 확정 버튼 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="border-[#999] text-gray-600 hover:bg-gray-100">취소</Button>
            <Button className="bg-[#00587a] hover:bg-[#004560] text-white font-bold" disabled={!importComplete}>
              <Check className="h-4 w-4 mr-2" />
              관계 확정 및 저장
            </Button>
          </div>

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
    </div>
  );
}
