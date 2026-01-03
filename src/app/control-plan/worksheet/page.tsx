/**
 * @file page.tsx
 * @description Control Plan (관리계획서) 메인 페이지
 * 
 * PFMEA와 동일한 구조:
 * - CPTopNav (바로가기 메뉴)
 * - TopMenuBar (상단 메뉴)
 * - TabMenu (탭 메뉴)
 * - 워크시트 + 우측 패널
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CPTopNav from '@/components/layout/CPTopNav';
import { 
  CPRow, 
  createEmptyCPRow, 
  CP_COLUMNS, 
  CP_HEADER_GROUPS,
  SPECIAL_CHAR_OPTIONS,
  FREQUENCY_OPTIONS,
  MEASURE_METHOD_OPTIONS,
  ACTION_METHOD_OPTIONS
} from '../../pfmea/worksheet/types/controlPlan';
import { exportCPExcel } from '../../pfmea/worksheet/tabs/cp/exportCPExcel';
import { 
  Fmea4Row, 
  createEmptyFmea4Row, 
  calculateRPN, 
  FMEA4_COLUMNS, 
  FMEA4_HEADER_GROUPS,
  getRPNLevel,
  RPN_COLORS 
} from '../../pfmea/worksheet/types/fmea4';

// CP 페이지 상태
interface CPPageState {
  tab: string;
  cpNo: string;
  partName: string;
  partNo: string;
  revNo: string;
  customer: string;
  rows: CPRow[];
  fmea4Rows: Fmea4Row[];  // FMEA 4판 데이터
  linkedFmeaId: string | null;
  dirty: boolean;
}

// 기본 SDD 샘플 데이터
const DEFAULT_SDD_FMEA = {
  id: 'PFM25-310',
  project: { projectName: 'SDD NEW FMEA 개발', customer: 'SDD', productName: 'PCR 타이어', partNo: 'PCR-2025-001', department: '품질팀', leader: '신홍섭', startDate: '2025-12-01', endDate: '2026-06-30' },
  fmeaInfo: { subject: 'SDD NEW FMEA 개발', fmeaStartDate: '2025-12-01', fmeaRevisionDate: '2025-12-29', modelYear: 'MY2025', designResponsibility: '품질팀', fmeaResponsibleName: '신홍섭', customer: 'SDD', customerName: 'SDD' },
  createdAt: '2025-12-01T09:00:00.000Z', status: 'active', step: 4, revisionNo: 'Rev.01',
  l2: [
    { id: 'proc-1', no: '10', name: '프레스', functions: [{ name: '원료투입' }], failureModes: [{ name: '투입누락' }], l3: [{ id: 'we-1', name: '원료계량', m4: 'MN', failureCauses: [{ name: '계량오류' }] }] },
    { id: 'proc-2', no: '20', name: '가류', functions: [{ name: '가열성형' }], failureModes: [{ name: '가류불량' }], l3: [{ id: 'we-2', name: '온도관리', m4: 'MC', failureCauses: [{ name: '온도편차' }] }] },
    { id: 'proc-3', no: '30', name: '검사', functions: [{ name: '품질검사' }], failureModes: [{ name: '검사누락' }], l3: [{ id: 'we-3', name: '외관검사', m4: 'MN', failureCauses: [{ name: '검사미흡' }] }] },
  ],
  riskData: {
    'specialChar-0': 'CC', 'prevention-0': 'SPC 관리', 'detection-0': '자동검사',
    'risk-0-S': 8, 'risk-0-O': 4, 'risk-0-D': 3,
    'specialChar-1': 'SC', 'prevention-1': '온도모니터링', 'detection-1': '초중종검사',
    'risk-1-S': 7, 'risk-1-O': 3, 'risk-1-D': 4,
    'specialChar-2': '', 'prevention-2': '검사표준', 'detection-2': '외관검사',
    'risk-2-S': 5, 'risk-2-O': 2, 'risk-2-D': 3,
  }
};

// 색상 정의 (PFMEA와 동일한 패턴)
const COLORS = {
  bg: '#f5f7fa',
  text: '#333',
  primary: '#0d9488',
  primaryDark: '#0f766e',
  header: '#0d9488',
};

// 탭 정의
const CP_TABS = [
  { id: 'worksheet', label: 'CP 작성', icon: '📋' },
  { id: 'fmea4', label: 'FMEA 4판', icon: '📊' },
  { id: 'summary', label: '요약', icon: '📈' },
  { id: 'history', label: '이력', icon: '📜' },
];

export default function ControlPlanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 상태
  const [state, setState] = useState<CPPageState>({
    tab: 'worksheet',
    cpNo: '',
    partName: '',
    partNo: '',
    revNo: '01',
    customer: '',
    rows: [],
    fmea4Rows: [],
    linkedFmeaId: null,
    dirty: false,
  });
  
  const [fmeaList, setFmeaList] = useState<any[]>([]);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);

  // FMEA 목록 로드 (여러 localStorage 키 확인 + 기본 SDD 샘플)
  useEffect(() => {
    const loadFmeaList = () => {
      try {
        let allProjects: any[] = [];
        
        // 여러 localStorage 키에서 로드
        const keys = ['pfmea-projects', 'pfmea_projects', 'fmea-projects'];
        keys.forEach(key => {
          const saved = localStorage.getItem(key);
          if (saved) {
            const projects = JSON.parse(saved);
            if (Array.isArray(projects)) {
              allProjects = [...allProjects, ...projects];
            }
          }
        });
        
        // 기본 SDD 샘플 데이터 추가 (중복 체크)
        if (!allProjects.find(p => p.id === DEFAULT_SDD_FMEA.id)) {
          allProjects.push(DEFAULT_SDD_FMEA);
        }
        
        // 중복 제거 (ID 기준)
        const uniqueProjects = allProjects.reduce((acc: any[], curr) => {
          if (curr && curr.id && !acc.find(p => p.id === curr.id)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        
        setFmeaList(uniqueProjects);
      } catch (e) {
        console.error('FMEA 목록 로드 실패:', e);
        // 실패해도 기본 SDD 샘플은 표시
        setFmeaList([DEFAULT_SDD_FMEA]);
      }
    };
    loadFmeaList();
  }, []);

  // CP 데이터 로드
  useEffect(() => {
    const loadCP = () => {
      try {
        const saved = localStorage.getItem('control_plan_data');
        if (saved) {
          const data = JSON.parse(saved);
          setState(prev => ({ ...prev, ...data, dirty: false }));
        }
      } catch (e) {
        console.error('CP 데이터 로드 실패:', e);
      }
    };
    loadCP();
  }, []);

  // PFMEA에서 데이터 가져오기 (CP + FMEA 4판 동시 생성)
  const handleSyncFromFmea = useCallback((fmeaId: string) => {
    console.log('🔍 handleSyncFromFmea 호출:', fmeaId);
    
    try {
      // 기본 SDD 샘플 먼저 확인
      let fmea: any = null;
      if (fmeaId === DEFAULT_SDD_FMEA.id || fmeaId === 'PFM25-310') {
        fmea = DEFAULT_SDD_FMEA;
        console.log('✅ SDD 샘플 데이터 사용:', fmea);
      }
      
      // localStorage에서도 검색
      if (!fmea) {
        const keys = ['pfmea-projects', 'pfmea_projects', 'fmea-projects'];
        for (const key of keys) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const projects = JSON.parse(saved);
            if (Array.isArray(projects)) {
              fmea = projects.find((p: any) => p.id === fmeaId);
              if (fmea) {
                console.log('✅ localStorage에서 찾음:', key, fmea);
                break;
              }
            }
          }
        }
      }
      
      if (!fmea) {
        console.error('❌ FMEA를 찾을 수 없음:', fmeaId);
        setSyncMessage('❌ FMEA를 찾을 수 없습니다');
        setTimeout(() => setSyncMessage(null), 3000);
        return;
      }
      
      const riskData = fmea.riskData || {};
      const newRows: CPRow[] = [];
      const newFmea4Rows: Fmea4Row[] = [];
      let rowIndex = 0;
      
      console.log('🔄 FMEA 동기화 시작:', fmea.id, fmea);
      
      // L2 공정 순회
      (fmea.l2 || []).forEach((proc: any) => {
        if (!proc.name || proc.name.includes('클릭')) return;
        
        const processNo = proc.no || '';
        const processName = proc.name;
        const processDesc = (proc.functions || [])
          .map((f: any) => f.name)
          .filter((n: string) => n && !n.includes('클릭'))
          .join(', ');
        
        // FM 목록 (없으면 빈 배열)
        const failureModes = (proc.failureModes || []).filter((fm: any) => 
          fm.name && !fm.name.includes('클릭') && !fm.name.includes('추가')
        );
        
        // L3 작업요소 순회 (핵심: FM 유무와 관계없이 항상 순회)
        (proc.l3 || []).forEach((we: any) => {
          if (!we.name || we.name.includes('클릭') || we.name.includes('추가')) return;
          
          // === CP 행 생성 ===
          const cpRow = createEmptyCPRow(processNo, processName);
          cpRow.pfmeaProcessId = proc.id;
          cpRow.pfmeaWorkElemId = we.id;
          cpRow.processType = we.m4 === 'MC' ? '메인' : we.m4 === 'MN' ? '작업' : '';
          cpRow.processDesc = processDesc;
          cpRow.workElement = we.name;
          cpRow.specialChar = String(riskData[`specialChar-${rowIndex}`] || '');
          
          const prevention = String(riskData[`prevention-${rowIndex}`] || '');
          const detection = String(riskData[`detection-${rowIndex}`] || '');
          cpRow.controlMethod = [prevention, detection].filter(Boolean).join(' / ') || '작업일지';
          cpRow.ep = prevention.includes('Poka') || prevention.includes('Fool') || prevention.includes('Error');
          cpRow.syncStatus = 'synced';
          cpRow.lastSyncAt = new Date().toISOString();
          
          newRows.push(cpRow);
          
          // === FMEA 4판 행 생성 ===
          // FM이 있으면 각 FM별로, 없으면 기본 1개
          const fmList = failureModes.length > 0 ? failureModes : [{ name: '' }];
          
          fmList.forEach((fm: any) => {
            // FC (고장원인) 순회
            const failureCauses = (we.failureCauses || []).filter((fc: any) => 
              fc.name && !fc.name.includes('클릭') && !fc.name.includes('추가')
            );
            
            // FC가 있으면 각 FC별로, 없으면 기본 1개
            const fcList = failureCauses.length > 0 ? failureCauses : [{ name: '' }];
            
            fcList.forEach((fc: any) => {
              const fmea4Row = createEmptyFmea4Row(processNo, processName);
              fmea4Row.processFunction = processDesc;
              fmea4Row.failureMode = fm.name || '';
              fmea4Row.failureEffect = String(riskData[`effect-${rowIndex}`] || '');
              fmea4Row.failureCause = fc.name || '';
              
              const s = Number(riskData[`risk-${rowIndex}-S`]) || 0;
              const o = Number(riskData[`risk-${rowIndex}-O`]) || 0;
              const d = Number(riskData[`risk-${rowIndex}-D`]) || 0;
              
              fmea4Row.severity = s;
              fmea4Row.occurrence = o;
              fmea4Row.detection = d;
              fmea4Row.rpn = calculateRPN(s, o, d);
              fmea4Row.preventionControl = prevention;
              fmea4Row.detectionControl = detection;
              fmea4Row.specialChar1 = String(riskData[`specialChar-${rowIndex}`] || '');
              
              fmea4Row.preventionImprove = String(riskData[`opt-action-${rowIndex}`] || '');
              fmea4Row.detectionImprove = String(riskData[`opt-detection-action-${rowIndex}`] || '');
              fmea4Row.responsible = String(riskData[`opt-manager-${rowIndex}`] || '');
              fmea4Row.targetDate = String(riskData[`opt-target-date-${rowIndex}`] || '');
              
              const sAfter = Number(riskData[`opt-${rowIndex}-S`]) || 0;
              const oAfter = Number(riskData[`opt-${rowIndex}-O`]) || 0;
              const dAfter = Number(riskData[`opt-${rowIndex}-D`]) || 0;
              fmea4Row.severityAfter = sAfter;
              fmea4Row.occurrenceAfter = oAfter;
              fmea4Row.detectionAfter = dAfter;
              fmea4Row.rpnAfter = calculateRPN(sAfter, oAfter, dAfter);
              
              newFmea4Rows.push(fmea4Row);
            });
          });
          
          rowIndex++;
        });
      });
      
      console.log('✅ CP 행 생성:', newRows.length, '개');
      console.log('✅ FMEA 4판 행 생성:', newFmea4Rows.length, '개');
      
      // 기초정보 가져오기
      const fmeaInfo = fmea.fmeaInfo || {};
      
      setState(prev => ({
        ...prev,
        cpNo: `CP-${fmeaId.slice(0, 8)}`,
        partName: fmeaInfo.subject || fmea.project?.productName || '',
        partNo: fmeaInfo.partNo || '',
        customer: fmeaInfo.customer || fmeaInfo.customerName || '',
        rows: newRows,
        fmea4Rows: newFmea4Rows,
        linkedFmeaId: fmeaId,
        dirty: true,
      }));
      
      setSyncMessage(`✅ PFMEA에서 CP ${newRows.length}개 + 4판 ${newFmea4Rows.length}개 항목 생성`);
      setTimeout(() => setSyncMessage(null), 3000);
      
    } catch (e) {
      console.error('PFMEA 동기화 실패:', e);
      setSyncMessage('❌ PFMEA 동기화 실패');
      setTimeout(() => setSyncMessage(null), 3000);
    }
  }, []);

  // 저장
  const handleSave = useCallback(() => {
    setIsSaving(true);
    try {
      localStorage.setItem('control_plan_data', JSON.stringify({
        cpNo: state.cpNo,
        partName: state.partName,
        partNo: state.partNo,
        revNo: state.revNo,
        customer: state.customer,
        rows: state.rows,
        fmea4Rows: state.fmea4Rows,  // FMEA 4판 데이터 저장
        linkedFmeaId: state.linkedFmeaId,
        updatedAt: new Date().toISOString(),
      }));
      setState(prev => ({ ...prev, dirty: false }));
      setSyncMessage('✅ 저장 완료');
      setTimeout(() => setSyncMessage(null), 2000);
    } catch (e) {
      console.error('저장 실패:', e);
      setSyncMessage('❌ 저장 실패');
    }
    setIsSaving(false);
  }, [state]);

  // Excel Export
  const handleExport = useCallback(() => {
    if (state.rows.length === 0) {
      alert('⚠️ 내보낼 데이터가 없습니다.');
      return;
    }
    exportCPExcel(state.rows, {
      cpNo: state.cpNo,
      partName: state.partName,
      partNo: state.partNo,
      customer: state.customer,
    });
  }, [state]);

  // 행 추가
  const addRow = useCallback(() => {
    const lastRow = state.rows[state.rows.length - 1];
    const newRow = createEmptyCPRow(
      lastRow ? String(Number(lastRow.processNo) + 10) : '10',
      ''
    );
    setState(prev => ({ ...prev, rows: [...prev.rows, newRow], dirty: true }));
  }, [state.rows]);

  // 셀 값 변경
  const updateCell = useCallback((rowId: string, field: keyof CPRow, value: any) => {
    setState(prev => {
      const rows = [...prev.rows];
      const idx = rows.findIndex(r => r.id === rowId);
      if (idx === -1) return prev;

      const row = { ...rows[idx] };
      (row as any)[field] = value;
      
      // PFMEA 연동 필드 수정 시 syncStatus 변경
      const pfmeaSyncFields = ['specialChar', 'controlMethod', 'productChar', 'processChar'];
      if (pfmeaSyncFields.includes(field) && row.syncStatus === 'synced') {
        row.syncStatus = 'modified';
      }

      rows[idx] = row;
      return { ...prev, rows, dirty: true };
    });
  }, []);

  // 특별특성 색상
  const getSpecialCharColor = (value: string): string => {
    const opt = SPECIAL_CHAR_OPTIONS.find(o => o.value === value);
    return opt?.color || '#6b7280';
  };

  // 스타일
  const styles = {
    cell: 'border border-[#ccc] text-[11px] p-1 align-top',
    cellCenter: 'border border-[#ccc] text-[11px] p-1 text-center align-middle',
    syncedCell: 'bg-yellow-50',
    modifiedCell: 'bg-orange-100',
    input: 'w-full border-none bg-transparent text-[11px] outline-none focus:bg-blue-50 p-0.5',
    checkbox: 'w-4 h-4 cursor-pointer',
    select: 'w-full border-none bg-transparent text-[10px] outline-none cursor-pointer',
  };

  /** 공통 버튼 스타일 */
  const menuBtn = 'px-3 py-1 rounded transition-all bg-transparent border border-transparent text-white text-xs font-medium hover:bg-white/15 hover:text-yellow-400';

  return (
    <>
      {/* ===== TopNav (바로가기 메뉴) - PFMEA와 동일한 구조 ===== */}
      <CPTopNav 
        selectedCpId={state.cpNo}
        rowCount={state.rows.length}
        epCount={state.rows.filter(r => r.ep).length}
        autoCount={state.rows.filter(r => r.autoInspect).length}
      />
      
      <div className="h-full flex flex-col font-[Segoe_UI,Malgun_Gothic,Arial,sans-serif]" style={{ background: COLORS.bg, color: COLORS.text }}>
        
        {/* ===== TopMenuBar (상단 메뉴 바) - PFMEA TopMenuBar와 동일 ===== */}
        <div 
          className="flex items-center gap-2 fixed top-8 left-[50px] right-0 h-8 px-2 z-[99] border-t border-b border-white/30"
          style={{ background: 'linear-gradient(to right, #0f766e, #0d9488, #0f766e)' }}
        >
          {/* FMEA 선택 + 연동 버튼 */}
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-semibold">📋 FMEA:</span>
            <select
              id="fmea-select"
              value={state.linkedFmeaId || '__NEW__'}
              onChange={(e) => setState(prev => ({ ...prev, linkedFmeaId: e.target.value === '__NEW__' ? null : e.target.value }))}
              className="px-2 py-1 rounded border-0 bg-white/20 text-white min-w-[180px] text-xs"
            >
              <option value="__NEW__" className="text-gray-800 font-bold">📄 FMEA 선택...</option>
              {fmeaList.map((fmea: any) => (
                <option key={fmea.id} value={fmea.id} className="text-gray-800">
                  {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const selectEl = document.getElementById('fmea-select') as HTMLSelectElement;
                const selectedId = selectEl?.value;
                if (selectedId && selectedId !== '__NEW__') {
                  handleSyncFromFmea(selectedId);
                } else {
                  setSyncMessage('⚠️ FMEA를 먼저 선택하세요');
                  setTimeout(() => setSyncMessage(null), 2000);
                }
              }}
              className="px-3 py-1 rounded bg-yellow-500 text-white text-xs font-bold hover:bg-yellow-400 transition-all"
            >
              🔗 CP 생성
            </button>
            {state.linkedFmeaId && (
              <button
                onClick={() => handleSyncFromFmea(state.linkedFmeaId!)}
                className="px-2 py-1 text-white rounded hover:bg-white/20 text-xs"
                title="PFMEA에서 재동기화"
              >
                🔄
              </button>
            )}
          </div>

          <div className="w-px h-5 bg-white/30" />

          {/* 저장/Import/Export */}
          <div className="flex items-center gap-1.5 relative">
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              className={`px-3 py-1 rounded transition-all text-white text-xs font-semibold ${
                isSaving ? 'bg-orange-500' : state.dirty ? 'bg-green-600' : 'bg-white/15'
              }`}
            >
              {isSaving ? '⏳저장중' : state.dirty ? '💾저장' : '✅저장됨'}
            </button>
            
            {/* Import 버튼 및 드롭다운 */}
            <div className="relative">
              <button 
                onClick={() => setShowImportMenu(!showImportMenu)}
                className={menuBtn}
              >
                📥Import▾
              </button>
              {showImportMenu && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border z-50 min-w-[160px]"
                  onMouseLeave={() => setShowImportMenu(false)}
                >
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowImportMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b text-gray-800"
                  >
                    📂 Excel 파일 가져오기
                  </button>
                  <button
                    onClick={() => { setShowImportMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-gray-800"
                  >
                    📋 템플릿 다운로드
                  </button>
                </div>
              )}
            </div>
            
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" />
            
            <button onClick={handleExport} className={menuBtn}>📤Export</button>
            
            {syncMessage && (
              <span className={`px-3 py-1 rounded text-white text-xs font-semibold bg-green-600`}>
                {syncMessage}
              </span>
            )}
          </div>

          <div className="w-px h-5 bg-white/30" />

          {/* 기초정보 */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/80 text-[10px]">CP No:</span>
            <input
              type="text"
              value={state.cpNo}
              onChange={(e) => setState(prev => ({ ...prev, cpNo: e.target.value, dirty: true }))}
              className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[10px] w-20 border-0"
              placeholder="CP-0001"
            />
            <span className="text-white/80 text-[10px]">품명:</span>
            <input
              type="text"
              value={state.partName}
              onChange={(e) => setState(prev => ({ ...prev, partName: e.target.value, dirty: true }))}
              className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[10px] w-24 border-0"
            />
            <span className="text-white/80 text-[10px]">품번:</span>
            <input
              type="text"
              value={state.partNo}
              onChange={(e) => setState(prev => ({ ...prev, partNo: e.target.value, dirty: true }))}
              className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[10px] w-20 border-0"
            />
            <span className="text-white/80 text-[10px]">고객:</span>
            <input
              type="text"
              value={state.customer}
              onChange={(e) => setState(prev => ({ ...prev, customer: e.target.value, dirty: true }))}
              className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[10px] w-20 border-0"
            />
          </div>

          {/* 우측: 현황 - 280px */}
          <div className="flex-1" />
          <div 
            className="absolute right-0 top-0 w-[280px] h-8 flex items-stretch border-l-[2px] border-white"
            style={{ background: 'linear-gradient(to right, #0f766e, #0d9488)' }}
          >
            <div className="w-[80px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
              <span className="text-yellow-400 text-xs font-bold whitespace-nowrap">현황:</span>
            </div>
            <div className="w-[100px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
              <span className="text-white text-xs font-semibold whitespace-nowrap">관리항목: {state.rows.length}</span>
            </div>
            <div className="w-[100px] h-8 flex items-center justify-center shrink-0">
              <span className="text-green-300 text-xs font-semibold whitespace-nowrap">
                {state.linkedFmeaId ? '🔗FMEA연동' : '미연동'}
              </span>
            </div>
          </div>
        </div>

        {/* ===== TabMenu (탭 메뉴) - PFMEA TabMenu와 동일 ===== */}
        <div 
          className="fixed top-16 left-[50px] right-0 h-9 z-[98] bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 border-b-[2px] border-teal-700"
        >
          <div className="flex-shrink-0 h-9 pl-2 pr-0 flex items-center justify-between">
            {/* 좌측: 탭 버튼들 */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {CP_TABS.map(tab => {
                  const isActive = state.tab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setState(prev => ({ ...prev, tab: tab.id }))}
                      style={{
                        padding: '5px 14px',
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 500,
                        background: isActive ? '#0d9488' : 'transparent',
                        border: isActive ? '1px solid #ffd600' : '1px solid transparent',
                        borderRadius: '4px',
                        color: isActive ? '#ffd600' : '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        textShadow: isActive ? '0 0 8px rgba(255,214,0,0.5)' : 'none',
                      }}
                      onMouseOver={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                          e.currentTarget.style.color = '#ffd600';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#fff';
                        }
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-white/30 mx-2" />
              
              {/* 행 추가 버튼 */}
              <button
                onClick={addRow}
                className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-500 transition-all"
              >
                + 행추가
              </button>
            </div>

            {/* 우측: 범례 */}
            <div className="w-[280px] h-9 flex items-stretch bg-gradient-to-r from-teal-800 to-teal-700 border-l-[2px] border-white shrink-0">
              <div className="flex-1 h-9 flex items-center justify-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-white/80">
                  <span className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded-sm"></span>
                  PFMEA연동
                </span>
                <span className="flex items-center gap-1 text-[10px] text-white/80">
                  <span className="w-3 h-3 bg-orange-200 border border-orange-400 rounded-sm"></span>
                  수정됨
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 메인 레이아웃 (top-[100px]) - PFMEA와 동일 ===== */}
        <div className="fixed top-[100px] left-[50px] right-0 bottom-0 flex flex-row overflow-x-auto overflow-y-hidden">
          
          {/* ===== 좌측: 워크시트 영역 ===== */}
          <div className="flex-1 flex flex-col min-w-0 bg-white overflow-auto">
            
            {/* ===== CP 작성 탭 ===== */}
            {state.tab === 'worksheet' && (
              <>
                {/* 테이블 제목 */}
                <div 
                  className="shrink-0 flex items-center justify-center relative font-black py-0.5 px-2 text-[13px] border-b-2 border-black"
                  style={{ background: COLORS.header, color: '#fff' }}
                >
                  <span>Control Plan (관리계획서)</span>
                </div>

                {/* 테이블 */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse min-w-[1800px]">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr>
                        {CP_HEADER_GROUPS.map((group, idx) => (
                          <th key={idx} colSpan={group.colspan} className="text-white text-xs font-bold text-center border border-white/30 py-1.5" style={{ background: group.bg }}>
                            {group.label}
                          </th>
                        ))}
                      </tr>
                      <tr>
                        {CP_COLUMNS.map((col) => (
                          <th key={col.key} className={`bg-gray-200 text-gray-800 text-[10px] font-semibold text-center border border-gray-300 py-1 px-1 ${col.pfmeaSync ? 'bg-yellow-100' : ''}`} style={{ width: col.width, minWidth: col.width }}>
                            {col.label}
                            {col.pfmeaSync && <span className="ml-0.5 text-yellow-600">🔗</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.rows.length === 0 ? (
                        <tr>
                          <td colSpan={19} className="text-center py-16 text-gray-400">
                            <div className="text-lg mb-2">📋 데이터가 없습니다</div>
                            <div className="text-sm">상단에서 PFMEA를 선택하여 데이터를 가져오거나,<br/>[+ 행추가] 버튼으로 직접 입력하세요.</div>
                          </td>
                        </tr>
                      ) : (
                        state.rows.map((row, idx) => {
                          const zebraBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                          const statusBg = row.syncStatus === 'modified' ? styles.modifiedCell : '';
                          return (
                            <tr key={row.id} className={zebraBg}>
                              <td className={`${styles.cellCenter} ${styles.syncedCell}`}><input type="text" value={row.processNo} onChange={(e) => updateCell(row.id, 'processNo', e.target.value)} className={styles.input} /></td>
                              <td className={`${styles.cell} ${styles.syncedCell}`}><input type="text" value={row.processName} onChange={(e) => updateCell(row.id, 'processName', e.target.value)} className={styles.input} /></td>
                              <td className={styles.cellCenter}><select value={row.processType} onChange={(e) => updateCell(row.id, 'processType', e.target.value)} className={styles.select}><option value="">-</option><option value="메인">메인</option><option value="서브">서브</option><option value="작업">작업</option></select></td>
                              <td className={`${styles.cell} ${styles.syncedCell}`}><input type="text" value={row.processDesc} onChange={(e) => updateCell(row.id, 'processDesc', e.target.value)} className={styles.input} /></td>
                              <td className={`${styles.cell} ${styles.syncedCell}`}><input type="text" value={row.workElement} onChange={(e) => updateCell(row.id, 'workElement', e.target.value)} className={styles.input} /></td>
                              <td className={styles.cellCenter}><input type="checkbox" checked={row.ep} onChange={(e) => updateCell(row.id, 'ep', e.target.checked)} className={styles.checkbox} /></td>
                              <td className={styles.cellCenter}><input type="checkbox" checked={row.autoInspect} onChange={(e) => updateCell(row.id, 'autoInspect', e.target.checked)} className={styles.checkbox} /></td>
                              <td className={styles.cellCenter}><input type="text" value={row.itemNo} onChange={(e) => updateCell(row.id, 'itemNo', e.target.value)} className={`${styles.input} text-center`} /></td>
                              <td className={`${styles.cell} ${styles.syncedCell} ${statusBg}`}><input type="text" value={row.productChar} onChange={(e) => updateCell(row.id, 'productChar', e.target.value)} className={styles.input} /></td>
                              <td className={`${styles.cellCenter} ${statusBg}`}><input type="text" value={row.processChar} onChange={(e) => updateCell(row.id, 'processChar', e.target.value)} className={`${styles.input} text-center`} /></td>
                              <td className={`${styles.cellCenter} ${styles.syncedCell} ${statusBg}`} style={{ color: getSpecialCharColor(row.specialChar) }}><select value={row.specialChar} onChange={(e) => updateCell(row.id, 'specialChar', e.target.value)} className={styles.select} style={{ color: getSpecialCharColor(row.specialChar), fontWeight: 600 }}>{SPECIAL_CHAR_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.value || '-'}</option>))}</select></td>
                              <td className={styles.cell}><input type="text" value={row.specTolerance} onChange={(e) => updateCell(row.id, 'specTolerance', e.target.value)} className={styles.input} /></td>
                              <td className={styles.cell}><select value={row.measureMethod} onChange={(e) => updateCell(row.id, 'measureMethod', e.target.value)} className={styles.select}><option value="">선택</option>{MEASURE_METHOD_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></td>
                              <td className={styles.cellCenter}><input type="text" value={row.sampleSize} onChange={(e) => updateCell(row.id, 'sampleSize', e.target.value)} className={`${styles.input} text-center`} /></td>
                              <td className={styles.cellCenter}><select value={row.frequency} onChange={(e) => updateCell(row.id, 'frequency', e.target.value)} className={styles.select}><option value="">선택</option>{FREQUENCY_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></td>
                              <td className={`${styles.cell} ${styles.syncedCell} ${statusBg}`}><input type="text" value={row.controlMethod} onChange={(e) => updateCell(row.id, 'controlMethod', e.target.value)} className={styles.input} /></td>
                              <td className={styles.cellCenter}><input type="checkbox" checked={row.production} onChange={(e) => updateCell(row.id, 'production', e.target.checked)} className={styles.checkbox} /></td>
                              <td className={styles.cellCenter}><input type="checkbox" checked={row.quality} onChange={(e) => updateCell(row.id, 'quality', e.target.checked)} className={styles.checkbox} /></td>
                              <td className={styles.cell}><select value={row.actionMethod} onChange={(e) => updateCell(row.id, 'actionMethod', e.target.value)} className={styles.select}><option value="">선택</option>{ACTION_METHOD_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ===== FMEA 4판 탭 ===== */}
            {state.tab === 'fmea4' && (
              <>
                {/* 테이블 제목 */}
                <div 
                  className="shrink-0 flex items-center justify-center relative font-black py-0.5 px-2 text-[13px] border-b-2 border-black"
                  style={{ background: '#2563eb', color: '#fff' }}
                >
                  <span>📊 FMEA 4판 (RPN 방식) - {state.fmea4Rows.length}건</span>
                </div>

                {/* 4판 테이블 */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse min-w-[2200px]">
                    <thead className="sticky top-0 z-10 bg-white">
                      {/* 그룹 헤더 */}
                      <tr>
                        {FMEA4_HEADER_GROUPS.map((group, idx) => (
                          <th key={idx} colSpan={group.colspan} className="bg-blue-600 text-white text-xs font-bold text-center border border-blue-400 py-1.5">
                            {group.label}
                          </th>
                        ))}
                      </tr>
                      {/* 열 헤더 */}
                      <tr>
                        {FMEA4_COLUMNS.map((col) => (
                          <th key={col.key} className="bg-blue-100 text-blue-900 text-[10px] font-semibold text-center border border-blue-300 py-1 px-1" style={{ width: col.width, minWidth: col.width }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.fmea4Rows.length === 0 ? (
                        <tr>
                          <td colSpan={23} className="text-center py-16 text-gray-400">
                            <div className="text-lg mb-2">📊 FMEA 4판 데이터가 없습니다</div>
                            <div className="text-sm">상단에서 PFMEA를 선택하면 자동으로 4판 형식으로 변환됩니다.</div>
                          </td>
                        </tr>
                      ) : (
                        state.fmea4Rows.map((row, idx) => {
                          const zebraBg = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50';
                          const rpnLevel = getRPNLevel(row.rpn);
                          const rpnColor = RPN_COLORS[rpnLevel];
                          const rpnAfterLevel = getRPNLevel(row.rpnAfter);
                          const rpnAfterColor = row.rpnAfter > 0 ? RPN_COLORS[rpnAfterLevel] : { bg: '#f9fafb', text: '#9ca3af', border: '#e5e7eb' };
                          
                          return (
                            <tr key={row.id} className={zebraBg}>
                              <td className={`${styles.cellCenter}`}>{row.processNo}</td>
                              <td className={styles.cell}>{row.processName}</td>
                              <td className={styles.cell}>{row.processFunction}</td>
                              <td className={styles.cell}>{row.failureMode}</td>
                              <td className={`${styles.cellCenter} font-bold`} style={{ color: row.specialChar1 === 'CC' ? '#dc2626' : row.specialChar1 === 'SC' ? '#ea580c' : '#6b7280' }}>{row.specialChar1 || '-'}</td>
                              <td className={styles.cell}>{row.failureEffect}</td>
                              <td className={`${styles.cellCenter} font-bold`}>{row.severity || '-'}</td>
                              <td className={`${styles.cellCenter} font-bold`} style={{ color: row.specialChar2 === 'CC' ? '#dc2626' : row.specialChar2 === 'SC' ? '#ea580c' : '#6b7280' }}>{row.specialChar2 || '-'}</td>
                              <td className={styles.cell}>{row.failureCause}</td>
                              <td className={styles.cell}>{row.preventionControl}</td>
                              <td className={`${styles.cellCenter} font-bold`}>{row.occurrence || '-'}</td>
                              <td className={styles.cell}>{row.detectionControl}</td>
                              <td className={`${styles.cellCenter} font-bold`}>{row.detection || '-'}</td>
                              <td className={`${styles.cellCenter} font-bold`} style={{ background: rpnColor.bg, color: rpnColor.text, border: `1px solid ${rpnColor.border}` }}>{row.rpn || '-'}</td>
                              <td className={styles.cell}>{row.preventionImprove}</td>
                              <td className={styles.cell}>{row.detectionImprove}</td>
                              <td className={styles.cellCenter}>{row.responsible}</td>
                              <td className={styles.cellCenter}>{row.targetDate}</td>
                              <td className={`${styles.cellCenter} font-bold`}>{row.severityAfter || '-'}</td>
                              <td className={`${styles.cellCenter} font-bold`}>{row.occurrenceAfter || '-'}</td>
                              <td className={`${styles.cellCenter} font-bold`}>{row.detectionAfter || '-'}</td>
                              <td className={`${styles.cellCenter} font-bold`} style={{ background: rpnAfterColor.bg, color: rpnAfterColor.text, border: `1px solid ${rpnAfterColor.border}` }}>{row.rpnAfter || '-'}</td>
                              <td className={styles.cell}>{row.remarks}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ===== 요약 탭 ===== */}
            {state.tab === 'summary' && (
              <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto space-y-6">
                  <h2 className="text-xl font-bold text-teal-700 mb-4">📈 CP / FMEA 4판 요약</h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* CP 요약 */}
                    <div className="bg-white rounded-lg p-5 shadow-md border border-teal-200">
                      <h3 className="text-lg font-bold text-teal-700 mb-3 border-b pb-2">📋 Control Plan 요약</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>총 관리항목:</span><span className="font-bold text-teal-600">{state.rows.length}건</span></div>
                        <div className="flex justify-between"><span>특별특성(CC):</span><span className="font-bold text-red-600">{state.rows.filter(r => r.specialChar === 'CC').length}건</span></div>
                        <div className="flex justify-between"><span>특별특성(SC):</span><span className="font-bold text-orange-600">{state.rows.filter(r => r.specialChar === 'SC').length}건</span></div>
                        <div className="flex justify-between"><span>EP 적용:</span><span className="font-bold text-blue-600">{state.rows.filter(r => r.ep).length}건</span></div>
                      </div>
                    </div>

                    {/* FMEA 4판 요약 */}
                    <div className="bg-white rounded-lg p-5 shadow-md border border-blue-200">
                      <h3 className="text-lg font-bold text-blue-700 mb-3 border-b pb-2">📊 FMEA 4판 요약</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>총 항목:</span><span className="font-bold text-blue-600">{state.fmea4Rows.length}건</span></div>
                        <div className="flex justify-between"><span>고위험(RPN≥200):</span><span className="font-bold text-red-600">{state.fmea4Rows.filter(r => r.rpn >= 200).length}건</span></div>
                        <div className="flex justify-between"><span>중위험(100≤RPN&lt;200):</span><span className="font-bold text-orange-600">{state.fmea4Rows.filter(r => r.rpn >= 100 && r.rpn < 200).length}건</span></div>
                        <div className="flex justify-between"><span>저위험(RPN&lt;100):</span><span className="font-bold text-green-600">{state.fmea4Rows.filter(r => r.rpn > 0 && r.rpn < 100).length}건</span></div>
                        <div className="flex justify-between"><span>개선 완료:</span><span className="font-bold text-purple-600">{state.fmea4Rows.filter(r => r.rpnAfter > 0 && r.rpnAfter < r.rpn).length}건</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== 이력 탭 ===== */}
            {state.tab === 'history' && (
              <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-bold text-teal-700 mb-4">📜 변경 이력</h2>
                  <div className="bg-white rounded-lg p-5 shadow-md border">
                    <p className="text-gray-500 text-sm">변경 이력 기능은 추후 구현 예정입니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== 우측: 트리뷰 패널 영역 (280px) - PFMEA와 동일 ===== */}
          <div className="w-[280px] shrink-0 flex flex-col bg-[#f0f4f8] overflow-hidden border-l-2 border-white">
            {/* 패널 헤더 */}
            <div className="h-8 bg-teal-700 flex items-center px-3 border-b border-teal-600">
              <span className="text-white text-xs font-bold">📊 CP 요약</span>
            </div>
            
            {/* 패널 내용 */}
            <div className="flex-1 p-3 overflow-auto">
              <div className="space-y-3">
                <div className="bg-white rounded p-3 shadow-sm">
                  <div className="text-xs font-bold text-teal-700 mb-2">기본정보</div>
                  <div className="text-[11px] text-gray-600 space-y-1">
                    <div>CP No: <span className="font-semibold text-gray-800">{state.cpNo || '-'}</span></div>
                    <div>품명: <span className="font-semibold text-gray-800">{state.partName || '-'}</span></div>
                    <div>품번: <span className="font-semibold text-gray-800">{state.partNo || '-'}</span></div>
                    <div>고객: <span className="font-semibold text-gray-800">{state.customer || '-'}</span></div>
                  </div>
                </div>
                
                <div className="bg-white rounded p-3 shadow-sm">
                  <div className="text-xs font-bold text-teal-700 mb-2">📋 CP 통계</div>
                  <div className="text-[11px] text-gray-600 space-y-1">
                    <div>총 관리항목: <span className="font-bold text-teal-600">{state.rows.length}건</span></div>
                    <div>특별특성(CC): <span className="font-bold text-red-600">{state.rows.filter(r => r.specialChar === 'CC').length}건</span></div>
                    <div>특별특성(SC): <span className="font-bold text-orange-600">{state.rows.filter(r => r.specialChar === 'SC').length}건</span></div>
                    <div>EP 적용: <span className="font-bold text-blue-600">{state.rows.filter(r => r.ep).length}건</span></div>
                  </div>
                </div>

                {/* FMEA 4판 통계 */}
                {state.fmea4Rows.length > 0 && (
                  <div className="bg-blue-50 rounded p-3 shadow-sm border border-blue-200">
                    <div className="text-xs font-bold text-blue-700 mb-2">📊 FMEA 4판 통계</div>
                    <div className="text-[11px] text-gray-600 space-y-1">
                      <div>총 항목: <span className="font-bold text-blue-600">{state.fmea4Rows.length}건</span></div>
                      <div>고위험(RPN≥200): <span className="font-bold text-red-600">{state.fmea4Rows.filter(r => r.rpn >= 200).length}건</span></div>
                      <div>중위험(100≤RPN&lt;200): <span className="font-bold text-orange-600">{state.fmea4Rows.filter(r => r.rpn >= 100 && r.rpn < 200).length}건</span></div>
                      <div>저위험(RPN&lt;100): <span className="font-bold text-green-600">{state.fmea4Rows.filter(r => r.rpn > 0 && r.rpn < 100).length}건</span></div>
                    </div>
                  </div>
                )}
                
                {state.linkedFmeaId && (
                  <div className="bg-yellow-50 rounded p-3 shadow-sm border border-yellow-200">
                    <div className="text-xs font-bold text-yellow-700 mb-2">🔗 FMEA 연동</div>
                    <div className="text-[11px] text-gray-600">
                      <div>연동됨</div>
                      <button
                        onClick={() => router.push(`/pfmea/worksheet?id=${state.linkedFmeaId}`)}
                        className="mt-2 px-2 py-1 bg-yellow-500 text-white text-[10px] rounded hover:bg-yellow-600"
                      >
                        PFMEA 열기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
