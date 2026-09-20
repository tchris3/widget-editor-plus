import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['341d7f2780c78746be6dea94fccf416a'],
    table: 'sys_update_xml',
    name: 'Copy record URL',
    actionName: 'copy_customer_update_record_url',
    form: {
        showContextMenu: true,
    },
    list: {
        showContextMenu: true,
    },
    client: {
        isClient: true,
        isUi11Compatible: true,
        onClick: 'copyCustomerUpdateRecordUrl()',
    },
    workspace: {
        clientScriptV2: `function onClick(g_form) {

}`,
    },
    condition:
        'new GlideRecord("sys_metadata").get("sys_update_name", current.name.toString())',
    comments:
        'Copies the navigation URL for the target record represented by this customer update.',
    messages: [
        'Copy record URL could not resolve the record represented by this customer update.',
        'Record URL copied to clipboard.',
    ],
    // Keep this after the platform Copy URL to clipboard entry and before Compare to Current.
    order: 90,
    script: `function copyCustomerUpdateRecordUrl() {
    var updateSysId = typeof rowSysId !== 'undefined'
        ? rowSysId
        : gel('sys_uniqueValue').value;
    if (!updateSysId) { return; }

    var ga = new GlideAjax('WidgetEditorAjax');
    ga.addParam('sysparm_name', 'getCustomerUpdateTarget');
    ga.addParam('update_id', updateSysId);
    ga.getXMLAnswer(function(answer) {
        var result;
        try {
            result = JSON.parse(answer || '{}');
        } catch (e) {
            result = { success: false };
        }

        if (!result.success || !result.table || !result.record_id) {
            alert(getMessage(result.error || 'Copy record URL could not resolve the record represented by this customer update.'));
            return;
        }

        var recordUri = result.table + '.do?sys_id=' + result.record_id;
        var url = window.location.origin + '/nav_to.do?uri=' + encodeURIComponent(recordUri);
        _weCopyRecordUrlToClipboard(url);
    });
}

function _weCopyRecordUrlToClipboard(value) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(value).then(function() {
            _weNotifyRecordUrlCopied();
        }).catch(function() {
            _weCopyRecordUrlLegacy(value);
        });
        return;
    }

    _weCopyRecordUrlLegacy(value);
}

function _weCopyRecordUrlLegacy(value) {
    var textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    var copied = false;
    try {
        copied = document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(textarea);

    if (copied) {
        _weNotifyRecordUrlCopied();
    } else {
        window.prompt('Copy record URL:', value);
    }
}

function _weNotifyRecordUrlCopied() {
    var notification = new GlideUINotification({
        type: 'info',
        text: getMessage('Record URL copied to clipboard.'),
        duration: 5000,
    });
    NOW.CustomEvent.fireTop('glide:ui_notification.info', notification);
}
`,
    showUpdate: true,
    showInsert: false,
    isolateScript: false,
    roles: ['sp_admin'],
})
