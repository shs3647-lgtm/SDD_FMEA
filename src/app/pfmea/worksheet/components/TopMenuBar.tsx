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
    <div 
      className="flex items-center gap-2" 
      style={{ 
        background: 'linear-gradient(to right, #283593, #3949ab, #283593)',  // 2단계 - 중간 밝기
        paddingLeft: '8px', 
        paddingRight: '12px',
        height: '32px',
        fontFamily: '"Segoe UI", "Malgun Gothic", Arial, sans-serif',
        borderTop: '1px solid rgba(255,255,255,0.3)',  // 상단 구분선
        borderBottom: '1px solid rgba(255,255,255,0.3)',  // 하단 구분선
        position: 'sticky',
        top: '32px',  // PFMEATopNav 아래
        zIndex: 50,
      }}
    >
      {/* FMEA명 */}
      <div className="flex items-center gap-1.5">
        <span 
          className="text-white cursor-pointer hover:underline" 
          onClick={onNavigateToList}
          style={{ fontSize: '12px', fontWeight: 600 }}
        >
          📋 FMEA명:
        </span>
        <select
          value={selectedFmeaId || '__NEW__'}
          onChange={(e) => onFmeaChange(e.target.value)}
          className="px-2 py-1 rounded border-0"
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            color: '#fff', 
            minWidth: '160px',
            fontSize: '12px',
            fontWeight: 400,
          }}
        >
          <option value="__NEW__" style={{ color: '#333', fontWeight: 'bold' }}>📄 빈화면 (새로 작성)</option>
          {fmeaList.map((fmea: any) => (
            <option key={fmea.id} value={fmea.id} style={{ color: '#333' }}>
              {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
            </option>
          ))}
        </select>
        <button 
          onClick={onNavigateToList} 
          className="px-2 py-1 text-white rounded hover:bg-white/20"
          style={{ fontSize: '12px' }}
        >
          📋
        </button>
      </div>

      <div className="w-px h-5 bg-white/30" />

      {/* 저장/Import/Export */}
      <div className="flex items-center gap-1.5 relative">
        <button 
          onClick={onSave} 
          disabled={isSaving} 
          className="px-3 py-1 rounded transition-all"
          style={{ 
            background: isSaving ? '#ff9800' : dirty ? '#4caf50' : 'rgba(255,255,255,0.15)', 
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {isSaving ? '⏳저장중' : dirty ? '💾저장' : '✅저장됨'}
        </button>
        
        {/* Import 버튼 및 드롭다운 */}
        <div className="relative">
          <button 
            onClick={() => setShowImportMenu(!showImportMenu)}
            className="px-3 py-1 text-white rounded hover:bg-white/25 transition-all" 
            style={{ 
              background: 'rgba(255,255,255,0.15)',
              fontSize: '12px',
              fontWeight: 600,
            }}
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
        
        <button 
          onClick={onExport} 
          className="px-3 py-1 text-white rounded hover:bg-white/25 transition-all"
          style={{ 
            background: 'rgba(255,255,255,0.15)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          📤Export
        </button>
        
        {/* Import 결과 메시지 */}
        {importMessage && (
          <span 
            className="px-3 py-1 rounded"
            style={{ 
              background: importMessage.type === 'success' ? '#4caf50' : '#f44336',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {importMessage.text}
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-white/30" />

      {/* 특별특성/SOD/AP/RPN/LLD */}
      <div className="flex items-center gap-1.5">
        <button 
          onClick={onOpenSpecialChar} 
          className="px-3 py-1 text-white rounded hover:brightness-110 transition-all" 
          style={{ background: '#ffc107', fontSize: '12px', fontWeight: 600 }}
        >
          ⭐특별특성
        </button>
        <button 
          onClick={onOpenSOD} 
          className="px-3 py-1 text-white rounded hover:brightness-110 transition-all" 
          style={{ background: '#4caf50', fontSize: '12px', fontWeight: 600 }}
        >
          📊SOD
        </button>
        <button 
          onClick={onOpen5AP} 
          className="px-3 py-1 text-white rounded hover:brightness-110 transition-all" 
          style={{ background: '#f44336', fontSize: '12px', fontWeight: 600 }}
        >
          🔴5AP
        </button>
        <button 
          onClick={onOpen6AP} 
          className="px-3 py-1 text-white rounded hover:brightness-110 transition-all" 
          style={{ background: '#ff9800', fontSize: '12px', fontWeight: 600 }}
        >
          🟠6AP
        </button>
        <button 
          className="px-3 py-1 text-white rounded" 
          style={{ background: 'rgba(255,255,255,0.15)', fontSize: '12px', fontWeight: 600 }}
        >
          📊RPN
        </button>
        <button 
          className="px-3 py-1 text-white rounded" 
          style={{ background: 'rgba(255,255,255,0.15)', fontSize: '12px', fontWeight: 600 }}
        >
          📚LLD
        </button>
      </div>
    </div>
  );
}

