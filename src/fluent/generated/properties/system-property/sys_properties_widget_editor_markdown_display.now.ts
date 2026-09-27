import { Property } from '@servicenow/sdk/core'

export const updateSetMarkdownDisplayProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-property'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display',
    type: 'string',
    value: `{
    "sys_security_acl": {
        "display_value": "name",
        "additional_fields": "operation"
    }
}`,
    description: 'Display and secondary fields by table for update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
