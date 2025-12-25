/**
 * @file page.tsx
 * @description 루트 페이지 - 메인 대시보드로 리다이렉트
 * @author AI Assistant
 * @created 2025-12-25
 * @version 1.0.0
 */

import { redirect } from 'next/navigation';

export default function Home() {
  // 메인 대시보드로 자동 리다이렉트
  redirect('/dashboard');
}
