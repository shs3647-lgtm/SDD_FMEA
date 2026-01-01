/**
 * @file ChartCard.tsx
 * @description 차트 카드 컴포넌트 (공통 래퍼)
 */

'use client';

import React from 'react';

interface ChartCardProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}

export function ChartCard({ title, icon, children, className = '', accentColor = '#0ea5e9' }: ChartCardProps) {
  return (
    <div 
      className={`
        relative bg-white rounded-xl shadow-lg overflow-hidden
        border border-slate-200/50
        transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5
        ${className}
      `}
    >
      {/* 상단 액센트 라인 */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }}
      />
      
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="text-sm font-bold text-slate-700 tracking-tight">
          {title}
        </h3>
      </div>
      
      {/* 차트 영역 */}
      <div className="px-4 pb-4 h-[calc(100%-52px)]">
        {children}
      </div>
    </div>
  );
}

