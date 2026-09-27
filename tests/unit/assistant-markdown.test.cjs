const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const serverSource = fs.readFileSync('src/fluent/generated/server-development/script-include/sys_script_include_widget_editor_markdown.server.js', 'utf8');
const clientSource = fs.readFileSync('src/fluent/generated/server-development/ui-action/widget_editor_markdown_copy.client.js', 'utf8');

function server(extra = {}) {
    const context = {
        Class: { create: () => function () {} },
        AbstractAjaxProcessor: {},
        Object: { keys: Object.keys, prototype: Object.prototype, extendsObject: (_base, methods) => methods },
        gs: { getProperty: () => 'https://example.service-now.com/', hasRole: () => false, setProperty: () => { throw Error('unexpected write'); } },
        GlideRecordSecure: function () { this.isValid = () => false; this.get = this.next = () => false; this.addQuery = this.setLimit = this.query = () => {}; },
        GlideTableHierarchy: function () { this.getBase = () => ''; },
        ...extra,
    };
    vm.createContext(context);
    vm.runInContext(serverSource, context);
    const api = context.WidgetEditorMarkdownAjax.prototype;
    api.setAnswer = value => JSON.parse(value);
    api.getParameter = () => '';
    return { api, context };
}

test('forced customer update resolves target from validated name suffix', () => {
    const { api } = server();
    const id = 'a'.repeat(32);
    const target = api._target({ getValue: key => key === 'name' ? 'u_custom_record_' + id : '<record_update />' });
    assert.equal(target.table, 'u_custom_record');
    assert.equal(target.id, id);
    assert.equal(api._target({ getValue: key => key === 'name' ? 'u_custom_record_not-an-id' : '' }), null);
    const payload = '<record_update table="catalog_ui_policy"><catalog_ui_policy action="INSERT_OR_UPDATE"><sys_id>' + id + '</sys_id></catalog_ui_policy></record_update>';
    assert.equal(api._target({ getValue: key => key === 'payload' ? payload : '' }).table, 'catalog_ui_policy');
});

test('reference-valued record display field uses referenced record name', () => {
    const refId = 'b'.repeat(32);
    const { api } = server({
        GlideRecordSecure: function (table) {
            this.isValid = () => table === 'sc_cat_item_producer';
            this.get = id => table === 'sc_cat_item_producer' && id === refId;
            this.getValue = () => '';
            this.getDisplayValue = () => 'Friendly producer';
        },
    });
    api._displayField = () => ({ name: 'catalog_item', reference: 'sc_cat_item_producer' });
    const record = { getValue: () => refId, getDisplayValue: () => refId };
    assert.equal(api._name(record, 'u_record', 'a'.repeat(32), '', ''), 'Friendly producer');
});

test('missing reference uses payload display text before the target name', () => {
    const { api } = server();
    api._displayField = () => ({ name: 'catalog_item', reference: 'sc_cat_item' });
    const payload = '<catalog_item display_value="Producer [friendly]">' + 'b'.repeat(32) + '</catalog_item>';
    assert.equal(api._name(null, 'u_record', 'a'.repeat(32), payload, 'Poor target name'), 'Producer [friendly]');
});

test('policy action nests beneath its policy and producer even when they are not updated', () => {
    const producerId = 'a'.repeat(32), policyId = 'b'.repeat(32), actionId = 'c'.repeat(32);
    const rules = { groups: [{ table: 'sc_cat_item_producer', label: 'Record Producers', children: [{
        table: 'catalog_ui_policy', label: 'Catalog UI Policies', field: 'catalog_item', children: [{
            table: 'catalog_ui_policy_action', label: 'Catalog UI Policy Actions', field: 'ui_policy', children: [],
        }],
    }] }] };
    const { api } = server();
    api._record = (table, id) => {
        const values = {
            ['catalog_ui_policy_action:' + actionId]: { ui_policy: policyId },
            ['catalog_ui_policy:' + policyId]: { catalog_item: producerId },
            ['sc_cat_item_producer:' + producerId]: {},
        };
        const row = values[table + ':' + id];
        return row ? { getValue: field => row[field] || '' } : null;
    };
    api._name = (_record, table) => table;
    const result = api._ancestors('catalog_ui_policy_action', actionId, '', rules);
    assert.equal(result.type, 'Catalog UI Policy Actions');
    assert.deepEqual(Array.from(result.ancestors, item => item.table), ['sc_cat_item_producer', 'catalog_ui_policy']);
    api._record = (table, id) => table === 'catalog_ui_policy_action' ? { getValue: () => policyId } : null;
    const orphaned = api._ancestors('catalog_ui_policy_action', actionId, '', rules);
    assert.equal(orphaned.ancestors.length, 0);
    assert.equal(orphaned.type, 'catalog_ui_policy_action');
});

