import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['a424391983f7725070b8b5dfeeaad3cc'],
    table: 'sys_ui_script',
    data: {
        active: 'true',
        description:
            'Supports loading enhancements for the Monaco Editor to add IntelliSense, code actions and method signatures.',
        global: 'false',
        ignore_in_now_experience: 'false',
        name: 'monaco_plus_core',
        script: `/**
 * SNMonacoPlus — Core Monaco enhancement library for ServiceNow.
 *
 * Enriches Monaco Editor instances on ServiceNow pages with:
 *  - Server-side IntelliSense: Script Include dot-completions, GlideRecord field
 *    completions, and hover documentation fetched live from the instance.
 *  - Type definitions: ServiceNow server API (via /api/now/syntax_editor/completions)
 *    and the Monarch DTS for server or client language services.
 *  - Client-side IntelliSense: AngularJS, g_form, spUtil, and $sp type declarations.
 *  - HTML editor support: AngularJS ng-* / sp-* tokenizer via MONACO_LANGUAGE_HTML.
 *  - Code actions: JSDoc insertion (JavaScript) and px→rem conversion (CSS/SCSS).
 *  - CSS variable completions sourced from sys_properties.
 *  - Configurable per-language initialisation: 'javascript' (server), 'javascript' +
 *    isClient:true (client), 'typescript' (Widget Editor server pane), 'html', 'css', 'scss'.
 *
 * This script is intentionally loaded on-demand by SNMonacoPlusBootstrap rather
 * than eagerly included on every page. Call SNMonacoPlusBootstrap.init() instead
 * of referencing this script directly.
 *
 * ── Usage ───────────────────────────────────────────────────────────────────────────
 *
 * Typical usage from a Client Script (onLoad) via the Bootstrap UI Script:
 *
 *   // Server-side Script Include form (default — javascript language):
 *   SNMonacoPlusBootstrap.init();
 *
 *   // Server-side Script Include form with app scope for SN type completions:
 *   SNMonacoPlusBootstrap.init({ appSysId: g_form.getValue('sys_scope') });
 *
 *   // Client script form (client-side DTS — AngularJS, g_form, spUtil):
 *   SNMonacoPlusBootstrap.init({ isClient: true });
 *
 *   // Widget Editor server pane (TypeScript language service, so it can coexist
 *   // with a simultaneous javascript-language client pane):
 *   SNMonacoPlusBootstrap.init({ language: 'typescript', appSysId: scopeSysId });
 *
 *   // Widget Editor client pane:
 *   SNMonacoPlusBootstrap.init({ language: 'javascript', isClient: true });
 *
 *   // SCSS editor (px→rem code actions + CSS variable completions):
 *   SNMonacoPlusBootstrap.init({ language: 'scss', getRemBase: function() { return 16; } });
 *
 * Safe to call multiple times — per-language initialisation is idempotent.
 * The Bootstrap script ensures the core is loaded only once regardless of how many
 * Client Scripts call init().
 *
 * ── Config options ───────────────────────────────────────────────────────────────────
 *
 *   language          'javascript' | 'typescript' | 'html' | 'css' | 'scss'  (default: 'javascript')
 *   isClient          boolean — load client-side DTS instead of server DTS    (default: false)
 *   appSysId          string  — scope sys_id passed to the SN completions API  (default: undefined)
 *   getRemBase        fn→number — returns the CSS rem base for px→rem actions  (default: ()=>16)
 *   pollIntervalMs    number  — Monaco readiness poll interval in ms            (default: 200)
 *   maxWaitMs         number  — max time to wait for Monaco in ms               (default: 10000)
 *   definitionUrl     string  — override URL for the server Monarch DTS script  (default: built-in)
 *   clientDefinitionUrl string — override URL for the client Monarch DTS script (default: built-in)
 *   codeActionsUrl    string  — override URL for the code actions script        (default: built-in)
 *   htmlMonarchUrl    string  — override URL for the HTML Monarch script        (default: built-in)
 */
/* global ScriptLoader */
(function (global) {
    'use strict';

    if (global.SNMonacoPlus && typeof global.SNMonacoPlus.init === 'function') {
        return;
    }

    var _initialized = false;
    var _globalSetupDone = false;
    var _initializedLangs = {};
    var _codeActionsGetRemBase = function () {
        return 16;
    };
    var _pollIntervalMs = 200;
    var _maxWaitMs = 10000;
    var _v = '2026-04-25T12:00';
    var _definitionUrl =
        'monaco_language_server.jsdbx?sysparm_substitute=false&v=' + _v;
    var _clientDefinitionUrl =
        'monaco_language_client.jsdbx?sysparm_substitute=false&v=' + _v;
    var _codeActionsUrl =
        'monaco_code_actions.jsdbx?sysparm_substitute=false&v=' + _v;
    var _htmlMonarchUrl =
        'monaco_language_html.jsdbx?sysparm_substitute=false&v=' + _v;
    var _cssLanguageUrl =
        'monaco_language_css.jsdbx?sysparm_substitute=false&v=' + _v;
    var _api = {
        init: init,
        loadSnTypeDefinitions: function () {},
        loadServerMonarchDts: function () {},
        loadClientMonarchDts: function (cb) {
            if (typeof cb === 'function') {
                cb();
            }
        },
        loadHtmlMonarchDts: function (cb) {
            if (typeof cb === 'function') {
                cb();
            }
        },
        loadCssLanguageDts: function (cb) {
            if (typeof cb === 'function') {
                cb();
            }
        },
        loadCodeActions: function () {},
        markAngularModel: function (modelId) {
            _api.loadCodeActions({ modelId: modelId, isAngular: true });
        },
        scanAndFetchSIs: function () {},
        getSiSysId: function () {
            return null;
        },
        checkSiExists: function (name, cb) {
            cb(null, null);
        },
        loadCssVariables: function () {},
        loadScssVariables: function () {},
        loadCssEditorSupport: function () {},
        setUnusedVarsEnabled: function (enabled) {
            _showUnusedVars = !!enabled;
            if (!window.monaco || !monaco.editor) return;
            monaco.editor.getModels().forEach(function (model) {
                var lang = model.getLanguageId();
                if (lang !== 'javascript' && lang !== 'typescript') return;
                if (!_showUnusedVars) {
                    monaco.editor.setModelMarkers(model, 'we-unused', []);
                } else if (_scheduleUnusedRefresh) {
                    _scheduleUnusedRefresh(model);
                }
            });
        },
    };

    var _showUnusedVars = true;
    var _scheduleUnusedRefresh = null;

    /*
     * { ClassName: ParsedMethod[] }   — populated lazily on first dot trigger.
     * { ClassName: string[] }         — interface declarations from @typedef blocks.
     * { ClassName: ParsedConstant[] } — static property assignments (e.g. MyService.X = 1).
     * { ClassName: Promise }          — deduplicates in-flight fetches.
     */
    var _siMethodCache = {};
    var _siInterfaceCache = {};
    var _siConstantCache = {};
    var _siPendingCache = {};

    /*
     * Set of class names for which we have registered a fully-typed d.ts.
     * Used to filter out SN's untyped overloads that would otherwise cause
     * TypeScript to merge \\\`getCount(): any\\\` with our \\\`getCount(): number\\\`,
     * producing spurious GlideElement suggestions for primitive-typed variables.
     */
    var _siProtectedClasses = {};
    var _addExtraLibFilterInstalled = false;

    /* Matches SN's augmentations that make Number/String/Boolean/Any extend GlideElement,
     * causing GlideElement methods to appear as completions on all primitive types. */
    var _PRIM_AUG_RE = /(?:declare\\s+)?interface\\s+(?:Number|String|Boolean|Any)\\s+extends\\s+GlideElement\\b[^{]*\\{[^}]*\\}/g;
    var _primitiveAugsCleaned = false;

    /*
     * Lazy SI name cache.
     * { name: sys_id }  — confirmed Script Include (sys_id string).
     * { name: '' }      — confirmed non-SI (negative cache, avoids repeat lookups).
     * key absent        — not yet checked.
     */
    var _siNameMap = {};

    /* { name: true } — SI names already fetched or in-flight via _fetchSIIntellisense. */
    var _siFetched = {};

    /* { TableName: FieldDescriptor[] } — populated lazily on first GlideRecord dot trigger. */
    var _tableFieldCache = {};
    var _tablePendingCache = {};

    /* { name: string, value: string }[] — CSS custom properties loaded from sys_properties. */
    var _cssVarCache = null;
    var _cssVarCompletionRegistered = false;

    /* { name: string, value: string }[] — SCSS variables loaded from sys_properties. */
    var _scssVarCache = null; // null = not yet fetched; [] = fetched (empty or error)
    var _scssVarPromise = null; // in-flight XHR promise — deduplicates concurrent requests
    var _scssVarCompletionRegistered = false;
    var _scssVarHoverRegistered = false;

    /* Provider registration flags — prevent double-registration on the same page. */
    var _completionRegistered = false;
    var _hoverRegistered = false;
    var _sigHelpRegistered = false;
    var _newSiRegistered = false;
    var _grStringCompletionRegistered = false;
    var _grStringHoverRegistered = false;
    var _grConstructorCompletionRegistered = false;
    var _siParamStringCompletionRegistered = false;

    /* 'table.field' → field descriptor | null — for string-arg hover. */
    var _fieldDocCache = {};

    var _clientMonarchLoading = false;
    var _clientMonarchPending = [];
    /* AngularJS DI-aware api.controller signature (see _installClientDiWatcher). */
    var _clientDiWatcherInstalled = false;
    var _clientDiLastParamsKey = null;
    var _clientDiTimers = {};
    /* Replacement TS/JS quick-info hover (see _installQuickInfoHover). */
    var _qiHoverInstalled = false;
    var _qiKeepAliveTimer = null;
    var _htmlMonarchLoading = false;
    var _htmlMonarchPending = [];
    var _cssLanguageLoading = false;
    var _cssLanguagePending = [];
    var _codeActionsLoading = false;
    var _codeActionsReady = false;
    var _codeActionsPendingAngular = [];

    ///////////////////////////////////////////
    // Shared utilities
    ///////////////////////////////////////////

    function _logError(title, msg) {
        // eslint-disable-next-line no-console
        console.error(
            '%c[Monaco Editor+] ⚠️  ' + title + '%c\\n' + msg,
            'color: #c21c0a; font-weight: bold; font-size: 12px;',
            'color: #666; font-size: 11px;'
        );
    }

    function _flushPending(pending) {
        pending.splice(0).forEach(function (fn) {
            fn();
        });
    }

    function _loadScript(url, onLoad, onError) {
        var script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = onLoad;
        script.onerror = onError;
        document.head.appendChild(script);
    }

    /* Extracts a scalar value from a ServiceNow REST response field, which may be
     * a plain string or a {value, display_value} link object depending on the endpoint. */
    function _snVal(v, fallback) {
        if (v == null) {
            return fallback != null ? fallback : '';
        }
        return typeof v === 'object'
            ? v.value || v.display_value || fallback || ''
            : v || fallback || '';
    }

    ///////////////////////////////////////////
    // Polling
    ///////////////////////////////////////////

    /**
     * Polls until Monaco (and, for JS/TS languages, its TypeScript language
     * service) is available, then invokes cb. Gives up silently after _maxWaitMs.
     *
     * @param {Function} cb       - Callback invoked once Monaco is ready.
     * @param {string}  [langHint] - Optional language hint. When 'css', 'scss',
     *                               or 'html', TypeScript readiness is not required
     *                               because those languages don't use the TS service.
     */
    function waitForMonaco(cb, langHint) {
        var needsTypeScript =
            langHint !== 'css' && langHint !== 'scss' && langHint !== 'html';
        var elapsed = 0;
        var timer = setInterval(function () {
            elapsed += _pollIntervalMs;
            var monacoReady = window.monaco && monaco.languages;
            var tsReady =
                !needsTypeScript ||
                (monaco.languages && monaco.languages.typescript);
            if (monacoReady && tsReady) {
                clearInterval(timer);
                cb();
            } else if (elapsed >= _maxWaitMs) {
                clearInterval(timer);
                _logError(
                    'Initialization Error',
                    'Timeout waiting for Monaco Editor to load (>' +
                        _maxWaitMs +
                        'ms).\\n' +
                        'Ensure the page has loaded the Monaco Editor library before calling SNMonacoPlus.init().'
                );
            }
        }, _pollIntervalMs);
    }

    ///////////////////////////////////////////
    // JSDoc parsing
    ///////////////////////////////////////////

    /**
     * Converts a JSDoc type annotation string to its TypeScript equivalent.
     *
     * @param {string} jsType - JSDoc type string (e.g. 'boolean', 'Array<string>').
     * @returns {string} The corresponding TypeScript type, or 'any' if unrecognised.
     */
    function jsDocTypeToTs(jsType) {
        if (!jsType) {
            return 'any';
        }
        var t = jsType.trim();
        if (t.indexOf('|') !== -1) {
            return t.split('|').map(jsDocTypeToTs).join(' | ');
        }
        var arr = t.match(/^Array<(.+)>$/i);
        if (arr) {
            return jsDocTypeToTs(arr[1]) + '[]';
        }
        if (/\\[\\]$/.test(t)) {
            return jsDocTypeToTs(t.slice(0, -2)) + '[]';
        }
        var map = {
            string: 'string',
            String: 'string',
            number: 'number',
            Number: 'number',
            int: 'number',
            Integer: 'number',
            float: 'number',
            Float: 'number',
            boolean: 'boolean',
            Boolean: 'boolean',
            bool: 'boolean',
            object: 'object',
            Object: 'object',
            void: 'void',
            null: 'null',
            undefined: 'undefined',
            '*': 'any',
            any: 'any',
        };
        return map[t] !== undefined ? map[t] : t;
    }

    /**
     * Parses @param and @returns JSDoc tags from a block comment string.
     *
     * @param {string} comment - Raw block comment text including delimiters.
     * @returns {{ params: Object, returns: string }}
     */
    function parseSiDocComment(comment) {
        var result = {
            params: {},
            returns: 'any',
        };
        if (!comment) {
            return result;
        }
        var paramRe =
            /@param\\s+\\{([^}]+)\\}\\s+(\\[?)(\\w+)\\]?[ \\t]*(?:-[ \\t]*)?([^\\r\\n]*)/g;
        var pm;
        while ((pm = paramRe.exec(comment)) !== null) {
            var desc = pm[4] ? pm[4].trim() : null;
            result.params[pm[3]] = {
                type: jsDocTypeToTs(pm[1]),
                optional: pm[2] === '[',
                description: desc || null,
            };
        }
        var retMatch = comment.match(/@returns?\\s+\\{([^}]+)\\}/);
        if (retMatch) {
            result.returns = jsDocTypeToTs(retMatch[1]);
        }
        return result;
    }

    /**
     * Extracts all @typedef {Object} declarations from a Script Include script
     * and returns them as TypeScript interface declaration strings.
     *
     * @param {string} script - Full content of a Script Include script field.
     * @returns {string[]} Array of \\\`interface Name { ... }\\\` declaration strings.
     */
    function parseSiTypedefs(script) {
        var interfaces = [];
        var blockRe = /\\/\\*\\*([\\s\\S]*?)\\*\\//g;
        var block;
        while ((block = blockRe.exec(script)) !== null) {
            var body = block[1];
            var typedefMatch = body.match(/@typedef\\s+\\{Object\\}\\s+(\\w+)/);
            if (!typedefMatch) {
                continue;
            }
            var name = typedefMatch[1];
            var props = [];
            var propRe = /@property\\s+\\{([^}]+)\\}\\s+(\\w+)/g;
            var pm;
            while ((pm = propRe.exec(body)) !== null) {
                props.push('    ' + pm[2] + ': ' + jsDocTypeToTs(pm[1]) + ';');
            }
            interfaces.push(
                'interface ' + name + ' {\\n' + props.join('\\n') + '\\n}'
            );
        }
        return interfaces;
    }

    /**
     * Converts a raw JavaScript value string to its TypeScript literal type, or
     * null if the value is too complex to represent as a literal.
     *
     * @param {string} rawValue - Right-hand side of an assignment (trimmed).
     * @returns {string|null}
     */
    function inferConstantType(rawValue) {
        var v = rawValue.trim().replace(/\\s*;.*$/, '');
        if (/^-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)$/.test(v)) {
            return v;
        }
        if (v === 'true' || v === 'false') {
            return v;
        }
        var q = v.charAt(0);
        if ((q === "'" || q === '"') && v.charAt(v.length - 1) === q) {
            return (
                '"' +
                v.slice(1, -1).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"') +
                '"'
            );
        }
        return null;
    }

    /**
     * Parses static property assignments of the form \\\`ClassName.PROP = value;\\\`
     * from a Script Include script, returning descriptors for use in DTS generation.
     * An optional JSDoc comment immediately above an assignment is captured as
     * documentation. Only assignments whose values resolve to a TypeScript literal
     * type (number, string, boolean) are included.
     *
     * @param {string} script    - Full content of a Script Include script field.
     * @param {string} className - Script Include class name.
     * @returns {Array<{name: string, tsType: string, documentation: string}>}
     */
    function parseSiConstants(script, className) {
        var constants = [];
        var escaped = className.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
        var re = new RegExp(
            '(\\\\/\\\\*\\\\*(?:(?!\\\\*\\\\/)[\\\\s\\\\S])*\\\\*\\\\/)?\\\\s*' +
                escaped +
                '\\\\.(\\\\w+)\\\\s*=\\\\s*([^\\\\n;]+)',
            'g'
        );
        var m;
        while ((m = re.exec(script)) !== null) {
            if (m[2] === 'prototype') {
                continue;
            }
            var tsType = inferConstantType(m[3]);
            if (!tsType) {
                continue;
            }
            var doc = '';
            if (m[1]) {
                doc = m[1]
                    .replace(/^\\/\\*+\\s*/, '')
                    .replace(/\\s*\\*+\\/$/, '')
                    .replace(/^\\s*\\*\\s?/gm, '')
                    .trim();
            }
            constants.push({ name: m[2], tsType: tsType, documentation: doc });
        }
        return constants;
    }

    /**
     * Parses all PrototypeJS prototype methods from a Script Include script string.
     * Extracts method names, typed parameter signatures built from JSDoc @param
     * annotations, return types from @returns, and markdown documentation strings
     * for use in completions, hover tooltips, and signature help.
     *
     * @param {string} script - Full content of a Script Include script field.
     * @returns {Array<Object>} Parsed method descriptors.
     */
    function parseSiMethods(script) {
        var methods = [];
        var re =
            /(\\/\\*\\*(?:(?!\\*\\/)[\\s\\S])*\\*\\/|\\/\\*(?:(?!\\*\\/)[\\s\\S])*\\*\\/)?\\s*(\\w+)\\s*:\\s*function\\s*\\(([^)]*)\\)/g;
        var m;
        while ((m = re.exec(script)) !== null) {
            var methodName = m[2];
            if (methodName === 'type') {
                continue;
            }

            var comment = m[1] || null;
            var docInfo = parseSiDocComment(comment);
            var rawParams = m[3]
                .split(',')
                .map(function (p) {
                    return p.trim();
                })
                .filter(Boolean);

            var typedParams = rawParams
                .map(function (p) {
                    var info = docInfo.params[p];
                    return info
                        ? p + (info.optional ? '?' : '') + ': ' + info.type
                        : p + ': any';
                })
                .join(', ');

            var docLines = [];
            if (comment) {
                var descText = comment
                    .replace(/^\\/\\*+\\s*/, '')
                    .replace(/\\s*\\*+\\/$/, '')
                    .replace(/^\\s*\\*\\s?/gm, '');
                var descMatch = descText.match(/^([\\s\\S]*?)(?=\\s*@|\\s*$)/);
                if (descMatch && descMatch[1].trim()) {
                    docLines.push(descMatch[1].trim());
                }
            }

            rawParams.forEach(function (p) {
                var info = docInfo.params[p];
                if (info && info.description) {
                    docLines.push(
                        '*@param* \`' + p + '\` \\u2014 ' + info.description
                    );
                }
            });

            if (docInfo.returns !== 'any') {
                docLines.push('*@returns* \`' + docInfo.returns + '\`');
            }

            if (methodName === 'initialize') {
                methods.unshift({
                    name: 'initialize',
                    signature: 'constructor(' + typedParams + ')',
                    documentation: docLines.join('\\n\\n'),
                    isConstructor: true,
                });
                continue;
            }

            var paramDocs = {};
            rawParams.forEach(function (p) {
                var info = docInfo.params[p];
                if (info && info.description) {
                    paramDocs[p] = info.description;
                }
            });

            methods.push({
                name: methodName,
                signature:
                    methodName + '(' + typedParams + '): ' + docInfo.returns,
                documentation: docLines.join('\\n\\n'),
                params: rawParams,
                paramDocs: paramDocs,
                isConstructor: false,
            });
        }
        return methods;
    }

    /**
     * Fetches and parses methods for a named Script Include from the REST API.
     * Results are cached per class name; concurrent requests for the same name
     * are deduplicated via _siPendingCache.
     *
     * @param {string} className - Script Include name (e.g. 'MyUtils').
     * @returns {Promise<Array<Object>>}
     */
    function fetchSiMethods(className) {
        if (_siMethodCache[className]) {
            return Promise.resolve(_siMethodCache[className]);
        }

        if (!_siPendingCache[className]) {
            _siPendingCache[className] = new Promise(function (resolve) {
                var xhr = new XMLHttpRequest();
                var url =
                    '/api/now/table/sys_script_include' +
                    '?sysparm_query=name%3D' +
                    encodeURIComponent(className) +
                    '%5Eactive%3Dtrue' +
                    '&sysparm_fields=script%2Cname&sysparm_limit=1';
                xhr.open('GET', url, true);
                xhr.setRequestHeader('X-UserToken', window.g_ck || '');
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.onload = function () {
                    var methods = null;
                    var interfaces = [];
                    var constants = [];
                    try {
                        if (xhr.status === 200) {
                            var data = JSON.parse(xhr.responseText);
                            var records = data && data.result;
                            if (records && Array.isArray(records)) {
                                if (records.length > 0) {
                                    var script = records[0].script || '';
                                    methods = parseSiMethods(script);
                                    interfaces = parseSiTypedefs(script);
                                    constants = parseSiConstants(
                                        script,
                                        className
                                    );
                                } else {
                                    methods = [];
                                }
                            }
                        }
                    } catch (e) {}
                    if (methods !== null) {
                        _siMethodCache[className] = methods;
                        _siInterfaceCache[className] = interfaces;
                        _siConstantCache[className] = constants;
                        _registerSiDts(
                            className,
                            methods,
                            interfaces,
                            constants
                        );
                    } else {
                        methods = [];
                    }
                    delete _siPendingCache[className];
                    resolve(methods);
                };
                xhr.onerror = function () {
                    delete _siPendingCache[className];
                    resolve([]);
                };
                xhr.send();
            });
        }

        return _siPendingCache[className];
    }

    /**
     * Fetches field descriptors for a ServiceNow table from sys_dictionary.
     * Results are cached per table name; concurrent requests are deduplicated.
     *
     * @param {string} tableName - ServiceNow table name (e.g. 'incident').
     * @returns {Promise<Array<Object>>}
     */
    function fetchTableFields(tableName) {
        if (_tableFieldCache[tableName]) {
            return Promise.resolve(_tableFieldCache[tableName]);
        }

        if (!_tablePendingCache[tableName]) {
            _tablePendingCache[tableName] = new Promise(function (resolve) {
                var xhr = new XMLHttpRequest();
                var url =
                    '/api/now/table/sys_dictionary' +
                    '?sysparm_query=name%3D' +
                    encodeURIComponent(tableName) +
                    '%5Einternal_type%21%3Dcollection%5EelementISNOTEMPTY' +
                    '&sysparm_fields=element%2Cinternal_type%2Ccolumn_label%2Cmandatory%2Cmax_length%2Creference' +
                    '&sysparm_limit=300';
                xhr.open('GET', url, true);
                xhr.setRequestHeader('X-UserToken', window.g_ck || '');
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.onload = function () {
                    var fields = null;
                    try {
                        if (xhr.status === 200) {
                            var data = JSON.parse(xhr.responseText);
                            var records = data && data.result;
                            if (records && Array.isArray(records)) {
                                fields = records.map(function (r) {
                                    var name = _snVal(r.element);
                                    var type = _snVal(
                                        r.internal_type,
                                        'string'
                                    );
                                    var label = _snVal(r.column_label) || name;
                                    var maxLen = _snVal(r.max_length);
                                    var ref = _snVal(r.reference);
                                    return {
                                        name: String(name),
                                        type: String(type),
                                        label: String(label),
                                        mandatory:
                                            r.mandatory === 'true' ||
                                            r.mandatory === true,
                                        max_length: maxLen
                                            ? Number(maxLen)
                                            : null,
                                        reference: ref ? String(ref) : null,
                                    };
                                });
                            }
                        }
                    } catch (e) {}
                    if (fields !== null) {
                        _tableFieldCache[tableName] = fields;
                    } else {
                        fields = [];
                    }
                    delete _tablePendingCache[tableName];
                    resolve(fields);
                };
                xhr.onerror = function () {
                    delete _tablePendingCache[tableName];
                    resolve([]);
                };
                xhr.send();
            });
        }

        return _tablePendingCache[tableName];
    }

    /**
     * Fetches dictionary metadata for a single field using the cached table fields.
     * Returns a Promise resolving to the field descriptor or null if not found.
     *
     * @param {string} table - ServiceNow table name.
     * @param {string} field - Field element name.
     * @returns {Promise<Object|null>}
     */
    function fetchFieldDoc(table, field) {
        var key = table + '.' + field;
        if (key in _fieldDocCache) {
            return Promise.resolve(_fieldDocCache[key]);
        }
        return fetchTableFields(table).then(function (fields) {
            var found = fields
                ? fields.find(function (f) {
                      return f.name === field;
                  })
                : null;
            _fieldDocCache[key] = found || null;
            return found || null;
        });
    }

    /**
     * Fetches up to 50 table names from sys_db_object whose name starts with the
     * given prefix, excluding internal tables (nameNOT LIKE00). Always fires a
     * fresh XHR so results stay accurate as the user types. An empty prefix
     * returns the first 50 matching tables alphabetically.
     *
     * @param {string} prefix - The typed prefix to match against table names.
     * @returns {Promise<Array<{name: string, label: string}>>}
     */
    function fetchTablesMatching(prefix) {
        return new Promise(function (resolve) {
            var xhr = new XMLHttpRequest();
            var query =
                'nameNOT LIKE00' +
                (prefix ? '^nameSTARTSWITH' + prefix : '') +
                '^ORDERBYname';
            var url =
                '/api/now/table/sys_db_object' +
                '?sysparm_query=' +
                encodeURIComponent(query) +
                '&sysparm_fields=name%2Clabel&sysparm_limit=50';
            xhr.open('GET', url, true);
            xhr.setRequestHeader('X-UserToken', window.g_ck || '');
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.onload = function () {
                try {
                    if (xhr.status === 200) {
                        var data = JSON.parse(xhr.responseText);
                        var records = data && data.result;
                        if (records && Array.isArray(records)) {
                            resolve(
                                records
                                    .map(function (r) {
                                        var name = _snVal(r.name);
                                        var label = _snVal(r.label) || name;
                                        return {
                                            name: String(name),
                                            label: String(label),
                                        };
                                    })
                                    .filter(function (t) {
                                        return t.name;
                                    })
                            );
                            return;
                        }
                    }
                } catch (e) {}
                resolve([]);
            };
            xhr.onerror = function () {
                resolve([]);
            };
            xhr.send();
        });
    }

    /**
     * Scans a Monaco model for a GlideRecord or GlideRecordSecure assignment to
     * the given variable name and returns the table name string, or null if not found.
     *
     * @param {Object} model - Monaco editor model.
     * @param {string} varName - Variable name to look up.
     * @returns {string|null}
     */
    function getGlideRecordTable(model, varName) {
        var re = new RegExp(
            '(?:var|let|const)\\\\s+' +
                varName +
                '\\\\s*=\\\\s*new\\\\s+GlideRecord(?:Secure)?\\\\s*\\\\(\\\\s*[\\'"]([^\\'"]+)[\\'"]',
            'g'
        );
        var m = re.exec(model.getValue());
        return m ? m[1] : null;
    }

    /**
     * Scans backward from upToLine (up to 150 lines) for an assignment of the form:
     *   [var|let|const] varName = new GlideRecord[Secure|Aggregate]('table')
     * Used by string-argument providers that need the table at the current cursor
     * line without scanning the entire file.
     *
     * @param {Object} model    - Monaco editor model.
     * @param {string} varName  - Variable name to look up.
     * @param {number} upToLine - Current line number (1-based); search starts here.
     * @returns {string|null}
     */
    function _findGrTable(model, varName, upToLine) {
        var searchFrom = Math.max(1, upToLine - 1);
        var searchTo = Math.max(1, searchFrom - 150);
        var pat = new RegExp(
            '(?:var\\\\s+|let\\\\s+|const\\\\s+)?' +
                varName.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') +
                '\\\\s*=\\\\s*new\\\\s+(?:GlideRecord(?:Secure)?|GlideAggregate)\\\\s*\\\\(\\\\s*[\\'"]([^\\'"]+)[\\'"]'
        );
        for (var i = searchFrom; i >= searchTo; i--) {
            var m = model.getLineContent(i).match(pat);
            if (m) {
                return m[1];
            }
        }
        return null;
    }

    /**
     * Resolves a dot-walk path through reference fields to find the final table.
     * E.g., _resolveFieldChain('incident', ['caller_id']) → 'sys_user'
     *       _resolveFieldChain('incident', ['caller_id', 'manager']) → table for manager on sys_user
     *
     * @param {string}   baseTable - The starting table name.
     * @param {string[]} dotPath   - Ordered reference-field names to traverse.
     * @returns {Promise<string|null>}
     */
    function _resolveFieldChain(baseTable, dotPath) {
        if (!dotPath || dotPath.length === 0) {
            return Promise.resolve(baseTable);
        }
        return dotPath.reduce(function (promise, seg) {
            return promise.then(function (table) {
                if (!table) {
                    return null;
                }
                return fetchTableFields(table).then(function (fields) {
                    if (!fields) {
                        return null;
                    }
                    var found = fields.find(function (f) {
                        return f.name === seg;
                    });
                    return found && found.reference ? found.reference : null;
                });
            });
        }, Promise.resolve(baseTable));
    }

    /**
     * Returns {varName, fieldName} if the cursor is over a field-name string literal
     * inside a GlideRecord method call (getValue, setValue, addQuery, orderBy, etc.).
     * Used by the string-arg hover provider.
     *
     * @param {Object} model - Monaco editor model.
     * @param {Object} pos   - Monaco position {lineNumber, column}.
     * @returns {{varName: string, fieldName: string}|null}
     */
    function _getFieldContextAtPos(model, pos) {
        var line = model.getLineContent(pos.lineNumber);
        var col = pos.column - 1; // 0-based

        var quoteChar = null,
            startIdx = -1;
        for (var i = col - 1; i >= 0; i--) {
            var c = line[i];
            if (c === '(' || c === ')' || c === ';') {
                break;
            }
            if (c === "'" || c === '"') {
                quoteChar = c;
                startIdx = i;
                break;
            }
        }
        if (quoteChar === null) {
            return null;
        }

        var endIdx = line.length;
        for (var j = col; j < line.length; j++) {
            if (line[j] === quoteChar) {
                endIdx = j;
                break;
            }
        }

        var fieldName = line.substring(startIdx + 1, endIdx);
        if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(fieldName)) {
            return null;
        }

        var before = line.substring(0, startIdx).replace(/\\s+$/, '');
        var m = before.match(
            /(\\w+)\\.(getValue|setValue|getDisplayValue|getElement|isChanged|addQuery|addNullQuery|addNotNullQuery|orderBy|orderByDesc|addExtraField)\\s*\\($/
        );
        if (!m) {
            return null;
        }
        return { varName: m[1], fieldName: fieldName };
    }

    /**
     * Returns {varName, range, dotPath} if the cursor is INSIDE an opening string
     * that is the first arg of a GlideRecord/GlideAggregate field-name method, or
     * the second arg of addAggregate.  Does NOT require the string to be complete —
     * works while the developer is still typing (completion scenario).
     *
     * dotPath holds the already-completed reference-field segments before the last
     * dot, e.g. for 'caller_id.na|' dotPath=['caller_id'] and range covers 'na'.
     * For non-dot-walked strings dotPath is [].
     *
     * @param {Object} model    - Monaco editor model.
     * @param {Object} position - Monaco position {lineNumber, column}.
     * @returns {{varName: string, range: Object, dotPath: string[]}|null}
     */
    function _getFieldStringContext(model, position) {
        var line = model.getLineContent(position.lineNumber);
        var col = position.column - 1; // 0-based

        // Walk left from cursor to find the opening quote that encloses us.
        var quoteChar = null,
            startIdx = -1;
        for (var i = col - 1; i >= 0; i--) {
            var c = line[i];
            if (c === ')' || c === ';') {
                return null;
            }
            if (c === '(') {
                return null;
            } // paren-before-quote means not in a string arg
            if (c === "'" || c === '"') {
                quoteChar = c;
                startIdx = i;
                break;
            }
        }
        if (quoteChar === null) {
            return null;
        }

        // Only trigger when the partial text looks like a valid field/dot-walk fragment.
        var typed = line.substring(startIdx + 1, col);
        if (typed.length > 0 && !/^[a-zA-Z0-9_.]*$/.test(typed)) {
            return null;
        }

        // Find the closing quote (for the replacement range end).
        var endIdx = line.length;
        for (var j = col; j < line.length; j++) {
            if (line[j] === quoteChar) {
                endIdx = j;
                break;
            }
        }

        var before = line.substring(0, startIdx).replace(/\\s+$/, '');
        var varName = null;

        // Primary: field name is the FIRST argument.
        var m = before.match(
            /(\\w+)\\.(getValue|getDisplayValue|setValue|getElement|isValidField|canRead|canWrite|addNullQuery|addNotNullQuery|orderBy|orderByDesc|addQuery|groupBy|addExtraField)\\s*\\($/
        );
        if (m) {
            varName = m[1];
        }

        if (!varName) {
            // Special case: addAggregate(type, fieldName) — field is SECOND argument.
            var m2 = before.match(
                /(\\w+)\\.addAggregate\\s*\\(\\s*['"][^'"]*['"]\\s*,\\s*$/
            );
            if (m2) {
                varName = m2[1];
            }
        }

        if (!varName) {
            return null;
        }

        // Detect dot-walk: split typed portion into completed path segments and the
        // segment currently being typed.  Adjust range to cover only the last segment
        // so completions replace only the current word, not the entire chain.
        var dotPath = [];
        var rangeStartCol = startIdx + 2; // 1-based, right after the opening quote

        var lastDot = typed.lastIndexOf('.');
        if (lastDot >= 0) {
            var pathPart = typed.substring(0, lastDot);
            dotPath =
                pathPart.length > 0 ? pathPart.split('.').filter(Boolean) : [];
            // 1-based column of the character right after the dot:
            //   startIdx(0-based quote) + lastDot(offset in typed) + 3
            // = (startIdx+1)(first string char) + lastDot + 1(past the dot) + 1(1-based)
            rangeStartCol = startIdx + lastDot + 3;
        }

        var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: rangeStartCol,
            endColumn: endIdx + 1, // 1-based, up to (not incl.) closing quote
        };

        return { varName: varName, range: range, dotPath: dotPath };
    }

    /**
     * Returns {prefix, range} if the cursor is INSIDE the table-name string argument
     * of a GlideRecord, GlideRecordSecure, or GlideAggregate constructor call.
     *   new GlideRecord('tas|')           → triggers table-name completions
     *   new GlideRecordSecure('incident|) → triggers table-name completions
     *   new GlideAggregate('|')           → triggers table-name completions
     *
     * @param {Object} model    - Monaco editor model.
     * @param {Object} position - Monaco position {lineNumber, column}.
     * @returns {{prefix: string, range: Object}|null}
     */
    function _getGrConstructorContext(model, position) {
        var line = model.getLineContent(position.lineNumber);
        var col = position.column - 1; // 0-based

        // Walk left from cursor to find the opening quote.
        var quoteChar = null,
            startIdx = -1;
        for (var i = col - 1; i >= 0; i--) {
            var c = line[i];
            if (c === ')' || c === ';') {
                return null;
            }
            if (c === '(') {
                return null;
            }
            if (c === "'" || c === '"') {
                quoteChar = c;
                startIdx = i;
                break;
            }
        }
        if (quoteChar === null) {
            return null;
        }

        var typed = line.substring(startIdx + 1, col);
        if (typed.length > 0 && !/^[a-zA-Z0-9_]*$/.test(typed)) {
            return null;
        }

        // Find the closing quote (for the replacement range end).
        var endIdx = line.length;
        for (var j = col; j < line.length; j++) {
            if (line[j] === quoteChar) {
                endIdx = j;
                break;
            }
        }

        var before = line.substring(0, startIdx).replace(/\\s+$/, '');
        if (
            !/new\\s+(?:GlideRecordSecure|GlideRecord|GlideAggregate)\\s*\\($/.test(
                before
            )
        ) {
            return null;
        }

        return {
            prefix: typed,
            range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: startIdx + 2, // 1-based, right after the opening quote
                endColumn: endIdx + 1, // 1-based, up to (not incl.) closing quote
            },
        };
    }

    /**
     * Returns true if the constructor in an assignRe match is chained
     * (e.g. \\\`new Foo().method()\\\`), meaning the variable holds a return value,
     * not the SI instance.
     *
     * @param {string} modelText   - Full model text.
     * @param {Object} assignMatch - Result of \\\`assignRe.exec(modelText)\\\`.
     * @returns {boolean}
     */
    function _isChainedConstructor(modelText, assignMatch) {
        var after = modelText.substring(
            assignMatch.index + assignMatch[0].length
        );
        var depth = 1;
        for (var i = 0; i < after.length; i++) {
            if (after[i] === '(') {
                depth++;
            } else if (after[i] === ')') {
                if (--depth === 0) {
                    return (
                        after
                            .substring(i + 1)
                            .replace(/^\\s*/, '')
                            .charAt(0) === '.'
                    );
                }
            }
        }
        return false;
    }

    /**
     * Generates a \\\`declare class\\\` TypeScript declaration from parsed SI methods
     * and registers it with Monaco's language service. Uses the same URI key as
     * \\\`_fetchSIIntellisense\\\` so our JSDoc-derived types take precedence when the
     * user triggers completions (which runs after the initial scan-based fetch).
     * Any interface declarations from @typedef blocks are prepended so that
     * custom return types are fully resolved rather than falling back to \\\`any\\\`.
     *
     * @param {string}        className   - Script Include class name.
     * @param {Array<Object>} methods     - Parsed method descriptors from \\\`parseSiMethods\\\`.
     * @param {string[]}      [interfaces] - Interface declarations from \\\`parseSiTypedefs\\\`.
     * @param {Array<Object>} [constants] - Static property descriptors from \\\`parseSiConstants\\\`.
     */
    function _registerSiDts(className, methods, interfaces, constants) {
        if (
            !window.monaco ||
            !monaco.languages ||
            !monaco.languages.typescript
        ) {
            return;
        }
        if (!methods || !methods.length) {
            return;
        }

        var ourUri = 'ts:snlib-si-' + className + '.d.ts';
        var classMarker = 'declare class ' + className;

        /* One-time: strip SN's primitive-type augmentations from all registered libs.
         * SN's global DTS declares \\\`interface Number extends GlideElement, number {}\\\`
         * (and the same for String/Boolean/Any), which makes GlideElement methods
         * appear on every number/string/boolean variable. These are registered by
         * SN's page code before our patch is installed, so we scan and re-register
         * each affected lib with those lines removed. */
        if (!_primitiveAugsCleaned) {
            _primitiveAugsCleaned = true;
            ['javascriptDefaults', 'typescriptDefaults'].forEach(function (
                target
            ) {
                var defs = monaco.languages.typescript[target];
                var libs = defs.getExtraLibs();
                Object.keys(libs).forEach(function (uri) {
                    var content = libs[uri].content || '';
                    if (content.indexOf('extends GlideElement') === -1) {
                        return;
                    }
                    var stripped = content.replace(_PRIM_AUG_RE, '');
                    if (stripped !== content) {
                        defs.addExtraLib(stripped, uri);
                    }
                });
            });
        }

        /* Reactive: clear any existing random-URI libs that contain an untyped
         * declaration for this class. SN's native addDeclarations() calls
         * addExtraLib() without a URI, landing the class at a random key.
         * TypeScript would otherwise merge the two overloads (one returning \\\`any\\\`,
         * one returning our typed value), surfacing spurious GlideElement suggestions
         * for variables whose return type we have correctly annotated. */
        ['javascriptDefaults', 'typescriptDefaults'].forEach(function (target) {
            var defs = monaco.languages.typescript[target];
            var libs = defs.getExtraLibs();
            Object.keys(libs).forEach(function (uri) {
                if (
                    uri !== ourUri &&
                    (libs[uri].content || '').indexOf(classMarker) !== -1
                ) {
                    defs.addExtraLib('', uri);
                }
            });
        });

        /* Proactive: patch both javascriptDefaults and typescriptDefaults so
         * that future calls with SN's untyped class declarations are stripped
         * for any class we have taken ownership of.
         *
         * We intercept ALL addExtraLib calls except our own 'ts:snlib-si-*' URIs.
         * Restricting by URI pattern (e.g. only 'global.X' or unkeyed) misses
         * cases where SN re-registers using unexpected URI patterns. The replace
         * is gated on _siProtectedClasses, so we never strip a class we haven't
         * explicitly taken ownership of. */
        if (!_addExtraLibFilterInstalled) {
            _addExtraLibFilterInstalled = true;
            var _OUR_URI_RE = /^ts:snlib-si-/;
            ['javascriptDefaults', 'typescriptDefaults'].forEach(function (
                target
            ) {
                var defs = monaco.languages.typescript[target];
                var _orig = defs.addExtraLib.bind(defs);
                defs.addExtraLib = function (content, libUri) {
                    if (content && !_OUR_URI_RE.test(libUri)) {
                        content = content.replace(
                            /declare\\s+class\\s+(\\w+)[^{]*\\{[^}]*\\}/g,
                            function (match, name) {
                                return _siProtectedClasses[name] ? '' : match;
                            }
                        );
                        content = content.replace(_PRIM_AUG_RE, '');
                    }
                    return _orig(content, libUri);
                };
            });
        }
        _siProtectedClasses[className] = true;

        var lines =
            interfaces && interfaces.length ? interfaces.concat(['']) : [];
        lines.push('declare class ' + className + ' {');
        if (constants && constants.length) {
            constants.forEach(function (c) {
                if (c.documentation) {
                    lines.push('    /** ' + c.documentation + ' */');
                }
                lines.push(
                    '    static readonly ' + c.name + ': ' + c.tsType + ';'
                );
            });
        }
        methods.forEach(function (m) {
            lines.push('    ' + m.signature + ';');
        });
        lines.push('}');
        var dts = lines.join('\\n');
        monaco.languages.typescript.typescriptDefaults.addExtraLib(dts, ourUri);
        monaco.languages.typescript.javascriptDefaults.addExtraLib(dts, ourUri);
    }

    /* TABLE_PARAM / FIELD_PARAM — param name patterns for SI string-arg completions. */
    var _TABLE_PARAM_RE = /^(table|table_name|tableName)$/;
    var _FIELD_PARAM_RE = /^(field|field_name|fieldName)$/;

    /**
     * Detects when the cursor is inside a string argument of a Script Include
     * method call and returns context needed to drive table/field suggestions.
     * Handles both \\\`varName.method('\\\` and \\\`new ClassName().method('\\\` shapes.
     *
     * @param {Object} model    - Monaco editor model.
     * @param {Object} position - Monaco position {lineNumber, column}.
     * @returns {{ className: string, methodName: string, paramIndex: number,
     *             prevArgs: (string|null)[], typed: string, range: Object }|null}
     */
    function _getSiCallContext(model, position) {
        var line = model.getLineContent(position.lineNumber);
        var col = position.column - 1; // 0-based

        /* Walk left to find the opening quote of the current string arg. */
        var quoteChar = null,
            quoteIdx = -1;
        for (var i = col - 1; i >= 0; i--) {
            var c = line[i];
            if (c === ')' || c === ';') {
                return null;
            }
            if (c === '(') {
                return null;
            }
            if (c === "'" || c === '"') {
                quoteChar = c;
                quoteIdx = i;
                break;
            }
        }
        if (quoteChar === null) {
            return null;
        }

        var typed = line.substring(quoteIdx + 1, col);
        if (typed.length > 0 && !/^[a-zA-Z0-9_.]*$/.test(typed)) {
            return null;
        }

        var endIdx = line.length;
        for (var j = col; j < line.length; j++) {
            if (line[j] === quoteChar) {
                endIdx = j;
                break;
            }
        }

        /* Forward scan to find the outermost unmatched '(' before quoteIdx. */
        var openParenIdx = -1,
            depth = 0,
            inSc = false,
            scCh = null;
        for (var k = 0; k < quoteIdx; k++) {
            var ch = line[k];
            if (inSc) {
                if (ch === scCh) {
                    inSc = false;
                }
                continue;
            }
            if (ch === "'" || ch === '"') {
                inSc = true;
                scCh = ch;
                continue;
            }
            if (ch === '(') {
                depth++;
                if (depth === 1) {
                    openParenIdx = k;
                }
            } else if (ch === ')') {
                depth--;
                if (depth === 0) {
                    openParenIdx = -1;
                }
            }
        }
        if (openParenIdx === -1 || depth === 0) {
            return null;
        }

        /* Parse the text between '(' and the current quote to find prev args. */
        var argText = line.substring(openParenIdx + 1, quoteIdx);
        var prevArgs = [];
        var paramIndex = 0;
        if (argText.trim().length > 0) {
            var args = [],
                d = 0,
                inSa = false,
                saCh = null,
                cur = '';
            for (var p = 0; p < argText.length; p++) {
                var ap = argText[p];
                if (inSa) {
                    if (ap === saCh) {
                        inSa = false;
                    }
                    cur += ap;
                } else if (ap === "'" || ap === '"') {
                    inSa = true;
                    saCh = ap;
                    cur += ap;
                } else if (ap === '(' || ap === '[' || ap === '{') {
                    d++;
                    cur += ap;
                } else if (ap === ')' || ap === ']' || ap === '}') {
                    d--;
                    cur += ap;
                } else if (ap === ',' && d === 0) {
                    args.push(cur.trim());
                    cur = '';
                } else {
                    cur += ap;
                }
            }
            if (cur.trim()) {
                args.push(cur.trim());
            }
            paramIndex = args.length;
            prevArgs = args.map(function (a) {
                var mv = a.match(/^['"]([^'"]*)['"]\\s*$/);
                return mv ? mv[1] : null;
            });
        }

        /* Identify the class and method being called. */
        var beforeParen = line.substring(0, openParenIdx).replace(/\\s*$/, '');
        var methodName = null,
            className = null;

        /* new ClassName().method( — check first (more specific). */
        var newM = beforeParen.match(
            /\\bnew\\s+([A-Z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\.(\\w+)$/
        );
        if (newM) {
            className = newM[1];
            methodName = newM[2];
        }

        /* varName.method( */
        if (!className) {
            var varM = beforeParen.match(/(\\w+)\\.(\\w+)$/);
            if (varM) {
                methodName = varM[2];
                var aRe = new RegExp(
                    '(?:var|let|const)\\\\s+' +
                        varM[1] +
                        '\\\\s*=\\\\s*new\\\\s+([A-Z][A-Za-z0-9_]*)\\\\s*\\\\(',
                    'g'
                );
                var aM = aRe.exec(model.getValue());
                if (aM && !_isChainedConstructor(model.getValue(), aM)) {
                    className = aM[1];
                }
            }
        }

        if (!className || !methodName) {
            return null;
        }

        return {
            className: className,
            methodName: methodName,
            paramIndex: paramIndex,
            prevArgs: prevArgs,
            typed: typed,
            range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: quoteIdx + 2,
                endColumn: endIdx + 1,
            },
        };
    }

    /**
     * Scans a Monaco model for all GlideRecord/Aggregate constructor calls and
     * pre-fetches field lists for each unique table, warming the cache before
     * the user triggers completions.
     *
     * @param {Object} model - Monaco editor model.
     */
    function _prewarmFieldCompletions(model) {
        var text = model.getValue();
        var pat =
            /new\\s+(?:GlideRecord(?:Secure)?|GlideAggregate)\\s*\\(\\s*['"](\\S+?)['"]/g;
        var m;
        while ((m = pat.exec(text)) !== null) {
            if (!(_tableFieldCache[m[1]] || _tablePendingCache[m[1]])) {
                fetchTableFields(m[1]); // fire-and-forget; populates cache
            }
        }
    }

    ///////////////////////////////////////////
    // Initialisation
    ///////////////////////////////////////////

    /**
     * Merges compiler options into Monaco's TypeScript and JavaScript language
     * services. Suppresses semantic false-positives common in plain JavaScript
     * server scripts while retaining syntax checking and completions.
     * Enables checkJs so JSDoc @param types yield typed completions in JS mode.
     */
    function applyCompilerOptions() {
        if (
            !window.monaco ||
            !monaco.languages ||
            !monaco.languages.typescript
        ) {
            return;
        }

        var tsDef = monaco.languages.typescript.typescriptDefaults;
        var tsExisting = tsDef.getCompilerOptions
            ? tsDef.getCompilerOptions()
            : {
                  allowNonTsExtensions: true,
              };
        tsDef.setCompilerOptions(
            Object.assign({}, tsExisting, {
                noImplicitAny: false,
                strictNullChecks: false,
                strict: false,
                noUnusedLocals: true,
                noUnusedParameters: true,
            })
        );
        tsDef.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: true,
            diagnosticCodesToIgnore: [
                7006, 7043, 7019, 7016, 80001, 80004, 1005,
            ],
        });
        tsDef.setEagerModelSync(true);

        var jsDef = monaco.languages.typescript.javascriptDefaults;
        var jsExisting = jsDef.getCompilerOptions
            ? jsDef.getCompilerOptions()
            : {};
        jsDef.setCompilerOptions(
            Object.assign({}, jsExisting, {
                checkJs: true,
                noImplicitAny: false,
                strictNullChecks: false,
                strict: false,
                noUnusedLocals: true,
                noUnusedParameters: true,
            })
        );
        jsDef.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: true,
            diagnosticCodesToIgnore: [
                7006, 7043, 7019, 7016, 80001, 80004, 1005,
            ],
        });
        jsDef.setEagerModelSync(true);
    }

    /*
     * Installs per-model watchers that call the TypeScript/JavaScript language
     * service worker directly to retrieve only unused-variable (6133) and
     * unused-parameter (6196) diagnostics. These are set as custom Warning
     * markers under the 'we-unused' owner, keeping them completely separate
     * from Monaco's own 'typescript' marker set.  noSemanticValidation remains
     * true so no other semantic squiggles appear; noUnusedLocals/Parameters
     * must be true in compiler options so the worker generates these codes.
     */
    var _unusedVarPatchInstalled = false;
    function _installUnusedVarSeverityPatch() {
        if (_unusedVarPatchInstalled || !window.monaco || !monaco.editor) {
            return;
        }
        _unusedVarPatchInstalled = true;

        var OWNER = 'we-unused';
        var DEBOUNCE_MS = 1200;
        var _timers = {};

        function _msgText(mt) {
            if (typeof mt === 'string') return mt;
            if (mt && typeof mt.messageText === 'string') return mt.messageText;
            return 'Unused';
        }

        function _refresh(model) {
            if (model.isDisposed()) return;
            var lang = model.getLanguageId();
            if (lang !== 'javascript' && lang !== 'typescript') return;

            if (!_showUnusedVars) {
                monaco.editor.setModelMarkers(model, OWNER, []);
                return;
            }

            var getWorker = lang === 'typescript'
                ? monaco.languages.typescript.getTypeScriptWorker
                : monaco.languages.typescript.getJavaScriptWorker;
            if (!getWorker) return;

            var uriStr = model.uri.toString();
            getWorker().then(function (factory) {
                return factory(model.uri);
            }).then(function (client) {
                return client.getSemanticDiagnostics(uriStr);
            }).then(function (diags) {
                if (model.isDisposed()) return;
                var markers = [];
                for (var i = 0; i < diags.length; i++) {
                    var d = diags[i];
                    if (d.code !== 6133 && d.code !== 6196) continue;
                    if (d.start == null || d.length == null) continue;
                    var start = model.getPositionAt(d.start);
                    var end = model.getPositionAt(d.start + d.length);
                    markers.push({
                        severity: monaco.MarkerSeverity.Warning,
                        message: _msgText(d.messageText),
                        startLineNumber: start.lineNumber,
                        startColumn: start.column,
                        endLineNumber: end.lineNumber,
                        endColumn: end.column,
                        code: String(d.code),
                        source: 'ts',
                        tags: monaco.MarkerTag ? [monaco.MarkerTag.Unnecessary] : undefined,
                    });
                }
                monaco.editor.setModelMarkers(model, OWNER, markers);
            });
        }

        function _schedule(model) {
            var id = model.id;
            if (_timers[id]) clearTimeout(_timers[id]);
            _timers[id] = setTimeout(function () {
                delete _timers[id];
                _refresh(model);
            }, DEBOUNCE_MS);
        }

        function _watch(model) {
            var lang = model.getLanguageId();
            if (lang !== 'javascript' && lang !== 'typescript') return;
            _schedule(model);
            model.onDidChangeContent(function () { _schedule(model); });
            model.onWillDispose(function () {
                if (_timers[model.id]) {
                    clearTimeout(_timers[model.id]);
                    delete _timers[model.id];
                }
            });
        }

        _scheduleUnusedRefresh = _schedule;
        monaco.editor.getModels().forEach(_watch);
        monaco.editor.onDidCreateModel(_watch);
    }

    /**
     * Fetches ServiceNow's server-side type declaration file from the syntax
     * editor completions endpoint and registers it with both TypeScript and
     * JavaScript language services. Applies a patch for a mis-declared
     * GlideRecordSecure that would otherwise suppress all its instance completions.
     */
    function loadSnTypeDefinitions(scopeOverride, targetLang) {
        if (
            !window.monaco ||
            !monaco.languages ||
            !monaco.languages.typescript
        ) {
            return;
        }

        var scope =
            scopeOverride ||
            (typeof g_form !== 'undefined'
                ? g_form.getValue('sys_scope')
                : 'global');
        var xhr = new XMLHttpRequest();
        xhr.open(
            'GET',
            '/api/now/syntax_editor/completions?scope=' +
                encodeURIComponent(scope || 'global'),
            true
        );
        xhr.setRequestHeader('X-UserToken', window.g_ck || '');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = function () {
            if (xhr.status !== 200) {
                return;
            }
            var declarations;
            try {
                var data = JSON.parse(xhr.responseText);
                var r = data && data.result;
                declarations =
                    typeof r === 'string'
                        ? r
                        : r && typeof r.result === 'string'
                          ? r.result
                          : null;
            } catch (e) {
                return;
            }
            if (!declarations) {
                return;
            }

            /*
             * The SN DTS declares GlideRecordSecure as extending GlideRecord,
             * which TypeScript marks as non-constructable (TS2351). Patch it to
             * extend GlideRecordGenerated — the actual root of the GlideRecord
             * hierarchy — so all inherited methods appear in instance completions.
             */
            declarations = declarations.replace(
                /\\/\\*\\*[\\s\\S]*?GlideRecordSecure is a class[\\s\\S]*?\\*\\/\\s*declare class GlideRecordSecure extends GlideRecord \\{[\\s\\S]*?\\n\\}/,
                'declare class GlideRecordSecure extends GlideRecordGenerated {\\n' +
                    '    constructor(tableName: string);\\n' +
                    '    enableSecurityFeature(feature: string): void;\\n' +
                    '    disableSecurityFeature(feature: string): void;\\n' +
                    '}'
            );

            var _snDtsTargets = targetLang
                ? [monaco.languages.typescript[targetLang + 'Defaults']]
                : [
                      monaco.languages.typescript.typescriptDefaults,
                      monaco.languages.typescript.javascriptDefaults,
                  ];
            _snDtsTargets.forEach(function (def) {
                def.addExtraLib(declarations, 'ts:snlib-servicenow.d.ts');
                def.setEagerModelSync(true);
            });
        };
        xhr.send();
    }

    /**
     * Injects the Monaco server language DTS — additional GlideRecordSecure
     * methods and the $sp server API — into Monaco's TypeScript and JavaScript
     * language services. Loads the UI script via its jsdbx URL if not already
     * present on the page.
     */
    function loadServerMonarchDts(targetLang) {
        if (
            !window.monaco ||
            !monaco.languages ||
            !monaco.languages.typescript
        ) {
            return;
        }

        // Registers the DTS string with both language services.
        function _register(dts) {
            var _serverDtsTargets = targetLang
                ? [monaco.languages.typescript[targetLang + 'Defaults']]
                : [
                      monaco.languages.typescript.typescriptDefaults,
                      monaco.languages.typescript.javascriptDefaults,
                  ];
            _serverDtsTargets.forEach(function (def) {
                def.addExtraLib(dts, 'ts:snlib-server-monarch.d.ts');
            });
        }

        if (window.MONACO_LANGUAGE_SERVER_DTS) {
            _register(window.MONACO_LANGUAGE_SERVER_DTS);
            return;
        }

        _loadScript(
            _definitionUrl,
            function () {
                if (window.MONACO_LANGUAGE_SERVER_DTS) {
                    _register(window.MONACO_LANGUAGE_SERVER_DTS);
                } else {
                    _logError(
                        'Server DTS Load Error',
                        'Script loaded but MONACO_LANGUAGE_SERVER_DTS not found.\\nURL: ' +
                            _definitionUrl
                    );
                }
            },
            function () {
                _logError(
                    'Server DTS Network Error',
                    'Failed to load server language definitions.\\nURL: ' +
                        _definitionUrl
                );
            }
        );
    }

    function _applyClientMonarchCompilerOptions() {
        var jsDef = monaco.languages.typescript.javascriptDefaults;
        if (!jsDef || !jsDef.setCompilerOptions) {
            return;
        }
        var existing = jsDef.getCompilerOptions
            ? jsDef.getCompilerOptions()
            : {};
        jsDef.setCompilerOptions(
            Object.assign({}, existing, {
                checkJs: true,
                noImplicitAny: false,
                strictNullChecks: false,
                strict: false,
                noUnusedLocals: true,
                noUnusedParameters: true,
            })
        );
    }

    /*
     * AngularJS injects api.controller arguments by parameter NAME, not
     * position, so no static 'declare var api' signature can correctly type a
     * custom injection order. This watcher parses the parameter list the
     * developer actually wrote and (re)registers a matching signature —
     * generated by monaco_language_client's MONACO_LANGUAGE_CLIENT_DI — under
     * a stable extra-lib URI, so every parameter is typed by name regardless
     * of order.
     */
    var _CLIENT_API_LIB_URI = 'ts:snlib-client-api.d.ts';

    /**
     * Extracts the api.controller parameter names from client-controller
     * source. Handles function expressions (named/anonymous/async), arrow
     * functions, and $inject-style array notation. Multi-line parameter lists
     * are supported. Returns null when no controller assignment is found.
     *
     * @param {string} source - Full model text.
     * @returns {string[]|null}
     */
    function _parseControllerParams(source) {
        var m =
            /api\\s*\\.\\s*controller\\s*=\\s*(?:\\[[^\\]]*?)?(?:async\\s+)?function\\s*[\\w$]*\\s*\\(([^)]*)\\)/.exec(
                source
            ) ||
            /api\\s*\\.\\s*controller\\s*=\\s*(?:\\[[^\\]]*?)?(?:async\\s*)?\\(([^)]*)\\)\\s*=>/.exec(
                source
            );
        if (!m) {
            return null;
        }
        return m[1]
            .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // strip block comments
            .replace(/\\/\\/[^\\n]*/g, '') // strip line comments
            .split(',')
            .map(function (p) {
                // Strip default values: (a = 0) → 'a'
                return p.replace(/\\s*=[\\s\\S]*$/, '').trim();
            })
            .filter(Boolean);
    }

    /**
     * Rebuilds and registers the 'declare var api' extra lib so its controller
     * signature mirrors the parameter order in the given model. Passing null
     * registers the default signature. No-ops when the parameter list has not
     * changed since the last registration.
     */
    function _refreshClientApiLib(model) {
        var di = window.MONACO_LANGUAGE_CLIENT_DI;
        if (
            !di ||
            !window.monaco ||
            !monaco.languages ||
            !monaco.languages.typescript
        ) {
            return;
        }

        var params = null;
        if (model && !model.isDisposed()) {
            params = _parseControllerParams(model.getValue());
        }
        // While the assignment is mid-edit / unparseable, keep the last good
        // signature rather than reverting to the default.
        if (!params && _clientDiLastParamsKey !== null) {
            return;
        }

        var key = params ? params.join(',') : '';
        if (key === _clientDiLastParamsKey) {
            return;
        }
        _clientDiLastParamsKey = key;

        monaco.languages.typescript.javascriptDefaults.addExtraLib(
            di.buildApiDts(params),
            _CLIENT_API_LIB_URI
        );
    }

    /** Installs the per-model DI signature watcher. Idempotent. */
    function _installClientDiWatcher() {
        if (_clientDiWatcherInstalled || !window.monaco || !monaco.editor) {
            return;
        }
        _clientDiWatcherInstalled = true;

        // Register the default signature immediately so 'api' is always typed.
        _refreshClientApiLib(null);

        var DEBOUNCE_MS = 400;

        function _schedule(model) {
            var id = model.id;
            if (_clientDiTimers[id]) {
                clearTimeout(_clientDiTimers[id]);
            }
            _clientDiTimers[id] = setTimeout(function () {
                delete _clientDiTimers[id];
                _refreshClientApiLib(model);
            }, DEBOUNCE_MS);
        }

        function _watch(model) {
            if (model.getLanguageId() !== 'javascript') {
                return;
            }
            _refreshClientApiLib(model);
            model.onDidChangeContent(function () {
                _schedule(model);
            });
            model.onWillDispose(function () {
                if (_clientDiTimers[model.id]) {
                    clearTimeout(_clientDiTimers[model.id]);
                    delete _clientDiTimers[model.id];
                }
            });
        }

        monaco.editor.getModels().forEach(_watch);
        monaco.editor.onDidCreateModel(_watch);
    }

    function loadClientMonarchDts(cb) {
        if (
            !window.monaco ||
            !monaco.languages ||
            !monaco.languages.typescript
        ) {
            if (typeof cb === 'function') {
                cb();
            }
            return;
        }

        if (window.MONACO_LANGUAGE_CLIENT_DTS) {
            monaco.languages.typescript.javascriptDefaults.addExtraLib(
                window.MONACO_LANGUAGE_CLIENT_DTS,
                'ts:snlib-client-monarch.d.ts'
            );
            _applyClientMonarchCompilerOptions();
            _installClientDiWatcher();
            if (typeof cb === 'function') {
                cb();
            }
            return;
        }

        if (typeof cb === 'function') {
            _clientMonarchPending.push(cb);
        }
        if (_clientMonarchLoading) {
            return;
        }
        _clientMonarchLoading = true;

        _loadScript(
            _clientDefinitionUrl,
            function () {
                _clientMonarchLoading = false;
                if (window.MONACO_LANGUAGE_CLIENT_DTS) {
                    monaco.languages.typescript.javascriptDefaults.addExtraLib(
                        window.MONACO_LANGUAGE_CLIENT_DTS,
                        'ts:snlib-client-monarch.d.ts'
                    );
                    _applyClientMonarchCompilerOptions();
                    _installClientDiWatcher();
                } else {
                    _logError(
                        'Client DTS Load Error',
                        'Script loaded but MONACO_LANGUAGE_CLIENT_DTS not found.\\nURL: ' +
                            _clientDefinitionUrl
                    );
                }
                _flushPending(_clientMonarchPending);
            },
            function () {
                _clientMonarchLoading = false;
                _logError(
                    'Client DTS Network Error',
                    'Failed to load client language definitions.\\nURL: ' +
                        _clientDefinitionUrl
                );
                _flushPending(_clientMonarchPending);
            }
        );
    }

    function loadHtmlMonarchDts(cb) {
        if (!window.monaco || !monaco.languages) {
            if (typeof cb === 'function') {
                cb();
            }
            return;
        }

        if (window.MONACO_LANGUAGE_HTML) {
            window.MONACO_LANGUAGE_HTML.register(monaco);
            if (typeof cb === 'function') {
                cb();
            }
            return;
        }

        if (typeof cb === 'function') {
            _htmlMonarchPending.push(cb);
        }
        if (_htmlMonarchLoading) {
            return;
        }
        _htmlMonarchLoading = true;

        _loadScript(
            _htmlMonarchUrl,
            function () {
                _htmlMonarchLoading = false;
                if (window.MONACO_LANGUAGE_HTML) {
                    window.MONACO_LANGUAGE_HTML.register(monaco);
                } else {
                    _logError(
                        'HTML Monarch Load Error',
                        'Script loaded but MONACO_LANGUAGE_HTML not found.\\nURL: ' +
                            _htmlMonarchUrl
                    );
                }
                _flushPending(_htmlMonarchPending);
            },
            function () {
                _htmlMonarchLoading = false;
                _logError(
                    'HTML Monarch Network Error',
                    'Failed to load HTML language definitions.\\nURL: ' +
                        _htmlMonarchUrl
                );
                _flushPending(_htmlMonarchPending);
            }
        );
    }

    /**
     * Loads the CSS language definition UI Script (MONACO_LANGUAGE_CSS) on demand,
     * then registers its at-rule and descriptor completion providers. Queues
     * callbacks if a load is already in-flight. Safe to call multiple times.
     *
     * @param {Function} [cb] - Optional callback invoked after registration completes.
     */
    function loadCssLanguageDts(cb) {
        if (!window.monaco || !monaco.languages) {
            if (typeof cb === 'function') {
                cb();
            }
            return;
        }

        if (window.MONACO_LANGUAGE_CSS) {
            window.MONACO_LANGUAGE_CSS.register(monaco);
            if (typeof cb === 'function') {
                cb();
            }
            return;
        }

        if (typeof cb === 'function') {
            _cssLanguagePending.push(cb);
        }
        if (_cssLanguageLoading) {
            return;
        }
        _cssLanguageLoading = true;

        function _onCssLoaded() {
            _cssLanguageLoading = false;
            if (window.MONACO_LANGUAGE_CSS) {
                window.MONACO_LANGUAGE_CSS.register(monaco);
            } else {
                _logError(
                    'CSS Language Load Error',
                    'Script loaded but MONACO_LANGUAGE_CSS not found.\\nURL: ' +
                        _cssLanguageUrl
                );
            }
            _flushPending(_cssLanguagePending);
        }

        function _onCssError() {
            _cssLanguageLoading = false;
            _logError(
                'CSS Language Network Error',
                'Failed to load CSS language definitions.\\nURL: ' +
                    _cssLanguageUrl
            );
            _flushPending(_cssLanguagePending);
        }

        /* Prefer ServiceNow's ScriptLoader (handles caching and .jsdbx URLs
         * consistently) with a fallback to direct DOM script injection. */
        if (typeof ScriptLoader !== 'undefined' && ScriptLoader.getScripts) {
            ScriptLoader.getScripts(_cssLanguageUrl, _onCssLoaded);
        } else {
            _loadScript(_cssLanguageUrl, _onCssLoaded, _onCssError);
        }
    }

    function loadCodeActions(options) {
        if (!window.monaco || !monaco.languages) {
            return;
        }

        options = options || {};
        var modelId = options.modelId;
        var isAngular = !!options.isAngular;
        if (typeof options.getRemBase === 'function') {
            _codeActionsGetRemBase = options.getRemBase;
        }

        var config = {
            getRemBase: function () {
                return Number(_codeActionsGetRemBase()) || 16;
            },
        };

        if (_codeActionsReady && window.MONACO_CODE_ACTIONS) {
            window.MONACO_CODE_ACTIONS.register(monaco, config);
            if (isAngular && modelId) {
                window.MONACO_CODE_ACTIONS.markAngular(modelId);
            }
            return;
        }

        if (isAngular && modelId) {
            _codeActionsPendingAngular.push(modelId);
        }
        if (_codeActionsLoading) {
            return;
        }
        _codeActionsLoading = true;

        _loadScript(
            _codeActionsUrl,
            function () {
                _codeActionsLoading = false;
                _codeActionsReady = true;
                if (window.MONACO_CODE_ACTIONS) {
                    window.MONACO_CODE_ACTIONS.register(monaco, config);
                    _codeActionsPendingAngular.splice(0).forEach(function (id) {
                        window.MONACO_CODE_ACTIONS.markAngular(id);
                    });
                } else {
                    _logError(
                        'Code Actions Load Error',
                        'Script loaded but MONACO_CODE_ACTIONS not found.\\nURL: ' +
                            _codeActionsUrl
                    );
                }
            },
            function () {
                _codeActionsLoading = false;
                _logError(
                    'Code Actions Network Error',
                    'Failed to load code actions module.\\nURL: ' +
                        _codeActionsUrl
                );
            }
        );
    }

    /**
     * Fetches up to 50 active Script Include names whose names start with the
     * given prefix (pass '' for no prefix filter). Results are cached into
     * _siNameMap and returned to the callback as an array of {name, sys_id}.
     *
     * @param {string}   prefix   - Name prefix to filter by (may be empty).
     * @param {Function} callback - Called with (records: Array<{name, sys_id}>).
     */
    function _fetchSiByPrefix(prefix, callback) {
        var query =
            'active%3Dtrue' +
            (prefix ? '%5EnameSTARTSWITH' + encodeURIComponent(prefix) : '') +
            '%5EORDERBYname';
        var url =
            '/api/now/table/sys_script_include' +
            '?sysparm_query=' +
            query +
            '&sysparm_fields=name%2Csys_id&sysparm_limit=100';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('X-UserToken', window.g_ck || '');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = function () {
            if (xhr.status !== 200) {
                callback([]);
                return;
            }
            try {
                var records = (JSON.parse(xhr.responseText) || {}).result || [];
                records.forEach(function (r) {
                    _siNameMap[r.name] = r.sys_id;
                });
                callback(records);
            } catch (e) {
                callback([]);
            }
        };
        xhr.send();
    }

    /**
     * Checks whether a Script Include with the given name exists. Uses the
     * local cache (_siNameMap) when available; otherwise queries the API and
     * caches the result (positive or negative) before invoking the callback.
     *
     * @param {string}   name     - Script Include class name to look up.
     * @param {Function} callback - Called with (name|null, sysId|null).
     */
    function _checkSiExists(name, callback) {
        if (_siNameMap[name] !== undefined) {
            callback(_siNameMap[name] ? name : null, _siNameMap[name] || null);
            return;
        }
        var url =
            '/api/now/table/sys_script_include' +
            '?sysparm_query=active%3Dtrue%5Ename%3D' +
            encodeURIComponent(name) +
            '&sysparm_fields=name%2Csys_id&sysparm_limit=1';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('X-UserToken', window.g_ck || '');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = function () {
            if (xhr.status !== 200) {
                callback(null, null);
                return;
            }
            try {
                var records = (JSON.parse(xhr.responseText) || {}).result || [];
                if (records.length) {
                    _siNameMap[records[0].name] = records[0].sys_id;
                    callback(records[0].name, records[0].sys_id);
                } else {
                    _siNameMap[name] = '';
                    callback(null, null);
                }
            } catch (e) {
                callback(null, null);
            }
        };
        xhr.send();
    }

    /**
     * Fetches TypeScript type definitions for a named Script Include from the
     * ServiceNow syntax editor intellisense endpoint and registers them with Monaco.
     *
     * @param {string} name  - Script Include class name (used as the lib filename key).
     * @param {string} sysId - sys_id of the Script Include record.
     */
    function _fetchSIIntellisense(name, sysId) {
        var xhr = new XMLHttpRequest();
        xhr.open(
            'POST',
            '/api/now/v1/syntax_editor/intellisense/sys_script_include',
            true
        );
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-UserToken', window.g_ck || '');
        xhr.onload = function () {
            if (xhr.status < 200 || xhr.status >= 300) {
                delete _siFetched[name];
                _logError(
                    'Script Include IntelliSense Error',
                    'Failed to fetch type definitions for: ' +
                        name +
                        '\\nStatus: ' +
                        xhr.status
                );
                return;
            }
            try {
                var data = JSON.parse(xhr.responseText);
                var result = data && data.result && data.result.result;
                var typeDef = result && result[sysId];
                if (typeDef && typeof typeDef === 'string') {
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(
                        typeDef,
                        'ts:snlib-si-' + name + '.d.ts'
                    );
                }
            } catch (e) {
                _logError(
                    'Script Include Parse Error',
                    'Failed to parse response for: ' +
                        name +
                        '\\nError: ' +
                        (e.message || e)
                );
            }
            /* Overwrite SN's DTS with our JSDoc-derived types. If methods are already
             * cached (e.g. the user triggered completions before the scan ran), apply
             * them immediately; otherwise fetch them now. */
            if (_siMethodCache[name]) {
                _registerSiDts(
                    name,
                    _siMethodCache[name],
                    _siInterfaceCache[name],
                    _siConstantCache[name]
                );
            } else {
                fetchSiMethods(name);
            }
        };
        xhr.onerror = function () {
            delete _siFetched[name];
            _logError(
                'Script Include Network Error',
                'Network error while fetching type definitions for: ' + name
            );
        };
        xhr.send(JSON.stringify({ scriptIncludes: [sysId] }));
    }

    var _SI_SCAN_BUILTINS = {
        Array: true,
        ArrayBuffer: true,
        Boolean: true,
        DataView: true,
        Date: true,
        Error: true,
        EvalError: true,
        Float32Array: true,
        Float64Array: true,
        Function: true,
        Int8Array: true,
        Int16Array: true,
        Int32Array: true,
        Map: true,
        Number: true,
        Object: true,
        Promise: true,
        Proxy: true,
        RangeError: true,
        ReferenceError: true,
        RegExp: true,
        Set: true,
        SharedArrayBuffer: true,
        String: true,
        Symbol: true,
        SyntaxError: true,
        TypeError: true,
        URIError: true,
        Uint8Array: true,
        Uint8ClampedArray: true,
        Uint16Array: true,
        Uint32Array: true,
        WeakMap: true,
        WeakRef: true,
        WeakSet: true,
        Class: true /* SN PrototypeJS helper — not a user Script Include */,
    };

    /**
     * Scans script content for 'new ClassName(' patterns and lazily fetches
     * TypeScript type definitions for any recognised Script Include class names.
     *
     * @param {string} content - The full text of a Monaco editor model.
     */
    function _scanAndFetchSIs(content) {
        if (!window.monaco) {
            return;
        }
        var seen = {};
        var names = [];
        // Only match identifiers that immediately follow the \\\`new\\\` keyword so
        // that plain JS built-ins referenced elsewhere (String, Date, Set …)
        // are not mistakenly queued as Script Include candidates.
        var re = /\\bnew\\s+([A-Z][a-zA-Z0-9_]*)\\s*\\(/g;
        var m;
        while ((m = re.exec(content)) !== null) {
            var name = m[1];
            if (!seen[name] && !_SI_SCAN_BUILTINS[name]) {
                seen[name] = true;
                names.push(name);
            }
        }
        _batchCheckSiNames(names);
    }

    /**
     * Checks a list of potential Script Include names against the instance in
     * batches of 50, using a single nameIN query per batch. Results are cached
     * into _siNameMap; confirmed SIs also trigger an intellisense fetch.
     *
     * @param {string[]} names - Candidate Script Include class names.
     */
    function _batchCheckSiNames(names) {
        var toCheck = [];
        names.forEach(function (n) {
            if (_siNameMap[n] === undefined) {
                toCheck.push(n);
            }
        });
        if (!toCheck.length) {
            return;
        }

        var BATCH_SIZE = 50;
        var i;
        for (i = 0; i < toCheck.length; i += BATCH_SIZE) {
            (function (batch) {
                var url =
                    '/api/now/table/sys_script_include' +
                    '?sysparm_query=active%3Dtrue%5EnameIN' +
                    encodeURIComponent(batch.join(',')) +
                    '&sysparm_fields=name%2Csys_id&sysparm_limit=' +
                    batch.length;
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.setRequestHeader('X-UserToken', window.g_ck || '');
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.onload = function () {
                    if (xhr.status !== 200) {
                        return;
                    }
                    try {
                        var records =
                            (JSON.parse(xhr.responseText) || {}).result || [];
                        var found = {};
                        records.forEach(function (r) {
                            _siNameMap[r.name] = r.sys_id;
                            found[r.name] = true;
                        });
                        batch.forEach(function (n) {
                            if (!found[n]) {
                                _siNameMap[n] = '';
                            }
                        });
                        records.forEach(function (r) {
                            if (!_siFetched[r.name]) {
                                _siFetched[r.name] = true;
                                _fetchSIIntellisense(r.name, r.sys_id);
                            }
                        });
                    } catch (e) {}
                };
                xhr.send();
            })(toCheck.slice(i, i + BATCH_SIZE));
        }
    }

    ///////////////////////////////////////////
    // CSS variable completions
    ///////////////////////////////////////////

    /**
     * Fetches CSS custom properties from the monaco.plus.css.variables system
     * property via the Table REST API and caches them for the session.
     * Safe to call multiple times — only the first call fires the XHR.
     */
    function _loadCssVariables() {
        if (_cssVarCache) {
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open(
            'GET',
            '/api/now/table/sys_properties' +
                '?sysparm_query=name%3Dmonaco.plus.css.variables' +
                '&sysparm_fields=value&sysparm_limit=1',
            true
        );
        xhr.setRequestHeader('X-UserToken', window.g_ck || '');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = function () {
            if (xhr.status !== 200) {
                _cssVarCache = [];
                return;
            }
            try {
                var data = JSON.parse(xhr.responseText);
                var records = data && data.result;
                if (!records || !records.length) {
                    _cssVarCache = [];
                    return;
                }
                var varMap = {};
                try {
                    varMap = JSON.parse(records[0].value || '{}');
                } catch (e) {}
                var vars = Object.keys(varMap).map(function (k) {
                    return { name: k, value: varMap[k] };
                });
                vars.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
                _cssVarCache = vars;
            } catch (e) {
                _cssVarCache = [];
            }
        };
        xhr.send();
    }

    /**
     * Registers a completion provider for CSS and SCSS that suggests CSS custom
     * properties (--token-name) when the user types inside a var() call.
     * Safe to call multiple times — only registers once.
     */
    function _registerCssVarCompletions() {
        if (
            _cssVarCompletionRegistered ||
            !window.monaco ||
            !monaco.languages
        ) {
            return;
        }
        _cssVarCompletionRegistered = true;

        function provideCssVarItems(model, position) {
            var textBefore = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });

            // Match inside var(-- while typing: \\\`var(--token\\\` or \\\`var(-- token\\\`
            var varCallMatch = textBefore.match(/var\\(\\s*--\\s*([\\w-]*)$/);
            if (!varCallMatch) {
                return { suggestions: [] };
            }

            var typedSuffix = varCallMatch[1] || '';
            var range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - typedSuffix.length,
                endColumn: position.column,
            };

            var vars = _cssVarCache || [];
            if (!vars.length) {
                _loadCssVariables(); // lazy fetch on first trigger
                return { suggestions: [] };
            }

            return {
                suggestions: vars.map(function (v) {
                    return {
                        label: v.name,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        detail: v.value || '',
                        insertText: v.name + (v.value ? ', ' + v.value : ''),
                        range: range,
                    };
                }),
            };
        }

        ['scss', 'css'].forEach(function (lang) {
            monaco.languages.registerCompletionItemProvider(lang, {
                triggerCharacters: ['-', ' ', '('],
                provideCompletionItems: provideCssVarItems,
            });
        });
    }

    // SCSS variable completions
    ///////////////////////////////////////////

    /**
     * Fetches SCSS variables from the monaco.plus.scss.variables system
     * property via the Table REST API and caches them for the session.
     * Returns a Promise that resolves with the vars array.
     * Safe to call multiple times — only the first call fires the XHR;
     * concurrent callers share the same in-flight promise.
     */
    function _loadScssVariables() {
        if (_scssVarCache !== null) {
            return Promise.resolve(_scssVarCache);
        }
        if (_scssVarPromise) {
            return _scssVarPromise;
        }
        _scssVarPromise = new Promise(function (resolve) {
            var xhr = new XMLHttpRequest();
            xhr.open(
                'GET',
                '/api/now/table/sys_properties' +
                    '?sysparm_query=name%3Dmonaco.plus.scss.variables' +
                    '&sysparm_fields=value&sysparm_limit=1',
                true
            );
            xhr.setRequestHeader('X-UserToken', window.g_ck || '');
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.onload = function () {
                if (xhr.status !== 200) {
                    _scssVarCache = [];
                    resolve([]);
                    return;
                }
                try {
                    var data = JSON.parse(xhr.responseText);
                    var records = data && data.result;
                    if (!records || !records.length) {
                        _scssVarCache = [];
                        resolve([]);
                        return;
                    }
                    var varMap = {};
                    try {
                        varMap = JSON.parse(records[0].value || '{}');
                    } catch (e) {}
                    var vars = Object.keys(varMap).map(function (k) {
                        return { name: k, value: varMap[k] };
                    });
                    _scssVarCache = vars;
                    resolve(vars);
                } catch (e) {
                    _scssVarCache = [];
                    resolve([]);
                }
            };
            xhr.onerror = function () {
                _scssVarCache = [];
                resolve([]);
            };
            xhr.send();
        });
        return _scssVarPromise;
    }

    /**
     * Registers a completion provider for SCSS and Less that suggests SCSS
     * variables (e.g. $breakpoint-sm) when the user types the $ character.
     * Variables are sourced from the monaco.plus.scss.variables sys_property.
     * Safe to call multiple times — only registers once.
     */
    function _registerScssVarCompletions() {
        if (
            _scssVarCompletionRegistered ||
            !window.monaco ||
            !monaco.languages
        ) {
            return;
        }
        _scssVarCompletionRegistered = true;

        function provideScssVarItems(model, position) {
            var textBefore = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });

            // Match a $ followed by optional identifier characters at end of line
            var match = textBefore.match(/\\$([\\w-]*)$/);
            if (!match) {
                return { suggestions: [] };
            }

            var typedSuffix = match[1] || '';
            var range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - typedSuffix.length - 1,
                endColumn: position.column,
            };

            function buildSuggestions(vars) {
                return {
                    suggestions: vars.map(function (v) {
                        return {
                            label: v.name,
                            kind: monaco.languages.CompletionItemKind.Variable,
                            detail: v.value || '',
                            insertText: v.name,
                            range: range,
                        };
                    }),
                };
            }

            // Cache already populated — synchronous fast path
            if (_scssVarCache !== null) {
                return buildSuggestions(_scssVarCache);
            }

            // First trigger — fetch and let Monaco await the promise
            return _loadScssVariables().then(buildSuggestions);
        }

        ['scss', 'less'].forEach(function (lang) {
            monaco.languages.registerCompletionItemProvider(lang, {
                triggerCharacters: ['$'],
                provideCompletionItems: provideScssVarItems,
            });
        });
    }

    /**
     * Registers a hover provider for SCSS and Less that shows the resolved value
     * of a SCSS variable (e.g. $breakpoint-sm → 480px) when the user hovers over
     * a variable reference. Variables are sourced from _scssVarCache.
     * Safe to call multiple times — only registers once.
     */
    function _registerScssVarHover() {
        if (_scssVarHoverRegistered || !window.monaco) {
            return;
        }
        _scssVarHoverRegistered = true;

        var provider = {
            provideHover: function (model, position) {
                var vars = _scssVarCache;
                if (!vars || !vars.length) {
                    return null;
                }

                var word = model.getWordAtPosition(position);
                if (!word) {
                    return null;
                }

                // Check that the character immediately before the word is '$'
                var lineText = model.getLineContent(position.lineNumber);
                var charBeforeWord = lineText[word.startColumn - 2]; // startColumn is 1-based
                if (charBeforeWord !== '$') {
                    return null;
                }

                var varName = '$' + word.word;
                var entry = null;
                for (var i = 0; i < vars.length; i++) {
                    if (vars[i].name === varName) {
                        entry = vars[i];
                        break;
                    }
                }
                if (!entry) {
                    return null;
                }

                return {
                    contents: [
                        {
                            value:
                                '\`\`\`scss\\n' +
                                entry.name +
                                ': ' +
                                entry.value +
                                '\\n\`\`\`',
                        },
                    ],
                    range: new monaco.Range(
                        position.lineNumber,
                        word.startColumn - 1,
                        position.lineNumber,
                        word.endColumn
                    ),
                };
            },
        };

        monaco.languages.registerHoverProvider('scss', provider);
        monaco.languages.registerHoverProvider('less', provider);
    }

    ///////////////////////////////////////////
    // Providers
    ///////////////////////////////////////////

    /**
     * Registers a dot-completion provider for TypeScript and JavaScript that
     * provides two kinds of suggestions on trigger character '.':
     *
     *   this.        — methods of the PrototypeJS class currently being edited,
     *                  parsed live from the model content (no server round-trip).
     *   instance.    — methods of another Script Include, resolved by scanning the
     *                  model for 'var instance = new ClassName(' and fetching that
     *                  Script Include's script field via the REST API.
     */
    /**
     * Resolves the Script Include class assigned to an instance property of the
     * class being edited, e.g. \\\`this.utils = new IncidentUtilsSNC();\\\` →
     * 'IncidentUtilsSNC'. TypeScript cannot type \\\`this\\\` inside the
     * PrototypeJS object-literal pattern (Class.create()), so completions,
     * hover, and signature help resolve \\\`this.<prop>.\\\` through this scan.
     *
     * @param {string} content  - Full model text.
     * @param {string} propName - Property name after \\\`this.\\\`.
     * @returns {string|null} Class name, or null when no assignment is found.
     */
    function _getThisPropClass(content, propName) {
        var re = new RegExp(
            '\\\\bthis\\\\s*\\\\.\\\\s*' +
                propName +
                '\\\\s*=\\\\s*new\\\\s+([A-Z][A-Za-z0-9_]*)\\\\s*\\\\('
        );
        var m = re.exec(content);
        return m ? m[1] : null;
    }

    function registerDotCompletions() {
        if (_completionRegistered || !window.monaco) {
            return;
        }
        _completionRegistered = true;

        var provider = {
            triggerCharacters: ['.'],
            provideCompletionItems: function (model, position) {
                var lineText = model.getLineContent(position.lineNumber);
                var beforeCursor = lineText.substring(0, position.column - 1);

                var wordInfo = model.getWordUntilPosition(position);
                var targetRange = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: wordInfo.startColumn,
                    endColumn: wordInfo.endColumn,
                };

                // this. — parse current model directly, no server fetch needed
                var thisMatch = beforeCursor.match(/\\bthis\\.(\\w*)$/);
                if (thisMatch) {
                    var content = model.getValue();
                    if (!/\\bClass\\.create\\s*\\(\\s*\\)/.test(content)) {
                        return {
                            suggestions: [],
                        };
                    }
                    return {
                        suggestions: parseSiMethods(content)
                            .filter(function (m) {
                                return !m.isConstructor && m.name;
                            })
                            .map(function (m) {
                                return {
                                    label: String(m.name),
                                    kind: monaco.languages.CompletionItemKind
                                        .Method,
                                    detail: String(m.signature),
                                    documentation: {
                                        value: String(m.documentation),
                                        isTrusted: true,
                                    },
                                    insertText: String(m.name),
                                    range: targetRange,
                                };
                            }),
                    };
                }

                /* this.prop. — instance property assigned via this.prop = new SI().
                 * TypeScript types \\\`this\\\` as any inside the Class.create()
                 * object-literal pattern, so we supply the method completions. */
                var thisPropMatch = beforeCursor.match(
                    /\\bthis\\.(\\w+)\\.(\\w*)$/
                );
                if (thisPropMatch) {
                    var thisPropClass = _getThisPropClass(
                        model.getValue(),
                        thisPropMatch[1]
                    );
                    if (thisPropClass) {
                        return fetchSiMethods(thisPropClass).then(function (
                            methods
                        ) {
                            return {
                                suggestions: (methods || [])
                                    .filter(function (m) {
                                        return !m.isConstructor && m.name;
                                    })
                                    .map(function (m) {
                                        return {
                                            label: String(m.name),
                                            kind: monaco.languages
                                                .CompletionItemKind.Method,
                                            detail: String(m.signature),
                                            documentation: {
                                                value: String(m.documentation),
                                                isTrusted: true,
                                            },
                                            insertText: String(m.name),
                                            range: targetRange,
                                        };
                                    }),
                            };
                        });
                    }
                }

                /* new ClassName(). — direct chain without a variable assignment */
                var newChainMatch = beforeCursor.match(
                    /\\bnew\\s+([A-Z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\.(\\w*)$/
                );
                if (newChainMatch) {
                    var siClassName = newChainMatch[1];
                    /* Once the DTS is registered TypeScript is the sole provider.
                     * Returning our suggestions on top of TypeScript's causes
                     * every method to appear twice on the second trigger. */
                    if (_siMethodCache[siClassName]) {
                        return null;
                    }
                    return fetchSiMethods(siClassName).then(function () {
                        return null;
                    });
                }

                /* Multi-segment GlideRecord dot-walk: gr.company. or gr.caller_id.manager.
                 * ≥2 segments required, so the single-segment case below is unaffected. */
                var multiSegMatch = beforeCursor.match(
                    /(\\w+)((?:\\.\\w+)+)\\.(\\w*)$/
                );
                if (multiSegMatch) {
                    var chainRoot = multiSegMatch[1];
                    var chainSegments = multiSegMatch[2].slice(1).split('.');
                    var chainBaseTable = getGlideRecordTable(model, chainRoot);
                    if (chainBaseTable) {
                        return _resolveFieldChain(
                            chainBaseTable,
                            chainSegments
                        ).then(function (resolvedTable) {
                            if (!resolvedTable) return { suggestions: [] };
                            return fetchTableFields(resolvedTable).then(
                                function (fields) {
                                    return {
                                        suggestions: fields.map(function (f) {
                                            return {
                                                label: String(f.name),
                                                kind: monaco.languages
                                                    .CompletionItemKind.Field,
                                                detail:
                                                    String(f.label) +
                                                    ' (' +
                                                    String(f.type) +
                                                    ')',
                                                insertText: String(f.name),
                                                range: targetRange,
                                            };
                                        }),
                                    };
                                }
                            );
                        });
                    }
                }

                // varName. — scan the model for var varName = new ClassName(
                var dotMatch = beforeCursor.match(/(\\w+)\\.(\\w*)$/);
                if (!dotMatch) {
                    return {
                        suggestions: [],
                    };
                }
                var varName = dotMatch[1];

                // GlideRecord/GlideRecordSecure — show table field names
                var grTable = getGlideRecordTable(model, varName);
                if (grTable) {
                    return fetchTableFields(grTable).then(function (fields) {
                        return {
                            suggestions: fields.map(function (f) {
                                return {
                                    label: String(f.name),
                                    kind: monaco.languages.CompletionItemKind
                                        .Field,
                                    detail:
                                        String(f.label) +
                                        ' (' +
                                        String(f.type) +
                                        ')',
                                    insertText: String(f.name),
                                    range: targetRange,
                                };
                            }),
                        };
                    });
                }

                /* ClassName. within the SI being edited — suggest its own constants */
                var content = model.getValue();
                var classCreateRe = new RegExp(
                    '(?:var|let|const)\\\\s+(' +
                        varName +
                        ')\\\\s*=\\\\s*Class\\\\.create\\\\s*\\\\(\\\\s*\\\\)'
                );
                if (classCreateRe.test(content)) {
                    return {
                        suggestions: parseSiConstants(content, varName).map(
                            function (c) {
                                return {
                                    label: String(c.name),
                                    kind: monaco.languages.CompletionItemKind
                                        .Constant,
                                    detail:
                                        varName +
                                        '.' +
                                        c.name +
                                        ': ' +
                                        c.tsType,
                                    documentation: c.documentation
                                        ? {
                                              value: c.documentation,
                                              isTrusted: true,
                                          }
                                        : undefined,
                                    insertText: String(c.name),
                                    range: targetRange,
                                };
                            }
                        ),
                    };
                }

                /* ClassName. — ensure the SI DTS is registered so TypeScript's native
                 * completions surface the static readonly constants. We return null so
                 * TypeScript is the sole provider (avoids the (property)/(constant)
                 * duplicate that appeared when we also returned our own suggestions).
                 *
                 * Guard: skip if varName has an instance-assignment in this model —
                 * those are handled below by assignRe as method completions. */
                var instanceAssignRe = new RegExp(
                    '(?:var|let|const)\\\\s+' +
                        varName +
                        '\\\\s*=\\\\s*new\\\\s+[A-Z][A-Za-z0-9_]*\\\\s*\\\\('
                );
                if (
                    /^[A-Z]/.test(varName) &&
                    _siNameMap[varName] !== '' &&
                    !instanceAssignRe.test(content)
                ) {
                    if (_siNameMap[varName]) {
                        /* Already confirmed as an SI — DTS is registered, defer to TypeScript */
                        if (_siMethodCache[varName]) {
                            return null;
                        }
                        return fetchSiMethods(varName).then(function () {
                            return null;
                        });
                    }
                    /* Not checked yet — verify name, register DTS if found */
                    return new Promise(function (resolve) {
                        _checkSiExists(varName, function (name) {
                            if (!name) {
                                resolve(null);
                                return;
                            }
                            fetchSiMethods(name).then(function () {
                                resolve(null);
                            });
                        });
                    });
                }

                var assignRe = new RegExp(
                    '(?:var|let|const)\\\\s+' +
                        varName +
                        '\\\\s*=\\\\s*new\\\\s+([A-Z][A-Za-z0-9_]*)\\\\s*\\\\(',
                    'g'
                );
                var assignMatch = assignRe.exec(content);
                if (
                    !assignMatch ||
                    _isChainedConstructor(content, assignMatch)
                ) {
                    return {
                        suggestions: [],
                    };
                }

                var className = assignMatch[1];

                /* DTS registered — TypeScript is the sole provider. */
                if (_siMethodCache[className]) {
                    return null;
                }
                return fetchSiMethods(className).then(function () {
                    return null;
                });
            },
        };

        monaco.languages.registerCompletionItemProvider('typescript', provider);
        monaco.languages.registerCompletionItemProvider('javascript', provider);
    }

    ///////////////////////////////////////////
    // Quick-info hover replacement
    ///////////////////////////////////////////

    /*
     * ServiceNow's bundled Monaco language features predate the TypeScript
     * worker it ships (TS 5.x returns JSDoc tag text as an array of display
     * parts; the bundled renderer expects a string), so the native hover
     * renders every JSDoc tag as a bare '@ \\u2014' fragment with no name,
     * type, or description.
     *
     * setModeConfiguration({hovers: false}) does not help — SN's build only
     * reads the mode configuration at language setup, before our scripts run.
     * Instead we suppress the native hover at the shared worker-client level:
     * getQuickInfoAtPosition on the client proxy is replaced with a function
     * returning undefined (the native provider treats that as 'no hover'),
     * while our replacement provider calls the saved original and renders
     * displayParts / documentation / tags correctly for both string and
     * parts-array tag text.
     *
     * The worker client is recreated if Monaco recycles an idle worker, so a
     * keep-alive interval re-applies the patch (and, as a side effect, keeps
     * the worker from being recycled at all).
     */

    /** Joins a TS displayParts array (or passes a plain string through). */
    function _qiPartsToString(parts) {
        if (!parts) {
            return '';
        }
        if (typeof parts === 'string') {
            return parts;
        }
        return parts
            .map(function (p) {
                return p.text;
            })
            .join('');
    }

    /** Renders one JSDoc tag as markdown, e.g. *@param* \`name\` — description. */
    function _qiRenderTag(tag) {
        var label = '*@' + tag.name + '*';
        var text = _qiPartsToString(tag.text);
        if (!text) {
            return label;
        }
        if (tag.name === 'param') {
            var m = /^\\s*(\\S+)\\s*([\\s\\S]*)$/.exec(text);
            if (m) {
                var rest = m[2].replace(/^[-\\u2014]\\s*/, '');
                label += ' \`' + m[1] + '\`';
                if (rest) {
                    label += ' \\u2014 ' + rest;
                }
                return label;
            }
        }
        return label + ' \\u2014 ' + text.replace(/^[-\\u2014]\\s*/, '');
    }

    /**
     * Replaces getQuickInfoAtPosition on a worker client proxy so the native
     * hover provider receives no result. The original is kept for our own
     * provider. Idempotent per client instance.
     */
    function _qiEnsurePatched(client) {
        if (!client || client.__weQiPatched) {
            return;
        }
        client.__weQiPatched = true;
        client.__weOrigQi = client.getQuickInfoAtPosition.bind(client);
        client.getQuickInfoAtPosition = function () {
            return Promise.resolve(undefined);
        };
    }

    /** Patches the worker client for one language; resolves quietly on failure. */
    function _qiPatchLanguage(lang) {
        var ts = monaco.languages.typescript;
        var getWorker =
            lang === 'typescript'
                ? ts.getTypeScriptWorker
                : ts.getJavaScriptWorker;
        if (!getWorker) {
            return Promise.resolve(null);
        }
        var models = monaco.editor.getModels().filter(function (m) {
            return m.getLanguageId() === lang;
        });
        if (!models.length) {
            return Promise.resolve(null);
        }
        return getWorker()
            .then(function (worker) {
                return worker(models[0].uri);
            })
            .then(function (client) {
                _qiEnsurePatched(client);
                return client;
            })
            .catch(function () {
                return null;
            });
    }

    /**
     * Suppresses the native (broken) TS/JS hover and registers a replacement
     * that renders quick info with correct JSDoc tag formatting. Idempotent.
     */
    function _installQuickInfoHover() {
        if (
            _qiHoverInstalled ||
            !window.monaco ||
            !monaco.languages ||
            !monaco.languages.typescript
        ) {
            return;
        }
        _qiHoverInstalled = true;

        // Eager patch + keep-alive: re-applies after any worker recycle and,
        // by touching the worker, prevents idle recycling in the first place.
        function _patchAll() {
            _qiPatchLanguage('javascript');
            _qiPatchLanguage('typescript');
        }
        _patchAll();
        if (!_qiKeepAliveTimer) {
            _qiKeepAliveTimer = setInterval(_patchAll, 30000);
        }

        var provider = {
            provideHover: function (model, position) {
                var lang = model.getLanguageId();
                if (lang !== 'javascript' && lang !== 'typescript') {
                    return null;
                }
                var ts = monaco.languages.typescript;
                var getWorker =
                    lang === 'typescript'
                        ? ts.getTypeScriptWorker
                        : ts.getJavaScriptWorker;
                if (!getWorker) {
                    return null;
                }
                var offset = model.getOffsetAt(position);
                return getWorker()
                    .then(function (worker) {
                        return worker(model.uri);
                    })
                    .then(function (client) {
                        _qiEnsurePatched(client);
                        return client.__weOrigQi(
                            model.uri.toString(),
                            offset
                        );
                    })
                    .then(function (info) {
                        if (!info || model.isDisposed()) {
                            return null;
                        }
                        var sig = _qiPartsToString(info.displayParts);
                        var doc = _qiPartsToString(info.documentation);
                        var tagsMd = (info.tags || [])
                            .map(_qiRenderTag)
                            .join('  \\n\\n');
                        /* Bare 'any' with no docs is noise (e.g. this.utils.* —
                         * handled by the Script Include hover provider). */
                        if (sig === 'any' && !doc && !tagsMd) {
                            return null;
                        }
                        var contents = [];
                        if (sig) {
                            contents.push({
                                value:
                                    '\`\`\`typescript\\n' + sig + '\\n\`\`\`',
                            });
                        }
                        var body = [doc, tagsMd]
                            .filter(Boolean)
                            .join('\\n\\n');
                        if (body) {
                            contents.push({ value: body, isTrusted: true });
                        }
                        if (!contents.length) {
                            return null;
                        }
                        var start = model.getPositionAt(info.textSpan.start);
                        var end = model.getPositionAt(
                            info.textSpan.start + info.textSpan.length
                        );
                        return {
                            contents: contents,
                            range: new monaco.Range(
                                start.lineNumber,
                                start.column,
                                end.lineNumber,
                                end.column
                            ),
                        };
                    })
                    .catch(function () {
                        return null;
                    });
            },
        };

        monaco.languages.registerHoverProvider('javascript', provider);
        monaco.languages.registerHoverProvider('typescript', provider);
    }

    /**
     * Registers a hover provider for TypeScript and JavaScript that shows JSDoc
     * documentation when the cursor hovers over a method name accessed via:
     *
     *   this.methodName      — method in the Script Include currently being edited
     *   instance.methodName  — method of a Script Include assigned via new
     */
    function registerHoverProvider() {
        if (_hoverRegistered || !window.monaco) {
            return;
        }
        _hoverRegistered = true;

        var provider = {
            provideHover: function (model, position) {
                var word = model.getWordAtPosition(position);
                if (!word) {
                    return null;
                }

                var lineText = model.getLineContent(position.lineNumber);
                var preWord = lineText.substring(0, word.startColumn - 1);
                var varMatch = preWord.match(/(\\w+)\\.\\s*$/);
                var newDotMatch = preWord.match(
                    /\\bnew\\s+([A-Z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\.\\s*$/
                );
                if (!varMatch && !newDotMatch) {
                    return null;
                }

                var varName = varMatch ? varMatch[1] : null;

                /* Builds the hover result from a method descriptor array. */
                function buildResult(methods) {
                    var found = methods.find(function (m) {
                        return m.name === word.word;
                    });
                    if (!found) {
                        return null;
                    }
                    var contents = [
                        {
                            value:
                                '\`\`\`typescript\\n' + found.signature + '\\n\`\`\`',
                        },
                    ];
                    if (found.documentation) {
                        contents.push({
                            value: found.documentation,
                            isTrusted: true,
                        });
                    }
                    return {
                        contents: contents,
                        range: new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                    };
                }

                if (newDotMatch) {
                    return fetchSiMethods(newDotMatch[1]).then(buildResult);
                }

                if (varName === 'this') {
                    var content = model.getValue();
                    if (!/\\bClass\\.create\\s*\\(\\s*\\)/.test(content)) {
                        return null;
                    }
                    return buildResult(parseSiMethods(content));
                }

                /* this.prop.method — instance property assigned via
                 * this.prop = new SI(). TypeScript sees \\\`this\\\` as any here,
                 * so the native hover shows nothing useful. */
                var thisPropHover = preWord.match(/\\bthis\\.(\\w+)\\.\\s*$/);
                if (thisPropHover) {
                    var thisPropClass = _getThisPropClass(
                        model.getValue(),
                        thisPropHover[1]
                    );
                    if (thisPropClass) {
                        return fetchSiMethods(thisPropClass).then(buildResult);
                    }
                }

                // GlideRecord/GlideRecordSecure — show field type on hover
                var grTable = getGlideRecordTable(model, varName);
                if (grTable) {
                    return fetchTableFields(grTable).then(function (fields) {
                        var found = fields.find(function (f) {
                            return f.name === word.word;
                        });
                        if (!found) {
                            return null;
                        }
                        return {
                            contents: [
                                {
                                    value:
                                        '\`\`\`typescript\\n(field) ' +
                                        found.name +
                                        ': GlideElement\\n\`\`\`',
                                },
                                {
                                    value:
                                        '**' +
                                        found.label +
                                        '**' +
                                        (found.mandatory
                                            ? ' *(required)*'
                                            : '') +
                                        '\\n\\nType: \`' +
                                        found.type +
                                        '\`',
                                    isTrusted: true,
                                },
                            ],
                            range: new monaco.Range(
                                position.lineNumber,
                                word.startColumn,
                                position.lineNumber,
                                word.endColumn
                            ),
                        };
                    });
                }

                /* ClassName.PROP — ensure DTS is registered, defer hover to TypeScript.
                 * Same instance-assignment guard as the completion provider. */
                var hoverInstanceRe = new RegExp(
                    '(?:var|let|const)\\\\s+' +
                        varName +
                        '\\\\s*=\\\\s*new\\\\s+[A-Z][A-Za-z0-9_]*\\\\s*\\\\('
                );
                if (
                    /^[A-Z]/.test(varName) &&
                    _siNameMap[varName] !== '' &&
                    !hoverInstanceRe.test(model.getValue())
                ) {
                    if (_siNameMap[varName]) {
                        if (_siMethodCache[varName]) {
                            return null;
                        }
                        return fetchSiMethods(varName).then(function () {
                            return null;
                        });
                    }
                    return new Promise(function (resolve) {
                        _checkSiExists(varName, function (name) {
                            if (!name) {
                                resolve(null);
                                return;
                            }
                            fetchSiMethods(name).then(function () {
                                resolve(null);
                            });
                        });
                    });
                }

                var assignRe = new RegExp(
                    '(?:var|let|const)\\\\s+' +
                        varName +
                        '\\\\s*=\\\\s*new\\\\s+([A-Z][A-Za-z0-9_]*)\\\\s*\\\\(',
                    'g'
                );
                var assignMatch = assignRe.exec(model.getValue());
                if (
                    !assignMatch ||
                    _isChainedConstructor(model.getValue(), assignMatch)
                ) {
                    return null;
                }

                return fetchSiMethods(assignMatch[1]).then(buildResult);
            },
        };

        monaco.languages.registerHoverProvider('typescript', provider);
        monaco.languages.registerHoverProvider('javascript', provider);
    }

    /**
     * Registers a signature help provider for TypeScript and JavaScript that
     * shows parameter hints when the cursor is inside a method call on:
     *
     *   this.methodName(     — method in the Script Include currently being edited
     *   instance.methodName( — method of a Script Include assigned via new
     */
    function registerSignatureHelp() {
        if (_sigHelpRegistered || !window.monaco) {
            return;
        }
        _sigHelpRegistered = true;

        var provider = {
            signatureHelpTriggerCharacters: ['('],
            signatureHelpRetriggerCharacters: [','],
            provideSignatureHelp: function (model, position) {
                var lineText = model.getLineContent(position.lineNumber);
                var beforeCursor = lineText.substring(0, position.column - 1);
                var callMatch = beforeCursor.match(/(\\w+)\\.(\\w+)\\s*\\(([^)]*)$/);
                var newCallMatch = beforeCursor.match(
                    /\\bnew\\s+([A-Z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\.(\\w+)\\s*\\(([^)]*)$/
                );
                if (!callMatch && !newCallMatch) {
                    return null;
                }

                var varName = callMatch ? callMatch[1] : null;
                var methodName = callMatch ? callMatch[2] : newCallMatch[2];
                var argsTyped = callMatch ? callMatch[3] : newCallMatch[3];

                /* Builds the signature help result from a method descriptor array. */
                function buildResult(methods) {
                    var found = methods.find(function (m) {
                        return m.name === methodName;
                    });
                    if (!found) {
                        return null;
                    }
                    var activeParam = argsTyped.split(',').length - 1;
                    var parameters = (found.params || []).map(function (p) {
                        var desc = found.paramDocs && found.paramDocs[p];
                        return desc
                            ? {
                                  label: p,
                                  documentation: {
                                      value: desc,
                                      isTrusted: true,
                                  },
                              }
                            : { label: p };
                    });
                    return {
                        value: {
                            signatures: [
                                {
                                    label: found.signature,
                                    documentation: {
                                        value: found.documentation,
                                        isTrusted: true,
                                    },
                                    parameters: parameters,
                                },
                            ],
                            activeSignature: 0,
                            activeParameter: activeParam,
                        },
                        dispose: function () {},
                    };
                }

                if (newCallMatch) {
                    return fetchSiMethods(newCallMatch[1]).then(buildResult);
                }

                if (varName === 'this') {
                    var content = model.getValue();
                    if (!/\\bClass\\.create\\s*\\(\\s*\\)/.test(content)) {
                        return null;
                    }
                    return buildResult(parseSiMethods(content));
                }

                /* this.prop.method( — instance property assigned via
                 * this.prop = new SI(). */
                var thisPropCall = beforeCursor.match(
                    /\\bthis\\.(\\w+)\\.(\\w+)\\s*\\(([^)]*)$/
                );
                if (thisPropCall) {
                    var thisPropClass = _getThisPropClass(
                        model.getValue(),
                        thisPropCall[1]
                    );
                    if (thisPropClass) {
                        return fetchSiMethods(thisPropClass).then(buildResult);
                    }
                }

                var assignRe = new RegExp(
                    '(?:var|let|const)\\\\s+' +
                        varName +
                        '\\\\s*=\\\\s*new\\\\s+([A-Z][A-Za-z0-9_]*)\\\\s*\\\\(',
                    'g'
                );
                var assignMatch = assignRe.exec(model.getValue());
                if (
                    !assignMatch ||
                    _isChainedConstructor(model.getValue(), assignMatch)
                ) {
                    return null;
                }

                return fetchSiMethods(assignMatch[1]).then(buildResult);
            },
        };

        monaco.languages.registerSignatureHelpProvider('typescript', provider);
        monaco.languages.registerSignatureHelpProvider('javascript', provider);
    }

    /**
     * Registers completion providers for TypeScript and JavaScript that suggest
     * Script Include class names in two contexts:
     *
     *   1. After the 'new' keyword (triggered by space/tab): inserts 'ClassName($1)'
     *      as a snippet. Uses the in-memory cache when available; otherwise issues a
     *      debounced nameSTARTSWITH query (300 ms) so bursts of keystrokes produce a
     *      single network request rather than one per character.
     *   2. While typing any capitalised word (triggered by A–Z): inserts the plain
     *      class name and filters from the _siNameMap cache populated by earlier
     *      'new'-provider fetches.
     */
    function registerNewSiCompletions() {
        if (_newSiRegistered || !window.monaco) {
            return;
        }
        _newSiRegistered = true;

        // Debounce state for the 'new' provider fallback fetch.
        var _siDebounceTimer = null;
        var _siPending = []; // { prefix, range, resolve }[]

        function _getCachedSIs(prefix) {
            var lower = prefix ? prefix.toLowerCase() : '';
            var results = [];
            Object.keys(_siNameMap).forEach(function (name) {
                if (
                    _siNameMap[name] &&
                    (!lower || name.toLowerCase().indexOf(lower) === 0)
                ) {
                    results.push({ name: name, sys_id: _siNameMap[name] });
                }
            });
            results.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            return results.slice(0, 100);
        }

        function _toSuggestions(cachedList, range) {
            return cachedList.map(function (r) {
                return {
                    label: r.name,
                    kind: monaco.languages.CompletionItemKind.Constructor,
                    detail: 'Script Include',
                    insertText: r.name + '($1)',
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    range: range,
                };
            });
        }

        // Provider 1 — after 'new ' keyword, triggered by space / tab.
        var newKeywordProvider = {
            triggerCharacters: [' ', '\\t'],
            provideCompletionItems: function (model, position) {
                var lineText = model.getLineContent(position.lineNumber);
                var textBefore = lineText.substring(0, position.column - 1);
                var m = textBefore.match(/\\bnew\\s+(\\w*)$/);
                if (!m) {
                    return { suggestions: [] };
                }
                var prefix = m[1];
                var word = model.getWordUntilPosition(position);
                var range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };
                var cached = _getCachedSIs(prefix);
                if (cached.length) {
                    return { suggestions: _toSuggestions(cached, range) };
                }
                // Cache miss — debounce the fetch so rapid keystrokes share one request.
                return new Promise(function (resolve) {
                    _siPending.push({
                        prefix: prefix,
                        range: range,
                        resolve: resolve,
                    });
                    clearTimeout(_siDebounceTimer);
                    _siDebounceTimer = setTimeout(function () {
                        var pending = _siPending.splice(0);
                        var latestPrefix = pending[pending.length - 1].prefix;
                        _fetchSiByPrefix(latestPrefix, function () {
                            pending.forEach(function (p) {
                                p.resolve({
                                    suggestions: _toSuggestions(
                                        _getCachedSIs(p.prefix),
                                        p.range
                                    ),
                                });
                            });
                        });
                    }, 300);
                });
            },
        };

        // Provider 2 — capitalised-word completions, triggered by any A–Z character.
        // Only returns results when the partial word is 2+ chars and the cache has
        // matching entries, so the widget stays closed for single-char triggers that
        // have no SI matches.
        var capitalWordProvider = {
            triggerCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
            provideCompletionItems: function (model, position) {
                var word = model.getWordUntilPosition(position);
                if (
                    !word ||
                    !word.word ||
                    !/^[A-Z]/.test(word.word) ||
                    word.word.length < 2
                ) {
                    return { suggestions: [] };
                }
                // Defer to the 'new' provider when the word is immediately after new
                var lineText = model.getLineContent(position.lineNumber);
                var textBefore = lineText.substring(0, word.startColumn - 1);
                if (/\\bnew\\s+$/.test(textBefore)) {
                    return { suggestions: [] };
                }
                var range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };
                var cached = _getCachedSIs(word.word);
                if (!cached.length) {
                    return { suggestions: [] };
                }
                return {
                    suggestions: cached.map(function (r) {
                        return {
                            label: r.name,
                            kind: monaco.languages.CompletionItemKind.Class,
                            detail: 'Script Include',
                            insertText: r.name,
                            range: range,
                        };
                    }),
                };
            },
        };

        monaco.languages.registerCompletionItemProvider(
            'typescript',
            newKeywordProvider
        );
        monaco.languages.registerCompletionItemProvider(
            'javascript',
            newKeywordProvider
        );
        monaco.languages.registerCompletionItemProvider(
            'typescript',
            capitalWordProvider
        );
        monaco.languages.registerCompletionItemProvider(
            'javascript',
            capitalWordProvider
        );
    }

    /**
     * Registers a completion provider for TypeScript and JavaScript that suggests
     * GlideRecord field names when the cursor is inside a string argument of a
     * field-consuming method (getValue, setValue, addQuery, orderBy, etc.).
     * Triggered on quote characters and '.', supporting dot-walked fields:
     *   gr.getValue('caller_id.  →  fields from sys_user
     */
    function registerGrFieldStringCompletions() {
        if (_grStringCompletionRegistered || !window.monaco) {
            return;
        }
        _grStringCompletionRegistered = true;

        var provider = {
            triggerCharacters: ["'", '"', '.'],
            provideCompletionItems: function (model, position) {
                var ctx = _getFieldStringContext(model, position);
                if (!ctx) {
                    return { suggestions: [] };
                }
                var baseTable = _findGrTable(
                    model,
                    ctx.varName,
                    position.lineNumber
                );
                if (!baseTable) {
                    return { suggestions: [] };
                }

                function buildSuggestions(fields) {
                    if (!fields) {
                        return { suggestions: [] };
                    }
                    return {
                        suggestions: fields.map(function (f) {
                            return {
                                label: f.name,
                                kind: monaco.languages.CompletionItemKind.Field,
                                detail: f.label !== f.name ? f.label : '',
                                documentation:
                                    f.type +
                                    (f.reference ? ' → ' + f.reference : ''),
                                insertText: f.name,
                                range: ctx.range,
                            };
                        }),
                    };
                }

                // No dot-walk — fast synchronous path when the table is already cached.
                if (!ctx.dotPath || ctx.dotPath.length === 0) {
                    var cached = _tableFieldCache[baseTable];
                    if (cached && !_tablePendingCache[baseTable]) {
                        return buildSuggestions(cached);
                    }
                    fetchTableFields(baseTable); // fire-and-forget
                    return { incomplete: true, suggestions: [] };
                }

                // Dot-walk: resolve the reference chain, then return fields of the
                // target table.  Always async because this needs at least one fetch.
                return _resolveFieldChain(baseTable, ctx.dotPath).then(
                    function (targetTable) {
                        if (!targetTable) {
                            return { suggestions: [] };
                        }
                        return fetchTableFields(targetTable).then(
                            buildSuggestions
                        );
                    }
                );
            },
        };

        monaco.languages.registerCompletionItemProvider('javascript', provider);
        monaco.languages.registerCompletionItemProvider('typescript', provider);
    }

    /**
     * Registers a hover provider for TypeScript and JavaScript that shows dictionary
     * metadata (label, type, max_length, mandatory, reference) when hovering over
     * a field-name string literal inside a GlideRecord method call.
     * Supports dot-walked strings: hovering on any segment shows info for that
     * segment on its resolved table, e.g. hovering 'caller_id' vs 'name' in
     * getValue('caller_id.name') shows info from incident vs sys_user respectively.
     */
    function registerGrFieldStringHover() {
        if (_grStringHoverRegistered || !window.monaco) {
            return;
        }
        _grStringHoverRegistered = true;

        var provider = {
            provideHover: function (model, position) {
                var ctx = _getFieldContextAtPos(model, position);
                if (!ctx) {
                    return null;
                }
                var baseTable = _findGrTable(
                    model,
                    ctx.varName,
                    position.lineNumber
                );
                if (!baseTable) {
                    return null;
                }

                var segments = ctx.fieldName.split('.');

                // Find the opening quote so we can locate the cursor within the string.
                var lineContent = model.getLineContent(position.lineNumber);
                var col = position.column - 1; // 0-based
                var sIdx = -1;
                for (var i = col - 1; i >= 0; i--) {
                    var ch = lineContent[i];
                    if (ch === "'" || ch === '"') {
                        sIdx = i;
                        break;
                    }
                    if (ch === '(') {
                        break;
                    }
                }
                if (sIdx === -1) {
                    return null;
                }

                // Cursor offset within the string content (0-based).
                var cursorOffset = col - sIdx - 1;

                // Identify which segment the cursor sits in, and its start offset.
                var segIdx = 0,
                    segStart = 0;
                var off = 0;
                for (var k = 0; k < segments.length; k++) {
                    segIdx = k;
                    segStart = off;
                    if (cursorOffset <= off + segments[k].length - 1) {
                        break;
                    }
                    off += segments[k].length + 1; // +1 for the '.'
                }

                var dotPathForSeg = segments.slice(0, segIdx);
                var hoveredField = segments[segIdx];

                return _resolveFieldChain(baseTable, dotPathForSeg).then(
                    function (resolvedTable) {
                        if (!resolvedTable) {
                            return null;
                        }
                        return fetchFieldDoc(resolvedTable, hoveredField).then(
                            function (info) {
                                if (!info) {
                                    return null;
                                }

                                // Range covers the hovered segment only (not the full string).
                                // 1-based: (0-based quote pos) + (0-based segment start) + 2
                                var segStartCol = sIdx + segStart + 2;
                                var segEndCol =
                                    segStartCol + hoveredField.length; // exclusive
                                var range = new monaco.Range(
                                    position.lineNumber,
                                    segStartCol,
                                    position.lineNumber,
                                    segEndCol
                                );

                                var header = '**' + info.label + '**';
                                if (info.type) {
                                    header += '&nbsp;&nbsp;\`' + info.type + '\`';
                                }
                                var contents = [
                                    {
                                        value: header,
                                        isTrusted: true,
                                        supportHtml: true,
                                    },
                                ];
                                var meta = [];
                                if (info.max_length) {
                                    meta.push('Max length: ' + info.max_length);
                                }
                                if (info.mandatory) {
                                    meta.push('Mandatory');
                                }
                                if (meta.length) {
                                    contents.push({ value: meta.join(' · ') });
                                }
                                contents.push({
                                    value:
                                        '*' +
                                        resolvedTable +
                                        '.' +
                                        hoveredField +
                                        '*',
                                });
                                if (info.reference) {
                                    contents.push({
                                        value:
                                            'References: \`' +
                                            info.reference +
                                            '\`',
                                    });
                                }
                                return { range: range, contents: contents };
                            }
                        );
                    }
                );
            },
        };

        monaco.languages.registerHoverProvider('javascript', provider);
        monaco.languages.registerHoverProvider('typescript', provider);
    }

    /**
     * Registers a completion provider for TypeScript and JavaScript that suggests
     * table names when the cursor is inside the first string argument of a
     * GlideRecord, GlideRecordSecure, or GlideAggregate constructor.
     *   new GlideRecord('  →  first 50 tables alphabetically
     *   new GlideRecord('inc  →  tables starting with 'inc'
     * Results are fetched asynchronously, 50 at a time, and cached per prefix.
     */
    function registerGrConstructorCompletions() {
        if (_grConstructorCompletionRegistered || !window.monaco) {
            return;
        }
        _grConstructorCompletionRegistered = true;

        var provider = {
            triggerCharacters: ["'", '"'],
            provideCompletionItems: function (model, position) {
                var ctx = _getGrConstructorContext(model, position);
                if (!ctx) {
                    return { suggestions: [] };
                }

                return fetchTablesMatching(ctx.prefix).then(function (tables) {
                    return {
                        incomplete: true,
                        suggestions: tables.map(function (t) {
                            return {
                                label: t.name,
                                kind: monaco.languages.CompletionItemKind.Class,
                                detail: t.label !== t.name ? t.label : '',
                                insertText: t.name,
                                range: ctx.range,
                            };
                        }),
                    };
                });
            },
        };

        monaco.languages.registerCompletionItemProvider('javascript', provider);
        monaco.languages.registerCompletionItemProvider('typescript', provider);
    }

    /**
     * Registers a completion provider that suggests table or field names when
     * the cursor is inside a string argument of a Script Include method call,
     * based on the parameter name declared in the SI's JSDoc:
     *   \\\`table\\\` / \\\`table_name\\\` / \\\`tableName\\\`  →  table name suggestions
     *   \\\`field\\\` / \\\`field_name\\\` / \\\`fieldName\\\`  →  field suggestions for the
     *       table value passed to the sibling table parameter
     */
    function registerSiParamStringCompletions() {
        if (_siParamStringCompletionRegistered || !window.monaco) {
            return;
        }
        _siParamStringCompletionRegistered = true;

        var provider = {
            triggerCharacters: ["'", '"'],
            provideCompletionItems: function (model, position) {
                var ctx = _getSiCallContext(model, position);
                if (!ctx) {
                    return { suggestions: [] };
                }

                return fetchSiMethods(ctx.className).then(function (methods) {
                    var method = methods.find(function (m) {
                        return m.name === ctx.methodName;
                    });
                    if (!method || !method.params || !method.params.length) {
                        return { suggestions: [] };
                    }

                    var currentParam = method.params[ctx.paramIndex];
                    if (!currentParam) {
                        return { suggestions: [] };
                    }

                    if (_TABLE_PARAM_RE.test(currentParam)) {
                        return fetchTablesMatching(ctx.typed).then(
                            function (tables) {
                                return {
                                    incomplete: true,
                                    suggestions: tables.map(function (t) {
                                        return {
                                            label: t.name,
                                            kind: monaco.languages
                                                .CompletionItemKind.Value,
                                            detail:
                                                t.label !== t.name
                                                    ? t.label
                                                    : '',
                                            insertText: t.name,
                                            range: ctx.range,
                                        };
                                    }),
                                };
                            }
                        );
                    }

                    if (_FIELD_PARAM_RE.test(currentParam)) {
                        /* Find the sibling table param and the value the caller passed for it. */
                        var tableParamIdx = -1;
                        for (var i = 0; i < method.params.length; i++) {
                            if (_TABLE_PARAM_RE.test(method.params[i])) {
                                tableParamIdx = i;
                                break;
                            }
                        }
                        if (tableParamIdx === -1) {
                            return { suggestions: [] };
                        }
                        var tableValue = ctx.prevArgs[tableParamIdx];
                        if (!tableValue) {
                            return { suggestions: [] };
                        }

                        return fetchTableFields(tableValue).then(
                            function (fields) {
                                if (!fields) {
                                    return { suggestions: [] };
                                }
                                return {
                                    suggestions: fields.map(function (f) {
                                        return {
                                            label: f.name,
                                            kind: monaco.languages
                                                .CompletionItemKind.Field,
                                            detail:
                                                f.label !== f.name
                                                    ? f.label
                                                    : '',
                                            documentation:
                                                f.type +
                                                (f.reference
                                                    ? ' → ' + f.reference
                                                    : ''),
                                            insertText: f.name,
                                            range: ctx.range,
                                        };
                                    }),
                                };
                            }
                        );
                    }

                    return { suggestions: [] };
                });
            },
        };

        monaco.languages.registerCompletionItemProvider('javascript', provider);
        monaco.languages.registerCompletionItemProvider('typescript', provider);
    }

    /**
     * Initialises Monaco helpers for ServiceNow Script Includes.
     * Safe to call multiple times; only the first call performs setup.
     *
     * @param {Object} [config] - Optional runtime overrides.
     * @param {number} [config.pollIntervalMs] - Poll interval while waiting for Monaco.
     * @param {number} [config.maxWaitMs] - Max wait before aborting Monaco polling.
     * @param {string} [config.definitionUrl] - UI script URL that exposes MONACO_LANGUAGE_SERVER_DTS.
     * @param {string} [config.clientDefinitionUrl] - UI script URL that exposes MONACO_LANGUAGE_CLIENT_DTS.
     * @param {string} [config.codeActionsUrl] - UI script URL that exposes MONACO_CODE_ACTIONS.
     * @param {string} [config.htmlMonarchUrl] - UI script URL that exposes MONACO_LANGUAGE_HTML.
     * @param {boolean} [config.enableClientEnhancements] - Preload client DTS during init.
     * @param {boolean} [config.enableCodeActions] - Preload Monaco code actions during init.
     * @param {Function} [config.getRemBase] - Returns SCSS px->rem conversion base.
     * @param {string}  [config.language] - Editor language: 'javascript' (default), 'html', 'css', 'scss'.
     * @param {boolean} [config.isClient] - When language is 'javascript', load client-side DTS instead of server.
     * @param {string}  [config.appSysId] - Application scope sys_id passed to loadSnTypeDefinitions.
     * @param {string}  [config.fieldName] - Form field name the Monaco editor is bound to (informational).
     */
    function init(config) {
        config = config || {};

        if (typeof config.getRemBase === 'function') {
            _codeActionsGetRemBase = config.getRemBase;
        }

        var _lang = config.language || 'javascript';
        var _isClient = !!config.isClient;
        var _langKey = _lang + (_isClient ? ':client' : ':server');

        if (!_initialized) {
            _initialized = true;

            if (config.pollIntervalMs) {
                _pollIntervalMs = Number(config.pollIntervalMs) || 200;
            }
            if (config.maxWaitMs) {
                _maxWaitMs = Number(config.maxWaitMs) || 10000;
            }
            if (config.definitionUrl) {
                _definitionUrl = config.definitionUrl;
            }
            if (config.clientDefinitionUrl) {
                _clientDefinitionUrl = config.clientDefinitionUrl;
            }
            if (config.codeActionsUrl) {
                _codeActionsUrl = config.codeActionsUrl;
            }
            if (config.htmlMonarchUrl) {
                _htmlMonarchUrl = config.htmlMonarchUrl;
            }
            if (config.cssLanguageUrl) {
                _cssLanguageUrl = config.cssLanguageUrl;
            }

            if (!global.document) {
                _initialized = false;
                return;
            }

            _api.loadSnTypeDefinitions = loadSnTypeDefinitions;
            _api.loadServerMonarchDts = loadServerMonarchDts;
            _api.loadClientMonarchDts = loadClientMonarchDts;
            _api.loadHtmlMonarchDts = loadHtmlMonarchDts;
            _api.loadCodeActions = loadCodeActions;
            _api.scanAndFetchSIs = _scanAndFetchSIs;
            _api.getSiSysId = function (name) {
                return _siNameMap[name] || null;
            };
            _api.checkSiExists = _checkSiExists;
            _api.loadCssVariables = _loadCssVariables;
            _api.loadScssVariables = _loadScssVariables;
            _api.loadCssLanguageDts = loadCssLanguageDts;
            _api.loadCssEditorSupport = function () {
                loadCssLanguageDts();
                _loadCssVariables();
            };
            _api._waitForMonaco = waitForMonaco;
            _api.markAngularModel = function (modelId) {
                loadCodeActions({ modelId: modelId, isAngular: true });
            };
        } // end of if (!_initialized)

        // ---- Per-language init ----
        if (_initializedLangs[_langKey]) {
            return;
        }
        _initializedLangs[_langKey] = true;

        var _capturedLang = _lang;
        var _capturedIsClient = _isClient;
        var _capturedAppSysId = config.appSysId;

        _api._waitForMonaco(function () {
            var _isJs =
                _capturedLang !== 'html' &&
                _capturedLang !== 'css' &&
                _capturedLang !== 'scss';

            // One-time global setup — providers, compiler options.
            // Always runs from the first init() call's closure where these functions are accessible.
            // _globalSetupDone prevents re-execution on subsequent language inits.
            if (!_globalSetupDone) {
                _globalSetupDone = true;
                applyCompilerOptions();
                _installUnusedVarSeverityPatch();
                _registerCssVarCompletions();
                _registerScssVarCompletions();
                _registerScssVarHover();
                if (_isJs) {
                    _installQuickInfoHover();
                    registerDotCompletions();
                    registerHoverProvider();
                    registerSignatureHelp();
                    registerNewSiCompletions();
                    registerGrFieldStringCompletions();
                    registerGrFieldStringHover();
                    registerGrConstructorCompletions();
                    registerSiParamStringCompletions();
                    if (monaco.editor && monaco.editor.getModels) {
                        monaco.editor
                            .getModels()
                            .forEach(_prewarmFieldCompletions);
                        monaco.editor.getModels().forEach(function (m) {
                            _scanAndFetchSIs(m.getValue());
                        });
                    }
                }
            }

            // Language-specific DTS loading.
            if (_isJs) {
                if (_capturedIsClient) {
                    // Client mode: AngularJS / g_form / spUtil etc. on javascriptDefaults.
                    _api.loadClientMonarchDts();
                } else {
                    // Server mode: SN server APIs on the target language service.
                    // Skip loadSnTypeDefinitions when GlideEditorMonaco is present —
                    // ServiceNow's native editor already loads the SN completions DTS.
                    if (typeof global.GlideEditorMonaco === 'undefined') {
                        _api.loadSnTypeDefinitions(
                            _capturedAppSysId,
                            _capturedLang
                        );
                    }
                    _api.loadServerMonarchDts(_capturedLang);
                }
            }

            // Code actions
            if (_isJs || _capturedLang === 'css' || _capturedLang === 'scss') {
                _api.loadCodeActions({ getRemBase: _codeActionsGetRemBase });
            }

            // CSS language definition + vars
            if (_capturedLang === 'css' || _capturedLang === 'scss') {
                _api.loadCssLanguageDts();
                _api.loadCssVariables();
            }

            // SCSS vars: pre-warm fetch for SCSS/Less editors.
            if (_capturedLang === 'scss' || _capturedLang === 'less') {
                _api.loadScssVariables();
            }

            // HTML Monarch: AngularJS ng-* / sp-* tokenizer for HTML editors.
            if (_capturedLang === 'html') {
                _api.loadHtmlMonarchDts();
            }

            // ════ Success: Monaco Editor+ is ready ════
            var _langDisplay = _capturedLang.toUpperCase();
            if (_capturedLang === 'javascript') {
                _langDisplay = _capturedIsClient
                    ? 'JAVASCRIPT (Client)'
                    : 'JAVASCRIPT (Server)';
            }
            console.info(
                '%cMonaco Editor+%c ready ✓%c\\n' + 'Language: ' + _langDisplay,
                'background-color: #004a9f; color: #fff; font-weight: bold; padding: 5px 0 5px 5px;',
                'background-color: #004a9f; color: #86ffa6; font-weight: bold; padding: 5px 5px 5px 0;',
                'padding: 5px;'
            );
        }, _capturedLang);
    }

    global.SNMonacoPlus = _api;
})(typeof window !== 'undefined' ? window : globalThis);
`,
        ui_type: '0',
        use_scoped_format: 'false',
    },
})
