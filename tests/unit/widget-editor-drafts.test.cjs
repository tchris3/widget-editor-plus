const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/fluent/generated/other/sys-ui-page/widget_editor_plus.client.js', 'utf8');
const draftCode = source.slice(source.indexOf('                // Local drafts are recovery copies;'), source.indexOf('                // Unsaved changes guard'));
const widgetId = 'a'.repeat(32);
const userId = 'b'.repeat(32);

function storage() {
    const data = new Map();
    return {
        writes: 0,
        get length() { return data.size; },
        key: i => Array.from(data.keys())[i],
        getItem: key => data.get(key) ?? null,
        setItem(key, value) { this.writes++; data.set(key, value); },
        removeItem: key => data.delete(key),
    };
}

function harness(localStorage = storage()) {
    let now = 100000;
    const timers = [];
    const watchers = {};
    const listeners = {};
    const destroyed = {};
    const $timeout = (fn, delay = 0) => { const timer = { fn, delay }; timers.push(timer); return timer; };
    $timeout.cancel = timer => { timer.cancelled = true; };
    const $scope = {
        currentUserId: userId, loading: false, canWriteWidget: true,
        versionDiffModal: { open: false },
        userPrefs: { autosaveInterval: 30, draftRetentionDays: 7 }, userPrefsEdit: {}, rolesList: [], additionalWidgetFields: [],
        widget: { name: 'Widget', id: 'widget', template: 'saved', css: '', description: '', controller_as: 'c', is_public: false, static: false },
        coreEditorDefs: [{ key: 'html', field: 'template', label: 'HTML', language: 'html' }, { key: 'css', field: 'css', label: 'CSS', language: 'scss' }],
        $watch: (key, fn) => { watchers[key] = fn; },
        $on: (key, fn) => { destroyed[key] = fn; },
        $applyAsync() {},
    };
    const context = vm.createContext({
        $scope, $timeout, localStorage, SYS_ID: widgetId,
        DIFF_PAGE_SYS_ID: '51ec3d258363b61070b8b5dfeeaad36b', WE_UI_SCRIPTS: {},
        $injector: { get: () => ({ trustAsResourceUrl: value => value }) },
        angular: { extend: Object.assign },
        Date: class extends Date { static now() { return now; } },
        originalHeader: { name: 'Widget', id: 'widget', description: '', controller_as: 'c', is_public: false, roles: '', static: false },
        originalValues: { template: 'saved', css: '' }, lastServerValues: {}, extraPanes: [], monacoEditors: {},
        _normaliseExtraWidgetFieldValue: (def, value) => def.type === 'boolean' ? !!value : value || '',
        parseRoles: value => (value || '').split(',').map(r => r.trim()).filter(Boolean),
        hasUnsavedChanges: () => false,
        $q: { all: promises => Promise.all(promises), resolve: Promise.resolve.bind(Promise), reject: Promise.reject.bind(Promise) },
        ajax: async () => ({ success: true, widget: { ...$scope.widget, template: 'saved', css: '' } }),
        document: { visibilityState: 'visible', addEventListener: (event, fn) => { listeners[event] = fn; }, removeEventListener: event => { delete listeners[event]; } },
        window: { addEventListener: (event, fn) => { listeners[event] = fn; }, removeEventListener: event => { delete listeners[event]; } },
        _closeModal: fn => fn(),
    });
    const urlsStart = source.indexOf('    function _diffNavUrl(');
    vm.runInContext(source.slice(urlsStart, source.indexOf('    angular\n', urlsStart)), context);
    const snapshotStart = source.indexOf('                function _openUnsavedSnapshotDiff(');
    vm.runInContext(source.slice(snapshotStart, source.indexOf('                // Opens the diff page for an external-change alert', snapshotStart)), context);
    const closeStart = source.indexOf('                $scope.closeVersionDiffModal =');
    vm.runInContext(source.slice(closeStart, source.indexOf('                $scope.openVersionDiffInNewTab', closeStart)), context);
    vm.runInContext(draftCode, context);
    vm.runInContext('_draftRetentionLoaded = true', context);
    return { context, $scope, watchers, listeners, timers, destroyed, localStorage,
        advance: ms => { now += ms; },
        run: code => vm.runInContext(code, context),
        flush: () => { for (const timer of timers.splice(0)) { if (!timer.cancelled && !timer.delay) timer.fn(); } },
        ownKey: () => vm.runInContext('_draftPrefix() + _draftPageId', context),
        draft: () => JSON.parse(localStorage.getItem(vm.runInContext('_draftPrefix() + _draftPageId', context))),
    };
}

