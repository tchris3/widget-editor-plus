import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSpContainerProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sp_container'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sp_container',
    type: 'string',
    value: `[
    "sp_row"
]`,
    description: 'Child tables grouped under sp_container in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
