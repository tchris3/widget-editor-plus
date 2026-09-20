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
        source.includes('return !r.placeholder && r.table && r.sys_id;'),
        'Graph includes unchecked records so they can be selected'
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
    assert.ok(source.includes('layout.edges.forEach(drawEdgeLine);'));
    assert.ok(source.includes('layout.edges.forEach(drawEdgeLabel);'));
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
    assert.ok(source.includes('var x1 = from.x + from.width;'));
    assert.ok(source.includes('var x2 = to.x;'));
    assert.ok(source.includes('if (node.hasIncoming) ports.push(node.x);'));
    assert.ok(source.includes('if (node.hasOutgoing) ports.push(node.x + node.width);'));
    assert.ok(source.includes('from.hasOutgoing = true;'));
    assert.ok(source.includes('to.hasIncoming = true;'));
    assert.ok(source.includes('var labelLines = wrapText(label, COLUMN_GAP - 36);'));
    assert.ok(source.includes('labelLines.forEach(function (line, index)'));
});

test('Graph cards show the recommended icon without duplicating its pill', () => {
    assert.ok(source.includes("recommended.className = 'we-graph-recommended-icon'"));
    assert.ok(source.includes("sparkle.className = 'icon-ai-sparkle-fill'"));
    const pillsStart = source.indexOf('function pillDefinitions(node)');
    const pillsEnd = source.indexOf('function createPill(definition)', pillsStart);
    assert.equal(source.slice(pillsStart, pillsEnd).includes("className: 'we-pill-suggested'"), false);
});

test('Graph cards mirror the remaining table-view pills', () => {
    assert.ok(source.includes("className: 'we-pill-primary'"));
    assert.ok(source.includes("className: 'we-pill-blocked'"));
    assert.ok(source.includes("className: 'we-pill-favourite'"));
    assert.ok(source.includes("className: 'we-pill-update-set'"));
    assert.ok(source.includes("className: 'we-pill-new'"));
    assert.ok(source.includes("className: 'we-pill-deleted'"));
    assert.ok(source.includes('node.height = Math.max(82, 58 + node.labelLines.length * 19 + node.fieldHeight + node.pillLines.length * 26);'));
});

