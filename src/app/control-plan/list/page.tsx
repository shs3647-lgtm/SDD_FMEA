/**
 * @file page.tsx
 * @description Control Plan 리스트 페이지 - PFMEA list와 동일한 구조
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CPTopNav from '@/components/layout/CPTopNav';

// =====================================================
// 타입 정의
// =====================================================
interface CPProject {
  id: string;
  cpInfo?: {
    subject?: string;
    cpStartDate?: string;
    cpRevisionDate?: string;
    customerName?: string;
    modelYear?: string;
    processResponsibility?: string;
    cpResponsibleName?: string;
    cpProjectName?: string;
  };
  linkedFmeaId?: string;
  createdAt: string;
  status?: string;
  revisionNo?: string;
}

// =====================================================
// 테이블 컬럼 정의
// =====================================================
const COLUMN_HEADERS = [
  'No',
  'CP ID',
  '프로젝트명',
  'CP명',
  '고객사',
  '모델명',
  '공정책임',
  '담당자',
  '시작일자',
  '개정일자',
  '개정번호',
  'FMEA 연동',
];

// CP ID 포맷 생성
function formatCpId(id: string, index: number): string {
  if (id.startsWith('CP')) return id;
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = (index + 1).toString().padStart(3, '0');
  return `CP${year}-${seq}`;
}

// 기본 샘플 데이터
const DEFAULT_SAMPLE_DATA: CPProject[] = [
  {
    id: 'CP25-001',
    cpInfo: { 
      subject: 'PCR 타이어 CP', 
      cpStartDate: '2025-12-01', 
      cpRevisionDate: '2025-12-29', 
      customerName: 'SDD',
      modelYear: 'MY2025', 
      processResponsibility: '품질팀', 
      cpResponsibleName: '신홍섭',
      cpProjectName: 'SDD NEW FMEA 개발'
    },
    linkedFmeaId: 'PFM25-310',
    createdAt: '2025-12-01T09:00:00.000Z', 
    status: 'active', 
    revisionNo: 'Rev.01'
  },
];

// =====================================================
// 메인 컴포넌트
// =====================================================
export default function CPListPage() {
  const [projects, setProjects] = useState<CPProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // 데이터 로드
  const loadData = useCallback(() => {
    try {
      const storedCp = localStorage.getItem('cp-projects');
      let cpProjects = storedCp ? JSON.parse(storedCp) : [];
      
      if (!Array.isArray(cpProjects) || cpProjects.length === 0) {
        localStorage.setItem('cp-projects', JSON.stringify(DEFAULT_SAMPLE_DATA));
        cpProjects = DEFAULT_SAMPLE_DATA;
      }

      const sorted = cpProjects.sort((a: CPProject, b: CPProject) => 
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );

      setProjects(sorted);
    } catch (error) {
      console.error('❌ CP 리스트 로드 실패:', error);
      setProjects([]);
    }
  }, []);

  // 데이터 저장
  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('cp-projects', JSON.stringify(projects));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('❌ CP 리스트 저장 실패:', error);
      setSaveStatus('idle');
      alert('저장에 실패했습니다.');
    }
  }, [projects]);

  // 초기 로드
  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, [loadData]);

  // 검색 필터링
  const filteredProjects = projects.filter(p => {
    if (!p || !p.id) return false;
    const query = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(query) ||
      p.cpInfo?.cpProjectName?.toLowerCase().includes(query) ||
      p.cpInfo?.subject?.toLowerCase().includes(query) ||
      p.cpInfo?.customerName?.toLowerCase().includes(query)
    );
  });

  // 행 선택 토글
  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // 전체 선택 토글
  const toggleAllRows = () => {
    if (selectedRows.size === filteredProjects.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredProjects.map(p => p.id)));
    }
  };

  // 선택 삭제
  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedRows.size}개 항목을 삭제하시겠습니까?`)) {
      return;
    }

    const remaining = projects.filter(p => !selectedRows.has(p.id));
    localStorage.setItem('cp-projects', JSON.stringify(remaining));
    setProjects(remaining);
    setSelectedRows(new Set());
  };

  // 선택된 항목 수정
  const handleEditSelected = () => {
    if (selectedRows.size === 0) {
      alert('수정할 항목을 선택해주세요.');
      return;
    }
    if (selectedRows.size > 1) {
      alert('수정은 한 번에 하나의 항목만 가능합니다.');
      return;
    }
    const selectedId = Array.from(selectedRows)[0];
    window.location.href = `/control-plan/register?id=${selectedId}`;
  };

  return (
    <>
      <CPTopNav selectedCpId="" rowCount={filteredProjects.length} />
      
      <div className="min-h-screen bg-[#f0f0f0] px-3 py-3 pt-9 font-[Malgun_Gothic]">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📋</span>
          <h1 className="text-base font-bold text-gray-800">Control Plan 리스트</h1>
          <span className="text-xs text-gray-500 ml-2">총 {filteredProjects.length}건</span>
        </div>

        {/* 검색 및 액션 바 */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="🔍 프로젝트명, CP명, 고객사로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-400 rounded bg-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-100 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-200 flex items-center gap-1"
            >
              🔄 새로고침
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-1 ${
                saveStatus === 'saved' 
                  ? 'bg-green-500 text-white border border-green-600' 
                  : 'bg-teal-100 border border-teal-400 text-teal-700 hover:bg-teal-200'
              }`}
            >
              {saveStatus === 'saved' ? '✓ 저장됨' : saveStatus === 'saving' ? '⏳ 저장중...' : '💾 저장'}
            </button>
            <button
              onClick={handleEditSelected}
              disabled={selectedRows.size !== 1}
              className="px-4 py-2 bg-yellow-100 border border-yellow-500 text-yellow-700 text-xs rounded hover:bg-yellow-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedRows.size === 0}
              className="px-4 py-2 bg-red-100 border border-red-400 text-red-600 text-xs rounded hover:bg-red-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ 선택 삭제 ({selectedRows.size})
            </button>
            <a
              href="/control-plan/register"
              className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded hover:bg-teal-700 flex items-center gap-1"
            >
              ➕ 신규 등록
            </a>
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-lg overflow-hidden border border-gray-400 bg-white">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#0d9488] text-white" style={{ height: '28px' }}>
                <th className="border border-white px-1 py-1 text-center align-middle w-8">
                  <input
                    type="checkbox"
                    checked={filteredProjects.length > 0 && selectedRows.size === filteredProjects.length}
                    onChange={toggleAllRows}
                    className="w-3.5 h-3.5"
                  />
                </th>
                {COLUMN_HEADERS.map((header, idx) => (
                  <th key={idx} className="border border-white px-2 py-1 text-center align-middle font-semibold whitespace-nowrap text-xs">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, index) => (
                <tr
                  key={`${p.id}-${index}`}
                  className={`hover:bg-teal-50 cursor-pointer transition-colors ${
                    index % 2 === 0 ? 'bg-teal-50/50' : 'bg-white'
                  } ${selectedRows.has(p.id) ? 'bg-teal-100' : ''}`}
                  style={{ height: '28px' }}
                  onClick={() => toggleRow(p.id)}
                >
                  <td className="border border-gray-400 px-1 py-0.5 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(p.id)}
                      onChange={() => toggleRow(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5"
                    />
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle font-bold text-teal-700">{index + 1}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle font-semibold text-teal-600">
                    <a href={`/control-plan?id=${p.id}`} className="hover:underline">
                      {formatCpId(p.id, index)}
                    </a>
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-left align-middle">
                    {p.cpInfo?.cpProjectName || <span className="text-red-500 italic">미입력</span>}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-left align-middle">
                    <a href={`/control-plan?id=${p.id}`} className="text-teal-600 hover:underline font-semibold">
                      {p.cpInfo?.subject || <span className="text-red-500 italic">미입력</span>}
                    </a>
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.cpInfo?.customerName || <span className="text-red-500 italic">미입력</span>}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.cpInfo?.modelYear || <span className="text-red-500 italic">미입력</span>}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.cpInfo?.processResponsibility || <span className="text-red-500 italic">미입력</span>}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.cpInfo?.cpResponsibleName || <span className="text-red-500 italic">미입력</span>}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.cpInfo?.cpStartDate || <span className="text-red-500 italic">미입력</span>}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.cpInfo?.cpRevisionDate || <span className="text-red-500 italic">미입력</span>}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.revisionNo || 'Rev.00'}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.linkedFmeaId ? (
                      <a href={`/pfmea/worksheet?id=${p.linkedFmeaId}`} className="text-yellow-600 hover:underline font-semibold">
                        🔗 {p.linkedFmeaId}
                      </a>
                    ) : (
                      <span className="text-gray-400">미연동</span>
                    )}
                  </td>
                </tr>
              ))}
              {/* 빈 행 */}
              {Array.from({ length: Math.max(0, 10 - filteredProjects.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`} className={`${(filteredProjects.length + idx) % 2 === 0 ? 'bg-teal-50/50' : 'bg-white'}`} style={{ height: '28px' }}>
                  <td className="border border-gray-400 px-1 py-0.5 text-center align-middle">
                    <input type="checkbox" disabled className="w-3.5 h-3.5 opacity-30" />
                  </td>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <td key={i} className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 상태바 */}
        <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
          <span>조회 결과: {filteredProjects.length}건 / 전체: {projects.length}건</span>
          <span>버전: CP Suite v1.0 | 사용자: CP Lead</span>
        </div>
      </div>
    </>
  );
}

