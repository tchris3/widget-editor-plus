const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const serverSource = fs.readFileSync(
    'src/fluent/generated/server-development/script-include/sys_script_include_widget_editor_code_search.server.js',
    'utf8'
);
const pageSource = fs.readFileSync(
    'src/fluent/generated/other/sys-ui-page/sys_ui_page_widget_editor_code_search.now.ts',
    'utf8'
);

function searchOneScript(script, query) {
    let configRead = false;
    let recordRead = false;

    function GlideRecord(table) {
        if (table === 'sn_codesearch_table') {
            return {
                addQuery() {},
                orderBy() {},
                query() {},
                next() { if (configRead) return false; configRead = true; return true; },
                getUniqueValue() { return 'config-id'; },
                getValue(field) {
                    return { table: 'x_test_script', search_fields: 'script', additional_filter: '' }[field] || '';
                }
            };
        }
        return {
            addQuery() { return { addOrCondition() {} }; },
            addEncodedQuery() {},
            setLimit() {},
            query() {},
            next() { if (recordRead) return false; recordRead = true; return true; },
            isValidField(field) { return field === 'script'; },
            getValue(field) { return field === 'script' ? script : ''; },
            getDisplayValue(field) { return field ? '' : 'Example'; },
            getElement() { return { getLabel() { return 'Script'; } }; },
            getUniqueValue() { return 'record-id'; }
        };
    }

    const context = {
        AbstractAjaxProcessor: {},
        Class: { create() { return function WidgetEditorCodeSearchAjax() {}; } },
        GlideRecord,
        JSON,
        encodeURIComponent
    };
    context.Object = Object.create(Object);
    context.Object.extendsObject = (_base, members) => members;
    vm.runInNewContext(serverSource, context);

    const instance = new context.WidgetEditorCodeSearchAjax();
    instance._getParam = name => ({
        group_id: 'a'.repeat(32),
        query,
        limit: '10',
        secondary_filters: '[]'
    }[name] || '');
    instance._validTable = () => true;
    instance._validFields = () => ['script'];
    instance._validateFilter = () => ({ valid: true });
    instance._getTableDisplayConfig = () => ({ primaryField: '', secondaryFields: [] });
    instance._tableLabel = () => 'Test script';
    instance._answer = value => value;
    return instance.search().results[0].matches[0];
}

test('nearby keyword matches extend one continuous snippet instead of leaving tiny holes', () => {
    const lines = Array.from({ length: 21 }, (_, index) => {
        const line = index + 1;
        return [3, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 19].includes(line)
            ? `line ${line}: incident`
            : `line ${line}`;
    });
    const match = searchOneScript(lines.join('\n'), 'incident');

    assert.deepEqual(Array.from(match.lines, line => line.num), Array.from({ length: 21 }, (_, i) => i + 1));
    assert.equal(match.lines.some(line => line.separator), false);
    assert.equal(match.allLinesShown, true);
});

test('a separator remains when keyword matches have a genuinely large gap', () => {
    const lines = Array.from({ length: 30 }, (_, index) =>
        [3, 25].includes(index + 1) ? `line ${index + 1}: incident` : `line ${index + 1}`
    );
    const match = searchOneScript(lines.join('\n'), 'incident');
    const separatorIndex = match.lines.findIndex(line => line.separator);

    assert.ok(separatorIndex > 0);
    assert.equal(match.lines[separatorIndex - 1].num, 5);
    assert.equal(match.lines[separatorIndex + 1].num, 23);
    assert.equal(match.allLinesShown, false);
});

test('a few omitted lines are cheaper to show than to replace with a separator', () => {
    const lines = Array.from({ length: 12 }, (_, index) =>
        [3, 10].includes(index + 1) ? `line ${index + 1}: incident` : `line ${index + 1}`
    );
    const match = searchOneScript(lines.join('\n'), 'incident');

    assert.deepEqual(Array.from(match.lines, line => line.num), Array.from({ length: 12 }, (_, i) => i + 1));
    assert.equal(match.lines.some(line => line.separator), false);
    assert.equal(match.allLinesShown, true);
});

test('snippet separator is a shared row spanning gutter and code', () => {
    assert.ok(pageSource.includes('.cs-code-row.cs-sep::after'));
    assert.equal(pageSource.includes('.cs-gutter-num.cs-sep::after'), false);
    assert.equal(pageSource.includes('.cs-code-line.cs-sep::after'), false);
    assert.equal((pageSource.match(/class="cs-code-row" ng-class="\{'cs-sep': line\.separator\}"/g) || []).length, 2);
});

test('line-number gutter spans the snippet padding without removing that spacing', () => {
    assert.ok(pageSource.includes('padding: 0.45rem 0;'));
    assert.ok(pageSource.includes('.cs-code-editor-box.cs-has-gutter::before'));
    assert.ok(pageSource.includes('inset: 0 auto 0 0;'));
    assert.equal((pageSource.match(/class="cs-code-editor-box" ng-class="\{'cs-has-gutter':/g) || []).length, 2);

    const gutterRule = pageSource.slice(
        pageSource.indexOf('        .cs-gutter-num {'),
        pageSource.indexOf('        .cs-code-line {')
    );
    assert.equal(gutterRule.includes('background:'), false);
    assert.equal(gutterRule.includes('border-right:'), false);
});

test('snippet lines retain block-comment context from outside the visible excerpt', () => {
    const match = searchOneScript([
        '/* documentation',
        ' * first detail',
        ' * second detail',
        ' * incident handling detail',
        ' */',
        'var active = true;'
    ].join('\n'), 'incident');

    assert.equal(match.lines.find(line => line.num === 2).inBlockComment, true);
    assert.equal(match.lines.find(line => line.num === 4).inBlockComment, true);
    assert.equal(match.lines.find(line => line.num === 5).inBlockComment, true);
    assert.equal(match.lines.find(line => line.num === 6).inBlockComment, false);
});

test('comment-like delimiters inside strings do not alter following line context', () => {
    const match = searchOneScript([
        'var example = "/* not a comment";',
        'var path = "// also not a comment";',
        'var incident = true;'
    ].join('\n'), 'incident');

    assert.equal(match.lines.every(line => line.inBlockComment === false), true);
});

test('code snippet renderer applies syntax classes while preserving search highlights', () => {
    assert.ok(pageSource.includes('.cs-token-comment'));
    assert.ok(pageSource.includes('.cs-token-string'));
    assert.ok(pageSource.includes('.cs-token-keyword'));
    assert.ok(pageSource.includes('vm.highlightCode = function'));
    assert.equal((pageSource.match(/ctrl\.highlightCode\(/g) || []).length, 4);
    assert.ok(pageSource.includes('<mark class="cs-highlight">'));
});
