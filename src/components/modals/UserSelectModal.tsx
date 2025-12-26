/**
 * 사용자 선택 모달
 * CFT/승인권자 등록 시 사용자 선택
 * @ref C:\01_Next_FMEA\app\fmea\components\UserInfoSelectionModal.tsx
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UserInfo } from '@/types/user';
import { getAllUsers, createSampleUsers } from '@/lib/user-db';

interface UserSelectModalProps {
  isOpen: boolean;
  onSelect: (user: UserInfo) => void;
  onClose: () => void;
}

export function UserSelectModal({
  isOpen,
  onSelect,
  onClose
}: UserSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserInfo[]>([]);

  // 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    // 샘플 데이터 생성 (없으면)
    createSampleUsers();

    const loadedUsers = getAllUsers();
    setUsers(loadedUsers);
  }, [isOpen]);

  // 검색 필터링
  const filteredUsers = users.filter(user =>
    user.name.includes(searchTerm) ||
    user.department.includes(searchTerm) ||
    user.factory.includes(searchTerm) ||
    user.email.includes(searchTerm)
  );

  // 모달 닫기 시 검색어 초기화
  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

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
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-[900px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            👤 사용자 선택
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-2xl text-gray-500 hover:bg-gray-100 rounded"
          >
            ✕
          </button>
        </div>

        {/* 검색 */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="🔍 검색 (성명/부서/공장/이메일)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-y-auto px-5">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              사용자가 없습니다.
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#00587a] text-white">
                <tr>
                  <th className="border border-white px-3 py-2 text-center align-middle text-xs font-semibold w-20">공장</th>
                  <th className="border border-white px-3 py-2 text-center align-middle text-xs font-semibold w-24">부서</th>
                  <th className="border border-white px-3 py-2 text-center align-middle text-xs font-semibold w-20">성명</th>
                  <th className="border border-white px-3 py-2 text-center align-middle text-xs font-semibold w-16">직급</th>
                  <th className="border border-white px-3 py-2 text-center align-middle text-xs font-semibold w-28">전화번호</th>
                  <th className="border border-white px-3 py-2 text-center align-middle text-xs font-semibold">이메일</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className={`cursor-pointer hover:bg-blue-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="border border-gray-300 px-3 py-2 text-center align-middle text-xs">{user.factory}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center align-middle text-xs">{user.department}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center align-middle text-xs font-semibold">{user.name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center align-middle text-xs">{user.position || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center align-middle text-xs">{user.phone || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-left align-middle text-xs">{user.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            총 {filteredUsers.length}명
          </span>
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

