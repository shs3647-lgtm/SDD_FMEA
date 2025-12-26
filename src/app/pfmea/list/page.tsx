/**
 * @file page.tsx
 * @description FMEA 리스트 페이지 - 등록된 FMEA 프로젝트 조회
 * @version 2.0.0
 * @created 2025-12-26
 * @updated 2025-12-27
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
  fmeaInfo?: {
    subject?: string;
    fmeaStartDate?: string;
    fmeaRevisionDate?: string;
    modelYear?: string;
    designResponsibility?: string;
    fmeaResponsibleName?: string;
  };
  createdAt: string;
  status?: string;
  step?: number;  // 단계 (1~7)
  revisionNo?: string;  // 개정번호
}

// =====================================================
// 테이블 컬럼 정의 (수정됨)
// =====================================================
const COLUMN_HEADERS = [
  'No',
  'FMEA ID',
  '프로젝트명',
  'FMEA명',
  '고객사',
  '모델명',
  '공정책임',
  '담당자',
  '시작일자',
  '개정일자',
  '개정번호',
  '단계',
];

// FMEA ID 포맷 생성 (PFM25-001)
function formatFmeaId(id: string, index: number): string {
  // 기존 ID가 PFM 형식이면 그대로 반환
  if (id.startsWith('PFM')) return id;
  
  // 년도 추출 (현재 년도 기준)
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = (index + 1).toString().padStart(3, '0');
  return `PFM${year}-${seq}`;
}

// 단계 배지 렌더링
function renderStepBadge(step?: number): React.ReactNode {
  const stepNum = step || 1;
  
  const stepColors: Record<number, { bg: string; text: string }> = {
    1: { bg: 'bg-gray-200', text: 'text-gray-700' },
    2: { bg: 'bg-blue-200', text: 'text-blue-700' },
    3: { bg: 'bg-cyan-200', text: 'text-cyan-700' },
    4: { bg: 'bg-amber-200', text: 'text-amber-700' },
    5: { bg: 'bg-orange-200', text: 'text-orange-700' },
    6: { bg: 'bg-green-200', text: 'text-green-700' },
    7: { bg: 'bg-purple-200', text: 'text-purple-700' },
  };

  const { bg, text } = stepColors[stepNum] || stepColors[1];

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${bg} ${text}`}>
      {stepNum}단계
    </span>
  );
}

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
      // PFMEA 프로젝트 로드
      const storedPfmea = localStorage.getItem('pfmea-projects');
      const pfmeaProjects = storedPfmea ? JSON.parse(storedPfmea) : [];
      
      // 기존 FMEA 프로젝트 로드 (하위 호환)
      const storedFmea = localStorage.getItem('fmea-projects');
      const fmeaProjects = storedFmea ? JSON.parse(storedFmea) : [];

      // 병합
      const allProjects = [...pfmeaProjects, ...fmeaProjects];
      
      if (!Array.isArray(allProjects) || allProjects.length === 0) {
        setProjects([]);
        return;
      }

      // 최신순 정렬
      const sorted = allProjects.sort((a: FMEAProject, b: FMEAProject) => 
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
      p.fmeaInfo?.subject?.toLowerCase().includes(query) ||
      p.project?.customer?.toLowerCase().includes(query)
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
    localStorage.setItem('pfmea-projects', JSON.stringify(remaining.filter(p => p.id.includes('PFMEA'))));
    localStorage.setItem('fmea-projects', JSON.stringify(remaining.filter(p => !p.id.includes('PFMEA'))));
    setProjects(remaining);
    setSelectedRows(new Set());
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
            placeholder="🔍 프로젝트명, FMEA명, 고객사로 검색..."
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
            <tr className="bg-[#00587a] text-white" style={{ height: '28px' }}>
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
            {/* 데이터 행 */}
            {filteredProjects.map((p, index) => (
              <tr
                key={p.id}
                className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                  index % 2 === 0 ? 'bg-[#e3f2fd]' : 'bg-white'
                } ${selectedRows.has(p.id) ? 'bg-blue-100' : ''}`}
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
                <td className="border border-gray-400 px-2 py-1 text-center align-middle font-bold text-[#00587a]">{index + 1}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle font-semibold text-blue-600">
                  <a href={`/pfmea/worksheet?id=${p.id}`} className="hover:underline">
                    {formatFmeaId(p.id, index)}
                  </a>
                </td>
                <td className="border border-gray-400 px-2 py-1 text-left align-middle">{p.project?.projectName || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-left align-middle">{p.fmeaInfo?.subject || p.project?.productName || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.project?.customer || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.fmeaInfo?.modelYear || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.fmeaInfo?.designResponsibility || p.project?.department || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.fmeaInfo?.fmeaResponsibleName || p.project?.leader || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.fmeaInfo?.fmeaStartDate || p.project?.startDate || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.fmeaInfo?.fmeaRevisionDate || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.revisionNo || 'Rev.00'}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                  {renderStepBadge(p.step)}
                </td>
              </tr>
            ))}
            {/* 빈 행 */}
            {Array.from({ length: Math.max(0, 10 - filteredProjects.length) }).map((_, idx) => (
              <tr key={`empty-${idx}`} className={`${(filteredProjects.length + idx) % 2 === 0 ? 'bg-[#e3f2fd]' : 'bg-white'}`} style={{ height: '28px' }}>
                <td className="border border-gray-400 px-1 py-0.5 text-center align-middle">
                  <input type="checkbox" disabled className="w-3.5 h-3.5 opacity-30" />
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">{filteredProjects.length + idx + 1}</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
                <td className="border border-gray-400 px-2 py-1 text-center align-middle text-gray-300">-</td>
              </tr>
            ))}
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
