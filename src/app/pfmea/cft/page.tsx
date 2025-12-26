/**
 * @file page.tsx
 * @description FMEA CFT 관리 페이지 - 프로젝트별 CFT 팀 관리
 * @version 1.0.0
 * @created 2025-12-26
 * @ref C:\01_Next_FMEA\app\fmea\components\cft\CFTManagement.tsx
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserSelectModal } from '@/components/modals/UserSelectModal';
import { UserInfo } from '@/types/user';

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
}

interface CFTRow {
  role: string;
  department: string;
  name: string;
  task: string;
  position: string;
  email: string;
  phone: string;
}

const CFT_ROLES = ['Champion', '리더', '프로젝트 관리자', 'CFT', '파트너'];

const createDefaultRows = (): CFTRow[] => 
  CFT_ROLES.map(role => ({
    role,
    department: '',
    name: '',
    task: '',
    position: '',
    email: '',
    phone: '',
  }));

// =====================================================
// 메인 컴포넌트
// =====================================================
export default function CFTManagementPage() {
  // 프로젝트 상태
  const [projectList, setProjectList] = useState<FMEAProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // CFT 데이터
  const [cftData, setCftData] = useState<CFTRow[]>(createDefaultRows());

  // 모달 상태
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

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

  // 선택된 프로젝트의 CFT 데이터 로드
  useEffect(() => {
    if (!selectedProjectId) {
      setCftData(createDefaultRows());
      return;
    }

    try {
      const storageKey = `FMEA_CFT_${selectedProjectId}`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCftData(parsed);
          return;
        }
      }
    } catch (error) {
      console.error('❌ CFT 데이터 파싱 실패:', error);
    }

    setCftData(createDefaultRows());
  }, [selectedProjectId]);

  // 프로젝트 필터링
  const filteredProjects = projectList.filter(p =>
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project?.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project?.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project?.productName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 현재 프로젝트 정보
  const selectedProject = projectList.find(p => p.id === selectedProjectId);
  const projectLabel = selectedProject
    ? `${selectedProject.project?.projectName || selectedProject.id} (${selectedProject.project?.customer || '-'})`
    : '프로젝트를 선택하세요';

  // 셀 값 변경
  const handleCellChange = (row: number, field: keyof CFTRow, value: string) => {
    const updated = [...cftData];
    updated[row] = { ...updated[row], [field]: value };
    setCftData(updated);
  };

  // 셀 클릭 핸들러 (사용자 모달 열기)
  const handleCellClick = (row: number, col: number) => {
    if (col === 0 || col === 3) {
      // CFT 역할(col 0), 담당업무(col 3) → 직접 입력
      return;
    }
    setSelectedCell({ row, col });
    setUserModalOpen(true);
  };

  // 사용자 선택 처리
  const handleUserSelect = (user: UserInfo) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const updated = [...cftData];

    // 컬럼에 따라 데이터 입력
    if (col === 1) updated[row].department = user.department;
    else if (col === 2) updated[row].name = user.name;
    else if (col === 4) updated[row].position = user.position || '';
    else if (col === 5) updated[row].email = user.email;
    else if (col === 6) updated[row].phone = user.phone || '';

    setCftData(updated);
    setUserModalOpen(false);
    setSelectedCell(null);
  };

  // 행 추가
  const handleAddRow = () => {
    setCftData([...cftData, {
      role: '',
      department: '',
      name: '',
      task: '',
      position: '',
      email: '',
      phone: '',
    }]);
  };

  // 행 삭제
  const handleDeleteRow = (index: number) => {
    if (cftData.length <= 1) {
      alert('최소 1개 행은 유지해야 합니다.');
      return;
    }
    const updated = cftData.filter((_, idx) => idx !== index);
    setCftData(updated);
  };

  // 저장
  const handleSave = () => {
    if (!selectedProjectId) {
      alert('프로젝트를 선택해주세요.');
      return;
    }

    const storageKey = `FMEA_CFT_${selectedProjectId}`;
    localStorage.setItem(storageKey, JSON.stringify(cftData));
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // 초기화
  const handleReset = () => {
    if (confirm('CFT 데이터를 초기화하시겠습니까?')) {
      setCftData(createDefaultRows());
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4 font-[Malgun_Gothic]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">👥</span>
        <h1 className="text-base font-bold text-gray-800">FMEA CFT 관리</h1>
      </div>

      {/* 프로젝트 검색 */}
      <div className="bg-white rounded-lg border border-gray-400 p-3 mb-4">
        <div className="flex items-center gap-4">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            🔍 프로젝트 검색:
          </label>
          <input
            type="text"
            placeholder="프로젝트명, 고객사, 품명으로 검색..."
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
                {p.project?.projectName || p.id} ({p.project?.customer || '-'} - {p.project?.productName || '-'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CFT 팀 구성 테이블 */}
      <div className="rounded-lg overflow-hidden border border-gray-400 bg-white">
        {/* 테이블 헤더 바 */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#00587a] text-white">
          <span className="text-sm font-bold">👥 FMEA CFT 협업 - {projectLabel}</span>
          <div className="flex gap-2">
            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 bg-white text-[#00587a] text-xs font-semibold rounded hover:bg-gray-100"
            >
              ➕ 행추가
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded hover:bg-gray-200"
            >
              🔄 초기화
            </button>
            <button
              onClick={handleSave}
              className={`px-3 py-1.5 text-white text-xs font-semibold rounded ${
                saveStatus === 'saved' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-white text-[#00587a] hover:bg-gray-100'
              }`}
            >
              {saveStatus === 'saved' ? '✅ 저장됨' : '💾 저장'}
            </button>
          </div>
        </div>

        {/* HTML 테이블 */}
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#f3f4f6]">
              <th className="border border-gray-300 px-3 py-2 text-center align-middle font-semibold text-gray-700 w-28">CFT 역할</th>
              <th className="border border-gray-300 px-3 py-2 text-center align-middle font-semibold text-gray-700 w-24">부서</th>
              <th className="border border-gray-300 px-3 py-2 text-center align-middle font-semibold text-gray-700 w-24">성명</th>
              <th className="border border-gray-300 px-3 py-2 text-center align-middle font-semibold text-gray-700">담당 업무</th>
              <th className="border border-gray-300 px-3 py-2 text-center align-middle font-semibold text-gray-700 w-20">직급</th>
              <th className="border border-gray-300 px-3 py-2 text-center align-middle font-semibold text-gray-700 w-36">E-mail</th>
              <th className="border border-gray-300 px-3 py-2 text-center align-middle font-semibold text-gray-700 w-28">전화번호</th>
              <th className="border border-gray-300 px-3 py-2 text-center align-middle font-semibold text-gray-700 w-20">추가/삭제</th>
            </tr>
          </thead>
          <tbody>
            {cftData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-blue-50">
                {/* CFT 역할 */}
                <td className="border border-gray-300 px-1 py-1 bg-[#fff3e0]">
                  <input
                    type="text"
                    value={row.role}
                    onChange={(e) => handleCellChange(rowIdx, 'role', e.target.value)}
                    placeholder="CFT 역할"
                    className="w-full h-7 px-2 text-xs text-center font-semibold border-0 bg-transparent focus:outline-none"
                  />
                </td>
                {/* 부서 */}
                <td 
                  className="border border-gray-300 px-1 py-1 bg-[#f9fafb] cursor-pointer"
                  onClick={() => handleCellClick(rowIdx, 1)}
                >
                  <input
                    type="text"
                    value={row.department}
                    onChange={(e) => handleCellChange(rowIdx, 'department', e.target.value)}
                    placeholder="클릭"
                    className="w-full h-7 px-2 text-xs text-center border-0 bg-transparent focus:outline-none cursor-pointer"
                    readOnly
                  />
                </td>
                {/* 성명 */}
                <td 
                  className="border border-gray-300 px-1 py-1 bg-[#f9fafb] cursor-pointer"
                  onClick={() => handleCellClick(rowIdx, 2)}
                >
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => handleCellChange(rowIdx, 'name', e.target.value)}
                    placeholder="클릭"
                    className="w-full h-7 px-2 text-xs text-center border-0 bg-transparent focus:outline-none cursor-pointer"
                    readOnly
                  />
                </td>
                {/* 담당 업무 */}
                <td className="border border-gray-300 px-1 py-1 bg-white">
                  <input
                    type="text"
                    value={row.task}
                    onChange={(e) => handleCellChange(rowIdx, 'task', e.target.value)}
                    placeholder="담당 업무 입력"
                    className="w-full h-7 px-2 text-xs text-left border-0 bg-transparent focus:outline-none"
                  />
                </td>
                {/* 직급 */}
                <td 
                  className="border border-gray-300 px-1 py-1 bg-[#f9fafb] cursor-pointer"
                  onClick={() => handleCellClick(rowIdx, 4)}
                >
                  <input
                    type="text"
                    value={row.position}
                    onChange={(e) => handleCellChange(rowIdx, 'position', e.target.value)}
                    placeholder="클릭"
                    className="w-full h-7 px-2 text-xs text-center border-0 bg-transparent focus:outline-none cursor-pointer"
                    readOnly
                  />
                </td>
                {/* E-mail */}
                <td 
                  className="border border-gray-300 px-1 py-1 bg-[#f9fafb] cursor-pointer"
                  onClick={() => handleCellClick(rowIdx, 5)}
                >
                  <input
                    type="text"
                    value={row.email}
                    onChange={(e) => handleCellChange(rowIdx, 'email', e.target.value)}
                    placeholder="클릭"
                    className="w-full h-7 px-2 text-xs text-left border-0 bg-transparent focus:outline-none cursor-pointer"
                    readOnly
                  />
                </td>
                {/* 전화번호 */}
                <td 
                  className="border border-gray-300 px-1 py-1 bg-[#f9fafb] cursor-pointer"
                  onClick={() => handleCellClick(rowIdx, 6)}
                >
                  <input
                    type="text"
                    value={row.phone}
                    onChange={(e) => handleCellChange(rowIdx, 'phone', e.target.value)}
                    placeholder="클릭"
                    className="w-full h-7 px-2 text-xs text-center border-0 bg-transparent focus:outline-none cursor-pointer"
                    readOnly
                  />
                </td>
                {/* 추가/삭제 */}
                <td className="border border-gray-300 px-2 py-1 bg-white text-center">
                  <button
                    onClick={() => {
                      // 이 행 다음에 추가
                      const newData = [...cftData];
                      newData.splice(rowIdx + 1, 0, {
                        role: '',
                        department: '',
                        name: '',
                        task: '',
                        position: '',
                        email: '',
                        phone: '',
                      });
                      setCftData(newData);
                    }}
                    className="text-sm hover:opacity-70 mr-1"
                    title="이 행 아래에 추가"
                  >
                    ➕
                  </button>
                  <button
                    onClick={() => handleDeleteRow(rowIdx)}
                    className="text-sm hover:opacity-70"
                    title="행 삭제"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 상태바 */}
      <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
        <span>총 {cftData.length}명의 CFT 멤버</span>
        <span>버전: FMEA Suite v3.0 | 사용자: FMEA Lead</span>
      </div>

      {/* 사용자 선택 모달 */}
      <UserSelectModal
        isOpen={userModalOpen}
        onSelect={handleUserSelect}
        onClose={() => {
          setUserModalOpen(false);
          setSelectedCell(null);
        }}
      />
    </div>
  );
}

