const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vmModule = require('node:vm');

const pageSource = fs.readFileSync(
    'src/fluent/generated/other/sys-ui-page/sys_ui_page_widget_editor_code_search.now.ts',
    'utf8'
);
const serverSource = fs.readFileSync(
    'src/fluent/generated/server-development/script-include/sys_script_include_widget_editor_code_search.server.js',
    'utf8'
);
const propertiesSource = fs.readFileSync(
    'src/fluent/generated/properties/system-property/sys_properties_widget_editor_code_search_display_fields.now.ts',
    'utf8'
);
const categorySource = fs.readFileSync(
    'src/fluent/generated/properties/system-property-category-m2m/sys_properties_category_m2m_widget_editor_plus.now.ts',
    'utf8'
);
const pageAclSource = fs.readFileSync(
    'src/fluent/generated/security/access-control/sys_security_acl_widget_editor_code_search_ui_page.now.ts',
    'utf8'
);
const ajaxAclSource = fs.readFileSync(
    'src/fluent/generated/security/access-control/sys_security_acl_widget_editor_code_search_ajax.now.ts',
    'utf8'
);
const moduleSource = fs.readFileSync(
    'src/fluent/generated/user-interface/module/sys_app_module_widget_editor_code_search.now.ts',
    'utf8'
);

test('code search uses GlideRecord and is restricted to administrators', () => {
    assert.equal(serverSource.includes('GlideRecordSecure'), false);
    assert.ok(serverSource.includes('new GlideRecord('));
    assert.ok(pageAclSource.includes("roles: ['admin']"));
    assert.ok(ajaxAclSource.includes("roles: ['admin']"));
    assert.ok(moduleSource.includes('override_menu_roles: true'));
    assert.ok(moduleSource.includes("roles: ['admin']"));
});

test('changing Group/Sort resets the results pane without smooth scrolling', () => {
    const start = pageSource.indexOf("            $scope.$watch('ctrl.viewMode'");
    const end = pageSource.indexOf('            vm.clearInput = function', start);
    const watcherSource = pageSource.slice(start, end);
    const container = { scrollTop: 480, scrollTo() { throw new Error('scrollTo must not be used'); } };
    let watcher;
    let sortedUpdates = 0;
    let viewedUpdates = 0;
    const vm = {};
    const $scope = { $watch(_name, callback) { watcher = callback; } };
    const $timeout = callback => callback();
    const document = { getElementById() { return container; } };
    const _updateSortedResults = () => { sortedUpdates++; };
    const _updateCurrentViewedTable = () => { viewedUpdates++; };

    eval(watcherSource);
    watcher('date_desc', 'group_table');

    assert.equal(container.scrollTop, 0);
    assert.equal(sortedUpdates, 1);
    assert.equal(viewedUpdates, 1);
    assert.equal(watcherSource.includes("behavior: 'smooth'"), false);
});

test('excluding a result field marks its table and recomputes the visible record count', () => {
    const helpersStart = pageSource.indexOf('            function _fieldIsActive');
    const helpersEnd = pageSource.indexOf("            // Tracks which table's section", helpersStart);
    const togglesStart = pageSource.indexOf('            // At least one field must stay included');
    const togglesEnd = pageSource.indexOf('            function _fieldsOrClause', togglesStart);

    const vm = {
        hasSearched: true,
        viewMode: 'group_table',
        tableActiveFields: {},
        tableMatchCounts: {},
        tables: [{ table: 'x_example', sysId: '1' }],
        tablesWithResults: [],
        results: [
            { table: 'x_example', tableLabel: 'Example', displayValue: 'A', matches: [{ field: 'script' }] },
            { table: 'x_example', tableLabel: 'Example', displayValue: 'B', matches: [{ field: 'template' }] }
        ],
        scrollToTable(table, options) { this.lastScrollRequest = { table, options }; }
    };
    function _updateTablesWithResults() {
        vm.tablesWithResults = vm.tables.filter(table => (vm.tableMatchCounts[table.table] || 0) > 0);
    }

    eval(pageSource.slice(helpersStart, helpersEnd));
    eval(pageSource.slice(togglesStart, togglesEnd));
    _updateGroupedResults();
    const group = vm.groupedResults[0];

    assert.equal(vm.tableMatchCounts.x_example, 2);
    assert.equal(vm.hasExcludedResultFields('x_example'), false);
    vm.toggleGroupField(group, 'template');
    assert.equal(vm.hasExcludedResultFields('x_example'), true);
    assert.equal(vm.tableMatchCounts.x_example, 1);
    assert.equal(vm.tablesWithResults.length, 1);
    assert.deepEqual(vm.lastScrollRequest, {
        table: 'x_example',
        options: { forceTop: true, smooth: true }
    });
    assert.ok(pageSource.includes('ng-if="ctrl.hasExcludedResultFields(table.table)"'));
});

test('record header fields come only from each table display-fields property', () => {
    const requested = [];
    const context = {
        AbstractAjaxProcessor: {},
        Class: { create() { return function WidgetEditorCodeSearchAjax() {}; } },
        GlideRecord() {},
        JSON,
        encodeURIComponent,
        gs: {
            getProperty(name) {
                requested.push(name);
                return ' type, operation, type,  ';
            }
        }
    };
    context.Object = Object.create(Object);
    context.Object.extendsObject = (_base, members) => members;
    vmModule.runInNewContext(serverSource, context);
    const config = new context.WidgetEditorCodeSearchAjax()._getTableDisplayConfig('sys_security_acl');

    assert.deepEqual(Array.from(config.secondaryFields), ['type', 'operation']);
    assert.equal(config.primaryField, '');
    assert.deepEqual(requested, ['monaco.plus.code_search.display_fields.sys_security_acl']);
});

test('all known code-search tables have display-field properties in the Monaco category', () => {
    const tables = [
        'sp_page',
        'sp_widget',
        'sc_cat_item_producer',
        'sysevent_email_action',
        'sp_angular_provider',
        'sys_security_acl',
        'sys_ui_action'
    ];
    tables.forEach(table => {
        assert.ok(propertiesSource.includes(`name: 'monaco.plus.code_search.display_fields.${table}'`));
        assert.ok(categorySource.includes(`code-search-display-fields-${table.replaceAll('_', '-')}`));
    });
    assert.ok(propertiesSource.includes("value: 'type,operation'"));
});
