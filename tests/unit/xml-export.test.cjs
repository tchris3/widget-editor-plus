const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const root = 'src/fluent/generated/';
const diffPath = root + 'other/sys-ui-page/sys_ui_page_51ec3d258363b61070b8b5dfeeaad36b.now.ts';
function template(path, property) {
    const source = ts.createSourceFile(path, fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    let value;
    function visit(node) {
        if (ts.isPropertyAssignment(node) && node.name.getText(source) === property) value = node.initializer.text;
        ts.forEachChild(node, visit);
    }
    visit(source);
    return value;
}
function resolver({ exists = true, deleted = false, deletionId = '', es12Value = null } = {}) {
    const id = 'a'.repeat(32);
    const queries = [];
    const context = {
        Class: { create: () => function () {} }, AbstractAjaxProcessor: {},
        Object: { extendsObject: (_, methods) => methods },
        gs: { getProperty: () => 'https://example.service-now.com/' },
        GlideRecordSecure: function (table) {
            this.isValid = () => true;
            this.get = () => exists;
            this.addQuery = (...args) => queries.push([table, ...args]);
            this.orderByDesc = this.setLimit = this.query = () => {};
            this.next = () => table === 'sys_es_latest_script' ? es12Value !== null : !!deletionId;
            this.getValue = () => es12Value;
            this.getUniqueValue = () => deletionId;
        }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(root + 'server-development/script-include/sys_script_include_widget_editor_assistant.server.js', 'utf8'), context);
    const instance = context.WidgetEditorAssistantAjax.prototype;
    instance.getParameter = key => ({ table: 'sp_widget', sys_id: id, deleted: String(deleted) })[key];
    instance._answer = result => result;
    return { result: instance.getExportRecordUrl(), queries, id };
}
test('absolute live URL uses the requested navigation encoding', () => {
    const { result, id } = resolver();
    assert.equal(result.url, 'https://example.service-now.com/nav_to.do?uri=sp_widget.do%3Fsys_id%3D' + id);
});
test('deleted records use the deletion row ID, including records deleted after selection', () => {
    for (const deleted of [true, false]) {
        const { result, queries, id } = resolver({ exists: false, deleted, deletionId: 'b'.repeat(32) });
        assert.equal(result.url, 'https://example.service-now.com/nav_to.do?uri=sys_metadata_delete.do%3Fsys_id%3D' + 'b'.repeat(32));
        assert.deepEqual(queries, [['sys_metadata_delete', 'sys_metadata', id]]);
    }
});
test('unavailable deletion rows never produce a guessed URL', () => {
    assert.equal(resolver({ exists: false, deleted: true }).result.url, '');
});
test('Diff export preserves both selected versions and XML-sensitive field content', async () => {
    // A minimal DOM verifies values are assigned as text, independently of a live instance.
    class Element {
        constructor(tag) { this.tagName = tag; this.tag = tag; this.attrs = {}; this.children = []; this.textContent = ''; }
        setAttribute(key, value) { this.attrs[key] = String(value); }
        getAttribute(key) { return this.attrs[key] || null; }
        appendChild(child) { this.children.push(child); }
    }
    let exported;
    const document = {
        implementation: { createDocument: (_, tag) => {
            exported = { documentElement: new Element(tag), createElement: tag => new Element(tag) };
            return exported;
        } },
        createElement: () => ({ click() {} }), body: { appendChild() {}, removeChild() {} }
    };
    const ctrl = { canExportXml: () => true, isSameVersionSelected: () => false, leftVersionId: 'old', rightVersionId: 'current',
        leftLabel: () => 'Previous', rightLabel: () => 'Unsaved', currentIsUnsaved: true };
    const context = { ctrl, document, window: { location: { origin: 'https://example.service-now.com' } },
        tableParam: 'sp_widget', recordId: 'a'.repeat(32),
        _exportLeftValues: { script: '<old>&', empty: '', missing: null, sys_mod_count: '0' },
        _exportRightValues: { script: '<new>&', extra_field: 'included', sys_mod_count: '7' },
        _savedRecordData: null, _recordData: { es12_override: 'enabled' },
        _leftVersionData: { sys_created_on: '2026-01-01' }, _rightVersionData: null,
        Blob: class {}, XMLSerializer: class { serializeToString() { return ''; } },
        URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} } };
    const script = template(diffPath, 'clientScript');
    assert.ok(script, 'client script found');
    const start = script.indexOf('ctrl.exportXml = function');
    const end = script.indexOf('ctrl.revertToLeft = function', start);
    vm.runInNewContext(script.slice(script.indexOf('function annotateFieldChanges'), script.indexOf('// End field comparison helper.')) + script.slice(start, end), context);
    ctrl.exportXml();
    assert.equal(exported.documentElement.tag, 'context_bundle');
    assert.equal(exported.documentElement.attrs.format_version, '2');
    assert.equal(exported.documentElement.attrs.unload, undefined);
    assert.match(exported.documentElement.attrs.generated_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    const notes = exported.documentElement.children.filter(el => el.tag === 'format_notes');
    assert.equal(notes.length, 1);
    assert.ok(notes[0].textContent.includes('ES12'));
    const record = exported.documentElement.children.find(el => el.tag === 'primary_record').children[0];
    assert.equal(record.attrs.es12_override_at_load, 'enabled');
    const [left, right] = record.children;
    assert.equal(left.tag, 'previous_version');
    assert.equal(right.tag, 'current_version');
    assert.equal(right.attrs.unsaved, 'true');
    assert.equal(left.children[0].attrs.record_url, undefined);
    assert.equal(right.children[0].attrs.record_url, undefined);
    assert.ok(record.attrs.record_url);
    assert.equal(record.attrs.es12_description, undefined);
    assert.equal(left.children[0].attrs.sys_mod_count, '0');
    assert.equal(right.children[0].attrs.sys_mod_count, '7');
    assert.equal(left.children[0].children[0].textContent, '<old>&');
    assert.equal(right.children[0].children[0].textContent, '<new>&');
    assert.equal(left.children[0].children[2].attrs.nil, 'true');
    assert.equal(right.children[0].children[1].textContent, 'included');
    assert.equal(left.children[0].children[0].attrs.change, 'modified');
    assert.equal(right.children[0].children[1].attrs.change, 'added');
    assert.equal(left.children[0].children[1].attrs.change, 'removed');
});
test('Diff export is disabled while loading or when a version selection failed', () => {
    const script = template(diffPath, 'clientScript');
    const start = script.indexOf('ctrl.canExportXml = function');
    const end = script.indexOf('ctrl.exportXml = function', start);
    const previous = { fields: {} };
    const ctrl = { leftVersionId: 'old', rightVersionId: 'current', isSameVersionSelected: () => false };
    vm.runInNewContext(script.slice(start, end), {
        ctrl, _leftIsCurrentSaved: false, _leftVersionData: previous,
        _rightVersionData: null, _versionCache: { old: previous }
    });
    assert.equal(ctrl.canExportXml(), true);
    ctrl.loadingLeft = true;
    assert.equal(ctrl.canExportXml(), false);
    ctrl.loadingLeft = false;
    ctrl.leftVersionId = 'failed-selection';
    assert.equal(ctrl.canExportXml(), false);
});

