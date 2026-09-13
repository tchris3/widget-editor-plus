const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/fluent/generated/other/sys-ui-page/sys_ui_page_widget_editor_code_search.now.ts', 'utf8');

test('Code Search UI template contains Open Code Search Table link and session dot', () => {
    // Should have Open Config link
    assert.ok(source.includes('Open Config'), 'Should include "Open Config" button text');
    assert.ok(source.includes('ctrl.getTableRecordUrl(ctrl.editing)'), 'Should bind to getTableRecordUrl');
    assert.ok(!source.includes('ctrl.saveConfig()'), 'Should not contain old ctrl.saveConfig() call');

    // Should have cs-session-dot indicator
    assert.ok(source.includes('.cs-session-dot'), 'CSS should include .cs-session-dot class');
    assert.ok(source.includes('ctrl.hasCustomSessionConfig(table)'), 'Table item should check hasCustomSessionConfig');
});

test('Session config logic tracks custom session overrides and builds record URLs', () => {
    // Extract helper methods and controller logic from source
    const fnStart = source.indexOf('            vm.resetSessionConfig = function () {');
    const fnEnd = source.indexOf('            vm.onSearchSubmit = function () {');
    assert.ok(fnStart > 0 && fnEnd > fnStart, 'Methods block found in source');

    const fnCode = source.slice(fnStart, fnEnd);

    // Mock vm and notify
    let lastNotification = '';
    const notify = (msg) => { lastNotification = msg; };
    const vm = {};

    eval(fnCode);

    // Test getTableRecordUrl
    assert.equal(vm.getTableRecordUrl(null), '#');
    assert.equal(vm.getTableRecordUrl({}), '#');
    assert.equal(vm.getTableRecordUrl({ sysId: 'table_sys_id_123' }), '/nav_to.do?uri=sn_codesearch_table.do%3Fsys_id%3Dtable_sys_id_123');

    // Test hasCustomSessionConfig
    const table = {
        sysId: 'table_1',
        table: 'sp_widget',
        label: 'Widget',
        originalSearchFields: 'template, css, script',
        originalAdditionalFilter: 'active=true',
        searchFields: 'template, css, script',
        additionalFilter: 'active=true'
    };

    // Exactly matching original
    assert.equal(vm.hasCustomSessionConfig(table), false);

    // Matching original despite reordered whitespace or commas
    table.searchFields = 'script,template,css';
    assert.equal(vm.hasCustomSessionConfig(table), false);

    // Modified search fields
    table.searchFields = 'template, css, script, client_script';
    assert.equal(vm.hasCustomSessionConfig(table), true);
    assert.ok(vm.getSessionConfigTooltip(table).includes('search fields modified'));

    // Reset search fields, modify additional query
    table.searchFields = 'template, css, script';
    table.additionalFilter = 'active=true^roles=admin';
    assert.equal(vm.hasCustomSessionConfig(table), true);
    assert.ok(vm.getSessionConfigTooltip(table).includes('additional query modified'));

    // Both modified
    table.searchFields = 'template';
    table.additionalFilter = '';
    assert.equal(vm.hasCustomSessionConfig(table), true);
    const tip = vm.getSessionConfigTooltip(table);
    assert.ok(tip.includes('search fields modified'));
    assert.ok(tip.includes('additional query modified'));

    // Test resetSessionConfig
    vm.editing = table;
    vm.draft = { searchFields: 'template', additionalFilter: '' };
    vm.resetSessionConfig();

    assert.equal(table.searchFields, 'template, css, script');
    assert.equal(table.additionalFilter, 'active=true');
    assert.equal(vm.draft.searchFields, 'template, css, script');
    assert.equal(vm.draft.additionalFilter, 'active=true');
    assert.equal(vm.hasCustomSessionConfig(table), false);
    assert.equal(lastNotification, 'Reset to Code Search Table configuration');
});
