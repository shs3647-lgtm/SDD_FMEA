/**
 * @file ImportPreviewGrid.tsx
 * @description Excel Import 미리보기 그리드
 * @author AI Assistant
 * @created 2025-12-26
 * 
 * 기능:
 * - Import된 데이터 미리보기
 * - 인라인 수정
 * - 개별/전체 삭제
 * - 드래그앤드랍 순서 변경
 * - 새 항목 추가
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Edit2, 
  GripVertical,
  Check,
  AlertCircle
} from 'lucide-react';
import { ImportedFlatData, ITEM_CODE_LABELS } from './types';

interface ImportPreviewGridProps {
  data: ImportedFlatData[];
  onDataChange: (data: ImportedFlatData[]) => void;
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

// 탭 정의
const TABS = [
  { code: 'A1', label: '공정번호', color: 'blue' },
  { code: 'A2', label: '공정명', color: 'blue' },
  { code: 'A3', label: '공정기능', color: 'blue' },
  { code: 'A4', label: '제품특성', color: 'blue' },
  { code: 'A5', label: '고장형태', color: 'blue' },
  { code: 'A6', label: '검출관리', color: 'blue' },
  { code: 'B1', label: '작업요소', color: 'green' },
  { code: 'B2', label: '요소기능', color: 'green' },
  { code: 'B3', label: '공정특성', color: 'green' },
  { code: 'B4', label: '고장원인', color: 'green' },
  { code: 'B5', label: '예방관리', color: 'green' },
  { code: 'C1', label: '완제품', color: 'red' },
  { code: 'C2', label: '제품기능', color: 'red' },
  { code: 'C3', label: '요구사항', color: 'red' },
  { code: 'C4', label: '고장영향', color: 'red' },
];

export default function ImportPreviewGrid({
  data,
  onDataChange,
  selectedTab,
  onTabChange,
}: ImportPreviewGridProps) {
  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 현재 탭의 데이터 필터링
  const filteredData = data.filter(d => d.itemCode === selectedTab);

  // 편집 시작
  const handleEditStart = (item: ImportedFlatData) => {
    setEditingId(item.id);
    setEditValue(item.value);
  };

  // 편집 저장
  const handleEditSave = () => {
    if (!editingId) return;
    onDataChange(data.map(d => 
      d.id === editingId ? { ...d, value: editValue } : d
    ));
    setEditingId(null);
    setEditValue('');
  };

  // 편집 취소
  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  // 항목 삭제
  const handleDelete = (id: string) => {
    onDataChange(data.filter(d => d.id !== id));
    selectedItems.delete(id);
    setSelectedItems(new Set(selectedItems));
  };

  // 선택 항목 삭제
  const handleDeleteSelected = () => {
    onDataChange(data.filter(d => !selectedItems.has(d.id)));
    setSelectedItems(new Set());
  };

  // 전체 삭제
  const handleDeleteAll = () => {
    onDataChange(data.filter(d => d.itemCode !== selectedTab));
    setSelectedItems(new Set());
  };

  // 선택 토글
  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // 전체 선택
  const handleSelectAll = () => {
    if (selectedItems.size === filteredData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredData.map(d => d.id)));
    }
  };

  // 새 항목 추가
  const handleAddNew = () => {
    const newItem: ImportedFlatData = {
      id: `new-${Date.now()}`,
      processNo: filteredData[0]?.processNo || '',
      category: selectedTab.charAt(0) as 'A' | 'B' | 'C',
      itemCode: selectedTab,
      value: '',
      createdAt: new Date(),
    };
    onDataChange([...data, newItem]);
    setEditingId(newItem.id);
    setEditValue('');
  };

  // 드래그 시작
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFilteredData = [...filteredData];
    const [draggedItem] = newFilteredData.splice(draggedIndex, 1);
    newFilteredData.splice(index, 0, draggedItem);

    // 전체 데이터에서 순서 변경
    const otherData = data.filter(d => d.itemCode !== selectedTab);
    onDataChange([...otherData, ...newFilteredData]);
    setDraggedIndex(index);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // 탭 색상 가져오기
  const getTabColor = (tab: typeof TABS[number]) => {
    switch (tab.color) {
      case 'blue': return selectedTab === tab.code ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100';
      case 'green': return selectedTab === tab.code ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100';
      case 'red': return selectedTab === tab.code ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      {/* 탭 헤더 */}
      <div className="p-3 border-b overflow-x-auto">
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => {
            const count = data.filter(d => d.itemCode === tab.code).length;
            return (
              <button
                key={tab.code}
                onClick={() => onTabChange(tab.code)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${getTabColor(tab)}`}
              >
                {tab.code}
                {count > 0 && (
                  <Badge className="ml-1 text-[10px] px-1 py-0 bg-white/30">{count}</Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 툴바 */}
      <div className="p-3 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddNew}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            추가
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeleteSelected}
            disabled={selectedItems.size === 0}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            선택 삭제 ({selectedItems.size})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeleteAll}
            disabled={filteredData.length === 0}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            전체 삭제
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {ITEM_CODE_LABELS[selectedTab]} ({filteredData.length}개)
        </div>
      </div>

      {/* 데이터 그리드 */}
      <div className="max-h-[300px] overflow-y-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead className="sticky top-0">
            <tr>
              <th className="bg-[#00587a] text-white px-2 py-2 w-8" style={{ border: '1px solid #999' }}>
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredData.length && filteredData.length > 0}
                  onChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="bg-[#00587a] text-white px-2 py-2 w-8" style={{ border: '1px solid #999' }}></th>
              <th className="bg-[#00587a] text-white px-3 py-2 text-left w-24" style={{ border: '1px solid #999' }}>공정번호</th>
              <th className="bg-[#00587a] text-white px-3 py-2 text-left" style={{ border: '1px solid #999' }}>
                {ITEM_CODE_LABELS[selectedTab]}
              </th>
              <th className="bg-[#00587a] text-white px-2 py-2 w-20 text-center" style={{ border: '1px solid #999' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  데이터가 없습니다. Excel을 Import하거나 새 항목을 추가하세요.
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'
                  } ${draggedIndex === index ? 'opacity-50' : ''} hover:bg-yellow-50`}
                >
                  <td className="px-2 py-2 text-center" style={{ border: '1px solid #999' }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectToggle(item.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-2 py-2 cursor-move" style={{ border: '1px solid #999' }}>
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </td>
                  <td className="px-3 py-2 font-mono text-[#00587a] font-bold" style={{ border: '1px solid #999' }}>
                    {item.processNo}
                  </td>
                  <td className="px-3 py-2" style={{ border: '1px solid #999' }}>
                    {editingId === item.id ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                      />
                    ) : (
                      <span className="text-black">{item.value || <span className="text-gray-400 italic">값 입력...</span>}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center" style={{ border: '1px solid #999' }}>
                    {editingId === item.id ? (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={handleEditSave}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleEditStart(item)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 새 항목 추가 버튼 */}
      <div className="p-3 border-t">
        <button
          onClick={handleAddNew}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-[#00587a] hover:text-[#00587a] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          항목 추가하기
        </button>
      </div>
    </div>
  );
}

