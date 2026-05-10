var WidgetEditorAjax = Class.create();
WidgetEditorAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    RECORD_LIMIT: 999,

    ALLOWED_WIDGET_FIELDS: [
        'name',
        'id',
        'description',
        'controller_as',
        'public',
        'roles',
        'template',
        'css',
        'client_script',
        'script',
        'link',
    ],

    ADDITIONAL_WIDGET_FIELDS_PROPERTY: 'monaco.plus.widget.fields',
    DEPRECATED_WIDGET_PROPERTY: 'monaco.plus.widget.deprecated',
    RELATED_LIST_EXCLUSIONS_PROPERTY: 'monaco.plus.widget.related_list_exclusions',

    RELATED_CELL_MAX_LENGTH: 100,

    ////////////////////////////////////////////////////////////
    // Widget
    ////////////////////////////////////////////////////////////

    /**
     * Returns the name of a single sp_widget record.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, name: string}} Return value.
     */
    getWidgetName: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({ success: false, name: '' });
        }
        var gr = new GlideRecordSecure('sp_widget');
        if (!gr.get(sysId)) {
            return this._answer({ success: false, name: '' });
        }
        return this._answer({ success: true, name: gr.getValue('name') || '' });
    },

    /**
     * Returns a list of sp_widget records, optionally filtered by name or id.
     * Accepts `search` (optional substring to filter by name or id).
     * @returns {{success: boolean, widgets: Array.<{sys_id: string, name: string, id: string}>}} Return value.
     */
    getWidgets: function () {
        var search = this.getParameter('search') || '';
        var widgets = [];
        var gr = new GlideRecordSecure('sp_widget');
        if (search) {
            var q = gr.addQuery('name', 'CONTAINS', search);
            q.addOrCondition('id', 'CONTAINS', search);
        }
        gr.orderBy('name');
        gr.setLimit(this.RECORD_LIMIT);
        gr.query();
        while (gr.next()) {
            widgets.push({
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name'),
                id: gr.getValue('id'),
            });
        }
        return this._answer({
            success: true,
            widgets: widgets,
        });
    },

    /**
     * Returns the full field set for a single sp_widget record, including ES12 state,
     * write access flags, and the earliest update-version origin info.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, widget: {sys_id: string, name: string, id: string,
     *   description: string, controller_as: string, application: string,
     *   application_sys_id: string, is_public: boolean, roles: string, template: string,
     *   css: string, client_script: string, script: string, link: string, es12: boolean,
     *   es12_record_exists: boolean, sys_updated_on: string, sys_updated_by: string,
     *   canWrite: boolean, scope_mismatch: boolean,
     *   widgetOrigin: {created_on: string, founder: string}|null,
     *   sys_policy: string, sys_policy_display: string, servicenow: boolean,
     *   volatility_level: string, volatility_level_display: string,
     *   deprecated: boolean,
     *   update_set_mismatch: boolean, widget_update_set_id: string,
     *   widget_update_set_name: string}}} Return value.
     */
    getWidget: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var gr = new GlideRecordSecure('sp_widget');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Widget not found',
            });
        }

        var es12 = false;
        var es12RecordExists = false;
        var esGr = new GlideRecordSecure('sys_es_latest_script');
        esGr.addQuery('id', sysId);
        esGr.query();
        if (esGr.next()) {
            es12RecordExists = true;
            es12 = esGr.getValue('use_es_latest') == '1';
        }

        var widgetScopeId = gr.getValue('sys_scope');
        var currentAppId = gs.getCurrentApplicationId();
        var canWrite = gr.canWrite();
        var scopeMismatch = widgetScopeId !== currentAppId;
        var isDeprecated = this._isDeprecatedWidget(gr);

        // sys_policy + servicenow
        var sysPolicy = gr.getValue('sys_policy') || '';
        var sysPolicyDisplay = sysPolicy
            ? gr.getDisplayValue('sys_policy')
            : '';
        var isServiceNow = gr.getValue('servicenow') == '1';

        // Oldest sys_update_version for this widget → "est. year" + founder name
        var widgetOrigin = null;
        var ovGr = new GlideRecordSecure('sys_update_version');
        ovGr.addQuery('name', 'sp_widget_' + sysId);
        ovGr.orderBy('sys_created_on');
        ovGr.setLimit(1);
        ovGr.query();
        if (ovGr.next()) {
            var originCreatedOn = ovGr.getValue('sys_created_on'); // UTC "YYYY-MM-DD HH:MM:SS"
            var originUser = ovGr.getValue('sys_created_by');
            var originDisplay = originUser;
            var uGr = new GlideRecordSecure('sys_user');
            uGr.addQuery('user_name', originUser);
            uGr.setLimit(1);
            uGr.query();
            if (uGr.next()) originDisplay = uGr.getDisplayValue('name');
            widgetOrigin = {
                created_on: originCreatedOn,
                founder: originDisplay,
            };
        }

        // Volatility risk
        var widgetVolLevel = '';
        var widgetVolDisplay = '';
        var widgetVolGr = new GlideRecordSecure('sys_metadata_volatility');
        widgetVolGr.addQuery('sys_update_name', 'sp_widget_' + sysId);
        widgetVolGr.setLimit(1);
        widgetVolGr.query();
        if (widgetVolGr.next()) {
            widgetVolLevel = widgetVolGr.getValue('volatility_level') || '';
            widgetVolDisplay = widgetVolLevel
                ? widgetVolGr.getDisplayValue('volatility_level')
                : '';
        }

        // Update set mismatch — only flag if widget's update set is still in progress
        var widgetUpdateSetId = '';
        var widgetUpdateSetName = '';
        var updateSetMismatch = false;
        var uxGr = new GlideRecordSecure('sys_update_xml');
        uxGr.addQuery('name', 'sp_widget_' + sysId);
        uxGr.orderByDesc('sys_created_on');
        uxGr.setLimit(1);
        uxGr.query();
        if (uxGr.next()) {
            var uxSetId = uxGr.getValue('update_set');
            var usGr = new GlideRecordSecure('sys_update_set');
            if (usGr.get(uxSetId) && usGr.getValue('state') === 'in progress') {
                widgetUpdateSetId = uxSetId;
                widgetUpdateSetName = usGr.getDisplayValue('name');
                var currentUpdateSetId = gs.getPreference('sys_update_set');
                updateSetMismatch = widgetUpdateSetId !== currentUpdateSetId;
            }
        }

        var additionalDefs = this._getAdditionalWidgetFieldDefs(gr);

        var widget = {
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('name'),
            id: gr.getValue('id'),
            description: gr.getValue('description'),
            controller_as: gr.getValue('controller_as') || 'c',
            application: gr.getDisplayValue('sys_scope'),
            application_sys_id: widgetScopeId,
            is_public: gr.getValue('public') == '1',
            roles: gr.getValue('roles') || '',
            template: gr.getValue('template') || '',
            css: gr.getValue('css') || '',
            client_script: gr.getValue('client_script') || '',
            script: gr.getValue('script') || '',
            link: gr.getValue('link') || '',
            es12: es12,
            es12_record_exists: es12RecordExists,
            sys_updated_on: gr.getValue('sys_updated_on') || '',
            sys_updated_by: gr.getValue('sys_updated_by') || '',
            canWrite: canWrite,
            scope_mismatch: scopeMismatch,
            widgetOrigin: widgetOrigin,
            sys_policy: sysPolicy,
            sys_policy_display: sysPolicyDisplay,
            servicenow: isServiceNow,
            volatility_level: widgetVolLevel,
            volatility_level_display: widgetVolDisplay,
            deprecated: isDeprecated,
            update_set_mismatch: updateSetMismatch,
            widget_update_set_id: widgetUpdateSetId,
            widget_update_set_name: widgetUpdateSetName,
        };

        for (var ai = 0; ai < additionalDefs.length; ai++) {
            var addDef = additionalDefs[ai];
            var addVal = gr.getValue(addDef.name);
            if (addDef.type === 'boolean') {
                widget[addDef.name] = addVal == '1';
            } else {
                widget[addDef.name] = addVal || '';
            }
        }

        return this._answer({
            success: true,
            widget: widget,
            additional_widget_fields: additionalDefs,
        });
    },

    /**
     * Returns the name and sys_id of every active sys_script_include record.
     * Used to populate the "new ClassName()" IntelliSense name map.
     * @returns {{success: boolean, includes: Array.<{name: string, sys_id: string}>}} Return value.
     */
    getScriptIncludeNames: function () {
        var result = [];
        var gr = new GlideRecordSecure('sys_script_include');
        gr.addActiveQuery();
        gr.orderBy('name');
        gr.query();
        while (gr.next()) {
            result.push({
                name: gr.getValue('name'),
                sys_id: gr.getUniqueValue(),
            });
        }
        return this._answer({ success: true, includes: result });
    },

    /**
     * Returns all active syntax_editor_macro records for use as Monaco snippet completions.
     * @returns {{success: boolean, macros: Array.<{name: string, comments: string, script: string}>}} Return value.
     */
    getMacros: function () {
        var result = [];
        try {
            var gr = new GlideRecordSecure('syntax_editor_macro');
            gr.addActiveQuery();
            gr.orderBy('name');
            gr.query();
            while (gr.next()) {
                var script = gr.getValue('text') || '';
                if (!script) {
                    continue;
                }
                result.push({
                    name: gr.getValue('name') || '',
                    comments: gr.getValue('comments') || '',
                    script: script,
                });
            }
        } catch (e) {}
        return this._answer({ success: true, macros: result });
    },

    /**
     * Creates or updates an sp_widget record. Omit sys_id to create a new widget.
     * Only fields present in the allowed list (name, id, description, public, roles,
     * template, css, client_script, script, link) are written.
     * Accepts `sys_id` (optional, omit to create) and `data` (JSON-encoded field values to write).
     * @returns {{success: boolean, sys_id: string, sys_updated_on: string,
     *   sys_mod_count: string, update_set_sys_id: string|null, update_set_name: string|null}} Return value.
     */
    saveWidget: function () {
        var sysId = this.getParameter('sys_id');
        var data;

        try {
            data = JSON.parse(this.getParameter('data') || '{}');
        } catch (e) {
            // Invalid JSON
            return this._answer({
                success: false,
                error: 'Invalid JSON',
            });
        }

        var gr = new GlideRecordSecure('sp_widget');
        var isNew = !sysId;
        if (isNew) {
            gr.initialize();
        } else {
            if (!gr.get(sysId)) {
                return this._answer({
                    success: false,
                    error: 'Widget not found',
                });
            }
        }

        var allowed = this._getAllowedWidgetFields();
        for (var i = 0; i < allowed.length; i++) {
            var f = allowed[i];
            if (data[f] !== undefined) {
                this._setWidgetFieldValue(gr, f, data[f]);
            }
        }

        var resultId;
        if (isNew) {
            resultId = gr.insert();
            if (!resultId) {
                return this._answer({
                    success: false,
                    error: 'Failed to create widget. Check write permissions.',
                });
            }
            resultId = resultId + '';
        } else {
            if (!gr.update()) {
                return this._answer({
                    success: false,
                    error: 'Save failed. You may not have write access to this record.',
                });
            }
            resultId = sysId;
        }
        // Re-read after update so the returned sys_updated_on reflects what the DB committed
        // (AJAX processor context may suppress auto-sys-field updates until commit).
        gr.get(resultId);
        var updateSetSysId = null;
        var updateSetName = null;
        try {
            var usId = new global.GlideUpdateSet().get();
            if (usId) {
                var usGr = new GlideRecordSecure('sys_update_set');
                if (usGr.get(usId)) {
                    updateSetSysId = usGr.getUniqueValue();
                    updateSetName = usGr.getValue('name');
                }
            }
        } catch (e) {}
        return this._answer({
            success: true,
            sys_id: resultId,
            sys_updated_on: gr.getValue('sys_updated_on') || '',
            sys_mod_count: gr.getValue('sys_mod_count') || '',
            update_set_sys_id: updateSetSysId,
            update_set_name: updateSetName,
        });
    },

    /**
     * Saves a single allowed field on an sp_widget record.
     * Accepts `sys_id` (sp_widget sys_id), `field` (name to update, must be in the allowed list),
     * and `value` (new field value).
     * @returns {{success: boolean, sys_updated_on: string, sys_mod_count: string}} Return value.
     */
    saveField: function () {
        var sysId = this.getParameter('sys_id');
        var field = String(this.getParameter('field'));
        var value = this.getParameter('value');
        if (!sysId || !field) {
            return this._answer({
                success: false,
                error: 'Missing params',
            });
        }

        var allowed = this._getAllowedWidgetFields();
        if (allowed.indexOf(field) === -1) {
            return this._answer({
                success: false,
                error: 'Field not allowed: ' + field,
            });
        }

        var gr = new GlideRecordSecure('sp_widget');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Widget not found',
            });
        }

        this._setWidgetFieldValue(gr, field, value);
        gr.setValue(
            'sys_mod_count',
            parseInt(gr.getValue('sys_mod_count') || '0', 10) + 1
        );
        if (!gr.update()) {
            return this._answer({
                success: false,
                error: 'Save failed. You may not have write access to this record.',
            });
        }
        // Re-read so returned sys_updated_on reflects the committed value.
        gr.get(sysId);
        return this._answer({
            success: true,
            sys_updated_on: gr.getValue('sys_updated_on') || '',
            sys_mod_count: gr.getValue('sys_mod_count') || '',
        });
    },

    ////////////////////////////////////////////////////////////
    // Versions
    ////////////////////////////////////////////////////////////

    /**
     * Returns all sys_update_version records for a given widget, ordered newest-first.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, versions: Array.<{sys_id: string, sys_created_on: string,
     *   sys_created_by: string, update_set_name: string, update_set_sys_id: string,
     *   update_set_state: string, update_set_state_label: string, state: string}>}} Return value.
     */
    getVersions: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var versions = [];
        var gr = new GlideRecordSecure('sys_update_version');
        gr.addQuery('name', 'sp_widget_' + sysId);
        gr.addExtraField('source.name');
        gr.addExtraField('source.state');
        gr.orderByDesc('sys_created_on');
        gr.setLimit(this.RECORD_LIMIT);
        gr.query();

        while (gr.next()) {
            versions.push({
                sys_id: gr.getUniqueValue(),
                sys_created_on: gr.getValue('sys_created_on'),
                sys_created_by: gr.getValue('sys_created_by'),
                update_set_name: gr.source.name.getValue(),
                update_set_sys_id:
                    gr.getValue('source') || gr.source.sys_id.getValue(),
                update_set_state: gr.source.state.getValue(),
                update_set_state_label: gr.source.state.getDisplayValue(),
                state: gr.getValue('state'),
            });
        }
        return this._answer({
            success: true,
            versions: versions,
        });
    },

    /**
     * Returns the metadata and parsed field values for a single sys_update_version record.
     * Accepts `version_id` (sys_update_version sys_id).
     * @returns {{success: boolean, sys_created_on: string, sys_created_by: string,
     *   update_set_name: string, update_set_sys_id: string,
     *   fields: {template: string, css: string, client_script: string, script: string,
     *   link: string, name: string, id: string, description: string,
     *   public: string, roles: string}}} Return value.
     */
    getVersion: function () {
        var versionId = this.getParameter('version_id');
        if (!versionId) {
            return this._answer({
                success: false,
                error: 'No version_id provided',
            });
        }

        var gr = new GlideRecordSecure('sys_update_version');
        if (!gr.get(versionId)) {
            return this._answer({
                success: false,
                error: 'Version not found',
            });
        }

        return this._answer({
            success: true,
            sys_created_on: gr.getValue('sys_created_on'),
            sys_created_by: gr.getValue('sys_created_by'),
            update_set_name: gr.source.name.getValue(),
            update_set_sys_id:
                gr.getValue('source') || gr.source.sys_id.getValue(),
            fields: this._parseVersionPayload(gr.getValue('payload')),
        });
    },

    ////////////////////////////////////////////////////////////
    // Generic Diff support
    ////////////////////////////////////////////////////////////

    // Tables allowed for comparison. Empty array = all valid tables allowed.
    DIFF_ALLOWED_TABLES: [],

    /**
     * Returns ordered field definitions for the diff page, based on the table's Default view.
     * Always validates the table against DIFF_ALLOWED_TABLES.
     * Accepts `table` (ServiceNow table name).
     * @returns {{success: boolean, fields: Array.<{key: string, label: string, type: string,
     *   max_length: number, reference: string, renderAs: string, language: string}>,
     *   table_label: string}} Return value.
     */
    getDiffFieldDefs: function () {
        var table = String(this.getParameter('table') || 'sp_widget');
        if (
            this.DIFF_ALLOWED_TABLES.length > 0 &&
            this.DIFF_ALLOWED_TABLES.indexOf(table) === -1
        ) {
            return this._answer({
                success: false,
                error: 'Table not allowed: ' + table,
            });
        }

        var synchGr = new GlideRecord('sys_dictionary');
        synchGr.addQuery('name', table);
        synchGr.addQuery('internal_type', 'collection');
        synchGr.addQuery('attributes', 'CONTAINS', 'update_synch=true');
        synchGr.setLimit(1);
        synchGr.query();
        if (!synchGr.next()) {
            var labelGr = new GlideRecord('sys_db_object');
            var noSynchLabel = labelGr.get('name', table) ? (labelGr.getDisplayValue('label') || table) : table;
            return this._answer({
                success: false,
                error: 'Table does not track versions',
                table_label: noSynchLabel,
            });
        }

        // Get ordered field names from sys_ui_element for the Default view
        var fieldNames = [];
        var ueGr = new GlideRecordSecure('sys_ui_element');
        ueGr.addQuery('sys_ui_section.name', table);
        ueGr.addQuery('sys_ui_section.view', 'Default view');
        ueGr.addQuery('type', '');
        ueGr.orderBy('position');
        ueGr.query();
        while (ueGr.next()) {
            var elem = ueGr.getValue('element');
            if (elem && fieldNames.indexOf(elem) === -1) {
                fieldNames.push(elem);
            }
        }

        if (fieldNames.length === 0) {
            return this._answer({
                success: false,
                error: 'No Default view fields found for table: ' + table,
            });
        }

        // Get dictionary metadata for all non-collection fields on this table
        // (covers both layout fields and potential extras in one query).
        var dictMap = {};
        var dictGr = new GlideRecordSecure('sys_dictionary');
        dictGr.addQuery('name', table);
        dictGr.addNotNullQuery('element');
        dictGr.addQuery('internal_type', '!=', 'collection');
        dictGr.orderBy('element');
        dictGr.query();
        while (dictGr.next()) {
            var dElem = dictGr.getValue('element');
            if (!dElem) {
                continue;
            }
            dictMap[dElem] = {
                type: dictGr.getValue('internal_type') || 'string',
                max_length:
                    parseInt(dictGr.getValue('max_length') || '0', 10) || 0,
                reference: dictGr.getValue('reference') || '',
                choice: parseInt(dictGr.getValue('choice') || '0', 10) || 0,
            };
        }

        // Get field labels via GlideElement.getLabel() on a temporary record
        var demoGr = new GlideRecordSecure(table);
        demoGr.initialize();

        var CODE_TYPES = [
            'script',
            'script_plain',
            'css',
            'html',
            'html_template',
            'xml',
            'json',
        ];

        // Helper: build a single field-def object from a name + dict entry.
        var _buildDef = function (fname, dict) {
            var fieldType = dict.type || 'string';
            var maxLen = dict.max_length || 0;
            var refTable = dict.reference || '';
            var label = fname;
            try {
                label = demoGr[fname].getLabel() || fname;
            } catch (e) {}
            var renderAs = 'text';
            if (fieldType === 'boolean') {
                renderAs = 'boolean';
            } else if (CODE_TYPES.indexOf(fieldType) !== -1) {
                renderAs = 'code';
            } else if (fieldType === 'reference') {
                renderAs = 'reference';
            } else if (fieldType === 'user_image') {
                renderAs = 'image';
            } else if (dict.choice > 0) {
                renderAs = 'choice';
            } else if (fieldType === 'properties' || (fieldType === 'string' && maxLen > 100)) {
                renderAs = 'textarea';
            }
            var language = 'plaintext';
            if (fieldType === 'css') {
                language = 'css';
            } else if (fieldType === 'html' || fieldType === 'html_template') {
                language = 'html';
            } else if (fieldType === 'json') {
                language = 'json';
            } else if (
                fieldType === 'script' ||
                fieldType === 'script_plain' ||
                fieldType === 'xml'
            ) {
                language = 'javascript';
            }
            return {
                key: fname,
                label: label,
                type: fieldType,
                max_length: maxLen,
                reference: refTable,
                renderAs: renderAs,
                language: language,
            };
        };

        // Build ordered field defs for the Default-view layout fields.
        var fieldDefs = [];
        for (var i = 0; i < fieldNames.length; i++) {
            var fname = fieldNames[i];
            fieldDefs.push(_buildDef(fname, dictMap[fname] || {}));
        }

        // Build extra field defs: all fields NOT in the layout and NOT system metadata.
        var SYS_SKIP_FIELDS = [
            'sys_id',
            'sys_created_on',
            'sys_created_by',
            'sys_updated_on',
            'sys_updated_by',
            'sys_mod_count',
            'sys_tags',
            'sys_class_name',
            'sys_package',
            'sys_policy',
            'sys_replace_on_upgrade',
            'sys_scope',
            'sys_overrides',
            'sys_customer_update',
            'sys_domain',
            'sys_domain_path',
            'sys_view',
        ];
        var layoutKeySet = {};
        for (var li = 0; li < fieldNames.length; li++) {
            layoutKeySet[fieldNames[li]] = true;
        }

        var extraFieldDefs = [];
        var allElemKeys = Object.keys(dictMap).sort();
        for (var ei = 0; ei < allElemKeys.length; ei++) {
            var eKey = allElemKeys[ei];
            if (layoutKeySet[eKey]) {
                continue;
            }
            if (SYS_SKIP_FIELDS.indexOf(eKey) !== -1) {
                continue;
            }
            extraFieldDefs.push(_buildDef(eKey, dictMap[eKey]));
        }

        var tableLabel = '';
        try {
            tableLabel = demoGr.getClassDisplayValue() || table;
        } catch (e) {
            tableLabel = table;
        }

        return this._answer({
            success: true,
            fields: fieldDefs,
            extra_fields: extraFieldDefs,
            table_label: tableLabel,
        });
    },

    /**
     * Returns the list of tables available for diff comparison.
     * If DIFF_ALLOWED_TABLES is non-empty, returns only those tables filtered by search.
     * Otherwise searches sys_db_object for tables whose label or name contains the search term.
     * Accepts `search` (optional substring to filter by table label or name).
     * @returns {{success: boolean, tables: Array.<{name: string, label: string}>}} Return value.
     */
    getTablesForDiff: function() {
        var search   = String(this.getParameter('search') || '').toLowerCase();
        var page     = parseInt(this.getParameter('page') || '1', 10) || 1;
        var pageSize = 50;
        var results  = [];
        var allowed  = this.DIFF_ALLOWED_TABLES;

        if (allowed.length > 0) {
            for (var i = 0; i < allowed.length; i++) {
                var tableName = allowed[i];
                var dictGr = new GlideRecord('sys_dictionary');
                dictGr.addQuery('name', tableName);
                dictGr.addQuery('internal_type', 'collection');
                dictGr.addQuery('attributes', 'CONTAINS', 'update_synch=true');
                dictGr.setLimit(1);
                dictGr.query();
                if (!dictGr.next()) { continue; }
                var labelGr = new GlideRecord('sys_db_object');
                var label = labelGr.get('name', tableName) ? (labelGr.getDisplayValue('label') || tableName) : tableName;
                if (!search || label.toLowerCase().indexOf(search) !== -1 || tableName.toLowerCase().indexOf(search) !== -1) {
                    results.push({ name: tableName, label: label });
                }
            }
            var offset = (page - 1) * pageSize;
            var hasMore = results.length > offset + pageSize;
            results = results.slice(offset, offset + pageSize);
        } else {
            var offset = (page - 1) * pageSize;
            var dbGr = new GlideRecordSecure('sys_db_object');
            var joinGr = dbGr.addJoinQuery('sys_dictionary', 'name', 'name');
            joinGr.addCondition('internal_type', 'collection');
            joinGr.addCondition('attributes', 'CONTAINS', 'update_synch=true');
            if (search) {
                var qc = dbGr.addQuery('label', 'CONTAINS', search);
                qc.addOrCondition('name', 'CONTAINS', search);
            }
            dbGr.orderBy('label');
            dbGr.chooseWindow(offset, offset + pageSize + 1);
            dbGr.query();
            while (dbGr.next()) {
                results.push({
                    name: dbGr.getValue('name'),
                    label: dbGr.getDisplayValue('label') || dbGr.getValue('name')
                });
            }
            var hasMore = results.length > pageSize;
            if (hasMore) { results.pop(); }
        }

        return this._answer({ success: true, tables: results, has_more: hasMore });
    },

    /**
     * Returns the current field values for a single record on any allowed table.
     * Also returns metadata (name, canWrite, sys_policy, update set).
     * Accepts `table` (ServiceNow table name) and `record_id` (sys_id of the record).
     * @returns {{success: boolean, record: {sys_id: string, name: string, values: Object,
     *   sys_updated_on: string, sys_updated_by: string, canWrite: boolean,
     *   sys_policy: string, sys_policy_display: string,
     *   update_set_sys_id: string, update_set_name: string}}} Return value.
     */
    getRecordForDiff: function () {
        var table = String(this.getParameter('table') || 'sp_widget');
        var recordId = String(this.getParameter('record_id') || '');
        if (
            this.DIFF_ALLOWED_TABLES.length > 0 &&
            this.DIFF_ALLOWED_TABLES.indexOf(table) === -1
        ) {
            return this._answer({
                success: false,
                error: 'Table not allowed: ' + table,
            });
        }
        if (!recordId) {
            return this._answer({
                success: false,
                error: 'No record_id provided',
            });
        }

        var gr = new GlideRecordSecure(table);
        if (!gr.get(recordId)) {
            return this._answer({
                success: false,
                error:
                    'Record not found or access denied (' +
                    table +
                    ': ' +
                    recordId +
                    ')',
            });
        }

        // Collect all field values via sys_dictionary
        var values = {};
        var displayValues = {};
        var fdGr = new GlideRecordSecure('sys_dictionary');
        fdGr.addQuery('name', table);
        fdGr.addNotNullQuery('element');
        fdGr.addQuery('internal_type', '!=', 'collection');
        fdGr.query();
        while (fdGr.next()) {
            var fName = fdGr.getValue('element');
            if (!fName) {
                continue;
            }
            try {
                var v = gr.getValue(fName);
                values[fName] = (v !== null && v !== undefined) ? v : null;
                var fType = fdGr.getValue('internal_type');
                var fChoice = parseInt(fdGr.getValue('choice') || '0', 10) || 0;
                if (fType === 'reference' || fChoice > 0) {
                    displayValues[fName] = gr.getDisplayValue(fName) || '';
                }
            } catch (e) {}
        }

        // sp_widget compatibility: expose is_public
        if (table === 'sp_widget') {
            values['is_public'] = gr.getValue('public') == '1';
        }

        var sysPolicy = gr.getValue('sys_policy') || '';
        var sysPolicyDisplay = sysPolicy
            ? gr.getDisplayValue('sys_policy')
            : '';

        // Find latest update set via sys_update_xml
        var ussId = '',
            ussName = '';
        var uxGr = new GlideRecordSecure('sys_update_xml');
        uxGr.addQuery('name', table + '_' + recordId);
        uxGr.orderByDesc('sys_created_on');
        uxGr.setLimit(1);
        uxGr.query();
        if (uxGr.next()) {
            var setId = uxGr.getValue('update_set');
            var usGr = new GlideRecordSecure('sys_update_set');
            if (usGr.get(setId)) {
                ussId = usGr.getUniqueValue();
                ussName = usGr.getValue('name');
            }
        }

        return this._answer({
            success: true,
            record: {
                sys_id: gr.getUniqueValue(),
                name: gr.getDisplayValue() || '',
                values: values,
                display_values: displayValues,
                sys_updated_on: gr.getValue('sys_updated_on') || '',
                sys_updated_by: gr.getValue('sys_updated_by') || '',
                canWrite: gr.canWrite(),
                sys_policy: sysPolicy,
                sys_policy_display: sysPolicyDisplay,
                update_set_sys_id: ussId,
                update_set_name: ussName,
            },
        });
    },

    /**
     * Returns a list of records from any allowed table for the compare picker.
     * Accepts `table` (ServiceNow table name) and `search` (optional substring to filter by name).
     * @returns {{success: boolean, records: Array.<{sys_id: string, name: string}>}} Return value.
     */
    getRecordsForTable: function () {
        var table    = String(this.getParameter('table') || 'sp_widget');
        var search   = String(this.getParameter('search') || '');
        var page     = parseInt(this.getParameter('page') || '1', 10) || 1;
        var pageSize = 50;
        if (
            this.DIFF_ALLOWED_TABLES.length > 0 &&
            this.DIFF_ALLOWED_TABLES.indexOf(table) === -1
        ) {
            return this._answer({
                success: false,
                error: 'Table not allowed: ' + table,
            });
        }

        var offset = (page - 1) * pageSize;
        var gr = new GlideRecordSecure(table);
        if (search) {
            gr.addQuery('name', 'CONTAINS', search);
        }
        gr.orderBy('name');
        gr.chooseWindow(offset, offset + pageSize + 1);
        gr.query();

        var records = [];
        while (gr.next()) {
            records.push({
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name') || gr.getDisplayValue(),
            });
        }
        var hasMore = records.length > pageSize;
        if (hasMore) { records.pop(); }
        return this._answer({ success: true, records: records, has_more: hasMore });
    },

    /**
     * Returns the version history for a record on any allowed table, ordered newest-first.
     * Uses sys_update_version where name = '<table>_<record_id>'.
     * Accepts `table` (ServiceNow table name) and `record_id` (sys_id of the record).
     * @returns {{success: boolean, versions: Array.<{sys_id: string, sys_created_on: string,
     *   sys_created_by: string, update_set_name: string, update_set_sys_id: string,
     *   update_set_state: string, update_set_state_label: string, state: string}>}} Return value.
     */
    getVersionsForTable: function () {
        var table = String(this.getParameter('table') || 'sp_widget');
        var recordId = String(this.getParameter('record_id') || '');
        if (
            this.DIFF_ALLOWED_TABLES.length > 0 &&
            this.DIFF_ALLOWED_TABLES.indexOf(table) === -1
        ) {
            return this._answer({
                success: false,
                error: 'Table not allowed: ' + table,
            });
        }
        if (!recordId) {
            return this._answer({
                success: false,
                error: 'No record_id provided',
            });
        }

        var versions = [];
        var gr = new GlideRecordSecure('sys_update_version');
        gr.addQuery('name', table + '_' + recordId);
        gr.addExtraField('source.name');
        gr.addExtraField('source.state');
        gr.orderByDesc('sys_created_on');
        gr.setLimit(this.RECORD_LIMIT);
        gr.query();
        while (gr.next()) {
            versions.push({
                sys_id: gr.getUniqueValue(),
                sys_created_on: gr.getValue('sys_created_on'),
                sys_created_by: gr.getValue('sys_created_by'),
                update_set_name: gr.source.name.getValue(),
                update_set_sys_id:
                    gr.getValue('source') || gr.source.sys_id.getValue(),
                update_set_state: gr.source.state.getValue(),
                update_set_state_label: gr.source.state.getDisplayValue(),
                state: gr.getValue('state'),
            });
        }
        return this._answer({ success: true, versions: versions });
    },

    /**
     * Returns the metadata and all field values for a single sys_update_version record.
     * Parses all field elements from the XML payload without requiring a predefined list.
     * Accepts `version_id` (sys_update_version sys_id).
     * @returns {{success: boolean, sys_created_on: string, sys_created_by: string,
     *   update_set_name: string, update_set_sys_id: string,
     *   fields: Object.<string, string>}} Return value.
     */
    getVersionForTable: function () {
        var versionId = String(this.getParameter('version_id') || '');
        if (!versionId) {
            return this._answer({
                success: false,
                error: 'No version_id provided',
            });
        }

        var gr = new GlideRecordSecure('sys_update_version');
        if (!gr.get(versionId)) {
            return this._answer({ success: false, error: 'Version not found' });
        }

        var parsed = this._parseVersionPayloadAll(gr.getValue('payload'));
        return this._answer({
            success: true,
            sys_created_on: gr.getValue('sys_created_on'),
            sys_created_by: gr.getValue('sys_created_by'),
            update_set_name: gr.source.name.getValue(),
            update_set_sys_id:
                gr.getValue('source') || gr.source.sys_id.getValue(),
            fields: parsed.fields,
            display_values: parsed.display_values,
        });
    },

    /**
     * Parses all field name/value pairs from a sys_update_version XML payload.
     * Extracts every element at depth 2 (record_update/<table>/<field>).
     * @param {string} payload - Raw XML payload string.
     * @returns {Object} Map of field names to string values.
     */
    _parseVersionPayloadAll: function (payload) {
        var fields = {};
        var displayValues = {};
        if (!payload) {
            return { fields: fields, display_values: displayValues };
        }
        try {
            var xmlDoc = new XMLDocument2();
            xmlDoc.parseXML(payload);
            // Discover the table name from the payload (e.g. "sys_script_include").
            var tableEl = xmlDoc.getFirstNode('/record_update/*');
            if (!tableEl) {
                return { fields: fields, display_values: displayValues };
            }
            var tableName = tableEl.getNodeName();
            if (!tableName) {
                return { fields: fields, display_values: displayValues };
            }
            // Use sys_dictionary to enumerate all field element names for the table,
            // then extract each via getFirstNode('//' + fieldName) — the same proven
            // pattern used by _parseVersionPayload for sp_widget fields.
            var dictGr = new GlideRecordSecure('sys_dictionary');
            dictGr.addQuery('name', tableName);
            dictGr.addNotNullQuery('element');
            dictGr.query();
            while (dictGr.next()) {
                var fieldName = dictGr.getValue('element');
                if (!fieldName) {
                    continue;
                }
                var node = xmlDoc.getFirstNode('//' + fieldName);
                if (node) {
                    fields[fieldName] = node.getTextContent() || '';
                    var dv = node.getAttribute('display_value');
                    if (dv) {
                        displayValues[fieldName] = dv;
                    }
                }
            }
        } catch (e) {
            gs.error(
                'WidgetEditorAjax: _parseVersionPayloadAll error: ' + e.message
            );
        }
        return { fields: fields, display_values: displayValues };
    },

    ////////////////////////////////////////////////////////////
    // Roles lookup
    ////////////////////////////////////////////////////////////

    /**
     * Returns sys_user_role names matching an optional search term. Capped at 100 results.
     * Accepts `term` (optional substring to filter role names).
     * @returns {{success: boolean, roles: Array.<string>}} Return value.
     */
    searchRoles: function () {
        var term = this.getParameter('term') || '';
        var gr = new GlideRecordSecure('sys_user_role');
        if (term) {
            gr.addQuery('name', 'CONTAINS', term);
        }
        gr.orderBy('name');
        gr.setLimit(100);
        gr.query();
        var roles = [];
        while (gr.next()) {
            roles.push(gr.getValue('name'));
        }
        return this._answer({ success: true, roles: roles });
    },

    ////////////////////////////////////////////////////////////
    // Presence
    ////////////////////////////////////////////////////////////

    /**
     * Returns other users currently present on the widget or its related Angular templates
     * and providers, by querying sys_amb_channel_presence across all relevant channels.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, users: Array.<{sys_id: string, name: string,
     *   initials: string, viewing: Array.<string>}>}} Return value.
     */
    getPresence: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var currentUser = gs.getUserID();

        // Build map of channel-prefix → display label.
        // /sn/rp/... = Platform record presence — used by sp_widget.do and widget_editor.do
        //              (via snRecordPresence.initPresence)
        // /sp/rp/... = SP record presence — fallback path if snRecordPresence unavailable
        var channelLabels = {};
        channelLabels['/sn/rp/sp_widget/' + sysId] = 'Widget';
        channelLabels['/sp/rp/sp_widget/' + sysId] = 'Widget';

        var tGr = new GlideRecordSecure('sp_ng_template');
        tGr.addQuery('sp_widget', sysId);
        tGr.query();
        while (tGr.next()) {
            channelLabels['/sp/rp/sp_ng_template/' + tGr.getUniqueValue()] =
                tGr.getValue('id') + ' (Angular template)';
        }

        var m2m = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        m2m.addQuery('sp_widget', sysId);
        m2m.addExtraField('sp_angular_provider.name');
        m2m.query();
        while (m2m.next()) {
            var pId = m2m.getValue('sp_angular_provider');
            if (!pId) {
                continue;
            }
            channelLabels['/sp/rp/sp_angular_provider/' + pId] =
                (m2m.sp_angular_provider.name.getValue() || pId) +
                ' (Angular provider)';
        }

        var channels = Object.keys(channelLabels);

        var pr = new GlideRecordSecure('sys_amb_channel_presence');
        var qc = pr.addQuery('channel_id', 'STARTSWITH', channels[0]);
        for (var i = 1; i < channels.length; i++) {
            qc.addOrCondition('channel_id', 'STARTSWITH', channels[i]);
        }
        pr.addQuery('user', '!=', currentUser);
        pr.query();

        var userMap = {};
        var channelPrefixes = Object.keys(channelLabels);
        while (pr.next()) {
            var userId = pr.getValue('user');
            var channel = pr.getValue('channel_id');
            var label = null;
            for (var pi = 0; pi < channelPrefixes.length; pi++) {
                if (channel.indexOf(channelPrefixes[pi]) === 0) {
                    label = channelLabels[channelPrefixes[pi]];
                    break;
                }
            }
            if (!label) {
                continue;
            }
            if (!userMap[userId]) {
                userMap[userId] = {
                    sys_id: userId,
                    name: userId,
                    initials: '?',
                    viewing: [],
                };
            }
            if (userMap[userId].viewing.indexOf(label) === -1) {
                userMap[userId].viewing.push(label);
            }
        }

        var userIds = [];
        for (var k in userMap) {
            if (userMap.hasOwnProperty(k)) userIds.push(k);
        }
        if (userIds.length > 0) {
            var uGr = new GlideRecordSecure('sys_user');
            uGr.addQuery('sys_id', 'IN', userIds.join(','));
            uGr.query();
            while (uGr.next()) {
                var uid = uGr.getUniqueValue();
                if (userMap[uid]) {
                    var displayName = uGr.getDisplayValue('name');
                    userMap[uid].name = displayName;
                    userMap[uid].initials = this._getInitials(displayName);
                }
            }
            /* Drop entries whose sys_user record was not found */
            for (var di = 0; di < userIds.length; di++) {
                if (
                    userMap[userIds[di]] &&
                    userMap[userIds[di]].name === userIds[di]
                ) {
                    delete userMap[userIds[di]];
                }
            }
        }

        var users = [];
        for (var uid2 in userMap) {
            if (userMap.hasOwnProperty(uid2)) users.push(userMap[uid2]);
        }
        return this._answer({
            success: true,
            users: users,
        });
    },

    ////////////////////////////////////////////////////////////
    // ES12
    ////////////////////////////////////////////////////////////

    /**
     * Upserts a sys_es_latest_script record to enable or disable ES12 mode for a widget.
     * Never deletes the record; sets use_es_latest=false to disable.
     * Accepts `sys_id` (sp_widget sys_id) and `enabled` ('true' to enable, any other value to disable).
     * @returns {{success: boolean, result: boolean}} Return value.
     */
    saveEs12: function () {
        var sysId = this.getParameter('sys_id');
        var enabled = this.getParameter('enabled') == 'true';
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var gr = new GlideRecordSecure('sys_es_latest_script');
        gr.addQuery('id', sysId);
        gr.addQuery('table', 'sp_widget');
        gr.query();

        if (gr.next()) {
            gr.setValue('use_es_latest', enabled);
            gr.update();
        } else {
            gr.initialize();
            gr.setValue('id', sysId);
            gr.setValue('table', 'sp_widget');
            gr.setValue('use_es_latest', enabled);
            gr.insert();
        }
        return this._answer({
            success: true,
            result: enabled,
        });
    },

    ////////////////////////////////////////////////////////////
    // Angular Templates (sp_ng_template)
    ////////////////////////////////////////////////////////////

    /**
     * Returns all sp_ng_template records linked to a widget.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, templates: Array.<{sys_id: string, id: string,
     *   template: string, canDelete: boolean, volatility_level: string,
     *   volatility_level_display: string}>}} Return value.
     */
    getTemplates: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var templates = [];
        var currentAppId = gs.getCurrentApplicationId();
        var gr = new GlideRecordSecure('sp_ng_template');
        gr.addQuery('sp_widget', sysId);
        gr.orderBy('id');
        gr.query();
        while (gr.next()) {
            var tNoWrite = !gr.canWrite();
            var tScopeMismatch = gr.getValue('sys_scope') !== currentAppId;
            templates.push({
                sys_id: gr.getUniqueValue(),
                id: gr.getValue('id'),
                template: gr.getValue('template') || '',
                canDelete: gr.canDelete(),
                readOnly: tNoWrite,
                readOnlyReason: tScopeMismatch ? 'scope' : (tNoWrite ? 'access' : ''),
                scopeName: tScopeMismatch ? gr.getDisplayValue('sys_scope') : '',
                volatility_level: '',
                volatility_level_display: '',
            });
        }

        if (templates.length > 0) {
            var tUpdateNames = [];
            for (var ti = 0; ti < templates.length; ti++) {
                tUpdateNames.push('sp_ng_template_' + templates[ti].sys_id);
            }
            var tVolGr = new GlideRecordSecure('sys_metadata_volatility');
            tVolGr.addQuery('sys_update_name', 'IN', tUpdateNames.join(','));
            tVolGr.query();
            while (tVolGr.next()) {
                var vName = tVolGr.getValue('sys_update_name');
                var vId = vName.replace('sp_ng_template_', '');
                for (var vi = 0; vi < templates.length; vi++) {
                    if (templates[vi].sys_id !== vId) {
                        continue;
                    }
                    var vLevel = tVolGr.getValue('volatility_level') || '';
                    templates[vi].volatility_level = vLevel;
                    templates[vi].volatility_level_display = vLevel
                        ? tVolGr.getDisplayValue('volatility_level')
                        : '';
                    break;
                }
            }
        }

        return this._answer({
            success: true,
            templates: templates,
        });
    },

    /**
     * Creates or updates an sp_ng_template record linked to a widget.
     * Omit data.sys_id to create a new template.
     * Accepts `sys_id` (parent sp_widget sys_id) and `data` (JSON-encoded object: { sys_id?, id, template? }).
     * @returns {{success: boolean, sys_id: string}} Return value.
     */
    saveTemplate: function () {
        var widgetSysId = this.getParameter('sys_id');
        var data = JSON.parse(this.getParameter('data') || '{}');
        if (!data.id) {
            return this._answer({
                success: false,
                error: 'Template ID is required',
            });
        }

        var gr = new GlideRecordSecure('sp_ng_template');
        if (data.sys_id) {
            if (!gr.get(data.sys_id)) {
                return this._answer({
                    success: false,
                    error: 'Template not found',
                });
            }
        } else {
            gr.initialize();
            gr.setValue('sp_widget', widgetSysId);
        }

        gr.setValue('id', data.id);
        if (data.template !== undefined) {
            gr.setValue('template', data.template);
        }

        var resultId = data.sys_id
            ? (gr.update(), data.sys_id)
            : gr.insert() + '';
        return this._answer({
            success: true,
            sys_id: resultId,
        });
    },

    ////////////////////////////////////////////////////////////
    // Angular Providers (sp_angular_provider + m2m)
    ////////////////////////////////////////////////////////////

    /**
     * Returns all sp_angular_provider records linked to a widget via m2m_sp_ng_pro_sp_widget,
     * including a flag indicating whether each provider is shared with other widgets.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, providers: Array.<{sys_id: string, name: string,
     *   type: string, script: string, canDelete: boolean, linkedToOtherWidgets: boolean,
     *   volatility_level: string, volatility_level_display: string}>}} Return value.
     */
    getProviders: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var providerIds = [];
        var m2m = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        m2m.addQuery('sp_widget', sysId);
        m2m.query();
        while (m2m.next()) {
            var pid = m2m.getValue('sp_angular_provider');
            if (pid && providerIds.indexOf(pid) === -1) providerIds.push(pid);
        }

        if (providerIds.length === 0) {
            return this._answer({ success: true, providers: [] });
        }

        var providerMap = {};
        var pCurrentAppId = gs.getCurrentApplicationId();
        var pGrBatch = new GlideRecordSecure('sp_angular_provider');
        pGrBatch.addQuery('sys_id', 'IN', providerIds.join(','));
        pGrBatch.orderBy('name');
        pGrBatch.query();
        var sortedProviderIds = [];
        while (pGrBatch.next()) {
            var pbId = pGrBatch.getUniqueValue();
            sortedProviderIds.push(pbId);
            var pNoWrite = !pGrBatch.canWrite();
            var pScopeMismatch = pGrBatch.getValue('sys_scope') !== pCurrentAppId;
            providerMap[pbId] = {
                sys_id: pbId,
                name: pGrBatch.getValue('name'),
                type: pGrBatch.getValue('type') || '',
                script: pGrBatch.getValue('script') || '',
                canDelete: pGrBatch.canDelete(),
                linkedToOtherWidgets: false,
                readOnly: pNoWrite,
                readOnlyReason: pScopeMismatch ? 'scope' : (pNoWrite ? 'access' : ''),
                scopeName: pScopeMismatch ? pGrBatch.getDisplayValue('sys_scope') : '',
                volatility_level: '',
                volatility_level_display: '',
            };
        }

        var pUpdateNames = [];
        for (var pi = 0; pi < providerIds.length; pi++) {
            pUpdateNames.push('sp_angular_provider_' + providerIds[pi]);
        }
        var pVolGr = new GlideRecordSecure('sys_metadata_volatility');
        pVolGr.addQuery('sys_update_name', 'IN', pUpdateNames.join(','));
        pVolGr.query();
        while (pVolGr.next()) {
            var pvName = pVolGr.getValue('sys_update_name');
            var pvId = pvName.replace('sp_angular_provider_', '');
            if (!providerMap[pvId]) {
                continue;
            }
            var pvLevel = pVolGr.getValue('volatility_level') || '';
            providerMap[pvId].volatility_level = pvLevel;
            providerMap[pvId].volatility_level_display = pvLevel
                ? pVolGr.getDisplayValue('volatility_level')
                : '';
        }

        var m2mOtherGr = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        m2mOtherGr.addQuery('sp_angular_provider', 'IN', providerIds.join(','));
        m2mOtherGr.addQuery('sp_widget', '!=', sysId);
        m2mOtherGr.query();
        while (m2mOtherGr.next()) {
            var linkedPid = m2mOtherGr.getValue('sp_angular_provider');
            if (providerMap[linkedPid])
                providerMap[linkedPid].linkedToOtherWidgets = true;
        }

        var providers = [];
        for (var poi = 0; poi < sortedProviderIds.length; poi++) {
            if (providerMap[sortedProviderIds[poi]])
                providers.push(providerMap[sortedProviderIds[poi]]);
        }
        return this._answer({
            success: true,
            providers: providers,
        });
    },

    /**
     * Creates or updates an sp_angular_provider record. On creation, also inserts
     * the m2m_sp_ng_pro_sp_widget linking record to the given widget.
     * Accepts `sys_id` (parent sp_widget sys_id) and `data` (JSON-encoded object: { sys_id?, name, type?, script? }).
     * @returns {{success: boolean, sys_id: string}} Return value.
     */
    saveProvider: function () {
        var widgetSysId = this.getParameter('sys_id');
        var data = JSON.parse(this.getParameter('data') || '{}');
        var isNew = !data.sys_id;
        if (!data.name) {
            return this._answer({
                success: false,
                error: 'Provider name is required',
            });
        }

        var gr = new GlideRecordSecure('sp_angular_provider');
        if (!isNew) {
            if (!gr.get(data.sys_id)) {
                return this._answer({
                    success: false,
                    error: 'Provider not found',
                });
            }
        } else {
            gr.initialize();
        }

        gr.setValue('name', data.name);
        if (data.type !== undefined) {
            gr.setValue('type', data.type);
        }
        if (data.script !== undefined) {
            gr.setValue('script', data.script);
        }

        var resultId;
        if (!isNew) {
            gr.update();
            resultId = data.sys_id;
        } else {
            resultId = gr.insert() + '';
            if (widgetSysId && resultId) {
                var m2m = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
                m2m.initialize();
                m2m.setValue('sp_angular_provider', resultId);
                m2m.setValue('sp_widget', widgetSysId);
                m2m.insert();
            }
        }
        return this._answer({
            success: true,
            sys_id: resultId,
        });
    },

    /**
     * Fetches a sys_script_include record by sys_id or name.
     * Returns readOnly=true if canWrite() is false.
     * Accepts `sys_id` (optional sys_script_include sys_id) or `name` (Script Include name,
     * used if sys_id is not provided).
     * @returns {{success: boolean, si: {sys_id: string, name: string, script: string,
     *   readOnly: boolean, readOnlyReason: string, volatility_level: string,
     *   volatility_level_display: string}}} Return value.
     */
    getScriptInclude: function () {
        var sysId = this.getParameter('sys_id');
        var name = this.getParameter('name');
        if (!sysId && !name) {
            return this._answer({
                success: false,
                error: 'Missing sys_id or name',
            });
        }

        var gr = new GlideRecordSecure('sys_script_include');
        var found;
        if (sysId) {
            found = gr.get(sysId);
        } else {
            gr.addQuery('name', name);
            gr.setLimit(1);
            gr.query();
            found = gr.next();
        }
        if (!found) {
            return this._answer({
                success: false,
                error: 'Script Include not found',
            });
        }

        var noWrite = !gr.canWrite();
        var readOnly = noWrite;
        var siScopeMismatch = gr.getValue('sys_scope') !== gs.getCurrentApplicationId();
        var siReadOnlyReason = siScopeMismatch ? 'scope' : (noWrite ? 'access' : '');
        var siScopeName = siScopeMismatch ? gr.getDisplayValue('sys_scope') : '';

        var siVolLevel = '';
        var siVolDisplay = '';
        var siVolGr = new GlideRecordSecure('sys_metadata_volatility');
        siVolGr.addQuery(
            'sys_update_name',
            'sys_script_include_' + gr.getUniqueValue()
        );
        siVolGr.setLimit(1);
        siVolGr.query();
        if (siVolGr.next()) {
            siVolLevel = siVolGr.getValue('volatility_level') || '';
            siVolDisplay = siVolLevel
                ? siVolGr.getDisplayValue('volatility_level')
                : '';
        }

        return this._answer({
            success: true,
            si: {
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name'),
                script: gr.getValue('script') || '',
                readOnly: readOnly,
                readOnlyReason: siReadOnlyReason,
                scopeName: siScopeName,
                volatility_level: siVolLevel,
                volatility_level_display: siVolDisplay,
            },
        });
    },

    /**
     * Saves the script field of an existing sys_script_include record.
     * Update only — script includes cannot be created or deleted from this editor.
     * Accepts `sys_id` (sys_script_include sys_id) and `data` (JSON-encoded object: { script: string }).
     * @returns {{success: boolean}} Return value.
     */
    saveScriptInclude: function () {
        var sysId = this.getParameter('sys_id');
        var data = JSON.parse(this.getParameter('data') || '{}');
        if (!sysId) {
            return this._answer({ success: false, error: 'Missing sys_id' });
        }

        var gr = new GlideRecordSecure('sys_script_include');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Script Include not found',
            });
        }
        if (!gr.canWrite()) {
            return this._answer({ success: false, error: 'No write access' });
        }

        gr.setValue('script', data.script || '');
        gr.update();
        return this._answer({ success: true });
    },

    /**
     * Returns label, internal type, max length, mandatory flag, and reference table for a
     * single field from sys_dictionary. Used for inline hover documentation in JS editors.
     * Accepts `table` (table name) and `field` (element name).
     * @returns {{success: boolean, field: {label: string, type: string,
     *   max_length: number|null, mandatory: boolean, reference: string|null}}} Return value.
     */
    getFieldDictionary: function () {
        var table = this.getParameter('table');
        var field = this.getParameter('field');
        if (!table || !field) {
            return this._answer({ success: false, error: 'Missing params' });
        }
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', table);
        gr.addQuery('element', field);
        gr.setLimit(1);
        gr.query();
        if (!gr.next()) {
            return this._answer({ success: false });
        }
        var maxLen = gr.getValue('max_length');
        return this._answer({
            success: true,
            field: {
                label: gr.getValue('column_label') || field,
                type: gr.getValue('internal_type') || '',
                max_length: maxLen ? parseInt(maxLen, 10) : null,
                mandatory:
                    gr.getValue('mandatory') === '1' ||
                    gr.getValue('mandatory') === 'true',
                reference: gr.getValue('reference') || null,
            },
        });
    },

    /**
     * Returns all field names, labels, types, and reference tables for a table, including
     * inherited fields from parent tables. Used to power field-name autocomplete in JS editors.
     * Accepts `table` (table name).
     * @returns {{success: boolean, fields: Array.<{name: string, label: string,
     *   type: string, reference: string|null}>}} Return value.
     */
    getTableFields: function () {
        var table = this.getParameter('table');
        if (!table) {
            return this._answer({
                success: false,
                error: 'Missing table param',
            });
        }

        // Collect the full table hierarchy so inherited fields are included
        var tables = [];
        try {
            var hier = new GlideTableHierarchy(table);
            var hierList = hier.getTables();
            for (var h = 0; h < hierList.size(); h++) {
                tables.push('' + hierList.get(h));
            }
        } catch (e) {
            /* fall through */
        }
        if (tables.indexOf(table) === -1) {
            tables.push(table);
        }

        var fields = [];
        var seen = {};
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', 'IN', tables.join(','));
        gr.addNotNullQuery('element');
        gr.addQuery('internal_type', '!=', 'collection');
        gr.orderBy('element');
        gr.query();
        while (gr.next()) {
            var elem = gr.getValue('element');
            if (!elem || seen[elem]) {
                continue;
            }
            seen[elem] = true;
            fields.push({
                name: elem,
                label: gr.getValue('column_label') || elem,
                type: gr.getValue('internal_type') || '',
                reference: gr.getValue('reference') || null,
            });
        }
        return this._answer({ success: true, fields: fields });
    },

    /**
     * Deletes an sp_ng_template record if the current user has delete access.
     * Accepts `sys_id` (sp_ng_template sys_id).
     * @returns {{success: boolean}} Return value.
     */
    deleteTemplate: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }
        var gr = new GlideRecordSecure('sp_ng_template');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Template not found',
            });
        }
        if (!gr.canDelete()) {
            return this._answer({ success: false, error: 'No delete access' });
        }
        gr.deleteRecord();
        return this._answer({ success: true });
    },

    /**
     * Deletes an sp_angular_provider and its m2m link to the given widget,
     * provided it is not linked to any other widgets.
     * Accepts `sys_id` (sp_angular_provider sys_id) and `widget_sys_id` (owning sp_widget sys_id,
     * used to scope the m2m delete).
     * @returns {{success: boolean}} Return value.
     */
    deleteProvider: function () {
        var sysId = this.getParameter('sys_id');
        var widgetSysId = this.getParameter('widget_sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }
        var gr = new GlideRecordSecure('sp_angular_provider');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Provider not found',
            });
        }
        if (!gr.canDelete()) {
            return this._answer({ success: false, error: 'No delete access' });
        }
        // Ensure not linked to any other widget
        var m2mOther = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        m2mOther.addQuery('sp_angular_provider', sysId);
        if (widgetSysId) {
            m2mOther.addQuery('sp_widget', '!=', widgetSysId);
        }
        m2mOther.setLimit(1);
        m2mOther.query();
        if (m2mOther.hasNext()) {
            return this._answer({
                success: false,
                error: 'Provider is linked to other widgets',
            });
        }
        // Remove the m2m link for this widget then delete the provider
        var m2mDel = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        m2mDel.addQuery('sp_angular_provider', sysId);
        if (widgetSysId) {
            m2mDel.addQuery('sp_widget', widgetSysId);
        }
        m2mDel.deleteMultiple();
        gr.deleteRecord();
        return this._answer({ success: true });
    },

    /**
     * Returns all sp_angular_provider records NOT already linked to the given widget,
     * optionally filtered by name. Used to populate the "link existing provider" picker.
     * Accepts `sys_id` (optional sp_widget sys_id to exclude already-linked providers) and
     * `search` (optional substring to filter provider names).
     * @returns {{success: boolean, providers: Array.<{sys_id: string, name: string,
     *   type: string, script: string}>}} Return value.
     */
    getAllProviders: function () {
        var sysId = this.getParameter('sys_id');
        var search = this.getParameter('search') || '';

        var linkedIds = [];
        var m2m = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        if (sysId) {
            m2m.addQuery('sp_widget', sysId);
            m2m.query();
            while (m2m.next())
                linkedIds.push(m2m.getValue('sp_angular_provider'));
        }

        var providers = [];
        var gr = new GlideRecordSecure('sp_angular_provider');
        if (search) {
            gr.addQuery('name', 'CONTAINS', search);
        }
        gr.orderBy('name');
        gr.setLimit(this.RECORD_LIMIT);
        gr.query();

        while (gr.next()) {
            var pSysId = gr.getUniqueValue();
            if (linkedIds.indexOf(pSysId) === -1) {
                providers.push({
                    sys_id: pSysId,
                    name: gr.getValue('name'),
                    type: gr.getValue('type') || '',
                    script: gr.getValue('script') || '',
                });
            }
        }
        return this._answer({
            success: true,
            providers: providers,
        });
    },

    /**
     * Creates a m2m_sp_ng_pro_sp_widget record linking a provider to a widget.
     * No-ops silently if the link already exists.
     * Accepts `sys_id` (sp_widget sys_id) and `provider_sys_id` (sp_angular_provider sys_id to link).
     * @returns {{success: boolean}} Return value.
     */
    linkProvider: function () {
        var sysId = this.getParameter('sys_id');
        var providerSysId = this.getParameter('provider_sys_id');
        if (!sysId || !providerSysId) {
            return this._answer({
                success: false,
                error: 'Missing params',
            });
        }

        var m2m = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        m2m.addQuery('sp_widget', sysId);
        m2m.addQuery('sp_angular_provider', providerSysId);
        m2m.query();
        if (m2m.next()) {
            return this._answer({
                success: true,
            });
        }

        m2m.initialize();
        m2m.setValue('sp_angular_provider', providerSysId);
        m2m.setValue('sp_widget', sysId);
        m2m.insert();
        return this._answer({
            success: true,
        });
    },

    /**
     * Removes the m2m_sp_ng_pro_sp_widget link between a widget and a provider.
     * No-ops silently if the link does not exist.
     * Accepts `sys_id` (sp_widget sys_id) and `provider_sys_id` (sp_angular_provider sys_id to unlink).
     * @returns {{success: boolean}} Return value.
     */
    unlinkProvider: function () {
        var widgetSysId = this.getParameter('sys_id');
        var providerSysId = this.getParameter('provider_sys_id');
        if (!widgetSysId || !providerSysId) {
            return this._answer({ success: false, error: 'Missing params' });
        }
        var m2m = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        m2m.addQuery('sp_widget', widgetSysId);
        m2m.addQuery('sp_angular_provider', providerSysId);
        m2m.query();
        if (!m2m.next()) {
            return this._answer({ success: true }); // already unlinked
        }
        if (!m2m.canDelete()) {
            return this._answer({
                success: false,
                error: 'No delete access on m2m record',
            });
        }
        m2m.deleteRecord();
        return this._answer({ success: true });
    },

    ////////////////////////////////////////////////////////////
    // Widget Dependencies (m2m_sp_widget_dependency)
    ////////////////////////////////////////////////////////////

    /**
     * Returns all sp_dependency records linked to a widget via m2m_sp_widget_dependency.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, dependencies: Array.<{sys_id: string,
     *   m2m_sys_id: string, name: string}>}} Return value.
     */
    getDependencies: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var deps = [];
        var m2m = new GlideRecordSecure('m2m_sp_widget_dependency');
        m2m.addQuery('sp_widget', sysId);
        m2m.query();
        while (m2m.next()) {
            var depGr = new GlideRecordSecure('sp_dependency');
            if (depGr.get(m2m.getValue('sp_dependency'))) {
                deps.push({
                    sys_id: depGr.getUniqueValue(),
                    m2m_sys_id: m2m.getUniqueValue(),
                    name: depGr.getValue('name') || '',
                });
            }
        }
        return this._answer({ success: true, dependencies: deps });
    },

    /**
     * Returns all sp_dependency records NOT already linked to the given widget,
     * optionally filtered by name. Used to populate the "link dependency" picker.
     * Accepts `sys_id` (optional sp_widget sys_id to exclude already-linked dependencies) and
     * `search` (optional substring to filter dependency names).
     * @returns {{success: boolean, dependencies: Array.<{sys_id: string, name: string}>}} Return value.
     */
    getAllDependencies: function () {
        var sysId = this.getParameter('sys_id');
        var search = this.getParameter('search') || '';

        var linkedIds = [];
        var m2m = new GlideRecordSecure('m2m_sp_widget_dependency');
        if (sysId) {
            m2m.addQuery('sp_widget', sysId);
            m2m.query();
            while (m2m.next()) linkedIds.push(m2m.getValue('sp_dependency'));
        }

        var deps = [];
        var gr = new GlideRecordSecure('sp_dependency');
        if (search) {
            gr.addQuery('name', 'CONTAINS', search);
        }
        gr.orderBy('name');
        gr.setLimit(this.RECORD_LIMIT);
        gr.query();
        while (gr.next()) {
            if (linkedIds.indexOf(gr.getUniqueValue()) === -1) {
                deps.push({
                    sys_id: gr.getUniqueValue(),
                    name: gr.getValue('name') || '',
                });
            }
        }
        return this._answer({ success: true, dependencies: deps });
    },

    /**
     * Creates a m2m_sp_widget_dependency record linking a dependency to a widget.
     * No-ops silently if the link already exists.
     * Accepts `sys_id` (sp_widget sys_id) and `dep_sys_id` (sp_dependency sys_id to link).
     * @returns {{success: boolean}} Return value.
     */
    linkDependency: function () {
        var sysId = this.getParameter('sys_id');
        var depSysId = this.getParameter('dep_sys_id');
        if (!sysId || !depSysId) {
            return this._answer({ success: false, error: 'Missing params' });
        }

        var m2m = new GlideRecordSecure('m2m_sp_widget_dependency');
        m2m.addQuery('sp_widget', sysId);
        m2m.addQuery('sp_dependency', depSysId);
        m2m.setLimit(1);
        m2m.query();
        if (m2m.next()) {
            return this._answer({ success: true }); // already linked
        }

        m2m.initialize();
        m2m.setValue('sp_widget', sysId);
        m2m.setValue('sp_dependency', depSysId);
        m2m.insert();
        return this._answer({ success: true });
    },

    /**
     * Removes the m2m_sp_widget_dependency link between a widget and a dependency.
     * No-ops silently if the link does not exist.
     * Accepts `sys_id` (sp_widget sys_id) and `dep_sys_id` (sp_dependency sys_id to unlink).
     * @returns {{success: boolean}} Return value.
     */
    unlinkDependency: function () {
        var sysId = this.getParameter('sys_id');
        var depSysId = this.getParameter('dep_sys_id');
        if (!sysId || !depSysId) {
            return this._answer({ success: false, error: 'Missing params' });
        }

        var m2m = new GlideRecordSecure('m2m_sp_widget_dependency');
        m2m.addQuery('sp_widget', sysId);
        m2m.addQuery('sp_dependency', depSysId);
        m2m.query();
        if (!m2m.next()) {
            return this._answer({ success: true }); // already unlinked
        }
        if (!m2m.canDelete()) {
            return this._answer({ success: false, error: 'No delete access' });
        }
        m2m.deleteRecord();
        return this._answer({ success: true });
    },

    ////////////////////////////////////////////////////////////
    // Related lists (driven by sys_ui_related_list / sys_ui_related_list_entry)
    ////////////////////////////////////////////////////////////

    /**
     * Reads the related-list configuration for sp_widget from sys_ui_related_list and
     * returns one tab descriptor per list entry (excluding internal/dependency lists).
     * Each tab descriptor includes the record count and column definitions for the tab.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, tabs: Array.<{related_list: string, type: number,
     *   table: string, field: string, title: string, count: number, rel_sys_id: string,
     *   columns: Array.<{field: string, label: string, refTable: string|null}>}>}} Return value.
     */
    getRelatedDefinitions: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var EXCLUDED_LISTS = [
            'm2m_sp_widget_dependency.sp_widget',
            'm2m_sp_ng_pro_sp_widget.sp_widget',
            'sp_ng_template.sp_widget',
        ];
        var EXCLUDED_TABLES = [
            'sys_update_version',
            'm2m_sp_public_widget_allow_table',
        ];
        var CUSTOM_EXCLUSIONS = this._getRelatedListExclusions();

        var rlGr = new GlideRecordSecure('sys_ui_related_list');
        rlGr.addQuery('name', 'sp_widget');
        rlGr.addQuery('view', 'Default view');
        rlGr.setLimit(1);
        rlGr.query();
        if (!rlGr.next()) {
            return this._answer({ success: true, tabs: [] });
        }

        var listId = rlGr.getUniqueValue();

        var entryGr = new GlideRecordSecure('sys_ui_related_list_entry');
        entryGr.addQuery('list_id', listId);
        entryGr.orderBy('position');
        entryGr.query();

        var tabs = [];
        while (entryGr.next()) {
            var rlValue = entryGr.getValue('related_list');
            if (EXCLUDED_LISTS.indexOf(rlValue) !== -1) {
                continue;
            }
            if (CUSTOM_EXCLUSIONS[rlValue]) {
                continue;
            }

            var tab = null;
            if (rlValue.indexOf('REL:') === 0) {
                tab = this._relatedBuildRelTab(
                    sysId,
                    rlValue.substring(4),
                    rlValue
                );
                if (tab && EXCLUDED_TABLES.indexOf(tab.table) !== -1)
                    tab = null;
            } else {
                var dotIdx = rlValue.indexOf('.');
                if (dotIdx < 1) {
                    continue;
                }
                var table = rlValue.substring(0, dotIdx);
                var field = rlValue.substring(dotIdx + 1);
                if (EXCLUDED_TABLES.indexOf(table) !== -1) {
                    continue;
                }
                tab = this._relatedBuildFieldTab(sysId, table, field, rlValue);
            }
            if (tab) {
                tabs.push(tab);
            }
        }

        return this._answer({ success: true, tabs: tabs });
    },

    /**
     * Returns a paginated set of rows for a given related-list tab on a widget.
     * Supports both field-based (table.field=sys_id) and relationship-based (REL:...) lists.
     * Accepts `sys_id` (sp_widget sys_id), `related_list` (tab identifier, e.g. "sp_page.widget" or
     * "REL:<sys_id>"), and `page` (optional zero-based page index; defaults to 0).
     * @returns {{success: boolean, rows: Array.<Object>,
     *   columns: Array.<{field: string, label: string, refTable: string|null}>,
     *   page: number}} Return value.
     */
    getRelatedData: function () {
        var sysId = this.getParameter('sys_id');
        var relatedList = this.getParameter('related_list');
        var page = parseInt(this.getParameter('page') || '0');
        var PAGE_SIZE = 20;

        if (!sysId || !relatedList) {
            return this._answer({ success: false, error: 'Missing params' });
        }

        var offset = page * PAGE_SIZE;
        var rows = [];
        var columns = [];

        try {
            if (relatedList.indexOf('REL:') === 0) {
                var relSysId = relatedList.substring(4);
                var relGr = new GlideRecordSecure('sys_relationship');
                if (!relGr.get(relSysId)) {
                    return this._answer({
                        success: false,
                        error: 'Relationship not found',
                    });
                }
                var targetTable = relGr.getValue('basic_query_from');
                var queryWith = relGr.getValue('query_with');
                columns = this._relatedGetColumns(targetTable);
                var parent = new GlideRecordSecure('sp_widget');
                parent.get(sysId);
                var gr = new GlideRecordSecure(targetTable);
                var evaluator = new GlideScopedEvaluator();
                evaluator.putVariable('current', gr);
                evaluator.putVariable('parent', parent);
                evaluator.evaluateScript(relGr, 'query_with');
                gr.chooseWindow(offset, offset + PAGE_SIZE);
                gr.query();
                while (gr.next())
                    rows.push(this._relatedExtractRow(gr, columns));
            } else {
                var dotIdx = relatedList.indexOf('.');
                var table = relatedList.substring(0, dotIdx);
                var field = relatedList.substring(dotIdx + 1);
                columns = this._relatedGetColumns(table);
                var gr2 = new GlideRecordSecure(table);
                gr2.addQuery(field, sysId);
                gr2.chooseWindow(offset, offset + PAGE_SIZE);
                gr2.query();
                while (gr2.next())
                    rows.push(this._relatedExtractRow(gr2, columns));
            }
        } catch (e) {
            gs.error('Widget Editor getRelatedData error: ' + e.message);
            return this._answer({ success: false, error: e.message });
        }

        return this._answer({
            success: true,
            rows: rows,
            columns: columns,
            page: page,
        });
    },

    /**
     * Builds a tab descriptor for a field-based related list (table.field = sysId).
     * Returns null if the table does not exist on this instance.
     * @param {string} sysId - sys_id of the sp_widget.
     * @param {string} table - Name of the related table.
     * @param {string} field - Name of the reference field pointing back to sp_widget.
     * @param {string} rlValue - Raw related_list value from sys_ui_related_list_entry.
     * @returns {Object|null} Tab descriptor or null if table is invalid.
     */
    _relatedBuildFieldTab: function (sysId, table, field, rlValue) {
        if (!new GlideRecordSecure(table).isValid()) {
            return null; // table doesn't exist in this instance
        }
        var title = this._relatedGetTableLabel(table);
        var count = this._relatedGetCount(table, field, sysId, null);
        var columns = this._relatedGetColumns(table);
        return {
            related_list: rlValue,
            type: 1,
            table: table,
            field: field,
            title: title,
            count: count,
            columns: columns,
        };
    },

    /**
     * Builds a tab descriptor for a relationship-based related list (REL:<sys_id>).
     * Returns null if the sys_relationship record is not found.
     * @param {string} sysId - sys_id of the sp_widget.
     * @param {string} relSysId - sys_id of the sys_relationship record.
     * @param {string} rlValue - Raw related_list value from sys_ui_related_list_entry.
     * @returns {Object|null} Tab descriptor or null if relationship not found.
     */
    _relatedBuildRelTab: function (sysId, relSysId, rlValue) {
        var relGr = new GlideRecordSecure('sys_relationship');
        if (!relGr.get(relSysId)) {
            return null;
        }
        var targetTable = relGr.getValue('basic_query_from');
        var title =
            relGr.getValue('name') || this._relatedGetTableLabel(targetTable);
        var count = this._relatedGetCount(targetTable, null, sysId, relGr);
        var columns = this._relatedGetColumns(targetTable);
        return {
            related_list: rlValue,
            type: 2,
            table: targetTable,
            rel_sys_id: relSysId,
            title: title,
            count: count,
            columns: columns,
        };
    },

    /**
     * Returns the number of records matching either a field equality query or a
     * relationship query_with script. Returns 0 on error.
     * @param {string} table - Table to count records from.
     * @param {string|null} field - Field to match sysId against (null when using relGr).
     * @param {string} sysId - sys_id of the sp_widget (also exposed as `parent` in query_with).
     * @param {GlideRecord|null} relGr - sys_relationship GlideRecord whose query_with is evaluated.
     * @returns {number} Record count.
     */
    _relatedGetCount: function (table, field, sysId, relGr) {
        try {
            if (relGr) {
                var parent = new GlideRecordSecure('sp_widget');
                parent.get(sysId);
                var gr = new GlideRecordSecure(table);
                var evaluator = new GlideScopedEvaluator();
                evaluator.putVariable('current', gr);
                evaluator.putVariable('parent', parent);
                evaluator.evaluateScript(relGr, 'query_with');
                gr.query();
                return gr.getRowCount();
            }
            var ga = new GlideAggregate(table);
            ga.addQuery(field, sysId);
            ga.addAggregate('COUNT');
            ga.query();
            if (ga.next()) {
                return parseInt(ga.getAggregate('COUNT')) || 0;
            }
            return 0;
        } catch (e) {
            gs.error('Widget Editor _relatedGetCount error: ' + e.message);
            return 0;
        }
    },

    /**
     * Returns the ordered column definitions for a table based on its default sys_ui_list,
     * resolving field labels and reference table names. Back-references to sp_widget
     * are automatically excluded.
     * @param {string} table - Table name.
     * @returns {Array<{field: string, label: string, refTable: string|null}>}
     */
    _relatedGetColumns: function (table) {
        var listSysId = this._relatedFindListSysId(table);
        if (!listSysId) {
            return [];
        }
        var fieldNames = [];
        var elemGr = new GlideRecordSecure('sys_ui_list_element');
        elemGr.addQuery('list_id', listSysId);
        elemGr.orderBy('position');
        elemGr.setLimit(8);
        elemGr.query();
        while (elemGr.next()) {
            var fn = elemGr.getValue('element');
            if (fn) {
                fieldNames.push(fn);
            }
        }
        if (fieldNames.length === 0) {
            return [];
        }
        // Initialize a GlideRecord to access field metadata; labels resolve through the
        // inheritance chain via getLabel() on the GlideElement (e.g. sys_updated_on is
        // defined on sys_metadata, not on the specific table, but still resolves correctly).
        var grProbe = new GlideRecordSecure(table);
        grProbe.initialize();
        var cols = [];
        for (var i = 0; i < fieldNames.length; i++) {
            var elementName = fieldNames[i];
            var label = elementName;
            var refTable = null;
            if (!grProbe.isValidField(elementName)) {
                continue;
            }
            try {
                var glideEl = grProbe.getElement(elementName);
                label = glideEl.getLabel() || elementName;
                var ed = glideEl.getED();
                if (ed && ed.getInternalType() === 'reference') {
                    refTable = ed.getReference() || null;
                }
            } catch (e) {}
            if (refTable === 'sp_widget') {
                continue; // omit back-reference to current widget
            }
            cols.push({
                field: elementName,
                label: label,
                refTable: refTable,
            });
        }
        return cols;
    },

    /**
     * Finds the sys_id of the default sys_ui_list for a given table,
     * preferring the empty-view list and falling back to any list for the table.
     * @param {string} table - Table name.
     * @returns {string|null} sys_id of the sys_ui_list record, or null if not found.
     */
    _relatedFindListSysId: function (table) {
        var gr = new GlideRecordSecure('sys_ui_list');
        gr.addQuery('name', table);
        gr.addQuery('view', '');
        gr.setLimit(1);
        gr.query();
        if (gr.next()) {
            return gr.getUniqueValue();
        }
        var gr2 = new GlideRecordSecure('sys_ui_list');
        gr2.addQuery('name', table);
        gr2.setLimit(1);
        gr2.query();
        if (gr2.next()) {
            return gr2.getUniqueValue();
        }
        return null;
    },

    /**
     * Returns the plural (or singular) display label for a table from sys_db_object.
     * Falls back to the table name itself if no record is found.
     * @param {string} table - Table name.
     * @returns {string} Human-readable table label.
     */
    _relatedGetTableLabel: function (table) {
        var gr = new GlideRecordSecure('sys_db_object');
        gr.addQuery('name', table);
        gr.setLimit(1);
        gr.query();
        if (gr.next()) {
            return gr.getValue('label_plural') || gr.getValue('label') || table;
        }
        return table;
    },

    /**
     * Extracts display values for the given columns from a GlideRecord row,
     * including reference sys_ids for reference fields.
     * @param {GlideRecord} gr - The current GlideRecord.
     * @param {Array<{field: string, label: string, refTable: string|null}>} columns - Column definitions.
     * @returns {Object} Row object with sys_id, _table, and one key per column field.
     */
    _relatedExtractRow: function (gr, columns) {
        var row = { sys_id: gr.getUniqueValue(), _table: gr.getTableName() };
        var max = this.RELATED_CELL_MAX_LENGTH;
        for (var i = 0; i < columns.length; i++) {
            var f = columns[i].field;
            try {
                var val = gr.getDisplayValue(f) || '';
                if (val.length > max) {
                    val = val.substring(0, max) + '\u2026';
                }
                row[f] = val;
                if (columns[i].refTable) {
                    row[f + '__ref_id'] = gr.getValue(f) || '';
                }
            } catch (e) {
                row[f] = '';
            }
        }
        return row;
    },

    /**
     * Checks whether an sp_angular_provider with the given name already exists,
     * optionally excluding a specific record (for edit-mode uniqueness validation).
     * Accepts `id` (provider name to check) and `sys_id` (optional sys_id to exclude from the check).
     * @returns {{success: boolean, exists: boolean}} Return value.
     */
    checkProviderId: function () {
        var id = this.getParameter('id');
        var excludeSysId = this.getParameter('sys_id') || '';
        var gr = new GlideRecordSecure('sp_angular_provider');
        gr.addQuery('name', id);
        if (excludeSysId) {
            gr.addQuery('sys_id', '!=', excludeSysId);
        }
        gr.setLimit(1);
        gr.query();
        return this._answer({
            success: true,
            exists: gr.hasNext(),
        });
    },

    /**
     * Returns the script, name, type, and last-updated-by for a single sp_angular_provider.
     * Accepts `sys_id` (sp_angular_provider sys_id).
     * @returns {{success: boolean, script: string, name: string, type: string,
     *   sys_updated_by: string}} Return value.
     */
    getProviderRecord: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }
        var gr = new GlideRecordSecure('sp_angular_provider');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Provider not found',
            });
        }
        return this._answer({
            success: true,
            script: gr.getValue('script') || '',
            name: gr.getValue('name') || '',
            type: gr.getValue('type') || '',
            sys_updated_by: gr.getValue('sys_updated_by'),
        });
    },

    /**
     * Returns the choice list for the sp_angular_provider.type field in the current session language.
     * @returns {{success: boolean, choices: Array.<{label: string, value: string}>}} Return value.
     */
    getProviderChoices: function () {
        var choices = [];
        var gr = new GlideRecordSecure('sys_choice');
        gr.addQuery('name', 'sp_angular_provider');
        gr.addQuery('element', 'type');
        gr.addQuery('language', gs.getSession().getLanguage());
        gr.orderBy('sequence');
        gr.query();
        while (gr.next()) {
            choices.push({
                label: gr.getValue('label'),
                value: gr.getValue('value'),
            });
        }
        return this._answer({
            success: true,
            choices: choices,
        });
    },

    /**
     * Checks whether an sp_ng_template with the given id already exists,
     * optionally excluding a specific record (for edit-mode uniqueness validation).
     * Accepts `id` (template id to check) and `sys_id` (optional sys_id to exclude from the check).
     * @returns {{success: boolean, exists: boolean}} Return value.
     */
    checkTemplateId: function () {
        var id = this.getParameter('id');
        var excludeSysId = this.getParameter('sys_id') || '';
        var gr = new GlideRecordSecure('sp_ng_template');
        gr.addQuery('id', id);
        if (excludeSysId) {
            gr.addQuery('sys_id', '!=', excludeSysId);
        }
        gr.setLimit(1);
        gr.query();
        return this._answer({
            success: true,
            exists: gr.hasNext(),
        });
    },

    ////////////////////////////////////////////////////////////
    // User Preferences
    ////////////////////////////////////////////////////////////

    USER_PREF_NAME: 'monaco_plus.user_prefs',
    /* Read-only fallback so prefs saved before the rename still load. */
    LEGACY_USER_PREF_NAME: 'widget_editor.visible_editors',

    /**
     * Returns the current user's Monaco+ preference value, falling back to the legacy key.
     * @returns {{success: boolean, value: string|null}} Return value.
     */
    getUserPrefs: function () {
        var gr = new GlideRecordSecure('sys_user_preference');
        gr.addQuery('user', gs.getUserID());
        gr.addQuery('name', this.USER_PREF_NAME);
        gr.query();
        if (gr.next()) {
            return this._answer({
                success: true,
                value: gr.getValue('value'),
            });
        }
        var legacy = new GlideRecordSecure('sys_user_preference');
        legacy.addQuery('user', gs.getUserID());
        legacy.addQuery('name', this.LEGACY_USER_PREF_NAME);
        legacy.query();
        return this._answer({
            success: true,
            value: legacy.next() ? legacy.getValue('value') : null,
        });
    },

    /**
     * Upserts the current user's Monaco+ preference.
     * Accepts `value` (JSON-encoded preference blob to store).
     * @returns {{success: boolean}} Return value.
     */
    saveUserPrefs: function () {
        var value = this.getParameter('value');
        var gr = new GlideRecordSecure('sys_user_preference');
        gr.addQuery('user', gs.getUserID());
        gr.addQuery('name', this.USER_PREF_NAME);
        gr.query();

        if (gr.next()) {
            gr.setValue('value', value);
            gr.update();
        } else {
            gr.initialize();
            gr.setValue('user', gs.getUserID());
            gr.setValue('name', this.USER_PREF_NAME);
            gr.setValue('value', value);
            gr.insert();
        }
        return this._answer({
            success: true,
        });
    },

    /**
     * Returns the sys_dictionary default values for sp_widget script fields,
     * plus the current application name and sys_id.
     * @returns {{success: boolean, defaults: {template: string, css: string,
     *   client_script: string, script: string, link: string},
     *   application: string, application_sys_id: string}} Return value.
     */
    getWidgetDefaults: function () {
        var fields = ['template', 'css', 'client_script', 'script', 'link'];
        var defaults = {};
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', 'sp_widget');
        gr.addQuery('element', fields);
        gr.query();
        while (gr.next()) {
            var el = gr.getValue('element');
            defaults[el] = gr.getValue('default_value') || '';
        }
        var appSysId = gs.getCurrentApplicationId();
        var appName = '';
        if (appSysId) {
            var appGr = new GlideRecordSecure('sys_scope');
            if (appGr.get(appSysId)) appName = appGr.getValue('name') || '';
        }
        return this._answer({
            success: true,
            defaults: defaults,
            application: appName,
            application_sys_id: appSysId || '',
            additional_widget_fields: this._getAdditionalWidgetFieldDefs(
                this._buildWidgetFieldAccessProbe()
            ),
        });
    },

    ////////////////////////////////////////////////////////////
    // Clone
    ////////////////////////////////////////////////////////////

    /**
     * Clones an sp_widget record into the current application scope, copying
     * all dependency and provider m2m relationships, and recording the clone
     * relationship to the source widget.
     * Accepts `sys_id` (sp_widget sys_id to clone).
     * @returns {{success: boolean, sys_id: string}} sys_id is the new cloned widget's sys_id.
     */
    cloneWidget: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }

        var gr = new GlideRecordSecure('sp_widget');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Widget not found',
            });
        }
        if (!gr.canWrite()) {
            return this._answer({
                success: false,
                error: 'No write access to widget',
            });
        }

        var oldSysId = gr.getUniqueValue();
        gr.sys_scope = gs.getCurrentApplicationId();
        gr.sys_policy = '';
        gr.name = 'Copy of ' + gr.getValue('name');
        gr.id = '';
        gr.servicenow = false;
        gr.internal = false;

        var newSysId = gr.insert();
        if (!newSysId) {
            return this._answer({
                success: false,
                error: 'Failed to clone widget',
            });
        }
        newSysId = newSysId + '';

        // Clone widget dependencies
        var depGR = new GlideRecordSecure('m2m_sp_widget_dependency');
        depGR.query('sp_widget', oldSysId);
        while (depGR.next()) {
            depGR.sp_widget = newSysId;
            depGR.insert();
        }

        // Clone provider relationships
        var proGR = new GlideRecordSecure('m2m_sp_ng_pro_sp_widget');
        proGR.query('sp_widget', oldSysId);
        while (proGR.next()) {
            proGR.sp_widget = newSysId;
            proGR.insert();
        }

        // Record clone relationship to OOB parent (best-effort)
        try {
            new SPWidgetCloneUtils().createCloneRelationship(
                oldSysId,
                newSysId
            );
        } catch (e) {}

        return this._answer({
            success: true,
            sys_id: newSysId,
        });
    },

    ////////////////////////////////////////////////////////////
    // XML / History Set
    ////////////////////////////////////////////////////////////

    /**
     * Returns the sys_history_set sys_id for a widget, if one exists.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, history_set_id: string|null}} Return value.
     */
    getHistorySetId: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }
        var gr = new GlideRecordSecure('sys_history_set');
        gr.addQuery('id', sysId);
        gr.setLimit(1);
        gr.query();
        if (!gr.next()) {
            return this._answer({ success: true, history_set_id: null });
        }
        return this._answer({
            success: true,
            history_set_id: gr.getUniqueValue(),
        });
    },

    ////////////////////////////////////////////////////////////
    // Option Schema
    ////////////////////////////////////////////////////////////

    /**
     * Returns the option_schema JSON field for a widget.
     * Accepts `sys_id` (sp_widget sys_id).
     * @returns {{success: boolean, option_schema: string}} Return value.
     */
    getOptionSchema: function () {
        var sysId = this.getParameter('sys_id');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }
        var gr = new GlideRecordSecure('sp_widget');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Widget not found',
            });
        }
        return this._answer({
            success: true,
            option_schema: gr.getValue('option_schema') || '',
        });
    },

    /**
     * Saves the option_schema field on an sp_widget record.
     * Accepts `sys_id` (sp_widget sys_id) and `value` (new option_schema value, JSON string).
     * @returns {{success: boolean}} Return value.
     */
    saveOptionSchema: function () {
        var sysId = this.getParameter('sys_id');
        var value = this.getParameter('value');
        if (!sysId) {
            return this._answer({
                success: false,
                error: 'No sys_id provided',
            });
        }
        var gr = new GlideRecordSecure('sp_widget');
        if (!gr.get(sysId)) {
            return this._answer({
                success: false,
                error: 'Widget not found',
            });
        }
        gr.setValue('option_schema', value);
        if (!gr.update()) {
            return this._answer({
                success: false,
                error: 'Save failed. You may not have write access.',
            });
        }
        return this._answer({
            success: true,
        });
    },

    ////////////////////////////////////////////////////////////
    // Private helpers
    ////////////////////////////////////////////////////////////

    /**
     * Returns additional sp_widget field names configured in the system property
     * monaco.plus.widget.fields. Supports comma/newline/semicolon-separated values.
     * @returns {Array.<string>} Sanitised field element names, preserving order.
     */
    /**
     * Returns the set of sys_ui_related_list_entry.related_list values configured to
     * be hidden via the system property monaco.plus.widget.related_list_exclusions.
     * Supports comma-separated values.
     * @returns {Object.<string, boolean>} Map of excluded related_list identifiers.
     */
    _getRelatedListExclusions: function () {
        var raw = gs.getProperty(this.RELATED_LIST_EXCLUSIONS_PROPERTY, '') || '';
        var tokens = raw.split(',');
        var out = {};
        for (var i = 0; i < tokens.length; i++) {
            var name = (tokens[i] || '').trim();
            if (name) {
                out[name] = true;
            }
        }
        return out;
    },

    _getConfiguredAdditionalWidgetFields: function () {
        var raw = gs.getProperty(this.ADDITIONAL_WIDGET_FIELDS_PROPERTY, '') || '';
        var tokens = raw.split(/[\n,;]+/);
        var seen = {};
        var out = [];
        for (var i = 0; i < tokens.length; i++) {
            var name = (tokens[i] || '').trim();
            if (!name) {
                continue;
            }
            if (!/^[A-Za-z0-9_]+$/.test(name)) {
                continue;
            }
            if (seen[name]) {
                continue;
            }
            if (this.ALLOWED_WIDGET_FIELDS.indexOf(name) !== -1) {
                continue;
            }
            seen[name] = true;
            out.push(name);
        }
        return out;
    },

    /**
     * Evaluates the configured encoded query against the widget record to determine
     * whether the widget should be treated as deprecated.
     * @param {GlideRecord} widgetGr - sp_widget record to test.
     * @returns {boolean} True when the property query matches the widget.
     */
    _isDeprecatedWidget: function (widgetGr) {
        var encodedQuery =
            gs.getProperty(this.DEPRECATED_WIDGET_PROPERTY, '') || '';
        encodedQuery = (encodedQuery + '').trim();
        if (!encodedQuery) {
            return false;
        }

        try {
            var filter = new GlideFilter(encodedQuery, 'deprecated');
            filter.setCaseSensitive(false);
            return filter.match(widgetGr, false);
        } catch (e) {
            gs.warn(
                'WidgetEditorAjax: failed to evaluate property ' +
                    this.DEPRECATED_WIDGET_PROPERTY +
                    '. ' +
                    (e && e.message ? e.message : e)
            );
            return false;
        }
    },

    /**
     * Returns dictionary metadata for configured additional sp_widget fields.
     * @param {GlideRecord} accessGr - Optional sp_widget GlideRecord used to resolve field ACLs.
     * @returns {Array.<{name: string, label: string, type: string, canWrite: boolean}>} Field definitions.
     */
    _getAdditionalWidgetFieldDefs: function (accessGr) {
        var names = this._getConfiguredAdditionalWidgetFields();
        if (!names.length) {
            return [];
        }

        var dict = {};
        var gr = new GlideRecordSecure('sys_dictionary');
        gr.addQuery('name', 'sp_widget');
        gr.addQuery('element', 'IN', names.join(','));
        gr.query();
        while (gr.next()) {
            var element = gr.getValue('element');
            if (!element) {
                continue;
            }
            dict[element] = {
                name: element,
                label: gr.getValue('column_label') || element,
                type: gr.getValue('internal_type') || 'string',
                canWrite: this._canWriteWidgetField(accessGr, element),
            };
        }

        var defs = [];
        for (var i = 0; i < names.length; i++) {
            if (dict[names[i]]) {
                defs.push(dict[names[i]]);
            }
        }
        return defs;
    },

    /**
     * Builds a probe sp_widget record for field-level ACL checks in new-widget flows.
     * @returns {GlideRecord} Initialised sp_widget record.
     */
    _buildWidgetFieldAccessProbe: function () {
        var gr = new GlideRecordSecure('sp_widget');
        gr.initialize();
        return gr;
    },

    /**
     * Returns the complete allowed set of fields for save operations.
     * @returns {Array.<string>} Base + configured additional fields.
     */
    _getAllowedWidgetFields: function () {
        return this.ALLOWED_WIDGET_FIELDS.concat(
            this._getConfiguredAdditionalWidgetFields()
        );
    },

    /**
     * True when a widget field should be handled as a boolean checkbox value.
     * @param {string} fieldName - sp_widget element name.
     * @returns {boolean} True if the field type is boolean.
     */
    _isBooleanWidgetField: function (fieldName) {
        if (fieldName === 'public') {
            return true;
        }
        var defs = this._getAdditionalWidgetFieldDefs();
        for (var i = 0; i < defs.length; i++) {
            if (defs[i].name === fieldName) {
                return this._isBooleanWidgetType(defs[i].type);
            }
        }
        return false;
    },

    /**
     * Returns whether the current user can write a specific widget field.
     * @param {GlideRecord} gr - sp_widget record or initialised probe.
     * @param {string} fieldName - Field element name.
     * @returns {boolean} True if the field is writable.
     */
    _canWriteWidgetField: function (gr, fieldName) {
        if (!gr || !fieldName) {
            return false;
        }
        try {
            if (!gr.isValidField(fieldName)) {
                return false;
            }
            var element = gr.getElement(fieldName);
            return !!(element && element.canWrite && element.canWrite());
        } catch (e) {
            return false;
        }
    },

    /**
     * True when the dictionary internal type represents a boolean field.
     * @param {string} type - sys_dictionary.internal_type value.
     * @returns {boolean} True if the type is boolean-like.
     */
    _isBooleanWidgetType: function (type) {
        var normalised = String(type || '').toLowerCase();
        return (
            normalised === 'boolean' ||
            normalised === 'glide_boolean' ||
            normalised === 'true_false'
        );
    },

    /**
     * Normalises supported client/server boolean representations.
     * @param {*} value - Raw field value.
     * @returns {boolean} Boolean equivalent.
     */
    _coerceWidgetBooleanValue: function (value) {
        if (value === true || value === false) {
            return value;
        }
        var normalised = String(value == null ? '' : value)
            .toLowerCase()
            .trim();
        return (
            normalised === 'true' ||
            normalised === '1' ||
            normalised === 'yes' ||
            normalised === 'y'
        );
    },

    /**
     * Writes a widget field using explicit boolean handling for checkbox fields.
     * @param {GlideRecord} gr - Target sp_widget record.
     * @param {string} fieldName - Field element name.
     * @param {*} value - Incoming value.
     * @returns {void} Return value.
     */
    _setWidgetFieldValue: function (gr, fieldName, value) {
        if (this._isBooleanWidgetField(fieldName)) {
            gr[fieldName] = this._coerceWidgetBooleanValue(value);
            return;
        }
        gr.setValue(fieldName, value);
    },

    /**
     * Serialises a response object to JSON and passes it to AbstractAjaxProcessor.setAnswer.
     * @param {Object} obj - The response payload to serialise.
     * @returns {void} Return value.
     */
    _answer: function (obj) {
        return this.setAnswer(JSON.stringify(obj));
    },

    /**
     * Parses the XML payload from a sys_update_version record and extracts
     * sp_widget field values by element name.
     * @param {string} payload - Raw XML string from sys_update_version.payload.
     * @returns {Object} Map of field name to text content for known widget fields.
     */
    _parseVersionPayload: function (payload) {
        var fields = {};
        if (!payload) {
            return fields;
        }
        try {
            var xmlDoc = new XMLDocument2();
            xmlDoc.parseXML(payload);
            var names = [
                'template',
                'css',
                'client_script',
                'script',
                'link',
                'name',
                'id',
                'description',
                'public',
                'roles',
            ];
            for (var i = 0; i < names.length; i++) {
                var node = xmlDoc.getFirstNode('//' + names[i]);
                if (node) {
                    fields[names[i]] = node.getTextContent();
                }
            }
        } catch (e) {
            gs.error('Widget Editor: parseVersionPayload error: ' + e.message);
        }
        return fields;
    },

    /**
     * Derives 1–2 character initials from a display name (first + last word initials).
     * @param {string} name - Full display name.
     * @returns {string} Uppercased initials, or '?' if name is empty.
     */
    _getInitials: function (name) {
        if (!name) {
            return '?';
        }
        var parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (
            parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    },

    type: 'WidgetEditorAjax',
});
