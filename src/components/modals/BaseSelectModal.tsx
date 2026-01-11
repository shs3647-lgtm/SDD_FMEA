/**
 * @file BaseSelectModal.tsx
 * @description 모든 선택 모달의 공통 베이스 컴포넌트
 * @version 1.0.0
 * @created 2026-01-03
 * 
 * 공통 기능:
 * - 모달 레이아웃 (fixed, backdrop)
 * - 헤더 (아이콘, 제목, 닫기)
 * - 검색 + 전체/해제/적용/삭제 버튼
 * - 새 항목 추가 (맨 위에 표시)
 * - 2열 그리드 리스트
 * - 선택 개수 표시
 * 
 * 커스터마이징:
 * - themeColor: 테마 색상 (orange, blue, green, red 등)
 * - icon: 헤더 아이콘
 * - title: 모달 제목
 * - items: 데이터 항목
 * - renderParentInfo: 상위항목 렌더링 (옵션)
 * - extraColumns: 추가 컬럼 렌더링 (그룹 등)
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { getAIRecommendations, getAIStatus, RankedItem } from '@/lib/ai-recommendation';

// ============ 타입 정의 ============
export interface BaseItem {
  id: string;
  value: string;
  category: string;
  group?: string;
  [key: string]: any;
}

export interface ThemeColors {
  primary: string;      // 헤더 배경 (예: from-orange-600 to-orange-700)
  accent: string;       // 강조색 (예: orange-500)
  light: string;        // 연한 배경 (예: orange-50)
  ring: string;         // 포커스 링 (예: ring-orange-500)
  selectedBg: string;   // 선택된 항목 배경 (예: bg-orange-50)
  selectedBorder: string; // 선택된 항목 테두리 (예: border-orange-400)
  checkBg: string;      // 체크박스 배경 (예: bg-orange-500)
}

// 사전 정의된 테마
export const THEMES: Record<string, ThemeColors> = {
  orange: {
    primary: 'from-orange-600 to-orange-700',
    accent: 'orange-500',
    light: 'orange-50',
    ring: 'ring-orange-500',
    selectedBg: 'bg-orange-50',
    selectedBorder: 'border-orange-400',
    checkBg: 'bg-orange-500',
  },
  blue: {
    primary: 'from-blue-600 to-blue-700',
    accent: 'blue-500',
    light: 'blue-50',
    ring: 'ring-blue-500',
    selectedBg: 'bg-blue-50',
    selectedBorder: 'border-blue-400',
    checkBg: 'bg-blue-500',
  },
  green: {
    primary: 'from-green-600 to-green-700',
    accent: 'green-500',
    light: 'green-50',
    ring: 'ring-green-500',
    selectedBg: 'bg-green-50',
    selectedBorder: 'border-green-400',
    checkBg: 'bg-green-500',
  },
  red: {
    primary: 'from-red-600 to-red-700',
    accent: 'red-500',
    light: 'red-50',
    ring: 'ring-red-500',
    selectedBg: 'bg-red-50',
    selectedBorder: 'border-red-400',
    checkBg: 'bg-red-500',
  },
  indigo: {
    primary: 'from-indigo-600 to-indigo-700',
    accent: 'indigo-500',
    light: 'indigo-50',
    ring: 'ring-indigo-500',
    selectedBg: 'bg-indigo-50',
    selectedBorder: 'border-indigo-400',
    checkBg: 'bg-indigo-500',
  },
};

// 카테고리 색상
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  '기본': { bg: '#e8f5e9', text: '#2e7d32' },
  '추가': { bg: '#fff3e0', text: '#e65100' },
  '워크시트': { bg: '#e3f2fd', text: '#1565c0' },
};

// AI 추천 컨텍스트 타입
export interface AIRecommendContext {
  processType?: string;
  processName?: string;
  workElement?: string;
  m4Category?: string;
  categoryType?: string;
  functionName?: string;
  requirement?: string;
  productChar?: string;
}

export interface BaseSelectModalProps {
  // 필수
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedItems: BaseItem[]) => void;
  items: BaseItem[];
  setItems: React.Dispatch<React.SetStateAction<BaseItem[]>>;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // 테마
  theme?: keyof typeof THEMES | ThemeColors;
  icon?: string;
  title: string;
  
  // 옵션
  searchPlaceholder?: string;
  addPlaceholder?: string;
  subTitle?: string;
  showDeleteAll?: boolean;
  onDeleteAll?: () => void;
  minRows?: number;
  
  // 상위항목 렌더링 (옵션)
  renderParentInfo?: () => React.ReactNode;
  
  // 추가 컬럼 렌더링 (그룹 등)
  renderExtraColumns?: (item: BaseItem) => React.ReactNode;
  
  // 현재 선택된 항목 (초록색 표시용)
  currentValues?: string[];
  
  // AI 추천 옵션
  aiRecommendType?: 'mode' | 'cause' | 'effect';
  aiRecommendContext?: AIRecommendContext;
}

export default function BaseSelectModal({
  isOpen,
  onClose,
  onApply,
  items,
  setItems,
  selectedIds,
  setSelectedIds,
  theme = 'orange',
  icon = '📋',
  title,
  searchPlaceholder = '🔍 검색...',
  addPlaceholder = '새 항목 입력...',
  subTitle,
  showDeleteAll = true,
  onDeleteAll,
  minRows = 10,
  renderParentInfo,
  renderExtraColumns,
  currentValues = [],
  aiRecommendType,
  aiRecommendContext,
}: BaseSelectModalProps) {
  const [search, setSearch] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<RankedItem[]>([]);
  const [aiReady, setAiReady] = useState(false);
  
  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ top: 200, right: 0 });

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // 드래그 중
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setModalPosition(prev => ({
        top: Math.max(0, Math.min(window.innerHeight - 200, prev.top + deltaY)),
        right: Math.max(-350, Math.min(window.innerWidth - 350, prev.right - deltaX))
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 모달이 열릴 때 위치 초기화
  useEffect(() => {
    if (isOpen) {
      setModalPosition({ top: 200, right: 0 });
    }
  }, [isOpen]);

  // AI 추천 로드
  useEffect(() => {
    if (!isOpen || !aiRecommendType || !aiRecommendContext) return;
    
    if (typeof window === 'undefined') return;
    
    const status = getAIStatus();
    setAiReady(status.isReady);
    
    if (!status.isReady) return;
    
    const result = getAIRecommendations(aiRecommendContext);
    let recs: RankedItem[] = [];
    switch (aiRecommendType) {
      case 'mode':
        recs = result.failureModes;
        break;
      case 'cause':
        recs = result.failureCauses;
        break;
      case 'effect':
        recs = result.failureEffects;
        break;
    }
    setAiRecommendations(recs);
    
    // AI 추천이 있으면 자동으로 패널 표시
    if (recs.length > 0) {
      setShowAIPanel(true);
    }
  }, [isOpen, aiRecommendType, aiRecommendContext]);

  // AI 추천 항목 선택
  const handleSelectAIRecommendation = useCallback((value: string) => {
    // 해당 값이 이미 items에 있는지 확인
    let existingItem = items.find(i => i.value === value);
    
    if (!existingItem) {
      // 없으면 새로 추가
      const newItem: BaseItem = { 
        id: `ai_${Date.now()}`, 
        value, 
        category: 'AI추천' 
      };
      setItems(prev => [newItem, ...prev]);
      existingItem = newItem;
    }
    
    // 선택 상태에 추가
    setSelectedIds(prev => new Set([...prev, existingItem!.id]));
  }, [items, setItems, setSelectedIds]);
  
  // 테마 색상 결정
  const colors: ThemeColors = typeof theme === 'string' ? THEMES[theme] : theme;
  
  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.value.toLowerCase().includes(q));
  }, [items, search]);
  
  // 선택 토글
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, [setSelectedIds]);
  
  // 전체 선택/해제
  const selectAll = () => setSelectedIds(new Set(filteredItems.map(i => i.id)));
  const deselectAll = () => setSelectedIds(new Set());
  
  // 적용
  const handleApply = () => {
    const selected = items.filter(i => selectedIds.has(i.id));
    onApply(selected);
    onClose();
  };
  
  // 삭제
  const handleDeleteAll = () => {
    if (!confirm('모든 항목을 삭제하시겠습니까?')) return;
    onDeleteAll?.();
    onClose();
  };
  
  // 새 항목 추가 (맨 위에)
  const handleAddSave = () => {
    if (!newValue.trim()) return;
    const trimmed = newValue.trim();
    
    // 중복 체크 - 중복이면 무시
    if (items.some(i => i.value === trimmed)) return;
    
    const newItem: BaseItem = { 
      id: `new_${Date.now()}`, 
      value: trimmed, 
      category: '추가' 
    };
    
    setItems(prev => [newItem, ...prev]); // 맨 위에 추가
    setSelectedIds(prev => new Set([...prev, newItem.id]));
    setNewValue('');
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/40" 
      onClick={onClose}
    >
      <div 
        className="fixed bg-white rounded-lg shadow-2xl w-[350px] max-w-[350px] min-w-[350px] flex flex-col overflow-hidden max-h-[calc(100vh-120px)] cursor-move" 
        style={{ top: `${modalPosition.top}px`, right: `${modalPosition.right}px` }}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        {/* ===== 헤더 - 드래그 가능 ===== */}
        <div 
          className={`flex items-center justify-between px-3 py-2 bg-gradient-to-r ${colors.primary} text-white cursor-move select-none`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <h2 className="text-xs font-bold">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded"
          >
            닫기
          </button>
        </div>
        
        {/* ===== 상위항목 (옵션) ===== */}
        {renderParentInfo && (
          <div className={`px-3 py-2 border-b bg-gradient-to-r from-${colors.light} to-white`}>
            {renderParentInfo()}
          </div>
        )}
        
        {/* ===== 하위항목 라벨 (옵션) ===== */}
        {subTitle && (
          <div className={`px-3 py-1 border-b bg-${colors.light}`}>
            <span className={`text-[10px] font-bold text-${colors.accent}`}>▼ {subTitle}</span>
          </div>
        )}
        
        {/* ===== 검색 + 버튼 ===== */}
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className={`flex-1 px-2 py-1 text-[10px] border rounded focus:outline-none focus:ring-1 focus:${colors.ring}`}
          />
          <button onClick={selectAll} className="px-3 py-1.5 text-[15px] font-bold bg-blue-500 text-white rounded hover:bg-blue-600">전체</button>
          <button onClick={deselectAll} className="px-3 py-1.5 text-[15px] font-bold bg-gray-300 text-gray-700 rounded hover:bg-gray-400">해제</button>
          <button onClick={handleApply} className="ml-2 px-3 py-1.5 text-[15px] font-bold bg-green-600 text-white rounded hover:bg-green-700">적용</button>
          {showDeleteAll && (
            <button onClick={handleDeleteAll} className="ml-4 px-3 py-1.5 text-[15px] font-bold bg-red-500 text-white rounded hover:bg-red-600">삭제</button>
          )}
          {/* AI 추천 토글 버튼 */}
          {aiRecommendType && aiReady && aiRecommendations.length > 0 && (
            <button 
              onClick={() => setShowAIPanel(!showAIPanel)} 
              className={`px-2 py-1 text-[10px] font-bold rounded ${
                showAIPanel 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              title="AI 추천 보기"
            >
              🤖 AI({aiRecommendations.length})
            </button>
          )}
        </div>
        
        {/* ===== AI 추천 패널 ===== */}
        {showAIPanel && aiRecommendType && aiRecommendations.length > 0 && (
          <div className="px-3 py-2 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🤖</span>
                <span className="text-[10px] font-bold text-purple-700">AI 추천</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">
                  {aiRecommendations.length}건
                </span>
              </div>
              <button 
                onClick={() => setShowAIPanel(false)}
                className="text-[9px] text-gray-400 hover:text-gray-600"
              >
                접기 ▲
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {aiRecommendations.slice(0, 8).map((rec, idx) => {
                const isAlreadySelected = items.some(i => i.value === rec.value && selectedIds.has(i.id));
                return (
                  <button
                    key={`${rec.value}-${idx}`}
                    onClick={() => handleSelectAIRecommendation(rec.value)}
                    className={`px-2 py-1 text-[10px] rounded border transition-all ${
                      isAlreadySelected 
                        ? 'bg-green-100 border-green-400 text-green-700' 
                        : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400'
                    }`}
                    title={`신뢰도: ${Math.round(rec.confidence * 100)}% | 빈도: ${rec.frequency}회`}
                  >
                    {idx < 3 && <span className="mr-1">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>}
                    {rec.value}
                    {isAlreadySelected && <span className="ml-1">✓</span>}
                  </button>
                );
              })}
              {aiRecommendations.length > 8 && (
                <span className="px-2 py-1 text-[10px] text-purple-400">+{aiRecommendations.length - 8}개 더</span>
              )}
            </div>
          </div>
        )}
        
        {/* ===== 새 항목 입력 ===== */}
        <div className={`px-3 py-1.5 border-b bg-${colors.light} flex items-center gap-1`}>
          <span className={`text-[10px] font-bold text-${colors.accent}`}>+</span>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleAddSave(); } }}
            placeholder={addPlaceholder}
            className={`flex-1 px-2 py-0.5 text-[10px] border rounded focus:outline-none focus:ring-1 focus:${colors.ring}`}
          />
          <button 
            onClick={handleAddSave} 
            disabled={!newValue.trim()} 
            className={`px-2 py-0.5 text-[10px] font-bold bg-${colors.accent} text-white rounded hover:opacity-90 disabled:opacity-50`}
          >
            저장
          </button>
        </div>
        
        {/* ===== 리스트 ===== */}
        <div className="overflow-auto p-2 h-[280px] min-h-[280px]">
          <div className="grid grid-cols-2 gap-1">
            {filteredItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              const isCurrent = currentValues.includes(item.value);
              const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['기본'];
              
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${
                    isSelected 
                      ? (isCurrent ? 'bg-green-50 border-green-400' : `${colors.selectedBg} ${colors.selectedBorder}`) 
                      : `bg-white border-gray-200 hover:${colors.selectedBorder}`
                  }`}
                >
                  {/* 체크박스 */}
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected 
                      ? (isCurrent ? 'bg-green-500 border-green-500' : `${colors.checkBg} border-${colors.accent}`) 
                      : 'bg-white border-gray-300'
                  }`}>
                    {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>
                  
                  {/* 카테고리 */}
                  <span 
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" 
                    style={{ background: catColor.bg, color: catColor.text }}
                  >
                    {item.category}
                  </span>
                  
                  {/* 추가 컬럼 */}
                  {renderExtraColumns?.(item)}
                  
                  {/* 값 */}
                  <span className={`flex-1 text-[10px] truncate ${isSelected ? 'font-medium' : ''}`}>
                    {item.value}
                  </span>
                  
                  {/* 선택 해제 버튼 */}
                  {isSelected && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} 
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
              <div key={`empty-${idx}`} className="flex items-center gap-2 px-2 py-1.5 rounded border border-gray-100 bg-gray-50/50">
                <div className="w-4 h-4 rounded border border-gray-200 bg-white shrink-0" />
                <span className="text-[9px] text-gray-300">--</span>
                <span className="flex-1 text-[10px] text-gray-300">-</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* ===== 푸터 ===== */}
        <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-center">
          <span className={`text-xs font-bold text-${colors.accent}`}>✓ {selectedIds.size}개 선택</span>
        </div>
      </div>
    </div>
  );
}

// ============ 훅: 모달 상태 관리 ============
export function useBaseModalState<T extends BaseItem>(defaultItems: T[] = []) {
  const [items, setItems] = useState<T[]>(defaultItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const reset = useCallback((newItems: T[], selected: string[] = []) => {
    setItems(newItems);
    setSelectedIds(new Set(selected));
  }, []);
  
  const addItem = useCallback((item: T) => {
    setItems(prev => [item, ...prev]); // 맨 위에 추가
    setSelectedIds(prev => new Set([...prev, item.id]));
  }, []);
  
  return {
    items,
    setItems,
    selectedIds,
    setSelectedIds,
    reset,
    addItem,
  };
}