function recovered(h, entries = [{ type: 'widget', id: widgetId, key: 'html', field: 'template', label: 'HTML', language: 'html', base: 'saved', value: 'draft' }]) {
    const key = `we_local_draft:v1:${userId}:${widgetId}:previous-page`;
    const raw = JSON.stringify({ version: 1, updatedAt: 1000, entries });
    h.localStorage.setItem(key, raw);
    h.run('_findLocalDrafts()');
    return h.$scope.localDrafts[0];
}

test('interval schedules capture, reschedules on change, and zero cancels it', () => {
    const h = harness();
    h.watchers['userPrefs.autosaveInterval'](30);
    assert.equal(h.timers[0].delay, 30000);
    h.$scope.widget.template = 'draft';
    h.advance(30000);
    h.timers.shift().fn();
    assert.equal(h.draft().entries[0].value, 'draft');
    const scheduled = h.timers[0];
    h.watchers['userPrefs.autosaveInterval'](120);
    assert.equal(scheduled.cancelled, true);
    assert.equal(h.timers.at(-1).delay, 120000);
    h.$scope.userPrefs.autosaveInterval = 0;
    h.watchers['userPrefs.autosaveInterval'](0);
    h.listeners.pagehide();
    assert.equal(h.draft().entries[0].value, 'draft');
    h.$scope.widget.template = 'newer';
    h.listeners.pagehide();
    assert.equal(h.draft().entries[0].value, 'draft');
    for (const value of [-1, 1.5, NaN, Infinity, '30', null, undefined]) {
        assert.equal(h.run(`_validAutosaveInterval(${JSON.stringify(value) ?? 'undefined'})`), false);
    }
    h.destroyed.$destroy();
    assert.equal(Object.keys(h.listeners).length, 0);
});

test('capture skips new widgets, historical versions, inaccessible records and unidentified users', () => {
    for (const overrides of [{ isNewWidget: true }, { isVersionView: true }, { canWriteWidget: false }, { loading: true }, { currentUserId: null }]) {
        const h = harness();
        Object.assign(h.$scope, overrides);
        h.$scope.widget.template = 'draft';
        h.run('_writeLocalDraft()');
        assert.equal(h.localStorage.length, 0);
    }
});

test('hidden tabs flush, unchanged drafts do not write, and undo clears the copy', () => {
    const h = harness();
    h.$scope.widget.template = 'draft';
    h.context.document.visibilityState = 'hidden';
    h.listeners.visibilitychange();
    assert.equal(h.localStorage.writes, 1);
    h.run('_writeLocalDraft()');
    assert.equal(h.localStorage.writes, 1);
    h.$scope.widget.template = 'saved';
    h.run('_writeLocalDraft()');
    assert.equal(h.localStorage.length, 0);
});

test('capture includes hidden core fields, additional fields, related panes and invalid JSON', () => {
    const h = harness();
    h.$scope.widget.css = 'body {}';
    h.$scope.additionalWidgetFields.push({ name: 'custom', type: 'boolean', label: 'Custom' });
    h.$scope.widget.custom = true;
    h.context.originalHeader.custom = false;
    h.context.extraPanes.push({ key: 'tpl-new-1', recordType: 'template', recordId: 'test', label: 'Template', language: 'html', content: '<div>', lastServerContent: '', hasIdInput: true, _draftOriginalId: '' });
    h.run("_draftJson.option_schema = { base: '{}', value: '{invalid' }; _writeLocalDraft()");
    assert.deepEqual(h.draft().entries.map(e => e.field), ['css', 'custom', 'content', 'recordId', 'option_schema']);
});

test('refresh discovers drafts and isolates users, widgets and editing pages', () => {
    const a = harness();
    a.$scope.widget.template = 'first page';
    a.run('_writeLocalDraft()');
    const b = harness(a.localStorage);
    b.run('_findLocalDrafts()');
    assert.equal(b.$scope.localDrafts.length, 1);
    b.$scope.widget.template = 'second page';
    b.run('_writeLocalDraft()');
    assert.equal(b.localStorage.length, 2);
    assert.equal(a.draft().entries[0].value, 'first page');
    b.$scope.currentUserId = 'c'.repeat(32);
    b.run('_findLocalDrafts()');
    assert.equal(b.$scope.localDrafts.length, 0);
    b.$scope.currentUserId = userId;
    b.run("SYS_ID = 'd'.repeat(32); _findLocalDrafts()");
    assert.equal(b.$scope.localDrafts.length, 0);
});