test('saveRules rejects non-admin callers before writing', () => {
    const { api } = server();
    assert.deepEqual({ ...api.saveRules() }, { success: false, error: 'Admin role required.' });
});

test('properties API requires admin for reading and editing', () => {
    const { api } = server();
    assert.equal(api.getProperties().error, 'Admin role required.');
    assert.equal(api.saveProperty().error, 'Admin role required.');
});

test('properties API discovers the app namespace and supplies grouping defaults on upgrade', () => {
    let prefix;
    const { api } = server({
        gs: { hasRole: () => true, getProperty: () => '', setProperty: () => {} },
        GlideRecordSecure: function (table) {
            let emitted = false;
            this.addQuery = (_field, operator, value) => { prefix = operator + ':' + value; };
            this.orderBy = this.query = () => {};
            this.next = () => table === 'sys_properties' && !emitted++;
            this.getValue = field => ({ name: 'monaco.plus.record_limit', value: '500',
                description: 'Record limit', type: 'integer' })[field];
        },
    });
    api._relatedTables = () => [];
    api._tableLabel = table => table;
    const result = api.getProperties();
    assert.equal(prefix, 'STARTSWITH:monaco.plus.');
    assert.equal(result.properties.find(property => property.name === 'monaco.plus.record_limit').value, '500');
    assert.ok(result.properties.some(property => property.name === 'monaco.plus.update_sets.markdown_groups'));
});

test('properties API edits only existing Widget Editor+ properties', () => {
    const saved = {};
    const { api } = server({
        gs: { hasRole: () => true, getProperty: name => saved[name] || '', setProperty: (name, value) => { saved[name] = value; } },
        GlideRecordSecure: function (table) {
            this.get = (_field, name) => table === 'sys_properties' && name === 'monaco.plus.record_limit';
            this.getValue = field => field === 'type' ? 'integer' : field === 'max_length' ? '4000' : '';
            this.addQuery = this.setLimit = this.query = () => {};
            this.next = () => table === 'sys_dictionary';
        },
    });
    let params = { property_name: 'glide.servlet.uri', property_value: 'bad' };
    api.getParameter = key => params[key];
    assert.equal(api.saveProperty().success, false);
    params = { property_name: 'monaco.plus.update_sets.markdown_groups', property_value: '{}' };
    assert.equal(api.saveProperty().success, false);
    params = { property_name: 'monaco.plus.record_limit', property_value: 'many' };
    assert.equal(api.saveProperty().success, false);
    params.property_value = '250';
    assert.equal(api.saveProperty().value, '250');
    assert.deepEqual(saved, { 'monaco.plus.record_limit': '250' });
});

test('admin save rejects a cyclic rule and an invalid reference field', () => {
    let writes = 0;
    const { api } = server({
        gs: { getProperty: () => '', hasRole: role => role === 'admin', setProperty: () => { writes++; } },
        GlideRecordSecure: function (table) {
            this.get = () => table === 'sys_db_object';
            this.isValid = () => true;
            this.isValidField = () => false;
        },
    });
    const base = { id: 'root', label: 'Root', table: 'u_root', children: [] };
    base.children.push({ id: 'cycle', label: 'Cycle', table: 'u_root', field: 'parent', children: [] });
    api.getParameter = () => JSON.stringify({ version: 1, groups: [base] });
    assert.equal(api.saveRules().success, false);
    base.children[0].table = 'u_child';
    assert.equal(api.saveRules().success, false);
    assert.equal(writes, 0);
});

test('explicit default action supplies four alphabetical roots and instance related lists', () => {
    const { api } = server({ gs: { getProperty: () => '', hasRole: () => false } });
    api._tableLabel = table => table;
    api._relatedTables = table => table === 'sp_widget' ? [
        { table: 'sp_ng_template', label: 'Angular templates', field: 'sp_widget' },
        { table: 'm2m_sp_widget_dependency', label: 'Dependencies', field: 'sp_widget' },
    ] : [{ table: 'catalog_ui_policy', label: 'Policies', field: 'catalog_item' }];
    const rules = api._defaultRules();
    assert.deepEqual(Array.from(rules.groups, node => node.table), ['sc_cat_item_producer', 'sp_widget', 'sys_security_acl', 'sys_user_group']);
    assert.equal(rules.groups[1].children[0].table, 'sp_ng_template');
    assert.equal(rules.groups[1].children[1].table, 'm2m_sp_widget_dependency');
    assert.equal(rules.groups[2].children[0].table, 'sys_security_acl_role');
    assert.equal(rules.groups[2].children[0].field, 'sys_security_acl');
    assert.equal(rules.groups[3].children[0].field, 'group');
});

