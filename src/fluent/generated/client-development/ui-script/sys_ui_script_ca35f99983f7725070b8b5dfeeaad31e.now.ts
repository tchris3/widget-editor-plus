import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['ca35f99983f7725070b8b5dfeeaad31e'],
    table: 'sys_ui_script',
    data: {
        active: 'true',
        description: 'Bootstrap script to be used with monaco_plus_core UI script.',
        global: 'true',
        ignore_in_now_experience: 'false',
        name: 'monaco_plus_bootstrap',
        script: `/**
 * ============================================================================
 * UI Script: monaco_plus_bootstrap
 * ============================================================================
 * Purpose: Lightweight loader that lazy-loads monaco_plus_core exactly once
 * per page, and mounts/enhances a Monaco editor on a ServiceNow form field.
 *
 * Contains:
 *   - Blob constructor patch (fixes ServiceNow mangling Monaco worker URLs)
 *   - User editor-preference loading (via WidgetEditorAjax) and merging into
 *     monaco.editor.create() options
 *   - Theme resolution (from user prefs, or auto-detected from page background)
 *   - ensureCoreLoaded() — lazy-loads monaco_plus_core.jsdbx once
 *   - upgradeEditor() — mounts Monaco on a form field, tearing down CodeMirror
 *     or enhancing an already-rendered native Monaco editor as needed
 *   - Exposes window.SNMonacoPlusBootstrap { init, ensureCoreLoaded,
 *     upgradeEditor, getUserPrefs, coreUrl }
 * ============================================================================
 */
/* global ScriptLoader */
(function (global) {
    'use strict';

    // Patches Blob so worker source gets ?sysparm_substitute=false before ServiceNow can mangle it — MonacoEnvironment.getWorker overrides run too late (Monaco captures them in closures at bundle-eval time).
    if (!global._snBlobWorkerPatchInstalled) {
        global._snBlobWorkerPatchInstalled = true;
        var _OrigBlob = global.Blob;
        global.Blob = function (parts, options) {
            if (Array.isArray(parts)) {
                parts = parts.map(function (part) {
                    if (
                        typeof part === 'string' &&
                        part.indexOf('importScripts') !== -1 &&
                        part.indexOf('snc-code-editor') !== -1 &&
                        part.indexOf('sysparm_substitute') === -1
                    ) {
                        return part.replace(
                            /(snc-code-editor\\/[^"'?]+)/g,
                            '$1?sysparm_substitute=false'
                        );
                    }
                    return part;
                });
            }
            return new _OrigBlob(parts, options);
        };
        global.Blob.prototype = _OrigBlob.prototype;
    }

    if (
        global.SNMonacoPlusBootstrap &&
        typeof global.SNMonacoPlusBootstrap.init === 'function'
    ) {
        return;
    }

    var _v = '2026-08-31T00:00';
    var CORE_UI_SCRIPT_URL = '/monaco_plus_core.jsdbx?sysparm_substitute=false&v=' + _v;
    var MONACO_BUNDLE_URL =
        '/scripts/snc-code-editor/monaco.bundle.min.jsx?sysparm_substitute=false';
    var MONACO_WORKER_BASE = '/scripts/snc-code-editor/';
    var MONACO_CSS_URL = '/monacoIncludes.cssx';

    var _coreLoadPromise = null;
    var _userPrefsPromise = null;

    /**
     * Loads the current user's Monaco+ prefs via WidgetEditorAjax, cached for the page lifetime.
     * @returns {Promise<Object>} Resolves to the prefs object (possibly empty).
     */
    function _loadUserPrefs() {
        if (_userPrefsPromise) {
            return _userPrefsPromise;
        }
        _userPrefsPromise = new Promise(function (resolve) {
            if (typeof global.GlideAjax !== 'function') {
                resolve({});
                return;
            }
            try {
                var ga = new global.GlideAjax('WidgetEditorAjax');
                ga.addParam('sysparm_name', 'getUserPrefs');
                ga.getXMLAnswer(function (answer) {
                    var prefs = {};
                    try {
                        var parsed = JSON.parse(answer);
                        if (parsed && parsed.success && parsed.value) {
                            var inner = JSON.parse(parsed.value);
                            if (inner && typeof inner === 'object') {
                                prefs = inner;
                            }
                        }
                    } catch (e) {}
                    resolve(prefs);
                });
            } catch (e) {
                resolve({});
            }
        });
        return _userPrefsPromise;
    }

    /**
     * Merges the user-pref subset that maps to Monaco editor.create options.
     * @param {Object} prefs - Parsed user prefs (may be empty).
     * @param {Object} base  - Base options to merge onto.
     * @returns {Object} New options object.
     */
    function _mergePrefsIntoOptions(prefs, base) {
        var out = {};
        for (var k in base) {
            if (Object.prototype.hasOwnProperty.call(base, k)) {
                out[k] = base[k];
            }
        }
        if (!prefs) {
            return out;
        }
        if (typeof prefs.fontSize === 'number' && prefs.fontSize >= 8 && prefs.fontSize <= 32) {
            out.fontSize = prefs.fontSize;
        }
        if (prefs.fontFamily) {
            out.fontFamily = prefs.fontFamily;
        }
        if (prefs.hasOwnProperty('wordWrap')) {
            out.wordWrap = prefs.wordWrap ? 'on' : 'off';
        }
        if (prefs.hasOwnProperty('minimap')) {
            out.minimap = { enabled: !!prefs.minimap };
        }
        if (typeof prefs.tabSize === 'number' && prefs.tabSize >= 1 && prefs.tabSize <= 8) {
            out.tabSize = prefs.tabSize;
        }
        if (prefs.hasOwnProperty('formatTabsToSpaces')) {
            out.insertSpaces = !!prefs.formatTabsToSpaces;
        }
        if (prefs.hasOwnProperty('autoIndent')) {
            out.autoIndent = prefs.autoIndent ? 'advanced' : 'none';
        }
        if (prefs.hasOwnProperty('formatOnPaste')) {
            out.formatOnPaste = !!prefs.formatOnPaste;
        }
        if (prefs.hasOwnProperty('formatOnType')) {
            out.formatOnType = !!prefs.formatOnType;
        }
        if (prefs.autoSurround) {
            out.autoSurround = prefs.autoSurround;
        }
        if (prefs.autoClosingBrackets) {
            out.autoClosingBrackets = prefs.autoClosingBrackets;
        }
        if (prefs.autoClosingQuotes) {
            out.autoClosingQuotes = prefs.autoClosingQuotes;
        }
        if (prefs.hasOwnProperty('stickyScroll')) {
            out.stickyScroll = { enabled: !!prefs.stickyScroll };
        }
        if (prefs.hasOwnProperty('linkedEditing')) {
            out.linkedEditing = !!prefs.linkedEditing;
        }
        return out;
    }

    /**
     * Picks a Monaco theme from prefs.editorTheme, deferring to fallbackResolver when absent or 'auto'.
     * @param {Object}   prefs
     * @param {Function} fallbackResolver
     * @returns {string}
     */
    function _resolveThemeFromPrefs(prefs, fallbackResolver) {
        var pref = prefs && prefs.editorTheme;
        if (pref === 'light' || pref === 'vs') {
            return 'vs';
        }
        if (pref === 'dark' || pref === 'vs-dark') {
            return 'vs-dark';
        }
        return fallbackResolver();
    }

    function _loadScript(url, callback) {
        if (typeof ScriptLoader !== 'undefined' && ScriptLoader.getScripts) {
            ScriptLoader.getScripts(url, callback);
            return;
        }
        var script = global.document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = callback;
        script.onerror = callback;
        global.document.head.appendChild(script);
    }

    /**
     * Ensures monaco_plus_core is loaded, returning a Promise that resolves to
     * the SNMonacoPlus API object (or null if loading failed).
     *
     * @returns {Promise<Object|null>}
     */
    function ensureCoreLoaded() {
        if (
            global.SNMonacoPlus &&
            typeof global.SNMonacoPlus.init === 'function'
        ) {
            return Promise.resolve(global.SNMonacoPlus);
        }

        if (_coreLoadPromise) {
            return _coreLoadPromise;
        }

        _coreLoadPromise = new Promise(function (resolve) {
            function finish() {
                resolve(global.SNMonacoPlus || null);
            }

            if (!global.document) {
                finish();
                return;
            }

            _loadScript(CORE_UI_SCRIPT_URL, finish);
        });

        return _coreLoadPromise;
    }

    /**
     * Loads the core Monaco plus UI Script on demand, then initialises it.
     * Safe to call multiple times across multiple Client Scripts.
     *
     * @param {Object} [config] - Optional config passed through to SNMonacoPlus.init.
     * @returns {Promise<Object|null>} Promise resolving to the enhancer API or null.
     */
    function init(config) {
        _ensureMonacoCss();
        _ensureHoverCodeColorFix();
        return ensureCoreLoaded().then(function (api) {
            if (api && typeof api.init === 'function') {
                api.init(config || {});
                return api;
            }
            return null;
        });
    }

    /**
     * Returns 'vs' (light) or 'vs-dark' based on the page's primary background
     * CSS variable luminance. Falls back to 'vs' if the variable is absent.
     *
     * @returns {string} Monaco theme id.
     */
    function _getDefaultTheme() {
        try {
            var bg = global
                .getComputedStyle(global.document.documentElement)
                .getPropertyValue('--now-color_background--primary')
                .trim();
            if (bg) {
                var parts = bg.split(/[\\s,]+/).map(Number);
                if (parts.length >= 3 && !isNaN(parts[0])) {
                    return (parts[0] + parts[1] + parts[2]) / 3 >= 128
                        ? 'vs'
                        : 'vs-dark';
                }
            }
        } catch (e) {}
        return 'vs';
    }

    /**
     * Injects monacoIncludes.cssx as a page stylesheet if not already present.
     * Pages that ServiceNow natively hosts Monaco on load this automatically;
     * other pages (e.g. sp_css.do) must have it injected to get hover and
     * suggest widget CSS.
     */
    function _ensureMonacoCss() {
        if (
            !global.document ||
            global.document.querySelector('link[href*="monacoIncludes"]')
        ) {
            return;
        }
        var link = global.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = MONACO_CSS_URL;
        global.document.head.appendChild(link);
    }

    /**
     * Pins hover-widget code-span text color to Monaco's own theme.
     */
    function _ensureHoverCodeColorFix() {
        if (
            !global.document ||
            global.document.getElementById('sn-monaco-plus-hover-code-fix')
        ) {
            return;
        }
        var style = global.document.createElement('style');
        style.id = 'sn-monaco-plus-hover-code-fix';
        style.textContent =
            '.monaco-editor .monaco-hover code {' +
            'color: var(--vscode-textPreformat-foreground, var(--vscode-editor-foreground));' +
            '}';
        global.document.head.appendChild(style);
    }

    /**
     * Ensures MonacoEnvironment.getWorker routes CSS/SCSS/LESS to the CSS worker
     * and all other languages to the generic editor worker.
     */
    function _configureWorkers() {
        if (!global.MonacoEnvironment) {
            global.MonacoEnvironment = {};
        }
        global.MonacoEnvironment.getWorker = function (_moduleId, label) {
            var file;
            if (label === 'css' || label === 'scss' || label === 'less') {
                file = 'css.worker.bundle.min.jsx';
            } else if (label === 'json') {
                file = 'json.worker.bundle.min.jsx';
            } else if (label === 'typescript' || label === 'javascript') {
                file = 'ts.worker.bundle.min.jsx';
            } else if (label === 'html' || label === 'handlebars' || label === 'razor') {
                file = 'html.worker.bundle.min.jsx';
            } else {
                file = 'editor.worker.bundle.min.jsx';
            }
            return new Worker(
                MONACO_WORKER_BASE + file + '?sysparm_substitute=false'
            );
        };
    }

    /**
     * Loads the SCSS Monarch tokenizer (falling back to CSS) and applies it before editor creation.
     * @param {Function} done - Callback invoked once the language is ready.
     */
    function _ensureScssLanguageReady(done) {
        var langs = global.monaco.languages.getLanguages();
        var scssInfo = langs.filter(function (l) {
            return l.id === 'scss';
        })[0];

        function applyAndDone(mod) {
            if (mod && mod.language) {
                global.monaco.languages.setMonarchTokensProvider(
                    'scss',
                    mod.language
                );
            }
            if (mod && mod.conf) {
                global.monaco.languages.setLanguageConfiguration(
                    'scss',
                    mod.conf
                );
            }
            done();
        }

        if (scssInfo && typeof scssInfo.loader === 'function') {
            scssInfo.loader().then(applyAndDone);
            return;
        }

        // No dedicated SCSS loader — register the language id and fall back to CSS tokens
        global.monaco.languages.register({
            id: 'scss',
            extensions: ['.scss'],
            mimetypes: ['text/x-scss'],
        });

        var cssInfo = langs.filter(function (l) {
            return l.id === 'css';
        })[0];
        if (cssInfo && typeof cssInfo.loader === 'function') {
            cssInfo.loader().then(applyAndDone);
        } else {
            done();
        }
    }

    /**
     * Mounts a Monaco Editor over a ServiceNow form field — enhancing it in place if
     * Monaco already renders there, tearing down CodeMirror if present, or mounting
     * fresh against the textarea value otherwise.
     * @param {Object}   config
     * @param {Object}   config.gForm            - The ServiceNow GlideForm (g_form).
     * @param {string}   config.field            - Field name to mount the editor on.
     * @param {string}   [config.language]       - Monaco language id (default: 'javascript').
     * @param {string|number} [config.height]    - Editor height (number treated as px); defaults to the replaced textarea's rendered height.
     * @param {string}   [config.containerStyle] - Inline CSS for the editor container div; overrides config.height when both are given.
     * @param {Function} [config.resolveTheme]   - Returns a Monaco theme id; defaults to auto-detect.
     * @param {Object}   [config.editorOptions]  - monaco.editor.create options, applied before create (wins over user prefs).
     * @param {Function} [config.onEditorReady]  - Called with the created editor instance.
     * @returns {Promise<Object|null>} Resolves to the Monaco editor instance, or null.
     */
    function upgradeEditor(config) {
        config = config || {};

        var gForm = config.gForm || global.g_form;
        var field = config.field;
        var language = config.language || 'javascript';
        var resolveTheme = config.resolveTheme || _getDefaultTheme;

        if (!gForm || !field) {
            return Promise.resolve(null);
        }

        var textarea = gForm.getElement(field);
        if (!textarea || !textarea.parentElement) {
            return Promise.resolve(null);
        }

        var parent = textarea.parentElement;

        // Auto-size from the textarea being replaced, unless the caller overrides.
        var height = config.height;
        if (!height) {
            var measuredHeight =
                textarea.getBoundingClientRect().height || textarea.offsetHeight;
            // Floor so a hidden/collapsed textarea (rect reads 0) doesn't produce an unusable box.
            height = (measuredHeight >= 60 ? measuredHeight : 200) + 'px';
        } else if (typeof height === 'number') {
            height = height + 'px';
        }

        /* SN border tokens are RGB triplets, so they must be wrapped in rgb(). */
        var containerStyle =
            config.containerStyle ||
            'width:100%;height:' + height + ';max-height:' + height + ';' +
                'border:1px solid rgb(var(--now-form-field--border-color, var(--now-color_border--primary)));';

        function install() {
            /* Monaco already mounted — just enhance with core features */
            if (parent.querySelector('.monaco-editor')) {
                init({ language: language });
                return Promise.resolve(null);
            }

            _ensureMonacoCss();

            var cmEl = parent.querySelector('.CodeMirror');
            var cmInstance = cmEl && cmEl.CodeMirror;
            var initialValue = cmInstance
                ? cmInstance.getValue()
                : textarea.value || '';

            if (cmInstance && typeof cmInstance.toTextArea === 'function') {
                cmInstance.toTextArea();
            }

            textarea.style.display = 'none';

            // Protection-policy read-only fields render a separate display
            // element (id "sys_readonly.<field>") instead of the real control,
            // which stays visible above the editor unless hidden too.
            var readonlyShadow = global.document.getElementById(
                'sys_readonly.' + textarea.id
            );
            if (readonlyShadow) {
                readonlyShadow.style.display = 'none';
            }

            // Reuse an existing container if mountFieldEditor was called before
            var containerId =
                (gForm.getTableName ? gForm.getTableName() : 'sn') +
                '_' +
                field +
                '_monaco';
            var container = parent.querySelector(
                '[data-sn-monaco-field="' + field + '"]'
            );
            if (!container) {
                container = global.document.createElement('div');
                container.setAttribute('data-sn-monaco-field', field);
                container.id = containerId;
                container.style.cssText = containerStyle;
                parent.appendChild(container);
            }

            return new Promise(function (resolve) {
                /* Fetched in parallel with the bundle, awaited just before create. */
                var prefsPromise = _loadUserPrefs();
                _loadScript(MONACO_BUNDLE_URL, function () {
                    if (!global.monaco || !global.monaco.editor) {
                        resolve(null);
                        return;
                    }

                    _configureWorkers();

                    function createEditor(prefs) {
                        var theme = _resolveThemeFromPrefs(prefs, resolveTheme);
                        var options = _mergePrefsIntoOptions(prefs, {
                            value: initialValue,
                            language: language,
                            theme: theme,
                            automaticLayout: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            readOnly: !!readonlyShadow,
                        });
                        for (var optKey in config.editorOptions) {
                            if (Object.prototype.hasOwnProperty.call(config.editorOptions, optKey)) {
                                options[optKey] = config.editorOptions[optKey];
                            }
                        }
                        var editor = global.monaco.editor.create(container, options);
                        global.monaco.editor.setTheme(theme);

                        editor.onDidChangeModelContent(function () {
                            textarea.value = editor.getValue();
                            try {
                                textarea.dispatchEvent(
                                    new Event('input', { bubbles: true })
                                );
                                textarea.dispatchEvent(
                                    new Event('change', { bubbles: true })
                                );
                            } catch (e) {}
                        });

                        // Completions, IntelliSense, and language DTS are handled by core
                        init({ language: language });

                        if (typeof config.onEditorReady === 'function') {
                            config.onEditorReady(editor);
                        }

                        resolve(editor);
                    }

                    function readyWithPrefs() {
                        prefsPromise.then(createEditor);
                    }

                    // SCSS needs its Monarch tokenizer applied before the editor is created for correct first-render highlighting.
                    if (language === 'scss') {
                        _ensureScssLanguageReady(readyWithPrefs);
                    } else {
                        readyWithPrefs();
                    }
                });
            });
        }

        // Monaco preloaded by ServiceNow — _loadScript will return immediately since
        // the bundle is already present; install() handles the .monaco-editor check.
        return install();
    }

    global.SNMonacoPlusBootstrap = {
        init: init,
        ensureCoreLoaded: ensureCoreLoaded,
        upgradeEditor: upgradeEditor,
        getUserPrefs: _loadUserPrefs,
        coreUrl: CORE_UI_SCRIPT_URL,
    };
})(typeof window !== 'undefined' ? window : globalThis);
`,
        ui_type: '0',
        use_scoped_format: 'false',
    },
})
