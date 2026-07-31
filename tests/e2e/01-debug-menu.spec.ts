import { test, expect } from '@playwright/test';

test.describe('Widget Editor+ Right-Click Debug Menu', () => {
  const pageId = 'e2e_widget_editor_test';
  const portalSuffix = (process.env.SN_PORTAL_SUFFIX || 'sp').replace(/^\/+|\/+$/g, '');

  test.beforeEach(async ({ page, baseURL }) => {
    // Navigate to the seeded E2E Service Portal page using configured portal URL suffix
    await page.goto(`${baseURL}/${portalSuffix}?id=${pageId}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render expanded test widget on the Service Portal', async ({ page }) => {
    // Assert expanded test widget container and title render on the page
    const widgetHeading = page.locator('.e2e-widget-title, .e2e-test-widget h1, .e2e-test-widget h2').first();
    await expect(widgetHeading).toBeVisible({ timeout: 20000 });
  });

  test('should open debug menu on Ctrl + Right-Click inside test widget', async ({ page }) => {
    const targetContent = page.locator('.e2e-content-area, .e2e-interactive-box, .e2e-test-widget').first();
    await expect(targetContent).toBeVisible({ timeout: 20000 });
    
    // Simulate Ctrl + Right-Click inside the widget
    await targetContent.click({ button: 'right', modifiers: ['Control'] });

    // Assert the popped-up context menu (or injected menu items) is visible on screen
    const contextMenuItem = page.locator('a.sp-context-menu-padding:visible, ul.dropdown-menu:visible, button[data-we-cog]:visible').first();
    await expect(contextMenuItem).toBeVisible({ timeout: 15000 });
  });

  test('should open Preferences modal when preference cog icon is clicked', async ({ page }) => {
    const targetContent = page.locator('.e2e-content-area, .e2e-interactive-box, .e2e-test-widget').first();
    await expect(targetContent).toBeVisible({ timeout: 20000 });
    
    // 1. Trigger Debug Menu on Ctrl + Right-Click
    await targetContent.click({ button: 'right', modifiers: ['Control'] });

    // 2. Locate and click the Preferences Cog Button (button[data-we-cog="1"] or title "Debug menu preferences")
    const cogButton = page.locator('button[data-we-cog="1"]:visible, button[title="Debug menu preferences"]:visible, .icon-cog:visible').first();
    await expect(cogButton).toBeVisible({ timeout: 15000 });
    await cogButton.click();

    // 3. Assert preferences modal dialog opens and is visible on screen
    const dialog = page.locator('dialog.we-prefs-dialog:visible, .we-prefs-modal:visible, .modal-title:has-text("Debug menu preferences"):visible').first();
    await expect(dialog).toBeVisible({ timeout: 15000 });
  });
});