test('malformed and unsupported drafts are retained without being restored', () => {
    const h = harness();
    recovered(h, [{ type: 'widget', id: widgetId, key: '', field: '__proto__', label: 'Bad', language: 'html', value: 'bad', base: '' }]);
    assert.equal(h.$scope.localDrafts.length, 0);
    assert.equal(h.localStorage.length, 1);
    h.localStorage.setItem(`we_local_draft:v1:${userId}:${widgetId}:bad-json`, '{');
    h.run('_findLocalDrafts()');
    assert.equal(h.$scope.localDrafts.length, 0);
    assert.equal(h.localStorage.length, 2);
});

test('retention expires drafts at the boundary across widgets, preserving current work and other storage', () => {
    const h = harness();
    const draft = recovered(h);
    const otherWidget = `we_local_draft:v1:${userId}:${'c'.repeat(32)}:old-page`;
    const otherUser = `we_local_draft:v1:${'d'.repeat(32)}:${widgetId}:old-page`;
    const unsupported = `we_local_draft:v1:${userId}:${widgetId}:unsupported`;
    h.localStorage.setItem(otherWidget, draft.raw);
    h.localStorage.setItem(otherUser, draft.raw);
    h.localStorage.setItem('unrelated', draft.raw);
    h.localStorage.setItem(unsupported, JSON.stringify({ version: 2, updatedAt: 1000, entries: [] }));
    h.$scope.widget.template = 'current work';
    h.run('_writeLocalDraft()');
    h.advance(7 * 86400000 - 99001);
    h.run('_findLocalDrafts()');
    assert.equal(h.$scope.localDrafts.length, 1);
    h.advance(1);
    h.run('_findLocalDrafts()');
    assert.equal(h.localStorage.getItem(draft.key), null);
    assert.equal(h.localStorage.getItem(otherWidget), null);
    assert.equal(h.$scope.localDrafts.length, 0);
    for (const key of [otherUser, 'unrelated', unsupported]) assert.ok(h.localStorage.getItem(key));
    h.advance(86400000);
    h.run('_findLocalDrafts()');
    assert.equal(h.draft().entries[0].value, 'current work');
});

test('retention cleanup runs with autosave off and on the new-widget page', () => {
    const h = harness();
    const draft = recovered(h);
    h.$scope.userPrefs.autosaveInterval = 0;
    h.$scope.isNewWidget = true;
    h.advance(7 * 86400000);
    h.run('_findLocalDrafts()');
    assert.equal(h.localStorage.getItem(draft.key), null);
    assert.equal(h.localStorage.length, 0);
});

test('writes prune expired drafts and only content changes reset the retention timestamp', () => {
    const h = harness();
    const draft = recovered(h);
    h.$scope.userPrefs.draftRetentionDays = 10;
    h.$scope.widget.template = 'draft';
    h.run('_writeLocalDraft()');
    const updatedAt = h.draft().updatedAt;
    h.advance(7 * 86400000);
    h.run('_writeLocalDraft()');
    assert.ok(h.localStorage.getItem(draft.key));
    assert.equal(h.draft().updatedAt, updatedAt);
    h.advance(3 * 86400000);
    h.$scope.widget.template = 'new content';
    h.run('_writeLocalDraft()');
    assert.equal(h.localStorage.getItem(draft.key), null);
    assert.equal(h.$scope.localDrafts.length, 0);
    assert.equal(h.draft().updatedAt, updatedAt + 10 * 86400000);
});

test('cleanup waits for loaded preferences and preserves drafts on a storage error', () => {
    const h = harness();
    const draft = recovered(h);
    h.advance(8 * 86400000);
    h.run('_draftRetentionLoaded = false; _findLocalDrafts()');
    assert.ok(h.localStorage.getItem(draft.key));
    h.localStorage.removeItem = () => { throw new Error('Storage unavailable'); };
    h.run('_draftRetentionLoaded = true; _findLocalDrafts()');
    assert.ok(h.localStorage.getItem(draft.key));
    assert.match(h.$scope.localDraftError, /unavailable/);
});

