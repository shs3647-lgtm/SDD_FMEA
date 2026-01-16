/**
 * CP 연동 성공 테스트
 */
import { test, expect } from '@playwright/test';

test('CP 연동 - 전체 플로우 성공 확인', async ({ page }) => {
  console.log('=== CP 연동 전체 플로우 테스트 ===');
  
  // 다이얼로그 핸들러
  page.on('dialog', async dialog => {
    console.log('다이얼로그:', dialog.message());
    await dialog.accept();
  });
  
  // 1. FMEA 워크시트 열기
  console.log('1. FMEA 워크시트 열기');
  await page.goto('http://localhost:3000/pfmea/worksheet?id=PFM26-M001&tab=all');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 2. CP 구조연동 실행
  console.log('2. CP 구조연동 실행');
  const cpSyncButton = page.locator('[data-testid="cp-sync-button"]');
  await cpSyncButton.click();
  await page.waitForTimeout(300);
  
  const structureSyncButton = page.locator('button:has-text("CP 구조연동")');
  await structureSyncButton.click();
  await page.waitForTimeout(2000);
  
  // 3. CP 워크시트로 이동 (cpNo 파라미터!)
  console.log('3. CP 워크시트로 이동');
  await page.goto('http://localhost:3000/control-plan/worksheet?cpNo=cp26-m001');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'test-results/cp-sync-success.png', fullPage: true });
  
  // 4. 페이지 텍스트 전체에서 확인
  const pageContent = await page.content();
  
  const hasJajaeIpgo = pageContent.includes('자재입고');
  const hasSuipGeomsa = pageContent.includes('수입검사');
  const hasMBMixing = pageContent.includes('MB Mixing');
  
  console.log('페이지 내용에서 확인:');
  console.log('- 자재입고:', hasJajaeIpgo);
  console.log('- 수입검사:', hasSuipGeomsa);
  console.log('- MB Mixing:', hasMBMixing);
  
  // 5. API로 데이터 확인
  console.log('4. API로 데이터 최종 확인');
  const response = await page.request.get('http://localhost:3000/api/control-plan/cp26-m001/items');
  const data = await response.json();
  
  console.log('API Items 개수:', data.data?.length);
  
  // 고유 공정명 추출
  const processNames = [...new Set(data.data?.map((item: any) => item.processName) || [])];
  console.log('고유 공정명:', processNames);
  
  // 검증
  expect(data.success).toBe(true);
  expect(data.data?.length).toBeGreaterThan(0);
  expect(processNames).toContain('자재입고');
  expect(processNames).toContain('수입검사');
  expect(processNames).toContain('MB Mixing');
  
  // 페이지에도 표시되어야 함
  expect(hasJajaeIpgo).toBe(true);
  expect(hasSuipGeomsa).toBe(true);
  expect(hasMBMixing).toBe(true);
  
  console.log('✅ CP 연동 테스트 성공!');
});
