function link(scope, element, attrs, controller) {
    'use strict';

    if (scope.data.hasAccess === false) {
        return;
    }

    const spUtil = $injector.get('spUtil');

    ///////////////////////////////////////////
    // 1. Guard / singleton setup
    ///////////////////////////////////////////

    if (window._weDebugMenuPatch) {
        return;
    }
    window._weDebugMenuPatch = true;

    (function preloadIcons() {
        const el = document.createElement('div');
        el.setAttribute('aria-hidden', 'true');
        el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
        el.innerHTML = '<i class="icon-cog"></i><i class="icon-cog-selected"></i><i class="icon-open-document-new-tab"></i>';
        document.body.appendChild(el);
    }());

    (function injectContextMenuStyles() {
        const style = document.createElement('style');
        style.setAttribute('data-we-context-menu', '1');
        style.textContent = [
            'body > [role="contentinfo"].dropdown .dropdown-menu { padding: 0; background: rgba(255,255,255,0.85); border-radius: 16px; box-shadow: 0 4px 30px rgba(0,0,0,0.1); backdrop-filter: blur(8px) brightness(150%); -webkit-backdrop-filter: blur(8px) brightness(150%); border: 1px solid rgba(255,255,255,0.5); }',
            'body > [role="contentinfo"].dropdown .dropdown-menu .divider { margin: 0; }',
            'body > [role="contentinfo"].dropdown .dropdown-menu > li { margin: 0 !important; }',
            'body > [role="contentinfo"].dropdown .dropdown-menu > li > a { padding: .75em 1.25em; line-height: 1; }',
            'body > [role="contentinfo"].dropdown .dropdown-menu > li > a:hover, body > [role="contentinfo"].dropdown .dropdown-menu > li > a:focus { background-color: rgba(0,0,0,0.05); }',
            'body > [role="contentinfo"].dropdown .dropdown-menu { overscroll-behavior: none; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent; }',
            'body > [role="contentinfo"].dropdown .dropdown-menu::-webkit-scrollbar { width: 4px; }',
            'body > [role="contentinfo"].dropdown .dropdown-menu::-webkit-scrollbar-track { background: transparent; }',
            'body > [role="contentinfo"].dropdown .dropdown-menu::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); border-radius: 4px; }'
        ].join(' ');
        document.head.appendChild(style);
    }());


    ///////////////////////////////////////////
    // 2. Constants
    ///////////////////////////////////////////

    const SHOW_SCOPE_MENUS_KEY = 'showScopeMenus';
    const WIDGET_OBSERVER_DELAY = 1000; // ms – wait for Angular to finish linking
    const PROCESSING_TIMEOUT_MS = 500;  // ms – abort slow scope serialisation
    const MAX_SCOPE_DEPTH = 5;    // max recursion depth for removeFunctions / deepSearch
    const MAX_SCOPE_PROPS = 100;  // max top-level scope properties collected
    const MAX_OBJ_PROPS = 50;   // max properties serialised per nested object
    const MAX_ARRAY_ITEMS = 50;   // max array items serialised
    const MAX_TREE_KEYS = 100;  // max keys rendered in a single tree node
    const MAX_SEARCH_RESULTS = 100;  // max deepSearch hits returned
    const STRING_PREVIEW_LENGTH = 50;   // chars shown before "show more"
    const NESTED_COLORS = ['#28a745', '#dc3545', '#fd7e14', '#6f42c1', '#20c997'];
    const ROOT_BUTTON_COLOR = '#007bff';
    const MONOSPACE_FONTS = 'ui-monospace,Menlo,Monaco,"Cascadia Mono","Segoe UI Mono","Roboto Mono","Oxygen Mono","Ubuntu Mono","Source Code Pro","Fira Mono","Droid Sans Mono","Consolas","Courier New",monospace';

    ///////////////////////////////////////////
    // 2b. Native SP menu item matchers
    ///////////////////////////////////////////

    /*
     * Each entry maps a preference ID to a function that returns true when the
     * anchor text of a native SP debug menu item matches.  Used by
     * filterNativeItems() to remove disabled items from the overlay.
     */
    const NATIVE_ITEM_MATCHERS = [
        { id: 'instanceOptions', match: (t) => t === 'Instance Options' },
        { id: 'instanceInPageEditor', match: (t) => t.startsWith('Instance in Page Editor') },
        { id: 'pageInDesigner', match: (t) => t.startsWith('Page in Designer') },
        { id: 'showWidgetCustomizations', match: (t) => t === 'Show Widget Customizations' || t === 'Hide Widget Customizations' },
        { id: 'editContainerBackground', match: (t) => t === 'Edit Container Background' },
        { id: 'widgetOptionsSchema', match: (t) => t === 'Widget Options Schema' },
        // Exact matches required: "$scope" is a prefix of "$scope.data"
        { id: 'logScopeData', match: (t) => t === 'Log to console: $scope.data' },
        { id: 'logScope', match: (t) => t === 'Log to console: $scope' }
    ];

    ///////////////////////////////////////////
    // 3. Editor URL helpers
    ///////////////////////////////////////////

    /**
     * Returns the Widget Editor+ URL for the given widget sys_id.
     * Uses the current NOW.scope to build a scoped page ID where applicable.
     * @param   {string} sysId  Widget sys_id.
     * @returns {string}
     */
    function getEditorPlusUrl(sysId) {
        return '/ui_page.do?sys_id=8b2e70458373fe1070b8b5dfeeaad35e&widget_id=' + encodeURIComponent(sysId);
    }


    /**
     * Returns the Service Portal Widget Editor URL (/sp_config) for the given widget sys_id.
     * @param   {string} sysId  Widget sys_id.
     * @returns {string}
     */
    function getSPEditorUrl(sysId) {
        return '/sp_config?id=widget_editor&sys_id=' + encodeURIComponent(sysId);
    }


    /**
     * Returns the platform (classic UI) form URL for the given widget sys_id.
     * @param   {string} sysId  Widget sys_id.
     * @returns {string}
     */
    function getEditorPlatformUrl(sysId) {
        return '/nav_to.do?uri=sp_widget.do%3Fsys_id=' + encodeURIComponent(sysId);
    }


    /**
     * Assigns value to window[name] so it's available in DevTools.
     * Direct assignment (not a getter) so DevTools can enumerate properties
     * and show autocomplete suggestions for window.$scope / window.$rootScope.
     * Angular scope objects are mutated in-place by the digest cycle, so the
     * reference stays current without needing to re-evaluate a getter.
     * Silently ignores failures (e.g. non-writable built-ins).
     */
    function assignConsoleVar(name, value) {
        try {
            window[name] = value;
        } catch (_e) { /* non-writable property — skip */ }
    }


    ///////////////////////////////////////////
    // 4. Menu item configuration
    ///////////////////////////////////////////

    /*
     * Each entry has:
     *   id         – matches the key in controller.preferences
     *   label      – text shown in the debug context menu (string or fn returning string)
     *   fn         – callback invoked by SP's debug menu
     *   condition  – optional fn returning bool; item hidden when false
     *   alwaysShow – true means never filtered out by preferences
     */
    const MENU_ITEM_CONFIGS = [
        {
            id: 'showScopeButtons',
            label: function () {
                return document.querySelector('.scope-context-menu-button, .scope-context-menu')
                    ? 'Hide scope buttons'
                    : 'Show scope buttons';
            },
            fn: function (_s, _e) {
                const existing = document.querySelectorAll('.scope-context-menu-button, .scope-context-menu');
                if (existing.length > 0) {
                    localStorage.setItem(SHOW_SCOPE_MENUS_KEY, 'false');
                    existing.forEach((el) => { el.remove(); });
                } else {
                    addScopeButtons();
                    localStorage.setItem(SHOW_SCOPE_MENUS_KEY, 'true');
                }
            }
        },
        {
            id: 'showWidgetLoadTimes',
            label: function () {
                return _loadTimesActive ? 'Hide load times' : 'Show load times';
            },
            fn: function () {
                if (_loadTimesActive) {
                    deactivateLoadTimes();
                } else {
                    activateLoadTimes();
                }
            }
        },
    ];

    /**
     * Returns the subset of MENU_ITEM_CONFIGS that should appear in the
     * debug context menu right now, based on stored preferences and URL state.
     * Each entry is the [label, fn] pair that SP's spWidgetDebug expects.
     * @returns {Array}
     */
    function getFilteredMenuItems() {
        const prefs = controller.preferences || {};
        return MENU_ITEM_CONFIGS
            .filter((item) => {
                if (item.alwaysShow) {
                    return true;
                }
                if (prefs[item.id] === false) {
                    return false;
                }
                if (item.condition && !item.condition()) {
                    return false;
                }
                return true;
            })
            .map((item) => {
                const label = typeof item.label === 'function' ? item.label() : item.label;
                return [label, item.fn];
            });
    }


    ///////////////////////////////////////////
    // 4b. Widget load times
    ///////////////////////////////////////////

    // Adapted from: https://support.servicenow.com/kb?id=kb_article_view&sysparm_article=KB0744521

    let _loadTimesActive = false;
    const _WE_LT = 'data-we-load-times'; // attribute used to tag every injected element
    const _WE_LT_THRESHOLD = 750;        // ms — widgets at or above this are highlighted red

    /**
     * Activates the widget load-time overlay mode.
     * Outlines every [widget] element on the page, injects a bar into each
     * showing its name and measured server refresh time, and displays a
     * summary panel for any widgets that exceed the slow threshold.
     */
    function activateLoadTimes() {
        _loadTimesActive = true;

        // Style: outline widgets and ensure relative positioning for the overlay bar.
        const style = document.createElement('style');
        style.setAttribute(_WE_LT, '1');
        style.textContent = '[widget="widget"] { outline: 1px dashed rgba(200,0,0,0.5) !important; position: relative !important; }';
        document.head.appendChild(style);

        const widgets = Array.from(document.querySelectorAll('[widget="widget"]'));
        const widgetData = [];

        (async function () {
            for (const widgetEl of widgets) {
                let s;
                try {
                    s = angular.element(widgetEl).scope();
                    if (!s || !s.widget) {
                        continue;
                    }
                } catch (_ex) { continue; }

                const widget = s.widget;
                const uid = (widget.rectangle_id || 'w') + '_' + s.$id;

                // Overlay bar
                const bar = document.createElement('div');
                bar.setAttribute(_WE_LT, '1');
                bar.style.cssText = [
                    'position:absolute;top:0;left:0;right:0;z-index:9999;',
                    'background:rgba(255,255,255,0.93);',
                    'border-bottom:1px dashed rgba(200,0,0,0.4);',
                    'padding:2px 8px;font-size:11px;line-height:20px;',
                    'display:flex;align-items:center;gap:8px;font-family:' + MONOSPACE_FONTS + ';',
                ].join('');

                // Widget name → editor link
                const nameLink = document.createElement('a');
                nameLink.href = getEditorPlusUrl(widget.sys_id);
                nameLink.target = '_blank';
                nameLink.textContent = widget.name;
                nameLink.style.fontWeight = 'bold';
                bar.appendChild(nameLink);

                // Log scope link
                const logLink = document.createElement('a');
                logLink.href = 'javascript:void(0)';
                logLink.textContent = 'Log scope';
                logLink.style.color = '#666';
                (function (capturedScope) {
                    logLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.info(capturedScope);
                    });
                })(s);
                bar.appendChild(logLink);

                // Load time indicator (right-aligned, filled after refresh)
                const timeSpan = document.createElement('span');
                timeSpan.id = 'we-lt-' + uid;
                timeSpan.style.cssText = 'margin-left:auto;color:#aaa;';
                timeSpan.textContent = '\u2026';
                bar.appendChild(timeSpan);

                // Refresh button
                const refreshBtn = document.createElement('button');
                refreshBtn.textContent = '\u27f3';
                refreshBtn.title = 'Re-measure load time';
                refreshBtn.style.cssText = 'border:1px solid #ccc;background:#fff;border-radius:50%;width:18px;height:18px;line-height:1;font-size:12px;cursor:pointer;padding:0;flex-shrink:0;';
                (function (capturedScope, capturedSpan) {
                    refreshBtn.addEventListener('click', function () {
                        capturedSpan.textContent = '\u2026';
                        capturedSpan.style.color = '#aaa';
                        const t0 = performance.now();
                        capturedScope.server.refresh().then(function () {
                            const ms = parseInt(performance.now() - t0);
                            capturedSpan.textContent = ms + 'ms';
                            capturedSpan.style.color = ms >= _WE_LT_THRESHOLD ? 'red' : 'green';
                        });
                    });
                })(s, timeSpan);
                bar.appendChild(refreshBtn);

                widgetEl.appendChild(bar);

                // Measure load time for non-nested widgets
                const isNested = !!(s.$parent && s.$parent.widget);
                if (!isNested) {
                    timeSpan.textContent = 'refreshing\u2026';
                    const t0 = performance.now();
                    try { await s.server.refresh(); } catch (_ex) { }
                    const ms = parseInt(performance.now() - t0);
                    timeSpan.textContent = ms + 'ms';
                    timeSpan.style.color = ms >= _WE_LT_THRESHOLD ? 'red' : 'green';
                    widgetData.push({ name: widget.name, sys_id: widget.sys_id, rectangle: widget.rectangle_id || '', load_time_ms: ms });
                }
            }

            // Summary panel
            const slow = widgetData.filter((e) => e.load_time_ms >= _WE_LT_THRESHOLD);
            slow.sort((a, b) => b.load_time_ms - a.load_time_ms);

            const panel = document.createElement('div');
            panel.setAttribute(_WE_LT, '1');
            panel.style.cssText = [
                'position:fixed;bottom:20px;right:20px;z-index:99999;',
                'background:#fff;border:1px solid #ccc;border-radius:6px;',
                'padding:14px 16px 12px;font-size:12px;font-family:' + MONOSPACE_FONTS + ';',
                'max-width:480px;box-shadow:0 2px 10px rgba(0,0,0,0.15);'
            ].join('');

            const titleEl = document.createElement('strong');
            titleEl.textContent = slow.length > 0
                ? 'Slow widgets (>' + _WE_LT_THRESHOLD + 'ms)'
                : 'No slow widgets found (\u2265' + _WE_LT_THRESHOLD + 'ms)';
            panel.appendChild(titleEl);

            if (slow.length > 0) {
                const table = document.createElement('table');
                table.style.cssText = 'margin-top:8px;border-collapse:collapse;width:100%;';
                table.innerHTML = '<thead><tr>' +
                    '<th style="padding:3px 6px;text-align:left;">Name</th>' +
                    '<th style="padding:3px 6px;text-align:right;">Load (ms)</th>' +
                    '</tr></thead>';
                const tbody = document.createElement('tbody');
                slow.forEach((e) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = '<td style="padding:3px 6px;"><a href="/nav_to.do?uri=sp_widget.do%3Fsys_id%3D' + encodeURIComponent(e.sys_id) + '" target="_blank">' + escapeHtml(e.name) + '</a></td>' +
                        '<td style="padding:3px 6px;text-align:right;color:red;">' + e.load_time_ms + '</td>';
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                panel.appendChild(table);

            }

            // Dismiss button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '\u00d7';
            closeBtn.title = 'Dismiss';
            closeBtn.style.cssText = 'position:absolute;top:6px;right:8px;background:none;border:none;font-size:16px;line-height:1;cursor:pointer;';
            closeBtn.addEventListener('click', function () { panel.parentNode && panel.parentNode.removeChild(panel); });
            panel.appendChild(closeBtn);

            document.body.appendChild(panel);
        })();
    }

    /**
     * Deactivates the widget load-time overlay mode and removes all injected
     * elements (outlines, per-widget bars, summary panel).
     */
    function deactivateLoadTimes() {
        _loadTimesActive = false;
        // Remove every element tagged with _WE_LT (style, bars, panel).
        document.querySelectorAll('[' + _WE_LT + ']').forEach((el) => {
            el.parentNode && el.parentNode.removeChild(el);
        });
    }


    ///////////////////////////////////////////
    // 5. Widget load observer
    ///////////////////////////////////////////

    /*
     * Watches for [widget] elements being added to the DOM, then attaches a
     * getter-based _debugContextMenu so the list is always freshly filtered.
     */
    (function initWidgetObserver() {
        const observer = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('widget')) {
                        setTimeout(function () {
                            const s = angular.element(node).scope();
                            if (s && s.widget && !s.widget._customEnhancement) {
                                s.widget._customEnhancement = true;

                                // Stable ref — cleared+refilled in place by the setter so bindings below stay valid.
                                const _widgetItems = (function () {
                                    try {
                                        const v = s.widget._debugContextMenu;
                                        return Array.isArray(v) ? v.slice() : [];
                                    } catch (_) { return []; }
                                }());

                                // Proxy routes mutators to _widgetItems so assign-empty-then-push patterns persist.
                                const _MUTATOR_FNS = {
                                    push: Array.prototype.push.bind(_widgetItems),
                                    unshift: Array.prototype.unshift.bind(_widgetItems),
                                    splice: Array.prototype.splice.bind(_widgetItems),
                                    pop: Array.prototype.pop.bind(_widgetItems),
                                    shift: Array.prototype.shift.bind(_widgetItems)
                                };
                                /* Compute the merged view: WE+ items + (own or inherited) widget items.
                                   Some widgets push onto an ancestor widget rather than their own
                                   _debugContextMenu, so when our own list is empty we walk up the
                                   scope chain to find an enhanced ancestor's items. */
                                function _getMergedItems() {
                                    const ours = getFilteredMenuItems();
                                    let widgetSpecific = _widgetItems;
                                    if (!widgetSpecific.length) {
                                        let ps = s.$parent;
                                        while (ps) {
                                            if (ps.widget && ps.widget._customEnhancement &&
                                                Array.isArray(ps.widget._weWidgetItems) &&
                                                ps.widget._weWidgetItems.length) {
                                                widgetSpecific = ps.widget._weWidgetItems;
                                                break;
                                            }
                                            ps = ps.$parent;
                                        }
                                    }
                                    if (!widgetSpecific.length) return ours;
                                    if (!ours.length) return widgetSpecific;
                                    return ours.concat([null], widgetSpecific);
                                }

                                const _proxyView = new Proxy([], {
                                    get: function (_target, prop) {
                                        if (Object.prototype.hasOwnProperty.call(_MUTATOR_FNS, prop)) {
                                            return _MUTATOR_FNS[prop];
                                        }
                                        const merged = _getMergedItems();
                                        const val = merged[prop];
                                        return typeof val === 'function' ? val.bind(merged) : val;
                                    },
                                    /* SP's contextMenu does someArray.concat(_debugContextMenu), and
                                       Array.prototype.concat checks HasProperty(proxy, k) for each
                                       index — without this trap that defaults to the empty target
                                       and every item becomes a hole. */
                                    has: function (_target, prop) {
                                        if (Object.prototype.hasOwnProperty.call(_MUTATOR_FNS, prop)) return true;
                                        return prop in _getMergedItems();
                                    }
                                });

                                try {
                                    Object.defineProperty(s.widget, '_debugContextMenu', {
                                        get: function () { return _proxyView; },
                                        set: function (value) {
                                            _widgetItems.length = 0;
                                            if (Array.isArray(value)) {
                                                for (let i = 0; i < value.length; i++) {
                                                    _widgetItems.push(value[i]);
                                                }
                                            }
                                        },
                                        enumerable: true,
                                        configurable: true
                                    });
                                    /* Expose _widgetItems so child widget proxies can read parent items. */
                                    s.widget._weWidgetItems = _widgetItems;
                                } catch (_e) {
                                    s.widget._debugContextMenu = getFilteredMenuItems();
                                }

                                if (localStorage.getItem(SHOW_SCOPE_MENUS_KEY) === 'true' &&
                                    window.location.pathname !== '/sp_config') {
                                    addScopeButtons(node);
                                }
                            }
                        }, WIDGET_OBSERVER_DELAY);
                    }
                }
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    })();

    ///////////////////////////////////////////
    // 6. CTRL+right-click debug menu injection
    ///////////////////////////////////////////

    /*
     * Captures the widget sys_id on contextmenu, then watches for the debug
     * overlay (div.dropdown.clearfix[role="contentinfo"]) being appended to
     * <body> and injects the preferred-editor link.
     */

    let _pendingWidgetSysId = null;
    let _pendingWidgetEl = null;
    let _pendingEmbeddedWidgets = []; // [{ el, sysId, name }, ...] innermost-first
    let _pendingCursorX = 0;
    let _pendingCursorY = 0;

    /**
     * Walks up from el collecting every [widget] element that has a valid
     * SP-prefixed sys_id class.  Returns an array (innermost first).
     *
     * spWidgetContent sets the directive name as "v" + sys_id (33 chars) and,
     * when widget.update is true, appends a 5-char UID making it 38 chars.
     * We handle both by looking for a class starting with "v" whose next 32
     * chars are a valid lowercase hex sys_id.
     * @param   {Element} el  Starting element.
     * @returns {Array<{el: Element, sysId: string, name: string, widgetName: string}>}
     */
    function getEmbeddedWidgetInfos(el) {
        const results = [];
        while (el && el !== document.body) {
            if (el.hasAttribute && el.hasAttribute('widget')) {
                // Scan all classes — Angular adds ng-scope etc. before the SP sys_id class
                let sysId = null;
                for (const cls of el.classList) {
                    if (cls.length >= 33 && cls.charAt(0) === 'v' && /^[0-9a-f]{32}/.test(cls.slice(1))) {
                        sysId = cls.slice(1, 33);
                        break;
                    }
                }
                if (sysId) {
                    // Widget name from Angular scope; instance title from sn-atf-area attribute.
                    // Display as "Widget Name" or "Widget Name [Instance Title]" when they differ.
                    let widgetName = '';
                    try {
                        const s = angular.element(el).scope();
                        widgetName = s?.widget?.name || '';
                    } catch (_ex) { }
                    const instanceTitle = el.getAttribute('sn-atf-area') || '';
                    let label = widgetName || instanceTitle || sysId;
                    if (widgetName && instanceTitle && instanceTitle !== widgetName) {
                        label = widgetName + ' [' + instanceTitle + ']';
                    }
                    results.push({ el: el, sysId: sysId, name: label, widgetName: widgetName || instanceTitle || sysId });
                }
            }
            el = el.parentElement;
        }
        return results;
    }


    /**
     * Walks up the DOM from el and returns the sys_id of the nearest widget
     * whose Angular scope exposes rectangle.widget.sys_id, or null if not found.
     * @param   {Element} el  Starting element.
     * @returns {string|null}
     */
    function getWidgetSysId(el) {
        while (el && el !== document.body) {
            try {
                const s = angular.element(el).scope();
                if (s) {
                    const rect = s.rectangle || s.$parent?.rectangle;
                    if (rect?.widget?.sys_id) {
                        return rect.widget.sys_id;
                    }
                }
            } catch (_ex) { /* angular not ready or detached node — keep walking */ }
            // Fallback: SP stamps v{sys_id} as a CSS class on every [widget] element.
            // Header/footer widgets often lack rectangle.widget.sys_id on their scope
            // but always have this class.
            if (el.hasAttribute && el.hasAttribute('widget')) {
                for (const cls of el.classList) {
                    if (cls.length >= 33 && cls[0] === 'v' && /^[0-9a-f]{32}/.test(cls.slice(1))) {
                        return cls.slice(1, 33);
                    }
                }
            }
            el = el.parentElement;
        }
        return null;
    }


    /**
     * Returns true when node is the SP debug context-menu overlay element.
     * @param   {Node} node
     * @returns {boolean}
     */
    function isDebugOverlay(node) {
        return node.nodeType === 1 &&
            node.getAttribute('role') === 'contentinfo' &&
            node.classList.contains('dropdown') &&
            node.classList.contains('clearfix');
    }


    /**
     * Removes any stale SP debug overlays directly under <body> so they do not
     * stack up when the user opens the context menu multiple times.
     */
    function removeDebugOverlays() {
        document.querySelectorAll('body > [role="contentinfo"].dropdown.clearfix').forEach((el) => {
            el.parentNode && el.parentNode.removeChild(el);
        });
    }

    document.addEventListener('contextmenu', function (e) {
        _pendingWidgetSysId = null;
        _pendingWidgetEl = null;
        _pendingEmbeddedWidgets = [];
        _pendingCursorX = e.clientX;
        _pendingCursorY = e.clientY;
        if (!e.ctrlKey) {
            return;
        }
        // Only clean up stale overlays when SP will actually create a new one
        // (SP's own guard is ctrlKey && !shiftKey && can_debug).
        removeDebugOverlays();
        _pendingWidgetSysId = getWidgetSysId(e.target);
        _pendingEmbeddedWidgets = getEmbeddedWidgetInfos(e.target);
        // Walk up to find the closest [widget] element for scope access
        let el = e.target;
        while (el && el !== document.body) {
            if (el.hasAttribute && el.hasAttribute('widget')) {
                _pendingWidgetEl = el;
                break;
            }
            el = el.parentElement;
        }

        // Header/footer widgets lack SP's span.context so SP never creates a debug
        // overlay for them. If no overlay appears within 50ms, create our own.
        if (_pendingWidgetSysId && _pendingWidgetEl && !_pendingWidgetEl.querySelector('span.context')) {
            e.preventDefault(); // suppress browser context menu; SP does this for normal widgets
            setTimeout(function () {
                if (!document.querySelector('body > [role="contentinfo"].dropdown.clearfix')) {
                    createStandaloneOverlay();
                }
            }, 50);
        }
    }, true);

    const bodyObserver = new MutationObserver((mutations) => {
        // Collect all overlays added in this batch.
        const addedOverlays = [];
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (isDebugOverlay(node)) {
                    addedOverlays.push(node);
                }
            }
        }
        if (!addedOverlays.length) {
            return;
        }
        /*
         * Remove any overlays already in the DOM that are NOT part of this batch.
         * A ghost overlay can linger when closeSpOverlay() removes the overlay but
         * the subsequent $applyAsync digest causes SP to re-add one before our
         * $evalAsync reveal=false has run.  Clearing it here ensures only the
         * freshly-opened overlay survives.
         */
        document.querySelectorAll('body > [role="contentinfo"].dropdown').forEach((existing) => {
            if (!addedOverlays.includes(existing)) {
                existing.remove();
            }
        });
        // If SP added multiple overlays in one tick, discard all but the last.
        for (let i = 0; i < addedOverlays.length - 1; i++) {
            addedOverlays[i].parentNode && addedOverlays[i].parentNode.removeChild(addedOverlays[i]);
        }
        const targetOverlay = addedOverlays[addedOverlays.length - 1];
        if (targetOverlay.showPopover) {
            targetOverlay.setAttribute('popover', 'manual');
            targetOverlay.style.background = 'none';
            targetOverlay.style.border = 'none';
            targetOverlay.style.padding = '0';
            targetOverlay.showPopover();
        }
        injectEditorItems(targetOverlay);
        attachOverlayObserver(targetOverlay);
    });
    bodyObserver.observe(document.body, { childList: true });


    /*
     * Watches an existing overlay for new <ul class="dropdown-menu"> children.
     * SP sometimes reuses the overlay element and appends a fresh UL rather than
     * creating a brand-new overlay, which means bodyObserver never fires.  When
     * that happens we discard the previously-processed UL and inject into the new one.
     */
    function attachOverlayObserver(overlayEl) {
        const overlayObserver = new MutationObserver(function (mutations) {
            for (let mi = 0; mi < mutations.length; mi++) {
                const added = mutations[mi].addedNodes;
                for (let ni = 0; ni < added.length; ni++) {
                    const node = added[ni];
                    if (node.nodeType === 1 && node.tagName === 'UL' && node.classList.contains('dropdown-menu')) {
                        /*
                         * SP added a second UL to the same overlay.  Discard all
                         * ULs except the newly-added one, then re-inject.
                         */
                        overlayEl.querySelectorAll('ul.dropdown-menu').forEach(function (ul) {
                            if (ul !== node) {
                                ul.remove();
                            }
                        });
                        overlayObserver.disconnect();
                        injectEditorItems(overlayEl);
                        return;
                    }
                }
            }
        });
        overlayObserver.observe(overlayEl, { childList: true });
    }


    const EXTERNAL_LINK_ICON = ' <i class="icon-open-document-new-tab text-muted" style="margin-left: 4px"></i>';

    /**
     * Closes SP's debug overlay.
     * SP closes the menu by removing the overlay element from document.body.
     * We also reset reveal=false on every spWidgetDebug scope (span.context) so
     * that Angular does not re-add the overlay on the next digest cycle after
     * we remove it — which would cause a duplicate menu on the next right-click.
     */
    function closeSpOverlay(menuContainer) {
        try {
            document.querySelectorAll('span.context').forEach(function (el) {
                const s = angular.element(el).scope();
                if (s) {
                    s.$evalAsync(function () { s.reveal = false; });
                }
            });
            menuContainer?.remove();
        } catch (_e) { }
    }


    /*
     * Opens a widget in SP's native form modal, mirroring the spWidgetDebug
     * implementation: fetches the widget-options-config widget via spUtil, then
     * sets rectangle.debugModal on the spWidgetDebug scope so the SP template
     * renders the modal.  Also wires up afterClose and the sp.form.record.updated
     * broadcast so the page reloads on save.
     */
    function openWidgetFormModal(sysId) {
        scope.$applyAsync(function () {
            spUtil.get('widget-options-config', { table: 'sp_widget', sys_id: sysId }).then(function (widgetData) {
                let debugScope = null;
                document.querySelectorAll('span.context').forEach(function (el) {
                    const s = angular.element(el).scope();
                    if (s && s.rectangle !== undefined) {
                        debugScope = s;
                    }
                });
                if (!debugScope) {
                    return;
                }
                widgetData.options.afterClose = function () {
                    debugScope.rectangle.debugModal = null;
                };
                widgetData.options.afterOpen = function () { };
                debugScope.rectangle.debugModal = widgetData;
                debugScope.$on('sp.form.record.updated', function () {
                    debugScope.rectangle.debugModal = null;
                    scope.$broadcast('sp.page.reload');
                });
            });
        });
    }


    function createStandaloneOverlay() {
        const container = document.createElement('div');
        container.setAttribute('role', 'contentinfo');
        container.className = 'dropdown clearfix';
        const ul = document.createElement('ul');
        ul.className = 'dropdown-menu';
        ul.setAttribute('role', 'menu');
        const headerLi = document.createElement('li');
        headerLi.setAttribute('role', 'presentation');
        headerLi.className = 'dropdown-header';
        headerLi.textContent = (_pendingEmbeddedWidgets.length > 0 && _pendingEmbeddedWidgets[0].name) || '';
        ul.appendChild(headerLi);
        container.appendChild(ul);
        if (container.showPopover) {
            container.setAttribute('popover', 'manual');
            container.style.background = 'none';
            container.style.border = 'none';
            container.style.padding = '0';
        }
        document.body.appendChild(container);
        if (container.showPopover) container.showPopover();
        injectEditorItems(container);
        injectWidgetDebugItems(ul, container);
        attachOverlayObserver(container);
    }

    /*
     * Injects _debugContextMenu items from the right-clicked widget (or nearest
     * ancestor with items) into the standalone overlay's <ul>.
     * Used for widgets without span.context where SP never creates its own overlay.
     */
    function injectWidgetDebugItems(ul, container) {
        if (!_pendingWidgetEl) return;
        try {
            const wScope = angular.element(_pendingWidgetEl).scope();
            if (!wScope) return;

            let items = null;
            let callbackScope = wScope;

            if (wScope.widget && Array.isArray(wScope.widget._weWidgetItems) && wScope.widget._weWidgetItems.length) {
                items = wScope.widget._weWidgetItems;
            } else {
                let ps = wScope.$parent;
                while (ps) {
                    if (ps.widget && ps.widget._customEnhancement &&
                        Array.isArray(ps.widget._weWidgetItems) && ps.widget._weWidgetItems.length) {
                        items = ps.widget._weWidgetItems;
                        callbackScope = ps;
                        break;
                    }
                    ps = ps.$parent;
                }
            }
            if (!items || !items.length) return;

            const divLi = document.createElement('li');
            divLi.className = 'divider';
            divLi.setAttribute('role', 'separator');
            divLi.setAttribute('data-we-injected', '1');
            ul.appendChild(divLi);

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const li = document.createElement('li');
                li.setAttribute('role', 'presentation');
                li.setAttribute('data-we-injected', '1');
                if (!item) {
                    li.className = 'divider';
                    li.setAttribute('role', 'separator');
                } else {
                    const a = document.createElement('a');
                    a.className = 'sp-context-menu-padding';
                    a.setAttribute('tabindex', '-1');
                    a.href = 'javascript:void(0)';
                    a.textContent = item[0];
                    (function (fn, s) {
                        a.addEventListener('click', function (e) {
                            e.preventDefault();
                            closeSpOverlay(container);
                            try { fn(s, e); } catch (_ex) { }
                        });
                    }(item[1], callbackScope));
                    li.appendChild(a);
                }
                ul.appendChild(li);
            }
        } catch (_e) { }
    }


    function injectEditorItems(menuContainer) {
        const widgetSysId = _pendingWidgetSysId;
        if (!widgetSysId) {
            return;
        }

        const ul = menuContainer.querySelector('.dropdown-menu');
        if (!ul) {
            return;
        }

        // Prevent the overlay container from blocking scroll and pointer events
        // outside the visible menu bounds (it may span the full viewport width).
        menuContainer.style.pointerEvents = 'none';
        ul.style.pointerEvents = 'auto';

        // Clean up any items we injected on a previous use of this element
        ul.querySelectorAll('[data-we-injected]').forEach((el) => { el.remove(); });
        const existingCog = ul.querySelector('[data-we-cog]');
        if (existingCog) {
            existingCog.remove();
        }

        const prefs = controller.preferences || {};

        // Replace native "Widget in Form Modal" and "Widget in Editor ➚"
        // Both native items are always removed.  The enabled "Open with" options
        // (from the four openWith* prefs) are injected in their place, in order.
        // Form Modal is opened via spUtil — no URL needed.
        let formModalLi = null;
        let nativeEditorLi = null;
        for (const li of ul.querySelectorAll('li')) {
            const a = li.querySelector('a');
            if (!a) {
                continue;
            }
            const t = a.textContent.trim();
            if (t === 'Widget in Form Modal') {
                formModalLi = li;
                continue;
            }
            if (t.startsWith('Widget in Editor') && !t.includes('+')) {
                nativeEditorLi = li;
            }
        }

        /*
         * Insertion anchor for "Open with" items.
         * Prefer the native "Widget in Form Modal" / "Widget in Editor ➚" items.
         * If they were already removed by a previous injection pass (SP re-used the
         * same overlay element), find the divider that precedes the console-logging
         * section — that is the exact position those items occupied.  This keeps
         * "Show Widget Customizations" and other widget-options items above the
         * "Open with" group, matching the first-pass layout.
         */
        let insertionAnchor = formModalLi ?? nativeEditorLi;
        if (!insertionAnchor) {
            /*
             * Walk the list looking for the first console-logging item ("Log to
             * console: $scope.data" or "Log to console: $scope").  filterNativeItems
             * hasn't run yet, so these are still present regardless of prefs.
             * Then walk backwards from that item to the nearest divider and use it
             * as the anchor (insert before the divider).
             */
            let firstConsoleLi = null;
            const children = ul.querySelectorAll('li');
            for (let i = 0; i < children.length; i++) {
                const a = children[i].querySelector('a');
                if (a) {
                    const t = a.textContent.trim();
                    if (t === 'Log to console: $scope.data' || t === 'Log to console: $scope') {
                        firstConsoleLi = children[i];
                        break;
                    }
                }
            }
            if (firstConsoleLi) {
                let prev = firstConsoleLi.previousElementSibling;
                while (prev && !prev.classList.contains('divider')) {
                    prev = prev.previousElementSibling;
                }
                insertionAnchor = prev || firstConsoleLi;
            }
        }
        let lastOpenWithLi = null;
        const openWithDefs = [
            { id: 'openWithEditorPlus', label: 'Open in Widget Editor+', href: getEditorPlusUrl(widgetSysId) },
            { id: 'openWithEditorSP', label: 'Open in Widget Editor', href: getSPEditorUrl(widgetSysId) },
            { id: 'openWithFormModal', label: 'Open in Form Modal', href: null },
            { id: 'openWithPlatform', label: 'Open in Platform', href: getEditorPlatformUrl(widgetSysId) }
        ];
        for (const def of openWithDefs) {
            if (prefs[def.id] === false) {
                continue;
            }
            const li = document.createElement('li');
            li.setAttribute('role', 'menuitem');
            li.setAttribute('data-we-injected', '1');
            const a = document.createElement('a');
            a.className = 'sp-context-menu-padding';
            a.setAttribute('tabindex', '-1');
            if (def.href) {
                a.href = def.href;
                a.target = '_blank';
                a.innerHTML = def.label + EXTERNAL_LINK_ICON;
            } else {
                a.href = 'javascript:void(0)';
                a.textContent = def.label;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeSpOverlay(menuContainer);
                    openWidgetFormModal(widgetSysId);
                });
            }
            li.appendChild(a);
            // insertBefore(node, null) appends — works for both anchored and standalone menus
            ul.insertBefore(li, insertionAnchor);
            lastOpenWithLi = li;
        }
        formModalLi?.remove();
        nativeEditorLi?.remove();

        /* Standalone overlays (header/footer widgets) never get SP's native console items.
         * Inject them here so the assignConsoleVar, filterNativeItems, and $rootScope
         * passes work the same as for normal widgets. */
        const hasNativeScopeItem = Array.from(ul.querySelectorAll('li a')).some(
            (a) => a.textContent.trim() === 'Log to console: $scope'
        );
        if (!hasNativeScopeItem && _pendingWidgetEl) {
            const capturedEl = _pendingWidgetEl;
            const dividerLi = document.createElement('li');
            dividerLi.className = 'divider';
            dividerLi.setAttribute('role', 'separator');
            dividerLi.setAttribute('data-we-injected', '1');
            ul.appendChild(dividerLi);

            const scopeDataLi = document.createElement('li');
            scopeDataLi.setAttribute('role', 'menuitem');
            scopeDataLi.setAttribute('data-we-injected', '1');
            const scopeDataA = document.createElement('a');
            scopeDataA.className = 'sp-context-menu-padding';
            scopeDataA.setAttribute('tabindex', '-1');
            scopeDataA.href = 'javascript:void(0)';
            scopeDataA.textContent = 'Log to console: $scope.data';
            scopeDataA.addEventListener('click', function (e) {
                e.preventDefault();
                closeSpOverlay(menuContainer);
                const s = angular.element(capturedEl).scope();
                console.log('$scope.data\n', s && s.data);
            });
            scopeDataLi.appendChild(scopeDataA);
            ul.appendChild(scopeDataLi);

            const scopeLi = document.createElement('li');
            scopeLi.setAttribute('role', 'menuitem');
            scopeLi.setAttribute('data-we-injected', '1');
            const scopeA = document.createElement('a');
            scopeA.className = 'sp-context-menu-padding';
            scopeA.setAttribute('tabindex', '-1');
            scopeA.href = 'javascript:void(0)';
            scopeA.textContent = 'Log to console: $scope';
            scopeA.addEventListener('click', function (e) {
                e.preventDefault();
                closeSpOverlay(menuContainer);
                const s = angular.element(capturedEl).scope();
                console.log('$scope\n', s);
            });
            scopeLi.appendChild(scopeA);
            ul.appendChild(scopeLi);
        }

        // Intercept native "Log to console: $scope" to assign window.$scope
        // $scope.data is intentionally excluded - it is not added to the window.
        if (prefs.assignConsoleVars !== false) {
            const capturedWidgetEl = _pendingWidgetEl;
            ul.querySelectorAll('li').forEach((li) => {
                const a = li.querySelector('a');
                if (!a) {
                    return;
                }
                if (a.textContent.trim() === 'Log to console: $scope' && capturedWidgetEl) {
                    li.addEventListener('click', function () {
                        assignConsoleVar('$scope', angular.element(capturedWidgetEl).scope());
                    });
                }
            });
        }

        // Remove disabled native SP items, then clean up orphan dividers
        filterNativeItems(ul, prefs);
        cleanupDividers(ul);

        // Inject "Open <table> record" in the same section as the "Open with" items
        if (prefs.openRecordInBackend !== false) {
            const recordParams = new URLSearchParams(location.search);
            let recordTable = recordParams.get('table');
            let recordSysId = recordParams.get('sys_id');

            // Fall back to the right-clicked widget's $scope.data when URL params are absent
            if ((!recordTable || !recordSysId) && _pendingWidgetEl) {
                const wScope = angular.element(_pendingWidgetEl).scope();
                const wData = wScope && wScope.data;
                if (wData) {
                    if (!recordTable) { recordTable = wData.table || wData.tableName || null; }
                    if (!recordSysId) { recordSysId = wData.sys_id || null; }
                }
            }

            if (recordTable && recordSysId) {
                const openRecordLi = document.createElement('li');
                openRecordLi.setAttribute('role', 'menuitem');
                openRecordLi.setAttribute('data-we-injected', '1');
                const openRecordA = document.createElement('a');
                openRecordA.className = 'sp-context-menu-padding';
                openRecordA.setAttribute('tabindex', '-1');
                openRecordA.href = '/nav_to.do?uri=' + encodeURIComponent(recordTable) + '.do%3Fsys_id=' + encodeURIComponent(recordSysId);
                openRecordA.target = '_blank';
                openRecordA.innerHTML = 'Open ' + escapeHtml(recordTable) + ' record' + EXTERNAL_LINK_ICON;
                openRecordLi.appendChild(openRecordA);
                if (lastOpenWithLi) {
                    ul.insertBefore(openRecordLi, lastOpenWithLi.nextSibling);
                } else {
                    ul.appendChild(openRecordLi);
                }
            }
        }

        // Inject logRootScope after native "Log to console: $scope"
        // Must run before the rename pass so the anchor text is still the original.
        // If $scope was hidden by prefs (removed by filterNativeItems), fall back to
        // inserting after $scope.data so $rootScope stays in the console-logging section
        // and never sinks below widget-added items.
        if (prefs.logRootScope !== false) {
            let logScopeLi = null;
            let logScopeDataLi = null;
            ul.querySelectorAll('li').forEach(function (li) {
                const a = li.querySelector('a');
                if (!a) {
                    return;
                }
                const t = a.textContent.trim();
                if (t === 'Log to console: $scope') {
                    logScopeLi = li;
                } else if (t === 'Log to console: $scope.data') {
                    logScopeDataLi = li;
                }
            });
            const rootScopeLi = document.createElement('li');
            rootScopeLi.setAttribute('role', 'menuitem');
            rootScopeLi.setAttribute('data-we-injected', '1');
            const rootScopeA = document.createElement('a');
            rootScopeA.className = 'sp-context-menu-padding';
            rootScopeA.setAttribute('tabindex', '-1');
            rootScopeA.href = 'javascript:void(0)';
            rootScopeA.textContent = 'Log to console: $rootScope';
            rootScopeA.addEventListener('click', function (e) {
                e.preventDefault();
                closeSpOverlay(menuContainer);
                const rootScope = angular.element(document.body).scope();
                console.log('$rootScope\n', rootScope);
                if (prefs.assignConsoleVars !== false) {
                    assignConsoleVar('$rootScope', rootScope);
                }
            });
            rootScopeLi.appendChild(rootScopeA);
            // Prefer inserting after $scope; fall back to after $scope.data (when $scope is
            // hidden by prefs) so $rootScope stays in the console-logging section.
            const consoleLi = logScopeLi || logScopeDataLi;
            if (consoleLi) {
                ul.insertBefore(rootScopeLi, consoleLi.nextSibling);
            } else {
                ul.appendChild(rootScopeLi);
            }
        }

        // Relabel $scope / $rootScope items -> "Add to console:" when assignConsoleVars is on
        // $scope.data is excluded - it is never added to the window object.
        if (prefs.assignConsoleVars !== false) {
            ul.querySelectorAll('li a').forEach((a) => {
                const text = a.textContent;
                if (text.indexOf('Log to console:') === 0 && text !== 'Log to console: $scope.data') {
                    a.textContent = text.replace('Log to console:', 'Add to console:');
                }
            });
        }

        // Replace SP's ➚ arrow on native external-link items with icon
        ul.querySelectorAll('li:not([data-we-injected]) a').forEach((a) => {
            const text = a.textContent;
            if (/[\u279a\u2197]/.test(text)) {
                a.innerHTML = text.replace(/\s*[\u279a\u2197]\s*$/, '') + EXTERNAL_LINK_ICON;
            }
        });

        // Inject ⚙ settings button into the header row
        let headerLi = null;
        Array.from(ul.children).some((li) => {
            if (!li.classList.contains('divider') && !li.querySelector('a')) {
                headerLi = li;
                return true;
            }
            return false;
        });

        if (headerLi && _pendingEmbeddedWidgets.length > 0) {
            headerLi.textContent = _pendingEmbeddedWidgets[0].name;
        }

        if (headerLi) {
            const cogBtn = document.createElement('button');
            cogBtn.setAttribute('data-we-cog', '1');
            cogBtn.innerHTML = '<i class="icon-cog"></i>';
            cogBtn.setAttribute('title', 'Debug menu preferences');
            Object.assign(cogBtn.style, {
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0',
                lineHeight: '1'
            });
            cogBtn.addEventListener('mouseenter', function () {
                cogBtn.querySelector('i').className = 'icon-cog-selected';
            });
            cogBtn.addEventListener('mouseleave', function () {
                cogBtn.querySelector('i').className = 'icon-cog';
            });
            cogBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Close SP's overlay before opening the modal
                closeSpOverlay(menuContainer);
                scope.$applyAsync(function () {
                    controller.openPreferences();
                });
            });
            headerLi.style.position = 'sticky';
            headerLi.style.top = '0';
            headerLi.style.paddingRight = '34px'; // reserve space so text doesn't run under the icon
            headerLi.style.marginBottom = '0';
            headerLi.appendChild(cogBtn);
        }

        // Inject per-embedded-widget sections.
        // _pendingEmbeddedWidgets is innermost-first; index 0 is the clicked widget
        // (already shown in the main header), so the rest are the ancestor widgets.
        const embeddedWidgets = _pendingEmbeddedWidgets.slice(1);
        if (embeddedWidgets.length > 0) {
            const showOpen = prefs.openEmbeddedWidget !== false;
            const showLog = prefs.logEmbeddedScope !== false;
            if (showOpen || showLog) {
                const embSep = document.createElement('li');
                embSep.setAttribute('data-we-injected', '1');
                embSep.setAttribute('role', 'separator');
                embSep.className = 'divider';
                ul.appendChild(embSep);

                embeddedWidgets.forEach((info) => {
                    const headerLiEmb = document.createElement('li');
                    headerLiEmb.setAttribute('data-we-injected', '1');
                    headerLiEmb.setAttribute('role', 'presentation');
                    headerLiEmb.className = 'dropdown-header';
                    headerLiEmb.textContent = info.name;
                    ul.appendChild(headerLiEmb);

                    if (showOpen) {
                        const openLi = document.createElement('li');
                        openLi.setAttribute('role', 'menuitem');
                        openLi.setAttribute('data-we-injected', '1');
                        const openA = document.createElement('a');
                        openA.className = 'sp-context-menu-padding';
                        openA.setAttribute('tabindex', '-1');

                        const embEditor = prefs.embeddedWidgetEditor || 'openWithEditorPlus';
                        if (embEditor === 'openWithFormModal') {
                            openA.href = 'javascript:void(0)';
                            openA.textContent = 'Open ' + info.widgetName;
                            (function (capturedInfo) {
                                openA.addEventListener('click', function (e) {
                                    e.preventDefault();
                                    closeSpOverlay(menuContainer);
                                    openWidgetFormModal(capturedInfo.sysId);
                                });
                            })(info);
                        } else {
                            const embHref = embEditor === 'openWithEditorSP' ? getSPEditorUrl(info.sysId) :
                                embEditor === 'openWithPlatform' ? getEditorPlatformUrl(info.sysId) :
                                    getEditorPlusUrl(info.sysId);
                            openA.href = embHref;
                            openA.target = '_blank';
                            openA.innerHTML = 'Open ' + escapeHtml(info.widgetName) + EXTERNAL_LINK_ICON;
                        }

                        openLi.appendChild(openA);
                        ul.appendChild(openLi);
                    }

                    if (showLog) {
                        const logEmbLi = document.createElement('li');
                        logEmbLi.setAttribute('role', 'menuitem');
                        logEmbLi.setAttribute('data-we-injected', '1');
                        const logEmbA = document.createElement('a');
                        logEmbA.className = 'sp-context-menu-padding';
                        logEmbA.setAttribute('tabindex', '-1');
                        logEmbA.href = 'javascript:void(0)';
                        logEmbA.textContent = (prefs.assignConsoleVars !== false ? 'Add to console: Embedded $scope' : 'Log to console: Embedded $scope');
                        (function (capturedInfo) {
                            logEmbA.addEventListener('click', function (e) {
                                e.preventDefault();
                                const embeddedScope = angular.element(capturedInfo.el).scope();
                                console.log('Embedded $scope (' + capturedInfo.name + ')\n', embeddedScope);
                                if (prefs.assignConsoleVars !== false) {
                                    assignConsoleVar('$scope', embeddedScope);
                                }
                            });
                        })(info);
                        logEmbLi.appendChild(logEmbA);
                        ul.appendChild(logEmbLi);
                    }
                });
            }
        }

        // Widen menu to avoid crowding
        ul.style.minWidth = '220px';

        // Close on outside click or Escape.
        // pointer-events:none on the container means SP's own outside-click
        // handler never fires, so we replicate it here.
        const closeOnOutsideClick = (e) => {
            if (!ul.contains(e.target)) {
                document.removeEventListener('click', closeOnOutsideClick, true);
                document.removeEventListener('keydown', closeOnEscape, true);
                closeSpOverlay(menuContainer);
            }
        };
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('click', closeOnOutsideClick, true);
                document.removeEventListener('keydown', closeOnEscape, true);
                closeSpOverlay(menuContainer);
            }
        };
        document.addEventListener('click', closeOnOutsideClick, true);
        document.addEventListener('keydown', closeOnEscape, true);

        // Position near cursor, opening in whichever direction has more space.
        // rAF ensures SP has finished its own positioning before we override.
        requestAnimationFrame(function () {
            const pad = 10;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const cursorX = _pendingCursorX;
            const cursorY = _pendingCursorY;

            // Measure natural height before applying any constraint.
            ul.style.maxHeight = '';
            ul.style.overflowY = 'hidden';
            ul.style.overflowX = 'hidden';
            const naturalRect = ul.getBoundingClientRect();
            const naturalH = naturalRect.height;
            const menuW = naturalRect.width || 220;

            const spaceBelow = vh - cursorY - pad;
            const spaceAbove = cursorY - pad;

            // Prefer opening below; flip above only if menu doesn't fit below but fits above,
            // or if there's more room above.
            let openBelow, constrainedH;
            if (naturalH <= spaceBelow) {
                openBelow = true;
                constrainedH = null;
            } else if (naturalH <= spaceAbove) {
                openBelow = false;
                constrainedH = null;
            } else if (spaceBelow >= spaceAbove) {
                openBelow = true;
                constrainedH = Math.max(120, spaceBelow);
            } else {
                openBelow = false;
                constrainedH = Math.max(120, spaceAbove);
            }

            if (constrainedH !== null) {
                ul.style.maxHeight = constrainedH + 'px';
                ul.style.overflowY = 'auto';
            }

            const menuH = constrainedH !== null ? constrainedH : naturalH;

            const top = openBelow ? cursorY : Math.max(pad, cursorY - menuH);
            let left = cursorX;
            if (left + menuW > vw - pad) {
                left = Math.max(pad, cursorX - menuW);
            }

            // Position the ul directly with fixed coords.
            // SP sets position:absolute + left/top on the ul relative to its container,
            // and sets width:100% on the container — so moving the container doubles the
            // offset. Bypassing the container and fixing the ul itself avoids that entirely.
            // Bootstrap's .dropdown-menu is display:none by default; SP sets display:block
            // via an Angular binding that our standalone overlay doesn't have.
            ul.style.display = 'block';
            ul.style.position = 'fixed';
            ul.style.top = top + 'px';
            ul.style.left = left + 'px';
        });
    }


    /**
     * Removes any native SP debug menu items that have been disabled in prefs.
     * Matches by anchor text using NATIVE_ITEM_MATCHERS.
     * @param {Element} ul
     * @param {Object}  prefs
     */
    function filterNativeItems(ul, prefs) {
        ul.querySelectorAll('li').forEach((li) => {
            const a = li.querySelector('a');
            if (!a) {
                return;
            }
            const text = a.textContent.trim();
            NATIVE_ITEM_MATCHERS.forEach((def) => {
                if (def.match(text) && prefs[def.id] === false) {
                    li.remove();
                }
            });
        });

        // Reorder: move "Widget Options Schema" immediately after "Show/Hide Widget Customizations"
        let customizationsLi = null;
        let optionsSchemaLi = null;
        ul.querySelectorAll('li').forEach((li) => {
            const a = li.querySelector('a');
            if (!a) { return; }
            const text = a.textContent.trim();
            if (text === 'Show Widget Customizations' || text === 'Hide Widget Customizations') {
                customizationsLi = li;
            } else if (text === 'Widget Options Schema') {
                optionsSchemaLi = li;
            }
        });
        if (customizationsLi && optionsSchemaLi && customizationsLi.nextElementSibling !== optionsSchemaLi) {
            customizationsLi.insertAdjacentElement('afterend', optionsSchemaLi);
        }
    }


    /**
     * Removes consecutive dividers, dividers immediately after the header, and
     * any trailing divider.  Call after item removal to keep the menu tidy.
     * @param {Element} ul
     */
    function cleanupDividers(ul) {
        let prevType = 'start'; // 'start' | 'header' | 'item' | 'divider'

        Array.from(ul.children).forEach((li) => {
            const isDivider = li.classList.contains('divider');
            const hasAnchor = !!li.querySelector('a');

            if (!isDivider && !hasAnchor) {
                // The "generated in" header — never remove
                prevType = 'header';
                return;
            }

            if (isDivider) {
                if (prevType === 'start' || prevType === 'header' || prevType === 'divider') {
                    li.remove();
                } else {
                    prevType = 'divider';
                }
            } else {
                prevType = 'item';
            }
        });

        // Remove a trailing divider left after the last item
        const allLi = ul.querySelectorAll('li');
        if (allLi.length > 0 && allLi[allLi.length - 1].classList.contains('divider')) {
            allLi[allLi.length - 1].remove();
        }
    }


    ///////////////////////////////////////////
    // 7. Scope inspector buttons
    ///////////////////////////////////////////

    /**
     * Injects a floating gear button onto each [widget] element that, when
     * clicked, opens an inspector panel showing the widget's Angular scope.
     * @param {Element} [singleElement]  When provided only that element is
     *   processed; otherwise all [widget="widget"] elements on the page.
     */
    function addScopeButtons(singleElement) {
        const elements = singleElement
            ? [singleElement]
            : document.querySelectorAll('[widget="widget"]');

        const occupiedPositions = [];
        const problematicWidgets = new Set();
        let activeMenu = null;

        ///////////////////////////////////////////
        // 7a. Inner helpers
        ///////////////////////////////////////////

        function addStyles() {
            if (document.getElementById('scope-menu-stylesheet')) {
                return;
            }
            const ss = document.createElement('style');
            ss.id = 'scope-menu-stylesheet';
            ss.textContent = '.scope-node-key { color: mediumblue; }';
            document.head.appendChild(ss);
        }

        function closeActiveMenu() {
            if (activeMenu) {
                if (activeMenu.hidePopover) activeMenu.hidePopover();
                activeMenu = null;
            }
        }

        function calculateButtonPosition(el) {
            try {
                const rect = el.getBoundingClientRect();
                const elTop = rect.top;
                const elRight = rect.right;
                let offset = 5;

                let level = 0;
                let parent = el.parentElement;
                while (parent) {
                    if (parent.hasAttribute('widget')) {
                        level++;
                    }
                    parent = parent.parentElement;
                }

                let collision = true;
                while (collision) {
                    collision = false;
                    for (const pos of occupiedPositions) {
                        if (Math.abs(pos.top - (elTop + offset)) < 30 &&
                            Math.abs(pos.right - elRight) < 150) {
                            offset += 30;
                            collision = true;
                            break;
                        }
                    }
                }

                occupiedPositions.push({ top: elTop + offset, right: elRight, el: el });
                return { top: offset, level: level };
            } catch (error) {
                console.warn('Error calculating button position:', error);
                return { top: 5, level: 0 };
            }
        }

        function addLogButton(container, obj, label, buttonLabel) {
            const logButton = document.createElement('button');

            if (buttonLabel) {
                logButton.innerHTML = '\uD83D\uDCCB ' + buttonLabel;
                logButton.style.cssText = 'margin-bottom:10px;margin-left:5px;background:none;border:1px solid black;border-radius:4px;cursor:pointer;';
            } else {
                logButton.innerHTML = '\uD83D\uDCCB';
                logButton.style.cssText = 'background:none;border:none;cursor:pointer;';
            }

            container.appendChild(logButton);
            logButton.addEventListener('click', function (e) {
                e.stopPropagation();
                console.log(label + '\n', obj);
            });
        }

        function addOpenInEditor(container, widgetScope) {
            const editorButton = document.createElement('button');
            editorButton.innerHTML = '\uD83D\uDD0D Open in Widget Editor+';
            editorButton.style.cssText = 'margin-bottom:10px;margin-left:5px;background:none;border:1px solid black;border-radius:4px;cursor:pointer;';

            container.appendChild(editorButton);
            editorButton.addEventListener('click', function (e) {
                e.stopPropagation();
                window.open(getEditorPlusUrl(widgetScope.widget.sys_id), '_blank');
            });
        }

        addStyles();

        elements.forEach(function (el) {
            const widgetScope = angular.element(el).scope();
            const widgetName = widgetScope
                ? (widgetScope.widget?.name ?? widgetScope.widgetName ?? widgetScope.name ?? 'widget')
                : 'widget';

            if (document.getElementById(widgetName + '-scope-button')) {
                return;
            }

            const btn = document.createElement('button');
            btn.classList.add('scope-context-menu-button');
            btn.id = widgetName + '-scope-button';

            const pos = calculateButtonPosition(el);
            const topOffset = pos.top;
            const level = pos.level;
            const buttonColor = level > 0
                ? NESTED_COLORS[(level - 1) % NESTED_COLORS.length]
                : ROOT_BUTTON_COLOR;
            const nestedIndicator = level > 0
                ? '<span style="margin-right:4px;font-size:10px;">' + '\u25cf'.repeat(Math.min(level, 3)) + '</span>'
                : '';

            btn.innerHTML = nestedIndicator + '\u2699\uFE0F <span style="margin-left:4px;">' + escapeHtml(widgetName) + '</span>';

            Object.assign(btn.style, {
                position: 'absolute',
                top: topOffset + 'px',
                right: '5px',
                zIndex: '1000',
                padding: '4px 8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '4px',
                background: buttonColor,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            });

            el.style.position = 'relative';
            el.appendChild(btn);

            function positionMenu() {
                if (!activeMenu || !activeMenu.matches(':popover-open')) {
                    return;
                }
                const btnRect = btn.getBoundingClientRect();
                const menuRect = activeMenu.getBoundingClientRect();
                let top = btnRect.bottom + 5;
                let left = btnRect.left;

                if (left + menuRect.width > window.innerWidth - 10) {
                    left = Math.max(10, window.innerWidth - menuRect.width - 10);
                }
                if (top + menuRect.height > window.innerHeight - 10) {
                    top = Math.max(10, btnRect.top - menuRect.height - 5);
                }
                top = Math.max(10, Math.min(window.innerHeight - menuRect.height - 10, top));

                activeMenu.style.top = top + 'px';
                activeMenu.style.left = left + 'px';
            }

            window.addEventListener('resize', positionMenu);

            btn.addEventListener('click', function (e) {
                e.stopPropagation();

                const menuId = widgetName + '-scope-menu';

                if (activeMenu && activeMenu.id === menuId) {
                    closeActiveMenu();
                    return;
                }

                closeActiveMenu();
                document.querySelectorAll('.scope-context-menu').forEach((m) => { m.remove(); });

                const menu = document.createElement('div');
                menu.id = menuId;
                menu.classList.add('scope-context-menu');
                menu.setAttribute('popover', 'manual');

                Object.assign(menu.style, {
                    position: 'fixed',
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    maxWidth: '450px',
                    maxHeight: '600px',
                    minWidth: '250px',
                    minHeight: '100px',
                    overflow: 'auto',
                    fontSize: '12px',
                    fontFamily: MONOSPACE_FONTS,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                });
                document.body.appendChild(menu);

                activeMenu = menu;

                const widgetId = el.getAttribute('id') || el.getAttribute('data-id') || widgetScope?.$id;

                // Slow / problematic widget path
                if (widgetId && problematicWidgets.has(widgetId)) {
                    menu.innerHTML = '<div style="color:orange;padding:10px;">\u26A0\uFE0F This widget was slow to process previously. Showing limited information.</div>';
                    const basicInfo = document.createElement('div');
                    Object.assign(basicInfo.style, {
                        padding: '10px', marginTop: '10px',
                        background: '#f5f5f5', borderRadius: '4px'
                    });
                    basicInfo.innerHTML =
                        '<div><strong>Type:</strong> ' + escapeHtml(el.getAttribute('widget') || 'widget') + '</div>' +
                        '<div><strong>Name:</strong> ' + escapeHtml(widgetName) + '</div>' +
                        '<div><strong>ID:</strong> ' + (widgetScope?.$id ?? 'Unknown') + '</div>';
                    addLogButton(menu, widgetScope, widgetName + ' - ' + (widgetScope?.$id ?? ''), 'Log widget scope to console');
                    addOpenInEditor(menu, widgetScope);
                    menu.appendChild(basicInfo);
                    menu.showPopover();
                    positionMenu();
                    return;
                }

                // Normal path
                try {
                    if (!widgetScope) {
                        menu.textContent = 'No AngularJS scope found.';
                        menu.showPopover();
                        positionMenu();
                        return;
                    }

                    let processingTimedOut = false;
                    const processingTimeout = setTimeout(function () {
                        processingTimedOut = true;
                        if (widgetId) {
                            problematicWidgets.add(widgetId);
                        }
                        menu.innerHTML = '<div style="color:orange;padding:10px;">\u26A0\uFE0F Processing took too long and was aborted. Try again for limited information.</div>';
                        if (!menu.matches(':popover-open')) menu.showPopover();
                        positionMenu();
                    }, PROCESSING_TIMEOUT_MS);

                    function removeFunctions(obj, seen, depth) {
                        seen = seen ?? new WeakSet();
                        depth = depth ?? 0;
                        try {
                            if (processingTimedOut) {
                                return '[Processing aborted]';
                            }
                            if (depth > MAX_SCOPE_DEPTH) {
                                return '[Max depth reached]';
                            }
                            if (obj === null || typeof obj !== 'object') {
                                return obj;
                            }
                            if (seen.has(obj)) {
                                return '[Circular]';
                            }
                            seen.add(obj);

                            if (Array.isArray(obj)) {
                                return obj
                                    .slice(0, MAX_ARRAY_ITEMS)
                                    .filter((item) => typeof item !== 'function')
                                    .map((item) => {
                                        try { return removeFunctions(item, seen, depth + 1); }
                                        catch (_e) { return '[Error]'; }
                                    });
                            }

                            const result = {};
                            let propertyCount = 0;
                            for (const key in obj) {
                                if (processingTimedOut) {
                                    break;
                                }
                                if (propertyCount >= MAX_OBJ_PROPS) {
                                    result['...'] = '[' + (Object.keys(obj).length - propertyCount) + ' more properties]';
                                    break;
                                }
                                try {
                                    if (typeof obj[key] !== 'function') {
                                        result[key] = removeFunctions(obj[key], seen, depth + 1);
                                        propertyCount++;
                                    }
                                } catch (_e) {
                                    result[key] = '[Access Error]';
                                    propertyCount++;
                                }
                            }
                            return result;
                        } catch (_e) {
                            return '[Error processing object]';
                        }
                    }

                    const output = {};
                    let propCount = 0;
                    try {
                        Object.keys(widgetScope).forEach((key) => {
                            if (processingTimedOut || propCount > MAX_SCOPE_PROPS) {
                                return;
                            }
                            if (!key.startsWith('$$') && typeof widgetScope[key] !== 'function') {
                                try { output[key] = widgetScope[key]; propCount++; }
                                catch (err) { output[key] = '[Error: ' + err.message + ']'; }
                            }
                        });
                    } catch (scopeError) {
                        console.warn('Error accessing scope keys:', scopeError);
                        output.$error = 'Could not access all scope properties';
                    }

                    for (const key in output) {
                        if (processingTimedOut) {
                            break;
                        }
                        try {
                            if (typeof output[key] === 'object' && output[key] !== null) {
                                output[key] = removeFunctions(output[key]);
                            }
                        } catch (err) {
                            output[key] = '[Error processing: ' + err.message + ']';
                        }
                    }

                    output.$widget = {
                        id: widgetScope.$id,
                        name: widgetName,
                        type: el.getAttribute('widget') || 'widget'
                    };
                    if (widgetScope.$parent) {
                        try { output.$parent = { $id: widgetScope.$parent.$id }; }
                        catch (_e) { output.$parent = { $error: 'Could not access parent scope' }; }
                    }

                    if (!processingTimedOut) {
                        clearTimeout(processingTimeout);

                        const header = document.createElement('div');
                        Object.assign(header.style, {
                            marginBottom: '10px', padding: '5px',
                            background: '#f5f5f5', borderRadius: '3px',
                            fontWeight: 'bold', fontSize: '13px'
                        });
                        let headerText = (el.getAttribute('widget') || 'widget') + ': ' + widgetName + ' (ID: ' + widgetScope.$id + ')';
                        if (level > 0) {
                            headerText = '[Nested L' + level + '] ' + headerText;
                            Object.assign(header.style, { background: buttonColor, color: '#fff' });
                        }
                        header.textContent = headerText;
                        menu.appendChild(header);

                        addLogButton(menu, widgetScope, headerText, 'Log widget scope to console');
                        addOpenInEditor(menu, widgetScope);

                        const searchContainer = document.createElement('div');
                        Object.assign(searchContainer.style, { marginBottom: '10px', padding: '5px' });
                        const searchInput = document.createElement('input');
                        Object.assign(searchInput.style, {
                            width: '100%', padding: '5px',
                            border: '1px solid #ccc', borderRadius: '3px', fontSize: '12px'
                        });
                        searchInput.setAttribute('placeholder', 'Search properties...');
                        searchInput.setAttribute('type', 'search');
                        searchContainer.appendChild(searchInput);
                        menu.appendChild(searchContainer);

                        const treeContainer = document.createElement('div');
                        menu.appendChild(treeContainer);
                        treeContainer.appendChild(createTree(output));

                        let searchTimeout;
                        searchInput.addEventListener('input', function (e) {
                            clearTimeout(searchTimeout);
                            searchTimeout = setTimeout(function () {
                                const filterText = e.target.value.trim();
                                if (!filterText) {
                                    treeContainer.innerHTML = '';
                                    treeContainer.appendChild(createTree(output));
                                    setTimeout(positionMenu, 50);
                                    return;
                                }

                                const searchResults = deepSearch(output, filterText);
                                const resultsInfo = document.createElement('div');
                                Object.assign(resultsInfo.style, {
                                    marginBottom: '10px', fontSize: '12px',
                                    fontStyle: 'italic', color: '#666'
                                });

                                treeContainer.innerHTML = '';

                                if (searchResults.length > 0) {
                                    resultsInfo.textContent = 'Found ' + searchResults.length + ' ' + (searchResults.length === 1 ? 'match' : 'matches') + ' for "' + filterText + '"';

                                    const resultsTree = document.createElement('div');
                                    searchResults.forEach((result) => {
                                        const resultItem = document.createElement('div');
                                        Object.assign(resultItem.style, {
                                            padding: '4px',
                                            border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer'
                                        });

                                        const pathDisplay = document.createElement('div');
                                        Object.assign(pathDisplay.style, { marginBottom: '4px', fontSize: '11px', opacity: '0.7' });
                                        const pathText = result.path.split('.').join(' \u2192 ');
                                        if (pathText.toLowerCase().includes(filterText.toLowerCase())) {
                                            pathDisplay.innerHTML = escapeHtml(pathText).replace(
                                                new RegExp('(' + escapeRegExp(filterText) + ')', 'gi'),
                                                '<span style="background-color:yellow;font-weight:bold;">$1</span>'
                                            );
                                        } else {
                                            pathDisplay.textContent = pathText;
                                        }
                                        resultItem.appendChild(pathDisplay);

                                        const valueDisplay = document.createElement('div');
                                        let displayValue;
                                        if (result.value === null) {
                                            displayValue = 'null';
                                        } else if (typeof result.value === 'object') {
                                            displayValue = Array.isArray(result.value)
                                                ? 'Array(' + result.value.length + ')'
                                                : 'Object(' + Object.keys(result.value).length + ')';
                                        } else {
                                            displayValue = String(result.value);
                                            if (typeof result.value === 'string') {
                                                displayValue = '"' + displayValue + '"';
                                            }
                                        }

                                        let keyContent = escapeHtml(result.key);
                                        let valueContent = escapeHtml(displayValue);
                                        const highlightRe = new RegExp('(' + escapeRegExp(filterText) + ')', 'gi');
                                        const highlightSpan = '<span style="background-color:yellow;font-weight:bold;">$1</span>';

                                        if (result.key.toLowerCase().includes(filterText.toLowerCase())) {
                                            keyContent = keyContent.replace(highlightRe, highlightSpan);
                                        }
                                        if (typeof result.value === 'string' &&
                                            result.value.toLowerCase().includes(filterText.toLowerCase())) {
                                            valueContent = valueContent.replace(highlightRe, highlightSpan);
                                        }
                                        valueDisplay.innerHTML = '<strong class="scope-node-key">' + keyContent + '</strong>: ' + valueContent;
                                        resultItem.appendChild(valueDisplay);

                                        resultItem.addEventListener('click', function () {
                                            searchInput.value = '';
                                            treeContainer.innerHTML = '';
                                            treeContainer.appendChild(createTree(output));
                                            expandPathInTree(treeContainer, result.path.split('.'));
                                        });
                                        resultsTree.appendChild(resultItem);
                                    });

                                    treeContainer.appendChild(resultsInfo);
                                    treeContainer.appendChild(resultsTree);
                                } else {
                                    resultsInfo.textContent = 'No matches found for "' + filterText + '"';
                                    treeContainer.appendChild(resultsInfo);
                                    treeContainer.appendChild(createTree(output, new WeakSet(), filterText));
                                }

                                setTimeout(positionMenu, 50);
                            }, 300);
                        });

                        menu.showPopover();
                        positionMenu();
                        setTimeout(function () { searchInput.focus(); }, 50);
                    }
                } catch (error) {
                    console.error('Error opening widget menu:', error);
                    menu.innerHTML = '<div style="color:red;padding:10px;">Error opening widget inspector: ' + escapeHtml(error.message) + '</div>';
                    if (!menu.matches(':popover-open')) menu.showPopover();
                    positionMenu();
                    if (widgetId) {
                        problematicWidgets.add(widgetId);
                    }
                }

                menu.addEventListener('click', function (e) { e.stopPropagation(); });
            });
        });

        document.addEventListener('click', function () { closeActiveMenu(); });
    }

    ///////////////////////////////////////////
    // 8. Tree / search helpers
    ///////////////////////////////////////////

    /**
     * Escapes a string for safe use inside a RegExp constructor.
     * @param   {string} string
     * @returns {string}
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }


    /**
     * Escapes a string so it can be safely inserted as HTML text content.
     * @param   {*}      text  Value to escape (coerced to string).
     * @returns {string}
     */
    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    /**
     * Builds a collapsible HTML tree from a plain object or array.
     * Matching keys/values are highlighted when filterText is provided.
     * @param   {object|Array} obj
     * @param   {WeakSet}      [seen]        Tracks visited references to handle circular structures.
     * @param   {string}       [filterText]  Highlight text to apply to matching nodes.
     * @returns {HTMLUListElement}
     */
    function createTree(obj, seen, filterText) {
        seen = seen ?? new WeakSet();
        filterText = filterText ?? '';

        const ul = document.createElement('ul');
        Object.assign(ul.style, {
            listStyle: 'none',
            paddingLeft: '1em',
            maxWidth: '100%',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
        });

        const isArray = Array.isArray(obj);
        let keys = isArray
            ? Object.keys(obj)
            : Object.keys(obj).sort((a, b) => a.localeCompare(b));

        if (filterText) {
            const lowerFilter = filterText.toLowerCase();
            keys = keys.filter((key) => {
                if (key.toLowerCase().includes(lowerFilter)) {
                    return true;
                }
                try {
                    const value = obj[key];
                    if (value === null) {
                        return false;
                    }
                    if (typeof value !== 'object') {
                        return String(value).toLowerCase().includes(lowerFilter);
                    }
                    return Object.keys(value).some((k) => k.toLowerCase().includes(lowerFilter));
                } catch (_e) { return false; }
            });
        }

        if (keys.length === 0 && filterText) {
            const noMatch = document.createElement('li');
            noMatch.textContent = 'No matches found for "' + filterText + '"';
            Object.assign(noMatch.style, { color: '#999', fontStyle: 'italic' });
            ul.appendChild(noMatch);
            return ul;
        }

        const totalKeys = keys.length;
        if (keys.length > MAX_TREE_KEYS) {
            keys = keys.slice(0, MAX_TREE_KEYS);
        }

        for (const key of keys) {
            const li = document.createElement('li');

            let value;
            try { value = obj[key]; } catch (_e) { value = '[Unreadable]'; }
            if (typeof value === 'function') {
                continue;
            }

            const valueType = Array.isArray(value) ? 'array'
                : value === null ? 'null'
                    : typeof value;

            if ((valueType === 'object' || valueType === 'array') && value !== null && !seen.has(value)) {
                const toggle = document.createElement('span');
                toggle.textContent = '\u25B6';
                Object.assign(toggle.style, { cursor: 'pointer', marginRight: '4px' });

                const labelSpan = document.createElement('span');
                labelSpan.style.cursor = 'pointer';

                const safeKey = escapeHtml(key);
                const typeInfo = ' [' + valueType + ']';
                const countInfo = valueType === 'object'
                    ? '(' + Object.keys(value).length + ')'
                    : valueType === 'array' ? '(' + value.length + ')' : '';

                let keyHtml = safeKey;
                if (filterText && key.toLowerCase().includes(filterText.toLowerCase())) {
                    keyHtml = safeKey.replace(
                        new RegExp('(' + escapeRegExp(filterText) + ')', 'gi'),
                        '<span style="background-color:yellow;font-weight:bold;">$1</span>'
                    );
                }
                labelSpan.innerHTML = '<strong class="scope-node-key">' + keyHtml + '</strong>' + typeInfo + countInfo;

                const childContainer = document.createElement('ul');
                Object.assign(childContainer.style, { display: 'none', listStyle: 'none', paddingLeft: '1em' });

                (function createToggleHandler(nodeValue, nodeContainer, nodeToggle, nodeFilterText) {
                    function handler(e) {
                        e.stopPropagation();
                        if (nodeContainer.childElementCount === 0) {
                            const childSeen = new WeakSet();
                            childSeen.add(nodeValue);
                            nodeContainer.appendChild(createTree(nodeValue, childSeen, nodeFilterText));
                        }
                        const isVisible = nodeContainer.style.display === 'block';
                        nodeContainer.style.display = isVisible ? 'none' : 'block';
                        nodeToggle.textContent = isVisible ? '\u25B6' : '\u25BC';
                    }
                    nodeToggle.addEventListener('click', handler);
                    labelSpan.addEventListener('click', handler);
                })(value, childContainer, toggle, filterText);

                li.appendChild(toggle);
                li.appendChild(labelSpan);
                li.appendChild(childContainer);
            } else {
                const val = (valueType === 'object' || valueType === 'array')
                    ? '[Circular]'
                    : JSON.stringify(value, null, 0);

                if (valueType === 'string' && value.length > STRING_PREVIEW_LENGTH) {
                    const shortVal = JSON.stringify(value.substring(0, STRING_PREVIEW_LENGTH) + '...', null, 0);
                    const fullVal = JSON.stringify(value, null, 0);

                    const container = document.createElement('span');
                    const keySpan = document.createElement('span');
                    let safeKey2 = escapeHtml(key);
                    if (filterText && key.toLowerCase().includes(filterText.toLowerCase())) {
                        safeKey2 = safeKey2.replace(
                            new RegExp('(' + escapeRegExp(filterText) + ')', 'gi'),
                            '<span style="background-color:yellow;font-weight:bold;">$1</span>'
                        );
                    }
                    keySpan.innerHTML = '<strong class="scope-node-key">' + safeKey2 + ': </strong>';

                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'string-value';
                    const safeShortVal = escapeHtml(shortVal);
                    if (filterText && value.toLowerCase().includes(filterText.toLowerCase())) {
                        valueSpan.innerHTML = safeShortVal.replace(
                            new RegExp('(' + escapeRegExp(filterText) + ')', 'gi'),
                            '<span style="background-color:yellow;font-weight:bold;">$1</span>'
                        );
                    } else {
                        valueSpan.innerHTML = safeShortVal;
                    }

                    const typeSpan = document.createElement('span');
                    typeSpan.innerHTML = ' [' + valueType + '] ';

                    const toggleLink = document.createElement('a');
                    toggleLink.href = '#';
                    toggleLink.className = 'toggle-string';
                    toggleLink.textContent = 'show more';
                    Object.assign(toggleLink.style, {
                        marginLeft: '5px', color: '#007bff',
                        textDecoration: 'none', fontSize: '10px', fontStyle: 'italic'
                    });

                    container.appendChild(keySpan);
                    container.appendChild(valueSpan);
                    container.appendChild(typeSpan);
                    container.appendChild(toggleLink);
                    li.appendChild(container);

                    (function (nodeValue, nodeValueSpan, nodeShortVal, nodeFullVal, nodeFilterText) {
                        toggleLink.addEventListener('click', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const isExpanded = this.textContent === 'show less';
                            const safeShort = escapeHtml(nodeShortVal);
                            const safeFull = escapeHtml(nodeFullVal);
                            const highlightRe = nodeFilterText && new RegExp('(' + escapeRegExp(nodeFilterText) + ')', 'gi');
                            const highlight = '<span style="background-color:yellow;font-weight:bold;">$1</span>';
                            const targetVal = isExpanded ? safeShort : safeFull;
                            const matchVal = isExpanded ? nodeShortVal : nodeFullVal;

                            nodeValueSpan.innerHTML = (highlightRe && matchVal.toLowerCase().includes(nodeFilterText.toLowerCase()))
                                ? targetVal.replace(highlightRe, highlight)
                                : targetVal;
                            this.textContent = isExpanded ? 'show more' : 'show less';
                        });
                    })(value, valueSpan, shortVal, fullVal, filterText);
                } else {
                    let safeKey3 = escapeHtml(key);
                    const safeVal = escapeHtml(String(val));
                    if (filterText && key.toLowerCase().includes(filterText.toLowerCase())) {
                        safeKey3 = safeKey3.replace(
                            new RegExp('(' + escapeRegExp(filterText) + ')', 'gi'),
                            '<span style="background-color:yellow;font-weight:bold;">$1</span>'
                        );
                    }
                    let safeValHighlighted = safeVal;
                    if (filterText && String(val).toLowerCase().includes(filterText.toLowerCase())) {
                        safeValHighlighted = safeVal.replace(
                            new RegExp('(' + escapeRegExp(filterText) + ')', 'gi'),
                            '<span style="background-color:yellow;font-weight:bold;">$1</span>'
                        );
                    }
                    const contentSpan = document.createElement('span');
                    Object.assign(contentSpan.style, {
                        maxWidth: '100%',
                        display: 'inline-block',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word'
                    });
                    contentSpan.innerHTML = '<strong class="scope-node-key">' + safeKey3 + '</strong>: ' + safeValHighlighted + ' [' + valueType + ']';
                    li.appendChild(contentSpan);
                }
            }

            (function addTreeLogButton(liEl, logObj, label) {
                const logButton = document.createElement('button');
                logButton.innerHTML = '\uD83D\uDCCB';
                logButton.style.cssText = 'background:none;border:none;cursor:pointer;';
                liEl.appendChild(logButton);
                logButton.addEventListener('click', function (e) {
                    e.stopPropagation();
                    console.log(label + '\n', logObj);
                });
            })(li, { objkey: obj[key], val: value }, escapeHtml(key));

            ul.appendChild(li);
        }

        if (totalKeys > MAX_TREE_KEYS) {
            const more = document.createElement('li');
            more.textContent = '... (' + (totalKeys - MAX_TREE_KEYS) + ' more items)';
            Object.assign(more.style, { color: '#999', fontStyle: 'italic' });
            ul.appendChild(more);
        }

        return ul;
    }


    /**
     * Recursively searches obj for keys or values that contain searchTerm.
     * Returns an array of match descriptors, capped at MAX_SEARCH_RESULTS.
     * @param   {object}   obj
     * @param   {string}   searchTerm
     * @param   {string}   [path='']      Dot-separated path to the current node.
     * @param   {Array}    [results=[]]   Accumulator for matches.
     * @param   {WeakSet}  [seen]         Tracks visited references.
     * @param   {number}   [depth=0]      Current recursion depth.
     * @returns {Array<{path: string, key: string, value: *, isKeyMatch: boolean}>}
     */
    function deepSearch(obj, searchTerm, path, results, seen, depth) {
        path = path ?? '';
        results = results ?? [];
        seen = seen ?? new WeakSet();
        depth = depth ?? 0;

        if (obj === null || typeof obj !== 'object' || seen.has(obj) || depth > MAX_SCOPE_DEPTH) {
            return results;
        }
        seen.add(obj);
        const lowerTerm = searchTerm.toLowerCase();

        for (const key in obj) {
            if (results.length >= MAX_SEARCH_RESULTS) {
                break;
            }
            const value = obj[key];
            const currentPath = path ? path + '.' + key : key;

            if (key.toLowerCase().includes(lowerTerm)) {
                results.push({ path: currentPath, key: key, value: value, isKeyMatch: true });
            }
            if (value !== null && typeof value !== 'object' && typeof value !== 'function') {
                if (String(value).toLowerCase().includes(lowerTerm)) {
                    results.push({ path: currentPath, key: key, value: value, isKeyMatch: false });
                }
            }
            if (value !== null && typeof value === 'object' && !seen.has(value)) {
                deepSearch(value, searchTerm, currentPath, results, seen, depth + 1);
            }
        }
        return results;
    }


    /**
     * Expands the tree node at the given dot-split path inside container and
     * scrolls it into view.  Falls back to content-based search when an exact
     * key match is not found.
     * @param {Element} container  Root element of the tree.
     * @param {string[]} path      Array of key segments to traverse.
     */
    function expandPathInTree(container, path) {
        if (!path.length) {
            return;
        }
        const currentKey = path[0];
        const remainingPath = path.slice(1);
        let found = false;
        const items = container.querySelectorAll('li');

        for (const item of items) {
            const itemText = (item.textContent || '').replace(/[▶▼]/g, '').trim();
            const itemKey = itemText.includes(':') ? itemText.split(':')[0].trim()
                : itemText.includes('[') ? itemText.split('[')[0].trim()
                    : itemText;

            if (itemKey === currentKey) {
                const toggle = item.querySelector('span[style*="cursor: pointer"]');
                if (toggle && (toggle.textContent === '\u25B6' || toggle.textContent === '\u25BC')) {
                    if (toggle.textContent === '\u25B6') {
                        toggle.click();
                    }
                    if (remainingPath.length > 0) {
                        const childUl = Array.from(item.children).find((c) => c.tagName === 'UL') ?? null;
                        if (childUl) {
                            setTimeout(function () { expandPathInTree(childUl, remainingPath); }, 50);
                        }
                    } else {
                        highlightItem(item);
                    }
                } else if (remainingPath.length === 0) {
                    highlightItem(item);
                }
                found = true;
                break;
            }
        }

        if (!found) {
            searchForNodeByContent(container, currentKey, remainingPath);
        }
    }


    /**
     * Briefly highlights a tree list item with a yellow background and a
     * "← MATCH" marker to draw the user's eye to the matched node.
     * @param {HTMLElement} item
     */
    function highlightItem(item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const originalBg = item.style.backgroundColor;
        item.style.backgroundColor = '#ffff9e';
        item.style.transition = 'background-color 1s';

        const marker = document.createElement('span');
        marker.textContent = ' \u2190 MATCH';
        Object.assign(marker.style, {
            color: '#e65100', fontWeight: 'bold', fontSize: '11px', marginLeft: '5px'
        });
        item.appendChild(marker);

        setTimeout(function () {
            item.style.backgroundColor = originalBg;
            if (item.contains(marker)) {
                item.removeChild(marker);
            }
        }, 5000);
    }


    /**
     * Fallback search used by expandPathInTree when an exact key match fails.
     * Finds the best-matching list item by text content and expands it.
     * @param {Element}  container      Tree root element.
     * @param {string}   searchKey      Key name to look for.
     * @param {string[]} remainingPath  Remaining path segments to traverse after matching.
     */
    function searchForNodeByContent(container, searchKey, remainingPath) {
        const items = container.querySelectorAll('li');
        let bestMatch = null;

        for (const item of items) {
            if (item.textContent.includes(searchKey)) {
                bestMatch = item;
                if (item.textContent.includes(searchKey + ':') ||
                    item.textContent.includes(searchKey + ' [')) {
                    const toggle = item.querySelector('span[style*="cursor: pointer"]');
                    if (toggle && toggle.textContent === '\u25B6') {
                        toggle.click();
                    }
                    if (remainingPath.length > 0) {
                        const childUl = item.querySelector('ul');
                        if (childUl) {
                            setTimeout(function () { expandPathInTree(childUl, remainingPath); }, 50);
                            return;
                        }
                    }
                    highlightItem(item);
                    return;
                }
            }
        }
        if (bestMatch) {
            highlightItem(bestMatch);
        }
    }
}
