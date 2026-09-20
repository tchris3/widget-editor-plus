const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(
    'src/fluent/generated/other/sys-ui-page/sys_ui_page_widget_editor_assistant.now.ts',
    'utf8'
);

test('Assistant offers table and graph modes for selected records', () => {
    assert.ok(source.includes("ctrl.viewMode = 'table';"));
    assert.ok(source.includes("ctrl.setViewMode('graph')"));
    assert.ok(source.includes('class="btn-group" role="group" aria-label="Record view"'));
    assert.ok(source.includes('class="we-record-graph-canvas"'));
    assert.ok(
        source.includes('return !r.placeholder && r.checked && r.table && r.sys_id;'),
        'Graph nodes must be limited to selected real records'
    );
});

test('Table and graph controls sit beside the Records count', () => {
    const headingStart = source.indexOf('<div class="we-table-heading">');
    const actionsStart = source.indexOf('<div style="display: flex; align-items: center; gap: 1rem;">', headingStart);
    const heading = source.slice(headingStart, actionsStart);

    assert.ok(heading.includes('ng-bind="ctrl.totalRowCount()"'));
    assert.ok(heading.includes('class="btn-group" role="group" aria-label="Record view"'));
});

test('Assistant graph preserves discovered record-to-record links', () => {
    assert.ok(source.includes("var sourceKey = table + ':' + sysId;"));
    assert.ok(source.includes("recordLinks[sourceKey + '>' + key]"));
    assert.ok(source.includes("label: row.category || 'Related'"));
    assert.ok(source.includes('layout.edges.forEach(drawEdge);'));
});

test('Assistant canvas supports zoom, pan, full labels, and per-record actions', () => {
    assert.ok(source.includes("canvas.addEventListener('wheel', onWheel"));
    assert.ok(source.includes("canvas.addEventListener('pointermove', onPointerMove)"));
    assert.ok(source.includes("ctrl.graphCanvasCommand('fit')"));
    assert.ok(source.includes('node.labelLines = wrapText(node.fullLabel'));
    assert.equal(source.includes('labelText: graphText('), false, 'Record names must not be ellipsised');
    assert.ok(source.includes("scope.onScan({ row: action.node.row })"));
    assert.ok(source.includes("scope.onOpen({ row: action.node.row })"));
    assert.ok(source.includes("scope.onRemove({ row: action.node.row })"));
    assert.ok(source.includes("iconClass: 'icon-search'"));
    assert.ok(source.includes("iconClass: 'icon-open-document-new-tab'"));
    assert.ok(source.includes("iconClass: 'icon-cross'"));
    assert.ok(source.includes("button.className = 'btn btn-default btn-icon'"));
});

test('Assistant canvas connects directional ports and fully wraps edge labels', () => {
    assert.ok(source.includes('x1: from.x + from.width'));
    assert.ok(source.includes('x2: to.x'));
    assert.ok(source.includes('if (node.hasIncoming) ports.push(node.x);'));
    assert.ok(source.includes('if (node.hasOutgoing) ports.push(node.x + node.width);'));
    assert.ok(source.includes('byKey[edge.source].hasOutgoing = true;'));
    assert.ok(source.includes('byKey[edge.target].hasIncoming = true;'));
    assert.ok(source.includes('var labelLines = wrapText(label, COLUMN_GAP - 36);'));
    assert.ok(source.includes('labelLines.forEach(function (line, index)'));
});

test('Graph cards mirror recommended metadata and table-view pills', () => {
    assert.ok(source.includes("recommended.className = 'we-graph-recommended-icon'"));
    assert.ok(source.includes("sparkle.className = 'icon-ai-sparkle-fill'"));
    assert.ok(source.includes("className: 'we-pill-primary'"));
    assert.ok(source.includes("className: 'we-pill-blocked'"));
    assert.ok(source.includes("className: 'we-pill-suggested'"));
    assert.ok(source.includes("className: 'we-pill-favourite'"));
    assert.ok(source.includes("className: 'we-pill-update-set'"));
    assert.ok(source.includes("className: 'we-pill-new'"));
    assert.ok(source.includes("className: 'we-pill-deleted'"));
    assert.ok(source.includes('node.height = Math.max(82, 58 + node.labelLines.length * 19 + node.pillLines.length * 26);'));
});

test('Assistant graph refreshes after selection and filter changes', () => {
    const visibleRowsStart = source.indexOf('function recomputeVisibleRows()');
    const visibleRowsEnd = source.indexOf('ctrl.toggleTypeFilter', visibleRowsStart);
    assert.ok(source.slice(visibleRowsStart, visibleRowsEnd).includes('rebuildGraph();'));

    const selectionStart = source.indexOf('ctrl.onSelectionChange = function ()');
    const selectionEnd = source.indexOf('ctrl.updateSetRecordCount', selectionStart);
    assert.ok(source.slice(selectionStart, selectionEnd).includes('rebuildGraph();'));
});

test('Context XML filters dim graph records instead of removing them', () => {
    const graphStart = source.indexOf('function rebuildGraph()');
    const graphEnd = source.indexOf('ctrl.setViewMode', graphStart);
    const graphSource = source.slice(graphStart, graphEnd);

    assert.ok(graphSource.includes('var selected = ctrl.rows.filter'));
    assert.equal(graphSource.includes('var selected = ctrl.visibleRows.filter'), false);
    assert.ok(graphSource.includes('dimmed: !rowMatchesActiveFilter(r)'));
    assert.ok(source.includes('ctx.globalAlpha = node.dimmed ? 0.5 : 1;'));
    assert.ok(source.includes("node.actionGroup.style.opacity = node.dimmed ? '0.5' : '1';"));
});

test('Canvas panning keeps at least one record card visible', () => {
    assert.ok(source.includes('function clampCameraToVisibleNode()'));
    assert.ok(source.includes('var MIN_NODE_VISIBLE = 24;'));

    const pointerStart = source.indexOf('function onPointerMove(event)');
    const pointerEnd = source.indexOf('function onPointerUp(event)', pointerStart);
    assert.ok(source.slice(pointerStart, pointerEnd).includes('clampCameraToVisibleNode();'));

    const zoomStart = source.indexOf('function zoomAt(factor, screenX, screenY)');
    const zoomEnd = source.indexOf('function drawGrid()', zoomStart);
    assert.ok(source.slice(zoomStart, zoomEnd).includes('clampCameraToVisibleNode();'));
});
