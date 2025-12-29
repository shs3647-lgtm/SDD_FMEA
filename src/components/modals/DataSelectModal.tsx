/**
 * @file DataSelectModal.tsx
 * @description 공용 데이터 선택 모달 - 표준화된 형태
 * @version 4.0.0 - 표준화 적용
 * @updated 2025-12-29
 * 
 * 표준 레이아웃:
 * ┌───────────────────────────────────────────────────────────────┐
 * │ 📋 타이틀                                              [닫기]│
 * ├───────────────────────────────────────────────────────────────┤
 * │ [필터▼] 검색...                  │전체│해제│적용│삭제│        │
 * ├───────────────────────────────────────────────────────────────┤
 * │ + [카테고리▼] 새 항목 입력...                        [저장]  │
 * ├───────────────────────────────────────────────────────────────┤
 * │ ☑ 기본  Your Plant     ×  │ ☐ 기본  Ship to Plant          │
 * │ ☑ 기본  User               │ ☐ --  -                        │
 * ├───────────────────────────────────────────────────────────────┤
 * │                        ✓ 2개 선택                             │
 * └───────────────────────────────────────────────────────────────┘
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

export const ITEM_CODE_LABELS: Record<string, { label: string; category: string; level: 'L1' | 'L2' | 'L3' }> = {
  C1: { label: '구분', category: 'C', level: 'L1' },
  C2: { label: '완제품 기능', category: 'C', level: 'L1' },
  C3: { label: '요구사항', category: 'C', level: 'L1' },
  C4: { label: '고장영향', category: 'C', level: 'L1' },
  A3: { label: '공정 기능', category: 'A', level: 'L2' },
  FE1: { label: 'FE 구분', category: 'FE', level: 'L1' },
  FE2: { label: '고장영향(FE)', category: 'FE', level: 'L1' },
  FM1: { label: '고장형태(FM)', category: 'FM', level: 'L2' },
  FC1: { label: '고장원인(FC)', category: 'FC', level: 'L3' },
  A4: { label: '제품특성', category: 'A', level: 'L2' },
  A5: { label: '고장형태', category: 'A', level: 'L2' },
  A6: { label: '검출관리', category: 'A', level: 'L2' },
  SP: { label: '특별특성', category: 'S', level: 'L2' },
  B2: { label: '작업요소 기능', category: 'B', level: 'L3' },
  B3: { label: '공정특성', category: 'B', level: 'L3' },
  B4: { label: '고장원인', category: 'B', level: 'L3' },
  B5: { label: '예방관리', category: 'B', level: 'L3' },
  S1: { label: '심각도', category: 'S', level: 'L1' },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  '기본': { bg: '#e8f5e9', text: '#2e7d32' },
  '추가': { bg: '#fff3e0', text: '#e65100' },
  '워크시트': { bg: '#ffebee', text: '#c62828' },
};

export interface DataItem {
  id: string;
  value: string;
  category?: string;
  belongsTo?: string;
  processNo?: string;
}

interface DataSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedValues: string[]) => void;
  onDelete?: (deletedValues: string[]) => void;
  title: string;
  itemCode: string;
  currentValues: string[];
  processNo?: string;
  processName?: string;
  workElementName?: string;
  parentTypeName?: string;    // 구분 (Your Plant / Ship to Plant / User)
  parentFunction?: string;
  parentCategory?: string;
  parentReqName?: string;     // 상위 요구사항
  parentFunctions?: string[]; // 상위 기능 목록 (요구사항 선택 시)
  processList?: { id: string; no: string; name: string }[];
  onProcessChange?: (processId: string) => void;
  singleSelect?: boolean;
}

// 기본 옵션 정의
const DEFAULT_ITEMS: Record<string, DataItem[]> = {
  C1: [
    { id: 'C1_1', value: 'Your Plant', category: '기본', belongsTo: 'Your Plant' },
    { id: 'C1_2', value: 'Ship to Plant', category: '기본', belongsTo: 'Ship to Plant' },
    { id: 'C1_3', value: 'User', category: '기본', belongsTo: 'User' },
  ],
  C3: [
    { id: 'C3_1', value: '재료 규격 ±0.5mm 이내', category: '기본', belongsTo: 'Your Plant' },
    { id: 'C3_2', value: '배합비 오차 ±2% 이내', category: '기본', belongsTo: 'Your Plant' },
    { id: 'C3_3', value: '공정 온도 180±5℃', category: '기본', belongsTo: 'Your Plant' },
    { id: 'C3_5', value: '외경 치수 Ø50±0.1mm', category: '기본', belongsTo: 'Ship to Plant' },
    { id: 'C3_6', value: '표면 조도 Ra 1.6 이하', category: '기본', belongsTo: 'Ship to Plant' },
    { id: 'C3_8', value: '내구 수명 10만km 이상', category: '기본', belongsTo: 'User' },
    { id: 'C3_9', value: '안전 하중 500kgf 이상', category: '기본', belongsTo: 'User' },
  ],
  C2: [
    { id: 'C2_1', value: '규격에 맞는 재료를 투입한다', category: '기본', belongsTo: 'Your Plant' },
    { id: 'C2_2', value: '일관된 배합 품질을 유지한다', category: '기본', belongsTo: 'Your Plant' },
    { id: 'C2_4', value: '차량에 장착 가능한 형상을 제공한다', category: '기본', belongsTo: 'Ship to Plant' },
    { id: 'C2_5', value: '규격 치수를 유지한다', category: '기본', belongsTo: 'Ship to Plant' },
    { id: 'C2_7', value: '주행 중 안전성을 확보한다', category: '기본', belongsTo: 'User' },
    { id: 'C2_8', value: '동력을 전달한다', category: '기본', belongsTo: 'User' },
  ],
  SP: [
    { id: 'SP_1', value: 'CC (중요 특성)', category: '기본' },
    { id: 'SP_2', value: 'SC (안전 특성)', category: '기본' },
    { id: 'SP_3', value: 'HC (중점 관리)', category: '기본' },
    { id: 'SP_4', value: '-', category: '기본' },
  ],
  FE1: [
    { id: 'FE1_1', value: 'Your Plant', category: '기본', belongsTo: 'Your Plant' },
    { id: 'FE1_2', value: 'Ship to Plant', category: '기본', belongsTo: 'Ship to Plant' },
    { id: 'FE1_3', value: 'User', category: '기본', belongsTo: 'User' },
  ],
  FE2: [
    { id: 'FE2_1', value: '생산 지연', category: '기본', belongsTo: 'Your Plant' },
    { id: 'FE2_2', value: '재작업/폐기', category: '기본', belongsTo: 'Your Plant' },
    { id: 'FE2_4', value: '조립 불가', category: '기본', belongsTo: 'Ship to Plant' },
    { id: 'FE2_5', value: '라인 정지', category: '기본', belongsTo: 'Ship to Plant' },
    { id: 'FE2_7', value: '차량 정지 (안전)', category: '기본', belongsTo: 'User' },
    { id: 'FE2_8', value: '기능 작동 불능', category: '기본', belongsTo: 'User' },
  ],
  FM1: [
    { id: 'FM1_1', value: '규격 미달', category: '기본' },
    { id: 'FM1_2', value: '규격 초과', category: '기본' },
    { id: 'FM1_3', value: '변형', category: '기본' },
    { id: 'FM1_4', value: '파손', category: '기본' },
    { id: 'FM1_5', value: '누락', category: '기본' },
    { id: 'FM1_6', value: '오염', category: '기본' },
  ],
  FC1: [
    { id: 'FC1_1', value: '작업자 실수', category: '기본', belongsTo: 'MN' },
    { id: 'FC1_2', value: '교육 미흡', category: '기본', belongsTo: 'MN' },
    { id: 'FC1_4', value: '설비 마모', category: '기본', belongsTo: 'MC' },
    { id: 'FC1_5', value: '설비 고장', category: '기본', belongsTo: 'MC' },
    { id: 'FC1_7', value: '원자재 불량', category: '기본', belongsTo: 'IM' },
    { id: 'FC1_9', value: '온도 부적합', category: '기본', belongsTo: 'EN' },
  ],
};

export default function DataSelectModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  title,
  itemCode,
  currentValues,
  processNo,
  processName,
  workElementName,
  parentCategory,
  parentTypeName,
  parentFunction,
  parentReqName,
  parentFunctions = [],
  singleSelect = false,
}: DataSelectModalProps) {
  const [items, setItems] = useState<DataItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedFunction, setSelectedFunction] = useState(parentFunction || '');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('추가');
  
  // 더블클릭 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const itemInfo = ITEM_CODE_LABELS[itemCode] || { label: itemCode, category: 'A', level: 'L1' };
  const hasBelongsToFilter = ['C1', 'C2', 'C3', 'FE1', 'FE2'].includes(itemCode);
  const needsFunctionSelect = itemCode === 'C3' && parentFunctions.length > 0; // 요구사항 선택 시 기능 필요

  // 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    let allItems: DataItem[] = [];
    
    // 기본 옵션 로드
    if (DEFAULT_ITEMS[itemCode]) {
      allItems = [...DEFAULT_ITEMS[itemCode]];
    }
    
    // localStorage에서 추가 데이터 로드
    try {
      const savedData = localStorage.getItem('pfmea_master_data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        let filteredData = parsedData.filter((item: any) => item.itemCode === itemCode);
        if (processNo) filteredData = filteredData.filter((item: any) => item.processNo === processNo);
        
        filteredData.forEach((item: any, idx: number) => {
          if (item.value && item.value.trim()) {
            const value = item.value.trim();
            if (!allItems.find(i => i.value === value)) {
              allItems.push({
                id: `${itemCode}_added_${idx}`,
                value,
                category: '추가',
                processNo: item.processNo,
              });
            }
          }
        });
      }
    } catch (e) {
      console.error('데이터 로드 오류:', e);
    }
    
    // 현재 워크시트에 있는 값
    currentValues.forEach((val, idx) => {
      if (val && val.trim() && !allItems.find(i => i.value === val)) {
        allItems.push({
          id: `${itemCode}_current_${idx}`,
          value: val,
          category: '워크시트',
        });
      }
    });
    
    setItems(allItems);
    setSearch('');
    setCategoryFilter('All');
  }, [isOpen, itemCode, processNo, currentValues]);

  // 선택 상태 초기화
  useEffect(() => {
    if (items.length > 0 && currentValues.length > 0) {
      const newSelectedIds = new Set<string>();
      currentValues.forEach(val => {
        const found = items.find(item => item.value === val);
        if (found) newSelectedIds.add(found.id);
      });
      setSelectedIds(newSelectedIds);
    } else {
      setSelectedIds(new Set());
    }
  }, [items, currentValues]);

  // 필터링
  const filteredItems = useMemo(() => {
    let result = items;
    
    if (parentCategory) {
      result = result.filter(i => i.belongsTo === parentCategory || !i.belongsTo);
    }
    
    if (hasBelongsToFilter && categoryFilter !== 'All') {
      result = result.filter(i => i.belongsTo === categoryFilter || !i.belongsTo);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => item.value.toLowerCase().includes(q));
    }
    
    return result;
  }, [items, categoryFilter, search, parentCategory, hasBelongsToFilter]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else {
        if (singleSelect) newSet.clear();
        newSet.add(id);
      }
      return newSet;
    });
  }, [singleSelect]);

  // 더블클릭 편집 시작
  const handleDoubleClick = useCallback((item: DataItem) => {
    setEditingId(item.id);
    setEditingValue(item.value);
  }, []);

  // 편집 저장
  const handleEditSave = useCallback(() => {
    if (!editingId || !editingValue.trim()) {
      setEditingId(null);
      setEditingValue('');
      return;
    }
    
    const trimmed = editingValue.trim();
    const oldItem = items.find(i => i.id === editingId);
    if (!oldItem) return;
    
    // 중복 체크 (자기 자신 제외)
    if (items.some(i => i.id !== editingId && i.value === trimmed)) {
      alert('이미 존재하는 항목입니다.');
      return;
    }
    
    // 아이템 업데이트
    setItems(prev => prev.map(item => 
      item.id === editingId ? { ...item, value: trimmed } : item
    ));
    
    // localStorage 업데이트
    try {
      const savedData = localStorage.getItem('pfmea_master_data');
      const dataList = savedData ? JSON.parse(savedData) : [];
      const existingIdx = dataList.findIndex((d: any) => d.itemCode === itemCode && d.value === oldItem.value);
      if (existingIdx >= 0) {
        dataList[existingIdx].value = trimmed;
        dataList[existingIdx].updatedAt = new Date().toISOString();
      }
      localStorage.setItem('pfmea_master_data', JSON.stringify(dataList));
    } catch (e) {
      console.error('편집 저장 오류:', e);
    }
    
    setEditingId(null);
    setEditingValue('');
  }, [editingId, editingValue, items, itemCode]);

  // 편집 취소 (ESC)
  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
  }, []);

  const selectAll = () => setSelectedIds(new Set(filteredItems.map(i => i.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleApply = () => {
    const selectedValues = items.filter(item => selectedIds.has(item.id)).map(item => item.value);
    onSave(selectedValues);
    onClose();
  };

  const handleDeleteAll = () => {
    if (!confirm(`모든 선택 항목을 삭제하시겠습니까?`)) return;
    if (onDelete) {
      onDelete(currentValues);
    }
    onClose();
  };

  const handleAddSave = () => {
    if (!newValue.trim()) return;
    const trimmedValue = newValue.trim();
    
    if (items.some(i => i.value === trimmedValue)) {
      alert('이미 존재하는 항목입니다.');
      return;
    }
    
    const newItem: DataItem = { id: `new_${Date.now()}`, value: trimmedValue, category: '추가' };
    setItems(prev => [...prev, newItem]);
    setSelectedIds(prev => new Set([...prev, newItem.id]));
    
    // localStorage에 저장
    try {
      const savedData = localStorage.getItem('pfmea_master_data');
      const masterData = savedData ? JSON.parse(savedData) : [];
      masterData.push({ 
        id: newItem.id, 
        itemCode, 
        value: trimmedValue, 
        category: '추가',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('pfmea_master_data', JSON.stringify(masterData));
    } catch (e) {
      console.error('데이터 저장 오류:', e);
    }
    
    setNewValue('');
  };

  const handleDeleteSingle = (item: DataItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(item.id);
      return newSet;
    });
  };

  const isCurrentlySelected = (value: string) => currentValues.includes(value);
  const minRows = 10;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-[600px] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '70vh' }}
      >
        {/* ===== 헤더: 제목 + 닫기 ===== */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <h2 className="text-xs font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">닫기</button>
        </div>

        {/* ===== 상위 항목 고정 표시 (명확한 라벨 포함) ===== */}
        {(processName || workElementName || parentCategory || parentFunction || parentReqName || parentTypeName) && (
          <div className="px-3 py-2 border-b bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[11px] font-bold text-amber-700">📌 상위항목 (자동연결)</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {processName && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500">공정:</span>
                  <span className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded">
                    {processName}
                  </span>
                </div>
              )}
              {workElementName && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500">작업요소:</span>
                  <span className="px-2 py-1 text-[10px] font-bold bg-purple-600 text-white rounded">
                    {workElementName}
                  </span>
                </div>
              )}
              {parentTypeName && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500">구분:</span>
                  <span className="px-2 py-1 text-[10px] font-bold bg-teal-600 text-white rounded">
                    {parentTypeName}
                  </span>
                </div>
              )}
              {parentCategory && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500">분류:</span>
                  <span className="px-2 py-1 text-[10px] font-bold bg-orange-600 text-white rounded">
                    {parentCategory}
                  </span>
                </div>
              )}
              {parentFunction && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500">기능:</span>
                  <span className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded max-w-[250px] truncate" title={parentFunction}>
                    {parentFunction}
                  </span>
                </div>
              )}
              {parentReqName && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500">요구사항:</span>
                  <span className="px-2 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded max-w-[250px] truncate" title={parentReqName}>
                    {parentReqName}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 검색/입력 통합 + 버튼: 엔터=추가, [전체][해제][적용][삭제] ===== */}
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
          {/* 검색/입력 통합 (엔터 치면 추가) */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                // 검색값이 목록에 없으면 추가
                const trimmed = search.trim();
                const exists = items.some(i => i.value === trimmed);
                if (!exists) {
                  // 새 항목 추가
                  const newItem: DataItem = { id: `new_${Date.now()}`, value: trimmed, category: '추가' };
                  setItems(prev => [...prev, newItem]);
                  setSelectedIds(prev => new Set([...prev, newItem.id]));
                  // localStorage에 저장
                  try {
                    const savedData = localStorage.getItem('pfmea_master_data');
                    const dataList = savedData ? JSON.parse(savedData) : [];
                    dataList.push({ itemCode, value: trimmed, category: '추가', createdAt: new Date().toISOString() });
                    localStorage.setItem('pfmea_master_data', JSON.stringify(dataList));
                  } catch (err) { console.error(err); }
                  setSearch('');
                } else {
                  // 이미 있으면 선택
                  const found = items.find(i => i.value === trimmed);
                  if (found) {
                    setSelectedIds(prev => new Set([...prev, found.id]));
                  }
                  setSearch('');
                }
              }
            }}
            placeholder={`🔍 ${itemInfo.label} 검색 또는 입력 후 Enter...`}
            className="flex-1 px-2 py-1 text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {/* 버튼들 */}
          <button onClick={selectAll} className="px-2 py-1 text-[10px] font-bold bg-blue-500 text-white rounded hover:bg-blue-600">전체</button>
          <button onClick={deselectAll} className="px-2 py-1 text-[10px] font-bold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">해제</button>
          <button onClick={handleApply} className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700">적용</button>
          <button onClick={handleDeleteAll} className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded hover:bg-red-600">삭제</button>
        </div>

        {/* ===== 리스트 (고정 높이, 2열 그리드) ===== */}
        <div className="overflow-auto p-2" style={{ height: '280px', minHeight: '280px' }}>
          <div className="grid grid-cols-2 gap-1">
            {filteredItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              const isCurrent = isCurrentlySelected(item.value);
              const catColor = CATEGORY_COLORS[item.category || '기본'] || CATEGORY_COLORS['기본'];
              const isEditing = editingId === item.id;
              
              return (
                <div
                  key={item.id}
                  onClick={() => !isEditing && toggleSelect(item.id)}
                  onDoubleClick={() => handleDoubleClick(item)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                    isEditing
                      ? 'bg-yellow-50 border-yellow-400'
                      : isSelected 
                        ? isCurrent ? 'bg-green-50 border-green-400' : 'bg-blue-50 border-blue-400'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                  title="더블클릭으로 수정"
                >
                  {/* 체크박스 */}
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected 
                      ? isCurrent ? 'bg-green-500 border-green-500' : 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}>
                    {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>

                  {/* 카테고리 배지 */}
                  <span 
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: catColor.bg, color: catColor.text }}
                  >
                    {item.category || '기본'}
                  </span>

                  {/* 이름 또는 편집 입력 */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave();
                        if (e.key === 'Escape') handleEditCancel();
                      }}
                      onBlur={handleEditSave}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="flex-1 text-[10px] px-1 py-0.5 border border-yellow-400 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 bg-white"
                    />
                  ) : (
                    <span className={`flex-1 text-[10px] truncate ${
                      isSelected ? (isCurrent ? 'text-green-800 font-medium' : 'text-blue-800 font-medium') : 'text-gray-700'
                    }`}>
                      {item.value}
                      {isCurrent && <span className="ml-1 text-[8px] text-green-600">(현재)</span>}
                    </span>
                  )}

                  {/* 삭제 버튼 */}
                  {isSelected && !isEditing && (
                    <button
                      onClick={(e) => handleDeleteSingle(item, e)}
                      className="text-red-400 hover:text-red-600 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            {/* 빈 행 채우기 */}
            {Array.from({ length: Math.max(0, minRows - filteredItems.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded border border-gray-100 bg-gray-50/50"
              >
                <div className="w-4 h-4 rounded border border-gray-200 bg-white shrink-0" />
                <span className="text-[9px] text-gray-300">--</span>
                <span className="flex-1 text-[10px] text-gray-300">-</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 푸터: 선택 개수 표시 ===== */}
        <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-600">✓ {selectedIds.size}개 선택</span>
        </div>
      </div>
    </div>
  );
}
