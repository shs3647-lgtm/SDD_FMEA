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
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col ml-16">
        {/* 콘텐츠 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* 상태바 */}
        <StatusBar />
      </div>
    </div>
  );
}

