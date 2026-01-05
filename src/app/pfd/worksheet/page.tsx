'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PFDTopNav from '@/components/layout/PFDTopNav';
import { 
  PFDRow, 
  createEmptyPFDRow, 
  PFD_COLUMNS, 
  PFD_HEADER_GROUPS,
  SYMBOL_OPTIONS,
  FOURM_OPTIONS,
  PROCESS_TYPE_OPTIONS,
  SPECIAL_CHAR_OPTIONS
} from '../../pfmea/worksheet/types/pfd';

// 기본 SDD 샘플 데이터 (새 ID 형식)
const DEFAULT_SDD_FMEA = {
  id: 'pfm26-P001',
  project: { projectName: 'SDD NEW FMEA 개발', customer: 'SDD', productName: 'PCR 타이어' },
  fmeaInfo: { subject: 'SDD NEW FMEA 개발', customer: 'SDD' },
  l2: [
    { id: 'proc-1', no: '10', name: '프레스', functions: [{ name: '원료투입' }] },
    { id: 'proc-2', no: '20', name: '가류', functions: [{ name: '가열성형' }] },
    { id: 'proc-3', no: '30', name: '검사', functions: [{ name: '품질검사' }] },
  ],
  riskData: {
    'specialChar-0': 'CC',
    'specialChar-1': 'SC',
    'specialChar-2': '',
  }
};

// PFD 페이지 상태
interface PFDPageState {
  tab: string;
  pfdNo: string;
  partName: string;
  partNo: string;
  revNo: string;
  customer: string;
  rows: PFDRow[];
  linkedFmeaId: string | null;
  dirty: boolean;
}

// 빈 행 10개 생성 함수
const createEmptyRows = (count: number = 10): PFDRow[] => {
  return Array.from({ length: count }, (_, idx) => {
    const row = createEmptyPFDRow(String((idx + 1) * 10), '');
    row.seqNo = idx + 1;
    return row;
  });
};

// 색상 정의
const COLORS = {
  bg: '#f5f7fa',
  text: '#333',
  primary: '#7c3aed',
  primaryDark: '#6d28d9',
  header: '#7c3aed',
};

// 탭 정의
const PFD_TABS = [
  { id: 'worksheet', label: 'PFD 작성', icon: '📋' },
  { id: 'flowchart', label: '플로우차트', icon: '📊' },
  { id: 'summary', label: '요약', icon: '📈' },
  { id: 'history', label: '이력', icon: '📜' },
];

