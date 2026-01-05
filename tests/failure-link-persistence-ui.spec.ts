/**
 * @file failure-link-persistence-ui.spec.ts
 * @description FULL_SYSTEM: 고장연결(화살표/분석결과)이 저장되어 새로고침 후에도 유지되는지 UI 레벨에서 검증
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const FMEA_ID = process.env.TEST_FMEA_ID ?? 'PFM26-001';

test.describe('FailureLink persistence (UI-level)', () => {
  test('connect → confirm → reload → arrows & counts persist', async ({ page, request }) => {
    await page.goto(`${BASE}/pfmea/worksheet?id=${encodeURIComponent(FMEA_ID)}`);
    await page.waitForLoadState('networkidle');

    // 고장연결 탭 진입
    const linkTabBtn = page.getByRole('button', { name: '고장연결' });
    await expect(linkTabBtn).toBeVisible();
    await linkTabBtn.click();
    await page.waitForTimeout(500);

    // 확정 상태면 "수정"으로 편집 모드 진입(있을 때만)
    const editBtn = page.getByRole('button', { name: '수정' });
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    // FM 선택 (첫 번째)
    const fmFirstRow = page.locator('table:has(th:has-text("고장형태(FM)")) tbody tr').first();
    await expect(fmFirstRow).toBeVisible();
    await fmFirstRow.click();
    await page.waitForTimeout(300);

    // FE 1개 연결 (첫 번째)
    const feFirstRow = page.locator('table:has(th:has-text("고장영향(FE)")) tbody tr').first();
    await expect(feFirstRow).toBeVisible();
    await feFirstRow.click();
    await page.waitForTimeout(300);

    // FC 1개 연결 (첫 번째) - FC는 "고장원인 셀" 클릭이 연결 토글
    const fcFirstRow = page.locator('table:has(th:has-text("고장원인(FC)")) tbody tr').first();
    await expect(fcFirstRow).toBeVisible();
    const fcCauseCell = fcFirstRow.locator('td').nth(3);
    await expect(fcCauseCell).toBeVisible();
    await fcCauseCell.click();
    await page.waitForTimeout(300);

    // 현재 FM 연결확정
    const confirmLinkBtn = page.getByRole('button', { name: /연결확정|미확정/ });
    await expect(confirmLinkBtn).toBeVisible();
    await confirmLinkBtn.click();
    await page.waitForTimeout(800);

    // 전체확정 (있으면 눌러서 failureLinkConfirmed 저장)
    const confirmAllBtn = page.getByRole('button', { name: '전체확정' });
    if ((await confirmAllBtn.isVisible().catch(() => false)) && (await confirmAllBtn.isEnabled().catch(() => false))) {
      await confirmAllBtn.click();
      await page.waitForTimeout(800);
    } else {
      // 버튼이 비활성인 케이스(누락이 많거나 조건 미충족)는 스킵
      await page.waitForTimeout(200);
    }

    // API로 legacy/atomic에 failureLinks가 생겼는지 확인 (최소 1개)
    const legacyRes = await request.get(`${BASE}/api/fmea?fmeaId=${encodeURIComponent(FMEA_ID)}`);
    expect(legacyRes.ok()).toBeTruthy();
    const legacy = await legacyRes.json();
    expect(Array.isArray(legacy.failureLinks)).toBeTruthy();
    expect(legacy.failureLinks.length).toBeGreaterThan(0);

    const atomicRes = await request.get(`${BASE}/api/fmea?fmeaId=${encodeURIComponent(FMEA_ID)}&format=atomic`);
    expect(atomicRes.ok()).toBeTruthy();
    const atomic = await atomicRes.json();
    expect(Array.isArray(atomic.failureLinks)).toBeTruthy();
    expect(atomic.failureLinks.length).toBeGreaterThan(0);

    // 새로고침 후에도 UI의 SVG(화살표) 존재 확인
    await page.reload();
    await page.waitForLoadState('networkidle');
    await linkTabBtn.click();
    await page.waitForTimeout(800);

    // 화살표 SVG path가 존재해야 함 (최소 1개)
    const svgPaths = page.locator('svg path');
    await expect(svgPaths.first()).toBeVisible();
  });
});


