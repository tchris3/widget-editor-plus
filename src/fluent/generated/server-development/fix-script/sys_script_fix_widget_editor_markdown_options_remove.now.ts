import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-markdown-options-removal'],
    table: 'sys_script_fix',
    data: {
        name: 'Remove obsolete Markdown export options page',
        before: false,
        unloadable: true,
        record_for_rollback: true,
        description: 'Remove the retired combine/separate options page and its access control from existing installations.',
        script: Now.include('./widget_editor_markdown_options_remove.server.js'),
    },
})
