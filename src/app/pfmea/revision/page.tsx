/**
 * @file page.tsx
 * @description FMEA 개정관리 페이지 - 프로젝트별 개정 이력 관리
 * @version 1.0.0
 * @created 2025-12-26
 * @ref C:\01_Next_FMEA\app\fmea\components\RevisionManagement.tsx
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
  };
  createdAt?: string;
}

interface RevisionRecord {
  id: string;
  projectId: string;
  revisionNumber: string; // Rev.00, Rev.01, Rev.02...
  revisionHistory: string; // 개정이력 설명
  // 작성
  createPosition: string;
  createName: string;
  createDate: string;
  createStatus: string; // 진행/승인/반려
  // 검토
  reviewPosition: string;
  reviewName: string;
  reviewDate: string;
  reviewStatus: string;
  // 승인
  approvePosition: string;
  approveName: string;
  approveDate: string;
  approveStatus: string;
}

// =====================================================
// 초기 개정 이력 생성
// =====================================================
const createDefaultRevisions = (projectId: string): RevisionRecord[] => 
  Array.from({ length: 5 }, (_, index) => ({
    id: `REV-${projectId}-${index}`,
    projectId: projectId,
    revisionNumber: `Rev.${index.toString().padStart(2, '0')}`,
    revisionHistory: index === 0 ? '신규 프로젝트 등록' : '',
    createPosition: '',
    createName: '',
    createDate: index === 0 ? new Date().toISOString().split('T')[0] : '',
    createStatus: index === 0 ? '진행' : '',
    reviewPosition: '',
    reviewName: '',
    reviewDate: '',
    reviewStatus: '',
    approvePosition: '',
    approveName: '',
    approveDate: '',
    approveStatus: '',
  }));

// =====================================================
// 메인 컴포넌트
// =====================================================
export default function RevisionManagementPage() {
  // 프로젝트 상태
  const [projectList, setProjectList] = useState<FMEAProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 개정 데이터
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  
  // 선택된 행
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // 저장 상태
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // 프로젝트 목록 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fmea-projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setProjectList(parsed);
          if (parsed.length > 0 && !selectedProjectId) {
            setSelectedProjectId(parsed[0].id);
          }
        }
      }
    } catch (error) {
      console.error('❌ 프로젝트 목록 로드 실패:', error);
    }
  }, [selectedProjectId]);

  // 선택된 프로젝트의 개정 이력 로드
  useEffect(() => {
    if (!selectedProjectId) {
      setRevisions(createDefaultRevisions(''));
      return;
    }

    try {
      const allRevisions = JSON.parse(localStorage.getItem('fmea-revisions') || '[]');
      let projectRevisions = allRevisions.filter((r: RevisionRecord) => r.projectId === selectedProjectId);

      if (projectRevisions.length === 0) {
        projectRevisions = createDefaultRevisions(selectedProjectId);
        // 저장
        localStorage.setItem('fmea-revisions', JSON.stringify([...allRevisions, ...projectRevisions]));
      }

      // 최소 5개 행 보장
      while (projectRevisions.length < 5) {
        const nextNumber = projectRevisions.length.toString().padStart(2, '0');
        projectRevisions.push({
          id: `REV-${selectedProjectId}-${Date.now()}-${projectRevisions.length}`,
          projectId: selectedProjectId,
          revisionNumber: `Rev.${nextNumber}`,
          revisionHistory: '',
          createPosition: '',
          createName: '',
          createDate: '',
          createStatus: '',
          reviewPosition: '',
          reviewName: '',
          reviewDate: '',
          reviewStatus: '',
          approvePosition: '',
          approveName: '',
          approveDate: '',
          approveStatus: '',
        });
      }

      setRevisions(projectRevisions.sort((a: RevisionRecord, b: RevisionRecord) => 
        a.revisionNumber.localeCompare(b.revisionNumber)
      ));
    } catch (error) {
      console.error('❌ 개정 이력 로드 실패:', error);
      setRevisions(createDefaultRevisions(selectedProjectId));
    }
  }, [selectedProjectId]);

  // 프로젝트 필터링
  const filteredProjects = projectList.filter(p =>
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project?.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project?.customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 현재 프로젝트 정보
  const selectedProject = projectList.find(p => p.id === selectedProjectId);
  const projectLabel = selectedProject
    ? `${selectedProject.project?.projectName || selectedProject.id}`
    : '프로젝트를 선택하세요';

  // 필드 업데이트
  const updateField = (id: string, field: keyof RevisionRecord, value: string) => {
    const updated = revisions.map(r => (r.id === id ? { ...r, [field]: value } : r));
    setRevisions(updated);
  };

  // 저장
  const handleSave = () => {
    if (!selectedProjectId) {
      alert('프로젝트를 선택해주세요.');
      return;
    }

    try {
      const allRevisions = JSON.parse(localStorage.getItem('fmea-revisions') || '[]');
      const otherRevisions = allRevisions.filter((r: RevisionRecord) => r.projectId !== selectedProjectId);
      localStorage.setItem('fmea-revisions', JSON.stringify([...otherRevisions, ...revisions]));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  // 개정 추가
  const handleAddRevision = () => {
    if (!selectedProjectId) {
      alert('프로젝트를 선택해주세요.');
      return;
    }

    const latestNumber = revisions.length > 0
      ? parseInt(revisions[revisions.length - 1].revisionNumber.replace('Rev.', ''))
      : -1;
    const nextNumber = (latestNumber + 1).toString().padStart(2, '0');

    const newRevision: RevisionRecord = {
      id: `REV-${selectedProjectId}-${Date.now()}`,
      projectId: selectedProjectId,
      revisionNumber: `Rev.${nextNumber}`,
      revisionHistory: '',
      createPosition: '',
      createName: '',
      createDate: new Date().toISOString().split('T')[0],
      createStatus: '진행',
      reviewPosition: '',
      reviewName: '',
      reviewDate: '',
      reviewStatus: '',
      approvePosition: '',
      approveName: '',
      approveDate: '',
      approveStatus: '',
    };

    setRevisions([...revisions, newRevision]);
  };

  // 선택 삭제
  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) {
      alert('삭제할 개정 이력을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedRows.size}개의 개정 이력을 삭제하시겠습니까?`)) {
      return;
    }

    const updated = revisions.filter(r => !selectedRows.has(r.id));
    setRevisions(updated);
    setSelectedRows(new Set());

    // 저장
    const allRevisions = JSON.parse(localStorage.getItem('fmea-revisions') || '[]');
    const otherRevisions = allRevisions.filter((r: RevisionRecord) => r.projectId !== selectedProjectId);
    localStorage.setItem('fmea-revisions', JSON.stringify([...otherRevisions, ...updated]));
  };

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
    if (selectedRows.size === revisions.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(revisions.map(r => r.id)));
    }
  };

  // 상태 배지 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '승인': return 'bg-green-200 text-green-700';
      case '반려': return 'bg-red-200 text-red-700';
      case '진행': return 'bg-amber-200 text-amber-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4 font-[Malgun_Gothic]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📝</span>
        <h1 className="text-base font-bold text-gray-800">FMEA 개정관리</h1>
      </div>

      {/* 프로젝트 검색 */}
      <div className="bg-white rounded-lg border border-gray-400 p-3 mb-4">
        <div className="flex items-center gap-4">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            🔍 프로젝트 검색:
          </label>
          <input
            type="text"
            placeholder="프로젝트명, 고객사로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 프로젝트 선택 */}
      <div className="bg-white rounded-lg border border-gray-400 p-3 mb-4">
        <div className="flex items-center gap-4">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            📌 프로젝트 선택:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 min-w-[300px]"
          >
            <option value="">-- 선택 --</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project?.projectName || p.id} ({p.project?.customer || '-'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 개정 이력 테이블 */}
      <div className="rounded-lg overflow-hidden border border-gray-400 bg-white">
        {/* 테이블 헤더 바 */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#00587a] text-white">
          <span className="text-sm font-bold">📝 개정 이력 관리 - {projectLabel}</span>
          <div className="flex gap-2">
            <button
              onClick={handleAddRevision}
              className="px-3 py-1.5 bg-white text-[#00587a] text-xs font-semibold rounded hover:bg-gray-100"
            >
              ➕ 개정 추가
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedRows.size === 0}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ 삭제 ({selectedRows.size})
            </button>
            <button
              onClick={handleSave}
              className={`px-3 py-1.5 text-xs font-semibold rounded ${
                saveStatus === 'saved' 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-white text-[#00587a] hover:bg-gray-100'
              }`}
            >
              {saveStatus === 'saved' ? '✅ 저장됨' : '💾 저장'}
            </button>
          </div>
        </div>

        {/* HTML 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[1200px]">
            <thead>
              {/* 첫 번째 헤더 행 */}
              <tr className="bg-[#00587a] text-white">
                <th className="border border-white px-2 py-2 text-center align-middle w-10" rowSpan={2}>
                  <input
                    type="checkbox"
                    checked={revisions.length > 0 && selectedRows.size === revisions.length}
                    onChange={toggleAllRows}
                    className="w-4 h-4"
                  />
                </th>
                <th className="border border-white px-3 py-2 text-center align-middle w-20" rowSpan={2}>개정번호</th>
                <th className="border border-white px-3 py-2 text-center align-middle w-48" rowSpan={2}>개정이력</th>
                <th className="border border-white px-3 py-2 text-center align-middle" colSpan={4}>작성</th>
                <th className="border border-white px-3 py-2 text-center align-middle" colSpan={4}>검토</th>
                <th className="border border-white px-3 py-2 text-center align-middle" colSpan={4}>승인</th>
              </tr>
              {/* 두 번째 헤더 행 */}
              <tr className="bg-[#00587a] text-white">
                <th className="border border-white px-2 py-1 text-center align-middle w-16">직급</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-20">성명</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-24">날짜</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-16">상태</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-16">직급</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-20">성명</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-24">날짜</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-16">상태</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-16">직급</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-20">성명</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-24">날짜</th>
                <th className="border border-white px-2 py-1 text-center align-middle w-16">상태</th>
              </tr>
            </thead>
            <tbody>
              {revisions.map((revision, index) => (
                <tr key={revision.id} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`}>
                  <td className="border border-gray-400 px-2 py-1 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(revision.id)}
                      onChange={() => toggleRow(revision.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="border border-gray-400 px-3 py-1 text-center align-middle font-bold text-green-600">
                    {revision.revisionNumber}
                  </td>
                  <td className="border border-gray-400 px-1 py-1 text-left align-middle">
                    <input
                      type="text"
                      value={revision.revisionHistory}
                      onChange={(e) => updateField(revision.id, 'revisionHistory', e.target.value)}
                      placeholder="개정이력 입력"
                      className="w-full h-6 px-2 text-xs border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  {/* 작성 */}
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="text"
                      value={revision.createPosition}
                      onChange={(e) => updateField(revision.id, 'createPosition', e.target.value)}
                      placeholder="직급"
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="text"
                      value={revision.createName}
                      onChange={(e) => updateField(revision.id, 'createName', e.target.value)}
                      placeholder="성명"
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="date"
                      value={revision.createDate}
                      onChange={(e) => updateField(revision.id, 'createDate', e.target.value)}
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <select
                      value={revision.createStatus}
                      onChange={(e) => updateField(revision.id, 'createStatus', e.target.value)}
                      className={`w-full h-6 px-1 text-xs text-center border-0 rounded ${getStatusColor(revision.createStatus)}`}
                    >
                      <option value="">선택</option>
                      <option value="진행">진행</option>
                      <option value="승인">승인</option>
                      <option value="반려">반려</option>
                    </select>
                  </td>
                  {/* 검토 */}
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="text"
                      value={revision.reviewPosition}
                      onChange={(e) => updateField(revision.id, 'reviewPosition', e.target.value)}
                      placeholder="직급"
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="text"
                      value={revision.reviewName}
                      onChange={(e) => updateField(revision.id, 'reviewName', e.target.value)}
                      placeholder="성명"
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="date"
                      value={revision.reviewDate}
                      onChange={(e) => updateField(revision.id, 'reviewDate', e.target.value)}
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <select
                      value={revision.reviewStatus}
                      onChange={(e) => updateField(revision.id, 'reviewStatus', e.target.value)}
                      className={`w-full h-6 px-1 text-xs text-center border-0 rounded ${getStatusColor(revision.reviewStatus)}`}
                    >
                      <option value="">선택</option>
                      <option value="진행">진행</option>
                      <option value="승인">승인</option>
                      <option value="반려">반려</option>
                    </select>
                  </td>
                  {/* 승인 */}
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="text"
                      value={revision.approvePosition}
                      onChange={(e) => updateField(revision.id, 'approvePosition', e.target.value)}
                      placeholder="직급"
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="text"
                      value={revision.approveName}
                      onChange={(e) => updateField(revision.id, 'approveName', e.target.value)}
                      placeholder="성명"
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <input
                      type="date"
                      value={revision.approveDate}
                      onChange={(e) => updateField(revision.id, 'approveDate', e.target.value)}
                      className="w-full h-6 px-1 text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-1">
                    <select
                      value={revision.approveStatus}
                      onChange={(e) => updateField(revision.id, 'approveStatus', e.target.value)}
                      className={`w-full h-6 px-1 text-xs text-center border-0 rounded ${getStatusColor(revision.approveStatus)}`}
                    >
                      <option value="">선택</option>
                      <option value="진행">진행</option>
                      <option value="승인">승인</option>
                      <option value="반려">반려</option>
                    </select>
                  </td>
                </tr>
              ))}
              {revisions.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-4 py-10 text-center text-gray-500">
                    개정 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 상태바 */}
      <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
        <span>총 {revisions.length}개의 개정 이력</span>
        <span>버전: FMEA Suite v3.0 | 사용자: FMEA Lead</span>
      </div>
    </div>
  );
}

