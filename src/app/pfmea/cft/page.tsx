/**
 * @file page.tsx
 * @description CFT 페이지 → FMEA 등록 화면의 CFT 섹션으로 이동
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CFTRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // FMEA 등록 화면의 CFT 섹션으로 이동
    router.replace('/pfmea/register#cft-section');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">🔄</div>
        <p className="text-sm text-gray-600">CFT 리스트로 이동 중...</p>
      </div>
    </div>
  );
}
