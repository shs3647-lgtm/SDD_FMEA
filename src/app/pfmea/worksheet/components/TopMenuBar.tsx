/**
 * @file TopMenuBar.tsx
 * @description 워크시트 상단 메뉴바 (FMEA 선택, 저장, Import/Export, 특별특성 등)
 */

'use client';

import React from 'react';
import { COLORS } from '../constants';

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
}

export default function TopMenuBar({ 
  fmeaList, currentFmea, selectedFmeaId, dirty, isSaving, lastSaved, currentTab, importMessage, fileInputRef,
  onFmeaChange, onSave, onNavigateToList, onExport, onImportClick, onImportFile, onDownloadTemplate, onOpenSpecialChar, onOpenSOD, onOpen5AP, onOpen6AP 
}: TopMenuBarProps) {
  const [showImportMenu, setShowImportMenu] = React.useState(false);

  return (
    <div className="flex items-center py-1 gap-2 flex-wrap" style={{ background: COLORS.structure.main, paddingLeft: '4px', paddingRight: '8px' }}>
      {/* FMEA명 */}
      <div className="flex items-center gap-1">
        <span className="text-white text-xs font-bold cursor-pointer hover:underline" onClick={onNavigateToList}>📋 FMEA명:</span>
        <select
          value={selectedFmeaId || '__NEW__'}
          onChange={(e) => onFmeaChange(e.target.value)}
          className="px-1 py-0.5 text-xs font-semibold rounded border-0"
          style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', minWidth: '140px' }}
        >
          <option value="__NEW__" style={{ color: '#333', fontWeight: 'bold' }}>📄 빈화면 (새로 작성)</option>
          {fmeaList.map((fmea: any) => (
            <option key={fmea.id} value={fmea.id} style={{ color: '#333' }}>
              {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
            </option>
          ))}
        </select>
        <button onClick={onNavigateToList} className="px-1 py-0.5 text-xs text-white rounded hover:bg-white/20">📋</button>
      </div>

      <div className="w-px h-5 bg-white/40" />

      {/* 저장/Import/Export */}
      <div className="flex items-center gap-1 relative">
        <button onClick={onSave} disabled={isSaving} className="px-1.5 py-0.5 text-xs font-bold rounded"
          style={{ background: isSaving ? '#ff9800' : dirty ? '#4caf50' : 'rgba(255,255,255,0.18)', color: '#fff' }}>
          {isSaving ? '⏳저장중' : dirty ? '💾저장' : '✅저장됨'}
        </button>
        
        {/* Import 버튼 및 드롭다운 */}
        <div className="relative">
          <button 
            onClick={() => setShowImportMenu(!showImportMenu)}
            className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" 
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            📥Import▾
          </button>
          {showImportMenu && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border z-50"
              style={{ minWidth: '160px' }}
              onMouseLeave={() => setShowImportMenu(false)}
            >
              <button
                onClick={() => { 
                  fileInputRef.current?.click(); 
                  setShowImportMenu(false); 
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b"
              >
                📂 Excel 파일 가져오기
              </button>
              <button
                onClick={() => { 
                  onDownloadTemplate(); 
                  setShowImportMenu(false); 
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50"
              >
                📋 템플릿 다운로드
              </button>
            </div>
          )}
        </div>
        
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={onImportFile}
          className="hidden"
        />
        
        <button onClick={onExport} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(255,255,255,0.18)' }}>📤Export</button>
        
        {/* Import 결과 메시지 */}
        {importMessage && (
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ 
              background: importMessage.type === 'success' ? '#4caf50' : '#f44336',
              color: '#fff'
            }}
          >
            {importMessage.text}
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-white/40" />

      {/* 특별특성/SOD/AP/RPN/LLD */}
      <div className="flex items-center gap-1">
        <button onClick={onOpenSpecialChar} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(255,255,255,0.18)' }}>⭐특별특성</button>
        <button onClick={onOpenSOD} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(76,175,80,0.6)' }}>📊SOD</button>
        <button onClick={onOpen5AP} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(255,100,100,0.5)' }}>🔴5AP</button>
        <button onClick={onOpen6AP} className="px-1.5 py-0.5 text-xs font-bold text-white rounded hover:bg-white/30" style={{ background: 'rgba(255,165,0,0.5)' }}>🟠6AP</button>
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📊RPN</button>
        <button className="px-1.5 py-0.5 text-xs font-bold text-white rounded" style={{ background: 'rgba(255,255,255,0.18)' }}>📚LLD</button>
      </div>
    </div>
  );
}

