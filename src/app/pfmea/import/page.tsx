/**
 * @file page.tsx
 * @description PFMEA 기초정보 Excel Import 메인 페이지 (단순화 버전)
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 1시트 16컬럼 방식으로 변경
 * @prd PRD-026-pfmea-master-data-import.md
 * 
 * 사용자는 1개 시트에 16컬럼만 입력하면
 * 시스템이 공정번호 기준으로 관계형 DB를 자동 생성
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
import { Upload, FileSpreadsheet, Database, Check, Download, Table2 } from 'lucide-react';

import { ImportRowData, GeneratedRelation, COMMON_CATEGORIES } from './types';
import { importColumns, sampleImportData, generateRelations, calculateStats, commonItems, addCommonItemsToRelation } from './mock-data';

export default function PFMEAImportPage() {
  // 상태 관리
  const [fileName, setFileName] = useState<string>('');
  const [importData, setImportData] = useState<ImportRowData[]>(sampleImportData);
  const [selectedProcessNo, setSelectedProcessNo] = useState<string>('80');
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  // 관계형 데이터 자동 생성 (공통 항목 포함)
  const [includeCommon, setIncludeCommon] = useState(true);
  const relations = generateRelations(importData);
  const stats = calculateStats(importData);
  const baseRelation = relations.find(r => r.processNo === selectedProcessNo);
  const selectedRelation = baseRelation && includeCommon ? addCommonItemsToRelation(baseRelation) : baseRelation;

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
    <div className="p-6 bg-gray-50 min-h-full">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00587a]">PFMEA 기초정보 Excel Import</h1>
        <p className="text-gray-600 mt-1">
          <span className="font-semibold text-[#00587a]">1개 시트, 16컬럼</span>만 입력하면 시스템이 공정번호 기준으로 <span className="font-semibold text-[#00587a]">관계형 DB를 자동 생성</span>합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: Excel Import 영역 */}
        <div className="space-y-6">
          {/* 파일 선택 카드 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[#00587a] mb-4 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel 파일 선택
            </h2>
            
            <div className="flex gap-3">
              <Input type="text" placeholder="파일을 선택하세요..." value={fileName} readOnly className="flex-1" />
              <label className="cursor-pointer">
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                <Button variant="outline" asChild>
                  <span><Upload className="h-4 w-4 mr-2" />찾아보기...</span>
                </Button>
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                빈 템플릿 다운로드
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                샘플 데이터 다운로드
              </Button>
            </div>

            {fileName && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✅ 파일 로드됨: {fileName}
              </div>
            )}
          </div>

          {/* 공통 기초정보 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[#00587a] mb-4 flex items-center gap-2">
              🔄 공통 기초정보 (모든 공정에 자동 적용)
            </h2>

            <div className="space-y-3">
              {COMMON_CATEGORIES.filter(c => ['MN', 'EN', 'IM'].includes(c.code)).map(cat => {
                const items = commonItems.filter(i => i.category === cat.code);
                return (
                  <div key={cat.code} className="flex items-start gap-2">
                    <Badge className={`${cat.color} text-white text-xs min-w-[24px] justify-center`}>{cat.code}</Badge>
                    <div>
                      <div className="text-xs font-medium text-gray-600">{cat.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {items.map(item => (
                          <Badge key={item.id} variant="outline" className="text-[10px]" title={item.description}>
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t flex items-center gap-2">
              <input
                type="checkbox"
                id="includeCommon"
                checked={includeCommon}
                onChange={(e) => setIncludeCommon(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="includeCommon" className="text-sm text-gray-600">
                공통 항목을 모든 공정에 자동 포함
              </label>
            </div>
          </div>

          {/* 16컬럼 형식 안내 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[#00587a] mb-4 flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Excel 형식 (16컬럼)
            </h2>

            <div className="overflow-x-auto max-h-[200px]">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-[#00587a] text-white">
                    <th className="border px-2 py-1.5 text-left">컬럼</th>
                    <th className="border px-2 py-1.5 text-left">필드명</th>
                    <th className="border px-2 py-1.5 text-center">레벨</th>
                    <th className="border px-2 py-1.5 text-center">필수</th>
                  </tr>
                </thead>
                <tbody>
                  {importColumns.map((col, i) => (
                    <tr key={col.key} className={i % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}>
                      <td className="border px-2 py-1 font-mono">{String.fromCharCode(65 + i)}</td>
                      <td className="border px-2 py-1">{col.label}</td>
                      <td className="border px-2 py-1 text-center">
                        <Badge className={
                          col.level === 'KEY' ? 'bg-gray-600' :
                          col.level === 'L1' ? 'bg-red-500' :
                          col.level === 'L2' ? 'bg-yellow-500' : 'bg-green-500'
                        }>{col.level}</Badge>
                      </td>
                      <td className="border px-2 py-1 text-center">{col.required ? '✅' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 미리보기 통계 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[#00587a] mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Import 미리보기
            </h2>

            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="text-center p-3 bg-gray-100 rounded">
                <div className="text-2xl font-bold text-gray-700">{stats.totalRows}</div>
                <div className="text-xs text-gray-500">총 행</div>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded">
                <div className="text-2xl font-bold text-blue-700">{stats.uniqueProcesses}</div>
                <div className="text-xs text-blue-600">공정 수</div>
              </div>
              <div className="text-center p-3 bg-red-100 rounded">
                <div className="text-2xl font-bold text-red-700">{stats.l1Items}</div>
                <div className="text-xs text-red-600">L1 항목</div>
              </div>
              <div className="text-center p-3 bg-yellow-100 rounded">
                <div className="text-2xl font-bold text-yellow-700">{stats.l2Items}</div>
                <div className="text-xs text-yellow-600">L2 항목</div>
              </div>
              <div className="text-center p-3 bg-green-100 rounded">
                <div className="text-2xl font-bold text-green-700">{stats.l3Items}</div>
                <div className="text-xs text-green-600">L3 항목</div>
              </div>
            </div>

            <Button
              className="w-full bg-[#00587a] hover:bg-[#004560]"
              disabled={!fileName || isImporting}
              onClick={handleImport}
            >
              {isImporting ? '관계형 DB 생성 중...' : 'Import 실행 → 관계형 DB 자동 생성'}
            </Button>

            {importComplete && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✅ Import 완료! {stats.uniqueProcesses}개 공정, 15개 관계형 테이블 자동 생성됨
              </div>
            )}
          </div>
        </div>

        {/* 우측: 자동 생성된 관계형 데이터 확인 */}
        <div className="space-y-6">
          {/* 공정 선택 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[#00587a] mb-4">
              🔗 공정번호 기준 자동 생성된 관계
            </h2>

            <div className="flex gap-3 items-center">
              <span className="text-sm text-gray-600">공정번호:</span>
              <Select value={selectedProcessNo} onValueChange={setSelectedProcessNo}>
                <SelectTrigger className="w-[200px]">
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
            </div>
          </div>

          {/* 자동 생성된 3레벨 관계 */}
          {selectedRelation && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* L1 */}
              <div className="border-b">
                <div className="bg-red-50 px-4 py-2 flex items-center gap-2">
                  <Badge className="bg-red-500">L1</Badge>
                  <span className="font-semibold text-red-800">완제품 레벨 (자동 추출)</span>
                </div>
                <div className="p-4 text-sm space-y-1">
                  <div><span className="text-gray-500">완제품기능:</span> {selectedRelation.l1.productFunction}</div>
                  <div><span className="text-gray-500">요구사항:</span> {selectedRelation.l1.requirement}</div>
                  <div><span className="text-gray-500">고장영향(FE):</span> {selectedRelation.l1.failureEffect}</div>
                </div>
              </div>

              {/* L2 */}
              <div className="border-b">
                <div className="bg-yellow-50 px-4 py-2 flex items-center gap-2">
                  <Badge className="bg-yellow-500">L2</Badge>
                  <span className="font-semibold text-yellow-800">공정 레벨 ({selectedRelation.processNo}-{selectedRelation.processName})</span>
                </div>
                <div className="p-4 text-sm space-y-2">
                  <div>
                    <span className="text-gray-500">제품특성:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l2.productChars.map((pc, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{pc}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">고장형태(FM):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l2.failureModes.map((fm, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-red-50">{fm}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">검출관리(DC):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l2.detectionCtrls.map((dc, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-blue-50">{dc}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">검사장비(EP):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l2.inspectionEquips.map((ep, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{ep}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* L3 */}
              <div>
                <div className="bg-green-50 px-4 py-2 flex items-center gap-2">
                  <Badge className="bg-green-500">L3</Badge>
                  <span className="font-semibold text-green-800">작업요소 레벨 (자동 추출)</span>
                </div>
                <div className="p-4 text-sm space-y-2">
                  <div>
                    <span className="text-gray-500">작업요소:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l3.workElements.map((we, i) => (
                        <Badge key={i} variant="outline" className="text-xs" title={we.func}>{we.name}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">공정특성:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l3.processChars.map((pc, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{pc}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">고장원인(FC):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l3.failureCauses.map((fc, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-orange-50">{fc}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">예방관리(PC):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l3.preventionCtrls.map((pc, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-50">{pc}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">설비/장비:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRelation.l3.equipments.map((eq, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{eq}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 확정 버튼 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline">취소</Button>
            <Button className="bg-[#00587a] hover:bg-[#004560]" disabled={!importComplete}>
              <Check className="h-4 w-4 mr-2" />
              관계 확정 및 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
