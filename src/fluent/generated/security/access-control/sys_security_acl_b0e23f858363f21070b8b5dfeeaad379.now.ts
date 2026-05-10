import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['b0e23f858363f21070b8b5dfeeaad379'],
    localOrExisting: 'Existing',
    type: 'client_callable_script_include',
    operation: 'execute',
    roles: ['sp_admin'],
    name: 'WidgetEditorAjax',
})
