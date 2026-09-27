import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSysAppApplicationProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sys_app_application'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sys_app_application',
    type: 'string',
    value: `[
    "sys_app_module"
]`,
    description: 'Child tables grouped under Application Menus in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
