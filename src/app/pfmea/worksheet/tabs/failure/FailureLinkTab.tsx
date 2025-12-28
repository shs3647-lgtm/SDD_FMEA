/**
 * @file FailureLinkTab.tsx
 * @description 고장연결 탭 - FM 중심 연결 관리 (SVG 연결선)
 * 좌측 60%: FE/FM/FC 3개 독립 테이블
 * 우측 40% 상단: 고장 연결도 (FM 중심, SVG 선 연결)
 * 우측 40% 하단: 연결 결과 테이블
 */

'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { FailureTabProps } from './types';
import { uid } from '../../constants';

// 색상 정의
const COLORS = {
  blue: '#2b78c5',
  sky: '#bfe0ff',
  skyLight: '#d7ecff',
  line: '#6f8fb4',
  bg: '#f5f7fb',
  fe: { header: '#e3f2fd', text: '#1565c0', border: '#1976d2' },
  fm: { header: '#fff8e1', text: '#f57c00', border: '#ff9800' },
  fc: { header: '#e8f5e9', text: '#2e7d32', border: '#4caf50' },
  mn: '#eef7ff',
  mc: '#ffe6e6',
  en: '#fef0ff',
};

interface FEItem { id: string; scope: string; feNo: string; text: string; severity?: number; }
interface FMItem { id: string; fmNo: string; processName: string; text: string; }
interface FCItem { id: string; fcNo: string; processName: string; m4: string; workElem: string; text: string; }
interface LinkResult { fmId: string; feId: string; feNo: string; feScope: string; feText: string; severity: number; fmText: string; fmProcess: string; fcId: string; fcNo: string; fcProcess: string; fcM4: string; fcWorkElem: string; fcText: string; }

