var WidgetEditorMarkdownAjax = Class.create();
WidgetEditorMarkdownAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    RULES_PROPERTY: 'monaco.plus.update_sets.markdown_groups',
    DISPLAY_PROPERTY: 'monaco.plus.update_sets.markdown_display',
    PAGE_SIZE: 100,
    _sortRules: function (rules) {
        function sort(nodes) {
            nodes.sort(function (a, b) { return a.label.localeCompare(b.label) || a.table.localeCompare(b.table); });
            nodes.forEach(function (node) { sort(node.children || []); });
        }
        sort(rules.groups);
        return rules;
    },
    _defaultRules: function () {
        var self = this;
        var groups = ['sp_widget', 'sc_cat_item_producer', 'sys_security_acl', 'sys_user_group'].map(function (table) {
            var children = table === 'sys_security_acl' ? [{ table: 'sys_security_acl_role', field: 'sys_security_acl' }] :
                table === 'sys_user_group' ? [{ table: 'sys_group_has_role', field: 'group' }] : self._relatedTables(table);
            return { id: table, table: table, label: self._tableLabel(table), children: children.map(function (child) {
                return { id: child.table, table: child.table, label: child.label || self._tableLabel(child.table),
                    field: child.field, children: [] };
            }) };
        });
        // A record type has one parent in the Markdown hierarchy.
        var seen = {};
        groups.forEach(function (node) { seen[node.table] = true; });
        groups.forEach(function (node) { node.children = node.children.filter(function (child) {
            if (seen[child.table]) return false;
            seen[child.table] = true;
            return true;
        }); });
        return this._sortRules({ version: 1, groups: groups });
    },
    _relatedTables: function (table) {
        this._relatedCache = this._relatedCache || {};
        if (this._relatedCache[table]) return this._relatedCache[table];
        var names = this._hierarchyNames(table), listId = '';
        // Use the nearest inherited Default View configuration, never a personal view.
        for (var i = 0; i < names.length; i++) {
            var list = new GlideRecordSecure('sys_ui_related_list');
            list.addQuery('name', names[i]);
            list.addQuery('view', 'Default view');
            list.addQuery('sys_user', '');
            list.setLimit(1);
            list.query();
            if (list.next()) { listId = String(list.getUniqueValue()); break; }
        }
        var result = [], seen = {};
        if (listId) {
            var entry = new GlideRecordSecure('sys_ui_related_list_entry');
            entry.addQuery('list_id', listId);
            entry.query();
            while (entry.next()) {
                var relationship = String(entry.getValue('related_list') || '');
                var match = relationship.match(/^([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)$/i);
                if (!match || seen[relationship]) continue;
                var dict = new GlideRecordSecure('sys_dictionary');
                dict.addQuery('name', 'IN', this._hierarchyNames(match[1]).join(','));
                dict.addQuery('element', match[2]);
                dict.addQuery('internal_type', 'reference');
                dict.query();
                if (!dict.next() || names.indexOf(String(dict.getValue('reference'))) === -1) continue;
                seen[relationship] = true;
                result.push({ table: match[1], field: match[2], label: this._tableLabel(match[1]) });
            }
        }
        result.sort(function (a, b) { return a.label.localeCompare(b.label) || a.field.localeCompare(b.field); });
        this._relatedCache[table] = result;
        return result;
    },
    getRelatedTables: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        var table = String(this.getParameter('table') || '');
        if (!this._table(table)) return this._answer({ success: false, error: 'Invalid table.' });
        return this._answer({ success: true, tables: this._relatedTables(table) });
    },
    getDefaultRules: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        return this._answer({ success: true, rules: this._defaultRules() });
    },

    _answer: function (value) { return this.setAnswer(JSON.stringify(value)); },
    _sysId: function (value) { return /^[0-9a-f]{32}$/i.test(String(value || '')); },
    _table: function (value) { return /^[a-z][a-z0-9_]*$/i.test(String(value || '')); },
    _url: function (table, id) {
        var origin = String(gs.getProperty('glide.servlet.uri', '')).replace(/\/+$/, '');
        return origin + '/nav_to.do?uri=' + encodeURIComponent(table + '.do?sys_id=' + id);
    },
    _xmlText: function (value) {
        return String(value || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    },
    _payloadField: function (payload, field) {
        if (!this._table(field)) return { value: '', display: '' };
        var re = new RegExp('<' + field + '(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/' + field + '>', 'i');
        var match = String(payload || '').match(re);
        if (!match) return { value: '', display: '' };
        var display = match[0].match(/\bdisplay_value="([^"]*)"/i);
        return { value: this._xmlText(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')),
            display: display ? this._xmlText(display[1]) : '' };
    },
    _target: function (update) {
        var payload = String(update.getValue('payload') || '');
        var root = payload.match(/<record_update\b[^>]*\btable=["']([a-z][a-z0-9_]*)["']/i);
        var table = root ? root[1] : '';
        var id = '';
        if (this._table(table)) {
            try {
                var xml = new XMLDocument2();
                xml.parseXML(payload);
                var record = xml.getFirstNode('//' + table);
                var children = record && record.getChildNodeIterator();
                while (children && children.hasNext()) {
                    var child = children.next();
                    if (child.getNodeName() === 'sys_id') { id = String(child.getTextContent() || ''); break; }
                }
            } catch (e) {}
        }
        if (!this._sysId(id)) id = this._payloadField(payload, 'sys_id').value;
        if (this._table(table) && this._sysId(id)) return { table: table, id: id, payload: payload };
        // Forced updates can have a sparse payload. The final 32 hex characters of
        // sys_update_xml.name are the target ID; the prefix is the whole table name.
        var name = String(update.getValue('name') || '');
        var suffix = name.match(/^([a-z][a-z0-9_]*)_([0-9a-f]{32})$/i);
        if (suffix && (!table || suffix[1] === table)) {
            return { table: suffix[1], id: suffix[2], payload: payload };
        }
        return null;
    },
    _displayField: function (table) {
        this._displayFields = this._displayFields || {};
        if (this._displayFields[table]) return this._displayFields[table];
        var names = this._hierarchyNames(table);
        for (var i = 0; i < names.length; i++) {
            var dict = new GlideRecordSecure('sys_dictionary');
            dict.addQuery('name', names[i]);
            dict.addQuery('display', true);
            dict.setLimit(1);
            dict.query();
            if (dict.next()) {
                this._displayFields[table] = { name: dict.getValue('element') || '', reference: dict.getValue('reference') || '' };
                return this._displayFields[table];
            }
        }
        this._displayFields[table] = { name: '', reference: '' };
        return this._displayFields[table];
    },
    _hierarchyNames: function (table) {
        var names = [], seen = {}, current = table;
        while (current && !seen[current] && names.length < 12) {
            names.push(current);
            seen[current] = true;
            var object = new GlideRecordSecure('sys_db_object');
            if (!object.get('name', current)) break;
            var parentId = String(object.getValue('super_class') || '');
            if (!this._sysId(parentId)) break;
            var parent = new GlideRecordSecure('sys_db_object');
            if (!parent.get(parentId)) break;
            current = String(parent.getValue('name') || '');
        }
        return names;
    },
    _displayConfig: function (table) {
        if (!this._displayConfigCache) {
            try {
                var parsed = JSON.parse(gs.getProperty(this.DISPLAY_PROPERTY, '{}'));
                this._displayConfigCache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
            } catch (e) { this._displayConfigCache = {}; }
        }
        return Object.prototype.hasOwnProperty.call(this._displayConfigCache, table) ? this._displayConfigCache[table] : null;
    },
    _fieldPath: function (table, path) {
        if (typeof path !== 'string' || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/i.test(path)) return null;
        var parts = path.split('.'), steps = [];
        for (var i = 0; i < parts.length; i++) {
            var schema = new GlideRecordSecure(table);
            if (!schema.isValid() || !schema.isValidField(parts[i])) return null;
            var element = schema.getElement(parts[i]), descriptor = element && element.getED();
            var reference = descriptor && String(descriptor.getInternalType()) === 'reference' ? String(descriptor.getReference() || '') : '';
            steps.push({ table: table, field: parts[i], reference: reference });
            if (i < parts.length - 1) {
                if (!this._table(reference)) return null;
                table = reference;
            }
        }
        return steps;
    },
    _validateDisplayConfig: function (value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Expected a JSON object keyed by table name.';
        var tables = Object.keys(value);
        for (var i = 0; i < tables.length; i++) {
            var table = tables[i], config = value[table];
            if (!this._table(table) || !config || typeof config !== 'object' || Array.isArray(config) ||
                typeof config.display !== 'string' ||
                Object.keys(config).some(function (key) { return key !== 'display' && key !== 'secondary'; }) ||
                (config.secondary !== undefined && !Array.isArray(config.secondary))) {
                return 'Invalid display configuration for ' + table + '.';
            }
            var fields = [config.display].concat(config.secondary || []);
            for (var j = 0; j < fields.length; j++) {
                if (!this._fieldPath(table, fields[j])) return 'Invalid field path: ' + table + '.' + String(fields[j]) + '.';
            }
        }
        return '';
    },
    _configuredValue: function (record, table, payload, path) {
        // Resolve each reference securely; never evaluate a field path as code.
        try {
            var steps = this._fieldPath(table, path);
            if (!steps) return '';
            for (var i = 0; i < steps.length; i++) {
                var step = steps[i], raw = '', display = '';
                if (record) {
                    var element = record.getElement(step.field);
                    if (!element || !element.canRead()) return '';
                    raw = String(record.getValue(step.field) || '');
                    display = String(record.getDisplayValue(step.field) || '');
                } else if (i === 0) {
                    var field = this._payloadField(payload, step.field);
                    raw = field.value; display = field.display;
                } else return '';
                if (i === steps.length - 1) return display || raw;
                if (!this._sysId(raw)) return '';
                record = this._record(step.reference, raw);
                if (!record) return '';
            }
        } catch (e) {}
        return '';
    },
    _secondaryValues: function (record, table, payload) {
        var config = this._displayConfig(table), result = [];
        if (!config || !Array.isArray(config.secondary)) return result;
        for (var i = 0; i < config.secondary.length; i++) {
            var value = this._configuredValue(record, table, payload, config.secondary[i]);
            if (value) result.push(value);
        }
        return result;
    },
    _name: function (record, table, id, payload, fallback, depth) {
        var config = !depth && this._displayConfig(table);
        if (config && config.display) {
            var configured = this._configuredValue(record, table, payload, config.display);
            if (configured) return configured;
        }
        var display = this._displayField(table);
        if (record) {
            if (display.name && display.reference && this._sysId(record.getValue(display.name)) && (depth || 0) < 3) {
                var referenced = new GlideRecordSecure(display.reference);
                if (referenced.isValid() && referenced.get(record.getValue(display.name))) {
                    var refName = this._name(referenced, display.reference, record.getValue(display.name), '', '', (depth || 0) + 1);
                    if (refName && refName !== display.reference + ':' + record.getValue(display.name) && !this._sysId(refName)) return refName;
                }
            }
            if (display.name) {
                var fieldName = String(record.getDisplayValue(display.name) || '');
                if (fieldName && !this._sysId(fieldName)) return fieldName;
            }
            var name = String(record.getDisplayValue() || '');
            if (name && !this._sysId(name)) return name;
        }
        if (display.name) {
            var payloadDisplay = this._payloadField(payload, display.name);
            if (payloadDisplay.display && !this._sysId(payloadDisplay.display)) return payloadDisplay.display;
            if (payloadDisplay.value && !this._sysId(payloadDisplay.value)) return payloadDisplay.value;
        }
        var fields = ['name', 'short_description', 'title', 'question_text'];
        for (var i = 0; i < fields.length; i++) {
            var field = this._payloadField(payload, fields[i]);
            if (field.display && !this._sysId(field.display)) return field.display;
            if (field.value && !this._sysId(field.value)) return field.value;
        }
        return fallback && !this._sysId(fallback) ? fallback : (table + ':' + id);
    },
    _tableLabel: function (table) {
        this._tableLabels = this._tableLabels || {};
        if (this._tableLabels[table]) return this._tableLabels[table];
        var gr = new GlideRecordSecure('sys_db_object');
        this._tableLabels[table] = gr.get('name', table) ? String(gr.getValue('label') || table) : table;
        return this._tableLabels[table];
    },
    _record: function (table, id) {
        try {
            var gr = new GlideRecordSecure(table);
            return gr.isValid() && gr.get(id) ? gr : null;
        } catch (e) { return null; }
    },
    _updateForTarget: function (table, id, setTable, setId) {
        if (!setId || (setTable !== 'sys_update_set' && setTable !== 'sys_remote_update_set')) return null;
        var gr = new GlideRecordSecure('sys_update_xml');
        gr.addQuery(setTable === 'sys_update_set' ? 'update_set' : 'remote_update_set', setId);
        gr.addQuery('name', table + '_' + id);
        gr.orderByDesc('sys_created_on');
        gr.setLimit(1);
        gr.query();
        return gr.next() ? { id: String(gr.getUniqueValue()), payload: String(gr.getValue('payload') || ''),
            name: String(gr.getValue('target_name') || '') } : null;
    },
    _rules: function () {
        // Export only uses the saved hierarchy. Related-list discovery belongs to the editor.
        try {
            var raw = gs.getProperty(this.RULES_PROPERTY, '');
            var parsed = raw ? JSON.parse(raw) : null;
            if (parsed && parsed.version === 1 && Array.isArray(parsed.groups)) return this._sortRules(parsed);
        } catch (e) {}
        return { version: 1, groups: [] };
    },
    _findRule: function (nodes, table, chain, orders) {
        for (var i = 0; i < nodes.length; i++) {
            var next = chain.concat(nodes[i]);
            var nextOrders = (orders || []).concat(i);
            if (nodes[i].table === table) return { chain: next, orders: nextOrders };
            var child = this._findRule(nodes[i].children || [], table, next, nextOrders);
            if (child) return child;
        }
        return null;
    },
    _ancestors: function (table, id, payload, rules, setTable, setId) {
        var match = this._findRule(rules.groups, table, []);
        var ordinary = { type: this._tableLabel(table), typeOrder: 10000, ancestors: [] };
        if (!match) return ordinary;
        var chain = match.chain;
        if (chain.length === 1) return { type: chain[0].label, typeOrder: match.orders[0], ancestors: [] };
        var ancestors = [];
        var childId = id, childPayload = payload, childRecord = this._record(table, id);
        for (var i = chain.length - 1; i > 0; i--) {
            var field = chain[i].field;
            var parent = chain[i - 1];
            var parentId = childRecord ? String(childRecord.getValue(field) || '') : '';
            if (!this._sysId(parentId)) parentId = this._payloadField(childPayload, field).value;
            if (!this._sysId(parentId)) return ordinary;
            var parentRecord = this._record(parent.table, parentId);
            var parentUpdate = parentRecord ? null : this._updateForTarget(parent.table, parentId, setTable, setId);
            if (!parentRecord && !parentUpdate) return ordinary;
            ancestors.unshift({ table: parent.table, id: parentId, type: parent.label, typeOrder: match.orders[i - 1],
                name: this._name(parentRecord, parent.table, parentId, parentUpdate ? parentUpdate.payload : '',
                    parentUpdate ? parentUpdate.name : ''),
                secondary: this._secondaryValues(parentRecord, parent.table, parentUpdate ? parentUpdate.payload : ''),
                url: parentRecord ? this._url(parent.table, parentId) : this._url('sys_update_xml', parentUpdate.id) });
            childId = parentId;
            childRecord = parentRecord;
            childPayload = parentUpdate ? parentUpdate.payload : '';
        }
        return { type: chain[chain.length - 1].label, typeOrder: match.orders[match.orders.length - 1], ancestors: ancestors };
    },

    getSetsForUpdates: function () {
        var ids = String(this.getParameter('update_ids') || '').split(',').filter(function (id) { return id; });
        if (!ids.length || ids.length > 100) return this._answer({ success: false, error: 'Select 1 to 100 customer updates.' });
        var seen = {}, sets = [];
        for (var i = 0; i < ids.length; i++) {
            if (!this._sysId(ids[i])) return this._answer({ success: false, error: 'Invalid customer update ID.' });
            var update = new GlideRecordSecure('sys_update_xml');
            if (!update.get(ids[i])) return this._answer({ success: false, error: 'A selected customer update is unavailable.' });
            var local = String(update.getValue('update_set') || '');
            var remote = String(update.getValue('remote_update_set') || '');
            var setTable = local ? 'sys_update_set' : 'sys_remote_update_set';
            var setId = local || remote;
            if (!this._sysId(setId)) return this._answer({ success: false, error: 'A selected update has no update set.' });
            var key = setTable + ':' + setId;
            if (seen[key]) continue;
            var set = new GlideRecordSecure(setTable);
            if (!set.get(setId)) return this._answer({ success: false, error: 'An update set is unavailable.' });
            seen[key] = true;
            sets.push({ table: setTable, id: setId, name: String(set.getValue('name') || setId), url: this._url(setTable, setId) });
        }
        sets.sort(function (a, b) { return a.name.localeCompare(b.name) || a.id.localeCompare(b.id); });
        return this._answer({ success: true, sets: sets });
    },
    getMemberPage: function () {
        var setTable = String(this.getParameter('set_table') || '');
        var setId = String(this.getParameter('set_id') || '');
        var offset = Number(this.getParameter('offset') || 0);
        if ((setTable !== 'sys_update_set' && setTable !== 'sys_remote_update_set') || !this._sysId(setId) ||
            !isFinite(offset) || offset < 0 || offset % this.PAGE_SIZE !== 0) {
            return this._answer({ success: false, error: 'Invalid update set page.' });
        }
        var set = new GlideRecordSecure(setTable);
        if (!set.get(setId)) return this._answer({ success: false, error: 'Update set unavailable.' });
        var field = setTable === 'sys_update_set' ? 'update_set' : 'remote_update_set';
        var gr = new GlideRecordSecure('sys_update_xml');
        gr.addQuery(field, setId);
        gr.orderByDesc('sys_created_on');
        gr.orderByDesc('sys_id');
        gr.chooseWindow(offset, offset + this.PAGE_SIZE + 1);
        gr.query();
        var rows = [], rules = this._rules();
        while (gr.next() && rows.length <= this.PAGE_SIZE) {
            var target = this._target(gr);
            var updateId = String(gr.getUniqueValue());
            if (!target) {
                rows.push({ table: 'sys_update_xml', id: updateId, type: 'Unresolved Customer Updates',
                    name: String(gr.getValue('target_name') || gr.getValue('name') || updateId),
                    url: this._url('sys_update_xml', updateId), ancestors: [], action: '' });
                continue;
            }
            var live = this._record(target.table, target.id);
            var grouping = this._ancestors(target.table, target.id, target.payload, rules, setTable, setId);
            rows.push({ table: target.table, id: target.id, type: grouping.type,
                typeOrder: grouping.typeOrder,
                name: this._name(live, target.table, target.id, target.payload, String(gr.getValue('target_name') || '')),
                secondary: this._secondaryValues(live, target.table, target.payload),
                url: live ? this._url(target.table, target.id) : this._url('sys_update_xml', updateId),
                ancestors: grouping.ancestors, action: String(gr.getValue('action') || ''), updateId: updateId });
        }
        var hasMore = rows.length > this.PAGE_SIZE;
        if (hasMore) rows.pop();
        return this._answer({ success: true, rows: rows, hasMore: hasMore, nextOffset: offset + rows.length });
    },
    getRules: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        return this._answer({ success: true, rules: this._rules() });
    },
    getProperties: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        var gr = new GlideRecordSecure('sys_properties');
        gr.addQuery('name', 'STARTSWITH', 'monaco.plus.');
        gr.orderBy('name');
        gr.query();
        var properties = [], hasRules = false;
        while (gr.next()) {
            var name = String(gr.getValue('name') || '');
            if (name === this.RULES_PROPERTY) hasRules = true;
            properties.push({ name: name,
                value: String(gr.getValue('value') || ''),
                description: String(gr.getValue('description') || ''),
                type: String(gr.getValue('type') || 'string') });
        }
        if (!hasRules) properties.push({ name: this.RULES_PROPERTY, value: JSON.stringify(this._rules()),
            description: 'Alphabetical table hierarchy for update set Markdown export.', type: 'string' });
        return this._answer({ success: true, properties: properties });
    },
    saveProperty: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        var name = String(this.getParameter('property_name') || '');
        var value = String(this.getParameter('property_value') || '');
        if (value.length > 4000) return this._answer({ success: false, error: 'Property value exceeds 4000 characters.' });
        if (!/^monaco\.plus\.[a-z0-9_.]+$/.test(name)) {
            return this._answer({ success: false, error: 'Invalid Widget Editor+ property.' });
        }
        if (name === this.RULES_PROPERTY) {
            return this._answer({ success: false, error: 'Edit Table hierarchy with the hierarchy editor.' });
        }
        var property = new GlideRecordSecure('sys_properties');
        if (!property.get('name', name)) {
            return this._answer({ success: false, error: 'Property not found.' });
        }
        if (name === this.DISPLAY_PROPERTY) {
            var config;
            try { config = JSON.parse(value); } catch (e) { return this._answer({ success: false, error: 'Invalid JSON.' }); }
            var error = this._validateDisplayConfig(config);
            if (error) return this._answer({ success: false, error: error });
        }
        var json = /^monaco\.plus\.(?:assistant\.table_config\.|css\.variables$|scss\.variables$)/.test(name);
        try {
            var existing = JSON.parse(String(property.getValue('value') || ''));
            if (existing !== null && typeof existing === 'object') json = true;
        } catch (e) {}
        if (json) {
            try { JSON.parse(value); } catch (e) { return this._answer({ success: false, error: 'Invalid JSON.' }); }
        }
        var type = String(property.getValue('type') || 'string');
        if (type === 'boolean' && value !== 'true' && value !== 'false') {
            return this._answer({ success: false, error: 'Choose true or false.' });
        }
        if (type === 'integer' && !/^-?\d+$/.test(value)) {
            return this._answer({ success: false, error: 'Enter a whole number.' });
        }
        var dictionary = new GlideRecordSecure('sys_dictionary');
        dictionary.addQuery('name', 'sys_properties');
        dictionary.addQuery('element', 'value');
        dictionary.setLimit(1);
        dictionary.query();
        var limit = dictionary.next() ? parseInt(dictionary.getValue('max_length'), 10) : 4000;
        if (!isFinite(limit) || limit < 1) limit = 4000;
        limit = Math.min(limit, 4000);
        if (value.length > limit) return this._answer({ success: false, error: 'Property value exceeds ' + limit + ' characters.' });
        gs.setProperty(name, value);
        return this._answer({ success: true, value: String(gs.getProperty(name, '') || '') });
    },
    _validateNode: function (node, parent, depth, ids, tables) {
        if (!node || depth > 6 || !/^[a-z0-9_]{1,64}$/i.test(String(node.id || '')) || ids[node.id] ||
            !String(node.label || '').trim() || String(node.label).length > 100 || !this._table(node.table)) return false;
        ids[node.id] = true;
        var table = new GlideRecordSecure('sys_db_object');
        if (!table.get('name', node.table) || tables[node.table]) return false;
        tables[node.table] = true;
        if (parent) {
            if (!this._table(node.field)) return false;
            var child = new GlideRecordSecure(node.table);
            if (!child.isValid() || !child.isValidField(node.field)) return false;
            var dict = new GlideRecordSecure('sys_dictionary');
            dict.addQuery('name', 'IN', this._hierarchyNames(node.table).join(','));
            dict.addQuery('element', node.field);
            dict.addQuery('internal_type', 'reference');
            dict.setLimit(1);
            dict.query();
            if (!dict.next()) return false;
            var ref = String(dict.getValue('reference') || '');
            if (this._hierarchyNames(parent.table).indexOf(ref) === -1) return false;
        }
        if (!Array.isArray(node.children) || node.children.length > 30) return false;
        for (var i = 0; i < node.children.length; i++) {
            if (!this._validateNode(node.children[i], node, depth + 1, ids, tables)) return false;
        }
        return true;
    },
    saveRules: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        var raw = String(this.getParameter('rules') || '');
        if (raw.length > 4000) return this._answer({ success: false, error: 'Table hierarchy exceeds 4000 characters.' });
        var parsed;
        try { parsed = JSON.parse(raw); } catch (e) { return this._answer({ success: false, error: 'Invalid Table hierarchy.' }); }
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.groups) || parsed.groups.length > 30) {
            return this._answer({ success: false, error: 'Invalid Table hierarchy.' });
        }
        var ids = {}, tables = {};
        for (var i = 0; i < parsed.groups.length; i++) {
            if (!this._validateNode(parsed.groups[i], null, 0, ids, tables)) {
                return this._answer({ success: false, error: 'Check table names, reference fields, and duplicate or cyclic hierarchy entries.' });
            }
        }
        var value = JSON.stringify(this._sortRules(parsed));
        if (value.length > 4000) return this._answer({ success: false, error: 'Table hierarchy exceeds 4000 characters.' });
        gs.setProperty(this.RULES_PROPERTY, value);
        return this._answer({ success: true });
    },
    searchTables: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        var query = String(this.getParameter('query') || '').trim();
        var gr = new GlideRecordSecure('sys_db_object');
        if (query) {
            var q = gr.addQuery('name', 'CONTAINS', query);
            q.addOrCondition('label', 'CONTAINS', query);
        }
        gr.orderBy('label');
        gr.setLimit(50);
        gr.query();
        var tables = [];
        while (gr.next()) tables.push({ name: String(gr.getValue('name')), label: String(gr.getValue('label') || gr.getValue('name')) });
        return this._answer({ success: true, tables: tables });
    },
    getReferenceFields: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        var table = String(this.getParameter('table') || '');
        if (!this._table(table)) return this._answer({ success: false, error: 'Invalid table.' });
        var names = this._hierarchyNames(table);
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', 'IN', names.join(','));
        gr.addQuery('internal_type', 'reference');
        gr.orderBy('element');
        gr.query();
        var fields = [], seen = {};
        while (gr.next()) {
            var field = String(gr.getValue('element') || '');
            if (!field || seen[field]) continue;
            seen[field] = true;
            fields.push({ name: field, label: String(gr.getValue('column_label') || field), reference: String(gr.getValue('reference') || '') });
        }
        return this._answer({ success: true, fields: fields });
    },
    type: 'WidgetEditorMarkdownAjax'
});
