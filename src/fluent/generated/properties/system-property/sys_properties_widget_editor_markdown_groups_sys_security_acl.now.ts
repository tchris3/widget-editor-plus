import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSysSecurityAclProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sys_security_acl'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sys_security_acl',
    type: 'string',
    value: `[
    "sys_security_acl_role"
]`,
    description: 'Child tables grouped under Access Control in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
