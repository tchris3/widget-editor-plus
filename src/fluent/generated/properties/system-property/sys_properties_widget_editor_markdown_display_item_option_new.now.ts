import { Property } from '@servicenow/sdk/core'

export const markdownDisplayItemOptionNewProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-item_option_new'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.item_option_new',
    type: 'string',
    value: `{
    "display_value": "name",
    "additional_fields": "type"
}`,
    description: 'Display and additional fields for Variables in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
