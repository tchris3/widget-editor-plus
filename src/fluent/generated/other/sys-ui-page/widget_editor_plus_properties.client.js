(function () {
    function initialise() {
        'use strict';
        var sections = document.getElementById('wep-sections');
        var nav = document.getElementById('wep-nav');
        var message = document.getElementById('wep-message');
        var search = document.getElementById('wep-search');
        var dirty = {};
        var rulesDirty = false;
        var activeFeatures = {};
        var plainTextareas = [];
        var jsonEditors = [];

        function ajax(method, params) {
            return new Promise(function (resolve, reject) {
                var ga = new GlideAjax('WidgetEditorMarkdownAjax');
                ga.addParam('sysparm_name', method);
                Object.keys(params || {}).forEach(function (key) { ga.addParam(key, params[key]); });
                ga.getXMLAnswer(function (answer) {
                    var data;
                    try { data = JSON.parse(answer || '{}'); }
                    catch (e) { reject(new Error('Invalid server response.')); return; }
                    if (!data.success) { reject(new Error(data.error || 'Request failed.')); return; }
                    resolve(data);
                });
            });
        }
        function el(tag, className, value) {
            var node = document.createElement(tag);
            if (className) node.className = className;
            if (value) node.textContent = value;
            return node;
        }
        function button(label, action) {
            var node = el('button', 'btn btn-default', label);
            node.type = 'button';
            node.onclick = action;
            return node;
        }
        function status(node, value, kind) {
            if (!node) return;
            node.textContent = value;
            var isPill = node.id === 'wep-message';
            node.className = 'wep-status' + (isPill ? ' wep-header-status-pill' : '') + (kind ? ' ' + kind : '');
            if (isPill) node.style.display = value ? 'inline-flex' : 'none';
        }
        function feature(name) {
            if (name.indexOf('monaco.plus.update_sets.') === 0) return 'Update Sets';
            if (name.indexOf('monaco.plus.assistant.') === 0) return 'Assistant+';
            if (name.indexOf('monaco.plus.code_search.') === 0) return 'Code Search+';
            var other = name.match(/^monaco\.plus\.([a-z0-9_]+)\./);
            if (other && ['widget', 'css', 'scss'].indexOf(other[1]) === -1) {
                return other[1].replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) + '+';
            }
            return 'Widget Editor+';
        }
        function isJsonProperty(property) {
            if (property.name === 'monaco.plus.update_sets.markdown_display') return true;
            if (/^monaco\.plus\.(?:assistant\.table_config\.|css\.variables$|scss\.variables$)/.test(property.name)) return true;
            try {
                var value = JSON.parse(property.value);
                return value !== null && typeof value === 'object';
            } catch (e) { return false; }
        }
        function resizePlainTextarea(input) {
            if (!input || input.hidden || !input.parentNode) return;
            input.style.height = 'auto';
            var cap = Math.max(76, Math.floor(window.innerHeight * 0.5));
            var needed = Math.max(76, input.scrollHeight);
            input.style.height = Math.min(needed, cap) + 'px';
            input.style.overflowY = needed > cap ? 'auto' : 'hidden';
        }
        function monacoTheme() {
            try {
                var bg = window.getComputedStyle(document.documentElement)
                    .getPropertyValue('--now-color_background--primary').trim();
                var parts = bg.split(/[\s,]+/).map(Number);
                if (parts.length >= 3 && parts.slice(0, 3).every(function (value) { return !isNaN(value); })) {
                    return (parts[0] + parts[1] + parts[2]) / 3 >= 128 ? 'vs' : 'vs-dark';
                }
            } catch (e) {}
            return window.NOW && window.NOW.theme && /dark/i.test(window.NOW.theme.name || '') ? 'vs-dark' : 'vs';
        }
        function ensureMonacoWorker() {
            window.MonacoEnvironment = window.MonacoEnvironment || {};
            if (typeof window.MonacoEnvironment.getWorker === 'function') return;
            window.MonacoEnvironment.getWorker = function (_id, language) {
                var file = language === 'json' ? 'json.worker.bundle.min.jsx' : 'editor.worker.bundle.min.jsx';
                var url = window.location.origin + '/scripts/snc-code-editor/' + file + '?sysparm_substitute=false';
                var blob = new Blob(['importScripts(' + JSON.stringify(url) + ')'], { type: 'application/javascript' });
                return new Worker(URL.createObjectURL(blob));
            };
        }
        function mountJsonEditor(input, host, onChange) {
            if (!window.monaco || !window.monaco.editor) return null;
            try {
                ensureMonacoWorker();
                var theme = monacoTheme();
                var editor = window.monaco.editor.create(host, {
                    value: input.value, language: 'json', theme: theme,
                    automaticLayout: true, minimap: { enabled: false },
                    scrollBeyondLastLine: false, wordWrap: 'on',
                });
                editor.onDidChangeModelContent(function () {
                    input.value = editor.getValue();
                    onChange();
                });
                function resize() {
                    var cap = Math.max(76, Math.floor(window.innerHeight * 0.5));
                    var content = Math.max(76, Math.ceil(editor.getContentHeight()) + 2);
                    var height = Math.min(content, cap) + 'px';
                    if (host.style.height !== height) {
                        host.style.height = height;
                        editor.layout();
                    }
                }
                editor.onDidContentSizeChange(resize);
                input.hidden = true;
                jsonEditors.push({ editor: editor, resize: resize });
                resize();
                return editor;
            } catch (e) { host.remove(); return null; }
        }
        function propertyCard(property) {
            var card = el('article', 'panel panel-default wep-card');
            card._prop = property;
            card.setAttribute('data-search', (property.name + ' ' + (property.description || '')).toLowerCase());
            var heading = el('div', 'panel-heading');
            heading.appendChild(el('h3', 'panel-title wep-property-name', property.name));
            var isRules = property.name === 'monaco.plus.update_sets.markdown_groups';
            var json = isJsonProperty(property);
            var typeText = isRules ? 'Table hierarchy' : (json ? 'JSON' : (property.type || 'string'));
            var tagClass = 'wep-type-tag ' + (isRules ? 'wep-type-tag--hierarchy' : (json ? 'wep-type-tag--json' : (property.type && property.type.toLowerCase() === 'boolean' ? 'wep-type-tag--boolean' : 'wep-type-tag--string')));
            heading.appendChild(el('span', tagClass, typeText.toUpperCase()));
            card.appendChild(heading);
            var body = el('div', 'panel-body');
            card.appendChild(body);
            if (property.description || isRules) body.appendChild(el('p', 'wep-description', isRules ?
                'Alphabetical table hierarchy for update set Markdown export.' : property.description));
            if (isRules) {
                markdownCard(body);
                return card;
            }
            var input, editor = null;
            var json = isJsonProperty(property);
            if (property.type.toLowerCase() === 'boolean') {
                input = el('select', 'form-control wep-value');
                ['true', 'false'].forEach(function (value) {
                    var option = el('option', '', value); option.value = value; input.appendChild(option);
                });
            } else {
                input = el('textarea', 'form-control wep-value' + (json ? ' wep-json-fallback' : ' wep-plain-textarea'));
                input.rows = json || property.value.length > 160 ? 8 : 3;
                input.setAttribute('aria-label', property.name);
            }
            input.value = property.value;
            body.appendChild(input);
            if (input.tagName.toLowerCase() === 'textarea' && !json) plainTextareas.push(input);
            function valueError() {
                if (readValue().length > 4000) return 'Property value exceeds 4000 characters.';
                if (json) {
                    try { JSON.parse(readValue()); } catch (e) { return 'Invalid JSON.'; }
                }
                return '';
            }
            function readValue() { return editor ? editor.getValue() : input.value; }
            function writeValue(value) {
                if (editor) editor.setValue(value);
                input.value = value;
                if (!json && input.tagName.toLowerCase() === 'textarea') resizePlainTextarea(input);
            }
            var actions = el('div', 'wep-actions');
            var save = button('Save property', function () {
                if (valueError()) { updateDirty(); return; }
                save.disabled = true;
                status(note, 'Saving…');
                var submitted = readValue();
                ajax('saveProperty', { property_name: property.name, property_value: submitted }).then(function (result) {
                    property.value = result.value;
                    if (readValue() === submitted) writeValue(result.value);
                    updateDirty();
                    status(note, 'Saved.', 'success');
                }).catch(function (error) { status(note, error.message, 'error'); })
                    .then(function () { save.disabled = !dirty[property.name] || !!valueError(); });
            });
            save.className = 'btn btn-primary';
            save.disabled = true;
            function updateDirty() {
                if (readValue() === property.value) { delete dirty[property.name]; save.disabled = true; status(note, ''); }
                else { dirty[property.name] = true; var error = valueError(); save.disabled = !!error;
                    status(note, error || 'Unsaved changes', error ? 'error' : 'dirty'); }
            }
            input.oninput = input.onchange = function () {
                if (!json && input.tagName.toLowerCase() === 'textarea') resizePlainTextarea(input);
                updateDirty();
            };
            var reset = button('Revert', function () {
                writeValue(property.value); updateDirty();
            });
            var note = el('span', 'wep-status');
            actions.appendChild(save); actions.appendChild(reset); actions.appendChild(note);
            body.appendChild(actions);
            if (json) {
                var host = el('div', 'wep-monaco');
                body.insertBefore(host, actions);
                window.requestAnimationFrame(function () {
                    editor = mountJsonEditor(input, host, updateDirty);
                    if (!editor) host.remove();
                });
            }
            return card;
        }
        function markdownCard(card) {
            var note = el('span', 'wep-status');
            var panel = el('div', 'wep-tree');
            panel.hidden = true;
            var root = el('div', 'wep-rule-scroll');
            var rules = null, collapsed = {}, revision = 0, mode = 'UI', jsonEditor = null, syncing = false;
            var relatedPicker = null, topPicker = null;
            var toggle = button('Table hierarchy', function () {
                panel.hidden = !panel.hidden;
                toggle.setAttribute('aria-expanded', String(!panel.hidden));
                if (panel.hidden || rules) return;
                status(note, 'Loading…');
                ajax('getRules', {}).then(function (data) {
                    rules = data.rules; renderRules(); status(note, '');
                }).catch(function (error) { status(note, error.message, 'error'); });
            });
            toggle.setAttribute('aria-expanded', 'false');
            var actions = el('div', 'wep-actions');
            actions.appendChild(toggle); actions.appendChild(note); card.appendChild(actions);
            var modes = el('div', 'wep-actions');
            var uiMode = button('UI', function () { setMode('UI'); });
            var jsonMode = button('JSON', function () { setMode('JSON'); });
            uiMode.setAttribute('aria-pressed', 'true'); jsonMode.setAttribute('aria-pressed', 'false');
            modes.appendChild(uiMode); modes.appendChild(jsonMode); panel.appendChild(modes);
            panel.appendChild(root);
            var jsonPanel = el('div', 'wep-hierarchy-json'); jsonPanel.hidden = true;
            var jsonInput = el('textarea', 'form-control wep-value wep-json-fallback');
            jsonInput.setAttribute('aria-label', 'Table hierarchy JSON'); jsonInput.rows = 10;
            jsonPanel.appendChild(jsonInput); panel.appendChild(jsonPanel);
            jsonInput.oninput = jsonInput.onchange = jsonChanged;
            function parseHierarchy() {
                var value;
                try { value = JSON.parse(jsonInput.value); } catch (e) { throw new Error('Invalid JSON.'); }
                var ids = {}, tables = {};
                function valid(nodes, depth) {
                    return Array.isArray(nodes) && nodes.length <= 30 && nodes.every(function (node) {
                        if (!node || depth > 6 || typeof node.id !== 'string' || !/^[a-z0-9_]{1,64}$/i.test(node.id) ||
                            ids[node.id] || typeof node.table !== 'string' || !/^[a-z][a-z0-9_]*$/i.test(node.table) || tables[node.table] ||
                            typeof node.label !== 'string' || !node.label.trim() || node.label.length > 100 ||
                            (depth && (typeof node.field !== 'string' || !/^[a-z][a-z0-9_]*$/i.test(node.field)))) return false;
                        ids[node.id] = true; tables[node.table] = true;
                        return valid(node.children, depth + 1);
                    });
                }
                if (!value || value.version !== 1 || !valid(value.groups, 0)) throw new Error('Invalid Table hierarchy structure.');
                return value;
            }
            function hierarchyError() {
                try {
                    var value = mode === 'JSON' ? parseHierarchy() : rules;
                    if (JSON.stringify(value).length > 4000) return 'Table hierarchy exceeds 4000 characters.';
                } catch (e) { return e.message; }
                return '';
            }
            function jsonChanged() {
                if (syncing) return;
                markRules();
                try { parseHierarchy(); } catch (e) { save.disabled = true; status(note, e.message, 'error'); }
            }
            function setMode(next) {
                if (!rules || mode === next) return;
                if (next === 'UI') {
                    try { rules = parseHierarchy(); } catch (e) { status(note, e.message, 'error'); return; }
                    renderRules();
                } else {
                    closePicker(); syncing = true;
                    jsonInput.value = JSON.stringify(rules, null, 2);
                    if (jsonEditor) jsonEditor.setValue(jsonInput.value);
                    syncing = false;
                }
                mode = next; root.hidden = mode !== 'UI'; jsonPanel.hidden = mode !== 'JSON';
                uiMode.setAttribute('aria-pressed', String(mode === 'UI'));
                jsonMode.setAttribute('aria-pressed', String(mode === 'JSON'));
                if (mode === 'JSON' && !jsonEditor) {
                    var host = el('div', 'wep-monaco'); jsonPanel.appendChild(host);
                    jsonEditor = mountJsonEditor(jsonInput, host, jsonChanged);
                    if (!jsonEditor) host.remove();
                }
                if (jsonEditor && mode === 'JSON') jsonEditor.layout();
                save.disabled = !rulesDirty || !!hierarchyError();
            }
            var footer = el('div', 'wep-actions');
            var save = button('Save hierarchy', function () {
                var error = hierarchyError();
                if (error) { save.disabled = true; status(note, error, 'error'); return; }
                if (mode === 'JSON') {
                    try { rules = parseHierarchy(); } catch (e) { status(note, e.message, 'error'); return; }
                }
                save.disabled = true;
                var submitted = revision;
                status(note, 'Saving…');
                ajax('saveRules', { rules: JSON.stringify(rules) }).then(function () {
                    rulesDirty = revision !== submitted;
                    status(note, rulesDirty ? 'Unsaved changes' : 'Hierarchy saved.', rulesDirty ? 'dirty' : 'success');
                }).catch(function (error) { status(note, error.message, 'error'); })
                    .then(function () { save.disabled = !rulesDirty || !!hierarchyError(); });
            });
            save.className = 'btn btn-primary'; save.disabled = true;
            footer.appendChild(save); panel.appendChild(footer); card.appendChild(panel);
            function markRules() {
                revision++; rulesDirty = true; var error = hierarchyError();
                save.disabled = !!error; status(note, error || 'Unsaved changes', error ? 'error' : 'dirty');
            }
            function closePicker() {
                if (relatedPicker) { relatedPicker.destroy(); relatedPicker = null; }
            }
            function contains(table, nodes) {
                return nodes.some(function (node) { return node.table === table || contains(table, node.children); });
            }
            function openPicker(parent, parentRow, depth, trigger) {
                closePicker();
                relatedPicker = createPicker(parent, parentRow.parentNode, parentRow.nextSibling, depth + 1, trigger);
            }
            function createPicker(parent, body, before, depth, trigger) {
                var row = el('tr', parent ? 'wep-related-picker-row' : 'wep-top-picker-row');
                var inputs = el('td'); inputs.style.paddingLeft = (38 + depth * 20) + 'px';
                var reference = el('td', 'wep-rule-reference');
                var actionsCell = el('td', 'wep-rule-actions');
                var controls = el('div', 'wep-rule-action-group'); actionsCell.appendChild(controls);
                row.appendChild(inputs); row.appendChild(reference); row.appendChild(actionsCell);
                body.insertBefore(row, before || null);
                var input = el('input'); input.type = 'hidden';
                input.setAttribute('aria-label', parent ? 'Related table' : 'Top-level table');
                inputs.appendChild(input);
                var hint = el('span', 'wep-status'); hint.setAttribute('role', 'status'); inputs.appendChild(hint);
                var selected = null, active = true, timer = null, request = 0, $input = null;
                function iconButton(icon, label, action) {
                    var control = button('', action);
                    control.className = 'btn btn-icon ' + icon;
                    control.title = label; control.setAttribute('aria-label', label);
                    controls.appendChild(control); return control;
                }
                var add = iconButton('icon-add', 'Add table', function () {
                    if (!selected || contains(selected.table, rules.groups)) return;
                    (parent ? parent.children : rules.groups).push({
                        id: 'group_' + Date.now().toString(36), table: selected.table,
                        label: selected.label, field: selected.field || '', children: []
                    });
                    if (parent) collapsed[parent.id] = false;
                    markRules(); renderRules();
                });
                add.disabled = true;
                iconButton('icon-error-circle', 'Cancel', function () {
                    if (parent) { closePicker(); if (trigger) trigger.focus(); }
                    else {
                        selected = null; add.disabled = true; reference.textContent = '';
                        status(hint, '');
                        if ($input) $input.select2('val', '');
                    }
                });
                var jq = window.$j || window.jQuery;
                if (!jq || !jq.fn || !jq.fn.select2) {
                    status(hint, 'The Select2 table picker is unavailable. Reload the page.', 'error');
                } else {
                    $input = jq(input);
                    $input.select2({
                        placeholder: parent ? 'Select a related table' : 'Add a top-level table',
                        minimumInputLength: 0, allowClear: true, width: '100%',
                        query: function (query) {
                            clearTimeout(timer);
                            var current = ++request;
                            timer = setTimeout(function () {
                                ajax(parent ? 'getRelatedTables' : 'searchTables', parent ? { table: parent.table } : { query: query.term || '' })
                                    .then(function (data) {
                                        if (!active || current !== request) return;
                                        var term = (query.term || '').toLowerCase();
                                        var results = data.tables.filter(function (item) {
                                            return !contains(item.table || item.name, rules.groups) &&
                                                (!parent || (item.label + ' ' + item.table + ' ' + item.field).toLowerCase().indexOf(term) !== -1);
                                        }).map(function (item) {
                                            var table = item.table || item.name;
                                            return { id: table + (item.field ? '.' + item.field : ''),
                                                text: item.label + ' (' + table + ')' + (item.field ? ' → ' + item.field : ''),
                                                table: table, label: item.label, field: item.field || '' };
                                        });
                                        status(hint, ''); query.callback({ results: results, more: false });
                                    }).catch(function (error) {
                                        if (!active || current !== request) return;
                                        status(hint, error.message, 'error'); query.callback({ results: [], more: false });
                                    });
                            }, 250);
                        }
                    });
                    $input.on('change.wepRules', function () {
                        selected = $input.select2('data');
                        add.disabled = !selected || contains(selected.table, rules.groups);
                        reference.textContent = selected ? selected.field : '';
                    });
                }
                return { destroy: function () {
                    active = false; request++; clearTimeout(timer);
                    if ($input) { $input.off('.wepRules'); $input.select2('destroy'); }
                    row.remove();
                } };
            }
            function renderRules() {
                closePicker();
                if (topPicker) { topPicker.destroy(); topPicker = null; }
                root.textContent = '';
                var table = el('table', 'wep-rule-table');
                var head = el('thead'), header = el('tr');
                ['Table hierarchy', 'Reference to parent', 'Actions'].forEach(function (label) {
                    var cell = el('th', '', label); cell.setAttribute('scope', 'col'); header.appendChild(cell);
                });
                head.appendChild(header); table.appendChild(head);
                var body = el('tbody'); table.appendChild(body); root.appendChild(table);
                function render(nodes, depth) {
                    nodes.sort(function (a, b) { return a.label.localeCompare(b.label) || a.table.localeCompare(b.table); });
                    nodes.forEach(function (node) {
                        if (collapsed[node.id] === undefined) collapsed[node.id] = true;
                        var row = el('tr'), name = el('td');
                        name.style.paddingLeft = (10 + depth * 20) + 'px';
                        var branch = el('div', 'wep-rule-name');
                        if (node.children.length) {
                            var expand = button('', function () { collapsed[node.id] = !collapsed[node.id]; renderRules(); });
                            expand.className = 'btn btn-icon ' + (collapsed[node.id] ? 'icon-chevron-right' : 'icon-chevron-down');
                            expand.setAttribute('aria-label', (collapsed[node.id] ? 'Expand ' : 'Collapse ') + node.label);
                            expand.setAttribute('aria-expanded', String(!collapsed[node.id])); branch.appendChild(expand);
                        } else branch.appendChild(el('span', 'wep-rule-spacer'));
                        var text = el('span'); text.appendChild(el('strong', '', node.label));
                        text.appendChild(el('code', '', node.table)); branch.appendChild(text); name.appendChild(branch); row.appendChild(name);
                        row.appendChild(el('td', 'wep-rule-reference', depth ? node.field : '—'));
                        var actionsCell = el('td', 'wep-rule-actions');
                        var controls = el('div', 'wep-rule-action-group');
                        actionsCell.appendChild(controls);
                        var child = button('', function () { openPicker(node, row, depth, child); });
                        child.className = 'btn btn-icon icon-search';
                        child.title = 'Add related tables';
                        child.setAttribute('aria-label', 'Add related tables');
                        child.disabled = depth >= 6; controls.appendChild(child);
                        var remove = button('', function () {
                            nodes.splice(nodes.indexOf(node), 1); closePicker(); markRules(); renderRules();
                        });
                        remove.className = 'btn btn-icon icon-error-circle';
                        remove.title = 'Remove';
                        remove.setAttribute('aria-label', 'Remove'); controls.appendChild(remove);
                        row.appendChild(actionsCell); body.appendChild(row);
                        if (!collapsed[node.id]) render(node.children, depth + 1);
                    });
                }
                render(rules.groups, 0);
                topPicker = createPicker(null, body, null, 0, null);
            }
        }
        function render(properties) {
            if (sections) sections.textContent = '';
            if (nav) nav.textContent = '';
            var features = ['Widget Editor+', 'Assistant+', 'Code Search+'];
            properties.forEach(function (property) {
                var name = feature(property.name);
                if (name !== 'Update Sets' && features.indexOf(name) === -1) features.push(name);
            });
            if (properties.some(function (p) { return feature(p.name) === 'Update Sets'; })) {
                features.push('Update Sets');
            }
            function updateNavState() {
                if (!nav) return;
                Array.prototype.forEach.call(nav.querySelectorAll('li'), function (li) {
                    var featureName = li.getAttribute('data-feature');
                    var isSelected = !!activeFeatures[featureName];
                    var link = li.querySelector ? li.querySelector('button') : (li.children ? li.children[0] : null);
                    if (link && link.setAttribute) {
                        link.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
                        link.title = isSelected ? 'Click to show all properties' : 'Click to filter to ' + featureName;
                    }
                    if (link && link.classList) {
                        if (isSelected) link.classList.add('active');
                        else link.classList.remove('active');
                    }
                    if (li.classList) {
                        if (isSelected) li.classList.add('active');
                        else li.classList.remove('active');
                    } else {
                        var base = (li.className || '').replace(/\bactive\b/g, '').trim();
                        li.className = (base + (isSelected ? ' active' : '')).trim();
                    }
                });
            }
            features.forEach(function (name, index) {
                var matches = properties.filter(function (property) { return feature(property.name) === name; });
                if (!matches.length) return;
                var section = el('section', 'wep-section');
                section.id = 'wep-feature-' + index;
                section.setAttribute('data-feature', name);
                var heading = el('h2', 'wep-feature-heading', name);
                var countBadge = el('span', 'wep-section-count', matches.length + (matches.length === 1 ? ' property' : ' properties'));
                heading.appendChild(countBadge);
                section.appendChild(heading);
                matches.forEach(function (property) { section.appendChild(propertyCard(property)); });
                if (sections) sections.appendChild(section);
                var item = el('li');
                item.setAttribute('data-feature', name);
                var link = el('button', 'btn btn-default wep-feature-pill');
                link.type = 'button';
                link.setAttribute('aria-pressed', 'false');
                var labelSpan = el('span', 'we-sidebar-item-label', name);
                link.appendChild(labelSpan);
                var pillCount = el('span', 'wep-nav-count we-type-count-pill', String(matches.length));
                link.appendChild(pillCount);
                link.onclick = function (e) {
                    if (e && e.preventDefault) e.preventDefault();
                    if (activeFeatures[name]) {
                        delete activeFeatures[name];
                    } else {
                        activeFeatures[name] = true;
                    }
                    updateNavState();
                    filter();
                };
                item.appendChild(link);
                if (nav) nav.appendChild(item);
            });
            updateNavState();
            filter();
            window.requestAnimationFrame(function () {
                plainTextareas.forEach(resizePlainTextarea);
            });
        }
        function escapeRegex(s) {
            return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        }
        function escapeHtml(s) {
            if (!s) return '';
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        function setHighlight(element, text, query) {
            if (!element) return;
            var str = String(text || '');
            if (!query || typeof element.innerHTML === 'undefined') {
                element.textContent = str;
                return;
            }
            var regex = new RegExp(escapeRegex(query), 'gi');
            var out = '';
            var lastIndex = 0;
            var match;
            while ((match = regex.exec(str)) !== null) {
                out += escapeHtml(str.slice(lastIndex, match.index));
                out += '<mark>' + escapeHtml(match[0]) + '</mark>';
                lastIndex = match.index + match[0].length;
                if (match[0].length === 0) regex.lastIndex++;
            }
            out += escapeHtml(str.slice(lastIndex));
            element.innerHTML = out;
        }
        function filter() {
            var query = (search && search.value ? search.value : '').trim().toLowerCase();
            var clearBtn = document.getElementById('wep-search-clear');
            if (clearBtn) clearBtn.style.display = query ? '' : 'none';
            var totalVisible = 0;
            var activeKeys = Object.keys(activeFeatures).filter(function (k) { return activeFeatures[k]; });
            var hasActiveFilters = activeKeys.length > 0;
            if (sections) {
                Array.prototype.forEach.call(sections.querySelectorAll('.wep-section'), function (section) {
                    var featureName = section.getAttribute('data-feature') || '';
                    var isFeatureActive = !hasActiveFilters || !!activeFeatures[featureName];
                    var visible = 0;
                    Array.prototype.forEach.call(section.querySelectorAll('.wep-card'), function (card) {
                        var cardSearch = card.getAttribute('data-search') || '';
                        var matches = isFeatureActive && (!query || cardSearch.indexOf(query) !== -1);
                        card.hidden = !matches;
                        if (matches) {
                            visible++;
                            if (card._prop) {
                                var titles = card.querySelectorAll ? card.querySelectorAll('.wep-property-name') : [];
                                var titleEl = titles.length ? titles[0] : null;
                                var descs = card.querySelectorAll ? card.querySelectorAll('.wep-description') : [];
                                var descEl = descs.length ? descs[0] : null;
                                setHighlight(titleEl, card._prop.name, query);
                                if (descEl) setHighlight(descEl, card._prop.description || '', query);
                            }
                        }
                    });
                    section.hidden = !visible;
                    totalVisible += visible;
                });
            }
            var emptySearch = document.getElementById('wep-empty-search');
            if (emptySearch) emptySearch.style.display = (query && totalVisible === 0) ? '' : 'none';
            window.requestAnimationFrame(function () {
                jsonEditors.forEach(function (item) { item.editor.layout(); item.resize(); });
            });
        }
        var clearBtn = document.getElementById('wep-search-clear');
        if (clearBtn) {
            clearBtn.onclick = function () {
                if (search) {
                    search.value = '';
                    search.focus();
                }
                filter();
            };
        }
        if (search) search.oninput = filter;
        window.addEventListener('resize', function () {
            plainTextareas.forEach(resizePlainTextarea);
            jsonEditors.forEach(function (item) { item.editor.layout(); item.resize(); });
        });
        window.addEventListener('beforeunload', function (event) {
            if (!rulesDirty && !Object.keys(dirty).length) return;
            event.preventDefault(); event.returnValue = '';
        });
        window.addEventListener('unload', function () {
            jsonEditors.forEach(function (item) { try { item.editor.dispose(); } catch (e) {} });
        });
        ajax('getProperties', {}).then(function (data) {
            render(data.properties);
        }).catch(function (error) { status(message, error.message, 'error'); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
    else initialise();
})();
