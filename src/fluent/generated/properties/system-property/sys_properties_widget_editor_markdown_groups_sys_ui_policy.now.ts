import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSysUiPolicyProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sys_ui_policy'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sys_ui_policy',
    type: 'string',
    value: `[
    "sys_ui_policy_action",
    "sys_ui_policy_rl_action"
]`,
    description: 'Child tables grouped under sys_ui_policy in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
