/**
 * @file layout.tsx
 * @description 대시보드 레이아웃 (사이드바 + 헤더 + 심플 컨텐츠)
 * @author AI Assistant
 * @created 2025-12-25
 * @version 2.0.0
 * 
 * 변경사항:
 * - 대시보드에서는 InfoBar, StepBar 숨김
 * - 연한 파란색 배경 적용
 * 
 * 레이어 구조 (대시보드):
 * - L1: Header (48px)
 * - L2: TopNav (40px)
 * - L3: ActionBar (36px) - 검색만
 * - L6: Content Area (flex)
 * - L7: StatusBar (24px)
 */

import { Sidebar, StatusBar } from '@/components/layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-slate-100">
      {/* ======== 사이드바 (좌측 고정) ======== */}
      <Sidebar />

      {/* ======== L6: 메인 컨텐츠 영역 ======== */}
      {/* 
        대시보드는 Header, TopNav, InfoBar, ActionBar, StepBar 모두 생략
        top: 0
        left: 12 (Sidebar) = 48px
        bottom: 6 (StatusBar) = 24px
      */}
      <main className="fixed top-0 left-12 right-0 bottom-6 overflow-auto">
        {children}
      </main>

      {/* ======== L7: 상태바 ======== */}
      <StatusBar />
    </div>
  );
}
