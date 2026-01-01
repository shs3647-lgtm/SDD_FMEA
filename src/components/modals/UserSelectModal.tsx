/**
 * 사용자 선택 모달
 * CFT/승인권자 등록 시 사용자 선택
 * @ref C:\01_Next_FMEA\app\fmea\components\UserInfoSelectionModal.tsx
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserInfo, USER_STORAGE_KEY } from '@/types/user';
import { getAllUsers, createSampleUsers, createUser, deleteUser } from '@/lib/user-db';
import { downloadStyledExcel } from '@/lib/excel-utils';
import * as XLSX from 'xlsx';

interface UserSelectModalProps {
  isOpen: boolean;
  onSelect: (user: UserInfo) => void;
  onClose: () => void;
}

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function UserSelectModal({
  isOpen,
  onSelect,
  onClose
}: UserSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 데이터 로드
  useEffect(() => {
    if (!isOpen) return;
    createSampleUsers();
    refreshData();
  }, [isOpen]);

  const refreshData = () => {
    const loadedUsers = getAllUsers();
    setUsers(loadedUsers);
  };

  // 검색 필터링
  const filteredUsers = users.filter(user =>
    user.name.includes(searchTerm) ||
    user.department.includes(searchTerm) ||
    user.factory.includes(searchTerm) ||
    user.email.includes(searchTerm)
  );

  // 모달 닫기 시 초기화
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedId(null);
      setEditingUser(null);
    }
  }, [isOpen]);

  // 신규 추가
  const handleAdd = () => {
    const now = new Date().toISOString();
    const newUser: UserInfo = {
      id: generateUUID(),
      factory: '',
      department: '',
      name: '',
      position: '',
      phone: '',
      email: '',
      remark: '',
      createdAt: now,
      updatedAt: now
    };
    setEditingUser(newUser);
  };

  // 저장
  const handleSave = () => {
    if (editingUser) {
      if (!editingUser.name) {
        alert('성명은 필수입니다.');
        return;
      }
      const existing = getAllUsers();
      const idx = existing.findIndex(u => u.id === editingUser.id);
      if (idx >= 0) {
        existing[idx] = { ...editingUser, updatedAt: new Date().toISOString() };
      } else {
        existing.push(editingUser);
      }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(existing));
      const savedId = editingUser.id;
      setEditingUser(null);
      // 즉시 최신 데이터 로드
      const latestUsers = getAllUsers();
      setUsers(latestUsers);
      setSelectedId(savedId); // 저장된 항목 선택 유지
    }
  };

  // 삭제
  const handleDelete = () => {
    if (selectedId) {
      if (confirm('선택한 사용자를 삭제하시겠습니까?')) {
        deleteUser(selectedId);
        refreshData();
        setSelectedId(null);
      }
    } else {
      alert('삭제할 사용자를 선택해주세요.');
    }
  };

  // Export (엑셀 다운로드)
  const handleExport = () => {
    const headers = ['공장', '부서', '성명', '직급', '전화번호', '이메일', '비고'];
    const colWidths = [12, 15, 10, 10, 15, 25, 20];
    const data = users.map(u => [
      u.factory,
      u.department,
      u.name,
      u.position,
      u.phone,
      u.email,
      u.remark || ''
    ]);
    downloadStyledExcel(headers, data, colWidths, '사용자정보', `사용자정보_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Import (엑셀 업로드)
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

      const dataRows = jsonData.slice(1).filter(row => row.length > 0 && row[2]); // 성명 필수
      
      if (dataRows.length === 0) {
        alert('❌ 데이터가 없습니다.');
        return;
      }

      const now = new Date().toISOString();
      let importedCount = 0;

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
          updatedAt: now
        };

        if (newUser.name) {
          const existing = getAllUsers();
          existing.push(newUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(existing));
          importedCount++;
        }
      }

      refreshData();
      alert(`✅ ${importedCount}명 Import 완료!`);
    } catch (err) {
      console.error('Import 오류:', err);
      alert('❌ 엑셀 파일 읽기 오류');
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  const handleSelect = (user: UserInfo) => {
    onSelect(user);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-[85%] max-w-[800px] max-h-[60vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300 bg-[#00587a]">
          <h2 className="text-sm font-bold text-white flex items-center gap-1">
            👤 사용자 선택
          </h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleImport}
              className="px-2 py-1 text-[10px] font-semibold bg-white text-[#00587a] rounded hover:bg-gray-100"
            >
              📥 Import
            </button>
            <button 
              onClick={handleExport}
              className="px-2 py-1 text-[10px] font-semibold bg-white text-[#00587a] rounded hover:bg-gray-100"
            >
              📤 Export
            </button>
            <button 
              onClick={handleAdd}
              className="px-2 py-1 text-[10px] font-semibold bg-green-500 text-white rounded hover:bg-green-600"
            >
              ➕ 추가
            </button>
            <button 
              onClick={() => {
                if (editingUser) {
                  handleSave();
                } else if (selectedId) {
                  const user = users.find(u => u.id === selectedId);
                  if (user) setEditingUser({...user});
                } else {
                  alert('수정할 사용자를 선택해주세요.');
                }
              }}
              className={`px-2 py-1 text-[10px] font-semibold rounded ${
                editingUser 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {editingUser ? '💾 저장' : '✏️ 수정'}
            </button>
            <button 
              onClick={handleDelete}
              className="px-2 py-1 text-[10px] font-semibold bg-red-500 text-white rounded hover:bg-red-600"
            >
              🗑️ 삭제
            </button>
            <div className="w-px h-4 bg-white/50" />
            <button 
              onClick={onClose} 
              className="px-2 py-1 text-[10px] font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ✕ 닫기
            </button>
          </div>
        </div>
        
        {/* 파일 입력 (숨김) */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx,.xls" 
          className="hidden" 
        />

        {/* 검색 */}
        <div className="px-3 py-2 border-b border-gray-200">
          <input
            type="text"
            placeholder="🔍 검색 (성명/부서/공장/이메일)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
            autoFocus
          />
        </div>

        {/* 편집 폼 (추가/수정 시) */}
        {editingUser ? (
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
              <p className="text-xs font-semibold text-blue-700 mb-2">📝 사용자 {editingUser.id.length < 20 ? '신규 등록' : '수정'}</p>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-gray-600 block mb-0.5">공장</label>
                  <input type="text" value={editingUser.factory} onChange={(e) => setEditingUser({...editingUser, factory: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="울산공장" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block mb-0.5">부서</label>
                  <input type="text" value={editingUser.department} onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="품질보증팀" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block mb-0.5">성명 *</label>
                  <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="홍길동" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block mb-0.5">직급</label>
                  <input type="text" value={editingUser.position} onChange={(e) => setEditingUser({...editingUser, position: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="과장" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block mb-0.5">전화번호</label>
                  <input type="text" value={editingUser.phone} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="010-1234-5678" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block mb-0.5">이메일</label>
                  <input type="text" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="user@example.com" />
                </div>
                <div className="flex items-end gap-1 col-span-2">
                  <button onClick={handleSave} className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded hover:bg-blue-600">💾 저장</button>
                  <button onClick={() => setEditingUser(null)} className="px-3 py-1 text-xs font-semibold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">취소</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 안내 메시지 + 선택 적용 버튼 */}
            <div className="flex items-center justify-between px-3 py-1 bg-amber-50 border-b border-amber-200">
              <p className="text-[10px] text-amber-700">
                💡 행 클릭 → 선택 | 더블클릭 → 적용 | 행 선택 후 삭제 가능
              </p>
              <button 
                onClick={() => {
                  if (!selectedId) {
                    alert('선택된 사용자가 없습니다.');
                    return;
                  }
                  const user = users.find(u => u.id === selectedId);
                  if (user) handleSelect(user);
                }}
                disabled={!selectedId || !!editingUser}
                className={`px-3 py-1 text-[10px] font-semibold rounded ${
                  selectedId && !editingUser
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                ✓ 선택 적용
              </button>
            </div>

            {/* 테이블 */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  사용자가 없습니다. [➕ 추가] 또는 [📥 Import]로 등록하세요.
                </div>
              ) : (
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-[#00587a] text-white">
                    <tr>
                      <th className="border border-white px-1 py-1 text-center align-middle font-semibold w-6">✓</th>
                      <th className="border border-white px-1 py-1 text-center align-middle font-semibold w-16">공장</th>
                      <th className="border border-white px-1 py-1 text-center align-middle font-semibold">부서</th>
                      <th className="border border-white px-1 py-1 text-center align-middle font-semibold w-14">성명</th>
                      <th className="border border-white px-1 py-1 text-center align-middle font-semibold w-12">직급</th>
                      <th className="border border-white px-1 py-1 text-center align-middle font-semibold w-24">전화번호</th>
                      <th className="border border-white px-1 py-1 text-center align-middle font-semibold">이메일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedId(user.id)}
                        onDoubleClick={() => handleSelect(user)}
                        className={`cursor-pointer hover:bg-blue-100 transition-colors ${
                          selectedId === user.id 
                            ? 'bg-blue-200' 
                            : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle">
                          <input type="radio" checked={selectedId === user.id} onChange={() => setSelectedId(user.id)} className="w-3 h-3" />
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle">{user.factory}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle">{user.department}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle font-semibold">{user.name}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle">{user.position || '-'}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle">{user.phone || '-'}</td>
                        <td className="border border-gray-300 px-1 py-1 text-left align-middle">{user.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* 푸터 */}
        <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50">
          <span className="text-[10px] text-gray-500">
            총 {filteredUsers.length}명 {selectedId && '| 선택: 1명'}
          </span>
        </div>
      </div>
    </div>
  );
}