test('restore changes only draft fields, remains unsaved and transfers the recovery copy', async () => {
    const h = harness();
    const draft = recovered(h);
    h.$scope.widget.css = 'keep current CSS';
    await h.$scope.restoreLocalDraft(draft);
    h.flush();
    assert.equal(h.$scope.widget.template, 'draft');
    assert.equal(h.$scope.widget.css, 'keep current CSS');
    assert.equal(h.context.originalValues.template, 'saved');
    assert.equal(h.localStorage.getItem(draft.key), null);
    assert.equal(h.draft().entries.length, 2);
});

test('server conflicts and existing local edits require comparison before restore', async () => {
    const h = harness();
    const draft = recovered(h);
    h.context.ajax = async () => ({ success: true, widget: { ...h.$scope.widget, template: 'changed on server' } });
    await h.$scope.restoreLocalDraft(draft);
    assert.equal(h.$scope.versionDiffModal.open, true);
    assert.equal(h.$scope.draftRecovery.conflict, true);
    assert.equal(h.$scope.widget.template, 'saved');
    await h.$scope.restoreLocalDraft(draft, true);
    h.flush();
    assert.equal(h.$scope.widget.template, 'draft');
    assert.equal(h.context.originalValues.template, 'changed on server');
    const local = harness();
    local.context.hasUnsavedChanges = () => true;
    await local.$scope.restoreLocalDraft(recovered(local));
    assert.equal(local.$scope.versionDiffModal.open, true);
    assert.equal(local.$scope.widget.template, 'saved');
});

test('fresh permission checks prevent restoring widget and JSON drafts after access changes', async () => {
    for (const field of ['template', 'option_schema']) {
        const h = harness();
        const draft = recovered(h, [{ type: 'widget', id: widgetId, key: '', field, label: field, language: 'json', base: '', value: 'draft' }]);
        h.context.ajax = async () => ({ success: true, widget: { canWrite: false } });
        await h.$scope.restoreLocalDraft(draft, true);
        assert.match(h.$scope.localDraftError, /no longer editable/);
        assert.equal(h.$scope.widget.template, 'saved');
        assert.ok(h.localStorage.getItem(draft.key));
    }
});

test('per-field cleanup removes only saved content, including when capture is off', () => {
    const h = harness();
    h.$scope.widget.template = 'draft';
    h.$scope.widget.css = 'draft CSS';
    h.run('_writeLocalDraft()');
    h.context.originalValues.template = 'draft';
    h.run('_writeLocalDraft(true)');
    assert.deepEqual(h.draft().entries.map(e => e.field), ['css']);
    h.$scope.userPrefs.autosaveInterval = 0;
    h.context.originalValues.css = 'draft CSS';
    h.run('_writeLocalDraft(true)');
    assert.equal(h.localStorage.length, 0);
    h.$scope.widget.template = 'new edit';
    h.run('_writeLocalDraft(true)');
    assert.equal(h.localStorage.length, 0);
});

test('storage failures preserve the previous copy and report an error', () => {
    const h = harness();
    h.$scope.widget.template = 'draft';
    h.run('_writeLocalDraft()');
    h.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    h.$scope.widget.template = 'newer';
    h.run('_writeLocalDraft()');
    assert.match(h.$scope.localDraftError, /could not be saved/);
    assert.equal(h.draft().entries[0].value, 'draft');
});

test('discard does not delete a draft changed by another tab', () => {
    const h = harness();
    const draft = recovered(h);
    h.localStorage.setItem(draft.key, 'newer contents');
    h.$scope.discardLocalDraft(draft);
    assert.equal(h.localStorage.getItem(draft.key), 'newer contents');
});

test('per-field save preserves newer typing and failed saves retain the entire copy', async () => {
    for (const success of [true, false]) {
        const h = harness();
        let content = 'submitted';
        h.context.monacoEditors.html = { getValue: () => content };
        h.run('_writeLocalDraft()');
        h.context._selfSavingFields = {};
        h.context.hasUnsavedChanges = () => true;
        h.context.pane = { key: 'html', field: 'template', dirty: true };
        const start = source.indexOf('                $scope.savePaneField =');
        vm.runInContext(source.slice(start, source.indexOf('                // Save: all', start)), h.context);
        let finish;
        h.context.ajax = () => new Promise(resolve => { finish = resolve; });
        h.$scope.savePaneField(h.context.pane);
        content = 'typed during request';
        finish({ success, error: 'Save failed' });
        await Promise.resolve();
        assert.equal(h.context.pane.dirty, true);
        assert.equal(h.context.originalValues.template, success ? 'submitted' : 'saved');
        assert.equal(h.draft().entries[0].value, success ? 'typed during request' : 'submitted');
    }
});

