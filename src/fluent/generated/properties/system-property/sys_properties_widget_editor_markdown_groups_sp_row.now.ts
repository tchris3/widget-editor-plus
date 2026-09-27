import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSpRowProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sp_row'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sp_row',
    type: 'string',
    value: `[
    "sp_column"
]`,
    description: 'Child tables grouped under sp_row in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
