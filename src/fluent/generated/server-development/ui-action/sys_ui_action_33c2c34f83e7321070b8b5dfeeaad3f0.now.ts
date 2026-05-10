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

    var versionName = gr.getValue('name');
    if (!versionName) { return; }

    // Version name format: <table>_<32-hex-sys_id>
    var match = versionName.match(/^(.+)_([0-9a-f]{32})$/i);
    if (!match) { return; }

    var params = 'table='     + encodeURIComponent(match[1]) +
                 '&record_id=' + encodeURIComponent(match[2]) +
                 '&version_1=' + encodeURIComponent(ids[0]) +
                 '&version_2=' + encodeURIComponent(ids[1]) +
                 '&da_source=list';

    g_navigation.open('ui_page.do?sys_id=51ec3d258363b61070b8b5dfeeaad36b&' + params, '_blank');
}
`,
    showUpdate: true,
    showInsert: true,
    isolateScript: true,
    roles: ['sp_admin'],
})
