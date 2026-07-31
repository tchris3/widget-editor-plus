import { test as teardown } from '@playwright/test';
import { cleanupServiceNowTestData } from './fixtures/servicenow-data';

teardown('Cleanup ServiceNow PDI test data', async () => {
  await cleanupServiceNowTestData();
});
