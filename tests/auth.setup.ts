import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { seedServiceNowTestData } from './fixtures/servicenow-data';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('Authenticate & seed ServiceNow PDI test data', async ({ page, baseURL }) => {
  const username = process.env.SN_USERNAME;
  const password = process.env.SN_PASSWORD;

  if (!username || !password) {
    console.warn('[Auth Setup] SN_USERNAME or SN_PASSWORD environment variables not set. Skipping live authentication.');
    // Ensure directory exists for empty storage state
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  // 1. Seed ServiceNow test records via Table API
  console.log('[Auth Setup] Seeding test records on target instance...');
  await seedServiceNowTestData();

  // 2. Perform UI login to capture cookies/session
  console.log(`[Auth Setup] Logging into ServiceNow PDI: ${baseURL}`);
  await page.goto(`${baseURL}/login.do`);

  // Handle standard ServiceNow login form
  const usernameInput = page.locator('#user_name, input[name="user_name"]');
  const passwordInput = page.locator('#user_password, input[name="user_password"]');
  const loginButton = page.locator('#sysverb_login, button[type="submit"]');

  if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await usernameInput.fill(username);
    await passwordInput.fill(password);
    await loginButton.click();

    // Wait for main page / navigation frame to load
    await page.waitForURL((url) => !url.href.includes('login.do'), { timeout: 15000 }).catch(() => {});
  }

  // Save authenticated state to file
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
  console.log(`[Auth Setup] Successfully saved auth state to ${authFile}`);
});
