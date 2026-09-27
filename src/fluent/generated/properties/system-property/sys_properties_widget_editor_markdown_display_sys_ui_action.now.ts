import { Property } from '@servicenow/sdk/core'

export const markdownDisplaySysUiActionProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-sys_ui_action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.sys_ui_action',
    type: 'string',
    value: `{
    "display_value": "name",
    "additional_fields": "table"
}`,
    description: 'Display and additional fields for UI Actions in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
