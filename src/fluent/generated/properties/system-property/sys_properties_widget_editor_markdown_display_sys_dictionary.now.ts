import { Property } from '@servicenow/sdk/core'

export const markdownDisplaySysDictionaryProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-sys_dictionary'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.sys_dictionary',
    type: 'string',
    value: `{
    "display_value": "name,element",
    "display_separator": ".",
    "additional_fields": "column_label,internal_type"
}`,
    description: 'Combine table name and element as name.element, with column label and internal type, for Dictionary records in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
