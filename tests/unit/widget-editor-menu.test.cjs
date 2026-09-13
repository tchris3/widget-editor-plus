const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(
    'src/fluent/generated/other/sys-ui-page/sys_ui_page_8b2e70458373fe1070b8b5dfeeaad35e.now.ts',
    'utf8'
);

test('Code search follows Keyboard shortcuts in the Widget Editor+ menu', () => {
    const keyboard = source.indexOf('>Keyboard shortcuts</div>');
    const codeSearch = source.indexOf('ng-click="openCodeSearch()">Code Search+');
    const apiDocs = source.indexOf('ng-click="openApiDocs()">API documentation');

    assert.ok(keyboard >= 0, 'Keyboard shortcuts menu item should exist');
    assert.ok(codeSearch > keyboard, 'Code Search should follow Keyboard shortcuts');
    assert.ok(apiDocs > codeSearch, 'Code Search should precede API documentation');
});

test('Code search opens its UI Page record in a new tab and closes the menu', () => {
    const functionStart = source.indexOf('$scope.openCodeSearch = function () {');
    const functionEnd = source.indexOf('$scope.openApiDocs = function () {', functionStart);
    const implementation = source.slice(functionStart, functionEnd);

    assert.ok(functionStart >= 0 && functionEnd > functionStart, 'openCodeSearch should exist');
    assert.ok(
        implementation.includes(
            "'/nav_to.do?uri=ui_page.do%3Fsys_id%3De7d81afae74144a89136e51d5cc38c09'"
        )
    );
    assert.ok(implementation.includes("'_blank'"));
    assert.ok(implementation.includes("'noopener,noreferrer'"));
    assert.ok(implementation.includes('$scope.openDropdown = null;'));
});
