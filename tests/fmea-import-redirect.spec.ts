/**
 * @file fmea-import-redirect.spec.ts
 * @description Legacy alias redirect: /fmea/import -> /pfmea/import
 *
 * Policy: TEST_ENV=FULL_SYSTEM environment
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3001';

test('FMEA alias: /fmea/import -> /pfmea/import (preserve query)', async ({ page }) => {
  await page.goto(`${BASE_URL}/fmea/import?id=TEST_ID&mode=master`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/pfmea\/import\?id=TEST_ID&mode=master/);
});


