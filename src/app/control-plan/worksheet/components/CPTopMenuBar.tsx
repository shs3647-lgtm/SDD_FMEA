/**
 * @file CPTopMenuBar.tsx
 * @description Control Plan 워크시트 상단 메뉴바 (PFMEA TopMenuBar 패턴)
 * - CP 선택, 저장, Import/Export, FMEA 동기화
 * - 반응형 Tailwind CSS 적용
 * 
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface CPTopMenuBarProps {
  cpList: any[];
  selectedCpId: string | null;
  fmeaId: string | null;
  dirty: boolean;
  isSaving: boolean;
  itemCount: number;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  onCpChange: (id: string) => void;
  onSave: () => void;
  onStructureSync: () => void;
  onDataSync: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onAddRow: () => void;
}

/** 공통 버튼 스타일 - 반응형 */
const menuBtn = `
  px-1.5 sm:px-2 lg:px-3 py-1 rounded transition-all 
  bg-transparent border border-transparent text-white 
  text-[10px] sm:text-[11px] lg:text-xs font-medium 
  hover:bg-white/15 hover:text-yellow-300 whitespace-nowrap
`;

export default function CPTopMenuBar({
  cpList,
  selectedCpId,
  fmeaId,
  dirty,
  isSaving,
  itemCount,
  syncStatus = 'idle',
  onCpChange,
  onSave,
  onStructureSync,
  onDataSync,
  onExport,
  onImportClick,
  onAddRow,
}: CPTopMenuBarProps) {
  const router = useRouter();
  const [showImportMenu, setShowImportMenu] = React.useState(false);
  const [showSyncMenu, setShowSyncMenu] = React.useState(false);
  const isSyncing = syncStatus === 'syncing';

  return (
    <div 
      className="flex items-center gap-1 sm:gap-2 fixed top-8 left-[53px] right-0 h-8 px-0 sm:px-1 z-[99] border-t border-b border-white/30 overflow-x-auto scrollbar-hide"
      style={{ background: 'linear-gradient(to right, #00695c, #00897b, #00695c)' }}
    >
      {/* CP명 */}
      <div className="flex items-center gap-1 shrink-0">
        <span 
          className="hidden sm:inline text-white cursor-pointer hover:underline text-[10px] lg:text-xs font-semibold whitespace-nowrap"
          onClick={() => router.push('/control-plan/list')}
        >
          📋 <span className="hidden lg:inline">CP</span>명:
        </span>
        <select
          value={selectedCpId || '__NEW__'}
          onChange={(e) => onCpChange(e.target.value)}
          className="px-1 sm:px-2 py-1 rounded border-0 bg-white/20 text-white min-w-[100px] sm:min-w-[140px] lg:min-w-[160px] text-[10px] sm:text-[11px] lg:text-xs"
        >
          <option value="__NEW__" className="text-gray-800 font-bold">📄 새로 작성</option>
          {cpList.map((cp: any) => (
            <option key={cp.id} value={cp.id} className="text-gray-800">
              {cp.cpNo || cp.id}
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
                onClick={() => { onImportClick(); setShowImportMenu(false); }}
                className="w-full text-left px-3 py-2 text-[11px] hover:bg-teal-50 border-b text-gray-800"
              >
                📂 Excel 가져오기
              </button>
              <button
                onClick={() => { /* TODO: 템플릿 다운로드 */ setShowImportMenu(false); }}
                className="w-full text-left px-3 py-2 text-[11px] hover:bg-teal-50 text-gray-800"
              >
                📋 템플릿 다운로드
              </button>
            </div>
          )}
        </div>
        
        <button onClick={onExport} className={menuBtn}>
          📤<span className="hidden lg:inline">Export</span>
        </button>
      </div>

      <div className="hidden sm:block w-px h-5 bg-white/30 shrink-0" />

      {/* 행 추가/FMEA 동기화 */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        <button onClick={onAddRow} className={`${menuBtn} bg-green-600/50`}>
          ➕<span className="hidden lg:inline">행 추가</span>
        </button>
        
        {/* 동기화 드롭다운 */}
        <div className="relative">
          <button 
            onClick={() => setShowSyncMenu(!showSyncMenu)}
            disabled={!fmeaId || isSyncing}
            className={`${menuBtn} ${fmeaId ? 'bg-blue-600/50' : 'opacity-50 cursor-not-allowed'}`}
          >
            {isSyncing ? '⏳' : '🔗'}<span className="hidden lg:inline">FMEA 연동</span>▾
          </button>
          {showSyncMenu && fmeaId && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border z-50 min-w-[160px]"
              onMouseLeave={() => setShowSyncMenu(false)}
            >
              <button
                onClick={() => { onStructureSync(); setShowSyncMenu(false); }}
                disabled={isSyncing}
                className="w-full text-left px-3 py-2 text-[11px] hover:bg-blue-50 border-b text-gray-800 disabled:opacity-50"
              >
                🔗 FMEA 구조연동
                <span className="block text-[9px] text-gray-500">FMEA 구조를 CP에 생성</span>
              </button>
              <button
                onClick={() => { onDataSync(); setShowSyncMenu(false); }}
                disabled={isSyncing}
                className="w-full text-left px-3 py-2 text-[11px] hover:bg-blue-50 text-gray-800 disabled:opacity-50"
              >
                🔄 데이터 동기화
                <span className="block text-[9px] text-gray-500">공통 필드 양방향 업데이트</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block w-px h-5 bg-white/30 shrink-0" />

      {/* FMEA/리스트 이동 */}
      <div className="hidden md:flex items-center gap-1 shrink-0">
        <button 
          onClick={() => router.push('/pfmea/worksheet')} 
          className="px-2 py-1 rounded border border-white/30 bg-indigo-700/50 text-white text-[10px] lg:text-xs font-medium hover:bg-indigo-600 transition-all whitespace-nowrap"
        >
          📊 FMEA 이동
        </button>
        <button 
          onClick={() => router.push('/control-plan/list')} 
          className="px-2 py-1 rounded border border-white/30 bg-white/10 text-white text-[10px] lg:text-xs font-medium hover:bg-white/20 transition-all whitespace-nowrap"
        >
          📋 리스트
        </button>
      </div>

      {/* 우측: 항목 수 표시 */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {fmeaId && (
          <span className="text-[10px] text-white/70 hidden lg:inline">
            🔗 FMEA: {fmeaId}
          </span>
        )}
        <span className="text-[10px] text-white/70">
          {itemCount}개 항목
        </span>
      </div>
    </div>
  );
}

