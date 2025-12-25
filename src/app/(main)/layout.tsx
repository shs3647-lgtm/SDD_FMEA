/**
 * @file layout.tsx
 * @description 메인 레이아웃 (사이드바 + 헤더 + 컨텐츠)
 * @author AI Assistant
 * @created 2025-12-25
 * @version 1.0.0
 * 
 * 이 레이아웃은 인증된 사용자를 위한 메인 화면 구조를 정의합니다.
 * L1-L7 레이어 구조:
 * - L1: Header (48px)
 * - L2: TopNav (40px)
 * - L3: ActionBar (36px)
 * - L4: InfoBar (32px)
 * - L5: StepBar (36px)
 * - L6: Worksheet Area (flex)
 * - L7: StatusBar (24px)
 */

import { Sidebar, Header, TopNav, ActionBar, InfoBar, StepBar, StatusBar } from '@/components/layout';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ======== 사이드바 (좌측 고정) ======== */}
      <Sidebar />

      {/* ======== L1: 헤더 ======== */}
      <Header currentModule="P-FMEA" />

      {/* ======== L2: 탑 네비게이션 ======== */}
      <TopNav />

      {/* ======== L3: 액션바 ======== */}
      <ActionBar />

      {/* ======== L4: 정보바 ======== */}
      <InfoBar />

      {/* ======== L5: 단계바 ======== */}
      <StepBar />

      {/* ======== L6: 메인 컨텐츠 영역 ======== */}
      {/* 
        top: 12 (Header) + 10 (TopNav) + 9 (ActionBar) + 8 (InfoBar) + 9 (StepBar) = 192px
        left: 12 (Sidebar) = 48px
        bottom: 6 (StatusBar) = 24px
      */}
      <main className="fixed top-[192px] left-12 right-0 bottom-6 overflow-auto bg-white">
        {children}
      </main>

      {/* ======== L7: 상태바 ======== */}
      <StatusBar />
    </div>
  );
}

