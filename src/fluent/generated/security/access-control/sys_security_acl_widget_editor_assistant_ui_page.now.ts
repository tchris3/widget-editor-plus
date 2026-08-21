import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['widget-editor-assistant-ui-page-acl'],
    localOrExisting: 'Existing',
    type: 'ui_page',
    operation: 'read',
    roles: ['sp_admin'],
    name: 'widget_editor_assistant',
})
