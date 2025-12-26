/**
 * 기초정보 선택 모달 (통합 버전)
 * 고객명, 코드, 공장, 모델년도, 프로그램, 품명, 품번을 한 세트로 표시
 * @ref C:\01_Next_FMEA\app\fmea\components\modals\BizInfoSelectModal.tsx
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BizInfoProject } from '@/types/bizinfo';
import { getAllProjects, createSampleProjects } from '@/lib/bizinfo-db';

interface BizInfoSelectModalProps {
  isOpen: boolean;
  onSelect: (project: BizInfoProject) => void;
  onClose: () => void;
}

export function BizInfoSelectModal({
  isOpen,
  onSelect,
  onClose
}: BizInfoSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<BizInfoProject[]>([]);

  // 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    // 샘플 데이터 생성 (없으면)
    createSampleProjects();

    const loadedProjects = getAllProjects();
    setProjects(loadedProjects);
  }, [isOpen]);

  // 검색 필터링
  const filteredProjects = projects.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.customerName.toLowerCase().includes(searchLower) ||
      p.customerCode.toLowerCase().includes(searchLower) ||
      p.factory.toLowerCase().includes(searchLower) ||
      p.productName.toLowerCase().includes(searchLower) ||
      p.partNo.toLowerCase().includes(searchLower) ||
      p.program.toLowerCase().includes(searchLower)
    );
  });

  // 모달 닫기 시 검색어 초기화
  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (project: BizInfoProject) => {
    onSelect(project);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-[95%] max-w-[1100px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            📂 기초정보 선택
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
            placeholder="🔍 검색 (고객명, 코드, 공장, 품명, 품번, 프로그램)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
        </div>

        {/* 안내 메시지 */}
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-200">
          <p className="text-xs text-amber-700">
            💡 원하는 행을 클릭하면 고객/공장/모델년도/프로그램/품명/품번이 한번에 입력됩니다.
          </p>
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              데이터가 없습니다.
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#00587a] text-white">
                <tr>
                  <th className="border border-white px-2 py-2 text-center align-middle text-xs font-semibold w-10">NO</th>
                  <th className="border border-white px-2 py-2 text-center align-middle text-xs font-semibold">고객명</th>
                  <th className="border border-white px-2 py-2 text-center align-middle text-xs font-semibold w-16">코드</th>
                  <th className="border border-white px-2 py-2 text-center align-middle text-xs font-semibold">공장</th>
                  <th className="border border-white px-2 py-2 text-center align-middle text-xs font-semibold">Model Year</th>
                  <th className="border border-white px-2 py-2 text-center align-middle text-xs font-semibold">프로그램</th>
                  <th className="border border-white px-2 py-2 text-center align-middle text-xs font-semibold">품명</th>
                  <th className="border border-white px-2 py-2 text-center align-middle text-xs font-semibold">품번</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    onClick={() => handleSelect(project)}
                    className={`cursor-pointer hover:bg-blue-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-xs">{index + 1}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-xs font-medium">{project.customerName}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-xs text-blue-600 font-semibold">{project.customerCode}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-xs">{project.factory}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-xs">{project.modelYear}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-xs">{project.program}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-xs font-medium">{project.productName}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-middle text-xs text-gray-600">{project.partNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            총 {filteredProjects.length}개 항목
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
