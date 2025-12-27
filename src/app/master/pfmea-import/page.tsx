/**
 * @file page.tsx
 * @description PFMEA 기초정보 Import - /master/pfmea-import
 * @version 1.0.0
 * @created 2025-12-26
 * @note 기존 /pfmea/import 페이지로 리다이렉트
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MasterPFMEAImportPage() {
  const router = useRouter();

  useEffect(() => {
    // 기존 import 페이지로 리다이렉트
    router.replace('/pfmea/import');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#f5f5f5',
      fontFamily: '"Malgun Gothic", sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '24px',
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          PFMEA Import 페이지로 이동 중...
        </div>
      </div>
    </div>
  );
}


