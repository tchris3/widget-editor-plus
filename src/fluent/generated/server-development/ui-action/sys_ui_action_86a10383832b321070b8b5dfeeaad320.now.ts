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

    var versionName = gr.getValue('name');
    if (!versionName) { return; }

    // Version name format: <table>_<32-hex-sys_id>
    var match = versionName.match(/^(.+)_([0-9a-f]{32})$/i);
    if (!match) { return; }

    var params = 'table='     + encodeURIComponent(match[1]) +
                 '&record_id=' + encodeURIComponent(match[2]) +
                 '&version_1=' + encodeURIComponent(versionSysId) +
                 '&da_source=list';

    g_navigation.open('ui_page.do?sys_id=51ec3d258363b61070b8b5dfeeaad36b&' + params, '_blank');
}
`,
    showUpdate: true,
    showInsert: false,
    isolateScript: true,
    roles: ['sp_admin'],
})
