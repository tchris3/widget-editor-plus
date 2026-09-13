var WidgetEditorCodeSearchAjax = Class.create();
WidgetEditorCodeSearchAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    MAX_RESULTS_PER_TABLE: 500,
    MAX_SNIPPETS_PER_FIELD: 5,
    MAX_INLINE_SNIPPET_GAP: 3,

    _getParam: function (name) {
        var val = this.getParameter(name);
        if (val === null || val === undefined) {
            val = this.getParameter('sysparm_' + name);
        }
        return val != null ? String(val) : '';
    },

    _matchesSecondaryFilters: function (record, fields, filters, caseSensitive) {
        if (!filters.length) return true;

        function evalFilter(filter) {
            var term = caseSensitive ? filter.term : filter.term.toLowerCase();
            var found = fields.some(function (field) {
                var value = String(record.getValue(field) || '');
                return (caseSensitive ? value : value.toLowerCase()).indexOf(term) !== -1;
            });
            return filter.operator === 'contains' ? found : !found;
        }

        // AND/OR conditions are evaluated in order, left to right (no precedence grouping).
        var result = evalFilter(filters[0]);
        for (var i = 1; i < filters.length; i++) {
            result = filters[i].joiner === 'or' ? (result || evalFilter(filters[i])) : (result && evalFilter(filters[i]));
        }
        return result;
    },

    getGroups: function () {
        var groups = [];
        var gr = new GlideRecordSecure('sn_codesearch_search_group');
        gr.orderBy('name');
        gr.query();
        while (gr.next()) {
            var gId = gr.getUniqueValue();
            var tableCount = 0;
            try {
                var countGr = new GlideAggregate('sn_codesearch_table');
                countGr.addQuery('search_group', gId);
                countGr.addAggregate('COUNT');
                countGr.query();
                if (countGr.next()) {
                    tableCount = parseInt(countGr.getAggregate('COUNT'), 10) || 0;
                }
            } catch (e) {}

            groups.push({
                sysId: gId,
                name: gr.getDisplayValue('name') || gr.getValue('name'),
                description: gr.getValue('description') || '',
                extendedMatching: gr.getValue('extended_matching') === '1',
                tableCount: tableCount
            });
        }

        // Prioritize groups with tables configured
        groups.sort(function (a, b) {
            if (b.tableCount !== a.tableCount) return b.tableCount - a.tableCount;
            return a.name.localeCompare(b.name);
        });

        return this._answer({ success: true, groups: groups });
    },

    getGroupTables: function () {
        var groupId = this._getParam('group_id');
        if (!this._isSysId(groupId)) return this._answer({ success: false, error: 'Invalid search group.' });

        var rows = [];
        var cfg = new GlideRecordSecure('sn_codesearch_table');
        cfg.addQuery('search_group', groupId);
        cfg.orderBy('table');
        cfg.query();
        while (cfg.next()) {
            var table = String(cfg.getValue('table') || '');
            if (!this._validTable(table)) continue;
            rows.push({
                sysId: cfg.getUniqueValue(),
                table: table,
                label: this._tableLabel(table),
                searchFields: this._validFields(table, cfg.getValue('search_fields')).join(','),
                additionalFilter: cfg.getValue('additional_filter') || '',
                canWrite: cfg.canWrite()
            });
        }
        return this._answer({ success: true, tables: rows });
    },

    search: function () {
        var groupId = this._getParam('group_id');
        var term = String(this._getParam('query') || this._getParam('term') || '').trim();
        var limit = parseInt(this._getParam('limit'), 10) || this.MAX_RESULTS_PER_TABLE;
        limit = Math.max(1, Math.min(limit, this.MAX_RESULTS_PER_TABLE));
        if (!this._isSysId(groupId)) return this._answer({ success: false, error: 'Invalid search group.' });
        if (!term) return this._answer({ success: false, error: 'Enter code to search for.' });
        var caseSensitive = this._getParam('case_sensitive') === 'true' || this._getParam('case_sensitive') === '1';
        var activeOnly = this._getParam('active_only') === 'true' || this._getParam('active_only') === '1';
        var secondaryFilters;
        try {
            secondaryFilters = JSON.parse(this._getParam('secondary_filters') || '[]');
            if (!Array.isArray(secondaryFilters) || secondaryFilters.length > 20) throw new Error('Invalid filters');
            secondaryFilters.forEach(function (item, idx) {
                if (!item || (item.operator !== 'contains' && item.operator !== 'not_contains') ||
                    typeof item.term !== 'string' || !item.term.trim() || item.term.length > 1000) {
                    throw new Error('Invalid filter');
                }
                if (idx > 0 && item.joiner !== 'and' && item.joiner !== 'or') {
                    throw new Error('Invalid filter joiner');
                }
            });
        } catch (invalidFilters) {
            return this._answer({ success: false, error: 'Provide up to 20 secondary filters with an operator and a non-empty term (maximum 1,000 characters).' });
        }

        var tableConfigId = String(this._getParam('table_config_id') || this._getParam('table') || '').trim();
        var overrides = {};
        try { overrides = JSON.parse(this._getParam('overrides') || '{}'); } catch (ignore) {}
        var results = [], searched = 0, skipped = [];
        var cfg = new GlideRecordSecure('sn_codesearch_table');
        cfg.addQuery('search_group', groupId);
        if (tableConfigId) {
            if (this._isSysId(tableConfigId)) {
                cfg.addQuery('sys_id', tableConfigId);
            } else {
                cfg.addQuery('table', tableConfigId);
            }
        }
        cfg.orderBy('table');
        cfg.query();
        while (cfg.next()) {
            var configId = cfg.getUniqueValue();
            var override = overrides[configId] || {};
            if (override.enabled === false) continue;
            var table = String(cfg.getValue('table') || '');
            if (!this._validTable(table)) { skipped.push(table); continue; }
            var fields = this._validFields(table, override.searchFields || cfg.getValue('search_fields'));
            if (!fields.length) { skipped.push(table); continue; }
            var filter = typeof override.additionalFilter === 'string' ? override.additionalFilter : String(cfg.getValue('additional_filter') || '');
            var validation = this._validateFilter(table, filter);
            if (!validation.valid) { skipped.push(table + ': ' + validation.error); continue; }

            var displayCfg = this._getTableDisplayConfig(table);
            var record = new GlideRecordSecure(table);
            if (filter) record.addEncodedQuery(filter);

            // Active only filter
            var tableHasActive = record.isValidField('active');
            var tableHasUActive = record.isValidField('u_active');
            if (activeOnly) {
                if (tableHasActive && tableHasUActive) {
                    var actQ = record.addQuery('active', true);
                    actQ.addOrCondition('u_active', true);
                } else if (tableHasActive) {
                    record.addQuery('active', true);
                } else if (tableHasUActive) {
                    record.addQuery('u_active', true);
                } else {
                    // Skip tables without active or u_active fields when activeOnly is selected
                    continue;
                }
            }

            searched++;
            var qc = record.addQuery(fields[0], 'CONTAINS', term);
            for (var i = 1; i < fields.length; i++) qc.addOrCondition(fields[i], 'CONTAINS', term);
            // Secondary filters can be combined with AND/OR, so they're checked in code
            // (in evaluation order) for consistent empty-field, case, and joiner semantics.
            // Apply the result limit after secondary and case-sensitive matching.
            if (!secondaryFilters.length && !caseSensitive) record.setLimit(limit + 1);
            record.query();
            var count = 0;
            while (record.next() && count < limit) {
                if (!this._matchesSecondaryFilters(record, fields, secondaryFilters, caseSensitive)) continue;
                var matches = [];
                var termLower = term.toLowerCase();
                for (var f = 0; f < fields.length; f++) {
                    var fieldName = fields[f];
                    var value = String(record.getValue(fieldName) || '');
                    if (!value) continue;
                    var haystack = caseSensitive ? value : value.toLowerCase();
                    var needle = caseSensitive ? term : termLower;
                    var searchPos = 0;
                    var snippetWindowsInField = 0;
                    // Every occurrence in a field is merged into one match, its snippet windows
                    // joined by a "…" separator line only when the unmatched gap is wider than
                    // the combined context around the two matches. Overlapping windows extend the
                    // current excerpt; this prevents small holes such as omitting only one line.
                    var lastShownEndLine = 0;
                    var fieldMatch = null;

                    while (snippetWindowsInField < this.MAX_SNIPPETS_PER_FIELD) {
                        var at = haystack.indexOf(needle, searchPos);
                        if (at === -1) break;
                        searchPos = at + term.length;
                        var snippetInfo = this._extractSnippetWithLines(value, at, term.length);
                        var snippetEndLine = snippetInfo.startLine + snippetInfo.lines.length - 1;
                        if (snippetEndLine <= lastShownEndLine) continue;

                        if (!fieldMatch) {
                            var fLabel = fieldName;
                            try { fLabel = record.getElement(fieldName).getLabel() || fieldName; } catch (efl) {}
                            fieldMatch = {
                                field: fieldName,
                                fieldLabel: fLabel,
                                line: snippetInfo.matchLine,
                                totalLines: snippetInfo.totalLines,
                                singleLine: snippetInfo.singleLine,
                                lines: snippetInfo.lines.slice(),
                                snippet: snippetInfo.text
                            };
                            snippetWindowsInField++;
                        } else {
                            var gapLineCount = snippetInfo.startLine - lastShownEndLine - 1;
                            if (gapLineCount > 0) {
                                if (gapLineCount <= this.MAX_INLINE_SNIPPET_GAP) {
                                    for (var gapLine = lastShownEndLine + 1; gapLine < snippetInfo.startLine; gapLine++) {
                                        fieldMatch.lines.push({
                                            num: gapLine,
                                            text: snippetInfo.allLines[gapLine - 1],
                                            isMatch: false,
                                            inBlockComment: snippetInfo.blockCommentStates[gapLine - 1]
                                        });
                                    }
                                } else {
                                    fieldMatch.lines.push({ separator: true });
                                    fieldMatch.snippet += '\n…\n';
                                    snippetWindowsInField++;
                                }
                            }
                            snippetInfo.lines.forEach(function (l) {
                                if (l.num > lastShownEndLine) fieldMatch.lines.push(l);
                            });
                        }
                        lastShownEndLine = snippetEndLine;
                    }

                    if (fieldMatch) {
                        var shownLineCount = fieldMatch.lines.filter(function (l) { return !l.separator; }).length;
                        fieldMatch.allLinesShown = shownLineCount >= fieldMatch.totalLines;
                        fieldMatch.snippet = fieldMatch.lines.map(function (l) {
                            return l.separator ? '…' : l.text;
                        }).join('\n');
                        matches.push(fieldMatch);
                    }
                }

                if (matches.length > 0) {
                    var recSysId = record.getUniqueValue();
                    var isWidget = table === 'sp_widget';

                    // Determine active status (active or u_active)
                    var hasActiveField = false;
                    var isActive = true;
                    if (record.isValidField('active')) {
                        hasActiveField = true;
                        isActive = record.getValue('active') === '1' || record.getValue('active') === 'true';
                    } else if (record.isValidField('u_active')) {
                        hasActiveField = true;
                        isActive = record.getValue('u_active') === '1' || record.getValue('u_active') === 'true';
                    }

                    if (activeOnly && (!hasActiveField || !isActive)) {
                        continue;
                    }
                    count++;

                    // Primary value
                    var primaryVal = '';
                    if (displayCfg.primaryField && record.isValidField(displayCfg.primaryField)) {
                        primaryVal = record.getDisplayValue(displayCfg.primaryField) || record.getValue(displayCfg.primaryField);
                    }
                    if (!primaryVal) {
                        primaryVal = record.getDisplayValue() || recSysId;
                    }

                    // Secondary values
                    var secondaryVals = [];
                    for (var s = 0; s < displayCfg.secondaryFields.length; s++) {
                        var sField = displayCfg.secondaryFields[s];
                        if (!record.isValidField(sField)) continue;
                        var sVal = record.getDisplayValue(sField) || record.getValue(sField);
                        if (sVal !== null && sVal !== undefined && sVal !== '') {
                            var sLabel = sField;
                            try {
                                sLabel = record.getElement(sField).getLabel() || sField;
                            } catch (eLbl) {}
                            secondaryVals.push({
                                field: sField,
                                label: sLabel,
                                value: sVal
                            });
                        }
                    }

                    results.push({
                        table: table,
                        tableLabel: this._tableLabel(table),
                        sysId: recSysId,
                        displayValue: primaryVal,
                        secondaryValues: secondaryVals,
                        hasActive: hasActiveField,
                        isActive: hasActiveField ? isActive : null,
                        updatedOn: record.isValidField('sys_updated_on') ? record.getDisplayValue('sys_updated_on') : '',
                        matches: matches,
                        isWidget: isWidget,
                        widgetEditorUrl: isWidget ? '/widget_editor.do?widget_id=' + recSysId : null,
                        url: '/nav_to.do?uri=' + encodeURIComponent(table + '.do?sys_id=' + recSysId)
                    });
                }
            }
        }
        results.sort(function (a, b) {
            var valA = String(a.displayValue || '').toLowerCase();
            var valB = String(b.displayValue || '').toLowerCase();
            return valA.localeCompare(valB);
        });
        return this._answer({ success: true, results: results, searchedTables: searched, skipped: skipped });
    },

    validateFilter: function () {
        var configId = this._getParam('config_id');
        var cfg = this._getConfig(configId);
        if (!cfg) return this._answer({ success: false, error: 'Configuration not found.' });
        var table = String(cfg.getValue('table'));
        var filter = this._getParam('filter');
        var result = this._validateFilter(table, filter);
        if (result.valid) {
            var matchCount = this._countFilterMatches(table, filter);
            result.success = true;
            result.matchCount = matchCount;
            result.listUrl = matchCount >= 0 ? ('/' + table + '_list.do' + (filter ? ('?sysparm_query=' + encodeURIComponent(filter)) : '')) : null;
            result.message = 'Filter is valid' + (matchCount >= 0 ? ' (' + matchCount + ' records match)' : '.');
        } else {
            result.success = false;
        }
        return this._answer(result);
    },

    getTableFields: function () {
        var table = this._getParam('table');
        if (!this._validTable(table)) return this._answer({ success: false, error: 'Invalid table.' });

        var hierArr = [];
        try {
            if (typeof TableUtils !== 'undefined') {
                var hierList = new TableUtils(table).getHierarchy();
                for (var h = 0; h < hierList.size(); h++) hierArr.push(String(hierList.get(h)));
            } else if (typeof GlideTableHierarchy !== 'undefined') {
                var hierList2 = new GlideTableHierarchy(table).getHierarchy();
                for (var h2 = 0; h2 < hierList2.length; h2++) hierArr.push(String(hierList2[h2]));
            }
        } catch (e) {}
        if (!hierArr.length) hierArr = [table];

        var dict = new GlideRecordSecure('sys_dictionary');
        dict.addQuery('name', 'IN', hierArr.join(','));
        dict.addNotNullQuery('element');
        dict.addQuery('internal_type', '!=', 'collection');
        dict.query();

        var fields = [];
        var seen = {};
        var probe = new GlideRecordSecure(table);
        while (dict.next()) {
            var fName = String(dict.getValue('element') || '');
            if (!fName || seen[fName]) continue;
            seen[fName] = true;
            if (!probe.isValidField(fName)) continue;

            var label = '';
            try {
                var el = probe.getElement(fName);
                if (el) label = el.getLabel() || '';
            } catch (eLbl) {}
            if (!label) {
                label = String(dict.getValue('column_label') || fName);
            }
            fields.push({
                id: fName,
                name: fName,
                label: label,
                text: label + ' (' + fName + ')'
            });
        }

        if (fields.length === 0) {
            try {
                probe.initialize();
                var elems = probe.getElements();
                for (var j = 0; j < elems.size(); j++) {
                    var elem = elems.get(j);
                    var nm = elem.getName();
                    if (nm && !seen[nm]) {
                        seen[nm] = true;
                        var lbl = elem.getLabel() || nm;
                        fields.push({
                            id: nm,
                            name: nm,
                            label: lbl,
                            text: lbl + ' (' + nm + ')'
                        });
                    }
                }
            } catch (eElems) {}
        }

        fields.sort(function (a, b) {
            var la = (a.label || a.id).toLowerCase();
            var lb = (b.label || b.id).toLowerCase();
            return la.localeCompare(lb);
        });

        return this._answer({ success: true, fields: fields });
    },

    saveTableConfig: function () {
        var configId = this._getParam('config_id');
        var cfg = this._getConfig(configId);
        if (!cfg) return this._answer({ success: false, error: 'Configuration not found.' });
        if (!cfg.canWrite()) return this._answer({ success: false, error: 'You do not have permission to update this configuration.' });
        var table = String(cfg.getValue('table'));
        var rawFields = String(this._getParam('search_fields') || '').split(',');
        var fields = [];
        var seen = {};
        var probe = new GlideRecordSecure(table);
        for (var i = 0; i < rawFields.length; i++) {
            var f = rawFields[i].trim();
            if (!f) continue;
            if (!/^[a-zA-Z0-9_]+$/.test(f) || !probe.isValidField(f)) {
                return this._answer({ success: false, error: 'Field "' + f + '" does not exist on table ' + table + '.' });
            }
            if (!seen[f]) {
                seen[f] = true;
                fields.push(f);
            }
        }
        if (!fields.length) return this._answer({ success: false, error: 'At least one valid search field is required.' });
        var filter = this._getParam('filter');
        var validation = this._validateFilter(table, filter);
        if (!validation.valid) return this._answer({ success: false, error: validation.error });
        cfg.setValue('search_fields', fields.join(','));
        cfg.setValue('additional_filter', filter);
        cfg.update();
        return this._answer({ success: true, searchFields: fields.join(','), additionalFilter: filter });
    },

    _getConfig: function (sysId) {
        if (!this._isSysId(sysId)) return null;
        var gr = new GlideRecordSecure('sn_codesearch_table');
        return gr.get(sysId) ? gr : null;
    },

    _countFilterMatches: function (table, filter) {
        try {
            var ga = new GlideAggregate(table);
            if (filter) ga.addEncodedQuery(filter);
            ga.addAggregate('COUNT');
            ga.query();
            if (ga.next()) return parseInt(ga.getAggregate('COUNT'), 10) || 0;
        } catch (e) {}
        return -1;
    },

    _validateFilter: function (table, filter) {
        if (!filter) return { valid: true };
        if (filter.length > 4000) return { valid: false, error: 'Filter exceeds 4,000 characters.' };
        try {
            var gr = new GlideRecordSecure(table);
            if (typeof gr.isValidEncodedQuery === 'function' && !gr.isValidEncodedQuery(filter)) {
                return { valid: false, error: 'The encoded query contains an invalid field or operator.' };
            }
            return { valid: true };
        } catch (e) { return { valid: false, error: 'Invalid encoded query: ' + String(e) }; }
    },

    _validFields: function (table, csv) {
        var out = [], seen = {}, probe = new GlideRecordSecure(table);
        String(csv || '').split(',').forEach(function (raw) {
            var field = raw.trim();
            if (field && !seen[field] && /^[a-zA-Z0-9_]+$/.test(field) && probe.isValidField(field)) {
                seen[field] = true; out.push(field);
            }
        });
        return out;
    },

    _validTable: function (table) {
        if (!/^[a-zA-Z0-9_]+$/.test(table)) return false;
        try { return new GlideRecordSecure(table).isValid(); } catch (e) { return false; }
    },

    _tableLabel: function (table) {
        try { return new GlideRecordSecure(table).getLabel() || table; } catch (e) { return table; }
    },

    getFieldContent: function () {
        var table = this._getParam('table');
        var sysId = this._getParam('sys_id');
        var field = this._getParam('field');
        if (!this._validTable(table) || !this._isSysId(sysId) || !field || !/^[a-zA-Z0-9_]+$/.test(field)) {
            return this._answer({ success: false, error: 'Invalid parameters.' });
        }
        var gr = new GlideRecordSecure(table);
        if (!gr.get(sysId)) {
            return this._answer({ success: false, error: 'Record not found or access denied.' });
        }
        if (!gr.isValidField(field)) {
            return this._answer({ success: false, error: 'Field does not exist.' });
        }
        var val = String(gr.getValue(field) || '');
        return this._answer({
            success: true,
            content: val,
            field: field,
            fieldLabel: gr.getElement(field).getLabel() || field,
            table: table,
            tableLabel: this._tableLabel(table),
            sysId: sysId,
            displayValue: gr.getDisplayValue()
        });
    },

    _getTableDisplayConfig: function (table) {
        var raw = gs.getProperty('monaco.plus.code_search.display_fields.' + table, '');
        var seen = {};
        var secondaryFields = String(raw || '').split(',').map(function (field) {
            return field.trim();
        }).filter(function (field) {
            if (!field || seen[field]) return false;
            seen[field] = true;
            return true;
        });

        return {
            primaryField: '',
            secondaryFields: secondaryFields
        };
    },

    _extractSnippetWithLines: function (value, at, termLen) {
        var norm = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        var allLines = norm.split('\n');
        var blockCommentStates = this._getBlockCommentStates(allLines);
        var charCount = 0;
        var matchLineIdx = 0;
        for (var l = 0; l < allLines.length; l++) {
            var lineLen = allLines[l].length + 1; // +1 for newline
            if (charCount + lineLen > at) {
                matchLineIdx = l;
                break;
            }
            charCount += lineLen;
        }

        var matchLineNum = matchLineIdx + 1;
        var startIdx = Math.max(0, matchLineIdx - 2);
        var endIdx = Math.min(allLines.length - 1, matchLineIdx + 2);

        var resultLines = [];
        for (var i = startIdx; i <= endIdx; i++) {
            resultLines.push({
                num: i + 1,
                text: allLines[i],
                isMatch: (i === matchLineIdx),
                inBlockComment: blockCommentStates[i]
            });
        }

        var totalLines = allLines.length;
        var allLinesShown = (resultLines.length >= totalLines);
        return {
            matchLine: matchLineNum,
            startLine: startIdx + 1,
            totalLines: totalLines,
            singleLine: totalLines <= 1,
            allLinesShown: allLinesShown,
            allLines: allLines,
            blockCommentStates: blockCommentStates,
            lines: resultLines,
            text: resultLines.map(function (r) { return r.text; }).join('\n')
        };
    },

    /* Track whether each source line begins inside a block comment. The snippet UI only
       receives selected lines, so it cannot infer this when the opening delimiter was
       outside the excerpt. Strings are skipped to avoid treating comment-like text as code. */
    _getBlockCommentStates: function (lines) {
        var states = [];
        var inBlockComment = false;
        var quote = '';
        var escaped = false;

        for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            var line = String(lines[lineIndex] || '');
            states.push(inBlockComment);
            escaped = false;

            for (var i = 0; i < line.length; i++) {
                var ch = line.charAt(i);
                var next = line.charAt(i + 1);

                if (inBlockComment) {
                    if (ch === '*' && next === '/') {
                        inBlockComment = false;
                        i++;
                    }
                    continue;
                }
                if (quote) {
                    if (escaped) escaped = false;
                    else if (ch === '\\') escaped = true;
                    else if (ch === quote) quote = '';
                    continue;
                }
                if (ch === '/' && next === '/') break;
                if (ch === '/' && next === '*') {
                    inBlockComment = true;
                    i++;
                } else if (ch === "'" || ch === '"' || ch === '`') {
                    quote = ch;
                }
            }

            /* JavaScript single- and double-quoted strings do not continue onto the next
               physical line. Template literals do, so retain only the backtick state. */
            if (quote !== '`') quote = '';
        }
        return states;
    },

    _snippet: function (value, index, length) {
        var start = Math.max(0, index - 80), end = Math.min(value.length, index + length + 140);
        var sub = value.substring(start, end).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        return (start ? '…' : '') + sub + (end < value.length ? '…' : '');
    },

    _isSysId: function (value) { return /^[0-9a-f]{32}$/.test(value); },
    _answer: function (data) { return this.setAnswer(JSON.stringify(data)); },

    /* Shared with the main Widget Editor+ tool so lastCodeSearchGroup rides along with its preferences export/import. */
    USER_PREF_NAME: 'monaco_plus.user_prefs',

    /**
     * Returns the current user's last-selected code search group, from the shared Widget Editor+ preference blob.
     * @returns {{success: boolean, groupId: string|null}} Return value.
     */
    getLastSearchGroup: function () {
        var gr = new GlideRecordSecure('sys_user_preference');
        gr.addQuery('user', gs.getUserID());
        gr.addQuery('name', this.USER_PREF_NAME);
        gr.query();
        var groupId = null;
        if (gr.next()) {
            try {
                groupId = JSON.parse(gr.getValue('value')).lastCodeSearchGroup || null;
            } catch (e) {}
        }
        return this._answer({ success: true, groupId: groupId });
    },

    /**
     * Persists the user's last-selected code search group into the shared Widget Editor+ preference blob,
     * merging into whatever the main tool has already stored there rather than overwriting it.
     * Accepts `group_id`.
     * @returns {{success: boolean}} Return value.
     */
    saveLastSearchGroup: function () {
        var groupId = this._getParam('group_id');
        var gr = new GlideRecordSecure('sys_user_preference');
        gr.addQuery('user', gs.getUserID());
        gr.addQuery('name', this.USER_PREF_NAME);
        gr.query();

        var prefs = {};
        if (gr.next()) {
            try {
                prefs = JSON.parse(gr.getValue('value')) || {};
            } catch (e) {}
            prefs.lastCodeSearchGroup = groupId;
            gr.setValue('value', JSON.stringify(prefs));
            gr.update();
        } else {
            prefs.lastCodeSearchGroup = groupId;
            gr.initialize();
            gr.setValue('user', gs.getUserID());
            gr.setValue('name', this.USER_PREF_NAME);
            gr.setValue('value', JSON.stringify(prefs));
            gr.insert();
        }
        return this._answer({ success: true });
    },

    type: 'WidgetEditorCodeSearchAjax'
});
