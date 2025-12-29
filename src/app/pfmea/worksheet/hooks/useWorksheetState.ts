/**
 * @file useWorksheetState.ts
 * @description FMEA 워크시트 상태 관리 Hook (원자성 데이터 및 분리 탭 반영)
 */

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  WorksheetState, 
  FMEAProject, 
  Process, 
  WorkElement,
  FlatRow,
  createInitialState, 
  uid 
} from '../constants';

interface UseWorksheetStateReturn {
  state: WorksheetState;
  setState: React.Dispatch<React.SetStateAction<WorksheetState>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  lastSaved: string;
  fmeaList: FMEAProject[];
  currentFmea: FMEAProject | null;
  selectedFmeaId: string | null;
  handleFmeaChange: (fmeaId: string) => void;
  rows: FlatRow[];
  l1Spans: number[];
  l1TypeSpans: number[];
  l1FuncSpans: number[];
  l2Spans: number[];
  saveToLocalStorage: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent) => void;
  handleInputBlur: () => void;
  handleSelect: (type: 'L1' | 'L2' | 'L3', id: string | null) => void;
  addL2: () => void;
  addL3: (l2Id: string) => void;
  deleteL2: (l2Id: string) => void;
  deleteL3: (l2Id: string, l3Id: string) => void;
  handleProcessSelect: (selectedProcesses: Array<{ processNo: string; processName: string }>) => void;
}

