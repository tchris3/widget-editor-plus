import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['widget-editor-assistant-script-include-acl'],
    localOrExisting: 'Existing',
    type: 'client_callable_script_include',
    operation: 'execute',
    roles: ['sp_admin'],
    name: 'WidgetEditorAssistantAjax',
})
