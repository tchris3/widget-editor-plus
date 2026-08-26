import { test, expect, Page } from '@playwright/test';

const EDITOR_PAGE_SYS_ID = '8b2e70458373fe1070b8b5dfeeaad35e';
const DIFF_PAGE_SYS_ID = '51ec3d258363b61070b8b5dfeeaad36b';

async function getTestWidgetSysId(request: any, baseURL: string): Promise<string> {
  const username = process.env.SN_USERNAME;
  const password = process.env.SN_PASSWORD;
  if (!username || !password) return '';

  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  const res = await request.get(`${baseURL}/api/now/table/sp_widget?sysparm_query=id=e2e_test_widget&sysparm_fields=sys_id`, {
    headers: { Authorization: authHeader }
  });
  const data = await res.json();
  return data.result?.[0]?.sys_id || '';
}

async function getTestWidgetVersionSysId(request: any, baseURL: string, widgetSysId: string): Promise<string> {
  const username = process.env.SN_USERNAME;
  const password = process.env.SN_PASSWORD;
  if (!username || !password || !widgetSysId) return '';

  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  const res = await request.get(`${baseURL}/api/now/table/sys_update_version?sysparm_query=name=sp_widget_${widgetSysId}&sysparm_fields=sys_id&sysparm_limit=1`, {
    headers: { Authorization: authHeader }
  });
  const data = await res.json();
  return data.result?.[0]?.sys_id || '';
}

/**
 * Returns locator targeting elements either directly on page OR inside ServiceNow #gsft_main navigation iframe
 */
function getScopedLocator(page: Page, selector: string) {
  const iframeLocator = page.frameLocator('#gsft_main').locator(selector);
  const topLocator = page.locator(selector);
  return iframeLocator.or(topLocator);
}

/**
 * Specifically targets the Client Controller editor textarea (index 2: HTML=0, CSS=1, Client=2, Server=3)
 */
async function getClientControllerTextArea(page: Page) {
  const paneHeader = getScopedLocator(page, '.we-pane-header, div')
    .filter({ hasText: /Client controller/i })
    .first();

  if (await paneHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
    const parentContainer = paneHeader.locator('xpath=..');
    const textarea = parentContainer.locator('.monaco-editor textarea').first();
    if (await textarea.isVisible().catch(() => false)) {
      return textarea;
    }
  }

  // Index 2 corresponds to Client Controller (HTML = 0, CSS = 1, Client Controller = 2, Server Script = 3)
  return getScopedLocator(page, '.monaco-editor textarea').nth(2);
}