test('whole-widget save clears drafts while keeping newer and related edits dirty', () => {
    const h = harness();
    h.$scope.widget.template = 'submitted';
    h.$scope.widget.name = 'submitted name';
    h.run('_writeLocalDraft()');
    h.$scope.visibleItems = [{ type: 'pane', field: 'template', key: 'html' }, { type: 'pane', recordType: 'script_include', key: 'si-record', dirty: true, externalChange: { user: 'someone' } }];
    h.$scope.headerDirty = {};
    h.context._captureAdditionalHeaderValues = () => {};
    const start = source.indexOf('                function _acceptWidgetSave(');
    vm.runInContext(source.slice(start, source.indexOf('                $scope.saveAll =', start)), h.context);
    h.$scope.widget.template = 'typed during request';
    h.$scope.widget.name = 'newer name';
    h.run("_acceptWidgetSave({ template: 'submitted', css: '', name: 'submitted name', id: 'widget', controller_as: 'c', public: false, static: false, roles: '' })");
    assert.equal(h.$scope.visibleItems[0].dirty, true);
    assert.equal(h.$scope.visibleItems[1].dirty, true);
    assert.equal(h.$scope.visibleItems[1].externalChange.user, 'someone');
    assert.equal(h.$scope.headerDirty.name, true);
    assert.equal(h.draft(), null);
    h.run('_writeLocalDraft()');
    assert.equal(h.draft().entries.find(e => e.field === 'template').base, 'submitted');
});

test('widget Save removes every draft for this widget and user, even with autosave off', () => {
    const h = harness();
    const draft = recovered(h);
    h.$scope.widget.template = 'draft';
    h.run('_writeLocalDraft()');
    const otherPage = `we_local_draft:v1:${userId}:${widgetId}:another-page`;
    const otherWidget = `we_local_draft:v1:${userId}:${'c'.repeat(32)}:another-widget`;
    const otherUser = `we_local_draft:v1:${'d'.repeat(32)}:${widgetId}:another-user`;
    for (const key of [otherPage, otherWidget, otherUser, 'unrelated']) h.localStorage.setItem(key, draft.raw);
    h.$scope.userPrefs.autosaveInterval = 0;
    h.$scope.visibleItems = [];
    h.$scope.headerDirty = {};
    h.context._captureAdditionalHeaderValues = () => {};
    const start = source.indexOf('                function _acceptWidgetSave(');
    vm.runInContext(source.slice(start, source.indexOf('                $scope.saveAll =', start)), h.context);
    h.$scope.versionDiffModal = { open: true, localDraft: draft };
    h.run('_acceptWidgetSave({ ...$scope.widget, public: false })');
    for (const key of [draft.key, otherPage, h.ownKey()]) assert.equal(h.localStorage.getItem(key), null);
    for (const key of [otherWidget, otherUser, 'unrelated']) assert.ok(h.localStorage.getItem(key));
    assert.equal(h.$scope.localDrafts.length, 0);
    assert.equal(h.$scope.versionDiffModal.open, false);
});

test('widget Save reports a storage cleanup failure without discarding the remaining copy', () => {
    const h = harness();
    const draft = recovered(h);
    h.localStorage.removeItem = () => { throw new Error('Storage unavailable'); };
    h.run('_clearWidgetDrafts()');
    assert.ok(h.localStorage.getItem(draft.key));
    assert.match(h.$scope.localDraftError, /widget was saved.*could not be removed/);
});

test('explicit discard is not recreated when navigating away', () => {
    const h = harness();
    h.$scope.widget.template = 'draft';
    h.run('_writeLocalDraft(); _discardPageDraft()');
    h.listeners.pagehide();
    assert.equal(h.localStorage.length, 0);
});

