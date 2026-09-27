import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['widget-editor-assistant-copy-update-set-markdown'],
    table: 'sys_update_xml',
    name: 'Export Markdown+',
    actionName: 'copy_update_set_markdown_plus',
    list: { showListChoice: true, showContextMenu: true, showLink: true },
    client: { isClient: true, isUi11Compatible: true, onClick: "copyUpdateSetMarkdownPlus(typeof g_list !== 'undefined' ? g_list : null, this)" },
    comments: 'Copies linked, grouped Markdown for all customer updates matching the current list filter.',
    order: 120,
    showUpdate: true,
    showInsert: false,
    isolateScript: false,
    roles: ['sp_admin'],
    script: Now.include('./widget_editor_markdown_copy.client.js'),
})
