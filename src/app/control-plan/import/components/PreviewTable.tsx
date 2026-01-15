/**
 * @file PreviewTable.tsx
 * @description CP Import 미리보기 테이블 컴포넌트
 * @created 2026-01-14
 * @line-count ~250줄
 */

'use client';

import { Pencil, Trash2, Save, X } from 'lucide-react';
import type { ImportedData } from '../types';
import { PREVIEW_COLUMNS, GROUP_HEADERS, tw } from '../constants';

// key를 itemCode로 매핑 (PREVIEW_COLUMNS의 key → 실제 itemCode)
const KEY_TO_ITEM_CODE_MAP: Record<string, string> = {
  'processNo': 'A1',
  'processName': 'A2',
  'level': 'A3',
  'processDesc': 'A4',
  'equipment': 'A5',
  'ep': 'A6',
  'autoDetector': 'A7',
  'productChar': 'B1',
  'processChar': 'B2',
  'specialChar': 'B3',
  'spec': 'B4',
  'evalMethod': 'B5',
  'sampleSize': 'B6',
  'frequency': 'B7',
  'owner1': 'B8',
  'owner2': 'B9',
  'reactionPlan': 'B10',
};

type PreviewTab = 'full' | 'group' | 'individual';

export interface PreviewTableProps {
  data: ImportedData[];
  tab: PreviewTab;
  editingRowId: string | null;
  editValues: Record<string, string>;
  selectedRows: Set<string>;
  selectedColumn: string | null;
  onEditStart: (processNo: string, data: ImportedData[]) => void;
  onEditSave: (processNo: string, tab: PreviewTab) => void;
  onEditCancel: () => void;
  onDelete: (processNo: string, tab: PreviewTab) => void;
  onCellChange: (field: string, value: string) => void;
  onRowSelect: (processNo: string) => void;
  onColumnClick: (key: string) => void;
  onSelectAll: (processNos: string[]) => void;
}

/**
 * 미리보기 테이블 컴포넌트
 * - 전체/그룹/개별 미리보기 테이블 렌더링
 * - 행별 편집/삭제/저장 UI
 * - 헤더 렌더링
 */
export default function PreviewTable({
  data,
  tab,
  editingRowId,
  editValues,
  selectedRows,
  selectedColumn,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onCellChange,
  onRowSelect,
  onColumnClick,
  onSelectAll,
}: PreviewTableProps) {
  const processNos = [...new Set(data.map(d => d.processNo))];
  
  return (
    <table className="border-collapse border-spacing-0 w-[1540px] min-w-[1540px] max-w-[1540px] table-fixed m-0 p-0 border-0">
      {/* colgroup: table-layout: fixed에서 컬럼 폭을 결정하는 핵심 요소 */}
      <colgroup>
        {/* 관리 컬럼 3개 */}
        <col className="w-[20px]" />
        <col className="w-[30px]" />
        <col className="w-[30px]" />
        {/* PREVIEW_COLUMNS 컬럼들 */}
        {PREVIEW_COLUMNS.map(col => {
          return <col key={col.key} className={col.width} />;
        })}
      </colgroup>
      <thead className="sticky top-0 z-[10]">
        <tr className="h-[18px]">
          <th colSpan={3} className="bg-gray-600 text-white text-[10px] font-medium text-center border border-gray-400 antialiased sticky top-0">관리</th>
          {GROUP_HEADERS.map(grp => (
            <th key={grp.key} colSpan={grp.colSpan} className={`${grp.color} text-white text-[10px] font-medium text-center border border-gray-400 antialiased sticky top-0`}>
              {grp.label}
            </th>
          ))}
        </tr>
        <tr className="h-[22px]">
          <th className={`${tw.headerCell} w-[20px] bg-[#0d9488] sticky top-[18px]`}>
            <input type="checkbox" className="w-3 h-3" onChange={(e) => {
              if (e.target.checked) onSelectAll(processNos);
              else onSelectAll([]);
            }} />
          </th>
          <th className={`${tw.headerCell} w-[30px] bg-[#0d9488] sticky top-[18px]`}>No</th>
          <th className={`${tw.headerCell} w-[30px] bg-[#0d9488] sticky top-[18px]`}>작업</th>
          {PREVIEW_COLUMNS.map(col => {
            const groupColor = { processInfo: 'bg-teal-500', detector: 'bg-purple-500', controlItem: 'bg-blue-500', controlMethod: 'bg-green-500', reactionPlan: 'bg-orange-400' }[col.group || 'processInfo'];
            return (
              <th key={col.key} 
                className={`${groupColor} text-white px-0.5 py-0.5 border border-gray-400 text-[10px] font-medium text-center cursor-pointer whitespace-nowrap antialiased sticky top-[18px] ${selectedColumn === col.key ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => onColumnClick(col.key)}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {processNos.length === 0 ? (
          Array.from({ length: 20 }).map((_, i) => (
            <tr key={`empty-${i}`} className={`h-5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className={tw.cellCenter}></td>
              <td className={tw.cellCenter}>{i + 1}</td>
              <td className={tw.cellCenter}></td>
              {PREVIEW_COLUMNS.map(col => <td key={col.key} className={tw.cell}></td>)}
            </tr>
          ))
        ) : (
          processNos.map((processNo, i) => {
            const row = data.filter(d => d.processNo === processNo);
            
            const getValue = (key: string) => {
              const itemCode = KEY_TO_ITEM_CODE_MAP[key] || key;
              return row.find(r => r.itemCode === itemCode)?.value || '';
            };
            
            const isEditing = editingRowId === processNo;
            
            return (
              <tr key={`row-${processNo}-${i}`} className={`h-5 ${selectedRows.has(processNo) ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className={tw.cellCenter}>
                  <input type="checkbox" className="w-2.5 h-2.5" checked={selectedRows.has(processNo)} onChange={() => onRowSelect(processNo)} />
                </td>
                <td className={tw.cellCenter}>{i + 1}</td>
                <td className={tw.cellCenter}>
                  <div className="flex items-center justify-center gap-0.5">
                    {isEditing ? (
                      <>
                        <button onClick={() => onEditSave(processNo, tab)} className="p-0.5 bg-green-500 text-white rounded hover:bg-green-600" title="저장">
                          <Save size={9} />
                        </button>
                        <button onClick={onEditCancel} className="p-0.5 bg-gray-400 text-white rounded hover:bg-gray-500" title="취소">
                          <X size={9} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onEditStart(processNo, data)} className="p-0.5 bg-blue-500 text-white rounded hover:bg-blue-600" title="수정">
                          <Pencil size={9} />
                        </button>
                        <button onClick={() => onDelete(processNo, tab)} className="p-0.5 bg-red-500 text-white rounded hover:bg-red-600" title="삭제">
                          <Trash2 size={9} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
                {PREVIEW_COLUMNS.map(col => (
                  <td key={col.key} className={`${tw.cell} ${selectedColumn === col.key ? 'bg-yellow-100' : ''}`}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editValues[col.key] ?? getValue(col.key)} 
                        onChange={(e) => onCellChange(col.key, e.target.value)}
                        className="w-full px-0.5 py-0 border border-blue-400 rounded text-[10px] bg-white focus:outline-none font-normal antialiased" 
                      />
                    ) : (
                      <span className="antialiased font-normal">{getValue(col.key)}</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

