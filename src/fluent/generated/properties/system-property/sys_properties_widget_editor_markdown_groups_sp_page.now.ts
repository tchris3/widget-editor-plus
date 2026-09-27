import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSpPageProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sp_page'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sp_page',
    type: 'string',
    value: `[
    "sp_container",
    "sp_metatag",
    "sp_page_title_variable"
]`,
    description: 'Child tables grouped under sp_page in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
