'use client';

import React from 'react';

interface SelectableCellProps {
  value: string;
  placeholder: string;
  bgColor: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  onClick: () => void;
}

/**
 * 선택 가능한 셀 (클릭하면 모달 열림)
 * 기능분석, 고장분석 등 모든 워크시트 탭에서 공용으로 사용
 */
export default function SelectableCell({
  value,
  placeholder,
  bgColor,
  textColor,
  textAlign = 'left',
  onClick,
}: SelectableCellProps) {
  return (
    <div
      className="cursor-pointer hover:bg-black/5 w-full h-full flex items-center p-1"
      onClick={onClick}
      style={{ 
        minHeight: '24px', 
        fontSize: '10px', 
        fontFamily: 'inherit',
        color: textColor || 'inherit',
        fontWeight: textColor ? 700 : 'inherit',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        background: value ? 'transparent' : `repeating-linear-gradient(45deg, ${bgColor}, ${bgColor} 4px, #fff 4px, #fff 8px)`
      }}
      title="클릭하여 선택"
    >
      {value || <span className="text-gray-400 italic">🔍 {placeholder}</span>}
    </div>
  );
}



