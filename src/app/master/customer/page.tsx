/**
 * @file page.tsx
 * @description 고객사정보 관리 페이지 - 엑셀 다운로드/임포트
 * @version 1.0.0
 * @created 2025-12-26
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { BizInfoProject, BIZINFO_STORAGE_KEYS } from '@/types/bizinfo';
import { getAllProjects, createProject, deleteProject, createSampleProjects } from '@/lib/bizinfo-db';
import { downloadTemplate, downloadStyledExcel } from '@/lib/excel-utils';
import * as XLSX from 'xlsx';

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CustomerInfoPage() {
  const [projects, setProjects] = useState<BizInfoProject[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  // 데이터 로드
  useEffect(() => {
    createSampleProjects();
    loadData();
  }, []);

  const loadData = () => {
    const data = getAllProjects();
    setProjects(data);
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(projects.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 개별 선택
  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  // 선택 삭제
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!confirm(`${selectedIds.size}개 항목을 삭제하시겠습니까?`)) return;

    selectedIds.forEach(id => deleteProject(id));
    setSelectedIds(new Set());
    loadData();
  };

  // 엑셀 다운로드 (빈 템플릿) - 스타일 적용
  const handleDownloadTemplate = () => {
    const headers = ['고객명', '코드', '공장', 'Model Year', '프로그램', '품명', '품번'];
    const colWidths = [15, 10, 15, 12, 15, 15, 15];
    downloadTemplate(headers, colWidths, '고객사정보', '고객사정보_템플릿.xlsx');
  };

  // 엑셀 다운로드 (현재 데이터) - 스타일 적용
  const handleDownloadData = () => {
    const headers = ['고객명', '코드', '공장', 'Model Year', '프로그램', '품명', '품번'];
    const colWidths = [15, 10, 15, 12, 15, 15, 15];
    const data = projects.map(p => [
      p.customerName,
      p.customerCode,
      p.factory,
      p.modelYear,
      p.program,
      p.productName,
      p.partNo,
    ]);
    downloadStyledExcel(headers, data, colWidths, '고객사정보', `고객사정보_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // 엑셀 임포트
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('📂 파일 읽는 중...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

      // 헤더 제외하고 데이터만 처리
      const dataRows = jsonData.slice(1).filter(row => row.length > 0 && row[0]);

      if (dataRows.length === 0) {
        setImportStatus('❌ 데이터가 없습니다.');
        return;
      }

      let importedCount = 0;
      const now = new Date().toISOString();

      for (const row of dataRows) {
        const newProject: BizInfoProject = {
          id: generateUUID(),
          customerName: String(row[0] || ''),
          customerCode: String(row[1] || ''),
          factory: String(row[2] || ''),
          modelYear: String(row[3] || ''),
          program: String(row[4] || ''),
          productName: String(row[5] || ''),
          partNo: String(row[6] || ''),
          createdAt: now,
          updatedAt: now,
        };

        if (newProject.customerName) {
          // 기존 데이터에 추가
          const existing = getAllProjects();
          existing.push(newProject);
          localStorage.setItem(BIZINFO_STORAGE_KEYS.projects, JSON.stringify(existing));
          importedCount++;
        }
      }

      setImportStatus(`✅ ${importedCount}개 항목 임포트 완료!`);
      loadData();
      
      // 3초 후 상태 메시지 초기화
      setTimeout(() => setImportStatus(''), 3000);

    } catch (error) {
      console.error('임포트 오류:', error);
      setImportStatus('❌ 파일 읽기 오류');
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 전체 삭제
  const handleDeleteAll = () => {
    if (!confirm('모든 고객사정보를 삭제하시겠습니까?')) return;
    localStorage.setItem(BIZINFO_STORAGE_KEYS.projects, JSON.stringify([]));
    loadData();
  };

  // 샘플 데이터 재생성
  const handleResetSample = () => {
    if (!confirm('기존 데이터를 삭제하고 샘플 데이터(10개)를 생성하시겠습니까?')) return;
    localStorage.setItem(BIZINFO_STORAGE_KEYS.projects, JSON.stringify([]));
    createSampleProjects();
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📋</span>
        <h1 className="text-base font-bold text-gray-800">고객사정보 관리</h1>
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* 엑셀 다운로드 */}
        <button 
          onClick={handleDownloadTemplate}
          className="px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 flex items-center gap-1"
        >
          📥 템플릿 다운로드
        </button>
        <button 
          onClick={handleDownloadData}
          className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 flex items-center gap-1"
        >
          📥 데이터 다운로드
        </button>

        {/* 엑셀 임포트 */}
        <label className="px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded hover:bg-amber-600 flex items-center gap-1 cursor-pointer">
          📤 엑셀 임포트
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".xlsx,.xls" 
            onChange={handleImport}
            className="hidden" 
          />
        </label>

        <div className="ml-auto flex gap-2">
          <button 
            onClick={handleResetSample}
            className="px-3 py-2 bg-purple-100 border border-purple-400 text-purple-700 text-xs font-semibold rounded hover:bg-purple-200"
          >
            🔄 샘플 초기화 (10개)
          </button>
          <button 
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="px-3 py-2 bg-red-100 border border-red-400 text-red-600 text-xs font-semibold rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑️ 선택 삭제 ({selectedIds.size})
          </button>
          <button 
            onClick={handleDeleteAll}
            className="px-3 py-2 bg-gray-100 border border-gray-400 text-gray-600 text-xs rounded hover:bg-gray-200"
          >
            🗑️ 전체 삭제
          </button>
          <button 
            onClick={loadData}
            className="px-3 py-2 bg-gray-100 border border-gray-400 text-gray-600 text-xs rounded hover:bg-gray-200"
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* 임포트 상태 메시지 */}
      {importStatus && (
        <div className={`mb-4 px-4 py-2 rounded text-sm font-semibold ${
          importStatus.includes('✅') ? 'bg-green-100 text-green-700' :
          importStatus.includes('❌') ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {importStatus}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded">
        <p className="text-xs text-amber-700">
          💡 <strong>템플릿 다운로드</strong> → 엑셀에서 데이터 작성 → <strong>엑셀 임포트</strong>로 일괄 등록
        </p>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg overflow-hidden border border-gray-400 bg-white">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 bg-[#00587a] text-white z-10">
              <tr>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === projects.length && projects.length > 0}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                </th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-10">NO</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">고객명</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-16">코드</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">공장</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">Model Year</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">프로그램</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">품명</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">품번</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-500">
                    데이터가 없습니다. 엑셀 임포트로 데이터를 추가해주세요.
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => (
                  <tr
                    key={project.id}
                    className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(project.id)}
                        onChange={e => handleSelect(project.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{index + 1}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle font-medium">{project.customerName}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-blue-600 font-semibold">{project.customerCode}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{project.factory}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{project.modelYear}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{project.program}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle font-medium">{project.productName}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-gray-600">{project.partNo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 상태바 */}
      <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
        <span>총 {projects.length}건</span>
        <span>선택: {selectedIds.size}건</span>
      </div>
    </div>
  );
}

