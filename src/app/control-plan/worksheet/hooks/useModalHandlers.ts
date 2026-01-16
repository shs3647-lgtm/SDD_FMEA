/**
 * @file hooks/useModalHandlers.ts
 * @description CP 워크시트 모달 상태 및 핸들러 훅
 * @line-count ~280줄
 */

import { useState, useCallback } from 'react';
import { CPItem, ContextMenuType } from '../types';
import { createEmptyItem } from '../utils';
import { CP_COLUMNS } from '../cpConstants';

// ============ 타입 정의 ============
export interface ProcessModalState {
  visible: boolean;
  rowIdx: number;
  isEmptyRow: boolean;
}

export interface ProcessDescModalState {
  visible: boolean;
  rowIdx: number;
  processNo: string;
  processName: string;
}

export interface EquipmentModalState {
  visible: boolean;
  rowIdx: number;
  processNo: string;
  processName: string;
}

export interface StandardModalState {
  visible: boolean;
  rowIdx: number;
  columnKey: string;
  columnName: string;
  processNo: string;
  processName: string;
}

export interface AutoModalState {
  visible: boolean;
  rowIdx: number;
  type: ContextMenuType;
  position: 'above' | 'below';
}

interface UseModalHandlersProps {
  items: CPItem[];
  cpNo: string;
  setState: React.Dispatch<React.SetStateAction<any>>;
  handleCellChange: (itemId: string, key: string, value: any) => void;
  handleInsertRowAbove: (rowIdx: number, type: ContextMenuType) => void;
  handleInsertRowBelow: (rowIdx: number, type: ContextMenuType, colKey?: string) => void;
}

