/**
 * @file useWorksheetState.ts
 * @description FMEA 워크시트 상태 관리 Hook
 * @author AI Assistant
 * @created 2025-12-27
 */

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  WorksheetState, 
  FMEAProject, 
  Process, 
  WorkElement,
  createInitialState, 
  uid 
} from '../constants';

interface FlatRow {
  l1Id: string;
  l1Name: string;
  l1Function: string;
  l1Requirement: string;
  l1FailureEffect: string;
  l1Severity: number | undefined;
  l2Id: string;
  l2No: string;
  l2Name: string;
  l2Function: string;
  l2ProductChar: string;
  l2FailureMode: string;
  l3Id: string;
  m4: string;
  l3Name: string;
  l3Function: string;
  l3ProcessChar: string;
  l3FailureCause: string;
}

interface UseWorksheetStateReturn {
  // 상태
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  lastSaved: string;
  
  // FMEA 프로젝트
  fmeaList: FMEAProject[];
  currentFmea: FMEAProject | null;
  selectedFmeaId: string | null;
  handleFmeaChange: (fmeaId: string) => void;
  
  // 평탄화된 행 데이터
  rows: FlatRow[];
  l1Spans: number[];
  l2Spans: number[];
  
  // 저장 관련
  saveToLocalStorage: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent) => void;
  handleInputBlur: () => void;
  
  // 선택/모달
  handleSelect: (type: 'L1' | 'L2' | 'L3', id: string | null) => void;
  
  // CRUD
  addL2: () => void;
  addL3: (l2Id: string) => void;
  deleteL2: (l2Id: string) => void;
  deleteL3: (l2Id: string, l3Id: string) => void;
  handleProcessSelect: (selectedProcesses: Array<{ processNo: string; processName: string }>) => void;
}

/**
 * FMEA 워크시트 상태 관리 Hook
 */
