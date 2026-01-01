/**
 * @file page.tsx
 * @description Control Plan (관리계획서) 메인 페이지
 * 
 * PFMEA와 쌍방향 연동:
 * - PFMEA 데이터에서 CP 자동 생성
 * - CP 수정 시 PFMEA에 반영
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CPRow, 
  CPDocument,
  createEmptyCPRow, 
  CP_COLUMNS, 
  CP_HEADER_GROUPS,
  SPECIAL_CHAR_OPTIONS,
  FREQUENCY_OPTIONS,
  MEASURE_METHOD_OPTIONS,
  ACTION_METHOD_OPTIONS
} from '../pfmea/worksheet/types/controlPlan';
import { exportCPExcel } from '../pfmea/worksheet/tabs/cp/exportCPExcel';

// CP 페이지 상태
interface CPPageState {
  cpNo: string;
  partName: string;
  partNo: string;
  revNo: string;
  customer: string;
  rows: CPRow[];
  linkedFmeaId: string | null;
  dirty: boolean;
}

export default function ControlPlanPage() {
  const router = useRouter();
  
  // 상태
  const [state, setState] = useState<CPPageState>({
    cpNo: '',
    partName: '',
    partNo: '',
    revNo: '01',
    customer: '',
    rows: [],
    linkedFmeaId: null,
    dirty: false,
  });
  
  const [fmeaList, setFmeaList] = useState<any[]>([]);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // FMEA 목록 로드
  useEffect(() => {
    const loadFmeaList = () => {
      try {
        const saved = localStorage.getItem('pfmea_projects');
        if (saved) {
          const projects = JSON.parse(saved);
          setFmeaList(projects);
        }
      } catch (e) {
        console.error('FMEA 목록 로드 실패:', e);
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

  // PFMEA에서 데이터 가져오기
  const handleSyncFromFmea = useCallback((fmeaId: string) => {
    try {
      const saved = localStorage.getItem('pfmea_projects');
      if (!saved) return;
      
      const projects = JSON.parse(saved);
      const fmea = projects.find((p: any) => p.id === fmeaId);
      if (!fmea) return;
      
      const riskData = fmea.riskData || {};
      const newRows: CPRow[] = [];
      let rowIndex = 0;
      
      // L2 공정 순회
      (fmea.l2 || []).forEach((proc: any) => {
        if (!proc.name || proc.name.includes('클릭')) return;
        
        const processNo = proc.no || '';
        const processName = proc.name;
        const processDesc = (proc.functions || [])
          .map((f: any) => f.name)
          .filter((n: string) => n && !n.includes('클릭'))
          .join(', ');
        
        // L3 작업요소 순회
        (proc.l3 || []).forEach((we: any) => {
          if (!we.name || we.name.includes('클릭') || we.name.includes('추가')) return;
          
          const row = createEmptyCPRow(processNo, processName);
          row.pfmeaProcessId = proc.id;
          row.pfmeaWorkElemId = we.id;
          row.processType = we.m4 === 'MC' ? '메인' : we.m4 === 'MN' ? '작업' : '';
          row.processDesc = processDesc;
          row.workElement = we.name;
          
          // 특별특성
          row.specialChar = String(riskData[`specialChar-${rowIndex}`] || '');
          
          // 관리방법
          const prevention = String(riskData[`prevention-${rowIndex}`] || '');
          const detection = String(riskData[`detection-${rowIndex}`] || '');
          row.controlMethod = [prevention, detection].filter(Boolean).join(' / ') || '작업일지';
          
          // EP 여부
          row.ep = prevention.includes('Poka') || prevention.includes('Fool') || prevention.includes('Error');
          
          row.syncStatus = 'synced';
          row.lastSyncAt = new Date().toISOString();
          
          newRows.push(row);
          rowIndex++;
        });
      });
      
      // 기초정보 가져오기
      const fmeaInfo = fmea.fmeaInfo || {};
      
      setState(prev => ({
        ...prev,
        cpNo: `CP-${fmeaId.slice(0, 8)}`,
        partName: fmeaInfo.subject || fmea.project?.productName || '',
        partNo: fmeaInfo.partNo || '',
        customer: fmeaInfo.customer || '',
        rows: newRows,
        linkedFmeaId: fmeaId,
        dirty: true,
      }));
      
      setSyncMessage(`✅ PFMEA에서 ${newRows.length}개 항목을 가져왔습니다.`);
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              📝 Control Plan (관리계획서)
            </h1>
            <p className="text-teal-100 text-sm mt-1">PFMEA 연동 관리계획서</p>
          </div>
          
          <div className="flex items-center gap-3">
            {syncMessage && (
              <span className="bg-white/20 px-3 py-1 rounded text-sm animate-pulse">
                {syncMessage}
              </span>
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaving || !state.dirty}
              className={`px-4 py-2 rounded font-semibold text-sm transition ${
                state.dirty 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {isSaving ? '⏳ 저장중...' : state.dirty ? '💾 저장' : '✅ 저장됨'}
            </button>
            
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm transition"
            >
              📤 Excel Export
            </button>
          </div>
        </div>
      </div>

      {/* 기초정보 & FMEA 선택 */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">FMEA 선택:</label>
            <select
              value={state.linkedFmeaId || ''}
              onChange={(e) => {
                if (e.target.value) handleSyncFromFmea(e.target.value);
              }}
              className="border rounded px-2 py-1 text-sm min-w-[200px]"
            >
              <option value="">-- PFMEA 선택 --</option>
              {fmeaList.map(fmea => (
                <option key={fmea.id} value={fmea.id}>
                  {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
                </option>
              ))}
            </select>
            {state.linkedFmeaId && (
              <button
                onClick={() => handleSyncFromFmea(state.linkedFmeaId!)}
                className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
              >
                🔄 재동기화
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">CP No:</label>
            <input
              type="text"
              value={state.cpNo}
              onChange={(e) => setState(prev => ({ ...prev, cpNo: e.target.value, dirty: true }))}
              className="border rounded px-2 py-1 text-sm w-32"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">품명:</label>
            <input
              type="text"
              value={state.partName}
              onChange={(e) => setState(prev => ({ ...prev, partName: e.target.value, dirty: true }))}
              className="border rounded px-2 py-1 text-sm w-40"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">품번:</label>
            <input
              type="text"
              value={state.partNo}
              onChange={(e) => setState(prev => ({ ...prev, partNo: e.target.value, dirty: true }))}
              className="border rounded px-2 py-1 text-sm w-32"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">고객:</label>
            <input
              type="text"
              value={state.customer}
              onChange={(e) => setState(prev => ({ ...prev, customer: e.target.value, dirty: true }))}
              className="border rounded px-2 py-1 text-sm w-32"
            />
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="bg-gray-50 px-6 py-1 text-[10px] flex items-center gap-4 border-b">
        <span className="font-semibold">범례:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-100 border border-yellow-300"></span>
          PFMEA 연동
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-100 border border-orange-300"></span>
          수정됨
        </span>
        <span className="ml-auto">
          총 {state.rows.length}행
          <button
            onClick={addRow}
            className="ml-3 px-2 py-0.5 bg-green-500 text-white text-[10px] rounded hover:bg-green-600"
          >
            + 행 추가
          </button>
        </span>
      </div>

      {/* 테이블 */}
      <div className="overflow-auto bg-white" style={{ height: 'calc(100vh - 200px)' }}>
        <table className="w-full border-collapse min-w-[1800px]">
          <thead className="sticky top-0 z-10 bg-white">
            {/* 그룹 헤더 */}
            <tr>
              {CP_HEADER_GROUPS.map((group, idx) => (
                <th 
                  key={idx} 
                  colSpan={group.colspan}
                  className="text-white text-xs font-bold text-center border border-white/30 py-1.5"
                  style={{ background: group.bg }}
                >
                  {group.label}
                </th>
              ))}
            </tr>
            
            {/* 열 헤더 */}
            <tr>
              {CP_COLUMNS.map((col) => (
                <th 
                  key={col.key} 
                  className={`bg-gray-200 text-gray-800 text-[10px] font-semibold text-center border border-gray-300 py-1 px-1 ${
                    col.pfmeaSync ? 'bg-yellow-100' : ''
                  }`}
                  style={{ width: col.width, minWidth: col.width }}
                >
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
                  <div className="text-sm">상단에서 PFMEA를 선택하여 데이터를 가져오거나,<br/>[+ 행 추가] 버튼으로 직접 입력하세요.</div>
                </td>
              </tr>
            ) : (
              state.rows.map((row, idx) => {
                const zebraBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                const statusBg = row.syncStatus === 'modified' ? styles.modifiedCell : '';
                
                return (
                  <tr key={row.id} className={zebraBg}>
                    <td className={`${styles.cellCenter} ${styles.syncedCell}`}>
                      <input type="text" value={row.processNo} onChange={(e) => updateCell(row.id, 'processNo', e.target.value)} className={styles.input} />
                    </td>
                    <td className={`${styles.cell} ${styles.syncedCell}`}>
                      <input type="text" value={row.processName} onChange={(e) => updateCell(row.id, 'processName', e.target.value)} className={styles.input} />
                    </td>
                    <td className={styles.cellCenter}>
                      <select value={row.processType} onChange={(e) => updateCell(row.id, 'processType', e.target.value)} className={styles.select}>
                        <option value="">-</option>
                        <option value="메인">메인</option>
                        <option value="서브">서브</option>
                        <option value="작업">작업</option>
                      </select>
                    </td>
                    <td className={`${styles.cell} ${styles.syncedCell}`}>
                      <input type="text" value={row.processDesc} onChange={(e) => updateCell(row.id, 'processDesc', e.target.value)} className={styles.input} />
                    </td>
                    <td className={`${styles.cell} ${styles.syncedCell}`}>
                      <input type="text" value={row.workElement} onChange={(e) => updateCell(row.id, 'workElement', e.target.value)} className={styles.input} />
                    </td>
                    <td className={styles.cellCenter}>
                      <input type="checkbox" checked={row.ep} onChange={(e) => updateCell(row.id, 'ep', e.target.checked)} className={styles.checkbox} />
                    </td>
                    <td className={styles.cellCenter}>
                      <input type="checkbox" checked={row.autoInspect} onChange={(e) => updateCell(row.id, 'autoInspect', e.target.checked)} className={styles.checkbox} />
                    </td>
                    <td className={styles.cellCenter}>
                      <input type="text" value={row.itemNo} onChange={(e) => updateCell(row.id, 'itemNo', e.target.value)} className={`${styles.input} text-center`} />
                    </td>
                    <td className={`${styles.cell} ${styles.syncedCell} ${statusBg}`}>
                      <input type="text" value={row.productChar} onChange={(e) => updateCell(row.id, 'productChar', e.target.value)} className={styles.input} />
                    </td>
                    <td className={`${styles.cellCenter} ${statusBg}`}>
                      <input type="text" value={row.processChar} onChange={(e) => updateCell(row.id, 'processChar', e.target.value)} className={`${styles.input} text-center`} />
                    </td>
                    <td className={`${styles.cellCenter} ${styles.syncedCell} ${statusBg}`} style={{ color: getSpecialCharColor(row.specialChar) }}>
                      <select value={row.specialChar} onChange={(e) => updateCell(row.id, 'specialChar', e.target.value)} className={styles.select} style={{ color: getSpecialCharColor(row.specialChar), fontWeight: 600 }}>
                        {SPECIAL_CHAR_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.value || '-'}</option>))}
                      </select>
                    </td>
                    <td className={styles.cell}>
                      <input type="text" value={row.specTolerance} onChange={(e) => updateCell(row.id, 'specTolerance', e.target.value)} className={styles.input} />
                    </td>
                    <td className={styles.cell}>
                      <select value={row.measureMethod} onChange={(e) => updateCell(row.id, 'measureMethod', e.target.value)} className={styles.select}>
                        <option value="">선택</option>
                        {MEASURE_METHOD_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    </td>
                    <td className={styles.cellCenter}>
                      <input type="text" value={row.sampleSize} onChange={(e) => updateCell(row.id, 'sampleSize', e.target.value)} className={`${styles.input} text-center`} />
                    </td>
                    <td className={styles.cellCenter}>
                      <select value={row.frequency} onChange={(e) => updateCell(row.id, 'frequency', e.target.value)} className={styles.select}>
                        <option value="">선택</option>
                        {FREQUENCY_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    </td>
                    <td className={`${styles.cell} ${styles.syncedCell} ${statusBg}`}>
                      <input type="text" value={row.controlMethod} onChange={(e) => updateCell(row.id, 'controlMethod', e.target.value)} className={styles.input} />
                    </td>
                    <td className={styles.cellCenter}>
                      <input type="checkbox" checked={row.production} onChange={(e) => updateCell(row.id, 'production', e.target.checked)} className={styles.checkbox} />
                    </td>
                    <td className={styles.cellCenter}>
                      <input type="checkbox" checked={row.quality} onChange={(e) => updateCell(row.id, 'quality', e.target.checked)} className={styles.checkbox} />
                    </td>
                    <td className={styles.cell}>
                      <select value={row.actionMethod} onChange={(e) => updateCell(row.id, 'actionMethod', e.target.value)} className={styles.select}>
                        <option value="">선택</option>
                        {ACTION_METHOD_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

