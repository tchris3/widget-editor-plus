var WidgetEditorAssistantAjax = Class.create();
WidgetEditorAssistantAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    WIDGET_SCAN_FIELDS: ['script', 'client_script', 'link', 'css', 'template', 'option_schema', 'demo_data'],

    // Dictionary internal_types that hold actual script code.
    SCRIPT_FIELD_TYPES: { script: true, script_server: true, script_plain: true },

    SI_SCAN_BUILTINS: {
        Array: true, Object: true, Date: true, RegExp: true, Error: true, TypeError: true,
        RangeError: true, Map: true, Set: true, WeakMap: true, WeakSet: true, Promise: true,
        XMLHttpRequest: true, FormData: true, Blob: true, File: true, URL: true,
        URLSearchParams: true, Function: true, Number: true, String: true, Boolean: true,
        GlideRecord: true, GlideRecordSecure: true, GlideAggregate: true, GlideDateTime: true,
        GlideDate: true, GlideDuration: true, GlideForm: true, GlideUser: true, GlideSession: true,
        GlideAjax: true, GlideModal: true, GlideDialogWindow: true, GlideList2: true,
    },

    ////////////////////////////////////////////////////////////
    // Related component suggestions
    ////////////////////////////////////////////////////////////

    /**
     * Suggests related components for an sp_widget primary: referenced script
     * includes, linked Angular templates/providers, embedded widgets, and
     * tables referenced via new GlideRecord/GlideRecordSecure/GlideAggregate(...).
     * Accepts `table` and `sys_id`.
     * @returns {{success: boolean, related: Array.<{table: string, sys_id: string,
     *   label: string, category: string, updatedOn: string}>}} Return value.
     */
    getSuggestedRelated: function () {
        // getParameter() returns a Java String, so coerce before strict-comparing.
        var table = String(this.getParameter('table') || '');
        var sysId = this.getParameter('sys_id');
        if (!table || !sysId) {
            return this._answer({ success: false, error: 'No table/sys_id provided', related: [] });
        }

        if (table === 'sys_db_object') {
            try {
                var tableGr = new GlideRecordSecure('sys_db_object');
                if (!tableGr.get(sysId)) {
                    return this._answer({ success: false, error: 'Table not found', related: [] });
                }
                var refTableNames = this._scanDictionaryReferencedTables(tableGr.getValue('name'));
                var refTables = this._findReferencedTables(refTableNames).filter(function (r) {
                    return r.sys_id !== sysId;
                });
                return this._answer({ success: true, related: refTables });
            } catch (e) {
                return this._answer({ success: false, error: String(e), related: [] });
            }
        }

        if (table === 'sp_page') {
            try {
                var pageGr = new GlideRecordSecure('sp_page');
                if (!pageGr.get(sysId)) {
                    return this._answer({ success: false, error: 'Page not found', related: [] });
                }
                return this._answer({ success: true, related: this._findPortalPageLayout(sysId) });
            } catch (e) {
                return this._answer({ success: false, error: String(e), related: [] });
            }
        }

        if (table === 'sc_cat_item_producer') {
            try {
                var producerGr = new GlideRecordSecure('sc_cat_item_producer');
                if (!producerGr.get(sysId)) {
                    return this._answer({ success: false, error: 'Record producer not found', related: [] });
                }
                return this._answer({ success: true, related: this._findCatalogProducerDependencies(sysId, producerGr.getValue('table_name')) });
            } catch (e) {
                return this._answer({ success: false, error: String(e), related: [] });
            }
        }

        if (table !== 'sp_widget') {
            // Generic fallback: any table with its own script-type field(s) gets scanned for
            // further Script Include and table references, and any table_name-type field(s)
            // suggest whatever table that field names — whatever the table happens to be.
            try {
                var scriptFields = this._findScriptFields(table);
                var tableNameFields = this._findFieldsOfType(table, 'table_name');
                if (!scriptFields.length && !tableNameFields.length) {
                    return this._answer({ success: true, related: [] });
                }
                var scriptGr = new GlideRecordSecure(table);
                if (!scriptGr.get(sysId)) {
                    return this._answer({ success: false, error: 'Record not found', related: [] });
                }

                var results = [];
                if (scriptFields.length) {
                    var scriptContent = scriptFields.map(function (f) {
                        return scriptGr.getValue(f) || '';
                    }).join('\n');
                    var scriptNames = this._scanReferencedNamesInText(scriptContent);
                    var scriptIncludeMatches = this._findReferencedScriptIncludes(scriptNames, scriptGr.getValue('sys_scope')).filter(function (r) {
                        return r.sys_id !== sysId;
                    });
                    var scriptTableNames = this._scanReferencedTableNamesInText(scriptContent);
                    results = results.concat(scriptIncludeMatches, this._findReferencedTables(scriptTableNames));
                }
                if (tableNameFields.length) {
                    var seenTableNames = {};
                    var namedTableNames = [];
                    tableNameFields.forEach(function (f) {
                        var val = scriptGr.getValue(f);
                        if (val && val !== table && !seenTableNames[val]) {
                            seenTableNames[val] = true;
                            namedTableNames.push(val);
                        }
                    });
                    results = results.concat(this._findReferencedTables(namedTableNames));
                }
                return this._answer({ success: true, related: this._dedupeRelated(results) });
            } catch (e) {
                return this._answer({ success: false, error: String(e), related: [] });
            }
        }

        // Never let an exception here kill the whole GlideAjax response.
        try {
            var gr = new GlideRecordSecure('sp_widget');
            if (!gr.get(sysId)) {
                return this._answer({ success: false, error: 'Widget not found', related: [] });
            }

            var scannedNames = this._scanReferencedNames(gr);
            var scriptIncludes = this._findReferencedScriptIncludes(scannedNames, gr.getValue('sys_scope'));
            var templates = this._findLinkedTemplates(sysId);
            var providers = this._findLinkedProviders(sysId);
            var embeddedIds = this._scanEmbeddedWidgetIds(gr);
            var embeddedWidgets = this._findEmbeddedWidgets(embeddedIds, sysId);
            var scannedTableNames = this._scanReferencedTableNames(gr);
            var referencedTables = this._findReferencedTables(scannedTableNames);
            var related = this._dedupeRelated([].concat(scriptIncludes, templates, providers, embeddedWidgets, referencedTables));
            return this._answer({ success: true, related: related });
        } catch (e) {
            return this._answer({ success: false, error: String(e), related: [] });
        }
    },

    /**
     * Finds table names referenced by a table's own reference-type dictionary fields.
     * @param {string} tableName - The table to scan.
     * @returns {Array.<string>} Candidate referenced table names (deduplicated).
     */
    _scanDictionaryReferencedTables: function (tableName) {
        var seen = {};
        var names = [];
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', tableName);
        gr.addQuery('internal_type', 'reference');
        gr.addNotNullQuery('reference');
        gr.query();
        while (gr.next()) {
            var refTable = gr.getValue('reference');
            if (refTable && refTable !== tableName && !seen[refTable]) {
                seen[refTable] = true;
                names.push(refTable);
            }
        }
        return names;
    },

    /**
     * Finds a table's own script-type fields (internal_type in SCRIPT_FIELD_TYPES),
     * so any table holding server-side code can be scanned without hardcoding its name.
     * @param {string} table - Table name.
     * @returns {Array.<string>} Field names.
     */
    _findScriptFields: function (table) {
        return this._findFieldsOfType(table, Object.keys(this.SCRIPT_FIELD_TYPES).join(','));
    },

    /**
     * Finds a table's own fields matching the given dictionary internal_type(s).
     * @param {string} table - Table name.
     * @param {string} internalTypes - Comma-separated internal_type value(s).
     * @returns {Array.<string>} Field names.
     */
    _findFieldsOfType: function (table, internalTypes) {
        var fields = [];
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', table);
        gr.addQuery('internal_type', 'IN', internalTypes);
        gr.query();
        while (gr.next()) {
            var field = gr.getValue('element');
            if (field) {
                fields.push(field);
            }
        }
        return fields;
    },

    /**
     * Walks a Portal Page's full layout hierarchy (containers, rows, columns, widget
     * instances) so a page can be exported alongside everything it's built from.
     * @param {string} pageSysId - The sp_page sys_id.
     * @returns {Array.<{table: string, sys_id: string, label: string, category: string, updatedOn: string}>} Layout records, in hierarchy order.
     */
    _findPortalPageLayout: function (pageSysId) {
        var results = [];

        var containerIds = [];
        var containerGr = new GlideRecordSecure('sp_container');
        containerGr.addQuery('sp_page', pageSysId);
        containerGr.orderBy('order');
        containerGr.query();
        while (containerGr.next()) {
            var containerLabel = containerGr.getValue('title') || containerGr.getValue('name') ||
                ('Container ' + (parseInt(containerGr.getValue('order'), 10) || 0));
            results.push({
                table: 'sp_container', sys_id: containerGr.getUniqueValue(), label: containerLabel,
                category: 'Container (on page)', updatedOn: containerGr.getDisplayValue('sys_updated_on'),
            });
            containerIds.push(containerGr.getUniqueValue());
        }
        if (!containerIds.length) {
            return results;
        }

        var rowIds = [];
        var rowGr = new GlideRecordSecure('sp_row');
        rowGr.addQuery('sp_container', 'IN', containerIds.join(','));
        rowGr.orderBy('order');
        rowGr.query();
        while (rowGr.next()) {
            results.push({
                table: 'sp_row', sys_id: rowGr.getUniqueValue(), label: 'Row ' + (parseInt(rowGr.getValue('order'), 10) || 0),
                category: 'Row (on page)', updatedOn: rowGr.getDisplayValue('sys_updated_on'),
            });
            rowIds.push(rowGr.getUniqueValue());
        }
        if (!rowIds.length) {
            return results;
        }

        var columnIds = [];
        var colGr = new GlideRecordSecure('sp_column');
        colGr.addQuery('sp_row', 'IN', rowIds.join(','));
        colGr.orderBy('order');
        colGr.query();
        while (colGr.next()) {
            var size = colGr.getValue('size');
            var columnLabel = 'Column ' + (parseInt(colGr.getValue('order'), 10) || 0) + (size ? ' (' + size + ')' : '');
            results.push({
                table: 'sp_column', sys_id: colGr.getUniqueValue(), label: columnLabel,
                category: 'Column (on page)', updatedOn: colGr.getDisplayValue('sys_updated_on'),
            });
            columnIds.push(colGr.getUniqueValue());
        }
        if (!columnIds.length) {
            return results;
        }

        var seenWidgetIds = {};
        var instGr = new GlideRecordSecure('sp_instance');
        instGr.addQuery('sp_column', 'IN', columnIds.join(','));
        instGr.orderBy('sp_column');
        instGr.query();
        while (instGr.next()) {
            results.push({
                table: 'sp_instance', sys_id: instGr.getUniqueValue(), label: instGr.getDisplayValue('sp_widget') || 'Widget Instance',
                category: 'Widget Instance (on page)', updatedOn: instGr.getDisplayValue('sys_updated_on'),
            });
            var widgetId = instGr.getValue('sp_widget');
            if (widgetId && !seenWidgetIds[widgetId]) {
                seenWidgetIds[widgetId] = true;
                results.push({
                    table: 'sp_widget', sys_id: widgetId, label: instGr.getDisplayValue('sp_widget') || widgetId,
                    category: 'Widget (used on page)', updatedOn: instGr.getDisplayValue('sp_widget.sys_updated_on'),
                });
            }
        }

        return results;
    },

    /**
     * Finds everything a Catalog Item Producer is built from: its variables, UI
     * policies (and their actions), catalog client scripts, and the target table
     * (table_name) the producer creates records in. catalog_ui_policy_action links
     * to its parent policy via the inherited sys_ui_policy_action.ui_policy field
     * (catalog_ui_policy extends sys_ui_policy, so sys_ids line up across the hierarchy).
     * @param {string} producerSysId - The sc_cat_item_producer sys_id.
     * @param {string} targetTableName - The producer's table_name field value.
     * @returns {Array.<{table: string, sys_id: string, label: string, category: string, updatedOn: string}>} Dependency records.
     */
    _findCatalogProducerDependencies: function (producerSysId, targetTableName) {
        var results = targetTableName ? this._findReferencedTables([targetTableName]) : [];

        var varGr = new GlideRecordSecure('item_option_new');
        varGr.addQuery('cat_item', producerSysId);
        varGr.orderBy('order');
        varGr.query();
        while (varGr.next()) {
            results.push({
                table: 'item_option_new', sys_id: varGr.getUniqueValue(), label: varGr.getDisplayValue() || varGr.getValue('name'),
                category: 'Variable (on producer)', updatedOn: varGr.getDisplayValue('sys_updated_on'),
            });
        }

        var policyIds = [];
        var policyGr = new GlideRecordSecure('catalog_ui_policy');
        policyGr.addQuery('catalog_item', producerSysId);
        policyGr.query();
        while (policyGr.next()) {
            results.push({
                table: 'catalog_ui_policy', sys_id: policyGr.getUniqueValue(), label: policyGr.getDisplayValue() || policyGr.getUniqueValue(),
                category: 'UI Policy (on producer)', updatedOn: policyGr.getDisplayValue('sys_updated_on'),
            });
            policyIds.push(policyGr.getUniqueValue());
        }
        if (policyIds.length) {
            var actionGr = new GlideRecordSecure('catalog_ui_policy_action');
            actionGr.addQuery('ui_policy', 'IN', policyIds.join(','));
            actionGr.query();
            while (actionGr.next()) {
                results.push({
                    table: 'catalog_ui_policy_action', sys_id: actionGr.getUniqueValue(),
                    label: actionGr.getValue('catalog_variable') || actionGr.getDisplayValue() || 'UI Policy Action',
                    category: 'UI Policy Action (on producer)', updatedOn: actionGr.getDisplayValue('sys_updated_on'),
                });
            }
        }

        var clientGr = new GlideRecordSecure('catalog_script_client');
        clientGr.addQuery('cat_item', producerSysId);
        clientGr.query();
        while (clientGr.next()) {
            results.push({
                table: 'catalog_script_client', sys_id: clientGr.getUniqueValue(), label: clientGr.getValue('name') || clientGr.getDisplayValue(),
                category: 'Catalog Client Script (on producer)', updatedOn: clientGr.getDisplayValue('sys_updated_on'),
            });
        }

        return results;
    },

    /**
     * Regex-scans a widget's script fields for `new SomeScriptInclude()` references.
     * @param {GlideRecordSecure} widgetGr - The queried sp_widget record.
     * @returns {Array.<string>} Candidate class names found (deduplicated, builtins excluded).
     */
    _scanReferencedNames: function (widgetGr) {
        var content = this.WIDGET_SCAN_FIELDS.map(function (f) {
            return widgetGr.getValue(f) || '';
        }).join('\n');
        return this._scanReferencedNamesInText(content);
    },

    /**
     * Regex-scans raw script text for `new SomeScriptInclude()` references.
     * @param {string} content - Script text to scan.
     * @returns {Array.<string>} Candidate class names found (deduplicated, builtins excluded).
     */
    _scanReferencedNamesInText: function (content) {
        var seen = {};
        var names = [];
        // Matches `new Foo(` or `new ns.Foo(`, capturing just the class name.
        var re = /\bnew\s+(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?([A-Z][a-zA-Z0-9_]*)\s*\(/g;
        var m;
        while ((m = re.exec(content || '')) !== null) {
            var name = m[1];
            if (!seen[name] && !this.SI_SCAN_BUILTINS[name]) {
                seen[name] = true;
                names.push(name);
            }
        }
        return names;
    },

    /**
     * Matches candidate class names against active sys_script_include records.
     * Same-named script includes can exist in multiple scopes (different code,
     * only one actually resolved by the widget's `new Name()` call) — picks the
     * one in the widget's own scope, else the most recently updated, per name.
     * @param {Array.<string>} names - Candidate class names from _scanReferencedNames.
     * @param {string} widgetScope - The widget's sys_scope sys_id, for scope preference.
     * @returns {Array.<{table: string, sys_id: string, label: string, category: string, updatedOn: string}>} Matches.
     */
    _findReferencedScriptIncludes: function (names, widgetScope) {
        if (!names || names.length === 0) {
            return [];
        }

        var siGr = new GlideRecordSecure('sys_script_include');
        siGr.addQuery('active', true);
        siGr.addQuery('name', 'IN', names.join(','));
        siGr.orderByDesc('sys_updated_on');
        siGr.query();

        var byName = {};
        while (siGr.next()) {
            var name = siGr.getValue('name');
            var inWidgetScope = siGr.getValue('sys_scope') === widgetScope;
            var existing = byName[name];
            if (!existing || (inWidgetScope && !existing.inWidgetScope)) {
                byName[name] = {
                    table: 'sys_script_include',
                    sys_id: siGr.getUniqueValue(),
                    label: name,
                    category: 'Script Include (referenced)',
                    updatedOn: siGr.getDisplayValue('sys_updated_on'),
                    inWidgetScope: inWidgetScope,
                };
            }
        }

        var results = [];
        Object.keys(byName).forEach(function (name) {
            var c = byName[name];
            results.push({ table: c.table, sys_id: c.sys_id, label: c.label, category: c.category, updatedOn: c.updatedOn });
        });
        return results;
    },

    /**
     * Regex-scans a widget's fields for `$sp.getWidget('widget_id')` references.
     * @param {GlideRecordSecure} widgetGr - The queried sp_widget record.
     * @returns {Array.<string>} Candidate embedded widget ids (deduplicated).
     */
    _scanEmbeddedWidgetIds: function (widgetGr) {
        var content = this.WIDGET_SCAN_FIELDS.map(function (f) {
            return widgetGr.getValue(f) || '';
        }).join('\n');

        var seen = {};
        var ids = [];
        var re = /\$sp\.getWidget\(\s*['"]([^'"]+)['"]\s*\)/g;
        var m;
        while ((m = re.exec(content)) !== null) {
            var id = m[1];
            if (!seen[id]) {
                seen[id] = true;
                ids.push(id);
            }
        }
        return ids;
    },

    /**
     * Matches candidate widget ids against sp_widget records, excluding self-reference.
     * @param {Array.<string>} ids - Candidate widget ids from _scanEmbeddedWidgetIds.
     * @param {string} excludeSysId - The primary widget's own sys_id, never suggested for itself.
     * @returns {Array.<{table: string, sys_id: string, label: string, category: string, updatedOn: string}>} Matches.
     */
    _findEmbeddedWidgets: function (ids, excludeSysId) {
        if (!ids || ids.length === 0) {
            return [];
        }

        var results = [];
        var gr = new GlideRecordSecure('sp_widget');
        gr.addQuery('id', 'IN', ids.join(','));
        if (excludeSysId) {
            gr.addQuery('sys_id', '!=', excludeSysId);
        }
        gr.query();
        while (gr.next()) {
            results.push({
                table: 'sp_widget',
                sys_id: gr.getUniqueValue(),
                label: gr.getValue('name') || gr.getValue('id'),
                category: 'Embedded Widget',
                updatedOn: gr.getDisplayValue('sys_updated_on'),
            });
        }
        return results;
    },

    /**
     * Regex-scans a widget's fields for new GlideRecord/GlideRecordSecure/GlideAggregate('table_name') references.
     * @param {GlideRecordSecure} widgetGr - The queried sp_widget record.
     * @returns {Array.<string>} Candidate table names (deduplicated).
     */
    _scanReferencedTableNames: function (widgetGr) {
        var content = this.WIDGET_SCAN_FIELDS.map(function (f) {
            return widgetGr.getValue(f) || '';
        }).join('\n');
        return this._scanReferencedTableNamesInText(content);
    },

    /**
     * Regex-scans raw script text for new GlideRecord/GlideRecordSecure/GlideAggregate('table_name') references.
     * @param {string} content - Script text to scan.
     * @returns {Array.<string>} Candidate table names (deduplicated).
     */
    _scanReferencedTableNamesInText: function (content) {
        var seen = {};
        var names = [];
        var re = /\bnew\s+(?:GlideRecord|GlideRecordSecure|GlideAggregate)\s*\(\s*['"]([a-zA-Z0-9_]+)['"]/g;
        var m;
        while ((m = re.exec(content || '')) !== null) {
            var name = m[1];
            if (!seen[name]) {
                seen[name] = true;
                names.push(name);
            }
        }
        return names;
    },

    /**
     * Matches candidate table names against sys_db_object records.
     * @param {Array.<string>} names - Candidate table names from _scanReferencedTableNames.
     * @returns {Array.<{table: string, sys_id: string, label: string, category: string, updatedOn: string}>} Matches.
     */
    _findReferencedTables: function (names) {
        if (!names || names.length === 0) {
            return [];
        }

        var results = [];
        var gr = new GlideRecordSecure('sys_db_object');
        gr.addQuery('name', 'IN', names.join(','));
        gr.query();
        while (gr.next()) {
            results.push({
                table: 'sys_db_object',
                sys_id: gr.getUniqueValue(),
                label: gr.getValue('label') || gr.getValue('name'),
                category: 'Table (referenced)',
                updatedOn: gr.getDisplayValue('sys_updated_on'),
            });
        }
        return results;
    },

    /**
     * Removes duplicate table+sys_id entries, keeping the first occurrence.
     * @param {Array.<{table: string, sys_id: string}>} related
     * @returns {Array} Deduplicated list.
     */
    _dedupeRelated: function (related) {
        var seen = {};
        return related.filter(function (r) {
            var key = r.table + ':' + r.sys_id;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });
    },

    /**
     * Finds sp_ng_template records linked to a widget.
     * @param {string} widgetSysId - sp_widget sys_id.
     * @returns {Array.<{table: string, sys_id: string, label: string, category: string, updatedOn: string}>} Matches.
     */
    _findLinkedTemplates: function (widgetSysId) {
        var results = [];
        var gr = new GlideRecordSecure('sp_ng_template');
        gr.addQuery('sp_widget', widgetSysId);
        gr.orderBy('id');
        gr.query();
        while (gr.next()) {
            results.push({
                table: 'sp_ng_template',
                sys_id: gr.getUniqueValue(),
                label: gr.getValue('id') || gr.getDisplayValue(),
                category: 'Angular Template',
                updatedOn: gr.getDisplayValue('sys_updated_on'),
            });
        }
        return results;
    },

    /**
     * Finds sp_angular_provider records linked to a widget via m2m_sp_ng_pro_sp_widget.
     * @param {string} widgetSysId - sp_widget sys_id.
     * @returns {Array.<{table: string, sys_id: string, label: string, category: string, updatedOn: string}>} Matches.
     */
    _findLinkedProviders: function (widgetSysId) {
        var providerIds = [];
        var m2m = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        m2m.addQuery('sp_widget', widgetSysId);
        m2m.query();
        while (m2m.next()) {
            var pid = m2m.getValue('sp_angular_provider');
            if (pid && providerIds.indexOf(pid) === -1) {
                providerIds.push(pid);
            }
        }
        if (providerIds.length === 0) {
            return [];
        }

        var results = [];
        var gr = new GlideRecordSecure('sp_angular_provider');
        gr.addQuery('sys_id', 'IN', providerIds.join(','));
        gr.orderBy('name');
        gr.query();
        while (gr.next()) {
            results.push({
                table: 'sp_angular_provider',
                sys_id: gr.getUniqueValue(),
                label: gr.getValue('name'),
                category: 'Angular Provider',
                updatedOn: gr.getDisplayValue('sys_updated_on'),
            });
        }
        return results;
    },

    ////////////////////////////////////////////////////////////
    // Table / record picker
    ////////////////////////////////////////////////////////////

    /**
     * Searches sys_db_object by label or name for the table picker. Paginated with
     * RECORD_LIMIT-sized pages for lazy-loading, same pattern as searchRecords.
     * Accepts `query`, `offset` (default 0).
     * @returns {{success: boolean, tables: Array.<{name: string, label: string}>,
     *   total: number, offset: number, hasMore: boolean}} Return value.
     */
    searchTables: function () {
        var query = this.getParameter('query') || '';
        var offset = parseInt(this.getParameter('offset'), 10) || 0;

        var countGa = new GlideAggregate('sys_db_object');
        if (query) {
            countGa.addQuery('label', 'CONTAINS', query).addOrCondition('name', 'CONTAINS', query);
        }
        countGa.addAggregate('COUNT');
        countGa.query();
        var total = countGa.next() ? parseInt(countGa.getAggregate('COUNT'), 10) || 0 : 0;

        var gr = new GlideRecordSecure('sys_db_object');
        if (query) {
            gr.addQuery('label', 'CONTAINS', query).addOrCondition('name', 'CONTAINS', query);
        }
        gr.orderBy('label');
        gr.chooseWindow(offset, offset + this.RECORD_LIMIT);
        gr.query();

        var tables = [];
        while (gr.next()) {
            tables.push({
                name: gr.getValue('name'),
                label: gr.getValue('label') || gr.getValue('name'),
            });
        }
        return this._answer({
            success: true,
            tables: tables,
            total: total,
            offset: offset,
            hasMore: (offset + tables.length) < total,
        });
    },

    /* Shares its page size with the main Widget Editor+ picker on purpose. */
    RECORD_LIMIT: parseInt(gs.getProperty('monaco.plus.record_limit', '500'), 10) || 500,

    /**
     * Searches a table for records matching a text query against its default list view
     * columns and sys_id. Uses RECORD_LIMIT for pagination and lazy-loading.
     * Accepts `table`, `query`, `offset` (default 0), `limit` (default RECORD_LIMIT).
     * @returns {{success: boolean, columns: Array.<{field: string, label: string}>,
     *   records: Array.<{sys_id: string, label: string, updatedOn: string, values: Object}>,
     *   total: number, offset: number, hasMore: boolean}} Return value.
     */
    searchRecords: function () {
        var table = this.getParameter('table');
        var query = this.getParameter('query') || '';
        var offset = parseInt(this.getParameter('offset'), 10) || 0;
        var limit = parseInt(this.getParameter('limit'), 10) || this.RECORD_LIMIT;
        if (!table) {
            return this._answer({ success: false, error: 'No table provided', columns: [], records: [], total: 0, hasMore: false });
        }

        var cols = this._getTableColumns(table);
        var displayField = this._getDisplayField(table);

        // Count total matching records
        var countGa = new GlideAggregate(table);
        if (query) {
            var cq = countGa.addQuery('sys_id', 'CONTAINS', query);
            if (displayField) {
                cq.addOrCondition(displayField, 'CONTAINS', query);
            }
            for (var i = 0; i < cols.length; i++) {
                cq.addOrCondition(cols[i].field, 'CONTAINS', query);
            }
        }
        countGa.addAggregate('COUNT');
        countGa.query();
        var total = countGa.next() ? parseInt(countGa.getAggregate('COUNT'), 10) || 0 : 0;

        // Query records
        var gr = new GlideRecordSecure(table);
        if (query) {
            var q = gr.addQuery('sys_id', 'CONTAINS', query);
            if (displayField) {
                q.addOrCondition(displayField, 'CONTAINS', query);
            }
            for (var j = 0; j < cols.length; j++) {
                q.addOrCondition(cols[j].field, 'CONTAINS', query);
            }
        }
        var sortField = (cols.length && cols[0].field) || displayField || 'sys_id';
        gr.orderBy(sortField);
        gr.chooseWindow(offset, offset + limit);
        gr.query();

        var records = [];
        while (gr.next()) {
            var values = {};
            for (var c = 0; c < cols.length; c++) {
                var fName = cols[c].field;
                values[fName] = gr.getDisplayValue(fName) || gr.getValue(fName) || '';
            }
            records.push({
                sys_id: gr.getUniqueValue(),
                label: gr.getDisplayValue() || gr.getUniqueValue(),
                updatedOn: gr.getDisplayValue('sys_updated_on'),
                values: values,
            });
        }

        return this._answer({
            success: true,
            columns: cols,
            records: records,
            total: total,
            offset: offset,
            hasMore: (offset + records.length) < total,
            pageSize: limit,
        });
    },

    /** Column internal types allowed in the record picker's list-view columns. */
    PICKER_COLUMN_TYPES: { string: true, reference: true, table_name: true },

    /** Explicit picker field order for tables whose default list view doesn't lead with the most useful fields. */
    PICKER_FIELD_OVERRIDES: {
        sys_security_acl: ['name', 'type', 'operation'],
    },

    /**
     * Resolves picker column definitions from a table's default list view.
     * @param {string} table - Table name.
     * @returns {Array.<{field: string, label: string}>}
     */
    _getTableColumns: function (table) {
        var override = this.PICKER_FIELD_OVERRIDES[table];
        if (override) {
            var grOverride = new GlideRecordSecure(table);
            grOverride.initialize();
            var overrideCols = [];
            for (var o = 0; o < override.length; o++) {
                var ofName = override[o];
                if (!grOverride.isValidField(ofName)) {
                    continue;
                }
                var oLabel = ofName;
                try {
                    oLabel = grOverride.getElement(ofName).getLabel() || ofName;
                } catch (oe) {}
                overrideCols.push({ field: ofName, label: oLabel });
            }
            if (overrideCols.length) {
                return overrideCols;
            }
        }

        var listSysId = this._findListSysId(table);
        var fieldNames = [];
        if (listSysId) {
            var elemGr = new GlideRecordSecure('sys_ui_list_element');
            elemGr.addQuery('list_id', listSysId);
            elemGr.orderBy('position');
            elemGr.setLimit(8);
            elemGr.query();
            while (elemGr.next()) {
                var fn = elemGr.getValue('element');
                if (fn && fn.indexOf('sys_') !== 0) {
                    fieldNames.push(fn);
                }
            }
        }

        var grProbe = new GlideRecordSecure(table);
        grProbe.initialize();
        var cols = [];
        for (var i = 0; i < fieldNames.length; i++) {
            var elName = fieldNames[i];
            if (!grProbe.isValidField(elName)) {
                continue;
            }
            var glideEl;
            try {
                glideEl = grProbe.getElement(elName);
            } catch (e) {
                continue;
            }
            var internalType = '';
            try {
                internalType = String(glideEl.getED().getInternalType());
            } catch (e2) {}
            if (!this.PICKER_COLUMN_TYPES[internalType]) {
                continue;
            }
            cols.push({
                field: elName,
                label: glideEl.getLabel() || elName,
            });
        }

        if (cols.length === 0) {
            var displayField = this._getDisplayField(table) || 'name';
            if (displayField.indexOf('sys_') !== 0) {
                var dLabel = displayField;
                if (grProbe.isValidField(displayField)) {
                    try {
                        dLabel = grProbe.getElement(displayField).getLabel() || displayField;
                    } catch (e) {}
                }
                cols.push({ field: displayField, label: dLabel });
            }
        }
        return cols;
    },

    /**
     * Finds the sys_id of the default sys_ui_list for a table.
     * @param {string} table - Table name.
     * @returns {string|null}
     */
    _findListSysId: function (table) {
        var gr = new GlideRecordSecure('sys_ui_list');
        gr.addQuery('name', table);
        gr.addQuery('view', '');
        gr.addNullQuery('sys_user');
        gr.setLimit(1);
        gr.query();
        if (gr.next()) {
            return gr.getUniqueValue();
        }
        var gr2 = new GlideRecordSecure('sys_ui_list');
        gr2.addQuery('name', table);
        gr2.addNullQuery('sys_user');
        gr2.setLimit(1);
        gr2.query();
        if (gr2.next()) {
            return gr2.getUniqueValue();
        }
        return null;
    },

    /**
     * Resolves the display label for a single record, used to re-validate/re-label
     * selections restored from localStorage.
     * Accepts `table`, `sys_id`.
     * @returns {{success: boolean, label: string, updatedOn: string}} Return value.
     */
    getRecordLabel: function () {
        var table = this.getParameter('table');
        var sysId = this.getParameter('sys_id');
        if (!table || !sysId) {
            return this._answer({ success: false, label: '', updatedOn: '' });
        }
        var gr = new GlideRecordSecure(table);
        if (!gr.get(sysId)) {
            return this._answer({ success: false, label: '', updatedOn: '' });
        }
        return this._answer({ success: true, label: gr.getDisplayValue() || sysId, updatedOn: gr.getDisplayValue('sys_updated_on') });
    },

    /**
     * Looks up the field marked as the display field for a table's dictionary entries.
     * @param {string} table - Table name.
     * @returns {string} Display field element name, or '' if none is configured.
     */
    _getDisplayField: function (table) {
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', table);
        gr.addQuery('display', true);
        gr.setLimit(1);
        gr.query();
        if (gr.next()) {
            return gr.getValue('element') || '';
        }
        return '';
    },

    ////////////////////////////////////////////////////////////
    // Favourite tables (User Preferences)
    ////////////////////////////////////////////////////////////

    FAVOURITE_TABLES_PREF_NAME: 'widget_editor_assistant.favourite_tables',

    /**
     * Returns the current user's favourited tables for the picker's Favourites
     * section, stored as a JSON array of {name, label} in a sys_user_preference.
     * @returns {{success: boolean, favourites: Array.<{name: string, label: string}>}} Return value.
     */
    getFavouriteTables: function () {
        var gr = new GlideRecordSecure('sys_user_preference');
        gr.addQuery('user', gs.getUserID());
        gr.addQuery('name', this.FAVOURITE_TABLES_PREF_NAME);
        gr.setLimit(1);
        gr.query();
        var favourites = [];
        if (gr.next()) {
            try {
                favourites = JSON.parse(gr.getValue('value') || '[]');
            } catch (e) {}
        }
        return this._answer({ success: true, favourites: favourites });
    },

    /**
     * Upserts the current user's favourited tables.
     * Accepts `favourites` (JSON-encoded array of {name, label}).
     * @returns {{success: boolean}} Return value.
     */
    saveFavouriteTables: function () {
        var favourites = this.getParameter('favourites') || '[]';
        var gr = new GlideRecordSecure('sys_user_preference');
        gr.addQuery('user', gs.getUserID());
        gr.addQuery('name', this.FAVOURITE_TABLES_PREF_NAME);
        gr.query();

        if (gr.next()) {
            gr.setValue('value', favourites);
            gr.update();
        } else {
            gr.initialize();
            gr.setValue('user', gs.getUserID());
            gr.setValue('name', this.FAVOURITE_TABLES_PREF_NAME);
            gr.setValue('value', favourites);
            gr.setValue('type', 'string');
            gr.insert();
        }
        return this._answer({ success: true });
    },

    ////////////////////////////////////////////////////////////
    // Token config & ranges
    ////////////////////////////////////////////////////////////

    // Small <15k tokens, moderate 15k-150k, large >150k.
    TOKEN_CONFIG: {
        // Rough chars-per-token ratio for estimating tokens from the actual exported XML size.
        charsPerToken: 4,
        ranges: [
            { max: 15000, level: 'green', label: 'Small' },
            { max: 150000, level: 'orange', label: 'Moderate' },
            { max: null, level: 'red', label: 'Large' },
        ],
    },

    /**
     * Returns token estimation configuration and color thresholds.
     * @returns {{success: boolean, charsPerToken: number, ranges: Array.<{max: ?number, level: string, label: string}>}} Return value.
     */
    getTokenConfig: function () {
        return this._answer({
            success: true,
            charsPerToken: this.TOKEN_CONFIG.charsPerToken,
            ranges: this.TOKEN_CONFIG.ranges,
        });
    },

    _answer: function (obj) {
        return this.setAnswer(JSON.stringify(obj));
    },

    type: 'WidgetEditorAssistantAjax',
});
