function copyUpdateSetMarkdownPlus() {
    var clicked = typeof rowSysId !== 'undefined' && rowSysId ? rowSysId :
        (typeof g_sysId !== 'undefined' && /^[0-9a-f]{32}$/i.test(String(g_sysId)) ? g_sysId : '');
    var checked = !clicked && typeof g_list !== 'undefined' && g_list.getChecked ? g_list.getChecked() : '';
    var ids = clicked ? [clicked] : String(checked || '').split(',').filter(Boolean);
    if (!ids.length) { alert('Select at least one customer update.'); return; }
    _weResolveMarkdownSets(ids).then(function (sets) {
        if (sets.length === 1) { _weCopyMarkdownSets(sets, 'combined'); return; }
        var dialog = new GlideModal('widget_editor_assistant_markdown_options', false, 430);
        dialog.setTitle('Export Markdown');
        dialog.setPreference('onChoice', function (mode) { _weCopyMarkdownSets(sets, mode); });
        dialog.setPreference('sysparm_set_count', String(sets.length));
        dialog.render();
    }).catch(function (error) { alert(error.message || String(error)); });
}

function _weMarkdownAjax(method, params) {
    return new Promise(function (resolve, reject) {
        var ga = new GlideAjax('WidgetEditorMarkdownAjax');
        ga.addParam('sysparm_name', method);
        Object.keys(params || {}).forEach(function (key) { ga.addParam(key, params[key]); });
        ga.getXMLAnswer(function (answer) {
            var result;
            try { result = JSON.parse(answer || '{}'); } catch (e) { reject(new Error('Invalid Markdown response.')); return; }
            if (!result.success) { reject(new Error(result.error || 'Markdown request failed.')); return; }
            resolve(result);
        });
    });
}

function _weResolveMarkdownSets(ids) {
    var requests = [];
    for (var i = 0; i < ids.length; i += 100) {
        requests.push(_weMarkdownAjax('getSetsForUpdates', { update_ids: ids.slice(i, i + 100).join(',') }));
    }
    return Promise.all(requests).then(function (results) {
        var seen = {}, sets = [];
        results.forEach(function (result) {
            result.sets.forEach(function (set) {
                var key = set.table + ':' + set.id;
                if (!seen[key]) { seen[key] = true; sets.push(set); }
            });
        });
        sets.sort(function (a, b) { return a.name.localeCompare(b.name) || a.id.localeCompare(b.id); });
        return sets;
    });
}

function _weLoadMarkdownSet(set) {
    var rows = [], offset = 0;
    function next() {
        return _weMarkdownAjax('getMemberPage', { set_table: set.table, set_id: set.id, offset: offset }).then(function (page) {
            rows = rows.concat(page.rows);
            if (!page.hasMore) return rows;
            if (page.nextOffset <= offset) throw new Error('Markdown paging did not advance.');
            offset = page.nextOffset;
            return next();
        });
    }
    return next().then(function (all) {
        var seen = {};
        return { set: set, rows: all.filter(function (row) {
            var key = row.table + ':' + row.id;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        }) };
    });
}

