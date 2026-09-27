import { Property } from '@servicenow/sdk/core'

export const markdownDisplaySysScriptClientProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-sys_script_client'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.sys_script_client',
    type: 'string',
    value: `{
    "display_value": "name",
    "additional_fields": "table,type"
}`,
    description: 'Display and additional fields for Client Scripts in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
