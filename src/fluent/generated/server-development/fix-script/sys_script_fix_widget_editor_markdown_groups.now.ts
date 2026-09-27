import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-markdown-groups-migration'],
    table: 'sys_script_fix',
    data: {
        name: 'Split Markdown table properties',
        before: true,
        unloadable: true,
        record_for_rollback: true,
        description: 'Migrate the legacy hierarchy before installing per-table defaults. Existing table properties are preserved; the legacy property is cleared only after successful migration.',
        script: Now.include('./widget_editor_markdown_groups_migrate.server.js'),
    },
})
