/**
 * @file page.tsx
 * @description APQP 리스트 페이지 - 등록된 APQP 프로젝트 조회
 * @version 2.0.0
 * @created 2025-12-27
 * @updated 2025-12-29
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import APQPTopNav from '@/components/layout/APQPTopNav';

// =====================================================
// 타입 정의
// =====================================================
interface APQPProject {
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
    protoDate?: string;
    p1Date?: string;
    p2Date?: string;
    ppapDate?: string;
    sopDate?: string;
  };
  createdAt: string;
  status?: string;
  phase?: string;  // 현재 단계 (Proto, P1, P2, PPAP, SOP)
}

// =====================================================
// 테이블 컬럼 정의
// =====================================================
const COLUMN_HEADERS = [
  'No',
  'APQP ID',
  '프로젝트명',
  '고객사',
  '품명',
  '품번',
  '담당부서',
  'Leader',
  '시작일',
  '종료일',
  '현재단계',
];

// 기본 샘플 데이터
const DEFAULT_SAMPLE_DATA: APQPProject[] = [
  {
    id: 'APQP-2025-038',
    project: { 
      projectName: 'NEW FMEA SW개발', 
      customer: '자동차 모든 업체', 
      productName: 'SDD', 
      partNo: 'SDD-001', 
      department: '품질보증팀', 
      leader: '김철수', 
      startDate: '2025-12-29', 
      endDate: '2026-06-18',
      protoDate: '2025-12-29',
      p1Date: '2026-01-02',
      p2Date: '2026-02-13',
      ppapDate: '2026-03-20',
      sopDate: '2026-04-29',
    },
    createdAt: '2025-12-29T09:00:00.000Z', 
    status: 'active', 
    phase: 'Proto'
  },
];

// 현재 단계 계산
function calculatePhase(project: APQPProject['project']): string {
  const today = new Date().toISOString().split('T')[0];
  
  if (project.sopDate && today >= project.sopDate) return 'SOP';
  if (project.ppapDate && today >= project.ppapDate) return 'PPAP';
  if (project.p2Date && today >= project.p2Date) return 'P2';
  if (project.p1Date && today >= project.p1Date) return 'P1';
  if (project.protoDate && today >= project.protoDate) return 'Proto';
  return '준비중';
}

// 단계 배지 렌더링
function renderPhaseBadge(phase?: string): React.ReactNode {
  const phaseVal = phase || '준비중';
  
  const phaseColors: Record<string, { bg: string; text: string }> = {
    '준비중': { bg: 'bg-gray-200', text: 'text-gray-700' },
    'Proto': { bg: 'bg-purple-200', text: 'text-purple-700' },
    'P1': { bg: 'bg-blue-200', text: 'text-blue-700' },
    'P2': { bg: 'bg-cyan-200', text: 'text-cyan-700' },
    'PPAP': { bg: 'bg-amber-200', text: 'text-amber-700' },
    'SOP': { bg: 'bg-green-200', text: 'text-green-700' },
  };

  const { bg, text } = phaseColors[phaseVal] || phaseColors['준비중'];

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${bg} ${text}`}>
      {phaseVal}
    </span>
  );
}

// =====================================================
// 내부 컴포넌트 (useSearchParams 사용)
// =====================================================
function APQPListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 선택 모드 여부 (FMEA에서 프로젝트 선택용)
  const selectMode = searchParams.get('mode') === 'select';
  const fmeaId = searchParams.get('fmeaId');
  
  const [projects, setProjects] = useState<APQPProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // 데이터 로드
  const loadData = useCallback(() => {
    try {
      const stored = localStorage.getItem('APQP-projects');
      let allProjects = stored ? JSON.parse(stored) : [];
      
      // 데이터가 없으면 기본 샘플 데이터 저장
      if (!Array.isArray(allProjects) || allProjects.length === 0) {
        localStorage.setItem('APQP-projects', JSON.stringify(DEFAULT_SAMPLE_DATA));
        allProjects = DEFAULT_SAMPLE_DATA;
      }

      // 최신순 정렬
      const sorted = allProjects.sort((a: APQPProject, b: APQPProject) => 
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );

      setProjects(sorted);
      
      // 선택 모드에서 데이터가 없으면 등록화면으로 이동
      if (selectMode && sorted.length === 0) {
        router.push('/apqp/register' + (fmeaId ? `?fmeaId=${fmeaId}` : ''));
      }
    } catch (error) {
      console.error('❌ APQP 리스트 로드 실패:', error);
      setProjects([]);
      
      // 선택 모드에서 에러 시 등록화면으로 이동
      if (selectMode) {
        router.push('/apqp/register' + (fmeaId ? `?fmeaId=${fmeaId}` : ''));
      }
    }
  }, [selectMode, fmeaId, router]);

  // 데이터 저장
  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('APQP-projects', JSON.stringify(projects));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('❌ APQP 리스트 저장 실패:', error);
      setSaveStatus('idle');
      alert('저장에 실패했습니다.');
    }
  }, [projects]);

  // 초기 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 검색 필터링
  const filteredProjects = projects.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(query) ||
      p.project?.projectName?.toLowerCase().includes(query) ||
      p.project?.productName?.toLowerCase().includes(query) ||
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
    localStorage.setItem('APQP-projects', JSON.stringify(remaining));
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
    window.location.href = `/apqp/register?id=${selectedId}`;
  };

  // 프로젝트 선택 (선택 모드에서)
  const handleSelectProject = (project: APQPProject) => {
    if (selectMode && fmeaId) {
      // FMEA에 프로젝트 연결
      const fmeaProjects = JSON.parse(localStorage.getItem('pfmea-projects') || '[]');
      const updatedProjects = fmeaProjects.map((fmea: { id: string; project?: { projectName?: string } }) => {
        if (fmea.id === fmeaId) {
          return {
            ...fmea,
            project: {
              ...(fmea.project || {}),
              projectName: project.project.projectName,
              customer: project.project.customer,
              productName: project.project.productName,
              partNo: project.project.partNo,
              department: project.project.department,
              leader: project.project.leader,
              startDate: project.project.startDate,
              endDate: project.project.endDate,
            }
          };
        }
        return fmea;
      });
      localStorage.setItem('pfmea-projects', JSON.stringify(updatedProjects));
      
      // FMEA 리스트로 이동
      alert(`✅ "${project.project.projectName}" 프로젝트가 FMEA에 연결되었습니다.`);
      router.push('/pfmea/list');
    }
  };

  return (
    <>
      {/* 상단 고정 바로가기 메뉴 */}
      <APQPTopNav />
      
      <div className="min-h-screen bg-[#f0f0f0] px-3 py-3 pt-9 font-[Malgun_Gothic]">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📋</span>
          <h1 className="text-base font-bold text-gray-800">APQP 리스트</h1>
          <span className="text-xs text-gray-500 ml-2">총 {filteredProjects.length}건</span>
          {selectMode && (
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-semibold">
              🔗 프로젝트 선택 모드
            </span>
          )}
        </div>

        {/* 선택 모드 안내 */}
        {selectMode && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800">
            💡 FMEA와 연결할 APQP 프로젝트를 선택해주세요. 프로젝트가 없으면 
            <a href={`/apqp/register?fmeaId=${fmeaId}`} className="text-blue-600 hover:underline font-semibold ml-1">
              신규 등록
            </a>
            을 해주세요.
          </div>
        )}

        {/* 검색 및 액션 바 */}
        <div className="flex items-center justify-between mb-4 gap-4">
          {/* 검색 */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="🔍 프로젝트명, 품명, 고객사로 검색..."
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
            {!selectMode && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-1 ${
                    saveStatus === 'saved' 
                      ? 'bg-green-500 text-white border border-green-600' 
                      : 'bg-blue-100 border border-blue-400 text-blue-700 hover:bg-blue-200'
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
              </>
            )}
            <a
              href={`/apqp/register${fmeaId ? `?fmeaId=${fmeaId}` : ''}`}
              className="px-4 py-2 bg-[#1b5e20] text-white text-xs font-bold rounded hover:bg-[#2e7d32] flex items-center gap-1"
            >
              ➕ 신규 등록
            </a>
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-lg overflow-hidden border border-gray-400 bg-white">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#1b5e20] text-white" style={{ height: '28px' }}>
                <th className="border border-white px-1 py-1 text-center align-middle w-8">
                  {!selectMode && (
                    <input
                      type="checkbox"
                      checked={filteredProjects.length > 0 && selectedRows.size === filteredProjects.length}
                      onChange={toggleAllRows}
                      className="w-3.5 h-3.5"
                    />
                  )}
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
                  key={`${p.id}-${index}`}
                  className={`hover:bg-green-50 cursor-pointer transition-colors ${
                    index % 2 === 0 ? 'bg-[#e8f5e9]' : 'bg-white'
                  } ${selectedRows.has(p.id) ? 'bg-green-100' : ''}`}
                  style={{ height: '28px' }}
                  onClick={() => selectMode ? handleSelectProject(p) : toggleRow(p.id)}
                  onDoubleClick={() => {
                    if (selectMode) {
                      handleSelectProject(p);
                    } else {
                      window.location.href = `/apqp/register?id=${p.id}`;
                    }
                  }}
                >
                  <td className="border border-gray-400 px-1 py-0.5 text-center align-middle">
                    {!selectMode ? (
                      <input
                        type="checkbox"
                        checked={selectedRows.has(p.id)}
                        onChange={() => toggleRow(p.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5"
                      />
                    ) : (
                      <span className="text-green-600">▶</span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle font-bold text-[#1b5e20]">{index + 1}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle font-semibold text-green-600">
                    {p.id}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-left align-middle font-semibold">
                    {p.project?.projectName || '-'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.project?.customer || '-'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.project?.productName || '-'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.project?.partNo || '-'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.project?.department || '-'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.project?.leader || '-'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.project?.startDate || '-'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {p.project?.endDate || '-'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    {renderPhaseBadge(p.phase || calculatePhase(p.project))}
                  </td>
                </tr>
              ))}
              {/* 빈 행 */}
              {Array.from({ length: Math.max(0, 10 - filteredProjects.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`} className={`${(filteredProjects.length + idx) % 2 === 0 ? 'bg-[#e8f5e9]' : 'bg-white'}`} style={{ height: '28px' }}>
                  <td className="border border-gray-400 px-1 py-0.5 text-center align-middle">
                    {!selectMode && <input type="checkbox" disabled className="w-3.5 h-3.5 opacity-30" />}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 상태바 */}
        <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
          <span>조회 결과: {filteredProjects.length}건 / 전체: {projects.length}건</span>
          <span>버전: APQP Suite v3.0 | 사용자: APQP Lead</span>
        </div>
      </div>
    </>
  );
}

// =====================================================
// 메인 컴포넌트 (Suspense 래핑)
// =====================================================
export default function APQPListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <APQPListContent />
    </Suspense>
  );
}
