/**
 * @file Header.tsx
 * @description 웰컴보드 헤더 컴포넌트
 * @author AI Assistant
 * @created 2026-01-03
 */

'use client';

export default function Header() {
  return (
    <header className="mb-6 bg-[#0e1a33] border border-[#1d2a48] rounded-[14px] shadow-lg">
      <div className="flex items-center justify-between h-14 px-6">
        {/* 중앙: Smart System */}
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-black text-white tracking-wide">
            Smart System
          </h1>
        </div>
        
        {/* 우측: 접속자 ID 버튼 */}
        <div className="flex-shrink-0">
          <button className="px-4 py-2 bg-[#5ba9ff] hover:bg-[#4a9aee] text-white text-sm font-bold rounded-lg transition-colors">
            접속자 ID
          </button>
        </div>
      </div>
    </header>
  );
}