export function useWorksheetState(): UseWorksheetStateReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedFmeaId = searchParams.get('id');
  
  // 기본 상태
  const [state, setState] = useState<WorksheetState>(createInitialState);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('');
  
  // FMEA 프로젝트
  const [fmeaList, setFmeaList] = useState<FMEAProject[]>([]);
  const [currentFmea, setCurrentFmea] = useState<FMEAProject | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============ 자동저장 ============
  const saveToLocalStorage = useCallback(() => {
    if (!selectedFmeaId) return;
    
    setIsSaving(true);
    try {
      const worksheetData = {
        fmeaId: selectedFmeaId,
        l1: state.l1,
        l2: state.l2,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`pfmea_worksheet_${selectedFmeaId}`, JSON.stringify(worksheetData));
      setDirty(false);
      setLastSaved(new Date().toLocaleTimeString('ko-KR'));
      console.log('✅ 자동저장 완료:', new Date().toLocaleTimeString());
    } catch (e) {
      console.error('저장 오류:', e);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFmeaId, state.l1, state.l2]);

  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, 500);
  }, [saveToLocalStorage]);

  useEffect(() => {
    if (dirty) {
      triggerAutoSave();
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [dirty, triggerAutoSave]);

  // 저장된 데이터 로드
  useEffect(() => {
    if (selectedFmeaId) {
      const savedData = localStorage.getItem(`pfmea_worksheet_${selectedFmeaId}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.l1 && parsed.l2) {
            setState(prev => ({
              ...prev,
              l1: parsed.l1,
              l2: parsed.l2,
            }));
            console.log('📂 워크시트 데이터 로드됨:', parsed.savedAt);
          }
        } catch (e) {
          console.error('워크시트 데이터 로드 실패:', e);
        }
      }
    }
  }, [selectedFmeaId]);

  // FMEA 목록 로드
  useEffect(() => {
    const stored = localStorage.getItem('pfmea-projects');
    if (stored) {
      try {
        const projects: FMEAProject[] = JSON.parse(stored);
        setFmeaList(projects);
        
        if (selectedFmeaId) {
          const found = projects.find(p => p.id === selectedFmeaId);
          if (found) setCurrentFmea(found);
        } else if (projects.length > 0) {
          setCurrentFmea(projects[0]);
        }
      } catch (e) {
        console.error('FMEA 목록 로드 실패:', e);
      }
    }
  }, [selectedFmeaId]);

  // ============ 핸들러 ============
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveToLocalStorage();
    }
  }, [saveToLocalStorage]);

  const handleInputBlur = useCallback(() => {
    if (dirty) {
      saveToLocalStorage();
    }
  }, [dirty, saveToLocalStorage]);

  const handleFmeaChange = useCallback((fmeaId: string) => {
    router.push(`/pfmea/worksheet?id=${fmeaId}`);
  }, [router]);

  const handleSelect = useCallback((type: 'L1' | 'L2' | 'L3', id: string | null) => {
    setState(prev => ({ ...prev, selected: { type, id } }));
  }, []);

  // ============ CRUD ============
  const addL2 = useCallback(() => {
    const newProcess: Process = {
      id: uid(),
      no: '',
      name: '(클릭하여 공정 선택)',
      order: (state.l2.length + 1) * 10,
      l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10 }]
    };
    setState(prev => ({ ...prev, l2: [...prev.l2, newProcess] }));
    setDirty(true);
  }, [state.l2.length]);

  const addL3 = useCallback((l2Id: string) => {
    const newElement: WorkElement = {
      id: uid(),
      m4: '',
      name: '(클릭하여 작업요소 추가)',
      order: 10
    };
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(p => 
        p.id === l2Id 
          ? { ...p, l3: [...p.l3, newElement] }
          : p
      )
    }));
    setDirty(true);
  }, []);

  const deleteL2 = useCallback((l2Id: string) => {
    if (state.l2.length <= 1) {
      alert('최소 1개의 공정이 필요합니다.');
      return;
    }
    setState(prev => ({
      ...prev,
      l2: prev.l2.filter(p => p.id !== l2Id)
    }));
    setDirty(true);
  }, [state.l2.length]);

  const deleteL3 = useCallback((l2Id: string, l3Id: string) => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(p => {
        if (p.id === l2Id) {
          if (p.l3.length <= 1) {
            alert('최소 1개의 작업요소가 필요합니다.');
            return p;
          }
          return { ...p, l3: p.l3.filter(w => w.id !== l3Id) };
        }
        return p;
      })
    }));
    setDirty(true);
  }, []);

  const handleProcessSelect = useCallback((selectedProcesses: Array<{ processNo: string; processName: string }>) => {
    if (selectedProcesses.length === 0) return;
    
    const newProcesses: Process[] = selectedProcesses.map((p, idx) => ({
      id: uid(),
      no: p.processNo,
      name: p.processName,
      order: (state.l2.length + idx) * 10,
      l3: [{ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10 }]
    }));
    
    // 빈 공정 제거 후 추가
    setState(prev => {
      const filtered = prev.l2.filter(p => p.no !== '' && !p.name.includes('클릭'));
      return { ...prev, l2: [...filtered, ...newProcesses] };
    });
    setDirty(true);
  }, [state.l2.length]);

  // ============ 평탄화된 행 데이터 ============
  const rows = useMemo(() => {
    const result: FlatRow[] = [];
    
    state.l2.forEach((proc) => {
      proc.l3.forEach((we) => {
        result.push({
          l1Id: state.l1.id,
          l1Name: state.l1.name,
          l1Function: state.l1.function || '',
          l1Requirement: state.l1.requirement || '',
          l1FailureEffect: state.l1.failureEffect || '',
          l1Severity: state.l1.severity,
          l2Id: proc.id,
          l2No: proc.no,
          l2Name: proc.name,
          l2Function: proc.function || '',
          l2ProductChar: proc.productChar || '',
          l2FailureMode: proc.failureMode || '',
          l3Id: we.id,
          m4: we.m4,
          l3Name: we.name,
          l3Function: we.function || '',
          l3ProcessChar: we.processChar || '',
          l3FailureCause: we.failureCause || '',
        });
      });
    });
    
    return result;
  }, [state.l1, state.l2]);

  // L1/L2 병합 스팬 계산
  const l1Spans = useMemo(() => {
    return rows.map((_, idx) => idx === 0 ? rows.length : 0);
  }, [rows]);

  const l2Spans = useMemo(() => {
    const spans: number[] = [];
    let currentL2Id = '';
    let spanStart = 0;
    
    rows.forEach((row, idx) => {
      if (row.l2Id !== currentL2Id) {
        // 새로운 L2 시작
        if (currentL2Id !== '') {
          // 이전 L2의 스팬 설정
          for (let i = spanStart; i < idx; i++) {
            spans[i] = i === spanStart ? idx - spanStart : 0;
          }
        }
        currentL2Id = row.l2Id;
        spanStart = idx;
      }
    });
    
    // 마지막 L2 처리
    for (let i = spanStart; i < rows.length; i++) {
      spans[i] = i === spanStart ? rows.length - spanStart : 0;
    }
    
    return spans;
  }, [rows]);

  return {
    state,
    setState,
    dirty,
    setDirty,
    isSaving,
    lastSaved,
    fmeaList,
    currentFmea,
    selectedFmeaId,
    handleFmeaChange,
    rows,
    l1Spans,
    l2Spans,
    saveToLocalStorage,
    handleInputKeyDown,
    handleInputBlur,
    handleSelect,
    addL2,
    addL3,
    deleteL2,
    deleteL3,
    handleProcessSelect,
  };
}

