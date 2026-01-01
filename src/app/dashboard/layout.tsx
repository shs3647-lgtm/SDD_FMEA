/**
 * @file layout.tsx
 * @description Dashboard 레이아웃 - 사이드바 포함
 */

import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <Sidebar />
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-14">
        {children}
      </main>
    </div>
  );
}

