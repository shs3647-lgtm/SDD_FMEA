'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProcessSelectModal from './ProcessSelectModal';
import WorkElementSelectModal from './WorkElementSelectModal';

// FMEA 프로젝트 타입
interface FMEAProject {
  id: string;
  fmeaInfo?: {
    subject?: string;
  };
  project?: {
    productName?: string;
  };
}

// ============ 타입 정의 ============
interface WorkElement {
  id: string;
  m4: string;
  name: string;
  order: number;
  // 기능분석 (3단계)
  function?: string;       // 작업요소 기능
  processChar?: string;    // 공정특성
  // 고장분석 (4단계)
  failureCause?: string;   // 고장원인 (FC)
}

interface Process {
  id: string;
  no: string;
  name: string;
  order: number;
  l3: WorkElement[];
  // 기능분석 (3단계)
  function?: string;       // 공정기능
  productChar?: string;    // 제품특성
  // 고장분석 (4단계)
  failureMode?: string;    // 고장형태 (FM)
}

interface L1Data {
  id: string;
  name: string;
  // 기능분석 (3단계)
  function?: string;       // 완제품 기능
  requirement?: string;    // 요구사항
  // 고장분석 (4단계)
  failureEffect?: string;  // 고장영향 (FE)
  severity?: number;       // 심각도 (1-10)
}

interface State {
  l1: L1Data;
  l2: Process[];
  selected: { type: 'L1' | 'L2' | 'L3'; id: string | null };
  tab: string;
  levelView: string;
  search: string;
}

// ============ 초기 데이터 ============
const uid = () => 'id_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16);

const INITIAL_STATE: State = {
  l1: { id: uid(), name: '타이어 제조 공정', function: '', requirement: '', failureEffect: '', severity: undefined },
  l2: [
    {
      id: uid(), no: '10', name: '자재입고', order: 10,
      l3: [
        { id: uid(), m4: 'MN', name: '00셋업 엔지니어', order: 10 },
        { id: uid(), m4: 'MN', name: '00작업자', order: 20 },
        { id: uid(), m4: 'MC', name: '10자동창고', order: 30 },
        { id: uid(), m4: 'EN', name: '00 온도', order: 40 },
      ]
    },
    {
      id: uid(), no: '11', name: '가온', order: 20,
      l3: [
        { id: uid(), m4: 'MN', name: '00작업자', order: 10 },
        { id: uid(), m4: 'MC', name: '11가온실', order: 20 },
      ]
    },
    {
      id: uid(), no: '20', name: '수입검사', order: 30,
      l3: [
        { id: uid(), m4: 'MN', name: '00검사원', order: 10 },
        { id: uid(), m4: 'MC', name: '20MOONEY VISCOMETER', order: 20 },
      ]
    },
  ],
  selected: { type: 'L2', id: null },
  tab: 'structure',
  levelView: '2',
  search: ''
};

// ============ 색상 정의 ============
const COLORS = {
  blue: '#2b78c5',
  blue2: '#1f63aa',
  sky: '#bfe0ff',
  sky2: '#d7ecff',
  line: '#6f8fb4',
  bg: '#f5f7fb',
  warn: '#ffe1e1',
  text: '#0e223a',
  // 4M 배지 색상
  mn: { bg: '#eef7ff', border: '#cfe0f4', color: '#1f4f86' },
  mc: { bg: '#fff3e6', border: '#ffd2a6', color: '#8a4f00' },
  im: { bg: '#f0fff2', border: '#bdeac5', color: '#1b6b2a' },
  en: { bg: '#fef0ff', border: '#f0bdf5', color: '#7a1a88' },
};

const TABS = [
  { id: 'structure', label: '구조분석' },
  { id: 'function', label: '기능분석' },
  { id: 'failure', label: '고장분석' },
  { id: 'risk', label: '리스크분석' },
  { id: 'opt', label: '최적화' },
  { id: 'doc', label: '문서화' },
];

// 전체보기용 탭 (38열 FMEA 워크시트)
const ALL_VIEW_TAB = { id: 'all', label: '전체보기' };

const LEVELS = [
  { id: '1', label: '1L' },
  { id: '2', label: '2L' },
  { id: '3', label: '3L' },
  { id: 'all', label: 'All' },
];

