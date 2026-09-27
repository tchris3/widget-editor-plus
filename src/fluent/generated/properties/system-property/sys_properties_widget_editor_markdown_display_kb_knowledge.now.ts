import { Property } from '@servicenow/sdk/core'

export const markdownDisplayKbKnowledgeProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-kb_knowledge'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.kb_knowledge',
    type: 'string',
    value: `{
    "display_value": "display_number",
    "additional_fields": "short_description"
}`,
    description: 'Display and additional fields for Knowledge articles in Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
