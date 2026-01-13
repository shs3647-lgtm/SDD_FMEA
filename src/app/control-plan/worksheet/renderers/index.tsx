/**
 * @file renderers/index.tsx
 * @description CP 워크시트 셀 렌더러
 */

import React from 'react';
import { CPItem, SpanInfo, ContextMenuType } from '../types';
import { CPColumnDef, CELL_STYLE, HEIGHTS, COLORS, SPECIAL_CHAR_OPTIONS, FREQUENCY_OPTIONS, OWNER_OPTIONS, LEVEL_OPTIONS } from '../cpConstants';
import { CPInputMode } from '../components/CPTabMenu';

interface RenderCellProps {
  item: CPItem;
  col: CPColumnDef;
  rowIdx: number;
  items: CPItem[];
  processRowSpan: SpanInfo[];
  descRowSpan: SpanInfo[];
  workRowSpan: SpanInfo[];
  inputMode: CPInputMode;
  onCellChange: (itemId: string, key: string, value: any) => void;
  onContextMenu: (e: React.MouseEvent, rowIdx: number, type: ContextMenuType) => void;
  onAutoModeClick: (rowIdx: number, type: ContextMenuType) => void;
}

export function renderCell({
  item,
  col,
  rowIdx,
  items,
  processRowSpan,
  descRowSpan,
  workRowSpan,
  inputMode,
  onCellChange,
  onContextMenu,
  onAutoModeClick,
}: RenderCellProps): React.ReactNode {
  const value = (item as any)[col.key];
  const bgColor = rowIdx % 2 === 0 ? col.cellColor : col.cellAltColor;
  
  const cellStyle: React.CSSProperties = {
    padding: CELL_STYLE.padding,
    fontSize: CELL_STYLE.fontSize,
    lineHeight: CELL_STYLE.lineHeight,
    background: bgColor,
    textAlign: col.align,
    border: '1px solid #ccc',
    minHeight: HEIGHTS.body,
    verticalAlign: 'middle',
  };
  
  // 공정번호, 공정명 - rowSpan 병합
  if (col.key === 'processNo' || col.key === 'processName') {
    const spanInfo = processRowSpan[rowIdx];
    if (!spanInfo?.isFirst) {
      return null; // 병합된 행은 렌더링 안함
    }
    return (
      <td 
        key={col.id} 
        style={{ ...cellStyle, verticalAlign: 'middle' }}
        rowSpan={spanInfo.span}
      >
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
          className="w-full bg-transparent outline-none text-center text-[9px]"
        />
      </td>
    );
  }
  
  // NO (공정별 특성 순번) - 같은 공정 내에서 1, 2, 3...
  if (col.key === 'charNo') {
    // 같은 공정(processNo + processName) 내에서 순번 계산
    const currentProcess = `${item.processNo}-${item.processName}`;
    let charIndex = 1;
    for (let i = 0; i < rowIdx; i++) {
      const prevItem = items[i];
      const prevProcess = `${prevItem.processNo}-${prevItem.processName}`;
      if (prevProcess === currentProcess) {
        charIndex++;
      }
    }
    return (
      <td key={col.id} style={cellStyle}>
        <span className="font-bold text-gray-700 text-[9px]">{charIndex}</span>
      </td>
    );
  }
  
  // 레벨 선택 - rowSpan 병합 (공정설명과 함께)
  if (col.key === 'processLevel') {
    const spanInfo = descRowSpan[rowIdx];
    if (!spanInfo?.isFirst) {
      return null; // 병합된 행은 렌더링 안함
    }
    return (
      <td key={col.id} style={{ ...cellStyle, verticalAlign: 'middle' }} rowSpan={spanInfo.span}>
        <select
          value={value || ''}
          onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
          className="w-full bg-transparent text-center text-[9px] outline-none"
        >
          <option value="">-</option>
          {LEVEL_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </td>
    );
  }
  
  // Boolean 타입 (체크박스)
  if (col.type === 'boolean') {
    return (
      <td key={col.id} style={cellStyle}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onCellChange(item.id, col.key, e.target.checked)}
          className="w-3 h-3"
        />
      </td>
    );
  }
  
  // 특별특성 선택
  if (col.key === 'specialChar') {
    const color = COLORS.special[value as keyof typeof COLORS.special] || '#666';
    return (
      <td key={col.id} style={cellStyle}>
        <select
          value={value || ''}
          onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
          className="w-full bg-transparent text-center text-[9px] font-bold outline-none"
          style={{ color }}
        >
          {SPECIAL_CHAR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
    );
  }
  
  // 주기 선택
  if (col.key === 'sampleFreq') {
    return (
      <td key={col.id} style={cellStyle}>
        <select
          value={value || ''}
          onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
          className="w-full bg-transparent text-center text-[9px] outline-none"
        >
          <option value="">-</option>
          {FREQUENCY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </td>
    );
  }
  
  // 책임1/책임2 선택
  if (col.key === 'owner1' || col.key === 'owner2') {
    return (
      <td key={col.id} style={cellStyle}>
        <select
          value={value || ''}
          onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
          className="w-full bg-transparent text-center text-[9px] outline-none"
        >
          <option value="">-</option>
          {OWNER_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </td>
    );
  }
  
  // 공정설명 - rowSpan 병합 + 수동(컨텍스트메뉴)/자동(클릭모달)
  if (col.key === 'processDesc') {
    const spanInfo = descRowSpan[rowIdx];
    if (!spanInfo?.isFirst) {
      return null; // 병합된 행은 렌더링 안함
    }
    return (
      <td 
        key={col.id} 
        style={{ 
          ...cellStyle, 
          cursor: inputMode === 'manual' ? 'context-menu' : 'pointer', 
          verticalAlign: 'middle',
          background: inputMode === 'auto' ? '#e3f2fd' : bgColor, // 자동모드 시 강조
        }}
        rowSpan={spanInfo.span}
        onContextMenu={inputMode === 'manual' ? (e) => onContextMenu(e, rowIdx, 'process') : undefined}
        onClick={inputMode === 'auto' ? () => onAutoModeClick(rowIdx, 'process') : undefined}
      >
        <div className="flex items-center gap-1">
          {inputMode === 'auto' && <span className="text-blue-500 text-[8px]">➕</span>}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
            className="w-full bg-transparent outline-none text-[9px] text-left"
            onClick={(e) => inputMode === 'auto' && e.stopPropagation()}
          />
        </div>
      </td>
    );
  }
  
  // 설비/금형/JIG - rowSpan 병합 + 수동(컨텍스트메뉴)/자동(클릭모달)
  if (col.key === 'workElement') {
    const spanInfo = workRowSpan[rowIdx];
    if (!spanInfo?.isFirst) {
      return null; // 병합된 행은 렌더링 안함
    }
    return (
      <td 
        key={col.id} 
        style={{ 
          ...cellStyle, 
          cursor: inputMode === 'manual' ? 'context-menu' : 'pointer', 
          verticalAlign: 'middle',
          background: inputMode === 'auto' ? '#e8f5e9' : bgColor, // 자동모드 시 강조
        }}
        rowSpan={spanInfo.span}
        onContextMenu={inputMode === 'manual' ? (e) => onContextMenu(e, rowIdx, 'work') : undefined}
        onClick={inputMode === 'auto' ? () => onAutoModeClick(rowIdx, 'work') : undefined}
      >
        <div className="flex items-center gap-1 justify-center">
          {inputMode === 'auto' && <span className="text-green-500 text-[8px]">➕</span>}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
            className="w-full bg-transparent outline-none text-center text-[9px]"
            onClick={(e) => inputMode === 'auto' && e.stopPropagation()}
          />
        </div>
      </td>
    );
  }
  
  // 제품특성 - 수동(컨텍스트메뉴)/자동(클릭모달)
  if (col.key === 'productChar') {
    return (
      <td 
        key={col.id} 
        style={{ 
          ...cellStyle, 
          cursor: inputMode === 'manual' ? 'context-menu' : 'pointer',
          background: inputMode === 'auto' ? '#fff3e0' : bgColor, // 자동모드 시 강조
        }}
        onContextMenu={inputMode === 'manual' ? (e) => onContextMenu(e, rowIdx, 'char') : undefined}
        onClick={inputMode === 'auto' ? () => onAutoModeClick(rowIdx, 'char') : undefined}
      >
        <div className="flex items-center gap-1 justify-center">
          {inputMode === 'auto' && <span className="text-orange-500 text-[8px]">➕</span>}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
            className="w-full bg-transparent outline-none text-center text-[9px]"
            onClick={(e) => inputMode === 'auto' && e.stopPropagation()}
          />
        </div>
      </td>
    );
  }
  
  // 기본 텍스트 입력 (중앙정렬)
  return (
    <td key={col.id} style={cellStyle}>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
        className="w-full bg-transparent outline-none text-center text-[9px]"
      />
    </td>
  );
}


