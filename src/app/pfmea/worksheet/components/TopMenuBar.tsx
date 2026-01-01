/**
 * @file TopMenuBar.tsx
 * @description 워크시트 상단 메뉴바 (FMEA 선택, 저장, Import/Export, 특별특성 등)
 * 
 * @version 2.0.0 - 인라인 스타일 제거, Tailwind CSS 적용
 */

'use client';

import React, { useMemo } from 'react';
import { WorksheetState } from '../constants';

interface TopMenuBarProps {
  fmeaList: any[];
  currentFmea: any;
  selectedFmeaId: string | null;
  dirty: boolean;
  isSaving: boolean;
  lastSaved: string;
  currentTab: string;
  importMessage: { type: 'success' | 'error'; text: string } | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  state: WorksheetState;
  onFmeaChange: (id: string) => void;
  onSave: () => void;
  onNavigateToList: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onOpenSpecialChar: () => void;
  onOpenSOD: () => void;
  onOpen5AP: () => void;
  onOpen6AP: () => void;
  onOpenRPN?: () => void;
}

/** 공통 버튼 스타일 */
const menuBtn = 'px-3 py-1 rounded transition-all bg-transparent border border-transparent text-white text-xs font-medium hover:bg-white/15 hover:text-yellow-400';

/** AP 계산 함수 */
function calculateAP(s: number, o: number, d: number): 'H' | 'M' | 'L' {
  if (s >= 9 && o >= 4) return 'H';
  if (s >= 7 && o >= 6) return 'H';
  if (s >= 5 && o >= 8) return 'H';
  if (s >= 7 || o >= 6 || d >= 7) return 'M';
  return 'L';
}

export default function TopMenuBar({ 
  fmeaList, selectedFmeaId, dirty, isSaving, importMessage, fileInputRef, state,
  onFmeaChange, onSave, onNavigateToList, onExport, onImportFile, onDownloadTemplate, onOpenSpecialChar, onOpenSOD, onOpen5AP, onOpen6AP, onOpenRPN
}: TopMenuBarProps) {
  const [showImportMenu, setShowImportMenu] = React.useState(false);
  
  // 5단계 AP 통계 계산
  const ap5Stats = useMemo(() => {
    const riskData = state.riskData || {};
    let h = 0, m = 0, l = 0;
    
    // 최대 심각도
    let maxS = 0;
    Object.keys(riskData).forEach(key => {
      if (key.startsWith('S-fe-')) {
        const val = Number(riskData[key]) || 0;
        if (val > maxS) maxS = val;
      }
    });
    
    // risk-{idx}-O, risk-{idx}-D에서 AP 계산
    const indices = new Set<number>();
    Object.keys(riskData).forEach(key => {
      const match = key.match(/^risk-(\d+)-(O|D)$/);
      if (match) indices.add(parseInt(match[1]));
    });
    
    indices.forEach(idx => {
      const o = Number(riskData[`risk-${idx}-O`]) || 0;
      const d = Number(riskData[`risk-${idx}-D`]) || 0;
      if (maxS > 0 && o > 0 && d > 0) {
        const ap = calculateAP(maxS, o, d);
        if (ap === 'H') h++;
        else if (ap === 'M') m++;
        else l++;
      }
    });
    
    return { h, m, l };
  }, [state.riskData]);

  return (
    <div 
      className="flex items-center gap-2 fixed top-8 left-[50px] right-0 h-8 px-2 z-[99] border-t border-b border-white/30"
      style={{ background: 'linear-gradient(to right, #1a237e, #283593, #1a237e)' }}
    >
      {/* FMEA명 */}
      <div className="flex items-center gap-1.5">
        <span 
          className="text-white cursor-pointer hover:underline text-xs font-semibold"
          onClick={onNavigateToList}
        >
          📋 FMEA명:
        </span>
        <select
          value={selectedFmeaId || '__NEW__'}
          onChange={(e) => onFmeaChange(e.target.value)}
          className="px-2 py-1 rounded border-0 bg-white/20 text-white min-w-[160px] text-xs"
        >
          <option value="__NEW__" className="text-gray-800 font-bold">📄 빈화면 (새로 작성)</option>
          {fmeaList.map((fmea: any) => (
            <option key={fmea.id} value={fmea.id} className="text-gray-800">
              {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
            </option>
          ))}
        </select>
        <button onClick={onNavigateToList} className="px-2 py-1 text-white rounded hover:bg-white/20 text-xs">
          📋
        </button>
      </div>

      <div className="w-px h-5 bg-white/30" />

      {/* 저장/Import/Export */}
      <div className="flex items-center gap-1.5 relative">
        <button 
          onClick={onSave} 
          disabled={isSaving} 
          className={`px-3 py-1 rounded transition-all text-white text-xs font-semibold ${
            isSaving ? 'bg-orange-500' : dirty ? 'bg-green-600' : 'bg-white/15'
          }`}
        >
          {isSaving ? '⏳저장중' : dirty ? '💾저장' : '✅저장됨'}
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
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b"
              >
                📂 Excel 파일 가져오기
              </button>
              <button
                onClick={() => { onDownloadTemplate(); setShowImportMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50"
              >
                📋 템플릿 다운로드
              </button>
            </div>
          )}
        </div>
        
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={onImportFile} className="hidden" />
        
        <button onClick={onExport} className={menuBtn}>📤Export</button>
        
        {importMessage && (
          <span className={`px-3 py-1 rounded text-white text-xs font-semibold ${importMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {importMessage.text}
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-white/30" />

      {/* 특별특성/SOD/5AP/6AP/RPN/LLD */}
      <div className="flex items-center gap-1.5 mr-[290px]">
        <button onClick={onOpenSpecialChar} className={menuBtn}>⭐특별특성</button>
        <button onClick={onOpenSOD} className={menuBtn}>📊SOD</button>
        <button onClick={onOpen5AP} className={menuBtn}>5AP</button>
        <button onClick={onOpen6AP} className={menuBtn}>6AP</button>
        <button onClick={onOpenRPN} className={`${menuBtn} bg-purple-600/50`}>📊RPN</button>
        <button className={menuBtn}>📚LLD</button>
      </div>

      {/* 우측: 5단계 AP - 280px (표준화: 80px 레이블 + 200px 값) */}
      <div className="flex-1" />
      <div 
        className="absolute right-0 top-0 w-[280px] h-8 flex items-stretch border-l-[2px] border-white"
        style={{ background: 'linear-gradient(to right, #1565c0, #1976d2)' }}
      >
        <div className="w-[80px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-yellow-400 text-xs font-bold whitespace-nowrap">5단계:</span>
        </div>
        <div className="w-[66px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-red-400 text-xs font-bold whitespace-nowrap">H:{ap5Stats.h}</span>
        </div>
        <div className="w-[66px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-yellow-400 text-xs font-bold whitespace-nowrap">M:{ap5Stats.m}</span>
        </div>
        <div className="w-[68px] h-8 flex items-center justify-center shrink-0">
          <span className="text-green-400 text-xs font-bold whitespace-nowrap">L:{ap5Stats.l}</span>
        </div>
      </div>
    </div>
  );
}
