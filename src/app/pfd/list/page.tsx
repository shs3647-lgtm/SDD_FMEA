/**
 * @file page.tsx
 * @description PFD 리스트 페이지 - FMEA 리스트와 완전 동일한 구조
 * @version 3.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PFDTopNav from '@/components/layout/PFDTopNav';

// =====================================================
// 타입 정의
// =====================================================
interface PFDProject {
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
  pfdInfo?: {
    subject?: string;
    pfdStartDate?: string;
    pfdRevisionDate?: string;
    modelYear?: string;
    processResponsibility?: string;
    pfdResponsibleName?: string;
  };
  createdAt: string;
  status?: string;
  step?: number;
  revisionNo?: string;
}

// =====================================================
// 테이블 컬럼 정의
// =====================================================
const COLUMN_HEADERS = [
  'No',
  'PFD ID',
  '프로젝트명',
  'PFD명',
  '고객사',
  '모델명',
  '공정책임',
  '담당자',
  '시작일자',
  '개정일자',
  '개정번호',
  '단계',
];

// PFD ID 포맷 생성
function formatPfdId(id: string, index: number): string {
  if (id.startsWith('PFD')) return id;
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = (index + 1).toString().padStart(3, '0');
  return `PFD${year}-${seq}`;
}

// 기본 샘플 데이터
const DEFAULT_SAMPLE_DATA: PFDProject[] = [
  {
    id: 'PFD25-310',
    project: { projectName: 'SDD NEW PFD 개발', customer: 'SDD', productName: 'PCR 타이어', partNo: 'PCR-2025-001', department: '품질팀', leader: '신홍섭', startDate: '2025-12-01', endDate: '2026-06-30' },
    pfdInfo: { subject: 'SDD NEW PFD 개발', pfdStartDate: '2025-12-01', pfdRevisionDate: '2025-12-29', modelYear: 'MY2025', processResponsibility: '품질팀', pfdResponsibleName: '신홍섭' },
    createdAt: '2025-12-01T09:00:00.000Z', status: 'active', step: 2, revisionNo: 'Rev.01'
  },
];

// 단계 배지 렌더링
function renderStepBadge(step?: number): React.ReactNode {
  const stepNum = step || 1;
  
  const stepColors: Record<number, { bg: string; text: string }> = {
    1: { bg: 'bg-gray-200', text: 'text-gray-700' },
    2: { bg: 'bg-violet-200', text: 'text-violet-700' },
    3: { bg: 'bg-purple-200', text: 'text-purple-700' },
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
export default function PFDListPage() {
  const [projects, setProjects] = useState<PFDProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // 데이터 로드
  const loadData = useCallback(() => {
    try {
      const storedPfd = localStorage.getItem('pfd-projects');
      let allProjects = storedPfd ? JSON.parse(storedPfd) : [];
      
      if (!Array.isArray(allProjects) || allProjects.length === 0) {
        localStorage.setItem('pfd-projects', JSON.stringify(DEFAULT_SAMPLE_DATA));
        allProjects = DEFAULT_SAMPLE_DATA;
      }

      const uniqueProjects = allProjects.reduce((acc: PFDProject[], curr: PFDProject) => {
        if (!acc.find(p => p.id === curr.id)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      const sorted = uniqueProjects.sort((a: PFDProject, b: PFDProject) => 
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );

      setProjects(sorted);
    } catch (error) {
      console.error('❌ PFD 리스트 로드 실패:', error);
      setProjects([]);
    }
  }, []);

  // 데이터 저장
  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('pfd-projects', JSON.stringify(projects));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('❌ PFD 리스트 저장 실패:', error);
      setSaveStatus('idle');
      alert('저장에 실패했습니다.');
    }
  }, [projects]);

  // 초기 로드
  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('pfd-projects-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('pfd-projects-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // 검색 필터링
  const filteredProjects = projects.filter(p => {
    if (!p || !p.id) return false;
    const query = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(query) ||
      p.project?.projectName?.toLowerCase().includes(query) ||
      p.project?.productName?.toLowerCase().includes(query) ||
      p.pfdInfo?.subject?.toLowerCase().includes(query) ||
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
    localStorage.setItem('pfd-projects', JSON.stringify(remaining));
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
    window.location.href = `/pfd/register?id=${selectedId}`;
  };

  return (
    <>
      <PFDTopNav />
      
      <div className="min-h-screen bg-[#f0f0f0] px-3 py-3 pt-9 font-[Malgun_Gothic]">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📋</span>
          <h1 className="text-base font-bold text-gray-800">PFD 리스트</h1>
          <span className="text-xs text-gray-500 ml-2">총 {filteredProjects.length}건</span>
        </div>

        {/* 검색 및 액션 바 */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="🔍 프로젝트명, PFD명, 고객사로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-400 rounded bg-white focus:outline-none focus:border-violet-500"
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
                  : 'bg-violet-100 border border-violet-400 text-violet-700 hover:bg-violet-200'
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
              href="/pfd/register"
              className="px-4 py-2 bg-[#7c3aed] text-white text-xs font-bold rounded hover:bg-[#6d28d9] flex items-center gap-1"
            >
              ➕ 신규 등록
            </a>
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-lg overflow-hidden border border-gray-400 bg-white">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#7c3aed] text-white" style={{ height: '28px' }}>
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
                  className={`hover:bg-violet-50 cursor-pointer transition-colors ${
                    index % 2 === 0 ? 'bg-[#ede9fe]' : 'bg-white'
                  } ${selectedRows.has(p.id) ? 'bg-violet-100' : ''}`}
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
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle font-bold text-[#7c3aed]">{index + 1}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle font-semibold text-violet-600">
                    <a href={`/pfd/worksheet?id=${p.id}`} className="hover:underline">
                      {formatPfdId(p.id, index)}
                    </a>
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-left align-middle">
                    {p.project?.projectName ? (
                      <a href={`/apqp/list`} className="text-violet-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                        {p.project.projectName}
                      </a>
                    ) : (
                      <span className="text-red-500 italic cursor-pointer hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); window.location.href = `/pfd/register?id=${p.id}`; }}>
                        미입력
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-left align-middle">
                    {p.pfdInfo?.subject || p.project?.productName ? (
                      <a href={`/pfd/worksheet?id=${p.id}`} className="text-violet-600 hover:underline font-semibold cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        {p.pfdInfo?.subject || p.project?.productName}
                      </a>
                    ) : (
                      <span className="text-red-500 italic cursor-pointer hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); window.location.href = `/pfd/register?id=${p.id}`; }}>
                        미입력
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.project?.customer ? p.project.customer : (
                      <span className="text-red-500 italic cursor-pointer hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); window.location.href = `/pfd/register?id=${p.id}`; }}>
                        미입력
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.pfdInfo?.modelYear ? p.pfdInfo.modelYear : (
                      <span className="text-red-500 italic cursor-pointer hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); window.location.href = `/pfd/register?id=${p.id}`; }}>
                        미입력
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.pfdInfo?.processResponsibility || p.project?.department ? (p.pfdInfo?.processResponsibility || p.project?.department) : (
                      <span className="text-red-500 italic cursor-pointer hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); window.location.href = `/pfd/register?id=${p.id}`; }}>
                        미입력
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.pfdInfo?.pfdResponsibleName || p.project?.leader ? (p.pfdInfo?.pfdResponsibleName || p.project?.leader) : (
                      <span className="text-red-500 italic cursor-pointer hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); window.location.href = `/pfd/register?id=${p.id}`; }}>
                        미입력
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.pfdInfo?.pfdStartDate || p.project?.startDate ? (p.pfdInfo?.pfdStartDate || p.project?.startDate) : (
                      <span className="text-red-500 italic cursor-pointer hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); window.location.href = `/pfd/register?id=${p.id}`; }}>
                        미입력
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.pfdInfo?.pfdRevisionDate ? p.pfdInfo.pfdRevisionDate : (
                      <span className="text-red-500 italic cursor-pointer hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); window.location.href = `/pfd/register?id=${p.id}`; }}>
                        미입력
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">{p.revisionNo || 'Rev.00'}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {renderStepBadge(p.step)}
                  </td>
                </tr>
              ))}
              {/* 빈 행 */}
              {Array.from({ length: Math.max(0, 10 - filteredProjects.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`} className={`${(filteredProjects.length + idx) % 2 === 0 ? 'bg-[#ede9fe]' : 'bg-white'}`} style={{ height: '28px' }}>
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
          <span>버전: PFD Suite v3.0 | 사용자: PFD Lead</span>
        </div>
      </div>
    </>
  );
}