test('related table discovery excludes scripts, dot walks and unrelated references', () => {
    const fixtures = {
        sys_ui_related_list: [
            { sys_id: 'default', name: 'sc_cat_item', view: 'Default view', sys_user: '' },
            { sys_id: 'personal', name: 'sc_cat_item', view: 'Default view', sys_user: 'someone' },
            { sys_id: 'other', name: 'sc_cat_item', view: 'Other view', sys_user: '' },
        ],
        sys_ui_related_list_entry: [
            { list_id: 'default', related_list: 'catalog_ui_policy.catalog_item' },
            { list_id: 'default', related_list: 'catalog_ui_policy.catalog_item' },
            { list_id: 'default', related_list: 'REL:scripted' },
            { list_id: 'default', related_list: 'child.parent.name' },
            { list_id: 'default', related_list: 'unrelated.owner' },
            { list_id: 'personal', related_list: 'private_table.parent' },
            { list_id: 'other', related_list: 'other_table.parent' },
        ],
        sys_dictionary: [
            { name: 'catalog_ui_policy', element: 'catalog_item', internal_type: 'reference', reference: 'sc_cat_item' },
            { name: 'unrelated', element: 'owner', internal_type: 'reference', reference: 'sys_user' },
        ],
    };
    const { api } = server({ GlideRecordSecure: function (table) {
        let rows = fixtures[table] || [], index = -1;
        this.addQuery = (field, op, value) => {
            rows = rows.filter(row => op === 'IN' ? value.split(',').includes(row[field]) : row[field] === op);
        };
        this.setLimit = this.query = () => {};
        this.next = () => ++index < rows.length;
        this.getValue = field => rows[index][field];
        this.getUniqueValue = () => rows[index].sys_id;
    } });
    api._hierarchyNames = table => [table];
    api._tableLabel = () => 'Catalog policies';
    assert.deepEqual(JSON.parse(JSON.stringify(api._relatedTables('sc_cat_item'))),
        [{ table: 'catalog_ui_policy', field: 'catalog_item', label: 'Catalog policies' }]);
    assert.equal(api.getRelatedTables().error, 'Admin role required.');
    assert.equal(api.getDefaultRules().error, 'Admin role required.');
});

test('member pages include forced records and validated live or customer-update URLs', () => {
    const setId = 'a'.repeat(32), targetId = 'b'.repeat(32), updateId = 'c'.repeat(32);
    function run(exists) {
        const { api } = server({ GlideRecordSecure: function (table) {
            this._returned = 0;
            this.isValid = () => true;
            this.get = id => table === 'sys_update_set' ? id === setId : table === 'u_forced_record' && exists && id === targetId;
            this.addQuery = this.orderByDesc = () => {};
            this.chooseWindow = () => {};
            this.query = () => {};
            this.next = () => table === 'sys_update_xml' && !this._returned++;
            this.getUniqueValue = () => updateId;
            this.getValue = field => ({ name: 'u_forced_record_' + targetId, payload: '<record_update />',
                action: 'INSERT_OR_UPDATE', target_name: 'Forced title' })[field] || '';
        } });
        api.getParameter = key => ({ set_table: 'sys_update_set', set_id: setId, offset: '0' })[key];
        api._rules = () => ({ groups: [] });
        api._ancestors = () => ({ type: 'Forced Records', ancestors: [] });
        api._name = () => 'Forced title';
        const result = api.getMemberPage();
        assert.equal(result.success, true);
        assert.equal(result.rows.length, 1);
        assert.equal(result.rows[0].name, 'Forced title');
        return result.rows[0].url;
    }
    assert.equal(run(true), 'https://example.service-now.com/nav_to.do?uri=u_forced_record.do%3Fsys_id%3D' + targetId);
    assert.equal(run(false), 'https://example.service-now.com/nav_to.do?uri=sys_update_xml.do%3Fsys_id%3D' + updateId);
});

