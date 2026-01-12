/**
 * @file page.tsx
 * @description Control Plan 워크시트 (PFMEA ALL화면과 동일한 형태)
 * 
 * 핵심 기능:
 * - PFMEA와 동일한 테이블 형태 (3줄 헤더 + 데이터 행)
 * - 24컬럼 구조
 * - 공정별 rowSpan 병합
 * - FMEA 연동 (fmeaId로 데이터 동기화)
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CPTopNav from '@/components/layout/CPTopNav';
import CPTopMenuBar from './components/CPTopMenuBar';
import CPTabMenu, { CPInputMode } from './components/CPTabMenu';
import { 
  CP_COLUMNS, CP_GROUPS, HEIGHTS, CELL_STYLE, COLORS,
  calculateGroupSpans, calculateTotalWidth,
  SPECIAL_CHAR_OPTIONS, FREQUENCY_OPTIONS, OWNER_OPTIONS, LEVEL_OPTIONS,
  CPColumnDef
} from './cpConstants';

// ============ 타입 정의 ============
interface CPItem {
  id: string;
  cpId: string;
  processNo: string;
  processName: string;
  processLevel: string;
  processDesc: string;
  workElement: string;
  detectorNo: boolean;
  detectorEp: boolean;
  detectorAuto: boolean;
  productChar: string;
  processChar: string;
  specialChar: string;
  specTolerance: string;
  evalMethod: string;
  sampleSize: string;
  sampleFreq: string;
  controlMethod: string;
  owner1: string;
  owner2: string;
  reactionPlan: string;
  sortOrder: number;
}

interface CPState {
  cpNo: string;
  fmeaId: string;
  fmeaNo: string;
  partName: string;
  customer: string;
  items: CPItem[];
  dirty: boolean;
}

// 빈 행 생성
function createEmptyItem(cpId: string, processNo: string = '', processName: string = ''): CPItem {
  return {
    id: `cpi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    cpId,
    processNo,
    processName,
    processLevel: 'Main',
    processDesc: '',
    workElement: '',
    detectorNo: false,
    detectorEp: false,
    detectorAuto: false,
    productChar: '',
    processChar: '',
    specialChar: '',
    specTolerance: '',
    evalMethod: '',
    sampleSize: '',
    sampleFreq: '',
    controlMethod: '',
    owner1: '',
    owner2: '',
    reactionPlan: '',
    sortOrder: 0,
  };
}

// ============ 메인 컴포넌트 ============
function CPWorksheetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const cpNoParam = searchParams.get('cpNo') || '';
  const fmeaIdParam = searchParams.get('fmeaId') || '';
  const syncMode = searchParams.get('sync') === 'true';
  
  const [state, setState] = useState<CPState>({
    cpNo: cpNoParam,
    fmeaId: fmeaIdParam,
    fmeaNo: '',
    partName: '',
    customer: '',
    items: [],
    dirty: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('all');
  const [inputMode, setInputMode] = useState<CPInputMode>('manual');
  
  // 그룹 스팬 계산
  const groupSpans = useMemo(() => calculateGroupSpans(CP_COLUMNS), []);
  const totalWidth = useMemo(() => calculateTotalWidth(), []);
  
  // Level 1: 공정번호+공정명 병합용 rowSpan
  const processRowSpan = useMemo(() => {
    const result: { isFirst: boolean; span: number }[] = [];
    let i = 0;
    
    while (i < state.items.length) {
      const currentItem = state.items[i];
      const processKey = `${currentItem.processNo}-${currentItem.processName}`;
      
      // 같은 공정의 연속 행 수 계산
      let span = 1;
      while (i + span < state.items.length) {
        const nextItem = state.items[i + span];
        const nextKey = `${nextItem.processNo}-${nextItem.processName}`;
        if (nextKey === processKey) {
          span++;
        } else {
          break;
        }
      }
      
      // 첫 번째 행은 isFirst=true, span 설정
      result[i] = { isFirst: true, span };
      // 나머지 행은 isFirst=false
      for (let j = 1; j < span; j++) {
        result[i + j] = { isFirst: false, span: 0 };
      }
      
      i += span;
    }
    
    return result;
  }, [state.items]);
  
  // Level 2: 레벨+공정설명 병합용 rowSpan (같은 공정 내에서)
  const descRowSpan = useMemo(() => {
    const result: { isFirst: boolean; span: number }[] = [];
    let i = 0;
    
    while (i < state.items.length) {
      const currentItem = state.items[i];
      // 공정번호+공정명+레벨+공정설명 조합으로 그룹핑
      const descKey = `${currentItem.processNo}-${currentItem.processName}-${currentItem.processLevel}-${currentItem.processDesc}`;
      
      // 같은 그룹의 연속 행 수 계산
      let span = 1;
      while (i + span < state.items.length) {
        const nextItem = state.items[i + span];
        const nextKey = `${nextItem.processNo}-${nextItem.processName}-${nextItem.processLevel}-${nextItem.processDesc}`;
        if (nextKey === descKey) {
          span++;
        } else {
          break;
        }
      }
      
      // 첫 번째 행은 isFirst=true, span 설정
      result[i] = { isFirst: true, span };
      // 나머지 행은 isFirst=false
      for (let j = 1; j < span; j++) {
        result[i + j] = { isFirst: false, span: 0 };
      }
      
      i += span;
    }
    
    return result;
  }, [state.items]);
  
  // Level 3: 설비/금형/JIG 병합용 rowSpan (같은 공정+설명+설비 내에서)
  const workRowSpan = useMemo(() => {
    const result: { isFirst: boolean; span: number }[] = [];
    let i = 0;
    
    while (i < state.items.length) {
      const currentItem = state.items[i];
      // 공정번호+공정명+레벨+공정설명+설비 조합으로 그룹핑
      const workKey = `${currentItem.processNo}-${currentItem.processName}-${currentItem.processLevel}-${currentItem.processDesc}-${currentItem.workElement}`;
      
      // 같은 그룹의 연속 행 수 계산
      let span = 1;
      while (i + span < state.items.length) {
        const nextItem = state.items[i + span];
        const nextKey = `${nextItem.processNo}-${nextItem.processName}-${nextItem.processLevel}-${nextItem.processDesc}-${nextItem.workElement}`;
        if (nextKey === workKey) {
          span++;
        } else {
          break;
        }
      }
      
      // 첫 번째 행은 isFirst=true, span 설정
      result[i] = { isFirst: true, span };
      // 나머지 행은 isFirst=false
      for (let j = 1; j < span; j++) {
        result[i + j] = { isFirst: false, span: 0 };
      }
      
      i += span;
    }
    
    return result;
  }, [state.items]);
  
  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // CP 데이터 로드
        if (cpNoParam) {
          const cpRes = await fetch(`/api/control-plan/${cpNoParam}`);
          if (cpRes.ok) {
            const cpData = await cpRes.json();
            if (cpData.success && cpData.data) {
              setState(prev => ({
                ...prev,
                cpNo: cpData.data.cpNo,
                fmeaId: cpData.data.fmeaId || fmeaIdParam,
                fmeaNo: cpData.data.fmeaNo || '',
                partName: cpData.data.partName || '',
                customer: cpData.data.customer || '',
                items: cpData.data.items || [],
              }));
            }
          }
        }
        
        // FMEA에서 동기화 모드인 경우
        if (syncMode && fmeaIdParam) {
          await syncFromFmea(fmeaIdParam);
        }
        
        // 빈 데이터인 경우 샘플 데이터 생성
        if (state.items.length === 0) {
          const sampleItems: CPItem[] = [
            { ...createEmptyItem(cpNoParam, '10', '프레스'), processDesc: '원료투입', workElement: '원료계량', productChar: '외관불량', processChar: '압력', specialChar: 'CC', specTolerance: '100±5kgf', evalMethod: '압력게이지', sampleSize: '5', sampleFreq: 'LOT', controlMethod: 'SPC', owner1: '생산', owner2: '', reactionPlan: '재작업', sortOrder: 0 },
            { ...createEmptyItem(cpNoParam, '10', '프레스'), processDesc: '성형', workElement: '금형작업', productChar: '치수불량', processChar: '온도', specialChar: 'SC', specTolerance: '180±10℃', evalMethod: '온도계', sampleSize: '3', sampleFreq: '1회/H', controlMethod: 'CP관리', owner1: '품질', owner2: '', reactionPlan: '조건조정', sortOrder: 1 },
            { ...createEmptyItem(cpNoParam, '20', '가류'), processDesc: '가열성형', workElement: '온도관리', productChar: '물성불량', processChar: '시간', specialChar: 'CC', specTolerance: '15±1min', evalMethod: '타이머', sampleSize: '전수', sampleFreq: '전수', controlMethod: '자동제어', owner1: '생산', owner2: '품질', reactionPlan: '폐기', sortOrder: 2 },
            { ...createEmptyItem(cpNoParam, '30', '검사'), processDesc: '품질검사', workElement: '외관검사', productChar: '외관결함', processChar: '-', specialChar: '', specTolerance: '외관기준', evalMethod: '육안검사', sampleSize: '전수', sampleFreq: '전수', controlMethod: '표준서', owner1: '품질', owner2: '', reactionPlan: '선별', sortOrder: 3 },
          ];
          setState(prev => ({ ...prev, items: sampleItems }));
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [cpNoParam, fmeaIdParam, syncMode]);
  
  // FMEA에서 데이터 동기화
  const syncFromFmea = async (fmeaId: string) => {
    try {
      const res = await fetch(`/api/pfmea/${fmeaId}`);
      if (!res.ok) return;
      
      const data = await res.json();
      if (!data.success || !data.data) return;
      
      const fmea = data.data;
      const newItems: CPItem[] = [];
      
      // L2 (공정) 데이터 매핑
      (fmea.l2 || []).forEach((proc: any, procIdx: number) => {
        // 제품특성별로 행 생성
        (proc.productChars || []).forEach((pc: any, pcIdx: number) => {
          newItems.push({
            ...createEmptyItem(cpNoParam, proc.no, proc.name),
            processDesc: proc.function || '',
            productChar: pc.name || '',
            specialChar: pc.specialChar || '',
            refSeverity: pc.severity || null,
            linkStatus: 'linked',
            sortOrder: newItems.length,
          });
        });
        
        // 제품특성이 없으면 공정당 1행
        if (!proc.productChars?.length) {
          newItems.push({
            ...createEmptyItem(cpNoParam, proc.no, proc.name),
            processDesc: proc.function || '',
            linkStatus: 'linked',
            sortOrder: newItems.length,
          });
        }
      });
      
      if (newItems.length > 0) {
        setState(prev => ({
          ...prev,
          fmeaNo: fmea.fmeaNo || fmeaId,
          partName: fmea.partName || fmea.project?.productName || '',
          customer: fmea.customer || fmea.project?.customer || '',
          items: newItems,
          dirty: true,
        }));
      }
    } catch (error) {
      console.error('FMEA 동기화 실패:', error);
    }
  };
  
  // 셀 값 변경
  const handleCellChange = useCallback((itemId: string, key: string, value: any) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, [key]: value } : item
      ),
      dirty: true,
    }));
  }, []);
  
  // 컨텍스트 메뉴 상태 (type: 'process' = 공정설명, 'work' = 설비/금형/JIG, 'char' = 제품특성)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    rowIdx: number;
    type: 'process' | 'work' | 'char';
  }>({ visible: false, x: 0, y: 0, rowIdx: -1, type: 'process' });
  
  // 자동 모드용 입력 모달 상태
  const [autoModal, setAutoModal] = useState<{
    visible: boolean;
    rowIdx: number;
    type: 'process' | 'work' | 'char';
    position: 'above' | 'below';
  }>({ visible: false, rowIdx: -1, type: 'process', position: 'below' });
  
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
  }, [state.items, state.cpNo]);
  
  // 행 위에 추가 (type에 따라 부모 필드 복사)
  const handleInsertRowAbove = useCallback((rowIdx: number, type: 'process' | 'work' | 'char') => {
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
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [state.items, state.cpNo]);
  
  // 행 아래에 추가 (type에 따라 부모 필드 복사)
  const handleInsertRowBelow = useCallback((rowIdx: number, type: 'process' | 'work' | 'char') => {
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
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [state.items, state.cpNo]);
  
  // 행 삭제
  const handleDeleteRow = useCallback((rowIdx: number) => {
    if (state.items.length <= 1) {
      alert('최소 1개의 행은 유지해야 합니다.');
      setContextMenu(prev => ({ ...prev, visible: false }));
      return;
    }
    const newItems = state.items.filter((_, idx) => idx !== rowIdx);
    // sortOrder 재정렬
    newItems.forEach((item, idx) => item.sortOrder = idx);
    setState(prev => ({ ...prev, items: newItems, dirty: true }));
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [state.items]);
  
  // 컨텍스트 메뉴 열기 (공정설명, 설비/금형/JIG, 제품특성 셀)
  const handleContextMenu = useCallback((e: React.MouseEvent, rowIdx: number, type: 'process' | 'work' | 'char') => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      rowIdx,
      type,
    });
  }, []);
  
  // 컨텍스트 메뉴 닫기
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);
  
  // 자동 모드: 셀 클릭 시 모달 열기
  const handleAutoModeClick = useCallback((rowIdx: number, type: 'process' | 'work' | 'char') => {
    setAutoModal({
      visible: true,
      rowIdx,
      type,
      position: 'below', // 기본값: 아래에 추가
    });
  }, []);
  
  // 자동 모드: 모달에서 행 추가
  const handleAutoModalInsert = useCallback(() => {
    const { rowIdx, type, position } = autoModal;
    if (position === 'above') {
      handleInsertRowAbove(rowIdx, type);
    } else {
      handleInsertRowBelow(rowIdx, type);
    }
    setAutoModal(prev => ({ ...prev, visible: false }));
  }, [autoModal, handleInsertRowAbove, handleInsertRowBelow]);
  
  // 저장
  const handleSave = async () => {
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
  };
  
  // 셀 렌더링
  const renderCell = (item: CPItem, col: CPColumnDef, rowIdx: number) => {
    const value = (item as any)[col.key];
    const bgColor = rowIdx % 2 === 0 ? col.cellColor : col.cellAltColor;
    
    const cellStyle: React.CSSProperties = {
      padding: CELL_STYLE.padding,
      fontSize: CELL_STYLE.fontSize,
      lineHeight: CELL_STYLE.lineHeight,
      background: bgColor,
      textAlign: col.align,
      border: '1px solid #ccc',
      minHeight: HEIGHTS.body,
      verticalAlign: 'middle',
    };
    
    // 공정번호, 공정명 - rowSpan 병합
    if (col.key === 'processNo' || col.key === 'processName') {
      const spanInfo = processRowSpan[rowIdx];
      if (!spanInfo?.isFirst) {
        return null; // 병합된 행은 렌더링 안함
      }
      return (
        <td 
          key={col.id} 
          style={{ ...cellStyle, verticalAlign: 'middle' }}
          rowSpan={spanInfo.span}
        >
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
            className="w-full bg-transparent outline-none text-center"
            style={{ fontSize: CELL_STYLE.fontSize }}
          />
        </td>
      );
    }
    
    // NO (공정별 특성 순번) - 같은 공정 내에서 1, 2, 3...
    if (col.key === 'charNo') {
      // 같은 공정(processNo + processName) 내에서 순번 계산
      const currentProcess = `${item.processNo}-${item.processName}`;
      let charIndex = 1;
      for (let i = 0; i < rowIdx; i++) {
        const prevItem = state.items[i];
        const prevProcess = `${prevItem.processNo}-${prevItem.processName}`;
        if (prevProcess === currentProcess) {
          charIndex++;
        }
      }
      return (
        <td key={col.id} style={cellStyle}>
          <span className="font-bold text-gray-700 text-[9px]">{charIndex}</span>
        </td>
      );
    }
    
    // 레벨 선택 - rowSpan 병합 (공정설명과 함께)
    if (col.key === 'processLevel') {
      const spanInfo = descRowSpan[rowIdx];
      if (!spanInfo?.isFirst) {
        return null; // 병합된 행은 렌더링 안함
      }
      return (
        <td key={col.id} style={{ ...cellStyle, verticalAlign: 'middle' }} rowSpan={spanInfo.span}>
          <select
            value={value || ''}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
            className="w-full bg-transparent text-center text-[9px] outline-none"
          >
            <option value="">-</option>
            {LEVEL_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </td>
      );
    }
    
    // Boolean 타입 (체크박스)
    if (col.type === 'boolean') {
      return (
        <td key={col.id} style={cellStyle}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.checked)}
            className="w-3 h-3"
          />
        </td>
      );
    }
    
    // 특별특성 선택
    if (col.key === 'specialChar') {
      const color = COLORS.special[value as keyof typeof COLORS.special] || '#666';
      return (
        <td key={col.id} style={cellStyle}>
          <select
            value={value || ''}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
            className="w-full bg-transparent text-center text-[9px] font-bold outline-none"
            style={{ color }}
          >
            {SPECIAL_CHAR_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </td>
      );
    }
    
    // 주기 선택
    if (col.key === 'sampleFreq') {
      return (
        <td key={col.id} style={cellStyle}>
          <select
            value={value || ''}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
            className="w-full bg-transparent text-center text-[9px] outline-none"
          >
            <option value="">-</option>
            {FREQUENCY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </td>
      );
    }
    
    // 책임1/책임2 선택
    if (col.key === 'owner1' || col.key === 'owner2') {
      return (
        <td key={col.id} style={cellStyle}>
          <select
            value={value || ''}
            onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
            className="w-full bg-transparent text-center text-[9px] outline-none"
          >
            <option value="">-</option>
            {OWNER_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </td>
      );
    }
    
    // 공정설명 - rowSpan 병합 + 수동(컨텍스트메뉴)/자동(클릭모달)
    if (col.key === 'processDesc') {
      const spanInfo = descRowSpan[rowIdx];
      if (!spanInfo?.isFirst) {
        return null; // 병합된 행은 렌더링 안함
      }
      return (
        <td 
          key={col.id} 
          style={{ 
            ...cellStyle, 
            cursor: inputMode === 'manual' ? 'context-menu' : 'pointer', 
            verticalAlign: 'middle',
            background: inputMode === 'auto' ? '#e3f2fd' : bgColor, // 자동모드 시 강조
          }}
          rowSpan={spanInfo.span}
          onContextMenu={inputMode === 'manual' ? (e) => handleContextMenu(e, rowIdx, 'process') : undefined}
          onClick={inputMode === 'auto' ? () => handleAutoModeClick(rowIdx, 'process') : undefined}
        >
          <div className="flex items-center gap-1">
            {inputMode === 'auto' && <span className="text-blue-500 text-[8px]">➕</span>}
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
              className="w-full bg-transparent outline-none"
              style={{ fontSize: CELL_STYLE.fontSize, textAlign: 'left' }}
              onClick={(e) => inputMode === 'auto' && e.stopPropagation()}
            />
          </div>
        </td>
      );
    }
    
    // 설비/금형/JIG - rowSpan 병합 + 수동(컨텍스트메뉴)/자동(클릭모달)
    if (col.key === 'workElement') {
      const spanInfo = workRowSpan[rowIdx];
      if (!spanInfo?.isFirst) {
        return null; // 병합된 행은 렌더링 안함
      }
      return (
        <td 
          key={col.id} 
          style={{ 
            ...cellStyle, 
            cursor: inputMode === 'manual' ? 'context-menu' : 'pointer', 
            verticalAlign: 'middle',
            background: inputMode === 'auto' ? '#e8f5e9' : bgColor, // 자동모드 시 강조
          }}
          rowSpan={spanInfo.span}
          onContextMenu={inputMode === 'manual' ? (e) => handleContextMenu(e, rowIdx, 'work') : undefined}
          onClick={inputMode === 'auto' ? () => handleAutoModeClick(rowIdx, 'work') : undefined}
        >
          <div className="flex items-center gap-1 justify-center">
            {inputMode === 'auto' && <span className="text-green-500 text-[8px]">➕</span>}
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
              className="w-full bg-transparent outline-none text-center"
              style={{ fontSize: CELL_STYLE.fontSize }}
              onClick={(e) => inputMode === 'auto' && e.stopPropagation()}
            />
          </div>
        </td>
      );
    }
    
    // 제품특성 - 수동(컨텍스트메뉴)/자동(클릭모달)
    if (col.key === 'productChar') {
      return (
        <td 
          key={col.id} 
          style={{ 
            ...cellStyle, 
            cursor: inputMode === 'manual' ? 'context-menu' : 'pointer',
            background: inputMode === 'auto' ? '#fff3e0' : bgColor, // 자동모드 시 강조
          }}
          onContextMenu={inputMode === 'manual' ? (e) => handleContextMenu(e, rowIdx, 'char') : undefined}
          onClick={inputMode === 'auto' ? () => handleAutoModeClick(rowIdx, 'char') : undefined}
        >
          <div className="flex items-center gap-1 justify-center">
            {inputMode === 'auto' && <span className="text-orange-500 text-[8px]">➕</span>}
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
              className="w-full bg-transparent outline-none text-center"
              style={{ fontSize: CELL_STYLE.fontSize }}
              onClick={(e) => inputMode === 'auto' && e.stopPropagation()}
            />
          </div>
        </td>
      );
    }
    
    // 기본 텍스트 입력 (중앙정렬)
    return (
      <td key={col.id} style={cellStyle}>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleCellChange(item.id, col.key, e.target.value)}
          className="w-full bg-transparent outline-none"
          style={{ fontSize: CELL_STYLE.fontSize, textAlign: 'center' }}
        />
      </td>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }
  
  // CP 리스트 (TODO: API에서 가져오기)
  const cpList: any[] = [];
  
  return (
    <>
      <CPTopNav selectedCpId={state.cpNo} />
      
      {/* 상단 메뉴바 */}
      <CPTopMenuBar
        cpList={cpList}
        selectedCpId={state.cpNo}
        fmeaId={state.fmeaId}
        dirty={state.dirty}
        isSaving={saveStatus === 'saving'}
        itemCount={state.items.length}
        onCpChange={(id) => {
          if (id === '__NEW__') {
            setState(prev => ({ ...prev, cpNo: '', items: [], dirty: false }));
          } else {
            // TODO: Load CP data
          }
        }}
        onSave={handleSave}
        onSync={() => state.fmeaId && syncFromFmea(state.fmeaId)}
        onExport={() => { /* TODO: Export */ }}
        onImportClick={() => { /* TODO: Import */ }}
        onAddRow={handleAddRow}
      />
      
      {/* 탭 메뉴 */}
      <CPTabMenu
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        cpNo={state.cpNo}
        fmeaId={state.fmeaId}
        itemCount={state.items.length}
        dirty={state.dirty}
      />
      
      {/* 메인 콘텐츠 (TopNav 32px + MenuBar 32px + TabMenu 36px = 100px = pt-[100px]) */}
      <div className="min-h-screen bg-[#f5f7fa] px-0 py-0 pt-[100px] font-[Malgun_Gothic]">
        {/* 테이블 - 반응형 (tableLayout: auto) */}
        <div className="overflow-auto bg-white border-t border-gray-300" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          <table 
            className="border-collapse w-full"
            style={{ tableLayout: 'auto', minWidth: totalWidth }}
          >
            {/* 1행: 그룹 헤더 */}
            <thead>
              <tr>
                {groupSpans.map((g, idx) => (
                  <th
                    key={idx}
                    colSpan={g.span}
                    style={{
                      background: g.color,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '11px',
                      height: HEIGHTS.header1,
                      border: '1px solid #fff',
                      textAlign: 'center',
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
                    }}
                  >
                    {g.group}
                  </th>
                ))}
              </tr>
              
              {/* 2행: 컬럼명 헤더 - 반응형 (minWidth 사용) */}
              <tr>
                {CP_COLUMNS.map(col => (
                  <th
                    key={col.id}
                    style={{
                      minWidth: col.width,
                      background: col.headerColor,
                      color: '#333',
                      fontWeight: 600,
                      fontSize: '10px',
                      height: HEIGHTS.header2,
                      border: '1px solid #ccc',
                      textAlign: 'center',
                      position: 'sticky',
                      top: HEIGHTS.header1,
                      zIndex: 19,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.name}
                    {col.pfmeaSync && <span className="ml-0.5 text-blue-600">*</span>}
                  </th>
                ))}
              </tr>
              
              {/* 3행: 열번호 (A, B, C...) */}
              <tr>
                {CP_COLUMNS.map((col, idx) => (
                  <th
                    key={`col-${col.id}`}
                    style={{
                      background: '#e0e0e0',
                      color: '#555',
                      fontWeight: 600,
                      fontSize: '9px',
                      height: HEIGHTS.header3,
                      border: '1px solid #ccc',
                      textAlign: 'center',
                      position: 'sticky',
                      top: HEIGHTS.header1 + HEIGHTS.header2,
                      zIndex: 18,
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* 데이터 행 */}
            <tbody>
              {state.items.map((item, rowIdx) => (
                <tr key={item.id}>
                  {CP_COLUMNS.map(col => renderCell(item, col, rowIdx))}
                </tr>
              ))}
              
              {/* 빈 행 */}
              {state.items.length === 0 && (
                <tr>
                  <td 
                    colSpan={CP_COLUMNS.length} 
                    className="text-center text-gray-400 py-10"
                  >
                    데이터가 없습니다. "행 추가" 또는 "FMEA 동기화"를 클릭하세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 컨텍스트 메뉴 */}
      {contextMenu.visible && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div 
            className="fixed inset-0 z-[200]" 
            onClick={closeContextMenu}
            onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
          />
          {/* 메뉴 */}
          <div 
            className="fixed z-[201] bg-white border border-gray-300 rounded shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="px-3 py-1 text-[10px] text-gray-500 border-b border-gray-100">
              {contextMenu.type === 'process' ? '📋 공정설명 기준' : 
               contextMenu.type === 'work' ? '🔧 설비/금형/JIG 기준' : 
               '📊 제품특성 기준'}
            </div>
            <button
              onClick={() => handleInsertRowAbove(contextMenu.rowIdx, contextMenu.type)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center gap-2"
            >
              ⬆️ 위로 행 추가
            </button>
            <button
              onClick={() => handleInsertRowBelow(contextMenu.rowIdx, contextMenu.type)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center gap-2"
            >
              ⬇️ 아래로 행 추가
            </button>
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={() => handleDeleteRow(contextMenu.rowIdx)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              🗑️ 행 삭제
            </button>
          </div>
        </>
      )}
      
      {/* 자동 모드 입력 모달 */}
      {autoModal.visible && (
        <>
          {/* 배경 */}
          <div 
            className="fixed inset-0 bg-black/50 z-[300]"
            onClick={() => setAutoModal(prev => ({ ...prev, visible: false }))}
          />
          {/* 모달 */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] bg-white rounded-lg shadow-2xl p-4 min-w-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="text-lg font-bold text-gray-800">자동 행 추가</h3>
            </div>
            
            {/* 기준 정보 */}
            <div className="bg-gray-50 rounded p-3 mb-4 text-xs">
              <div className="font-bold text-gray-600 mb-2">
                {autoModal.type === 'process' ? '📋 공정설명 기준' : 
                 autoModal.type === 'work' ? '🔧 설비/금형/JIG 기준' : 
                 '📊 제품특성 기준'}
              </div>
              <div className="text-gray-500">
                복사될 부모 필드: 
                {autoModal.type === 'process' && ' 공정번호, 공정명'}
                {autoModal.type === 'work' && ' 공정번호, 공정명, 레벨, 공정설명'}
                {autoModal.type === 'char' && ' 공정번호, 공정명, 레벨, 공정설명, 설비/금형/JIG'}
              </div>
            </div>
            
            {/* 위치 선택 */}
            <div className="mb-4">
              <label className="text-sm font-bold text-gray-700 block mb-2">추가 위치</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAutoModal(prev => ({ ...prev, position: 'above' }))}
                  className={`flex-1 py-2 px-3 rounded text-sm font-bold transition-all ${
                    autoModal.position === 'above' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ⬆️ 위로
                </button>
                <button
                  onClick={() => setAutoModal(prev => ({ ...prev, position: 'below' }))}
                  className={`flex-1 py-2 px-3 rounded text-sm font-bold transition-all ${
                    autoModal.position === 'below' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ⬇️ 아래로
                </button>
              </div>
            </div>
            
            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setAutoModal(prev => ({ ...prev, visible: false }))}
                className="flex-1 py-2 px-4 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-bold"
              >
                취소
              </button>
              <button
                onClick={handleAutoModalInsert}
                className="flex-1 py-2 px-4 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm font-bold"
              >
                ✅ 행 추가
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Suspense wrapper
export default function ControlPlanWorksheetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">로딩 중...</div>}>
      <CPWorksheetContent />
    </Suspense>
  );
}