export default function FMEAWorksheetPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedFmeaId = searchParams.get('id');

  // FMEA 프로젝트 목록
  const [fmeaList, setFmeaList] = useState<FMEAProject[]>([]);
  const [currentFmea, setCurrentFmea] = useState<FMEAProject | null>(null);

  const [state, setState] = useState<State>(() => {
    const initial = { ...INITIAL_STATE };
    // 초기에는 빈 행 하나 (클릭해서 공정 선택)
    initial.l2 = [{
      id: uid(),
      no: '',
      name: '(클릭하여 공정 선택)',
      order: 10,
      l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10 }]
    }];
    return initial;
  });
  const [dirty, setDirty] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isWorkElementModalOpen, setIsWorkElementModalOpen] = useState(false);
  const [targetL2Id, setTargetL2Id] = useState<string | null>(null); // 작업요소 추가할 공정 ID

  // FMEA 목록 로드
  useEffect(() => {
    const stored = localStorage.getItem('pfmea-projects');
    if (stored) {
      try {
        const projects: FMEAProject[] = JSON.parse(stored);
        setFmeaList(projects);
        
        // 선택된 FMEA 찾기
        if (selectedFmeaId) {
          const found = projects.find(p => p.id === selectedFmeaId);
          if (found) {
            setCurrentFmea(found);
            // FMEA명 업데이트
            const fmeaName = found.fmeaInfo?.subject || found.project?.productName || '(FMEA 미선택)';
            setState(prev => ({ ...prev, l1: { ...prev.l1, name: fmeaName } }));
          }
        } else if (projects.length > 0) {
          // ID가 없으면 첫 번째 프로젝트 선택
          setCurrentFmea(projects[0]);
          const fmeaName = projects[0].fmeaInfo?.subject || projects[0].project?.productName || '(FMEA 미선택)';
          setState(prev => ({ ...prev, l1: { ...prev.l1, name: fmeaName } }));
        }
      } catch (e) {
        console.error('FMEA 목록 로드 실패:', e);
      }
    }
  }, [selectedFmeaId]);

  // FMEA 선택 변경
  const handleFmeaChange = (fmeaId: string) => {
    router.push(`/pfmea/worksheet?id=${fmeaId}`);
  };

  // 평탄화된 행 데이터 (구조 + 기능 + 고장 등)
  const rows = useMemo(() => {
    const result: Array<{
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
    }> = [];

    [...state.l2].sort((a, b) => a.order - b.order).forEach(proc => {
      [...proc.l3].sort((a, b) => a.order - b.order).forEach(w => {
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
          l3Id: w.id,
          m4: w.m4,
          l3Name: w.name,
          l3Function: w.function || '',
          l3ProcessChar: w.processChar || '',
          l3FailureCause: w.failureCause || ''
        });
      });
    });

    return result;
  }, [state.l1, state.l2]);

  // rowSpan 계산
  const computeSpan = useCallback((rows: any[], keyFn: (r: any) => string) => {
    const spans = new Array(rows.length).fill(0);
    let i = 0;
    while (i < rows.length) {
      const key = keyFn(rows[i]);
      let j = i + 1;
      while (j < rows.length && keyFn(rows[j]) === key) j++;
      spans[i] = j - i;
      for (let k = i + 1; k < j; k++) spans[k] = 0;
      i = j;
    }
    return spans;
  }, []);

  // L1과 L2를 함께 그룹화 (L1:L2 = 1:1로 표시)
  const computeL1L2Span = useCallback((rows: any[]) => {
    const spans = new Array(rows.length).fill(0);
    let i = 0;
    while (i < rows.length) {
      const l2Key = rows[i].l2Id;
      let j = i + 1;
      while (j < rows.length && rows[j].l2Id === l2Key) j++;
      spans[i] = j - i;
      for (let k = i + 1; k < j; k++) spans[k] = 0;
      i = j;
    }
    return spans;
  }, []);

  // L1은 L2와 동일하게 병합 (L2별로 L1 표시)
  const l1Spans = useMemo(() => computeL1L2Span(rows), [rows, computeL1L2Span]);
  const l2Spans = useMemo(() => computeSpan(rows, r => r.l2Id), [rows, computeSpan]);

  // 선택 핸들러
  const handleSelect = useCallback((type: 'L1' | 'L2' | 'L3', id: string) => {
    setState(prev => ({ ...prev, selected: { type, id } }));
  }, []);

  // L2(공정) 추가 - 모달 열기
  const addL2 = useCallback(() => {
    setIsProcessModalOpen(true);
  }, []);

  // 모달에서 공정 선택 후 저장
  const handleProcessSelect = useCallback((selectedProcesses: { id: string; no: string; name: string }[]) => {
    setState(prev => {
      const existingNames = prev.l2.map(p => p.name);
      const newProcesses = selectedProcesses
        .filter(p => !existingNames.includes(p.name))
        .map((p, idx) => ({
          id: uid(),
          no: p.no,
          name: p.name,
          order: (prev.l2.length + idx + 1) * 10,
          l3: [] as WorkElement[]
        }));
      
      return {
        ...prev,
        l2: [...prev.l2, ...newProcesses]
      };
    });
    setDirty(true);
  }, []);

  // L3(작업요소) 추가 - 모달 열기
  const addL3 = useCallback((l2Id: string) => {
    setTargetL2Id(l2Id);
    setIsWorkElementModalOpen(true);
  }, []);

  // 작업요소 모달에서 선택 후 저장 (선택한 것으로 교체)
  const handleWorkElementSelect = useCallback((selectedElements: { id: string; m4: string; name: string }[]) => {
    if (!targetL2Id) return;
    
    setState(prev => {
      const newL2 = prev.l2.map(proc => {
        if (proc.id !== targetL2Id) return proc;
        
        // 선택된 작업요소로 교체
        const newL3 = selectedElements.map((e, idx) => ({
          id: uid(),
          m4: e.m4,
          name: e.name,
          order: (idx + 1) * 10
        }));
        
        // 작업요소가 없으면 빈 행 추가
        if (newL3.length === 0) {
          newL3.push({
            id: uid(),
            m4: '',
            name: '(클릭하여 작업요소 추가)',
            order: 10
          });
        }
        
        return { ...proc, l3: newL3 };
      });
      return { ...prev, l2: newL2 };
    });
    setDirty(true);
    setTargetL2Id(null);
  }, [targetL2Id]);

  // 선택된 공정에 작업요소 추가
  const addWorkRowToSelected = useCallback(() => {
    let l2Id: string | null = null;
    if (state.selected.type === 'L2') l2Id = state.selected.id;
    if (state.selected.type === 'L3') {
      for (const p of state.l2) {
        if (p.l3.some(w => w.id === state.selected.id)) {
          l2Id = p.id;
          break;
        }
      }
    }
    if (!l2Id && state.l2[0]) l2Id = state.l2[0].id;
    if (!l2Id) {
      alert('먼저 메인공정을 추가하세요.');
      return;
    }
    addL3(l2Id);
  }, [state.selected, state.l2, addL3]);

  // 작업요소명 수정
  const renameL3 = useCallback((l3Id: string, newName: string) => {
    setState(prev => ({
      ...prev,
      l2: prev.l2.map(p => ({
        ...p,
        l3: p.l3.map(w => w.id === l3Id ? { ...w, name: newName } : w)
      }))
    }));
    setDirty(true);
  }, []);

  // 검색 필터링된 트리 데이터
  const filteredTree = useMemo(() => {
    const q = state.search.toLowerCase();
    if (!q) return state.l2;

    return state.l2.filter(proc => {
      const procLabel = `${proc.no} ${proc.name}`.toLowerCase();
      const procMatches = procLabel.includes(q);
      const l3Matches = proc.l3.some(w => 
        `${w.m4} ${w.name}`.toLowerCase().includes(q)
      );
      return procMatches || l3Matches;
    });
  }, [state.l2, state.search]);

  // 4M 배지 색상
  const getBadgeStyle = (m4: string) => {
    const key = m4.toLowerCase() as keyof typeof COLORS;
    const colors = COLORS[key] || COLORS.mn;
    return {
      background: (colors as any).bg || '#eef7ff',
      borderColor: (colors as any).border || '#cfe0f4',
      color: (colors as any).color || '#1f4f86',
    };
  };

  const getTabLabel = (tab: string) => {
    const found = TABS.find(t => t.id === tab);
    return found ? found.label : tab;
  };

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: 'Segoe UI, Malgun Gothic, Arial, sans-serif', background: COLORS.bg, color: COLORS.text }}>
      
      {/* 상단 메뉴 바 - 3개 영역 */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: COLORS.blue }}>
        {/* 영역 1: FMEA명 (드롭다운 + 리스트 이동) */}
        <div className="flex items-center gap-3">
          <span 
            className="text-white text-xs font-bold cursor-pointer hover:underline"
            onClick={() => router.push('/pfmea/list')}
            title="FMEA 리스트로 이동"
          >
            📋 FMEA명:
          </span>
          <select
            value={currentFmea?.id || ''}
            onChange={(e) => handleFmeaChange(e.target.value)}
            className="px-3 py-1 text-xs font-semibold rounded border-0"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', minWidth: '200px' }}
          >
            {fmeaList.length === 0 && <option value="">FMEA 미등록</option>}
            {fmeaList.map(fmea => (
              <option key={fmea.id} value={fmea.id} style={{ color: '#333' }}>
                {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
              </option>
            ))}
          </select>
          <button
            onClick={() => router.push('/pfmea/list')}
            className="px-2 py-1 text-xs text-white rounded hover:bg-white/20"
            title="FMEA 리스트"
          >
            📋
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-white/40" />

        {/* 영역 2: 저장, Excel Import, Excel Export */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setDirty(false); alert('저장되었습니다.'); }}
            className="px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1"
            style={{ background: dirty ? '#4caf50' : 'rgba(255,255,255,0.18)', color: '#fff' }}
          >
            💾 저장
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-white rounded flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.18)' }}>
            📥 Excel Import
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-white rounded flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.18)' }}>
            📤 Excel Export
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-white/40" />

        {/* 영역 3: 5AP, 6AP, Top RPN, Lessons Learn */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,100,100,0.5)' }}>
            🔴 5 AP
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,165,0,0.5)' }}>
            🟠 6 AP
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>
            📊 Top RPN
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>
            📚 Lessons Learn
          </button>
        </div>
      </div>

      {/* 메인 레이아웃: 좌측 워크시트 + 우측 트리 */}
      <div className="flex-1 flex overflow-hidden" style={{ gap: 0 }}>
        {/* ========== 좌측: 워크시트 ========== */}
        <main className="flex-1 bg-white overflow-auto min-w-0" style={{ marginRight: 0, paddingRight: 0 }}>
          {/* 탭 + 레벨 + 전체보기 메뉴 */}
          <div className="flex-shrink-0 bg-white px-2 py-1" style={{ borderBottom: `2px solid ${COLORS.blue}` }}>
            <div className="flex items-center justify-between">
              {/* 좌측: 탭 + 레벨 */}
              <div className="flex items-center gap-2">
                {/* 탭 */}
                <div className="flex gap-0.5">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setState(prev => ({ ...prev, tab: tab.id }))}
                      className="px-2 py-1 text-xs font-bold cursor-pointer"
                      style={{
                        background: state.tab === tab.id ? COLORS.blue : '#e8f0f8',
                        border: `1px solid ${state.tab === tab.id ? COLORS.blue : '#c0d0e0'}`,
                        borderRadius: '3px 3px 0 0',
                        borderBottom: 0,
                        color: state.tab === tab.id ? '#fff' : COLORS.text
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {/* 구분선 */}
                <div className="w-px h-5 bg-gray-300" />
                {/* 레벨 */}
                <div className="flex gap-0.5">
                  {LEVELS.map(lv => (
                    <button
                      key={lv.id}
                      onClick={() => setState(prev => ({ ...prev, levelView: lv.id }))}
                      className="px-2 py-1 text-xs font-bold cursor-pointer"
                      style={{
                        background: state.levelView === lv.id ? '#fff' : '#f0f0f0',
                        border: `1px solid ${state.levelView === lv.id ? COLORS.blue : '#d0d0d0'}`,
                        borderRadius: '3px',
                        color: state.levelView === lv.id ? COLORS.blue : '#666'
                      }}
                    >
                      {lv.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 우측: 전체보기 */}
              <div className="flex items-center gap-2">
                {/* 구분선 */}
                <div className="w-px h-5 bg-gray-300" />
                <button
                  onClick={() => setState(prev => ({ ...prev, tab: 'all', levelView: 'all' }))}
                  className="px-2 py-1 text-xs font-bold cursor-pointer"
                  style={{
                    background: state.tab === 'all' ? COLORS.blue : '#fff',
                    border: `1px solid ${COLORS.blue}`,
                    borderRadius: '3px',
                    color: state.tab === 'all' ? '#fff' : COLORS.blue
                  }}
                >
                  전체보기
                </button>
              </div>
            </div>
          </div>

          {/* 워크시트 영역 - 세로 스크롤 */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ marginRight: 0, paddingRight: 0 }}>
            {/* 테이블 제목 - 고정 */}
            <div 
              className="text-center font-black py-1 text-sm flex-shrink-0"
              style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, borderBottom: 0 }}
            >
              P-FMEA {getTabLabel(state.tab)}({state.tab === 'structure' ? 2 : state.tab === 'function' ? 3 : state.tab === 'failure' ? 4 : state.tab === 'risk' ? 5 : state.tab === 'optimization' ? 6 : 7}단계)
            </div>

            {/* 테이블 컨테이너 */}
            <div className="flex-1 overflow-auto" style={{ border: `1px solid ${COLORS.line}` }}>
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                {/* 헤더 - 탭별로 다른 열 표시 */}
                <thead className="sticky top-0 z-10">
                  {state.tab === 'structure' && (
                    <>
                      <tr>
                        <th style={{ width: '20%', background: COLORS.sky, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          1. 완제품 공정명
                        </th>
                        <th 
                          onClick={() => setIsProcessModalOpen(true)}
                          className="cursor-pointer hover:bg-blue-200"
                          style={{ width: '25%', background: COLORS.sky, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}
                        >
                          2. 메인 공정명 🔍
                        </th>
                        <th style={{ width: '8%', background: COLORS.sky, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          4M
                        </th>
                        <th style={{ width: '47%', background: COLORS.sky, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          3. 작업 요소명
                        </th>
                      </tr>
                      <tr>
                        <th style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          완제품명+라인
                        </th>
                        <th style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          공정NO+공정명
                        </th>
                        <th style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          4M
                        </th>
                        <th style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          작업요소
                        </th>
                      </tr>
                    </>
                  )}
                  {state.tab === 'function' && (
                    <>
                      <tr>
                        <th colSpan={2} style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          1. 완제품 공정기능/요구사항
                        </th>
                        <th colSpan={2} style={{ background: '#a5d6a7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          2. 메인공정 기능 및 제품특성
                        </th>
                        <th colSpan={2} style={{ background: '#81c784', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          3. 작업요소 기능 및 공정특성
                        </th>
                      </tr>
                      <tr>
                        <th style={{ width: '15%', background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          완제품 기능
                        </th>
                        <th style={{ width: '15%', background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          요구사항
                        </th>
                        <th style={{ width: '17%', background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          공정 기능
                        </th>
                        <th style={{ width: '17%', background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          제품특성
                        </th>
                        <th style={{ width: '18%', background: '#a5d6a7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          작업요소 기능
                        </th>
                        <th style={{ width: '18%', background: '#a5d6a7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          공정특성
                        </th>
                      </tr>
                    </>
                  )}
                  {state.tab === 'failure' && (
                    <>
                      <tr>
                        <th colSpan={2} style={{ background: '#ffcdd2', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          1. 고장영향(FE) / 심각도
                        </th>
                        <th style={{ background: '#ef9a9a', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          2. 고장형태(FM)
                        </th>
                        <th colSpan={2} style={{ background: '#e57373', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px', color: '#fff' }}>
                          3. 작업요소 고장원인(FC)
                        </th>
                      </tr>
                      <tr>
                        <th style={{ width: '22%', background: '#ffebee', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          고장영향(FE)
                        </th>
                        <th style={{ width: '10%', background: '#ffebee', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          심각도
                        </th>
                        <th style={{ width: '22%', background: '#ffcdd2', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          고장형태(FM)
                        </th>
                        <th style={{ width: '20%', background: '#ef9a9a', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          작업요소
                        </th>
                        <th style={{ width: '26%', background: '#ef9a9a', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>
                          고장원인(FC)
                        </th>
                      </tr>
                    </>
                  )}
                  {/* 리스크분석 탭 헤더 */}
                  {state.tab === 'risk' && (
                    <>
                      <tr>
                        <th style={{ width: '20%', background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          현재 예방관리
                        </th>
                        <th style={{ width: '20%', background: '#b3e5fc', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }}>
                          현재 검출관리
                        </th>
                        <th style={{ width: '60%', background: '#e1f5fe', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={5}>
                          리스크 평가
                        </th>
                      </tr>
                      <tr>
                        <th style={{ background: '#e3f2fd', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>예방관리</th>
                        <th style={{ background: '#e1f5fe', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>검출관리</th>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>심각도(S)</th>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>발생도(O)</th>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>검출도(D)</th>
                        <th style={{ background: '#fff3e0', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>AP</th>
                        <th style={{ background: '#fff3e0', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>RPN</th>
                      </tr>
                    </>
                  )}
                  {/* 최적화 탭 헤더 */}
                  {state.tab === 'opt' && (
                    <>
                      <tr>
                        <th style={{ width: '35%', background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={4}>
                          개선조치 계획
                        </th>
                        <th style={{ width: '35%', background: '#dcedc8', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={3}>
                          개선조치 결과
                        </th>
                        <th style={{ width: '30%', background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={4}>
                          효과 평가
                        </th>
                      </tr>
                      <tr>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>조치유형</th>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>권고조치사항</th>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>담당자</th>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>완료예정일</th>
                        <th style={{ background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>취해진조치</th>
                        <th style={{ background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>완료일자</th>
                        <th style={{ background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>상태</th>
                        <th style={{ background: '#fffde7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>S</th>
                        <th style={{ background: '#fffde7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>O</th>
                        <th style={{ background: '#fffde7', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>D</th>
                        <th style={{ background: '#fff8e1', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>AP</th>
                      </tr>
                    </>
                  )}
                  {/* 문서화 탭 헤더 */}
                  {state.tab === 'doc' && (
                    <>
                      <tr>
                        <th style={{ width: '100%', background: '#e0e0e0', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={5}>
                          문서화 (7단계)
                        </th>
                      </tr>
                      <tr>
                        <th style={{ background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>고장형태</th>
                        <th style={{ background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>고장원인</th>
                        <th style={{ background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>현재관리</th>
                        <th style={{ background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>권고조치</th>
                        <th style={{ background: '#f5f5f5', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '22px', fontWeight: 700, fontSize: '10px' }}>비고</th>
                      </tr>
                    </>
                  )}
                  {/* 전체보기 탭 헤더 */}
                  {state.tab === 'all' && (
                    <>
                      <tr>
                        <th style={{ width: '15%', background: COLORS.sky, border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={4}>
                          구조분석 (2단계)
                        </th>
                        <th style={{ width: '20%', background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={6}>
                          기능분석 (3단계)
                        </th>
                        <th style={{ width: '15%', background: '#ffcdd2', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={5}>
                          고장분석 (4단계)
                        </th>
                        <th style={{ width: '20%', background: '#bbdefb', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={7}>
                          리스크분석 (5단계)
                        </th>
                        <th style={{ width: '30%', background: '#fff9c4', border: `1px solid ${COLORS.line}`, padding: '1px 4px', height: '25px', fontWeight: 900, textAlign: 'center', fontSize: '11px' }} colSpan={11}>
                          최적화 (6단계)
                        </th>
                      </tr>
                      <tr>
                        <th style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>완제품</th>
                        <th style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>메인공정</th>
                        <th style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>4M</th>
                        <th style={{ background: COLORS.sky2, border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>작업요소</th>
                        <th style={{ background: '#dcedc8', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>완제품기능</th>
                        <th style={{ background: '#dcedc8', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>요구사항</th>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>공정기능</th>
                        <th style={{ background: '#e8f5e9', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>제품특성</th>
                        <th style={{ background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>작업기능</th>
                        <th style={{ background: '#f1f8e9', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>공정특성</th>
                        <th style={{ background: '#ffebee', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>고장영향</th>
                        <th style={{ background: '#ffebee', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>심각도</th>
                        <th style={{ background: '#ffcdd2', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>고장형태</th>
                        <th style={{ background: '#ef9a9a', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>고장원인</th>
                        <th style={{ background: '#ef9a9a', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>발생도</th>
                        <th style={{ background: '#e3f2fd', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>예방관리</th>
                        <th style={{ background: '#e1f5fe', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>검출관리</th>
                        <th style={{ background: '#e1f5fe', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>검출도</th>
                        <th style={{ background: '#b3e5fc', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>AP</th>
                        <th style={{ background: '#b3e5fc', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>RPN</th>
                        <th style={{ background: '#b3e5fc', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>우선순위</th>
                        <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>조치유형</th>
                        <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>권고조치</th>
                        <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>담당자</th>
                        <th style={{ background: '#c8e6c9', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>예정일</th>
                        <th style={{ background: '#dcedc8', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>조치내용</th>
                        <th style={{ background: '#dcedc8', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>완료일</th>
                        <th style={{ background: '#dcedc8', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>상태</th>
                        <th style={{ background: '#fff9c4', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>S</th>
                        <th style={{ background: '#fff9c4', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>O</th>
                        <th style={{ background: '#fff9c4', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>D</th>
                        <th style={{ background: '#fff59d', border: `1px solid ${COLORS.line}`, padding: '1px 2px', height: '22px', fontWeight: 700, fontSize: '9px' }}>AP</th>
                      </tr>
                    </>
                  )}
                </thead>
                <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.l3Id} style={{ height: '25px' }}>
                    {/* ========== 구조분석 탭 ========== */}
                    {state.tab === 'structure' && (
                      <>
                        {l1Spans[idx] > 0 && (
                          <td rowSpan={l1Spans[idx]} className="text-center cursor-pointer hover:bg-blue-50 text-xs"
                            style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fff', verticalAlign: 'middle' }}
                            onClick={() => handleSelect('L1', row.l1Id)}>
                            {row.l1Name}
                          </td>
                        )}
                        {l2Spans[idx] > 0 && (
                          <td rowSpan={l2Spans[idx]} className="text-center cursor-pointer hover:bg-blue-100 text-xs"
                            style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: row.l2Name.includes('클릭') ? '#fffde7' : '#fff', verticalAlign: 'middle' }}
                            onClick={() => { handleSelect('L2', row.l2Id); setIsProcessModalOpen(true); }}>
                            {row.l2Name.includes('클릭') ? <span className="text-blue-500 font-bold">🔍 클릭</span> : <span>{row.l2No} {row.l2Name} 🔍</span>}
                          </td>
                        )}
                        <td className="text-center text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px' }}>{row.m4}</td>
                        <td className="cursor-pointer hover:bg-blue-50 text-xs"
                          style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: row.l3Name.includes('추가') || row.l3Name.includes('클릭') ? '#fffde7' : '#fff' }}
                          onClick={() => { handleSelect('L3', row.l3Id); setTargetL2Id(row.l2Id); setIsWorkElementModalOpen(true); }}>
                          {row.l3Name.includes('추가') || row.l3Name.includes('클릭') ? <span className="text-blue-500 font-bold">🔍 클릭</span> : <span>{row.l3Name} 🔍</span>}
                        </td>
                      </>
                    )}

                    {/* ========== 기능분석 탭 ========== */}
                    {state.tab === 'function' && (
                      <>
                        {l1Spans[idx] > 0 && (
                          <td rowSpan={l1Spans[idx]} className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#f1f8e9', verticalAlign: 'middle' }}>
                            <input type="text" value={row.l1Function} onChange={(e) => setState(prev => ({ ...prev, l1: { ...prev.l1, function: e.target.value } }))}
                              placeholder="완제품 기능 입력" className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                          </td>
                        )}
                        {l1Spans[idx] > 0 && (
                          <td rowSpan={l1Spans[idx]} className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#f1f8e9', verticalAlign: 'middle' }}>
                            <input type="text" value={row.l1Requirement} onChange={(e) => setState(prev => ({ ...prev, l1: { ...prev.l1, requirement: e.target.value } }))}
                              placeholder="요구사항 입력" className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                          </td>
                        )}
                        {l2Spans[idx] > 0 && (
                          <td rowSpan={l2Spans[idx]} className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#e8f5e9', verticalAlign: 'middle' }}>
                            <input type="text" value={row.l2Function}
                              onChange={(e) => { setState(prev => ({ ...prev, l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, function: e.target.value } : p) })); setDirty(true); }}
                              placeholder={`${row.l2No} ${row.l2Name} 기능`} className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                          </td>
                        )}
                        {l2Spans[idx] > 0 && (
                          <td rowSpan={l2Spans[idx]} className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#e8f5e9', verticalAlign: 'middle' }}>
                            <input type="text" value={row.l2ProductChar}
                              onChange={(e) => { setState(prev => ({ ...prev, l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, productChar: e.target.value } : p) })); setDirty(true); }}
                              placeholder="제품특성 입력" className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                          </td>
                        )}
                        <td className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#dcedc8' }}>
                          <input type="text" value={row.l3Function}
                            onChange={(e) => { setState(prev => ({ ...prev, l2: prev.l2.map(p => ({ ...p, l3: p.l3.map(w => w.id === row.l3Id ? { ...w, function: e.target.value } : w) })) })); setDirty(true); }}
                            placeholder={`[${row.m4}] ${row.l3Name} 기능`} className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                        </td>
                        <td className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#dcedc8' }}>
                          <input type="text" value={row.l3ProcessChar}
                            onChange={(e) => { setState(prev => ({ ...prev, l2: prev.l2.map(p => ({ ...p, l3: p.l3.map(w => w.id === row.l3Id ? { ...w, processChar: e.target.value } : w) })) })); setDirty(true); }}
                            placeholder="공정특성 입력" className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                        </td>
                      </>
                    )}

                    {/* ========== 고장분석 탭 ========== */}
                    {state.tab === 'failure' && (
                      <>
                        {l1Spans[idx] > 0 && (
                          <td rowSpan={l1Spans[idx]} className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#ffebee', verticalAlign: 'middle' }}>
                            <input type="text" value={row.l1FailureEffect}
                              onChange={(e) => setState(prev => ({ ...prev, l1: { ...prev.l1, failureEffect: e.target.value } }))}
                              placeholder="고장영향(FE) 입력" className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                          </td>
                        )}
                        {l1Spans[idx] > 0 && (
                          <td rowSpan={l1Spans[idx]} className="text-xs text-center" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#ffebee', verticalAlign: 'middle' }}>
                            <select value={row.l1Severity || ''}
                              onChange={(e) => setState(prev => ({ ...prev, l1: { ...prev.l1, severity: e.target.value ? Number(e.target.value) : undefined } }))}
                              className="w-full bg-transparent border-0 outline-none text-xs text-center" style={{ height: '20px' }}>
                              <option value="">-</option>
                              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </td>
                        )}
                        {l2Spans[idx] > 0 && (
                          <td rowSpan={l2Spans[idx]} className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#ffcdd2', verticalAlign: 'middle' }}>
                            <input type="text" value={row.l2FailureMode}
                              onChange={(e) => { setState(prev => ({ ...prev, l2: prev.l2.map(p => p.id === row.l2Id ? { ...p, failureMode: e.target.value } : p) })); setDirty(true); }}
                              placeholder={`${row.l2No} ${row.l2Name} 고장형태`} className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                          </td>
                        )}
                        <td className="text-xs text-center" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fce4ec' }}>
                          [{row.m4}] {row.l3Name}
                        </td>
                        <td className="text-xs" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', background: '#fce4ec' }}>
                          <input type="text" value={row.l3FailureCause}
                            onChange={(e) => { setState(prev => ({ ...prev, l2: prev.l2.map(p => ({ ...p, l3: p.l3.map(w => w.id === row.l3Id ? { ...w, failureCause: e.target.value } : w) })) })); setDirty(true); }}
                            placeholder="고장원인(FC) 입력" className="w-full bg-transparent border-0 outline-none text-xs" style={{ height: '20px' }} />
                        </td>
                      </>
                    )}

                    {/* ========== 기타 탭 ========== */}
                    {(state.tab !== 'structure' && state.tab !== 'function' && state.tab !== 'failure') && (
                      <>
                        {l1Spans[idx] > 0 && (<td rowSpan={l1Spans[idx]} className="text-center text-xs text-gray-400" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', verticalAlign: 'middle' }}>{row.l1Name}</td>)}
                        {l2Spans[idx] > 0 && (<td rowSpan={l2Spans[idx]} className="text-center text-xs text-gray-400" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px', verticalAlign: 'middle' }}>{row.l2No} {row.l2Name}</td>)}
                        <td className="text-xs text-gray-400" style={{ border: `1px solid ${COLORS.line}`, padding: '1px 4px' }}>[{row.m4}] {row.l3Name}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* ========== 구분선 (굵은 선) ========== */}
        <div className="flex-shrink-0" style={{ width: '4px', background: '#00587a', marginLeft: 0 }} />

        {/* ========== 우측: 트리 (L1 틀고정) ========== */}
        <aside className="flex flex-col flex-shrink-0" style={{ width: '420px', marginLeft: 0, paddingLeft: 0, background: '#fff' }}>
          {/* L1: 완제품공정명 - 틀 고정 */}
          <div className="flex-shrink-0 border-b" style={{ background: '#e3f2fd' }}>
            <div className="flex items-center gap-1 px-2 py-1">
              <span className="text-blue-600 text-sm">📦</span>
              <input
                type="text"
                value={state.l1.name}
                onChange={(e) => {
                  setState(prev => ({ ...prev, l1: { ...prev.l1, name: e.target.value } }));
                  setDirty(true);
                }}
                className="flex-1 px-2 py-1 text-sm font-bold border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                style={{ borderColor: '#90caf9' }}
              />
              <button 
                onClick={addL2}
                className="px-2 py-1 text-xs font-bold rounded bg-blue-500 text-white hover:bg-blue-600"
                title="공정 추가"
              >
                +
              </button>
            </div>
          </div>

          {/* L2, L3: 하위 트리 - 스크롤 영역 */}
          <div className="flex-1 overflow-auto p-2">
            <div className="ml-2" style={{ borderLeft: '2px solid #90caf9' }}>
                {filteredTree.sort((a, b) => a.order - b.order).map((proc, pIdx) => (
                  <div key={proc.id} className="mb-1">
                    {/* L2 행 - 클릭하면 작업요소 모달 */}
                    <div 
                      className={`flex items-center gap-1 py-1 cursor-pointer hover:bg-blue-50 rounded ${
                        state.selected.type === 'L2' && state.selected.id === proc.id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => {
                        handleSelect('L2', proc.id);
                        // 공정 클릭 시 작업요소 모달 열기
                        setTargetL2Id(proc.id);
                        setIsWorkElementModalOpen(true);
                      }}
                    >
                      <span 
                        className="w-5 h-5 flex items-center justify-center text-gray-500 text-xs cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); /* 접기/펼치기 */ }}
                      >
                        {proc.l3.length > 0 ? '▼' : '▷'}
                      </span>
                      <span className="text-gray-400 text-sm">📁</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={`1.${pIdx + 1}-${proc.name}`}
                          onChange={(e) => {
                            const val = e.target.value.replace(/^1\.\d+-/, '');
                            setState(prev => ({
                              ...prev,
                              l2: prev.l2.map(p => p.id === proc.id ? { ...p, name: val } : p)
                            }));
                            setDirty(true);
                          }}
                          className="w-full px-2 py-1 text-xs border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                          style={{ borderColor: '#e0e0e0' }}
                        />
                      </div>
                    </div>

                    {/* L3: 작업요소들 */}
                    <div className="ml-6">
                      {proc.l3
                        .filter(w => !state.search || `${w.m4} ${w.name}`.toLowerCase().includes(state.search.toLowerCase()))
                        .sort((a, b) => a.order - b.order)
                        .map((w, wIdx) => (
                          <div 
                            key={w.id} 
                            className={`flex items-center gap-1 py-1 cursor-pointer hover:bg-blue-50 rounded ${
                              state.selected.type === 'L3' && state.selected.id === w.id ? 'bg-blue-100' : ''
                            }`}
                            onClick={() => handleSelect('L3', w.id)}
                          >
                            <span className="w-5 h-5"></span>
                            <span className="text-gray-400 text-sm">📄</span>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={`1.${pIdx + 1}.${wIdx + 1}-${w.name}`}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/^1\.\d+\.\d+-/, '');
                                  renameL3(w.id, val);
                                }}
                                className="w-full px-2 py-1 text-xs border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                                style={{ borderColor: '#e0e0e0' }}
                              />
                            </div>
                          </div>
                        ))
                      }
                      {/* 작업요소 추가 버튼 - 모달 열기 */}
                      <div 
                        className="flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-green-100 rounded border border-dashed border-green-400 text-green-600 mt-1"
                        onClick={() => {
                          setTargetL2Id(proc.id);
                          setIsWorkElementModalOpen(true);
                        }}
                      >
                        <span className="text-sm">➕</span>
                        <span className="text-xs font-bold">작업요소 추가 (클릭)</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 공정 추가 버튼 */}
                <div 
                  className="flex items-center gap-2 py-1.5 px-2 ml-2 cursor-pointer hover:bg-green-100 rounded border border-dashed border-green-400 text-green-600 mt-1"
                  onClick={() => setIsProcessModalOpen(true)}
                >
                  <span className="text-sm">➕</span>
                  <span className="text-xs font-bold">공정 추가</span>
                </div>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="flex-shrink-0 px-3 py-1 border-t text-xs text-gray-500" style={{ background: '#f8f9fa' }}>
            공정: {state.l2.filter(p => !p.name.includes('클릭')).length}개 | 
            작업요소: {state.l2.reduce((sum, p) => sum + p.l3.filter(w => !w.name.includes('추가') && !w.name.includes('클릭')).length, 0)}개
          </div>
        </aside>

      </div>

      {/* 공정 선택 모달 (L2) */}
      <ProcessSelectModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onSave={(selectedProcesses) => {
          // 선택된 공정으로 교체 (기존 작업요소는 유지)
          setState(prev => {
            const selectedNames = selectedProcesses.map(p => p.name);
            
            // 기존 공정 중 선택된 것만 유지 (작업요소 보존)
            const keepL2 = prev.l2.filter(p => 
              !p.name.includes('클릭') && selectedNames.includes(p.name)
            );
            const keepNames = keepL2.map(p => p.name);
            
            // 새로 추가된 공정
            const newL2 = selectedProcesses
              .filter(p => !keepNames.includes(p.name))
              .map((p, idx) => ({
                id: uid(),
                no: p.no,
                name: p.name,
                order: (keepL2.length + idx + 1) * 10,
                l3: [{ id: uid(), m4: '', name: '(클릭하여 작업요소 추가)', order: 10 }]
              }));
            
            const finalL2 = [...keepL2, ...newL2];
            
            // 공정이 없으면 빈 행 추가
            if (finalL2.length === 0) {
              finalL2.push({
                id: uid(),
                no: '',
                name: '(클릭하여 공정 선택)',
                order: 10,
                l3: [{ id: uid(), m4: '', name: '(공정 선택 후 작업요소 추가)', order: 10 }]
              });
            }
            
            return { ...prev, l2: finalL2 };
          });
          setDirty(true);
        }}
        existingProcessNames={state.l2.filter(p => !p.name.includes('클릭')).map(p => p.name)}
      />

      {/* 작업요소 선택 모달 (L3) - 공정번호 전달 */}
      <WorkElementSelectModal
        isOpen={isWorkElementModalOpen}
        onClose={() => {
          setIsWorkElementModalOpen(false);
          setTargetL2Id(null);
        }}
        onSave={handleWorkElementSelect}
        processNo={state.l2.find(p => p.id === targetL2Id)?.no || ''}
        processName={state.l2.find(p => p.id === targetL2Id)?.name || ''}
        existingElements={
          state.l2.find(p => p.id === targetL2Id)?.l3
            .filter(w => !w.name.includes('추가'))
            .map(w => w.name) || []
        }
      />
    </div>
  );
}