test('retrieved update sets return every member across pages', () => {
    const setId = 'a'.repeat(32);
    const updates = Array.from({ length: 101 }, (_, i) => ({
        id: i.toString(16).padStart(32, '0'), target: (i + 101).toString(16).padStart(32, '0'),
    }));
    const { api } = server({ GlideRecordSecure: function (table) {
        let rows = [], index = 0, start = 0, end = 0;
        this.isValid = () => true;
        this.get = id => table === 'sys_remote_update_set' && id === setId;
        this.addQuery = this.orderByDesc = () => {};
        this.chooseWindow = (from, to) => { start = from; end = to; };
        this.query = () => { rows = updates.slice(start, end); index = 0; };
        this.next = () => table === 'sys_update_xml' && index < rows.length ? (this.row = rows[index++], true) : false;
        this.getUniqueValue = () => this.row.id;
        this.getValue = field => ({ name: 'u_record_' + this.row.target, payload: '<record_update />', target_name: 'Record ' + index })[field] || '';
    } });
    api._rules = () => ({ groups: [] });
    api._ancestors = () => ({ type: 'Records', ancestors: [] });
    api._name = (_record, _table, _id, _payload, fallback) => fallback;
    let offset = 0;
    const all = [];
    do {
        api.getParameter = key => ({ set_table: 'sys_remote_update_set', set_id: setId, offset: String(offset) })[key];
        const page = api.getMemberPage();
        assert.equal(page.success, true);
        all.push(...page.rows);
        if (!page.hasMore) break;
        offset = page.nextOffset;
    } while (true);
    assert.equal(all.length, 101);
    assert.equal(new Set(all.map(row => row.updateId)).size, 101);
    assert.equal(all[100].url, 'https://example.service-now.com/nav_to.do?uri=sys_update_xml.do%3Fsys_id%3D' + updates[100].id);
});

test('selected local and retrieved updates resolve to distinct whole sets', () => {
    const localId = 'a'.repeat(32), remoteId = 'b'.repeat(32);
    const localUpdate = 'c'.repeat(32), remoteUpdate = 'd'.repeat(32);
    const { api } = server({ GlideRecordSecure: function (table) {
        let current = '';
        this.get = id => {
            current = id;
            return table === 'sys_update_xml' ? id === localUpdate || id === remoteUpdate :
                (table === 'sys_update_set' && id === localId) || (table === 'sys_remote_update_set' && id === remoteId);
        };
        this.getValue = field => table === 'sys_update_xml' ? {
            update_set: current === localUpdate ? localId : '',
            remote_update_set: current === remoteUpdate ? remoteId : '',
        }[field] || '' : field === 'name' ? (table === 'sys_update_set' ? 'Local' : 'Retrieved') : '';
    } });
    api.getParameter = key => key === 'update_ids' ? [localUpdate, remoteUpdate, localUpdate].join(',') : '';
    const result = api.getSetsForUpdates();
    assert.equal(result.success, true);
    assert.deepEqual(Array.from(result.sets, set => set.table), ['sys_update_set', 'sys_remote_update_set']);
});

test('Markdown escapes names and renders policy actions under their policy', () => {
    const context = { Promise, navigator: {}, document: {}, alert: () => {}, console };
    vm.createContext(context);
    vm.runInContext(clientSource, context);
    const loaded = [{ set: { name: 'Set [A]', url: 'https://example/set' }, rows: [{
        table: 'catalog_ui_policy_action', id: 'c', type: 'Catalog UI Policy Actions',
        name: 'Show [field] (now)', url: 'https://example/nav_to.do?uri=action.do%3Fsys_id%3Dc', action: '',
        ancestors: [
            { table: 'sc_cat_item_producer', id: 'a', type: 'Record Producers', name: 'Producer', url: 'https://example/producer' },
            { table: 'catalog_ui_policy', id: 'b', type: 'Catalog UI Policies', name: 'Policy', url: 'https://example/policy' },
        ],
    }] }];
    const output = context._weMarkdownText(loaded, 'separate');
    assert.ok(output.startsWith('## [Set \\[A\\]](https://example/set)'));
    assert.ok(output.includes('- **Record Producers**'));
    assert.ok(output.includes('  - [Producer](https://example/producer)'));
    assert.ok(output.indexOf('Catalog UI Policies') < output.indexOf('Catalog UI Policy Actions'));
    assert.ok(output.includes('Show \\[field\\] \\(now\\)'));
    assert.ok(output.includes('action.do%3Fsys_id%3Dc'));
});

