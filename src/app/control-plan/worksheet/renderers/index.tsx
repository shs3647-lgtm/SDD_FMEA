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
  charRowSpan: SpanInfo[];
  inputMode: CPInputMode;
  onCellChange: (itemId: string, key: string, value: any) => void;
  onContextMenu: (e: React.MouseEvent, rowIdx: number, type: ContextMenuType, colKey?: string) => void;
  onAutoModeClick: (rowIdx: number, type: ContextMenuType, colKey?: string) => void;
  onEnterKey?: (rowIdx: number, type: ContextMenuType, colKey?: string) => void;
}

export function renderCell({
  item,
  col,
  rowIdx,
  items,
  processRowSpan,
  descRowSpan,
  workRowSpan,
  charRowSpan,
  inputMode,
  onCellChange,
  onContextMenu,
  onAutoModeClick,
  onEnterKey,
}: RenderCellProps): React.ReactNode {
  const value = (item as any)[col.key];
  // 줄무늬 패턴: 짝수 행은 cellColor, 홀수 행은 cellAltColor
  const bgColor = rowIdx % 2 === 0 ? col.cellColor : col.cellAltColor;
  
  const cellStyle: React.CSSProperties = {
    padding: CELL_STYLE.padding,
    fontSize: CELL_STYLE.fontSize,
    lineHeight: CELL_STYLE.lineHeight,
    background: bgColor,
    textAlign: col.align,
    border: '1px solid #ccc',
    borderBottom: '1px solid #ccc', // 행 구분선 (1px)
    height: HEIGHTS.body, // 명시적 높이 설정
    width: col.width, // PRD 고유 폭 적용
    minWidth: col.width,
    verticalAlign: 'middle',
  };
  
  // 엔터 키 핸들러 (수동 모드일 때만) - 컨텍스트 메뉴의 "아래로 행추가"와 동일하게 동작
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (inputMode === 'manual' && e.key === 'Enter' && onEnterKey) {
      e.preventDefault();
      // 컬럼 타입에 따라 ContextMenuType 결정
      let type: ContextMenuType = 'general';
      if (col.key === 'processNo' || col.key === 'processName' || col.key === 'processDesc') {
        type = 'process';
      } else if (col.key === 'workElement') {
        type = 'work';
      } else if (col.key === 'productChar' || col.key === 'processChar') {
        type = 'char';
      } else {
        // 나머지 열은 'general' 타입으로 행 추가
        type = 'general';
      }
      onEnterKey(rowIdx, type, col.key);
    }
  };

  // NO 열 - 순차 번호 (1부터 시작)
  if (col.key === 'rowNo') {
    return (
      <td 
        key={col.id} 
        style={{ 
          ...cellStyle, 
          verticalAlign: 'middle',
          cursor: 'default',
        }}
      >
        <span className="font-semibold text-gray-800 text-[11px]">{rowIdx + 1}</span>
      </td>
    );
  }
  
  // 공정번호, 공정명 - rowSpan 병합 + 컨텍스트 메뉴 (아래로 행 추가)
  if (col.key === 'processNo' || col.key === 'processName') {
    const spanInfo = processRowSpan[rowIdx];
    if (!spanInfo?.isFirst) {
      return null; // 병합된 행은 렌더링 안함
    }
    // 고유값(언더스코어로 시작하는 값)인 경우 빈 값처럼 표시
    const displayValue = (value && typeof value === 'string' && value.startsWith('_')) ? '' : (value || '');
    const isProcessName = col.key === 'processName';
    return (
      <td 
        key={col.id} 
        style={{ 
          ...cellStyle, 
          verticalAlign: 'middle',
          cursor: isProcessName && inputMode === 'auto' ? 'pointer' : 'context-menu',
          background: isProcessName && inputMode === 'auto' ? '#e3f2fd' : cellStyle.background, // 자동모드 시 강조
          padding: '1px', // 내부여백 1PX
        }}
        rowSpan={spanInfo.span}
        onContextMenu={(e) => onContextMenu(e, rowIdx, 'process', col.key)}
        onClick={isProcessName && inputMode === 'auto' ? () => onAutoModeClick(rowIdx, 'process', col.key) : undefined}
      >
        <div className="flex items-center gap-1 justify-center h-full">
          {isProcessName && inputMode === 'auto' && <span className="text-blue-500 text-[8px]">➕</span>}
          <input
            type="text"
            value={displayValue}
            onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent outline-none text-center text-[11px] p-0 h-full"
            onClick={(e) => isProcessName && inputMode === 'auto' && e.stopPropagation()}
          />
        </div>
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
        <span className="font-bold text-gray-700 text-[11px]">{charIndex}</span>
      </td>
    );
  }
  
  // 레벨 선택 - rowSpan 병합 (공정설명과 함께)
  if (col.key === 'processLevel') {
    const spanInfo = descRowSpan[rowIdx];
    if (!spanInfo?.isFirst) {
      return null; // 병합된 행은 렌더링 안함
    }
    // 고유값(언더스코어로 시작하는 값)인 경우 빈 값처럼 표시
    const displayValue = (value && typeof value === 'string' && value.startsWith('_')) ? '' : (value || '');
    return (
      <td key={col.id} style={{ ...cellStyle, verticalAlign: 'middle' }} rowSpan={spanInfo.span}>
        <select
          value={displayValue}
          onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
          className="w-full bg-transparent text-center text-[11px] outline-none"
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
          className="w-full bg-transparent text-center text-[11px] font-bold outline-none"
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
          className="w-full bg-transparent text-center text-[11px] outline-none"
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
          className="w-full bg-transparent text-center text-[11px] outline-none"
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
    // 고유값(언더스코어로 시작하는 값)인 경우 빈 값처럼 표시
    const displayValue = (value && typeof value === 'string' && value.startsWith('_')) ? '' : (value || '');
    return (
      <td 
        key={col.id} 
        style={{ 
          ...cellStyle, 
          cursor: 'context-menu', 
          verticalAlign: 'middle', // 세로 중앙 정렬 적용
          background: inputMode === 'auto' ? '#e3f2fd' : bgColor, // 자동모드 시 강조
          padding: '1px', // 내부여백 좌우상하 1PX로 통일
          whiteSpace: 'pre-wrap', // 줄바꿈 처리
          wordBreak: 'break-all',
        }}
        rowSpan={spanInfo.span}
        onContextMenu={(e) => onContextMenu(e, rowIdx, 'process', col.key)}
        onClick={inputMode === 'auto' ? () => onAutoModeClick(rowIdx, 'process', col.key) : undefined}
      >
        <div className="flex items-center gap-1 h-full min-h-[20px]">
          {inputMode === 'auto' && <span className="text-blue-500 text-[8px] mt-1">➕</span>}
          <div 
            contentEditable={inputMode === 'manual'}
            suppressContentEditableWarning
            onBlur={(e) => onCellChange(item.id, col.key, e.currentTarget.innerText)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleKeyDown(e as any);
              }
            }}
            className="w-full bg-transparent outline-none text-[11px] text-left min-h-[18px] flex items-center"
            onClick={(e) => inputMode === 'auto' && e.stopPropagation()}
          >
            {displayValue}
          </div>
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
          cursor: 'context-menu', 
          verticalAlign: 'middle',
          background: inputMode === 'auto' ? '#e8f5e9' : bgColor, // 자동모드 시 강조
        }}
        rowSpan={spanInfo.span}
        onContextMenu={(e) => onContextMenu(e, rowIdx, 'work', col.key)}
        onClick={inputMode === 'auto' ? () => onAutoModeClick(rowIdx, 'work') : undefined}
      >
        <div className="flex items-center gap-1 justify-center">
          {inputMode === 'auto' && <span className="text-green-500 text-[8px]">➕</span>}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent outline-none text-center text-[11px]"
            onClick={(e) => inputMode === 'auto' && e.stopPropagation()}
          />
        </div>
      </td>
    );
  }
  
  // 제품특성 - rowSpan 병합 + 수동(컨텍스트메뉴)/자동(클릭모달)
  if (col.key === 'productChar') {
    const spanInfo = charRowSpan[rowIdx];
    if (!spanInfo?.isFirst) {
      return null; // 병합된 행은 렌더링 안함
    }
    const handleProductCharClick = () => {
      console.log('🔥 productChar 클릭됨, inputMode:', inputMode);
      if (inputMode === 'auto') {
        onAutoModeClick(rowIdx, 'char', col.key);
      }
    };
    return (
      <td 
        key={col.id}
        data-column={col.key}
        style={{ 
          ...cellStyle, 
          verticalAlign: 'middle',
          cursor: inputMode === 'auto' ? 'pointer' : 'context-menu',
          background: inputMode === 'auto' ? '#fff3e0' : bgColor, // 자동모드 시 강조
          padding: '1px',
        }}
        rowSpan={spanInfo.span}
        onContextMenu={(e) => onContextMenu(e, rowIdx, 'char', col.key)}
        onClick={handleProductCharClick}
      >
        <div className="flex items-center gap-1 justify-center h-full">
          {inputMode === 'auto' && <span className="text-orange-500 text-[8px]">➕</span>}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent outline-none text-center text-[11px] p-0 h-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </td>
    );
  }
  
  // 기본 텍스트 입력 (중앙정렬) - 나머지 열에도 컨텍스트 메뉴 추가 (자동모드에서도 활성화)
  // 드롭다운/체크박스 제외한 텍스트 컬럼은 자동모드에서 클릭 시 모달 열기
  const isTextInputColumn = !['processLevel', 'specialChar', 'sampleFreq', 'owner1', 'owner2', 'detectorEp', 'detectorAuto', 'charNo', 'rowNo'].includes(col.key);
  const showClickableHighlight = inputMode === 'auto' && isTextInputColumn;
  
  const handleTextCellClick = () => {
    console.log(`🔥 ${col.key} 클릭됨, inputMode:`, inputMode);
    if (inputMode === 'auto' && isTextInputColumn) {
      onAutoModeClick(rowIdx, 'general', col.key);
    }
  };
  
  return (
    <td 
      key={col.id}
      data-column={col.key}
      style={{ 
        ...cellStyle, 
        cursor: showClickableHighlight ? 'pointer' : 'context-menu',
        padding: '1px', // 내부여백 1PX
        verticalAlign: 'middle',
        background: showClickableHighlight ? '#fff8e1' : bgColor, // 자동모드 시 강조
      }}
      onContextMenu={(e) => onContextMenu(e, rowIdx, 'general', col.key)}
      onClick={handleTextCellClick}
    >
      <div className="flex items-center gap-1 justify-center h-full">
        {showClickableHighlight && <span className="text-amber-500 text-[8px]">➕</span>}
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onCellChange(item.id, col.key, e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none text-center text-[11px] p-0 h-full"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </td>
  );
}



