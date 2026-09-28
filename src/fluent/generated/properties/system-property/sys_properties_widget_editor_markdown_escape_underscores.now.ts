import { Property } from '@servicenow/sdk/core'

export const markdownEscapeUnderscoresProperty = Property({
    $id: Now.ID['widget-editor-markdown-escape-underscores-property'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_escape_underscores',
    type: 'boolean',
    value: 'false',
    description: 'Escape underscores with backslashes in Export Markdown+ output.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