test('combined mode removes repeat records while separate mode retains each set section', () => {
    const context = { Promise, navigator: {}, document: {}, alert: () => {}, console };
    vm.createContext(context);
    vm.runInContext(clientSource, context);
    const row = { table: 'u_record', id: 'a', type: 'Records', name: 'One', url: 'https://example/one', ancestors: [] };
    const loaded = [
        { set: { name: 'First', url: 'https://example/first' }, rows: [row] },
        { set: { name: 'Second', url: 'https://example/second' }, rows: [row] },
    ];
    assert.equal(context._weMarkdownText(loaded, 'combined').match(/\[One\]/g).length, 1);
    const separate = context._weMarkdownText(loaded, 'separate');
    assert.equal(separate.match(/\[One\]/g).length, 2);
    assert.ok(separate.includes('## [First]'));
    assert.ok(separate.includes('## [Second]'));
});

test('record types are alphabetical regardless of saved rule order', () => {
    const context = { Promise, navigator: {}, document: {}, alert: () => {}, console };
    vm.createContext(context);
    vm.runInContext(clientSource, context);
    const rows = [
        { table: 'ordinary', id: '1', type: 'A ordinary', name: 'Ordinary', url: '', ancestors: [] },
        { table: 'second', id: '2', type: 'Second rule', typeOrder: 1, name: 'Second', url: '', ancestors: [] },
        { table: 'first', id: '3', type: 'First rule', typeOrder: 0, name: 'First', url: '', ancestors: [] },
    ];
    const output = context._weMarkdownRender(context._weMarkdownTree(rows), 0);
    assert.deepEqual(Array.from(output.filter(line => line.startsWith('- **'))),
        ['- **A ordinary**', '- **First rule**', '- **Second rule**']);
});

test('list choices and Related Links use checked rows; context menus use clicked row', async () => {
    const checked = ['a'.repeat(32), 'b'.repeat(32)];
    const clicked = 'c'.repeat(32);
    const context = { Promise, navigator: {}, document: {}, alert: () => {}, console,
        g_list: { getChecked: () => checked.join(',') } };
    vm.createContext(context);
    vm.runInContext(clientSource, context);
    let selected;
    context._weResolveMarkdownSets = ids => { selected = Array.from(ids); return Promise.resolve([{ id: 'one' }]); };
    context._weCopyMarkdownSets = () => {};
    context.copyUpdateSetMarkdownPlus();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(selected, checked);
    context.rowSysId = clicked;
    context.copyUpdateSetMarkdownPlus();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(selected, [clicked]);
});

test('clipboard failure leaves selectable Markdown visible', async () => {
    const elements = [];
    const body = { appendChild: node => { elements.push(node); node.parentNode = body; }, removeChild: node => {
        elements.splice(elements.indexOf(node), 1);
    } };
    const document = { body, execCommand: () => false, createElement: tag => ({ tag, style: {},
        setAttribute() {}, select() { this.selected = true; }, appendChild(child) {
            (this.children ||= []).push(child);
        } }) };
    const context = { Promise, navigator: {}, document, alert: () => {}, console };
    vm.createContext(context);
    vm.runInContext(clientSource, context);
    await assert.rejects(context._weWriteMarkdownClipboard('- **Records**'), /Automatic copying was blocked/);
    assert.equal(elements.length, 1);
    const textarea = elements[0].children[0].children[1];
    assert.equal(textarea.value, '- **Records**');
    assert.equal(textarea.selected, true);
});

