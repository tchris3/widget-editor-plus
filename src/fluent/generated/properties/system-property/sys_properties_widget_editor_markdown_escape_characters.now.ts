import { Property } from '@servicenow/sdk/core'

export const markdownEscapeCharactersProperty = Property({
    $id: Now.ID['widget-editor-markdown-escape-characters-property'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_escape_characters',
    type: 'boolean',
    value: 'false',
    description: 'Escape Markdown punctuation, including underscores, with backslashes in Export Markdown+ labels and text. Disabled by default.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
