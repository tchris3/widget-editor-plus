const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/fluent/generated/other/sys-ui-page/sys_ui_page_widget_editor_code_search.now.ts', 'utf8');

test('Code Search UI hides the classic page response-time widget', () => {
    assert.match(source, /#page_timing_div\s*\{[^}]*display:\s*none\s*!important;/s);
});

test('Code Search UI header toolbar contains progress bar, current table, and animated search glass during search', () => {
    // Toolbar searching elements
    assert.ok(source.includes('class="cs-toolbar-searching-left"'), 'Should include cs-toolbar-searching-left container');
    assert.ok(source.includes('class="cs-toolbar-searching-right"'), 'Should include cs-toolbar-searching-right container');
    assert.ok(source.includes('cs-toolbar-glass-wrap'), 'Should include animated glass wrapper in toolbar');
    assert.ok(source.includes('cs-toolbar-glass-svg'), 'Should include animated search glass SVG');
    assert.ok(source.includes('cs-glass-glow'), 'Should include glass glow pulse element');
    assert.ok(source.includes('cs-toolbar-progress-bar'), 'Should include toolbar progress bar');
    assert.ok(source.includes('ctrl.searchProgress.percent'), 'Progress bar should bind to ctrl.searchProgress.percent');
    assert.ok(source.includes('ctrl.searchProgress.currentTable'), 'Toolbar should display current searching table');

    // Group/Sort select must NOT be displayed during search
    assert.ok(
        source.includes('ng-if="!ctrl.loading" class="cs-toolbar-actions"'),
        'Group/Sort view select should be hidden when ctrl.loading is true'
    );

    // CSS animations
    assert.ok(source.includes('@keyframes csSearchGlassScan'), 'CSS should define csSearchGlassScan animation');
    assert.ok(source.includes('@keyframes csGlassGlowPulse'), 'CSS should define csGlassGlowPulse animation');
});

test('Results pane allows real-time streaming without blocking on ctrl.loading and properly closes welcome state', () => {
    // Welcome state div must properly close before results states
    const welcomeIndex = source.indexOf('class="cs-empty cs-welcome-state"');
    const noResultsIndex = source.indexOf('class="cs-empty cs-no-results-state"');
    assert.ok(welcomeIndex > 0 && noResultsIndex > welcomeIndex, 'Welcome and no-results states present');
    const welcomeBlock = source.slice(welcomeIndex, noResultsIndex);
    assert.ok(welcomeBlock.includes('</div>'), 'Welcome state must have closing </div> before no-results state');

    // Group table view must not gate on !ctrl.loading
    assert.ok(
        source.includes('ng-if="ctrl.hasSearched &amp;&amp; ctrl.viewMode === \'group_table\'"'),
        'Group table view should render in real time without waiting for loading to finish'
    );

    // Date view must not gate on !ctrl.loading
    assert.ok(
        source.includes('ng-if="ctrl.hasSearched &amp;&amp; ctrl.viewMode !== \'group_table\'"'),
        'Flat date view should render in real time without waiting for loading to finish'
    );

    // Tables with results pane header displays records count
    const paneHeaderSnippet = source.slice(
        source.indexOf('class="cs-results-pane-header"'),
        source.indexOf('class="cs-table-list"', source.indexOf('class="cs-results-pane-header"'))
    );
    assert.ok(paneHeaderSnippet.includes('ctrl.sortedResults.length'), 'Pane header should display records (sortedResults) count');
});

test('runSearch logic enables Pane 2 and updates sorted/grouped results in real-time', () => {
    // Check that searchNext updates sortedResults in real time
    const searchNextSnippet = source.slice(
        source.indexOf('function searchNext()'),
        source.indexOf('var workers = [];')
    );
    assert.ok(searchNextSnippet.includes('_updateTablesWithResults();'), 'searchNext should update tablesWithResults');
    assert.ok(searchNextSnippet.includes('_updateGroupedResults();'), 'searchNext should update groupedResults');
    assert.ok(searchNextSnippet.includes('_updateSortedResults();'), 'searchNext should update sortedResults in real time');

    // Check that runSearch opens Pane 2 ("Tables with Results") right at search initiation
    const runSearchInitSnippet = source.slice(
        source.indexOf('vm.runSearch = function ()'),
        source.indexOf('function searchNext()')
    );
    assert.ok(runSearchInitSnippet.includes('vm.paneResultsOpen = true;'), 'runSearch should expand paneResultsOpen immediately');
    assert.ok(runSearchInitSnippet.includes('vm.paneGroupOpen = false;'), 'runSearch should collapse paneGroupOpen immediately');
});

test('inline Monaco find keeps the code-search query instead of seeding from the cursor word', () => {
    const start = source.indexOf('            function _highlightQueryInEditor');
    const end = source.indexOf('            vm.getMonacoHostId', start);
    const helperSource = source.slice(start, end);
    const changes = [];
    const starts = [];
    let genericFindActionReads = 0;
    const vm = { caseSensitive: false };
    const editor = {
        getContribution() {
            return {
                start(options) { starts.push(options); },
                getState() {
                    return { change(update) { changes.push(update); } };
                }
            };
        },
        getAction() {
            genericFindActionReads++;
            return { run() {} };
        },
        revealLineInCenter() {},
        setPosition() {}
    };

    eval(helperSource);
    _highlightQueryInEditor(editor, 'incident', 41);

    assert.equal(starts.length, 1);
    assert.equal(starts[0].seedSearchStringFromSelection, false);
    assert.equal(starts[0].shouldFocus, 1);
    assert.equal(changes[0].searchString, 'incident');
    assert.equal(genericFindActionReads, 0, 'generic Find action would overwrite the query with the cursor word');
});

test('inline Monaco follows the ServiceNow UI theme instead of the Widget Editor+ preference', () => {
    const resolverStart = source.indexOf('            function _getUiMonacoTheme');
    const resolverEnd = source.indexOf('            function _highlightQueryInEditor', resolverStart);
    const resolverSource = source.slice(resolverStart, resolverEnd);
    const createStart = source.indexOf('window.monaco.editor.create(container');
    const createSource = source.slice(createStart, source.indexOf('match._editor = editor;', createStart));

    assert.ok(resolverStart > 0, 'Should define a Code Search UI-theme resolver');
    assert.ok(
        resolverSource.includes("getPropertyValue('--now-color_background--primary')"),
        'Should derive the Monaco theme from the ServiceNow UI background token'
    );
    assert.ok(resolverSource.includes("? 'vs' : 'vs-dark'"), 'Should support both Monaco light and dark themes');
    assert.ok(resolverSource.includes('MutationObserver'), 'Should react when the ServiceNow UI theme changes');
    assert.ok(source.slice(Math.max(0, createStart - 500), createStart).includes('var uiTheme = _getUiMonacoTheme();'), 'Should resolve the UI theme before creating an editor');
    assert.ok(createSource.includes('theme: uiTheme'), 'Should create the editor with the resolved UI theme');
    assert.equal(resolverSource.includes('userPrefs'), false, 'Should not read Widget Editor+ preferences');
    assert.equal(createSource.includes("theme: 'vs-dark'"), false, 'Should not hard-code Monaco to dark mode');
});

test('grouped-results list title remains valid Jelly markup', () => {
    const badgeStart = source.indexOf('<a class="cs-table-group-badge"');
    const badgeEnd = source.indexOf('</a>', badgeStart);
    const badgeSource = source.slice(badgeStart, badgeEnd);

    assert.ok(badgeStart > 0, 'Should render the grouped-results list link');
    assert.equal(badgeSource.includes('<span'), false, 'An HTML element cannot appear inside the title attribute');
    assert.ok(
        badgeSource.includes("title=\"Open {{group.tableLabel}} list{{ctrl.caseSensitive ? '' : ' (case insensitive)'}}\""),
        'The conditional title should use a valid Angular expression'
    );
});

test('condition term input uses bounded intrinsic content sizing', () => {
    const ruleStart = source.indexOf('        .cs-cond-term {');
    const ruleEnd = source.indexOf('        }', ruleStart);
    const ruleSource = source.slice(ruleStart, ruleEnd);

    assert.ok(ruleStart > 0, 'Should define condition-term sizing');
    assert.ok(ruleSource.includes('min-width: 12rem;'), 'Should retain a usable minimum width');
    assert.ok(ruleSource.includes('width: 30rem;'), 'Should have a 30rem default/fallback width');
    assert.ok(ruleSource.includes('field-sizing: content;'), 'Should size to the entered term when supported');
    assert.equal(ruleSource.includes('max-width: 30rem;'), false, 'Content growth should not be capped at 30rem');
    assert.equal(ruleSource.includes('flex: 1;'), false, 'Row flex space should not override intrinsic sizing');
});

test('opening an inline Monaco editor is disabled while search is running', () => {
    const disabledBindings = source.match(/ng-disabled="ctrl\.loading &amp;&amp; !match\.expanded"/g) || [];
    const toggleStart = source.indexOf('            vm.toggleMatchExpand = function');
    const toggleEnd = source.indexOf('            vm.collapseMatch = function', toggleStart);
    const toggleSource = source.slice(toggleStart, toggleEnd);

    assert.equal(disabledBindings.length, 2, 'Both result layouts should disable their expand controls while searching');
    assert.ok(
        source.includes("ctrl.loading ? 'Available when search completes' : 'View entire field'"),
        'Disabled controls should explain when the full-field view becomes available'
    );
    assert.ok(toggleSource.includes('if (vm.loading) return;'), 'The controller should also reject expansion while searching');
    assert.ok(
        toggleSource.indexOf('if (match.expanded)') < toggleSource.indexOf('if (vm.loading) return;'),
        'An already-open editor should remain collapsible while searching'
    );
});

test('light mode does not expose a dark surface while inline Monaco mounts', () => {
    const cssStart = source.indexOf('        .cs-inline-monaco-wrap {');
    const cssEnd = source.indexOf('        /* Drawer / Flyout Panel */', cssStart);
    const inlineMonacoCss = source.slice(cssStart, cssEnd);
    const createStart = source.indexOf('window.monaco.editor.create(container');
    const beforeCreate = source.slice(Math.max(0, createStart - 500), createStart);

    assert.ok(
        inlineMonacoCss.includes('background: rgb(var(--now-color_background--primary'),
        'The empty Monaco surface should use the current UI background'
    );
    assert.equal(inlineMonacoCss.includes('#1e1e1e'), false, 'The mounting surface should not be hard-coded dark');
    assert.ok(
        beforeCreate.includes('window.monaco.editor.setTheme(uiTheme);'),
        'The UI theme should be active before Monaco creates its DOM'
    );
});
