import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['90b5cf0d83ebb21070b8b5dfeeaad3bb'],
    localOrExisting: 'Existing',
    type: 'ui_page',
    operation: 'read',
    roles: ['sp_admin'],
    name: 'widget_editor',
})