export function useWorksheetState(): UseWorksheetStateReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedFmeaId = searchParams.get('id');
  
  const [state, setState] = useState<WorksheetState>(createInitialState);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('');
  const [fmeaList, setFmeaList] = useState<FMEAProject[]>([]);
  const [currentFmea, setCurrentFmea] = useState<FMEAProject | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveToLocalStorage = useCallback(() => {
    // currentFmea가 있으면 그 ID 사용, 없으면 selectedFmeaId 사용
    const targetId = selectedFmeaId || currentFmea?.id;
    if (!targetId) {
      console.warn('[저장] FMEA ID가 없어 저장할 수 없습니다. FMEA를 먼저 선택하세요.');
      return;
    }
    
    setIsSaving(true);
    try {
      const worksheetData = {
        fmeaId: targetId,
        l1: state.l1,
        l2: state.l2,
        tab: state.tab, // 현재 탭 저장
        // 구조분석 확정 상태
        structureConfirmed: (state as any).structureConfirmed || false,
        // 기능분석 확정 상태
        l1Confirmed: (state as any).l1Confirmed || false,
        l2Confirmed: (state as any).l2Confirmed || false,
        l3Confirmed: (state as any).l3Confirmed || false,
        // 고장분석 확정 상태
        failureL1Confirmed: (state as any).failureL1Confirmed || false,
        failureL2Confirmed: (state as any).failureL2Confirmed || false,
        failureL3Confirmed: (state as any).failureL3Confirmed || false,
        // 고장연결 데이터 (영구 저장)
        failureLinks: (state as any).failureLinks || [],
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`pfmea_worksheet_${targetId}`, JSON.stringify(worksheetData));
      // 고장형태 저장 확인 로그
      const l2WithModes = state.l2.filter((p: any) => (p.failureModes || []).length > 0);
      console.log('[저장] 워크시트 데이터 저장 완료:', targetId, '탭:', state.tab);
      console.log('[저장] 고장형태 있는 공정 수:', l2WithModes.length, l2WithModes.map((p: any) => `${p.name}: ${(p.failureModes || []).length}개`));
      setDirty(false);
      setLastSaved(new Date().toLocaleTimeString('ko-KR'));
    } catch (e) { console.error('저장 오류:', e); }
    finally { setIsSaving(false); }
  }, [selectedFmeaId, currentFmea?.id, state.l1, state.l2, state.tab, (state as any).failureLinks]);

  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToLocalStorage(), 500);
  }, [saveToLocalStorage]);

  useEffect(() => {
    if (dirty) triggerAutoSave();
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [dirty, triggerAutoSave]);

  // FMEA 목록 로드 및 자동 선택
  useEffect(() => {
    const stored = localStorage.getItem('pfmea-projects');
    if (stored) {
      try {
        const projects: FMEAProject[] = JSON.parse(stored);
        setFmeaList(projects);
        
        if (selectedFmeaId) {
          // URL에 ID가 있으면 해당 FMEA 선택
          const found = projects.find(p => p.id === selectedFmeaId);
          if (found) setCurrentFmea(found);
        } else if (projects.length > 0) {
          // URL에 ID가 없으면 첫 번째 FMEA 자동 선택 및 리다이렉트
          setCurrentFmea(projects[0]);
          router.push(`/pfmea/worksheet?id=${projects[0].id}`);
        }
      } catch (e) { console.error('FMEA 목록 로드 실패:', e); }
    }
  }, [selectedFmeaId, router]);

  // 워크시트 데이터 로드 (FMEA ID 변경 시)
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedFmeaId) return;
    
    console.log('[워크시트] 데이터 로드 시작:', selectedFmeaId);
    // 키 명칭 통일 시도: pfmea_worksheet_... 와 fmea-worksheet-... 둘 다 확인
    const keys = [`pfmea_worksheet_${selectedFmeaId}`, `fmea-worksheet-${selectedFmeaId}`];
    let savedData = null;
    for (const key of keys) {
      savedData = localStorage.getItem(key);
      if (savedData) break;
    }
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('[워크시트] 저장된 데이터 발견:', parsed);
        
        if (parsed.l1 && parsed.l2) {
          // [데이터 마이그레이션 및 방어 코드]
          const migratedL1 = {
            ...parsed.l1,
            types: parsed.l1.types || []
          };
          
          const migratedL2 = parsed.l2.map((p: any) => ({
            ...p,
            functions: p.functions || [],
            productChars: p.productChars || [],
            failureModes: p.failureModes || [], 
            l3: (p.l3 || []).map((we: any) => ({
              ...we,
              m4: we.m4 === 'MT' ? 'IM' : (we.m4 || ''),
              functions: we.functions || [],
              processChars: we.processChars || [],
              failureCauses: we.failureCauses || [] 
            }))
          }));

          setState(prev => ({ 
            ...prev, 
            l1: migratedL1, 
            l2: migratedL2,
            failureLinks: parsed.failureLinks || [], // 고장연결 데이터 복구
            tab: parsed.tab || prev.tab,
            structureConfirmed: parsed.structureConfirmed || false,
            l1Confirmed: parsed.l1Confirmed || false,
            l2Confirmed: parsed.l2Confirmed || false,
            l3Confirmed: parsed.l3Confirmed || false,
            failureL1Confirmed: parsed.failureL1Confirmed || false,
            failureL2Confirmed: parsed.failureL2Confirmed || false,
            failureL3Confirmed: parsed.failureL3Confirmed || false,
          }));
          setDirty(false);
        }
      } catch (e) {
        console.error('데이터 파싱 오류:', e);
      }
    } else {
      console.log('[워크시트] 저장된 데이터 없음, 초기화 진행');
      // 데이터가 아예 없는 경우 기본 틀 생성
      setState(prev => ({
        ...prev,
        l1: { id: uid(), name: '', types: [], failureScopes: [] },
        l2: [{
          id: uid(), no: '', name: '(클릭하여 공정 선택)', order: 10, functions: [], productChars: [],
          l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10, functions: [], processChars: [] }]
        }],
        failureLinks: [],
        structureConfirmed: false
      }));
    }
  }, [selectedFmeaId]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); saveToLocalStorage(); }
  }, [saveToLocalStorage]);

  const handleInputBlur = useCallback(() => { if (dirty) saveToLocalStorage(); }, [dirty, saveToLocalStorage]);

  const handleFmeaChange = useCallback((fmeaId: string) => {
    if (fmeaId === '__NEW__') {
      setState(createInitialState());
      setCurrentFmea(null);
      setDirty(false);
      router.push('/pfmea/worksheet');
    } else { router.push(`/pfmea/worksheet?id=${fmeaId}`); }
  }, [router]);

  const handleSelect = useCallback((type: 'L1' | 'L2' | 'L3', id: string | null) => {
    setState(prev => ({ ...prev, selected: { type, id } }));
  }, []);

  const addL2 = useCallback(() => {
    const newProcess: Process = {
      id: uid(), no: '', name: '(클릭하여 공정 선택)', order: (state.l2.length + 1) * 10,
      functions: [], productChars: [],
      l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10, functions: [], processChars: [] }]
    };
    setState(prev => ({ ...prev, l2: [...prev.l2, newProcess] }));
    setDirty(true);
  }, [state.l2.length]);

  const addL3 = useCallback((l2Id: string) => {
    const newElement: WorkElement = { id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10, functions: [], processChars: [] };
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(p => p.id === l2Id ? { ...p, l3: [...p.l3, newElement] } : p)
    }));
    setDirty(true);
  }, []);

  const deleteL2 = useCallback((l2Id: string) => {
    if (state.l2.length <= 1) { alert('최소 1개의 공정이 필요합니다.'); return; }
    setState(prev => ({ ...prev, l2: prev.l2.filter(p => p.id !== l2Id) }));
    setDirty(true);
  }, [state.l2.length]);

  const deleteL3 = useCallback((l2Id: string, l3Id: string) => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(p => {
        if (p.id === l2Id) {
          if (p.l3.length <= 1) { alert('최소 1개의 작업요소가 필요합니다.'); return p; }
          return { ...p, l3: p.l3.filter(w => w.id !== l3Id) };
        }
        return p;
      })
    }));
    setDirty(true);
  }, []);

  /**
   * 공정 선택 핸들러 - 완전히 재작성 (TDD Case 1)
   * 
   * 동작:
   * 1. 선택된 공정만 유지 (선택 해제된 공정 + 하위 작업요소 완전 삭제)
   * 2. 새로 선택된 공정 추가 (기존에 없던 것만)
   * 3. 최소 1개 공정 보장
   */
  const handleProcessSelect = useCallback((selectedProcesses: Array<{ processNo: string; processName: string }>) => {
    const selectedNames = new Set(selectedProcesses.map(p => p.processName));
    
    setState(prev => {
      // 1. 기존 공정 중 선택된 것만 유지 (선택 해제된 공정은 하위 l3 포함 삭제)
      const keptProcesses = prev.l2.filter(p => {
        // placeholder 공정은 무조건 제거
        if (!p.name || p.name.includes('클릭') || p.name.includes('선택')) {
          return false;
        }
        // 선택 목록에 있으면 유지
        return selectedNames.has(p.name);
      });
      
      // 2. 새로 추가할 공정 (기존에 없던 것만)
      const existingNames = new Set(keptProcesses.map(p => p.name));
      const newProcesses: Process[] = selectedProcesses
        .filter(p => !existingNames.has(p.processName))
        .map((p, idx) => ({
          id: uid(),
          no: p.processNo,
          name: p.processName,
          order: (keptProcesses.length + idx + 1) * 10,
          functions: [],
          productChars: [],
          l3: [{ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10, functions: [], processChars: [] }]
        }));
      
      // 3. 결과 병합
      const result = [...keptProcesses, ...newProcesses];
      
      // 4. 최소 1개 공정 보장
      if (result.length === 0) {
        return {
          ...prev,
          l2: [{
            id: uid(),
            no: '',
            name: '(클릭하여 공정 선택)',
            order: 10,
            functions: [],
            productChars: [],
            l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10, functions: [], processChars: [] }]
          }]
        };
      }
      
      return { ...prev, l2: result };
    });
    setDirty(true);
  }, []);

  // ============ 평탄화된 행 데이터 (구조분석용 - L2/L3 기준) ============
  const rows = useMemo(() => {
    const result: FlatRow[] = [];
    
    // L2/L3 트리 평탄화
    const l2Data = state.l2 || [];
    if (l2Data.length === 0) return result;

    // 고장연결 데이터가 있으면 그것을 기반으로 행 생성 (1:1 매칭 보장)
    const failureLinks = (state as any).failureLinks || [];
    if (failureLinks.length > 0) {
      // FM별 그룹핑
      const fmGroups = new Map<string, { fmId: string; fmText: string; fmProcess: string; fes: any[]; fcs: any[] }>();
      failureLinks.forEach((link: any) => {
        if (!fmGroups.has(link.fmId)) {
          fmGroups.set(link.fmId, { fmId: link.fmId, fmText: link.fmText, fmProcess: link.fmProcess, fes: [], fcs: [] });
        }
        const group = fmGroups.get(link.fmId)!;
        if (link.feId && !group.fes.some(f => f.id === link.feId)) {
          group.fes.push({ id: link.feId, scope: link.feScope, text: link.feText, severity: link.severity });
        }
        if (link.fcId && !group.fcs.some(f => f.id === link.fcId)) {
          group.fcs.push({ id: link.fcId, text: link.fcText, workElem: link.fcWorkElem, process: link.fcProcess });
        }
      });

      fmGroups.forEach((group) => {
        const maxRows = Math.max(group.fes.length, group.fcs.length, 1);
        for (let i = 0; i < maxRows; i++) {
        const fe = group.fes[i] || null;
        const fc = group.fcs[i] || null;
        
        // 1L 정보 찾기 (기능, 구분)
        let l1Type = fe?.scope || '';
        let l1Func = '';
        let l1Req = fe?.text || '';

        if (fe?.id) {
          state.l1.types.forEach(t => {
            t.functions.forEach(f => {
              if (f.requirements.some(r => r.id === fe.id)) {
                l1Type = t.name;
                l1Func = f.name;
              }
            });
          });
        }
        
        // 공정 정보 찾기
        const proc = l2Data.find(p => p.name === group.fmProcess || p.name.includes(group.fmProcess));
        
        result.push({
          l1Id: state.l1.id,
          l1Name: state.l1.name,
          l1Type: l1Type,
          l1Function: l1Func,
          l1Requirement: l1Req,
          l1FailureEffect: fe?.text || '',
          l1Severity: fe?.severity?.toString() || '',
            l2Id: proc?.id || '',
            l2No: proc?.no || '',
            l2Name: proc?.name || group.fmProcess,
            l2Functions: proc?.functions || [],
            l2ProductChars: (proc?.functions || []).flatMap((f: any) => f.productChars || []),
            l2FailureMode: group.fmText,
            l3Id: '',
            m4: '',
            l3Name: fc?.workElem || '',
            l3Functions: [],
            l3ProcessChars: [],
            l3FailureCause: fc?.text || '',
          });
        }
      });
      return result;
    }

    // 고장연결이 없으면 기존 구조분석 방식 (L2/L3 기준)
    let rowIdx = 0;
    // ... 기존 로직 ...
    const l1Types = state.l1?.types || [];
    const l1FlatData: { typeId: string; type: string; funcId: string; func: string; reqId: string; req: string }[] = [];
    l1Types.forEach(type => {
      const funcs = type.functions || [];
      if (funcs.length === 0) {
        l1FlatData.push({ typeId: type.id, type: type.name, funcId: '', func: '', reqId: '', req: '' });
      } else {
        funcs.forEach(fn => {
          const reqs = fn.requirements || [];
          if (reqs.length === 0) {
            l1FlatData.push({ typeId: type.id, type: type.name, funcId: fn.id, func: fn.name, reqId: '', req: '' });
          } else {
            reqs.forEach(req => {
              l1FlatData.push({ typeId: type.id, type: type.name, funcId: fn.id, func: fn.name, reqId: req.id, req: req.name });
            });
          }
        });
      }
    });

    l2Data.forEach(proc => {
      const l3Data = proc.l3 || [];
      if (l3Data.length === 0) {
        const l1Item = l1FlatData[rowIdx % Math.max(l1FlatData.length, 1)] || { type: '', func: '', req: '' };
        result.push({
          l1Id: state.l1.id, l1Name: state.l1.name, l1Type: l1Item.type, l1Function: l1Item.func, l1Requirement: l1Item.req,
          l1FailureEffect: '', l1Severity: '',
          l2Id: proc.id, l2No: proc.no, l2Name: proc.name, l2Functions: proc.functions || [],
          l2ProductChars: (proc.functions || []).flatMap((f: any) => f.productChars || []),
          l2FailureMode: (proc.failureModes || []).map((m: any) => m.name).join(', '),
          l3Id: '', m4: '', l3Name: '(작업요소 없음)', l3Functions: [], l3ProcessChars: [], l3FailureCause: ''
        });
        rowIdx++;
      } else {
        l3Data.forEach(we => {
          const l1Item = l1FlatData[rowIdx % Math.max(l1FlatData.length, 1)] || { type: '', func: '', req: '' };
          result.push({
            l1Id: state.l1.id, l1Name: state.l1.name, l1Type: l1Item.type, l1Function: l1Item.func, l1Requirement: l1Item.req,
            l1FailureEffect: '', l1Severity: '',
            l2Id: proc.id, l2No: proc.no, l2Name: proc.name, l2Functions: proc.functions || [],
            l2ProductChars: (proc.functions || []).flatMap((f: any) => f.productChars || []),
            l2FailureMode: (proc.failureModes || []).map((m: any) => m.name).join(', '),
            l3Id: we.id, m4: we.m4, l3Name: we.name,
            l3Functions: we.functions || [], l3ProcessChars: we.processChars || [],
            l3FailureCause: (we.failureCauses || []).map((c: any) => c.name).join(', ')
          });
          rowIdx++;
        });
      }
    });
    return result;
  }, [state.l1, state.l2, (state as any).failureLinks]);

  const calculateSpans = (rows: FlatRow[], key: keyof FlatRow) => {
    const spans: number[] = [];
    let currentId = '';
    let spanStart = 0;
    rows.forEach((row, idx) => {
      const val = row[key] as string;
      if (val !== currentId || val === '') {
        if (currentId !== '') {
          for (let i = spanStart; i < idx; i++) spans[i] = i === spanStart ? idx - spanStart : 0;
        }
        currentId = val;
        spanStart = idx;
      }
    });
    for (let i = spanStart; i < rows.length; i++) spans[i] = i === spanStart ? rows.length - spanStart : 0;
    return spans;
  };

  const l1Spans = useMemo(() => rows.map((_, idx) => idx === 0 ? rows.length : 0), [rows]);
  const l1TypeSpans = useMemo(() => calculateSpans(rows, 'l1TypeId'), [rows]);
  const l1FuncSpans = useMemo(() => calculateSpans(rows, 'l1FunctionId'), [rows]);
  const l2Spans = useMemo(() => calculateSpans(rows, 'l2Id'), [rows]);

  return {
    state, setState, dirty, setDirty, isSaving, lastSaved, fmeaList, currentFmea, selectedFmeaId, handleFmeaChange,
    rows, l1Spans, l1TypeSpans, l1FuncSpans, l2Spans,
    saveToLocalStorage, handleInputKeyDown, handleInputBlur, handleSelect, addL2, addL3, deleteL2, deleteL3, handleProcessSelect,
  };
}
