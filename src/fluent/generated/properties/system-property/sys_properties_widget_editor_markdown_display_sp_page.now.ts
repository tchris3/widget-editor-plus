import { Property } from '@servicenow/sdk/core'

export const markdownDisplaySpPageProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-sp_page'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.sp_page',
    type: 'string',
    value: `{
    "display_value": "title",
    "additional_fields": "id"
}`,
    description: 'Display and additional fields for Pages in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
