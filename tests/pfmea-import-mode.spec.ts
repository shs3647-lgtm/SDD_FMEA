/**
 * @file pfmea-import-mode.spec.ts
 * @description PFMEA Import mode behavior
 *
 * - mode=new: do NOT auto-load master data
 * - mode=master: falls back to localStorage master data when DB is unavailable
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3001';

test('PFMEA import: mode=new does not auto-load master data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pfmea_master_data',
      JSON.stringify([{ id: 'T1', processNo: '10', category: 'A', itemCode: 'A2', value: 'SHOULD_NOT_LOAD', createdAt: new Date().toISOString() }])
    );
  });
  await page.goto(`${BASE_URL}/pfmea/import?mode=new`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('SHOULD_NOT_LOAD')).toHaveCount(0);
});

test('PFMEA import: mode=master loads localStorage master data (fallback)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pfmea_master_data',
      JSON.stringify([{ id: 'T2', processNo: '10', category: 'A', itemCode: 'A2', value: 'SHOULD_LOAD', createdAt: new Date().toISOString() }])
    );
  });
  await page.goto(`${BASE_URL}/pfmea/import?mode=master`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('SHOULD_LOAD')).toBeVisible();
});