test('Canvas colours come only from live ServiceNow theme variables', () => {
    const directiveStart = source.indexOf("weAssistantApp.directive('weRecordGraphCanvas'");
    const directiveEnd = source.indexOf('// Directive: weModalDraggable', directiveStart);
    const directive = source.slice(directiveStart, directiveEnd);
    assert.ok(directive.includes("cssColour('--now-color_background--secondary')"));
    assert.ok(directive.includes("cssColour('--now-color_background--primary')"));
    assert.ok(directive.includes("cssColour('--now-color_text--primary')"));
    assert.ok(directive.includes("cssColour('--now-color_border--tertiary')"));
    assert.ok(directive.includes("cssColour('--now-color--primary-1')"));
    assert.ok(directive.includes("cssColour('--now-color_alert--positive-0')"));
    assert.ok(directive.includes("cssColour('--now-color_alert--critical-0')"));
    assert.equal(/#[0-9a-f]{3,8}/i.test(directive), false);
    assert.equal(/rgba\(/.test(directive), false);
    assert.ok(directive.includes('refreshThemeColours();'));
    assert.ok(directive.includes('new MutationObserver(function ()'));
});

test('Canvas highlights new and deleted records with ServiceNow status colours', () => {
    assert.ok(source.includes('isNew: !!ctrl.includePreviousUpdates && !!r.isNewInUpdateSet'));
    assert.ok(source.includes("isDeleted: r.updateSetAction === 'DELETE'"));
    assert.ok(source.includes('if (node.isNew && node.isDeleted)'));
    assert.ok(source.includes('colours.positiveSurface, colours.criticalSurface'));
    assert.ok(source.includes('if (node.isDeleted) return colours.criticalSurface;'));
    assert.ok(source.includes('if (node.isNew) return colours.positiveSurface;'));
    assert.ok(source.includes('ctx.fillStyle = nodeFillStyle(ctx, node);'));
    assert.ok(source.includes('(node.isNew || node.isDeleted) ? nodeFillStyle(minimapCtx, node)'));
});

test('Canvas retains its dot grid and uses the smaller minimap', () => {
    assert.ok(source.includes('ctx.fillStyle = colours.secondaryText;'));
    assert.ok(source.includes('ctx.globalAlpha = 0.2;'));
    assert.ok(source.includes('ctx.arc(x, y, 0.85 / camera.scale'));
    const minimapCssStart = source.indexOf('.we-graph-minimap {');
    const minimapCssEnd = source.indexOf('}', minimapCssStart);
    const minimapCss = source.slice(minimapCssStart, minimapCssEnd);
    assert.ok(minimapCss.includes('width: 8rem;'));
    assert.ok(minimapCss.includes('height: 5.25rem;'));
});

test('Graph metadata updates draw atomically without flashing overlays at the origin', () => {
    const rebuildStart = source.indexOf('function rebuildActionButtons()');
    const rebuildEnd = source.indexOf('function buildLayout()', rebuildStart);
    assert.ok(source.slice(rebuildStart, rebuildEnd).includes("actionLayer.style.visibility = 'hidden';"));

    const drawStart = source.indexOf('function draw()');
    const drawEnd = source.indexOf('function resize()', drawStart);
    assert.ok(source.slice(drawStart, drawEnd).includes("actionLayer.style.visibility = 'visible';"));

    const watchStart = source.indexOf("scope.$watch('graph'");
    const watchEnd = source.indexOf("scope.$watch('command'", watchStart);
    const watchSource = source.slice(watchStart, watchEnd);
    assert.ok(watchSource.includes('resize();'));
    assert.ok(watchSource.includes('if (topologyChanged) fitGraph();'));
    assert.ok(watchSource.includes('lastTopologySignature = topologySignature;'));
});

test('Previous-version toggle refreshes graph pills immediately and after loading', () => {
    const toggleStart = source.indexOf('ctrl.toggleIncludePreviousUpdates = function ()');
    const toggleEnd = source.indexOf('ctrl.generateXml', toggleStart);
    const toggleSource = source.slice(toggleStart, toggleEnd);
    assert.ok(toggleSource.includes('rebuildGraph();'));
    assert.ok(toggleSource.indexOf('rebuildGraph();') < toggleSource.indexOf('ensurePreviousVersionsForVisible();'));

    const refreshStart = source.indexOf('async function refreshPreviousVersions(rows)');
    const refreshEnd = source.indexOf('function ensurePreviousVersionsForVisible()', refreshStart);
    const refreshSource = source.slice(refreshStart, refreshEnd);
    assert.ok(refreshSource.includes("if (ctrl.viewMode === 'graph') rebuildGraph();"));
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
    assert.ok(graphSource.includes('dimmed: (!r.checked && !r.partiallyChecked) || !rowMatchesActiveFilter(r)'));
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

test('Canvas provides an interactive minimap overview', () => {
    assert.ok(source.includes("minimap.className = 'we-graph-minimap'"));
    assert.ok(source.includes('function drawMinimap()'));
    assert.ok(source.includes('layout.edges.forEach(function (edge)'));
    assert.ok(source.includes('layout.nodes.forEach(function (node)'));
    assert.ok(source.includes('var worldLeft = -camera.x / camera.scale;'));
    assert.ok(source.includes('function panFromMinimap(event)'));
    assert.ok(source.includes("minimap.addEventListener('pointerdown', onMinimapPointerDown)"));
    assert.ok(source.includes("minimap.addEventListener('pointermove', onMinimapPointerMove)"));
    assert.ok(source.includes('clampCameraToVisibleNode();'));
});
