import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-markdown-page-defaults-migration'],
    table: 'sys_script_fix',
    data: {
        name: 'Move default widget instances into page hierarchy',
        before: false,
        unloadable: true,
        record_for_rollback: true,
        description: 'Move sp_instance from the unchanged former Widget grouping default to the page hierarchy. Preserve customised Widget configurations.',
        script: Now.include('./widget_editor_markdown_page_defaults_migrate.server.js'),
    },
})