test('Assistant exposes source counters, preserves zero, and marks absent counts unavailable', () => {
    const script = template(root + 'other/sys-ui-page/sys_ui_page_widget_editor_assistant.now.ts', 'clientScript');
    const start = script.indexOf('function addExportModCount');
    const end = script.indexOf('function redactRecordElement', start);
    const context = {};
    vm.runInNewContext(script.slice(start, end), context);
    for (const count of ['0', '42', null, '']) {
        const el = { attrs: {}, children: count === null ? [] : [{ tagName: 'sys_mod_count', textContent: count }],
            setAttribute(key, value) { this.attrs[key] = value; } };
        context.addExportModCount(el);
        if (count === '0' || count === '42') assert.equal(el.attrs.sys_mod_count, count);
        else assert.equal(el.attrs.sys_mod_count_status, 'unavailable');
    }
    const schema = { attrs: {}, children: [], setAttribute(key, value) { this.attrs[key] = value; } };
    context.addExportModCount(schema, { children: [{ tagName: 'sys_mod_count', textContent: '3' }] });
    assert.equal(schema.attrs.sys_mod_count, '3');
});

test('ES12 overrides distinguish enabled, disabled, missing and unreadable values', () => {
    for (const [es12Value, expected] of [['1', 'enabled'], ['true', 'enabled'], ['0', 'disabled'], ['false', 'disabled'], [null, 'not_found'], ['', 'unavailable']]) {
        assert.equal(resolver({ es12Value }).result.es12Override, expected);
    }
    assert.equal(resolver({ exists: false, deleted: true, deletionId: 'b'.repeat(32), es12Value: '1' }).result.es12Override, 'unavailable');
});
for (const path of [diffPath, root + 'other/sys-ui-page/sys_ui_page_widget_editor_assistant.now.ts']) {
    test('field comparison handles unchanged, null, redacted, missing and deleted data: ' + path, () => {
        const script = template(path, 'clientScript');
        const context = {};
        vm.runInNewContext(script.slice(script.indexOf('function annotateFieldChanges'), script.indexOf('// End field comparison helper.')), context);
        function field(name, text, attrs = {}) {
            return { tagName: name, textContent: text, attrs, children: [],
                getAttribute(key) { return this.attrs[key] || null; },
                setAttribute(key, value) { this.attrs[key] = value; } };
        }
        const left = { children: [field('script', 'same\n'), field('empty', ''), field('nullable', '', { nil: 'true' }), field('hidden', '', { redacted: 'true' }), field('removed', 'old'), field('whitespace', ' x ')] };
        const right = { children: [field('script', 'same\n'), field('empty', ''), field('nullable', ''), field('hidden', ''), field('added', 'new'), field('whitespace', 'x')] };
        context.annotateFieldChanges(left, right, false);
        // A redacted field can't be compared — left unset rather than change="unknown",
        // since redacted="true" on the field already conveys that.
        assert.deepEqual(left.children.map(f => f.attrs.change), ['unchanged', 'unchanged', 'modified', undefined, 'removed', 'modified']);
        assert.equal(right.children[4].attrs.change, 'added');
        // Whole record missing on one side — no per-field change attribute; the enclosing
        // previous_version's status="new" (or the deleted_record fallback) already says why.
        // Fresh fields here since a field already carrying a change attribute from a prior
        // comparison is left untouched, not cleared, when this pass has nothing to say.
        const rightAlone = { children: [field('a', 'x'), field('b', 'y')] };
        context.annotateFieldChanges(null, rightAlone, false);
        assert.ok(rightAlone.children.every(f => f.attrs.change === undefined));
        const leftDeleted = { children: [field('script', 'old'), field('hidden', '', { redacted: 'true' })] };
        context.annotateFieldChanges(leftDeleted, null, true);
        assert.equal(leftDeleted.children[0].attrs.change, 'removed');
        assert.equal(leftDeleted.children[1].attrs.change, undefined);
    });
}
test('Assistant keeps shared metadata once while retaining payload counters', () => {
    const script = template(root + 'other/sys-ui-page/sys_ui_page_widget_editor_assistant.now.ts', 'clientScript');
    const start = script.indexOf('function addRecordUrl');
    const end = script.indexOf('var combinedDoc', start);
    const row = { table: 'sp_widget', sys_id: 'a', updateSetSysId: 'set' };
    const context = { ctrl: { includePreviousUpdates: true }, exportUrls: { 'sp_widget:a': 'https://example/record' },
        exportEs12: { 'sp_widget:a': 'enabled' }, addExportModCount(el) { el.attrs.sys_mod_count = '4'; } };
    vm.runInNewContext(script.slice(start, end), context);
    function el(tagName) { return { tagName, attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } }; }
    const manifest = el('record'), wrapper = el('versioned_record'), payload = el('sp_widget');
    context.addRecordUrl(manifest, row);
    context.addRecordUrl(wrapper, row);
    context.addRecordUrl(payload, row, true);
    assert.equal(manifest.attrs.record_url, undefined);
    assert.equal(wrapper.attrs.record_url, 'https://example/record');
    assert.equal(wrapper.attrs.es12_override_at_export, 'enabled');
    assert.equal(payload.attrs.record_url, undefined);
    assert.equal(payload.attrs.es12_override_at_export, undefined);
    assert.equal(payload.attrs.sys_mod_count, '4');
    context.ctrl.includePreviousUpdates = false;
    context.addRecordUrl(manifest, row);
    assert.equal(manifest.attrs.record_url, 'https://example/record');
});
