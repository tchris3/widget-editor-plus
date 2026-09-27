import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-markdown-list-header-menu'],
    table: 'sys_ui_context_menu',
    data: {
        name: 'Export Markdown+',
        table: 'sys_update_xml',
        menu: 'list_header',
        type: 'action',
        active: true,
        order: 120,
        condition: "gs.hasRole('sp_admin')",
        action_script: `${Now.include('../../server-development/ui-action/widget_editor_markdown_copy.client.js')}
copyUpdateSetMarkdownPlus(g_list);`,
    },
})
