'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SelectableCellProps {
  value: string;
  placeholder: string;
  bgColor: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  onClick: () => void;
  onDoubleClickEdit?: (newValue: string) => void; // 더블클릭 인라인 편집 콜백
}

/**
 * 선택 가능한 셀 (클릭하면 모달 열림, 더블클릭하면 인라인 편집)
 * 기능분석, 고장분석 등 모든 워크시트 탭에서 공용으로 사용
 */
export default function SelectableCell({
  value,
  placeholder,
  bgColor,
  textColor,
  textAlign = 'left',
  onClick,
  onDoubleClickEdit,
}: SelectableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleClick = () => {
    // 더블클릭 감지를 위해 약간의 지연
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      return; // 더블클릭으로 처리됨
    }
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null;
      onClick();
    }, 200);
  };

  const handleDoubleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (onDoubleClickEdit) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onDoubleClickEdit && editValue !== value) {
      onDoubleClickEdit(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (onDoubleClickEdit && editValue !== value) {
        onDoubleClickEdit(editValue);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '24px',
          padding: '2px 4px',
          fontSize: '10px',
          border: '2px solid #1976d2',
          borderRadius: '2px',
          outline: 'none',
          background: '#fff',
        }}
      />
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-black/5 w-full h-full flex items-center p-1"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{ 
        minHeight: '24px', 
        fontSize: '10px', 
        fontFamily: 'inherit',
        color: textColor || 'inherit',
        fontWeight: textColor ? 700 : 'inherit',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        background: value ? 'transparent' : `repeating-linear-gradient(45deg, ${bgColor}, ${bgColor} 4px, #fff 4px, #fff 8px)`
      }}
      title="클릭: 모달 선택 | 더블클릭: 직접 편집"
    >
      {value || <span className="text-gray-400 italic">🔍 {placeholder}</span>}
    </div>
  );
}