function _weMarkdownEscape(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().replace(/[\\`*_{}\[\]()#+.!|<>~-]/g, '\\$&');
}
function _weMarkdownLink(name, url) {
    var label = _weMarkdownEscape(name);
    return url ? '[' + label + '](' + String(url).replace(/\(/g, '%28').replace(/\)/g, '%29') + ')' : label;
}
function _weMarkdownContainer() { return { types: {} }; }
function _weMarkdownType(container, label, order) {
    if (!container.types[label]) container.types[label] = { label: label, order: order == null ? 10000 : order, records: {} };
    return container.types[label];
}
function _weMarkdownRecord(type, record) {
    var key = record.table + ':' + record.id;
    if (!type.records[key]) type.records[key] = { table: record.table, id: record.id, name: record.name,
        url: record.url, secondary: record.secondary || [], action: record.action || '', types: {} };
    else if (record.updateId) {
        type.records[key].name = record.name;
        type.records[key].url = record.url;
        type.records[key].secondary = record.secondary || [];
        type.records[key].action = record.action || '';
    }
    return type.records[key];
}
function _weMarkdownTree(rows) {
    var root = _weMarkdownContainer();
    rows.forEach(function (row) {
        var parent = root;
        (row.ancestors || []).forEach(function (ancestor) {
            parent = _weMarkdownRecord(_weMarkdownType(parent, ancestor.type, ancestor.typeOrder), ancestor);
        });
        _weMarkdownRecord(_weMarkdownType(parent, row.type, row.typeOrder), row);
    });
    return root;
}
function _weMarkdownRender(container, depth) {
    var lines = [];
    Object.keys(container.types).sort(function (a, b) {
        return a.localeCompare(b);
    }).forEach(function (label) {
        var type = container.types[label];
        lines.push(Array(depth * 2 + 1).join(' ') + '- **' + _weMarkdownEscape(label) + '**');
        Object.keys(type.records).sort(function (a, b) {
            return type.records[a].name.localeCompare(type.records[b].name) || a.localeCompare(b);
        }).forEach(function (key) {
            var record = type.records[key];
            lines.push(Array(depth * 2 + 3).join(' ') + '- ' + _weMarkdownLink(record.name, record.url) +
                (record.secondary.length ? ' ' + record.secondary.map(_weMarkdownEscape).join(' | ') : '') +
                (record.action === 'DELETE' ? ' (deleted)' : ''));
            lines = lines.concat(_weMarkdownRender(record, depth + 2));
        });
    });
    return lines;
}
function _weMarkdownText(loaded, mode) {
    if (mode === 'separate') return loaded.map(function (item) {
        return '## ' + _weMarkdownLink(item.set.name, item.set.url) + '\n\n' +
            _weMarkdownRender(_weMarkdownTree(item.rows), 0).join('\n');
    }).join('\n\n');
    var seen = {}, rows = [];
    loaded.forEach(function (item) { item.rows.forEach(function (row) {
        var key = row.table + ':' + row.id;
        if (!seen[key]) { seen[key] = true; rows.push(row); }
    }); });
    return _weMarkdownRender(_weMarkdownTree(rows), 0).join('\n');
}

function _weCopyMarkdownSets(sets, mode) {
    Promise.all(sets.map(_weLoadMarkdownSet)).then(function (loaded) {
        var value = _weMarkdownText(loaded, mode);
        if (!value) throw new Error('No customer updates were found in these update sets.');
        return _weWriteMarkdownClipboard(value);
    }).then(function () {
        var note = new GlideUINotification({ type: 'info', text: 'Update Set Markdown copied to clipboard.', duration: 5000 });
        NOW.CustomEvent.fireTop('glide:ui_notification.info', note);
    }).catch(function (error) { alert(error.message || String(error)); });
}
function _weWriteMarkdownClipboard(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(value).catch(function () { return _weMarkdownLegacyCopy(value); });
    }
    return _weMarkdownLegacyCopy(value);
}
function _weMarkdownLegacyCopy(value) {
    var box = document.createElement('textarea');
    box.value = value;
    box.setAttribute('readonly', 'readonly');
    box.style.position = 'fixed';
    box.style.opacity = '0';
    document.body.appendChild(box);
    box.select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(box);
    if (copied) return Promise.resolve();
    _weShowMarkdownForManualCopy(value);
    return Promise.reject(new Error('Automatic copying was blocked. Select and copy the Markdown shown on screen.'));
}
function _weShowMarkdownForManualCopy(value) {
    var backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:20000;display:flex;align-items:center;justify-content:center';
    var panel = document.createElement('div');
    panel.style.cssText = 'background:white;color:#222;width:min(800px,90vw);padding:20px;border-radius:8px';
    var title = document.createElement('h2'); title.textContent = 'Export Markdown';
    var text = document.createElement('textarea'); text.value = value; text.readOnly = true;
    text.style.cssText = 'width:100%;height:50vh;margin:12px 0;font-family:monospace';
    var close = document.createElement('button'); close.textContent = 'Close';
    close.onclick = function () { document.body.removeChild(backdrop); };
    panel.appendChild(title); panel.appendChild(text); panel.appendChild(close);
    backdrop.appendChild(panel); document.body.appendChild(backdrop); text.select();
}
