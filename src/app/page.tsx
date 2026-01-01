/**
 * @file page.tsx
 * @description 루트 페이지 - DFMEA 워크시트로 리다이렉트
 */

import { redirect } from 'next/navigation';

export default function Home() {
  // DFMEA 워크시트로 자동 리다이렉트
  redirect('/dfmea/worksheet');
}
