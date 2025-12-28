'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { CSSProperties } from 'react';

interface OrderArrowsProps {
  color?: string;
  size?: number;
  draggable?: boolean;
}

/**
 * 순서 변경 화살표 컴포넌트
 * - 위/아래 화살표 표시
 * - 드래그앤드롭 지원 시 커서 변경
 */
export function OrderArrows({ color = '#ccc', size = 10, draggable = false }: OrderArrowsProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
    cursor: draggable ? 'grab' : 'default'
  };

  return (
    <div style={containerStyle}>
      <ChevronUp style={{ width: size, height: size, color }} />
      <ChevronDown style={{ width: size, height: size, color }} />
    </div>
  );
}