test('UI placements and admin-only properties page are declared', () => {
    const copy = fs.readFileSync('src/fluent/generated/server-development/ui-action/sys_ui_action_widget_editor_markdown_copy.now.ts', 'utf8');
    const editor = fs.readFileSync('src/fluent/generated/security/access-control/sys_security_acl_widget_editor_plus_properties.now.ts', 'utf8');
    const page = fs.readFileSync('src/fluent/generated/other/sys-ui-page/sys_ui_page_widget_editor_plus_properties.now.ts', 'utf8');
    const module = fs.readFileSync('src/fluent/generated/user-interface/module/sys_app_module_widget_editor_properties.now.ts', 'utf8');
    const client = fs.readFileSync('src/fluent/generated/other/sys-ui-page/widget_editor_plus_properties.client.js', 'utf8');
    const property = fs.readFileSync('src/fluent/generated/properties/system-property/sys_properties_widget_editor_assistant_markdown_groups.now.ts', 'utf8');
    assert.match(copy, /showListChoice: true, showContextMenu: true, showLink: true/);
    assert.match(copy, /roles: \['sp_admin'\]/);
    assert.match(editor, /roles: \['admin'\]/);
    assert.match(page, /widget_editor_plus_properties\.do/);
    const jelly = page.match(/html: `([\s\S]*?)`,\s*clientScript:/)?.[1];
    assert.ok(jelly, 'properties page Jelly markup is declared');
    assert.doesNotMatch(jelly, /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i,
        'Jelly markup must escape ampersands');
    assert.match(page, /container-fluid wep-app/);
    assert.match(page, /id="wep-nav" class="wep-nav"/);
    assert.match(client, /el\('a', 'btn btn-default wep-feature-pill'\)/);
    assert.match(page, /--now-color_background--primary/);
    assert.match(page, /--now-color_text--primary/);
    assert.match(page, /monaco\.bundle\.min\.jsx/);
    assert.match(page, /textarea\.wep-value\s*\{[^}]*max-height:50vh/s);
    assert.match(page, /textarea\.wep-json-fallback\[hidden\]\s*\{\s*display:none !important;/);
    assert.match(module, /ui_page\.do\?sys_id=47cb4ac08e0d4437b5c0a482d8411e30/);
    assert.match(client, /Widget Editor\+'/);
    assert.match(client, /Assistant\+'/);
    assert.match(client, /Update Set Markdown/);
    assert.match(client, /Code Search\+'/);
    assert.match(client, /saveRules/);
    assert.match(client, /panel panel-default wep-card/);
    assert.match(client, /form-control wep-value/);
    assert.match(client, /panel-title wep-property-name', property\.name/);
    assert.doesNotMatch(client, /function title\(/);
    assert.match(client, /language: 'json'/);
    assert.match(client, /monaco\.editor\.create\(host/);
    assert.match(client, /input\.scrollHeight/);
    assert.match(client, /window\.innerHeight \* 0\.5/);
    assert.match(property, /write: \['admin'\]/);
});

test('JSON property renders one visible editor and grows only to half the viewport', async () => {
    const source = fs.readFileSync('src/fluent/generated/other/sys-ui-page/widget_editor_plus_properties.client.js', 'utf8');
    class Node {
        constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.style = {}; this.className = ''; this._text = ''; }
        set textContent(value) { this._text = value; this.children = []; }
        get textContent() { return this._text; }
        appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
        insertBefore(child, before) { child.parentNode = this; this.children.splice(this.children.indexOf(before), 0, child); }
        setAttribute(name, value) { (this.attributes ||= {})[name] = value; }
        getAttribute(name) { return (this.attributes || {})[name]; }
        remove() { this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); }
        querySelectorAll(selector) {
            const wanted = selector.slice(1), found = [];
            function visit(node) {
                node.children.forEach(child => {
                    if (child.className.split(' ').includes(wanted)) found.push(child);
                    visit(child);
                });
            }
            visit(this);
            return found;
        }
    }
    const roots = Object.fromEntries(['wep-sections', 'wep-nav', 'wep-message', 'wep-search', 'wep-table-options']
        .map(id => [id, new Node('div')]));
    roots['wep-search'].value = '';
    const frames = [], listeners = {};
    let contentHeight = 40, contentChanged;
    const editor = { getValue: () => '{}', setValue() {}, getContentHeight: () => contentHeight,
        onDidChangeModelContent() {}, onDidContentSizeChange: callback => { contentChanged = callback; },
        layout() {}, dispose() {} };
    const window = { innerHeight: 300, location: { origin: 'https://example.service-now.com' },
        requestAnimationFrame: callback => frames.push(callback), addEventListener: (name, callback) => { listeners[name] = callback; },
        getComputedStyle: () => ({ getPropertyValue: () => '255 255 255' }),
        monaco: { editor: { create: () => editor } } };
    const document = { readyState: 'complete', documentElement: new Node('html'),
        getElementById: id => roots[id], createElement: tag => new Node(tag) };
    function GlideAjax() {
        this.addParam = () => {};
        this.getXMLAnswer = callback => callback(JSON.stringify({ success: true, properties: [{
            name: 'monaco.plus.css.variables', value: '{"color":"red"}', description: '', type: 'string',
        }, {
            name: 'monaco.plus.update_sets.markdown_groups', value: '{"version":1,"groups":[]}',
            description: 'Update set Markdown grouping rules', type: 'string',
        }] }));
    }
    const context = { window, document, GlideAjax, Promise, Blob: function () {}, Worker: function () {}, URL,
        setTimeout, clearTimeout, console };
    vm.createContext(context);
    vm.runInContext(source, context);
    await new Promise(resolve => setImmediate(resolve));
    while (frames.length) frames.shift()();
    assert.deepEqual(roots['wep-sections'].children.map(section => section.getAttribute('data-feature')),
        ['Widget Editor+', 'Update Set Markdown']);
    const card = roots['wep-sections'].querySelectorAll('.wep-card')[0];
    const title = card.querySelectorAll('.wep-property-name')[0];
    const fallback = card.querySelectorAll('.wep-json-fallback')[0];
    const host = card.querySelectorAll('.wep-monaco')[0];
    assert.equal(title.textContent, 'monaco.plus.css.variables');
    assert.equal(fallback.hidden, true);
    assert.equal(host.style.height, '76px');
    contentHeight = 260;
    contentChanged();
    assert.equal(host.style.height, '150px');
    window.innerHeight = 800;
    listeners.resize();
    assert.equal(host.style.height, '262px');
});


test('export never discovers relationships for empty, malformed or saved hierarchies', () => {
    for (const value of ['', '{', '{}', '{"version":1,"groups":[]}',
        '{"version":1,"groups":[{"id":"widget","table":"sp_widget","label":"Widgets","children":[]}]}']) {
        const { api } = server({ gs: { getProperty: () => value } });
        api._defaultRules = api._relatedTables = () => { throw Error('Unexpected automatic discovery'); };
        const rules = api._rules();
        assert.equal(rules.groups.length, value.includes('sp_widget') ? 1 : 0);
        if (rules.groups.length) assert.equal(rules.groups[0].children.length, 0);
    }
});

test('unlisted tables do not inherit grouping from a configured base table', () => {
    const { api } = server();
    api._tableLabel = table => table;
    api._hierarchyNames = () => { throw Error('Unexpected inherited grouping'); };
    const result = api._ancestors('sc_cat_item_producer', 'a'.repeat(32), '', {
        groups: [{ table: 'sc_cat_item', label: 'Catalog Items', children: [] }],
    });
    assert.equal(result.type, 'sc_cat_item_producer');
    assert.equal(result.ancestors.length, 0);
});

test('JSON property saves reject malformed JSON before writing', () => {
    let writes = 0;
    const { api } = server({
        gs: { hasRole: () => true, setProperty: () => { writes++; } },
        GlideRecordSecure: function () {
            this.get = () => true;
            this.getValue = field => field === 'value' ? '{"enabled":true}' : 'string';
        },
    });
    api.getParameter = key => key === 'property_name' ? 'monaco.plus.custom_json' : '{"enabled":';
    assert.equal(api.saveProperty().error, 'Invalid JSON.');
    assert.equal(writes, 0);
});

test('Table hierarchy saves reject malformed JSON before writing', () => {
    let writes = 0;
    const { api } = server({ gs: { hasRole: () => true, setProperty: () => { writes++; } } });
    api.getParameter = () => '{"version":1,"groups":[';
    assert.equal(api.saveRules().success, false);
    assert.equal(writes, 0);
});

test('property values enforce 4000 characters even when dictionary allows more', () => {
    let saved = '', value = 'x'.repeat(4000);
    const { api } = server({
        gs: { hasRole: () => true, setProperty: (_name, text) => { saved = text; }, getProperty: () => saved },
        GlideRecordSecure: function () {
            this.get = this.next = () => true;
            this.getValue = field => field === 'max_length' ? '10000' : field === 'type' ? 'string' : '';
            this.addQuery = this.setLimit = this.query = () => {};
        },
    });
    api.getParameter = key => key === 'property_name' ? 'monaco.plus.example' : value;
    assert.equal(api.saveProperty().success, true);
    assert.equal(saved.length, 4000);
    value += 'x';
    assert.equal(api.saveProperty().error, 'Property value exceeds 4000 characters.');
    assert.equal(saved.length, 4000);
});

test('hierarchy limit checks the final serialised property value', () => {
    let saved = '';
    const { api } = server({ gs: { hasRole: () => true, setProperty: (_name, value) => { saved = value; } } });
    const prefix = '{"version":1,"groups":[],"extra":"';
    let raw = prefix + 'x'.repeat(4000 - prefix.length - 2) + '"}';
    api.getParameter = () => raw;
    assert.equal(raw.length, 4000);
    assert.equal(api.saveRules().success, true);
    assert.equal(saved.length, 4000);
    raw = raw.slice(0, -2) + 'x"}';
    assert.equal(api.saveRules().success, false);
    raw = '{"version":1,"groups":[],"extra":[' + Array(800).fill('1e3').join(',') + ']}';
    assert.ok(raw.length < 4000);
    assert.ok(JSON.stringify(JSON.parse(raw)).length > 4000);
    assert.equal(api.saveRules().success, false);
    assert.equal(saved.length, 4000);
});

function displayServer() {
    const roleId = 'b'.repeat(32);
    const schema = { sys_security_acl_role: { sys_user_role: 'sys_user_role', name: '' },
        sys_user_role: { name: '', description: '', secret: '', level: '' } };
    const records = { sys_security_acl_role: { ['a'.repeat(32)]: { sys_user_role: roleId, name: 'Original' } },
        sys_user_role: { [roleId]: { name: 'Friendly [role]', description: 'Read | write', secret: 'hidden', level: '0' } } };
    const config = { sys_security_acl_role: { display: 'sys_user_role.name',
        secondary: ['sys_user_role.description', 'sys_user_role.secret', 'sys_user_role.level'] } };
    let writes = 0;
    const result = server({
        gs: { hasRole: () => true, getProperty: name => name.endsWith('markdown_display') ? JSON.stringify(config) : '',
            setProperty: () => { writes++; } },
        GlideRecordSecure: function (table) {
            let data = {};
            this.addQuery = this.setLimit = this.query = () => {};
            this.next = () => false;
            this.isValid = () => !!schema[table];
            this.isValidField = field => !!schema[table] && field in schema[table];
            this.get = (key, value) => {
                if (table === 'sys_properties') return true;
                data = records[table]?.[key] || {};
                return !!records[table]?.[key];
            };
            this.getElement = field => ({ canRead: () => field !== 'secret', getED: () => ({
                getInternalType: () => schema[table][field] ? 'reference' : 'string',
                getReference: () => schema[table][field],
            }) });
            this.getValue = field => table === 'sys_properties' ? (field === 'value' ? '{}' : 'string') : data[field] || '';
            this.getDisplayValue = field => data[field] || '';
        },
    });
    return { ...result, writes: () => writes };
}

test('display fields validate reference dot walks and reject unknown or non-reference segments', () => {
    const { api, writes } = displayServer();
    assert.equal(api._validateDisplayConfig({ sys_security_acl_role: { display: 'sys_user_role.name', secondary: ['name'] } }), '');
    for (const config of [
        { missing_table: { display: 'name' } },
        { sys_security_acl_role: { display: 'missing' } },
        { sys_security_acl_role: { display: 'name.description' } },
        { sys_security_acl_role: { display: 'sys_user_role.missing' } },
        { sys_security_acl_role: { display: 'name', secondary: ['sys_user_role.missing'] } },
        { sys_security_acl_role: { display: 'name', secondary: 'name' } },
    ]) {
        api.getParameter = key => key === 'property_name' ? 'monaco.plus.update_sets.markdown_display' : JSON.stringify(config);
        assert.equal(api.saveProperty().success, false);
    }
    assert.equal(writes(), 0);
    api.getParameter = key => key === 'property_name' ? 'monaco.plus.update_sets.markdown_display' :
        JSON.stringify({ sys_security_acl_role: { display: 'sys_user_role.name', secondary: ['name'] } });
    assert.equal(api.saveProperty().success, true);
    assert.equal(writes(), 1);
});

test('display export resolves dot walks securely and preserves secondary order', () => {
    const { api } = displayServer();
    const record = api._record('sys_security_acl_role', 'a'.repeat(32));
    assert.equal(api._name(record, 'sys_security_acl_role', 'a'.repeat(32), '', ''), 'Friendly [role]');
    assert.deepEqual(Array.from(api._secondaryValues(record, 'sys_security_acl_role', '')), ['Read | write', '0']);
    assert.equal(api._configuredValue(null, 'sys_security_acl_role', '<sys_user_role>' + 'b'.repeat(32) + '</sys_user_role>', 'sys_user_role.name'), 'Friendly [role]');
    assert.equal(api._configuredValue(null, 'sys_security_acl_role', '<sys_user_role>' + 'c'.repeat(32) + '</sys_user_role>', 'sys_user_role.name'), '');
    assert.equal(api._configuredValue(null, 'sys_security_acl_role', '<name>Deleted record</name>', 'name'), 'Deleted record');
});

test('Markdown appends escaped secondary values to both parents and records', () => {
    const context = { console };
    vm.createContext(context); vm.runInContext(clientSource, context);
    const rows = [{ table: 'child', id: 'c', type: 'Children', name: 'Child', url: '/child',
        secondary: ['one | two', '<three>'], ancestors: [{ table: 'parent', id: 'p', type: 'Parents',
            name: 'Parent', url: '/parent', secondary: ['value'] }] }];
    const result = context._weMarkdownRender(context._weMarkdownTree(rows), 0).join('\n');
    assert.ok(result.includes('[Parent](/parent) value'));
    assert.ok(result.includes('[Child](/child) one \\| two | \\<three\\>'));
});
