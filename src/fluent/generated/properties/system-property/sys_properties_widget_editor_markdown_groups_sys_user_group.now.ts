import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSysUserGroupProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sys_user_group'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sys_user_group',
    type: 'string',
    value: `[
    "sys_group_has_role"
]`,
    description: 'Child tables grouped under Group in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
