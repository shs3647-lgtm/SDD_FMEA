/**
 * @file hooks/useWorksheetHandlers.ts
 * @description 워크시트 행 조작 핸들러 훅
 */

import { useCallback } from 'react';
import { CPItem, CPState, ContextMenuType, SaveStatus } from '../types';
import { createEmptyItem } from '../utils';

interface UseWorksheetHandlersProps {
  state: CPState;
  setState: React.Dispatch<React.SetStateAction<CPState>>;
  setSaveStatus: React.Dispatch<React.SetStateAction<SaveStatus>>;
  closeContextMenu: () => void;
}

export function useWorksheetHandlers({
  state,
  setState,
  setSaveStatus,
  closeContextMenu,
}: UseWorksheetHandlersProps) {
  
  // 셀 값 변경
  const handleCellChange = useCallback((itemId: string, key: string, value: any) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, [key]: value } : item
      ),
      dirty: true,
    }));
  }, [setState]);
  
  // 행 추가 (맨 아래)
  const handleAddRow = useCallback(() => {
    const lastItem = state.items[state.items.length - 1];
    const newItem = createEmptyItem(
      state.cpNo,
      lastItem?.processNo || '',
      lastItem?.processName || ''
    );
    newItem.sortOrder = state.items.length;
    setState(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      dirty: true,
    }));
  }, [state.items, state.cpNo, setState]);
  
  // 행 위에 추가 (type에 따라 부모 필드 복사)
  const handleInsertRowAbove = useCallback((rowIdx: number, type: ContextMenuType) => {
    const currentItem = state.items[rowIdx];
    const newItem = createEmptyItem(
      state.cpNo,
      currentItem?.processNo || '',
      currentItem?.processName || ''
    );
    // type에 따라 부모 필드 복사
    if (type === 'work' || type === 'char') {
      newItem.processLevel = currentItem?.processLevel || '';
      newItem.processDesc = currentItem?.processDesc || '';
    }
    if (type === 'char') {
      newItem.workElement = currentItem?.workElement || '';
    }
    const newItems = [...state.items];
    newItems.splice(rowIdx, 0, newItem);
    // sortOrder 재정렬
    newItems.forEach((item, idx) => item.sortOrder = idx);
    setState(prev => ({ ...prev, items: newItems, dirty: true }));
    closeContextMenu();
  }, [state.items, state.cpNo, setState, closeContextMenu]);
  
  // 행 아래에 추가 (type에 따라 부모 필드 복사)
  const handleInsertRowBelow = useCallback((rowIdx: number, type: ContextMenuType) => {
    const currentItem = state.items[rowIdx];
    const newItem = createEmptyItem(
      state.cpNo,
      currentItem?.processNo || '',
      currentItem?.processName || ''
    );
    // type에 따라 부모 필드 복사
    if (type === 'work' || type === 'char') {
      newItem.processLevel = currentItem?.processLevel || '';
      newItem.processDesc = currentItem?.processDesc || '';
    }
    if (type === 'char') {
      newItem.workElement = currentItem?.workElement || '';
    }
    const newItems = [...state.items];
    newItems.splice(rowIdx + 1, 0, newItem);
    // sortOrder 재정렬
    newItems.forEach((item, idx) => item.sortOrder = idx);
    setState(prev => ({ ...prev, items: newItems, dirty: true }));
    closeContextMenu();
  }, [state.items, state.cpNo, setState, closeContextMenu]);
  
  // 행 삭제
  const handleDeleteRow = useCallback((rowIdx: number) => {
    if (state.items.length <= 1) {
      alert('최소 1개의 행은 유지해야 합니다.');
      closeContextMenu();
      return;
    }
    const newItems = state.items.filter((_, idx) => idx !== rowIdx);
    // sortOrder 재정렬
    newItems.forEach((item, idx) => item.sortOrder = idx);
    setState(prev => ({ ...prev, items: newItems, dirty: true }));
    closeContextMenu();
  }, [state.items, setState, closeContextMenu]);
  
  // 저장
  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    
    try {
      const res = await fetch(`/api/control-plan/${state.cpNo}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state.items }),
      });
      
      if (res.ok) {
        setSaveStatus('saved');
        setState(prev => ({ ...prev, dirty: false }));
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveStatus('error');
    }
  }, [state.cpNo, state.items, setState, setSaveStatus]);
  
  return {
    handleCellChange,
    handleAddRow,
    handleInsertRowAbove,
    handleInsertRowBelow,
    handleDeleteRow,
    handleSave,
  };
}