// ============ 메인 훅 ============
export function useModalHandlers({
  items,
  cpNo,
  setState,
  handleCellChange,
  handleInsertRowAbove,
  handleInsertRowBelow,
}: UseModalHandlersProps) {
  
  // ============ 모달 상태 ============
  const [autoModal, setAutoModal] = useState<AutoModalState>({
    visible: false,
    rowIdx: -1,
    type: 'process',
    position: 'below',
  });
  
  const [processModal, setProcessModal] = useState<ProcessModalState>({
    visible: false,
    rowIdx: -1,
    isEmptyRow: false,
  });
  
  const [processDescModal, setProcessDescModal] = useState<ProcessDescModalState>({
    visible: false,
    rowIdx: -1,
    processNo: '',
    processName: '',
  });
  
  const [equipmentModal, setEquipmentModal] = useState<EquipmentModalState>({
    visible: false,
    rowIdx: -1,
    processNo: '',
    processName: '',
  });
  
  const [standardModal, setStandardModal] = useState<StandardModalState>({
    visible: false,
    rowIdx: -1,
    columnKey: '',
    columnName: '',
    processNo: '',
    processName: '',
  });
  
  // ============ 셀 클릭 핸들러 (통합 모드) ============
  const handleAutoModeClick = useCallback((rowIdx: number, type: ContextMenuType, colKey?: string) => {
    console.log('🔥 handleAutoModeClick 호출됨:', { rowIdx, type, colKey });
    
    // 공정명 셀 클릭 시 ProcessFlowInputModal 열기
    if (type === 'process' && colKey === 'processName') {
      const item = items[rowIdx];
      const isEmptyRow = !item?.processName || item.processName.startsWith('_');
      setProcessModal({ visible: true, rowIdx, isEmptyRow });
    } 
    // 공정설명 셀 클릭 시 ProcessDescInputModal 열기
    else if (type === 'process' && colKey === 'processDesc') {
      const item = items[rowIdx];
      if (item && item.processNo && item.processName) {
        setProcessDescModal({ 
          visible: true, 
          rowIdx,
          processNo: item.processNo,
          processName: item.processName,
        });
      }
    } 
    // 설비/금형/JIG 셀 클릭 시 EquipmentInputModal 열기
    else if (type === 'work') {
      const item = items[rowIdx];
      if (item && item.processNo && item.processName) {
        setEquipmentModal({ 
          visible: true, 
          rowIdx,
          processNo: item.processNo,
          processName: item.processName,
        });
      }
    }
    // 제품특성, 공정특성 등 텍스트 컬럼
    else if (type === 'char' || type === 'general') {
      const item = items[rowIdx];
      const skipColumns = ['processLevel', 'specialChar', 'sampleFreq', 'owner1', 'owner2', 'detectorEp', 'detectorAuto', 'charNo', 'rowNo'];
      if (colKey && !skipColumns.includes(colKey)) {
        const colDef = CP_COLUMNS.find(c => c.key === colKey);
        const columnName = colDef?.name || colKey;
        
        setStandardModal({
          visible: true,
          rowIdx,
          columnKey: colKey,
          columnName,
          processNo: item?.processNo || '',
          processName: item?.processName || '',
        });
      } else {
        setAutoModal({ visible: true, rowIdx, type, position: 'below' });
      }
    }
    else {
      setAutoModal({ visible: true, rowIdx, type, position: 'below' });
    }
  }, [items]);
  
  // ============ 설비 모달 핸들러 ============
  const handleEquipmentSave = useCallback((selectedEquip: any) => {
    const targetRowIdx = equipmentModal.rowIdx;
    if (targetRowIdx < 0 || targetRowIdx >= items.length) return;
    
    const itemId = items[targetRowIdx].id;
    handleCellChange(itemId, 'workElement', selectedEquip.name);
    setEquipmentModal(prev => ({ ...prev, visible: false }));
  }, [equipmentModal.rowIdx, items, handleCellChange]);
  
  // ============ 범용 입력 모달 핸들러 ============
  const handleStandardModalSave = useCallback((value: string) => {
    const targetRowIdx = standardModal.rowIdx;
    const colKey = standardModal.columnKey;
    if (targetRowIdx < 0 || targetRowIdx >= items.length || !colKey) return;
    
    const itemId = items[targetRowIdx].id;
    handleCellChange(itemId, colKey, value);
    setStandardModal(prev => ({ ...prev, visible: false }));
  }, [standardModal.rowIdx, standardModal.columnKey, items, handleCellChange]);
  
  // ============ 공정명 모달 핸들러 (기본 정보만 자동 입력) ============
  const handleProcessSave = useCallback((selectedProcesses: any[]) => {
    if (selectedProcesses.length === 0) return;
    
    const targetRowIdx = processModal.rowIdx;
    
    setState((prev: any) => {
      const newItems = [...prev.items];
      
      selectedProcesses.forEach((process, idx) => {
        // cpData가 있으면 기본 데이터 사용, 없으면 기본값
        const cpData = process.cpData || {};
        
        if (idx === 0 && targetRowIdx >= 0 && targetRowIdx < newItems.length) {
          // ★ 첫 번째 공정: 현재 행 업데이트 (공정 기본 정보 A~E열만)
          // 특성 정보(I열 이후)는 기존 값 유지
          newItems[targetRowIdx] = {
            ...newItems[targetRowIdx],
            processNo: cpData.processNo || process.no,
            processName: cpData.processName || process.name,
            processDesc: cpData.processDesc || newItems[targetRowIdx].processDesc || '',
            workElement: cpData.workElement || newItems[targetRowIdx].workElement || '',
            // ★ 특성 관련 정보는 기존 값 유지 (1:N 관계)
          };
        } else {
          // ★ 나머지 공정: 새 행 추가 (공정 기본 정보만)
          const newItem = createEmptyItem(prev.cpNo, cpData.processNo || process.no, cpData.processName || process.name);
          newItem.processDesc = cpData.processDesc || '';
          newItem.workElement = cpData.workElement || '';
          // ★ 특성 정보는 빈 값 (사용자가 별도 입력)
          newItem.sortOrder = newItems.length;
          
          if (idx === 1 && targetRowIdx >= 0 && targetRowIdx < newItems.length) {
            newItems.splice(targetRowIdx + 1, 0, newItem);
          } else {
            newItems.push(newItem);
          }
        }
      });
      
      newItems.forEach((item, idx) => item.sortOrder = idx);
      
      return { ...prev, items: newItems, dirty: true };
    });
    
    setProcessModal({ visible: false, rowIdx: -1, isEmptyRow: false });
  }, [processModal.rowIdx, setState]);
  
  // ============ 공정설명 모달 핸들러 ============
  const handleProcessDescSave = useCallback((selectedDesc: any) => {
    const targetRowIdx = processDescModal.rowIdx;
    
    if (targetRowIdx >= 0 && targetRowIdx < items.length) {
      setState((prev: any) => ({
        ...prev,
        items: prev.items.map((item: CPItem, idx: number) => {
          if (idx === targetRowIdx) {
            return { ...item, processDesc: selectedDesc.name };
          }
          return item;
        }),
        dirty: true,
      }));
    }
    
    setProcessDescModal({ visible: false, rowIdx: -1, processNo: '', processName: '' });
  }, [processDescModal.rowIdx, items, setState]);
  
  // ============ 공정설명 연속 입력 핸들러 ============
  const handleProcessDescContinuousAdd = useCallback((desc: any, addNewRow: boolean) => {
    const targetRowIdx = processDescModal.rowIdx;
    
    if (targetRowIdx >= 0 && targetRowIdx < items.length) {
      setState((prev: any) => ({
        ...prev,
        items: prev.items.map((item: CPItem, idx: number) => {
          if (idx === targetRowIdx) {
            return { ...item, processDesc: desc.name };
          }
          return item;
        }),
        dirty: true,
      }));
      
      if (addNewRow) {
        const newItem = {
          ...items[targetRowIdx],
          id: `item_${Date.now()}`,
          processDesc: '',
          sortOrder: items.length,
        };
        setState((prev: any) => ({
          ...prev,
          items: [...prev.items, newItem],
          dirty: true,
        }));
        
        setProcessDescModal({ 
          visible: true, 
          rowIdx: targetRowIdx + 1,
          processNo: processDescModal.processNo,
          processName: processDescModal.processName,
        });
      }
    }
  }, [processDescModal, items, setState]);
  
  // ============ 공정명 연속 입력 핸들러 ============
  const handleProcessContinuousAdd = useCallback((process: any, addNewRow: boolean) => {
    const targetRowIdx = processModal.rowIdx;
    
    if (targetRowIdx >= 0 && targetRowIdx < items.length) {
      setState((prev: any) => ({
        ...prev,
        items: prev.items.map((item: CPItem, idx: number) => {
          if (idx === targetRowIdx) {
            return { ...item, processNo: process.no, processName: process.name };
          }
          return item;
        }),
        dirty: true,
      }));
      
      if (addNewRow) {
        const newItem = {
          ...items[targetRowIdx],
          id: `item_${Date.now()}`,
          processNo: '',
          processName: '',
          sortOrder: items.length,
        };
        setState((prev: any) => ({
          ...prev,
          items: [...prev.items, newItem],
          dirty: true,
        }));
        
        setProcessModal({ visible: true, rowIdx: targetRowIdx + 1, isEmptyRow: true });
      }
    }
  }, [processModal.rowIdx, items, setState]);
  
  // ============ 엔터 키 핸들러 (항상 행 추가) ============
  const handleEnterKey = useCallback((rowIdx: number, type: ContextMenuType, colKey?: string) => {
    handleInsertRowBelow(rowIdx, type, colKey);
  }, [handleInsertRowBelow]);
  
  // ============ 자동 모달 행 추가 핸들러 ============
  const handleAutoModalInsert = useCallback(() => {
    const { rowIdx, type, position } = autoModal;
    if (position === 'above') {
      handleInsertRowAbove(rowIdx, type);
    } else {
      handleInsertRowBelow(rowIdx, type);
    }
    setAutoModal(prev => ({ ...prev, visible: false }));
  }, [autoModal, handleInsertRowAbove, handleInsertRowBelow]);
  
  // ============ 모달 닫기 핸들러 ============
  const closeProcessModal = useCallback(() => {
    setProcessModal({ visible: false, rowIdx: -1, isEmptyRow: false });
  }, []);
  
  const closeProcessDescModal = useCallback(() => {
    setProcessDescModal({ visible: false, rowIdx: -1, processNo: '', processName: '' });
  }, []);
  
  const closeEquipmentModal = useCallback(() => {
    setEquipmentModal({ visible: false, rowIdx: -1, processNo: '', processName: '' });
  }, []);
  
  const closeStandardModal = useCallback(() => {
    setStandardModal({ visible: false, rowIdx: -1, columnKey: '', columnName: '', processNo: '', processName: '' });
  }, []);
  
  const closeAutoModal = useCallback(() => {
    setAutoModal(prev => ({ ...prev, visible: false }));
  }, []);
  
  return {
    // 모달 상태
    autoModal,
    processModal,
    processDescModal,
    equipmentModal,
    standardModal,
    
    // 모달 setter (position 변경 등)
    setAutoModal,
    
    // 핸들러
    handleAutoModeClick,
    handleEquipmentSave,
    handleStandardModalSave,
    handleProcessSave,
    handleProcessDescSave,
    handleProcessDescContinuousAdd,
    handleProcessContinuousAdd,
    handleEnterKey,
    handleAutoModalInsert,
    
    // 닫기 핸들러
    closeProcessModal,
    closeProcessDescModal,
    closeEquipmentModal,
    closeStandardModal,
    closeAutoModal,
  };
}
