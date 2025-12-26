/**
 * @file layout.tsx
 * @description PFMEA 모듈 레이아웃
 * @author AI Assistant
 * @created 2025-12-26
 */

import { Sidebar, StatusBar } from '@/components/layout';

export default function PFMEALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: '#f5f7fa' }}>
      {/* 사이드바 (fixed, w-12=48px) */}
      <Sidebar />

      {/* 구분선: 굵은선(4px) + 흰패딩(1px) = 5px */}
      <div 
        className="fixed h-screen z-40"
        style={{ 
          left: '56px', 
          width: '5px',
          background: 'linear-gradient(to right, #00587a 4px, #fff 4px)'
        }} 
      />

      {/* 메인 콘텐츠 영역 - 사이드바(56px) + 구분선(5px) = 61px */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: '61px', padding: 0 }}>
        {/* 콘텐츠 - 패딩 없이 꽉 채움 */}
        <main className="flex-1 overflow-auto" style={{ padding: 0, margin: 0 }}>
          {children}
        </main>

        {/* 상태바 */}
        <StatusBar />
      </div>
    </div>
  );
}



