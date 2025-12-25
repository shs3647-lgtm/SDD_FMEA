/**
 * @file page.tsx
 * @description PFMEA 기초정보 Excel Import 메인 페이지
 * @author AI Assistant
 * @created 2025-12-26
 * @prd PRD-026-pfmea-master-data-import.md
 * 
 * 기능:
 * - Excel 파일 업로드 및 Import
 * - 15개 시트 선택 및 미리보기
 * - 공정번호 기반 3레벨 연계 조회
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
import { Upload, FileSpreadsheet, Search, ChevronDown, ChevronRight, Check, X } from 'lucide-react';

import { ImportSheet, ProcessInfo } from './types';
import { importSheets, mockProcesses, getDataByProcessNo } from './mock-data';

export default function PFMEAImportPage() {
  // 상태 관리
  const [fileName, setFileName] = useState<string>('');
  const [sheets, setSheets] = useState<ImportSheet[]>(importSheets);
  const [selectedSheet, setSelectedSheet] = useState<string>('process');
  const [selectedProcessNo, setSelectedProcessNo] = useState<string>('80');
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  // 시트 선택 토글
  const toggleSheet = (id: string) => {
    setSheets(sheets.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  // 전체 선택/해제
  const toggleAll = (selected: boolean) => {
    setSheets(sheets.map(s => ({ ...s, selected })));
  };

  // 공정 데이터 조회
  const processData = getDataByProcessNo(selectedProcessNo);
  const selectedProcess = mockProcesses.find(p => p.process_no === selectedProcessNo);

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

  // 선택된 시트 수
  const selectedCount = sheets.filter(s => s.selected).length;
  const totalRecords = sheets.filter(s => s.selected).reduce((sum, s) => sum + (s.recordCount || 0), 0);

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00587a]">PFMEA 기초정보 Excel Import</h1>
        <p className="text-gray-600 mt-1">
          15개 마스터 데이터를 Excel에서 Import하여 FMEA 작성 시 팝업 모달에서 선택할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: Excel Import 영역 */}
        <div className="space-y-6">
          {/* 파일 선택 카드 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[#00587a] mb-4 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              파일 선택
            </h2>
            
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="파일을 선택하세요..."
                value={fileName}
                readOnly
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                <Button variant="outline" asChild>
                  <span><Upload className="h-4 w-4 mr-2" />찾아보기...</span>
                </Button>
              </label>
            </div>

            {fileName && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✅ 파일 로드됨: {fileName}
              </div>
            )}
          </div>

          {/* 시트 선택 카드 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#00587a]">Import 대상 시트 선택 (15개)</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>전체선택</Button>
                <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>전체해제</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
              {sheets.map((sheet) => (
                <label
                  key={sheet.id}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                    sheet.selected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sheet.selected}
                    onChange={() => toggleSheet(sheet.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{sheet.korName}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] px-1">{sheet.level}</Badge>
                      <span>{sheet.recordCount}건</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                선택: <span className="font-bold text-[#00587a]">{selectedCount}</span>개 시트,{' '}
                <span className="font-bold text-[#00587a]">{totalRecords.toLocaleString()}</span>건 레코드
              </div>
              <Button
                className="bg-[#00587a] hover:bg-[#004560]"
                disabled={!fileName || selectedCount === 0 || isImporting}
                onClick={handleImport}
              >
                {isImporting ? '처리중...' : 'Import 실행'}
              </Button>
            </div>

            {importComplete && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✅ Import 완료! {selectedCount}개 시트, {totalRecords.toLocaleString()}건 저장됨
              </div>
            )}
          </div>
        </div>

        {/* 우측: 3레벨 연계 확인 영역 */}
        <div className="space-y-6">
          {/* 공정 선택 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[#00587a] mb-4 flex items-center gap-2">
              <Search className="h-5 w-5" />
              공정번호 기준 연계 조회
            </h2>

            <div className="flex gap-3 items-center">
              <span className="text-sm text-gray-600">공정번호:</span>
              <Select value={selectedProcessNo} onValueChange={setSelectedProcessNo}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockProcesses.map((p) => (
                    <SelectItem key={p.process_no} value={p.process_no}>
                      {p.process_no} - {p.process_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3레벨 연계 정보 */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* L1 */}
            <div className="border-b">
              <div className="bg-red-50 px-4 py-2 flex items-center gap-2">
                <Badge className="bg-red-500">L1</Badge>
                <span className="font-semibold text-red-800">완제품 레벨</span>
              </div>
              <div className="p-4 text-sm space-y-1">
                <div><span className="text-gray-500">완제품명:</span> Tire 완제품</div>
                <div><span className="text-gray-500">완제품기능:</span> 차량 운행을 지원하는 타이어</div>
                <div><span className="text-gray-500">요구사항:</span> [1.8] Air Retention</div>
                <div><span className="text-gray-500">고장영향:</span> 공기 누설, 내구성 저하, 안전성 저하</div>
              </div>
            </div>

            {/* L2 */}
            <div className="border-b">
              <div className="bg-yellow-50 px-4 py-2 flex items-center gap-2">
                <Badge className="bg-yellow-500">L2</Badge>
                <span className="font-semibold text-yellow-800">공정 레벨 ({selectedProcessNo}-{selectedProcess?.process_name})</span>
              </div>
              <div className="p-4 text-sm space-y-2">
                <div><span className="text-gray-500">공정기능:</span> {selectedProcess?.process_desc}</div>
                <div>
                  <span className="text-gray-500">제품특성:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {processData.productChars.map((pc) => (
                      <Badge key={pc.id} variant="outline" className="text-xs">{pc.char_name}</Badge>
                    ))}
                    {processData.productChars.length === 0 && <span className="text-gray-400">-</span>}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">고장형태:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {processData.failureModes.map((fm) => (
                      <Badge key={fm.id} variant="outline" className="text-xs bg-red-50">{fm.fm_description}</Badge>
                    ))}
                    {processData.failureModes.length === 0 && <span className="text-gray-400">-</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* L3 */}
            <div>
              <div className="bg-green-50 px-4 py-2 flex items-center gap-2">
                <Badge className="bg-green-500">L3</Badge>
                <span className="font-semibold text-green-800">작업요소 레벨</span>
              </div>
              <div className="p-4 text-sm space-y-2">
                <div>
                  <span className="text-gray-500">작업요소(4M):</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {processData.workElements.map((we) => (
                      <Badge key={we.id} variant="outline" className="text-xs">
                        {we.element_name} <span className="text-gray-400">({we.element_4m})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">고장원인:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {processData.failureCauses.map((fc) => (
                      <Badge key={fc.id} variant="outline" className="text-xs bg-orange-50">{fc.fc_description}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 확정 버튼 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline">취소</Button>
            <Button className="bg-[#00587a] hover:bg-[#004560]">
              <Check className="h-4 w-4 mr-2" />
              확정하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

