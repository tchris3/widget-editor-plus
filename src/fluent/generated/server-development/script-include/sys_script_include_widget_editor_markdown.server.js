var WidgetEditorMarkdownAjax = Class.create();
WidgetEditorMarkdownAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    RULES_PROPERTY: 'monaco.plus.update_sets.markdown_groups',
    GROUPS_PREFIX: 'monaco.plus.update_sets.markdown_groups.',
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
        var related = this._relatedTables(table).slice(), seen = {};
        related.forEach(function (entry) { seen[entry.table] = true; });
        var forward = this._parentReferences(table), self = this;
        Object.keys(forward).forEach(function (child) {
            if (!seen[child]) related.push({ table: child, field: forward[child].join(', '), label: self._tableLabel(child) });
        });
        return this._answer({ success: true, tables: related });
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
    _displayConfigs: function () {
        var parsed = JSON.parse(String(gs.getProperty(this.DISPLAY_PROPERTY, '{}') || '{}'));
        var configs = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        var properties = new GlideRecordSecure('sys_properties'), prefix = this.DISPLAY_PROPERTY + '.';
        properties.addQuery('name', 'STARTSWITH', prefix); properties.query();
        while (properties.next()) {
            var name = String(properties.getValue('name') || '');
            if (name.indexOf(prefix) !== 0) continue;
            var value = String(properties.getValue('value') || '');
            if (value) configs[name.slice(prefix.length)] = JSON.parse(value);
        }
        var self = this;
        Object.keys(configs).forEach(function (table) { configs[table] = self._normaliseDisplayConfig(configs[table]); });
        return configs;
    },
    _normaliseDisplayConfig: function (config) {
        if (config && typeof config.display === 'string') {
            return { display_value: config.display, additional_fields: (config.secondary || []).join(',') };
        }
        return config;
    },
    _removeLegacyDisplayTable: function (table) {
        var legacy = JSON.parse(String(gs.getProperty(this.DISPLAY_PROPERTY, '{}') || '{}'));
        if (Object.prototype.hasOwnProperty.call(legacy, table)) {
            delete legacy[table];
            gs.setProperty(this.DISPLAY_PROPERTY, Object.keys(legacy).length ? JSON.stringify(legacy, null, 4) : '');
        }
    },
    _displayConfig: function (table) {
        if (!this._displayConfigCache) {
            try { this._displayConfigCache = this._displayConfigs(); }
            catch (e) { this._displayConfigCache = {}; }
        }
        return Object.prototype.hasOwnProperty.call(this._displayConfigCache, table) ? this._displayConfigCache[table] : null;
    },
    _saveDisplayConfigs: function (value) {
        try {
            var config = JSON.parse(value), error = this._validateDisplayConfig(config), self = this;
            if (error) throw new Error(error);
            Object.keys(config).forEach(function (table) { config[table] = self._normaliseDisplayConfig(config[table]); });
            Object.keys(config).forEach(function (table) {
                if (JSON.stringify(config[table], null, 4).length > 4000) throw new Error('Property for ' + table + ' exceeds 4000 characters.');
            });
            var prefix = this.DISPLAY_PROPERTY + '.', existing = new GlideRecordSecure('sys_properties'), removed = [];
            existing.addQuery('name', 'STARTSWITH', prefix); existing.query();
            while (existing.next()) {
                var name = String(existing.getValue('name'));
                if (!Object.prototype.hasOwnProperty.call(config, name.slice(prefix.length))) removed.push(name);
            }
            Object.keys(config).forEach(function (table) {
                var name = prefix + table, property = new GlideRecordSecure('sys_properties');
                if (!property.get('name', name)) {
                    property.initialize(); property.setValue('name', name); property.setValue('type', 'string');
                    property.setValue('read_roles', 'sp_admin'); property.setValue('write_roles', 'admin');
                    property.setValue('ignore_cache', true);
                    property.setValue('value', JSON.stringify(config[table], null, 4));
                    if (!property.insert()) throw new Error('Could not create property: ' + name);
                }
                self._ensurePropertyCategory(property);
                gs.setProperty(name, JSON.stringify(config[table], null, 4));
            });
            removed.forEach(function (name) { self._deleteConfigProperty(name); });
            // Migrate the legacy combined value only after all per-table writes succeed.
            var legacy = new GlideRecordSecure('sys_properties');
            if (legacy.get('name', this.DISPLAY_PROPERTY)) gs.setProperty(this.DISPLAY_PROPERTY, '');
            this._displayConfigCache = config;
            return this._answer({ success: true, value: JSON.stringify(config, null, 4) });
        } catch (e) { return this._answer({ success: false, error: e.message || String(e) }); }
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
            if (!this._table(table) || !config || typeof config !== 'object' || Array.isArray(config)) return 'Invalid display configuration for ' + table + '.';
            var legacy = typeof config.display === 'string';
            if (legacy ? (Object.keys(config).some(function (key) { return key !== 'display' && key !== 'secondary'; }) ||
                (config.secondary !== undefined && !Array.isArray(config.secondary))) :
                (typeof config.display_value !== 'string' || typeof config.additional_fields !== 'string' ||
                Object.keys(config).some(function (key) { return key !== 'display_value' && key !== 'additional_fields'; }))) return 'Invalid display configuration for ' + table + '.';
            var normalised = this._normaliseDisplayConfig(config);
            var extra = normalised.additional_fields.trim() ? normalised.additional_fields.split(',').map(function (field) { return field.trim(); }) : [];
            var fields = [normalised.display_value].concat(extra);
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
        if (!config || !config.additional_fields) return result;
        var fields = config.additional_fields.split(',').map(function (field) { return field.trim(); });
        for (var i = 0; i < fields.length; i++) {
            var value = this._configuredValue(record, table, payload, fields[i]);
            if (value) result.push(value);
        }
        return result;
    },
    _name: function (record, table, id, payload, fallback, depth) {
        var config = !depth && this._displayConfig(table);
        if (config && config.display_value) {
            var configured = this._configuredValue(record, table, payload, config.display_value);
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
    _groupConfigs: function () {
        var gr = new GlideRecordSecure('sys_properties'), configs = {};
        gr.addQuery('name', 'STARTSWITH', this.GROUPS_PREFIX);
        gr.query();
        while (gr.next()) {
            var name = String(gr.getValue('name') || '');
            var table = name.slice(this.GROUPS_PREFIX.length);
            var value = String(gr.getValue('value') || '').trim();
            if (this._table(table) && value) {
                var children = JSON.parse(value);
                if (!Array.isArray(children) || children.length) configs[table] = children;
            }
        }
        return configs;
    },
    _parentReferences: function (parent) {
        var dictionary = new GlideRecordSecure('sys_dictionary'), targets = {};
        dictionary.addQuery('name', 'IN', this._hierarchyNames(parent).join(','));
        dictionary.addQuery('internal_type', 'reference'); dictionary.query();
        while (dictionary.next()) {
            var target = String(dictionary.getValue('reference') || ''), field = String(dictionary.getValue('element') || '');
            if (!this._table(target) || !this._table(field)) continue;
            if (!targets[target]) targets[target] = [];
            if (targets[target].indexOf(field) === -1) targets[target].push(field);
        }
        Object.keys(targets).forEach(function (target) { targets[target].sort(); });
        return targets;
    },
    _referenceField: function (parent, child) {
        var related = this._relatedTables(parent).filter(function (entry) { return entry.table === child; });
        if (related.length === 1) return related[0].field;
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', 'IN', this._hierarchyNames(child).join(','));
        gr.addQuery('internal_type', 'reference');
        gr.addQuery('reference', 'IN', this._hierarchyNames(parent).join(','));
        gr.query();
        var fields = {};
        while (gr.next()) fields[String(gr.getValue('element'))] = true;
        var names = Object.keys(fields);
        if (!names.length) {
            var forward = this._parentReferences(parent), references = [], hierarchy = this._hierarchyNames(child);
            hierarchy.forEach(function (table) { (forward[table] || []).forEach(function (field) {
                if (references.indexOf(field) === -1) references.push(field);
            }); });
            if (references.length) return { parentFields: references.sort() };
        }
        if (names.length !== 1) throw new Error('Expected one reference from ' + child + ' to ' + parent + '.');
        return names[0];
    },
    _buildGroupRules: function (configs) {
        var self = this, parents = {}, active = {}, built = {};
        Object.keys(configs).forEach(function (parent) {
            if (!self._table(parent) || !Array.isArray(configs[parent])) throw new Error('Use a JSON array of child table names.');
            var table = new GlideRecordSecure('sys_db_object');
            if (!table.get('name', parent)) throw new Error('Unknown table: ' + parent);
            configs[parent].forEach(function (child) {
                if (typeof child !== 'string' || !self._table(child)) throw new Error('Use a JSON array of child table names.');
                if (parents[child]) throw new Error('A child table can appear under only one parent: ' + child);
                parents[child] = parent;
            });
        });
        function node(table, depth) {
            if (active[table] || depth > 6) throw new Error('The table hierarchy contains a cycle or is too deep.');
            if (built[table]) return built[table];
            var record = new GlideRecordSecure('sys_db_object');
            if (!record.get('name', table)) throw new Error('Unknown table: ' + table);
            active[table] = true;
            var result = { id: table, table: table, label: self._tableLabel(table), children: [] };
            if (parents[table]) {
                var reference = self._referenceField(parents[table], table);
                if (typeof reference === 'string') result.field = reference;
                else { result.parentFields = reference.parentFields; result.field = parents[table] + '.' + reference.parentFields.join(', ' + parents[table] + '.'); }
            }
            result.children = (configs[table] || []).map(function (child) { return node(child, depth + 1); });
            delete active[table]; built[table] = result;
            return result;
        }
        // Visit every node as well as roots so a rootless cycle is rejected.
        Object.keys(configs).filter(function (table) { return !parents[table]; }).forEach(function (table) { node(table, 0); });
        Object.keys(configs).forEach(function (table) { node(table, 0); });
        return this._sortRules({ version: 1, groups: Object.keys(configs).filter(function (table) {
            return !parents[table];
        }).map(function (table) { return built[table]; }) });
    },
    _rules: function () {
        return this._buildGroupRules(this._groupConfigs());
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
    _referencingParentId: function (parent, fields, childId, setTable, setId) {
        var matches = {}, gr = new GlideRecordSecure(parent);
        var condition = gr.addQuery(fields[0], childId);
        for (var i = 1; i < fields.length; i++) condition.addOrCondition(fields[i], childId);
        gr.query();
        while (gr.next()) matches[String(gr.getUniqueValue())] = true;
        // Deleted parents can still be resolved from their latest captured payload.
        if (this._sysId(setId) && (setTable === 'sys_update_set' || setTable === 'sys_remote_update_set')) {
            var updates = new GlideRecordSecure('sys_update_xml'), seen = {}, self = this;
            updates.addQuery(setTable === 'sys_update_set' ? 'update_set' : 'remote_update_set', setId);
            updates.addQuery('name', 'STARTSWITH', parent + '_');
            updates.orderByDesc('sys_updated_on'); updates.query();
            var captured = {};
            while (updates.next()) {
                var name = String(updates.getValue('name') || ''), id = name.slice(parent.length + 1);
                if (!this._sysId(id) || seen[id]) continue;
                seen[id] = true;
                var payload = String(updates.getValue('payload') || '');
                if (fields.some(function (field) { return self._payloadField(payload, field).value === childId; })) captured[id] = true;
            }
            var ids = Object.keys(captured);
            if (ids.length === 1) return ids[0];
            ids.forEach(function (id) { matches[id] = true; });
        }
        var parents = Object.keys(matches);
        // Shared components must not be assigned to an arbitrary parent.
        return parents.length === 1 ? parents[0] : '';
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
            var parentId;
            if (chain[i].parentFields) parentId = this._referencingParentId(parent.table, chain[i].parentFields, childId, setTable, setId);
            else {
                parentId = childRecord ? String(childRecord.getValue(field) || '') : '';
                if (!this._sysId(parentId)) parentId = this._payloadField(childPayload, field).value;
            }
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
        return this._markdownPage(gr, offset);
    },
    getListPage: function () {
        var query = this.getParameter('list_query');
        var offset = Number(this.getParameter('offset') || 0);
        if (query === null || typeof query === 'undefined' || !isFinite(offset) ||
            offset < 0 || offset % this.PAGE_SIZE !== 0) {
            return this._answer({ success: false, error: 'Invalid customer updates list page.' });
        }
        var gr = new GlideRecordSecure('sys_update_xml');
        if (String(query)) gr.addEncodedQuery(String(query));
        return this._markdownPage(gr, offset);
    },
    _isNewUpdate: function (action, payload, capturedAt) {
        var createdAt = this._payloadField(payload, 'sys_created_on').value;
        return action === 'INSERT' || (action === 'INSERT_OR_UPDATE' &&
            (this._payloadField(payload, 'sys_mod_count').value === '0' ||
                (!!createdAt && createdAt === capturedAt)));
    },
    _markdownPage: function (gr, offset) {
        gr.orderByDesc('sys_updated_on');
        gr.orderByDesc('sys_id');
        gr.chooseWindow(offset, offset + this.PAGE_SIZE + 1);
        gr.query();
        var rows = [], rules = this._rules();
        while (gr.next() && rows.length <= this.PAGE_SIZE) {
            var local = String(gr.getValue('update_set') || '');
            var setTable = local ? 'sys_update_set' : 'sys_remote_update_set';
            var setId = local || String(gr.getValue('remote_update_set') || '');
            var target = this._target(gr);
            var updateId = String(gr.getUniqueValue());
            if (!target) {
                rows.push({ table: 'sys_update_xml', id: updateId, type: 'Unresolved Customer Updates',
                    name: String(gr.getValue('target_name') || gr.getValue('name') || updateId),
                    url: this._url('sys_update_xml', updateId), ancestors: [], action: '' });
                continue;
            }
            var action = String(gr.getValue('action') || '');
            var live = this._record(target.table, target.id);
            var grouping = this._ancestors(target.table, target.id, target.payload, rules, setTable, setId);
            rows.push({ table: target.table, id: target.id, type: grouping.type,
                typeOrder: grouping.typeOrder,
                name: this._name(live, target.table, target.id, target.payload, String(gr.getValue('target_name') || '')),
                secondary: this._secondaryValues(live, target.table, target.payload),
                url: live ? this._url(target.table, target.id) : this._url('sys_update_xml', updateId),
                ancestors: grouping.ancestors, action: action, isNew: this._isNewUpdate(action, target.payload, String(gr.getValue('sys_created_on') || '')), updateId: updateId });
        }
        var hasMore = rows.length > this.PAGE_SIZE;
        if (hasMore) rows.pop();
        return this._answer({ success: true, rows: rows, hasMore: hasMore, nextOffset: offset + rows.length });
    },
    _groupPropertyTables: function () {
        var properties = new GlideRecordSecure('sys_properties'), tables = [];
        properties.addQuery('name', 'STARTSWITH', this.GROUPS_PREFIX); properties.query();
        while (properties.next()) tables.push(String(properties.getValue('name')).slice(this.GROUPS_PREFIX.length));
        return tables;
    },
    getRules: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        try {
            var raw = this.getParameter('rules');
            var configs = raw ? JSON.parse(String(raw)) : this._groupConfigs();
            this._validateGroupConfigs(configs);
            return this._answer({ success: true, rules: this._buildGroupRules(configs), config: configs, propertyTables: this._groupPropertyTables() });
        } catch (e) { return this._answer({ success: false, error: e.message || String(e) }); }
    },
    getProperties: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        var gr = new GlideRecordSecure('sys_properties');
        gr.addQuery('name', 'STARTSWITH', 'monaco.plus.');
        gr.orderBy('name');
        gr.query();
        var properties = [];
        while (gr.next()) {
            var name = String(gr.getValue('name') || '');
            if (name === this.RULES_PROPERTY || name.indexOf(this.GROUPS_PREFIX) === 0 ||
                name === this.DISPLAY_PROPERTY || name.indexOf(this.DISPLAY_PROPERTY + '.') === 0) continue;
            properties.push({ name: name,
                value: String(gr.getValue('value') || ''),
                description: String(gr.getValue('description') || ''),
                type: String(gr.getValue('type') || 'string') });
        }
        properties.push({ name: this.DISPLAY_PROPERTY, value: JSON.stringify(this._displayConfigs(), null, 4),
            description: 'Display and secondary fields by table for update set Markdown export.', type: 'string' });
        properties.push({ name: this.RULES_PROPERTY, propertyCount: this._groupPropertyTables().length, value: JSON.stringify(this._groupConfigs(), null, 4),
            description: 'Child tables grouped by parent table in update set Markdown export.', type: 'string' });
        return this._answer({ success: true, properties: properties });
    },
    saveProperty: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        var name = String(this.getParameter('property_name') || '');
        var value = String(this.getParameter('property_value') || '');
        if (name === this.DISPLAY_PROPERTY) return this._saveDisplayConfigs(value);
        if (name.indexOf(this.DISPLAY_PROPERTY + '.') === 0) return this._answer({ success: false, error: 'Use the combined Markdown display editor.' });
        if (value.length > 4000) return this._answer({ success: false, error: 'Property value exceeds 4000 characters.' });
        if (!/^monaco\.plus\.[a-z0-9_.]+$/.test(name)) {
            return this._answer({ success: false, error: 'Invalid Widget Editor+ property.' });
        }
        if (/^monaco\.plus\.(?:code_search\.display_fields\.|assistant\.table_config\.)/.test(name)) {
            return this._answer({ success: false, error: 'Use the table configuration editor.' });
        }
        if (name.indexOf(this.GROUPS_PREFIX) === 0) {
            return this._answer({ success: false, error: 'Use the combined Table hierarchy editor.' });
        }
        if (name === this.RULES_PROPERTY) {
            return this._answer({ success: false, error: 'Edit Table hierarchy with the hierarchy editor.' });
        }
        var property = new GlideRecordSecure('sys_properties');
        if (!property.get('name', name)) {
            return this._answer({ success: false, error: 'Property not found.' });
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
    _ensurePropertyCategory: function (property) {
        var category = new GlideRecordSecure('sys_properties_category');
        if (!category.get('name', 'Widget Editor+')) throw new Error('Widget Editor+ property category is unavailable.');
        var link = new GlideRecordSecure('sys_properties_category_m2m');
        link.addQuery('property', property.getUniqueValue());
        link.addQuery('category', category.getUniqueValue());
        link.setLimit(1); link.query();
        if (link.next()) return;
        link.initialize();
        link.setValue('property', property.getUniqueValue());
        link.setValue('category', category.getUniqueValue());
        link.setValue('order', 100);
        if (!link.insert()) throw new Error('Could not add property to the Widget Editor+ category.');
    },
    _tablePropertyPrefix: function (kind) {
        if (kind === 'markdown_display') return this.DISPLAY_PROPERTY + '.';
        if (kind === 'display_fields') return 'monaco.plus.code_search.display_fields.';
        if (kind === 'table_config') return 'monaco.plus.assistant.table_config.';
        throw new Error('Invalid property family.');
    },
    _requireConfigTable: function (table) {
        if (!this._table(table) || !new GlideRecordSecure('sys_db_object').get('name', table)) {
            throw new Error('Invalid table: ' + table);
        }
    },
    _requireConfigField: function (table, field) {
        if (typeof field !== 'string' || !/^[a-z][a-z0-9_]*$/i.test(field) ||
            !new GlideRecordSecure(table).isValidField(field)) throw new Error('Invalid field: ' + table + '.' + field);
    },
    _validateAssistantConfig: function (table, config) {
        var self = this;
        function object(value, allowed) {
            if (!value || typeof value !== 'object' || Array.isArray(value) ||
                Object.keys(value).some(function (key) { return allowed.indexOf(key) === -1; })) {
                throw new Error('Invalid Assistant configuration schema.');
            }
        }
        object(config, ['rules', 'pickerFields']);
        if (config.pickerFields !== undefined) {
            if (!Array.isArray(config.pickerFields)) throw new Error('pickerFields must be an array.');
            config.pickerFields.forEach(function (field) { self._requireConfigField(table, field); });
        }
        function rules(source, items, depth) {
            if (!Array.isArray(items) || depth > 20) throw new Error('rules and then must be arrays with at most 20 nesting levels.');
            items.forEach(function (rule) {
                var allowed = ['type', 'relatedTable', 'category', 'then'];
                if (rule && rule.type === 'reference_field') allowed = allowed.concat(['sourceField', 'relatedMatchField']);
                else if (rule && rule.type === 'child_reference') allowed.push('relatedField');
                else if (rule && rule.type === 'token') allowed = allowed.concat(['sourceField', 'pattern', 'relatedMatchField']);
                else throw new Error('Invalid rule type.');
                object(rule, allowed);
                self._requireConfigTable(rule.relatedTable);
                if (rule.category !== undefined && typeof rule.category !== 'string') throw new Error('category must be a string.');
                if (rule.type === 'child_reference') self._requireConfigField(rule.relatedTable, rule.relatedField);
                else {
                    var fields = rule.type === 'token' && Array.isArray(rule.sourceField) ? rule.sourceField : [rule.sourceField];
                    if (!fields.length) throw new Error('sourceField must contain a field.');
                    fields.forEach(function (field) { self._requireConfigField(source, field); });
                    self._requireConfigField(rule.relatedTable, rule.relatedMatchField === undefined ? (rule.type === 'token' ? 'name' : 'sys_id') : rule.relatedMatchField);
                    if (rule.type === 'token') {
                        if (typeof rule.pattern !== 'string' || !rule.pattern) throw new Error('pattern must be a non-empty regular expression.');
                        try { new RegExp(rule.pattern); } catch (e) { throw new Error('Invalid token regular expression.'); }
                    }
                }
                if (rule.then !== undefined) rules(rule.relatedTable, rule.then, depth + 1);
            });
        }
        if (config.rules !== undefined) rules(table, config.rules, 1);
    },
    saveTableProperty: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        try {
            var kind = String(this.getParameter('kind') || ''), prefix = this._tablePropertyPrefix(kind);
            var table = String(this.getParameter('table') || '').trim();
            this._requireConfigTable(table);
            var value = String(this.getParameter('property_value') || '');
            var description = String(this.getParameter('description') || '');
            if (value.length > 4000) throw new Error('Property value exceeds 4000 characters.');
            if (kind === 'table_config' && description.length > 512) throw new Error('Description exceeds 512 characters.');
            if (kind === 'display_fields') {
                var self = this, fields = value.split(',').map(function (field) { return field.trim(); });
                fields.forEach(function (field) { self._requireConfigField(table, field); });
                value = fields.filter(function (field, i) { return fields.indexOf(field) === i; }).join(',');
            } else if (kind === 'markdown_display') {
                var display = JSON.parse(value), configs = {};
                if (!display || typeof display.display_value !== 'string' || typeof display.additional_fields !== 'string' ||
                    Object.keys(display).some(function (key) { return key !== 'display_value' && key !== 'additional_fields'; })) throw new Error('Use display_value and additional_fields strings.');
                configs[table] = display;
                var error = this._validateDisplayConfig(configs);
                if (error) throw new Error(error);
                value = JSON.stringify(display, null, 4);
                if (value.length > 4000) throw new Error('Property value exceeds 4000 characters.');
            } else this._validateAssistantConfig(table, JSON.parse(value));
            var name = prefix + table, property = new GlideRecordSecure('sys_properties');
            var exists = property.get('name', name);
            if (!exists) {
                property.initialize(); property.setValue('name', name); property.setValue('type', 'string');
                property.setValue('read_roles', 'sp_admin'); property.setValue('write_roles', 'admin');
                property.setValue('ignore_cache', true);
            }
            if (kind === 'table_config') property.setValue('description', description);
            property.setValue('value', value);
            if (!(exists ? property.update() : property.insert())) throw new Error('Could not save property.');
            this._ensurePropertyCategory(property);
            gs.setProperty(name, value);
            if (kind === 'markdown_display') this._removeLegacyDisplayTable(table);
            return this._answer({ success: true, value: value });
        } catch (e) { return this._answer({ success: false, error: e.message || String(e) }); }
    },
    deleteTableProperty: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        try {
            var prefix = this._tablePropertyPrefix(String(this.getParameter('kind') || ''));
            var table = String(this.getParameter('table') || '');
            if (!this._table(table)) throw new Error('Invalid table name.');
            this._deleteConfigProperty(prefix + table);
            if (prefix === this.DISPLAY_PROPERTY + '.') this._removeLegacyDisplayTable(table);
            return this._answer({ success: true });
        } catch (e) { return this._answer({ success: false, error: e.message || String(e) }); }
    },
    _deleteConfigProperty: function (name) {
        var property = new GlideRecordSecure('sys_properties');
        if (property.get('name', name) && !property.deleteRecord()) throw new Error('Could not delete property: ' + name);
    },
    _validateGroupConfigs: function (configs) {
        if (!configs || typeof configs !== 'object' || Array.isArray(configs)) {
            throw new Error('Use a JSON object mapping parent tables to arrays of child table names.');
        }
        Object.keys(configs).forEach(function (table) {
            if (!/^[a-z][a-z0-9_]*$/i.test(table) || !Array.isArray(configs[table]) ||
                configs[table].some(function (child) { return typeof child !== 'string' || !/^[a-z][a-z0-9_]*$/i.test(child); })) {
                throw new Error('Use a JSON object mapping parent tables to arrays of child table names.');
            }
            if (JSON.stringify(configs[table], null, 4).length > 4000) {
                throw new Error('Property for ' + table + ' exceeds 4000 characters.');
            }
        });
    },
    _writeGroupProperty: function (name, value) {
        if (!value) { this._deleteConfigProperty(name); return; }
        var property = new GlideRecordSecure('sys_properties');
        if (!property.get('name', name)) {
            // Removed/empty groups must never create a property for a leaf table.
            if (!value) return;
            property.initialize();
            property.setValue('name', name);
            property.setValue('type', 'string');
            property.setValue('read_roles', 'sp_admin');
            property.setValue('write_roles', 'admin');
            property.setValue('ignore_cache', true);
            property.setValue('description', 'Child tables grouped under ' + name.slice(this.GROUPS_PREFIX.length) + ' in update set Markdown export.');
            property.setValue('value', value);
            if (!property.insert()) throw new Error('Could not create property: ' + name);
        }
        this._ensurePropertyCategory(property);
        gs.setProperty(name, value);
    },
    saveRules: function () {
        if (!gs.hasRole('admin')) return this._answer({ success: false, error: 'Admin role required.' });
        try {
            var configs = JSON.parse(String(this.getParameter('rules') || ''));
            this._validateGroupConfigs(configs);
            this._buildGroupRules(configs);
            // Validate the entire edit before writing any individual property.
            var existing = new GlideRecordSecure('sys_properties'), names = {}, self = this;
            existing.addQuery('name', 'STARTSWITH', this.GROUPS_PREFIX);
            existing.query();
            while (existing.next()) names[String(existing.getValue('name'))] = true;
            Object.keys(configs).forEach(function (table) {
                if (configs[table].length) names[self.GROUPS_PREFIX + table] = true;
            });
            Object.keys(names).forEach(function (name) {
                var children = configs[name.slice(self.GROUPS_PREFIX.length)];
                self._writeGroupProperty(name, children && children.length ? JSON.stringify(children, null, 4) : '');
            });
            return this._answer({ success: true });
        } catch (e) { return this._answer({ success: false, error: e.message || String(e) }); }
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
