import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['987709096eb2ae2febce3b58151f28f7'],
    table: 'sys_update_xml',
    name: 'Compare+',
    actionName: 'compare_customer_update_plus',
    form: {
        showLink: true,
    },
    list: {
        showContextMenu: true,
    },
    client: {
        isClient: true,
        isUi11Compatible: true,
        onClick: 'compareCustomerUpdatePlus()',
    },
    workspace: {
        clientScriptV2: `function onClick(g_form) {

}`,
    },
    condition: "current.table != 'sys_upgrade_history_log'",
    comments:
        'Compares the update-set version with the last version from before that update set in Compare+.',
    messages: [
        'Compare+ could not find the version captured by this customer update.',
        'No previous update set found.',
    ],
    // The platform Compare to Current Record action is 100.
    order: 110,
    script: `function compareCustomerUpdatePlus() {
    var updateSysId = typeof rowSysId !== 'undefined'
        ? rowSysId
        : gel('sys_uniqueValue').value;
    if (!updateSysId) { return; }

    var ga = new GlideAjax('WidgetEditorAjax');
    ga.addParam('sysparm_name', 'getCustomerUpdateComparison');
    ga.addParam('update_id', updateSysId);
    ga.getXMLAnswer(function(answer) {
        var result;
        try {
            result = JSON.parse(answer || '{}');
        } catch (e) {
            result = { success: false, error: 'Compare+ returned an invalid response.' };
        }

        if (!result.success) {
            if (result.reason === 'no_previous_update_set') {
                var notification = new GlideUINotification({
                    type: 'info',
                    text: getMessage('No previous update set found.'),
                    duration: 8000,
                });
                NOW.CustomEvent.fireTop('glide:ui_notification.info', notification);
                return;
            }
            alert(getMessage(result.error || 'Compare+ could not resolve this customer update.'));
            return;
        }

        var params = 'table='      + encodeURIComponent(result.table) +
                     '&record_id=' + encodeURIComponent(result.record_id) +
                     '&version_1=' + encodeURIComponent(result.version_1) +
                     '&version_2=' + encodeURIComponent(result.version_2) +
                     '&da_source=list';

        g_navigation.open(
            'ui_page.do?sys_id=51ec3d258363b61070b8b5dfeeaad36b&' + params,
            '_blank'
        );
    });
}
`,
    showUpdate: true,
    showInsert: true,
    isolateScript: false,
    roles: ['sp_admin'],
})
