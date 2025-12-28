/**
 * @file FailureLinkTab.tsx
 * @description 고장연결 탭 - FM 중심 연결 관리 (4:3:3 레이아웃)
 * 좌측 (40%): FE/FM/FC 3개 패널
 * 중앙 (30%): 고장 연결도 (FM 중심)
 * 우측 (30%): 연결 결과 테이블
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
  fe: { header: '#e3f2fd', text: '#1565c0', cell: '#e3f2fd' },
  fm: { header: '#fff8e1', text: '#f57c00', cell: '#fff8e1' },
  fc: { header: '#e8f5e9', text: '#2e7d32', cell: '#e8f5e9' },
  mn: '#eef7ff',
  mc: '#ffe6e6',
  en: '#fef0ff',
};

interface FEItem { id: string; scope: string; text: string; severity?: number; }
interface FMItem { id: string; processName: string; text: string; }
interface FCItem { id: string; processName: string; m4: string; workElem: string; text: string; }
interface LinkResult { fmId: string; feId?: string; feScope: string; feText: string; severity: number; fmText: string; fmProcess: string; fcId?: string; fcM4: string; fcWorkElem: string; fcText: string; }

export default function FailureLinkTab({ state, setState, setDirty, saveToLocalStorage }: FailureTabProps) {
  // 선택된 FM
  const [currentFMId, setCurrentFMId] = useState<string | null>(null);
  const [linkedFEs, setLinkedFEs] = useState<Map<string, FEItem>>(new Map());
  const [linkedFCs, setLinkedFCs] = useState<Map<string, FCItem>>(new Map());
  const [savedLinks, setSavedLinks] = useState<LinkResult[]>([]);
  const [editMode, setEditMode] = useState<'edit' | 'confirm'>('edit');
  const chainAreaRef = useRef<HTMLDivElement>(null);

  // FE 데이터 추출 (L1 고장영향)
  const feData: FEItem[] = useMemo(() => {
    const items: FEItem[] = [];
    (state.l1?.failureScopes || []).forEach((fs: any) => {
      if (fs.effect) {
        let scope = '';
        let severity = fs.severity || 0;
        (state.l1?.types || []).forEach((type: any) => {
          (type.functions || []).forEach((fn: any) => {
            (fn.requirements || []).forEach((req: any) => {
              if (req.id === fs.reqId) scope = type.name;
            });
          });
        });
        items.push({ id: fs.id, scope: scope || 'Your Plant', text: fs.effect, severity });
      }
    });
    return items;
  }, [state.l1]);

  // FM 데이터 추출 (L2 고장형태)
  const fmData: FMItem[] = useMemo(() => {
    const items: FMItem[] = [];
    (state.l2 || []).forEach((proc: any) => {
      (proc.functions || []).forEach((fn: any) => {
        (fn.productChars || []).forEach((pc: any) => {
          (pc.failureModes || []).forEach((fm: any) => {
            if (fm.name) {
              items.push({ id: fm.id || uid(), processName: proc.name, text: fm.name });
            }
          });
        });
      });
    });
    return items;
  }, [state.l2]);

  // FC 데이터 추출 (L3 고장원인)
  const fcData: FCItem[] = useMemo(() => {
    const items: FCItem[] = [];
    (state.l2 || []).forEach((proc: any) => {
      (proc.l3 || []).forEach((we: any) => {
        const m4 = we.fourM || 'MN';
        (we.functions || []).forEach((fn: any) => {
          (fn.processChars || []).forEach((pc: any) => {
            (pc.failureCauses || []).forEach((fc: any) => {
              if (fc.name) {
                items.push({ id: fc.id || uid(), processName: proc.name, m4, workElem: we.name, text: fc.name });
              }
            });
          });
        });
      });
    });
    return items;
  }, [state.l2]);

  // 현재 FM
  const currentFM = useMemo(() => fmData.find(f => f.id === currentFMId), [fmData, currentFMId]);

  // 저장된 링크 불러오기
  useEffect(() => {
    const saved = (state as any).failureLinks || [];
    setSavedLinks(saved);
  }, [state]);

  // FM 선택
  const selectFM = useCallback((id: string) => {
    setCurrentFMId(id);
    const fmLinks = savedLinks.filter(l => l.fmId === id);
    const newFEs = new Map<string, FEItem>();
    const newFCs = new Map<string, FCItem>();
    fmLinks.forEach(link => {
      const feItem = feData.find(f => f.text === link.feText);
      const fcItem = fcData.find(f => f.text === link.fcText);
      if (feItem) newFEs.set(feItem.id, feItem);
      if (fcItem) newFCs.set(fcItem.id, fcItem);
    });
    setLinkedFEs(newFEs);
    setLinkedFCs(newFCs);
  }, [savedLinks, feData, fcData]);

  // FE 토글
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
  }, [currentFMId, editMode, feData]);

  // FC 토글
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
  }, [currentFMId, editMode, fcData]);

  // 연결 확정
  const confirmLink = useCallback(() => {
    if (!currentFMId || !currentFM) return;
    let newLinks = savedLinks.filter(l => l.fmId !== currentFMId);
    const feArray = Array.from(linkedFEs.values());
    const fcArray = Array.from(linkedFCs.values());
    const maxLen = Math.max(feArray.length, fcArray.length, 1);
    
    for (let i = 0; i < maxLen; i++) {
      const fe = feArray[i] || { id: '', scope: '', text: '', severity: 0 };
      const fc = fcArray[i] || { id: '', m4: '', workElem: '', text: '' };
      newLinks.push({
        fmId: currentFMId,
        feId: fe.id || undefined,
        feScope: fe.scope,
        feText: fe.text,
        severity: fe.severity || (i + 1),
        fmText: currentFM.text,
        fmProcess: currentFM.processName,
        fcId: fc.id || undefined,
        fcM4: fc.m4,
        fcWorkElem: fc.workElem,
        fcText: fc.text
      });
    }
    
    setSavedLinks(newLinks);
    setState((prev: any) => ({ ...prev, failureLinks: newLinks }));
    setDirty(true);
    saveToLocalStorage?.();
    setEditMode('edit');
    alert(`✅ ${currentFM.text} 연결이 확정되었습니다.`);
  }, [currentFMId, currentFM, linkedFEs, linkedFCs, savedLinks, setState, setDirty, saveToLocalStorage]);

  // 모드 변경
  const handleModeChange = useCallback((mode: 'edit' | 'confirm') => {
    setEditMode(mode);
    if (mode === 'confirm' && currentFMId && (linkedFEs.size > 0 || linkedFCs.size > 0)) {
      confirmLink();
    }
  }, [currentFMId, linkedFEs, linkedFCs, confirmLink]);

  // 결과 테이블 데이터
  const resultLinks = useMemo(() => {
    return currentFMId ? savedLinks.filter(l => l.fmId === currentFMId) : [];
  }, [currentFMId, savedLinks]);

  // 전체 저장
  const handleSaveAll = useCallback(() => {
    setState((prev: any) => ({ ...prev, failureLinks: savedLinks }));
    setDirty(true);
    saveToLocalStorage?.();
    alert(`✅ 총 ${savedLinks.length}개의 고장연결이 저장되었습니다.`);
  }, [savedLinks, setState, setDirty, saveToLocalStorage]);

  // 통계
  const stats = useMemo(() => {
    const linkedFMCount = new Set(savedLinks.map(l => l.fmId)).size;
    return {
      totalFE: feData.length,
      totalFM: fmData.length,
      totalFC: fcData.length,
      linkedFM: linkedFMCount,
      totalLinks: savedLinks.length
    };
  }, [feData, fmData, fcData, savedLinks]);

  return (
    <div style={{ display: 'flex', height: '100%', background: COLORS.bg, overflow: 'hidden' }}>
      {/* 좌측: 3개 테이블 (40%) */}
      <div style={{ flex: '4', borderRight: `1px solid ${COLORS.line}`, background: '#fff', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 제목 */}
        <div style={{ textAlign: 'center', fontWeight: 900, padding: '6px 0', background: COLORS.skyLight, borderBottom: `1px solid ${COLORS.line}`, fontSize: '12px' }}>
          P-FMEA 고장 분석(4단계) - 고장연결
          <span style={{ marginLeft: '10px', fontSize: '10px', color: '#666' }}>
            (FE:{stats.totalFE} / FM:{stats.totalFM} / FC:{stats.totalFC})
          </span>
        </div>
        
        {/* 3개 테이블 */}
        <div style={{ display: 'flex', flex: 1, gap: '2px', padding: '2px', overflow: 'hidden' }}>
          {/* FE 테이블 */}
          <div style={{ flex: 1, border: `1px solid ${COLORS.line}`, borderRadius: '3px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '4px 6px', fontWeight: 700, fontSize: '10px', background: COLORS.fe.header, color: COLORS.fe.text }}>
              1. 고장영향(FE)
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '22%', background: COLORS.sky, padding: '3px 4px', border: '1px solid #ccc', position: 'sticky', top: 0, zIndex: 10, fontWeight: 700, textAlign: 'center' }}>구분</th>
                    <th style={{ background: COLORS.sky, padding: '3px 4px', border: '1px solid #ccc', position: 'sticky', top: 0, zIndex: 10, fontWeight: 700, textAlign: 'center' }}>고장영향(FE)</th>
                    <th style={{ width: '10%', background: COLORS.sky, padding: '3px 4px', border: '1px solid #ccc', position: 'sticky', top: 0, zIndex: 10, fontWeight: 700, textAlign: 'center' }}>S</th>
                  </tr>
                </thead>
                <tbody>
                  {feData.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '15px', color: '#999' }}>데이터 없음</td></tr>
                  ) : feData.map(fe => (
                    <tr 
                      key={fe.id} 
                      onClick={() => toggleFE(fe.id)}
                      style={{ 
                        cursor: currentFMId ? 'pointer' : 'default', 
                        background: linkedFEs.has(fe.id) ? '#bbdefb' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center' }}>{fe.scope}</td>
                      <td style={{ padding: '3px 4px', border: '1px solid #ccc' }}>{fe.text}</td>
                      <td style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold', color: (fe.severity || 0) >= 8 ? '#c62828' : '#333' }}>{fe.severity || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FM 테이블 */}
          <div style={{ flex: 1, border: `1px solid ${COLORS.line}`, borderRadius: '3px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '4px 6px', fontWeight: 700, fontSize: '10px', background: COLORS.fm.header, color: COLORS.fm.text }}>
              2. 고장형태(FM) ⬅ 선택
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '28%', background: COLORS.sky, padding: '3px 4px', border: '1px solid #ccc', position: 'sticky', top: 0, zIndex: 10, fontWeight: 700, textAlign: 'center' }}>공정명</th>
                    <th style={{ background: COLORS.sky, padding: '3px 4px', border: '1px solid #ccc', position: 'sticky', top: 0, zIndex: 10, fontWeight: 700, textAlign: 'center' }}>고장형태(FM)</th>
                  </tr>
                </thead>
                <tbody>
                  {fmData.length === 0 ? (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: '15px', color: '#999' }}>데이터 없음</td></tr>
                  ) : fmData.map(fm => {
                    const isSelected = currentFMId === fm.id;
                    const hasSaved = savedLinks.some(l => l.fmId === fm.id);
                    return (
                      <tr 
                        key={fm.id} 
                        onClick={() => selectFM(fm.id)}
                        style={{ 
                          cursor: 'pointer', 
                          background: isSelected ? '#ffe082' : hasSaved ? '#c8e6c9' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold' }}>{fm.processName}</td>
                        <td style={{ padding: '3px 4px', border: '1px solid #ccc' }}>{fm.text}{hasSaved ? ' ✓' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FC 테이블 */}
          <div style={{ flex: 1, border: `1px solid ${COLORS.line}`, borderRadius: '3px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '4px 6px', fontWeight: 700, fontSize: '10px', background: COLORS.fc.header, color: COLORS.fc.text }}>
              3. 고장원인(FC)
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '12%', background: COLORS.sky, padding: '3px 4px', border: '1px solid #ccc', position: 'sticky', top: 0, zIndex: 10, fontWeight: 700, textAlign: 'center' }}>4M</th>
                    <th style={{ width: '25%', background: COLORS.sky, padding: '3px 4px', border: '1px solid #ccc', position: 'sticky', top: 0, zIndex: 10, fontWeight: 700, textAlign: 'center' }}>작업요소</th>
                    <th style={{ background: COLORS.sky, padding: '3px 4px', border: '1px solid #ccc', position: 'sticky', top: 0, zIndex: 10, fontWeight: 700, textAlign: 'center' }}>고장원인(FC)</th>
                  </tr>
                </thead>
                <tbody>
                  {fcData.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '15px', color: '#999' }}>데이터 없음</td></tr>
                  ) : fcData.map(fc => {
                    const m4Bg = fc.m4 === 'MN' ? COLORS.mn : fc.m4 === 'MC' ? COLORS.mc : COLORS.en;
                    return (
                      <tr 
                        key={fc.id} 
                        onClick={() => toggleFC(fc.id)}
                        style={{ 
                          cursor: currentFMId ? 'pointer' : 'default', 
                          background: linkedFCs.has(fc.id) ? '#bbdefb' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold', background: m4Bg }}>{fc.m4}</td>
                        <td style={{ padding: '3px 4px', border: '1px solid #ccc' }}>{fc.workElem}</td>
                        <td style={{ padding: '3px 4px', border: '1px solid #ccc' }}>{fc.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 중앙: 연결도 (30%) */}
      <div style={{ flex: '3', borderRight: `1px solid ${COLORS.line}`, background: '#fff', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: COLORS.skyLight, borderBottom: `1px solid ${COLORS.line}` }}>
          <span style={{ fontWeight: 900, fontSize: '12px' }}>고장 연결도 (FM 중심)</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => handleModeChange('edit')} 
              style={{ 
                padding: '3px 10px', 
                fontSize: '10px', 
                border: '1px solid #999', 
                borderRadius: '3px', 
                cursor: 'pointer', 
                background: editMode === 'edit' ? COLORS.blue : '#fff', 
                color: editMode === 'edit' ? '#fff' : '#333' 
              }}
            >
              수정
            </button>
            <button 
              onClick={() => handleModeChange('confirm')} 
              disabled={!currentFMId || (linkedFEs.size === 0 && linkedFCs.size === 0)}
              style={{ 
                padding: '3px 10px', 
                fontSize: '10px', 
                border: '1px solid #999', 
                borderRadius: '3px', 
                cursor: (!currentFMId || (linkedFEs.size === 0 && linkedFCs.size === 0)) ? 'not-allowed' : 'pointer', 
                background: COLORS.blue, 
                color: '#fff',
                opacity: (!currentFMId || (linkedFEs.size === 0 && linkedFCs.size === 0)) ? 0.5 : 1
              }}
            >
              연결확정
            </button>
          </div>
        </div>
        
        {/* 연결도 */}
        <div ref={chainAreaRef} style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '8px', position: 'relative', overflow: 'auto' }}>
          {!currentFM ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>
              ← FM(고장형태)를 먼저 선택하세요
            </div>
          ) : (
            <div style={{ display: 'flex', width: '100%', height: '100%', gap: '8px' }}>
              {/* FE 열 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', paddingTop: '10px', overflowY: 'auto' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: COLORS.fe.text, marginBottom: '4px' }}>FE ({linkedFEs.size})</div>
                {Array.from(linkedFEs.values()).map(fe => (
                  <div key={fe.id} style={{ background: '#fff', border: `2px solid ${COLORS.fe.text}`, borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '95%', overflow: 'hidden', fontSize: '9px' }}>
                    <div style={{ padding: '3px 6px', fontWeight: 'bold', borderBottom: '1px solid #eee', background: COLORS.fe.header, color: COLORS.fe.text }}>{fe.scope} (S:{fe.severity || '-'})</div>
                    <div style={{ padding: '4px 6px', lineHeight: 1.3, color: '#333' }}>{fe.text}</div>
                  </div>
                ))}
              </div>
              
              {/* FM 열 (중앙) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: COLORS.fm.text, marginBottom: '4px' }}>FM (선택됨)</div>
                <div style={{ background: '#fff', border: `3px solid ${COLORS.fm.text}`, borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', width: '95%', overflow: 'hidden', fontSize: '9px' }}>
                  <div style={{ padding: '4px 6px', fontWeight: 'bold', borderBottom: '1px solid #eee', background: COLORS.fm.header, color: COLORS.fm.text }}>{currentFM.processName}</div>
                  <div style={{ padding: '6px', lineHeight: 1.4, color: '#333', fontWeight: 'bold' }}>{currentFM.text}</div>
                </div>
              </div>
              
              {/* FC 열 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', paddingTop: '10px', overflowY: 'auto' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: COLORS.fc.text, marginBottom: '4px' }}>FC ({linkedFCs.size})</div>
                {Array.from(linkedFCs.values()).map(fc => (
                  <div key={fc.id} style={{ background: '#fff', border: `2px solid ${COLORS.fc.text}`, borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '95%', overflow: 'hidden', fontSize: '9px' }}>
                    <div style={{ padding: '3px 6px', fontWeight: 'bold', borderBottom: '1px solid #eee', background: COLORS.fc.header, color: COLORS.fc.text }}>{fc.m4} / {fc.workElem}</div>
                    <div style={{ padding: '4px 6px', lineHeight: 1.3, color: '#333' }}>{fc.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 우측: 연결 결과 (30%) */}
      <div style={{ flex: '3', background: '#fff', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#e8eaf6', borderBottom: `1px solid ${COLORS.line}` }}>
          <span style={{ fontWeight: 900, fontSize: '12px' }}>연결 결과</span>
          <span style={{ fontSize: '10px', color: '#666' }}>연결: {stats.linkedFM}/{stats.totalFM} FM</span>
        </div>
        
        {/* 결과 테이블 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
            <thead>
              <tr>
                <th colSpan={3} style={{ background: '#bbdefb', padding: '4px', textAlign: 'center', fontWeight: 700, border: `1px solid ${COLORS.line}`, fontSize: '9px' }}>1. 고장영향(FE)</th>
                <th style={{ background: '#fff8e1', padding: '4px', textAlign: 'center', fontWeight: 700, border: `1px solid ${COLORS.line}`, fontSize: '9px' }}>2. FM</th>
                <th colSpan={3} style={{ background: '#c8e6c9', padding: '4px', textAlign: 'center', fontWeight: 700, border: `1px solid ${COLORS.line}`, fontSize: '9px' }}>3. 고장원인(FC)</th>
              </tr>
              <tr>
                <th style={{ width: '10%', background: '#e3f2fd', padding: '3px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc', fontSize: '8px' }}>구분</th>
                <th style={{ width: '18%', background: '#e3f2fd', padding: '3px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc', fontSize: '8px' }}>FE</th>
                <th style={{ width: '6%', background: '#e3f2fd', padding: '3px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc', fontSize: '8px' }}>S</th>
                <th style={{ width: '18%', background: '#fff8e1', padding: '3px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc', fontSize: '8px' }}>FM</th>
                <th style={{ width: '8%', background: '#e8f5e9', padding: '3px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc', fontSize: '8px' }}>4M</th>
                <th style={{ width: '15%', background: '#e8f5e9', padding: '3px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc', fontSize: '8px' }}>작업요소</th>
                <th style={{ width: '25%', background: '#e8f5e9', padding: '3px', textAlign: 'center', fontWeight: 600, border: '1px solid #ccc', fontSize: '8px' }}>FC</th>
              </tr>
            </thead>
            <tbody>
              {resultLinks.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  {currentFMId ? '연결된 항목이 없습니다' : 'FM을 선택하세요'}
                </td></tr>
              ) : resultLinks.map((link, idx) => {
                const m4Bg = link.fcM4 === 'MN' ? COLORS.mn : link.fcM4 === 'MC' ? COLORS.mc : COLORS.en;
                return (
                  <tr key={idx}>
                    <td style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center' }}>{link.feScope}</td>
                    <td style={{ padding: '3px 4px', border: '1px solid #ccc' }}>{link.feText}</td>
                    <td style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold', color: link.severity >= 8 ? '#c62828' : '#333' }}>{link.severity}</td>
                    {idx === 0 && (
                      <td rowSpan={resultLinks.length} style={{ padding: '3px 4px', border: '1px solid #ccc', background: '#fff8e1', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>{link.fmText}</td>
                    )}
                    <td style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center', background: m4Bg }}>{link.fcM4}</td>
                    <td style={{ padding: '3px 4px', border: '1px solid #ccc' }}>{link.fcWorkElem}</td>
                    <td style={{ padding: '3px 4px', border: '1px solid #ccc' }}>{link.fcText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* 저장 버튼 */}
        <div style={{ padding: '6px 8px', background: '#f5f5f5', borderTop: `1px solid ${COLORS.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#666' }}>총 {savedLinks.length}개 연결</span>
          <button 
            onClick={handleSaveAll} 
            style={{ 
              padding: '4px 12px', 
              background: '#e74c3c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '10px' 
            }}
          >
            💾 저장
          </button>
        </div>
      </div>
    </div>
  );
}
