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
  
  // 행 위에 추가 - D열(공정설명)에서 행 추가 시 C~S열만 생성, A/B는 부모 상속(병합)
  const handleInsertRowAbove = useCallback((rowIdx: number, type: ContextMenuType) => {
    const currentItem = state.items[rowIdx];
    
    // 부모 행 찾기: 위쪽으로 올라가면서 processNo와 processName이 있는 행 찾기
    let parentProcessNo = '';
    let parentProcessName = '';
    for (let i = rowIdx; i >= 0; i--) {
      const item = state.items[i];
      if (item.processNo && item.processName && !item.processNo.startsWith('_') && !item.processName.startsWith('_')) {
        parentProcessNo = item.processNo;
        parentProcessName = item.processName;
        break;
      }
    }
    
    // D열에서 행 추가 시:
    // - A열(공정번호), B열(공정명): 부모 값으로 설정 (rowSpan 병합됨)
    // - C열(레벨)부터 S열까지: 기본값으로 초기화 (병합 없이 일반 셀로 생성)
    const newItem = createEmptyItem(
      state.cpNo,
      parentProcessNo,  // A열: 부모 값 (rowSpan 병합됨)
      parentProcessName  // B열: 부모 값 (rowSpan 병합됨)
    );
    
    // C~S열은 createEmptyItem에서 이미 기본값으로 초기화됨
    // (processLevel='', 나머지는 빈 값 또는 false)
    
    const newItems = [...state.items];
    newItems.splice(rowIdx, 0, newItem);
    // sortOrder 재정렬
    newItems.forEach((item, idx) => item.sortOrder = idx);
    setState(prev => ({ ...prev, items: newItems, dirty: true }));
    closeContextMenu();
  }, [state.items, state.cpNo, setState, closeContextMenu]);
  
  // 행 아래에 추가
  const handleInsertRowBelow = useCallback((rowIdx: number, type: ContextMenuType, colKey?: string) => {
    const currentItem = state.items[rowIdx];
    
    // A, B열에서 행 추가 시: 병합 없이 A~S열까지 새로운 행 추가
    if (type === 'process' && (colKey === 'processNo' || colKey === 'processName')) {
      // A, B열에서 행 추가 시 고유한 값으로 설정하여 병합 방지
      const uniqueId = `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newItem = createEmptyItem(
        state.cpNo,
        uniqueId,  // A열: 고유값 (병합 방지)
        uniqueId   // B열: 고유값 (병합 방지)
      );
      // C~S열은 createEmptyItem에서 이미 기본값으로 초기화됨
      
      const newItems = [...state.items];
      newItems.splice(rowIdx + 1, 0, newItem);
      newItems.forEach((item, idx) => item.sortOrder = idx);
      setState(prev => ({ ...prev, items: newItems, dirty: true }));
      closeContextMenu();
      return;
    }
    
    // D열(processDesc)에서 행 추가 시: A, B열은 병합, C~S열은 새 행 추가
    if (type === 'process' && colKey === 'processDesc') {
      // 부모 행 찾기: 위쪽으로 올라가면서 processNo와 processName이 있는 행 찾기
      let parentProcessNo = '';
      let parentProcessName = '';
      for (let i = rowIdx; i >= 0; i--) {
        const item = state.items[i];
        if (item.processNo && item.processName && !item.processNo.startsWith('_') && !item.processName.startsWith('_')) {
          parentProcessNo = item.processNo;
          parentProcessName = item.processName;
          break;
        }
      }
      
      // D열에서 행 추가 시:
      // - A열(공정번호), B열(공정명): 부모 값으로 설정 (rowSpan 병합됨)
      // - C열(레벨)부터 S열까지: 기본값으로 초기화 (병합 없이 일반 셀로 생성)
      const newItem = createEmptyItem(
        state.cpNo,
        parentProcessNo,  // A열: 부모 값 (rowSpan 병합됨)
        parentProcessName  // B열: 부모 값 (rowSpan 병합됨)
      );
      // C~S열은 createEmptyItem에서 이미 기본값으로 초기화됨
      
      const newItems = [...state.items];
      newItems.splice(rowIdx + 1, 0, newItem);
      newItems.forEach((item, idx) => item.sortOrder = idx);
      setState(prev => ({ ...prev, items: newItems, dirty: true }));
      closeContextMenu();
      return;
    }
    
    // E, I열에서 행 추가 시: 부모 상속(병합)
    // 부모 행 찾기: 위쪽으로 올라가면서 processNo와 processName이 있는 행 찾기
    let parentProcessNo = '';
    let parentProcessName = '';
    for (let i = rowIdx; i >= 0; i--) {
      const item = state.items[i];
      if (item.processNo && item.processName && !item.processNo.startsWith('_') && !item.processName.startsWith('_')) {
        parentProcessNo = item.processNo;
        parentProcessName = item.processName;
        break;
      }
    }
    
    // E, I열에서 행 추가 시:
    // - A열(공정번호), B열(공정명): 부모 값으로 설정 (rowSpan 병합됨)
    // - C열(레벨), D열(공정설명): 현재 행의 값으로 설정 (E열에서 행 추가 시 병합됨)
    // - E열(설비/금형/JIG): E열에서 행 추가 시 빈 값, 나머지는 현재 행의 값
    // - 나머지 열: 기본값으로 초기화
    const newItem = createEmptyItem(
      state.cpNo,
      parentProcessNo,  // A열: 부모 값 (rowSpan 병합됨)
      parentProcessName  // B열: 부모 값 (rowSpan 병합됨)
    );
    
    // E열에서 행 추가 시: E열은 병합 없이 행만 추가, 상위 부모(A, B, C, D)는 독립적으로 병합
    if (type === 'work') {
      // E열에서 행 추가 시: C열(레벨), D열(공정설명)은 현재 행의 값으로 복사 (병합됨)
      newItem.processLevel = currentItem?.processLevel || '';
      newItem.processDesc = currentItem?.processDesc || '';
      // E열(workElement)은 빈 값으로 설정 (병합 안 됨, createEmptyItem에서 이미 빈 값)
      // A, B열은 부모 값으로 설정되어 독립적으로 병합됨
    } else if (type === 'char') {
      // I열에서 행 추가 시: 상위 부모들(A, B, C, D, E)은 병합 상태 유지, I열은 병합 없이 행만 추가
      // C열(레벨), D열(공정설명), E열(설비/금형/JIG)는 현재 행의 값으로 복사 (병합 유지)
      newItem.processLevel = currentItem?.processLevel || '';
      newItem.processDesc = currentItem?.processDesc || '';
      newItem.workElement = currentItem?.workElement || '';
      // I열(productChar)은 빈 값으로 설정 (병합 안 됨, createEmptyItem에서 이미 빈 값)
      // A, B열은 부모 값으로 설정되어 독립적으로 병합됨
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



