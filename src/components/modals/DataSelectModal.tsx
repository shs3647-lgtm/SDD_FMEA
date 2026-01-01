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
  B6: { label: '검출관리', category: 'B', level: 'L3' },
  SC: { label: '특별특성', category: 'S', level: 'L2' },
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
  // A3: 공정 기능 (L2 메인공정)
  A3: [
    { id: 'A3_10', value: '입고된 원자재를 검수하여 창고 입고', category: '기본', processNo: '10' },
    { id: 'A3_20', value: '원부자재 샘플링 수입검사', category: '기본', processNo: '20' },
    { id: 'A3_30', value: 'MB조건에 따라 혼련', category: '기본', processNo: '30' },
    { id: 'A3_40', value: 'FM조건에 따라 혼련', category: '기본', processNo: '40' },
    { id: 'A3_50', value: '고무 압출하여 반제품 생산', category: '기본', processNo: '50' },
    { id: 'A3_60', value: '스틸코드에 고무 코팅', category: '기본', processNo: '60' },
    { id: 'A3_70', value: '부재를 조립하여 성형', category: '기본', processNo: '70' },
    { id: 'A3_80', value: '가류 조건에 따라 가류', category: '기본', processNo: '80' },
    { id: 'A3_90', value: '트리밍 및 외관 검사', category: '기본', processNo: '90' },
    { id: 'A3_100', value: '유니포미티 검사', category: '기본', processNo: '100' },
    { id: 'A3_110', value: '포장 및 출하', category: '기본', processNo: '110' },
    // 범용 공정 기능
    { id: 'A3_G1', value: '규격에 맞게 가공', category: '기본' },
    { id: 'A3_G2', value: '품질 검사 수행', category: '기본' },
    { id: 'A3_G3', value: '설비 조건 유지', category: '기본' },
    { id: 'A3_G4', value: '작업 표준 준수', category: '기본' },
    { id: 'A3_G5', value: '이물 유입 방지', category: '기본' },
  ],
  // A4: 제품특성 (L2 메인공정)
  A4: [
    { id: 'A4_10', value: '이물질', category: '기본', processNo: '10' },
    { id: 'A4_20', value: 'Mooney', category: '기본', processNo: '20' },
    { id: 'A4_30', value: 'Mooney', category: '기본', processNo: '30' },
    { id: 'A4_40', value: 'Rheometer', category: '기본', processNo: '40' },
    { id: 'A4_50', value: 'Tread 폭', category: '기본', processNo: '50' },
    { id: 'A4_60', value: 'Steel Cord 폭', category: '기본', processNo: '60' },
    { id: 'A4_70', value: '조인트 위치', category: '기본', processNo: '70' },
    { id: 'A4_80', value: '가류 시간', category: '기본', processNo: '80' },
    { id: 'A4_90', value: '외관 품질', category: '기본', processNo: '90' },
    { id: 'A4_100', value: 'RFV/LFV', category: '기본', processNo: '100' },
    { id: 'A4_110', value: '포장 상태', category: '기본', processNo: '110' },
    // 범용 제품특성
    { id: 'A4_G1', value: '치수', category: '기본' },
    { id: 'A4_G2', value: '외관', category: '기본' },
    { id: 'A4_G3', value: '경도', category: '기본' },
    { id: 'A4_G4', value: '중량', category: '기본' },
  ],
  // B2: 작업요소 기능 (L3 작업요소) - 4M별
  B2: [
    // MN (Man) - 사람 관련
    { id: 'B2_MN1', value: '작업 표준에 따라 작업 수행', category: '기본', belongsTo: 'MN' },
    { id: 'B2_MN2', value: '설비 조건 설정 및 확인', category: '기본', belongsTo: 'MN' },
    { id: 'B2_MN3', value: '품질 검사 수행', category: '기본', belongsTo: 'MN' },
    { id: 'B2_MN4', value: '이상 발생 시 조치', category: '기본', belongsTo: 'MN' },
    // MC (Machine) - 설비 관련
    { id: 'B2_MC1', value: '규정된 조건으로 가동', category: '기본', belongsTo: 'MC' },
    { id: 'B2_MC2', value: '정밀도 유지', category: '기본', belongsTo: 'MC' },
    { id: 'B2_MC3', value: '안정적 운전 수행', category: '기본', belongsTo: 'MC' },
    { id: 'B2_MC4', value: '설정값 유지', category: '기본', belongsTo: 'MC' },
    // IM (In-Material) - 부자재 관련
    { id: 'B2_IM1', value: '규격 자재 투입', category: '기본', belongsTo: 'IM' },
    { id: 'B2_IM2', value: '자재 상태 확인', category: '기본', belongsTo: 'IM' },
    { id: 'B2_IM3', value: '선입선출 관리', category: '기본', belongsTo: 'IM' },
    // EN (Environment) - 환경 관련
    { id: 'B2_EN1', value: '작업 환경 조건 유지', category: '기본', belongsTo: 'EN' },
    { id: 'B2_EN2', value: '온도/습도 관리', category: '기본', belongsTo: 'EN' },
    { id: 'B2_EN3', value: '청정도 유지', category: '기본', belongsTo: 'EN' },
  ],
  // B3: 공정특성 (L3 작업요소) - 4M별
  B3: [
    // MN (Man) - 사람 관련
    { id: 'B3_MN1', value: '작업 숙련도', category: '기본', belongsTo: 'MN' },
    { id: 'B3_MN2', value: '작업 속도', category: '기본', belongsTo: 'MN' },
    { id: 'B3_MN3', value: '검사 정확도', category: '기본', belongsTo: 'MN' },
    // MC (Machine) - 설비 관련
    { id: 'B3_MC1', value: '설비 압력', category: '기본', belongsTo: 'MC' },
    { id: 'B3_MC2', value: '설비 온도', category: '기본', belongsTo: 'MC' },
    { id: 'B3_MC3', value: '설비 속도', category: '기본', belongsTo: 'MC' },
    { id: 'B3_MC4', value: '설비 정밀도', category: '기본', belongsTo: 'MC' },
    // IM (In-Material) - 부자재 관련
    { id: 'B3_IM1', value: '자재 규격', category: '기본', belongsTo: 'IM' },
    { id: 'B3_IM2', value: '자재 유효기간', category: '기본', belongsTo: 'IM' },
    { id: 'B3_IM3', value: '자재 상태', category: '기본', belongsTo: 'IM' },
    // EN (Environment) - 환경 관련
    { id: 'B3_EN1', value: '작업장 온도', category: '기본', belongsTo: 'EN' },
    { id: 'B3_EN2', value: '작업장 습도', category: '기본', belongsTo: 'EN' },
    { id: 'B3_EN3', value: '조도', category: '기본', belongsTo: 'EN' },
  ],
  // B4: 고장원인 (L3 작업요소) - 4M별
  B4: [
    // MN (Man) - 사람 관련
    { id: 'B4_MN1', value: '작업자 실수', category: '기본', belongsTo: 'MN' },
    { id: 'B4_MN2', value: '교육 미흡', category: '기본', belongsTo: 'MN' },
    { id: 'B4_MN3', value: '피로/부주의', category: '기본', belongsTo: 'MN' },
    // MC (Machine) - 설비 관련
    { id: 'B4_MC1', value: '설비 마모', category: '기본', belongsTo: 'MC' },
    { id: 'B4_MC2', value: '설비 고장', category: '기본', belongsTo: 'MC' },
    { id: 'B4_MC3', value: '설정값 오류', category: '기본', belongsTo: 'MC' },
    // IM (In-Material) - 부자재 관련
    { id: 'B4_IM1', value: '원자재 불량', category: '기본', belongsTo: 'IM' },
    { id: 'B4_IM2', value: '자재 혼입', category: '기본', belongsTo: 'IM' },
    { id: 'B4_IM3', value: '유효기간 초과', category: '기본', belongsTo: 'IM' },
    // EN (Environment) - 환경 관련
    { id: 'B4_EN1', value: '온도 부적합', category: '기본', belongsTo: 'EN' },
    { id: 'B4_EN2', value: '습도 부적합', category: '기본', belongsTo: 'EN' },
    { id: 'B4_EN3', value: '이물 유입', category: '기본', belongsTo: 'EN' },
  ],
  // B5: 예방관리 (L3 작업요소)
  B5: [
    { id: 'B5_1', value: '작업 표준서 교육', category: '기본' },
    { id: 'B5_2', value: '일상 점검', category: '기본' },
    { id: 'B5_3', value: '정기 점검', category: '기본' },
    { id: 'B5_4', value: '설비 PM', category: '기본' },
    { id: 'B5_5', value: '자재 입고 검사', category: '기본' },
    { id: 'B5_6', value: '환경 모니터링', category: '기본' },
    { id: 'B5_7', value: 'Fool Proof 설치', category: '기본' },
    { id: 'B5_8', value: 'Poka-Yoke', category: '기본' },
  ],
  // B6: 검출관리 (L3 작업요소)
  B6: [
    { id: 'B6_1', value: '육안 검사', category: '기본' },
    { id: 'B6_2', value: '측정기 검사', category: '기본' },
    { id: 'B6_3', value: '자동 센서 검출', category: '기본' },
    { id: 'B6_4', value: 'SPC 관리', category: '기본' },
    { id: 'B6_5', value: 'Go/No-Go 게이지', category: '기본' },
    { id: 'B6_6', value: '초중종품 검사', category: '기본' },
    { id: 'B6_7', value: '전수 검사', category: '기본' },
    { id: 'B6_8', value: '샘플링 검사', category: '기본' },
  ],
  // SC: 특별특성 (Special Characteristic)
  SC: [
    { id: 'SC_1', value: 'CC (Critical Characteristic)', category: '기본' },
    { id: 'SC_2', value: 'SC (Significant Characteristic)', category: '기본' },
    { id: 'SC_3', value: 'HC (High Impact Characteristic)', category: '기본' },
    { id: 'SC_4', value: '-', category: '기본' },
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
      className="fixed inset-0 z-[9999] flex items-start justify-end bg-black/40 pt-20 pr-5"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-[350px] flex flex-col overflow-hidden max-h-[calc(100vh-120px)]"
        onClick={e => e.stopPropagation()}
      >
        {/* ===== 헤더: 제목 + 닫기 ===== */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <h2 className="text-xs font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded">닫기</button>
        </div>

        {/* ===== 상위 항목 고정 표시 ===== */}
        <div className="px-3 py-2 border-b bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-red-700 shrink-0">★ 상위항목:</span>
            
            {/* C3 요구사항: 상위는 완제품기능 */}
            {itemCode === 'C3' && parentFunction && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-600 font-bold">완제품기능:</span>
                <span className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded max-w-[300px] truncate" title={parentFunction}>
                  {parentFunction}
                </span>
              </div>
            )}
            
            {/* FM1 고장형태: 상위는 제품특성 */}
            {itemCode === 'FM1' && parentFunction && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-600 font-bold">제품특성:</span>
                <span className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded max-w-[300px] truncate" title={parentFunction}>
                  {parentFunction}
                </span>
              </div>
            )}
            
            {/* FC1 고장원인: 상위는 공정특성 */}
            {itemCode === 'FC1' && parentFunction && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-600 font-bold">공정특성:</span>
                <span className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded max-w-[300px] truncate" title={parentFunction}>
                  {parentFunction}
                </span>
              </div>
            )}
            
            {/* FE2 고장영향: 상위는 요구사항 */}
            {itemCode === 'FE2' && parentReqName && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-600 font-bold">요구사항:</span>
                <span className="px-2 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded max-w-[300px] truncate" title={parentReqName}>
                  {parentReqName}
                </span>
              </div>
            )}
            
            {/* 기본 표시: 위 조건에 해당하지 않는 경우 */}
            {!['C3', 'FM1', 'FC1', 'FE2'].includes(itemCode) && (
              <>
                {processName && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 font-bold">공정명:</span>
                    <span className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded">{processName}</span>
                  </div>
                )}
                {parentTypeName && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 font-bold">구분:</span>
                    <span className="px-2 py-1 text-[10px] font-bold bg-teal-600 text-white rounded">{parentTypeName}</span>
                  </div>
                )}
                {parentFunction && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 font-bold">기능:</span>
                    <span className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded max-w-[250px] truncate" title={parentFunction}>{parentFunction}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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

        {/* ===== 하위항목 라벨 ===== */}
        <div className="px-3 py-1 border-b bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <span className="text-[11px] font-bold text-blue-700">▼ 하위항목: {itemInfo.label}</span>
        </div>

        {/* ===== 리스트 (고정 높이, 2열 그리드) ===== */}
        <div className="overflow-auto p-2 h-[280px] min-h-[280px]">
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
