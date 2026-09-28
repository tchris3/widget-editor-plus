import { Property } from '@servicenow/sdk/core'

export const markdownMaxListLevelsProperty = Property({
    $id: Now.ID['widget-editor-markdown-max-list-levels-property'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_max_list_levels',
    type: 'integer',
    value: '9',
    description: 'Maximum bullet list levels in Export Markdown+, including the top level. Flatten deeper records at this level and append their bold record type. Use a positive whole number.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
