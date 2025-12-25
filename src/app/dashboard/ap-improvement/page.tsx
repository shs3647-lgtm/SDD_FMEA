/**
 * @file page.tsx
 * @description AP 개선관리 메인 페이지
 * @author AI Assistant
 * @created 2025-12-26
 * @modularized types.ts, mock-data.ts, utils.ts, APModal.tsx
 * 
 * 코드 분리:
 * - types.ts: 타입 정의 (45행)
 * - mock-data.ts: 목업 데이터 (95행)
 * - utils.ts: 유틸리티 함수 (75행)
 * - APModal.tsx: 모달 컴포넌트 (190행)
 * - page.tsx: 메인 페이지 (본 파일, ~250행)
 */

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Download, Edit2, Trash2 } from 'lucide-react';

// 모듈화된 파일 import
import { APItem } from './types';
import { mockAPData } from './mock-data';
import { getAPBadgeClass, getStatusBadgeClass, calculateStats, filterAPData } from './utils';
import APModal from './APModal';

/**
 * AP 개선관리 페이지
 */
export default function APImprovementPage() {
  // 상태 관리
  const [data, setData] = useState<APItem[]>(mockAPData);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAP, setFilterAP] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<APItem | null>(null);

  // 필터링된 데이터 및 통계
  const filteredData = filterAPData(data, filterStatus, filterAP, searchTerm);
  const stats = calculateStats(data);

  // 모달 열기 (신규/수정)
  const openModal = (item?: APItem) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  // 삭제
  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00587a]">AP 개선관리</h1>
        <p className="text-gray-600 mt-1">Action Priority 기반 개선조치 현황 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-7 gap-4 mb-6">
        <StatCard label="전체" value={stats.total} color="#00587a" />
        <StatCard label="High" value={stats.high} color="#dc2626" border="red-200" />
        <StatCard label="Medium" value={stats.medium} color="#ca8a04" border="yellow-200" />
        <StatCard label="Low" value={stats.low} color="#16a34a" border="green-200" />
        <StatCard label="대기" value={stats.pending} color="#6b7280" />
        <StatCard label="진행중" value={stats.inProgress} color="#f97316" border="orange-200" />
        <StatCard label="완료" value={stats.completed} color="#2563eb" border="blue-200" />
      </div>

      {/* 액션 바 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="고장모드, 원인, 담당자 검색..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* AP 필터 */}
            <Select value={filterAP} onValueChange={setFilterAP}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="AP 등급" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 AP</SelectItem>
                <SelectItem value="H">High</SelectItem>
                <SelectItem value="M">Medium</SelectItem>
                <SelectItem value="L">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* 상태 필터 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="대기">대기</SelectItem>
                <SelectItem value="진행중">진행중</SelectItem>
                <SelectItem value="완료">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Excel 다운로드
            </Button>
            <Button
              size="sm"
              className="bg-[#00587a] hover:bg-[#004560]"
              onClick={() => openModal()}
            >
              <Plus className="h-4 w-4 mr-2" />
              신규 등록
            </Button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#00587a] text-white">
                {['No', 'AP5', 'AP6', '특별특성', 'S', 'Failure Mode', 'Failure Cause', 'O', 'D', 'Prevention', 'Detection', '담당자', '상태', '완료예정', '작업'].map((h, i) => (
                  <th key={i} className="border border-gray-400 px-3 py-3 text-center text-sm font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}>
                  <td className="border border-gray-300 px-3 py-2 text-center bg-[#00587a] text-white font-semibold">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <Badge className={getAPBadgeClass(item.ap5)}>{item.ap5}</Badge>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <Badge className={getAPBadgeClass(item.ap6)}>{item.ap6}</Badge>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {item.specialChar && <Badge variant="outline">{item.specialChar}</Badge>}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-medium">{item.severity}</td>
                  <td className="border border-gray-300 px-3 py-2 text-left text-sm min-w-[180px]">{item.failureMode}</td>
                  <td className="border border-gray-300 px-3 py-2 text-left text-sm min-w-[180px]">{item.failureCause}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-medium">{item.occurrence}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-medium">{item.detection}</td>
                  <td className="border border-gray-300 px-3 py-2 text-left text-sm min-w-[140px]">{item.preventionAction}</td>
                  <td className="border border-gray-300 px-3 py-2 text-left text-sm min-w-[140px]">{item.detectionAction}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{item.responsible}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <Badge className={getStatusBadgeClass(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm whitespace-nowrap">{item.dueDate}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openModal(item)}>
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 결과 없음 */}
        {filteredData.length === 0 && (
          <div className="p-8 text-center text-gray-500">조건에 맞는 데이터가 없습니다.</div>
        )}
      </div>

      {/* 등록/수정 모달 */}
      <APModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
      />
    </div>
  );
}

/** 통계 카드 컴포넌트 */
function StatCard({ label, value, color, border }: { label: string; value: number; color: string; border?: string }) {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${border ? `border-${border}` : ''}`}>
      <div className="text-sm" style={{ color }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
