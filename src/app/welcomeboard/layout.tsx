/**
 * @file layout.tsx
 * @description 웰컴보드 레이아웃 (사이드바 + 심플 컨텐츠)
 * @author AI Assistant
 * @created 2026-01-03
 * @version 1.0.0
 * 
 * 레이어 구조 (웰컴보드):
 * - L1: Header 없음
 * - L2: TopNav 없음
 * - L3: ActionBar 없음
 * - L6: Content Area (flex)
 * - L7: StatusBar (24px)
 */

import { Sidebar, StatusBar } from '@/components/layout';

interface WelcomeBoardLayoutProps {
  children: React.ReactNode;
}

export default function WelcomeBoardLayout({ children }: WelcomeBoardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-slate-100">
      {/* ======== 사이드바 (좌측 고정) ======== */}
      <Sidebar />

      {/* ======== L6: 메인 컨텐츠 영역 ======== */}
      <main className="fixed top-0 left-12 right-0 bottom-6 overflow-auto">
        {children}
      </main>

      {/* ======== L7: 상태바 ======== */}
      <StatusBar />
    </div>
  );
}
