import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['widget-editor-plus-properties-page-acl'],
    localOrExisting: 'Existing',
    type: 'ui_page',
    operation: 'read',
    roles: ['admin'],
    active: true,
    script: 'answer = gs.hasRole("admin");',
    name: 'widget_editor_plus_properties',
})
