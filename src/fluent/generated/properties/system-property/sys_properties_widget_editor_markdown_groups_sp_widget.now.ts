import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSpWidgetProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sp_widget'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sp_widget',
    type: 'string',
    value: `[
    "sp_ng_template",
    "m2m_sp_ng_pro_sp_widget",
    "m2m_sp_public_widget_allow_table",
    "m2m_sp_widget_dependency"
]`,
    description: 'Child tables grouped under Widget in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
