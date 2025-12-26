/**
 * @file page.tsx
 * @description 사용자정보 관리 페이지 - 엑셀 다운로드/임포트
 * @version 1.0.0
 * @created 2025-12-26
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { UserInfo, USER_STORAGE_KEY } from '@/types/user';
import { getAllUsers, createUser, deleteUser, createSampleUsers } from '@/lib/user-db';
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

export default function UserInfoPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  // 데이터 로드
  useEffect(() => {
    createSampleUsers();
    loadData();
  }, []);

  const loadData = () => {
    const data = getAllUsers();
    setUsers(data);
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(users.map(u => u.id)));
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

    selectedIds.forEach(id => deleteUser(id));
    setSelectedIds(new Set());
    loadData();
  };

  // 엑셀 다운로드 (빈 템플릿) - 스타일 적용
  const handleDownloadTemplate = () => {
    const headers = ['공장', '부서', '성명', '직급', '전화번호', '이메일', '비고'];
    const colWidths = [12, 15, 10, 10, 15, 25, 20];
    downloadTemplate(headers, colWidths, '사용자정보', '사용자정보_템플릿.xlsx');
  };

  // 엑셀 다운로드 (현재 데이터) - 스타일 적용
  const handleDownloadData = () => {
    const headers = ['공장', '부서', '성명', '직급', '전화번호', '이메일', '비고'];
    const colWidths = [12, 15, 10, 10, 15, 25, 20];
    const data = users.map(u => [
      u.factory,
      u.department,
      u.name,
      u.position,
      u.phone,
      u.email,
      u.remark || '',
    ]);
    downloadStyledExcel(headers, data, colWidths, '사용자정보', `사용자정보_${new Date().toISOString().slice(0,10)}.xlsx`);
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
        const newUser: UserInfo = {
          id: generateUUID(),
          factory: String(row[0] || ''),
          department: String(row[1] || ''),
          name: String(row[2] || ''),
          position: String(row[3] || ''),
          phone: String(row[4] || ''),
          email: String(row[5] || ''),
          remark: String(row[6] || ''),
          createdAt: now,
          updatedAt: now,
        };

        if (newUser.name) {
          // 기존 데이터에 추가
          const existing = getAllUsers();
          existing.push(newUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(existing));
          importedCount++;
        }
      }

      setImportStatus(`✅ ${importedCount}명 임포트 완료!`);
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
    if (!confirm('모든 사용자정보를 삭제하시겠습니까?')) return;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify([]));
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">👤</span>
        <h1 className="text-base font-bold text-gray-800">사용자정보 관리</h1>
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
                    checked={selectedIds.size === users.length && users.length > 0}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                </th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-10">NO</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-20">공장</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">부서</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-20">성명</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-16">직급</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-28">전화번호</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">이메일</th>
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold">비고</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-500">
                    데이터가 없습니다. 엑셀 임포트로 데이터를 추가해주세요.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(user.id)}
                        onChange={e => handleSelect(user.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{index + 1}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{user.factory}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{user.department}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle font-semibold">{user.name}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{user.position}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle">{user.phone}</td>
                    <td className="border border-gray-300 px-2 py-2 text-left align-middle">{user.email}</td>
                    <td className="border border-gray-300 px-2 py-2 text-left align-middle text-gray-500">{user.remark || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 상태바 */}
      <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
        <span>총 {users.length}명</span>
        <span>선택: {selectedIds.size}명</span>
      </div>
    </div>
  );
}

