import { Property } from '@servicenow/sdk/core'

export const markdownDisplaySysScriptProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-sys_script'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.sys_script',
    type: 'string',
    value: `{
    "display_value": "name",
    "additional_fields": "collection,when"
}`,
    description: 'Display and additional fields for Business Rules in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
