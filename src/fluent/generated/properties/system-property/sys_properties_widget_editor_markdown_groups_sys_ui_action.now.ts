import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSysUiActionProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sys_ui_action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sys_ui_action',
    type: 'string',
    value: `[
    "sys_ui_action_view",
    "sys_ui_action_role"
]`,
    description: 'Child tables grouped under sys_ui_action in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
