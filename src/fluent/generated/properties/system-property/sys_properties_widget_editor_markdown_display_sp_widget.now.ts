import { Property } from '@servicenow/sdk/core'

export const markdownDisplaySpWidgetProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-sp_widget'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.sp_widget',
    type: 'string',
    value: `{
    "display_value": "name",
    "additional_fields": "id"
}`,
    description: 'Display and additional fields for Widgets in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
