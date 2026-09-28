const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const page = fs.readFileSync('src/fluent/generated/other/sys-ui-page/sys_ui_page_widget_editor_code_search.now.ts', 'utf8');
const server = fs.readFileSync('src/fluent/generated/server-development/script-include/sys_script_include_widget_editor_code_search.server.js', 'utf8');
const first = 'a'.repeat(32), preferred = 'b'.repeat(32), adminDefault = 'c'.repeat(32);
const groups = [first, preferred, adminDefault].map(sysId => ({sysId}));
const loadSource = page.slice(page.indexOf('            function _selectGroup('), page.indexOf('            vm.onGroupChange ='));

async function load({saved, configured = adminDefault, shared = null, failPreference = false, available = groups} = {}) {
    const calls = [], errors = [];
    let loads = 0;
    const context = {
        vm: {query: '', loadTables() {loads++;}}, urlGroupId: shared,
        updateUrlParam() {}, notify(message) {errors.push(message);},
        ajax: async (method, params) => {
            calls.push({method, params});
            if (method === 'getGroups') return {groups: available, defaultGroupId: configured};
            if (method === 'getLastSearchGroup') {
                if (failPreference) throw Error('Preference unavailable');
                return {groupId: saved};
            }
            return {success: true};
        },
    };
    vm.createContext(context); vm.runInContext(loadSource, context);
    context.vm.loadGroups();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(errors, []);
    return {selected: context.vm.selectedGroupId, calls, loads};
}

test('Code Search uses the admin default without saving it as a user choice', async () => {
    for (const saved of [undefined, null, '', 'd'.repeat(32)]) {
        const result = await load({saved});
        assert.equal(result.selected, adminDefault);
        assert.equal(result.loads, 1);
        assert.ok(!result.calls.some(call => call.method === 'saveLastSearchGroup'));
    }
    assert.equal((await load({configured: preferred})).selected, preferred, 'users without a preference follow default changes');
});

test('saved groups and shared links retain their priority over the admin default', async () => {
    assert.equal((await load({saved: preferred})).selected, preferred);
    const shared = await load({saved: preferred, shared: first});
    assert.equal(shared.selected, first);
    assert.equal(shared.calls.find(call => call.method === 'saveLastSearchGroup').params.group_id, first);
    assert.ok(!shared.calls.some(call => call.method === 'getLastSearchGroup'));
});

test('missing groups and preference failures have safe selection fallbacks', async () => {
    for (const configured of ['', 'invalid', 'd'.repeat(32)]) {
        assert.equal((await load({configured})).selected, first);
    }
    assert.equal((await load({failPreference: true})).selected, adminDefault);
    const empty = await load({available: []});
    assert.equal(empty.selected, undefined); assert.equal(empty.loads, 0);
});

test('group response exposes only a valid configured sys_id', () => {
    for (const [value, expected] of [[undefined, ''], ['', ''], ['invalid', ''], [' ' + adminDefault + ' ', adminDefault]]) {
        const context = {
            Class: {create: () => function () {}},
            Object: {extendsObject: (_base, methods) => methods}, AbstractAjaxProcessor: function () {},
            gs: {getProperty(name, fallback) {
                assert.equal(name, 'monaco.plus.code_search.default_search_group');
                return value === undefined ? fallback : value;
            }},
            GlideRecord: function () { return {orderBy() {}, query() {}, next: () => false}; },
        };
        vm.createContext(context); vm.runInContext(server, context);
        const api = context.WidgetEditorCodeSearchAjax.prototype;
        api._answer = value => value;
        assert.equal(api.getGroups().defaultGroupId, expected);
    }
});
