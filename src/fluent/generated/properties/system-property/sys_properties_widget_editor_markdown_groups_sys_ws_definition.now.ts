import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSysWsDefinitionProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sys_ws_definition'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sys_ws_definition',
    type: 'string',
    value: `[
    "sys_ws_operation"
]`,
    description: 'Child tables grouped under Scripted REST APIs in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