test.describe('Widget Editor+ Monaco Sub-Editors & Capabilities', () => {

  test('should fully load Widget Editor+ page without critical errors', async ({ page, request, baseURL }) => {
    const widgetSysId = await getTestWidgetSysId(request, baseURL || '');
    
    // Navigate to Widget Editor+ UI page for test widget
    await page.goto(`${baseURL}/ui_page.do?sys_id=${EDITOR_PAGE_SYS_ID}&widget_id=${widgetSysId}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for main app shell and Monaco editors to be fully loaded
    const appShell = getScopedLocator(page, '.we-app, #widget-editor-container, .monaco-editor').first();
    await expect(appShell).toBeVisible({ timeout: 30000 });

    // Assert no critical error banner is displayed
    const criticalAlert = getScopedLocator(page, '.we-alert-bar--critical').first();
    await expect(criticalAlert).not.toBeVisible();
  });

  test('should save widget edits cleanly when Save button is clicked', async ({ page, request, baseURL }) => {
    const widgetSysId = await getTestWidgetSysId(request, baseURL || '');
    await page.goto(`${baseURL}/ui_page.do?sys_id=${EDITOR_PAGE_SYS_ID}&widget_id=${widgetSysId}`);
    await page.waitForLoadState('domcontentloaded');

    // Focus Monaco editor and type a test edit
    const monacoInput = getScopedLocator(page, '.monaco-editor textarea').first();
    await expect(monacoInput).toBeVisible({ timeout: 30000 });
    await monacoInput.focus();
    await page.keyboard.type('\n// E2E Test Save Version Check\n');

    // Locate Save button in header
    const saveButton = getScopedLocator(page, 'button').filter({ hasText: /save/i }).first();
    await expect(saveButton).toBeVisible({ timeout: 20000 });

    // Click Save button
    await saveButton.click();

    // Verify no critical alert occurs after saving
    const criticalAlert = getScopedLocator(page, '.we-alert-bar--critical').first();
    await expect(criticalAlert).not.toBeVisible();
  });

  test('should load Diff UI page with correct URL pattern (table, record_id, version_1) and render diff editors', async ({ page, request, baseURL }) => {
    const widgetSysId = await getTestWidgetSysId(request, baseURL || '');
    
    // 1. Load Editor page and make a new code edit
    await page.goto(`${baseURL}/ui_page.do?sys_id=${EDITOR_PAGE_SYS_ID}&widget_id=${widgetSysId}`);
    await page.waitForLoadState('domcontentloaded');

    const monacoInput = getScopedLocator(page, '.monaco-editor textarea').first();
    await expect(monacoInput).toBeVisible({ timeout: 30000 });
    await monacoInput.focus();
    await page.keyboard.type('\n// E2E Diff UI Page Validation Change\n');

    // 2. Save the edit to ensure an update version entry exists
    const saveButton = getScopedLocator(page, 'button').filter({ hasText: /save/i }).first();
    await expect(saveButton).toBeVisible({ timeout: 20000 });
    await saveButton.click();

    // 3. Resolve version_1 sys_id from sys_update_version for sp_widget
    const version1SysId = await getTestWidgetVersionSysId(request, baseURL || '', widgetSysId);

    // 4. Construct URL using exact pattern: ui_page.do?sys_id=51ec3d258363b61070b8b5dfeeaad36b&table=sp_widget&record_id=...&version_1=...
    let diffUrl = `${baseURL}/ui_page.do?sys_id=${DIFF_PAGE_SYS_ID}&table=sp_widget&record_id=${widgetSysId}`;
    if (version1SysId) {
      diffUrl += `&version_1=${version1SysId}`;
    }

    await page.goto(diffUrl);
    await page.waitForLoadState('domcontentloaded');

    // 5. Assert Diff UI page app shell and Monaco diff editor containers render cleanly
    const diffContainer = getScopedLocator(page, '.monaco-diff-editor, .we-app, #widget-editor-container').first();
    await expect(diffContainer).toBeVisible({ timeout: 30000 });

    // Assert no critical error banner is displayed
    const criticalAlert = getScopedLocator(page, '.we-alert-bar--critical').first();
    await expect(criticalAlert).not.toBeVisible();
  });

  test('should trigger autocomplete for g_form inside clientController function and offer addDecoration method suggestion', async ({ page, request, baseURL }) => {
    const widgetSysId = await getTestWidgetSysId(request, baseURL || '');
    await page.goto(`${baseURL}/ui_page.do?sys_id=${EDITOR_PAGE_SYS_ID}&widget_id=${widgetSysId}`);
    await page.waitForLoadState('domcontentloaded');

    // Target the Client Controller editor specifically (index 2: HTML=0, CSS=1, Client=2, Server=3)
    const clientEditorInput = await getClientControllerTextArea(page);

    await expect(clientEditorInput).toBeVisible({ timeout: 30000 });
    await clientEditorInput.focus();

    // Wait for the ambient g_form DTS to actually be loaded and applied to the JS
    // language service, rather than a fixed sleep that races the worker on slow runs.
    await expect(async () => {
      const dtsLoaded = await clientEditorInput.evaluate(
        () => (window as any).MONACO_LANGUAGE_CLIENT_DTS != null
      );
      expect(dtsLoaded).toBe(true);
    }).toPass({ timeout: 30000, intervals: [250, 500, 1000] });

    // Replace editor content with function clientController containing g_form. inside the body
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Control+A');
    await page.keyboard.type(`function clientController($scope, spUtil) {\n  var c = this;\n  g_form.`, { delay: 50 });

    // Also trigger the visual suggest widget, so a human watching a headed/traced run
    // sees the same popup a real user would (not asserted on — see below for why).
    await page.keyboard.press('Control+Space');

    // Query the JS language service directly for completions at the "g_form." position,
    // rather than asserting on the rendered .suggest-widget popup. The popup is a
    // virtualized list (Monaco only renders visible rows into the DOM), and its timing
    // depends on keyboard-event focus/OS quirks — both are unrelated to whether
    // autocomplete itself actually works, and both were sources of flakiness. Reading
    // straight from the language service backing the popup tests the real behavior
    // deterministically, while still exercising the same worker + extra-lib pipeline.
    await expect(async () => {
      const suggestionNames: string[] = await clientEditorInput.evaluate(async () => {
        const w = window as any;
        const model = w.monaco.editor
          .getModels()
          .find((m: any) => m.getLanguageId() === 'javascript' && m.getValue().indexOf('clientController') !== -1);
        if (!model) {
          return [];
        }
        const text = model.getValue();
        const offset = text.indexOf('g_form.') + 'g_form.'.length;
        const worker = await w.monaco.languages.typescript.getJavaScriptWorker();
        const client = await worker(model.uri);
        const info = await client.getCompletionsAtPosition(model.uri.toString(), offset);
        return info && info.entries ? info.entries.map((e: any) => e.name) : [];
      });
      expect(suggestionNames).toContain('addDecoration');
    }).toPass({ timeout: 30000, intervals: [250, 500, 1000] });
  });

});