test('preference import accepts zero and custom intervals without disturbing other preferences', () => {
    const h = harness();
    h.context.window.SNMonacoPlus = null;
    h.context.loadHtmlMonarchDts = () => {};
    h.context._snapshotEditorPrefs = () => {};
    const start = source.indexOf('                function _applyUserPrefsData(');
    vm.runInContext(source.slice(start, source.indexOf('                function init()', start)), h.context);
    const importStart = source.indexOf('                function _applyPrefsBlobToEdit(');
    vm.runInContext(source.slice(importStart, source.indexOf('                $scope.importUserPrefsFile =', importStart)), h.context);
    h.$scope.userPrefsEdit.editors = [];
    for (const interval of [0, 90]) {
        h.run(`_applyUserPrefsData({ autosaveInterval: ${interval} }); _applyPrefsBlobToEdit({ autosaveInterval: ${interval} })`);
        assert.equal(h.$scope.userPrefs.autosaveInterval, interval);
        assert.equal(h.$scope.userPrefsEdit.autosaveInterval, interval);
        assert.equal(h.$scope.userPrefs.wordWrap, undefined);
    }
    h.run('_applyUserPrefsData({ autosaveInterval: -1 }); _applyPrefsBlobToEdit({ autosaveInterval: 1.5 })');
    assert.equal(h.$scope.userPrefs.autosaveInterval, 90);
    assert.equal(h.$scope.userPrefsEdit.autosaveInterval, 90);
    for (const days of [1, 14]) {
        h.run(`_applyUserPrefsData({ draftRetentionDays: ${days} }); _applyPrefsBlobToEdit({ draftRetentionDays: ${days} })`);
        assert.equal(h.$scope.userPrefs.draftRetentionDays, days);
        assert.equal(h.$scope.userPrefsEdit.draftRetentionDays, days);
    }
    for (const days of [0, -1, 1.5, '7', null, undefined, NaN, Infinity]) {
        h.context.days = days;
        assert.equal(h.run('_validDraftRetentionDays(days)'), false);
        h.run('_applyUserPrefsData({ draftRetentionDays: days }); _applyPrefsBlobToEdit({ draftRetentionDays: days })');
        assert.equal(h.$scope.userPrefs.draftRetentionDays, 14);
        assert.equal(h.$scope.userPrefsEdit.draftRetentionDays, 14);
    }
});

test('retention exports with shared preferences and Reset restores seven days', () => {
    const h = harness();
    const blobStart = source.indexOf('                function _buildUserPrefsBlob(');
    vm.runInContext(source.slice(blobStart, source.indexOf('                function saveUserPrefs(', blobStart)), h.context);
    h.$scope.userPrefs.draftRetentionDays = 14;
    assert.equal(h.run('_buildUserPrefsBlob().draftRetentionDays'), 14);
    const resetStart = source.indexOf('                $scope.resetUserPrefsModal =');
    vm.runInContext(source.slice(resetStart, source.indexOf('                $scope.importPrefsStatus =', resetStart)), h.context);
    h.$scope.userPrefsEdit = { editors: [], draftRetentionDays: 14, autosaveInterval: 60 };
    h.context.window.matchMedia = () => ({ matches: false });
    h.$scope.resetUserPrefsModal();
    assert.equal(h.$scope.userPrefsEdit.draftRetentionDays, 7);
    assert.equal(h.$scope.userPrefsEdit.autosaveInterval, 30);
});

test('related record recovery checks current access and restores content and identifiers', async () => {
    const h = harness();
    const id = 'c'.repeat(32);
    const entries = [
        { type: 'template', id, key: `tpl-${id}`, field: 'content', label: 'Template', language: 'html', base: 'old HTML', value: 'draft HTML' },
        { type: 'template', id, key: `tpl-${id}`, field: 'recordId', label: 'Template ID', language: 'plaintext', base: 'old-id', value: 'draft-id' },
    ];
    const draft = recovered(h, entries);
    let checks = 0;
    h.$scope.onPaneIdChange = () => { checks++; };
    h.context.makeTemplatePaneObj = record => ({ key: `tpl-${record.sys_id}`, sys_id: record.sys_id, recordType: 'template', recordId: record.id, label: 'Template', language: 'html', hasIdInput: true, content: record.template });
    h.context.openExtraPane = pane => { h.context.extraPanes.push(pane); };
    h.context.ajax = async action => action === 'getTemplates'
        ? { success: true, templates: [{ sys_id: id, id: 'old-id', template: 'old HTML', readOnly: false }] }
        : { success: true, widget: h.$scope.widget };
    await h.$scope.restoreLocalDraft(draft, true);
    h.flush();
    assert.equal(h.context.extraPanes.length, 1);
    assert.equal(h.context.extraPanes[0].content, 'draft HTML');
    assert.equal(h.context.extraPanes[0].recordId, 'draft-id');
    assert.equal(checks, 1);
    assert.equal(h.draft().entries.length, 2);
    const denied = recovered(h, entries);
    h.context.ajax = async action => action === 'getTemplates'
        ? { success: true, templates: [{ sys_id: id, id: 'old-id', template: 'old HTML', readOnly: true }] }
        : { success: true, widget: h.$scope.widget };
    await h.$scope.restoreLocalDraft(denied, true);
    assert.match(h.$scope.localDraftError, /no longer editable/);
    assert.ok(h.localStorage.getItem(denied.key));
});

