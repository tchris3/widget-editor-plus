import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['86a10383832b321070b8b5dfeeaad320'],
    table: 'sys_update_version',
    name: 'Compare to Current+',
    actionName: 'compare_to_current_plus',
    form: {
        showLink: true,
    },
    list: {
        showContextMenu: true,
    },
    client: {
        isClient: true,
        isUi11Compatible: true,
        onClick: 'compareVersionToCurrentPlus()',
    },
    workspace: {
        clientScriptV2: `function onClick(g_form) {

}`,
    },
    comments: 'Opens the selected version and compares to the current version in Widget Editor+ diff viewer.',
    messages: [],
    script: `function compareVersionToCurrentPlus() {
    var versionSysId = typeof rowSysId !== 'undefined' ? rowSysId : gel('sys_uniqueValue').value;
    if (!versionSysId) { return; }

    var gr = new GlideRecord('sys_update_version');
    gr.addQuery('sys_id', versionSysId);
    gr.query();
    if (!gr.next()) { return; }

    if (gr.getValue('state') === 'current') {
        alert(getMessage('This is the current version, there is nothing to compare.'));
        return;
    }

    // The version name is only "<table>_<32-hex-sys_id>" for tables keyed by
    // sys_id. Composite-keyed tables (e.g. sys_dictionary) name versions
    // "<table>_<element>" instead, so the target record is read from the
    // update payload XML rather than parsed out of the name.
    var target = _weParseVersionTarget(gr.getValue('payload'));
    if (!target) { return; }

    var params = 'table='     + encodeURIComponent(target.table) +
                 '&record_id=' + encodeURIComponent(target.sysId) +
                 '&version_1=' + encodeURIComponent(versionSysId) +
                 '&da_source=list';

    g_navigation.open('ui_page.do?sys_id=51ec3d258363b61070b8b5dfeeaad36b&' + params, '_blank');
}

function _weParseVersionTarget(payload) {
    if (!payload) { return null; }
    var doc = new DOMParser().parseFromString(payload, 'text/xml');
    var recordEl = doc.documentElement && doc.documentElement.firstElementChild;
    if (!recordEl) { return null; }
    var sysId = '';
    for (var i = 0; i < recordEl.children.length; i++) {
        if (recordEl.children[i].tagName === 'sys_id') {
            sysId = recordEl.children[i].textContent;
            break;
        }
    }
    if (!sysId) { return null; }
    return { table: recordEl.tagName, sysId: sysId };
}
`,
    showUpdate: true,
    showInsert: false,
    isolateScript: true,
    roles: ['sp_admin'],
})
