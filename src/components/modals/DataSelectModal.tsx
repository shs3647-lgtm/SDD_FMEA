/**
 * @file DataSelectModal.tsx
 * @description 공용 데이터 선택 모달 - WorkElementSelectModal과 동일한 구조
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';

export const ITEM_CODE_LABELS: Record<string, { label: string; category: string; level: 'L1' | 'L2' | 'L3' }> = {
  // 기능분석
  C1: { label: '구분', category: 'C', level: 'L1' },
  C2: { label: '완제품 기능', category: 'C', level: 'L1' },
  C3: { label: '요구사항', category: 'C', level: 'L1' },
  C4: { label: '고장영향', category: 'C', level: 'L1' },
  A3: { label: '공정 기능', category: 'A', level: 'L2' },
  // 고장분석
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

// 카테고리별 색상
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '기본': { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  '추가': { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
  '워크시트': { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' }, // 정리 대상 (빨간색)
};

export interface DataItem {
  id: string;
  value: string;
  category?: string; // '기본' | '추가'
  belongsTo?: string; // 'Your Plant' | 'Ship to Plant' | 'User' | 'All'
  processNo?: string;
}

interface DataSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedValues: string[]) => void;
  onDelete?: (deletedValues: string[]) => void; // 워크시트 데이터 삭제 콜백
  title: string;
  itemCode: string;
  currentValues: string[];
  processNo?: string;
  processName?: string; // 현재 공정명 표시용
  workElementName?: string; // 현재 작업요소명 표시용
  parentFunction?: string; // 상위 기능명 표시용 (요구사항 선택 시)
  parentCategory?: string; // 상위 구분 (Your Plant, Ship to Plant, User) - 필터링용
  processList?: { id: string; no: string; name: string }[]; // 공정 목록 (드롭다운용)
  onProcessChange?: (processId: string) => void; // 공정 변경 콜백
  singleSelect?: boolean;
}

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
  parentFunction,
  parentCategory,
  processList,
  onProcessChange,
  singleSelect = false,
}: DataSelectModalProps) {
  const [items, setItems] = useState<DataItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newValue, setNewValue] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [filterType, setFilterType] = useState<'all' | 'default' | 'added' | 'worksheet'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const itemInfo = ITEM_CODE_LABELS[itemCode] || { label: itemCode, category: 'A', level: 'L1' };

  // 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    const loadData = () => {
      try {
        let allItems: DataItem[] = [];
        
        // 기본 옵션 정의
        const defaultItems: Record<string, DataItem[]> = {
          C1: [
            { id: 'C1_1', value: 'Your Plant', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C1_2', value: 'Ship to Plant', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C1_3', value: 'User', category: '기본', belongsTo: 'User' },
          ],
          // ★ C3: 요구사항 (명사형 - ~조건, ~기준, ~사양)
          C3: [
            // Your Plant 관련 요구사항
            { id: 'C3_1', value: '재료 규격 ±0.5mm 이내', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C3_2', value: '배합비 오차 ±2% 이내', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C3_3', value: '공정 온도 180±5℃', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C3_4', value: '공정 압력 10±1 bar', category: '기본', belongsTo: 'Your Plant' },
            // Ship to Plant 관련 요구사항
            { id: 'C3_5', value: '외경 치수 Ø50±0.1mm', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C3_6', value: '표면 조도 Ra 1.6 이하', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C3_7', value: '포장 규격 500x300x200mm', category: '기본', belongsTo: 'Ship to Plant' },
            // User 관련 요구사항
            { id: 'C3_8', value: '내구 수명 10만km 이상', category: '기본', belongsTo: 'User' },
            { id: 'C3_9', value: '안전 하중 500kgf 이상', category: '기본', belongsTo: 'User' },
            { id: 'C3_10', value: '소음 레벨 60dB 이하', category: '기본', belongsTo: 'User' },
          ],
          // ★ C2: 완제품 기능 (동사형 - ~한다, ~수행한다)
          C2: [
            // Your Plant 관련 기능
            { id: 'C2_1', value: '규격에 맞는 재료를 투입한다', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C2_2', value: '일관된 배합 품질을 유지한다', category: '기본', belongsTo: 'Your Plant' },
            { id: 'C2_3', value: '공정 품질을 관리한다', category: '기본', belongsTo: 'Your Plant' },
            // Ship to Plant 관련 기능
            { id: 'C2_4', value: '차량에 장착 가능한 형상을 제공한다', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C2_5', value: '규격 치수를 유지한다', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'C2_6', value: '외관 품질을 확보한다', category: '기본', belongsTo: 'Ship to Plant' },
            // User 관련 기능
            { id: 'C2_7', value: '주행 중 안전성을 확보한다', category: '기본', belongsTo: 'User' },
            { id: 'C2_8', value: '동력을 전달한다', category: '기본', belongsTo: 'User' },
            { id: 'C2_9', value: '진동을 흡수한다', category: '기본', belongsTo: 'User' },
            { id: 'C2_10', value: '승차감을 제공한다', category: '기본', belongsTo: 'User' },
          ],
          C4: [
            { id: 'C4_1', value: '차량 정지 (안전 관련)', category: '기본' },
            { id: 'C4_2', value: '차량 주요기능 작동 불능', category: '기본' },
            { id: 'C4_3', value: '차량 성능 저하', category: '기본' },
            { id: 'C4_4', value: '외관 불량', category: '기본' },
            { id: 'C4_5', value: '이음 발생', category: '기본' },
          ],
          S1: Array.from({ length: 10 }, (_, i) => ({
            id: `S1_${i + 1}`,
            value: (10 - i).toString(),
            category: '기본'
          })),
          SP: [
            { id: 'SP_1', value: 'CC (중요 특성)', category: '기본' },
            { id: 'SP_2', value: 'SC (안전 특성)', category: '기본' },
            { id: 'SP_3', value: 'HC (중점 관리)', category: '기본' },
            { id: 'SP_4', value: '-', category: '기본' },
          ],
          // 고장분석 기본 옵션
          FE1: [
            { id: 'FE1_1', value: 'Your Plant', category: '기본', belongsTo: 'Your Plant' },
            { id: 'FE1_2', value: 'Ship to Plant', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'FE1_3', value: 'User', category: '기본', belongsTo: 'User' },
          ],
          FE2: [
            // Your Plant 관련
            { id: 'FE2_1', value: '생산 지연', category: '기본', belongsTo: 'Your Plant' },
            { id: 'FE2_2', value: '재작업/폐기', category: '기본', belongsTo: 'Your Plant' },
            { id: 'FE2_3', value: '공정 정지', category: '기본', belongsTo: 'Your Plant' },
            // Ship to Plant 관련
            { id: 'FE2_4', value: '조립 불가', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'FE2_5', value: '라인 정지', category: '기본', belongsTo: 'Ship to Plant' },
            { id: 'FE2_6', value: '외관 불량', category: '기본', belongsTo: 'Ship to Plant' },
            // User 관련
            { id: 'FE2_7', value: '차량 정지 (안전)', category: '기본', belongsTo: 'User' },
            { id: 'FE2_8', value: '기능 작동 불능', category: '기본', belongsTo: 'User' },
            { id: 'FE2_9', value: '성능 저하', category: '기본', belongsTo: 'User' },
            { id: 'FE2_10', value: '소음/진동 발생', category: '기본', belongsTo: 'User' },
          ],
          FM1: [
            { id: 'FM1_1', value: '규격 미달', category: '기본' },
            { id: 'FM1_2', value: '규격 초과', category: '기본' },
            { id: 'FM1_3', value: '변형', category: '기본' },
            { id: 'FM1_4', value: '파손', category: '기본' },
            { id: 'FM1_5', value: '누락', category: '기본' },
            { id: 'FM1_6', value: '오염', category: '기본' },
            { id: 'FM1_7', value: '기능 불량', category: '기본' },
            { id: 'FM1_8', value: '외관 불량', category: '기본' },
          ],
          FC1: [
            // 사람(MN) 관련
            { id: 'FC1_1', value: '작업자 실수', category: '기본', belongsTo: 'MN' },
            { id: 'FC1_2', value: '교육 미흡', category: '기본', belongsTo: 'MN' },
            { id: 'FC1_3', value: '숙련도 부족', category: '기본', belongsTo: 'MN' },
            // 설비(MC) 관련
            { id: 'FC1_4', value: '설비 마모', category: '기본', belongsTo: 'MC' },
            { id: 'FC1_5', value: '설비 고장', category: '기본', belongsTo: 'MC' },
            { id: 'FC1_6', value: '정비 미흡', category: '기본', belongsTo: 'MC' },
            // 자재(IM) 관련
            { id: 'FC1_7', value: '원자재 불량', category: '기본', belongsTo: 'IM' },
            { id: 'FC1_8', value: '부자재 불량', category: '기본', belongsTo: 'IM' },
            // 환경(EN) 관련
            { id: 'FC1_9', value: '온도 부적합', category: '기본', belongsTo: 'EN' },
            { id: 'FC1_10', value: '습도 부적합', category: '기본', belongsTo: 'EN' },
            { id: 'FC1_11', value: '이물 혼입', category: '기본', belongsTo: 'EN' },
          ],
        };
        
        // 기본 옵션 추가
        if (defaultItems[itemCode]) {
          allItems = [...defaultItems[itemCode]];
        }
        
        // localStorage에서 추가 데이터 로드
        const savedData = localStorage.getItem('pfmea_master_data');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          let filteredData = parsedData.filter((item: any) => item.itemCode === itemCode);
          if (processNo) filteredData = filteredData.filter((item: any) => item.processNo === processNo);
          
          filteredData.forEach((item: any, idx: number) => {
            if (item.value && item.value.trim()) {
              const value = item.value.trim();
              // 중복 체크
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
        
        // 현재 워크시트에 있는 값들 - 기본 항목과 정확히 일치하지 않으면 '워크시트' 카테고리로 표시
        currentValues.forEach((val, idx) => {
          if (val && val.trim() && !allItems.find(i => i.value === val)) {
            allItems.push({
              id: `${itemCode}_current_${idx}`,
              value: val,
              category: '워크시트', // 워크시트에만 있는 항목 (정리 대상)
            });
          }
        });
        
        setItems(allItems);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      }
    };
    loadData();
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

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    let result = items;
    
    // ★ 상위 구분(parentCategory)이 있으면 해당 구분 항목만 표시
    if (parentCategory) {
      result = result.filter(i => i.belongsTo === parentCategory || !i.belongsTo);
    }
    
    // 카테고리 필터 (기본/추가/워크시트)
    if (filterType === 'default') result = result.filter(i => i.category === '기본');
    if (filterType === 'added') result = result.filter(i => i.category === '추가');
    if (filterType === 'worksheet') result = result.filter(i => i.category === '워크시트');
    
    // 구분 필터 (Your Plant / Ship to Plant / User) - parentCategory가 없을 때만 적용
    if (!parentCategory && categoryFilter !== 'All') {
      result = result.filter(i => i.belongsTo === categoryFilter || !i.belongsTo);
    }
    
    // 검색 필터
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => item.value.toLowerCase().includes(q));
    }
    
    return result;
  }, [items, filterType, search, categoryFilter, parentCategory]);

  const defaultCount = items.filter(i => i.category === '기본').length;
  const addedCount = items.filter(i => i.category === '추가').length;
  const worksheetCount = items.filter(i => i.category === '워크시트').length;

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

  const selectAll = () => setSelectedIds(new Set(filteredItems.map(i => i.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleAddNew = () => {
    if (!newValue.trim()) return;
    const trimmedValue = newValue.trim();
    
    // 중복 체크
    if (items.some(i => i.value === trimmedValue)) {
      alert('이미 존재하는 항목입니다.');
      return;
    }
    
    const newItem: DataItem = { id: `new_${Date.now()}`, value: trimmedValue, category: '추가' };
    setItems(prev => [...prev, newItem]);
    setSelectedIds(prev => new Set([...prev, newItem.id]));
    
    // localStorage에 저장 (마스터 데이터로 영구 저장)
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
      console.log('[DataSelectModal] 새 항목 저장됨:', trimmedValue);
    } catch (e) {
      console.error('데이터 저장 오류:', e);
    }
    
    setNewValue('');
  };

  const handleSave = () => {
    const selectedValues = items.filter(item => selectedIds.has(item.id)).map(item => item.value);
    onSave(selectedValues);
    onClose();
  };

  const isCurrentlySelected = (value: string) => currentValues.includes(value);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon="📋"
      width="600px"
      tabs={[
        { id: 'list', label: '목록에서 선택', icon: '📋' },
        { id: 'manual', label: '직접 입력', icon: '✏️' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      saveDisabled={selectedIds.size === 0}
      footerContent={
        <span className="text-sm font-bold text-blue-600">
          ✓ {selectedIds.size}개 선택
        </span>
      }
    >
      {activeTab === 'list' ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* 필터 탭 */}
          <div className="flex border-b bg-gray-50/30 shrink-0">
            {[
              { id: 'all', label: `전체 (${items.length})`, icon: null },
              { id: 'default', label: `기본 (${defaultCount})`, icon: '🌐' },
              { id: 'added', label: `추가 (${addedCount})`, icon: '➕' },
              ...(worksheetCount > 0 ? [{ id: 'worksheet', label: `⚠️ 정리대상 (${worksheetCount})`, icon: '🧹' }] : [])
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={`flex-1 px-3 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  filterType === type.id 
                    ? 'bg-white border-blue-500 text-blue-600' 
                    : 'text-gray-500 border-transparent hover:bg-gray-100'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {/* 상위 기능 및 구분 표시 (요구사항 선택 시) */}
          {(parentFunction || parentCategory) && (
            <div className="px-4 py-2 border-b bg-gradient-to-r from-green-50 to-emerald-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-700 whitespace-nowrap">🔗 상위기능</span>
                {parentCategory && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg shadow-sm text-white ${
                    parentCategory === 'Your Plant' ? 'bg-blue-600' :
                    parentCategory === 'Ship to Plant' ? 'bg-orange-500' :
                    parentCategory === 'User' ? 'bg-purple-600' : 'bg-gray-500'
                  }`}>
                    {parentCategory}
                  </span>
                )}
                {parentFunction && (
                  <span className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm flex-1">
                    {parentFunction}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 현재 공정/작업요소 표시 (드롭다운 또는 뱃지) */}
          {(processName || workElementName || processList) && (
            <div className="px-4 py-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                {/* 공정 드롭다운 (processList가 있으면) */}
                {processList && processList.length > 0 ? (
                  <>
                    <span className="text-xs font-medium text-gray-500">공정 선택:</span>
                    <select
                      value={processNo || ''}
                      onChange={(e) => {
                        const selectedProc = processList.find(p => p.no === e.target.value);
                        if (selectedProc && onProcessChange) {
                          onProcessChange(selectedProc.id);
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm border-0 outline-none cursor-pointer hover:bg-blue-700"
                    >
                      {processList.map(p => (
                        <option key={p.id} value={p.no} className="bg-white text-gray-800">
                          {p.no}. {p.name}
                        </option>
                      ))}
                    </select>
                  </>
                ) : processName && (
                  <>
                    <span className="text-xs font-medium text-gray-500">공정:</span>
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full shadow-sm">
                      {processNo && `${processNo}. `}{processName}
                    </span>
                  </>
                )}
                {workElementName && (
                  <>
                    <span className="text-xs font-medium text-gray-500">작업요소:</span>
                    <span className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full shadow-sm">
                      {workElementName}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 검색 및 버튼 */}
          <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50/50 shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${itemInfo.label} 검색...`}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            {/* 구분 필터 (C1, C2, C3 관련 모달에서만 표시) */}
            {['C1', 'C2', 'C3'].includes(itemCode) && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All</option>
                <option value="Your Plant">Your Plant</option>
                <option value="Ship to Plant">Ship to Plant</option>
                <option value="User">User</option>
              </select>
            )}
            {!singleSelect && (
              <div className="flex gap-1">
                <button onClick={selectAll} className="px-3 py-2 text-xs font-bold bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-sm transition-colors">전체선택</button>
                <button onClick={deselectAll} className="px-3 py-2 text-xs font-bold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 shadow-sm transition-colors">해제</button>
                {worksheetCount > 0 && (
                  <button 
                    onClick={() => {
                      const worksheetItems = items.filter(i => i.category === '워크시트');
                      const valuesToDelete = worksheetItems.map(i => i.value);
                      if (confirm(`⚠️ 정리대상 ${worksheetCount}개 항목을 워크시트에서 삭제하시겠습니까?\n\n삭제 항목:\n${valuesToDelete.slice(0, 5).join('\n')}${valuesToDelete.length > 5 ? `\n... 외 ${valuesToDelete.length - 5}개` : ''}\n\n(기본 항목만 유지됩니다)`)) {
                        if (onDelete) {
                          onDelete(valuesToDelete);
                        }
                        // 목록에서 워크시트 항목 제거
                        setItems(prev => prev.filter(i => i.category !== '워크시트'));
                        setSelectedIds(new Set());
                        alert('정리대상 데이터가 삭제되었습니다.\n기본 항목에서 다시 선택하세요.');
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm transition-colors animate-pulse"
                    title="워크시트에서 정리대상 항목 삭제"
                  >
                    🗑️ 정리대상 삭제 ({worksheetCount})
                  </button>
                )}
                {currentValues.length > 0 && (
                  <button 
                    onClick={() => {
                      if (confirm(`워크시트에서 ${currentValues.length}개 항목을 모두 삭제하시겠습니까?\n\n삭제 후 복구할 수 없습니다.`)) {
                        if (onDelete) {
                          onDelete(currentValues);
                        }
                        onClose();
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm transition-colors"
                  >
                    전체삭제 ({currentValues.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 아이템 리스트 - 컴팩트 테이블 스타일 */}
          <div className="flex-1 overflow-auto p-1 bg-gray-50/20">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <span className="text-4xl mb-4">📋</span>
                <p className="text-xs font-medium">데이터가 없습니다.</p>
                <p className="text-[10px] mt-1">"직접 입력" 탭에서 추가해 보세요.</p>
              </div>
            ) : (
              <table className="w-full text-[10px] border-collapse">
                <tbody>
                {filteredItems.map(item => {
                  const isSelected = selectedIds.has(item.id);
                  const isCurrent = isCurrentlySelected(item.value);
                  const catColor = CATEGORY_COLORS[item.category || '기본'] || CATEGORY_COLORS['기본'];
                  
                  return (
                    <tr 
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`cursor-pointer transition-all border-b border-gray-100 ${
                        isSelected 
                          ? isCurrent ? 'bg-green-50' : 'bg-blue-50'
                          : 'bg-white hover:bg-blue-50/30'
                      }`}
                      style={{ height: '26px' }}
                    >
                      {/* 체크박스 */}
                      <td className="w-5 text-center">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center mx-auto ${
                          isSelected 
                            ? isCurrent ? 'bg-green-500 border-green-500' : 'bg-blue-500 border-blue-500' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {isSelected && <span className="text-white text-[7px] font-bold">✓</span>}
                        </div>
                      </td>

                      {/* 카테고리 배지 */}
                      <td className="w-9 px-0.5">
                        <span 
                          className="text-[7px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
                          style={{ background: catColor.bg, color: catColor.text }}
                        >
                          {item.category || '기본'}
                        </span>
                      </td>

                      {/* 소속 배지 (belongsTo) */}
                      {['C2', 'C3'].includes(itemCode) && (
                        <td className="w-5 px-0.5">
                          {item.belongsTo && (
                            <span 
                              className="text-[7px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
                              style={{ 
                                background: item.belongsTo === 'Your Plant' ? '#e8f5e9' : 
                                           item.belongsTo === 'Ship to Plant' ? '#fff3e0' : '#fce4ec',
                                color: item.belongsTo === 'Your Plant' ? '#2e7d32' : 
                                       item.belongsTo === 'Ship to Plant' ? '#e65100' : '#c2185b',
                              }}
                            >
                              {item.belongsTo === 'Your Plant' ? 'YP' : 
                               item.belongsTo === 'Ship to Plant' ? 'SP' : 'U'}
                            </span>
                          )}
                        </td>
                      )}

                      {/* 이름 - 한 줄, 말줄임 */}
                      <td className="px-1.5">
                        <div className={`truncate font-medium ${
                          isSelected ? (isCurrent ? 'text-green-800' : 'text-blue-800') : 'text-gray-700'
                        }`} title={item.value}>
                          {item.value}
                          {isCurrent && <span className="ml-1 text-[8px] text-green-600">(현재)</span>}
                        </div>
                      </td>

                      {/* 개별 삭제 버튼 */}
                      <td className="w-5 text-center">
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(item.id);
                            }}
                            className="text-red-400 hover:text-red-600 text-[10px]"
                            title="선택 해제"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col h-full bg-gray-50/20">
          <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-blue-500">➕</span> 새 {itemInfo.label} 등록
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newValue.trim()) handleAddNew(); }}
                placeholder={`새로운 ${itemInfo.label}을 입력하세요...`}
                className="flex-1 px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
              <button
                onClick={handleAddNew}
                disabled={!newValue.trim()}
                className="px-6 py-2.5 text-sm font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all disabled:bg-gray-200 active:scale-95"
              >
                추가
              </button>
            </div>
          </div>

          {/* 입력된 항목 표시 - 체크박스 포함 */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">
              입력된 항목 ({items.filter(i => i.category === '추가').length}) 
              <span className="ml-2 text-blue-600">- 선택: {items.filter(i => i.category === '추가' && selectedIds.has(i.id)).length}개</span>
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {items.filter(i => i.category === '추가').map(item => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => toggleSelect(item.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {/* 체크박스 */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                    }`}>
                      {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">추가</span>
                    <span className={`flex-1 text-sm ${isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>{item.value}</span>
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItems(prev => prev.filter(i => i.id !== item.id));
                        setSelectedIds(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(item.id);
                          return newSet;
                        });
                      }}
                      className="text-red-400 hover:text-red-600 text-sm px-1"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
