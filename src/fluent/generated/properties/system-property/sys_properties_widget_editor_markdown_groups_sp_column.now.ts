import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSpColumnProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sp_column'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sp_column',
    type: 'string',
    value: `[
    "sp_instance"
]`,
    description: 'Child tables grouped under sp_column in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
