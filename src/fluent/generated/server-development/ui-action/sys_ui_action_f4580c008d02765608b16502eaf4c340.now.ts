import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['f4580c008d02765608b16502eaf4c340'],
    table: 'sys_update_xml',
    name: 'Open in Widget Editor+',
    actionName: 'open_customer_update_widget_editor_plus',
    form: {
        showLink: true,
    },
    client: {
        isClient: true,
        isUi11Compatible: true,
        onClick: 'openCustomerUpdateInWidgetEditorPlus()',
    },
    workspace: {
        clientScriptV2: `function onClick(g_form) {

}`,
    },
    condition:
        "current.name.toString().indexOf('sp_widget_') == 0 || current.name.toString().indexOf('sp_header_footer_') == 0",
    comments:
        'Opens the sp_widget or sp_header_footer record represented by this customer update in Widget Editor+.',
    messages: [
        'Widget Editor+ could not resolve the record represented by this customer update.',
    ],
    // The platform Show Related Record action is 1000.
    order: 990,
    script: `function openCustomerUpdateInWidgetEditorPlus() {
    var updateSysId = gel('sys_uniqueValue').value;
    if (!updateSysId) { return; }

    var ga = new GlideAjax('WidgetEditorAjax');
    ga.addParam('sysparm_name', 'getCustomerUpdateWidgetTarget');
    ga.addParam('update_id', updateSysId);
    ga.getXMLAnswer(function(answer) {
        var result;
        try {
            result = JSON.parse(answer || '{}');
        } catch (e) {
            result = { success: false };
        }

        if (!result.success || !result.record_id) {
            alert(getMessage(result.error || 'Widget Editor+ could not resolve the record represented by this customer update.'));
            return;
        }

        g_navigation.open(
            'ui_page.do?sys_id=8b2e70458373fe1070b8b5dfeeaad35e&widget_id=' +
                encodeURIComponent(result.record_id),
            '_blank'
        );
    });
}
`,
    showUpdate: true,
    showInsert: false,
    isolateScript: false,
    roles: ['sp_admin'],
})
