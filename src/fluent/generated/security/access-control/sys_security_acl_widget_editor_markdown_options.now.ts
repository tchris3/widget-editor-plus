import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['widget-editor-assistant-markdown-options-page-acl'],
    localOrExisting: 'Existing',
    type: 'ui_page',
    operation: 'read',
    roles: ['sp_admin'],
    name: 'widget_editor_assistant_markdown_options',
})
