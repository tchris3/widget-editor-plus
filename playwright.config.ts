import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Read from .env file if available
dotenv.config({ path: path.resolve(__dirname, '.env') });

const instanceUrl = process.env.SN_INSTANCE_URL || 'https://dev00000.service-now.com';
const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './tests',
  timeout: 60000, // 60s per test (allows PDI ServiceNow UI pages and Monaco language services to load fully)
  expect: {
    timeout: 30000, // 30s expect timeout for locators
  },
  fullyParallel: false, // Run tests sequentially to avoid ServiceNow record lock contention
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: instanceUrl,
    actionTimeout: 30000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // 1. Setup project: logs into ServiceNow PDI and seeds test data
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // 2. Teardown project: cleans up test data after tests complete
    {
      name: 'teardown',
      testMatch: /.*teardown\.ts/,
    },
    // 3. Main E2E test project: reuses auth state and triggers teardown on completion
    {
      name: 'e2e',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      teardown: 'teardown',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
    },
  ],
});
