/**
 * @file page.tsx
 * @description FMEA 리스트 페이지 - 등록된 FMEA 프로젝트 조회
 * @version 1.0.0
 * @created 2025-12-26
 * @ref C:\01_Next_FMEA\app\fmea\components\list\FMEAListTable.tsx
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

// =====================================================
// 타입 정의
// =====================================================
interface FMEAProject {
  id: string;
  project: {
    projectName: string;
    customer: string;
    productName: string;
    partNo: string;
    department: string;
    leader: string;
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  status?: string;
}

// =====================================================
// 테이블 컬럼 정의
// =====================================================
const COLUMN_HEADERS = [
  'No',
  'FMEA ID',
  '프로젝트명',
  '품명',
  '품번',
  '고객사',
  '담당부서',
  '담당자',
  '시작일자',
  '종료일자',
  '작성일자',
  '상태',
];

// =====================================================
// 메인 컴포넌트
// =====================================================
export default function FMEAListPage() {
  const [projects, setProjects] = useState<FMEAProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // 데이터 로드
  const loadData = useCallback(() => {
    try {
      const stored = localStorage.getItem('fmea-projects');
      if (!stored) {
        setProjects([]);
        return;
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        setProjects([]);
        return;
      }

      // 최신순 정렬
      const sorted = parsed.sort((a: FMEAProject, b: FMEAProject) => 
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );

      setProjects(sorted);
    } catch (error) {
      console.error('❌ FMEA 리스트 로드 실패:', error);
      setProjects([]);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadData();

    // 실시간 업데이트 이벤트 리스너
    const handleUpdate = () => loadData();
    window.addEventListener('fmea-projects-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('fmea-projects-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // 검색 필터링
  const filteredProjects = projects.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(query) ||
      p.project?.projectName?.toLowerCase().includes(query) ||
      p.project?.productName?.toLowerCase().includes(query) ||
      p.project?.customer?.toLowerCase().includes(query) ||
      p.project?.partNo?.toLowerCase().includes(query)
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
    localStorage.setItem('fmea-projects', JSON.stringify(remaining));
    setProjects(remaining);
    setSelectedRows(new Set());
  };

  // 상태 배지 렌더링
  const renderStatusBadge = (status?: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-200', text: 'text-gray-700', label: '작성중' },
      review: { bg: 'bg-amber-200', text: 'text-amber-700', label: '검토중' },
      approved: { bg: 'bg-green-200', text: 'text-green-700', label: '승인' },
      completed: { bg: 'bg-blue-200', text: 'text-blue-700', label: '완료' },
    };

    const { bg, text, label } = statusMap[status || 'draft'] || statusMap.draft;

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4 font-[Malgun_Gothic]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📋</span>
        <h1 className="text-base font-bold text-gray-800">FMEA 리스트</h1>
        <span className="text-xs text-gray-500 ml-2">총 {filteredProjects.length}건</span>
      </div>

      {/* 검색 및 액션 바 */}
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* 검색 */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="🔍 프로젝트명, 품명, 품번, 고객사로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-400 rounded bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-100 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-200 flex items-center gap-1"
          >
            🔄 새로고침
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedRows.size === 0}
            className="px-4 py-2 bg-red-100 border border-red-400 text-red-600 text-xs rounded hover:bg-red-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑️ 선택 삭제 ({selectedRows.size})
          </button>
          <a
            href="/pfmea/register"
            className="px-4 py-2 bg-[#1976d2] text-white text-xs font-bold rounded hover:bg-[#1565c0] flex items-center gap-1"
          >
            ➕ 신규 등록
          </a>
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg overflow-hidden border border-gray-400 bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#00587a] text-white">
              <th className="border border-white px-2 py-2 text-center align-middle w-10">
                <input
                  type="checkbox"
                  checked={filteredProjects.length > 0 && selectedRows.size === filteredProjects.length}
                  onChange={toggleAllRows}
                  className="w-4 h-4"
                />
              </th>
              {COLUMN_HEADERS.map((header, idx) => (
                <th key={idx} className="border border-white px-3 py-2 text-center align-middle font-semibold whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-gray-500">
                  등록된 FMEA 프로젝트가 없습니다.
                </td>
              </tr>
            ) : (
              filteredProjects.map((p, index) => (
                <tr
                  key={p.id}
                  className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'
                  } ${selectedRows.has(p.id) ? 'bg-blue-100' : ''}`}
                  onClick={() => toggleRow(p.id)}
                >
                  <td className="border border-gray-400 px-2 py-2 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(p.id)}
                      onChange={() => toggleRow(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">{index + 1}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle font-semibold text-blue-600">
                    <a href={`/pfmea/worksheet?id=${p.id}`} className="hover:underline">
                      {p.id}
                    </a>
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-left align-middle">{p.project?.projectName || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">{p.project?.productName || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">{p.project?.partNo || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">{p.project?.customer || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">{p.project?.department || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">{p.project?.leader || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">{p.project?.startDate || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">{p.project?.endDate || '-'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">
                    {p.createdAt ? p.createdAt.split('T')[0] : '-'}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center align-middle">
                    {renderStatusBadge(p.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 상태바 */}
      <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
        <span>조회 결과: {filteredProjects.length}건 / 전체: {projects.length}건</span>
        <span>버전: FMEA Suite v3.0 | 사용자: FMEA Lead</span>
      </div>
    </div>
  );
}

