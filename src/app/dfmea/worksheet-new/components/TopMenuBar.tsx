/**
 * @file TopMenuBar.tsx
 * @description 워크시트 상단 메뉴바 (반응형)
 * - FMEA 선택, 저장, Import/Export, 특별특성 등
 * - 화면 크기에 따라 자동 조정
 * 
 * @version 3.0.0 - 반응형 Tailwind CSS 적용
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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

/** 공통 버튼 스타일 - 반응형 */
const menuBtn = `
  px-1.5 sm:px-2 lg:px-3 py-1 rounded transition-all 
  bg-transparent border border-transparent text-white 
  text-[10px] sm:text-[11px] lg:text-xs font-medium 
  hover:bg-white/15 hover:text-yellow-400 whitespace-nowrap
`;

export default function TopMenuBar({ 
  fmeaList, selectedFmeaId, dirty, isSaving, importMessage, fileInputRef, state,
  onFmeaChange, onSave, onNavigateToList, onExport, onImportFile, onDownloadTemplate, onOpenSpecialChar, onOpenSOD, onOpen5AP, onOpen6AP, onOpenRPN
}: TopMenuBarProps) {
  const router = useRouter();
  const [showImportMenu, setShowImportMenu] = React.useState(false);

  return (
    <div 
      className="flex items-center gap-1 sm:gap-2 fixed top-8 left-[50px] right-0 h-8 px-1 sm:px-2 z-[99] border-t border-b border-white/30 overflow-x-auto scrollbar-hide"
      style={{ background: 'linear-gradient(to right, #1a237e, #283593, #1a237e)' }}
    >
      {/* FMEA명 */}
      <div className="flex items-center gap-1 shrink-0">
        <span 
          className="hidden sm:inline text-white cursor-pointer hover:underline text-[10px] lg:text-xs font-semibold whitespace-nowrap"
          onClick={onNavigateToList}
        >
          📋 <span className="hidden lg:inline">FMEA</span>명:
        </span>
        <select
          value={selectedFmeaId || '__NEW__'}
          onChange={(e) => onFmeaChange(e.target.value)}
          className="px-1 sm:px-2 py-1 rounded border-0 bg-white/20 text-white min-w-[100px] sm:min-w-[140px] lg:min-w-[160px] text-[10px] sm:text-[11px] lg:text-xs"
        >
          <option value="__NEW__" className="text-gray-800 font-bold">📄 새로 작성</option>
          {fmeaList.map((fmea: any) => (
            <option key={fmea.id} value={fmea.id} className="text-gray-800">
              {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
            </option>
          ))}
        </select>
      </div>

      <div className="w-px h-5 bg-white/30 shrink-0" />

      {/* 저장/Import/Export */}
      <div className="flex items-center gap-1 shrink-0 relative">
        <button 
          onClick={onSave} 
          disabled={isSaving} 
          className={`px-2 sm:px-3 py-1 rounded transition-all text-white text-[10px] sm:text-[11px] lg:text-xs font-semibold whitespace-nowrap ${
            isSaving ? 'bg-orange-500' : dirty ? 'bg-green-600' : 'bg-white/15'
          }`}
        >
          {isSaving ? '⏳' : dirty ? '💾' : '✅'}
          <span className="hidden sm:inline">{isSaving ? '저장중' : dirty ? '저장' : '저장됨'}</span>
        </button>
        
        {/* Import 드롭다운 */}
        <div className="relative">
          <button 
            onClick={() => setShowImportMenu(!showImportMenu)}
            className={menuBtn}
          >
            📥<span className="hidden lg:inline">Import</span>▾
          </button>
          {showImportMenu && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border z-50 min-w-[140px]"
              onMouseLeave={() => setShowImportMenu(false)}
            >
              <button
                onClick={() => { fileInputRef.current?.click(); setShowImportMenu(false); }}
                className="w-full text-left px-3 py-2 text-[11px] hover:bg-blue-50 border-b text-gray-800"
              >
                📂 Excel 가져오기
              </button>
              <button
                onClick={() => { onDownloadTemplate(); setShowImportMenu(false); }}
                className="w-full text-left px-3 py-2 text-[11px] hover:bg-blue-50 text-gray-800"
              >
                📋 템플릿 다운로드
              </button>
            </div>
          )}
        </div>
        
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={onImportFile} className="hidden" />
        
        <button onClick={onExport} className={menuBtn}>
          📤<span className="hidden lg:inline">Export</span>
        </button>
        
        {importMessage && (
          <span className={`px-2 py-1 rounded text-white text-[10px] font-semibold ${importMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {importMessage.text}
          </span>
        )}
      </div>

      <div className="hidden sm:block w-px h-5 bg-white/30 shrink-0" />

      {/* 특별특성/SOD/5AP/6AP/RPN - 중간 화면 이상 */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        <button onClick={onOpenSpecialChar} className={menuBtn}>⭐<span className="hidden lg:inline">특별특성</span></button>
        <button onClick={onOpenSOD} className={menuBtn}>📊<span className="hidden lg:inline">SOD</span></button>
        <button onClick={onOpen5AP} className={menuBtn}>5AP</button>
        <button onClick={onOpen6AP} className={menuBtn}>6AP</button>
        <button onClick={onOpenRPN} className={`${menuBtn} bg-purple-600/50`}>RPN</button>
      </div>

      <div className="hidden md:block w-px h-5 bg-white/30 shrink-0" />

      {/* 4판/CP/LLD - 큰 화면에서만 */}
      <div className="hidden md:flex items-center gap-1 shrink-0">
        <button 
          onClick={() => {
            try {
              localStorage.setItem('fmea-worksheet-data', JSON.stringify(state));
              router.push(selectedFmeaId ? `/dfmea/fmea4?id=${selectedFmeaId}` : '/dfmea/fmea4');
            } catch (e) {
              console.error('4판 이동 실패:', e);
              alert('4판 생성 중 오류가 발생했습니다.');
            }
          }} 
          className="px-2 py-1 rounded border border-white/30 bg-purple-700/50 text-white text-[10px] lg:text-xs font-medium hover:bg-purple-600 transition-all whitespace-nowrap"
        >
          📋 4판
        </button>
        <button 
          onClick={() => router.push('/control-plan')} 
          className="px-2 py-1 rounded border border-white/30 bg-teal-700/50 text-white text-[10px] lg:text-xs font-medium hover:bg-teal-600 transition-all whitespace-nowrap"
        >
          📝 CP
        </button>
        <button 
          className="px-2 py-1 rounded border border-white/30 bg-indigo-700/50 text-white text-[10px] lg:text-xs font-medium hover:bg-indigo-600 transition-all whitespace-nowrap"
        >
          📚 LLD
        </button>
      </div>

    </div>
  );
}
