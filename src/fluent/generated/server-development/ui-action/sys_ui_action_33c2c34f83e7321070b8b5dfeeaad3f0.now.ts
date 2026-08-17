import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['33c2c34f83e7321070b8b5dfeeaad3f0'],
    table: 'sys_update_version',
    name: 'Compare+',
    actionName: 'compare_plus',
    list: {
        showListChoice: true,
    },
    client: {
        isClient: true,
        isUi11Compatible: true,
        onClick: 'compareVersionsPlus()',
    },
    workspace: {
        clientScriptV2: `function onClick(g_form) {

}`,
    },
    comments: 'Opens the selected versions in Widget Editor+ diff viewer.',
    messages: [],
    script: `function compareVersionsPlus() {
    var checked = typeof g_list !== 'undefined' && g_list.getChecked();
    var ids = checked ? checked.split(',').filter(Boolean) : [];

    if (ids.length !== 2) {
        alert('Please select exactly 2 versions to compare.');
        return;
    }

    var gr = new GlideRecord('sys_update_version');
    gr.addQuery('sys_id', ids[0]);
    gr.query();
    if (!gr.next()) { return; }

    // The version name is only "<table>_<32-hex-sys_id>" for tables keyed by
    // sys_id. Composite-keyed tables (e.g. sys_dictionary) name versions
    // "<table>_<element>" instead, so the target record is read from the
    // update payload XML rather than parsed out of the name.
    var target = _weParseVersionTarget(gr.getValue('payload'));
    if (!target) { return; }

    var params = 'table='     + encodeURIComponent(target.table) +
                 '&record_id=' + encodeURIComponent(target.sysId) +
                 '&version_1=' + encodeURIComponent(ids[0]) +
                 '&version_2=' + encodeURIComponent(ids[1]) +
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
    showInsert: true,
    isolateScript: true,
    roles: ['sp_admin'],
})
