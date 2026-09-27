import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSysRestMessageProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sys_rest_message'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sys_rest_message',
    type: 'string',
    value: `[
    "sys_rest_message_fn"
]`,
    description: 'Child tables grouped under REST Messages in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