export default function PFDWorksheetPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 상태 - 초기 빈행 10개 생성
  const [state, setState] = useState<PFDPageState>(() => ({
    tab: 'worksheet',
    pfdNo: '',
    partName: '',
    partNo: '',
    revNo: '01',
    customer: '',
    rows: createEmptyRows(10),
    linkedFmeaId: null,
    dirty: false,
  }));
  
  const [fmeaList, setFmeaList] = useState<any[]>([]);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 통계 계산 (실제 데이터가 있는 행만)
  const filledRows = useMemo(() => state.rows.filter(row => row.processName && row.processName.trim() !== ''), [state.rows]);
  const mainCount = useMemo(() => filledRows.filter(row => row.processType === 'main').length, [filledRows]);
  const inspectCount = useMemo(() => filledRows.filter(row => row.processType === 'inspection' || row.symbol === 'inspection').length, [filledRows]);

  // FMEA 목록 로드
  useEffect(() => {
    const loadFmeaList = () => {
      try {
        let allProjects: any[] = [];
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
        
        if (!allProjects.find(p => p.id === DEFAULT_SDD_FMEA.id)) {
          allProjects.push(DEFAULT_SDD_FMEA);
        }
        
        const uniqueProjects = allProjects.reduce((acc: any[], curr) => {
          if (curr && curr.id && !acc.find(p => p.id === curr.id)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        
        setFmeaList(uniqueProjects);
      } catch (e) {
        console.error('FMEA 목록 로드 실패:', e);
        setFmeaList([DEFAULT_SDD_FMEA]);
      }
    };
    loadFmeaList();
  }, []);

  // PFD 데이터 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pfd_data');
      if (saved) {
        const data = JSON.parse(saved);
        // 저장된 rows가 없거나 비어있으면 빈행 10개 생성
        const rows = data.rows && data.rows.length > 0 ? data.rows : createEmptyRows(10);
        setState(prev => ({ ...prev, ...data, rows, dirty: false }));
      }
    } catch (e) {
      console.error('PFD 데이터 로드 실패:', e);
    }
  }, []);

  // PFMEA에서 데이터 가져오기
  const handleSyncFromFmea = useCallback((fmeaId: string) => {
    console.log('🔍 PFD handleSyncFromFmea 호출:', fmeaId);
    
    try {
      let fmea: any = null;
      if (fmeaId === DEFAULT_SDD_FMEA.id || fmeaId.toLowerCase() === 'pfm26-p001') {
        fmea = DEFAULT_SDD_FMEA;
      }
      
      if (!fmea) {
        const keys = ['pfmea-projects', 'pfmea_projects', 'fmea-projects'];
        for (const key of keys) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const projects = JSON.parse(saved);
            if (Array.isArray(projects)) {
              fmea = projects.find((p: any) => p.id === fmeaId);
              if (fmea) break;
            }
          }
        }
      }
      
      if (!fmea) {
        setSyncMessage('❌ FMEA를 찾을 수 없습니다');
        setTimeout(() => setSyncMessage(null), 3000);
        return;
      }
      
      const riskData = fmea.riskData || {};
      const newRows: PFDRow[] = [];
      let seqNo = 1;
      
      // L2 공정 순회
      (fmea.l2 || []).forEach((proc: any, idx: number) => {
        if (!proc.name || proc.name.includes('클릭')) return;
        
        const row = createEmptyPFDRow(proc.no || '', proc.name);
        row.seqNo = seqNo++;
        row.processDesc = (proc.functions || [])
          .map((f: any) => f.name)
          .filter((n: string) => n && !n.includes('클릭'))
          .join(', ');
        row.pfmeaProcessId = proc.id;
        row.specialChar = String(riskData[`specialChar-${idx}`] || '');
        row.symbol = 'operation';
        row.processType = idx === 0 ? 'main' : '';
        row.syncStatus = 'synced';
        row.lastSyncAt = new Date().toISOString();
        
        newRows.push(row);
      });
      
      const fmeaInfo = fmea.fmeaInfo || {};
      
      // 최소 10개 행 유지 - FMEA 데이터 + 빈행
      let finalRows = [...newRows];
      if (finalRows.length < 10) {
        const emptyCount = 10 - finalRows.length;
        for (let i = 0; i < emptyCount; i++) {
          const lastRow = finalRows[finalRows.length - 1];
          const nextNo = lastRow ? String(Number(lastRow.processNo) + 10) : String((finalRows.length + 1) * 10);
          const emptyRow = createEmptyPFDRow(nextNo, '');
          emptyRow.seqNo = finalRows.length + 1;
          finalRows.push(emptyRow);
        }
      }
      
      setState(prev => ({
        ...prev,
        pfdNo: `PFD-${fmeaId.slice(0, 8)}`,
        partName: fmeaInfo.subject || fmea.project?.productName || '',
        partNo: fmeaInfo.partNo || '',
        customer: fmeaInfo.customer || fmeaInfo.customerName || '',
        rows: finalRows,
        linkedFmeaId: fmeaId,
        dirty: true,
      }));
      
      setSyncMessage(`✅ PFMEA에서 ${newRows.length}개 공정 가져옴 (총 ${finalRows.length}행)`);
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
      localStorage.setItem('pfd_data', JSON.stringify({
        pfdNo: state.pfdNo,
        partName: state.partName,
        partNo: state.partNo,
        revNo: state.revNo,
        customer: state.customer,
        rows: state.rows,
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

  // 행 추가
  const addRow = useCallback(() => {
    const lastRow = state.rows[state.rows.length - 1];
    const newRow = createEmptyPFDRow(
      lastRow ? String(Number(lastRow.processNo) + 10) : '10',
      ''
    );
    newRow.seqNo = state.rows.length + 1;
    setState(prev => ({ ...prev, rows: [...prev.rows, newRow], dirty: true }));
  }, [state.rows]);

  // 셀 값 변경
  const updateCell = useCallback((rowId: string, field: keyof PFDRow, value: any) => {
    setState(prev => {
      const rows = [...prev.rows];
      const idx = rows.findIndex(r => r.id === rowId);
      if (idx === -1) return prev;
      const row = { ...rows[idx] };
      (row as any)[field] = value;
      if (row.syncStatus === 'synced') {
        row.syncStatus = 'modified';
      }
      rows[idx] = row;
      return { ...prev, rows, dirty: true };
    });
  }, []);

  // 기호 렌더링
  const renderSymbol = (symbol: string) => {
    const opt = SYMBOL_OPTIONS.find(o => o.value === symbol);
    return opt ? <span className="text-lg">{opt.icon}</span> : '-';
  };

  // 스타일
  const styles = {
    cell: 'border border-[#ccc] text-[11px] p-1 align-top',
    cellCenter: 'border border-[#ccc] text-[11px] p-1 text-center align-middle',
    syncedCell: 'bg-purple-50',
    modifiedCell: 'bg-orange-100',
    input: 'w-full border-none bg-transparent text-[11px] outline-none focus:bg-purple-50 p-0.5',
    select: 'w-full border-none bg-transparent text-[10px] outline-none cursor-pointer',
  };

  const menuBtn = 'px-3 py-1 rounded transition-all bg-transparent border border-transparent text-white text-xs font-medium hover:bg-white/15 hover:text-yellow-400';

  return (
    <>
      <PFDTopNav 
        linkedFmeaId={state.linkedFmeaId} 
        rowCount={state.rows.length}
        mainCount={mainCount}
        inspectCount={inspectCount}
      />
      
      <div className="h-full flex flex-col font-[Segoe_UI,Malgun_Gothic,Arial,sans-serif]" style={{ background: COLORS.bg, color: COLORS.text }}>
        
        {/* TopMenuBar */}
        <div 
          className="flex items-center gap-2 fixed top-8 left-[50px] right-0 h-8 px-2 z-[99] border-t border-b border-white/30"
          style={{ background: 'linear-gradient(to right, #6d28d9, #7c3aed, #6d28d9)' }}
        >
          {/* FMEA 선택 */}
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
              🔗 PFD 생성
            </button>
          </div>

          <div className="w-px h-5 bg-white/30" />

          {/* 저장 */}
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className={`px-3 py-1 rounded transition-all text-white text-xs font-semibold ${
              isSaving ? 'bg-orange-500' : state.dirty ? 'bg-green-600' : 'bg-white/15'
            }`}
          >
            {isSaving ? '⏳저장중' : state.dirty ? '💾저장' : '✅저장됨'}
          </button>
          
          {syncMessage && (
            <span className="px-3 py-1 rounded text-white text-xs font-semibold bg-green-600">
              {syncMessage}
            </span>
          )}

          <div className="w-px h-5 bg-white/30" />

          {/* 기초정보 */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/80 text-[10px]">PFD No:</span>
            <input
              type="text"
              value={state.pfdNo}
              onChange={(e) => setState(prev => ({ ...prev, pfdNo: e.target.value, dirty: true }))}
              className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[10px] w-20 border-0"
              placeholder="PFD-0001"
            />
            <span className="text-white/80 text-[10px]">품명:</span>
            <input
              type="text"
              value={state.partName}
              onChange={(e) => setState(prev => ({ ...prev, partName: e.target.value, dirty: true }))}
              className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[10px] w-24 border-0"
            />
          </div>

          <div className="flex-1" />
        </div>

        {/* TabMenu */}
        <div className="fixed top-16 left-[50px] right-0 h-9 z-[98] bg-gradient-to-r from-violet-900 via-violet-800 to-violet-900 border-b-[2px] border-violet-700">
          <div className="flex-shrink-0 h-9 pl-2 pr-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {PFD_TABS.map(tab => {
                  const isActive = state.tab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setState(prev => ({ ...prev, tab: tab.id }))}
                      style={{
                        padding: '5px 14px',
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 500,
                        background: isActive ? '#7c3aed' : 'transparent',
                        border: isActive ? '1px solid #ffd600' : '1px solid transparent',
                        borderRadius: '4px',
                        color: isActive ? '#ffd600' : '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-white/30 mx-2" />
              
              <button
                onClick={addRow}
                className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-500"
              >
                + 행추가
              </button>
            </div>
          </div>
        </div>

        {/* 메인 레이아웃 */}
        <div className="fixed top-[100px] left-[50px] right-0 bottom-0 flex flex-row overflow-x-auto overflow-y-hidden">
          
          {/* 좌측: 워크시트 영역 */}
          <div className="flex-1 flex flex-col min-w-0 bg-white overflow-auto">
            
            {state.tab === 'worksheet' && (
              <>
                <div 
                  className="shrink-0 flex items-center justify-center font-black py-0.5 px-2 text-[13px] border-b-2 border-black"
                  style={{ background: COLORS.header, color: '#fff' }}
                >
                  <span>Process Flow Diagram (공정흐름도) - 입력됨: {filledRows.length}건 / 전체: {state.rows.length}행</span>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr>
                        {PFD_HEADER_GROUPS.map((group, idx) => (
                          <th key={idx} colSpan={group.colspan} className="text-white text-xs font-bold text-center border border-white/30 py-1.5" style={{ background: group.bg }}>
                            {group.label}
                          </th>
                        ))}
                      </tr>
                      <tr>
                        {PFD_COLUMNS.map((col) => (
                          <th key={col.key} className={`bg-gray-200 text-gray-800 text-[10px] font-semibold text-center border border-gray-300 py-1 px-1 ${col.pfmeaSync ? 'bg-purple-100' : ''}`} style={{ width: col.width, minWidth: col.width }}>
                            {col.label}
                            {col.pfmeaSync && <span className="ml-0.5 text-purple-600">🔗</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.rows.map((row, idx) => {
                        const zebraBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#ede9fe]';
                        const isSynced = row.syncStatus === 'synced';
                        const rowStyle = isSynced ? 'bg-purple-50' : zebraBg;
                        return (
                          <tr key={row.id} className={rowStyle} style={{ height: '28px' }}>
                            <td className={styles.cellCenter}>{row.seqNo}</td>
                            <td className={`${styles.cellCenter} ${isSynced ? styles.syncedCell : ''}`}>
                              <input type="text" value={row.processNo} onChange={(e) => updateCell(row.id, 'processNo', e.target.value)} className={styles.input} />
                            </td>
                            <td className={`${styles.cell} ${isSynced ? styles.syncedCell : ''}`}>
                              <input type="text" value={row.processName} onChange={(e) => updateCell(row.id, 'processName', e.target.value)} className={styles.input} placeholder="공정명 입력" />
                            </td>
                            <td className={`${styles.cell} ${isSynced ? styles.syncedCell : ''}`}>
                              <input type="text" value={row.processDesc} onChange={(e) => updateCell(row.id, 'processDesc', e.target.value)} className={styles.input} placeholder="공정설명" />
                            </td>
                            <td className={styles.cell}>
                              <input type="text" value={row.input} onChange={(e) => updateCell(row.id, 'input', e.target.value)} className={styles.input} placeholder="입력" />
                            </td>
                            <td className={styles.cell}>
                              <input type="text" value={row.output} onChange={(e) => updateCell(row.id, 'output', e.target.value)} className={styles.input} placeholder="출력" />
                            </td>
                            <td className={styles.cellCenter}>
                              <select value={row.symbol} onChange={(e) => updateCell(row.id, 'symbol', e.target.value)} className={styles.select}>
                                <option value="">-</option>
                                {SYMBOL_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.icon}</option>))}
                              </select>
                            </td>
                            <td className={`${styles.cellCenter} ${isSynced ? styles.syncedCell : ''}`}>
                              <select value={row.fourM} onChange={(e) => updateCell(row.id, 'fourM', e.target.value)} className={styles.select}>
                                <option value="">-</option>
                                {FOURM_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.value}</option>))}
                              </select>
                            </td>
                            <td className={`${styles.cellCenter} ${isSynced ? styles.syncedCell : ''}`}>
                              <select value={row.specialChar} onChange={(e) => updateCell(row.id, 'specialChar', e.target.value)} className={styles.select}>
                                {SPECIAL_CHAR_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.value || '-'}</option>))}
                              </select>
                            </td>
                            <td className={styles.cellCenter}>
                              <select value={row.processType} onChange={(e) => updateCell(row.id, 'processType', e.target.value)} className={styles.select}>
                                <option value="">-</option>
                                {PROCESS_TYPE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                              </select>
                            </td>
                            <td className={styles.cell}>
                              <input type="text" value={row.remarks} onChange={(e) => updateCell(row.id, 'remarks', e.target.value)} className={styles.input} placeholder="비고" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {state.tab === 'flowchart' && (
              <div className="flex-1 p-6 overflow-auto">
                <h2 className="text-xl font-bold text-violet-700 mb-4">📊 플로우차트</h2>
                <div className="bg-white rounded-lg p-5 shadow-md border">
                  {state.rows.length === 0 ? (
                    <p className="text-gray-500 text-sm">데이터가 없습니다. 먼저 PFD를 작성하세요.</p>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {state.rows.map((row, idx) => (
                        <div key={row.id} className="flex flex-col items-center">
                          <div className="w-48 p-3 border-2 border-violet-400 rounded-lg bg-violet-50 text-center">
                            <div className="text-lg">{renderSymbol(row.symbol)}</div>
                            <div className="font-bold text-sm">{row.processNo} {row.processName}</div>
                            <div className="text-xs text-gray-600">{row.processDesc}</div>
                          </div>
                          {idx < state.rows.length - 1 && (
                            <div className="text-2xl text-violet-400">↓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {state.tab === 'summary' && (
              <div className="flex-1 p-6 overflow-auto">
                <h2 className="text-xl font-bold text-violet-700 mb-4">📈 PFD 요약</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 shadow-md border border-violet-200">
                    <h3 className="text-lg font-bold text-violet-700 mb-3 border-b pb-2">📋 기본정보</h3>
                    <div className="space-y-2 text-sm">
                      <div>PFD No: <span className="font-bold">{state.pfdNo || '-'}</span></div>
                      <div>품명: <span className="font-bold">{state.partName || '-'}</span></div>
                      <div>고객: <span className="font-bold">{state.customer || '-'}</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-md border border-violet-200">
                    <h3 className="text-lg font-bold text-violet-700 mb-3 border-b pb-2">📊 통계</h3>
                    <div className="space-y-2 text-sm">
                      <div>총 공정: <span className="font-bold text-violet-600">{state.rows.length}건</span></div>
                      <div>주요공정: <span className="font-bold text-blue-600">{mainCount}건</span></div>
                      <div>검사공정: <span className="font-bold text-green-600">{inspectCount}건</span></div>
                      <div>특별특성(CC): <span className="font-bold text-red-600">{state.rows.filter(r => r.specialChar === 'CC').length}건</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state.tab === 'history' && (
              <div className="flex-1 p-6 overflow-auto">
                <h2 className="text-xl font-bold text-violet-700 mb-4">📜 변경 이력</h2>
                <div className="bg-white rounded-lg p-5 shadow-md border">
                  <p className="text-gray-500 text-sm">변경 이력 기능은 추후 구현 예정입니다.</p>
                </div>
              </div>
            )}
          </div>

          {/* 우측: 패널 영역 */}
          <div className="w-[280px] shrink-0 flex flex-col bg-[#f0f4f8] overflow-hidden border-l-2 border-white">
            <div className="h-8 bg-violet-700 flex items-center px-3 border-b border-violet-600">
              <span className="text-white text-xs font-bold">📊 PFD 요약</span>
            </div>
            
            <div className="flex-1 p-3 overflow-auto">
              <div className="space-y-3">
                <div className="bg-white rounded p-3 shadow-sm">
                  <div className="text-xs font-bold text-violet-700 mb-2">기본정보</div>
                  <div className="text-[11px] text-gray-600 space-y-1">
                    <div>PFD No: <span className="font-semibold text-gray-800">{state.pfdNo || '-'}</span></div>
                    <div>품명: <span className="font-semibold text-gray-800">{state.partName || '-'}</span></div>
                  </div>
                </div>
                
                <div className="bg-white rounded p-3 shadow-sm">
                  <div className="text-xs font-bold text-violet-700 mb-2">📋 PFD 통계</div>
                  <div className="text-[11px] text-gray-600 space-y-1">
                    <div>입력된 공정: <span className="font-bold text-violet-600">{filledRows.length}건</span></div>
                    <div>전체 행: <span className="font-bold text-gray-600">{state.rows.length}행</span></div>
                    <div>주요공정: <span className="font-bold text-blue-600">{mainCount}건</span></div>
                    <div>검사공정: <span className="font-bold text-green-600">{inspectCount}건</span></div>
                  </div>
                </div>
                
                {state.linkedFmeaId && (
                  <div className="bg-purple-50 rounded p-3 shadow-sm border border-purple-200">
                    <div className="text-xs font-bold text-purple-700 mb-2">🔗 FMEA 연동</div>
                    <div className="text-[11px] text-gray-600">
                      <div>연동됨</div>
                      <button
                        onClick={() => router.push(`/pfmea/worksheet?id=${state.linkedFmeaId}`)}
                        className="mt-2 px-2 py-1 bg-purple-500 text-white text-[10px] rounded hover:bg-purple-600"
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