test('related pane save keeps edits typed while the request is running', async () => {
    const h = harness();
    const id = 'c'.repeat(32);
    let value = 'submitted script';
    const pane = { key: `si-${id}`, sys_id: id, recordType: 'script_include', label: 'Script Include', recordId: 'test', language: 'javascript', lastServerContent: 'saved script', content: 'saved script', dirty: true };
    h.context.extraPanes.push(pane);
    h.context.monacoEditors[pane.key] = { getValue: () => value };
    h.run('_writeLocalDraft()');
    const start = source.indexOf('                function saveExtraPane(');
    vm.runInContext(source.slice(start, source.indexOf('                // Close extra pane', start)), h.context);
    let finish;
    h.context.ajax = () => new Promise(resolve => { finish = resolve; });
    h.context.pane = pane;
    h.run('saveExtraPane(pane)');
    value = 'newer script';
    finish({ success: true });
    await Promise.resolve();
    assert.equal(pane.lastServerContent, 'submitted script');
    assert.equal(pane.dirty, true);
    assert.equal(h.draft().entries[0].value, 'newer script');
});

test('JSON save keeps newer modal edits and only discards them on explicit cancel', async () => {
    const h = harness();
    let value = '{"submitted":true}';
    h.context._optionSchemaEditor = { getValue: () => value, dispose() {} };
    h.context._hasProperJsonObjectValue = () => true;
    h.run("_draftJson.option_schema = { base: '{}', value: '{\"submitted\":true}' }; _writeLocalDraft()");
    const start = source.indexOf('                $scope.saveOptionSchemaModal =');
    vm.runInContext(source.slice(start, source.indexOf('                // True when a raw JSON string', start)), h.context);
    let finish;
    h.context.ajax = () => new Promise(resolve => { finish = resolve; });
    h.$scope.saveOptionSchemaModal();
    value = '{"newer":true}';
    h.run("_draftJson.option_schema.value = '{\"newer\":true}'");
    finish({ success: true });
    await Promise.resolve();
    assert.equal(h.draft().entries[0].base, '{"submitted":true}');
    assert.equal(h.draft().entries[0].value, '{"newer":true}');
    assert.ok(h.context._optionSchemaEditor);
    h.$scope.closeOptionSchemaModal();
    assert.equal(h.localStorage.length, 0);
});

test('save before navigation stays on the page after failure and cleans saved draft fields after success', async () => {
    for (const success of [true, false]) {
        const h = harness();
        h.$scope.widget.template = 'draft';
        h.run('_writeLocalDraft()');
        const previousDraft = recovered(h);
        h.context._buildSavePayload = () => ({ ...h.$scope.widget, public: false });
        h.context._captureAdditionalHeaderValues = () => {};
        h.$scope.visibleItems = [];
        h.$scope.headerDirty = {};
        let navigated = false;
        h.context.navigateToNewWidget = () => { navigated = true; };
        const acceptStart = source.indexOf('                function _acceptWidgetSave(');
        vm.runInContext(source.slice(acceptStart, source.indexOf('                $scope.saveAll =', acceptStart)), h.context);
        const start = source.indexOf('                $scope.saveAndNewWidget =');
        vm.runInContext(source.slice(start, source.indexOf('                $scope.openWidgetPickerModal', start)), h.context);
        h.context.ajax = async () => ({ success });
        h.$scope.saveAndNewWidget();
        await Promise.resolve();
        assert.equal(navigated, success);
        assert.equal(h.localStorage.length, success ? 0 : 2);
        assert.equal(h.localStorage.getItem(previousDraft.key) === null, success);
    }
});

