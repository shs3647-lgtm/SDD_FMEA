/**
 * @file layout.tsx
 * @description APQP 모듈 레이아웃
 */

import { Sidebar } from '@/components/layout';

export default function APQPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-[50px] overflow-auto">
        {children}
      </main>
    </div>
  );
}