export default function FailureLinkTab({ state, setState, setDirty, saveToLocalStorage }: FailureTabProps) {
  const [currentFMId, setCurrentFMId] = useState<string | null>(null);
  const [linkedFEs, setLinkedFEs] = useState<Map<string, FEItem>>(new Map());
  const [linkedFCs, setLinkedFCs] = useState<Map<string, FCItem>>(new Map());
  const [savedLinks, setSavedLinks] = useState<LinkResult[]>([]);
  const [editMode, setEditMode] = useState<'edit' | 'confirm'>('edit');
  const [viewMode, setViewMode] = useState<'diagram' | 'result'>('diagram'); // 토글 상태
  const [selectedProcess, setSelectedProcess] = useState<string>('all'); // 공정 필터 (FM용)
  const [fcLinkScope, setFcLinkScope] = useState<'current' | 'all'>('current'); // FC 연결 범위: 해당공정/모든공정
  const chainAreaRef = useRef<HTMLDivElement>(null);
  const fmNodeRef = useRef<HTMLDivElement>(null);
  const feColRef = useRef<HTMLDivElement>(null);
  const fcColRef = useRef<HTMLDivElement>(null);
  const [svgPaths, setSvgPaths] = useState<string[]>([]);

  // FE 데이터 추출 (번호 포함)
  const feData: FEItem[] = useMemo(() => {
    const items: FEItem[] = [];
    const counters: Record<string, number> = { 'Your Plant': 0, 'Ship to Plant': 0, 'User': 0 };
    
    (state.l1?.failureScopes || []).forEach((fs: any) => {
      if (fs.effect) {
        let scope = '';
        (state.l1?.types || []).forEach((type: any) => {
          (type.functions || []).forEach((fn: any) => {
            (fn.requirements || []).forEach((req: any) => {
              if (req.id === fs.reqId) scope = type.name;
            });
          });
        });
        const scopeName = scope || 'Your Plant';
        const prefix = scopeName === 'Your Plant' ? 'Y' : scopeName === 'Ship to Plant' ? 'S' : scopeName === 'User' ? 'U' : 'X';
        const feNo = `${prefix}${(counters[scopeName] || 0) + 1}`;
        counters[scopeName] = (counters[scopeName] || 0) + 1;
        items.push({ id: fs.id, scope: scopeName, feNo, text: fs.effect, severity: fs.severity });
      }
    });
    return items;
  }, [state.l1]);

  // FM 데이터 추출 (번호 포함)
  const fmData: FMItem[] = useMemo(() => {
    const items: FMItem[] = [];
    let counter = 1;
    (state.l2 || []).forEach((proc: any) => {
      if (!proc.name || proc.name.includes('클릭')) return;
      (proc.failureModes || []).forEach((fm: any) => {
        if (fm.name && !fm.name.includes('클릭') && !fm.name.includes('추가')) {
          items.push({ id: fm.id || uid(), fmNo: `M${counter}`, processName: proc.name, text: fm.name });
          counter++;
        }
      });
    });
    return items;
  }, [state.l2]);

  // FC 데이터 추출 (번호 포함)
  const fcData: FCItem[] = useMemo(() => {
    const items: FCItem[] = [];
    let counter = 1;
    (state.l2 || []).forEach((proc: any) => {
      if (!proc.name || proc.name.includes('클릭')) return;
      (proc.l3 || []).forEach((we: any) => {
        if (!we.name || we.name.includes('클릭') || we.name.includes('추가')) return;
        const m4 = we.m4 || we.fourM || 'MN';
        (we.failureCauses || []).forEach((fc: any) => {
          if (fc.name && !fc.name.includes('클릭') && !fc.name.includes('추가')) {
            items.push({ id: fc.id || uid(), fcNo: `C${counter}`, processName: proc.name, m4, workElem: we.name, text: fc.name });
            counter++;
          }
        });
      });
    });
    return items;
  }, [state.l2]);

  const currentFM = useMemo(() => fmData.find(f => f.id === currentFMId), [fmData, currentFMId]);

  // 공정 목록 추출
  const processList = useMemo(() => {
    const procs = new Set<string>();
    (state.l2 || []).forEach((proc: any) => {
      if (proc.name && !proc.name.includes('클릭')) {
        procs.add(proc.name);
      }
    });
    return Array.from(procs);
  }, [state.l2]);

  // 필터링된 FM 데이터
  const filteredFmData = useMemo(() => {
    if (selectedProcess === 'all') return fmData;
    return fmData.filter(fm => fm.processName === selectedProcess);
  }, [fmData, selectedProcess]);

  // 필터링된 FC 데이터
  // FC 필터링: fcLinkScope에 따라 해당공정/모든공정 선택
  const filteredFcData = useMemo(() => {
    // 복합연결(모든공정) 모드면 전체 FC 표시
    if (fcLinkScope === 'all') return fcData;
    // 단순연결(해당공정) 모드면 현재 FM의 공정과 같은 FC만 표시
    if (selectedProcess === 'all') return fcData;
    return fcData.filter(fc => fc.processName === selectedProcess);
  }, [fcData, selectedProcess, fcLinkScope]);

  // 연결 현황 계산
  const linkStats = useMemo(() => {
    // FE 연결 현황
    const feLinkedIds = new Set(savedLinks.map(l => l.feText));
    const feLinkedCount = feData.filter(fe => feLinkedIds.has(fe.text)).length;
    const feMissingCount = feData.length - feLinkedCount;

    // FM 연결 현황
    const fmLinkedIds = new Set(savedLinks.map(l => l.fmId));
    const fmLinkedCount = fmData.filter(fm => fmLinkedIds.has(fm.id)).length;
    const fmMissingCount = fmData.length - fmLinkedCount;

    // FC 연결 현황
    const fcLinkedIds = new Set(savedLinks.map(l => l.fcText));
    const fcLinkedCount = fcData.filter(fc => fcLinkedIds.has(fc.text)).length;
    const fcMissingCount = fcData.length - fcLinkedCount;

    return { feLinkedCount, feMissingCount, fmLinkedCount, fmMissingCount, fcLinkedCount, fcMissingCount, feLinkedIds, fmLinkedIds, fcLinkedIds };
  }, [savedLinks, feData, fmData, fcData]);

  useEffect(() => {
    const saved = (state as any).failureLinks || [];
    setSavedLinks(saved);
  }, [state]);

  // SVG 곡선 그리기
  const drawLines = useCallback(() => {
    if (!chainAreaRef.current || !fmNodeRef.current) {
      setSvgPaths([]);
      return;
    }
    const area = chainAreaRef.current.getBoundingClientRect();
    const fmRect = fmNodeRef.current.getBoundingClientRect();
    const fmCenterY = fmRect.top + fmRect.height / 2 - area.top;
    const fmLeft = fmRect.left - area.left;
    const fmRight = fmRect.right - area.left;

    const paths: string[] = [];

    // FM → FE 곡선 (FM에서 FE로)
    if (feColRef.current) {
      const feCards = feColRef.current.querySelectorAll('.fe-card');
      feCards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const x1 = fmLeft;
        const y1 = fmCenterY;
        const x2 = r.right - area.left;
        const y2 = r.top + r.height / 2 - area.top;
        const cx = (x1 + x2) / 2;
        // 부드러운 S자 곡선
        paths.push(`M ${x1} ${y1} Q ${cx} ${y1}, ${cx} ${(y1 + y2) / 2} T ${x2} ${y2}`);
      });
    }

    // FM → FC 곡선 (FM에서 FC로)
    if (fcColRef.current) {
      const fcCards = fcColRef.current.querySelectorAll('.fc-card');
      fcCards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const x1 = fmRight;
        const y1 = fmCenterY;
        const x2 = r.left - area.left;
        const y2 = r.top + r.height / 2 - area.top;
        const cx = (x1 + x2) / 2;
        // 부드러운 S자 곡선
        paths.push(`M ${x1} ${y1} Q ${cx} ${y1}, ${cx} ${(y1 + y2) / 2} T ${x2} ${y2}`);
      });
    }

    setSvgPaths(paths);
  }, []);

  useEffect(() => {
    const timer = setTimeout(drawLines, 100);
    window.addEventListener('resize', drawLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', drawLines);
    };
  }, [drawLines, linkedFEs, linkedFCs, currentFM]);

  const selectFM = useCallback((id: string) => {
    setCurrentFMId(id);
    // 선택한 FM의 공정으로 자동 필터링
    const selectedFm = fmData.find(f => f.id === id);
    if (selectedFm) {
      setSelectedProcess(selectedFm.processName);
    }
    const fmLinks = savedLinks.filter(l => l.fmId === id);
    const newFEs = new Map<string, FEItem>();
    const newFCs = new Map<string, FCItem>();
    fmLinks.forEach(link => {
      // feId/fcId로 조회 (ID 기반)
      if (link.feId) {
        const feItem = feData.find(f => f.id === link.feId);
        if (feItem) newFEs.set(feItem.id, feItem);
      }
      if (link.fcId) {
        const fcItem = fcData.find(f => f.id === link.fcId);
        if (fcItem) newFCs.set(fcItem.id, fcItem);
      }
    });
    setLinkedFEs(newFEs);
    setLinkedFCs(newFCs);
    setTimeout(drawLines, 50);
  }, [savedLinks, feData, fcData, fmData, drawLines]);

  const toggleFE = useCallback((id: string) => {
    if (!currentFMId || editMode !== 'edit') return;
    const fe = feData.find(f => f.id === id);
    if (!fe) return;
    setLinkedFEs(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, fe);
      return next;
    });
    setTimeout(drawLines, 50);
  }, [currentFMId, editMode, feData, drawLines]);

  const toggleFC = useCallback((id: string) => {
    if (!currentFMId || editMode !== 'edit') return;
    const fc = fcData.find(f => f.id === id);
    if (!fc) return;
    setLinkedFCs(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, fc);
      return next;
    });
    setTimeout(drawLines, 50);
  }, [currentFMId, editMode, fcData, drawLines]);

  const confirmLink = useCallback(() => {
    if (!currentFMId || !currentFM) return;
    let newLinks = savedLinks.filter(l => l.fmId !== currentFMId);
    const feArray = Array.from(linkedFEs.values());
    const fcArray = Array.from(linkedFCs.values());
    
    // FE와 FC를 각각 독립적으로 저장 (1:N 관계 지원)
    // FE 연결
    feArray.forEach(fe => {
      newLinks.push({
        fmId: currentFMId,
        feId: fe.id,
        feNo: fe.feNo,
        feScope: fe.scope,
        feText: fe.text,
        severity: fe.severity || 0,
        fmText: currentFM.text,
        fmProcess: currentFM.processName,
        fcId: '',
        fcNo: '',
        fcProcess: '',
        fcM4: '',
        fcWorkElem: '',
        fcText: ''
      });
    });
    
    // FC 연결
    fcArray.forEach(fc => {
      newLinks.push({
        fmId: currentFMId,
        feId: '',
        feNo: '',
        feScope: '',
        feText: '',
        severity: 0,
        fmText: currentFM.text,
        fmProcess: currentFM.processName,
        fcId: fc.id,
        fcNo: fc.fcNo,
        fcProcess: fc.processName,
        fcM4: fc.m4,
        fcWorkElem: fc.workElem,
        fcText: fc.text
      });
    });
    
    setSavedLinks(newLinks);
    setState((prev: any) => ({ ...prev, failureLinks: newLinks }));
    setDirty(true);
    // 상태 업데이트 후 저장 보장
    setTimeout(() => {
      saveToLocalStorage?.();
    }, 100);
    setEditMode('edit');
    alert(`✅ ${currentFM.text} 연결이 확정 및 저장되었습니다.`);
  }, [currentFMId, currentFM, linkedFEs, linkedFCs, savedLinks, setState, setDirty, saveToLocalStorage]);

  const handleModeChange = useCallback((mode: 'edit' | 'confirm') => {
    setEditMode(mode);
    if (mode === 'confirm' && currentFMId && (linkedFEs.size > 0 || linkedFCs.size > 0)) {
      confirmLink();
      setViewMode('result'); // 연결확정 후 분석결과 뷰로 전환
    }
  }, [currentFMId, linkedFEs, linkedFCs, confirmLink]);

  const handleSaveAll = useCallback(() => {
    setState((prev: any) => ({ ...prev, failureLinks: savedLinks }));
    setDirty(true);
    saveToLocalStorage?.();
    alert(`✅ 총 ${savedLinks.length}개의 고장연결이 저장되었습니다.`);
  }, [savedLinks, setState, setDirty, saveToLocalStorage]);

  return (
    <div style={{ display: 'flex', height: '100%', background: COLORS.bg, overflow: 'hidden' }}>
      {/* 좌측: 3개 테이블 (60%) */}
      <div style={{ flex: '60', borderRight: `2px solid ${COLORS.line}`, background: '#fff', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 12px', background: COLORS.skyLight, borderBottom: `1px solid ${COLORS.line}`, fontSize: '13px', position: 'relative' }}>
          <span style={{ fontWeight: 900 }}>P-FMEA 고장 분석(4단계) - 고장연결</span>
          <div style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#555' }}>공정:</span>
            <select 
              value={selectedProcess} 
              onChange={(e) => setSelectedProcess(e.target.value)}
              style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '3px', border: '1px solid #999', fontWeight: 600 }}
            >
              <option value="all">모든공정</option>
              {processList.map(proc => (
                <option key={proc} value={proc}>{proc}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: '3px', padding: '3px' }}>
          {/* FE 테이블 */}
          <div style={{ flex: '0 0 25%', border: `1px solid ${COLORS.line}`, borderRadius: '4px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '6px 8px', fontWeight: 900, fontSize: '10px', background: COLORS.fe.header, color: COLORS.fe.text, textAlign: 'center' }}>
              고장영향(FE) <span style={{ fontWeight: 600, color: '#2e7d32' }}>연결:{linkStats.feLinkedCount}</span> <span style={{ fontWeight: 600, color: '#c62828' }}>누락:{linkStats.feMissingCount}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '20%', background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>No</th>
                    <th style={{ background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>고장영향(FE)</th>
                    <th style={{ width: '15%', background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>S</th>
                  </tr>
                </thead>
                <tbody>
                  {feData.map(fe => {
                    const isLinked = linkStats.feLinkedIds.has(fe.text) || linkedFEs.has(fe.id);
                    const noBg = isLinked ? '#4caf50' : '#e53935';
                    return (
                      <tr key={fe.id} onClick={() => toggleFE(fe.id)} style={{ cursor: currentFMId ? 'pointer' : 'default' }}>
                        <td style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700, background: noBg, color: '#fff' }}>{fe.feNo}</td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ccc', background: '#fff' }}>{fe.text}</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700, background: '#fff', color: fe.severity && fe.severity >= 8 ? '#c62828' : fe.severity && fe.severity >= 5 ? '#f57f17' : '#333' }}>{fe.severity || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FM 테이블 */}
          <div style={{ flex: '0 0 28%', border: `1px solid ${COLORS.line}`, borderRadius: '4px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '6px 8px', fontWeight: 900, fontSize: '10px', background: COLORS.fm.header, color: COLORS.fm.text, textAlign: 'center' }}>
              고장형태(FM) <span style={{ fontWeight: 600, color: '#2e7d32' }}>연결:{linkStats.fmLinkedCount}</span> <span style={{ fontWeight: 600, color: '#c62828' }}>누락:{linkStats.fmMissingCount}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '15%', background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>No</th>
                    <th style={{ width: '30%', background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>공정명</th>
                    <th style={{ background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>고장형태(FM)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFmData.map(fm => {
                    const isSelected = currentFMId === fm.id;
                    const isLinked = linkStats.fmLinkedIds.has(fm.id) || isSelected;
                    const noBg = isLinked ? '#4caf50' : '#e53935';
                    return (
                      <tr key={fm.id} onClick={() => selectFM(fm.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700, background: noBg, color: '#fff' }}>{fm.fmNo}</td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 600, fontSize: '9px', whiteSpace: 'nowrap', background: isSelected ? '#fff8e1' : '#fff' }}>{fm.processName}</td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ccc', background: isSelected ? '#fff8e1' : '#fff' }}>{fm.text}{linkStats.fmLinkedIds.has(fm.id) ? ' ✓' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FC 테이블 */}
          <div style={{ flex: '1 1 47%', border: `1px solid ${COLORS.line}`, borderRadius: '4px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '6px 8px', fontWeight: 900, fontSize: '10px', background: COLORS.fc.header, color: COLORS.fc.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ flex: 1, textAlign: 'center' }}>
                고장원인(FC) <span style={{ fontWeight: 600, color: '#2e7d32' }}>연결:{linkStats.fcLinkedCount}</span> <span style={{ fontWeight: 600, color: '#c62828' }}>누락:{linkStats.fcMissingCount}</span>
              </span>
              <select
                value={fcLinkScope}
                onChange={(e) => setFcLinkScope(e.target.value as 'current' | 'all')}
                style={{ padding: '2px 4px', fontSize: '9px', borderRadius: '3px', border: '1px solid #999', background: fcLinkScope === 'all' ? '#fff3e0' : '#fff', fontWeight: 600 }}
              >
                <option value="current">해당공정</option>
                <option value="all">모든공정</option>
              </select>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '8%', background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>No</th>
                    <th style={{ width: '14%', background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>공정명</th>
                    <th style={{ width: '8%', background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>4M</th>
                    <th style={{ width: '18%', background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>작업요소</th>
                    <th style={{ background: COLORS.sky, padding: '4px', border: '1px solid #ccc', position: 'sticky', top: 0, fontWeight: 700 }}>고장원인(FC)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFcData.map(fc => {
                    const isLinked = linkStats.fcLinkedIds.has(fc.text) || linkedFCs.has(fc.id);
                    const noBg = isLinked ? '#4caf50' : '#e53935';
                    return (
                      <tr key={fc.id} onClick={() => toggleFC(fc.id)} style={{ cursor: currentFMId ? 'pointer' : 'default' }}>
                        <td style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700, background: noBg, color: '#fff' }}>{fc.fcNo}</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 600, fontSize: '9px', whiteSpace: 'nowrap', background: '#fff' }}>{fc.processName}</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 600, background: '#fff' }}>{fc.m4}</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc', fontSize: '9px', background: '#fff' }}>{fc.workElem}</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc', background: '#fff' }}>{fc.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 우측: 토글 화면 (40%) */}
      <div style={{ flex: '40', background: '#fff', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 헤더 + 토글 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: COLORS.skyLight, borderBottom: `1px solid ${COLORS.line}` }}>
          {/* 토글 버튼 */}
          <div style={{ display: 'flex', gap: '0' }}>
            <button 
              onClick={() => setViewMode('diagram')} 
              style={{ 
                padding: '4px 10px', fontSize: '10px', fontWeight: 700, border: '1px solid #999', 
                borderRadius: '3px 0 0 3px', cursor: 'pointer', whiteSpace: 'nowrap',
                background: viewMode === 'diagram' ? COLORS.blue : '#fff', 
                color: viewMode === 'diagram' ? '#fff' : '#333' 
              }}
            >
              고장사슬
            </button>
            <button 
              onClick={() => setViewMode('result')} 
              style={{ 
                padding: '4px 10px', fontSize: '10px', fontWeight: 700, border: '1px solid #999', borderLeft: 'none',
                borderRadius: '0 3px 3px 0', cursor: 'pointer', whiteSpace: 'nowrap',
                background: viewMode === 'result' ? COLORS.blue : '#fff', 
                color: viewMode === 'result' ? '#fff' : '#333' 
              }}
            >
              분석결과
            </button>
          </div>
          
          {/* 우측 버튼들 - 연결확정/수정 순서 */}
          {viewMode === 'diagram' && (
            <div style={{ display: 'flex', gap: '3px' }}>
              <button onClick={() => handleModeChange('confirm')} disabled={!currentFMId || (linkedFEs.size === 0 && linkedFCs.size === 0)} style={{ padding: '4px 8px', fontSize: '10px', border: '1px solid #999', borderRadius: '3px', cursor: 'pointer', background: '#2196f3', color: '#fff', opacity: (!currentFMId || (linkedFEs.size === 0 && linkedFCs.size === 0)) ? 0.5 : 1, whiteSpace: 'nowrap' }}>연결확정</button>
              <button onClick={() => handleModeChange('edit')} style={{ padding: '4px 8px', fontSize: '10px', border: '1px solid #999', borderRadius: '3px', cursor: 'pointer', background: editMode === 'edit' ? '#4caf50' : '#fff', color: editMode === 'edit' ? '#fff' : '#333', whiteSpace: 'nowrap' }}>수정</button>
            </div>
          )}
        </div>
        
        {/* 콘텐츠 영역 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* 고장연결도 뷰 */}
          {viewMode === 'diagram' && (
            <div ref={chainAreaRef} style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', position: 'relative' }}>
              {/* SVG 곡선 + 날씬한 화살표 */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                  <marker id="arrowhead" markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L5,2 L0,4" fill="none" stroke="#888" strokeWidth="0.8" />
                  </marker>
                </defs>
                {svgPaths.map((d, idx) => (
                  <path key={idx} d={d} fill="none" stroke="#888" strokeWidth="1.2" markerEnd="url(#arrowhead)" />
                ))}
              </svg>

              {!currentFM ? (
                <div style={{ color: '#999', fontSize: '13px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔗</div>
                  <div>FM(고장형태)를 먼저 선택하세요</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative', zIndex: 2 }}>
                  {/* 상단 라벨 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 110px 1fr 110px', width: '100%', marginBottom: '8px' }}>
                    <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', color: COLORS.fe.text, background: COLORS.fe.header, padding: '3px 0', borderRadius: '3px' }}>FE(고장영향)</div>
                    <div></div>
                    <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', color: COLORS.fm.text, background: COLORS.fm.header, padding: '3px 0', borderRadius: '3px' }}>FM(고장형태)</div>
                    <div></div>
                    <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', color: COLORS.fc.text, background: COLORS.fc.header, padding: '3px 0', borderRadius: '3px' }}>FC(고장원인)</div>
                  </div>
                  
                  {/* 카드 영역 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 110px 1fr 110px', width: '100%', flex: 1, gap: 0 }}>
                    {/* FE 열 */}
                    <div ref={feColRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '4px' }}>
                      {Array.from(linkedFEs.values()).map(fe => (
                        <div key={fe.id} className="fe-card" style={{ background: '#fff', border: `2px solid ${COLORS.fe.border}`, borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', width: '120px', overflow: 'hidden', fontSize: '9px' }}>
                          <div style={{ padding: '3px 6px', fontWeight: 700, background: COLORS.fe.header, color: COLORS.fe.text, textAlign: 'center' }}>
                            {fe.feNo} | S:{fe.severity || '-'}
                          </div>
                          <div style={{ padding: '4px 6px', lineHeight: 1.3, color: '#333', textAlign: 'center' }}>{fe.text}</div>
                        </div>
                      ))}
                      {linkedFEs.size === 0 && <div style={{ color: '#bbb', fontSize: '9px', textAlign: 'center' }}>FE 클릭</div>}
                    </div>

                    {/* 왼쪽 간격 (화살표 영역) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>

                    {/* FM 열 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div ref={fmNodeRef} style={{ background: '#fff', border: `2px solid ${COLORS.fm.border}`, borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', width: '110px', overflow: 'hidden', fontSize: '9px' }}>
                        <div style={{ padding: '3px 6px', fontWeight: 700, background: COLORS.fm.header, color: COLORS.fm.text, borderBottom: '1px solid #ffe0b2', textAlign: 'center' }}>{currentFM.fmNo}</div>
                        <div style={{ padding: '4px 6px', lineHeight: 1.3, color: '#333', fontWeight: 600, textAlign: 'center' }}>{currentFM.text}</div>
                      </div>
                    </div>

                    {/* 오른쪽 간격 (화살표 영역) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>

                    {/* FC 열 */}
                    <div ref={fcColRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '4px' }}>
                      {Array.from(linkedFCs.values()).map(fc => (
                        <div key={fc.id} className="fc-card" style={{ background: '#fff', border: `2px solid ${COLORS.fc.border}`, borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', width: '110px', overflow: 'hidden', fontSize: '9px' }}>
                          <div style={{ padding: '3px 6px', fontWeight: 700, background: COLORS.fc.header, color: COLORS.fc.text, textAlign: 'center' }}>{fc.fcNo}</div>
                          <div style={{ padding: '4px 6px', lineHeight: 1.3, color: '#333', textAlign: 'center' }}>{fc.text}</div>
                        </div>
                      ))}
                      {linkedFCs.size === 0 && <div style={{ color: '#bbb', fontSize: '9px' }}>FC 클릭</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 연결결과 뷰 - 마지막 항목 확장 병합 방식 */}
          {viewMode === 'result' && (() => {
            // FM별 그룹핑 (feId/fcId로 중복 체크)
            const fmGroups = new Map<string, { fmId: string; fmText: string; fmProcess: string; fmNo: string; fes: { id: string; scope: string; text: string; severity: number; feNo: string }[]; fcs: { id: string; processName: string; m4: string; workElem: string; text: string; fcNo: string }[] }>();
            savedLinks.forEach(link => {
              if (!fmGroups.has(link.fmId)) {
                const fm = fmData.find(f => f.id === link.fmId);
                fmGroups.set(link.fmId, { fmId: link.fmId, fmText: link.fmText, fmProcess: link.fmProcess, fmNo: fm?.fmNo || '', fes: [], fcs: [] });
              }
              const group = fmGroups.get(link.fmId)!;
              // feId로 중복 체크 (같은 텍스트라도 다른 ID면 추가)
              if (link.feId && !group.fes.some(f => f.id === link.feId)) {
                group.fes.push({ id: link.feId, scope: link.feScope, text: link.feText, severity: link.severity, feNo: link.feNo });
              }
              // fcId로 중복 체크 (같은 텍스트라도 다른 ID면 추가)
              if (link.fcId && !group.fcs.some(f => f.id === link.fcId)) {
                group.fcs.push({ id: link.fcId, processName: link.fcProcess, m4: link.fcM4, workElem: link.fcWorkElem, text: link.fcText, fcNo: link.fcNo });
              }
            });
            const groups = Array.from(fmGroups.values());

            // 렌더링할 행 데이터 생성 (마지막 항목 확장 병합 - 빈 행 제거)
            const renderRows: { 
              fmId: string; rowIdx: number; totalRows: number;
              fe?: { id: string; scope: string; text: string; severity: number; feNo: string }; feRowSpan: number; showFe: boolean;
              fm: { text: string; no: string; process: string }; showFm: boolean;
              fc?: { id: string; processName: string; m4: string; workElem: string; text: string; fcNo: string }; fcRowSpan: number; showFc: boolean;
            }[] = [];

            groups.forEach(group => {
              const feCount = group.fes.length;
              const fcCount = group.fcs.length;
              const totalRows = Math.max(feCount, fcCount, 1);
              
              for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
                // FE 처리: 각 항목 1행, 마지막 항목은 남은 행 모두 차지
                let showFe = false;
                let feRowSpan = 0;
                let feItem = group.fes[rowIdx];
                
                if (rowIdx < feCount) {
                  showFe = true;
                  // 마지막 FE면 남은 행을 모두 차지
                  feRowSpan = (rowIdx === feCount - 1) ? (totalRows - rowIdx) : 1;
                  feItem = group.fes[rowIdx];
                }
                
                // FC 처리: 각 항목 1행, 마지막 항목은 남은 행 모두 차지
                let showFc = false;
                let fcRowSpan = 0;
                let fcItem = group.fcs[rowIdx];
                
                if (rowIdx < fcCount) {
                  showFc = true;
                  // 마지막 FC면 남은 행을 모두 차지
                  fcRowSpan = (rowIdx === fcCount - 1) ? (totalRows - rowIdx) : 1;
                  fcItem = group.fcs[rowIdx];
                }
                
                renderRows.push({
                  fmId: group.fmId,
                  rowIdx,
                  totalRows,
                  fe: feItem,
                  feRowSpan,
                  showFe,
                  fm: { text: group.fmText, no: group.fmNo, process: group.fmProcess },
                  showFm: rowIdx === 0,
                  fc: fcItem,
                  fcRowSpan,
                  showFc
                });
              }
            });
            
            return (
              <div style={{ padding: '8px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr>
                      <th colSpan={4} style={{ background: COLORS.fe.header, padding: '6px', textAlign: 'center', fontWeight: 700, border: `1px solid ${COLORS.line}`, color: COLORS.fe.text }}>고장영향(FE)</th>
                      <th style={{ background: COLORS.fm.header, padding: '6px', textAlign: 'center', fontWeight: 700, border: `1px solid ${COLORS.line}`, color: COLORS.fm.text }}>고장형태(FM)</th>
                      <th colSpan={4} style={{ background: COLORS.fc.header, padding: '6px', textAlign: 'center', fontWeight: 700, border: `1px solid ${COLORS.line}`, color: COLORS.fc.text }}>고장원인(FC)</th>
                    </tr>
                    <tr>
                      <th style={{ width: '6%', background: '#e3f2fd', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>No</th>
                      <th style={{ width: '10%', background: '#e3f2fd', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>구분</th>
                      <th style={{ width: '18%', background: '#e3f2fd', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>고장영향</th>
                      <th style={{ width: '5%', background: '#e3f2fd', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>S</th>
                      <th style={{ width: '14%', background: '#fff8e1', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>고장형태</th>
                      <th style={{ width: '6%', background: '#e8f5e9', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>No</th>
                      <th style={{ width: '10%', background: '#e8f5e9', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>공정명</th>
                      <th style={{ width: '12%', background: '#e8f5e9', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>작업요소</th>
                      <th style={{ background: '#e8f5e9', padding: '4px', border: '1px solid #ccc', fontWeight: 600 }}>고장원인</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderRows.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
                        <div>연결된 고장이 없습니다</div>
                      </td></tr>
                    ) : renderRows.map((row, idx) => {
                      // 결과 테이블은 모두 연결된 상태이므로 녹색 계열 사용
                      const linkedBg = '#e8f5e9'; // 연한 녹색
                      return (
                        <tr key={`${row.fmId}-${row.rowIdx}`} style={{ borderTop: row.rowIdx === 0 ? '2px solid #999' : undefined }}>
                          {row.showFe && (
                            <>
                              <td rowSpan={row.feRowSpan} style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700, color: COLORS.fe.text, verticalAlign: 'middle' }}>{row.fe?.feNo || ''}</td>
                              <td rowSpan={row.feRowSpan} style={{ padding: '4px', border: '1px solid #ccc', fontSize: '9px', verticalAlign: 'middle' }}>{row.fe?.scope || ''}</td>
                              <td rowSpan={row.feRowSpan} style={{ padding: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}>{row.fe?.text || ''}</td>
                              <td rowSpan={row.feRowSpan} style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle', color: (row.fe?.severity || 0) >= 8 ? '#c62828' : (row.fe?.severity || 0) >= 5 ? '#f57f17' : '#333' }}>{row.fe?.severity || ''}</td>
                            </>
                          )}
                          {row.showFm && (
                            <td rowSpan={row.totalRows} style={{ padding: '6px', border: '1px solid #ccc', background: '#fff8e1', fontWeight: 600, textAlign: 'center', verticalAlign: 'middle' }}>
                              <div style={{ fontSize: '10px', color: COLORS.fm.text }}>{row.fm.no}</div>
                              <div>{row.fm.text}</div>
                            </td>
                          )}
                          {row.showFc && (
                            <>
                              <td rowSpan={row.fcRowSpan} style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700, color: COLORS.fc.text, verticalAlign: 'middle' }}>{row.fc?.fcNo || ''}</td>
                              <td rowSpan={row.fcRowSpan} style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 600, fontSize: '9px', background: linkedBg, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{row.fc?.processName || ''}</td>
                              <td rowSpan={row.fcRowSpan} style={{ padding: '4px', border: '1px solid #ccc', fontSize: '9px', verticalAlign: 'middle' }}>{row.fc?.workElem || ''}</td>
                              <td rowSpan={row.fcRowSpan} style={{ padding: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}>{row.fc?.text || ''}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* 통계 */}
                <div style={{ marginTop: '10px', padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontSize: '11px', color: '#666' }}>
                  <strong>📊 연결 현황:</strong> FM {groups.length}개 | FE {groups.reduce((sum, g) => sum + g.fes.length, 0)}개 | FC {groups.reduce((sum, g) => sum + g.fcs.length, 0)}개
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