test('draft Compare uses the existing Compare+ iframe and snapshot transport', async () => {
    const h = harness();
    const draft = recovered(h);
    await h.$scope.compareLocalDraft(draft);
    const url = new URL(h.$scope.versionDiffModal.url, 'https://example.service-now.com');
    assert.equal(url.pathname, '/ui_page.do');
    assert.equal(url.searchParams.get('sys_id'), '51ec3d258363b61070b8b5dfeeaad36b');
    assert.equal(url.searchParams.get('table'), 'sp_widget');
    assert.equal(url.searchParams.get('record_id'), widgetId);
    assert.equal(url.searchParams.get('da_iframe'), 'true');
    const snapshot = JSON.parse(h.localStorage.getItem('_weDiffSnap_' + url.searchParams.get('da_token')));
    assert.equal(snapshot._unsaved, true);
    assert.equal(snapshot.template, 'draft');
    assert.equal(snapshot.name, undefined, 'unchanged fields must be supplied by Compare+ saved-record overlay');
    assert.equal(h.$scope.versionDiffModal.localDraft, draft);
    assert.ok(h.localStorage.getItem(draft.key), 'comparison must not consume the recovery copy');
    assert.equal(h.$scope.versionDiffModal.open, true);
    h.$scope.closeVersionDiffModal();
    assert.equal(h.$scope.versionDiffModal.localDraft, null);
});

test('draft comparison maps related fields to platform fields in the same Compare+ modal', async () => {
    const h = harness();
    const id = 'c'.repeat(32);
    const entries = [
        { type: 'widget', id: widgetId, key: '', field: 'is_public', label: 'Public', language: 'plaintext', base: false, value: true },
        { type: 'provider', id, key: `prv-${id}`, field: 'content', label: 'Provider', language: 'javascript', base: 'old', value: 'draft script' },
        { type: 'provider', id, key: `prv-${id}`, field: 'recordId', label: 'Provider name', language: 'plaintext', base: 'saved_name', value: 'draft_name' },
    ];
    const draft = recovered(h, entries);
    h.context.ajax = async action => action === 'getProviders'
        ? { success: true, providers: [{ sys_id: id, name: 'saved_name', type: 'factory', script: 'old', readOnly: false }] }
        : { success: true, widget: h.$scope.widget };
    await h.$scope.compareLocalDraft(draft);
    const records = h.$scope.draftRecovery.records;
    assert.equal(records.length, 2);
    assert.equal(records[0].snapshot.public, true);
    assert.equal(records[0].snapshot.is_public, true);
    h.$scope.draftRecovery.selectedRecord = records[1];
    h.$scope.showLocalDraftCompare();
    const url = new URL(h.$scope.versionDiffModal.url, 'https://example.service-now.com');
    assert.equal(url.searchParams.get('table'), 'sp_angular_provider');
    assert.equal(url.searchParams.get('record_id'), id);
    const snap = JSON.parse(h.localStorage.getItem('_weDiffSnap_' + url.searchParams.get('da_token')));
    assert.equal(snap.script, 'draft script');
    assert.equal(snap.name, 'draft_name');
    assert.equal(snap.content, undefined);
    assert.equal(snap.recordId, undefined);
});

test('Compare+ accepts a new related record snapshot with an empty, read-only saved side', () => {
    const compareSource = fs.readFileSync('src/fluent/generated/other/sys-ui-page/widget_editor_compare.client.js', 'utf8');
    const start = compareSource.indexOf('            var _openerSnap = null;');
    const end = compareSource.indexOf("            _pending++;\n            _ajax('getVersionsForTable'", start);
    const localStorage = storage();
    localStorage.setItem('_weDiffSnap_test', JSON.stringify({ _unsaved: true, _newRecord: true, id: 'new-template', template: '<div>Draft</div>' }));
    const context = {
        daToken: 'test', recordId: '', tableParam: 'sp_ng_template', localStorage,
        ctrl: {}, _pending: 0, _recordData: null, _savedRecordData: null,
        _ajax: () => { throw new Error('New snapshots must not fetch a nonexistent record'); }, _onLoaded() {},
    };
    vm.runInNewContext(compareSource.slice(start, end), context);
    assert.equal(context.ctrl.currentIsUnsaved, true);
    assert.equal(context._recordData.values.template, '<div>Draft</div>');
    assert.equal(context._recordData.name, 'new-template');
    assert.equal(context._recordData.values._newRecord, undefined);
    assert.equal(context._savedRecordData.canWrite, false);
    assert.deepEqual(Object.keys(context._savedRecordData.values), []);
    assert.equal(localStorage.getItem('_weDiffSnap_test'), null);
    assert.ok(compareSource.includes('if (!recordId && !daToken)'), 'snapshot-only comparisons reach the existing viewer');
});
