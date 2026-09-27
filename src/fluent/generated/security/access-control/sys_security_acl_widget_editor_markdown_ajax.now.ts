import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['widget-editor-assistant-markdown-ajax-acl'],
    localOrExisting: 'Existing',
    type: 'client_callable_script_include',
    operation: 'execute',
    roles: ['sp_admin', 'admin'],
    name: 'WidgetEditorMarkdownAjax',
})
