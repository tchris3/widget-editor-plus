import { Property } from '@servicenow/sdk/core'

export const markdownDisplaySysWsOperationProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-sys_ws_operation'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.sys_ws_operation',
    type: 'string',
    value: `{
    "display_value": "name",
    "additional_fields": "http_method,relative_path"
}`,
    description: 'Display and additional fields for Scripted REST Resources in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
