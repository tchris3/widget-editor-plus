import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['widget-editor-code-search-ui-page-acl'],
    localOrExisting: 'Existing',
    type: 'ui_page',
    operation: 'read',
    roles: ['admin'],
    name: 'widget_editor_code_search',
})
