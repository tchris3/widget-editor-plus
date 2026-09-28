const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(
    'src/fluent/generated/server-development/script-include/sys_script_include_widget_editor_assistant.server.js', 'utf8'
);

function scan({ knowledge = 'article-id', readable = true, table = 'kb_version', fields } = {}) {
    const lookups = [];
    const dictionaryQueries = [];
    const references = fields || [
        { name: table, element: 'knowledge', reference: 'kb_knowledge', internal_type: 'reference', column_label: 'Knowledge' },
    ];
    const context = {
        Class: { create: () => function () {} }, AbstractAjaxProcessor: {},
        Object: { extendsObject: (_base, methods) => methods },
        gs: { getProperty: (_name, fallback) => fallback, warn() {} },
        GlideTableHierarchy: function (name) {
            this.getBase = () => name === 'custom_child' ? 'custom_parent' : '';
        },
        GlideRecordSecure: function (recordTable) {
            if (recordTable === 'sys_dictionary') {
                const filters = [];
                let rows = [], index = -1;
                this.addQuery = (...args) => { dictionaryQueries.push(args); filters.push(args); };
                this.addNotNullQuery = field => filters.push([field, 'NOTNULL']);
                this.query = () => {
                    rows = references.filter(row => filters.every(([field, op, value]) =>
                        op === 'IN' ? value.split(',').includes(row[field]) :
                        op === 'NOTNULL' ? !!row[field] : row[field] === op));
                };
                this.next = () => ++index < rows.length;
                this.getValue = field => rows[index][field] || '';
                return;
            }
            this.get = id => {
                lookups.push([recordTable, id]);
                return recordTable === table ? id === 'version-id' : id === 'article-id' && readable;
            };
            this.getValue = field => recordTable === table && ['knowledge', 'inherited', 'duplicate'].includes(field) ? knowledge : '';
            this.getRecordClassName = () => recordTable;
            this.getUniqueValue = () => recordTable === table ? 'version-id' : 'article-id';
            this.getDisplayValue = field => field === 'sys_updated_on' ? '2026-09-28' : 'Knowledge article';
        },
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    const api = context.WidgetEditorAssistantAjax.prototype;
    api.getParameter = key => ({ table, sys_id: 'version-id' })[key];
    api._answer = value => value;
    api._findScriptFields = api._findFieldsOfType = () => [];
    return { result: api.getSuggestedRelated(), lookups, dictionaryQueries };
}

test('Knowledge Version discovers its knowledge reference without a configured rule', () => {
    const { result, lookups } = scan();
    assert.equal(result.success, true);
    assert.deepEqual(JSON.parse(JSON.stringify(result.related)), [{
        table: 'kb_knowledge', sys_id: 'article-id', label: 'Knowledge article',
        category: 'Knowledge (reference)', updatedOn: '2026-09-28',
    }]);
    assert.deepEqual(lookups, [['kb_version', 'version-id'], ['kb_knowledge', 'article-id']]);
});

test('Reference discovery omits empty, missing and unreadable references', () => {
    for (const options of [{ knowledge: '' }, { knowledge: 'missing-id' }, { readable: false }]) {
        const { result } = scan(options);
        assert.equal(result.success, true);
        assert.equal(result.related.length, 0);
    }
});

test('Reference discovery includes inherited fields on arbitrary tables and deduplicates targets', () => {
    const { result, dictionaryQueries } = scan({ table: 'custom_child', fields: [
        { name: 'custom_parent', element: 'inherited', reference: 'custom_record', internal_type: 'reference' },
        { name: 'custom_child', element: 'duplicate', reference: 'custom_record', internal_type: 'reference' },
        { name: 'unrelated', element: 'knowledge', reference: 'wrong_table', internal_type: 'reference' },
    ] });
    assert.equal(result.success, true);
    assert.equal(result.related.length, 1);
    assert.equal(result.related[0].table, 'custom_record');
    assert.ok(dictionaryQueries.some(query => query[0] === 'name' && query[2] === 'custom_child,custom_parent'));
});
